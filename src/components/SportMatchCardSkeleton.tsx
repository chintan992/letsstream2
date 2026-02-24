import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SportMatchCardSkeletonProps {
  className?: string;
}

const SportMatchCardSkeleton = ({ className }: SportMatchCardSkeletonProps) => {
  return (
    <div
      className={cn("block", className)}
      role="status"
      aria-label="Loading match information"
    >
      <Card className="bg-card/80 h-full overflow-hidden border-white/10 shadow-md backdrop-blur-sm">
        {/* Image skeleton with shimmer effect */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800">
          {/* Shimmer wave animation */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Badge skeletons */}
          <div className="absolute right-2 top-2 flex flex-col gap-2">
            <div className="relative h-6 w-20 overflow-hidden rounded-full bg-white/20">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>

          {/* Favorite button skeleton */}
          <div className="absolute relative left-2 top-2 h-9 w-9 overflow-hidden rounded-full bg-white/20">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Countdown skeleton */}
          <div className="absolute bottom-2 left-2">
            <div className="relative h-6 w-24 overflow-hidden rounded-full bg-white/20">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title skeleton */}
          <div className="mb-2 space-y-2">
            <div className="relative h-5 w-3/4 overflow-hidden rounded bg-white/10">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="relative h-5 w-1/2 overflow-hidden rounded bg-white/10">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_200ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>

          {/* Teams skeleton */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative h-6 w-6 overflow-hidden rounded-full bg-white/10">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_400ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="relative h-4 w-20 overflow-hidden rounded bg-white/10">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_400ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>
            <div className="relative h-3 w-8 overflow-hidden rounded bg-white/10">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_600ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative h-4 w-20 overflow-hidden rounded bg-white/10">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_800ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="relative h-6 w-6 overflow-hidden rounded-full bg-white/10">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_800ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>
          </div>

          {/* Footer skeleton */}
          <div className="flex items-center justify-between">
            <div className="relative h-3 w-28 overflow-hidden rounded bg-white/10">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_1000ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="relative h-3 w-16 overflow-hidden rounded bg-white/10">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_1000ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
    </div>
  );
};

export default SportMatchCardSkeleton;
