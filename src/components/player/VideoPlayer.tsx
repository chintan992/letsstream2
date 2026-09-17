import { m } from "framer-motion";
import { useRef, useMemo, useState } from "react";
import { memo, lazy, Suspense } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [retryNonce, setRetryNonce] = useState(0);
  const [iframeFailed, setIframeFailed] = useState(false);

  // Reset error state when the URL changes (new source / episode)
  const [prevUrl, setPrevUrl] = useState(iframeUrl);
  if (iframeUrl !== prevUrl) {
    setPrevUrl(iframeUrl);
    setIframeFailed(false);
  }

  const iframeElement = useMemo(() => {
    const onIframeError = () => {
      setIframeFailed(true);
      onError("Failed to load iframe content");
    };

    const onIframeLoad = () => {
      if (!iframeUrl) return;
      onLoaded();
    };

    return (
      <iframe
        key={`${iframeUrl}-${retryNonce}`}
        ref={iframeRef}
        src={iframeUrl}
        title={title}
        className="h-full w-full"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={onIframeLoad}
        onError={onIframeError}
      />
    );
  }, [iframeUrl, onError, onLoaded, title, retryNonce]);

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

  // Default: render iframe player (existing behavior + error recovery overlay)
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg shadow-2xl">
      {isLoading && !iframeFailed ? (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60"
        >
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </m.div>
      ) : null}
      {iframeFailed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <div>
            <p className="font-medium text-white">Playback failed to load</p>
            <p className="mt-1 text-sm text-white/60">
              The video source could not be reached.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => {
                setIframeFailed(false);
                setRetryNonce(n => n + 1);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() =>
                document
                  .getElementById("video-sources")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              Try another source
            </Button>
          </div>
        </div>
      )}
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
