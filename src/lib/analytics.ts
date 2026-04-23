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
  plugin_id?: string;
  plugin_name?: string;
  is_default?: boolean;
  response_time?: number;
  plugin_count?: number;
  stream_count?: number;
  successful_plugins?: number;
  failed_plugins?: number;
  stream_url?: string;
  quality?: string;
  completed?: boolean;
  error?: string;
  enabled?: boolean;
  language?: string;
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

/**
 * Tracks when a plugin is added by the user
 * @param {Object} params - Plugin parameters
 * @param {string} params.pluginId - Unique identifier of the plugin
 * @param {string} params.pluginName - Display name of the plugin
 * @param {boolean} [params.isDefault] - Whether this is a default plugin
 */
export const trackPluginAdded = async ({
  pluginId,
  pluginName,
  isDefault,
}: {
  pluginId: string;
  pluginName: string;
  isDefault?: boolean;
}) => {
  await trackEvent({
    name: "plugin_added",
    params: {
      plugin_id: pluginId,
      plugin_name: pluginName,
      is_default: isDefault || false,
    },
  });
};

/**
 * Tracks when a plugin is removed by the user
 * @param {string} pluginId - Unique identifier of the plugin
 */
export const trackPluginRemoved = async (pluginId: string) => {
  await trackEvent({
    name: "plugin_removed",
    params: {
      plugin_id: pluginId,
    },
  });
};

/**
 * Tracks when a plugin connection is tested
 * @param {Object} params - Plugin test parameters
 * @param {string} params.pluginId - Unique identifier of the plugin
 * @param {boolean} params.success - Whether the test was successful
 * @param {number} [params.responseTime] - Response time in milliseconds
 */
export const trackPluginTested = async ({
  pluginId,
  success,
  responseTime,
}: {
  pluginId: string;
  success: boolean;
  responseTime?: number;
}) => {
  await trackEvent({
    name: "plugin_tested",
    params: {
      plugin_id: pluginId,
      success,
      response_time: responseTime,
    },
  });
};

/**
 * Tracks when stream fetching starts
 * @param {Object} params - Stream fetch parameters
 * @param {string} params.mediaId - Media identifier
 * @param {string} params.mediaType - Type of media (movie/tv)
 * @param {number} params.pluginCount - Number of plugins being queried
 */
export const trackStreamFetchStarted = async ({
  mediaId,
  mediaType,
  pluginCount,
}: {
  mediaId: string;
  mediaType: string;
  pluginCount: number;
}) => {
  await trackEvent({
    name: "stream_fetch_started",
    params: {
      media_id: mediaId,
      media_type: mediaType,
      plugin_count: pluginCount,
    },
  });
};

/**
 * Tracks when stream fetching completes
 * @param {Object} params - Stream fetch completion parameters
 * @param {string} params.mediaId - Media identifier
 * @param {number} params.streamCount - Number of streams found
 * @param {number} params.successfulPlugins - Number of plugins that returned results
 * @param {number} params.failedPlugins - Number of plugins that failed
 */
export const trackStreamFetchCompleted = async ({
  mediaId,
  streamCount,
  successfulPlugins,
  failedPlugins,
}: {
  mediaId: string;
  streamCount: number;
  successfulPlugins: number;
  failedPlugins: number;
}) => {
  await trackEvent({
    name: "stream_fetch_completed",
    params: {
      media_id: mediaId,
      stream_count: streamCount,
      successful_plugins: successfulPlugins,
      failed_plugins: failedPlugins,
    },
  });
};

/**
 * Tracks when stream fetching fails for a plugin
 * @param {Object} params - Stream fetch failure parameters
 * @param {string} params.pluginId - Plugin identifier
 * @param {string} params.mediaId - Media identifier
 * @param {string} params.error - Error message or type
 */
export const trackStreamFetchFailed = async ({
  pluginId,
  mediaId,
  error,
}: {
  pluginId: string;
  mediaId: string;
  error: string;
}) => {
  await trackEvent({
    name: "stream_fetch_failed",
    params: {
      plugin_id: pluginId,
      media_id: mediaId,
      error,
    },
  });
};

/**
 * Tracks when playback starts
 * @param {Object} params - Playback start parameters
 * @param {string} params.streamUrl - URL of the stream
 * @param {string} params.pluginId - Plugin providing the stream
 * @param {string} params.mediaId - Media identifier
 * @param {string} params.mediaType - Type of media
 * @param {string} [params.quality] - Stream quality
 */
export const trackPlaybackStarted = async ({
  streamUrl,
  pluginId,
  mediaId,
  mediaType,
  quality,
}: {
  streamUrl: string;
  pluginId: string;
  mediaId: string;
  mediaType: string;
  quality?: string;
}) => {
  await trackEvent({
    name: "playback_started",
    params: {
      stream_url: streamUrl,
      plugin_id: pluginId,
      media_id: mediaId,
      media_type: mediaType,
      quality: quality || "unknown",
    },
  });
};

/**
 * Tracks when playback ends
 * @param {Object} params - Playback end parameters
 * @param {string} params.mediaId - Media identifier
 * @param {number} params.watchTime - Time watched in seconds
 * @param {number} [params.duration] - Total duration of media
 * @param {boolean} [params.completed] - Whether playback completed
 */
export const trackPlaybackEnded = async ({
  mediaId,
  watchTime,
  duration,
  completed,
}: {
  mediaId: string;
  watchTime: number;
  duration?: number;
  completed?: boolean;
}) => {
  await trackEvent({
    name: "playback_ended",
    params: {
      media_id: mediaId,
      watch_time: watchTime,
      duration,
      completed: completed || false,
    },
  });
};

/**
 * Tracks when a playback error occurs
 * @param {Object} params - Playback error parameters
 * @param {string} params.mediaId - Media identifier
 * @param {string} params.pluginId - Plugin identifier
 * @param {string} params.error - Error message or code
 * @param {string} [params.streamUrl] - Stream URL that failed
 */
export const trackPlaybackError = async ({
  mediaId,
  pluginId,
  error,
  streamUrl,
}: {
  mediaId: string;
  pluginId: string;
  error: string;
  streamUrl?: string;
}) => {
  await trackEvent({
    name: "playback_error",
    params: {
      media_id: mediaId,
      plugin_id: pluginId,
      error,
      stream_url: streamUrl,
    },
  });
};

/**
 * Tracks when subtitles are enabled/disabled
 * @param {Object} params - Subtitle parameters
 * @param {boolean} params.enabled - Whether subtitles are enabled
 * @param {string} [params.language] - Subtitle language
 * @param {string} params.mediaId - Media identifier
 */
export const trackSubtitleToggle = async ({
  enabled,
  language,
  mediaId,
}: {
  enabled: boolean;
  language?: string;
  mediaId: string;
}) => {
  await trackEvent({
    name: "subtitle_toggle",
    params: {
      enabled,
      language: language || "unknown",
      media_id: mediaId,
    },
  });
};
