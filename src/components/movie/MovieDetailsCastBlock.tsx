import React from "react";
import { CastMember } from "@/utils/types";
import { MovieCast } from "@/components/movie";

type Props = {
  cast: CastMember[];
};

const MovieDetailsCastBlock: React.FC<Props> = ({ cast }) => {
  return <MovieCast cast={cast} />;
};

export default MovieDetailsCastBlock;
