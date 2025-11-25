import { useState, useEffect } from "react";

interface FavoriteMatch {
    id: string;
    title: string;
    category: string;
    date: number;
    addedAt: number;
}

const STORAGE_KEY = "sports-favorite-matches";

export const useFavoriteMatches = () => {
    const [favorites, setFavorites] = useState<FavoriteMatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load favorites from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setFavorites(parsed);
            }
        } catch (error) {
            console.error("Error loading favorite matches:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
            } catch (error) {
                console.error("Error saving favorite matches:", error);
            }
        }
    }, [favorites, isLoading]);

    const addFavorite = (match: {
        id: string;
        title: string;
        category: string;
        date: number;
    }) => {
        setFavorites(prev => {
            // Check if already favorited
            if (prev.some(fav => fav.id === match.id)) {
                return prev;
            }

            return [
                ...prev,
                {
                    ...match,
                    addedAt: Date.now(),
                },
            ];
        });
    };

    const removeFavorite = (matchId: string) => {
        setFavorites(prev => prev.filter(fav => fav.id !== matchId));
    };

    const toggleFavorite = (match: {
        id: string;
        title: string;
        category: string;
        date: number;
    }) => {
        if (isFavorite(match.id)) {
            removeFavorite(match.id);
        } else {
            addFavorite(match);
        }
    };

    const isFavorite = (matchId: string): boolean => {
        return favorites.some(fav => fav.id === matchId);
    };

    const clearFavorites = () => {
        setFavorites([]);
    };

    // Clean up old favorites (matches that have passed by more than 7 days)
    const cleanupOldFavorites = () => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setFavorites(prev => prev.filter(fav => fav.date > sevenDaysAgo));
    };

    return {
        favorites,
        isLoading,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        cleanupOldFavorites,
    };
};
