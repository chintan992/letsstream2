import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/hooks";
import { useUserPreferences } from "@/hooks/user-preferences";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  deleteField,
  limit,
  orderBy,
  startAfter,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateId } from "@/utils/supabase";
import { Media } from "@/utils/types";
import { useToast } from "@/components/ui/use-toast";
import {
  deduplicateWatchHistory,
  filterWatchHistoryDuplicates,
  isSignificantProgress,
  updateEpisodeInHistory,
  findEpisodeInHistory,
} from "@/utils/watch-history-utils";
import { SimklService } from "@/lib/simkl";
import { performBidirectionalSync, updateSyncState } from "@/lib/simkl-sync";
import { RateLimiter } from "@/utils/rate-limiter";

const LOCAL_STORAGE_HISTORY_KEY = "fdf_watch_history";
const ITEMS_PER_PAGE = 20;
const MAX_LOCAL_HISTORY = 50;
const DEBOUNCE_WINDOW = 300000; // 5 minutes
const SIGNIFICANT_PROGRESS = 60; // 60 seconds
const MINIMUM_UPDATE_INTERVAL = 30000; // 30 seconds
const lastUpdateTimestamps = new Map<string, number>();
interface PendingOperation {
  operation: () => Promise<void>;
  documentIds: Set<string>;
  userId: string;
  canceled: boolean;
}

const pendingOperations: PendingOperation[] = [];
const inFlightOperations = new Set<{
  queuedOperation: PendingOperation;
  promise: Promise<void>;
}>();

const readRateLimiter = RateLimiter.getInstance(200, 200 / 300);
const writeRateLimiter = RateLimiter.getInstance(100, 100 / 300);
const deleteRateLimiter = RateLimiter.getInstance(50, 50 / 300);

const queueOperation = (
  operation: () => Promise<void>,
  documentIds: string[],
  userId: string
) => {
  pendingOperations.push({
    operation,
    documentIds: new Set(documentIds),
    userId,
    canceled: false,
  });
};

const cancelPendingOperations = async (
  documentIds: Set<string> | undefined,
  userId: string
) => {
  const matches = (operation: PendingOperation) =>
    operation.userId === userId &&
    (!documentIds ||
      [...operation.documentIds].some(id => documentIds.has(id)));

  for (let index = pendingOperations.length - 1; index >= 0; index -= 1) {
    if (matches(pendingOperations[index])) {
      pendingOperations.splice(index, 1);
    }
  }

  const conflictingOperations: Promise<void>[] = [];
  inFlightOperations.forEach(inFlight => {
    if (matches(inFlight.queuedOperation)) {
      inFlight.queuedOperation.canceled = true;
      conflictingOperations.push(inFlight.promise);
    }
  });
  await Promise.all(conflictingOperations);
};

const processPendingOperations = async () => {
  if (!navigator.onLine) return;

  while (pendingOperations.length > 0) {
    const canExecute = await writeRateLimiter.canExecute();
    if (!canExecute) break;

    const queuedOperation = pendingOperations.shift();
    if (queuedOperation) {
      let failed = false;
      const inFlight = {
        queuedOperation,
        promise: Promise.resolve(),
      };
      inFlightOperations.add(inFlight);
      inFlight.promise = (async () => {
        try {
          await queuedOperation.operation();
        } catch (error) {
          console.error("Error processing pending operation:", error);
          failed = true;
          if (!queuedOperation.canceled) {
            pendingOperations.push(queuedOperation);
          }
        } finally {
          inFlightOperations.delete(inFlight);
        }
      })();
      await inFlight.promise;
      if (failed) break;
    }
  }
};

interface QueuedUpdate {
  historyRef: ReturnType<typeof doc>;
  updatedItemData: Partial<WatchHistoryItem>;
}

const watchPositionQueue = new Map<
  string,
  {
    data: QueuedUpdate;
    timestamp: number;
    userId: string;
  }
>();

const removeQueuedWatchPositions = (
  ids: Set<string> | undefined,
  userId: string
) => {
  for (const [key, { data, userId: queuedUserId }] of watchPositionQueue) {
    if (queuedUserId === userId && (!ids || ids.has(data.historyRef.id))) {
      watchPositionQueue.delete(key);
    }
  }
};

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
  season?: number;
  episode?: number;
  last_watched_at?: string;
  watch_position: number;
  duration: number;
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

export interface WatchHistoryContextType {
  watchHistory: WatchHistoryItem[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: (sortOrder?: "newest" | "oldest", reset?: boolean) => Promise<void>;
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
    episode?: number,
    preferredSource?: string
  ) => Promise<void>;
  clearWatchHistory: () => Promise<void>;
  deleteWatchHistoryItem: (id: string) => Promise<void>;
  deleteSelectedWatchHistory: (ids: string[]) => Promise<void>;
}

export const WatchHistoryContext = createContext<
  WatchHistoryContextType | undefined
>(undefined);

export function WatchHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userPreferences } = useUserPreferences();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const simklSyncKeyRef = useRef<string | null>(null);
  const historyRequestIdRef = useRef(0);
  const historySortOrderRef = useRef<"newest" | "oldest">("newest");
  const { toast } = useToast();

  const processWatchPositionQueue = useCallback(async () => {
    if (!navigator.onLine || watchPositionQueue.size === 0) return;

    try {
      const now = Date.now();
      const updatesByDocument = new Map<
        string,
        Array<{ key: string; data: QueuedUpdate; timestamp: number }>
      >();

      for (const [key, queuedUpdate] of watchPositionQueue.entries()) {
        const documentId = queuedUpdate.data.historyRef.id;
        const updates = updatesByDocument.get(documentId) || [];
        updates.push({ key, ...queuedUpdate });
        updatesByDocument.set(documentId, updates);
      }

      let batch = writeBatch(db);
      let batchCount = 0;
      const processedKeys: string[] = [];

      for (const updates of updatesByDocument.values()) {
        const eligibleUpdates = updates.filter(
          ({ timestamp }) => now - timestamp >= MINIMUM_UPDATE_INTERVAL
        );
        if (eligibleUpdates.length === 0) {
          continue;
        }

        const canExecute = await writeRateLimiter.canExecute();
        if (!canExecute) {
          console.log(
            "Write rate limit exceeded. Remaining updates will be processed later."
          );
          break;
        }

        const timestampOrderedUpdates = [...eligibleUpdates].sort(
          (left, right) => left.timestamp - right.timestamp
        );
        const latestUpdate =
          timestampOrderedUpdates[timestampOrderedUpdates.length - 1];
        const mergedEpisodes = new Map(
          (latestUpdate.data.updatedItemData.episodes_watched || []).map(
            episode =>
              [`${episode.season}-${episode.episode}`, episode] as const
          )
        );
        timestampOrderedUpdates.forEach(({ data }) => {
          const { season, episode, episodes_watched } = data.updatedItemData;
          if (typeof season !== "number" || typeof episode !== "number") {
            return;
          }
          const episodeData = episodes_watched?.find(
            item => item.season === season && item.episode === episode
          );
          if (episodeData) {
            mergedEpisodes.set(`${season}-${episode}`, episodeData);
          }
        });

        const updatedItemData = {
          ...latestUpdate.data.updatedItemData,
          ...(mergedEpisodes.size > 0
            ? { episodes_watched: Array.from(mergedEpisodes.values()) }
            : {}),
        };
        batch.set(latestUpdate.data.historyRef, updatedItemData, {
          merge: true,
        });
        processedKeys.push(...eligibleUpdates.map(({ key }) => key));
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      processedKeys.forEach(key => watchPositionQueue.delete(key));
    } catch (error) {
      console.error("Error processing watch position queue:", error);
    }
  }, []);

  useEffect(() => {
    const processQueuedWrites = async () => {
      await processPendingOperations();
      await processWatchPositionQueue();
    };
    const interval = setInterval(processQueuedWrites, MINIMUM_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [processWatchPositionQueue]);

  useEffect(() => {
    const handleOnline = async () => {
      console.log("Back online, processing pending operations...");
      await processPendingOperations();
    };

    const handleOffline = () => {
      console.log("Went offline, operations will be queued");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      processPendingOperations();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadLocalWatchHistory = useCallback(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (!storedHistory) return [];
      const history = JSON.parse(storedHistory);
      return history.slice(0, MAX_LOCAL_HISTORY);
    } catch (error) {
      console.error("Error loading local watch history:", error);
      return [];
    }
  }, []);

  const saveLocalWatchHistory = useCallback((history: WatchHistoryItem[]) => {
    try {
      const recentHistory = history.slice(0, MAX_LOCAL_HISTORY);
      localStorage.setItem(
        LOCAL_STORAGE_HISTORY_KEY,
        JSON.stringify(recentHistory)
      );
    } catch (error) {
      console.error("Error saving local watch history:", error);
    }
  }, []);

  const fetchWatchHistory = useCallback(
    async (
      isInitial: boolean = false,
      sortOrder: "newest" | "oldest" = "newest"
    ) => {
      if (!user) {
        const localHistory = loadLocalWatchHistory();
        const deduplicatedHistory = deduplicateWatchHistory(localHistory);
        setWatchHistory(deduplicatedHistory);
        setHasMore(false);
        if (isInitial) {
          setInitialFetchDone(true);
        }
        return;
      }

      let requestId: number | null = null;
      try {
        setIsLoading(true);
        const historyRef = collection(db, "watchHistory");
        let historyQuery;

        if (isInitial) {
          historyQuery = query(
            historyRef,
            where("user_id", "==", user.uid),
            orderBy("created_at", sortOrder === "newest" ? "desc" : "asc"),
            limit(ITEMS_PER_PAGE)
          );
        } else if (lastVisible) {
          historyQuery = query(
            historyRef,
            where("user_id", "==", user.uid),
            orderBy("created_at", sortOrder === "newest" ? "desc" : "asc"),
            startAfter(lastVisible),
            limit(ITEMS_PER_PAGE)
          );
        } else {
          return;
        }

        const canExecute = await readRateLimiter.canExecute();
        if (!canExecute) {
          console.log("Read rate limit exceeded. Skipping Firestore fetch.");
          return;
        }

        requestId = ++historyRequestIdRef.current;
        historySortOrderRef.current = sortOrder;

        if (isInitial) {
          setLastVisible(null);
        }

        const historySnapshot = await getDocs(historyQuery);

        if (requestId !== historyRequestIdRef.current) return;

        if (historySnapshot.empty) {
          setHasMore(false);
          if (isInitial) {
            setInitialFetchDone(true);
          }
          return;
        }

        setLastVisible(
          historySnapshot.docs[
            historySnapshot.docs.length - 1
          ] as QueryDocumentSnapshot<DocumentData>
        );

        const historyData = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<WatchHistoryItem, "id">),
          created_at:
            (doc.data() as { created_at?: string })?.created_at ||
            new Date().toISOString(),
        }));

        if (isInitial) {
          const deduplicatedHistory = deduplicateWatchHistory(historyData);
          setWatchHistory(deduplicatedHistory);
        } else {
          setWatchHistory(currentHistory =>
            deduplicateWatchHistory([...currentHistory, ...historyData])
          );
        }

        setHasMore(historySnapshot.docs.length === ITEMS_PER_PAGE);
        if (isInitial) {
          setInitialFetchDone(true);
        }
      } catch (error) {
        if (requestId !== historyRequestIdRef.current) return;
        console.error("Error fetching watch history:", error);
        toast({
          title: "Error loading watch history",
          description: "There was a problem loading your watch history.",
          variant: "destructive",
        });
        if (isInitial) {
          setInitialFetchDone(true);
        }
      } finally {
        if (requestId === historyRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [user, lastVisible, loadLocalWatchHistory, toast]
  );

  useEffect(() => {
    const fetchAllData = async () => {
      if (!initialFetchDone || user) {
        setIsLoading(true);
        try {
          await fetchWatchHistory(true, historySortOrderRef.current);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else if (!user) {
        setWatchHistory([]);
      }
      setIsLoading(false);
    };

    fetchAllData();
  }, [user?.uid]);

  // Automatic Simkl bidirectional sync after initial fetch
  useEffect(() => {
    const performSimklSync = async () => {
      // Only sync if: user is logged in, Simkl is enabled, initial fetch is done, not currently loading
      if (
        !user ||
        !userPreferences?.isSimklEnabled ||
        !userPreferences?.simklToken
      ) {
        simklSyncKeyRef.current = null;
      }
      if (
        !user ||
        !userPreferences?.isSimklEnabled ||
        !userPreferences?.simklToken ||
        !initialFetchDone ||
        isLoading
      ) {
        return;
      }

      const syncKey = `${user.uid}:${userPreferences.simklToken}`;
      if (simklSyncKeyRef.current === syncKey) return;
      simklSyncKeyRef.current = syncKey;

      try {
        console.log("Starting automatic Simkl sync...");
        await updateSyncState(user.uid, { isSyncing: true });

        const result = await performBidirectionalSync(
          user.uid,
          userPreferences.simklToken
        );

        console.log("Simkl sync completed:", result);

        await updateSyncState(user.uid, {
          isSyncing: false,
          lastSyncAt: new Date().toISOString(),
          lastResult: result,
        });

        // If items were imported, refresh the watch history
        if (result.imported > 0 || result.merged > 0) {
          await fetchWatchHistory(true);
          toast({
            title: "Simkl Sync Complete",
            description: `Imported ${result.imported} items, merged ${result.merged} items.`,
          });
        }

        if (result.errors.length > 0) {
          console.warn("Simkl sync errors:", result.errors);
        }
      } catch (error) {
        console.error("Simkl sync error:", error);
        await updateSyncState(user.uid, { isSyncing: false });
      }
    };

    performSimklSync();
  }, [
    user?.uid,
    userPreferences?.isSimklEnabled,
    userPreferences?.simklToken,
    initialFetchDone,
    toast,
  ]);

  useEffect(() => {
    const migrateWatchHistory = async () => {
      if (!user) return;

      try {
        // First run the existing migration
        const historyRef = collection(db, "watchHistory");
        const historyQuery = query(
          historyRef,
          where("user_id", "==", user.uid)
        );

        const canExecute = await readRateLimiter.canExecute();
        if (!canExecute) {
          console.log(
            "Read rate limit exceeded. Skipping Firestore migration."
          );
          return;
        }

        const historySnapshot = await getDocs(historyQuery);

        const migrationPromises = historySnapshot.docs.map(async doc => {
          const data = doc.data();
          if ("last_watched" in data) {
            await setDoc(
              doc.ref,
              { last_watched: deleteField() },
              { merge: true }
            );
          }
        });

        await Promise.all(migrationPromises);

        // New migration: Consolidate TV show episodes
        await consolidateTVShowEpisodes();
      } catch (error) {
        console.error("Error migrating watch history:", error);
      }
    };

    // Function to consolidate existing TV show episodes
    const consolidateTVShowEpisodes = async () => {
      if (!user) return;

      try {
        const historyRef = collection(db, "watchHistory");
        const historyQuery = query(
          historyRef,
          where("user_id", "==", user.uid),
          where("media_type", "==", "tv")
        );

        const canExecute = await readRateLimiter.canExecute();
        if (!canExecute) {
          console.log(
            "Read rate limit exceeded. Skipping TV show consolidation migration."
          );
          return;
        }

        const historySnapshot = await getDocs(historyQuery);
        const tvEpisodes = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as WatchHistoryItem[];

        if (tvEpisodes.length === 0) return;

        // Group episodes by media_id
        const groupedEpisodes = new Map<number, WatchHistoryItem[]>();
        tvEpisodes.forEach(episode => {
          if (!groupedEpisodes.has(episode.media_id)) {
            groupedEpisodes.set(episode.media_id, []);
          }
          groupedEpisodes.get(episode.media_id)!.push(episode);
        });

        // For each group of episodes, consolidate into a single entry
        for (const [mediaId, episodes] of groupedEpisodes) {
          if (episodes.length <= 1) continue; // No need to consolidate if only one episode

          // Find most recent episode to use as base for consolidated entry
          const mostRecentEpisode = episodes.reduce((mostRecent, current) => {
            return new Date(current.created_at).getTime() >
              new Date(mostRecent.created_at).getTime()
              ? current
              : mostRecent;
          });

          // Create consolidated entry
          const episodeEntries = new Map<
            string,
            NonNullable<WatchHistoryItem["episodes_watched"]>[number]
          >();
          episodes.forEach(episode => {
            const addEpisode = (
              season: number,
              episodeNumber: number,
              watchPosition: number,
              episodeDuration: number,
              watchedAt: string
            ) => {
              const key = `${season}-${episodeNumber}`;
              const current = episodeEntries.get(key);
              if (
                !current ||
                new Date(watchedAt).getTime() >
                  new Date(current.watched_at).getTime()
              ) {
                episodeEntries.set(key, {
                  season,
                  episode: episodeNumber,
                  watch_position: watchPosition,
                  duration: episodeDuration,
                  watched_at: watchedAt,
                });
              }
            };

            if (
              typeof episode.season === "number" &&
              typeof episode.episode === "number"
            ) {
              addEpisode(
                episode.season,
                episode.episode,
                episode.watch_position,
                episode.duration,
                episode.created_at
              );
            }
            episode.episodes_watched?.forEach(episodeData =>
              addEpisode(
                episodeData.season,
                episodeData.episode,
                episodeData.watch_position,
                episodeData.duration,
                episodeData.watched_at
              )
            );
          });

          const consolidatedEntry: WatchHistoryItem = {
            ...mostRecentEpisode,
            episodes_watched: Array.from(episodeEntries.values()),
            last_watched_at: mostRecentEpisode.created_at,
            // Update to point to the main episode that will become the consolidated one
            id: mostRecentEpisode.id,
          };

          const mainEpisodeRef = doc(db, "watchHistory", mostRecentEpisode.id);
          const otherEpisodes = episodes.filter(
            ep => ep.id !== mostRecentEpisode.id
          );
          for (
            let index = 0;
            index < otherEpisodes.length || index === 0;
            index += 499
          ) {
            const consolidationBatch = writeBatch(db);
            if (index === 0) {
              consolidationBatch.set(mainEpisodeRef, consolidatedEntry, {
                merge: true,
              });
            }
            otherEpisodes.slice(index, index + 499).forEach(episode => {
              consolidationBatch.delete(doc(db, "watchHistory", episode.id));
            });
            await consolidationBatch.commit();
          }
        }
      } catch (error) {
        // Silently ignore permission errors in migration to avoid console noise
        const err = error as { code?: string };
        if (err?.code !== "permission-denied") {
          console.error("Error consolidating TV show episodes:", error);
        }
      }
    };

    if (user && initialFetchDone) {
      migrateWatchHistory();
    }
  }, [user, initialFetchDone]);
  const addToWatchHistory = async (
    media: Media,
    position: number,
    duration: number,
    season?: number,
    episode?: number,
    preferredSource?: string
  ) => {
    if (!user) {
      console.warn("Cannot add to watch history: User not authenticated");
      toast({
        title: "Authentication required",
        description: "Please log in to track your watch history.",
        variant: "destructive",
      });
      return;
    }

    if (!userPreferences?.isWatchHistoryEnabled) {
      console.log("Watch history is disabled in user preferences");
      return;
    }

    // Verify authentication state is valid
    if (!user.uid) {
      console.error("Invalid authentication state: missing user ID");
      return;
    }

    const mediaType = media.media_type;
    const mediaId = media.id;
    const title = media.title || media.name || "";
    // For the mediaKey, we'll use different logic for TV shows vs movies
    const mediaKey =
      mediaType === "tv"
        ? `${mediaId}-${mediaType}-${season || ""}-${episode || ""}`
        : `${mediaId}-${mediaType}-${season || ""}-${episode || ""}`;

    const now = Date.now();
    const lastUpdate = lastUpdateTimestamps.get(mediaKey) || 0;

    if (now - lastUpdate < MINIMUM_UPDATE_INTERVAL) return;

    const newItem: WatchHistoryItem = {
      id: generateId(),
      user_id: user.uid,
      media_id: mediaId,
      media_type: mediaType,
      title,
      poster_path: media.poster_path,
      backdrop_path: media.backdrop_path,
      overview: media.overview || undefined,
      rating: media.vote_average || 0,
      watch_position: position,
      duration,
      created_at: new Date().toISOString(),
      preferred_source: preferredSource || "",
      ...(typeof season === "number" ? { season } : {}),
      ...(typeof episode === "number" ? { episode } : {}),
    };

    const { items: updatedHistory, existingItem } =
      filterWatchHistoryDuplicates(watchHistory, newItem);

    if (existingItem && position > 0) {
      if (
        !isSignificantProgress(
          existingItem.watch_position,
          position,
          SIGNIFICANT_PROGRESS
        )
      ) {
        return;
      }
    }

    setWatchHistory(updatedHistory);
    saveLocalWatchHistory(updatedHistory);
    lastUpdateTimestamps.set(mediaKey, now);

    // Simkl Sync
    if (userPreferences.isSimklEnabled && userPreferences.simklToken) {
      try {
        await SimklService.checkin(userPreferences.simklToken, {
          title,
          year: media.release_date
            ? new Date(media.release_date).getFullYear()
            : undefined, // Approximation if release_date exists
          ids: {
            tmdb: mediaId,
            // external_ids would be better but we might not have them here.
            // Simkl can match by title/year/tmdb id.
          },
          ...(typeof season === "number" && typeof episode === "number"
            ? { season, episode }
            : {}),
        });
      } catch (error) {
        console.error("Failed to sync to Simkl", error);
      }
    }

    const persistWatchHistory = async () => {
      if (mediaType === "tv") {
        const existingDoc = existingItem || newItem;
        const historyRef = doc(db, "watchHistory", existingDoc.id);
        await setDoc(historyRef, existingDoc, { merge: true });
      } else {
        if (existingItem) {
          await deleteDoc(doc(db, "watchHistory", existingItem.id));
        }
        await setDoc(doc(db, "watchHistory", newItem.id), newItem);
      }
    };
    const persistDocumentIds =
      mediaType === "tv"
        ? [(existingItem || newItem).id]
        : [existingItem?.id, newItem.id].filter((id): id is string =>
            Boolean(id)
          );

    if (!navigator.onLine) {
      console.log("Queueing watch history update for later");
      queueOperation(persistWatchHistory, persistDocumentIds, user.uid);
      return;
    }

    const canExecute = await writeRateLimiter.canExecute();
    if (!canExecute) {
      console.log("Write rate limit exceeded. Queueing update for later");
      // Queue the operation to be performed later
      queueOperation(persistWatchHistory, persistDocumentIds, user.uid);
      return;
    }

    try {
      if (mediaType === "tv" && existingItem) {
        // For TV shows, update the existing consolidated document
        const historyRef = doc(db, "watchHistory", existingItem.id);
        await setDoc(historyRef, existingItem, { merge: true });
      } else if (mediaType === "tv" && !existingItem) {
        // For new TV shows, create the initial document
        const historyRef = doc(db, "watchHistory", newItem.id);
        await setDoc(historyRef, newItem);
      } else {
        // For movies, keep the original logic
        if (existingItem) {
          const existingRef = doc(db, "watchHistory", existingItem.id);
          await deleteDoc(existingRef);
        }

        const historyRef = doc(db, "watchHistory", newItem.id);
        await setDoc(historyRef, newItem);
      }
    } catch (error) {
      console.error("Error adding to watch history:", error);
      // Queue the operation to be performed later
      queueOperation(persistWatchHistory, persistDocumentIds, user.uid);
    }
  };

  const updateWatchPosition = async (
    mediaId: number,
    mediaType: "movie" | "tv",
    position: number,
    season?: number,
    episode?: number,
    preferredSource?: string
  ) => {
    if (!user) return;

    // For the mediaKey, we'll use different logic for TV shows vs movies
    const mediaKey =
      mediaType === "tv"
        ? `${mediaId}-${mediaType}-${season || ""}-${episode || ""}`
        : `${mediaId}-${mediaType}-${season || ""}-${episode || ""}`;

    const now = Date.now();
    const lastUpdate = lastUpdateTimestamps.get(mediaKey) || 0;

    if (now - lastUpdate < MINIMUM_UPDATE_INTERVAL) {
      return;
    }

    lastUpdateTimestamps.set(mediaKey, now);

    try {
      const existingItem = watchHistory.find(
        item => item.media_id === mediaId && item.media_type === mediaType
      );

      const canExecute = await writeRateLimiter.canExecute();
      if (!canExecute) {
        console.log("Write rate limit exceeded. Skipping Firestore update.");
        if (existingItem) {
          // For TV shows, update the specific episode in the episodes_watched array
          let updatedItem;
          if (
            mediaType === "tv" &&
            season !== undefined &&
            episode !== undefined
          ) {
            updatedItem = updateEpisodeInHistory(
              existingItem,
              season,
              episode,
              position,
              existingItem.duration
            );
          } else {
            // For movies or TV shows without specific season/episode, update the main entry
            updatedItem = {
              ...existingItem,
              watch_position: position,
              created_at: new Date().toISOString(),
              ...(typeof season === "number" ? { season } : {}),
              ...(typeof episode === "number" ? { episode } : {}),
              ...(preferredSource ? { preferred_source: preferredSource } : {}),
            };
          }

          const updatedHistory = watchHistory.map(h =>
            h.id === existingItem.id ? updatedItem : h
          );
          setWatchHistory(updatedHistory);
          saveLocalWatchHistory(updatedHistory);
        }
        return;
      }

      if (existingItem) {
        let updatedItem;
        let progressDifference = 0;

        if (
          mediaType === "tv" &&
          season !== undefined &&
          episode !== undefined
        ) {
          // For TV shows, update the specific episode in the episodes_watched array
          updatedItem = updateEpisodeInHistory(
            existingItem,
            season,
            episode,
            position,
            existingItem.duration
          );

          // Calculate progress difference for the specific episode
          const episodeData = findEpisodeInHistory(
            existingItem,
            season,
            episode
          );
          if (episodeData) {
            progressDifference = Math.abs(
              episodeData.watch_position - position
            );
          } else {
            progressDifference = Math.abs(
              existingItem.watch_position - position
            );
          }
        } else {
          // For movies or TV shows without specific season/episode, update the main entry
          updatedItem = {
            ...existingItem,
            watch_position: position,
            created_at: new Date().toISOString(),
            ...(typeof season === "number" ? { season } : {}),
            ...(typeof episode === "number" ? { episode } : {}),
            ...(preferredSource ? { preferred_source: preferredSource } : {}),
          };

          progressDifference = Math.abs(existingItem.watch_position - position);
        }

        if (progressDifference < SIGNIFICANT_PROGRESS) {
          return;
        }

        const historyRef = doc(db, "watchHistory", existingItem.id);
        const updatedItemData = {
          watch_position: position,
          created_at: new Date().toISOString(),
          episodes_watched: updatedItem.episodes_watched, // Include the full episodes_watched array
          last_watched_at: updatedItem.last_watched_at,
          season: updatedItem.season,
          episode: updatedItem.episode,
          ...(preferredSource ? { preferred_source: preferredSource } : {}),
        };

        watchPositionQueue.set(mediaKey, {
          data: {
            historyRef,
            updatedItemData: { ...updatedItemData, watch_position: position },
          },
          timestamp: now,
          userId: user.uid,
        });

        const updatedHistory = watchHistory.map(h =>
          h.id === existingItem.id ? updatedItem : h
        );
        setWatchHistory(updatedHistory);
        saveLocalWatchHistory(updatedHistory);
      }
    } catch (error) {
      console.error("Error updating watch position:", error);
      toast({
        title: "Error updating progress",
        description: "There was a problem updating your watch progress.",
        variant: "destructive",
      });
    }
  };

  const clearWatchHistory = async () => {
    if (!user) return;

    if (!navigator.onLine) {
      toast({
        title: "Unable to clear watch history",
        description: "Reconnect to the internet to clear your watch history.",
        variant: "destructive",
      });
      return;
    }

    try {
      const canExecute = await deleteRateLimiter.canExecute();
      if (!canExecute) {
        console.log("Delete rate limit exceeded. Skipping Firestore delete.");
        return;
      }

      const historyRef = collection(db, "watchHistory");
      const historyQuery = query(historyRef, where("user_id", "==", user.uid));
      const historySnapshot = await getDocs(historyQuery);
      await cancelPendingOperations(undefined, user.uid);

      const deletePromises = historySnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
      await cancelPendingOperations(undefined, user.uid);
      removeQueuedWatchPositions(undefined, user.uid);
      setWatchHistory([]);
      saveLocalWatchHistory([]);

      toast({
        title: "Watch history cleared",
        description: "Your watch history has been successfully cleared.",
      });
    } catch (error) {
      console.error("Error clearing watch history:", error);
      toast({
        title: "Error clearing history",
        description: "There was a problem clearing your watch history.",
        variant: "destructive",
      });
    }
  };

  const deleteWatchHistoryItem = async (id: string) => {
    if (!user) return;

    try {
      const canExecute = await deleteRateLimiter.canExecute();
      if (!canExecute) {
        console.log("Delete rate limit exceeded. Skipping Firestore delete.");
        return;
      }

      const historyRef = doc(db, "watchHistory", id);
      await cancelPendingOperations(new Set([id]), user.uid);
      await deleteDoc(historyRef);
      await cancelPendingOperations(new Set([id]), user.uid);
      removeQueuedWatchPositions(new Set([id]), user.uid);

      setWatchHistory(current => {
        const updatedHistory = current.filter(item => item.id !== id);
        saveLocalWatchHistory(updatedHistory);
        return updatedHistory;
      });

      toast({
        title: "Item removed",
        description: "The item has been removed from your watch history.",
      });
    } catch (error) {
      console.error("Error deleting watch history item:", error);
      toast({
        title: "Error removing item",
        description: "There was a problem removing the item from your history.",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedWatchHistory = async (ids: string[]) => {
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

      const deletedIds = new Set(ids);
      await cancelPendingOperations(deletedIds, user.uid);

      for (let index = 0; index < ids.length; index += 500) {
        const batch = writeBatch(db);
        ids.slice(index, index + 500).forEach(id => {
          batch.delete(doc(db, "watchHistory", id));
        });
        await batch.commit();
        committedIds.push(...ids.slice(index, index + 500));
      }

      await cancelPendingOperations(deletedIds, user.uid);
      removeQueuedWatchPositions(new Set(ids), user.uid);
      setWatchHistory(current => {
        const updatedHistory = current.filter(item => !ids.includes(item.id));
        saveLocalWatchHistory(updatedHistory);
        return updatedHistory;
      });

      toast({
        title: "Items removed",
        description: `${ids.length} ${ids.length === 1 ? "item has" : "items have"} been removed from your watch history.`,
      });
    } catch (error) {
      console.error("Error deleting watch history items:", error);
      if (committedIds.length > 0) {
        setWatchHistory(current => {
          const updatedHistory = current.filter(
            item => !committedIds.includes(item.id)
          );
          saveLocalWatchHistory(updatedHistory);
          return updatedHistory;
        });
      }
      toast({
        title: "Error removing items",
        description:
          "There was a problem removing the items from your history.",
        variant: "destructive",
      });
    }
  };

  return (
    <WatchHistoryContext.Provider
      value={{
        watchHistory,
        hasMore,
        isLoading,
        loadMore: (sortOrder = "newest", reset = false) =>
          fetchWatchHistory(reset, sortOrder),
        addToWatchHistory,
        updateWatchPosition,
        clearWatchHistory,
        deleteWatchHistoryItem,
        deleteSelectedWatchHistory,
      }}
    >
      {children}
    </WatchHistoryContext.Provider>
  );
}

export function useWatchHistory() {
  const context = useContext(WatchHistoryContext);
  if (!context) {
    throw new Error(
      "useWatchHistory must be used within a WatchHistoryProvider"
    );
  }
  return context;
}
