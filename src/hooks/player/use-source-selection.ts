import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchVideoSources } from "@/utils/video-source-loader";
import { useAuth } from "@/hooks";
import { useUserPreferences } from "@/hooks/user-preferences";
import { useStreamFlixApi } from "@/hooks/use-streamflix-api";

/**
 * Video source selection state:
 * - fetches & filters available sources (auth-gated)
 * - selected source = manual override ?? user preference ?? first available
 * - derives the iframe URL and StreamFlix API links for the current media
 */
export function useSourceSelection(
  id: string | undefined,
  season: string | undefined,
  episode: string | undefined,
  mediaType: "movie" | "tv"
) {
  const { userPreferences } = useUserPreferences();
  const { user } = useAuth();

  const { data: fetchedSources = [], isLoading: isSourcesLoading } = useQuery({
    queryKey: ["videoSources"],
    queryFn: fetchVideoSources,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Filter sources: hide requiresAuth sources from unauthenticated users
  const videoSources = useMemo(() => {
    return fetchedSources.filter(src => {
      if (src.requiresAuth && !user) return false;
      return true;
    });
  }, [fetchedSources, user]);

  // Selected source: manual override wins, otherwise user preference, otherwise
  // the first available source. Derived — no effect needed to keep it in sync.
  const [sourceOverride, setSourceOverride] = useState<string | null>(null);
  const selectedSource =
    sourceOverride ??
    userPreferences?.preferred_source ??
    (videoSources.length > 0 ? videoSources[0].key : "");

  const setSelectedSource = (sourceKey: string) => setSourceOverride(sourceKey);

  // iframe URL derived directly from route params + selected source.
  // Recomputes on source change; VideoPlayer remounts via key={iframeUrl}.
  const iframeUrl = useMemo(() => {
    if (!id) return "";
    const source = videoSources.find(src => src.key === selectedSource);
    if (!source) return "";
    const mediaId = parseInt(id, 10);
    if (mediaType === "movie") {
      return source.getMovieUrl(mediaId);
    }
    if (mediaType === "tv" && season && episode) {
      return source.getTVUrl(mediaId, parseInt(season, 10), parseInt(episode, 10));
    }
    return "";
  }, [id, mediaType, season, episode, selectedSource, videoSources]);

  // Detect if current source is an API source
  const currentSource = useMemo(
    () => videoSources.find(src => src.key === selectedSource),
    [selectedSource, videoSources]
  );
  const isApiSource = currentSource?.isApiSource || false;

  // Compute the API URL for StreamFlix sources
  const apiUrl = useMemo(() => {
    if (!isApiSource || !currentSource || !id) return null;
    const mediaId = parseInt(id, 10);
    if (mediaType === "movie") {
      return currentSource.getMovieUrl(mediaId) as string;
    } else if (mediaType === "tv" && season && episode) {
      return currentSource.getTVUrl(
        mediaId,
        parseInt(season, 10),
        parseInt(episode, 10)
      ) as string;
    }
    return null;
  }, [isApiSource, currentSource, id, mediaType, season, episode]);

  // Fetch streaming links when using an API source
  const {
    links: streamLinks,
    isLoading: apiLoading,
    error: apiError,
  } = useStreamFlixApi(apiUrl);

  return {
    videoSources,
    selectedSource,
    setSelectedSource,
    iframeUrl,
    isApiSource,
    streamLinks,
    apiLoading,
    apiError,
    isSourcesLoading,
  };
}
