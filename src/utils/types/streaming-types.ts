export interface ProviderResponse {
  status: "success" | "error";
  error?: string;
  data: unknown;
}

export interface AvailabilityResponse extends ProviderResponse {
  data: {
    availability: {
      url: string;
      quality: "SD" | "HD" | "4K";
      price?: number;
      type: "subscription" | "rent" | "buy" | "free";
    }[];
  };
}

export interface ProviderContentItem {
  id: number;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  type: "movie" | "tv";
  genres: number[];
  rating: number;
  releaseDate?: string;
  firstAirDate?: string;
}

export interface ContentResponse extends ProviderResponse {
  data: {
    content: ProviderContentItem[];
  };
}
