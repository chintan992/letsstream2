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

  if (url.hostname === LEGACY_HOST) {
    url.hostname = CANONICAL_HOST;
    return Response.redirect(url, 301);
  }

  return next();
}
