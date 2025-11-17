import { tmdb } from "./tmdb";
import { trackEvent } from "@/lib/analytics";
import { Media, MovieImagesResponse } from "../types";
import { MovieDetails } from "../types/movie";
import { TMDBMovieResult, TMDBMovieDetailsResult } from "../types/tmdb";
import { formatMediaResult } from "./media";
import { TMDB } from "../config/constants";

export async function getMovie(id: number): Promise<MovieDetails> {
  const response = await tmdb.get<TMDBMovieDetailsResult>(`/movie/${id}`);
  return formatMovieDetails(response.data);
}

export async function getPopularMovies(page = 1): Promise<Media[]> {
  const response = await tmdb.get<{ results: TMDBMovieResult[] }>(
    "/movie/popular",
    {
      params: { page },
    }
  );
  return response.data.results.map(formatMediaResult);
}

export async function getTopRatedMovies(page = 1): Promise<Media[]> {
  const response = await tmdb.get<{ results: TMDBMovieResult[] }>(
    "/movie/top_rated",
    {
      params: { page },
    }
  );
  return response.data.results.map(formatMediaResult);
}

export async function getTrendingMovies(
  timeWindow: "day" | "week" = "week",
  page = 1
): Promise<Media[]> {
  const response = await tmdb.get<{ results: TMDBMovieResult[] }>(
    `/trending/movie/${timeWindow}`,
    {
      params: { page },
    }
  );
  return response.data.results.map(formatMediaResult);
}

// Get movie recommendations
export async function getMovieRecommendations(id: number): Promise<Media[]> {
  try {
    const response = await tmdb.get<{ results: TMDBMovieResult[] }>(
      `/movie/${id}/recommendations`
    );
    return response.data.results.map(item =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching movie recommendations:", error);
    // Log API error to analytics
    await trackEvent({
      name: "api_error",
      params: {
        api: "tmdb/movie/recommendations",
        error: error instanceof Error ? error.message : String(error),
        movieId: id,
      },
    });
    return [];
  }
}

// Get movie details
export async function getMovieDetails(
  id: number
): Promise<MovieDetails | null> {
  try {
    const [detailsResponse, imagesResponse] = await Promise.all([
      tmdb.get<TMDBMovieDetailsResult>(
        `/movie/${id}?append_to_response=release_dates,credits`
      ),
      tmdb.get<MovieImagesResponse>(`/movie/${id}/images`),
    ]);

    const detailsData = detailsResponse.data;
    const imagesData = imagesResponse.data;

    let certification = "";
    if (detailsData.release_dates && detailsData.release_dates.results) {
      const usReleases = detailsData.release_dates?.results.find(
        country => country.iso_3166_1 === "US"
      );
      if (
        usReleases &&
        usReleases.release_dates &&
        usReleases.release_dates.length > 0
      ) {
        certification = usReleases.release_dates[0].certification || "";
      }
    }

    let bestLogo = null;
    if (imagesData.logos && imagesData.logos.length > 0) {
      const englishLogos = imagesData.logos.filter(
        logo => logo.iso_639_1 === "en"
      );
      if (englishLogos.length > 0) {
        bestLogo = englishLogos.reduce((prev, current) =>
          prev.vote_average > current.vote_average ? prev : current
        );
      }
    }

    // Ensure all required properties are present, and fall back to sensible defaults when needed
    const formattedData = formatMediaResult({
      ...detailsData,
      media_type: "movie",
    });

    // Extract directors from crew
    const directors = detailsData.credits?.crew?.filter(person =>
      person.job === 'Director' && person.department === 'Directing'
    ) || [];

    return {
      ...formattedData,
      title: formattedData.title || detailsData.title || "Unknown Movie",
      release_date:
        formattedData.release_date || detailsData.release_date || "",
      runtime: detailsData.runtime || 0,
      genres: detailsData.genres || [],
      status: detailsData.status || "",
      tagline: detailsData.tagline || "",
      budget: detailsData.budget || 0,
      revenue: detailsData.revenue || 0,
      production_companies: detailsData.production_companies || [],
      directors: directors,
      certification: certification,
      logo_path: bestLogo ? bestLogo.file_path : null,
    };
  } catch (error) {
    console.error(`Error fetching movie details for id ${id}:`, error);
    // Log API error to analytics
    await trackEvent({
      name: "api_error",
      params: {
        api: "tmdb/movie/details",
        error: error instanceof Error ? error.message : String(error),
        movieId: id,
      },
    });
    return null;
  }
}

// Validate TMDB movie ID
export async function validateMovieId(tmdbId: number): Promise<boolean> {
  try {
    const response = await tmdb.get(`/movie/${tmdbId}`);
    return response.data && response.data.id === tmdbId;
  } catch (error) {
    // Log API error to analytics
    await trackEvent({
      name: "api_error",
      params: {
        api: "tmdb/movie/validate",
        error: error instanceof Error ? error.message : String(error),
        movieId: tmdbId,
      },
    });
    return false;
  }
}

// Get movie images
export async function getMovieImages(id: number): Promise<any> {
  try {
    const response = await tmdb.get<any>(`/movie/${id}/images`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching images for movie ${id}:`, error);
    return { backdrops: [], posters: [] };
  }
}

function formatMovieDetails(movie: TMDBMovieDetailsResult): MovieDetails {
  const formattedData = formatMediaResult({ ...movie, media_type: "movie" });

  // Extract directors from crew
  const directors = movie.credits?.crew?.filter(person =>
    person.job === 'Director' && person.department === 'Directing'
  ) || [];

  return {
    ...formattedData,
    title: movie.title || "Unknown Movie",
    release_date: movie.release_date || "",
    runtime: movie.runtime || 0,
    genres: movie.genres || [],
    status: movie.status || "",
    tagline: movie.tagline || "",
    budget: movie.budget || 0,
    revenue: movie.revenue || 0,
    production_companies: movie.production_companies || [],
    directors: directors,
    certification: "", // Set by parent function after release dates lookup
    logo_path: null, // Set by parent function after image lookup
  };
}
