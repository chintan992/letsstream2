import { createContext } from "react";
import { Media } from "@/utils/types";

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview?: string;
  rating?: number;
  // For movies: these remain as is
  // For TV shows: these track the latest episode watched
  season?: number;
  episode?: number;
  last_watched_at?: string; // Timestamp of latest episode watched
  // Progress tracking for the latest episode
  watch_position: number;
  duration: number;
  // For TV shows: track all episodes watched
  episodes_watched?: Array<{
    season: number;
    episode: number;
    watch_position: number;
    duration: number;
    watched_at: string;
  }>;
  created_at: string;
  preferred_source: string;
}

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

export interface WatchHistoryContextType {
  watchHistory: WatchHistoryItem[];
  favorites: FavoriteItem[];
  watchlist: WatchlistItem[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => Promise<void>;
  addToWatchHistory: (
    media: Media,
    position: number,
    duration: number,
    season?: number,
    episode?: number,
    preferredSource?: string
  ) => Promise<void>;
  updateWatchPosition: (
    mediaId: number,
    mediaType: "movie" | "tv",
    position: number,
    season?: number,
    episode?: number
  ) => Promise<void>;
  clearWatchHistory: () => Promise<void>;
  deleteWatchHistoryItem: (id: string) => Promise<void>;
  deleteSelectedWatchHistory: (ids: string[]) => Promise<void>;
  deleteFavoriteItem: (id: string) => Promise<void>;
  deleteSelectedFavorites: (ids: string[]) => Promise<void>;
  deleteWatchlistItem: (id: string) => Promise<void>;
  deleteSelectedWatchlist: (ids: string[]) => Promise<void>;
  addToFavorites: (item: MediaBaseItem) => Promise<void>;
  removeFromFavorites: (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => Promise<void>;
  isInFavorites: (mediaId: number, mediaType: "movie" | "tv") => boolean;
  addToWatchlist: (item: MediaBaseItem) => Promise<void>;
  removeFromWatchlist: (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => Promise<void>;
  isInWatchlist: (mediaId: number, mediaType: "movie" | "tv") => boolean;
}

export const WatchHistoryContext = createContext<
  WatchHistoryContextType | undefined
>(undefined);
