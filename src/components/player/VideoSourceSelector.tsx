import { Check } from "lucide-react";
import {
  triggerHapticFeedback,
  triggerSuccessHaptic,
} from "@/utils/haptic-feedback";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { VideoSource } from "@/utils/types";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/user-preferences";
import { useAuth } from "@/hooks";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Z-INDEX STRATEGY:
 * - No explicit z-index - relies on natural document flow
 * - Grid layout with natural stacking for hover effects
 * - Absolute positioned elements (check icon) stack within button context
 *
 * RESPONSIVE BEHAVIOR:
 * - Mobile: Horizontal scroll with snap, compact cards
 * - Desktop: Grid layout with larger cards
 */

interface VideoSourceSelectorProps {
  videoSources: VideoSource[];
  selectedSource: string;
  onSourceChange: (sourceKey: string) => void;
}

const VideoSourceSelector = ({
  videoSources,
  selectedSource,
  onSourceChange,
}: VideoSourceSelectorProps) => {
  const { toast } = useToast();
  const { updatePreferences } = useUserPreferences();
  const { user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);
  const isMobile = useIsMobile();

  const handleSourceChange = async (sourceKey: string) => {
    // Provide haptic feedback when changing source
    triggerSuccessHaptic();

    setIsChanging(true);
    onSourceChange(sourceKey);

    if (user) {
      await updatePreferences({
        preferred_source: sourceKey,
      });
    }

    const sourceName =
      videoSources.find(s => s.key === sourceKey)?.name || "new source";
    toast({
      title: "Source Changed",
      description: `Switched to ${sourceName}`,
      duration: 3000,
    });
    setIsChanging(false);
  };

  // Mobile: Compact horizontal scroll layout
  if (isMobile) {
    return (
      <m.div
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {videoSources.map((source, index) => (
          <m.button
            key={source.key}
            onClick={() => handleSourceChange(source.key)}
            className={cn(
              "relative flex-shrink-0 snap-start rounded-lg border px-3 py-2 transition-all duration-200",
              "backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
              selectedSource === source.key
                ? "border-white/50 bg-white/20 text-white"
                : "border-white/10 bg-white/5 text-white/70 active:bg-white/15",
              isChanging && selectedSource === source.key && "animate-pulse"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            aria-label={`Select ${source.name} video source`}
            aria-pressed={selectedSource === source.key}
          >
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm font-medium">
                {source.name}
              </span>
              {selectedSource === source.key && (
                <m.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-white"
                >
                  <Check className="h-2.5 w-2.5 text-black" />
                </m.div>
              )}
            </div>
          </m.button>
        ))}
      </m.div>
    );
  }

  // Desktop: Compact wrapped chips
  return (
    <m.div
      className="flex flex-wrap gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {videoSources.map((source, index) => (
        <m.button
          key={source.key}
          onClick={() => handleSourceChange(source.key)}
          className={cn(
            "group relative rounded-lg border px-4 py-2 transition-all duration-300",
            "backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            selectedSource === source.key
              ? "border-white/50 bg-white/20 text-white"
              : "border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white",
            isChanging && selectedSource === source.key && "animate-pulse"
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.04 }}
          aria-label={`Select ${source.name} video source`}
          aria-pressed={selectedSource === source.key}
        >
          <span className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm font-medium">
              {source.name}
            </span>
            {selectedSource === source.key && (
              <m.span
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-white"
              >
                <Check className="h-2.5 w-2.5 text-black" />
              </m.span>
            )}
          </span>
        </m.button>
      ))}
    </m.div>
  );
};

export default VideoSourceSelector;
