
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { triggerHapticFeedback } from '@/utils/haptic-feedback';
import { useNavigate } from 'react-router-dom';
import { Media } from '@/utils/types';
import { backdropSizes } from '@/utils/api';
import { getImageUrl } from '@/utils/services/tmdb';
import { Button } from '@/components/ui/button';
import { Play, Info, Star, Calendar, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaPreferences } from '@/hooks/use-media-preferences';
import { trackMediaPreference } from '@/lib/analytics';
import useKeyPress from '@/hooks/use-key-press';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWillChange } from '@/hooks/useWillChange';

interface ExtendedMedia extends Media {
  logo_path?: string;
  tagline?: string;
}

interface HeroProps {
  media: Media[];
  className?: string;
}

const Hero = ({ media, className = '' }: HeroProps) => {
  // Filter and prioritize media based on user preferences
  const { preference } = useMediaPreferences();
  const filteredMedia = useMemo(() => {
    // First filter out items without backdrop
    const withBackdrop = media.filter(item => item.backdrop_path);

    // If user has a preference, prioritize that content type
    if (preference && preference !== 'balanced') {
      const preferred = withBackdrop.filter(item => item.media_type === preference);
      const others = withBackdrop.filter(item => item.media_type !== preference);
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
    setupInteractionHandler: setupProgressInteractionHandler
  } = useWillChange(
    { current: paginationProgressRefs.current[currentIndex] } as React.RefObject<HTMLDivElement>,
    'transform, opacity',
    {
      animationName: 'paginationPulse',
      idleTimeout: 500,  // 500ms idle timeout for infinite animation
      cleanupOnUnmount: true,
      respectReducedMotion: true
    }
  );

  // Helper to build srcSet for a given backdrop_path
  const buildSrcSet = useCallback((backdrop_path: string) => [
    `${getImageUrl(backdrop_path, backdropSizes.small)} 300w`,
    `${getImageUrl(backdrop_path, backdropSizes.medium)} 780w`,
    `${getImageUrl(backdrop_path, backdropSizes.large)} 1280w`,
    `${getImageUrl(backdrop_path, backdropSizes.original)} 1920w`,
  ].join(', '), []);

  // Helper to preload an image (optionally with srcSet)
  const preloadImage = useCallback((backdrop_path: string) => {
    if (!backdrop_path) return;
    const img = new window.Image();
    img.src = getImageUrl(backdrop_path, backdropSizes.medium);
    img.srcset = buildSrcSet(backdrop_path);
  }, [buildSrcSet]);

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
      const prevIndex = (currentIndex - 1 + filteredMedia.length) % filteredMedia.length;
      const prevMedia = filteredMedia[prevIndex];
      if (prevMedia && prevMedia.backdrop_path) {
        preloadImage(prevMedia.backdrop_path);
      }
    }
  }, [filteredMedia, currentIndex, preloadImage]);

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
    setCurrentIndex((prev) => (prev + 1) % filteredMedia.length);
  }, [filteredMedia.length]);

  const goToPrev = useCallback(() => {
    triggerHapticFeedback(15);
    setIsLoaded(false);
    setCurrentIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
  }, [filteredMedia.length]);

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
      const maxVisualOffset = carouselRef.current?.clientWidth ? carouselRef.current.clientWidth / 3 : 100;
      const rawOffset = currentX - touchStart;
      const normalizedOffset = Math.max(Math.min(rawOffset, maxVisualOffset), -maxVisualOffset);
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

  const handleMediaClick = useCallback((media: Media) => {
    trackMediaPreference(media.media_type as 'movie' | 'tv', 'select');
    navigate(media.media_type === 'movie' ? `/movie/${media.id}` : `/tv/${media.id}`);
  }, [navigate]);

  // Auto rotation management with enhanced timing
  const startAutoRotation = useCallback(() => {
    if (filteredMedia.length <= 1) return;

    intervalRef.current = setInterval(() => {
      goToNext();
      // Preload the next image during rotation
      preloadNextImage();
    }, 10000); // Increased from 8 seconds for more time to appreciate each media
  }, [filteredMedia.length, goToNext, preloadNextImage]);

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

  // Initialize and clean up auto rotation
  useEffect(() => {
    if (isAutoRotating) {
      startAutoRotation();
    }
    return pauseAutoRotation;
  }, [startAutoRotation, isAutoRotating]);

  // Preload next and previous images when current is loaded
  useEffect(() => {
    if (isLoaded) {
      preloadNextImage();
      preloadPrevImage();
    }
  }, [isLoaded, preloadNextImage, preloadPrevImage]);

  // Preload the first image using <link rel="preload"> for best LCP
  useEffect(() => {
    if (currentIndex === 0 && featuredMedia?.backdrop_path) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getImageUrl(featuredMedia.backdrop_path, backdropSizes.large);
      link.setAttribute('imagesrcset', buildSrcSet(featuredMedia.backdrop_path));
      link.setAttribute('media', '(min-width: 0px)');
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
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
  }, [currentIndex, setActiveIndicatorWillChange, removeActiveIndicatorWillChange, setupProgressInteractionHandler]);

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
    
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      node.removeEventListener('touchmove', handleTouchMove);
    };
  }, [touchStart]);

  const title = featuredMedia?.title || featuredMedia?.name || 'Untitled';
  const releaseDate = featuredMedia?.release_date || featuredMedia?.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';

  const handlePlay = () => {
    triggerHapticFeedback(25); // Stronger feedback for main action
    const mediaType = featuredMedia?.media_type;
    const id = featuredMedia?.id;

    if (mediaType === 'tv') {
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
      filter: "brightness(0.8) saturate(0.8)"
    },
    animate: { 
      opacity: isLoaded ? 1 : 0,
      scale: isLoaded ? 1 : 1.05,
      filter: "brightness(1) saturate(0.9)",
      transition: { 
        opacity: { duration: 0.8, ease: "easeOut" },
        scale: { duration: 1.2, ease: "easeOut" },
        filter: { duration: 1, ease: "easeOut" }
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.4, ease: "easeIn" } 
    }
  };

  const contentBlockVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    }
  };

  const contentItemVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  if (!filteredMedia.length) return null;
  
  return (
    <section 
  ref={carouselRef}
  className="relative w-full h-[85vh] overflow-hidden"
>
  {/* Full-screen backdrop with minimal treatment */}
  <div className="absolute inset-0">
    <AnimatePresence mode="wait">
      <motion.div
        key={`bg-${currentIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full h-full"
      >
        <img 
          src={getImageUrl(featuredMedia?.backdrop_path, backdropSizes.large)}
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
      </motion.div>
    </AnimatePresence>
  </div>
  
  {/* Floating content area - minimal, positioned at bottom */}
  <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 lg:px-16 py-12">
    <div className="container mx-auto">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl"
      >
        {/* Media type and rating in a horizontal line */}
        <div className="flex items-center gap-6 mb-4">
          <span className="text-primary font-medium uppercase text-sm tracking-widest">
            {featuredMedia?.media_type === 'movie' ? 'Film' : 'Series'}
          </span>
          
          <div className="flex items-center gap-4">
            {releaseYear && (
              <span className="text-white/80 text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {releaseYear}
              </span>
            )}
            
            {featuredMedia?.vote_average > 0 && (
              <span className="text-white/80 text-sm flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                {featuredMedia?.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        
        {/* Title with elegant styling */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight"
            style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
          {title}
        </h1>
        
        {/* Overview with controlled width */}
        <p className="text-white/90 text-base md:text-lg mb-8 max-w-2xl line-clamp-2 md:line-clamp-3">
          {featuredMedia?.overview}
        </p>
        
        {/* Action buttons with refined design */}
        <div className="flex flex-wrap gap-3 md:gap-4">
          <Button
            onClick={handlePlay}
            className="bg-white text-black hover:bg-white/90 px-6 md:px-8 py-2.5 rounded-full flex items-center gap-2 transition-all"
          >
            <Play className="w-5 h-5 fill-black" />
            <span className="font-medium">Watch</span>
          </Button>
          
          <Button
            onClick={handleMoreInfo}
            className="bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-black/50 text-white px-6 md:px-8 py-2.5 rounded-full flex items-center gap-2 transition-all"
          >
            <Info className="w-5 h-5" />
            <span className="font-medium">More Info</span>
          </Button>
        </div>
      </motion.div>
    </div>
  </div>
  
  {/* Side navigation arrows */}
  {filteredMedia.length > 1 && (
    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-4 md:px-6 pointer-events-none">
      <button
        onClick={goToPrev}
        className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 flex items-center justify-center transition-all pointer-events-auto"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 flex items-center justify-center transition-all pointer-events-auto"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    </div>
  )}
  
  {/* Progress bar indicators at top */}
  <div className="absolute top-0 left-0 right-0 flex h-1">
    {filteredMedia.map((_, index) => (
      <div
        key={index}
        className={`flex-1 transition-all ${
          index === currentIndex ? 'bg-primary' : 'bg-white/20'
        }`}
        onClick={() => {
          triggerHapticFeedback(10);
          setCurrentIndex(index);
        }}
        role="button"
        tabIndex={0}
        aria-label={`Go to slide ${index + 1}`}
      >
        {index === currentIndex && (
          <motion.div
            ref={el => paginationProgressRefs.current[index] = el}
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
    className="absolute bottom-4 right-4 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center transition-all"
    aria-label={isAutoRotating ? "Pause auto-rotation" : "Resume auto-rotation"}
  >
    {isAutoRotating ? (
      <Pause className="w-4 h-4 text-white" />
    ) : (
      <Play className="w-4 h-4 text-white" />
    )}
  </button>
</section>
  );
};

export default Hero;
