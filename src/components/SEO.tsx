import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  imageWidth?: string;
  imageHeight?: string;
  url?: string;
  type?: string;
  keywords?: string;
  schema?: object;
  themeColor?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description = "Stream movies, TV shows, and live sports on Let's Stream. Personalized recommendations and high-quality streaming.",
  image = "/icons/icon-512x512.png",
  imageWidth = "512",
  imageHeight = "512",
  url = window.location.href,
  type = "website",
  keywords = "streaming, movies, tv shows, sports, live sports, cinema, entertainment",
  schema,
  themeColor = "#000000",
}) => {
  const siteTitle = title
    ? `${title} | Let's Stream`
    : "Let's Stream | Watch Movies & TV Shows";

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="theme-color" content={themeColor} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Let's Stream" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={imageWidth} />
      <meta property="og:image:height" content={imageHeight} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Canonical Link */}
      <link rel="canonical" href={url} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
