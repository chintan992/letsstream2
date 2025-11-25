import { APIMatch, Sport, Stream } from "./sports-types";

const API_BASE_URL = "https://streamed.pk";

export const getSportsList = async (): Promise<Sport[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sports`);
    if (!response.ok) {
      throw new Error("Failed to fetch sports list");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching sports list:", error);
    return [];
  }
};

export const getMatchesBySport = async (
  sportId: string
): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/${sportId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch matches for sport: ${sportId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching matches for sport ${sportId}:`, error);
    return [];
  }
};

export const getPopularMatchesBySport = async (
  sportId: string
): Promise<APIMatch[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/matches/${sportId}/popular`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch popular matches for sport: ${sportId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching popular matches for sport ${sportId}:`,
      error
    );
    return [];
  }
};

export const getAllMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all`);
    if (!response.ok) {
      throw new Error("Failed to fetch all matches");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching all matches:", error);
    return [];
  }
};

export const getAllPopularMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all/popular`);
    if (!response.ok) {
      throw new Error("Failed to fetch all popular matches");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching all popular matches:", error);
    return [];
  }
};

export const getTodayMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all-today`);
    if (!response.ok) {
      throw new Error("Failed to fetch today's matches");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching today's matches:", error);
    return [];
  }
};

export const getLiveMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/live`);
    if (!response.ok) {
      throw new Error("Failed to fetch live matches");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
};

const SOURCES = [
  "alpha",
  "bravo",
  "charlie",
  "delta",
  "echo",
  "foxtrot",
  "golf",
  "hotel",
  "intel",
];

export const getMatchStreams = async (
  source: string | null,
  id: string
): Promise<Stream[]> => {
  if (source) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stream/${source}/${id}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch streams for match: ${id} from source: ${source}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error(
        `Error fetching streams for match ${id} from source ${source}:`,
        error
      );
      return [];
    }
  } else {
    const allStreams = [];
    for (const src of SOURCES) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/stream/${src}/${id}`);
        if (response.ok) {
          const streams = await response.json();
          allStreams.push(...streams);
        } else {
          console.warn(`No streams found for source ${src} and match ${id}`);
        }
      } catch (error) {
        console.error(
          `Error fetching streams for match ${id} from source ${src}:`,
          error
        );
      }
    }
    return allStreams;
  }
};

export const getTeamBadgeUrl = (badgeId: string) => {
  return `${API_BASE_URL}/api/images/badge/${badgeId}.webp`;
};

const DEFAULT_POSTER_URL = "/placeholder.svg"; // Using placeholder.svg from public directory

export const getMatchPosterUrl = (posterId: string) => {
  if (!posterId) {
    return DEFAULT_POSTER_URL;
  }

  // If it's already a full HTTP URL, return it as-is
  if (posterId.startsWith("http://") || posterId.startsWith("https://")) {
    return posterId;
  }

  // If it's already a proxy path, prepend the base URL
  if (posterId.startsWith("/api/images/proxy/")) {
    return `${API_BASE_URL}${posterId}`;
  }

  // Otherwise, treat it as a poster ID and use the proxy endpoint
  return `${API_BASE_URL}/api/images/proxy/${posterId}.webp`;
};

export const getPopularLiveMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/live/popular`);
    if (!response.ok) {
      throw new Error("Failed to fetch popular live matches");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching popular live matches:", error);
    return [];
  }
};

export const getPopularTodayMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/matches/all-today/popular`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch popular today matches");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching popular today matches:", error);
    return [];
  }
};

export const getMatchById = async (matchId: string): Promise<APIMatch | null> => {
  try {
    // Try to find the match in all matches
    const allMatches = await getAllMatches();
    const match = allMatches.find(m => m.id === matchId);

    if (match) {
      return match;
    }

    // If not found in all matches, try live matches
    const liveMatches = await getLiveMatches();
    const liveMatch = liveMatches.find(m => m.id === matchId);

    if (liveMatch) {
      return liveMatch;
    }

    // If still not found, try today's matches
    const todayMatches = await getTodayMatches();
    const todayMatch = todayMatches.find(m => m.id === matchId);

    return todayMatch || null;
  } catch (error) {
    console.error(`Error fetching match ${matchId}:`, error);
    return null;
  }
};

export const getMatchStreamsById = async (matchId: string): Promise<Stream[]> => {
  try {
    // First, get the match details to access the sources array
    const match = await getMatchById(matchId);

    if (!match || !match.sources || match.sources.length === 0) {
      console.warn(`No sources found for match ${matchId}`);
      return [];
    }

    // Fetch streams from all available sources
    const allStreams: Stream[] = [];

    for (const source of match.sources) {
      try {
        const streams = await getMatchStreams(source.source, source.id);
        allStreams.push(...streams);
      } catch (error) {
        console.warn(`Failed to fetch streams from source ${source.source}:`, error);
      }
    }

    return allStreams;
  } catch (error) {
    console.error(`Error fetching streams for match ${matchId}:`, error);
    return [];
  }
};
