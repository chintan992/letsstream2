
import { Media, MovieDetails, TVDetails, Episode, Review, Genre, Company } from './types';

interface TMDBMovieResult {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
}

interface TMDBTVResult {
  id: number;
  name: string;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  release_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
}

interface TMDBMovieDetailsResult extends TMDBMovieResult {
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

interface TMDBTVDetailsResult extends TMDBTVResult {
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


const API_KEY = '297f1b91919bae59d50ed815f8d2e14c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image sizes
export const posterSizes = {
  small: `${IMAGE_BASE_URL}/w185`,
  medium: `${IMAGE_BASE_URL}/w342`,
  large: `${IMAGE_BASE_URL}/w500`,
  original: `${IMAGE_BASE_URL}/original`,
};

export const backdropSizes = {
  small: `${IMAGE_BASE_URL}/w300`,
  medium: `${IMAGE_BASE_URL}/w780`,
  large: `${IMAGE_BASE_URL}/w1280`,
  original: `${IMAGE_BASE_URL}/original`,
};

// Enhanced video sources with more options
export const videoSources = [
  {
    key: 'vidlink',
    name: 'VidLink',
    getMovieUrl: (id: number) => `https://vidlink.pro/movie/${id}?autoplay=true&title=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=true&title=true`,
  },
  {
    key: 'autoembed',
    name: 'AutoEmbed',
    getMovieUrl: (id: number) => `https://player.autoembed.cc/embed/movie/${id}?autoplay=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}?autoplay=true`,
  },
  {
    key: '2embed',
    name: '2Embed',
    getMovieUrl: (id: number) => `https://www.2embed.cc/embed/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://www.2embed.cc/embed/tv/${id}&s=${season}&e=${episode}`,
  },
  {
    key: 'multiembed',
    name: 'MultiEmbed',
    getMovieUrl: (id: number) => `https://multiembed.mov/video_id=${id}&tmdb=1`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://multiembed.mov/video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    key: '2embed-org',
    name: '2Embed.org',
    getMovieUrl: (id: number) => `https://2embed.org/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://2embed.org/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'autoembed-co',
    name: 'AutoEmbed.co',
    getMovieUrl: (id: number) => `https://autoembed.co/movie/tmdb/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`,
  },
  {
    key: 'vidsrc-xyz',
    name: 'VidSrc.xyz',
    getMovieUrl: (id: number) => `https://vidsrc.xyz/embed/movie?tmdb=${id}&ds_lang=en`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}&ds_lang=en`,
  },
  {
    key: 'moviesapi',
    name: 'MoviesAPI',
    getMovieUrl: (id: number) => `https://moviesapi.club/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://moviesapi.club/tv/${id}-${season}-${episode}`,
  },
  {
    key: 'nontongo',
    name: 'NontonGo',
    getMovieUrl: (id: number) => `https://www.NontonGo.win/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://www.NontonGo.win/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: '111movies',
    name: '111Movies',
    getMovieUrl: (id: number) => `https://111movies.com/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://111movies.com/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'flicky',
    name: 'Flicky',
    getMovieUrl: (id: number) => `https://flicky.host/embed/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://flicky.host/embed/tv?id=${id}/${season}/${episode}`,
  },
  {
    key: 'vidjoy',
    name: 'VidJoy',
    getMovieUrl: (id: number) => `https://vidjoy.pro/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidjoy.pro/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'embed-su',
    name: 'Embed.su',
    getMovieUrl: (id: number) => `https://embed.su/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://embed.su/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'primewire',
    name: 'PrimeWire',
    getMovieUrl: (id: number) => `https://www.primewire.tf/embed/movie?tmdb=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://www.primewire.tf/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    key: 'smashystream',
    name: 'SmashyStream',
    getMovieUrl: (id: number) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    key: 'vidstream',
    name: 'VidStream',
    getMovieUrl: (id: number) => `https://vidstream.site/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidstream.site/embed/tv/${id}/${episode}`,
  },
  {
    key: 'videasy',
    name: 'Videasy',
    getMovieUrl: (id: number) => `https://player.videasy.net/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://player.videasy.net/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidsrc-wtf-2',
    name: 'VidSrc.wtf (API 2)',
    getMovieUrl: (id: number) => `https://vidsrc.wtf/api/2/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidsrc.wtf/api/2/tv?id=${id}&s=${season}&e=${episode}`,
  },
  {
    key: 'vidsrc-wtf-3',
    name: 'VidSrc.wtf (API 3)',
    getMovieUrl: (id: number) => `https://vidsrc.wtf/api/3/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidsrc.wtf/api/3/tv?id=${id}&s=${season}&e=${episode}`,
  },
  {
    key: 'vidfast',
    name: 'VidFast',
    getMovieUrl: (id: number) => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true`,
  },
  {
    key: 'vidbinge',
    name: 'VidBinge',
    getMovieUrl: (id: number) => `https://vidbinge.dev/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidbinge.dev/embed/tv/${id}/${season}/${episode}`,
  },
];

// Helper function to format API responses to Media type
const formatMediaItem = (item: TMDBMovieResult | TMDBTVResult): Media => {
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  
  return {
    id: item.id,
    title: item.title || null,
    name: item.name || null,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview,
    vote_average: item.vote_average,
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
    media_type: mediaType as 'movie' | 'tv',
    genre_ids: item.genre_ids || [],
  };
};

// Get trending media (movies and TV shows)
export const getTrending = async (timeWindow: 'day' | 'week' = 'week'): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.results.map(formatMediaItem);
  } catch (error) {
    console.error('Error fetching trending media:', error);
    return [];
  }
};

// Get popular movies
export const getPopularMovies = async (): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
  return data.results.map((item: TMDBMovieResult) => formatMediaItem({...item, media_type: 'movie'}));
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return [];
  }
};

// Get popular TV shows
export const getPopularTVShows = async (): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
  return data.results.map((item: TMDBTVResult) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching popular TV shows:', error);
    return [];
  }
};

// Get top rated movies
export const getTopRatedMovies = async (): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
  return data.results.map((item: TMDBMovieResult) => formatMediaItem({...item, media_type: 'movie'}));
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    return [];
  }
};

// Get top rated TV shows
export const getTopRatedTVShows = async (): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
  return data.results.map((item: TMDBTVResult) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching top rated TV shows:', error);
    return [];
  }
};

// Get movie details
export const getMovieDetails = async (id: number): Promise<MovieDetails | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=release_dates`
    );
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Get the US certification
    let certification = "";
    if (data.release_dates && data.release_dates.results) {
    const usReleases = data.release_dates?.results.find((country) => country.iso_3166_1 === "US");
      if (usReleases && usReleases.release_dates && usReleases.release_dates.length > 0) {
        certification = usReleases.release_dates[0].certification || "";
      }
    }
    
    return {
      ...formatMediaItem({...data, media_type: 'movie'}),
      runtime: data.runtime,
      genres: data.genres,
      status: data.status,
      tagline: data.tagline,
      budget: data.budget,
      revenue: data.revenue,
      production_companies: data.production_companies,
      certification: certification,
    } as MovieDetails;
  } catch (error) {
    console.error(`Error fetching movie details for id ${id}:`, error);
    return null;
  }
};

// Get TV show details
export const getTVDetails = async (id: number): Promise<TVDetails | null> => {
  try {
    console.log(`Fetching TV details from: ${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=content_ratings`); // Debug log
    const response = await fetch(
      `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=content_ratings`
    );
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log("Raw TV details data:", data); // Debug log
    
    // Get the US certification
    let certification = "";
    if (data.content_ratings && data.content_ratings.results) {
    const usRating = data.content_ratings?.results.find((country) => country.iso_3166_1 === "US");
      if (usRating) {
        certification = usRating.rating || "";
      }
    }
    
    return {
      ...formatMediaItem({...data, media_type: 'tv'}),
      episode_run_time: data.episode_run_time,
      genres: data.genres,
      status: data.status,
      tagline: data.tagline,
      number_of_episodes: data.number_of_episodes,
      number_of_seasons: data.number_of_seasons,
      seasons: data.seasons,
      production_companies: data.production_companies,
      certification: certification,
    } as TVDetails;
  } catch (error) {
    console.error(`Error fetching TV details for id ${id}:`, error);
    return null;
  }
};

// Get TV show season details
export const getSeasonDetails = async (
  id: number,
  seasonNumber: number
): Promise<Episode[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.episodes;
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} for TV show ${id}:`, error);
    return [];
  }
};

// Get reviews for movie or TV show
export const getReviews = async (
  id: number,
  mediaType: 'movie' | 'tv'
): Promise<Review[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/${mediaType}/${id}/reviews?api_key=${API_KEY}&language=en-US`
    );
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error(`Error fetching reviews for ${mediaType} ${id}:`, error);
    return [];
  }
};

// Get movie recommendations
export const getMovieRecommendations = async (id: number): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
  return data.results.map((item: TMDBMovieResult) => formatMediaItem({...item, media_type: 'movie'}));
  } catch (error) {
    console.error('Error fetching movie recommendations:', error);
    return [];
  }
};

// Get TV show recommendations
export const getTVRecommendations = async (id: number): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${id}/recommendations?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
  return data.results.map((item: TMDBTVResult) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching TV recommendations:', error);
    return [];
  }
};

// Search for movies and TV shows
export const searchMedia = async (query: string, page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
        query
      )}&page=${page}&include_adult=false`
    );
    const data = await response.json();
    return data.results
    .filter((item: TMDBMovieResult | TMDBTVResult) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(formatMediaItem);
  } catch (error) {
    console.error('Error searching media:', error);
    return [];
  }
};
