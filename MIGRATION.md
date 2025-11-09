# Migration Guide: Dependency Updates

## Overview
This document summarizes the dependency update from the previous version to the current one, focusing on core build infrastructure updates: Vite, TypeScript, ESLint ecosystem, TailwindCSS, PostCSS, and Vite plugins.

## Node.js Requirement Change
- **Old**: Node.js 20.0.0+
- **New**: Node.js 20.19+ or 22.12+
- **Reason**: Vite 7 requirement for ESM-only distribution
- **Action**: Update local development environment and CI/CD pipelines

## Major Version Updates

### Vite 5.4.1 → 7.1.4
- Default browser target changed to 'baseline-widely-available'
- Sass legacy API removed (not applicable to this project)
- splitVendorChunkPlugin removed (already using manualChunks)
- Added explicit build.target configuration to maintain older browser compatibility

### vite-plugin-pwa 0.21.2 → 1.0.3
- Workbox updated to 7.3.0
- workbox-google-analytics deprecated (GA4 incompatible) - removed from configuration
- Maintains complex workbox runtime caching strategies

### eslint-plugin-react-hooks 5.1.0-rc.0 → 7.0.1
- Now a stable release (no longer RC)

## Minor/Patch Updates
- TypeScript 5.5.3 → 5.9.3
- ESLint ecosystem updates (9.9.0 → 9.39.1)
- TailwindCSS 3.4.11 → 3.4.18
- PostCSS and Autoprefixer updates
- @vitejs/plugin-react-swc 3.5.0 → 4.2.1

## Removed Dependencies
- `@tailwindcss/line-clamp`: Built into TailwindCSS core since v3.3, no longer needed as a separate plugin

## Configuration Changes

### package.json
- Updated `engines.node` to `>=20.19.0`
- All devDependencies updated to latest stable versions per the update plan

### vite.config.ts
- Added explicit `build.target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']` for browser compatibility
- Removed deprecated `offlineGoogleAnalytics` configuration
- Verified workbox type definitions remain compatible

### tailwind.config.ts
- Removed `@tailwindcss/line-clamp` import and plugin from plugins array
- Line-clamp utilities are now built into TailwindCSS v3.4.18

### CI Workflows
- No changes needed: both workflows already used `node-version: [20.x]` which meets Vite 7 requirements

## TailwindCSS v4 Migration
- Successfully migrated from v3.4.18 to v4.1.16
- Updated configuration from JavaScript to CSS-first approach
- Changed `@tailwind` directives to `@import "tailwindcss"`
- Updated PostCSS plugin from `tailwindcss: {}` to `'@tailwindcss/postcss': {}`
- Removed `autoprefixer` from PostCSS config (handled automatically in v4)
- Removed `@tailwindcss/line-clamp` (built into v4 core)

## Testing Recommendations
- Run `npm install` to ensure clean dependency resolution
- Run `npm run build` to verify production build
- Run `npm run lint` to check for linting errors
- Test PWA functionality (service worker, offline mode, caching)
- Verify all UI components render correctly
- Test authentication flows and API integrations

## Rollback Plan
- Revert package.json to previous dependency versions
- Restore previous versions of configuration files if issues arise
- Keep a copy of the old `package-lock.json` for quick rollback if needed

## Phase 2: React Ecosystem & UI Libraries (November 2025)

**Overview:**
Updated React 18.x ecosystem and UI libraries to their latest stable versions, prioritizing backward-compatible updates to avoid breaking changes that would require extensive testing.

**Strategic Decisions:**
1. **Stayed on current major versions** for libraries with breaking changes:
   - React Router v6.30.1 (avoided v7 due to package merge, import changes, and future flags)
   - recharts v2.12.7 (avoided v3 due to API removals and typing changes)
   - react-day-picker v8.10.1 (avoided v9 due to controlled props and className changes)

2. **Skipped unused dependencies:**
   - Zod v3.23.8 (not used in codebase - no schemas found)
   - @hookform/resolvers v3.9.0 (not used - no zodResolver usage found)

3. **Updated to latest stable versions:**
   - All 30+ Radix UI packages (v1.x and v2.x latest)
   - UI utilities: framer-motion, lucide-react, sonner, vaul, embla-carousel-react
   - react-hook-form v7.65.0 (minor update, backward-compatible)
   - Type definitions: @types/react v18.3.12, @types/react-dom v18.3.5

**Updated Dependencies:**

*Radix UI Primitives (all backward-compatible):*
- @radix-ui/react-accordion: 1.2.0 → 1.2.12
- @radix-ui/react-alert-dialog: 1.1.1 → 1.1.15
- @radix-ui/react-avatar: 1.1.0 → 1.1.10
- @radix-ui/react-checkbox: 1.1.1 → 1.3.3
- @radix-ui/react-dialog: 1.1.2 → 1.1.15
- @radix-ui/react-dropdown-menu: 2.1.1 → 2.1.16
- @radix-ui/react-label: 2.1.0 → 2.1.7
- @radix-ui/react-progress: 1.1.0 → 1.1.7
- @radix-ui/react-select: 2.1.1 → 2.2.6
- @radix-ui/react-tooltip: 1.1.4 → 1.2.8
- (and 20+ more Radix UI packages - see package.json for complete list)

*UI Utilities & Animation:*
- framer-motion: 12.5.0 → 12.23.24
- lucide-react: 0.462.0 → 0.542.0
- sonner: 1.5.0 → 2.0.7
- vaul: 0.9.3 → 1.1.2
- embla-carousel-react: 8.3.0 → 8.6.0

*Forms & Routing:*
- react-hook-form: 7.53.0 → 7.65.0
- react-router-dom: 6.30.0 → 6.30.1

*Type Definitions:*
- @types/react: 18.3.3 → 18.3.12
- @types/react-dom: 18.3.0 → 18.3.5

**Components Verified:**
- `src/components/ui/form.tsx` - react-hook-form v7.65.0 compatible
- `src/components/ui/calendar.tsx` - react-day-picker v8.10.1 (no changes)
- `src/components/ui/chart.tsx` - recharts v2.12.7 (no changes)
- `src/components/ui/avatar.tsx` - @radix-ui/react-avatar v1.1.10 compatible
- `src/components/ui/label.tsx` - @radix-ui/react-label v2.1.7 compatible
- `src/components/ui/progress.tsx` - @radix-ui/react-progress v1.1.7 compatible
- `src/routes.tsx` - react-router-dom v6.30.1 compatible

**Breaking Changes Avoided:**

*React Router v7 (not upgraded):*
- Would require package merge (react-router-dom → react-router)
- Import path changes across 34+ files
- Future flags enablement (v7_relativeSplatPath, v7_startTransition, etc.)
- Form method normalization (lowercase → UPPERCASE)
- Splat route restructuring

*react-day-picker v9 (not upgraded):*
- `selected` becomes controlled (requires onSelect handler)
- Class name changes (day → day_button, day_disabled → disabled, etc.)
- Component renames (IconLeft/IconRight → Chevron)
- fromDate/toDate → startMonth/endMonth + hidden matchers

*recharts v3 (not upgraded):*
- CategoricalChartState removed
- Tooltip typing changes (TooltipContentProps)
- activeIndex prop removed
- ResponsiveContainer ref shape changed
- Z-order now purely render order

*Zod v4 (not upgraded - not used):*
- message → error for customization
- String APIs moved to top-level (z.email(), z.uuid(), etc.)
- Number validation changes (Infinity no longer valid)
- Object defaults behavior changes
- Would require codebase-wide schema updates if Zod were used

**Testing Recommendations:**
1. Run `npm install` to ensure clean dependency resolution
2. Run `npm run build` to verify production build succeeds
3. Run `npm run lint` to check for linting errors
4. Manually test UI components:
   - Forms with validation (react-hook-form)
   - Calendar/date pickers (react-day-picker)
   - Charts and data visualization (recharts)
   - All Radix UI components (dialogs, dropdowns, tooltips, etc.)
   - Navigation and routing (react-router-dom)
5. Test animations and transitions (framer-motion)
6. Verify icons render correctly (lucide-react)
7. Test toast notifications (sonner)
8. Verify drawer/sheet components (vaul)
9. Test carousels (embla-carousel-react)

**Future Considerations:**
1. **React Router v7 migration**: Plan as a separate task with comprehensive testing
   - Enable future flags incrementally in v6
   - Test each flag before upgrading to v7
   - Update imports across all 34+ files using routing

2. **react-day-picker v9 migration**: Plan as a separate task
   - Update calendar.tsx with controlled selected prop
   - Refactor classNames to new naming convention
   - Replace IconLeft/IconRight with Chevron component
   - Test date selection and range selection

3. **recharts v3 migration**: Plan as a separate task
   - Update chart.tsx Tooltip typing
   - Test all chart types used in the application
   - Verify z-order and layering
   - Update any custom chart components

4. **Consider using Zod**: If form validation is needed in the future
   - Currently not used despite being installed
   - Would enable type-safe schema validation
   - Integrates well with react-hook-form via zodResolver
   - If adopted, plan migration to Zod v4 with codemod assistance

## Future Considerations
- TailwindCSS v4 migration (separate task requiring extensive testing)
- React 19 upgrade (when stable and tested)
- Monitoring for Vite 8 and other major updates