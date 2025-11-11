import { VideoSource } from "./types";
import videoSourcesJson from "./video-sources.json";

interface JsonVideoSource {
  key: string;
  name: string;
  movieUrlPattern: string;
  tvUrlPattern: string;
}

function createVideoSource(source: JsonVideoSource): VideoSource {
  return {
    key: source.key,
    name: source.name,
    getMovieUrl: (id: number) =>
      source.movieUrlPattern.replace("{id}", id.toString()),
    getTVUrl: (id: number, season: number, episode: number) =>
      source.tvUrlPattern
        .replace("{id}", id.toString())
        .replace("{season}", season.toString())
        .replace("{episode}", episode.toString()),
  };
}

export function loadVideoSources(): VideoSource[] {
  const sources = (videoSourcesJson.videoSources as JsonVideoSource[]).map(
    createVideoSource
  );
  return sources;
}
