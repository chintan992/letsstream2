import React from "react";
import { m } from "motion/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchHistory } from "@/hooks/watch-history";
import { useToast } from "@/hooks/use-toast";
import MediaGrid from "@/components/MediaGrid";
import { HistoryEmptyState } from "@/components/history";

const HistoryTab: React.FC = () => {
  const { watchHistory, deleteWatchHistoryItem, clearWatchHistory } =
    useWatchHistory();
  const { toast } = useToast();

  // Convert watch history entries to the ExtendedMedia shape MediaGrid expects
  const historyMedia = watchHistory.map(item => ({
    id: item.id,
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    custom_poster_url: item.custom_poster_url,
    backdrop_path: item.backdrop_path,
    overview: item.overview || "",
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    docId: item.id,
    created_at: item.created_at,
    watch_position: item.watch_position,
    duration: item.duration,
    season: item.season,
    episode: item.episode,
    last_watched_at: item.last_watched_at,
    episodes_watched: item.episodes_watched,
  }));

  const handleRemoveItem = async (docId: string) => {
    try {
      await deleteWatchHistoryItem(docId);
      toast({
        title: "Removed from history",
        description: "This title has been removed from your watch history.",
      });
    } catch (error) {
      console.error("Failed to remove watch history item:", error);
      toast({
        title: "Error",
        description: "Failed to remove this item from your watch history.",
        variant: "destructive",
      });
    }
  };

  const handleClearHistory = async () => {
    if (watchHistory.length === 0) return;

    try {
      await clearWatchHistory();
      toast({
        title: "History cleared",
        description: "Your watch history has been cleared.",
      });
    } catch (error) {
      console.error("Failed to clear watch history:", error);
      toast({
        title: "Error",
        description: "Failed to clear your watch history.",
        variant: "destructive",
      });
    }
  };

  if (historyMedia.length === 0) {
    return <HistoryEmptyState type="history" />;
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Your Watch History</h2>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearHistory}
          className="border-white/20 bg-black/50 text-white hover:bg-black/70"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      <MediaGrid
        media={historyMedia}
        listView={true}
        onDelete={docId => handleRemoveItem(docId)}
      />
    </m.div>
  );
};

export default HistoryTab;
