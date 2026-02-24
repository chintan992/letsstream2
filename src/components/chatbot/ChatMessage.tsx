import React, { useReducer } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/contexts/chatbot-context";
import { Button } from "@/components/ui/button";
import { useChatbot } from "@/contexts/chatbot-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { extractMediaFromResponse } from "@/utils/chatbot-utils";
import { ChatbotMedia } from "@/utils/types/chatbot-types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { TypingText } from "./TypingText";
import { MediaRecommendations } from "./MediaRecommendations";

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { rateRecommendation } = useChatbot();
  const { getPersonalizedScore } = useUserProfile();

  type ChatState = {
    showRating: boolean;
    hasReacted: boolean;
    isTyping: boolean;
    showFeedback: boolean;
    feedback: string | null;
  };

  const [state, dispatch] = useReducer(
    (prev: ChatState, action: Partial<ChatState>) => ({ ...prev, ...action }),
    {
      showRating: false,
      hasReacted: false,
      isTyping: !message.isUser,
      showFeedback: false,
      feedback: null,
    }
  );

  const { showRating, hasReacted, isTyping, showFeedback, feedback } = state;

  const mediaItems: ChatbotMedia[] = !message.isUser
    ? extractMediaFromResponse(message.text)
    : [];

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
    dispatch({ showRating: false, hasReacted: true });
  };

  const handleDetailedFeedback = (type: string) => {
    dispatch({ feedback: type });
    console.log(`User feedback: ${type} for message ID ${message.id}`);
  };

  if (!message.isUser && mediaItems.length > 0) {
    const introText = getIntroText(message.text);

    return (
      <MediaRecommendations
        mediaItems={mediaItems}
        introText={introText}
        showRating={showRating}
        hasReacted={hasReacted}
        getPersonalizedScore={getPersonalizedScore}
        handleRate={handleRate}
        onShowRating={() => dispatch({ showRating: true })}
      />
    );
  }

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
        {message.isUser || mediaItems.length > 0 ? (
          message.text
        ) : (
          <TypingText
            text={message.text}
            onComplete={() => dispatch({ isTyping: false })}
          />
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
                onClick={() => dispatch({ showFeedback: true })}
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
