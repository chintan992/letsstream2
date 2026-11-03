const fs = require("fs");
const path = require("path");

const DIST_DIR = path.resolve(__dirname, "../dist");
const BASE_ORIGIN = "https://letsstream.chintan992.dev";

const SEO_CONFIG = {
  "/": {
    title: "Let's Stream - Watch Movies, TV Shows & Live Sports Online",
    description:
      "Stream your favorite movies, TV shows, and live sports on Let's Stream. Enjoy personalized recommendations and a high-quality viewing experience.",
    keywords:
      "streaming, movies, tv shows, sports, live sports, cinema, entertainment",
  },
  "/movie": {
    title: "Watch Free Movies Online - Popular & Top Rated | Let's Stream",
    description:
      "Browse and stream the latest popular and top-rated movies. Filter by genre and find your next favorite film on Let's Stream.",
    keywords:
      "movies, stream movies, popular movies, top rated movies, cinema, watch online",
  },
  "/tv": {
    title: "Watch TV Shows Online - Popular Series & Episodes | Let's Stream",
    description:
      "Discover and stream popular TV series, top-rated shows, and trending television content. Stay updated with your favorite series on Let's Stream.",
    keywords:
      "tv shows, stream tv series, popular tv shows, top rated tv series, watch episodes online",
  },
  "/sports": {
    title: "Live Sports Streaming - Football, Basketball & More | Let's Stream",
    description:
      "Watch live sports streams, including football, basketball, tennis, and more. Stay updated with real-time match data on Let's Stream.",
    keywords:
      "live sports, football stream, basketball live, sports streaming, match highlights",
  },
  "/trending": {
    title: "Trending Movies & TV Shows This Week | Let's Stream",
    description:
      "See what's trending now on Let's Stream. Discover the most popular movies and TV shows being watched this week.",
    keywords:
      "trending movies, popular tv shows, what to watch, trending content, viral movies",
  },
  "/live": {
    title: "Live Event Streams - Free Online Broadcasts | Let's Stream",
    description:
      "Watch live sports and event streams on Let's Stream. Real-time updates and high-quality streaming.",
    keywords: "live streams, sports streams, live sports, online streaming",
  },
  "/simkl": {
    title: "Discover Anime & Trending Media (Simkl Hub) | Let's Stream",
    description:
      "Discover trending movies, TV shows, and personalized anime recommendations from Simkl on Let's Stream.",
    keywords:
      "simkl discover, trending movies, anime recommendations, tv shows",
  },
  "/simkl/trending-movies": {
    title: "Trending Movies Catalog - Simkl Recommendations | Let's Stream",
    description:
      "Browse the most popular and trending movies on Let's Stream, powered by Simkl tracking and community ratings.",
    keywords:
      "simkl trending movies, popular movies, watch movies online, movie recommendations",
  },
  "/simkl/trending-tv": {
    title: "Trending TV Series - Simkl Recommendations | Let's Stream",
    description:
      "Discover the top trending television shows and binge-worthy series on Let's Stream with Simkl tracking.",
    keywords:
      "simkl trending tv, popular tv series, stream tv shows, television tracking",
  },
  "/simkl/trending-anime": {
    title: "Top Trending Anime Series & Movies | Let's Stream",
    description:
      "Stream top-rated and trending anime series and movies on Let's Stream with Simkl community recommendations.",
    keywords:
      "anime streaming, trending anime, watch anime online, simkl anime",
  },
  "/terms": {
    title: "Terms of Service | Let's Stream",
    description: "Terms of service and legal notice for Let's Stream V2.0.",
    keywords: "terms of service, legal, streaming terms",
  },
  "/privacy": {
    title: "Privacy Policy | Let's Stream",
    description:
      "Privacy policy and data handling practices for Let's Stream V2.0.",
    keywords: "privacy policy, data protection, privacy",
  },
  "/dmca": {
    title: "DMCA Notice | Let's Stream",
    description:
      "Digital Millennium Copyright Act (DMCA) policy for Let's Stream V2.0.",
    keywords: "dmca, copyright, content policy",
  },
  "/content-removal": {
    title: "Content Removal | Let's Stream",
    description: "Content removal policy and guidelines for Let's Stream V2.0.",
    keywords: "content removal, copyright request, takedown policy",
  },
};

function injectSEO() {
  const indexPath = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error("Error: dist/index.html not found. Run npm run build first.");
    return;
  }

  const baseHtml = fs.readFileSync(indexPath, "utf-8");

  Object.entries(SEO_CONFIG).forEach(([route, config]) => {
    let html = baseHtml;
    const canonicalUrl = `${BASE_ORIGIN}${route === "/" ? "/" : route}`;
    const defaultImage = `${BASE_ORIGIN}/icons/icon-512x512.png`;

    // Replace title
    html = html.replace(
      /<title>.*?<\/title>/i,
      `<title>${config.title}</title>`
    );

    // Strip any existing description to prevent duplicate description tags in pre-rendered output
    html = html.replace(
      /<meta\s+name="description"\s+content=".*?"\s*\/?>/gi,
      ""
    );

    // Structured meta tags to inject before </head>
    const metaTags = `
    <meta name="description" content="${config.description}" />
    <meta name="keywords" content="${config.keywords}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Let's Stream" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${config.title}" />
    <meta property="og:description" content="${config.description}" />
    <meta property="og:image" content="${defaultImage}" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${config.title}" />
    <meta name="twitter:description" content="${config.description}" />
    <meta name="twitter:image" content="${defaultImage}" />
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
      // For root, overwrite index.html
      fs.writeFileSync(indexPath, html);
    }

    console.log(`Injected SEO for ${route}`);
  });

  console.log("SEO injection complete.");
}

injectSEO();
