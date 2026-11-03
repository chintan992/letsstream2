const fs = require("fs");
const path = require("path");

const BASE_URL = "https://letsstream.chintan992.dev";
const PAGES_DIR = path.resolve(__dirname, "../src/pages");
const PUBLIC_DIR = path.resolve(__dirname, "../public");

// Static public routes suitable for search engine indexing
const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/movie", priority: "0.8", changefreq: "weekly" },
  { path: "/tv", priority: "0.8", changefreq: "weekly" },
  { path: "/sports", priority: "0.7", changefreq: "weekly" },
  { path: "/live", priority: "0.7", changefreq: "weekly" },
  { path: "/trending", priority: "0.7", changefreq: "weekly" },
  { path: "/simkl", priority: "0.7", changefreq: "weekly" },
  { path: "/simkl/trending-movies", priority: "0.7", changefreq: "daily" },
  { path: "/simkl/trending-tv", priority: "0.7", changefreq: "daily" },
  { path: "/simkl/trending-anime", priority: "0.7", changefreq: "daily" },
  { path: "/privacy", priority: "0.3", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "monthly" },
  { path: "/dmca", priority: "0.3", changefreq: "monthly" },
  { path: "/content-removal", priority: "0.3", changefreq: "monthly" },
];

function generateSitemap() {
  const lastmod = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map(
    route => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), xml);
  console.log("Sitemap generated successfully in public/sitemap.xml");
}

generateSitemap();
