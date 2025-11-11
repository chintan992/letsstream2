import React from "react";
import { motion } from "framer-motion";
import { Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchHistory } from "@/hooks/watch-history";
import { useToast } from "@/hooks/use-toast";
import MediaGrid from "@/components/MediaGrid";

const WatchlistTab: React.FC = () => {
  const { watchlist, removeFromWatchlist, deleteSelectedWatchlist } =
    useWatchHistory();
  const { toast } = useToast();

  // Convert watchlist to ExtendedMedia format for MediaGrid
  const watchlistMedia = watchlist.map(item => ({
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

  const handleRemoveFromWatchlist = async (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => {
    try {
      await removeFromWatchlist(mediaId, mediaType);
      toast({
        title: "Removed from watchlist",
        description: "Item has been removed from your watchlist.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from watchlist.",
        variant: "destructive",
      });
    }
  };

  const handleClearAllWatchlist = async () => {
    if (watchlist.length === 0) return;

    try {
      const ids = watchlist.map(item => item.id);
      await deleteSelectedWatchlist(ids);
      toast({
        title: "Watchlist cleared",
        description: "All items have been removed from your watchlist.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear watchlist.",
        variant: "destructive",
      });
    }
  };

  if (watchlist.length === 0) {
    return (
      <motion.div
        className="glass rounded-lg p-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Bookmark className="mx-auto mb-4 h-12 w-12 text-white/50" />
        <h3 className="mb-2 text-lg font-medium text-white">
          No items in watchlist
        </h3>
        <p className="mb-4 text-white/70">
          Add movies and shows to your watchlist to keep track of what you want
          to watch.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Your Watchlist</h2>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAllWatchlist}
          className="border-white/20 bg-black/50 text-white hover:bg-black/70"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      <MediaGrid
        media={watchlistMedia}
        listView={true}
        onDelete={docId => {
          const item = watchlist.find(w => w.id === docId);
          if (item) {
            handleRemoveFromWatchlist(item.media_id, item.media_type);
          }
        }}
      />
    </motion.div>
  );
};

export default WatchlistTab;
