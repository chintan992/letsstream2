import { DefaultPluginConfig } from "@/utils/types/plugin";

// Pre-configured default plugins that will be automatically added for new users
export const DEFAULT_PLUGINS: DefaultPluginConfig[] = [
  {
    manifestUrl:
      "https://streamflix-worker.chintanr21.workers.dev/manifest.json",
    name: "StreamFlix",
    description:
      "StreamFlix video links (accepts IMDB IDs and TMDB IDs, enriched with TMDB)",
  },
  {
    manifestUrl: "https://vidlink-worker.chintanr21.workers.dev/manifest.json",
    name: "VidLink",
    description: "VidLink streaming service",
  },
  {
    manifestUrl:
      "https://cinestream-worker.chintanr21.workers.dev/manifest.json",
    name: "CineStream",
    description: "CineStream streaming service",
  },
];
