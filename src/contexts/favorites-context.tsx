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

const pendingFavoriteAdds = new Set<string>();
import { RateLimiter } from "@/utils/rate-limiter";

const deleteRateLimiter = RateLimiter.getInstance(50, 50 / 300);

export interface FavoriteItem {
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

export interface FavoritesContextType {
  favorites: FavoriteItem[];
  isLoading: boolean;
  addToFavorites: (item: MediaBaseItem) => Promise<void>;
  removeFromFavorites: (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => Promise<void>;
  isInFavorites: (mediaId: number, mediaType: "movie" | "tv") => boolean;
  deleteFavoriteItem: (id: string) => Promise<void>;
  deleteSelectedFavorites: (ids: string[]) => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const favoritesRef = collection(db, "favorites");
      const favoritesQuery = query(
        favoritesRef,
        where("user_id", "==", user.uid),
        orderBy("added_at", "desc")
      );

      const snapshot = await getDocs(favoritesQuery);
      const favoritesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FavoriteItem[];

      setFavorites(favoritesData);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addToFavorites = async (item: MediaBaseItem) => {
    if (!user) {
      console.log("Cannot add to favorites: User not authenticated");
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your favorites.",
        variant: "destructive",
      });
      return;
    }

    const addKey = `${user.uid}:${item.media_type}:${item.media_id}`;
    if (pendingFavoriteAdds.has(addKey)) return;
    pendingFavoriteAdds.add(addKey);

    try {
      console.log("Adding to favorites:", item);
      const newItem: FavoriteItem = {
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

      if (
        favorites.some(
          favorite =>
            favorite.media_id === item.media_id &&
            favorite.media_type === item.media_type
        )
      ) {
        return;
      }

      console.log("Saving favorite to Firestore:", newItem);
      const favoriteRef = doc(db, "favorites", newItem.id);
      await setDoc(favoriteRef, newItem);

      console.log("Favorite saved successfully");
      setFavorites(current => {
        if (
          current.some(
            favorite =>
              favorite.media_id === item.media_id &&
              favorite.media_type === item.media_type
          )
        ) {
          return current;
        }
        return [newItem, ...current];
      });

      // Analytics event
      trackEvent({
        name: "favorites_add",
        params: {
          media_type: item.media_type,
          media_id: String(item.media_id),
          title: item.title,
        },
      });

      toast({
        title: "Added to favorites",
        description: `${item.title} has been added to your favorites.`,
      });
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast({
        title: "Error adding to favorites",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem adding to your favorites.",
        variant: "destructive",
      });
    } finally {
      pendingFavoriteAdds.delete(addKey);
    }
  };

  const removeFromFavorites = async (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => {
    if (!user) return;

    try {
      const itemToRemove = favorites.find(
        item => item.media_id === mediaId && item.media_type === mediaType
      );

      if (itemToRemove) {
        const favoriteRef = doc(db, "favorites", itemToRemove.id);
        await deleteDoc(favoriteRef);

        setFavorites(current =>
          current.filter(
            item =>
              !(item.media_id === mediaId && item.media_type === mediaType)
          )
        );
      }
      // Analytics event
      trackEvent({
        name: "favorites_remove",
        params: {
          media_type: mediaType,
          media_id: String(mediaId),
        },
      });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast({
        title: "Error removing from favorites",
        description: "There was a problem removing from your favorites.",
        variant: "destructive",
      });
    }
  };

  const isInFavorites = (
    mediaId: number,
    mediaType: "movie" | "tv"
  ): boolean => {
    return favorites.some(
      item => item.media_id === mediaId && item.media_type === mediaType
    );
  };

  const deleteFavoriteItem = async (id: string) => {
    if (!user) return;

    try {
      const canExecute = await deleteRateLimiter.canExecute();
      if (!canExecute) {
        console.log("Delete rate limit exceeded. Skipping Firestore delete.");
        return;
      }

      const favoriteRef = doc(db, "favorites", id);
      await deleteDoc(favoriteRef);

      setFavorites(current => current.filter(item => item.id !== id));

      toast({
        title: "Item removed",
        description: "The item has been removed from your favorites.",
      });
    } catch (error) {
      console.error("Error deleting favorite item:", error);
      toast({
        title: "Error removing item",
        description:
          "There was a problem removing the item from your favorites.",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedFavorites = async (ids: string[]) => {
    if (!user || ids.length === 0) return;

    const committedIds: string[] = [];
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
        const batchIds = ids.slice(index, index + 500);
        const batch = writeBatch(db);
        batchIds.forEach(id => {
          batch.delete(doc(db, "favorites", id));
        });
        await batch.commit();
        committedIds.push(...batchIds);
      }

      setFavorites(current => current.filter(item => !ids.includes(item.id)));

      toast({
        title: "Items removed",
        description: `${ids.length} ${ids.length === 1 ? "item has" : "items have"} been removed from your favorites.`,
      });
    } catch (error) {
      console.error("Error deleting favorite items:", error);
      if (committedIds.length > 0) {
        setFavorites(current =>
          current.filter(item => !committedIds.includes(item.id))
        );
      }
      toast({
        title: "Error removing items",
        description:
          "There was a problem removing the items from your favorites.",
        variant: "destructive",
      });
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        addToFavorites,
        removeFromFavorites,
        isInFavorites,
        deleteFavoriteItem,
        deleteSelectedFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
