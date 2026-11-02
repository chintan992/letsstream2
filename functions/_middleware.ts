const LEGACY_HOST = "letsstream2.pages.dev";
const CANONICAL_HOST = "letsstream.chintan992.dev";

interface PagesFunctionContext {
  request: Request;
  next: () => Promise<Response>;
}

export async function onRequest({
  request,
  next,
}: PagesFunctionContext): Promise<Response> {
  const url = new URL(request.url);

  const isLegacyApiPost =
    url.hostname === LEGACY_HOST &&
    request.method === "POST" &&
    url.pathname.startsWith("/api/");
  const isHtmlNavigation = request.headers
    .get("Accept")
    ?.toLowerCase()
    .includes("text/html");

  if (url.hostname === LEGACY_HOST && isHtmlNavigation && !isLegacyApiPost) {
    url.hostname = CANONICAL_HOST;
    return Response.redirect(url, 301);
  }

  return next();
}
