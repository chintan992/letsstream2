import { tmdb } from "./tmdb";
import { CastMember } from "../types";

// Get movie cast
export const getMovieCast = async (id: number): Promise<CastMember[]> => {
  try {
    const response = await tmdb.get(`/movie/${id}/credits`);
    return (response.data.cast || []).map(
      (member: {
        id: number;
        name: string;
        character: string;
        profile_path: string | null;
        order: number;
      }) => ({
        id: member.id,
        name: member.name,
        character: member.character,
        profile_path: member.profile_path,
        order: member.order,
      })
    );
  } catch (error) {
    console.error(`Error fetching movie cast for id ${id}:`, error);
    return [];
  }
};

// Get TV show cast
export const getTVCast = async (id: number): Promise<CastMember[]> => {
  try {
    const response = await tmdb.get(`/tv/${id}/credits`);
    return (response.data.cast || []).map(
      (member: {
        id: number;
        name: string;
        character: string;
        profile_path: string | null;
        order: number;
      }) => ({
        id: member.id,
        name: member.name,
        character: member.character,
        profile_path: member.profile_path,
        order: member.order,
      })
    );
  } catch (error) {
    console.error(`Error fetching TV cast for id ${id}:`, error);
    return [];
  }
};
