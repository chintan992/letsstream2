import { useState, useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMovieDetails,
  getMovieRecommendations,
  getMovieTrailer,
  getMovieCredits,
  getMovieImages,
} from "@/utils/api";
import { MovieDetails, Media, CastMember, CrewMember } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import ReviewSection from "@/components/ReviewSection";
import { DownloadSection } from "@/components/DownloadSection";
import {
  MovieHeader,
  MovieAbout,
  MovieCast,
  MovieImages,
} from "@/components/movie";
import { useWatchHistory } from "@/hooks/watch-history";
import { useAuth } from "@/hooks";
import { useHaptic } from "@/hooks/useHaptic";

type TabType = "about" | "cast" | "reviews" | "downloads" | "images";

interface Image {
  file_path: string;
  vote_average: number;
}

interface Images {
  backdrops: Image[];
  posters: Image[];
}

const MovieDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [movieData, setMovieData] = useState<{
    movie: MovieDetails | null;
    recommendations: Media[];
    cast: CastMember[];
    directors: CrewMember[];
    images: Images | null;
    isLoading: boolean;
    error: string | null;
  }>({
    movie: null,
    recommendations: [],
    cast: [],
    directors: [],
    images: null,
    isLoading: true,
    error: null,
  });
  const { movie, recommendations, cast, directors, images, isLoading, error } = movieData;
  const [activeTab, setActiveTab] = useState<TabType>("about");
  const [isContentHydrated, setIsContentHydrated] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
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
  const { triggerHaptic } = useHaptic();
  const { user } = useAuth();

  // Tab-aware scroll restoration with hydration tracking
  useScrollRestoration({
    storageKey: `scroll-movie-details-${activeTab}`,
    enabled: isContentHydrated,
  });

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) {
        setMovieData(prev => ({ ...prev, error: "Movie ID is required", isLoading: false }));
        return;
      }

      const movieId = parseInt(id, 10);
      if (isNaN(movieId)) {
        setMovieData(prev => ({ ...prev, error: "Invalid movie ID", isLoading: false }));
        return;
      }

      try {
        setMovieData(prev => ({ ...prev, isLoading: true, error: null }));
        const [movieResult, recommendationsData, creditsData, imagesData] =
          await Promise.all([
            getMovieDetails(movieId),
            getMovieRecommendations(movieId),
            getMovieCredits(movieId),
            getMovieImages(movieId),
          ]);

        if (!movieResult) {
          setMovieData(prev => ({ ...prev, error: "Movie not found", isLoading: false }));
          return;
        }

        setMovieData(prev => ({
          ...prev,
          movie: movieResult,
          recommendations: recommendationsData,
          cast: creditsData.cast,
          directors: creditsData.crew.filter(c => c.job === "Director"),
          images: imagesData,
          isLoading: false,
        }));
      } catch (err) {
        console.error("Error fetching movie data:", err);
        setMovieData(prev => ({
          ...prev,
          error: "Failed to load movie data. Please try again.",
          isLoading: false,
        }));
      }
    };

    fetchMovie();
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
      await new Promise(resolve => setTimeout(resolve, 100));
      if (isCancelled) return;

      let hydrated = false;
      switch (activeTab) {
        case "about":
          hydrated = !!movie;
          break;
        case "cast":
          hydrated = cast.length > 0;
          break;
        case "images":
          hydrated =
            !!images &&
            (images.backdrops.length > 0 || images.posters.length > 0);
          break;
        case "reviews":
        case "downloads":
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
  }, [activeTab, movie, cast.length, images]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-slow font-medium text-white">
          Loading...
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="mb-4 text-2xl text-white">
          {error || "Movie not found"}
        </h1>
        <Button onClick={() => navigate("/")} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <MovieHeader
        movie={movie}
        trailerKey={trailerKey}
        isFavorite={isFavorite}
        isInMyWatchlist={isInMyWatchlist}
        onToggleFavorite={handleToggleFavorite}
        onToggleWatchlist={handleToggleWatchlist}
        onPlayMovie={handlePlayMovie}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={value => {
            triggerHaptic();
            setActiveTab(value as TabType);
          }}
        >
          <TabsList className="mb-6 border-b border-white/10 bg-transparent">
            <TabsTrigger
              value="about"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
            >
              About
            </TabsTrigger>
            <TabsTrigger
              value="cast"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
            >
              Cast
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
            >
              Images
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
            >
              Reviews
            </TabsTrigger>
            {user && (
              <TabsTrigger
                value="downloads"
                className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
              >
                Downloads
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="about">
            <MovieAbout movie={movie} directors={directors} />
          </TabsContent>

          <TabsContent value="cast">
            <MovieCast cast={cast} />
          </TabsContent>

          <TabsContent value="images">
            <MovieImages images={images} movieName={movie.title} />
          </TabsContent>

          <TabsContent value="reviews">
            <div className="mb-8">
              <h2 className="mb-6 text-2xl font-bold text-white">
                User Reviews
              </h2>
              <ReviewSection mediaId={movie.id} mediaType="movie" />
            </div>
          </TabsContent>

          <TabsContent value="downloads">
            <div className="mb-8">
              <h2 className="mb-6 text-2xl font-bold text-white">Download</h2>
              <DownloadSection
                mediaName={movie.title}
                mediaType="movie"
                tmdbId={movie.id}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {recommendations.length > 0 && (
        <ContentRow title="More Like This" media={recommendations} />
      )}
    </div>
  );
};

export default MovieDetailsPage;
