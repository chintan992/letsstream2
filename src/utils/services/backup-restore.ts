import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  deleteDoc,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  WatchHistoryItem,
  FavoriteItem,
  WatchlistItem,
} from "@/contexts/types/watch-history";
import { trackEvent } from "@/lib/analytics";

/**
 * Tracks backup and restore events for analytics
 */
function trackBackupEvent(eventName: string, params: Record<string, unknown>) {
  try {
    trackEvent({
      name: `backup_${eventName}`,
      params: {
        ...params,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        online: navigator.onLine,
      },
    });
  } catch (error) {
    // Silently fail analytics tracking to avoid breaking the main functionality
    console.warn("Failed to track backup event:", error);
  }
}

// Backup data structure
export interface BackupData {
  version: string;
  user_id: string;
  backup_date: string;
  data: {
    watchHistory: WatchHistoryItem[];
    favorites: FavoriteItem[];
    watchlist: WatchlistItem[];
  };
}

// Restore result structure
export interface RestoreResult {
  success: boolean;
  message: string;
  stats: {
    watchHistory: { added: number; updated: number; errors: number };
    favorites: { added: number; updated: number; errors: number };
    watchlist: { added: number; updated: number; errors: number };
  };
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates backup data structure and content
 */
export function validateBackupData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic structure
  if (!data || typeof data !== "object") {
    errors.push("Invalid backup data: not an object");
    return { isValid: false, errors, warnings };
  }

  const d = data as Record<string, unknown>;

  // Check version
  if (!d.version || typeof d.version !== "string") {
    errors.push("Missing or invalid version field");
  }

  // Check user_id
  if (!d.user_id || typeof d.user_id !== "string") {
    errors.push("Missing or invalid user_id field");
  }

  // Check backup_date
  if (!d.backup_date || typeof d.backup_date !== "string") {
    errors.push("Missing or invalid backup_date field");
  }

  // Check data object
  if (!d.data || typeof d.data !== "object") {
    errors.push("Missing or invalid data field");
    return { isValid: false, errors, warnings };
  }

  const innerData = d.data as Record<string, unknown>;

  // Validate arrays
  const collections = ["watchHistory", "favorites", "watchlist"];
  for (const collectionName of collections) {
    if (!Array.isArray(innerData[collectionName])) {
      errors.push(`Missing or invalid ${collectionName} array`);
    } else {
      // Validate each item has required fields
      (innerData[collectionName] as Record<string, unknown>[]).forEach(
        (item: Record<string, unknown>, index: number) => {
          if (!item.id || typeof item.id !== "string") {
            errors.push(`${collectionName}[${index}]: Missing or invalid id`);
          }
          if (!item.user_id || typeof item.user_id !== "string") {
            errors.push(
              `${collectionName}[${index}]: Missing or invalid user_id`
            );
          }
          if (typeof item.media_id !== "number") {
            errors.push(
              `${collectionName}[${index}]: Missing or invalid media_id`
            );
          }
          if (
            typeof item.media_type !== "string" ||
            !["movie", "tv"].includes(item.media_type)
          ) {
            errors.push(
              `${collectionName}[${index}]: Missing or invalid media_type`
            );
          }
        }
      );
    }
  }

  // Check for data consistency warnings
  if (
    data.data.watchHistory.length === 0 &&
    data.data.favorites.length === 0 &&
    data.data.watchlist.length === 0
  ) {
    warnings.push("Backup contains no data");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Creates a backup of user's watch history, favorites, and watchlist with retry mechanism
 */
export async function createBackup(
  userId: string,
  maxRetries: number = 3
): Promise<BackupData> {
  if (!userId) {
    throw new Error("User ID is required for backup");
  }

  // Track analytics
  trackBackupEvent("backup_started", { user_id: userId });

  const backupData: BackupData = {
    version: "1.0",
    user_id: userId,
    backup_date: new Date().toISOString(),
    data: {
      watchHistory: [],
      favorites: [],
      watchlist: [],
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Backup attempt ${attempt}/${maxRetries} for user ${userId}`);

      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error(
          "No internet connection. Please check your network and try again."
        );
      }

      // Fetch watch history with timeout
      const watchHistoryPromise = Promise.race([
        getDocs(
          query(collection(db, "watchHistory"), where("user_id", "==", userId))
        ),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Watch history fetch timeout")),
            30000
          )
        ),
      ]);
      const watchHistorySnapshot =
        (await watchHistoryPromise) as QuerySnapshot<DocumentData>;
      backupData.data.watchHistory = watchHistorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WatchHistoryItem[];

      // Fetch favorites with timeout
      const favoritesPromise = Promise.race([
        getDocs(
          query(collection(db, "favorites"), where("user_id", "==", userId))
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Favorites fetch timeout")), 30000)
        ),
      ]);
      const favoritesSnapshot =
        (await favoritesPromise) as QuerySnapshot<DocumentData>;
      backupData.data.favorites = favoritesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FavoriteItem[];

      // Fetch watchlist with timeout
      const watchlistPromise = Promise.race([
        getDocs(
          query(collection(db, "watchlist"), where("user_id", "==", userId))
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Watchlist fetch timeout")), 30000)
        ),
      ]);
      const watchlistSnapshot =
        (await watchlistPromise) as QuerySnapshot<DocumentData>;
      backupData.data.watchlist = watchlistSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WatchlistItem[];

      // Track successful backup
      trackBackupEvent("backup_completed", {
        user_id: userId,
        watch_history_count: backupData.data.watchHistory.length,
        favorites_count: backupData.data.favorites.length,
        watchlist_count: backupData.data.watchlist.length,
        total_items:
          backupData.data.watchHistory.length +
          backupData.data.favorites.length +
          backupData.data.watchlist.length,
        attempts: attempt,
      });

      console.log(
        `Backup completed successfully for user ${userId} with ${backupData.data.watchHistory.length + backupData.data.favorites.length + backupData.data.watchlist.length} items`
      );
      return backupData;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Unknown error during backup");
      console.error(`Backup attempt ${attempt} failed:`, lastError.message);

      // Track failed attempt
      trackBackupEvent("backup_attempt_failed", {
        user_id: userId,
        attempt,
        error: lastError.message,
      });

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  trackBackupEvent("backup_failed", {
    user_id: userId,
    attempts: maxRetries,
    final_error: lastError?.message || "Unknown error",
  });

  throw new Error(
    `Failed to create backup after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Downloads backup data as a JSON file with customizable filename
 */
export function downloadBackup(
  backupData: BackupData,
  customFilename?: string
): void {
  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;

  // Use custom filename or generate default
  let filename = customFilename || generateDefaultBackupFilename(backupData);

  // Ensure .json extension
  if (!filename.toLowerCase().endsWith(".json")) {
    filename += ".json";
  }

  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a default backup filename
 */
function generateDefaultBackupFilename(backupData: BackupData): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  return `letsstream-backup-${backupData.user_id}-${date}.json`;
}

/**
 * Generates suggested backup filenames with different formats
 */
export function generateBackupFilenameSuggestions(
  backupData: BackupData,
  userEmail?: string
): string[] {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(" ")[0].replace(/:/g, ""); // HHMMSS
  const datetime =
    now.toISOString().replace(/[:.]/g, "-").split("T")[0] + "_" + time; // YYYY-MM-DD_HHMMSS

  const userIdentifier = userEmail
    ? userEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")
    : backupData.user_id.substring(0, 8);

  const dataCounts = {
    history: backupData.data.watchHistory.length,
    favorites: backupData.data.favorites.length,
    watchlist: backupData.data.watchlist.length,
  };

  return [
    // Basic formats
    `LetsStream_Backup_${userIdentifier}_${date}.json`,
    `MyWatchData_${userIdentifier}_${datetime}.json`,

    // Descriptive formats
    `LetsStream_${userIdentifier}_WatchHistory_${dataCounts.history}_items_${date}.json`,
    `Backup_${userIdentifier}_${dataCounts.history + dataCounts.favorites + dataCounts.watchlist}_items_${date}.json`,

    // Date-focused formats
    `LetsStream_Backup_${date}_${time}.json`,
    `WatchData_Backup_${datetime}.json`,

    // User-friendly formats
    `My_LetsStream_Data_${date}.json`,
    `Personal_Watchlist_Backup_${userIdentifier}.json`,

    // Technical formats
    `letsstream_backup_v1.0_${backupData.user_id}_${datetime}.json`,
    `firestore_export_${userIdentifier}_${date}.json`,
  ];
}

/**
 * Parses uploaded backup file with validation and size limits
 */
export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    // File size validation (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      reject(
        new Error(
          `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of 50MB`
        )
      );
      return;
    }

    // File type validation
    if (!file.name.toLowerCase().endsWith(".json")) {
      reject(new Error("File must be a JSON file (.json extension)"));
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      try {
        const content = e.target?.result as string;

        // Check if content is empty
        if (!content || content.trim().length === 0) {
          reject(new Error("File is empty"));
          return;
        }

        // Check content size (should be reasonable for JSON)
        if (content.length > MAX_FILE_SIZE) {
          reject(new Error("File content is too large"));
          return;
        }

        const data = JSON.parse(content);

        // Basic structure validation
        if (!data || typeof data !== "object") {
          reject(new Error("Invalid backup file format"));
          return;
        }

        resolve(data);
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new Error("Invalid JSON format in backup file"));
        } else {
          reject(new Error("Failed to parse backup file"));
        }
      }
    };

    reader.onerror = () => {
      reject(
        new Error(
          "Failed to read file. The file may be corrupted or inaccessible."
        )
      );
    };

    reader.onabort = () => {
      reject(new Error("File reading was aborted"));
    };

    // Add timeout for large files
    const timeout = setTimeout(() => {
      reader.abort();
      reject(
        new Error("File reading timed out. File may be too large or corrupted.")
      );
    }, 30000); // 30 second timeout

    reader.onloadend = () => {
      clearTimeout(timeout);
    };

    reader.readAsText(file);
  });
}

/**
 * Restores data from backup to Firestore with retry mechanism and analytics
 */
export async function restoreBackup(
  backupData: BackupData,
  targetUserId: string,
  maxRetries: number = 3
): Promise<RestoreResult> {
  const result: RestoreResult = {
    success: false,
    message: "",
    stats: {
      watchHistory: { added: 0, updated: 0, errors: 0 },
      favorites: { added: 0, updated: 0, errors: 0 },
      watchlist: { added: 0, updated: 0, errors: 0 },
    },
  };

  // Track analytics
  trackBackupEvent("restore_started", {
    user_id: targetUserId,
    backup_user_id: backupData.user_id,
    backup_date: backupData.backup_date,
    watch_history_count: backupData.data.watchHistory.length,
    favorites_count: backupData.data.favorites.length,
    watchlist_count: backupData.data.watchlist.length,
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Restore attempt ${attempt}/${maxRetries} for user ${targetUserId}`
      );

      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error(
          "No internet connection. Please check your network and try again."
        );
      }

      // Validate backup data
      const validation = validateBackupData(backupData);
      if (!validation.isValid) {
        result.message = `Validation failed: ${validation.errors.join(", ")}`;
        trackBackupEvent("restore_validation_failed", {
          user_id: targetUserId,
          errors: validation.errors,
        });
        return result;
      }

      if (validation.warnings.length > 0) {
        console.warn("Backup validation warnings:", validation.warnings);
        trackBackupEvent("restore_validation_warnings", {
          user_id: targetUserId,
          warnings: validation.warnings,
        });
      }

      // Process each collection with timeout protection
      const collections = [
        { name: "watchHistory", data: backupData.data.watchHistory },
        { name: "favorites", data: backupData.data.favorites },
        { name: "watchlist", data: backupData.data.watchlist },
      ];

      for (const collectionInfo of collections) {
        const collectionRef = collection(db, collectionInfo.name);
        const batch = writeBatch(db);
        let batchCount = 0;
        const maxBatchSize = 500;

        for (const item of collectionInfo.data) {
          try {
            // Update user_id to target user
            const itemData = { ...item, user_id: targetUserId };

            // Generate new ID to avoid conflicts
            const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const docRef = doc(collectionRef, newId);
            batch.set(docRef, itemData);

            batchCount++;
            result.stats[collectionInfo.name as keyof typeof result.stats]
              .added++;

            if (batchCount >= maxBatchSize) {
              await Promise.race([
                batch.commit(),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Batch commit timeout")),
                    30000
                  )
                ),
              ]);
              batchCount = 0;
            }
          } catch (error) {
            console.error(
              `Error processing ${collectionInfo.name} item ${item.id}:`,
              error
            );
            result.stats[collectionInfo.name as keyof typeof result.stats]
              .errors++;
          }
        }

        if (batchCount > 0) {
          await Promise.race([
            batch.commit(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Final batch commit timeout")),
                30000
              )
            ),
          ]);
        }
      }

      result.success = true;
      result.message = "Backup restored successfully";

      // Add summary to message
      const totalAdded = Object.values(result.stats).reduce(
        (sum, stat) => sum + stat.added,
        0
      );
      const totalErrors = Object.values(result.stats).reduce(
        (sum, stat) => sum + stat.errors,
        0
      );
      result.message += ` (${totalAdded} items restored${totalErrors > 0 ? `, ${totalErrors} errors` : ""})`;

      // Track successful restore
      trackBackupEvent("restore_completed", {
        user_id: targetUserId,
        total_items: totalAdded,
        errors: totalErrors,
        attempts: attempt,
        ...result.stats,
      });

      console.log(
        `Restore completed successfully for user ${targetUserId} with ${totalAdded} items`
      );
      return result;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Unknown error during restore");
      console.error(`Restore attempt ${attempt} failed:`, lastError.message);

      // Track failed attempt
      trackBackupEvent("restore_attempt_failed", {
        user_id: targetUserId,
        attempt,
        error: lastError.message,
      });

      // Reset stats for retry
      result.stats = {
        watchHistory: { added: 0, updated: 0, errors: 0 },
        favorites: { added: 0, updated: 0, errors: 0 },
        watchlist: { added: 0, updated: 0, errors: 0 },
      };

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  result.message = `Failed to restore backup after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`;

  trackBackupEvent("restore_failed", {
    user_id: targetUserId,
    attempts: maxRetries,
    final_error: lastError?.message || "Unknown error",
  });

  return result;
}

/**
 * Clears all user data from Firestore (used before restore if needed)
 */
export async function clearUserData(userId: string): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const collections = ["watchHistory", "favorites", "watchlist"];

    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where("user_id", "==", userId));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let batchCount = 0;
      const maxBatchSize = 500;

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        batchCount++;

        if (batchCount >= maxBatchSize) {
          batch.commit();
          batchCount = 0;
        }
      });

      if (batchCount > 0) {
        await batch.commit();
      }
    }
  } catch (error) {
    console.error("Error clearing user data:", error);
    throw new Error(
      `Failed to clear user data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
