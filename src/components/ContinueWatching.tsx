import { useState, useEffect, useRef } from "react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks";
import { useWatchHistory } from "@/hooks/watch-history";
import { WatchHistoryItem } from "@/contexts/types/watch-history";
import { Clock } from "lucide-react";
import ContinueWatchingCard from "./ContinueWatchingCard";
import ScrollArrow from "./ScrollArrow";
import { useContinueWatching } from "@/hooks/useContinueWatching";

interface ContinueWatchingProps {
  maxItems?: number;
}

const ContinueWatching = ({ maxItems = 20 }: ContinueWatchingProps) => {
  const { user } = useAuth();
  const { watchHistory } = useWatchHistory();
  const [continuableItems, setContinuableItems] = useState<WatchHistoryItem[]>(
    []
  );
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter and deduplicate watch history using custom hook
  const processedHistory = useContinueWatching(watchHistory);

  useEffect(() => {
    setContinuableItems(processedHistory.slice(0, maxItems));
  }, [processedHistory, maxItems]);

  // Handle scroll position to show/hide arrows
  const handleScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
  };

  const scrollLeft = () => {
    if (!rowRef.current) return;
    triggerHapticFeedback(15);
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!rowRef.current) return;
    triggerHapticFeedback(15);
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!user || continuableItems.length === 0) {
    return null;
  }

  const handleContinueWatching = (item: WatchHistoryItem) => {
    // Haptic feedback for continue watching is handled in the ContinueWatchingCard component
    if (item.media_type === "movie") {
      navigate(`/watch/${item.media_type}/${item.media_id}`);
    } else if (item.media_type === "tv") {
      navigate(
        `/watch/${item.media_type}/${item.media_id}/${item.season}/${item.episode}`
      );
    }
  };

  const handleNavigateToDetails = (
    event: React.MouseEvent,
    item: WatchHistoryItem
  ) => {
    event.stopPropagation();
    navigate(
      `/${item.media_type === "movie" ? "movie" : "tv"}/${item.media_id}`
    );
  };

  return (
    <div className="mb-6 mt-8 px-4 md:px-8">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-white drop-shadow md:text-3xl">
        <Clock className="h-6 w-6 text-accent" />
        Continue Watching
      </h2>

      <div
        className="group relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Left scroll button */}
        {showLeftArrow && (
          <ScrollArrow
            direction="left"
            onClick={scrollLeft}
            isVisible={isHovering}
          />
        )}

        <motion.div
          ref={rowRef}
          className="hide-scrollbar flex gap-6 overflow-x-auto pb-4"
          onScroll={handleScroll}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {continuableItems.map(item => (
            <ContinueWatchingCard
              key={`${item.id}-${item.media_id}-${item.season || 0}-${item.episode || 0}`}
              item={item}
              onContinueWatching={handleContinueWatching}
              onNavigateToDetails={handleNavigateToDetails}
            />
          ))}
        </motion.div>

        {/* Right scroll button */}
        {showRightArrow && (
          <ScrollArrow
            direction="right"
            onClick={scrollRight}
            isVisible={isHovering}
          />
        )}
      </div>
    </div>
  );
};

export default ContinueWatching;
