import React from "react";
import { Helmet } from "react-helmet-async";

const CANONICAL_ORIGIN = "https://letsstream.chintan992.dev";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  imageWidth?: string;
  imageHeight?: string;
  url?: string;
  type?: string;
  keywords?: string;
  schema?: object | object[];
  themeColor?: string;
  noIndex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description = "Stream movies, TV shows, and live sports on Let's Stream. Personalized recommendations and high-quality streaming.",
  image = "/icons/icon-512x512.png",
  imageWidth = "512",
  imageHeight = "512",
  url,
  type = "website",
  keywords = "streaming, movies, tv shows, sports, live sports, cinema, entertainment",
  schema,
  themeColor = "#000000",
  noIndex = false,
}) => {
  const siteTitle = !title
    ? "Let's Stream - Watch Movies, TV Shows & Live Sports Online"
    : title.includes("Let's Stream")
      ? title
      : `${title} | Let's Stream`;

  // Clean canonical URL strictly anchored to the authoritative canonical origin
  const canonicalUrl =
    url ||
    (typeof window !== "undefined"
      ? `${CANONICAL_ORIGIN}${window.location.pathname}`
      : CANONICAL_ORIGIN);

  // Fully-qualified absolute URL for social crawlers (Twitter, Open Graph, WhatsApp, Slack)
  const absoluteImage =
    image.startsWith("http://") || image.startsWith("https://")
      ? image
      : `${CANONICAL_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="theme-color" content={themeColor} />

      {/* Robots indexing control */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Let's Stream" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content={imageWidth} />
      <meta property="og:image:height" content={imageHeight} />

      {/* Twitter Standard Name Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Canonical Link */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
