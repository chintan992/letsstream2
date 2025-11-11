import axios from "axios";

interface DownloadResult {
  title: string;
  size: string;
  download_url: string;
  file_id: string;
}

interface DownloadResponse {
  status: string;
  query: string;
  total_results: number;
  results: DownloadResult[];
  response_time_ms: number;
}

export const fetchDownloadLinks = async (
  name: string,
  season?: number,
  episode?: number
): Promise<DownloadResult[]> => {
  try {
    // Step 1: Get the base URL from the local proxy
    const baseUrlResp = await axios.get<{ url: string }>(
      "https://vd-src-worker.chintanr21.workers.dev/download"
    );
    const baseUrl = baseUrlResp.data.url;
    let url = `${baseUrl}${encodeURIComponent(name.toLowerCase())}`;
    if (season !== undefined && episode !== undefined) {
      url += `&season=${season}&episode=${episode}`;
    }

    const response = await axios.get<DownloadResponse>(url);
    return response.data.results;
  } catch (error) {
    console.error("Error fetching download links:", error);
    return [];
  }
};
