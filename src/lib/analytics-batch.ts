import { getAnalyticsInstance } from "./firebase";
import { logEvent } from "firebase/analytics";
import { AnalyticsEvent, AnalyticsParams } from "./analytics";
import { retryQueue } from "./analytics-retry";

const BATCH_SIZE = 10;
const BATCH_INTERVAL = 2000; // 2 seconds

class AnalyticsBatchProcessor {
  private eventQueue: AnalyticsEvent[] = [];
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    // Process any remaining events when the page is being unloaded
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.processEvents(true);
      });
    }
  }

  private async processEvents(immediate = false) {
    if (this.eventQueue.length === 0) return;

    if (immediate || this.eventQueue.length >= BATCH_SIZE) {
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];

      // Process events in parallel but still handle errors for each
      await Promise.allSettled(
        eventsToProcess.map(event =>
          retryQueue.queueEvent({
            name: event.name,
            params: {
              ...event.params,
              batch_processed: true,
            },
          })
        )
      );

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }

  public queueEvent(event: AnalyticsEvent) {
    this.eventQueue.push(event);

    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        void this.processEvents(true);
      }, BATCH_INTERVAL);
    }

    if (this.eventQueue.length >= BATCH_SIZE) {
      void this.processEvents();
    }
  }
}

export const batchProcessor = new AnalyticsBatchProcessor();

// Helper function to queue analytics events
export const queueAnalyticsEvent = (name: string, params?: AnalyticsParams) => {
  batchProcessor.queueEvent({ name, params });
};
