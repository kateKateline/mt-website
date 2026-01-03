# Astro Minimal Starter

A lightweight Astro starter template for building fast, modern web applications.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm

## Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/kateKateline/mt-website
cd mt-website
npm install
```

## Environment Setup

Create a `.env` file in the root directory:

```env
GITHUB_TOKEN=your_github_token_here
```

Replace `your_github_token_here` with your actual GitHub personal access token.

## Development

Start the development server:

```sh
npm run dev
```

The application should be available at `http://localhost:4321`

## Project Structure

```text
/
├── public/         # Static assets
├── src/            # Views
├── .env            # Environment variables
└── package.json    # Project dependencies
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## Building for Production

Generate a production build:

```sh
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

## Documentation

For more information about Astro, visit the [official documentation](https://docs.astro.build).
