import {
  History,
  Heart,
  Bookmark,
  Cloud,
  Clock,
  Trash2,
  ArrowLeftRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WatchHistoryHeaderProps {
  activeTab: "history" | "favorites" | "watchlist" | "simkl";
  sortOrder: "newest" | "oldest";
  onSortOrderChange: () => void;
  onClearHistory: () => void;
  showClearButton: boolean;
  isSimklEnabled: boolean;
  isSyncing: boolean;
  onSync: () => void;
  lastSyncResult: {
    imported: number;
    exported: number;
    merged: number;
    syncedAt: Date;
  } | null;
  isLoadingSimkl?: boolean;
  onRefreshSimkl?: () => void;
}

const WatchHistoryHeader = ({
  activeTab,
  sortOrder,
  onSortOrderChange,
  onClearHistory,
  showClearButton,
  isSimklEnabled,
  isSyncing,
  onSync,
  lastSyncResult,
  isLoadingSimkl,
  onRefreshSimkl,
}: WatchHistoryHeaderProps) => {
  const getTitle = () => {
    switch (activeTab) {
      case "history":
        return "Your Watch History";
      case "favorites":
        return "Your Favorites";
      case "watchlist":
        return "Your Watchlist";
      case "simkl":
        return "Simkl Watch History";
      default:
        return "Your Content";
    }
  };

  const getIcon = () => {
    switch (activeTab) {
      case "history":
        return <History className="mr-3 h-6 w-6 text-accent" />;
      case "favorites":
        return <Heart className="mr-3 h-6 w-6 text-accent" />;
      case "watchlist":
        return <Bookmark className="mr-3 h-6 w-6 text-accent" />;
      case "simkl":
        return <Cloud className="mr-3 h-6 w-6 text-accent" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center">
        {getIcon()}
        <h1 className="text-2xl font-bold text-white">{getTitle()}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeTab === "history" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSortOrderChange}
            className="border-white/20 bg-black/50 text-white hover:bg-black/70"
          >
            <Clock className="mr-2 h-4 w-4" />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </Button>
        )}

        {activeTab === "history" && showClearButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            className="border-white/20 bg-black/50 text-white hover:bg-black/70"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        )}

        {isSimklEnabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSync}
                  disabled={isSyncing}
                  className="border-purple-500/50 bg-purple-500/20 text-white hover:bg-purple-500/30"
                >
                  <ArrowLeftRight
                    className={`mr-2 h-4 w-4 ${isSyncing ? "animate-pulse" : ""}`}
                  />
                  {isSyncing ? "Syncing..." : "Sync with Simkl"}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-white/20 bg-black/90 text-white"
              >
                {lastSyncResult ? (
                  <div className="text-sm">
                    <p className="mb-1 font-medium">
                      Last sync: {lastSyncResult.syncedAt.toLocaleTimeString()}
                    </p>
                    <p>↓ Imported: {lastSyncResult.imported}</p>
                    <p>↑ Exported: {lastSyncResult.exported}</p>
                    <p>⟷ Merged: {lastSyncResult.merged}</p>
                  </div>
                ) : (
                  <p className="text-sm">
                    Sync watch history with Simkl (both ways)
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {activeTab === "simkl" && isSimklEnabled && onRefreshSimkl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshSimkl}
            disabled={isLoadingSimkl || isSyncing}
            className="border-white/20 bg-black/50 text-white hover:bg-black/70"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoadingSimkl ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
};

export default WatchHistoryHeader;
