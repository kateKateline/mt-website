import type { APIRoute } from "astro";
import { fetchTopProjects } from "@/lib/github";
import { MEMBER_USERNAMES } from "@/lib/members";

export const GET: APIRoute = async () => {
  try {
    const repos = await fetchTopProjects(MEMBER_USERNAMES);
    return new Response(JSON.stringify(repos), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch repos" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

