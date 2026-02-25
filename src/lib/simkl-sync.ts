/**
 * Simkl Bidirectional Sync Service
 * Handles automatic sync between Firebase watch history and Simkl
 *
 * Sync Strategy:
 * - Automatic sync on app load when Simkl is connected
 * - Merge conflict resolution: keep whichever has more watch progress
 */

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { SimklService, SimklListItem, getLastWatchedEpisode } from "./simkl";
import { WatchHistoryItem } from "@/contexts/types/watch-history";
import { getMovieDetails, getTVDetails } from "@/utils/api";

interface SyncResult {
  imported: number;
  exported: number;
  merged: number;
  errors: string[];
}

interface SyncState {
  lastSyncAt: string | null;
  isSyncing: boolean;
  lastResult: SyncResult | null;
}

/**
 * Performs bidirectional sync between Firebase and Simkl
 */
export async function performBidirectionalSync(
  userId: string,
  simklToken: string
): Promise<SyncResult> {
  const result: SyncResult = {
    imported: 0,
    exported: 0,
    merged: 0,
    errors: [],
  };

  try {
    // Step 1: Fetch data from both sources
    const [firebaseHistory, simklHistory] = await Promise.all([
      fetchFirebaseWatchHistory(userId),
      SimklService.getFullWatchHistory(simklToken),
    ]);

    // Combine Simkl items
    const allSimklItems = [
      ...simklHistory.movies,
      ...simklHistory.shows,
      ...simklHistory.anime,
    ];

    // Step 2: Import from Simkl to Firebase (items not in Firebase)
    const importResult = await importFromSimkl(
      userId,
      allSimklItems,
      firebaseHistory
    );
    result.imported = importResult.imported;
    result.merged += importResult.merged;
    result.errors.push(...importResult.errors);

    // Step 3: Export from Firebase to Simkl (items not in Simkl)
    const exportResult = await exportToSimkl(
      simklToken,
      firebaseHistory,
      allSimklItems
    );
    result.exported = exportResult.exported;
    result.errors.push(...exportResult.errors);
  } catch (error) {
    result.errors.push(
      `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

/**
 * Fetch watch history from Firebase for a user
 */
async function fetchFirebaseWatchHistory(
  userId: string
): Promise<WatchHistoryItem[]> {
  const historyRef = collection(db, "watchHistory");
  const q = query(historyRef, where("user_id", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    doc =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as WatchHistoryItem
  );
}

/**
 * Import items from Simkl to Firebase
 * Uses merge strategy: keep whichever has more progress
 */
async function importFromSimkl(
  userId: string,
  simklItems: SimklListItem[],
  firebaseHistory: WatchHistoryItem[]
): Promise<{ imported: number; merged: number; errors: string[] }> {
  const result = { imported: 0, merged: 0, errors: [] as string[] };

  for (const simklItem of simklItems) {
    try {
      const media = simklItem.movie || simklItem.show || simklItem.anime;
      if (!media) continue;

      const tmdbId = media.ids?.tmdb;
      const isMovie = !!simklItem.movie;
      const mediaType = isMovie ? "movie" : "tv";

      // Find matching item in Firebase
      const existingItem = firebaseHistory.find(
        item => item.media_id === tmdbId && item.media_type === mediaType
      );

      if (existingItem) {
        // Merge: check which has more progress
        const shouldUpdate = shouldSimklOverwrite(simklItem, existingItem);
        if (shouldUpdate) {
          await mergeSimklToFirebase(userId, simklItem, existingItem);
          result.merged++;
        }
      } else if (tmdbId) {
        // Import: item doesn't exist in Firebase
        await createFirebaseItemFromSimkl(userId, simklItem, tmdbId, mediaType);
        result.imported++;
      }
    } catch (error) {
      const title =
        simklItem.movie?.title ||
        simklItem.show?.title ||
        simklItem.anime?.title;
      result.errors.push(
        `Failed to import ${title}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return result;
}

/**
 * Check if Simkl item should overwrite Firebase item (more progress)
 */
function shouldSimklOverwrite(
  simklItem: SimklListItem,
  firebaseItem: WatchHistoryItem
): boolean {
  // For movies: compare completion status
  if (simklItem.movie) {
    // If Firebase has watch position tracking, check if movie was completed
    const position = Number(firebaseItem.watch_position) || 0;
    const duration = Number(firebaseItem.duration) || 0;
    const firebaseProgress = duration > 0 ? position / duration : 0;

    // Simkl "completed" status means fully watched
    if (simklItem.status === "completed" && firebaseProgress < 0.9) {
      return true;
    }
    return false;
  }

  // For TV shows: compare episode counts
  const simklEpisodes = simklItem.watched_episodes_count || 0;
  // Use actual watched episodes length if available; default to 0 to avoid masking state
  const firebaseEpisodes = firebaseItem.episodes_watched?.length ?? 0;

  return simklEpisodes > firebaseEpisodes;
}

/**
 * Merge Simkl data into existing Firebase item
 */
async function mergeSimklToFirebase(
  userId: string,
  simklItem: SimklListItem,
  existingItem: WatchHistoryItem
): Promise<void> {
  const lastEpisode = getLastWatchedEpisode(simklItem);

  const updates: Partial<WatchHistoryItem> = {
    last_watched_at: simklItem.last_watched_at || new Date().toISOString(),
  };

  // For TV shows, update episode tracking
  if (lastEpisode) {
    updates.season = lastEpisode.season;
    updates.episode = lastEpisode.episode;
  }

  // For movies, mark as watched
  if (simklItem.movie && simklItem.status === "completed") {
    updates.watch_position = existingItem.duration || 7200; // Assume 2hr if unknown
  }

  const historyRef = doc(db, "watchHistory", existingItem.id);
  await setDoc(historyRef, updates, { merge: true });
}

/**
 * Create a new Firebase watch history item from Simkl data
 */
async function createFirebaseItemFromSimkl(
  userId: string,
  simklItem: SimklListItem,
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<void> {
  // Fetch full media details from TMDB
  let title = "";
  let posterPath = "";
  let backdropPath = "";
  let overview = "";
  let rating = 0;

  try {
    if (mediaType === "movie") {
      const details = await getMovieDetails(tmdbId);
      if (details) {
        title = details.title;
        posterPath = details.poster_path || "";
        backdropPath = details.backdrop_path || "";
        overview = details.overview || "";
        rating = details.vote_average || 0;
      }
    } else {
      const details = await getTVDetails(tmdbId);
      if (details) {
        title = details.name;
        posterPath = details.poster_path || "";
        backdropPath = details.backdrop_path || "";
        overview = details.overview || "";
        rating = details.vote_average || 0;
      }
    }
  } catch (error) {
    // Use Simkl data as fallback
    const media = simklItem.movie || simklItem.show || simklItem.anime;
    title = media?.title || "Unknown";
  }

  const lastEpisode = getLastWatchedEpisode(simklItem);
  const docId = `${userId}_${mediaType}_${tmdbId}`;

  // Build object without undefined values (Firestore doesn't accept undefined)
  const newItem: Record<string, unknown> = {
    id: docId,
    user_id: userId,
    media_id: tmdbId,
    media_type: mediaType,
    title: title || "Unknown",
    poster_path: posterPath || "",
    backdrop_path: backdropPath || "",
    overview: overview || "",
    rating: rating || 0,
    watch_position: simklItem.status === "completed" ? 7200 : 0,
    duration: 7200,
    created_at: simklItem.last_watched_at || new Date().toISOString(),
    last_watched_at: simklItem.last_watched_at || new Date().toISOString(),
    preferred_source: "",
    episodes_watched: [],
  };

  // Only add season/episode if they exist
  if (lastEpisode?.season !== undefined) {
    newItem.season = lastEpisode.season;
  }
  if (lastEpisode?.episode !== undefined) {
    newItem.episode = lastEpisode.episode;
  }

  const historyRef = doc(db, "watchHistory", docId);
  await setDoc(historyRef, newItem);
}

/**
 * Export items from Firebase to Simkl
 */
async function exportToSimkl(
  simklToken: string,
  firebaseHistory: WatchHistoryItem[],
  simklItems: SimklListItem[]
): Promise<{ exported: number; errors: string[] }> {
  const result = { exported: 0, errors: [] as string[] };

  // Create a set of Simkl TMDB IDs for quick lookup
  const simklTmdbIds = new Set<string>();
  for (const item of simklItems) {
    const media = item.movie || item.show || item.anime;
    if (media?.ids?.tmdb) {
      simklTmdbIds.add(`${item.movie ? "movie" : "tv"}_${media.ids.tmdb}`);
    }
  }

  // Export items not in Simkl
  for (const item of firebaseHistory) {
    const key = `${item.media_type}_${item.media_id}`;
    if (!simklTmdbIds.has(key)) {
      try {
        // Determine a release year if available on the media item
        const candidateYearFromItem = (() => {
          const itemWithDates = item as WatchHistoryItem & {
            release_year?: string | number;
            release_date?: string;
          };
          const releaseYear = itemWithDates.release_year;
          const releaseDate = itemWithDates.release_date;
          if (
            typeof releaseYear === "number" &&
            !Number.isNaN(releaseYear) &&
            releaseYear > 1900 &&
            releaseYear < 2100
          ) {
            return releaseYear;
          }
          if (typeof releaseYear === "string" && releaseYear) {
            const parsed = parseInt(releaseYear, 10);
            if (!Number.isNaN(parsed) && parsed > 1900 && parsed < 2100) {
              return parsed;
            }
          }
          if (typeof releaseDate === "string" && releaseDate) {
            const yearMatch = releaseDate.match(/^\d{4}/);
            if (yearMatch) {
              const parsed = parseInt(yearMatch[0], 10);
              if (!Number.isNaN(parsed) && parsed > 1900 && parsed < 2100) {
                return parsed;
              }
            }
            const date = new Date(releaseDate);
            const year = date.getFullYear();
            if (Number.isFinite(year) && year >= 1900 && year <= 2100) {
              return year;
            }
          }
          return undefined;
        })();

        const payload: Record<string, unknown> = {
          title: item.title,
          ids: {
            tmdb: item.media_id,
          },
          season: item.season,
          episode: item.episode,
        };
        if (
          typeof candidateYearFromItem === "number" &&
          !Number.isNaN(candidateYearFromItem)
        ) {
          payload.year = candidateYearFromItem;
        }

        await SimklService.checkin(simklToken, payload);
        result.exported++;
      } catch (error) {
        result.errors.push(
          `Failed to export ${item.title}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  }

  return result;
}

export async function updateSyncState(
  userId: string,
  updates: Partial<SyncState>
): Promise<void> {
  try {
    const syncRef = doc(db, "simklSync", userId);
    await setDoc(
      syncRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Silently fail - sync state tracking is optional
    console.debug(
      "Could not update sync state (missing Firestore rules for 'simklSync')"
    );
  }
}
