import type { IncomingMessage } from "node:http";
import type { Plugin } from "vite";
import simklWorker, { type Env as SimklEnv } from "../functions/simkl-token";

async function readBody(request: IncomingMessage): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return new Uint8Array(Buffer.concat(chunks));
}

export function simklApiPlugin(values: Record<string, string>): Plugin {
  const env: SimklEnv = {
    SIMKL_CLIENT_ID: values.SIMKL_CLIENT_ID || values.VITE_SIMKL_CLIENT_ID,
    SIMKL_CLIENT_SECRET: values.SIMKL_CLIENT_SECRET,
    SIMKL_ALLOWED_ORIGINS:
      values.SIMKL_ALLOWED_ORIGINS ||
      "http://localhost:8080,http://127.0.0.1:8080",
    SIMKL_ALLOWED_REDIRECT_URIS:
      values.SIMKL_ALLOWED_REDIRECT_URIS ||
      "http://localhost:8080/simkl-callback,http://127.0.0.1:8080/simkl-callback",
  };

  return {
    name: "simkl-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/simkl/")) {
          next();
          return;
        }

        if (!env.SIMKL_CLIENT_ID || !env.SIMKL_CLIENT_SECRET) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error:
                "Simkl server credentials are missing. Set VITE_SIMKL_CLIENT_ID and SIMKL_CLIENT_SECRET in .env.",
            })
          );
          return;
        }

        try {
          const headers = new Headers();
          for (const [name, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
              value.forEach(headerValue => headers.append(name, headerValue));
            } else if (value !== undefined) {
              headers.set(name, value);
            }
          }

          const method = req.method ?? "GET";
          const request = new Request(
            new URL(req.url, `http://${req.headers.host ?? "localhost"}`),
            {
              method,
              headers,
              ...(method === "GET" || method === "HEAD"
                ? {}
                : { body: await readBody(req) }),
            }
          );
          const response = await simklWorker.fetch(request, env);
          const responseBody = new Uint8Array(await response.arrayBuffer());

          res.statusCode = response.status;
          response.headers.forEach((value, name) => res.setHeader(name, value));
          res.end(responseBody);
        } catch (error) {
          console.error("Local Simkl API request failed:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Local Simkl API request failed" }));
        }
      });
    },
  };
}
