import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SimklService, SimklTrendingItem } from "@/lib/simkl";
import { useUserPreferences } from "@/contexts/user-preferences";
import { Media } from "@/utils/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentRow from "@/components/ContentRow";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, TrendingUp, Sparkles } from "lucide-react";

// Convert Simkl item to Media format for ContentRow compatibility
// Uses index to ensure unique keys when TMDB ID is missing
function simklToMedia(
  item: SimklTrendingItem,
  mediaType: "movie" | "tv",
  index: number
): Media {
  const simklPosterUrl = item.poster
    ? `https://simkl.in/posters/${item.poster}_m.webp`
    : undefined;

  // Use Simkl ID as primary, TMDB as fallback, with index for uniqueness
  const uniqueId = item.ids.tmdb || item.ids.simkl || index + 1000000;

  return {
    id: uniqueId,
    title: item.title,
    name: item.title,
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
    .map((item, index) => simklToMedia(item, mediaType, index));

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
