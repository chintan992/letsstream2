import React from "react";
import { MovieDetails, CrewMember } from "@/utils/types";
import { MovieAbout } from "@/components/movie";

type Props = {
  movie: MovieDetails;
  directors: CrewMember[];
};

// Lightweight wrapper for the About section to enable easier extraction and testing
const MovieDetailsAboutBlock: React.FC<Props> = ({ movie, directors }) => {
  return <MovieAbout movie={movie} directors={directors} />;
};

export default MovieDetailsAboutBlock;
