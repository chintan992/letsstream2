import { Genre, Company } from "../types";

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TMDBVideoResponse {
  id: number;
  results: TMDBVideo[];
}

export interface TMDBMovieResult {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
  genre_ids: number[];
}

export interface TMDBTVResult {
  id: number;
  name: string;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  release_date?: string;
  media_type?: "movie" | "tv";
  genre_ids: number[];
}

export interface TMDBMovieDetailsResult extends TMDBMovieResult {
  runtime: number;
  genres: Genre[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Company[];
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{
        certification: string;
      }>;
    }>;
  };
}

export interface TMDBTVDetailsResult extends TMDBTVResult {
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
  content_ratings?: {
    results: Array<{
      iso_3166_1: string;
      rating: string;
    }>;
  };
}
