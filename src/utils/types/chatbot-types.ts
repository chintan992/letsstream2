import { Media } from "@/utils/types";

export interface ChatbotMedia extends Media {
  season_number?: number;
  episode_number?: number;
}
