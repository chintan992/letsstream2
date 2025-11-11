import { getAnalyticsInstance } from "./firebase";
import { logEvent } from "firebase/analytics";
import { AnalyticsEvent } from "./analytics";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface RetryQueueItem {
  event: AnalyticsEvent;
  retryCount: number;
  timestamp: number;
}

class AnalyticsRetryQueue {
  private retryQueue: RetryQueueItem[] = [];
  private isProcessing = false;

  constructor() {
    // Try to process failed events periodically
    setInterval(() => this.processRetryQueue(), RETRY_DELAY);

    // Save failed events before page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.saveFailedEvents();
      });

      // Restore failed events from previous session
      this.restoreFailedEvents();
    }
  }

  private async processRetryQueue() {
    if (this.isProcessing || this.retryQueue.length === 0) return;

    this.isProcessing = true;
    const now = Date.now();

    // Process events that are ready for retry
    const itemsToRetry = this.retryQueue.filter(
      item => now - item.timestamp >= RETRY_DELAY * Math.pow(2, item.retryCount)
    );

    for (const item of itemsToRetry) {
      try {
        await this.sendEvent(item.event);
        // Remove successful event from queue
        this.retryQueue = this.retryQueue.filter(i => i !== item);
      } catch (error) {
        if (item.retryCount >= MAX_RETRIES) {
          // Remove failed event after max retries
          this.retryQueue = this.retryQueue.filter(i => i !== item);
          console.error(
            "Failed to send analytics event after max retries:",
            item.event
          );
        } else {
          // Increment retry count
          item.retryCount++;
          item.timestamp = now;
        }
      }
    }

    this.isProcessing = false;
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    const analytics = await getAnalyticsInstance();
    if (!analytics) {
      throw new Error("Analytics not supported in this environment");
    }

    return new Promise((resolve, reject) => {
      try {
        logEvent(analytics, event.name, {
          ...event.params,
          retry_count: event.params?.retry_count || 0,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  public async queueEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.sendEvent(event);
    } catch (error) {
      // Add failed event to retry queue
      this.retryQueue.push({
        event: {
          ...event,
          params: {
            ...event.params,
            retry_count: 0,
          },
        },
        retryCount: 0,
        timestamp: Date.now(),
      });
    }
  }

  private saveFailedEvents() {
    if (this.retryQueue.length > 0) {
      try {
        localStorage.setItem(
          "analyticsRetryQueue",
          JSON.stringify(this.retryQueue)
        );
      } catch (error) {
        console.error("Failed to save analytics retry queue:", error);
      }
    }
  }

  private restoreFailedEvents() {
    try {
      const savedQueue = localStorage.getItem("analyticsRetryQueue");
      if (savedQueue) {
        this.retryQueue = JSON.parse(savedQueue);
        localStorage.removeItem("analyticsRetryQueue");
      }
    } catch (error) {
      console.error("Failed to restore analytics retry queue:", error);
    }
  }
}

export const retryQueue = new AnalyticsRetryQueue();
