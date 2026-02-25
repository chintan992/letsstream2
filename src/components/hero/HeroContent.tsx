import React from "react";
import { motion } from "framer-motion";
import { Play, Info, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroContentProps {
  mediaType?: string;
  releaseYear: number | string;
  voteAverage?: number;
  title: string;
  overview?: string;
  onPlay: () => void;
  onMoreInfo: () => void;
}

export function HeroContent({
  mediaType,
  releaseYear,
  voteAverage,
  title,
  overview,
  onPlay,
  onMoreInfo,
}: HeroContentProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 py-12 md:px-10 lg:px-16">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {/* Media type and rating in a horizontal line */}
          <div className="mb-4 flex items-center gap-6">
            <span className="text-sm font-medium uppercase tracking-widest text-primary">
              {mediaType === "movie"
                ? "Film"
                : mediaType === "tv"
                  ? "Series"
                  : "Media"}
            </span>

            <div className="flex items-center gap-4">
              {releaseYear && (
                <span className="flex items-center gap-1 text-sm text-white/80">
                  <Calendar className="h-3.5 w-3.5" />
                  {releaseYear}
                </span>
              )}

              {voteAverage && voteAverage > 0 ? (
                <span className="flex items-center gap-1 text-sm text-white/80">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {voteAverage.toFixed(1)}
                </span>
              ) : null}
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
            {overview}
          </p>

          {/* Action buttons with refined design */}
          <div className="flex flex-wrap gap-3 md:gap-4">
            <Button
              type="button"
              onClick={onPlay}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-black transition-all hover:bg-white/90 md:px-8"
            >
              <Play className="h-5 w-5 fill-black" />
              <span className="font-medium">Watch</span>
            </Button>

            <Button
              type="button"
              onClick={onMoreInfo}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-6 py-2.5 text-white backdrop-blur-sm transition-all hover:bg-black/50 md:px-8"
            >
              <Info className="h-5 w-5" />
              <span className="font-medium">More Info</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
