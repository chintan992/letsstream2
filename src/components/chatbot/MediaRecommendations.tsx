import React from "react";
import { m } from "framer-motion";
import { ThumbsUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecommendationCard from "./RecommendationCard";
import { ChatbotMedia } from "@/utils/types/chatbot-types";

interface MediaRecommendationsProps {
  mediaItems: ChatbotMedia[];
  introText?: string;
  showRating: boolean;
  hasReacted: boolean;
  getPersonalizedScore: (media: ChatbotMedia) => number;
  handleRate: (rating: number) => void;
  onShowRating: () => void;
}

export const MediaRecommendations: React.FC<MediaRecommendationsProps> = ({
  mediaItems,
  introText,
  showRating,
  hasReacted,
  getPersonalizedScore,
  handleRate,
  onShowRating,
}) => {
  const [currentRating, setCurrentRating] = React.useState(0);
  const [hoveredRating, setHoveredRating] = React.useState(0);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, staggerChildren: 0.1 },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };
  return (
    <div className="mb-4 flex flex-col space-y-4">
      {introText && (
        <div className="max-w-[90%] rounded-lg rounded-bl-none bg-muted p-3 text-foreground">
          {introText}
        </div>
      )}

      <m.div
        className="ml-4 grid gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {mediaItems.map(media => (
          <m.div key={media.id} variants={childVariants}>
            <RecommendationCard
              media={media}
              onRate={rating => handleRate(rating)}
              personalizedScore={getPersonalizedScore(media)}
            />
          </m.div>
        ))}
      </m.div>

      <div className="flex justify-end">
        {showRating ? (
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(rating => (
              <Button
                key={rating}
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={() => {
                  setCurrentRating(rating);
                  handleRate(rating);
                }}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(0)}
                aria-label={`Rate ${rating} stars`}
                aria-pressed={rating === currentRating}
              >
                <Star
                  className={`h-4 w-4 ${
                    rating <= (hoveredRating || currentRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-amber-400"
                  }`}
                />
              </Button>
            ))}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={onShowRating}
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
};
