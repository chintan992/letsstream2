import React from "react";
import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchHistory } from "@/hooks/watch-history";
import { useToast } from "@/hooks/use-toast";
import MediaGrid from "@/components/MediaGrid";
import { Media } from "@/utils/types";

const FavoritesTab: React.FC = () => {
  const { favorites, removeFromFavorites, deleteSelectedFavorites } =
    useWatchHistory();
  const { toast } = useToast();

  // Convert favorites to ExtendedMedia format for MediaGrid
  const favoritesMedia = favorites.map(item => ({
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

  const handleRemoveFavorite = async (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => {
    try {
      await removeFromFavorites(mediaId, mediaType);
      toast({
        title: "Removed from favorites",
        description: "Item has been removed from your favorites.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from favorites.",
        variant: "destructive",
      });
    }
  };

  const handleClearAllFavorites = async () => {
    if (favorites.length === 0) return;

    try {
      const ids = favorites.map(fav => fav.id);
      await deleteSelectedFavorites(ids);
      toast({
        title: "Favorites cleared",
        description: "All items have been removed from your favorites.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear favorites.",
        variant: "destructive",
      });
    }
  };

  if (favorites.length === 0) {
    return (
      <motion.div
        className="glass rounded-lg p-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Heart className="mx-auto mb-4 h-12 w-12 text-white/50" />
        <h3 className="mb-2 text-lg font-medium text-white">
          No favorites yet
        </h3>
        <p className="mb-4 text-white/70">
          Start adding movies and shows to your favorites to see them here.
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
        <h2 className="text-xl font-semibold text-white">Your Favorites</h2>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAllFavorites}
          className="border-white/20 bg-black/50 text-white hover:bg-black/70"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      <MediaGrid
        media={favoritesMedia}
        listView={true}
        onDelete={docId => {
          const favorite = favorites.find(f => f.id === docId);
          if (favorite) {
            handleRemoveFavorite(favorite.media_id, favorite.media_type);
          }
        }}
      />
    </motion.div>
  );
};

export default FavoritesTab;
