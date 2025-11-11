import React from "react";
import { Link } from "react-router-dom";
import { APIMatch } from "@/utils/sports-types";
import { getMatchPosterUrl, getTeamBadgeUrl } from "@/utils/sports-api";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, Tv } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUserPreferences } from "@/hooks/user-preferences";

interface SportMatchCardProps {
  match: APIMatch;
  className?: string;
}

const SportMatchCard = ({ match, className }: SportMatchCardProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";

  const isLive = new Date().getTime() - match.date < 3 * 60 * 60 * 1000; // Consider live if started less than 3 hours ago
  const matchTime = new Date(match.date);

  return (
    <Link
      to={`/sports/player/${match.id}`}
      className={cn(
        "block transform transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      <Card className="bg-card/80 h-full overflow-hidden border-white/10 shadow-md backdrop-blur-sm hover:shadow-lg">
        <div className="relative aspect-video">
          {match.poster ? (
            <img
              src={getMatchPosterUrl(match.poster)}
              alt={match.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-gray-800 to-gray-900">
              <span className="text-lg text-white">{match.category}</span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {isLive && (
            <Badge
              className="absolute right-2 top-2 bg-red-600 hover:bg-red-700"
              style={{ background: accentColor }}
            >
              <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white"></span>
              LIVE
            </Badge>
          )}

          {match.popular && !isLive && (
            <Badge
              className="absolute right-2 top-2"
              style={{ background: accentColor }}
            >
              Popular
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 font-semibold text-white">
            {match.title}
          </h3>

          {match.teams ? (
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={getTeamBadgeUrl(match.teams.home.badge)}
                  alt={match.teams.home.name}
                  className="mr-2 h-6 w-6 object-contain"
                  loading="lazy"
                />
                <span className="max-w-[80px] truncate text-sm text-white/80">
                  {match.teams.home.name}
                </span>
              </div>

              <div className="text-xs text-white/50">VS</div>

              <div className="flex items-center">
                <span className="max-w-[80px] truncate text-sm text-white/80">
                  {match.teams.away.name}
                </span>
                <img
                  src={getTeamBadgeUrl(match.teams.away.badge)}
                  alt={match.teams.away.name}
                  className="ml-2 h-6 w-6 object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div className="mb-3 text-sm text-white/80">{match.category}</div>
          )}

          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {isLive ? (
                <span>
                  Started {formatDistanceToNow(matchTime, { addSuffix: true })}
                </span>
              ) : (
                <span>{format(matchTime, "MMM d, yyyy - h:mm a")}</span>
              )}
            </div>

            <div className="flex items-center">
              <Tv className="mr-1 h-3 w-3" />
              <span>
                {match.sources.length}{" "}
                {match.sources.length === 1 ? "source" : "sources"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SportMatchCard;
