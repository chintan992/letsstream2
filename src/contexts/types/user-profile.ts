import { Media } from "@/utils/types";

export interface UserPreference {
  genreWeights: Record<string, number>; // Weight for each genre
  actorWeights: Record<string, number>; // Weight for each actor
  directorWeights: Record<string, number>; // Weight for each director
  keywords: Record<string, number>; // Weight for extracted keywords/themes
  yearRange: {
    start: number;
    end: number;
    weight: number;
  };
}

export interface UserInteraction {
  mediaId: number;
  rating: number; // 1-5 scale
  timestamp: Date;
  watchDuration?: number; // In seconds
  completed: boolean;
  sentiment: {
    score: number; // -1 to 1
    keywords: string[];
  };
}

export interface UserProfile {
  id: string;
  preferences: UserPreference;
  interactions: UserInteraction[];
  recentSearches: string[];
  watchHistory: Media[];
  recommendationFeedback: {
    accepted: number[]; // Media IDs that user liked
    rejected: number[]; // Media IDs that user rejected
  };
  streamingServices: string[]; // List of user's subscribed streaming services
}

export interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  updatePreferences: (preferences: Partial<UserPreference>) => Promise<void>;
  addInteraction: (interaction: UserInteraction) => Promise<void>;
  updateStreamingServices: (services: string[]) => Promise<void>;
  getRecommendations: (count?: number) => Promise<Media[]>;
  getSimilarContent: (mediaId: number) => Promise<Media[]>;
  getPersonalizedScore: (media: Media) => number;
}
