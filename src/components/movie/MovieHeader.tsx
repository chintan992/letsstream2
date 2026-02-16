import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  Calendar,
  Star,
  ArrowLeft,
  Shield,
  Heart,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/services/tmdb";
import { backdropSizes, posterSizes } from "@/utils/api";
import { MovieDetails } from "@/utils/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface MovieHeaderProps {
  movie: MovieDetails;
  trailerKey: string | null;
  isFavorite: boolean;
  isInMyWatchlist: boolean;
  onToggleFavorite: () => void;
  onToggleWatchlist: () => void;
  onPlayMovie: () => void;
}

const formatRuntime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const MovieHeader = ({
  movie,
  trailerKey,
  isFavorite,
  isInMyWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  onPlayMovie,
}: MovieHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  return (
    <div className="relative h-[70vh] w-full">
      {/* Loading skeleton */}
      {!backdropLoaded && (
        <div className="image-skeleton absolute inset-0 bg-background" />
      )}

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute left-6 top-20 z-10 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <img
        src={getImageUrl(movie.backdrop_path, backdropSizes.original)}
        alt={movie.title || "Movie backdrop"}
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          backdropLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setBackdropLoaded(true)}
      />

      {/* Gradient overlay */}
      <div className="details-gradient absolute inset-0" />

      {/* Trailer section - only show on desktop */}
      {!isMobile && trailerKey && (
        <div className="absolute inset-0 bg-black/60">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailerKey}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`Trailer for ${movie?.title || "movie"}`}
          />
        </div>
      )}

      {/* Movie info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 md:flex-row">
          <div className="hidden w-48 flex-shrink-0 overflow-hidden rounded-lg shadow-lg md:block xl:w-64">
            <img
              src={getImageUrl(movie.poster_path, posterSizes.medium)}
              alt={movie.title || "Movie poster"}
              className="h-auto w-full"
            />
          </div>

          <div className="flex-1 animate-slide-up">
            {movie.logo_path ? (
              <div className="relative mx-auto mb-4 w-full max-w-[300px] transition-all duration-300 ease-in-out hover:scale-105 md:max-w-[400px] lg:max-w-[500px]">
                {/* Loading skeleton */}
                {!logoLoaded && (
                  <div className="image-skeleton absolute inset-0 rounded-lg bg-background" />
                )}

                <img
                  src={getImageUrl(movie.logo_path, backdropSizes.original)}
                  alt={movie.title}
                  className={`h-auto w-full object-contain drop-shadow-lg filter transition-opacity duration-700 ease-in-out ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setLogoLoaded(true)}
                />
              </div>
            ) : (
              <h1 className="mb-2 animate-fade-in text-balance text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {movie.title}
              </h1>
            )}

            {movie.tagline && (
              <p className="mb-4 text-lg italic text-white/70">
                {movie.tagline}
              </p>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-4">
              {movie.certification && (
                <div className="flex items-center rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm">
                  <Shield className="mr-1 h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">
                    {movie.certification}
                  </span>
                </div>
              )}

              {movie.release_date && (
                <div className="flex items-center text-white/80">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(movie.release_date).getFullYear()}
                </div>
              )}

              {movie.runtime > 0 && (
                <div className="flex items-center text-white/80">
                  <Clock className="mr-2 h-4 w-4" />
                  {formatRuntime(movie.runtime)}
                </div>
              )}

              {movie.vote_average > 0 && (
                <div className="flex items-center text-amber-400">
                  <Star className="mr-2 h-4 w-4 fill-amber-400" />
                  {movie.vote_average.toFixed(1)}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {movie.genres.slice(0, 3).map(genre => (
                  <span
                    key={genre.id}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            <p className="mb-6 text-white/80">{movie.overview}</p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={onPlayMovie}
                className="hover:bg-accent/80 flex items-center bg-accent text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Play
              </Button>

              <Button
                onClick={onToggleFavorite}
                variant="outline"
                className={`border-white/20 ${
                  isFavorite
                    ? "bg-accent text-white"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                />
                {isFavorite ? "In Favorites" : "Add to Favorites"}
              </Button>

              <Button
                onClick={onToggleWatchlist}
                variant="outline"
                className={`border-white/20 ${
                  isInMyWatchlist
                    ? "bg-accent text-white"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                <Bookmark
                  className={`mr-2 h-4 w-4 ${isInMyWatchlist ? "fill-current" : ""}`}
                />
                {isInMyWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHeader;
