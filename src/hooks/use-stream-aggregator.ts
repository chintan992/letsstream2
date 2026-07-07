import { useState, useEffect, useCallback, useRef } from "react";
import { AggregatedStream, PluginDocument } from "@/utils/types/plugin";
import {
  getMovieStreams,
  getSeriesStreams,
} from "@/utils/services/streaming-plugin-api";
import { trackEvent } from "@/lib/analytics";

interface UseStreamAggregatorResult {
  streams: AggregatedStream[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to aggregate streams from multiple plugins
 * Fetches streams from all active plugins in parallel and combines results
 */
export function useStreamAggregator(
  plugins: PluginDocument[],
  mediaType: "movie" | "tv",
  tmdbId: number,
  season?: number,
  episode?: number
): UseStreamAggregatorResult {
  const [streams, setStreams] = useState<AggregatedStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStreams = useCallback(async () => {
    if (plugins.length === 0) {
      setStreams([]);
      setError("No active plugins. Please add a streaming plugin.");
      return;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setStreams([]);

    // Initialize streams array with loading state for each plugin
    const initialStreams: AggregatedStream[] = plugins.map(plugin => ({
      url: "",
      name: "",
      quality: "Loading...",
      pluginName: plugin.name,
      pluginId: plugin.plugin_id,
      label: `${plugin.name} - Loading...`,
      isLoading: true,
      hasError: false,
    }));
    setStreams(initialStreams);

    try {
      // Fetch streams from all plugins in parallel
      const promises = plugins.map(async (plugin, index) => {
        try {
          let result;

          if (mediaType === "movie") {
            result = await getMovieStreams(plugin.manifest_url, tmdbId);
          } else {
            if (season === undefined || episode === undefined) {
              throw new Error("Season and episode are required for TV shows");
            }
            result = await getSeriesStreams(
              plugin.manifest_url,
              tmdbId,
              season,
              episode
            );
          }

          // Track success
          await trackEvent({
            name: "stream_loaded",
            params: {
              plugin_id: plugin.plugin_id,
              plugin_name: plugin.name,
              media_type: mediaType,
              media_id: tmdbId.toString(),
              stream_count: result.length,
            },
          });

          // Map results to aggregated streams
          return result.map((stream, streamIndex) => {
            // Extract quality from stream name (e.g., "Premium - 720p" -> "720p")
            const qualityMatch = stream.name.match(/(\d+p|\d+K)/i);
            const quality = qualityMatch ? qualityMatch[1] : "Unknown";

            return {
              url: stream.url,
              name: stream.name,
              quality,
              pluginName: plugin.name,
              pluginId: plugin.plugin_id,
              label: `${plugin.name} - ${stream.name}`,
              isLoading: false,
              hasError: false,
            };
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";

          // Track error
          await trackEvent({
            name: "stream_error",
            params: {
              plugin_id: plugin.plugin_id,
              plugin_name: plugin.name,
              media_type: mediaType,
              media_id: tmdbId.toString(),
              error_message: errorMessage,
              success: false,
            },
          });

          return [
            {
              url: "",
              name: "",
              quality: "Error",
              pluginName: plugin.name,
              pluginId: plugin.plugin_id,
              label: `${plugin.name} - ${errorMessage}`,
              isLoading: false,
              hasError: true,
              errorMessage,
            },
          ];
        }
      });

      const results = await Promise.all(promises);

      // Flatten and deduplicate streams by URL
      const allStreams = results.flat();
      const uniqueUrls = new Set<string>();
      const uniqueStreams: AggregatedStream[] = [];

      for (const stream of allStreams) {
        if (stream.url && !uniqueUrls.has(stream.url)) {
          uniqueUrls.add(stream.url);
          uniqueStreams.push(stream);
        }
      }

      setStreams(uniqueStreams);

      // Track overall success
      const successCount = uniqueStreams.filter(s => !s.hasError).length;
      await trackEvent({
        name: "stream_request_completed",
        params: {
          media_type: mediaType,
          media_id: tmdbId.toString(),
          plugin_count: plugins.length,
          total_streams: uniqueStreams.length,
          success_count: successCount,
          error_count: uniqueStreams.length - successCount,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Request was cancelled
      }

      const message =
        err instanceof Error ? err.message : "Failed to fetch streaming links";
      setError(message);

      await trackEvent({
        name: "stream_request_failed",
        params: {
          media_type: mediaType,
          media_id: tmdbId.toString(),
          error_message: message,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [plugins, mediaType, tmdbId, season, episode]);

  useEffect(() => {
    fetchStreams();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStreams]);

  const refetch = useCallback(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { streams, isLoading, error, refetch };
}
