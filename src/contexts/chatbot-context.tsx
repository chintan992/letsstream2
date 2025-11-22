import React, { createContext, useState, useContext, ReactNode } from "react";
import {
  sendMessageToGemini,
  searchMedia,
  type GeminiResponse,
} from "@/utils/gemini-api";
import { extractMediaFromResponse } from "@/utils/chatbot-utils";
import { ChatbotMedia } from "@/utils/types/chatbot-types";
import { EntityExtraction } from "@/utils/services/nlp-service";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  mediaItems?: ChatbotMedia[];
  nlpAnalysis?: EntityExtraction;
  feedback?: {
    helpful: boolean;
    reason?: string;
  };
  personalityScore?: number; // How well it matches user's personality/preferences (0-1)
}

interface MessageContext {
  nlpAnalysis?: EntityExtraction;
  recommendations?: ChatbotMedia[];
  recentInteractions?: string[];
  preferredGenres?: string[];
  timeOfDay?: string;
}

interface ChatbotContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  hasUnread: boolean;
  setHasUnread: (value: boolean) => void;
  isMuted: boolean;
  setIsMuted: (value: boolean) => void;
  openChatbot: () => void;
  closeChatbot: () => void;
  sendMessage: (message: string, context?: MessageContext) => Promise<void>;
  searchForMedia: (query: string) => Promise<ChatbotMedia[]>;
  clearMessages: () => void;
  rateRecommendation: (messageId: string, rating: number) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
};

interface ChatbotProviderProps {
  children: ReactNode;
}

interface CustomWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const openChatbot = () => setIsOpen(true);
  const closeChatbot = () => setIsOpen(false);

  const addMessage = (
    text: string,
    isUser: boolean,
    mediaItems?: ChatbotMedia[]
  ): string => {
    const id = Date.now().toString();
    const newMessage: ChatMessage = {
      id,
      text,
      isUser,
      timestamp: new Date(),
      mediaItems,
    };
    setMessages(prev => [...prev, newMessage]);

    // Set hasUnread flag for AI responses when chat is closed
    if (!isUser && !isOpen) {
      setHasUnread(true);

      // Play notification sound if not muted
      if (!isMuted && typeof window !== "undefined") {
        try {
          // Simple notification sound using Web Audio API
          const audioCtx = new (window.AudioContext ||
            (window as CustomWindow).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(830, audioCtx.currentTime);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          // Short beep sound with fade out
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioCtx.currentTime + 0.3
          );

          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (error) {
          console.error("Error playing notification sound:", error);
        }
      }
    }

    return id;
  };

  const sendMessage = async (message: string, context?: MessageContext) => {
    if (!message.trim()) return;

    // Enhanced context tracking and NLP processing
    let userMessage = message.trim();
    const currentTime = new Date();
    const timeOfDay = getTimeOfDay(currentTime);
    const dayOfWeek = currentTime.toLocaleDateString("en-US", {
      weekday: "long",
    });

    // Rephrase single words/short phrases as recommendation requests
    if (
      /^([\w\s-]+)$/.test(userMessage) &&
      userMessage.length < 40 &&
      !userMessage.toLowerCase().includes("recommend") &&
      !userMessage.toLowerCase().includes("suggest") &&
      !userMessage.toLowerCase().includes("show me")
    ) {
      userMessage = `Recommend some ${userMessage} movies or TV shows.`;
    }

    // Track recent interactions for context building
    const recentMessages = messages.slice(-7);
    const interactionSummary = summarizeInteractions(recentMessages);

    // Add user message to chat
    addMessage(message, true);
    setIsLoading(true);

    try {
      // Get chat history with optimized context window (last 8 messages max to prevent overflow)
      const chatHistory = messages.slice(-8).map(msg => msg.text);

      // Enhanced message formatting with more context
      const formattedMessage = `
        ${userMessage}

        Current context:
        - Time of day: ${timeOfDay}
        - Day of week: ${dayOfWeek}
        ${context?.preferredGenres ? `- Preferred genres: ${context.preferredGenres.join(", ")}` : ""}
        ${interactionSummary ? `- Recent interaction context: ${interactionSummary}` : ""}

        When responding with movie or TV show recommendations, please format them as follows:
        1. **Title** (Year) - Brief description about the content.
        Genre: genre1, genre2
        Type: movie or tv
        Rating: X/10
        TMDB_ID: ID number if available
        For TV shows, also include:
        Season: number
        Episode: number
      `;

      const response = await sendMessageToGemini(formattedMessage, chatHistory);
      const mediaItems = extractMediaFromResponse(response.text);
      console.log("Extracted media items:", mediaItems);

      // Enhanced message with metadata
      const personalityScore = calculatePersonalityMatch(mediaItems, context);
      const botMessage = addMessage(response.text, false, mediaItems);

      // Update message with personality score
      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessage ? { ...msg, personalityScore } : msg
        )
      );

      // REMOVED: The second call to sendMessageToGemini that was causing duplicate responses
      // We're now only keeping the first response with the extracted media items
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("Sorry, I encountered an error. Please try again.", false);
    } finally {
      setIsLoading(false);
    }
  };

  const searchForMedia = async (query: string): Promise<ChatbotMedia[]> => {
    if (!query.trim()) return [];

    addMessage(`Searching for: ${query}`, true);
    setIsLoading(true);

    try {
      // Get recent chat history for context (limit to 6 messages to prevent overflow)
      const chatHistory = messages.slice(-6).map(msg => msg.text);

      const formattedQuery = `
        Search for: ${query}

        Previous conversation context:
        ${chatHistory.length > 0 ? chatHistory.join("\n") : "No previous conversation"}

        When responding with search results, please format them as follows:
        1. **Title** (Year) - Brief description about the content.
        Genre: genre1, genre2
        Type: movie or tv
        Rating: X/10
        TMDB_ID: ID number if available
        For TV shows, also include:
        Season: number (start with 1 if not specified)
        Episode: number (start with 1 if not specified)

        Format each result in a clear, structured way that can be easily parsed.
      `;

      const results = await searchMedia(formattedQuery);
      const mediaItems = extractMediaFromResponse(results.text);
      console.log("Extracted search results:", mediaItems);
      addMessage(results.text, false, mediaItems);
      return mediaItems;
    } catch (error) {
      console.error("Error searching media:", error);
      addMessage(
        "Sorry, I encountered an error while searching. Please try again.",
        false
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setRatings({});
  };

  const rateRecommendation = (
    messageId: string,
    rating: number,
    feedbackText?: string
  ) => {
    setRatings(prev => ({ ...prev, [messageId]: rating }));

    // Find the message being rated
    const ratedMessage = messages.find(msg => msg.id === messageId);
    if (ratedMessage) {
      // Update message with feedback
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              feedback: {
                helpful: rating > 3,
                reason: feedbackText,
              },
            };
          }
          return msg;
        })
      );

      // Create detailed feedback message for the AI (without adding to chat display)
      const ratingMessage = `
        I rated the recommendation "${ratedMessage.text.substring(0, 50)}..." as ${rating}/5.
        ${feedbackText ? `Feedback: ${feedbackText}` : ""}
        ${rating > 3 ? "I liked this recommendation because it matched my preferences." : "This recommendation wasn't quite what I was looking for."}
        Please remember this for future recommendations.
      `;

      console.log("Sending rating feedback:", rating, feedbackText);

      // Send feedback to AI with full conversation context (but don't add to visible messages)
      const messageTexts = messages.map(msg => msg.text);

      // Only send rating feedback to improve future recommendations
      // Don't add this as a visible chat message to avoid cluttering the conversation
      sendMessageToGemini(ratingMessage, messageTexts).catch(error => {
        console.error("Error sending rating to Gemini:", error);
      });

      // Analyze this feedback for user profile updates
      if (ratedMessage.mediaItems?.length) {
        // Update user preferences based on feedback
        updatePreferencesFromFeedback(
          ratedMessage.mediaItems[0],
          rating,
          feedbackText
        );
      }
    }
  };

  // Helper function to determine time of day
  const getTimeOfDay = (date: Date): string => {
    const hour = date.getHours();
    if (hour < 5) return "night";
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    if (hour < 21) return "evening";
    return "night";
  };

  // Generate a summary of recent interactions for context
  const summarizeInteractions = (recentMessages: ChatMessage[]): string => {
    if (recentMessages.length < 2) return "";

    const topics = new Set<string>();
    const genres = new Set<string>();
    let hasPositiveFeedback = false;
    let hasNegativeFeedback = false;

    recentMessages.forEach(msg => {
      // Extract topics from user messages
      if (msg.isUser) {
        const text = msg.text.toLowerCase();
        if (text.includes("action")) topics.add("action");
        if (text.includes("comedy")) topics.add("comedy");
        if (text.includes("drama")) topics.add("drama");
        if (text.includes("horror")) topics.add("horror");
        if (text.includes("sci-fi") || text.includes("science fiction"))
          topics.add("sci-fi");
      }

      // Check for feedback
      if (msg.feedback) {
        if (msg.feedback.helpful) hasPositiveFeedback = true;
        else hasNegativeFeedback = true;
      }

      // Extract genres from NLP analysis
      if (msg.nlpAnalysis?.genres) {
        msg.nlpAnalysis.genres.forEach(genre => genres.add(genre));
      }
    });

    // Build context summary
    let summary = "";
    if (topics.size > 0)
      summary += `User has been discussing: ${[...topics].join(", ")}. `;
    if (genres.size > 0)
      summary += `Genres of interest: ${[...genres].join(", ")}. `;
    if (hasPositiveFeedback)
      summary += "User has positively rated previous recommendations. ";
    if (hasNegativeFeedback)
      summary += "User has negatively rated some recommendations. ";

    return summary;
  };

  // Calculate how well recommendations match user personality/preferences
  const calculatePersonalityMatch = (
    mediaItems: ChatbotMedia[],
    context?: MessageContext
  ): number => {
    if (!mediaItems.length || !context) return 0.5; // Default middle score

    let matchScore = 0.5;

    // Adjust score based on preferred genres
    if (
      context.preferredGenres &&
      mediaItems.some(item => {
        return item.genre_ids?.some(id => {
          // This is simplified - you'd need to map genre IDs to names
          return context.preferredGenres?.includes(id.toString());
        });
      })
    ) {
      matchScore += 0.2;
    }

    // Adjust for time of day appropriate content
    if (
      context.timeOfDay === "night" &&
      mediaItems.some(item => {
        const overview = item.overview?.toLowerCase() || "";
        return overview.includes("horror") || overview.includes("thriller");
      })
    ) {
      matchScore += 0.1;
    }

    return Math.min(1, matchScore); // Cap at 1.0
  };

  // Update user preferences based on feedback
  const updatePreferencesFromFeedback = (
    media: ChatbotMedia,
    rating: number,
    feedback?: string
  ) => {
    // This would typically update a user profile or preferences store
    console.log(
      "Updating preferences from feedback:",
      media.title,
      rating,
      feedback
    );

    // Example implementation would store this in user profile context
  };

  const value: ChatbotContextType = {
    isOpen,
    messages,
    isLoading,
    hasUnread,
    setHasUnread,
    isMuted,
    setIsMuted,
    openChatbot,
    closeChatbot,
    sendMessage,
    searchForMedia,
    clearMessages,
    rateRecommendation,
  };

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  );
};
