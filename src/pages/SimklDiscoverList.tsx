import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { SimklService, SimklTrendingItem } from "@/lib/simkl";
import { useUserPreferences } from "@/contexts/user-preferences";
import { Media } from "@/utils/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaGrid from "@/components/MediaGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Category configuration
const CATEGORY_CONFIG: Record<
  string,
  {
    title: string;
    apiCall: (filters?: Record<string, string>) => Promise<SimklTrendingItem[]>;
    mediaType: "movie" | "tv";
    icon: React.ReactNode;
    color: string;
  }
> = {
  "trending-movies": {
    title: "Trending Movies",
    apiCall: filters => SimklService.getTrending("movies", filters),
    mediaType: "movie",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-red-400",
  },
  "trending-tv": {
    title: "Trending TV Shows",
    apiCall: filters => SimklService.getTrending("tv", filters),
    mediaType: "tv",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-blue-400",
  },
  "trending-anime": {
    title: "Trending Anime",
    apiCall: filters => SimklService.getTrending("anime", filters),
    mediaType: "tv",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-pink-400",
  },
};

// Convert Simkl item to Media format
// Uses index to ensure unique keys when IDs are missing
function simklToMedia(
  item: SimklTrendingItem,
  mediaType: "movie" | "tv",
  index: number
): Media & { media_id: number } {
  const simklPosterUrl = item.poster
    ? `https://simkl.in/posters/${item.poster}_m.webp`
    : undefined;

  // Use Simkl ID as primary, TMDB as fallback, index for uniqueness
  const uniqueId = item.ids.simkl || item.ids.tmdb || index;

  return {
    id: uniqueId,
    media_id: typeof uniqueId === "number" ? uniqueId : index,
    title: item.title,
    name: item.title,
    media_type: mediaType,
    poster_path: null,
    backdrop_path: item.fanart
      ? `https://simkl.in/fanart/${item.fanart}_w.webp`
      : null,
    overview: item.overview || "",
    vote_average:
      item.ratings?.simkl?.rating || item.ratings?.imdb?.rating || 0,
    release_date: item.year?.toString(),
    first_air_date: item.year?.toString(),
    custom_poster_url: simklPosterUrl,
    genre_ids: [],
  };
}

const SimklDiscoverList = () => {
  const { category } = useParams<{ category: string }>();
  const { userPreferences } = useUserPreferences();
  const [fetchState, setFetchState] = useState<{
    items: SimklTrendingItem[];
    isLoading: boolean;
  }>({
    items: [],
    isLoading: true,
  });
  const { items, isLoading } = fetchState;

  const config = category ? CATEGORY_CONFIG[category] : null;

  useEffect(() => {
    const fetchContent = async () => {
      // Always show loading state for clarity
      if (!config && category !== "recommendations") return;

      setFetchState({ items: [], isLoading: true });
      try {
        let data: SimklTrendingItem[] = [];
        if (category === "recommendations" && userPreferences.simklToken) {
          const [recMovies, recTV, recAnime] = await Promise.all([
            SimklService.getRecommendations(
              userPreferences.simklToken,
              "movies"
            ),
            SimklService.getRecommendations(userPreferences.simklToken, "tv"),
            SimklService.getRecommendations(
              userPreferences.simklToken,
              "anime"
            ),
          ]);
          const moviesWithType = recMovies.map(item => ({
            ...item,
            __mediaType: "movie" as const,
          }));
          const tvWithType = recTV.map(item => ({
            ...item,
            __mediaType: "tv" as const,
          }));
          const animeWithType = recAnime.map(item => ({
            ...item,
            __mediaType: "tv" as const,
          }));
          data = [...moviesWithType, ...tvWithType, ...animeWithType];
        } else if (config?.apiCall) {
          data = await config.apiCall();
        }
        setFetchState({ items: data, isLoading: false });
      } catch (error) {
        console.error("Error fetching Simkl content:", error);
        setFetchState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchContent();
  }, [category, config, userPreferences.simklToken]);

  const media = useMemo(() => {
    if (!config) {
      if (category === "recommendations") {
        return items.map((item, index) => {
          const mediaType = (item as any).__mediaType || "movie";
          return simklToMedia(item, mediaType, index);
        });
      }
      return [];
    }
    return items.map((item, index) =>
      simklToMedia(item, config.mediaType, index)
    );
  }, [items, config, category]);

  if (!config && category !== "recommendations") {
    return (
      <main className="flex min-h-screen w-full flex-col bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 text-center">
          <h1 className="text-2xl font-bold text-white">Category not found</h1>
          <Link
            to="/simkl"
            className="mt-4 block text-blue-400 hover:underline"
          >
            Back to Simkl Discover
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const title =
    category === "recommendations"
      ? "Recommended For You"
      : config?.title || "";
  const icon =
    category === "recommendations" ? (
      <Sparkles className="h-6 w-6 text-purple-400" />
    ) : (
      config?.icon
    );
  const iconColor =
    category === "recommendations" ? "text-purple-400" : config?.color;

  return (
    <main className="flex min-h-screen min-h-svh w-full flex-col overflow-x-hidden bg-background">
      <Navbar />

      <div className="flex w-full flex-1 flex-col items-stretch justify-start pt-20">
        {/* Header */}
        <div className="container mx-auto mb-8 px-6 md:px-10 lg:px-16">
          <Link to="/simkl">
            <Button
              variant="ghost"
              className="mb-4 text-white/60 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Discover
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className={iconColor}>{icon}</div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
          </div>
          <p className="mt-2 text-sm text-white/60">
            {isLoading
              ? ""
              : items.length > 0
                ? `${items.length} items from Simkl`
                : ""}
          </p>
          {category === "recommendations" &&
            !userPreferences.simklToken &&
            !isLoading && (
              <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/10 p-6 text-center">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                <p className="text-white">
                  Connect your Simkl account to see personalized recommendations
                </p>
                <Link to="/settings">
                  <Button variant="link" className="mt-2 text-purple-400">
                    Connect Simkl Account
                  </Button>
                </Link>
              </div>
            )}
        </div>

        {/* Content Grid */}
        <div className="container mx-auto px-6 md:px-10 lg:px-16">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
              ))}
            </div>
          ) : (
            <MediaGrid media={media as any} />
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default SimklDiscoverList;
