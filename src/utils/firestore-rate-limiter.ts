import { rateLimiter } from "./rate-limiter";

interface FirestoreOperationConfig {
  reads: number;
  writes: number;
  deletes: number;
}

class FirestoreRateLimiter {
  private static instance: FirestoreRateLimiter;
  private baseUrl = "https://firestore.googleapis.com/v1/";

  private operationLimits: FirestoreOperationConfig = {
    reads: 1000, // 1000 reads per minute
    writes: 500, // 500 writes per minute
    deletes: 250, // 250 deletes per minute
  };

  private constructor() {
    this.initializeFirestoreLimits();
  }

  static getInstance(): FirestoreRateLimiter {
    if (!FirestoreRateLimiter.instance) {
      FirestoreRateLimiter.instance = new FirestoreRateLimiter();
    }
    return FirestoreRateLimiter.instance;
  }

  private initializeFirestoreLimits() {
    // Set specific limits for Firestore operations
    rateLimiter.setLimit("firestore_read", {
      maxRequests: this.operationLimits.reads,
      windowMs: 60 * 1000, // 1 minute
    });

    rateLimiter.setLimit("firestore_write", {
      maxRequests: this.operationLimits.writes,
      windowMs: 60 * 1000,
    });

    rateLimiter.setLimit("firestore_delete", {
      maxRequests: this.operationLimits.deletes,
      windowMs: 60 * 1000,
    });
  }

  private getOperationType(url: string, method: string): string {
    if (method === "GET" || method === "HEAD") {
      return "firestore_read";
    } else if (method === "DELETE") {
      return "firestore_delete";
    } else {
      return "firestore_write";
    }
  }

  async isOperationAllowed(
    url: string,
    method: string,
    clientId: string
  ): Promise<boolean> {
    if (!url.startsWith(this.baseUrl)) {
      return true; // Not a Firestore operation
    }

    const operationType = this.getOperationType(url, method);
    return rateLimiter.isAllowed(operationType, clientId);
  }

  getOperationLimits(): FirestoreOperationConfig {
    return { ...this.operationLimits };
  }

  async getRateLimitInfo(url: string, method: string, clientId: string) {
    if (!url.startsWith(this.baseUrl)) {
      return null;
    }

    const operationType = this.getOperationType(url, method);
    return {
      operationType,
      ...(await rateLimiter.getRateLimitInfo(operationType, clientId)),
    };
  }

  setOperationLimits(config: Partial<FirestoreOperationConfig>) {
    this.operationLimits = {
      ...this.operationLimits,
      ...config,
    };
    this.initializeFirestoreLimits(); // Reinitialize with new limits
  }

  // Utility method to check if we're approaching limits
  async checkRateLimitWarning(
    url: string,
    method: string,
    clientId: string
  ): Promise<string | null> {
    const info = await this.getRateLimitInfo(url, method, clientId);
    if (!info) return null;

    const { remaining, resetIn } = info;
    const warningThreshold = 0.1; // 10% of limit remaining

    if (
      remaining <=
      this.operationLimits[
        info.operationType.split("_")[1] as keyof FirestoreOperationConfig
      ] *
        warningThreshold
    ) {
      return `Warning: Approaching Firestore ${info.operationType} limit. ${remaining} operations remaining. Resets in ${Math.ceil(resetIn / 1000)} seconds.`;
    }

    return null;
  }
}

export const firestoreRateLimiter = FirestoreRateLimiter.getInstance();
