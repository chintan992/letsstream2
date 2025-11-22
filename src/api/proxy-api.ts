/**
 * Proxy API routes for handling streaming content
 * This file defines API routes that can be used with a backend framework
 * to implement proper proxy functionality.
 */

// We're defining this for reference - it would be implemented in a backend framework
// like Express, Next.js API routes, etc.

interface ResponseWriter {
  status: (code: number) => ResponseWriter;
  send: (body: unknown) => ResponseWriter;
  setHeader: (key: string, value: string) => void;
  write: (chunk: unknown) => void;
  end: () => void;
}

/**
 * Handler for proxying requests to external resources
 *
 * Example usage with Express:
 *
 * app.get('/worker-proxy', async (req, res) => {
 *   try {
 *     await proxyHandler(req.query.url, req.query.headers, res);
 *   } catch (error) {
 *     res.status(500).send({ error: error.message });
 *   }
 * });
 */
export async function proxyHandler(
  url: string,
  headersStr: string | undefined,
  responseWriter: ResponseWriter
): Promise<void> {
  if (!url) {
    responseWriter.status(400).send({ error: "URL is required" });
    return;
  }

  let headers: Record<string, string> = {};
  if (headersStr) {
    try {
      headers = JSON.parse(headersStr);
    } catch (e) {
      console.error("Failed to parse headers:", e);
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        ...headers,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Copy response headers
    for (const [key, value] of Object.entries(response.headers)) {
      // Skip headers that might cause issues
      if (
        !["content-encoding", "content-length", "connection"].includes(
          key.toLowerCase()
        )
      ) {
        responseWriter.setHeader(key, value);
      }
    }

    // Add CORS headers
    responseWriter.setHeader("Access-Control-Allow-Origin", "*");
    responseWriter.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    responseWriter.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );

    // Set appropriate status
    responseWriter.status(response.status);

    // Stream the response
    const reader = response.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) {
        responseWriter.end();
        return;
      }
      responseWriter.write(value);
      return pump();
    };

    await pump();
  } catch (error) {
    console.error("Proxy error:", error);
    responseWriter.status(500).send({ error: (error as Error).message });
  }
}

/**
 * Handler for OPTIONS requests (CORS preflight)
 */
export function optionsHandler(responseWriter: ResponseWriter): void {
  responseWriter.setHeader("Access-Control-Allow-Origin", "*");
  responseWriter.setHeader("Access-control-Allow-Methods", "GET, OPTIONS");
  responseWriter.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  responseWriter.status(200).end();
}
