# ppv.st API — research notes

Replacement candidate for the retired Streamed API (`streamed.pk`, now serving a
"Streamed Closure" page). Everything below was measured against the live service,
not copied from marketing copy.

Docs page (client-rendered): <https://ppv.st/api>
API host: `https://api.ppv.st` (only the API subdomain serves JSON — `ppv.st/api/*`
returns the SPA shell).

Headline: **the API is open, needs no key, sends `Access-Control-Allow-Origin: *`,
and its data is current.** It is a much smaller surface than Streamed: 4 grouped
endpoints, no per-sport or per-source fan-out.

---

## 1. Endpoints

| Endpoint | Returns | Notes |
| --- | --- | --- |
| `GET /api/ping` | `{ success, domains[], status[] }` | Mirror list, `Cache-Control: max-age=900` |
| `GET /api/streams` | `{ success, timestamp, READ_ME, performance, streams[] }` | All live + upcoming streams, grouped by category. `max-age=10` |
| `GET /api/streams/:id` | `{ success, data }` | One stream with resolved `sources[]`, `substreams[]`, `m3u8`, flags |
| `GET /api/vods` | `{ success, timestamp, performance, vods[] }` | VOD categories, same grouping shape |
| `GET /api/vods/:id` | `{ success, data }` | VOD detail incl. **direct HLS** `source: { type: "playlist", data: "<m3u8>" }` |

Anything else answers `{"success":false,"error":"API endpoint not found."}` with
HTTP 200, so a wrong path looks healthy unless you check `success`.

`GET /api/streams/1` → `{"success":false,"error":"Item not found"}` (HTTP 404) means
the id namespace is global, not per category.

## 2. `/api/streams` shape

Top level: `success` (bool), `timestamp` (unix seconds, response generation time),
`READ_ME` ("Interested in using our API? Contact us for more information."),
`performance` (float, seconds), `streams` (array).

Each `streams[]` entry is a **category**:

```json
{ "id": 34, "category": "Football", "always_live": 0, "streams": [ ... ] }
```

Categories observed (13): American Football (26), Australian Football (66),
Basketball (37), Cricket (47), Darts (32), Football (34), Golf (64),
Ice Hockey (39), Motorsports (35), Rugby (42), Tennis (63), Wrestling (38),
24/7 Streams (14, `always_live: 1`).

Each stream object (16 keys, all always present in the 211-stream sample):

```json
{
  "id": 32424,
  "name": "Las Vegas Grand Prix - Practice 1",
  "tag": "Formula 1",
  "source_tag": "HD | Sky Sports F1",
  "poster": "https://static.ppvservices.st/assets/thumb/<hash>-thumbnail.jpg",
  "blurhash": "L6AA,*of00t700ayxuRk00WB~Vf6",
  "colors": ["#01326a", "#01326a"],
  "uri_name": "f1/2026/las-vegas/fp1",
  "starts_at": 1795134600,
  "ends_at": 1795141800,
  "always_live": 0,
  "locale": "en-gb",
  "category_name": "Motorsports",
  "iframe": "https://taifood-blog.asia/embed/f1/2026/las-vegas/fp1",
  "substreams": [ { "id": 1032424, "name": "...", "tag": "Formula 1",
                    "uri_name": "f1/2026/las-vegas/fp1_540p",
                    "source_tag": "SD | Sky Sports F1", "locale": "en-gb",
                    "iframe": "https://taifood-blog.asia/embed/..." } ],
  "viewers": "1"
}
```

Notes that matter for us:

- `tag` is the **league/competition** ("NFL", "College Football", "Formula 1",
  "24/7 channel"); `source_tag` is `"<quality> | <broadcaster>"`. Both are free
  replacements for Streamed's `hd` / `streamNo` / `language` fields.
- `starts_at` / `ends_at` are unix **seconds**; `always_live` streams carry `0`
  (4 of 18) — treat `always_live === 1` as live regardless of the window.
- `viewers` is a **string** in the list and a **number** in the detail response.
  Only 36 of 211 streams had a non-zero count at capture time; max 1911.
- The documented `allowpaststreams` field is **not in the payload**. Ended events
  are simply pruned server-side (0 of 211 had `ends_at` in the past).
- `locale` values seen: `en` (163), `fr` (9), `es-us` (9), `nl` (9), `en-ca` (8),
  `sv` (8), `en-gb` (5).

## 3. Playback: iframe only for live, HLS for VOD

`GET /api/streams/:id` adds `sources`, `source_type`, `m3u8`, `vip_stream`, `auth`,
`server_id`, `uri`, `token`, `viewers`.

- Every live stream sampled (13/13 of the full list, 27/27 of a detail sample) has
  exactly **one** source, `type: "iframe"`, pointing at
  `https://taifood-blog.asia/embed/<uri_name>`.
- `m3u8` was empty on all live streams → no direct playlist, so an iframe (or
  nothing) is the only option for live.
- `substreams[]` are alternate quality/broadcaster feeds of the same event with
  their own `iframe` (up to 17 on an F1 session) — this replaces Streamed's
  nine `/api/stream/{source}/{id}` calls with data already in the payload.
- VODs differ: `/api/vods/:id` returns
  `source: {"type":"playlist","data":"https://vod.television.st/evw23/index.m3u8"}`,
  a real HLS URL usable by our own player.

### Framing works, ads come with it

The embed host sets no `X-Frame-Options` / `frame-ancestors` restriction: framed
from `http://127.0.0.1:8199` (a foreign origin) the JW Player renders normally
(verified visually). Two caveats:

- The embed loads third-party ad/tracking scripts (`adexchangeclear.com`,
  `usrpubtrk.com`). The terms explicitly forbid "bypassing ad/integration rules" —
  embed the iframe as given, do not strip or sandbox around its ads.
- Playback could not be confirmed headlessly: `video.play()` resolves to
  `AbortError`, two XHRs fail with `net::ERR_FAILED`, and `readyState` stays 0.
  **The control test — ppv.st's own `/live/nfl-network` page — fails identically**,
  so this is a headless-environment limitation (bot/ad-token blocking), not a
  framing restriction. Needs one interactive check in a real browser before we
  ship.

## 4. Limits, caching, ops

- `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: *` — direct
  browser calls are fine, no proxy needed.
- `Cache-Control: max-age=10` on `/api/streams`, `max-age=900` on `/api/ping`.
  Docs ask for *"poll approximately every 1 minute"*, sensible caching server-side,
  and no aggressive polling.
- `Content-Encoding: gzip` supported; payload is 190 KB raw (~0.6–0.8 s from here).
- No auth, no key, no cookies. No rate-limit headers observed.
- `X-Powered-By` / `Server: ddos-guard` — DDoS-Guard fronts the API; expect
  occasional 403s from aggressive clients.
- Mirror domains from `/api/ping`: `ppv.st, ppv.tj, ppvs.pk, ppv.rw, ppv.ms,
  ppv.bi, ppv.ug`. Only `api.ppv.st` was reachable from this network; the others
  resolve to a different IP that refused connections. Worth a failover list, but
  don't assume they work.
- `READ_ME` on every response: *"Interested in using our API? Contact us for more
  information."* — the docs grant public use, but commercial use is worth asking
  about.

## 5. Mapping onto the current app

Current code talks to Streamed through `src/utils/sports-api.ts`
(`/api/sports`, `/api/matches/{sport}`, `/api/matches/{sport}/popular`,
`/api/matches/all`, `/api/matches/all/popular`, `/api/matches/all-today`,
`/api/matches/live`, `/api/stream/{source}/{id}`, `/api/images/...`) and
`src/utils/sports-types.ts` (`APIMatch`, `Sport`, `Stream`).

| Today | ppv.st |
| --- | --- |
| `getSportsList()` → `/api/sports` | derive from `category_name` / category `id` in one `/api/streams` call |
| `getAllMatches`, `getTodayMatches`, `getLiveMatches`, per-sport variants (6 calls) | **one** `/api/streams` call; split locally by `starts_at`/`ends_at`/`always_live` |
| "Popular" tab (`popular` flag) | no equivalent — derive (e.g. top N by `viewers`, else league weight). Needs a product decision |
| `getMatchStreamsById()` → N calls over `/api/stream/{source}/{id}` | `substreams[]` already in the payload; `sources[]` from `/api/streams/:id` |
| `Stream { id, streamNo, language, hd, embedUrl, source }` | map `{ id, uri_name, locale, source_tag ("HD | Sky"), iframe }` |
| `getTeamBadgeUrl()` / `teams.home|away` | **no team data at all** — `SportMatchCard`'s badge branch would go unused; cards fall back to `poster` |
| `getMatchPosterUrl()` | pass `poster` straight through (absolute URL); `blurhash` + `colors` available for placeholders |
| id type | ppv ids are **numbers**, ours are strings — cast at the boundary |

Stats at capture time (2026-11-17T19:49Z): 211 streams, 33 live (18 always-live +
15 in-window), 178 upcoming, 0 ended — so the `/sports` Live tab has real content,
unlike the dead Streamed feed.

## 6. Open questions before implementing

1. **Popular tab** — what defines "popular" now that there is no `popular` flag?
   (viewers-desc is the only available signal, and it is sparse.)
2. **Team badges / home-away** — accept poster-only cards, or drop the badge UI?
3. **Playback** — confirm one embed plays in a real browser; assume ads are shown.
4. **VODs** — `/api/vods` gives real HLS. Out of scope for "sports", but it is the
   only genuinely playable media the API offers.
5. **Terms** — public use allowed; ask before commercial use, and keep the iframe
   (and its ads) intact.

## 7. Implementation in this repo

`src/utils/sports-api.ts` was rewritten against ppv.st; the exported function
names are unchanged so `pages/Sports.tsx`, `SportMatchPlayer.tsx` and the hooks
kept working:

- **One request instead of six.** `/api/streams` is fetched once and cached for
  60 s in a module-level snapshot (`invalidateSportsCache()` forces a refresh);
  `getSportsList`, `getLiveMatches`, `getAllPopularMatches`, `getTodayMatches`,
  `getMatchesBySport` and `getPopularMatchesBySport` all derive from it.
  Confirmed in the browser: opening `/sports` and switching tabs made exactly
  one `api.ppv.st/api/streams` request.
- **Errors surface.** The old helpers swallowed every failure and returned `[]`,
  which is why a dead provider looked like an empty schedule. They now throw on
  non-2xx, on `success !== true`, and on a malformed payload, so the page renders
  its existing `ErrorState` with retry (verified by blocking `*api.ppv.st*`).
- **"Popular" is derived**: live first, then most viewers, then starting soonest,
  capped at 30. There is no popularity flag upstream.
- **Categories** map to stable slugs (`american-football`, `motor-sports`,
  `24-7`, …) for the existing icon table and the sport filter, and keep their
  display names in `APIMatch.categoryName`.
- **Liveness** uses the provider's window (`always_live === 1` or
  `starts_at <= now <= ends_at`), not the local three-hour countdown, and 24/7
  channels show "24/7 channel" instead of a 1970 date.
- **Feeds**: `iframe` + `substreams[].iframe` become the player's source buttons,
  with the `"HD | "` quality prefix stripped (the HD chip already says it) and
  `locale` used as the language. Team badges are gone — ppv.st has no team data,
  so cards show the event name and poster, and `getTeamBadgeUrl` was removed.

Two adjacent defects surfaced while wiring this up and were fixed:

- The **Favorites tab** rendered the All list (no favourites branch existed) and
  its count badge was always 0. `useFilteredMatches` now has a `favorites`
  branch, the tab counts real favourites, and an empty favourites tab explains
  itself with a "Browse popular matches" action.
- `useFavoriteMatches` kept its state **per hook instance**, so favouriting a
  card never reached the page or the tab counter. It is now a module-level store
  read through `useSyncExternalStore` (plus a `storage` listener for other tabs);
  favouriting updates the card, the tab badge, and the Favorites list at once.

Verified in a rendered browser at 1440 px and 390 px: 34 cards on `/sports`
(4 live + 30 popular), live tab 37 with LIVE badges, category filter narrowing to
one category, `/sports/player/:id` embedding the ppv.st iframe with six labelled
feeds, no horizontal overflow at 390 px, no console errors.

Not addressed: favourites saved under the old Streamed ids still point at ids the
new provider does not know; they stay in storage and land on "Match Not Found".
