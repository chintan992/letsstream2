import {
  GoogleGenerativeAI,
  GenerateContentResult,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { RateLimiter } from "./rate-limiter";
import env from "@/config/env";
import { TV_SHOW_EXAMPLE, formatTVShowRequirements } from "./tv-show-prompt";
import { ChatbotMedia } from "./types/chatbot-types";

// Types
interface GeminiConfig {
  apiKey: string;
  maxRetries: number;
  retryDelay: number;
  rateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface GeminiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface GeminiResponse {
  text: string;
  status: "success" | "error";
  error?: string;
}

// Custom error types
class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "GeminiAPIError";
  }
}

// Configuration with fallback to empty string to prevent runtime errors
const DEFAULT_CONFIG: GeminiConfig = {
  apiKey: env.GEMINI_API_KEY,
  maxRetries: 3,
  retryDelay: 1000,
  rateLimit: {
    requestsPerMinute: 60,
    burstLimit: 10,
  },
};

// Initialize rate limiter as a singleton instance
const rateLimiter = RateLimiter.getInstance(
  DEFAULT_CONFIG.rateLimit.requestsPerMinute,
  60 * 1000 // 1 minute in milliseconds
);

// Set specific limit for Gemini API
rateLimiter.setLimit("gemini-api", {
  maxRequests: DEFAULT_CONFIG.rateLimit.requestsPerMinute,
  windowMs: 60 * 1000, // 1 minute in milliseconds
});

// Initialize the Google GenAI only if API key is available
let genAI: GoogleGenerativeAI | null = null;
if (DEFAULT_CONFIG.apiKey) {
  genAI = new GoogleGenerativeAI(DEFAULT_CONFIG.apiKey);
}

// Helper function for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for retrying failed requests
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = DEFAULT_CONFIG.maxRetries,
  delay: number = DEFAULT_CONFIG.retryDelay
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt === maxRetries) {
        throw new GeminiAPIError(
          `Operation failed after ${maxRetries} retries: ${lastError.message}`,
          "RETRY_EXHAUSTED"
        );
      }

      await sleep(delay * Math.pow(2, attempt));
    }
  }

  throw lastError;
}

// Define movie recommendation system prompt
const MOVIE_RECOMMENDATION_PROMPT = `
Role: You are CineMate, a super friendly, enthusiastic, and knowledgeable movie and TV show recommendation assistant. Think of yourself as that one friend everyone goes to for "what should I watch next?" advice.

Core Mission: Your goal is to delight users by suggesting 2-3 highly relevant movie or TV show recommendations based directly on their stated preferences, mood, or past viewing history.

Interaction Strategy:

Engage First: Start conversations warmly. Don't just wait for preferences; actively (but naturally) elicit them if needed. Ask clarifying questions if the user is vague (e.g., "What kind of sci-fi?" or "What did you like about that movie?").
Gather Details: Try to understand why the user likes certain things. Ask about:
Genres they love (or hate!)
Specific movies/shows they recently enjoyed (and why)
Movies/shows they disliked (this is valuable info!)
Desired mood (e.g., uplifting, thrilling, thought-provoking, lighthearted)
Favorite actors, directors, or writers
Themes or topics they find interesting
Recommendation Requirements (For Each Suggestion):

Title & Year: Clearly state the title and year of release (e.g., "Inception (2010)").
Logline/Brief Synopsis: 1-2 sentences capturing the core premise without major spoilers.
Personalized "Why": This is crucial. Explicitly connect the recommendation back to the user's specific input. (e.g., "Since you loved the intricate plot twists in [User Mentioned Movie], you might enjoy the mind-bending narrative here.")
Genre(s): List the primary genres.
Audience Score: Include a score from a major aggregator like Rotten Tomatoes (Audience Score) or IMDb. Specify which source you're using (e.g., "IMDb: 8.8/10" or "Rotten Tomatoes Audience Score: 91%"). Do not provide your own subjective rating.
TMDB ID: For each movie and TV show recommendation, include the TMDB ID as "TMDB_ID: [id]" at the end of the recommendation.
Type: Specify whether this is a "movie" or "tv" by adding "Type: [movie/tv]" at the end of the recommendation.
Movie Link Format: Users should click on links with the format "movie/[TMDB_ID]" to view movie details.
TV Show Link Format: Users should click on links with the format "tv/[TMDB_ID]" to view TV show details.
Bonus Insight (Optional but helpful): Add a brief, interesting note if relevant. Examples: "It has a similar vibe to [Another Movie/Show]", "Features an award-winning performance by...", "Known for its stunning visuals", "Available on [Streaming Service, if easily known and current - use caution as this changes]."

Key Guidelines:

Be Specific, Not Generic: Avoid predictable suggestions unless they perfectly fit the user's request. Dig a little deeper.
Quality over Quantity: Focus on making 2-3 excellent, well-reasoned suggestions rather than a longer, less tailored list.
Enthusiastic & Conversational Tone: Use friendly language, express genuine enthusiasm for the suggestions.
Stay Up-to-Date: When possible, factor in recent releases if relevant to the user's request, but timeless classics are fair game.
TV Show Episode Info: When recommending TV shows, specify season and episode if relevant (e.g., "Start with Season 1, Episode 1" or "The story picks up in Season 2, Episode 5").
Don't include long descriptions or spoilers. Keep it concise and engaging.
Don't use overly technical jargon or industry terms. Keep it relatable and fun.
don't ask for the user's name or any personal information. Just focus on their preferences and interests.
don't include any disclaimers or limitations about your capabilities. Just focus on providing the best recommendations possible.
don't ask extra questions or provide unnecessary context. Just focus on the user's preferences and interests.
don't include any information about the AI model or its capabilities. Just focus on providing the best recommendations possible.
Generate a list of 2-3 movie or TV show recommendations based on the user's preferences. Make sure to include the title, year, brief synopsis, genre(s), audience score, TMDB ID, Type (movie or tv), and a personalized reason for each recommendation.
Example Opening: "Hey there! Ready to find your next favorite movie or show? Tell me a bit about what you're in the mood for, or maybe something you've watched recently and loved (or hated!)?"
Example Closing: "Can't wait to hear what you think! If you have any other questions or need more suggestions, just let me know. Happy watching!
Example user output: 
1. Inception (2010)
   A skilled thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.
   Genre: Sci-Fi, Action, Thriller
   IMDb: 8.8/10
   TMDB_ID: 27205
   Type: movie

${TV_SHOW_EXAMPLE}

${formatTVShowRequirements}
`;

// Fallback recommendations - used when API fails
const FALLBACK_RECOMMENDATIONS = [
  {
    title: "The Shawshank Redemption",
    year: "1994",
    description:
      "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    type: "movie",
    tmdbId: 278,
    genres: ["Drama"],
    rating: "IMDb: 9.3/10",
  },
  {
    title: "The Dark Knight",
    year: "2008",
    description:
      "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    type: "movie",
    tmdbId: 155,
    genres: ["Action", "Crime", "Drama", "Thriller"],
    rating: "IMDb: 9.0/10",
  },
  {
    title: "Breaking Bad",
    year: "2008",
    description:
      "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
    type: "tv",
    tmdbId: 1396,
    genres: ["Drama", "Crime", "Thriller"],
    rating: "IMDb: 9.5/10",
    season: 1,
    episode: 1,
  },
];

/**
 * Generate fallback response when the API fails
 * @param query The user's query
 * @returns A formatted fallback response
 */
const generateFallbackResponse = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  let genre = "";
  let mood = "";

  // Simple query analysis for fallback
  if (lowerQuery.includes("action")) genre = "action";
  else if (lowerQuery.includes("comedy")) genre = "comedy";
  else if (lowerQuery.includes("drama")) genre = "drama";
  else if (lowerQuery.includes("horror")) genre = "horror";

  if (lowerQuery.includes("happy") || lowerQuery.includes("uplifting"))
    mood = "uplifting";
  else if (lowerQuery.includes("sad")) mood = "emotional";
  else if (lowerQuery.includes("scary")) mood = "tense";

  // Filter recommendations based on simple query matching
  let relevantRecs = FALLBACK_RECOMMENDATIONS;
  if (genre) {
    relevantRecs = relevantRecs.filter(rec =>
      rec.genres.some(g => g.toLowerCase().includes(genre))
    );
  }

  // If nothing matched, use all recommendations
  if (relevantRecs.length === 0) {
    relevantRecs = FALLBACK_RECOMMENDATIONS;
  }

  // Format the response using a simpler approach to avoid template literal issues
  let responseText =
    "Here are some recommendations that might interest you:\n\n";

  // Build the recommendations string manually
  relevantRecs.forEach((rec, index) => {
    if (index > 0) {
      responseText += "\n\n"; // Add spacing between recommendations
    }

    responseText += `${index + 1}. **${rec.title}** (${rec.year}) - ${rec.description}\n`;
    responseText += `Genre: ${rec.genres.join(", ")}\n`;
    responseText += `Type: ${rec.type}\n`;
    responseText += `${rec.rating}\n`;
    responseText += `TMDB_ID: ${rec.tmdbId}`;

    // Add TV show specific info if needed
    if (rec.type === "tv") {
      responseText += `\nSeason: ${rec.season || 1}\n`;
      responseText += `Episode: ${rec.episode || 1}`;
    }
  });

  responseText +=
    "\n\n(Note: I'm currently using a backup recommendation system. For more personalized recommendations, please try again later.)";

  return responseText;
};

/**
 * Send a message to the Gemini model and get a response
 * @param message The user's message
 * @param chatHistory Previous messages for context
 * @returns Promise<GeminiResponse>
 */
export const sendMessageToGemini = async (
  message: string,
  chatHistory: string[] = []
): Promise<GeminiResponse> => {
  // Track start time for performance monitoring
  const startTime = Date.now();

  try {
    // Check if Gemini API is configured
    if (!genAI) {
      console.log("API key not configured, using fallback system");
      return {
        text: generateFallbackResponse(message),
        status: "success",
        fallback: true,
      };
    }

    // Check rate limit using the specific Gemini API endpoint
    const canProceed = await rateLimiter.isAllowed(
      "https://generativelanguage.googleapis.com/v1/chat",
      "gemini-api"
    );
    if (!canProceed) {
      console.warn("Rate limit exceeded, using fallback system");
      return {
        text: generateFallbackResponse(message),
        status: "success",
        fallback: true,
        error: "RATE_LIMIT_EXCEEDED",
      };
    }

    // Get the chat model with enhanced safety settings
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Process chat history with improved handling
    if (chatHistory.length > 0) {
      // Add system prompt first if not present
      if (!chatHistory.some(msg => msg.includes(MOVIE_RECOMMENDATION_PROMPT))) {
        try {
          await withRetry(() => chat.sendMessage(MOVIE_RECOMMENDATION_PROMPT));
        } catch (error) {
          console.warn(
            "Failed to send system prompt, continuing with chat history",
            error
          );
        }
      }

      // Add only the most relevant historical messages to avoid context overflow
      // If we have many messages, only use the first one (system) and the most recent ones
      const relevantHistory =
        chatHistory.length > 5
          ? [chatHistory[0], ...chatHistory.slice(-4)]
          : chatHistory;

      for (const msg of relevantHistory) {
        try {
          await withRetry(() => chat.sendMessage(msg));
        } catch (error) {
          console.warn(
            "Failed to send chat history message, continuing",
            error
          );
        }
      }
    } else {
      // Initialize with system prompt
      try {
        await withRetry(() => chat.sendMessage(MOVIE_RECOMMENDATION_PROMPT));
      } catch (error) {
        throw new GeminiAPIError(
          "Failed to initialize chat with system prompt",
          "SYSTEM_PROMPT_FAILED"
        );
      }
    }

    // Add timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new GeminiAPIError("Request timed out", "TIMEOUT")),
        15000
      );
    });

    // Send the user message with retry logic and timeout protection
    const result = await Promise.race([
      withRetry(() => chat.sendMessage(message)),
      timeoutPromise,
    ]);

    // Log performance metrics
    const responseTime = Date.now() - startTime;
    console.log(`API response time: ${responseTime}ms`);

    return {
      text: result.response.text() || "No response generated.",
      status: "success",
      responseTime,
    };
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);

    // Enhanced error handling with graceful degradation
    if (error instanceof GeminiAPIError) {
      // For specific error types, use fallback system
      if (
        ["TIMEOUT", "RETRY_EXHAUSTED", "RATE_LIMIT_EXCEEDED"].includes(
          error.code || ""
        )
      ) {
        console.log("Using fallback recommendation system due to API error");
        return {
          text: generateFallbackResponse(message),
          status: "success",
          fallback: true,
          error: error.code,
        };
      }

      return {
        text: error.message,
        status: "error",
        error: error.code,
      };
    }

    // For unknown errors, use fallback system
    return {
      text: generateFallbackResponse(message),
      status: "success",
      fallback: true,
      error: "UNKNOWN_ERROR",
    };
  }
};

/**
 * Function to search for movies or TV shows
 * @param query The search query
 * @returns Promise<GeminiResponse>
 */
export const searchMedia = async (query: string): Promise<GeminiResponse> => {
  try {
    // Check if Gemini API is configured
    if (!genAI) {
      return {
        text: "Gemini API is not configured. Please add a valid API key in your .env file.",
        status: "error",
        error: "API_NOT_CONFIGURED",
      };
    }

    // Check rate limit using the specific Gemini API endpoint
    const canProceed = await rateLimiter.isAllowed(
      "https://generativelanguage.googleapis.com/v1/generate",
      "gemini-api"
    );
    if (!canProceed) {
      throw new GeminiAPIError(
        "Rate limit exceeded. Please try again later.",
        "RATE_LIMIT_EXCEEDED"
      );
    }

    // Use the models API for one-off content generation with retry logic
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await withRetry<GenerateContentResult>(() =>
      model.generateContent(`Please search for movies or TV shows that match: "${query}".
        Provide up to 3 results with title, year, brief description, genre, and TMDB ID.
        For each result:
        - For movies: Include Type: movie and TMDB_ID
        - For TV shows: Include Type: tv, TMDB_ID, Season, and Episode numbers
        - For any TV show result, indicate which episode to start with
        Format each result in a clear, structured way that can be easily parsed.`)
    );

    return {
      text: result.response.text() || "No results found.",
      status: "success",
    };
  } catch (error) {
    console.error("Error searching media:", error);

    if (error instanceof GeminiAPIError) {
      return {
        text: error.message,
        status: "error",
        error: error.code,
      };
    }

    return {
      text: "An unexpected error occurred while searching. Please try again later.",
      status: "error",
      error: "UNKNOWN_ERROR",
    };
  }
};

// Export types for use in other files
// Add fallback and response time to GeminiResponse type
export interface GeminiResponse {
  text: string;
  status: "success" | "error";
  error?: string;
  fallback?: boolean;
  responseTime?: number;
}

export type { GeminiConfig, GeminiAPIError };
