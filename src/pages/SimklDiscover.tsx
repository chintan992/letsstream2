import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SimklService, SimklTrendingItem } from "@/lib/simkl";
import { useUserPreferences } from "@/contexts/user-preferences";
import { Media } from "@/utils/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ContentRow from "@/components/ContentRow";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, TrendingUp, Sparkles } from "lucide-react";

// Convert a Simkl item to Media for ContentRow. Returns null when the item cannot
// be shown honestly: the browser-facing trending response often omits `title` and
// `ids.tmdb`, which used to render untitled posters linking to /movie/1000000.
function simklToMedia(
  item: SimklTrendingItem,
  mediaType: "movie" | "tv"
): Media | null {
  const title = item.title?.trim();
  const tmdbId = item.ids?.tmdb;
  if (!title || !tmdbId) return null;

  const simklPosterUrl = item.poster
    ? `https://simkl.in/posters/${item.poster}_m.webp`
    : undefined;

  return {
    id: tmdbId,
    title,
    name: title,
    media_type: mediaType,
    poster_path: null, // Will use custom_poster_url instead
    backdrop_path: item.fanart
      ? `https://simkl.in/fanart/${item.fanart}_w.webp`
      : null,
    overview: item.overview || "",
    vote_average:
      item.ratings?.simkl?.rating || item.ratings?.imdb?.rating || 0,
    release_date: item.year ? `${item.year}-01-01` : undefined,
    first_air_date: item.year ? `${item.year}-01-01` : undefined,
    custom_poster_url: simklPosterUrl,
    genre_ids: [],
  };
}

interface CategoryRowProps {
  title: string;
  icon: React.ReactNode;
  items: SimklTrendingItem[];
  mediaType: "movie" | "tv";
  category: string;
  isLoading: boolean;
}

const CategoryRow = ({
  title,
  icon,
  items,
  mediaType,
  category,
  isLoading,
}: CategoryRowProps) => {
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-32 flex-shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const media = items
    .slice(0, 20)
    .map(item => simklToMedia(item, mediaType))
    .filter((item): item is Media => item !== null);

  if (media.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        <Link
          to={`/simkl/${category}`}
          className="flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <ContentRow title="" media={media} />
    </div>
  );
};

const SimklDiscover = () => {
  const { userPreferences } = useUserPreferences();
  const [discoverState, setDiscoverState] = useState<{
    trendingMovies: SimklTrendingItem[];
    trendingTV: SimklTrendingItem[];
    trendingAnime: SimklTrendingItem[];
    isLoading: boolean;
    error: string | null;
  }>({
    trendingMovies: [],
    trendingTV: [],
    trendingAnime: [],
    isLoading: true,
    error: null,
  });
  const { trendingMovies, trendingTV, trendingAnime, isLoading, error } =
    discoverState;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [trendingMoviesData, trendingTVData, trendingAnimeData] =
          await Promise.all([
            SimklService.getTrending("movies"),
            SimklService.getTrending("tv"),
            SimklService.getTrending("anime"),
          ]);

        setDiscoverState({
          trendingMovies: trendingMoviesData,
          trendingTV: trendingTVData,
          trendingAnime: trendingAnimeData,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching Simkl discover content:", error);
        setDiscoverState(prev => ({
          ...prev,
          isLoading: false,
          error: String(error),
        }));
      }
    };

    fetchContent();
  }, [userPreferences?.simklToken]);

  return (
    <main className="flex min-h-screen min-h-svh w-full flex-col overflow-x-hidden bg-background">
      <SEO
        title="Discover Anime & Trending Media (Simkl Hub) | Let's Stream"
        description="Discover trending movies, TV shows, and personalized anime recommendations from Simkl on Let's Stream."
        keywords="simkl discover, trending movies, anime recommendations, tv shows"
      />
      <Navbar />

      <div className="flex w-full flex-1 flex-col items-stretch justify-start pt-20">
        {/* Header */}
        <div className="container mx-auto mb-8 px-6 md:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Simkl Discover</h1>
              <p className="text-sm text-white/60">
                Trending and popular content from Simkl
              </p>
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
              <p>Failed to load content. Please try again later.</p>
            </div>
          )}
        </div>

        {/* Content Rows */}
        <div className="container mx-auto px-6 md:px-10 lg:px-16">
          {!isLoading &&
            !error &&
            ![trendingMovies, trendingTV, trendingAnime].some(list =>
              list.some(item => item.title?.trim() && item.ids?.tmdb)
            ) && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-lg font-medium text-white">
                  Simkl is not returning usable titles right now
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
                  The trending feed came back without titles this time, so there
                  is nothing here to show. Movies and TV shows are unaffected.
                </p>
                <Link
                  to="/movie"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Browse movies
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          {/* Trending Movies */}
          <CategoryRow
            title="Trending Movies"
            icon={<TrendingUp className="h-5 w-5 text-red-400" />}
            items={trendingMovies}
            mediaType="movie"
            category="trending-movies"
            isLoading={isLoading}
          />

          {/* Trending TV Shows */}
          <CategoryRow
            title="Trending TV Shows"
            icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
            items={trendingTV}
            mediaType="tv"
            category="trending-tv"
            isLoading={isLoading}
          />

          {/* Trending Anime */}
          <CategoryRow
            title="Trending Anime"
            icon={<TrendingUp className="h-5 w-5 text-pink-400" />}
            items={trendingAnime}
            mediaType="tv"
            category="trending-anime"
            isLoading={isLoading}
          />
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default SimklDiscover;
