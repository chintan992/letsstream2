import React from "react";
import ReviewSection from "@/components/ReviewSection";

type Props = {
  movieId: number;
};

const MovieDetailsReviewsBlock: React.FC<Props> = ({ movieId }) => {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">User Reviews</h2>
      <ReviewSection mediaId={movieId} mediaType="movie" />
    </div>
  );
};

export default MovieDetailsReviewsBlock;
