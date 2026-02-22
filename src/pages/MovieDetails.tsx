import { useEffect, useReducer } from "react";
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
// Removed unused barrel imports; using separate, dedicated blocks (About/Cast/Images/Reviews)
import MovieDetailsImagesBlock from "@/components/movie/MovieDetailsImagesBlock";
import MovieDetailsReviewsBlock from "@/components/movie/MovieDetailsReviewsBlock";
import MovieDetailsAboutBlock from "@/components/movie/MovieDetailsAboutBlock";
import MovieDetailsCastBlock from "@/components/movie/MovieDetailsCastBlock";
import MovieDetailsShellExternal from "@/components/movie/MovieDetailsShell";
import MovieDetailsDownloadsBlock from "@/components/movie/MovieDetailsDownloadsBlock";
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

type MovieState = {
  movie: MovieDetails | null;
  recommendations: Media[];
  cast: CastMember[];
  directors: CrewMember[];
  images: Images | null;
  isLoading: boolean;
  error: string | null;
};

type MovieAction =
  | { type: "SET_MOVIE"; payload: MovieDetails | null }
  | { type: "SET_RECOMM"; payload: Media[] }
  | { type: "SET_CAST"; payload: CastMember[] }
  | { type: "SET_DIRECTORS"; payload: CrewMember[] }
  | { type: "SET_IMAGES"; payload: Images | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

function movieReducer(state: MovieState, action: MovieAction): MovieState {
  switch (action.type) {
    case "SET_MOVIE":
      return { ...state, movie: action.payload };
    case "SET_RECOMM":
      return { ...state, recommendations: action.payload };
    case "SET_CAST":
      return { ...state, cast: action.payload };
    case "SET_DIRECTORS":
      return { ...state, directors: action.payload };
    case "SET_IMAGES":
      return { ...state, images: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const initialState: MovieState = {
  movie: null,
  recommendations: [],
  cast: [],
  directors: [],
  images: null,
  isLoading: true,
  error: null,
};

// UI state for non-data aspects (tabs, hydration, trailer, favorites)
type UiState = {
  activeTab: TabType;
  isContentHydrated: boolean;
  trailerKey: string | null;
  isFavorite: boolean;
  isInMyWatchlist: boolean;
};

type UiAction =
  | { type: "SET_ACTIVE_TAB"; payload: TabType }
  | { type: "SET_HYDRATED"; payload: boolean }
  | { type: "SET_TRAILER"; payload: string | null }
  | { type: "SET_FAVORITE"; payload: boolean }
  | { type: "SET_WATCHLIST"; payload: boolean };

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_HYDRATED":
      return { ...state, isContentHydrated: action.payload };
    case "SET_TRAILER":
      return { ...state, trailerKey: action.payload };
    case "SET_FAVORITE":
      return { ...state, isFavorite: action.payload };
    case "SET_WATCHLIST":
      return { ...state, isInMyWatchlist: action.payload };
    default:
      return state;
  }
}

const initialUiState: UiState = {
  activeTab: "about",
  isContentHydrated: false,
  trailerKey: null,
  isFavorite: false,
  isInMyWatchlist: false,
};

// Note: MovieDetailsShellInline removed in favor of external MovieDetailsShell
const MovieDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [state, dispatch] = useReducer(movieReducer, initialState);
  const { movie, recommendations, cast, directors, images, isLoading, error } =
    state;
  const [ui, uiDispatch] = useReducer(uiReducer, initialUiState);
  // Expose helpers for readability
  const {
    addToFavorites,
    addToWatchlist,
    removeFromFavorites,
    removeFromWatchlist,
    isInFavorites,
    isInWatchlist,
  } = useWatchHistory();
  // UI state for favorite/watchlist
  const navigate = useNavigate();
  const { triggerHaptic } = useHaptic();
  const { user } = useAuth();

  // Tab-aware scroll restoration with hydration tracking
  useScrollRestoration({
    storageKey: `scroll-movie-details-${ui.activeTab}`,
    enabled: ui.isContentHydrated,
  });

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) {
        dispatch({ type: "SET_ERROR", payload: "Movie ID is required" });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      const movieId = parseInt(id, 10);
      if (isNaN(movieId)) {
        dispatch({ type: "SET_ERROR", payload: "Invalid movie ID" });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        const [movieResult, recommendationsData, creditsData, imagesData] =
          await Promise.all([
            getMovieDetails(movieId),
            getMovieRecommendations(movieId),
            getMovieCredits(movieId),
            getMovieImages(movieId),
          ]);

        if (!movieResult) {
          dispatch({ type: "SET_ERROR", payload: "Movie not found" });
          dispatch({ type: "SET_LOADING", payload: false });
          return;
        }

        dispatch({ type: "SET_MOVIE", payload: movieResult });
        dispatch({ type: "SET_RECOMM", payload: recommendationsData });
        dispatch({ type: "SET_CAST", payload: creditsData.cast });
        dispatch({
          type: "SET_DIRECTORS",
          payload: creditsData.crew.filter(c => c.job === "Director"),
        });
        dispatch({ type: "SET_IMAGES", payload: imagesData });
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (err) {
        console.error("Error fetching movie data:", err);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to load movie data. Please try again.",
        });
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    fetchMovie();
  }, [id]);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (movie?.id) {
        try {
          const trailerData = await getMovieTrailer(movie.id);
          uiDispatch({ type: "SET_TRAILER", payload: trailerData });
        } catch (error) {
          console.error("Error fetching trailer:", error);
        }
      }
    };

    fetchTrailer();
  }, [movie?.id]);

  useEffect(() => {
    if (movie?.id) {
      uiDispatch({
        type: "SET_FAVORITE",
        payload: isInFavorites(movie.id, "movie"),
      });
      uiDispatch({
        type: "SET_WATCHLIST",
        payload: isInWatchlist(movie.id, "movie"),
      });
    }
  }, [movie?.id, isInFavorites, isInWatchlist]);

  useEffect(() => {
    let isCancelled = false;

    const checkHydration = async () => {
      if (isCancelled) return;
      await new Promise(resolve => setTimeout(resolve, 100));
      if (isCancelled) return;

      let hydrated = false;
      switch (ui.activeTab) {
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
        uiDispatch({ type: "SET_HYDRATED", payload: hydrated });
      }
    };

    checkHydration();

    return () => {
      isCancelled = true;
    };
  }, [ui.activeTab, movie, cast.length, images]);

  const handlePlayMovie = () => {
    if (movie) {
      navigate(`/watch/movie/${movie.id}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!movie) return;

    if (ui.isFavorite) {
      removeFromFavorites(movie.id, "movie");
      uiDispatch({ type: "SET_FAVORITE", payload: false });
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
      uiDispatch({ type: "SET_FAVORITE", payload: true });
    }
  };

  const handleToggleWatchlist = () => {
    if (!movie) return;

    if (ui.isInMyWatchlist) {
      removeFromWatchlist(movie.id, "movie");
      uiDispatch({ type: "SET_WATCHLIST", payload: false });
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
      uiDispatch({ type: "SET_WATCHLIST", payload: true });
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

      {/* External shell component usage */}
      <MovieDetailsShellExternal
        movie={movie}
        trailerKey={ui.trailerKey}
        isFavorite={ui.isFavorite}
        isInMyWatchlist={ui.isInMyWatchlist}
        onToggleFavorite={handleToggleFavorite}
        onToggleWatchlist={handleToggleWatchlist}
        onPlayMovie={handlePlayMovie}
        activeTab={ui.activeTab}
        onTabChange={t => uiDispatch({ type: "SET_ACTIVE_TAB", payload: t })}
        showDownloads={!!user}
      >
        <TabsContent value="about">
          <MovieDetailsAboutBlock movie={movie} directors={directors} />
        </TabsContent>

        <TabsContent value="cast">
          <MovieDetailsCastBlock cast={cast} />
        </TabsContent>

        <TabsContent value="images">
          <MovieDetailsImagesBlock images={images} movieName={movie.title} />
        </TabsContent>

        <TabsContent value="reviews">
          <MovieDetailsReviewsBlock movieId={movie.id} />
        </TabsContent>

        {user && (
          <TabsContent value="downloads">
            <MovieDetailsDownloadsBlock movie={movie} />
          </TabsContent>
        )}
      </MovieDetailsShellExternal>

      {recommendations.length > 0 && (
        <ContentRow title="More Like This" media={recommendations} />
      )}
    </div>
  );
};

export default MovieDetailsPage;
