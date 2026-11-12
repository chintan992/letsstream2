# Independent Dependency Audit — 11 November 2026

**Repository:** `chintan992/letsstream2`  
**Commit audited:** `9de1bed` (`main`)  
**Audit type:** Independent second pass — fresh data, separate tooling, no reliance on the previous report's conclusions  
**Data sources:** `npm audit` (full and production-only), OSV `querybatch` API, `package-lock.json`, production `dist/` inspection, registry signature/attestation verification, source import scan, license scan, GitHub Actions workflow review

---

## 1. Executive Summary

The production dependency tree is clean. The residual risk is almost entirely development/build tooling and dependency hygiene.

| Measure | Result |
|:---|:---|
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `npm audit` (full tree) | 15 entries: 0 critical, 0 high, 13 moderate, 2 low |
| Actual vulnerable packages behind those 15 entries | **3**: `glob`, `minimatch`, `deepmerge` |
| OSV scan of 965 unique locked versions | **3 advisories**, all development-only |
| Vulnerable packages in shipped bundle | **0** |
| `npm audit signatures` | 915/915 registry signatures verified, 363 attestations |
| Dependabot open alerts at audit time | 49 (stale — see §2.3) |
| Separate `.opencode` manifest | 4 high entries (3 actual packages), local agent tooling only |

### Key conclusions

1. **No production dependency vulnerability.** `npm audit --omit=dev` returns zero, and no vulnerable library code is present in `dist/`.
2. **The 15 npm-audit entries collapse to 3 real packages.** Twelve are parent packages (`eslint`, `workbox-build`, `vite-plugin-pwa`, `@typescript-eslint/*`, etc.) flagged only because their trees contain `glob`, `minimatch`, or `deepmerge`. OSV confirms exactly those three.
3. **All three are development/build-only.** `glob` and `minimatch` are used by ESLint/TypeScript-ESLint and Workbox; `deepmerge` is used by `@rollup/plugin-node-resolve` inside Workbox. None is shipped to users.
4. **Dependabot has not re-scanned after the remediation push.** The API still returns the pre-push snapshot of 49 alerts. This is an asynchronous GitHub rescan lag, not evidence that the fixes failed.
5. **The bigger issue is dependency hygiene, not exploitable CVEs.** 18 runtime dependencies and 4 development dependencies are unused or redundant, and two Tailwind plugins are installed but not actually active. The latter means shadcn animation classes and `prose` legal-page styling are currently no-ops.
6. **The Gemini API key is embedded in the production bundle.** `VITE_GEMINI_API_KEY` is a billable secret, not a public client key. This is outside the dependency-CVE scope but is the highest-impact finding in this audit.

---

## 2. Vulnerability Findings

### 2.1 Root project — actual vulnerable packages

| Package | Installed | Severity | Advisory | Fixed in | Pulled in by | Scope |
|:---|:---|:---:|:---|:---:|:---|:---|
| `glob` | 11.1.0 | Moderate | GHSA-3g3m-2fjr-6pw4 / CVE-2026-118773 | 14.0.2 | `vite-plugin-pwa` → `workbox-build` (`glob ^11.0.1`) | Dev/build |
| `minimatch` | 10.2.6 | Moderate | GHSA-g3hv-75wg-m249 / CVE-2026-118764 | 11.0.1 | `eslint@10.14.0` (`^10.2.6`); `typescript-eslint@8.72.2` | Dev/lint |
| `deepmerge` | 4.3.1 | Low | GHSA-gcqx-w48m-w2h4 / CVE-2026-93753 | **None** | `@rollup/plugin-node-resolve` → `workbox-build` | Dev/build |

Why no non-breaking fix is available:

- `workbox-build@7.4.1` declares `glob ^11.0.1`; the fixed `glob@14.0.2` is outside that range.
- `eslint@10.14.0` declares `minimatch ^10.2.6`; the fixed `minimatch@11.0.1` is outside that range. TypeScript-ESLint has the same constraint.
- `deepmerge` has no patched release. npm's suggested "fix" is a breaking downgrade of `vite-plugin-pwa` to 1.1.0.

The 15 npm-audit entries are:

```text
@eslint/config-array, @eslint/js, @typescript-eslint/eslint-plugin,
@typescript-eslint/parser, @typescript-eslint/type-utils,
@typescript-eslint/typescript-estree, @typescript-eslint/utils, eslint,
glob, minimatch, typescript-eslint, vite-plugin-pwa, workbox-build,
@rollup/plugin-node-resolve, deepmerge
```

OSV returns only the three leaf packages, which is the more useful signal. Every one is development-only.

### 2.2 Production exposure

`npm audit --omit=dev`:

```json
{ "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 }
```

Bundle inspection (`dist/assets/`):

| Check | Result |
|:---|:---|
| `websocket-driver`, `faye-websocket` | Absent |
| `@grpc/grpc-js` | Absent |
| `follow-redirects` | Absent |
| `minimatch`, `glob`, `deepmerge` (library code) | Absent |
| `tinypool`, `serialize-javascript`, `fast-uri` | Absent |
| `re2js` | **Present**, installed version **2.10.0** (patched; bundled in Firestore chunk) |

Two false positives were checked and dismissed:

- `deepmerge` appears in the Google GenAI chunk only as the warning string `includeExtraBodyToRequestInit:deepMerge: Type mismatch`.
- `undici` appears only as `Symbol.for("undici.globalDispatcher.1")`, an optional Node dispatcher hook — not the `undici` library.

### 2.3 Dependabot discrepancy

At audit time the Dependabot API still returned **49 open alerts** (3 critical, 25 high, 13 medium, 8 low) across the 22 packages from the earlier snapshot. The remediation commit `9de1bed` is on `main`, but GitHub had not re-scanned the dependency graph yet. This is expected to converge automatically. If high or critical alerts persist after the rescan, the next step is to inspect the affected manifest path rather than assume the lockfile regressed.

### 2.4 `.opencode` — separate local tooling manifest

`.opencode/package.json` is a second npm project, outside the root lockfile and CI:

| Package | Installed | Severity | Fixed in | Note |
|:---|:---|:---:|:---:|:---|
| `effect` | 4.0.0-beta.83 | High | 4.0.0-beta.103 | Pinned exactly by `@opencode-ai/plugin` |
| `toml` | 4.3.0 | High | 5.0.1 | Pinned exactly; four DoS/prototype-pollution advisories |
| `zod` | 4.1.8 | High | 4.6.6 | Pinned exactly by the plugin |
| `@opencode-ai/plugin` | 1.18.14 | High | — | Parent entry; the three packages above are the real issues |

`@opencode-ai/plugin@1.19.5` still pins the same `zod@4.1.8` and `effect@4.0.0-beta.83`, so there is no upstream fix yet. This affects the local agent harness only, not the deployed app. Overrides are possible but risk breaking the plugin; accept until upstream updates.

---

## 3. Dependency Hygiene

### 3.1 Unused runtime dependencies — 18

No reference was found in `src/`, `scripts/`, `functions/`, or build config (docs and lockfiles excluded).

| Group | Packages |
|:---|:---|
| Redundant Firebase scoped packages | `@firebase/analytics`, `@firebase/auth` — the app imports `firebase/analytics` and `firebase/auth`; both scoped packages are already dependencies of `firebase@13.3.0` |
| Unused Radix primitives | `@radix-ui/react-aspect-ratio`, `@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-radio-group`, `@radix-ui/react-slider` |
| Unused UI/data libraries | `cmdk`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-firebase-hooks`, `react-resizable-panels`, `recharts`, `sonner` |
| Unused state helper | `@tanstack/query-sync-storage-persister` |

Removing these does not remove any code currently reachable from the app. The Firebase scoped packages remain installed transitively through `firebase`, so their versions do not change.

### 3.2 Unused or ineffective development dependencies — 4

| Package | Finding |
|:---|:---|
| `@tailwindcss/typography` | Installed but **not active**. The legal pages use `prose prose-invert`, but `.prose` is absent from the built CSS. |
| `@testing-library/user-event` | No test imports it; tests use `fireEvent` from `@testing-library/react`. |
| `jsdom` | Vitest is configured with `happy-dom`; no test uses a `jsdom` environment. Removing it also removes `undici` from the tree. |
| `workbox-window` | Not imported directly; `vite-plugin-pwa` already depends on it and injects `registerSW.js`. The direct declaration is redundant. |

### 3.3 Build-only packages listed as runtime dependencies — 5

| Package | Why it belongs in `devDependencies` |
|:---|:---|
| `@types/video.js` | Type declarations only |
| `@types/workbox-build` | Type declarations only (referenced by `workbox.d.ts`) |
| `baseline-browser-mapping` | Browserslist data used by Autoprefixer at build time |
| `caniuse-lite` | Browserslist data used by Autoprefixer at build time |
| `tailwindcss-animate` | Tailwind plugin, build-time only |

This does not create a vulnerability, but it inflates the production dependency surface and makes `npm audit --omit=dev` less meaningful.

### 3.4 Tailwind plugins are installed but inactive (functional issue)

The project uses Tailwind CSS v4 (`@tailwindcss/postcss`, `@import "tailwindcss"`, `@theme` in `src/index.css`). Tailwind v4 does **not** auto-load `tailwind.config.ts`; it requires an explicit `@config` directive. There is no `@config` in the CSS.

Evidence from the built stylesheet:

| Class | Expected source | Present in `dist` CSS? |
|:---|:---|:---:|
| `.animate-in` | `tailwindcss-animate` | No |
| `.fade-in-0` | `tailwindcss-animate` | No |
| `.zoom-in-95` | `tailwindcss-animate` | No |
| `.slide-in-from-top-*` | `tailwindcss-animate` | No |
| `.prose` | `@tailwindcss/typography` | No |
| `.animate-fade-in` | custom CSS in `src/index.css` | Yes |

Consequences:

- shadcn dialogs, popovers, selects, tooltips, and dropdowns reference animation classes that produce no CSS.
- The four legal pages (`TermsOfService`, `PrivacyPolicy`, `DMCANotice`, `ContentRemoval`) use `prose prose-invert` with no typography plugin active.

Fix options:

1. Add `@plugin "tailwindcss-animate";` and `@plugin "@tailwindcss/typography";` to `src/index.css`, or
2. Add `@config "../tailwind.config.ts";` if the JS config is intended to be authoritative, or
3. Remove the inert classes and the two dependencies if the styling is no longer wanted.

### 3.5 Phantom type import

`vite.config.ts` imports `RuntimeCaching` from `workbox-build`, but `workbox-build` is not declared in `package.json`; it is only installed transitively through `vite-plugin-pwa`. The import is type-only and `@types/workbox-build` is declared, so there is no runtime failure. Still, the dependency should be explicit:

- add `workbox-build` to `devDependencies`, or
- rely solely on the local `workbox.d.ts` module declaration and remove the direct type import.

### 3.6 Duplicate versions and licenses

- **44 packages** resolve to two or more versions. Notable examples: `web-vitals` 4.2.4 / 5.3.0 / 6.2.3 (direct, Firebase Performance, and Firebase Crashlytics/OpenTelemetry), OpenTelemetry 2.9.0 / 2.10.0, `tslib` 2.8.1 / 2.9.1, `@grpc/proto-loader` 0.7.15 / 0.8.1, `react-is` 17.0.2 / 19.3.1.
- **Licenses:** 733 MIT, 143 Apache-2.0, 37 ISC, 19 BSD-3-Clause, 12 BSD-2-Clause, 12 MPL-2.0, 11 BlueOak-1.0.0, plus small counts of MIT-0, 0BSD, CC-BY-4.0, CC0-1.0. No GPL/AGPL/SSPL.
- One package (`dom-walk@0.1.2`) lacks an SPDX `license` field but ships a `LICENCE` file and declares MIT in its legacy `licenses` array. No compliance blocker.
- No deprecated packages were found among installed packages.

### 3.7 Outdated major versions (direct)

| Package | Current | Latest | Scope | Assessment |
|:---|:---:|:---:|:---|:---|
| `@google/genai` | 2.32.0 | 3.2.0 | Runtime | Major; test chatbot paths before upgrading |
| `video.js` | 8.24.2 | 10.3.0 | Runtime | Major; player behavior and plugin compatibility need validation |
| `typescript` | 5.9.3 | 7.0.2 | Dev | Major; do not combine with unrelated changes |
| `jsdom` | 30.1.3 | 31.0.0 | Dev | Unused; remove instead of upgrading |

All other direct dependencies are at the latest version allowed by their declared ranges.

---

## 4. Supply Chain and CI Controls

### 4.1 Positive signals

- `npm audit signatures`: **915/915 packages verified**, 363 packages have verified attestations.
- Lockfile version 3; all 981 `resolved` URLs use `https`.
- No git, file, or HTTP tarball dependencies.
- No deprecated packages among installed packages.
- Root `npm audit --omit=dev` is clean.

### 4.2 Install scripts

Five locked packages declare install scripts:

| Package | Script | Local npm 12 status |
|:---|:---|:---|
| `@firebase/util@1.15.3` | `postinstall` | Blocked by `allowScripts` |
| `@google/genai@2.32.0` | `preinstall` (no-op echo) | Blocked by `allowScripts` |
| `@swc/core@1.16.22` | `postinstall` | Blocked by `allowScripts` |
| `protobufjs@7.6.6` | `postinstall` | Blocked by `allowScripts` |
| `fsevents@2.3.3` | platform-specific | Not applicable on Windows |

The full build, test, and lint suite passes with those scripts blocked. This is a useful hardening signal, but npm 11 on CI may execute them. If the project standardises on npm 12, add an explicit `allowScripts` policy so the behavior is intentional rather than accidental.

### 4.3 GitHub Actions

| Workflow | Findings |
|:---|:---|
| `pr-checks.yml` | Actions pinned to tags, not commit SHAs. `npm audit` is `continue-on-error: true`; tests use `|| true`; formatting uses `|| true`. Installs `source-map-explorer` globally and unpinned. |
| `release.yml` | Uses `actions/checkout@v3` (old major) and `softprops/action-gh-release@v1` (third-party tag). No `permissions:` block. |
| `runtime-error-check.yml` | Runs `npx playwright install`, `npx serve`, and `npx playwright test` without declaring `@playwright/test` or `serve` in `devDependencies`; versions are fetched unpinned at runtime. |

No workflow declares a `permissions:` block, so each job inherits the repository default. No `.github/dependabot.yml` exists, so dependency updates rely on ad-hoc commands rather than scheduled PRs.

### 4.4 CI enforcement gap

The current pipeline cannot fail on the findings in this report:

- vulnerabilities: `npm audit` → `continue-on-error: true`
- tests: `npm run test:coverage || true`
- formatting: `npm run format:check || true`

A green PR check therefore does not mean the dependency tree is clean or the tests passed.

---

## 5. Related Security Observation (not a dependency CVE)

The production bundle embeds all three Vite-prefixed API keys:

| Variable | Embedded in `dist`? | Assessment |
|:---|:---:|:---|
| `VITE_FIREBASE_API_KEY` | Yes | Public by design; security is enforced by Firebase rules |
| `VITE_TMDB_API_KEY` | Yes | Read-only metadata key; restrict by referrer/quota where possible |
| `VITE_GEMINI_API_KEY` | **Yes** | **Billable secret; should not be client-side** |

`VITE_GEMINI_API_KEY` is consumed by `@google/genai` in `src/utils/gemini-api.ts`. Anyone who downloads the bundle can extract it and spend the project's Gemini quota. The repository already has a `functions/` directory and a `simkl-token` proxy pattern that can be reused to proxy Gemini requests server-side. Rotate the exposed key before deploying a build that contains it.

This is not a vulnerability in a dependency, but it is a higher-impact issue than the three development advisories in §2.

---

## 6. Prioritized Recommendations

### P0 — before the next production deploy

1. Rotate `VITE_GEMINI_API_KEY` and move Gemini calls behind a Cloudflare Function proxy. Do not ship a billable key in client JavaScript.
2. Make the production audit a CI gate: `npm audit --omit=dev --audit-level=high` must fail the job.
3. Stop masking test failures (`|| true`) in `pr-checks.yml`.

### P1 — next maintenance window

4. Remove the 18 unused runtime dependencies and the 4 unused/redundant dev dependencies listed in §3.1–§3.2. Run the full verification suite afterwards.
5. Fix the Tailwind plugin wiring (§3.4). Choose either `@plugin` directives in `src/index.css` or `@config` for `tailwind.config.ts`; do not leave animation and typography classes inert.
6. Move `@types/video.js`, `@types/workbox-build`, `baseline-browser-mapping`, `caniuse-lite`, and `tailwindcss-animate` to `devDependencies`.
7. Add `.github/dependabot.yml` with weekly npm updates, grouped dev-dependency PRs, and GitHub Actions updates.
8. Pin GitHub Actions to commit SHAs and add least-privilege `permissions:` blocks. Replace `actions/checkout@v3` with the current major.
9. Declare `@playwright/test` and `serve` as devDependencies instead of downloading them with unpinned `npx`, and pin `source-map-explorer` in CI.

### P2 — track and schedule

10. Re-check Dependabot after its rescan; the expected result is the three development advisories, not 49 alerts.
11. Track `glob` (fixed 14.0.2), `minimatch` (fixed 11.0.1), and `deepmerge` (no fix) for compatible upstream releases from `workbox-build`, ESLint, and TypeScript-ESLint.
12. Decide whether to override the `.opencode` pins (`effect`, `toml`, `zod`) or accept the local-tooling risk; no upstream plugin release fixes them yet.
13. Plan major upgrades for `@google/genai` 3.x, `video.js` 10.x, and TypeScript 7.x as separate, tested changes.
14. Reduce duplicate versions where the owning packages allow it; `web-vitals` and OpenTelemetry are the largest runtime duplication.

---

## 7. Audit Method

```bash
# Fresh vulnerability data
npm audit --json
npm audit --omit=dev --json
npm audit signatures

# Outdated direct dependencies
npm outdated --json

# Independent advisory source (965 unique locked versions)
# POST https://api.osv.dev/v1/querybatch
# GET  https://api.osv.dev/v1/vulns/{id}

# Dependabot API
gh api "repos/chintan992/letsstream2/dependabot/alerts?state=open&per_page=100" --paginate --slurp

# Dependency usage
rg <package-name> src scripts functions *.ts *.js *.css
git ls-files | ...
```

Additional checks performed:

- Compared every direct dependency against source/config references.
- Compared installed tree against `package-lock.json`; lockfile version 3, 987 entries, 965 unique `name@version` pairs.
- Inspected `dist/assets/*.js` and `dist/assets/*.css` for vulnerable packages and dead plugin classes.
- Scanned every locked package's `package.json` for `deprecated`, `license`, and install scripts.
- Reviewed all three GitHub Actions workflows for pinning, permissions, and unpinned downloads.
- Audited the separate `.opencode` lockfile independently.

### Limitations

- Dependabot had not re-scanned after `9de1bed`; its 49-alert response is stale.
- OSV and npm audit cover published advisory databases, not zero-days or unpublished issues.
- The unused-dependency scan is textual; a package loaded dynamically by string name would be missed.
- `functions/` has no external imports and no separate `package.json`, so it adds no npm dependency surface.
- No container, OS-package, or runtime dynamic-analysis was performed.

---

## 8. Bottom Line

The project's **shipped dependency tree is clean**: zero production vulnerabilities, no vulnerable library code in `dist`, and verified registry signatures for every root dependency. The remaining advisories are three development/build packages with no compatible fix yet.

The actionable work is hygiene and process: remove unused dependencies, fix the inactive Tailwind plugins, stop masking CI failures, pin CI actions, and - most importantly - stop shipping the Gemini API key in the browser bundle.

---

## 9. Post-Cleanup Addendum (commit `7dd4b8d`)

The P1 hygiene items were applied after this audit:

- Removed 18 unused runtime dependencies and 3 unused dev dependencies (`jsdom`, `@testing-library/user-event`, `workbox-window`); kept `@tailwindcss/typography` and activated it.
- Moved `@types/video.js`, `@types/workbox-build`, `baseline-browser-mapping`, `caniuse-lite`, and `tailwindcss-animate` to `devDependencies`.
- Declared `workbox-build` explicitly instead of relying on the transitive copy.
- Added `@plugin "tailwindcss-animate";` and `@plugin "@tailwindcss/typography";` to `src/index.css`.

| Measure | Before cleanup | After cleanup |
|:---|:---:|:---:|
| Lockfile entries | 987 | 893 |
| Unique locked `name@version` pairs | 965 | 875 |
| `npm audit --omit=dev` | 0 | **0** |
| OSV advisories | 3 dev-only | **3 dev-only** (`glob`, `minimatch`, `deepmerge`) |
| Tailwind animation/typography utilities in built CSS | Absent | **Present** |

Verification after cleanup: clean `npm ci`; `npm run tsc` clean; `npm run lint` 0 errors (8 pre-existing warnings); `npm test` 6 files / 22 tests passed; `npm run build` and `postbuild` succeeded. The built stylesheet now contains `animate-in`/`animate-out`, `fade-in-0`/`fade-out-0`, `zoom-in-95`/`zoom-out-95`, `slide-in-from-*`, `prose`, and `prose-invert`; no vulnerable library code is present in `dist`.

Dependabot state after the push: GitHub regenerated the dependency-graph SBOM at `2026-11-11T22:45:40Z` with 882 packages, and the removed packages (`tinypool`, `lodash`, `joi`, `undici`, `body-parser`, `qs`, `uuid`) are no longer present. The alerts API still returned 49 open alerts, all with `updated_at` on or before `2026-11-02`; this is alert-evaluation lag behind the refreshed graph, not a lockfile regression. Dependabot subsequently converged: 49 alerts closed automatically, leaving only `minimatch` (medium) and `deepmerge` (low), consistent with the development-only findings in §2.1.

The remaining P0 item is rotating or proxying `VITE_GEMINI_API_KEY`. The CI gates are addressed in §10.

---

## 10. CI Hardening Applied

The CI-related P0 and P1 items were implemented after the post-cleanup addendum:

- `pr-checks.yml` now fails on production dependency vulnerabilities (`npm audit --omit=dev --audit-level=high`), on the test suite (`npm test`), and on formatting (`npm run format:check`).
- Coverage generation remains informational (`continue-on-error`) because the configured 50% global thresholds are not yet met (current coverage is ~1.6%). The actual test suite is blocking, so test failures can no longer pass CI.
- All GitHub Actions are pinned to commit SHAs, and every workflow declares least-privilege `permissions`.
- `release.yml` now uses `actions/checkout@v4` and `softprops/action-gh-release@v2`; the commit message is passed through an environment variable to prevent shell injection.
- `runtime-error-check.yml` uses locally declared, version-pinned `@playwright/test` and a dependency-free Node static server instead of downloading unpinned packages with `npx`; this also avoided the vulnerable `compression` package that `serve` would add.
- The bundle-size job no longer installs a global tool or masks failures. `scripts/bundle-size-report.cjs` writes `bundle-size.json` from the built assets.
- `.github/dependabot.yml` adds weekly grouped updates for npm dependencies and GitHub Actions.
- `format:check` passes repo-wide after fixing `wiki/_Footer.md`, so it is now a blocking gate.
