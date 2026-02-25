import React from "react";
import { cn } from "@/lib/utils";
import { APIMatch } from "@/utils/sports-types";
import SportMatchCard from "./SportMatchCard";
import SportMatchCardSkeleton from "./SportMatchCardSkeleton";
import EmptyState from "./EmptyState";
import { m, Variants } from "framer-motion";

interface SportMatchGridProps {
  matches: APIMatch[];
  title?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  emptyType?:
    | "search"
    | "no-matches"
    | "no-popular"
    | "no-live"
    | "no-favorites";
  searchQuery?: string;
  sportName?: string;
  onClearFilters?: () => void;
  className?: string;
}

const SportMatchGrid = ({
  matches,
  title,
  emptyMessage = "No matches found.",
  isLoading = false,
  emptyType = "no-matches",
  searchQuery,
  sportName,
  onClearFilters,
  className,
}: SportMatchGridProps) => {
  // Show skeleton loading state
  if (isLoading) {
    return (
      <div className="px-4 py-6 md:px-8">
        {title && (
          <h2 className="mb-6 text-2xl font-bold text-white">{title}</h2>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <SportMatchCardSkeleton key={`skeleton-${num}`} />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state
  if (!matches || matches.length === 0) {
    return (
      <div className="px-4 py-6 md:px-8">
        {title && (
          <h2 className="mb-6 text-2xl font-bold text-white">{title}</h2>
        )}
        <EmptyState
          type={emptyType}
          searchQuery={searchQuery}
          sportName={sportName}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className={cn("px-4 py-6 md:px-8", className)}>
      {title && <h2 className="mb-6 text-2xl font-bold text-white">{title}</h2>}

      <m.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {matches.map(match => (
          <m.div
            key={`${match.id}-${match.sources[0]?.source}`}
            variants={item}
          >
            <SportMatchCard match={match} />
          </m.div>
        ))}
      </m.div>
    </div>
  );
};

export default SportMatchGrid;
