import { APIMatch, MatchSource, Sport, Stream } from "./sports-types";

/**
 * Sports data comes from ppv.st (see src/DOCS/PPV.md). The retired Streamed API
 * exposed a dozen endpoints (per sport, per popularity, per stream source);
 * ppv.st exposes one stream list plus a per-stream detail endpoint, so every
 * helper below is derived from a single cached snapshot.
 */
const API_BASE_URL = "https://api.ppv.st";

/** The provider asks for roughly one poll per minute. */
const CACHE_TTL_MS = 60_000;

/** How many ranked matches the "Popular" surfaces show. */
const POPULAR_LIMIT = 30;

interface PpvSource {
  name?: string;
  type?: string;
  data?: string;
  default?: boolean;
}

interface PpvSubstream {
  id: number;
  name?: string;
  tag?: string;
  uri_name?: string;
  uri?: string;
  source_tag?: string;
  source_tag_raw?: string;
  locale?: string;
  iframe?: string;
  sources?: PpvSource[];
}

interface PpvStream {
  id: number;
  name: string;
  tag?: string;
  source_tag?: string;
  source_tag_raw?: string;
  poster?: string;
  blurhash?: string;
  colors?: string[];
  uri_name?: string;
  starts_at?: number;
  ends_at?: number;
  always_live?: number;
  locale?: string;
  category_name?: string;
  iframe?: string;
  substreams?: PpvSubstream[];
  viewers?: string | number;
}

interface PpvCategory {
  id: number;
  category: string;
  always_live?: number;
  streams?: PpvStream[];
}

interface PpvStreamsResponse {
  success?: boolean;
  error?: string;
  timestamp?: number;
  streams?: PpvCategory[];
}

interface PpvStreamDetail extends Omit<PpvStream, "starts_at" | "ends_at"> {
  category?: number;
  sources?: PpvSource[];
  start_timestamp?: number;
  end_timestamp?: number;
  uri?: string;
}

interface PpvDetailResponse {
  success?: boolean;
  error?: string;
  data?: PpvStreamDetail;
}

interface CategoryInfo {
  slug: string;
  name: string;
}

interface StreamsSnapshot {
  matches: APIMatch[];
  sports: Sport[];
  byId: Map<string, PpvStream>;
  categoriesById: Map<number, CategoryInfo>;
  fetchedAt: number;
}

/**
 * ppv.st categories are display names; the UI filters on slugs and maps slugs
 * to icons, so keep both.
 */
const CATEGORY_SLUGS: Record<string, string> = {
  Football: "football",
  "American Football": "american-football",
  "Australian Football": "afl",
  Basketball: "basketball",
  Cricket: "cricket",
  Darts: "darts",
  Golf: "golf",
  "Ice Hockey": "hockey",
  Motorsports: "motor-sports",
  Rugby: "rugby",
  Tennis: "tennis",
  Wrestling: "fight",
  "24/7 Streams": "24-7",
};

const toSlug = (name: string) =>
  CATEGORY_SLUGS[name] ??
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const toSeconds = () => Math.floor(Date.now() / 1000);

const sourceLabel = (...candidates: (string | undefined)[]) =>
  candidates.find(label => !!label && label.trim().length > 0) ?? "Feed";

/**
 * ppv.st labels feeds as "HD | Sky Sports F1". The quality is already shown in
 * its own badge, so strip the prefix from anything we render as a name.
 */
const feedLabel = (...candidates: (string | undefined)[]) =>
  sourceLabel(...candidates).replace(/^\s*(HD|SD|4K|UHD)\s*\|\s*/i, "");

const isHd = (label: string) => /(^|\b)HD(\b|$)/i.test(label);

const embedUrlOf = (substream: PpvSubstream) =>
  substream.iframe ||
  substream.sources?.find(source => source.type === "iframe")?.data ||
  substream.sources?.find(source => !!source.data)?.data ||
  "";

function isLiveStream(stream: PpvStream, nowSeconds: number) {
  if (stream.always_live === 1) return true;
  const startsAt = stream.starts_at ?? 0;
  const endsAt = stream.ends_at ?? 0;
  if (!startsAt || !endsAt) return false;
  return startsAt <= nowSeconds && nowSeconds <= endsAt;
}

function mapStream(
  stream: PpvStream,
  category: CategoryInfo,
  nowSeconds: number
): APIMatch {
  const sources: MatchSource[] = [
    {
      source: feedLabel(stream.source_tag_raw, stream.source_tag, stream.tag),
      id: String(stream.id),
    },
    ...(stream.substreams ?? []).map(substream => ({
      source: feedLabel(
        substream.source_tag_raw,
        substream.source_tag,
        substream.name
      ),
      id: String(substream.id),
    })),
  ];

  return {
    id: String(stream.id),
    title: stream.name,
    category: category.slug,
    categoryName: category.name,
    date: (stream.starts_at ?? 0) * 1000,
    poster: stream.poster || undefined,
    sources,
    live: isLiveStream(stream, nowSeconds),
    alwaysLive: stream.always_live === 1,
    viewers: Number(stream.viewers) || 0,
    locale: stream.locale,
    league: stream.tag,
  };
}

/** Live first, then most watched, then starting soonest. */
function comparePopularity(a: APIMatch, b: APIMatch) {
  if (!!a.live !== !!b.live) return a.live ? -1 : 1;
  const viewers = (b.viewers ?? 0) - (a.viewers ?? 0);
  if (viewers !== 0) return viewers;
  return a.date - b.date;
}

/** Live first, then chronological; always-live channels sit with the live ones. */
function compareSchedule(a: APIMatch, b: APIMatch) {
  if (!!a.live !== !!b.live) return a.live ? -1 : 1;
  return a.date - b.date;
}

let snapshot: StreamsSnapshot | null = null;
let inFlight: Promise<StreamsSnapshot> | null = null;

async function loadSnapshot(): Promise<StreamsSnapshot> {
  if (snapshot && Date.now() - snapshot.fetchedAt < CACHE_TTL_MS) {
    return snapshot;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/streams`);
    if (!response.ok) {
      throw new Error(`Sports feed responded with HTTP ${response.status}`);
    }

    const payload = (await response.json()) as PpvStreamsResponse;
    // ppv.st answers unknown/failing paths with HTTP 200 and success:false.
    if (payload.success !== true || !Array.isArray(payload.streams)) {
      throw new Error(
        payload.error
          ? `Sports feed error: ${payload.error}`
          : "Sports feed returned an unexpected payload"
      );
    }

    const nowSeconds = toSeconds();
    const matches: APIMatch[] = [];
    const sports: Sport[] = [];
    const byId = new Map<string, PpvStream>();
    const categoriesById = new Map<number, CategoryInfo>();

    for (const category of payload.streams) {
      const info: CategoryInfo = {
        slug: toSlug(category.category),
        name: category.category,
      };
      categoriesById.set(category.id, info);
      sports.push({ id: info.slug, name: info.name });

      for (const stream of category.streams ?? []) {
        byId.set(String(stream.id), stream);
        matches.push(mapStream(stream, info, nowSeconds));
      }
    }

    for (const match of [...matches]
      .sort(comparePopularity)
      .slice(0, POPULAR_LIMIT)) {
      match.popular = true;
    }

    sports.sort((a, b) => a.name.localeCompare(b.name));

    const next: StreamsSnapshot = {
      matches,
      sports,
      byId,
      categoriesById,
      fetchedAt: Date.now(),
    };
    snapshot = next;
    return next;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export const getSportsList = async (): Promise<Sport[]> => {
  const data = await loadSnapshot();
  return data.sports;
};

export const getLiveMatches = async (): Promise<APIMatch[]> => {
  const data = await loadSnapshot();
  return data.matches.filter(match => match.live).sort(compareSchedule);
};

export const getAllPopularMatches = async (): Promise<APIMatch[]> => {
  const data = await loadSnapshot();
  return data.matches.filter(match => match.popular).sort(comparePopularity);
};

export const getTodayMatches = async (): Promise<APIMatch[]> => {
  const data = await loadSnapshot();
  const dayStart = new Date().setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart).setDate(new Date(dayStart).getDate() + 1);

  return data.matches
    .filter(match => {
      if (match.alwaysLive) return true;
      const startsAt = match.date;
      return startsAt >= dayStart && startsAt < dayEnd;
    })
    .sort(compareSchedule);
};

export const getMatchesBySport = async (
  sportId: string
): Promise<APIMatch[]> => {
  const data = await loadSnapshot();
  return data.matches
    .filter(match => match.category === sportId)
    .sort(compareSchedule);
};

export const getPopularMatchesBySport = async (
  sportId: string
): Promise<APIMatch[]> => {
  const data = await loadSnapshot();
  return data.matches
    .filter(match => match.category === sportId)
    .sort(comparePopularity)
    .slice(0, POPULAR_LIMIT);
};

export const getMatchById = async (
  matchId: string
): Promise<APIMatch | null> => {
  const data = await loadSnapshot();
  const cached = data.matches.find(match => match.id === matchId);
  if (cached) return cached;

  // Deep links can outlive a snapshot entry; ask the provider directly.
  const detail = await fetchStreamDetail(matchId);
  if (!detail) return null;

  const category = data.categoriesById.get(detail.category ?? -1) ?? {
    slug: detail.category_name ? toSlug(detail.category_name) : "other",
    name: detail.category_name ?? "Other",
  };

  return mapStream(
    {
      ...detail,
      starts_at: detail.start_timestamp,
      ends_at: detail.end_timestamp,
      uri_name: detail.uri_name ?? detail.uri,
    },
    category,
    toSeconds()
  );
};

async function fetchStreamDetail(
  matchId: string
): Promise<PpvStreamDetail | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streams/${matchId}`);
    if (!response.ok) return null;

    const payload = (await response.json()) as PpvDetailResponse;
    if (payload.success !== true || !payload.data) return null;
    return payload.data;
  } catch (error) {
    console.error(`Error fetching sports match ${matchId}:`, error);
    return null;
  }
}

function streamsFromSubstreams(
  matchId: string,
  substreams: PpvSubstream[]
): Stream[] {
  return substreams
    .map((substream, index) => {
      const label = feedLabel(
        substream.source_tag_raw,
        substream.source_tag,
        substream.name
      );
      return {
        id: String(substream.id ?? `${matchId}-${index}`),
        streamNo: index + 1,
        language: substream.locale ?? "en",
        hd: isHd(substream.source_tag ?? label),
        embedUrl: embedUrlOf(substream),
        source: label,
      };
    })
    .filter(stream => stream.embedUrl.length > 0);
}

export const getMatchStreamsById = async (
  matchId: string
): Promise<Stream[]> => {
  const data = await loadSnapshot();
  const stream = data.byId.get(matchId);

  if (stream) {
    const primaryLabel = feedLabel(
      stream.source_tag_raw,
      stream.source_tag,
      stream.tag
    );
    const primary: Stream[] = stream.iframe
      ? [
          {
            id: String(stream.id),
            streamNo: 1,
            language: stream.locale ?? "en",
            hd: isHd(stream.source_tag ?? primaryLabel),
            embedUrl: stream.iframe,
            source: primaryLabel,
          },
        ]
      : [];

    return [
      ...primary,
      ...streamsFromSubstreams(matchId, stream.substreams ?? []),
    ];
  }

  // Not in the current snapshot (stale deep link) — resolve it from the provider.
  const detail = await fetchStreamDetail(matchId);
  if (!detail) return [];

  const primaryLabel = feedLabel(
    detail.source_tag_raw,
    detail.source_tag,
    detail.tag
  );
  const primarySource = detail.sources?.find(
    source => source.type === "iframe" && source.data
  );

  const primary: Stream[] =
    detail.iframe || primarySource?.data
      ? [
          {
            id: String(detail.id),
            streamNo: 1,
            language: detail.locale ?? "en",
            hd: isHd(detail.source_tag ?? primaryLabel),
            embedUrl: detail.iframe ?? primarySource?.data ?? "",
            source: primaryLabel,
          },
        ]
      : [];

  return [
    ...primary,
    ...streamsFromSubstreams(matchId, detail.substreams ?? []),
  ];
};

const DEFAULT_POSTER_URL = "/placeholder.svg";

export const getMatchPosterUrl = (poster?: string) => {
  if (!poster) return DEFAULT_POSTER_URL;
  // ppv.st hands out absolute URLs on its static host.
  if (poster.startsWith("http://") || poster.startsWith("https://")) {
    return poster;
  }
  return `${API_BASE_URL}${poster.startsWith("/") ? "" : "/"}${poster}`;
};

/** Exposed for diagnostics: force the next call to hit the provider. */
export const invalidateSportsCache = () => {
  snapshot = null;
};
