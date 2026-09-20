interface RateLimitConfig {
  capacity: number;
  refillRate: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private buckets = new Map<string, TokenBucket>();
  private config: RateLimitConfig;
  private clientId: string;

  private constructor(capacity: number, refillRatePerSecond: number) {
    this.config = { capacity, refillRate: refillRatePerSecond };
    this.clientId = crypto.randomUUID();
  }

  static getInstance(capacity: number = 100, windowMs: number = 60000): RateLimiter {
    const refillRate = capacity / (windowMs / 1000);
    const key = `${capacity}-${windowMs}`;
    if (!RateLimiter.instances.has(key)) {
      RateLimiter.instances.set(key, new RateLimiter(capacity, refillRate));
    }
    return RateLimiter.instances.get(key)!;
  }

  private refill(bucket: TokenBucket, now: number): TokenBucket {
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const refillAmount = elapsedSeconds * this.config.refillRate;
    return {
      tokens: Math.min(this.config.capacity, bucket.tokens + refillAmount),
      lastRefill: now,
    };
  }

  private getBucket(key: string): TokenBucket {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing) {
      const newBucket = { tokens: this.config.capacity, lastRefill: now };
      this.buckets.set(key, newBucket);
      return newBucket;
    }
    const refilled = this.refill(existing, now);
    this.buckets.set(key, refilled);
    return refilled;
  }

  async canExecute(resourceKey: string = "default"): Promise<boolean> {
    const bucket = this.getBucket(resourceKey);
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(resourceKey, bucket);
      return true;
    }
    return false;
  }

  async takeTokens(resourceKey: string, tokens: number = 1): Promise<boolean> {
    const bucket = this.getBucket(resourceKey);
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      this.buckets.set(resourceKey, bucket);
      return true;
    }
    return false;
  }

  getAvailableTokens(resourceKey: string = "default"): number {
    const bucket = this.getBucket(resourceKey);
    return Math.floor(bucket.tokens);
  }

  getTimeToNextToken(resourceKey: string = "default"): number {
    const bucket = this.getBucket(resourceKey);
    if (bucket.tokens >= 1) return 0;
    const tokensNeeded = 1 - bucket.tokens;
    return Math.ceil((tokensNeeded / this.config.refillRate) * 1000);
  }

  reset(resourceKey: string = "default"): void {
    this.buckets.delete(resourceKey);
  }

  resetAll(): void {
    this.buckets.clear();
  }

  getConfig(): RateLimitConfig {
    return { ...this.config };
  }
}

export const readRateLimiter = RateLimiter.getInstance(200, 300000);
export const writeRateLimiter = RateLimiter.getInstance(100, 300000);
export const deleteRateLimiter = RateLimiter.getInstance(50, 300000);