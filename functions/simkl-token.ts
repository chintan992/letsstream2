export interface Env {
  SIMKL_CLIENT_ID: string;
  SIMKL_CLIENT_SECRET: string;
  SIMKL_ALLOWED_ORIGINS?: string;
  SIMKL_ALLOWED_REDIRECT_URIS?: string;
}

const SIMKL_API_URL = "https://api.simkl.com";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const allowedOrigins = new Set(
      (env.SIMKL_ALLOWED_ORIGINS ?? "")
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean)
    );
    const allowedRedirectUris = new Set(
      (env.SIMKL_ALLOWED_REDIRECT_URIS ?? "")
        .split(",")
        .map(uri => uri.trim())
        .filter(Boolean)
    );
    const requestOrigin = request.headers.get("Origin");
    const originAllowed =
      requestOrigin !== null && allowedOrigins.has(requestOrigin);

    // CORS headers
    const corsHeaders = {
      ...(originAllowed
        ? { "Access-Control-Allow-Origin": requestOrigin }
        : {}),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS") {
      if (!originAllowed)
        return new Response(null, { status: 403, headers: corsHeaders });
      return new Response(null, { headers: corsHeaders });
    }

    // Authorization start endpoint
    if (url.pathname === "/api/simkl/authorize" && request.method === "POST") {
      if (!originAllowed) {
        return new Response(JSON.stringify({ error: "Origin not allowed" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { redirect_uri, code_challenge } = (body ?? {}) as {
        redirect_uri?: unknown;
        code_challenge?: unknown;
      };
      if (
        typeof redirect_uri !== "string" ||
        !allowedRedirectUris.has(redirect_uri) ||
        typeof code_challenge !== "string" ||
        !code_challenge
      ) {
        return new Response(JSON.stringify({ error: "Invalid authorization request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = crypto.randomUUID();
      const authorizationUrl = new URL("https://simkl.com/oauth/authorize");
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("client_id", env.SIMKL_CLIENT_ID);
      authorizationUrl.searchParams.set("redirect_uri", redirect_uri);
      authorizationUrl.searchParams.set("state", state);
      authorizationUrl.searchParams.set("code_challenge", code_challenge);
      authorizationUrl.searchParams.set("code_challenge_method", "S256");

      return new Response(JSON.stringify({ authorization_url: authorizationUrl.toString(), state }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": `simkl_oauth_state=${state}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=600`,
        },
      });
    }

    // Token exchange endpoint
    if (url.pathname === "/api/simkl/token" && request.method === "POST") {
      if (!originAllowed) {
        return new Response(JSON.stringify({ error: "Origin not allowed" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { code, redirect_uri, state, code_verifier } = (body ?? {}) as {
        code?: unknown;
        redirect_uri?: unknown;
        state?: unknown;
        code_verifier?: unknown;
      };

      if (
        typeof code !== "string" ||
        !code ||
        typeof redirect_uri !== "string" ||
        !redirect_uri ||
        !allowedRedirectUris.has(redirect_uri)
      ) {
        return new Response(
          JSON.stringify({ error: "Missing code or redirect_uri" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const sessionState = request.headers
        .get("Cookie")
        ?.match(/(?:^|;\s*)simkl_oauth_state=([^;]+)/)?.[1];
      if (
        typeof state !== "string" ||
        !sessionState ||
        state !== sessionState
      ) {
        return new Response(JSON.stringify({ error: "Invalid OAuth state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof code_verifier !== "string" || !code_verifier) {
        return new Response(
          JSON.stringify({ error: "Invalid PKCE verifier" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      try {
        const tokenResponse = await fetch(`${SIMKL_API_URL}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            client_id: env.SIMKL_CLIENT_ID,
            client_secret: env.SIMKL_CLIENT_SECRET,
            redirect_uri,
            grant_type: "authorization_code",
            code_verifier,
          }),
        });

        const data = await tokenResponse.json();

        if (!tokenResponse.ok) {
          return new Response(
            JSON.stringify({
              error: data.error || "Failed to exchange code for token",
            }),
            {
              status: tokenResponse.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(
          JSON.stringify({ error: "Simkl token exchange failed" }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Health check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};
