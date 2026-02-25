import React, { MutableRefObject } from "react";
import { m } from "framer-motion";
import { Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";

interface HeroControlsProps {
  mediaLength: number;
  currentIndex: number;
  isAutoRotating: boolean;
  paginationProgressRefs: MutableRefObject<Array<HTMLDivElement | null>>;
  onAutoRotationToggle: () => void;
  onGoToPrev: () => void;
  onGoToNext: () => void;
  onSelectIndex: (index: number) => void;
}

export function HeroControls({
  mediaLength,
  currentIndex,
  isAutoRotating,
  paginationProgressRefs,
  onAutoRotationToggle,
  onGoToPrev,
  onGoToNext,
  onSelectIndex,
}: HeroControlsProps) {
  return (
    <>
      {/* Side navigation arrows */}
      {mediaLength > 1 && (
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-between px-4 md:px-6">
          <button
            onClick={onGoToPrev}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-all hover:bg-black/40"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={onGoToNext}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-all hover:bg-black/40"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>
      )}

      {/* Progress bar indicators at top */}
      <div className="absolute left-0 right-0 top-0 flex h-6 -translate-y-2 items-end pb-2">
        {Array.from({ length: mediaLength }).map((_, index) => (
          <div
            key={`slide-${index}`}
            className="group relative flex-1 cursor-pointer py-2"
            onClick={() => {
              triggerHapticFeedback(10);
              onSelectIndex(index);
            }}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                triggerHapticFeedback(10);
                onSelectIndex(index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex ? "true" : undefined}
          >
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 transition-all ${
                index === currentIndex
                  ? "bg-primary"
                  : "bg-white/20 group-hover:bg-white/40"
              }`}
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
          </div>
        ))}
      </div>

      {/* Auto-rotation control - Minimal corner placement */}
      <button
        onClick={onAutoRotationToggle}
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
    </>
  );
}
