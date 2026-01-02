// src/lib/github.ts
type GHMember = {
  login: string;
  name?: string | null;
  avatarUrl?: string | null;
  url?: string | null;
  role?: string;
};

type GHRepo = {
  name: string;
  description?: string | null;
  url: string;
  stargazerCount: number;
  primaryLanguage?: {
    name: string;
  } | null;
  languages?: {
    nodes: Array<{ name: string }>;
  };
  commitCount?: number;
  owner: string;
};

const CACHE = new Map<string, { expires: number; data: any }>();
const TTL = 1000 * 60 * 60; // 1 hour

function getToken(): string | undefined {
  return import.meta.env.GITHUB_TOKEN;
}

export async function fetchMembers(usernames: string[], roleMap: Record<string, string> = {}) {
  if (!Array.isArray(usernames) || usernames.length === 0) return [];

  const token = getToken();
  if (!token) {
    // fallback minimal data if token not provided
    return usernames.map((u) => ({
      login: u,
      name: u,
      avatarUrl: undefined,
      url: `https://github.com/${u}`,
      role: roleMap[u] ?? "",
    }));
  }

  // Build GraphQL query with aliases (single request) - no bio needed
  const parts = usernames.map((u, i) => `u${i}: user(login: "${u}") { login name avatarUrl url }`);
  const query = `query { ${parts.join("\n")} }`;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "astro-site",
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    // on error, fallback to minimal info
    return usernames.map((u) => ({
      login: u,
      name: u,
      avatarUrl: undefined,
      url: `https://github.com/${u}`,
      role: roleMap[u] ?? "",
    }));
  }

  const json = await res.json();
  
  if (json.errors) {
    console.error("GraphQL errors in fetchMembers:", json.errors);
    // fallback to minimal info on GraphQL errors
    return usernames.map((u) => ({
      login: u,
      name: u,
      avatarUrl: undefined,
      url: `https://github.com/${u}`,
      role: roleMap[u] ?? "",
    }));
  }
  
  const data = json.data ?? {};

  const members = usernames.map((u, i) => {
    const alias = `u${i}`;
    const node = data[alias] ?? null;
    const member = node
      ? {
          login: node.login,
          name: node.name ?? node.login,
          avatarUrl: node.avatarUrl ?? undefined,
          url: node.url ?? `https://github.com/${u}`,
        }
      : {
          login: u,
          name: u,
          avatarUrl: undefined,
          url: `https://github.com/${u}`,
        };

    // simple per-item cache entry
    CACHE.set(member.login, { expires: Date.now() + TTL, data: member });
    return {
      ...member,
      role: roleMap[member.login] ?? roleMap[u] ?? "",
    };
  });

  return members;
}

// Fetch repos for a user and get commit count
async function fetchReposWithCommits(username: string): Promise<GHRepo[]> {
  const token = getToken();
  if (!token) return [];

  const query = `
    query {
      user(login: "${username}") {
        repositories(
          ownerAffiliations: OWNER
          first: 100
          orderBy: { field: UPDATED_AT, direction: DESC }
        ) {
          nodes {
            name
            description
            url
            stargazerCount
            primaryLanguage {
              name
            }
            languages(first: 5) {
              nodes {
                name
              }
            }
            defaultBranchRef {
              target {
                ... on Commit {
                  history {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "astro-site",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      console.error(`GitHub API error for ${username}:`, res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    
    if (json.errors) {
      console.error(`GraphQL errors for ${username}:`, json.errors);
      return [];
    }
    
    const repos = json.data?.user?.repositories?.nodes ?? [];

    return repos.map((repo: any) => ({
      name: repo.name,
      description: repo.description,
      url: repo.url,
      stargazerCount: repo.stargazerCount,
      primaryLanguage: repo.primaryLanguage,
      languages: repo.languages,
      commitCount: repo.defaultBranchRef?.target?.history?.totalCount ?? 0,
      owner: username,
    }));
  } catch (error) {
    console.error(`Error fetching repos for ${username}:`, error);
    return [];
  }
}

// Get top repo (most commits) for a user
export async function getTopRepoForMember(username: string): Promise<GHRepo | null> {
  const cacheKey = `toprepo:${username}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const repos = await fetchReposWithCommits(username);
  if (repos.length === 0) return null;

  // Sort by commit count (descending) and get the first one
  const topRepo = repos
    .filter((r) => r.commitCount && r.commitCount > 0)
    .sort((a, b) => (b.commitCount ?? 0) - (a.commitCount ?? 0))[0];

  if (topRepo) {
    CACHE.set(cacheKey, { expires: Date.now() + TTL, data: topRepo });
  }

  return topRepo ?? null;
}

// Get top projects from multiple members
export async function fetchTopProjects(usernames: string[]): Promise<GHRepo[]> {
  const projects: GHRepo[] = [];

  // Fetch top repo for each member
  for (const username of usernames) {
    const repo = await getTopRepoForMember(username);
    if (repo) {
      projects.push(repo);
    }
  }

  // Sort by commit count (descending) and return top 6
  return projects
    .sort((a, b) => (b.commitCount ?? 0) - (a.commitCount ?? 0))
    .slice(0, 6);
}

// optional: helper to get single user from cache or refetch
export async function fetchMember(username: string, role = "") {
  const cached = CACHE.get(username);
  if (cached && cached.expires > Date.now()) return { ...cached.data, role };
  const [m] = await fetchMembers([username], { [username]: role });
  return m;
}