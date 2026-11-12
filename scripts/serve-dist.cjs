const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve("dist");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

if (!fs.existsSync(root)) {
  console.error(
    `Build directory not found: ${root}. Run "npm run build" first.`
  );
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function isInsideRoot(filePath) {
  return filePath === root || filePath.startsWith(`${root}${path.sep}`);
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(
    new URL(request.url, `http://${request.headers.host}`).pathname
  );
  let filePath = path.join(root, pathname);

  if (!isInsideRoot(filePath)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // SPA fallback for client-side routes that do not map to a file.
  if (!fs.existsSync(filePath) && !path.extname(pathname)) {
    filePath = path.join(root, "index.html");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const contentType =
      mimeTypes[path.extname(filePath).toLowerCase()] ||
      "application/octet-stream";
    response.writeHead(200, { "content-type": contentType });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}`);
});
