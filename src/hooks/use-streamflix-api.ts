import { useState, useEffect, useCallback, useRef } from "react";
import {
  StreamFlixResponse,
  StreamFlixLink,
  LabeledStreamLink,
  Watch32Response,
  Watch32Server,
  Watch32Subtitle,
} from "@/utils/types";

/**
 * Processes raw links from StreamFlix API to add labels that disambiguate
 * duplicate qualities. E.g., two "720p" links become "720p (1)" and "720p (2)".
 */
function labelLinks(links: StreamFlixLink[]): LabeledStreamLink[] {
  // Count occurrences of each quality
  const qualityCounts: Record<string, number> = {};
  for (const link of links) {
    qualityCounts[link.quality] = (qualityCounts[link.quality] || 0) + 1;
  }

  // Track current index for each quality
  const qualityIndex: Record<string, number> = {};

  return links.map(link => {
    const count = qualityCounts[link.quality];
    qualityIndex[link.quality] = (qualityIndex[link.quality] || 0) + 1;
    const idx = qualityIndex[link.quality];

    // If there's only one link with this quality, no suffix needed
    const label = count > 1 ? `${link.quality} (${idx})` : link.quality;

    return { ...link, label };
  });
}

/**
 * Converts Watch32 servers into LabeledStreamLinks.
 * Filters out servers with errors or missing URLs.
 * Includes subtitle data in each link.
 */
function convertWatch32Servers(servers: Watch32Server[]): LabeledStreamLink[] {
  return servers
    .filter(
      (server): server is Watch32Server & { url: string } =>
        !!server.url && !server.error
    )
    .map(server => ({
      url: server.url,
      quality: "Auto",
      tier: server.source || "Watch32",
      label: server.name,
      subtitles: server.subtitles,
    }));
}

/**
 * Type guard to check if the API response is a Watch32 response (has servers array).
 */
function isWatch32Response(data: unknown): data is Watch32Response {
  return (
    typeof data === "object" &&
    data !== null &&
    "servers" in data &&
    Array.isArray((data as Watch32Response).servers)
  );
}

/**
 * Type guard to check if the API response is a StreamFlix response (has links array).
 */
function isStreamFlixResponse(data: unknown): data is StreamFlixResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "links" in data &&
    Array.isArray((data as StreamFlixResponse).links)
  );
}

interface UseStreamFlixApiResult {
  links: LabeledStreamLink[];
  isLoading: boolean;
  error: string | null;
  title: string | null;
  refetch: () => void;
}

export function useStreamFlixApi(
  apiUrl: string | null
): UseStreamFlixApiResult {
  const [links, setLinks] = useState<LabeledStreamLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLinks = useCallback(async (url: string) => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setLinks([]);
    setTitle(null);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server did not return JSON response");
      }

      const data: unknown = await response.json();

      // Auto-detect response format: Watch32 (servers) vs StreamFlix (links)
      if (isWatch32Response(data)) {
        // Watch32 format: servers array with optional subtitles
        const validServers = data.servers.filter(
          (s: Watch32Server) => s.url && !s.error
        );

        if (validServers.length === 0) {
          // Check if all servers had errors
          const errorMessages = data.servers
            .filter((s: Watch32Server) => s.error)
            .map((s: Watch32Server) => `${s.name}: ${s.error}`)
            .join("; ");

          throw new Error(
            errorMessages
              ? `All servers failed: ${errorMessages}`
              : "No working servers found for this content"
          );
        }

        setLinks(convertWatch32Servers(data.servers));
        setTitle(data.title || null);
      } else if (isStreamFlixResponse(data)) {
        // StreamFlix format: links array with quality/tier
        if (
          !data.links ||
          !Array.isArray(data.links) ||
          data.links.length === 0
        ) {
          throw new Error("No streaming links found for this content");
        }

        // Validate that links have URLs
        const validLinks = data.links.filter(
          (l: StreamFlixLink) => l.url && typeof l.url === "string"
        );

        if (validLinks.length === 0) {
          throw new Error("No valid streaming URLs found");
        }

        setLinks(labelLinks(validLinks));
        setTitle(data.title || null);
      } else {
        throw new Error(
          "Unrecognized API response format. Expected 'links' or 'servers' array."
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Request was cancelled, don't update state
      }

      const message =
        err instanceof Error ? err.message : "Failed to fetch streaming links";

      // Provide user-friendly error messages
      if (
        message.includes("Failed to fetch") ||
        message.includes("NetworkError")
      ) {
        setError(
          "Cannot connect to streaming server. Make sure the server is running on port 8787."
        );
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!apiUrl) {
      setLinks([]);
      setError(null);
      setIsLoading(false);
      setTitle(null);
      return;
    }

    fetchLinks(apiUrl);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [apiUrl, fetchLinks]);

  const refetch = useCallback(() => {
    if (apiUrl) {
      fetchLinks(apiUrl);
    }
  }, [apiUrl, fetchLinks]);

  return { links, isLoading, error, title, refetch };
}
