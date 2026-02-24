import { getAnalytics, logEvent, setCurrentScreen } from "firebase/analytics";
import { getAnalyticsInstance } from "./firebase";
import { offlineQueue } from "./analytics-offline";

// Cache for analytics events to prevent duplicate submissions
const analyticsCache = new Map<string, number>();
const CACHE_EXPIRY = 1000 * 60 * 5; // 5 minutes

// Custom event types
export type AnalyticsParams = {
  button_name?: string;
  form_name?: string;
  success?: boolean;
  media_type?: string;
  media_id?: string;
  action?: string;
  content_type?: "movie" | "tv";
  item_id?: string;
  title?: string;
  duration?: number;
  watch_time?: number;
  timestamp?: string;
  page_title?: string;
  page_location?: string;
  page_path?: string;
  [key: string]: string | number | boolean | undefined;
};

export interface AnalyticsEvent {
  name: string;
  params?: AnalyticsParams;
}

// Analytics utility functions
export const trackPageView = async (pageName: string) => {
  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) return;

    setCurrentScreen(analytics, pageName);
    await logEvent(analytics, "page_view", {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to track page view:", error);
    // Queue for offline processing
    offlineQueue.addToQueue({
      name: "page_view",
      params: {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Tracks a generic analytics event with optional parameters
 * @param {Object} params - The event parameters
 * @param {string} params.name - The name of the event to track
 * @param {AnalyticsParams} params.params - Additional parameters for the event
 */
export const trackEvent = async ({
  name,
  params = {},
}: {
  name: string;
  params?: AnalyticsParams;
}) => {
  const cacheKey = `${name}-${JSON.stringify(params)}`;
  const now = Date.now();
  const lastTracked = analyticsCache.get(cacheKey);

  // Prevent duplicate events within cache expiry window
  if (lastTracked && now - lastTracked < CACHE_EXPIRY) {
    return;
  }

  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) {
      throw new Error("Analytics not initialized");
    }

    analyticsCache.set(cacheKey, now);
    await logEvent(analytics, name, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to track event:", error);
    // Queue for offline processing
    offlineQueue.addToQueue({
      name,
      params: {
        ...params,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Tracks when a user views media content
 * @param {Object} params - Media view parameters
 * @param {'movie' | 'tv'} params.mediaType - Type of media being viewed
 * @param {string} params.mediaId - Unique identifier of the media
 * @param {string} params.title - Title of the media
 * @param {number} [params.duration] - Duration of the media in seconds
 */
export const trackMediaView = async ({
  mediaType,
  mediaId,
  title,
  duration,
}: {
  mediaType: "movie" | "tv";
  mediaId: string;
  title: string;
  duration?: number;
}) => {
  await trackEvent({
    name: "media_view",
    params: {
      content_type: mediaType,
      item_id: mediaId,
      title,
      duration,
    },
  });
};

/**
 * Tracks user preferences between movies and TV shows
 * @param {'movie' | 'tv'} mediaType - Type of media being interacted with
 * @param {'select' | 'browse' | 'favorite'} action - The type of interaction
 */
export const trackMediaPreference = async (
  mediaType: "movie" | "tv",
  action: "select" | "browse" | "favorite"
) => {
  await trackEvent({
    name: "media_preference",
    params: {
      content_type: mediaType,
      action,
    },
  });
};
