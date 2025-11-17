// Environment variables with type-safe defaults
interface EnvConfig {
  GEMINI_API_KEY: string;
  TMDB_API_KEY: string;
  NODE_ENV: "development" | "production" | "test";
}

// Extract environment variables from Vite environment
const env: EnvConfig = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || "",
  TMDB_API_KEY: import.meta.env.VITE_TMDB_API_KEY || "",
  NODE_ENV: import.meta.env.NODE_ENV || "development",
};

export default env;
