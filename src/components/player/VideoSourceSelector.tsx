import { Check } from 'lucide-react';
import { triggerHapticFeedback, triggerSuccessHaptic } from '@/utils/haptic-feedback';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VideoSource } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/user-preferences';
import { useAuth } from '@/hooks';
import { useState } from 'react';

/**
 * Z-INDEX STRATEGY:
 * - No explicit z-index - relies on natural document flow
 * - Grid layout with natural stacking for hover effects
 * - Absolute positioned elements (check icon) stack within button context
 */

interface VideoSourceSelectorProps {
  videoSources: VideoSource[];
  selectedSource: string;
  onSourceChange: (sourceKey: string) => void;
  // Removed isCustomSource
}

const VideoSourceSelector = ({
  videoSources,
  selectedSource,
  onSourceChange,
  // Removed isCustomSource
}: VideoSourceSelectorProps) => {
  const { toast } = useToast();
  const { updatePreferences } = useUserPreferences();
  const { user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);

  const handleSourceChange = async (sourceKey: string) => {
    // Provide haptic feedback when changing source
    triggerSuccessHaptic();
    
    setIsChanging(true);
    onSourceChange(sourceKey);
    
    if (user) {
      await updatePreferences({
        preferred_source: sourceKey
      });
    }
    
    const sourceName = videoSources.find(s => s.key === sourceKey)?.name || 'new source';
    toast({
      title: "Source Changed",
      description: `Switched to ${sourceName}`,
      duration: 3000,
    });
    setIsChanging(false);
  };

  return (
    <motion.div 
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {videoSources.map((source, index) => (
        <motion.button
          key={source.key}
          onClick={() => handleSourceChange(source.key)}
          className={cn(
            "relative group p-4 rounded-xl border transition-all duration-300 overflow-hidden",
            "bg-gradient-to-br backdrop-blur-sm shadow-sm transform hover:-translate-y-0.5",
            "hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            selectedSource === source.key
              ? "from-white/20 to-white/10 border-white/50 shadow-white/10"
              : "from-white/5 to-transparent border-white/10 hover:border-white/30",
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
            <motion.div
              className="absolute inset-0 rounded-xl border border-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2
              }}
            />
          )}

          <div className="relative z-10 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-sm font-semibold transition-colors",
                selectedSource === source.key
                  ? "text-white"
                  : "text-white/90 group-hover:text-white"
              )}>
                {source.name}
              </span>
              {selectedSource === source.key && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white flex items-center justify-center"
                >
                  <Check className="h-2.5 w-2.5 text-black" />
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {selectedSource === source.key ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-medium text-white/90 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Currently active
                </motion.div>
              ) : (
                <span className="text-xs text-white/50 group-hover:text-white/70">
                  Click to select
                </span>
              )}
            </div>
          </div>
          
          {/* Hover overlay */}
          <div className={cn(
            "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
            "bg-gradient-to-br from-white/10 via-transparent to-transparent",
            "group-hover:opacity-100",
            selectedSource === source.key && "opacity-30"
          )} />
        </motion.button>
      ))}
    </motion.div>
  );
};

export default VideoSourceSelector;