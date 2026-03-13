const fs = require("fs");
const path = require("path");

const BASE_URL = "https://letsstream2.pages.dev";
const PAGES_DIR = path.resolve(__dirname, "../src/pages");
const PUBLIC_DIR = path.resolve(__dirname, "../public");

// Static routes from src/routes.tsx analysis
const staticRoutes = [
  "/",
  "/movie",
  "/tv",
  "/sports",
  "/trending",
  "/search",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
];

function generateSitemap() {
  const lastmod = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map(
    route => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route === "/" ? "daily" : "weekly"}</changefreq>
    <priority>${route === "/" ? "1.0" : route.includes("movie") || route.includes("tv") ? "0.8" : "0.5"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), xml);
  console.log("Sitemap generated successfully in public/sitemap.xml");
}

generateSitemap();
