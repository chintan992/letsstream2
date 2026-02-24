import { m } from "framer-motion";
import { useEffect, useRef, useMemo } from "react";
import { memo, lazy, Suspense } from "react";
import { LabeledStreamLink } from "@/utils/types";

const EMPTY_STREAM_LINKS: LabeledStreamLink[] = [];

const VideoJsPlayer = lazy(() => import("./VideoJsPlayer"));

/**
 * Z-INDEX STRATEGY:
 * - No explicit z-index - relies on natural document flow
 * - Parent container controls positioning within flex layout
 * - Loading overlay uses natural stacking within component
 */

interface VideoPlayerProps {
  isLoading: boolean;
  iframeUrl: string;
  title: string;
  poster?: string;
  onLoaded: () => void;
  onError: (error: string) => void;
  // API source props (for Video.js player)
  isApiSource?: boolean;
  streamLinks?: LabeledStreamLink[];
  apiLoading?: boolean;
  apiError?: string | null;
}

const VideoPlayerComponent = ({
  isLoading,
  iframeUrl,
  title,
  poster,
  onLoaded,
  onError,
  isApiSource = false,
  streamLinks = EMPTY_STREAM_LINKS,
  apiLoading = false,
  apiError = null,
}: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeError = () => {
    onError("Failed to load iframe content");
  };

  const handleIframeLoad = () => {
    if (!iframeUrl) return;
    onLoaded();
  };

  // Memoize the iframe element to prevent re-renders on orientation changes
  const iframeElement = useMemo(
    () => (
      <iframe
        key={iframeUrl}
        ref={iframeRef}
        src={iframeUrl}
        title={title}
        className="h-full w-full"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    ),
    [iframeUrl, handleIframeError, handleIframeLoad, title]
  ); // Re-create iframe when iframeUrl, title, handleIframeError, or handleIframeLoad change

  // Render Video.js player for API sources
  if (isApiSource) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg shadow-2xl">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-black/60">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            </div>
          }
        >
          <VideoJsPlayer
            links={streamLinks}
            title={title}
            poster={poster}
            onLoaded={onLoaded}
            onError={onError}
            isLoading={apiLoading}
            apiError={apiError}
          />
        </Suspense>
      </div>
    );
  }

  // Default: render iframe player (existing behavior, unchanged)
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg shadow-2xl">
      {isLoading ? (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60"
        >
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </m.div>
      ) : null}
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full"
      >
        {iframeElement}
      </m.div>
    </div>
  );
};

const VideoPlayer = memo(VideoPlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.iframeUrl === nextProps.iframeUrl &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.title === nextProps.title &&
    prevProps.poster === nextProps.poster &&
    prevProps.isApiSource === nextProps.isApiSource &&
    prevProps.streamLinks === nextProps.streamLinks &&
    prevProps.apiLoading === nextProps.apiLoading &&
    prevProps.apiError === nextProps.apiError
  );
});

export { VideoPlayer };
