import { Media, Genre, Company } from "../types";

export interface TVDetails extends Omit<Media, "name" | "first_air_date"> {
  name: string; // Make name required for TV shows
  first_air_date: string; // Make first_air_date required for TV shows
  episode_run_time: number[];
  genres: Genre[];
  status: string;
  tagline: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Array<{
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
  }>;
  production_companies: Company[];
  certification: string;
  logo_path: string | null;
}
