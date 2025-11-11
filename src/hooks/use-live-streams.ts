import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { LiveStream } from "@/pages/LiveStreams";

interface LiveStreamsResponse {
  type: string;
  generated_by: string;
  total_mathes: number;
  last_upaded: string;
  matches: LiveStream[];
}

export const LIVE_STREAMS_API =
  "https://raw.githubusercontent.com/byte-capsule/FanCode-Hls-Fetcher/main/Fancode_hls_m3u8.Json";

export const fetchLiveStreams = async (): Promise<LiveStreamsResponse> => {
  try {
    const { data } = await axios.get<LiveStreamsResponse>(LIVE_STREAMS_API);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch live streams: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while fetching live streams");
  }
};

export const useLiveStreams = () => {
  return useQuery({
    queryKey: ["liveStreams"],
    queryFn: fetchLiveStreams,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};
