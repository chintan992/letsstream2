import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollArrowProps {
  direction: "left" | "right";
  onClick: () => void;
  isVisible: boolean;
}

const ScrollArrow: React.FC<ScrollArrowProps> = ({
  direction,
  onClick,
  isVisible,
}) => {
  const baseClass =
    "absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/80 text-white shadow-lg hover:shadow-accent/40 hover:bg-accent/80 transition-all duration-200 ring-2 ring-accent/30 hidden md:flex";
  const positionClass = direction === "left" ? "left-0" : "right-0";
  const visibleClass = isVisible
    ? "opacity-100 translate-x-0"
    : direction === "left"
      ? "opacity-0 -translate-x-4"
      : "opacity-0 translate-x-4";

  return (
    <button
      className={`${baseClass} ${positionClass} ${visibleClass}`}
      onClick={onClick}
      aria-label={`Scroll ${direction}`}
      type="button"
    >
      {direction === "left" ? (
        <ChevronLeft className="h-7 w-7" />
      ) : (
        <ChevronRight className="h-7 w-7" />
      )}
    </button>
  );
};

export default ScrollArrow;
