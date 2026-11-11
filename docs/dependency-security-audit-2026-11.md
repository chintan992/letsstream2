# Dependency Security Audit — November 2026

**Repository:** `chintan992/letsstream2`  
**Branch / Commit:** `main` / `d26aedc`  
**Audit Date:** 11 November 2026  
**Data Sources:** GitHub Dependabot alerts API, `npm audit --json`, `package-lock.json`, production `dist/` bundle inspection

---

## 1. Executive Summary

GitHub reported **50 vulnerabilities** on the default branch. At audit time the Dependabot API returned **49 open alerts** (one has since been resolved or withdrawn) across **22 packages**:

| Severity | Alerts |
|:---|:---:|
| Critical | 3 |
| High | 25 |
| Medium | 13 |
| Low | 8 |
| **Total** | **49** |

No Dependabot alerts are currently dismissed, and 249 alerts have already been auto-fixed historically.

### Key conclusions

1. **The two critical code paths are not shipped.** All 3 critical alerts are in `tinypool` (2) and `websocket-driver` (1). `tinypool` is only reachable through `@docusaurus/core`, and `websocket-driver` is only reachable through `@firebase/database` (not imported by the app) and Docusaurus. Neither appears in the production bundle.
2. **Docusaurus is completely unused.** The four `@docusaurus/*` packages are listed as runtime dependencies, but there is no `docusaurus/` directory and no source import. The only reference is a stale `workflow_dispatch` workflow that would fail today. Removing this stack clears **8 alerts immediately** and removes one path for several others.
3. **Several direct dependencies are unused:** `@hookform/resolvers`, `react-hook-form`, and `zod` have no imports in `src/`. Removing `@hookform/resolvers` clears all **6 `joi` alerts**.
4. **Most remaining alerts are stale lockfile entries, not missing fixes.** `fast-uri`, `undici`, `serialize-javascript`, `@babel/core`, `@babel/plugin-transform-modules-systemjs`, `websocket-driver`, `re2js`, `follow-redirects`, `@humanfs/node`, and `zod` all have patched versions inside their existing semver ranges. A refreshed lockfile (`npm update`) resolves them.
5. **Only one alert has no patched release:** `deepmerge` (low) — build-time only, prototype pollution in `mergeObject()`. It should be accepted as a known low risk until upstream ships a fix.
6. **One high-severity package is actually in the production bundle:** `re2js` 2.8.6, bundled inside the Firestore vendor chunk. The app only issues equality queries (no user-supplied regexes), so practical exploitability is low, but it should be patched.

**Remediation status (applied 11 November 2026): 48 of the 49 open Dependabot alerts are addressed in the lockfile. `npm audit` now reports 0 critical, 0 high, 2 low, and 13 moderate — all in build/dev tooling. Details and verification results are in section 6.**

> **Why `npm audit` says 64:** `npm audit` also flags parent packages (for example `@docusaurus/core`, `firebase`, `eslint`, `vite-plugin-pwa`) whose dependency trees merely contain a vulnerable package. Dependabot's 49 alerts are the deduplicated package/advisory view and are the basis of this report.

---

## 2. Exposure Model

| Layer | Packages | Notes |
|:---|:---|:---|
| Shipped browser bundle | `re2js` | Firestore vendor chunk contains the RE2JS engine. Equality queries only; no regex input from users. |
| Runtime dependency, not bundled | `@grpc/grpc-js`, `websocket-driver`, `follow-redirects`, `zod` | Node-only transports/adapters or unused code. Confirmed absent from `dist/`. |
| Build tooling | `fast-uri`, `joi`, `serialize-javascript`, `@babel/*`, `postcss-selector-parser`, `@humanfs/node`, `deepmerge`, `picomatch`, `body-parser`, `qs`, `uuid`, `lodash`, `tinypool` | Only executed during install/build/lint. No production attack surface. |
| Test tooling | `happy-dom`, `undici` (via `jsdom`), `@vitest/ui` | Dev server and DOM emulation; not deployed. |

Production bundle checks performed:

- `websocket-driver`, `faye-websocket`, `@grpc/grpc-js`, and `follow-redirects` are **not present** in `dist/assets/`.
- `re2js` **is present** in `dist/assets/vendor-firebase-*.js`.
- `zod`, `react-hook-form`, and `@hookform/resolvers` are not imported by any source file, so they are not in the bundle.

---

## 3. Findings by Package

Severity counts are per Dependabot alert. `Patched` is the first fixed version.

| # | Package | Installed | Alerts | Worst | Patched | Pulled in by | Exposure | Action |
|:--|:---|:---|:---:|:---:|:---|:---|:---|:---|
| 1 | `tinypool` | 1.1.1 | 2 (2C) | Critical | 2.1.2 | `@docusaurus/core` | Build only | Remove Docusaurus |
| 2 | `websocket-driver` | 0.7.4 | 2 (1C, 1M) | Critical | 0.7.5 | `firebase` → `@firebase/database`; Docusaurus → `sockjs` | Not bundled | Update lockfile |
| 3 | `fast-uri` | 3.0.6 | 12 (8H, 2M, 2L) | High | 3.1.9 | `@hookform/resolvers` → `ajv`; `workbox-build` → `ajv` | Build only | Remove unused resolver + update |
| 4 | `joi` | 17.13.3 | 6 (2H, 2M, 2L) | High | 17.13.9 | `@hookform/resolvers`; Docusaurus | Build only | Remove unused resolver + Docusaurus |
| 5 | `undici` | 8.11.2 | 5 (4H, 1M) | High | 8.12.2 | `jsdom` | Test only | Update lockfile |
| 6 | `serialize-javascript` | 6.0.2 / 7.1.2 | 3 (1H, 1M, 1L) | High | 7.1.3 | Docusaurus; `vite-plugin-pwa` → `workbox-build` | Build only | Remove Docusaurus + update |
| 7 | `@grpc/grpc-js` | 1.9.16 | 2 (1H, 1L) | High | 1.13.6 | `firebase` → `@firebase/firestore` (pinned `~1.9.0`) | Not bundled | Override to `^1.13.6` |
| 8 | `happy-dom` | 20.14.6 | 2 (2H) | High | 21.0.4 | Direct dev dependency (Vitest environment) | Test only | Upgrade to 21.0.4 |
| 9 | `picomatch` | 2.3.1 | 2 (1H, 1M) | High | 2.3.2 | Docusaurus → `micromatch` / `chokidar` | Build only | Remove Docusaurus |
| 10 | `@babel/plugin-transform-modules-systemjs` | 7.25.9 | 1 (1H) | High | 7.29.4 | Docusaurus; `workbox-build` → `@babel/preset-env` | Build only | Update lockfile |
| 11 | `body-parser` | 1.20.8 | 1 (1H) | High | 1.20.9 | Docusaurus → `webpack-dev-server` → `express` | Build only | Remove Docusaurus |
| 12 | `follow-redirects` | 1.16.1 | 1 (1H) | High | 1.16.2 | `axios` | Not bundled | Update lockfile / axios |
| 13 | `lodash` | 4.17.23 | 1 (1H) | High | 4.18.0 | Docusaurus | Build only | Remove Docusaurus |
| 14 | `re2js` | 2.8.6 | 1 (1H) | High | 2.8.7 | `firebase` → `@firebase/firestore` | **Shipped** in Firestore chunk | Update lockfile |
| 15 | `zod` | 4.6.5 | 1 (1H) | High | 4.6.6 | Direct (unused); `eslint-plugin-react-hooks` (dev) | Not imported | Remove direct dep + update |
| 16 | `@humanfs/node` | 0.16.7 | 1 (1M) | Medium | 0.16.8 | `eslint` | Dev only | Update lockfile |
| 17 | `@vitest/ui` | 5.0.3 | 1 (1M) | Medium | 5.0.5 | Direct dev dependency | Test server | Upgrade Vitest stack |
| 18 | `postcss-selector-parser` | 6.0.10 | 1 (1M) | Medium | 6.1.5 | `@tailwindcss/typography` (exact `6.0.10`); Docusaurus 6.1.4 | Build only | Override under typography |
| 19 | `qs` | 6.16.0 | 1 (1M) | Medium | 6.16.1 | Docusaurus → `express` | Build only | Remove Docusaurus |
| 20 | `uuid` | 8.3.2 | 1 (1M) | Medium | 11.1.1 | Docusaurus → `sockjs` | Build only | Remove Docusaurus |
| 21 | `@babel/core` | 7.26.10 | 1 (1L) | Low | 7.29.6 | `workbox-build`, `eslint-plugin-react-hooks`, Docusaurus | Build only | Update lockfile |
| 22 | `deepmerge` | 4.3.1 | 1 (1L) | Low | **None** | `workbox-build` → `@rollup/plugin-node-resolve`; Docusaurus | Build only | Accept risk (no fix) |

Alert totals: Critical 3, High 25, Medium 13, Low 8.

---

## 4. Critical Findings in Detail

### 4.1 `tinypool` — 2 critical alerts (build-only)

- **GHSA-5gmw-xhrv-c9v3 / CVE-2026-104848** — prototype pollution gadget in worker options leads to RCE.
- **GHSA-85c8-ppgw-ccpr / CVE-2026-104849** — prototype pollution gadget to RCE in `run()` options.
- Installed: **1.1.1**. Fixed: **2.1.1 / 2.1.2**.
- Reachable only through `@docusaurus/core`, which depends on `tinypool` 1.1.1. Docusaurus is not used by this project.
- Not present in `dist/`.

**Fix:** remove the four `@docusaurus/*` dependencies. This eliminates both critical alerts outright.

### 4.2 `websocket-driver` — 1 critical + 1 medium (not shipped)

- **GHSA-xv26-6w52-cph6 / CVE-2026-54466** — message corruption via protocol length headers (critical).
- **GHSA-mp7j-qc5w-4988 / CVE-2026-54490** — compression resource-limit bypass (medium).
- Installed: **0.7.4**. Fixed: **0.7.5**.
- Reachable through `@firebase/database` (the app imports only Auth, Firestore, Analytics, and Storage) and through the unused Docusaurus dev server.
- `websocket-driver` and `faye-websocket` are **not present** in the production bundle.

**Fix:** `npm update` refreshes `websocket-driver` to 0.7.5 because `faye-websocket` accepts `>=0.5.1`. Also remove Docusaurus.

### 4.3 `re2js` — 1 high (shipped)

- **GHSA-gg6h-894w-4m9c / CVE-2026-116795** — quadratic-time DoS in lookbehind matching.
- Installed: **2.8.6**. Fixed: **2.8.7** (current latest 2.10.0).
- `@firebase/firestore` declares `re2js: ^2.8.3`, so a lockfile refresh is sufficient.
- Present in `dist/assets/vendor-firebase-*.js`. The application uses only equality `where()` filters and never passes user-controlled regex patterns to Firestore, so real-world exploitability is limited.

**Fix:** `npm update re2js` (resolves 2.10.0).

---

## 5. Root Causes

1. **Unused heavy dependencies in the runtime manifest.** Docusaurus and the form/validation stack are not used but remain in `dependencies`. This inflates install size (~7 MB for `@docusaurus` alone) and the alert surface.
2. **Stale lockfile.** `package.json` uses caret ranges, but `package-lock.json` pins older transitive versions that are already outside the patched range allowed by their parents. `npm ci` keeps installing them.
3. **Pinned transitive dependencies with no upstream bump.** `@firebase/firestore` pins `@grpc/grpc-js ~1.9.0`, and `@tailwindcss/typography` pins `postcss-selector-parser 6.0.10`. Both need `overrides`.
4. **No Dependabot configuration.** Security alerts are enabled, but there is no `.github/dependabot.yml` for scheduled version updates or grouped PRs.
5. **Stale GitHub Pages workflow.** `.github/workflows/deploy-gh-pages.yml` references a non-existent `docusaurus/` directory.

---

## 6. Remediation Plan

### Step 1 — Remove unused Docusaurus and form/validation dependencies

```bash
npm uninstall \
  @docusaurus/core \
  @docusaurus/plugin-content-docs \
  @docusaurus/preset-classic \
  @docusaurus/theme-classic \
  @hookform/resolvers \
  react-hook-form \
  zod
```

Also delete `.github/workflows/deploy-gh-pages.yml`; it targets a directory that does not exist.

**Clears:** `tinypool` (2C), `picomatch` (2), `body-parser`, `lodash`, `qs`, `uuid`, and `joi` (6) = **14 alerts** (plus removes one path for several shared packages).

> Keep `zod` only if you plan to add schema validation; it is currently unused. `eslint-plugin-react-hooks` still pulls its own `zod` for development, which the update in step 2 patches.

### Step 2 — Update direct dependencies

```bash
npm install \
  firebase@^13.3.0 \
  axios@^1.21.1 \
  happy-dom@^21.0.4 \
  eslint@^10.14.0 \
  vitest@^5.1.0 \
  @vitest/ui@^5.1.0 \
  @vitest/coverage-v8@^5.1.0 \
  @tailwindcss/typography@^0.5.20
```

`happy-dom` is a semver-major jump (20 → 21) because both advisories are only fixed in 21.x. Vitest 5.1.0 declares `happy-dom` as an optional peer, so this is compatible; run the test suite to confirm.

### Step 3 — Refresh transitive dependencies

```bash
npm update
```

This should resolve:

| Package | Target |
|:---|:---|
| `fast-uri` | 3.1.9 |
| `undici` | 8.12.4 |
| `serialize-javascript` | 7.1.4 |
| `@babel/core` | 7.29.13 |
| `@babel/plugin-transform-modules-systemjs` | 7.29.8 |
| `websocket-driver` | 0.7.5 |
| `re2js` | 2.10.0 |
| `follow-redirects` | 1.16.3 |
| `@humanfs/node` | 0.16.8 |
| `zod` | 4.6.7 |

### Step 4 — Add the two required overrides

`@grpc/grpc-js` is pinned to `~1.9.0` by `@firebase/firestore`, and `postcss-selector-parser` is pinned to exactly `6.0.10` by `@tailwindcss/typography`. Neither can be refreshed with `npm update`.

Add to `package.json`:

```json
"overrides": {
  "@grpc/grpc-js": "^1.13.6",
  "@tailwindcss/typography": {
    "postcss-selector-parser": "^6.1.5"
  }
}
```

Then run:

```bash
npm install
```

`@grpc/grpc-js` is a Node-only transport and is not in the browser bundle, but the override clears both alerts. This version is outside Firestore's declared `~1.9.0` range; validate with the build and test suite. The scoped PostCSS override keeps the fix on the 6.x line used by Tailwind typography, without forcing 6.x onto packages that use 7.x.

### Step 5 — Verification results (11 November 2026)

| Check | Result |
|:---|:---|
| `npm run tsc` | Pass |
| `npm run lint` | Pass (8 pre-existing warnings, 0 errors) |
| `npm test` | Pass — 6 files, 22 tests (Vitest 5.1.0 + happy-dom 21.0.4) |
| `npm run build` + `postbuild` | Pass — 3365 modules, sitemap and SEO injection completed |
| `npm run format:check` | Pre-existing failure in `wiki/_Footer.md` only; no changed files affected |
| `npm audit` | **15 vulnerabilities: 0 critical, 0 high, 2 low, 13 moderate** |

Installed versions after remediation: `firebase@13.3.0`, `@grpc/grpc-js@1.14.7`, `re2js@2.10.0`, `websocket-driver@0.7.5`, `happy-dom@21.0.4`, `axios@1.21.1`, `follow-redirects@1.16.3`, `fast-uri@3.1.9`, `undici@8.12.4`, `serialize-javascript@7.1.4`, `postcss-selector-parser@6.1.6`.

Dependabot's open-alert count updates only after the lockfile is pushed to the default branch.

### Residual risk

| Package | Severity | Status |
|:---|:---:|:---|
| `deepmerge` 4.3.1 | Low | No patched version published. Prototype poisoning only when merging untrusted objects; used only through `workbox-build` at build time. Accept and re-check when upstream releases a fix. |
| `@rollup/plugin-node-resolve` | Low | Inherits the `deepmerge` advisory through `workbox-build`. Build only. |
| `minimatch` 10.2.6 / `glob` 11.1.0 | Moderate | DoS advisories newly published after the Dependabot snapshot. `eslint@10.14.0` requires `minimatch ^10.2.6` and `workbox-build@7.4.1` requires `glob ^11.0.1`; the fixed releases (11.0.8 / 14.0.5) are outside those ranges. npm's suggested "fix" is a breaking downgrade (`eslint@9.39.5`, `vite-plugin-pwa@1.1.0`). All are build/lint-only. Revisit when eslint 10 and workbox publish compatible updates. |

No critical or high severity findings remain, and no vulnerable package is reachable in the shipped browser bundle.

---

## 7. Preventive Recommendations

1. **Add `.github/dependabot.yml`** with weekly npm updates, grouped PRs for dev dependencies, and security updates enabled.
2. **Keep build tooling in `devDependencies`.** Docusaurus, `@tailwindcss/typography`, `@types/workbox-build`, `baseline-browser-mapping`, and `caniuse-lite` do not belong in runtime `dependencies`.
3. **Run `npm audit` and `npm outdated` in CI** (non-blocking report initially, then fail on critical/high).
4. **Pin GitHub Actions to commit SHAs** and enable Dependabot for Actions.
5. **Refresh the lockfile regularly.** Most of this audit is a lockfile-staleness problem, not a lack of fixes.

---

## Appendix — Full Advisory IDs

| Package | GHSA / CVE |
|:---|:---|
| `tinypool` | GHSA-5gmw-xhrv-c9v3 (CVE-2026-104848), GHSA-85c8-ppgw-ccpr (CVE-2026-104849) |
| `websocket-driver` | GHSA-xv26-6w52-cph6 (CVE-2026-54466), GHSA-mp7j-qc5w-4988 (CVE-2026-54490) |
| `fast-uri` | GHSA-xhq7-xmqj-769h, GHSA-w74x-v6f9-j3xg, GHSA-333x-w4r6-6crp, GHSA-hrr3-gc8f-f4qj, GHSA-qw65-cvwx-89v3, GHSA-jqff-g426-hqxp, GHSA-f65p-4m7j-42xc, GHSA-q3j6-qgpj-74h6, GHSA-v39h-62p7-jpjc, GHSA-7p8r-x3mc-p8w7, GHSA-v2hh-gcrm-f6hx, GHSA-4c8g-83qw-93j6 |
| `joi` | GHSA-4528-x5fx-h6hg, GHSA-wr44-6hxh-3jwq, GHSA-6h2x-m376-mqjq, GHSA-6w3j-5fw6-r9vr, GHSA-gg4h-3hg2-grpc, GHSA-q7cg-457f-vx79 |
| `undici` | GHSA-4w7w-5xrc-9h26, GHSA-2m5v-pch6-74hx, GHSA-qrxm-fqhp-jwvm, GHSA-9fm3-97px-rjf6, GHSA-xjj6-f33q-929c |
| `serialize-javascript` | GHSA-m5mm-p8h7-m29v, GHSA-qj8w-gfj5-8c6v, GHSA-5c6j-r48x-rmvq |
| `@grpc/grpc-js` | GHSA-m9gg-hp2v-232j (CVE-2026-101916), GHSA-f596-whhp-79r4 (CVE-2026-101915) |
| `happy-dom` | GHSA-c8p4-j97h-3vg8 (CVE-2026-118660), GHSA-834v-8h66-3h79 (CVE-2026-115895) |
| `picomatch` | GHSA-3v7f-55p6-f55p (CVE-2026-33672), GHSA-c2c7-rcm5-vvqj (CVE-2026-33671) |
| `@babel/plugin-transform-modules-systemjs` | GHSA-fv7c-fp4j-7gwp (CVE-2026-44728) |
| `body-parser` | GHSA-27r3-jxmh-p828 (CVE-2026-111181) |
| `follow-redirects` | GHSA-mrwp-f3q8-3g9p (CVE-2026-116689) |
| `lodash` | GHSA-r5fr-rjxr-66jc (CVE-2026-4800) |
| `re2js` | GHSA-gg6h-894w-4m9c (CVE-2026-116795) |
| `zod` | GHSA-mrhx-c7xc-m3w5 (CVE-2023-54404) |
| `@humanfs/node` | GHSA-p498-v437-472g |
| `@vitest/ui` | GHSA-p458-7748-mcp3 (CVE-2026-112948) |
| `postcss-selector-parser` | GHSA-rj75-hqrm-r3gf (CVE-2026-104844) |
| `qs` | GHSA-6pq8-jhm2-2vcw (CVE-2026-110816) |
| `uuid` | GHSA-w5hq-g745-h8pq (CVE-2026-41907) |
| `@babel/core` | GHSA-4x5r-pxfx-6jf8 (CVE-2026-49356) |
| `deepmerge` | GHSA-gcqx-w48m-w2h4 (CVE-2026-93753) |
