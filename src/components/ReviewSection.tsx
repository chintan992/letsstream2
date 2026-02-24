import React, { useReducer, useEffect } from "react";
import { getReviews } from "@/utils/api";
import { Review } from "@/utils/types";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReviewSectionProps {
  mediaId: number;
  mediaType: "movie" | "tv";
}
interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  visibleReviews: number;
}

type ReviewAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Review[] }
  | { type: "FETCH_ERROR" }
  | { type: "LOAD_MORE" }
  | { type: "SHOW_LESS" };

const initialState: ReviewState = {
  reviews: [],
  isLoading: true,
  visibleReviews: 3,
};

const reviewReducer = (
  state: ReviewState,
  action: ReviewAction
): ReviewState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, visibleReviews: 3 };
    case "FETCH_SUCCESS":
      return { ...state, reviews: action.payload, isLoading: false };
    case "FETCH_ERROR":
      return { ...state, reviews: [], isLoading: false };
    case "LOAD_MORE":
      return { ...state, visibleReviews: state.visibleReviews + 3 };
    case "SHOW_LESS":
      return { ...state, visibleReviews: 3 };
    default:
      return state;
  }
};

const ReviewSection = ({ mediaId, mediaType }: ReviewSectionProps) => {
  const [state, dispatch] = useReducer(reviewReducer, initialState);
  const { reviews, isLoading, visibleReviews } = state;
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        dispatch({ type: "FETCH_START" });
        const reviewsData = await getReviews(mediaId, mediaType);
        dispatch({ type: "FETCH_SUCCESS", payload: reviewsData });
      } catch (error) {
        console.error("Error fetching reviews:", error);
        dispatch({ type: "FETCH_ERROR" });
      }
    };

    fetchReviews();
  }, [mediaId, mediaType]);

  const loadMoreReviews = () => {
    dispatch({ type: "LOAD_MORE" });
  };

  const showLessReviews = () => {
    dispatch({ type: "SHOW_LESS" });
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(num => (
          <div
            key={`skeleton-${num}`}
            className="glass animate-pulse rounded-lg p-4"
          >
            <div className="mb-3 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="glass rounded-lg p-6 text-center text-white/70">
        <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-50" />
        <h3 className="mb-2 text-lg font-medium">No Reviews Yet</h3>
        <p>There are no reviews available for this title.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.slice(0, visibleReviews).map(review => (
        <div key={review.id} className="glass rounded-lg p-4">
          <div className="mb-3 flex items-start gap-3">
            <Avatar className="h-10 w-10 border border-white/10">
              {review.author_details.avatar_path ? (
                <AvatarImage
                  src={
                    review.author_details.avatar_path.startsWith("/http")
                      ? review.author_details.avatar_path.substring(1)
                      : `https://image.tmdb.org/t/p/w185${review.author_details.avatar_path}`
                  }
                  alt={review.author}
                />
              ) : null}
              <AvatarFallback className="bg-accent/20 text-accent">
                {getInitials(review.author)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between">
                <h4 className="font-medium text-white">{review.author}</h4>
                {review.author_details.rating && (
                  <div className="flex items-center text-sm text-amber-400">
                    <Star className="mr-1 h-4 w-4 fill-amber-400" />
                    {review.author_details.rating.toFixed(1)}/10
                  </div>
                )}
              </div>

              <p className="text-sm text-white/60">
                {formatDate(review.created_at)}
              </p>
            </div>
          </div>

          <div className="text-sm text-white/80">
            <div
              className={
                review.content.length > 300 && !isMobile ? "line-clamp-4" : ""
              }
            >
              {review.content}
            </div>

            {review.content.length > 300 && !isMobile && (
              <a
                href={review.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-accent hover:underline"
              >
                Read full review
              </a>
            )}
          </div>
        </div>
      ))}

      {reviews.length > 3 && (
        <div className="flex justify-center">
          {visibleReviews < reviews.length ? (
            <Button
              variant="outline"
              onClick={loadMoreReviews}
              className="border-white/20 bg-black/50 text-white hover:bg-black/70"
            >
              Load More <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={showLessReviews}
              className="border-white/20 bg-black/50 text-white hover:bg-black/70"
            >
              Show Less <ChevronUp className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
