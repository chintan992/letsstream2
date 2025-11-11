import { Media, Genre, Company } from "../types";

export interface MovieDetails extends Omit<Media, "title" | "release_date"> {
  title: string; // Make title required for movies
  release_date: string; // Make release_date required for movies
  runtime: number;
  genres: Genre[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Company[];
  certification: string;
  logo_path: string | null;
}
