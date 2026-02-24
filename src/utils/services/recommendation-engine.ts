import { Media } from "@/utils/types";
import { UserProfile, UserInteraction } from "@/contexts/types/user-profile";
import { nlpService } from "./nlp-service";

interface RecommendationScore {
  mediaId: number;
  score: number;
  factors: {
    contentBased: number;
    collaborative: number;
    personalPreference: number;
    recency: number;
  };
}

class RecommendationEngine {
  private static instance: RecommendationEngine;
  private userProfiles: Map<string, UserProfile> = new Map();

  private constructor() {}

  public static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  /**
   * Get personalized recommendations for a user
   */
  public async getRecommendations(
    userProfile: UserProfile,
    count: number = 10,
    availableContent: Media[]
  ): Promise<Media[]> {
    const scores: RecommendationScore[] = await Promise.all(
      availableContent.map(async media => ({
        mediaId: media.id,
        score: await this.calculateOverallScore(media, userProfile),
        factors: {
          contentBased: await this.calculateContentBasedScore(
            media,
            userProfile
          ),
          collaborative: await this.calculateCollaborativeScore(
            media,
            userProfile
          ),
          personalPreference: this.calculatePersonalPreferenceScore(
            media,
            userProfile
          ),
          recency: this.calculateRecencyScore(media),
        },
      }))
    );

    // Sort by score and get top recommendations
    const topRecommendations = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(score => availableContent.find(m => m.id === score.mediaId))
      .filter((media): media is Media => media !== undefined);

    return this.diversifyRecommendations(topRecommendations, userProfile);
  }

  /**
   * Find similar content based on a reference media item
   */
  public async getSimilarContent(
    referenceMedia: Media,
    count: number = 5,
    availableContent: Media[]
  ): Promise<Media[]> {
    const similarities = await Promise.all(
      availableContent
        .filter(media => media.id !== referenceMedia.id)
        .map(async media => ({
          media,
          similarity: await nlpService.calculateSimilarity(
            referenceMedia,
            media
          ),
        }))
    );

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, count)
      .map(item => item.media);
  }

  /**
   * Update user profile based on interaction
   */
  public async processInteraction(
    userProfile: UserProfile,
    interaction: UserInteraction,
    media: Media
  ): Promise<void> {
    const preferenceUpdates = await nlpService.processUserFeedback(
      interaction,
      media
    );

    // Update preference weights
    preferenceUpdates.forEach(update => {
      switch (update.type) {
        case "genre":
          userProfile.preferences.genreWeights[update.value] =
            (userProfile.preferences.genreWeights[update.value] || 0) +
            update.weight;
          break;
        case "actor":
          userProfile.preferences.actorWeights[update.value] =
            (userProfile.preferences.actorWeights[update.value] || 0) +
            update.weight;
          break;
        case "director":
          userProfile.preferences.directorWeights[update.value] =
            (userProfile.preferences.directorWeights[update.value] || 0) +
            update.weight;
          break;
        case "keyword":
          userProfile.preferences.keywords[update.value] =
            (userProfile.preferences.keywords[update.value] || 0) +
            update.weight;
          break;
      }
    });

    // Update recommendation feedback
    if (interaction.rating >= 4) {
      userProfile.recommendationFeedback.accepted.push(interaction.mediaId);
    } else if (interaction.rating <= 2) {
      userProfile.recommendationFeedback.rejected.push(interaction.mediaId);
    }
  }

  private async calculateOverallScore(
    media: Media,
    userProfile: UserProfile
  ): Promise<number> {
    const weights = {
      contentBased: 0.4,
      collaborative: 0.3,
      personalPreference: 0.2,
      recency: 0.1,
    };

    const scores = {
      contentBased: await this.calculateContentBasedScore(media, userProfile),
      collaborative: await this.calculateCollaborativeScore(media, userProfile),
      personalPreference: this.calculatePersonalPreferenceScore(
        media,
        userProfile
      ),
      recency: this.calculateRecencyScore(media),
    };

    return Object.entries(weights).reduce(
      (total, [key, weight]) =>
        total + scores[key as keyof typeof scores] * weight,
      0
    );
  }

  private async calculateContentBasedScore(
    media: Media,
    userProfile: UserProfile
  ): Promise<number> {
    let score = 0;
    let weights = 0;

    // Genre matching
    if (media.genre_ids) {
      const genreScore =
        media.genre_ids.reduce(
          (sum, genreId) =>
            sum +
            (userProfile.preferences.genreWeights[genreId.toString()] || 0),
          0
        ) / media.genre_ids.length;
      score += genreScore * 0.4;
      weights += 0.4;
    }

    // Keyword matching from overview
    if (media.overview) {
      const overviewScore = Object.entries(
        userProfile.preferences.keywords
      ).reduce(
        (sum, [keyword, weight]) =>
          sum +
          (media.overview?.toLowerCase().includes(keyword.toLowerCase())
            ? weight
            : 0),
        0
      );
      score += overviewScore * 0.3;
      weights += 0.3;
    }

    // Year preference matching
    const mediaYear = new Date(
      media.release_date || media.first_air_date || ""
    ).getFullYear();
    if (
      mediaYear &&
      userProfile.preferences.yearRange.start <= mediaYear &&
      mediaYear <= userProfile.preferences.yearRange.end
    ) {
      score += userProfile.preferences.yearRange.weight * 0.3;
      weights += 0.3;
    }

    return weights > 0 ? score / weights : 0;
  }

  private async calculateCollaborativeScore(
    media: Media,
    userProfile: UserProfile
  ): Promise<number> {
    // Get other users who liked this media
    const similarUsers = Array.from(this.userProfiles.values()).filter(
      profile =>
        profile.id !== userProfile.id &&
        profile.interactions.some(i => i.mediaId === media.id && i.rating >= 4)
    );

    if (similarUsers.length === 0) return 0;

    // Calculate similarity between users based on common interactions
    const userSimilarities = await Promise.all(
      similarUsers.map(async otherUser => {
        const commonInteractions = userProfile.interactions.filter(i1 =>
          otherUser.interactions.some(i2 => i2.mediaId === i1.mediaId)
        );

        if (commonInteractions.length === 0) return 0;

        const ratingCorrelation =
          commonInteractions.reduce((sum, i1) => {
            const i2 = otherUser.interactions.find(
              i => i.mediaId === i1.mediaId
            );
            return i2 ? sum + (i1.rating - 3) * (i2.rating - 3) : sum;
          }, 0) / commonInteractions.length;

        return Math.max(0, ratingCorrelation / 4); // Normalize to [0,1]
      })
    );

    // Weight the recommendations by user similarity
    const weightedScore = similarUsers.reduce((sum, user, index) => {
      const interaction = user.interactions.find(i => i.mediaId === media.id);
      return interaction
        ? sum + (interaction.rating / 5) * userSimilarities[index]
        : sum;
    }, 0);

    return weightedScore / similarUsers.length;
  }

  private calculatePersonalPreferenceScore(
    media: Media,
    userProfile: UserProfile
  ): number {
    // Check if the media was previously accepted or rejected
    if (userProfile.recommendationFeedback.accepted.includes(media.id)) {
      return 0.8; // High score but not maximum to allow for some variety
    }
    if (userProfile.recommendationFeedback.rejected.includes(media.id)) {
      return 0.1; // Low score but not zero to allow for changing preferences
    }

    // Check if similar to previously liked content
    const similarToLiked = userProfile.interactions
      .filter(i => i.rating >= 4)
      .some(i => {
        const likedMedia = userProfile.watchHistory.find(
          m => m.id === i.mediaId
        );
        return (
          likedMedia &&
          media.genre_ids?.some(g => likedMedia.genre_ids?.includes(g))
        );
      });

    return similarToLiked ? 0.7 : 0.5;
  }

  private calculateRecencyScore(media: Media): number {
    const releaseDate = new Date(
      media.release_date || media.first_air_date || ""
    );
    if (!releaseDate.getTime()) return 0.5; // Default score for unknown dates

    const now = new Date();
    const monthsOld =
      (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Exponential decay over 24 months
    return Math.exp(-monthsOld / 24);
  }

  private diversifyRecommendations(
    recommendations: Media[],
    userProfile: UserProfile
  ): Media[] {
    // Ensure we don't recommend too many items from the same genre
    const genreCounts = new Map<number, number>();
    const maxPerGenre = Math.ceil(recommendations.length / 3);

    return recommendations.filter(media => {
      if (!media.genre_ids) return true;

      // Check if any genre has reached its limit
      const shouldInclude = media.genre_ids.every(genreId => {
        const count = genreCounts.get(genreId) || 0;
        return count < maxPerGenre;
      });

      if (shouldInclude) {
        // Update genre counts
        media.genre_ids.forEach(genreId => {
          genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
        });
      }

      return shouldInclude;
    });
  }
}

export const recommendationEngine = RecommendationEngine.getInstance();
