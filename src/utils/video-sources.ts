import { VideoSource } from "./types";
import { loadVideoSources } from "./video-source-loader";

// Only use built-in video sources
const allVideoSources: VideoSource[] = [...loadVideoSources()];

export { allVideoSources as videoSources };
export default allVideoSources;
