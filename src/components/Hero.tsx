import { useReducer, useEffect, useRef, useMemo, useCallback } from "react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";
import { useNavigate } from "react-router-dom";
import { Media } from "@/utils/types";
import { backdropSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";
import { m, AnimatePresence } from "framer-motion";
import { useMediaPreferences } from "@/hooks/use-media-preferences";
import { trackMediaPreference } from "@/lib/analytics";
import useKeyPress from "@/hooks/use-key-press";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWillChange } from "@/hooks/useWillChange";
import { HeroContent } from "./hero/HeroContent";
import { HeroControls } from "./hero/HeroControls";

interface ExtendedMedia extends Media {
  logo_path?: string;
  tagline?: string;
}

interface HeroProps {
  media: Media[];
  className?: string;
}

type HeroState = {
  currentIndex: number;
  isLoaded: boolean;
  firstLoad: boolean;
  touchStart: number | null;
  touchEnd: number | null;
  isAutoRotating: boolean;
};

const Hero = ({ media, className = "" }: HeroProps) => {
  const { preference } = useMediaPreferences();
  const filteredMedia = useMemo(() => {
    const withBackdrop = media.filter(item => item.backdrop_path);

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

  const [state, dispatch] = useReducer(
    (prev: HeroState, action: Partial<HeroState>) => ({ ...prev, ...action }),
    {
      currentIndex: 0,
      isLoaded: false,
      firstLoad: true,
      touchStart: null,
      touchEnd: null,
      isAutoRotating: true,
    }
  );

  const { currentIndex, isLoaded, touchStart, touchEnd, isAutoRotating } =
    state;

  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const carouselRef = useRef<HTMLDivElement>(null);
  const swipeProgress = useRef<number>(0);

  const paginationProgressRefs = useRef<Array<HTMLDivElement | null>>([]);

  /* eslint-disable react-hooks/refs */
  const activeProgressRef = {
    current: paginationProgressRefs.current[currentIndex],
  } as React.RefObject<HTMLDivElement>;

  const {
    setWillChange: setActiveIndicatorWillChange,
    removeWillChange: removeActiveIndicatorWillChange,
    resetIdleTimeout: resetActiveIndicatorTimeout,
    setupInteractionHandler: setupProgressInteractionHandler,
  } = useWillChange(activeProgressRef, "transform, opacity", {
    animationName: "paginationPulse",
    idleTimeout: 500,
    cleanupOnUnmount: true,
    respectReducedMotion: true,
  });
  /* eslint-enable react-hooks/refs */

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

  const preloadImage = useCallback(
    (backdrop_path: string) => {
      if (!backdrop_path) return;
      const img = new window.Image();
      img.src = getImageUrl(backdrop_path, backdropSizes.medium);
      img.srcset = buildSrcSet(backdrop_path);
    },
    [buildSrcSet]
  );

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

  const goToNext = useCallback(() => {
    triggerHapticFeedback(15);
    dispatch({
      isLoaded: false,
      currentIndex: (currentIndex + 1) % filteredMedia.length,
    });
    preloadNextImage();
    preloadPrevImage();
  }, [filteredMedia.length, currentIndex, preloadNextImage, preloadPrevImage]);

  const goToPrev = useCallback(() => {
    triggerHapticFeedback(15);
    dispatch({
      isLoaded: false,
      currentIndex:
        (currentIndex - 1 + filteredMedia.length) % filteredMedia.length,
    });
    preloadNextImage();
    preloadPrevImage();
  }, [filteredMedia.length, currentIndex, preloadNextImage, preloadPrevImage]);

  const pauseAutoRotation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startAutoRotation = useCallback(() => {
    if (filteredMedia.length <= 1) return;

    intervalRef.current = setInterval(() => {
      goToNext();
      preloadNextImage();
    }, 10000);
  }, [filteredMedia.length, goToNext, preloadNextImage]);

  const restartAutoRotation = () => {
    pauseAutoRotation();
    startAutoRotation();
  };

  const toggleAutoRotation = () => {
    triggerHapticFeedback(20);
    if (isAutoRotating) {
      pauseAutoRotation();
    } else {
      restartAutoRotation();
    }
    dispatch({ isAutoRotating: !isAutoRotating });
  };

  const featuredMedia = filteredMedia[currentIndex] as ExtendedMedia;

  useKeyPress("ArrowRight", goToNext);
  useKeyPress("ArrowLeft", goToPrev);
  useKeyPress("Space", toggleAutoRotation);

  const minSwipeDistance = isMobile ? 15 : 40;
  const touchSensitivity = isMobile ? 1.5 : 1.2;

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dispatch({
        touchEnd: null,
        touchStart: e.touches[0].clientX,
      });
      swipeProgress.current = 0;
      pauseAutoRotation();
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    dispatch({ touchEnd: currentX });

    if (Math.abs(currentX - touchStart) > 10) {
      const maxVisualOffset = carouselRef.current?.clientWidth
        ? carouselRef.current.clientWidth / 3
        : 100;
      const rawOffset = currentX - touchStart;
      const normalizedOffset = Math.max(
        Math.min(rawOffset, maxVisualOffset),
        -maxVisualOffset
      );
      const percentage = (normalizedOffset / maxVisualOffset) * 100;

      swipeProgress.current = percentage;

      // React typings issue with preventDefault in touchmove sometimes.
      // Easiest is just to not do this here if possible or wrap correctly.
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance * touchSensitivity;
    const isRightSwipe = distance < -minSwipeDistance * touchSensitivity;

    if (isLeftSwipe || isRightSwipe) {
      triggerHapticFeedback(15);
    }

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }

    if (isAutoRotating) {
      restartAutoRotation();
    }

    dispatch({ touchStart: null, touchEnd: null });
  };

  useEffect(() => {
    if (isAutoRotating) {
      startAutoRotation();
    }
    return pauseAutoRotation;
  }, [startAutoRotation, isAutoRotating]);

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

  useEffect(() => {
    const activeProgressElement = paginationProgressRefs.current[currentIndex];
    if (activeProgressElement) {
      setActiveIndicatorWillChange();
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

  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;

    const handleTouchMove = (e: TouchEvent) => {};

    node.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      node.removeEventListener("touchmove", handleTouchMove);
    };
  }, [touchStart]);

  const title = featuredMedia?.title || featuredMedia?.name || "Untitled";
  const releaseDate =
    featuredMedia?.release_date || featuredMedia?.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : "";

  const handlePlay = () => {
    triggerHapticFeedback(25);
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

  if (!filteredMedia.length) return null;

  return (
    <section
      ref={carouselRef}
      className={`relative h-[85vh] w-full overflow-hidden ${className}`}
      style={{ touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <m.div
            key={`bg-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="h-full w-full"
            onAnimationComplete={() => dispatch({ isLoaded: true })}
          >
            <img
              src={getImageUrl(
                featuredMedia?.backdrop_path,
                backdropSizes.large
              )}
              alt={title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          </m.div>
        </AnimatePresence>
      </div>

      <HeroContent
        mediaType={featuredMedia?.media_type}
        releaseYear={releaseYear}
        voteAverage={featuredMedia?.vote_average}
        title={title}
        overview={featuredMedia?.overview}
        onPlay={handlePlay}
        onMoreInfo={handleMoreInfo}
      />

      <HeroControls
        mediaLength={filteredMedia.length}
        currentIndex={currentIndex}
        isAutoRotating={isAutoRotating}
        paginationProgressRefs={paginationProgressRefs}
        onAutoRotationToggle={toggleAutoRotation}
        onGoToPrev={goToPrev}
        onGoToNext={goToNext}
        onSelectIndex={index =>
          dispatch({ currentIndex: index, isLoaded: false })
        }
      />
    </section>
  );
};

export default Hero;
