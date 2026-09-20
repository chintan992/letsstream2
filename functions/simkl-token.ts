export interface Env {
  SIMKL_CLIENT_ID: string;
  SIMKL_CLIENT_SECRET: string;
}

const SIMKL_API_URL = "https://api.simkl.com";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Token exchange endpoint
    if (url.pathname === "/api/simkl/token" && request.method === "POST") {
      try {
        const body = await request.json();
        const { code, redirect_uri } = body;

        if (!code || !redirect_uri) {
          return new Response(
            JSON.stringify({ error: "Missing code or redirect_uri" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

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
          }),
        });

        const data = await tokenResponse.json();

        if (!tokenResponse.ok) {
          return new Response(
            JSON.stringify({ error: data.error || "Failed to exchange code for token" }),
            { status: tokenResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Invalid request" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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