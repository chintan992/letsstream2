import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface FavoriteMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  addedAt: number;
}

const STORAGE_KEY = "sports-favorite-matches";

function readStorage(): FavoriteMatch[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      item =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id !== "undefined" &&
        (typeof item.date === "number" || !isNaN(Date.parse(item.date)))
    );
  } catch (error) {
    console.error("Error loading favorite matches:", error);
    return [];
  }
}

/**
 * Favourites live in a module-level store rather than per-hook state: the cards,
 * the sports page and the tab counter all read the same list, so favouriting a
 * card updates every one of them (and other tabs) without a reload.
 */
let favorites: FavoriteMatch[] =
  typeof window === "undefined" ? [] : readStorage();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => favorites;

function commit(next: FavoriteMatch[]) {
  favorites = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error saving favorite matches:", error);
  }
  emit();
}

export const useFavoriteMatches = () => {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Keep other tabs/windows in step.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      favorites = readStorage();
      emit();
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isFavorite = useCallback(
    (matchId: string) => current.some(favorite => favorite.id === matchId),
    [current]
  );

  const addFavorite = useCallback(
    (match: { id: string; title: string; category: string; date: number }) => {
      if (favorites.some(favorite => favorite.id === match.id)) return;
      commit([...favorites, { ...match, addedAt: Date.now() }]);
    },
    []
  );

  const removeFavorite = useCallback((matchId: string) => {
    commit(favorites.filter(favorite => favorite.id !== matchId));
  }, []);

  const toggleFavorite = useCallback(
    (match: { id: string; title: string; category: string; date: number }) => {
      if (favorites.some(favorite => favorite.id === match.id)) {
        commit(favorites.filter(favorite => favorite.id !== match.id));
      } else {
        commit([...favorites, { ...match, addedAt: Date.now() }]);
      }
    },
    []
  );

  const clearFavorites = useCallback(() => commit([]), []);

  const cleanupOldFavorites = useCallback(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    commit(favorites.filter(favorite => favorite.date > sevenDaysAgo));
  }, []);

  return {
    favorites: current,
    isLoading: false,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    cleanupOldFavorites,
  };
};
