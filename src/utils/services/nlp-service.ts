import { UserInteraction, UserPreference } from "@/contexts/types/user-profile";
import { Media } from "@/utils/types";

interface EntityExtraction {
  genres: string[];
  actors: string[];
  directors: string[];
  keywords: string[];
  timeReferences: string[];
  sentiment: number;
}

interface PreferenceUpdate {
  type: "genre" | "actor" | "director" | "keyword" | "year";
  value: string;
  weight: number;
}

class NLPService {
  private static instance: NLPService;

  private constructor() { }

  public static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  /**
   * Analyzes user input to extract meaningful entities and sentiment
   */
  public async analyzeInput(text: string): Promise<EntityExtraction> {
    // Process the input text to extract various entities
    const processedText = text.toLowerCase();

    // Improved extraction using regular expressions and keyword matching
    const genres = this.extractGenres(processedText);
    const actors = this.extractActors(processedText);
    const directors = this.extractDirectors(processedText);
    const keywords = this.extractKeywords(processedText);
    const timeReferences = this.extractTimeReferences(processedText);
    const sentiment = this.analyzeSentiment(processedText);

    console.debug("Extracted entities:", {
      genres,
      actors,
      directors,
      keywords,
      timeReferences,
      sentiment,
    });

    return {
      genres,
      actors,
      directors,
      keywords,
      timeReferences,
      sentiment,
    };
  }

  /**
   * Analyzes user feedback to update preferences
   */
  public async processUserFeedback(
    interaction: UserInteraction,
    media: Media
  ): Promise<PreferenceUpdate[]> {
    const updates: PreferenceUpdate[] = [];
    const weight = this.calculateInteractionWeight(interaction);

    // Update genre weights
    if (media.genre_ids) {
      media.genre_ids.forEach(genreId => {
        updates.push({
          type: "genre",
          value: genreId.toString(),
          weight: weight,
        });
      });
    }

    // Process sentiment and adjust weights
    const sentimentMultiplier = interaction.sentiment.score > 0 ? 1.5 : 0.5;

    // Add keyword-based updates
    interaction.sentiment.keywords.forEach(keyword => {
      updates.push({
        type: "keyword",
        value: keyword,
        weight: weight * sentimentMultiplier,
      });
    });

    return updates;
  }

  /**
   * Calculates content similarity between two items
   */
  public async calculateSimilarity(
    source: Media,
    target: Media
  ): Promise<number> {
    let similarity = 0;
    let weights = 0;

    // Genre similarity (40% weight)
    if (source.genre_ids && target.genre_ids) {
      const genreSimilarity = this.calculateGenreSimilarity(
        source.genre_ids,
        target.genre_ids
      );
      similarity += genreSimilarity * 0.4;
      weights += 0.4;
    }

    // Release year similarity (20% weight)
    const yearSimilarity = this.calculateYearSimilarity(
      source.release_date || source.first_air_date,
      target.release_date || target.first_air_date
    );
    similarity += yearSimilarity * 0.2;
    weights += 0.2;

    // Overview/theme similarity (40% weight)
    if (source.overview && target.overview) {
      const themeSimilarity = await this.calculateThemeSimilarity(
        source.overview,
        target.overview
      );
      similarity += themeSimilarity * 0.4;
      weights += 0.4;
    }

    return weights > 0 ? similarity / weights : 0;
  }

  private extractGenres(text: string): string[] {
    const genreKeywords = [
      "action",
      "adventure",
      "comedy",
      "drama",
      "horror",
      "thriller",
      "sci-fi",
      "science fiction",
      "romance",
      "documentary",
      "animation",
      "fantasy",
      "mystery",
      "crime",
      "family",
      "western",
    ];

    return genreKeywords.filter(genre => text.includes(genre));
  }

  private extractActors(text: string): string[] {
    // In a real implementation, this would use Named Entity Recognition
    // For now, we'll use a simple pattern matching approach
    const actorPattern = /starring|featuring|with|actor[s]?|actress[es]?/i;
    const matches = text.match(actorPattern);
    return matches ? [matches[0]] : [];
  }

  private extractDirectors(text: string): string[] {
    // Similar to actors, this would use NER in a real implementation
    const directorPattern = /directed by|director[s]?/i;
    const matches = text.match(directorPattern);
    return matches ? [matches[0]] : [];
  }

  private extractKeywords(text: string): string[] {
    const themeKeywords = [
      "inspiring",
      "thought-provoking",
      "funny",
      "scary",
      "emotional",
      "intense",
      "relaxing",
      "classic",
      "innovative",
      "artistic",
      "nostalgic",
      "mind-bending",
      "controversial",
      "uplifting",
    ];

    return themeKeywords.filter(keyword => text.includes(keyword));
  }

  private extractTimeReferences(text: string): string[] {
    const timePatterns = [
      /\d{4}s?/, // Years like 1990s
      /recent|new|latest|old|classic/i,
      /(19|20)\d{2}/, // Specific years
    ];

    return timePatterns
      .map(pattern => {
        const match = text.match(pattern);
        return match ? match[0] : null;
      })
      .filter((match): match is string => match !== null);
  }

  private analyzeSentiment(text: string): number {
    const positiveWords = [
      "love",
      "great",
      "awesome",
      "excellent",
      "amazing",
      "good",
      "favorite",
      "best",
      "enjoyed",
      "fantastic",
    ];

    const negativeWords = [
      "hate",
      "terrible",
      "awful",
      "bad",
      "worst",
      "boring",
      "waste",
      "disappointed",
      "poor",
      "dislike",
    ];

    const words = text.toLowerCase().split(/\W+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    // Normalize to range [-1, 1]
    return score / Math.max(1, Math.abs(score));
  }

  private calculateInteractionWeight(interaction: UserInteraction): number {
    let weight = interaction.rating / 5; // Base weight from rating

    // Adjust based on watch duration and completion
    if (interaction.watchDuration && interaction.completed) {
      weight *= 1.2; // Boost weight for completed watches
    }

    // Adjust based on recency (higher weight for recent interactions)
    const daysSince =
      (Date.now() - interaction.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.exp(-daysSince / 30); // Exponential decay over 30 days
    weight *= recencyFactor;

    return Math.min(weight, 1); // Ensure weight is between 0 and 1
  }

  private calculateGenreSimilarity(source: number[], target: number[]): number {
    const intersection = source.filter(g => target.includes(g));
    const union = [...new Set([...source, ...target])];
    return intersection.length / union.length;
  }

  private calculateYearSimilarity(
    sourceDate?: string,
    targetDate?: string
  ): number {
    if (!sourceDate || !targetDate) return 0;

    const sourceYear = new Date(sourceDate).getFullYear();
    const targetYear = new Date(targetDate).getFullYear();
    const yearDiff = Math.abs(sourceYear - targetYear);

    // Exponential decay based on year difference
    return Math.exp(-yearDiff / 10);
  }

  private async calculateThemeSimilarity(
    sourceText: string,
    targetText: string
  ): Promise<number> {
    // In a real implementation, this would use more sophisticated NLP
    // For now, we'll use a simple keyword overlap approach
    const sourceWords = new Set(sourceText.toLowerCase().split(/\W+/));
    const targetWords = new Set(targetText.toLowerCase().split(/\W+/));

    const intersection = new Set(
      [...sourceWords].filter(x => targetWords.has(x))
    );
    const union = new Set([...sourceWords, ...targetWords]);

    return intersection.size / union.size;
  }
}

export const nlpService = NLPService.getInstance();
export type { EntityExtraction, PreferenceUpdate };
