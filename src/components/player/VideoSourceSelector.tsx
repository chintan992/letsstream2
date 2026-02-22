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
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory"
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
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
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

  // Desktop: Grid layout
  return (
    <m.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {videoSources.map((source, index) => (
        <m.button
          key={source.key}
          onClick={() => handleSourceChange(source.key)}
          className={cn(
            "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
            "transform bg-gradient-to-br shadow-sm backdrop-blur-sm hover:-translate-y-0.5",
            "hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            selectedSource === source.key
              ? "border-white/50 from-white/20 to-white/10 shadow-white/10"
              : "border-white/10 from-white/5 to-transparent hover:border-white/30",
            isChanging && selectedSource === source.key && "animate-pulse"
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          aria-label={`Select ${source.name} video source`}
          aria-pressed={selectedSource === source.key}
        >
          {/* Pulsing border for active state */}
          {selectedSource === source.key && (
            <m.div
              className="absolute inset-0 rounded-xl border border-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2,
              }}
            />
          )}

          <div className="relative z-10 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-sm font-semibold transition-colors",
                  selectedSource === source.key
                    ? "text-white"
                    : "text-white/90 group-hover:text-white"
                )}
              >
                {source.name}
              </span>
              {selectedSource === source.key && (
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white"
                >
                  <Check className="h-2.5 w-2.5 text-black" />
                </m.div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {selectedSource === source.key ? (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-xs font-medium text-white/90"
                >
                  <Check className="h-3 w-3" />
                  Currently active
                </m.div>
              ) : (
                <span className="text-xs text-white/50 group-hover:text-white/70">
                  Click to select
                </span>
              )}
            </div>
          </div>

          {/* Hover overlay */}
          <div
            className={cn(
              "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
              "bg-gradient-to-br from-white/10 via-transparent to-transparent",
              "group-hover:opacity-100",
              selectedSource === source.key && "opacity-30"
            )}
          />
        </m.button>
      ))}
    </m.div>
  );
};

export default VideoSourceSelector;
