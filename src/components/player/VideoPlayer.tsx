import { motion } from "framer-motion";
import { useEffect, useRef, useMemo } from "react";
import { memo } from "react";

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
}

const VideoPlayerComponent = ({
  isLoading,
  iframeUrl,
  title,
  poster,
  onLoaded,
  onError,
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
        className="h-full w-full"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    ),
    [iframeUrl, handleIframeError, handleIframeLoad]
  ); // Only re-create iframe when iframeUrl changes

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg shadow-2xl">
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60"
        >
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </motion.div>
      ) : null}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full"
      >
        {iframeElement}
      </motion.div>
    </div>
  );
};

const VideoPlayer = memo(VideoPlayerComponent, (prevProps, nextProps) => {
  // Only re-render if iframeUrl changes, not on other prop changes like orientation
  return (
    prevProps.iframeUrl === nextProps.iframeUrl &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.title === nextProps.title &&
    prevProps.poster === nextProps.poster
  );
});

export { VideoPlayer };
