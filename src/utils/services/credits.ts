import { tmdb } from "./tmdb";
import { CastMember, CrewMember } from "../types";

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
        credit_id?: string;
      }) => ({
        id: member.id,
        name: member.name,
        character: member.character,
        profile_path: member.profile_path,
        order: member.order,
        credit_id: member.credit_id,
      })
    );
  } catch (error) {
    console.error(`Error fetching movie cast for id ${id}:`, error);
    return [];
  }
};

// Get movie credits (cast and crew)
export const getMovieCredits = async (
  id: number
): Promise<{ cast: CastMember[]; crew: CrewMember[] }> => {
  try {
    const response = await tmdb.get(`/movie/${id}/credits`);
    const cast = (response.data.cast || []).map(
      (member: {
        id: number;
        name: string;
        character: string;
        profile_path: string | null;
        order: number;
        credit_id?: string;
      }) => ({
        id: member.id,
        name: member.name,
        character: member.character,
        profile_path: member.profile_path,
        order: member.order,
        credit_id: member.credit_id,
      })
    );
    const crew = (response.data.crew || []).map(
      (member: {
        id: number;
        credit_id: string;
        name: string;
        gender: number;
        profile_path: string | null;
        department: string;
        job: string;
      }) => ({
        id: member.id,
        credit_id: member.credit_id,
        name: member.name,
        gender: member.gender,
        profile_path: member.profile_path,
        department: member.department,
        job: member.job,
      })
    );
    return { cast, crew };
  } catch (error) {
    console.error(`Error fetching movie credits for id ${id}:`, error);
    return { cast: [], crew: [] };
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
