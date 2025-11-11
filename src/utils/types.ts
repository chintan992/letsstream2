// Media types for basic movie and TV show data
export interface Media {
  id: number;
  media_id?: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  vote_average: number;
  media_type: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

export interface ExtendedMedia extends Media {
  media_id: number; // Required in ExtendedMedia
  // Any additional fields needed for the extended version
}

// Helper function to convert Media to ExtendedMedia
export const ensureExtendedMedia = (media: Media): ExtendedMedia => {
  return {
    ...media,
    media_id: media.media_id || media.id, // Ensure media_id is present
    media_type: media.media_type as "movie" | "tv", // Ensure correct media_type
  };
};

// Helper function to convert an array of Media to ExtendedMedia[]
export const ensureExtendedMediaArray = (
  mediaArray: Media[]
): ExtendedMedia[] => {
  return mediaArray.map(ensureExtendedMedia);
};

// Movie details type
export interface MovieDetails {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  logo_path?: string;
  overview: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  tagline?: string;
  status: string;
  budget: number;
  revenue: number;
  genres: Genre[];
  production_companies: Company[];
  certification?: string;
}

// TV Show details type
export interface TVDetails {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
  logo_path?: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  tagline?: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time?: number[];
  genres: Genre[];
  production_companies: Company[];
  seasons: Season[];
  certification?: string;
}

// Season type
export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path?: string;
  overview?: string;
  air_date?: string;
}

// Episode type
export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
}

// Review type
export interface Review {
  id: string;
  author: string;
  content: string;
  created_at: string;
  url: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
}

// Genre type
export interface Genre {
  id: number;
  name: string;
}

// Company type
export interface Company {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

// ...existing code...
export interface CustomVideoSourceResult {
  url: string;
  headers?: Record<string, string>;
  subtitles?: Array<{
    lang: string;
    label: string;
    file: string;
  }>;
}

// ...existing code...
export interface VideoSource {
  key: string;
  name: string;
  getMovieUrl: (
    id: number
  ) => string | Promise<string> | Promise<CustomVideoSourceResult | string>;
  getTVUrl: (
    id: number,
    season: number,
    episode: number
  ) => string | Promise<string> | Promise<CustomVideoSourceResult | string>;
}

// Image response types
export interface MovieImagesResponse {
  id: number;
  backdrops: Image[];
  posters: Image[];
  logos: Image[];
}

export interface Image {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

// --- CAST TYPES ---
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}
