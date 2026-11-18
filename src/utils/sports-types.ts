export interface MatchSource {
  /** Human label for the feed, e.g. "Sky Sports F1" */
  source: string;
  /** Provider-side identifier for the feed */
  id: string;
}

export interface APIMatch {
  id: string;
  title: string;
  /** Slug used for filtering, e.g. "american-football" */
  category: string;
  /** Display label for the category, e.g. "American Football" */
  categoryName?: string;
  /** Unix timestamp in milliseconds (start time; 0 for always-live channels) */
  date: number;
  poster?: string;
  popular?: boolean;
  sources: MatchSource[];
  /** Live right now according to the provider */
  live?: boolean;
  /** 24/7 channel that never ends */
  alwaysLive?: boolean;
  viewers?: number;
  locale?: string;
  /** League or competition label, e.g. "Formula 1" */
  league?: string;
}

export interface Sport {
  id: string;
  name: string;
}

export interface Stream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
}
