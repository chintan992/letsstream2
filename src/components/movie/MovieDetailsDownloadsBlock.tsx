import React from "react";
import { MovieDetails } from "@/utils/types";
import { DownloadSection } from "@/components/DownloadSection";

type Props = {
  movie: MovieDetails;
};

const MovieDetailsDownloadsBlock: React.FC<Props> = ({ movie }) => {
  if (!movie) return null;
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Download</h2>
      <DownloadSection
        mediaName={movie.title}
        mediaType="movie"
        tmdbId={movie.id}
      />
    </div>
  );
};

export default MovieDetailsDownloadsBlock;
