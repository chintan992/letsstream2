import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SportMatchCardSkeletonProps {
    className?: string;
}

const SportMatchCardSkeleton = ({ className }: SportMatchCardSkeletonProps) => {
    return (
        <div className={cn("block", className)}>
            <Card className="h-full overflow-hidden border-white/10 bg-card/80 shadow-md backdrop-blur-sm">
                {/* Image skeleton with shimmer effect */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800">
                    {/* Shimmer wave animation */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Badge skeletons */}
                    <div className="absolute right-2 top-2 flex flex-col gap-2">
                        <div className="h-6 w-20 rounded-full bg-white/20 animate-pulse" />
                    </div>

                    {/* Favorite button skeleton */}
                    <div className="absolute left-2 top-2 h-9 w-9 rounded-full bg-white/20 animate-pulse" />

                    {/* Countdown skeleton */}
                    <div className="absolute bottom-2 left-2">
                        <div className="h-6 w-24 rounded-full bg-white/20 animate-pulse" />
                    </div>
                </div>

                <CardContent className="p-4">
                    {/* Title skeleton */}
                    <div className="mb-2 space-y-2">
                        <div className="h-5 w-3/4 rounded bg-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                        <div className="h-5 w-1/2 rounded bg-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_200ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                    </div>

                    {/* Teams skeleton */}
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-full bg-white/10 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_400ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                            <div className="h-4 w-20 rounded bg-white/10 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_400ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                        </div>
                        <div className="h-3 w-8 rounded bg-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_600ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="h-4 w-20 rounded bg-white/10 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_800ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                            <div className="h-6 w-6 rounded-full bg-white/10 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_800ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* Footer skeleton */}
                    <div className="flex items-center justify-between">
                        <div className="h-3 w-28 rounded bg-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_1000ms] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                        <div className="h-3 w-16 rounded bg-white/10 relative overflow-hidden">
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
