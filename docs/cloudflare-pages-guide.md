# Cloudflare Pages Deployment Guide

This document provides instructions for deploying your Vite React application with Cloudflare Pages functions.

## Prerequisites

- A Cloudflare account
- Wrangler CLI installed (optional but recommended for local development):
  ```bash
  npm install -g wrangler
  ```

## Project Structure

Your project has been set up with the following Cloudflare-specific files:

- `functions/` - Contains server-side functions
- `_routes.json` - Defines which routes are handled by functions
- `wrangler.toml` - Cloudflare project configuration

The `functions/_middleware.ts` file redirects the legacy
`letsstream2.pages.dev` hostname to `letsstream.chintan992.dev` with a
permanent redirect. The redirect preserves the requested path and query
string, and only applies to the legacy hostname so the custom domain does not
redirect to itself.

## Setting up Functions

### 1. Creating Functions

Functions are stored in the `functions/` directory. Each file becomes an API endpoint based on its file path:

```
functions/
├── api/
│   └── users.ts      # Serves at /api/users/*
```

### 2. Function Structure

A basic function follows this pattern:

```typescript
export interface Env {
  // Environment bindings
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: any;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: any;
}) {
  // Handle the request
  return new Response("Hello, World!");
}
```

## Deployment Steps

### 1. Create a New Project on Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Pages
3. Click "Create a project"
4. Connect to your Git provider (GitHub, GitLab, or Bitbucket)
5. Select your repository

### 2. Configure Build Settings

Use these build settings:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (root of repository)

### 3. Environment Variables

Add your environment variables in the Cloudflare Pages dashboard under:

`Settings` > `Environment Variables`

Add all the variables you normally put in `.env` file, such as:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- etc.

For Simkl OAuth, configure `SIMKL_CLIENT_ID`, `SIMKL_CLIENT_SECRET`,
`SIMKL_ALLOWED_ORIGINS`, and `SIMKL_ALLOWED_REDIRECT_URIS` as server-side
function variables. The client secret must not use the `VITE_` prefix because
Vite exposes prefixed variables to browser code. The API routes are
`/api/simkl/authorize` and `/api/simkl/token`.

### 4. Custom Routes

The `_routes.json` file specifies which routes should be handled by functions:

```json
{
  "version": 1,
  "include": ["/*"]
}
```

This allows the hostname redirect middleware to run for every request while
`context.next()` continues to serve the normal static site and API functions.

## Local Development

### Using Wrangler (Optional)

To test functions locally:

```bash
# Install Wrangler globally
npm install -g wrangler

# Run your project with Wrangler
wrangler pages dev
```

Note: This is for testing functions locally. The main application can still be developed using:

```bash
npm run dev
```

Vite also serves the Simkl API locally. Add `VITE_SIMKL_CLIENT_ID` and
`SIMKL_CLIENT_SECRET` to `.env` before connecting.

## Example Function

The generated `functions/api/users.ts` demonstrates:

- Handling different HTTP methods (GET, POST, PUT, DELETE)
- Reading request parameters and body
- Returning JSON responses
- Basic CRUD operations

## API Routes

You can create additional API routes by adding files to the `functions/api/` directory:

- `functions/api/products.ts` → `/api/products/*`
- `functions/api/auth.ts` → `/api/auth/*`

## Production Considerations

1. **Databases**: Replace in-memory storage in the example with a proper database (D1, KV, or external)
2. **Authentication**: Implement secure authentication using Cloudflare's features
3. **Caching**: Use Cloudflare's global CDN for optimal performance
4. **Environment Variables**: Never commit sensitive data to the repository

## Troubleshooting

### Common Issues:

1. **Functions not triggering**: Check your `_routes.json` configuration
2. **Build failures**: Ensure your `vite.config.ts` is properly configured with `outDir: "dist"`
3. **Environment variables not available**: Make sure to add them in the Cloudflare Pages dashboard

### Testing Functions Locally:

```bash
wrangler pages dev --local
```

## Further Reading

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Functions Guide](https://developers.cloudflare.com/pages/functions/)
- [Vite with Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-vite-application/)