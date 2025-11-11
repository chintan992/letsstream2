import React, { useState, useEffect } from "react";
import { ThumbsUp, Star, ThumbsDown, MessageSquare } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/contexts/chatbot-context";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useChatbot } from "@/contexts/chatbot-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { extractMediaFromResponse } from "@/utils/chatbot-utils";
import { ChatbotMedia } from "@/utils/types/chatbot-types";
import RecommendationCard from "./RecommendationCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { rateRecommendation } = useChatbot();
  const { getPersonalizedScore } = useUserProfile();
  const [showRating, setShowRating] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);

  // Extract media items from the message if not a user message
  const mediaItems: ChatbotMedia[] = !message.isUser
    ? extractMediaFromResponse(message.text)
    : [];

  // Extract initial greeting or explanation text
  const getIntroText = (text: string): string => {
    const numberedItemIndex = text.search(/\d+\.\s+/);
    const titlePatternIndex = text.search(
      /(?:\*\*)?([^*\n(]+)(?:\*\*)?\s*\((\d{4}(?:-\d{4}|\s*-\s*Present)?)\)/
    );

    let cutoffIndex = text.length;
    if (numberedItemIndex > 0) cutoffIndex = numberedItemIndex;
    if (titlePatternIndex > 0 && titlePatternIndex < cutoffIndex)
      cutoffIndex = titlePatternIndex;

    return text.substring(0, cutoffIndex).trim();
  };

  const handleRate = (rating: number) => {
    rateRecommendation(message.id, rating);
    setShowRating(false);
    setHasReacted(true);
  };

  if (!message.isUser && mediaItems.length > 0) {
    const introText = getIntroText(message.text);
    return (
      <div className="mb-4 flex flex-col space-y-4">
        {introText && (
          <div className="max-w-[90%] rounded-lg rounded-bl-none bg-muted p-3 text-foreground">
            {introText}
          </div>
        )}
        <motion.div
          className="ml-4 grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, staggerChildren: 0.1 }}
        >
          {mediaItems.map((media, index) => (
            <motion.div
              key={`${media.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RecommendationCard
                media={media}
                onRate={rating => handleRate(rating)}
                personalizedScore={getPersonalizedScore(media)}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-end">
          {showRating ? (
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <Button
                  key={rating}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => handleRate(rating)}
                >
                  <Star
                    className={`h-4 w-4 ${rating <= 3 ? "fill-amber-400 text-amber-400" : "text-amber-400"}`}
                  />
                </Button>
              ))}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => setShowRating(true)}
              disabled={hasReacted}
            >
              {hasReacted ? (
                <span className="flex items-center">
                  <ThumbsUp className="mr-1 h-3 w-3" />
                  Rated
                </span>
              ) : (
                "Rate this"
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Add typing effect for AI messages
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(!message.isUser);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (message.isUser) {
      setDisplayedText(message.text);
      return;
    }

    // Check if this is a recommendation message with media items
    if (mediaItems.length > 0) {
      setDisplayedText(message.text);
      setIsTyping(false);
      return;
    }

    // Simulate typing effect for bot messages
    let index = 0;
    const text = message.text;
    setDisplayedText("");
    setIsTyping(true);

    // Calculate typing speed based on message length
    // Shorter speed for long messages, faster for short ones
    const typingSpeed = Math.max(
      5,
      Math.min(20, Math.floor(1000 / text.length))
    );

    const typingInterval = setInterval(() => {
      if (index < text.length) {
        // Add character by character with natural pauses at punctuation
        setDisplayedText(prev => prev + text[index]);
        index++;

        // Add slight pause at punctuation for more natural typing
        if ([".", "!", "?", ",", ";", ":"].includes(text[index - 1])) {
          clearInterval(typingInterval);
          setTimeout(
            () => {
              const newInterval = setInterval(() => {
                if (index < text.length) {
                  setDisplayedText(prev => prev + text[index]);
                  index++;
                } else {
                  clearInterval(newInterval);
                  setIsTyping(false);
                }
              }, typingSpeed);
            },
            text[index - 1] === "." ? 300 : 150
          ); // Longer pause for periods
        }
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed); // Dynamic typing speed

    return () => clearInterval(typingInterval);
  }, [message.text, message.isUser]);

  const handleDetailedFeedback = (type: string) => {
    setFeedback(type);
    // Here you could send specific feedback to your AI model
    console.log(`User feedback: ${type} for message ID ${message.id}`);
  };

  // Regular message rendering
  return (
    <div
      className={`flex ${message.isUser ? "justify-end" : "justify-start"} group relative mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          message.isUser
            ? "rounded-br-none bg-primary text-primary-foreground"
            : "rounded-bl-none bg-muted text-foreground"
        }`}
      >
        {displayedText}
        {isTyping && !message.isUser && (
          <motion.span
            className="ml-1 inline-block opacity-70"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ▋
          </motion.span>
        )}

        {!message.isUser && !isTyping && (
          <div className="border-border/10 mt-2 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-3 w-3" />
              <span>AI Response</span>
            </div>

            {!showFeedback ? (
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-muted/50 h-6 px-2 text-xs"
                onClick={() => setShowFeedback(true)}
              >
                Rate response
              </Button>
            ) : feedback ? (
              <Badge variant="outline" className="h-6 px-2 py-0">
                Feedback sent: {feedback}
              </Badge>
            ) : (
              <div className="flex space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-success/10 hover:text-success h-6 w-6 p-0"
                      onClick={() => handleDetailedFeedback("Helpful")}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Helpful</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-destructive/10 h-6 w-6 p-0 hover:text-destructive"
                      onClick={() => handleDetailedFeedback("Not helpful")}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Not helpful</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
