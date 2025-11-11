import React, { createContext, useContext, useState, useEffect } from "react";
import { Media } from "@/utils/types";
import {
  UserProfile,
  UserInteraction,
  UserPreference,
} from "./types/user-profile";
import { nlpService } from "@/utils/services/nlp-service";
import { recommendationEngine } from "@/utils/services/recommendation-engine";
import { streamingPlatformService } from "@/utils/services/streaming-platform";

const DEFAULT_USER_PREFERENCES: UserPreference = {
  genreWeights: {},
  actorWeights: {},
  directorWeights: {},
  keywords: {},
  yearRange: {
    start: 1970,
    end: new Date().getFullYear(),
    weight: 0.5,
  },
};

interface UserProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  updatePreferences: (preferences: Partial<UserPreference>) => Promise<void>;
  addInteraction: (interaction: UserInteraction) => Promise<void>;
  updateStreamingServices: (services: string[]) => Promise<void>;
  getRecommendations: (count?: number) => Promise<Media[]>;
  getSimilarContent: (mediaId: number) => Promise<Media[]>;
  getPersonalizedScore: (media: Media) => number;
  processWatchEvent: (
    mediaId: number,
    duration: number,
    completed: boolean
  ) => Promise<void>;
  analyzeUserFeedback: (
    text: string,
    mediaId: number,
    rating: number
  ) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(
  undefined
);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};

interface UserProfileProviderProps {
  children: React.ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user profile
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // In a real app, load from backend/localStorage
        const userId = "user-1"; // This would come from auth
        const initialProfile: UserProfile = {
          id: userId,
          preferences: DEFAULT_USER_PREFERENCES,
          interactions: [],
          recentSearches: [],
          watchHistory: [],
          recommendationFeedback: {
            accepted: [],
            rejected: [],
          },
          streamingServices: [],
        };

        setProfile(initialProfile);
      } catch (error) {
        console.error("Error initializing user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, []);

  const updatePreferences = async (
    preferences: Partial<UserPreference>
  ): Promise<void> => {
    if (!profile) return;

    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          ...preferences,
        },
      };
    });
  };

  const addInteraction = async (
    interaction: UserInteraction
  ): Promise<void> => {
    if (!profile) return;

    setProfile(prev => {
      if (!prev) return null;

      // Find the media item in watch history
      const mediaItem = prev.watchHistory.find(
        item => item.id === interaction.mediaId
      );
      if (!mediaItem) return prev;

      // Process interaction for recommendation engine
      recommendationEngine.processInteraction(prev, interaction, mediaItem);

      return {
        ...prev,
        interactions: [...prev.interactions, interaction],
      };
    });
  };

  const updateStreamingServices = async (services: string[]): Promise<void> => {
    if (!profile) return;

    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        streamingServices: services,
      };
    });
  };

  const getRecommendations = async (count: number = 10): Promise<Media[]> => {
    if (!profile) return [];

    try {
      // Get raw recommendations
      const availableContent = await Promise.all(
        profile.streamingServices.map(service =>
          streamingPlatformService.getProviderContent(service)
        )
      );

      const recommendations = await recommendationEngine.getRecommendations(
        profile,
        count,
        availableContent.flat()
      );

      // Filter based on streaming availability
      return streamingPlatformService.filterAvailableContent(
        recommendations,
        profile.streamingServices
      );
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return [];
    }
  };

  const getSimilarContent = async (mediaId: number): Promise<Media[]> => {
    if (!profile) return [];

    try {
      const referenceMedia = profile.watchHistory.find(
        item => item.id === mediaId
      );
      if (!referenceMedia) return [];

      const availableContent = await Promise.all(
        profile.streamingServices.map(service =>
          streamingPlatformService.getProviderContent(service)
        )
      );

      return recommendationEngine.getSimilarContent(
        referenceMedia,
        5,
        availableContent.flat()
      );
    } catch (error) {
      console.error("Error getting similar content:", error);
      return [];
    }
  };

  const getPersonalizedScore = (media: Media): number => {
    if (!profile) return 0;

    let score = 0;
    let weights = 0;

    // Genre preference matching
    if (media.genre_ids) {
      const genreScore =
        media.genre_ids.reduce(
          (sum, genreId) =>
            sum + (profile.preferences.genreWeights[genreId.toString()] || 0),
          0
        ) / media.genre_ids.length;
      score += genreScore * 0.4;
      weights += 0.4;
    }

    // Release year preference
    const year = new Date(
      media.release_date || media.first_air_date || ""
    ).getFullYear();
    if (year) {
      const yearScore =
        year >= profile.preferences.yearRange.start &&
        year <= profile.preferences.yearRange.end
          ? profile.preferences.yearRange.weight
          : 0;
      score += yearScore * 0.3;
      weights += 0.3;
    }

    // Keyword matching
    if (media.overview) {
      const keywordScore = Object.entries(profile.preferences.keywords).reduce(
        (sum, [keyword, weight]) =>
          sum +
          (media.overview?.toLowerCase().includes(keyword.toLowerCase())
            ? weight
            : 0),
        0
      );
      score += keywordScore * 0.3;
      weights += 0.3;
    }

    return weights > 0 ? score / weights : 0;
  };

  const processWatchEvent = async (
    mediaId: number,
    duration: number,
    completed: boolean
  ): Promise<void> => {
    if (!profile) return;

    const interaction: UserInteraction = {
      mediaId,
      rating: 0, // Will be updated when user rates
      timestamp: new Date(),
      watchDuration: duration,
      completed,
      sentiment: {
        score: 0,
        keywords: [],
      },
    };

    await addInteraction(interaction);
  };

  const analyzeUserFeedback = async (
    text: string,
    mediaId: number,
    rating: number
  ): Promise<void> => {
    if (!profile) return;

    // Analyze feedback using NLP
    const analysis = await nlpService.analyzeInput(text);

    const interaction: UserInteraction = {
      mediaId,
      rating,
      timestamp: new Date(),
      completed: true,
      sentiment: {
        score: analysis.sentiment,
        keywords: analysis.keywords,
      },
    };

    await addInteraction(interaction);

    // Update preferences based on extracted entities
    const preferenceUpdates: Partial<UserPreference> = {
      keywords: {
        ...profile.preferences.keywords,
      },
    };

    // Update keyword weights
    analysis.keywords.forEach(keyword => {
      preferenceUpdates.keywords![keyword] =
        (preferenceUpdates.keywords![keyword] || 0) +
        (analysis.sentiment > 0 ? 0.1 : -0.1);
    });

    await updatePreferences(preferenceUpdates);
  };

  const value: UserProfileContextValue = {
    profile,
    isLoading,
    updatePreferences,
    addInteraction,
    updateStreamingServices,
    getRecommendations,
    getSimilarContent,
    getPersonalizedScore,
    processWatchEvent,
    analyzeUserFeedback,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
