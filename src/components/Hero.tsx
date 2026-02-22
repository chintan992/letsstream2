import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";
import { useNavigate } from "react-router-dom";
import { Media } from "@/utils/types";
import { backdropSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";
import { Button } from "@/components/ui/button";
import {
  Play,
  Info,
  Star,
  Calendar,
  Pause,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { m, AnimatePresence } from "framer-motion";
import { useMediaPreferences } from "@/hooks/use-media-preferences";
import { trackMediaPreference } from "@/lib/analytics";
import useKeyPress from "@/hooks/use-key-press";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWillChange } from "@/hooks/useWillChange";

interface ExtendedMedia extends Media {
  logo_path?: string;
  tagline?: string;
}

interface HeroProps {
  media: Media[];
  className?: string;
}

const Hero = ({ media, className = "" }: HeroProps) => {
  // Filter and prioritize media based on user preferences
  const { preference } = useMediaPreferences();
  const filteredMedia = useMemo(() => {
    // First filter out items without backdrop
    const withBackdrop = media.filter(item => item.backdrop_path);

    // If user has a preference, prioritize that content type
    if (preference && preference !== "balanced") {
      const preferred = withBackdrop.filter(
        item => item.media_type === preference
      );
      const others = withBackdrop.filter(
        item => item.media_type !== preference
      );
      return [...preferred, ...others];
    }

    return withBackdrop;
  }, [media, preference]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeTimeout = useRef<NodeJS.Timeout | null>(null);
  const swipeProgress = useRef<number>(0);
  const [visualSwipeFeedback, setVisualSwipeFeedback] = useState(0);

  // Refs for pagination progress indicators
  const paginationProgressRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Manage will-change for active pagination indicator
  const {
    setWillChange: setActiveIndicatorWillChange,
    removeWillChange: removeActiveIndicatorWillChange,
    resetIdleTimeout: resetActiveIndicatorTimeout,
    setupInteractionHandler: setupProgressInteractionHandler,
  } = useWillChange(
    {
      current: paginationProgressRefs.current[currentIndex],
    } as React.RefObject<HTMLDivElement>,
    "transform, opacity",
    {
      animationName: "paginationPulse",
      idleTimeout: 500, // 500ms idle timeout for infinite animation
      cleanupOnUnmount: true,
      respectReducedMotion: true,
    }
  );

  // Helper to build srcSet for a given backdrop_path
  const buildSrcSet = useCallback(
    (backdrop_path: string) =>
      [
        `${getImageUrl(backdrop_path, backdropSizes.small)} 300w`,
        `${getImageUrl(backdrop_path, backdropSizes.medium)} 780w`,
        `${getImageUrl(backdrop_path, backdropSizes.large)} 1280w`,
        `${getImageUrl(backdrop_path, backdropSizes.original)} 1920w`,
      ].join(", "),
    []
  );

  // Helper to preload an image (optionally with srcSet)
  const preloadImage = useCallback(
    (backdrop_path: string) => {
      if (!backdrop_path) return;
      const img = new window.Image();
      img.src = getImageUrl(backdrop_path, backdropSizes.medium);
      img.srcset = buildSrcSet(backdrop_path);
    },
    [buildSrcSet]
  );

  // Preload next and previous images
  const preloadNextImage = useCallback(() => {
    if (filteredMedia.length > 1) {
      const nextIndex = (currentIndex + 1) % filteredMedia.length;
      const nextMedia = filteredMedia[nextIndex];
      if (nextMedia && nextMedia.backdrop_path) {
        preloadImage(nextMedia.backdrop_path);
      }
    }
  }, [filteredMedia, currentIndex, preloadImage]);

  const preloadPrevImage = useCallback(() => {
    if (filteredMedia.length > 1) {
      const prevIndex =
        (currentIndex - 1 + filteredMedia.length) % filteredMedia.length;
      const prevMedia = filteredMedia[prevIndex];
      if (prevMedia && prevMedia.backdrop_path) {
        preloadImage(prevMedia.backdrop_path);
      }
    }
  }, [filteredMedia, currentIndex, preloadImage]);

  const pauseAutoRotation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const restartAutoRotation = () => {
    pauseAutoRotation();
    startAutoRotation();
  };

  // Auto-rotation control
  const toggleAutoRotation = () => {
    triggerHapticFeedback(20);
    if (isAutoRotating) {
      pauseAutoRotation();
    } else {
      restartAutoRotation();
    }
    setIsAutoRotating(!isAutoRotating);
  };

  const featuredMedia = filteredMedia[currentIndex] as ExtendedMedia;

  // Handle mouse interactions
  const handleMouseEnter = () => {
    pauseAutoRotation();
    // Reset will-change timeout when user interacts with the carousel
    resetActiveIndicatorTimeout();
  };

  const handleMouseLeave = () => {
    if (isAutoRotating) {
      restartAutoRotation();
    }
  };

  // Navigation functions
  const goToNext = useCallback(() => {
    triggerHapticFeedback(15);
    setIsLoaded(false);
    setCurrentIndex(prev => (prev + 1) % filteredMedia.length);
    preloadNextImage();
    preloadPrevImage();
  }, [filteredMedia.length, preloadNextImage, preloadPrevImage]);

  const goToPrev = useCallback(() => {
    triggerHapticFeedback(15);
    setIsLoaded(false);
    setCurrentIndex(
      prev => (prev - 1 + filteredMedia.length) % filteredMedia.length
    );
    preloadNextImage();
    preloadPrevImage();
  }, [filteredMedia.length, preloadNextImage, preloadPrevImage]);

  // Keyboard navigation
  useKeyPress("ArrowRight", goToNext);
  useKeyPress("ArrowLeft", goToPrev);
  useKeyPress("Space", toggleAutoRotation);

  // Enhanced touch handling for swipes with improved sensitivity and visual feedback
  const minSwipeDistance = isMobile ? 15 : 40; // Reduced from 20/50
  const touchSensitivity = isMobile ? 1.5 : 1.2; // Increased from 1.2/1

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.touches[0].clientX);
      setIsSwiping(false);
      setVisualSwipeFeedback(0);
      swipeProgress.current = 0;
      pauseAutoRotation();
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    setTouchEnd(currentX);

    if (Math.abs(currentX - touchStart) > 10) {
      setIsSwiping(true);

      // Calculate visual feedback (limited to range -100 to 100)
      const maxVisualOffset = carouselRef.current?.clientWidth
        ? carouselRef.current.clientWidth / 3
        : 100;
      const rawOffset = currentX - touchStart;
      const normalizedOffset = Math.max(
        Math.min(rawOffset, maxVisualOffset),
        -maxVisualOffset
      );
      const percentage = (normalizedOffset / maxVisualOffset) * 100;

      setVisualSwipeFeedback(percentage);
      swipeProgress.current = percentage;

      e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance * touchSensitivity;
    const isRightSwipe = distance < -minSwipeDistance * touchSensitivity;

    // Reset visual feedback
    setVisualSwipeFeedback(0);

    if (isLeftSwipe || isRightSwipe) {
      // Provide haptic feedback for successful swipe
      triggerHapticFeedback(15);

      // Debounce swipe
      if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
      swipeTimeout.current = setTimeout(() => setIsSwiping(false), 200);
    }

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }

    if (isAutoRotating) {
      restartAutoRotation();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleMediaClick = useCallback(
    (media: Media) => {
      trackMediaPreference(media.media_type as "movie" | "tv", "select");
      navigate(
        media.media_type === "movie" ? `/movie/${media.id}` : `/tv/${media.id}`
      );
    },
    [navigate]
  );

  // Auto rotation management with enhanced timing
  const startAutoRotation = useCallback(() => {
    if (filteredMedia.length <= 1) return;

    intervalRef.current = setInterval(() => {
      goToNext();
      // Preload the next image during rotation
      preloadNextImage();
    }, 10000); // Increased from 8 seconds for more time to appreciate each media
  }, [filteredMedia.length, goToNext, preloadNextImage]);

  // Initialize and clean up auto rotation
  useEffect(() => {
    if (isAutoRotating) {
      startAutoRotation();
    }
    return pauseAutoRotation;
  }, [startAutoRotation, isAutoRotating]);

  // Preload the first image using <link rel="preload"> for best LCP
  useEffect(() => {
    if (currentIndex === 0 && featuredMedia?.backdrop_path) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = getImageUrl(featuredMedia.backdrop_path, backdropSizes.large);
      link.setAttribute(
        "imagesrcset",
        buildSrcSet(featuredMedia.backdrop_path)
      );
      link.setAttribute("media", "(min-width: 0px)");
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [currentIndex, featuredMedia, buildSrcSet]);

  // Apply will-change to the active pagination indicator when it's being animated
  useEffect(() => {
    // Update will-change for the currently active indicator
    const activeProgressElement = paginationProgressRefs.current[currentIndex];
    if (activeProgressElement) {
      setActiveIndicatorWillChange();

      // Set up interaction handlers for the active element
      const cleanup = setupProgressInteractionHandler(activeProgressElement);

      return () => {
        cleanup();
        removeActiveIndicatorWillChange();
      };
    }
  }, [
    currentIndex,
    setActiveIndicatorWillChange,
    removeActiveIndicatorWillChange,
    setupProgressInteractionHandler,
  ]);

  // Always call hooks at the top level
  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;

    const handleTouchMove = (e: TouchEvent) => {
      // Only handle single touch events
      if (e.touches.length === 1 && touchStart) {
        const currentX = e.touches[0].clientX;
        if (Math.abs(currentX - touchStart) > 10) {
          e.preventDefault();
        }
      }
    };

    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      node.removeEventListener("touchmove", handleTouchMove);
    };
  }, [touchStart]);

  const title = featuredMedia?.title || featuredMedia?.name || "Untitled";
  const releaseDate =
    featuredMedia?.release_date || featuredMedia?.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : "";

  const handlePlay = () => {
    triggerHapticFeedback(25); // Stronger feedback for main action
    const mediaType = featuredMedia?.media_type;
    const id = featuredMedia?.id;

    if (mediaType === "tv") {
      navigate(`/watch/tv/${id}/1/1`);
    } else {
      navigate(`/watch/${mediaType}/${id}`);
    }
  };

  const handleMoreInfo = () => {
    triggerHapticFeedback(20);
    navigate(`/${featuredMedia?.media_type}/${featuredMedia?.id}`);
  };

  // Define animation variants for framer-motion
  const backdropVariants = {
    initial: {
      opacity: 0,
      scale: 1.05,
      filter: "brightness(0.8) saturate(0.8)",
    },
    animate: {
      opacity: isLoaded ? 1 : 0,
      scale: isLoaded ? 1 : 1.05,
      filter: "brightness(1) saturate(0.9)",
      transition: {
        opacity: { duration: 0.8, ease: "easeOut" },
        scale: { duration: 1.2, ease: "easeOut" },
        filter: { duration: 1, ease: "easeOut" },
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.4, ease: "easeIn" },
    },
  };

  const contentBlockVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const contentItemVariants = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  if (!filteredMedia.length) return null;

  return (
    <section
      ref={carouselRef}
      className="relative h-[85vh] w-full overflow-hidden"
    >
      {/* Full-screen backdrop with minimal treatment */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <m.div
            key={`bg-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="h-full w-full"
          >
            <img
              src={getImageUrl(
                featuredMedia?.backdrop_path,
                backdropSizes.large
              )}
              alt={title}
              className="h-full w-full object-cover"
            />

            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          </m.div>
        </AnimatePresence>
      </div>

      {/* Floating content area - minimal, positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-12 md:px-10 lg:px-16">
        <div className="container mx-auto">
          <m.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            {/* Media type and rating in a horizontal line */}
            <div className="mb-4 flex items-center gap-6">
              <span className="text-sm font-medium uppercase tracking-widest text-primary">
                {featuredMedia?.media_type === "movie" ? "Film" : "Series"}
              </span>

              <div className="flex items-center gap-4">
                {releaseYear && (
                  <span className="flex items-center gap-1 text-sm text-white/80">
                    <Calendar className="h-3.5 w-3.5" />
                    {releaseYear}
                  </span>
                )}

                {featuredMedia?.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-sm text-white/80">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {featuredMedia?.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Title with elegant styling */}
            <h1
              className="mb-4 text-5xl font-bold tracking-tight text-white md:text-7xl"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
            >
              {title}
            </h1>

            {/* Overview with controlled width */}
            <p className="mb-8 line-clamp-2 max-w-2xl text-base text-white/90 md:line-clamp-3 md:text-lg">
              {featuredMedia?.overview}
            </p>

            {/* Action buttons with refined design */}
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button
                onClick={handlePlay}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-black transition-all hover:bg-white/90 md:px-8"
              >
                <Play className="h-5 w-5 fill-black" />
                <span className="font-medium">Watch</span>
              </Button>

              <Button
                onClick={handleMoreInfo}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-6 py-2.5 text-white backdrop-blur-sm transition-all hover:bg-black/50 md:px-8"
              >
                <Info className="h-5 w-5" />
                <span className="font-medium">More Info</span>
              </Button>
            </div>
          </m.div>
        </div>
      </div>

      {/* Side navigation arrows */}
      {filteredMedia.length > 1 && (
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-between px-4 md:px-6">
          <button
            onClick={goToPrev}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-all hover:bg-black/40"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-all hover:bg-black/40"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>
      )}

      {/* Progress bar indicators at top */}
      <div className="absolute left-0 right-0 top-0 flex h-1">
        {filteredMedia.map((_, index) => (
          <div
            key={index}
            className={`flex-1 transition-all ${
              index === currentIndex ? "bg-primary" : "bg-white/20"
            }`}
            onClick={() => {
              triggerHapticFeedback(10);
              setCurrentIndex(index);
            }}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                triggerHapticFeedback(10);
                setCurrentIndex(index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === currentIndex && (
              <m.div
                ref={el => (paginationProgressRefs.current[index] = el)}
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 10, ease: "linear" }}
                key={`progress-${currentIndex}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Auto-rotation control - Minimal corner placement */}
      <button
        onClick={toggleAutoRotation}
        className="absolute bottom-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50"
        aria-label={
          isAutoRotating ? "Pause auto-rotation" : "Resume auto-rotation"
        }
      >
        {isAutoRotating ? (
          <Pause className="h-4 w-4 text-white" />
        ) : (
          <Play className="h-4 w-4 text-white" />
        )}
      </button>
    </section>
  );
};

export default Hero;
