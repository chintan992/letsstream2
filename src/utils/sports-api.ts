
import { APIMatch, Sport, Stream } from './sports-types';

const API_BASE_URL = 'https://api.streamed.cx';

export const getSportsList = async (): Promise<Sport[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sports`);
    if (!response.ok) {
      throw new Error('Failed to fetch sports list');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching sports list:', error);
    return [];
  }
};

export const getMatchesBySport = async (sportId: string): Promise<APIMatch[]> => {
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

export const getPopularMatchesBySport = async (sportId: string): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/${sportId}/popular`);
    if (!response.ok) {
      throw new Error(`Failed to fetch popular matches for sport: ${sportId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching popular matches for sport ${sportId}:`, error);
    return [];
  }
};

export const getAllMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all`);
    if (!response.ok) {
      throw new Error('Failed to fetch all matches');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all matches:', error);
    return [];
  }
};

export const getAllPopularMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all/popular`);
    if (!response.ok) {
      throw new Error('Failed to fetch all popular matches');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all popular matches:', error);
    return [];
  }
};

export const getTodayMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all-today`);
    if (!response.ok) {
      throw new Error('Failed to fetch today\'s matches');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching today\'s matches:', error);
    return [];
  }
};

export const getLiveMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/live`);
    if (!response.ok) {
      throw new Error('Failed to fetch live matches');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
};

export const getMatchStreams = async (source: string, id: string): Promise<Stream[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stream/${source}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch streams for match: ${id} from source: ${source}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching streams for match ${id} from source ${source}:`, error);
    return [];
  }
};

export const getTeamBadgeUrl = (badgeId: string) => {
  return `${API_BASE_URL}/api/images/badge/${badgeId}.webp`;
};

export const getMatchPosterUrl = (posterId: string) => {
  if (posterId.startsWith('http')) {
    return `${API_BASE_URL}/api/images/proxy/${encodeURIComponent(posterId)}.webp`;
  }
  return `${API_BASE_URL}/api/images/poster/${posterId}.webp`;
};
