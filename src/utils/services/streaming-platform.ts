import { Media } from "@/utils/types";
import {
  ProviderResponse,
  AvailabilityResponse,
  ContentResponse,
  ProviderContentItem,
} from "@/utils/types/streaming-types";

interface StreamingProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
}

interface StreamingAvailability {
  providerId: string;
  url: string;
  quality: "SD" | "HD" | "4K";
  price?: number; // For rental/purchase options
  type: "subscription" | "rent" | "buy" | "free";
}

interface ContentMetadata {
  mediaId: number;
  availability: StreamingAvailability[];
  lastUpdated: Date;
}

class StreamingPlatformService {
  private static instance: StreamingPlatformService;
  private providers: Map<string, StreamingProvider> = new Map();
  private contentCache: Map<number, ContentMetadata> = new Map();

  // Cache TTL in milliseconds (24 hours)
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  private constructor() {
    this.initializeProviders();
  }

  public static getInstance(): StreamingPlatformService {
    if (!StreamingPlatformService.instance) {
      StreamingPlatformService.instance = new StreamingPlatformService();
    }
    return StreamingPlatformService.instance;
  }

  /**
   * Initialize streaming providers with their configurations
   */
  private initializeProviders(): void {
    const defaultProviders: StreamingProvider[] = [
      // Mock streaming services for demo
      {
        id: "netflix",
        name: "Netflix",
        baseUrl: "https://api.netflix.com/v1",
        apiKey: "mock-netflix-key",
      },
      {
        id: "prime",
        name: "Amazon Prime Video",
        baseUrl: "https://api.primevideo.com/v1",
        apiKey: "mock-prime-key",
      },
      {
        id: "hulu",
        name: "Hulu",
        baseUrl: "https://api.hulu.com/v1",
        apiKey: "mock-hulu-key",
      },
      {
        id: "disney",
        name: "Disney+",
        baseUrl: "https://api.disneyplus.com/v1",
        apiKey: "mock-disney-key",
      },
      // Add more providers as needed
    ];

    defaultProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  /**
   * Get streaming availability for a specific media item
   */
  public async getStreamingAvailability(
    mediaId: number
  ): Promise<StreamingAvailability[]> {
    const cached = this.contentCache.get(mediaId);

    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached.availability;
    }

    const availability = await this.fetchAvailabilityFromProviders(mediaId);

    this.contentCache.set(mediaId, {
      mediaId,
      availability,
      lastUpdated: new Date(),
    });

    return availability;
  }

  /**
   * Get all available content from a specific provider
   */
  public async getProviderContent(providerId: string): Promise<Media[]> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    try {
      const response = await this.fetchFromProvider<ContentResponse>(
        provider,
        "catalog"
      );
      return this.normalizeProviderContent(
        response as ContentResponse,
        provider
      );
    } catch (error) {
      console.error(`Error fetching content from ${provider.name}:`, error);
      return [];
    }
  }

  /**
   * Filter recommendations based on user's streaming services
   */
  public async filterAvailableContent(
    recommendations: Media[],
    userServices: string[]
  ): Promise<Media[]> {
    const availabilityPromises = recommendations.map(async media => {
      const availability = await this.getStreamingAvailability(media.id);
      const isAvailable = availability.some(
        a => userServices.includes(a.providerId) && a.type === "subscription"
      );

      return {
        media,
        isAvailable,
        availability,
      };
    });

    const results = await Promise.all(availabilityPromises);

    // Prioritize available content but include some unavailable recommendations
    const available = results.filter(r => r.isAvailable).map(r => r.media);
    const unavailable = results.filter(r => !r.isAvailable).map(r => r.media);

    // Return all available content plus up to 30% unavailable content
    const unavailableCount = Math.ceil(recommendations.length * 0.3);
    return [...available, ...unavailable.slice(0, unavailableCount)];
  }

  /**
   * Update streaming availability cache for multiple media items
   */
  public async refreshAvailabilityCache(mediaIds: number[]): Promise<void> {
    const updatePromises = mediaIds.map(async mediaId => {
      const availability = await this.fetchAvailabilityFromProviders(mediaId);
      this.contentCache.set(mediaId, {
        mediaId,
        availability,
        lastUpdated: new Date(),
      });
    });

    await Promise.all(updatePromises);
  }

  private async fetchAvailabilityFromProviders(
    mediaId: number
  ): Promise<StreamingAvailability[]> {
    const availabilityPromises = Array.from(this.providers.values()).map(
      async provider => {
        try {
          const response = await this.fetchFromProvider<AvailabilityResponse>(
            provider,
            `content/${mediaId}/availability`
          );
          return this.normalizeAvailability(
            response as AvailabilityResponse,
            provider.id
          );
        } catch (error) {
          console.error(
            `Error fetching availability from ${provider.name}:`,
            error
          );
          return [];
        }
      }
    );

    const results = await Promise.all(availabilityPromises);
    return results.flat();
  }

  private async fetchFromProvider<T extends ProviderResponse>(
    provider: StreamingProvider,
    endpoint: string
  ): Promise<T> {
    if (!provider.apiKey) {
      console.warn(`No API key configured for ${provider.name}`);
      return null;
    }

    try {
      const response = await fetch(`${provider.baseUrl}/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${provider.name}:`, error);
      throw error;
    }
  }

  private normalizeAvailability(
    rawData: AvailabilityResponse,
    providerId: string
  ): StreamingAvailability[] {
    // Implementation would depend on each provider's response format
    // This is a simplified example
    if (!rawData || !rawData.data || !rawData.data.availability) {
      return [];
    }

    return rawData.data.availability.map(item => ({
      providerId,
      url: item.url,
      quality: item.quality || "HD",
      price: item.price,
      type: item.type || "subscription",
    }));
  }

  private normalizeProviderContent(
    rawData: ContentResponse,
    provider: StreamingProvider
  ): Media[] {
    // Implementation would depend on each provider's response format
    // This is a simplified example
    if (!rawData || !rawData.data || !rawData.data.content) {
      return [];
    }

    return rawData.data.content.map(item => ({
      id: item.id,
      title: item.title,
      overview: item.description,
      poster_path: item.poster,
      backdrop_path: item.backdrop,
      media_type: item.type,
      genre_ids: item.genres,
      vote_average: item.rating,
      release_date: item.releaseDate,
      first_air_date: item.firstAirDate,
    }));
  }

  private isCacheValid(lastUpdated: Date): boolean {
    return Date.now() - lastUpdated.getTime() < this.CACHE_TTL;
  }
}

export const streamingPlatformService = StreamingPlatformService.getInstance();
export type { StreamingProvider, StreamingAvailability, ContentMetadata };
