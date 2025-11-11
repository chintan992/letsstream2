export interface Team {
  name: string;
  badge: string;
}

export interface Teams {
  home: Team;
  away: Team;
}

export interface MatchSource {
  source: string;
  id: string;
}

export interface APIMatch {
  id: string;
  title: string;
  category: string;
  date: number; // Unix timestamp in milliseconds
  poster?: string;
  popular: boolean;
  teams?: Teams;
  sources: MatchSource[];
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
