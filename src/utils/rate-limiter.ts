interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests allowed
  windowMs: number; // Time window in milliseconds
}

interface RequestEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private limits: Map<string, RateLimitConfig>;
  private requests: Map<string, Map<string, RequestEntry>>;
  private clientId: string;

  private constructor(
    private maxRequests: number,
    private windowMs: number
  ) {
    this.limits = new Map();
    this.requests = new Map();
    this.initializeDefaultLimits();
    this.clientId = crypto.randomUUID();
  }

  static getInstance(
    maxRequests: number = 100,
    windowMs: number = 60000
  ): RateLimiter {
    const key = `${maxRequests}-${windowMs}`;
    if (!RateLimiter.instances.has(key)) {
      RateLimiter.instances.set(key, new RateLimiter(maxRequests, windowMs));
    }
    return RateLimiter.instances.get(key)!;
  }

  private initializeDefaultLimits() {
    // Set default rate limits for different types of resources
    this.setLimit("api", { maxRequests: 100, windowMs: 60 * 1000 }); // 100 requests per minute
    this.setLimit("image", { maxRequests: 200, windowMs: 60 * 1000 }); // 200 requests per minute
    this.setLimit("static", { maxRequests: 300, windowMs: 60 * 1000 }); // 300 requests per minute
  }

  setLimit(type: string, config: RateLimitConfig) {
    this.limits.set(type, config);
    this.requests.set(type, new Map());
  }

  private getRequestType(url: string): string {
    const parsedUrl = new URL(url);

    if (parsedUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return "image";
    } else if (parsedUrl.pathname.match(/\.(js|css|woff2|ttf)$/i)) {
      return "static";
    } else if (
      parsedUrl.hostname.includes("api.themoviedb.org") ||
      parsedUrl.hostname.includes("firestore.googleapis.com")
    ) {
      return "api";
    }

    return "static"; // Default to static rate limit for unknown types
  }

  private cleanupOldEntries(type: string) {
    const entries = this.requests.get(type);
    const now = Date.now();

    if (entries) {
      for (const [key, entry] of entries.entries()) {
        if (now >= entry.resetTime) {
          entries.delete(key);
        }
      }
    }
  }

  async isAllowed(url: string, clientId: string): Promise<boolean> {
    const type = this.getRequestType(url);
    const limit = this.limits.get(type);

    if (!limit) return true; // No limit configured, allow request

    const entries = this.requests.get(type);
    if (!entries) return true;

    this.cleanupOldEntries(type);

    const now = Date.now();
    const key = `${clientId}:${url}`;
    const entry = entries.get(key) || {
      count: 0,
      resetTime: now + limit.windowMs,
    };

    // Reset count if window has expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + limit.windowMs;
    }

    // Check if limit is exceeded
    if (entry.count >= limit.maxRequests) {
      return false;
    }

    // Increment counter and update entry
    entry.count++;
    entries.set(key, entry);

    return true;
  }

  getRemainingRequests(url: string, clientId: string): number {
    const type = this.getRequestType(url);
    const limit = this.limits.get(type);

    if (!limit) return Infinity;

    const entries = this.requests.get(type);
    if (!entries) return limit.maxRequests;

    const key = `${clientId}:${url}`;
    const entry = entries.get(key);

    if (!entry) return limit.maxRequests;

    const now = Date.now();
    if (now >= entry.resetTime) return limit.maxRequests;

    return Math.max(0, limit.maxRequests - entry.count);
  }

  getTimeToReset(url: string, clientId: string): number {
    const type = this.getRequestType(url);
    const limit = this.limits.get(type);

    if (!limit) return 0;

    const entries = this.requests.get(type);
    if (!entries) return 0;

    const key = `${clientId}:${url}`;
    const entry = entries.get(key);

    if (!entry) return 0;

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  // Utility method to get rate limit info
  async getRateLimitInfo(url: string, clientId: string) {
    return {
      allowed: await this.isAllowed(url, clientId),
      remaining: this.getRemainingRequests(url, clientId),
      resetIn: this.getTimeToReset(url, clientId),
      type: this.getRequestType(url),
    };
  }

  async canExecute(): Promise<boolean> {
    // Use a dummy URL and client ID since we're just checking general rate limits
    const dummyUrl = "rate-limit://internal";
    const dummyClientId = this.clientId || "default";
    return this.isAllowed(dummyUrl, dummyClientId);
  }
}

export const rateLimiter = RateLimiter.getInstance();
