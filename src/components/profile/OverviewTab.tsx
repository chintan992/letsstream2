import React from "react";
import { m } from "framer-motion";
import { TrendingUp, Clock, Star, Heart, Bookmark, Play } from "lucide-react";
import { useProfileData } from "@/hooks/useProfileData";
import { useWatchHistory } from "@/hooks/watch-history";
import MediaGrid from "@/components/MediaGrid";

const OverviewTab: React.FC = () => {
  const { watchHistoryMedia, favorites, watchlist, profileStats } =
    useProfileData();
  const { hasMore, isLoading, loadMore } = useWatchHistory();

  // Get recent watch history (last 5 items) and convert to ExtendedMedia
  const recentWatchHistory = watchHistoryMedia.slice(0, 5).map(item => ({
    ...item,
    id: item.id.toString(),
    media_id: item.media_id || (item.id as number),
    docId: item.id.toString(),
  }));

  // Get recent favorites (last 5 items)
  const recentFavorites = favorites.slice(0, 5).map(item => ({
    id: item.id,
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || "",
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    docId: item.id,
    created_at: item.added_at,
  }));

  const quickStats = [
    {
      icon: Play,
      label: "Recently Watched",
      value: watchHistoryMedia.length.toString(),
      color: "text-blue-400",
    },
    {
      icon: Heart,
      label: "Favorites",
      value: favorites.length.toString(),
      color: "text-red-400",
    },
    {
      icon: Bookmark,
      label: "Watchlist",
      value: watchlist.length.toString(),
      color: "text-green-400",
    },
    {
      icon: Clock,
      label: "Watch Time",
      value: `${Math.floor(profileStats.totalWatchTime / 60)}h`,
      color: "text-purple-400",
    },
  ];

  return (
    <m.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {quickStats.map((stat, index) => (
          <m.div
            key={stat.label}
            className="glass rounded-lg p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <stat.icon className={`mx-auto mb-2 h-8 w-8 ${stat.color}`} />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-white/70">{stat.label}</div>
          </m.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        {/* Recent Watch History */}
        {recentWatchHistory.length > 0 && (
          <div>
            <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
              <Play className="mr-2 h-5 w-5 text-blue-400" />
              Recently Watched
            </h3>
            <MediaGrid media={recentWatchHistory} listView={false} />
          </div>
        )}

        {/* Recent Favorites */}
        {recentFavorites.length > 0 && (
          <div>
            <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
              <Heart className="mr-2 h-5 w-5 text-red-400" />
              Recent Favorites
            </h3>
            <MediaGrid media={recentFavorites} listView={false} />
          </div>
        )}

        {/* Watchlist Preview */}
        {watchlist.length > 0 && (
          <div>
            <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
              <Bookmark className="mr-2 h-5 w-5 text-green-400" />
              From Your Watchlist
            </h3>
            <MediaGrid
              media={watchlist.slice(0, 5).map(item => ({
                id: item.id,
                media_id: item.media_id,
                title: item.title,
                name: item.title,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                overview: item.overview || "",
                vote_average: item.rating || 0,
                media_type: item.media_type,
                genre_ids: [],
                docId: item.id,
                created_at: item.added_at,
              }))}
              listView={false}
            />
          </div>
        )}
      </div>

      {/* Empty State */}
      {watchHistoryMedia.length === 0 &&
        favorites.length === 0 &&
        watchlist.length === 0 && (
          <m.div
            className="glass rounded-lg p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/50" />
            <h3 className="mb-2 text-lg font-medium text-white">
              Welcome to your profile!
            </h3>
            <p className="text-white/70">
              Start watching movies and shows to see your activity, favorites,
              and recommendations here.
            </p>
          </m.div>
        )}
    </m.div>
  );
};

export default OverviewTab;
