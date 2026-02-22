import {
  Tv,
  Heart,
  Bookmark,
  History,
  Play,
  Calendar,
  Star,
  List,
  Shield,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { backdropSizes, posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";
import { TVDetails } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TVShowHeaderProps {
  tvShow: TVDetails;
  isFavorite: boolean;
  isInWatchlist: boolean;
  onToggleFavorite: () => void;
  onToggleWatchlist: () => void;
  onPlayEpisode: (season: number, episode: number) => void;
  lastWatchedEpisode: {
    season: number;
    episode: number;
    progress: number;
    episodeTitle: string;
    episodeThumbnail: string | null;
    timeRemaining: number;
    watchPosition: number;
    duration: number;
  } | null;
  isLastWatchedLoading?: boolean;
}

export const TVShowHeader = ({
  tvShow,
  isFavorite,
  isInWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  onPlayEpisode,
  lastWatchedEpisode,
  isLastWatchedLoading = false,
}: TVShowHeaderProps) => {
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (!seconds) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")} remaining`;
  };

  return (
    <div className="relative h-[70vh] w-full">
      {!backdropLoaded && (
        <div className="image-skeleton absolute inset-0 bg-background" />
      )}
      <img
        src={getImageUrl(tvShow.backdrop_path, backdropSizes.original)}
        alt={tvShow.name || "TV Show backdrop"}
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          backdropLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setBackdropLoaded(true)}
      />

      <div className="details-gradient absolute inset-0" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 md:flex-row">
          <div className="hidden w-40 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl md:block lg:w-52">
            {" "}
            <img
              src={getImageUrl(tvShow.poster_path, posterSizes.medium)}
              alt={tvShow.name || "TV show poster"}
              className="h-auto w-full rounded-xl"
            />
          </div>

          <div className="flex-1 animate-slide-up">
            {tvShow.logo_path ? (
              <div className="relative mb-4 w-full max-w-[300px] transition-all duration-300 ease-in-out hover:scale-105 md:max-w-[350px] lg:max-w-[450px]">
                {!logoLoaded && (
                  <div className="image-skeleton absolute inset-0 rounded-lg bg-background" />
                )}

                <img
                  src={getImageUrl(tvShow.logo_path, backdropSizes.original)}
                  alt={tvShow.name}
                  className={`h-auto w-full object-contain drop-shadow-xl filter transition-opacity duration-700 ease-in-out ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setLogoLoaded(true)}
                />
              </div>
            ) : (
              <h1 className="mb-2 animate-fade-in text-balance text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {tvShow.name}
              </h1>
            )}

            {tvShow.tagline && (
              <p className="mb-4 text-lg italic text-white/80">
                {tvShow.tagline}
              </p>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-3 md:gap-4">
              {tvShow.certification && (
                <div className="flex items-center rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm">
                  <Shield className="mr-1 h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">
                    {tvShow.certification}
                  </span>
                </div>
              )}

              {tvShow.first_air_date && (
                <div className="flex items-center text-white/80">
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDate(tvShow.first_air_date)}
                </div>
              )}

              <div className="flex items-center text-white/80">
                <List className="mr-2 h-4 w-4" />
                {tvShow.number_of_seasons}{" "}
                {tvShow.number_of_seasons === 1 ? "Season" : "Seasons"}
              </div>

              {tvShow.vote_average > 0 && (
                <div className="flex items-center text-amber-400">
                  <Star className="mr-2 h-4 w-4 fill-amber-400" />
                  {tvShow.vote_average.toFixed(1)}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {tvShow.genres.slice(0, 3).map(genre => (
                  <span
                    key={genre.id}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            <p className="mb-6 max-w-3xl leading-relaxed text-white/90">
              {tvShow.overview}
            </p>

            <div className="flex flex-wrap gap-3">
              {/* Show "Start from Beginning" button only when there's no last watched episode */}
              {!lastWatchedEpisode && !isLastWatchedLoading && (
                <Button
                  onClick={() => onPlayEpisode(1, 1)}
                  className="hover:bg-accent/90 shadow-accent/30 hover:shadow-accent/40 flex items-center bg-accent text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start from Beginning
                </Button>
              )}

              {/* Last Watched Episode or Loading State */}
              {isLastWatchedLoading ? (
                // Loading skeleton for continue watching card
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-[280px] max-w-[400px] animate-pulse items-center gap-3 rounded-xl border border-white/20 bg-black/50 p-3 shadow-lg backdrop-blur-sm">
                    <div className="bg-muted/20 relative h-16 w-24 flex-shrink-0 overflow-hidden rounded">
                      <div className="bg-muted/30 h-full w-full rounded" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="bg-muted/30 h-3 w-20 rounded"></div>
                      <div className="bg-muted/30 h-4 w-32 rounded"></div>
                      <div className="bg-muted/30 h-3 w-24 rounded"></div>
                      <div className="bg-muted/30 h-1 rounded"></div>
                    </div>
                  </div>

                  {/* Start from Beginning Button */}
                  <Button
                    onClick={() => onPlayEpisode(1, 1)}
                    variant="outline"
                    className="flex items-center whitespace-nowrap border-white/20 text-white hover:bg-white/10"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start from Beginning
                  </Button>
                </div>
              ) : lastWatchedEpisode ? (
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  {/* Enhanced Continue Watching Card */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      onPlayEpisode(
                        lastWatchedEpisode.season,
                        lastWatchedEpisode.episode
                      )
                    }
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onPlayEpisode(
                          lastWatchedEpisode.season,
                          lastWatchedEpisode.episode
                        );
                      }
                    }}
                    className="hover:border-accent/70 group flex min-w-[280px] max-w-[400px] cursor-pointer items-center gap-3 rounded-xl border border-white/20 bg-black/50 p-3 shadow-lg backdrop-blur-sm transition-all duration-300"
                  >
                    {/* Episode Thumbnail */}
                    <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-card">
                      {lastWatchedEpisode.episodeThumbnail ? (
                        <img
                          src={getImageUrl(
                            lastWatchedEpisode.episodeThumbnail,
                            backdropSizes.medium
                          )}
                          alt={lastWatchedEpisode.episodeTitle}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="to-accent/50 flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/50">
                          <Play className="h-6 w-6 text-white/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/10" />
                    </div>

                    {/* Episode Details */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-xs font-medium text-accent">
                        Continue Watching
                      </div>
                      <div className="mb-1 truncate text-sm font-medium text-white">
                        {lastWatchedEpisode.episodeTitle}
                      </div>
                      <div className="mb-2 text-xs text-white/70">
                        S{lastWatchedEpisode.season}, E
                        {lastWatchedEpisode.episode}
                      </div>

                      {/* Progress Bar */}
                      <div className="relative">
                        <Progress
                          value={lastWatchedEpisode.progress}
                          className="mb-1 h-1.5 overflow-hidden rounded-full"
                        />
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <span>{lastWatchedEpisode.progress}%</span>
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatTimeRemaining(
                              lastWatchedEpisode.timeRemaining
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Start from Beginning Button */}
                  <Button
                    onClick={() => onPlayEpisode(1, 1)}
                    variant="outline"
                    className="flex items-center whitespace-nowrap border-white/20 text-white shadow-sm hover:bg-white/10"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start from Beginning
                  </Button>
                </div>
              ) : null}

              <Button
                onClick={onToggleFavorite}
                variant="outline"
                className={cn(
                  "border-white/20 shadow-sm",
                  isFavorite
                    ? "to-accent/80 border-accent bg-gradient-to-r from-accent text-white"
                    : "bg-black/50 text-white hover:bg-white/10"
                )}
              >
                <Heart
                  className={cn("mr-2 h-4 w-4", isFavorite && "fill-current")}
                />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </Button>

              <Button
                onClick={onToggleWatchlist}
                variant="outline"
                className={cn(
                  "border-white/20 shadow-sm",
                  isInWatchlist
                    ? "to-accent/80 border-accent bg-gradient-to-r from-accent text-white"
                    : "bg-black/50 text-white hover:bg-white/10"
                )}
              >
                <Bookmark
                  className={cn(
                    "mr-2 h-4 w-4",
                    isInWatchlist && "fill-current"
                  )}
                />
                {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
