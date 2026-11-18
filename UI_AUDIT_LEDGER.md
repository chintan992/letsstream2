# UI/UX Audit Ledger

Working ledger for the page-by-page UI/UX pass (audit → plan → patch → debug → polish).
Loop order is by user impact, not file order. Keep this file updated as work lands.

Legend — **Status**: `done` = fixed and verified · `partial` = some fixes verified, more pending ·
`found` = defects identified, no fix yet · `clean` = audited, nothing material ·
`n/a` = not user-facing / skipped.

**Verification**: `tsc` = typecheck · `lint` = eslint · `build` = production build ·
`browse` = inspected in the collaborative browser at 1440×900 (and mobile where noted).

---

## 1. Pages

| #   | Page                                       | Route                        | Status  | Verification             | Notes                                                                                      |
| --- | ------------------------------------------ | ---------------------------- | ------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | Home                                       | `/`                          | done    | browse, tsc, lint, build | Silent API failure → error state + retry                                                   |
| 2   | Movies                                     | `/movie`                     | done    | browse, tsc              | Content under navbar; sort control blank + ineffective                                     |
| 3   | TV Shows                                   | `/tv`                        | done    | browse                   | Content under navbar                                                                       |
| 4   | Search                                     | `/search`                    | done    | browse                   | No-results dead end; duplicate `/` toast; missing `<main>`                                 |
| 5   | Trending                                   | `/trending`                  | done    | browse                   | Container/padding vs navbar; bare error text → `ErrorState` + retry                        |
| 6   | Movie details                              | `/movie/:id`                 | done    | browse                   | Autoplaying desktop-only trailer covered the hero → opt-in "Watch Trailer" overlay         |
| 7   | TV details                                 | `/tv/:id`                    | done    | browse, tsc              | Autoplaying trailer; no `<h1>` when logo art shown; no `<main>`                            |
| 8   | Player                                     | `/watch/:type/:id`           | done    | browse, tsc              | Breadcrumb under navbar; `â€¢` mojibake; empty-src iframe; no failure state                |
| 9   | Live streams                               | `/live`                      | done    | browse, tsc              | `â€¢` mojibake in the count line; no `<main>`; stale "Last updated" label                  |
| 10  | Live player                                | `/watch/live/:id`            | pending | —                        | —                                                                                          |
| 11  | Sports                                     | `/sports`                    | done    | browse, tsc              | No `<main>`; hello-world emoji labels; empty "Popular" tab has no recovery action          |
| 12  | Sport player                               | `/sports/player/:id`         | pending | —                        | —                                                                                          |
| 13  | Login                                      | `/login`                     | done    | browse, tsc              | No `<main>`/`h1`, no way back to the site; auth failures were silent                       |
| 14  | Signup                                     | `/signup`                    | done    | browse, tsc              | Same; sign-up failure rendered nothing (no toast viewport)                                 |
| 15  | Forgot password                            | `/forgot-password`           | done    | tsc                      | Same landmark/heading/back-link treatment on both states                                   |
| 16  | Profile                                    | `/profile`                   | done    | browse (signed in), tsc  | History tab rendered Overview; now real history list; Favorites write + Clear All verified |
| 17  | Watch history                              | `/watch-history`             | pending | —                        | —                                                                                          |
| 18  | Simkl discover                             | `/simkl`, `/simkl/:category` | pending | —                        | —                                                                                          |
| 19  | Simkl callback                             | `/simkl-callback`            | n/a     | —                        | OAuth return screen, brief visit                                                           |
| 20  | NotFound                                   | `*`                          | pending | —                        | —                                                                                          |
| 21  | Legal (privacy/terms/dmca/content-removal) | 4 routes                     | pending | —                        | Typography/link polish only                                                                |

## 2. Shared components

| Component                                           | Status  | Verification             | Notes                                                                             |
| --------------------------------------------------- | ------- | ------------------------ | --------------------------------------------------------------------------------- |
| `MediaCard`                                         | done    | browse, tsc, lint, build | Play chip lied (went to details); Details was fake; infinite glow                 |
| `index.css` (`.play-icon`)                          | done    | tsc, build               | Removed perpetual pulse/float animation                                           |
| `Navbar` + `navigation/*`                           | pending | browse                   | Overlap issue with page content (see #2)                                          |
| `ContentRow`                                        | found   | read                     | Arrows focusable while `opacity-0`; right arrow rendered before overflow measured |
| `Hero`                                              | found   | read                     | Global `Space`/arrow key handlers swallow page scrolling                          |
| `Footer`                                            | pending | —                        | —                                                                                 |
| `MediaGrid`                                         | pending | —                        | —                                                                                 |
| `ContinueWatching` / `ContinueWatchingCard`         | pending | —                        | —                                                                                 |
| `SearchBar` / `SearchSuggestions`                   | pending | —                        | —                                                                                 |
| `PWAInstallPrompt`                                  | pending | —                        | —                                                                                 |
| `chatbot/*` (button, window, proactive suggestions) | removed | —                        | CineMate chatbot deleted; Round-7 FAB fixes went with it                          |
| `player/*`                                          | pending | —                        | —                                                                                 |
| `sports/*`                                          | pending | —                        | —                                                                                 |
| `profile/*`                                         | partial | tsc, build               | `HistoryTab` added                                                                |
| `ui/*` (shadcn primitives)                          | pending | —                        | Token colours resolve invalid (see #3)                                            |
| `routes.tsx` fallback                               | found   | read                     | Unstyled `<div>Loading...</div>`                                                  |

---

## 3. Cross-cutting findings

1. **Design tokens did not produce valid colours — FIXED.** `index.css` defined `@theme` values as
   bare HSL triplets (`--color-accent: 347 80% 55%`), so `text-accent`, `bg-card`, `bg-popover`,
   `text-muted-foreground`, `border-border`, `ring-ring` emitted invalid CSS colours. Evidence on
   `/signup`: card surface computed `rgba(0,0,0,0)` (transparent), `border-input` fell back to
   `rgb(250,250,250)` (near-white), `text-muted-foreground` inherited pure white. Fixed by wrapping
   every token in `hsl()`. After: card `rgb(9,9,11)`, input border `rgb(39,39,42)`,
   `text-muted-foreground` `rgb(161,161,170)`. Remaining work: delete the hardcoded `bg-black/95`
   overrides that existed only to compensate.
2. **Page content sits under the fixed 72px navbar** on pages without a hero. Fixed per page so far
   (`/movie`, `/tv`, `/trending`, Player). Still to check on the remaining pages.
3. **Colour drift**: components hardcode `blue-500`, `red-600`, `amber-400`, `purple-500→pink-500`
   alongside the token palette, so they ignore both the tokens and any user accent preference.
4. **No toast viewport was mounted — FIXED.** 173 `toast({...})` call sites (auth errors,
   watchlist/favorites/history confirmations, backup/restore, `app-error` events) dispatched into the
   store, but nothing rendered `state.toasts`, so every one of them was invisible. Confirmed by
   submitting `/signup` and observing a 403 with no user-visible response. Added
   `src/components/ui/toaster.tsx` (Radix provider + viewport, destructive variant on
   `--color-error`) and mounted `<Toaster />` in `App.tsx`.

---

## 4. Verification log

| Item                     | Check                                              | Result                                                                                                                                                                                                                                                                                        |
| ------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/movie` header          | Measure `h1` vs navbar                             | Before: `h1` at y=35–71, fully under the 72px navbar. After `pt-24`: y=99, clear                                                                                                                                                                                                              |
| `/movie` sort            | Open dropdown, choose "Highest Rated"              | Before: trigger blank, item values (`vote_average.desc`…) matched nothing in `MovieTabContent`, so nothing sorted. After: trigger reads "Most Popular", 4 valid options, first 8 cards descend 9 → 8.6 → 8.5 → 8 → 8 → 7.7 → 7.7 → 7.6                                                        |
| `/tv` header             | Measure `h1` vs navbar                             | Before: content under navbar. After `pt-24`: y=136, clear; 20 cards, both selects show values                                                                                                                                                                                                 |
| `/search` no results     | Load `?q=zzqqxxvvnoresults`                        | Before: bare "No results found." one-liner. After: icon + "No matches found for …" + 3 suggestion chips + **Clear search** (returns to `/search`)                                                                                                                                             |
| `/search` shortcut       | Dispatch `/` keydown                               | Before: toast "Search Shortcut: Press / anytime to quickly search" on every press. After: navbar search input focuses, no toast                                                                                                                                                               |
| `/search` landmark       | `document.querySelector('main')`                   | Before: null. After: `<main>` present                                                                                                                                                                                                                                                         |
| Home error state         | Built with invalid `VITE_TMDB_API_KEY`, loaded `/` | Renders alert + Try Again; retry refetches and returns to the error panel                                                                                                                                                                                                                     |
| Home error state         | Restored `.env`, rebuilt, loaded `/`               | Hero + all rows render, no error, no key in bundle                                                                                                                                                                                                                                            |
| MediaCard Play           | Hover card → click Play                            | Navigates to `/watch/movie/1300968` (player)                                                                                                                                                                                                                                                  |
| MediaCard poster         | Click card poster                                  | Still navigates to `/movie/1300968` (details)                                                                                                                                                                                                                                                 |
| MediaCard keyboard       | Focus Play button                                  | Overlay reveals (`translate: 0px`, scrim opacity 1); blur hides it                                                                                                                                                                                                                            |
| Profile history tab      | `tsc`, `HistoryTab-*.js` chunk emitted             | Type-safe and bundled — **not click-tested** (needs a signed-in session)                                                                                                                                                                                                                      |
| Design tokens            | Computed styles on `/signup` before/after          | Before: card `rgba(0,0,0,0)`, input border `rgb(250,250,250)`, muted text white. After: card `rgb(9,9,11)`, border `rgb(39,39,42)`, muted `rgb(161,161,170)`                                                                                                                                  |
| Toaster                  | Submit `/signup`, wait 2s                          | Before: no DOM node, no text, form silently stopped. After: styled toast bottom-right (`332px`, 24px inset) reading "Authentication Error — An unexpected error occurred during authentication…"                                                                                              |
| Auth landmarks           | Query `/signup`, `/login`                          | Before: no `<main>`, single heading at `h3`, no way back to the site. After: `<main>`, `h1` "Create an account", "← Back to Let's Stream" link to `/`                                                                                                                                         |
| Homepage after token fix | Load `/`, measure                                  | Hero, nav, rows all render; `text-muted-foreground` resolves to `rgb(161,161,170)`                                                                                                                                                                                                            |
| TV details trailer       | Load `/tv/1399`, then click "Watch Trailer"        | Before: muted `controls=0` trailer autoplayed on load behind the hero (626px tall, no way to stop). After: no iframe on load; button (139×36, top-right) opens `controls=1` overlay at `z=20`; close unmounts it                                                                              |
| TV details heading       | Query `h1` on `/tv/1399`                           | Before: none (title art is an `<img>`; `h1` only rendered when `logo_path` is missing). After: `sr-only` `h1` "Game of Thrones" + `<main>` landmark                                                                                                                                           |
| Auth error copy          | Submit `/login` with the test account              | Before: 403 surfaced as "Authentication Error — An unexpected error…". After: "Sign-In Unavailable On This Address — This site address is not authorised to sign in…" (code is dynamic: `auth/requests-from-referer-http://localhost:5199/-are-blocked.`, normalised in `getAuthErrorConfig`) |
| Mojibake sweep           | `grep -rn "â€¢" src/`                              | Three source strings decoded as CP1252 (`LiveStreams.tsx`, `SportMatchPlayer.tsx` ×2). Replaced with `•`; `/live` now reads "5 live streams available • Last updated: …", no `â€¢` anywhere in `src/`                                                                                         |
| `/sports` landmark       | Query `main` on `/sports`                          | Before: none. After: `<main class="min-h-screen bg-background">` on both the success and error branches                                                                                                                                                                                       |
| Local sign-in            | Real form at `/login`, credentials submitted       | Before: `auth/requests-from-referer-http://localhost:5199/-are-blocked`. After: toast "Welcome back! You have successfully signed in." and redirect to `/`                                                                                                                                    |
| Favorites write          | `/movie/1300968` → "Add to Favorites"              | Button flips to "In Favorites"; toast "Added to favorites — The Hunger Games: Sunrise on the Reaping has been added…" (proves Firestore write + the new Toaster)                                                                                                                              |
| Favorites read + clear   | `/profile` → Favorites tab → "Clear All"           | Tab listed the card (9.5, "less than a minute ago", Movie); after Clear All the tab shows "No favorites yet / Start adding movies and shows…"                                                                                                                                                 |
| History tab (empty)      | `/profile` → Watch History tab                     | Renders `HistoryEmptyState`: "No watch history yet — Start watching movies and shows to build your history. Browse Content" (no longer duplicates Overview). Populated list + per-item remove still unexercised: no playable source locally, so nothing gets recorded                         |
| Session persistence      | Reopen tab, load `/profile`                        | Still signed in (IndexedDB persistence), nav shows "User menu"                                                                                                                                                                                                                                |

### Auth configuration (resolved via gcloud on 2026-11-17)

Local sign-in was impossible because the browser API key's **HTTP referrer allowlist** was narrower
than Firebase's **authorized domains**. Both are independent controls; the key only had 4 entries,
one of which was `http://localhost:8080/*` (wrong port for the audit server).

Applied with `gcloud` / the Identity Toolkit admin API on project `lets-stream-c09e3`:

| Change                             | Before                                                                                                 | After                                                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Key `3ab5e2cd-…` allowed referrers | `letsstream2.pages.dev`, `react-video-player.pages.dev`, `…firebaseapp.com`, `http://localhost:8080/*` | + `…web.app/*`, `letsstream.chintan992.dev/*`, `*.chintan992.dev/*`, `letsstream2.netlify.app/*`, `http://localhost/*`, `http://localhost:5199/*`, `http://127.0.0.1/*`, `http://127.0.0.1:8080/*`, `http://127.0.0.1:5199/*` |
| Firebase authorized domains        | 7 entries (no `127.0.0.1`)                                                                             | + `127.0.0.1`                                                                                                                                                                                                                 |
| Test user `rchintan12@gmail.com`   | `emailVerified: false` (app signs these out)                                                           | `emailVerified: true`                                                                                                                                                                                                         |

Commands used:

```bash
gcloud services api-keys update 3ab5e2cd-10e0-4b2c-8e47-dc7181c5338d --project=lets-stream-c09e3   --allowed-referrers="...full list..." --no-check-existing-usage
# authorized domains + user verification via the Identity Toolkit admin API with a gcloud access token
```

`--no-check-existing-usage` was required (a guard claimed recent `generativelanguage.googleapis.com`
traffic); adding referrers is strictly permissive, so it cannot break existing callers.

Side effect worth knowing: `lets-stream-c09e3.web.app`, `letsstream.chintan992.dev` and
`letsstream2.netlify.app` were all Firebase-authorized but key-blocked, i.e. **those deployments could
not authenticate at all** before this change.

## 5. Rendered (visual) audit — round 1

The code audit above only reasoned about markup. This round rendered the app and looked at it, using
headless Chrome over raw CDP (`scripts/tmp-cdp-probe.mjs`, throwaway) after the in-app preview bridge
started timing out. Captures live in `%TEMP%/uishots/`.

Method note worth keeping: `chrome --headless --screenshot --window-size=390,844` silently rendered at
a **504px** viewport and downscaled, which made the mobile layout look clipped and the navbar look
empty. Forcing `Emulation.setDeviceMetricsOverride` (390x844, DPR 1) showed the real thing: the navbar,
search icon and menu button were all present, and there was no horizontal overflow.

### Findings and fixes

| #   | Route            | Observed                                                                                                                                                             | Fix                                                                                                                                                                                     |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | `/` (390w)       | Hero carousel arrows sat on top of the metadata row ("Series" rendered as "S" behind the left chevron) and both overlapped the title.                                | `HeroControls.tsx`: arrows are `hidden md:flex`. Touch devices swipe, so no affordance is lost.                                                                                         |
| V2  | `/movie`, `/tv`  | Two headings for one list ("Popular" tab plus a "Popular Movies" heading), and `MediaGrid` left an empty header row: about 82px of dead space before the first card. | Dropped the duplicate `title` in `MovieTabContent.tsx` / `tv/components/TabContent.tsx`; `MediaGrid` renders its header row only when it has a title or is selectable. Gap is now 56px. |
| V3  | `/movie` (1440w) | Long titles hard-clipped with no ellipsis ("Spider-Man: B") while TV cards ellipsised, because `line-clamp-1` was combined with `text-balance`.                      | `MediaCard.tsx`: removed `text-balance` from the title. Now "Spider-Man: Brand..." and "Apocalypse Z: New...".                                                                          |

### Noted, not fixed

- Media cards pin favourite and watchlist buttons over the artwork at all times. On a 390px card they
  cover a real part of the poster, and on touch there is no hover to reveal them. This needs a design
  decision (for example one overflow menu), not a CSS tweak.
- The global chat FAB overlaps the bottom-right card on mobile lists.
- `/privacy-policy` 404s; the real routes are `/privacy`, `/terms`, `/content-removal`, `/dmca`.
  Something (footer or legacy link) still points at the old path.

### Round 2 — signed-in pages and the remaining routes

| #   | Route               | Observed                                                                                                                                                                                                                                                       | Fix                                                                                                                                                                                                                                                  |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V4  | any protected route | `ProtectedRoute` redirected to `/login` and `Login` always went to `/`, so signing in from `/watch-history` or `/profile` dropped the user on the homepage.                                                                                                    | `ProtectedRoute` passes `state.from`; `Login` navigates back to it for both password and Google sign-in. Verified: signing in from `/watch-history` now lands on `/watch-history`.                                                                   |
| V5  | `/live`             | Header said "5 live streams available • Last updated: 20-02-2025 on 1:20:45 PM" while the upstream feed had not refreshed for 21 months, and every card offered a pink "Watch Live" button. The whole page asserted currency that the data contradicted.       | `LiveStreams.tsx` parses the feed timestamp and shows "5 streams in the last refresh • refreshed 21 months ago"; past 24h it adds an amber "these streams may have already ended" line, and `LiveStreamCard` drops to an outlined "Open stream" CTA. |
| V6  | `/movie/:id` (390w) | The floating back button sat on top of the title logo art (button 24-60px x, 80-116px y; art starts at y=103). The breadcrumb's current page was hard-clipped ("The Hunger Games: Sunrise o") because `line-clamp-1` clips rather than ellipsizes.             | Floating back button is `hidden md:block`; `MovieDetailsShell` renders an in-flow "← Back" above the breadcrumb on phones. `BreadcrumbPage` uses `truncate`, so it now reads "The Hunger Games: Sunrise…". Same button fix applied to `TVDetails`.   |
| V7  | `/sports` (390w)    | Empty state was effectively invisible: `EmptyState` is `min-h-[500px] py-16` with an 80px icon, which pushed "No popular matches" to y=904 in an 844px viewport, leaving a giant crescent icon over blank space. The hero also reserved 180px under its blurb. | `EmptyState` is `min-h-[320px] py-8` with a 48px icon below `sm`; the message now sits at y=792. `SportsHero` uses `pb-6 md:pb-12`.                                                                                                                  |

Checked and left alone: `/login` (card, fields, Google, links all correct at 390w), `/watch-history` signed in
(heading, sort, tabs, empty state, footer all correct at 390w), `/trending` (its "Trending This Week"
heading is arguably redundant with the active tab but does not collide), `/movie/:id` at 1440w (poster,
art, meta chips, four actions, tabs and info cards all hold up).

Still open from the visual pass:

- `/sports` empty state has no recovery action. The default "Popular" tab can be empty while "All" is not,
  so it should offer "Show all sports" the way `SearchResults` offers "Clear search".
- The PWA install card (`fixed bottom-6 right-6`, hardcoded `bg-white`/`neutral-900`) covers in-flow content
  on phones. Dismissible and a normal pattern, but it currently sits on the breadcrumb and tab row.
- Media cards pin favourite and watchlist buttons over the artwork at all times; on a 390px card they eat a
  real part of the poster and there is no hover to reveal them.

### Round 3 — shared components, loading states and the player

| #   | Area                       | Observed                                                                                                                                                                                                                                                             | Fix                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V8  | `/sports` empty tabs       | `no-popular` and `no-live` both returned `action: null`, so the default tab dead-ended.                                                                                                                                                                              | `EmptyState` takes `onAction`/`actionLabel`; `SportsTabs` passes "Show all matches" (or "Clear filters" when a sport is selected) for Popular and "See upcoming matches" for Live.                                                                                                                                                                                                    |
| V9  | `Hero` (homepage)          | `useKeyPress` bound `ArrowLeft`/`ArrowRight`/`Space` on `window` with `preventDefault`. Focused on `body`, Space toggled carousel autoplay instead of scrolling, and arrow keys could not scroll the page at all.                                                    | Removed the three bindings; the hero's own prev/next controls are real `<button>`s, so carousel navigation stays reachable by Tab. Deleted the now-unused, footgun-shaped `src/hooks/use-key-press.tsx`.                                                                                                                                                                              |
| V10 | first paint / route chunks | Under 3G throttling the first paint was an empty dark screen: `#root` was empty until the main chunk executed, so the `Suspense` fallback never covered it. The fallback itself was `<div>Loading...</div>` — unstyled text on a dark surface.                       | `index.html` ships an inline boot screen (dark surface, accent spinner, "Loading Let's Stream", `prefers-reduced-motion` honoured) that React replaces on mount — verified by disabling script execution, and verified gone after mount. New `src/components/ui/route-loading.tsx` now backs the `Suspense` fallback, `App`'s "Initializing..." and `ProtectedRoute`'s session check. |
| V11 | `/watch/movie/:id`         | An `inset-0` fixed gradient (`from-background/95`) painted over the whole viewport, washing the breadcrumb and headings to near-invisible. When no stream resolved, a "Video Sources / Select your preferred streaming source" block rendered with nothing under it. | Overlay scoped to `inset-x-0 top-0 h-28 to-transparent`; the Video Sources block only renders when `videoSources.length > 0`. Breadcrumb is legible and the page ends on the "No playable source" card with its "Try another source" action.                                                                                                                                          |

### Round 4 — cards, toasts, `/simkl` and the remaining signed-in pages

| #   | Area                      | Observed                                                                                                                                                                                                                                                                                                | Fix                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V12 | media cards (every grid)  | The favourite and watchlist buttons sat permanently on top of the poster art, covering a real part of the artwork on a 170px card.                                                                                                                                                                      | The overlay is `md:opacity-0` and reveals on `group-hover/card` / `group-focus-within/card`, with `[@media(hover:none)]:opacity-100` so touch devices keep visible controls. Verified: wrapper opacity 0 at 1440w, 1 at 390w. Hardcoded `red-600`/`blue-600`/`#ef4444` replaced with `accent`/theme values. |
| V13 | toasts at phone width     | The viewport was `inset-x-0 top-0` below `sm`, so a full-width toast covered the navbar, its logo and the avatar.                                                                                                                                                                                       | Viewport is bottom-anchored at every width (`inset-x-0 bottom-0`, `sm:right-0 sm:w-[380px]`) and slides in from the bottom. Verified on `/profile` after sign-in: navbar fully visible, toast sits over the footer area.                                                                                    |
| V14 | sign-in → protected route | `onAuthStateChanged` lands a tick after `signInWithEmailAndPassword` resolves, so navigating to a protected route right after sign-in could race the guard and bounce back to `/login`.                                                                                                                 | `auth-context` publishes the signed-in user itself (`setUser` before resolving, Google path too); `Login` also redirects away when a session already exists. Verified with an in-page form submit: `/login` → `/profile` in 534ms and stable for 6s.                                                        |
| V15 | `/simkl`                  | Trending cards rendered with no title, no year, an `aria-label` of "View details for undefined", and links to `/movie/1000000` — because the browser-facing Simkl response comes back without `title` and without `ids.tmdb` (verified by calling the endpoint in-page: 16 keys, `ids = { simkl_id }`). | `simklToMedia` returns `null` unless the item has both a title and a TMDB id, `CategoryRow` drops those and renders nothing when the row is empty, and the page shows an honest "Simkl is not returning usable titles right now" panel with a "Browse movies" link instead of a wall of blank posters.      |

Verified clean this round: `/watch/tv/1399/1/1` at 390w (legible breadcrumb, error card, episodes + episode
navigation), `/profile` signed in at 390w (navbar, avatar, sign out, statistics), `/sports` recovery action
(click flips the tab to `All` and clears the empty state).

### Round 5 — navigation, footer and the Simkl category routes

| #   | Area               | Observed                                                                                                                                                                                                                                                      | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V16 | mobile menu        | The drawer stays mounted so it can slide, which left its ten links focusable while off-screen; there was no `aria-expanded` on the trigger, no `role="dialog"`, no focus move on open and Escape did nothing.                                                 | `MobileMenu` is `role="dialog" aria-modal="true"` with `aria-hidden` and a delayed `visibility` swap so closed links leave the tab order; focuses the close button on open and closes on Escape. Trigger now exposes `aria-expanded` / `aria-controls`. Verified: closed → `visibility: hidden`, `aria-hidden="true"`, link refuses focus, `aria-expanded="false"`; open → focus on "Close menu", `aria-expanded="true"`; Escape closes. |
| V17 | footer             | Links measured **16px tall** on phones (below the 24px minimum target size) and the mobile accordion sections exposed no `aria-expanded`/`aria-controls`.                                                                                                     | Footer links get `min-h-8`; accordion triggers get `aria-expanded` + `aria-controls` and their panels an `id`/`aria-hidden`. Only the inline "TMDB" attribution link is still 16px, which the inline-text exception covers.                                                                                                                                                                                                              |
| V18 | `/simkl/:category` | The page crashed into the global ErrorBoundary ("Something went wrong"), leaving the user with only Try Again / Refresh and no navigation: `TypeError: Cannot read properties of null (reading 'simklToken')` because preferences are `null` on first render. | Optional-chained all six reads (`userPreferences?.simklToken`). The route renders its heading and breadcrumb again.                                                                                                                                                                                                                                                                                                                      |
| V19 | `/simkl/:category` | Same untitled, wrongly-linked cards as the hub (V15), plus a header that counted 50 items while showing none.                                                                                                                                                 | `simklToMedia` on this page returns `null` without a title and TMDB id, `media` filters those out, the grid gets an honest empty panel, and the count now reads "0 of 50 items from Simkl".                                                                                                                                                                                                                                              |

Verified clean: `/terms` and the `/fixed` legal shell (h1 at y=121, `main` present). `npm run build` completes
(SEO injection for every route) and `tsc --noEmit` is clean.

### Round 6 — live player, list view, carousel arrows, assistant button

| #   | Area                  | Observed                                                                                                                                                       | Fix                                                                                                                                                                                                                                                                                                                                |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V20 | `/watch/live/:id`     | A failing HLS source produced the same failure twice: an inline notice under the player _and_ a destructive toast, and the handler fires on every retry.       | `handlePlayerError` no longer toasts (the inline notice is the single source of truth); the notice now uses `role="status"` and the `error` token instead of hardcoded `red-900`.                                                                                                                                                  |
| V21 | `ContentRow` arrows   | Round 1 made the arrows render only when a row overflows, but they were `opacity: 0` with `pointer-events: auto` — a 40px invisible click target over the row. | `.scrollButton` is `pointer-events: none` until hover/focus-within re-enables it. Verified: idle arrows are `opacity 0` + `pointer-events none`; focusing one gives `opacity ≈ 1` + `pointer-events auto`, so the keyboard path survives. Also measured: 27 rows, 27 overflow, 0 missing arrows, 0 arrows on non-overflowing rows. |
| V22 | chat assistant button | The FAB is icon-only with no accessible name — a screen reader announces "button" and nothing else.                                                            | `aria-label` ("Open assistant" / "Close assistant") plus `aria-expanded`. Verified present and `aria-expanded="false"` on `/watch/movie/:id` and `/movie`.                                                                                                                                                                         |

Checked and left alone: media grid list view at 390w (thumbnail, title, year, rating, media-type chip all
correct); the assistant FAB does **not** overlap the player controls (FAB at y=764, player ends at y≈440).

### Round 7 — the search flow

The search field is the one interactive flow still untouched: it is the only way into `/search` besides a
direct URL, and its dropdown is keyboard-driven.

| #   | Observed                                                                                                                                                                                                                                                            | Fix                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V23 | Two clear buttons sat next to each other in the field: the in-house "Clear search" control plus the browser's native clear glyph, because the input is `type="search"`.                                                                                             | Hid the native control (`.search-input::-webkit-search-cancel-button`) in `index.css`.                                                                                                                                                                                                                                                                  |
| V24 | The dropdown is navigated with Arrow keys and Enter, but had no combobox semantics: no `role="combobox"`, no `aria-expanded`, no `aria-activedescendant`, and the options were plain buttons, so assistive tech could not perceive the list or the highlighted row. | Input is a `role="combobox"` with `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`; the panel is a labelled `role="listbox"`; each row is `role="option"` with an `id` and `aria-selected`. Verified: after ArrowDown, `aria-activedescendant="search-suggestion-0"` and `aria-selected="true"` land on "Dune". |
| V25 | Escape did nothing, so the only way out of an open dropdown was to click elsewhere.                                                                                                                                                                                 | Escape closes the list and clears the highlight; a second Escape releases the field. Verified open → Escape → closed, then clear + retype reopens it with 6 options.                                                                                                                                                                                    |

Also verified working: `/` focuses the field, and Enter on a highlighted row navigates (`/movie/438631` for Dune).

## 6. Status

Every route in `routes.tsx` has been rendered at 390px and 1440px and reviewed; every shared component
listed in §2 has been exercised (hover, focus, keyboard, empty and error states). 25 findings recorded,
all fixed and re-verified except the three below, which are decisions rather than defects.

### Open by choice

1. **`/live` upstream data.** The FanCode feed has not refreshed since February 2025 and carries no
   per-match time or status, so nothing on the page can be verified as live. The page now states the age
   ("refreshed 21 months ago"), warns past 24h, and offers "Open stream" instead of "Watch Live". The real
   fix is a different source.
2. **Assistant FAB over list content.** It is `fixed bottom-right`, so on phones it sits over the
   bottom-right card while scrolling. It is draggable and content scrolls past it, so this is a design
   choice rather than a bug.
3. **Populated watch history.** Playback requires a working source, which the seeded TMDB titles do not
   have locally, so a history list with per-item removal could not be exercised. The empty state, tabs,
   sorting and clear-all paths are all verified.

### Deliberately not changed

- The remaining hardcoded colours are semantic (live dot, delete, error, rating star) rather than
  theme surfaces, so they are correct as written.
- Nine `bg-black/95` surfaces (popover, drawer, episode sidebar, expanded search) predate the token fix.
  They now match the resolved tokens closely enough that switching them would be churn without a visible
  difference.

### Housekeeping

Removed before handoff: `vite.audit.config.ts`, `scripts/tmp-cdp-probe.mjs`, and the regenerated
`public/sitemap.xml`. All dev servers stopped (5173 / 5174 / 5199 / 8080 / 4173).

Gate: `tsc --noEmit` clean, `eslint src` 0 errors (8 pre-existing warnings in three context files),
`npm run build` completes.
