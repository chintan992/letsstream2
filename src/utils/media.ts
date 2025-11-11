import { Media } from "./types";

export const getMediaDetailPath = (media: Media): string => {
  const type = media.media_type || (media.first_air_date ? "tv" : "movie");
  return `/${type}/${media.id}`;
};

export const getMediaType = (media: Media): "movie" | "tv" => {
  return media.media_type || (media.first_air_date ? "tv" : "movie");
};
