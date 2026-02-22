import React, { useState } from "react";
import { Link } from "react-router-dom";
import { APIMatch } from "@/utils/sports-types";
import { getMatchPosterUrl, getTeamBadgeUrl } from "@/utils/sports-api";
import { format } from "date-fns";
import { Tv, Heart, PlayCircle, Calendar, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUserPreferences } from "@/hooks/user-preferences";
import { useCountdown, formatCountdown } from "@/hooks/use-countdown";
import { useFavoriteMatches } from "@/hooks/use-favorite-matches";
import { Button } from "@/components/ui/button";
import { m } from "framer-motion";

interface SportMatchCardProps {
  match: APIMatch;
  className?: string;
}

const SportMatchCard = ({ match, className }: SportMatchCardProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";
  const { isFavorite, toggleFavorite } = useFavoriteMatches();
  const [isHovered, setIsHovered] = useState(false);

  const matchTime = new Date(match.date);
  const countdown = useCountdown(matchTime);
  const isUpcoming = !countdown.isLive && !countdown.isPast;
  const favorited = isFavorite(match.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: match.id,
      title: match.title,
      category: match.category,
      date: match.date,
    });
  };

  const cardVariants = {
    initial: {
      scale: 1,
      boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    },
    hover: {
      scale: 1.03,
      translateY: -5,
      boxShadow: `0 15px 30px ${accentColor}30`,
    },
  };

  return (
    <Link
      to={`/sports/player/${match.id}`}
      className={cn("group relative block h-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <m.div
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full"
      >
        <Card className="h-full overflow-hidden border-white/10 bg-black/30 shadow-lg backdrop-blur-xl transition-all duration-300">
          {/* Image Container */}
          <div className="relative aspect-video overflow-hidden">
            {match.poster ? (
              <m.img
                src={getMatchPosterUrl(match.poster)}
                alt={match.title}
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.1, filter: "brightness(1.1)" }}
                transition={{ duration: 0.4 }}
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <Trophy className="h-12 w-12 text-white/10" />
              </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Hover Overlay with Play Button */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[3px] transition-all duration-300",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              <m.div
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-md"
                style={{ boxShadow: `0 0 20px ${accentColor}40` }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isHovered ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <PlayCircle className="h-5 w-5 fill-white text-transparent" />
                <span className="font-medium">Watch Now</span>
              </m.div>
            </div>

            {/* Top Badges */}
            <div className="absolute left-3 right-3 top-3 z-20 flex items-start justify-between">
              <Badge
                variant="outline"
                className="border-white/10 bg-black/50 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur-lg"
              >
                {match.category}
              </Badge>

              <div className="flex flex-col items-end gap-2">
                {countdown.isLive && (
                  <Badge
                    className="relative overflow-hidden border-none px-3 py-1 text-sm font-bold"
                    style={{
                      background: `radial-gradient(circle, #ff6b6b, #ef4444)`,
                      boxShadow:
                        "0 0 15px rgba(239, 68, 68, 0.6), inset 0 0 5px rgba(255,255,255,0.3)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                    LIVE
                  </Badge>
                )}

                {match.popular && !countdown.isLive && (
                  <Badge className="border-none bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-sm font-semibold text-white shadow-lg">
                    🔥 Popular
                  </Badge>
                )}
              </div>
            </div>

            {/* Favorite Button */}
            <Button
              onClick={handleFavoriteClick}
              size="icon"
              variant="ghost"
              className={cn(
                "absolute bottom-3 right-3 z-20 h-9 w-9 rounded-full backdrop-blur-md transition-all duration-300",
                favorited
                  ? "scale-110 bg-red-500 text-white shadow-lg hover:bg-red-600"
                  : "border border-white/10 bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-all duration-300",
                  favorited && "fill-current"
                )}
              />
            </Button>
          </div>

          <CardContent className="relative p-4">
            {/* Teams / Title */}
            <div className="mb-4 min-h-[6rem]">
              {match.teams?.home && match.teams?.away ? (
                <div className="relative flex items-center justify-center">
                  {/* Home Team */}
                  <div className="flex flex-1 flex-col items-center gap-2 text-center">
                    <div className="relative h-12 w-12 rounded-full bg-white/5 p-2 ring-1 ring-white/10">
                      <img
                        src={getTeamBadgeUrl(match.teams.home.badge)}
                        alt={match.teams.home.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="line-clamp-2 text-sm font-semibold text-white/90">
                      {match.teams.home.name}
                    </span>
                  </div>

                  {/* VS Divider */}
                  <div className="flex-shrink-0 px-2">
                    <span className="text-xl font-bold text-white/40">VS</span>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-1 flex-col items-center gap-2 text-center">
                    <div className="relative h-12 w-12 rounded-full bg-white/5 p-2 ring-1 ring-white/10">
                      <img
                        src={getTeamBadgeUrl(match.teams.away.badge)}
                        alt={match.teams.away.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="line-clamp-2 text-sm font-semibold text-white/90">
                      {match.teams.away.name}
                    </span>
                  </div>
                </div>
              ) : (
                <h3 className="line-clamp-2 flex h-full items-center text-lg font-bold leading-snug text-white">
                  {match.title}
                </h3>
              )}
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Calendar className="h-3.5 w-3.5" />
                <span
                  className={cn(
                    "font-medium",
                    isUpcoming && countdown.hours < 24 && "text-amber-400"
                  )}
                >
                  {isUpcoming
                    ? formatCountdown(countdown)
                    : format(matchTime, "MMM d, h:mm a")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-white/50">
                <Tv className="h-3 w-3" />
                <span>{match.sources.length} Sources</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </m.div>
    </Link>
  );
};

export default SportMatchCard;
