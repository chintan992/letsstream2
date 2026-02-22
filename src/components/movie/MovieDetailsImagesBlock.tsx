import React from "react";
import { MovieImages } from "@/components/movie";

type ImageInfo = { file_path: string; vote_average: number };
type BlockImages = { backdrops: ImageInfo[]; posters: ImageInfo[] } | null;

type Props = {
  images: BlockImages;
  movieName: string;
};

const MovieDetailsImagesBlock: React.FC<Props> = ({ images, movieName }) => {
  return <MovieImages images={images as BlockImages} movieName={movieName} />;
};

export default MovieDetailsImagesBlock;
