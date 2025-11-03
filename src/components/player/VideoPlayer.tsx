import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
// ...existing code...

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

const VideoPlayer = ({ isLoading, iframeUrl, title, poster, onLoaded, onError }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ...existing code...

  // ...existing code...

  const handleIframeError = () => {
    onError('Failed to load iframe content');
  };

  const handleIframeLoad = () => {
    onLoaded();
  };

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 flex items-center justify-center"
        >
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      ) : null}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </motion.div>
    </div>
  );
};

export { VideoPlayer };
