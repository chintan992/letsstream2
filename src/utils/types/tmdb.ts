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

export interface CastMember {
  id: number;
  credit_id: string;
  name: string;
  character: string;
  gender: number;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
  department: string;
  job: string;
}

export interface TMDBImage {
  file_path: string;
  vote_average: number;
  width: number;
  height: number;
  aspect_ratio: number;
}

export interface TMDBImagesResponse {
  backdrops: TMDBImage[];
  posters: TMDBImage[];
}

export interface TMDBKeyword {
  id: number;
  name: string;
}

export interface TMDBNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBContentRating {
  iso_3166_1: string;
  rating: string;
}

export interface TMDBEpisodeDetails {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
    guest_stars: CastMember[];
  };
}

export interface TMDBMovieDetailsResult extends TMDBMovieResult {
  runtime: number;
  genres: Genre[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Company[];
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{
        certification: string;
      }>;
    }>;
  };
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
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
  created_by: CrewMember[];
  content_ratings?: {
    results: Array<{
      iso_3166_1: string;
      rating: string;
    }>;
  };
}
