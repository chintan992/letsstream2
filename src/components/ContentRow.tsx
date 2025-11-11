import { useState, useRef, useEffect } from "react";
import { Media } from "@/utils/types";
import MediaCard from "./MediaCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ContentRow.module.css";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";

interface ContentRowProps {
  title: string;
  media: Media[];
  featured?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
}

const ContentRow = ({
  title,
  media,
  featured = false,
  onLoadMore,
  isLoadingMore,
  loadMoreRef,
}: ContentRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Previous scroll position to detect direction and boundaries
  const lastScrollPosition = useRef(0);
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasScrolledRecently = useRef(false);

  // Handle scroll position to show/hide arrows
  const handleScroll = () => {
    if (!rowRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    const wasAtLeft = lastScrollPosition.current === 0;
    const wasAtRight =
      lastScrollPosition.current >= scrollWidth - clientWidth - 1;

    // Check if we're at edges
    const isAtLeft = scrollLeft === 0;
    const isAtRight = scrollLeft >= scrollWidth - clientWidth - 1;

    // Detect edge arrivals for haptic feedback
    if (!wasAtLeft && isAtLeft && !hasScrolledRecently.current) {
      // We just reached the left edge
      triggerHapticFeedback(15);
      hasScrolledRecently.current = true;
      setTimeout(() => {
        hasScrolledRecently.current = false;
      }, 500);
    } else if (!wasAtRight && isAtRight && !hasScrolledRecently.current) {
      // We just reached the right edge
      triggerHapticFeedback(15);
      hasScrolledRecently.current = true;
      setTimeout(() => {
        hasScrolledRecently.current = false;
      }, 500);
    }

    // Update last position
    lastScrollPosition.current = scrollLeft;

    // Handle scroll end detection
    if (scrollEndTimeout.current) {
      clearTimeout(scrollEndTimeout.current);
    }

    scrollEndTimeout.current = setTimeout(() => {
      // We can add additional haptic feedback for scroll stop if needed
    }, 150);

    // Update arrow visibility
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
  };

  // Scroll functions
  const scrollLeft = () => {
    if (!rowRef.current) return;
    triggerHapticFeedback(10); // Light haptic feedback when pressing button
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!rowRef.current) return;
    triggerHapticFeedback(10); // Light haptic feedback when pressing button
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!media || media.length === 0) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.scrollContainer}>
        {/* Left scroll button */}
        {showLeftArrow && (
          <button
            className={`${styles.scrollButton} ${styles.scrollButtonLeft} ${styles.scrollButtonHiddenLeft}`}
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {/* Content row */}
        <div
          ref={rowRef}
          className={styles.contentRow}
          onScroll={handleScroll}
          onTouchStart={() => {
            // Reset scroll position on touch start for edge detection
            if (rowRef.current) {
              lastScrollPosition.current = rowRef.current.scrollLeft;
            }
          }}
        >
          {media.map((item, index) => (
            <div
              key={`${item.media_type}-${item.id}`}
              className={`${styles.mediaItem} ${featured ? styles.mediaItemFeatured : styles.mediaItemRegular}`}
              style={{
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <MediaCard media={item} featured={featured} />
            </div>
          ))}
        </div>
        {/* Infinite Scroll Trigger Only (no button) */}
        {loadMoreRef && (
          <div ref={loadMoreRef} className={styles.loadMoreTrigger} />
        )}
        {/* Right scroll button */}
        {showRightArrow && (
          <button
            className={`${styles.scrollButton} ${styles.scrollButtonRight} ${styles.scrollButtonHiddenRight}`}
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ContentRow;
