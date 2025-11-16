import { useState, useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMovieDetails,
  getMovieRecommendations,
  getMovieTrailer,
  backdropSizes,
  posterSizes,
  getMovieCast,
} from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";
import { MovieDetails, Media, CastMember } from "@/utils/types";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import ReviewSection from "@/components/ReviewSection";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { useWatchHistory } from "@/hooks/watch-history";
import { DownloadSection } from "@/components/DownloadSection";
import { useAuth } from "@/hooks";
import { useHaptic } from "@/hooks/useHaptic";

type TabType = "about" | "cast" | "reviews" | "downloads";

const MovieDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("about");
  const [isContentHydrated, setIsContentHydrated] = useState(false);
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const {
    addToFavorites,
    addToWatchlist,
    removeFromFavorites,
    removeFromWatchlist,
    isInFavorites,
    isInWatchlist,
  } = useWatchHistory();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);
  const navigate = useNavigate();

  // Tab-aware scroll restoration with hydration tracking
  useScrollRestoration({
    storageKey: `scroll-movie-details-${activeTab}`,
    enabled: isContentHydrated,
  });
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHaptic();
  const { user } = useAuth();

  useEffect(() => {
    const fetchMovieData = async () => {
      if (!id) {
        setError("Movie ID is required");
        setIsLoading(false);
        return;
      }

      const movieId = parseInt(id, 10);
      if (isNaN(movieId)) {
        setError("Invalid movie ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const [movieData, recommendationsData, castData] = await Promise.all([
          getMovieDetails(movieId),
          getMovieRecommendations(movieId),
          getMovieCast(movieId),
        ]);

        if (!movieData) {
          setError("Movie not found");
          return;
        }

        setMovie(movieData);
        setRecommendations(recommendationsData);
        setCast(castData);
      } catch (error) {
        console.error("Error fetching movie data:", error);
        setError("Failed to load movie data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (movie?.id) {
        try {
          const trailerData = await getMovieTrailer(movie.id);
          setTrailerKey(trailerData);
        } catch (error) {
          console.error("Error fetching trailer:", error);
        }
      }
    };

    fetchTrailer();
  }, [movie?.id]);

  useEffect(() => {
    if (movie?.id) {
      setIsFavorite(isInFavorites(movie.id, "movie"));
      setIsInMyWatchlist(isInWatchlist(movie.id, "movie"));
    }
  }, [movie?.id, isInFavorites, isInWatchlist]);

  useEffect(() => {
    let isCancelled = false;

    const checkHydration = async () => {
      if (isCancelled) return;

      // Reset hydration status when tab changes
      setIsContentHydrated(false);

      // Add small delay to allow tab content to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (isCancelled) return;

      let hydrated = false;

      switch (activeTab) {
        case 'about':
          // About tab is hydrated when movie data is available and backdrop/logo loaded
          hydrated = !!movie && backdropLoaded && (movie.logo_path ? logoLoaded : true);
          break;
        case 'cast':
          // Cast tab is hydrated when cast data is loaded
          hydrated = cast.length > 0;
          break;
        case 'reviews':
          // Reviews tab is considered hydrated immediately as ReviewSection handles its own loading
          hydrated = true;
          break;
        case 'downloads':
          // Downloads tab is considered hydrated immediately as it lazy loads on user action
          hydrated = true;
          break;
        default:
          hydrated = true;
      }

      if (!isCancelled) {
        setIsContentHydrated(hydrated);
      }
    };

    checkHydration();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, movie, backdropLoaded, logoLoaded, cast.length]);

  const handlePlayMovie = () => {
    if (movie) {
      navigate(`/watch/movie/${movie.id}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!movie) return;

    if (isFavorite) {
      removeFromFavorites(movie.id, "movie");
      setIsFavorite(false);
    } else {
      addToFavorites({
        media_id: movie.id,
        media_type: "movie",
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        rating: movie.vote_average,
      });
      setIsFavorite(true);
    }
  };

  const handleToggleWatchlist = () => {
    if (!movie) return;

    if (isInMyWatchlist) {
      removeFromWatchlist(movie.id, "movie");
      setIsInMyWatchlist(false);
    } else {
      addToWatchlist({
        media_id: movie.id,
        media_type: "movie",
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        rating: movie.vote_average,
      });
      setIsInMyWatchlist(true);
    }
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-slow font-medium text-white">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="mb-4 text-2xl text-white">{error}</h1>
        <Button onClick={() => navigate("/")} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="mb-4 text-2xl text-white">Movie not found</h1>
        <Button onClick={() => navigate("/")} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Backdrop Image */}
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
                  <div className="flex items-center rounded bg-white/20 px-2 py-1">
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
                  {movie.genres.map(genre => (
                    <span
                      key={genre.id}
                      className="rounded bg-white/10 px-2 py-1 text-xs text-white/80"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mb-6 text-white/80">{movie.overview}</p>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handlePlayMovie}
                  className="hover:bg-accent/80 flex items-center bg-accent text-white"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Play
                </Button>

                <Button
                  onClick={handleToggleFavorite}
                  variant="outline"
                  className={`border-white/20 ${isFavorite ? "bg-accent text-white" : "bg-black/50 text-white hover:bg-black/70"}`}
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                  />
                  {isFavorite ? "In Favorites" : "Add to Favorites"}
                </Button>

                <Button
                  onClick={handleToggleWatchlist}
                  variant="outline"
                  className={`border-white/20 ${isInMyWatchlist ? "bg-accent text-white" : "bg-black/50 text-white hover:bg-black/70"}`}
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

      {/* Tabs for About, Cast, and Reviews */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex border-b border-white/10">
          <button
            className={`whitespace-nowrap px-4 py-2 font-medium ${
              activeTab === "about"
                ? "border-b-2 border-accent text-white"
                : "text-white/60 hover:text-white"
            }`}
            onClick={() => {
              triggerHaptic();
              setActiveTab("about");
            }}
          >
            About
          </button>
          <button
            className={`whitespace-nowrap px-4 py-2 font-medium ${
              activeTab === "cast"
                ? "border-b-2 border-accent text-white"
                : "text-white/60 hover:text-white"
            }`}
            onClick={() => {
              triggerHaptic();
              setActiveTab("cast");
            }}
          >
            Cast
          </button>
          <button
            className={`whitespace-nowrap px-4 py-2 font-medium ${
              activeTab === "reviews"
                ? "border-b-2 border-accent text-white"
                : "text-white/60 hover:text-white"
            }`}
            onClick={() => {
              triggerHaptic();
              setActiveTab("reviews");
            }}
          >
            Reviews
          </button>
          <button
            className={`whitespace-nowrap px-4 py-2 font-medium ${
              activeTab === "downloads"
                ? "border-b-2 border-accent text-white"
                : "text-white/60 hover:text-white"
            }`}
            onClick={() => {
              triggerHaptic();
              setActiveTab("downloads");
            }}
            style={{ display: user ? undefined : "none" }}
          >
            Downloads
          </button>
        </div>

        {activeTab === "about" ? (
          <>
            {/* Additional movie details */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="glass rounded-xl p-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Status
                </h3>
                <p className="text-white/80">{movie.status}</p>
              </div>

              <div className="glass rounded-xl p-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Budget
                </h3>
                <p className="text-white/80">
                  {movie.budget > 0
                    ? `$${movie.budget.toLocaleString()}`
                    : "Not available"}
                </p>
              </div>

              <div className="glass rounded-xl p-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Revenue
                </h3>
                <p className="text-white/80">
                  {movie.revenue > 0
                    ? `$${movie.revenue.toLocaleString()}`
                    : "Not available"}
                </p>
              </div>
            </div>

            {/* Production companies */}
            {movie.production_companies.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 text-xl font-semibold text-white">
                  Production Companies
                </h3>
                <div className="flex flex-wrap gap-6">
                  {movie.production_companies.map(company => (
                    <div key={company.id} className="text-center">
                      {company.logo_path ? (
                        <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-lg bg-white/10 p-3">
                          <img
                            src={getImageUrl(
                              company.logo_path,
                              posterSizes.small
                            )}
                            alt={company.name}
                            className="max-h-full max-w-full"
                          />
                        </div>
                      ) : (
                        <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-lg bg-white/10 p-3">
                          <span className="text-center text-xs text-white/70">
                            {company.name}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-white/70">{company.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : activeTab === "cast" ? (
          <div className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-white">Cast</h2>
            {cast.length > 0 ? (
              <div className="flex flex-wrap gap-6">
                {cast.map(member => (
                  <div key={member.id} className="w-32 text-center">
                    {member.profile_path ? (
                      <img
                        src={getImageUrl(member.profile_path, "w185")}
                        alt={member.name}
                        className="mx-auto mb-2 h-32 w-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="mx-auto mb-2 flex h-32 w-24 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60">
                        No Image
                      </div>
                    )}
                    <p className="truncate text-sm font-medium text-white/90">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-white/60">
                      {member.character}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/70">
                No cast information available.
              </div>
            )}
          </div>
        ) : activeTab === "downloads" ? (
          <div className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-white">
              Download Movie
            </h2>
            {movie && <DownloadSection mediaName={movie.title} />}
          </div>
        ) : (
          /* Reviews section */
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-white">
              User Reviews
            </h3>
            <ReviewSection mediaId={parseInt(id!, 10)} mediaType="movie" />
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <ContentRow title="More Like This" media={recommendations} />
      )}
    </div>
  );
};

export default MovieDetailsPage;
