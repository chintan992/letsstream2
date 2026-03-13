const fs = require("fs");
const path = require("path");

const DIST_DIR = path.resolve(__dirname, "../dist");
const SEO_CONFIG = {
  "/": {
    title: "Home | Let's Stream",
    description:
      "Stream your favorite movies, TV shows, and live sports on Let's Stream. Enjoy personalized recommendations and a high-quality viewing experience.",
    keywords:
      "streaming, movies, tv shows, sports, live sports, cinema, entertainment",
  },
  "/movie": {
    title: "Movies | Let's Stream",
    description:
      "Browse and stream the latest popular and top-rated movies. Filter by genre and find your next favorite film.",
    keywords:
      "movies, stream movies, popular movies, top rated movies, cinema, watch online",
  },
  "/tv": {
    title: "TV Shows | Let's Stream",
    description:
      "Discover and stream popular TV series, top-rated shows, and trending television content. Stay updated with your favorite series.",
    keywords:
      "tv shows, stream tv series, popular tv shows, top rated tv series, watch episodes online",
  },
  "/sports": {
    title: "Live Sports | Let's Stream",
    description:
      "Watch live sports streams, including football, basketball, tennis, and more. Stay updated with real-time match data.",
    keywords:
      "live sports, football stream, basketball live, sports streaming, match highlights",
  },
  "/trending": {
    title: "Trending | Let's Stream",
    description:
      "See what's trending now on Let's Stream. Discover the most popular movies and TV shows being watched this week.",
    keywords:
      "trending movies, popular tv shows, what to watch, trending content, viral movies",
  },
  "/search": {
    title: "Search | Let's Stream",
    description:
      "Search for your favorite movies, TV shows, and sports on Let's Stream.",
    keywords: "search movies, find tv shows, sports search",
  },
};

function injectSEO() {
  const indexPath = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error("Error: dist/index.html not found. Run npm run build first.");
    return;
  }

  const indexHtml = fs.readFileSync(indexPath, "utf-8");

  Object.entries(SEO_CONFIG).forEach(([route, config]) => {
    let html = indexHtml;

    // Replace title
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${config.title}</title>`
    );

    // Replace/Inject meta tags
    const metaTags = `
    <meta name="description" content="${config.description}" />
    <meta name="keywords" content="${config.keywords}" />
    <meta property="og:title" content="${config.title}" />
    <meta property="og:description" content="${config.description}" />
    <meta property="og:url" content="https://letsstream2.pages.dev${route}" />
    <meta property="twitter:title" content="${config.title}" />
    <meta property="twitter:description" content="${config.description}" />
    `;

    html = html.replace("</head>", `${metaTags}\n  </head>`);

    // Define output path
    const routeDir = path.join(DIST_DIR, route === "/" ? "" : route);
    if (route !== "/") {
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      fs.writeFileSync(path.join(routeDir, "index.html"), html);
    } else {
      // For root, we overwrite index.html
      fs.writeFileSync(indexPath, html);
    }

    console.log(`Injected SEO for ${route}`);
  });

  console.log("SEO injection complete.");
}

injectSEO();
