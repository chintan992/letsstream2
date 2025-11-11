import { useCallback } from "react";
import { queueAnalyticsEvent } from "@/lib/analytics-batch";
import type { AnalyticsEvent, AnalyticsParams } from "../lib/analytics";

export function useAnalytics() {
  const logEvent = useCallback((event: AnalyticsEvent) => {
    queueAnalyticsEvent(event.name, event.params);
  }, []);

  const logButtonClick = useCallback(
    (buttonName: string, additionalParams: AnalyticsParams = {}) => {
      queueAnalyticsEvent("button_click", {
        button_name: buttonName,
        ...additionalParams,
      });
    },
    []
  );

  const logFormSubmission = useCallback(
    (
      formName: string,
      success: boolean,
      additionalParams: AnalyticsParams = {}
    ) => {
      queueAnalyticsEvent("form_submission", {
        form_name: formName,
        success,
        ...additionalParams,
      });
    },
    []
  );

  const logMediaInteraction = useCallback(
    (mediaType: string, mediaId: string, action: string) => {
      queueAnalyticsEvent("media_interaction", {
        media_type: mediaType,
        media_id: mediaId,
        action,
      });
    },
    []
  );

  const logMediaView = useCallback(
    (
      mediaType: "movie" | "tv",
      mediaId: string,
      title: string,
      duration?: number
    ) => {
      queueAnalyticsEvent("media_view", {
        content_type: mediaType,
        item_id: mediaId,
        title,
        duration,
      });
    },
    []
  );

  const logMediaComplete = useCallback(
    (
      mediaType: "movie" | "tv",
      mediaId: string,
      title: string,
      watchTime: number
    ) => {
      queueAnalyticsEvent("media_complete", {
        content_type: mediaType,
        item_id: mediaId,
        title,
        watch_time: watchTime,
      });
    },
    []
  );

  const logMediaPreference = useCallback(
    (mediaType: "movie" | "tv", action: "select" | "browse" | "favorite") => {
      queueAnalyticsEvent("media_preference", {
        content_type: mediaType,
        action,
      });
    },
    []
  );

  return {
    logEvent,
    logButtonClick,
    logFormSubmission,
    logMediaInteraction,
    logMediaView,
    logMediaComplete,
    logMediaPreference,
  };
}
