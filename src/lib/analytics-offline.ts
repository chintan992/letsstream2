// This file handles offline analytics events and syncs them when online
import { Analytics, AnalyticsCallOptions, logEvent } from 'firebase/analytics';
import { AnalyticsEvent } from './analytics';

const OFFLINE_QUEUE_KEY = 'offline_analytics_queue';
const MAX_QUEUE_SIZE = 100;

interface QueuedAnalyticsEvent extends AnalyticsEvent {
  timestamp: number;
  retryCount: number;
}

class OfflineAnalyticsQueue {
  private queue: QueuedAnalyticsEvent[] = [];
  private isProcessing = false;

  constructor() {
    this.loadQueueFromStorage();
    this.setupOnlineListener();
  }

  private loadQueueFromStorage() {
    try {
      const savedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
      }
    } catch (error) {
      console.error('Failed to load offline analytics queue:', error);
    }
  }

  private saveQueueToStorage() {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline analytics queue:', error);
      // If storage is full, remove older events
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
      }
    }
  }

  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void this.processQueue();
      });
    }
  }

  public addToQueue(event: AnalyticsEvent) {
    const queuedEvent: QueuedAnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(queuedEvent);
    
    // Keep queue size in check
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
    }

    this.saveQueueToStorage();

    // Try to process queue if we're online
    if (navigator.onLine) {
      void this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      const eventsToProcess = [...this.queue];
      this.queue = [];
      this.saveQueueToStorage();

      await Promise.allSettled(
        eventsToProcess.map(async event => {
          try {
            await this.sendEvent(event);
          } catch (error) {
            // If sending fails, add back to queue with incremented retry count
            if (event.retryCount < 3) {
              this.queue.push({
                ...event,
                retryCount: event.retryCount + 1
              });
            } else {
              console.error('Failed to send analytics event after max retries:', event);
            }
          }
        })
      );

      // Save any failed events that were added back to the queue
      if (this.queue.length > 0) {
        this.saveQueueToStorage();
      }

    } catch (error) {
      console.error('Error processing offline analytics queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendEvent(event: QueuedAnalyticsEvent): Promise<void> {
    try {
      const analytics = await import('./firebase').then(m => m.getAnalyticsInstance());
      if (!analytics) {
        throw new Error('Analytics not initialized');
      }

      await this.logEventWithTimeout(analytics, event.name, {
        ...event.params,
        offline_queued: true,
        queued_at: event.timestamp,
        retry_count: event.retryCount
      });
    } catch (error) {
      console.error('Failed to send queued analytics event:', error);
      throw error;
    }
  }

  private logEventWithTimeout(
    analytics: Analytics,
    eventName: string,
    eventParams: Record<string, unknown>,
    timeout = 5000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Analytics event timed out'));
      }, timeout);

      try {
        logEvent(analytics, eventName, eventParams, { global: true });
        clearTimeout(timeoutId);
        resolve();
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }
}

export const offlineQueue = new OfflineAnalyticsQueue();
