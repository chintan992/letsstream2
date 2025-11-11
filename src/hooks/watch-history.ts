import { useContext } from "react";
import { WatchHistoryContext } from "@/contexts/types/watch-history";

export function useWatchHistory() {
  const context = useContext(WatchHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useWatchHistory must be used within a WatchHistoryProvider"
    );
  }
  return context;
}
