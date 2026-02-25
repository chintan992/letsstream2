const SIMKL_API_URL = "https://api.simkl.com";
const SIMKL_CLIENT_ID = import.meta.env.VITE_SIMKL_CLIENT_ID;
const SIMKL_CLIENT_SECRET = import.meta.env.VITE_SIMKL_CLIENT_SECRET;

if (SIMKL_CLIENT_SECRET) {
  console.warn(
    "[Security] VITE_SIMKL_CLIENT_SECRET is present in the frontend bundle. " +
      "This secret is visible to users. Move the Simkl OAuth token exchange to a " +
      "backend function to eliminate this exposure."
  );
}

interface SimklTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export class SimklService {
  static getAuthorizeUrl(redirectUri: string): string {
    return `https://simkl.com/oauth/authorize?response_type=code&client_id=${SIMKL_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
  }

  static async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<SimklTokenResponse> {
    const response = await fetch(`${SIMKL_API_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: SIMKL_CLIENT_ID,
        client_secret: SIMKL_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for token");
    }

    return response.json();
  }

  static async checkin(
    token: string,
    media: {
      title?: string;
      year?: number;
      ids: {
        simkl?: number;
        imdb?: string;
        tmdb?: number;
        tvdb?: number;
        slug?: string;
      };
      season?: number;
      episode?: number;
    }
  ): Promise<void> {
    // Determine if it's a movie or show/episode based on season/episode presence
    const isEpisode = media.season !== undefined && media.episode !== undefined;

    const body: any = {};

    if (isEpisode) {
      body.show = {
        ids: media.ids,
        title: media.title,
        year: media.year,
        episode: {
          season: media.season,
          number: media.episode,
        },
      };
    } else {
      body.movie = {
        ids: media.ids,
        title: media.title,
        year: media.year,
      };
    }

    const response = await fetch(`${SIMKL_API_URL}/checkin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "simkl-api-key": SIMKL_CLIENT_ID,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // 409 means checkin in progress, which is fine, we just ignore it
      if (response.status === 409) return;
      throw new Error("Failed to check in");
    }
  }

  // Types for Simkl list items
  static readonly MediaTypes = ["movies", "shows", "anime"] as const;
  static readonly Statuses = [
    "watching",
    "plantowatch",
    "completed",
    "hold",
    "dropped",
  ] as const;

  static async getAllItems(
    token: string,
    type: "movies" | "shows" | "anime" = "movies",
    status:
      | "watching"
      | "plantowatch"
      | "completed"
      | "hold"
      | "dropped" = "completed"
  ): Promise<SimklListItem[]> {
    // Request extended data with episode info
    const params = new URLSearchParams({
      extended: "full",
      episode_watched_at: "yes",
    });

    const response = await fetch(
      `${SIMKL_API_URL}/sync/all-items/${type}/${status}?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "simkl-api-key": SIMKL_CLIENT_ID,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Simkl ${type} list`);
    }

    const data = await response.json();
    return data[type] || [];
  }

  static async getFullWatchHistory(
    token: string
  ): Promise<SimklWatchHistoryResponse> {
    // Fetch all types in parallel
    const [movies, shows, anime] = await Promise.all([
      this.getAllItems(token, "movies", "completed").catch(() => []),
      this.getAllItems(token, "shows", "completed").catch(() => []),
      this.getAllItems(token, "anime", "completed").catch(() => []),
    ]);

    // Also get currently watching
    const [watchingMovies, watchingShows, watchingAnime] = await Promise.all([
      this.getAllItems(token, "movies", "watching").catch(() => []),
      this.getAllItems(token, "shows", "watching").catch(() => []),
      this.getAllItems(token, "anime", "watching").catch(() => []),
    ]);

    return {
      movies: [...watchingMovies, ...movies],
      shows: [...watchingShows, ...shows],
      anime: [...watchingAnime, ...anime],
    };
  }

  // ==================== DISCOVER API ====================

  /**
   * Get trending content from Simkl
   * @param type - Type of content: 'tv', 'movies', or 'anime'
   * @param filters - Optional filters (e.g., genre, year, network)
   */
  static async getTrending(
    type: "tv" | "movies" | "anime",
    filters?: Record<string, string>
  ): Promise<SimklTrendingItem[]> {
    try {
      const params = new URLSearchParams({
        extended: "full",
        client_id: SIMKL_CLIENT_ID,
        ...(filters || {}),
      });

      const response = await fetch(
        `${SIMKL_API_URL}/${type}/trending?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "simkl-api-key": SIMKL_CLIENT_ID,
          },
        }
      );

      if (!response.ok) {
        console.warn(`Simkl trending ${type} returned ${response.status}`);
        return [];
      }

      return response.json();
    } catch (error) {
      console.warn(`Failed to fetch Simkl trending ${type}:`, error);
      return [];
    }
  }

  /**
   * Get personalized recommendations (requires auth)
   */
  static async getRecommendations(
    token: string,
    type: "tv" | "movies" | "anime" = "tv"
  ): Promise<SimklTrendingItem[]> {
    try {
      const response = await fetch(
        `${SIMKL_API_URL}/recommendations/${type}?extended=full`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "simkl-api-key": SIMKL_CLIENT_ID,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      return response.json();
    } catch (error) {
      console.warn("Failed to fetch recommendations:", error);
      return [];
    }
  }

  /**
   * Get available genre filters
   */
  static async getGenres(
    type: "tv" | "movies" | "anime"
  ): Promise<SimklGenre[]> {
    try {
      const response = await fetch(`${SIMKL_API_URL}/genres/${type}/filters`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "simkl-api-key": SIMKL_CLIENT_ID,
        },
      });

      if (!response.ok) {
        return [];
      }

      return response.json();
    } catch (error) {
      console.warn("Failed to fetch genres:", error);
      return [];
    }
  }
}

// Types for Simkl API responses
export interface SimklListItem {
  last_watched_at?: string;
  status?: string;
  user_rating?: number;
  last_watched?: string; // e.g. "S01E01" or "E6"
  next_to_watch?: string;
  watched_episodes_count?: number;
  total_episodes_count?: number;
  show?: SimklShow;
  movie?: SimklMovie;
  anime?: SimklAnime;
  // Extended data - seasons at top level!
  seasons?: SimklSeason[];
}
interface SimklShow {
  title: string;
  poster?: string;
  year?: number;
  ids: SimklIds;
  // Extended data - seasons with episodes
  seasons?: SimklSeason[];
}

interface SimklMovie {
  title: string;
  poster?: string;
  year?: number;
  ids: SimklIds;
}

interface SimklAnime {
  title: string;
  poster?: string;
  year?: number;
  ids: SimklIds;
  // Extended data - episodes (anime often doesn't use seasons)
  episodes?: SimklEpisode[];
}

interface SimklSeason {
  number: number;
  episodes?: SimklEpisode[];
}

interface SimklEpisode {
  number: number;
  watched_at?: string;
}

interface SimklIds {
  simkl: number;
  slug?: string;
  imdb?: string;
  tmdb?: number;
  tvdb?: number;
  mal?: number;
  anidb?: number;
}

interface SimklWatchHistoryResponse {
  movies: SimklListItem[];
  shows: SimklListItem[];
  anime: SimklListItem[];
}

// ==================== DISCOVER TYPES ====================

export interface SimklTrendingItem {
  title: string;
  year?: number;
  poster?: string;
  fanart?: string;
  rank?: number;
  ratings?: {
    simkl?: { rating: number; votes: number };
    imdb?: { rating: number; votes: number };
  };
  ids: SimklIds;
  overview?: string;
  genres?: string[];
  runtime?: number;
  status?: string;
  certification?: string;
  network?: string;
  country?: string;
  anime_type?: string;
  ep_count?: number;
}

interface SimklGenre {
  slug: string;
  name: string;
}

// Helper to get the last watched episode from a show/anime
export function getLastWatchedEpisode(
  item: SimklListItem
): { season: number; episode: number } | null {
  // First try to parse from last_watched field (e.g. "S01E01" or "E6")
  if (item.last_watched) {
    // Match "S01E01" format
    const showMatch = item.last_watched.match(/S(\d+)E(\d+)/);
    if (showMatch) {
      return {
        season: parseInt(showMatch[1], 10),
        episode: parseInt(showMatch[2], 10),
      };
    }

    // Match "E6" format (anime without season)
    const animeMatch = item.last_watched.match(/E(\d+)/);
    if (animeMatch) {
      return {
        season: 1,
        episode: parseInt(animeMatch[1], 10),
      };
    }
  }

  // Fallback: Parse from seasons data (at top level of item)
  if (item.seasons && item.seasons.length > 0) {
    let lastWatched: { season: number; episode: number; date: Date } | null =
      null;

    for (const season of item.seasons) {
      if (season.episodes) {
        for (const ep of season.episodes) {
          if (ep.watched_at) {
            const watchDate = new Date(ep.watched_at);
            if (!lastWatched || watchDate > lastWatched.date) {
              lastWatched = {
                season: season.number,
                episode: ep.number,
                date: watchDate,
              };
            }
          }
        }
      }
    }

    if (lastWatched) {
      return { season: lastWatched.season, episode: lastWatched.episode };
    }
  }

  return null;
}
