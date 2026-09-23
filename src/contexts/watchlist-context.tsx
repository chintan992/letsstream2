import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/hooks";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateId } from "@/utils/supabase";
import { Media } from "@/utils/types";
import { useToast } from "@/components/ui/use-toast";
import { RateLimiter } from "@/utils/rate-limiter";

const deleteRateLimiter = RateLimiter.getInstance(50, 300000);

export interface WatchlistItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview?: string;
  rating?: number;
  added_at: string;
}

export interface MediaBaseItem {
  media_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview?: string;
  rating?: number;
}

export interface WatchlistContextType {
  watchlist: WatchlistItem[];
  isLoading: boolean;
  addToWatchlist: (item: MediaBaseItem) => Promise<void>;
  removeFromWatchlist: (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => Promise<void>;
  isInWatchlist: (mediaId: number, mediaType: "movie" | "tv") => boolean;
  deleteWatchlistItem: (id: string) => Promise<void>;
  deleteSelectedWatchlist: (ids: string[]) => Promise<void>;
}

export const WatchlistContext = createContext<WatchlistContextType | undefined>(
  undefined
);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const watchlistRef = collection(db, "watchlist");
      const watchlistQuery = query(
        watchlistRef,
        where("user_id", "==", user.uid),
        orderBy("added_at", "desc")
      );

      const snapshot = await getDocs(watchlistQuery);
      const watchlistData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WatchlistItem[];

      setWatchlist(watchlistData);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = async (item: MediaBaseItem) => {
    if (!user) {
      console.log("Cannot add to watchlist: User not authenticated");
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your watchlist.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Adding to watchlist:", item);
      const existingItem = watchlist.find(
        watch =>
          watch.media_id === item.media_id &&
          watch.media_type === item.media_type
      );

      if (existingItem) {
        console.log("Item already in watchlist:", existingItem);
        return;
      }

      const newItem: WatchlistItem = {
        id: generateId(),
        user_id: user.uid,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        rating: item.rating,
        added_at: new Date().toISOString(),
      };

      console.log("Saving watchlist item to Firestore:", newItem);
      const watchlistRef = doc(db, "watchlist", newItem.id);
      await setDoc(watchlistRef, newItem);

      console.log("Watchlist item saved successfully");
      const updatedWatchlist = [newItem, ...watchlist];
      setWatchlist(updatedWatchlist);

      // Analytics event
      trackEvent({
        name: "watchlist_add",
        params: {
          media_type: item.media_type,
          media_id: String(item.media_id),
          title: item.title,
        },
      });

      toast({
        title: "Added to watchlist",
        description: `${item.title} has been added to your watchlist.`,
      });
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast({
        title: "Error adding to watchlist",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem adding to your watchlist.",
        variant: "destructive",
      });
    }
  };

  const removeFromWatchlist = async (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => {
    if (!user) return;

    try {
      const itemToRemove = watchlist.find(
        item => item.media_id === mediaId && item.media_type === mediaType
      );

      if (itemToRemove) {
        const watchlistRef = doc(db, "watchlist", itemToRemove.id);
        await deleteDoc(watchlistRef);

        const updatedWatchlist = watchlist.filter(
          item => !(item.media_id === mediaId && item.media_type === mediaType)
        );
        setWatchlist(updatedWatchlist);
      }
      // Analytics event
      trackEvent({
        name: "watchlist_remove",
        params: {
          media_type: mediaType,
          media_id: String(mediaId),
        },
      });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast({
        title: "Error removing from watchlist",
        description: "There was a problem removing from your watchlist.",
        variant: "destructive",
      });
    }
  };

  const isInWatchlist = (
    mediaId: number,
    mediaType: "movie" | "tv"
  ): boolean => {
    return watchlist.some(
      item => item.media_id === mediaId && item.media_type === mediaType
    );
  };

  const deleteWatchlistItem = async (id: string) => {
    if (!user) return;

    try {
      const canExecute = await deleteRateLimiter.canExecute();
      if (!canExecute) {
        console.log("Delete rate limit exceeded. Skipping Firestore delete.");
        return;
      }

      const watchlistRef = doc(db, "watchlist", id);
      await deleteDoc(watchlistRef);

      const updatedWatchlist = watchlist.filter(item => item.id !== id);
      setWatchlist(updatedWatchlist);

      toast({
        title: "Item removed",
        description: "The item has been removed from your watchlist.",
      });
    } catch (error) {
      console.error("Error deleting watchlist item:", error);
      toast({
        title: "Error removing item",
        description:
          "There was a problem removing the item from your watchlist.",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedWatchlist = async (ids: string[]) => {
    if (!user || ids.length === 0) return;

    try {
      const canExecute = await deleteRateLimiter.canExecute();
      if (!canExecute) {
        console.log("Delete rate limit exceeded. Please try again later.");
        toast({
          title: "Rate limit exceeded",
          description:
            "Too many operations in a short time. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      for (let index = 0; index < ids.length; index += 500) {
        const batch = writeBatch(db);
        ids.slice(index, index + 500).forEach(id => {
          batch.delete(doc(db, "watchlist", id));
        });
        await batch.commit();
      }

      const updatedWatchlist = watchlist.filter(item => !ids.includes(item.id));
      setWatchlist(updatedWatchlist);

      toast({
        title: "Items removed",
        description: `${ids.length} ${ids.length === 1 ? "item has" : "items have"} been removed from your watchlist.`,
      });
    } catch (error) {
      console.error("Error deleting watchlist items:", error);
      toast({
        title: "Error removing items",
        description:
          "There was a problem removing the items from your watchlist.",
        variant: "destructive",
      });
    }
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        deleteWatchlistItem,
        deleteSelectedWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
