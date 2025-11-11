import { Media } from "@/utils/types";

export interface ChatbotMedia extends Media {
  season_number?: number;
  episode_number?: number;
}

// Convert standard Media to ChatbotMedia
export const toChatbotMedia = (media: Media): ChatbotMedia => {
  return {
    ...media,
  };
};

// Convert ChatbotMedia to standard Media
export const toMedia = (media: ChatbotMedia): Media => {
  const { season_number, episode_number, ...standardMedia } = media;
  return standardMedia;
};
