# Scroll Restoration Troubleshooting Guide

This guide provides solutions for common issues with the scroll restoration system.

## Common Issues

### 1. Scroll Not Restoring

**Symptoms**: When navigating back to a page, scroll position is at the top instead of where the user left off.

**Causes and Solutions**:
- **Check environment variable**: Verify `VITE_SCROLL_RESTORATION_MANUAL=true` in your `.env` file
- **Verify sessionStorage**: Open DevTools → Application → Session Storage → Check for keys starting with `scroll-positions-`
- **Check hydration state**: Ensure content has loaded before restoration (look for hydration flags)
- **Network issues**: Slow content loading might prevent restoration within timeout (see fallback timeouts)

**Reference Files**:
- `src/hooks/useScrollRestoration.ts`
- `src/hooks/useElementScrollRestoration.ts`
- `src/hooks/useHorizontalScrollRestoration.ts`

### 2. Scroll Jumps/Flickers

**Symptoms**: Scroll position changes unexpectedly during page load or navigation.

**Causes and Solutions**:
- **Restore delay**: Verify restore delay is sufficient (50-100ms). Can be adjusted in hook options.
- **Competing scroll logic**: Check for multiple scroll restoration mechanisms on the same element.
- **Content loading timing**: Ensure content is fully loaded before restoration happens.
- **CSS changes**: Dynamic CSS changes during loading might affect scroll position.

**Reference Files**:
- `src/hooks/useScrollRestoration.ts`
- `src/components/PageTransition.tsx`

### 3. Performance Issues

**Symptoms**: Slow page loads, high memory usage, or excessive sessionStorage writes.

**Causes and Solutions**:
- **Debouncing effectiveness**: Monitor debouncing in `saveScrollPosition` functions (should be ~100ms).
- **Memory leaks**: Verify event listeners and timeouts are cleaned up in useEffect return functions.
- **Cleanup of event listeners**: Check useEffect cleanup functions in all scroll restoration hooks.

**Reference Files**:
- `src/hooks/useScrollRestoration.ts`
- `src/hooks/useElementScrollRestoration.ts`
- `src/hooks/useHorizontalScrollRestoration.ts`

### 4. SessionStorage Quota Exceeded

**Symptoms**: Error messages about storage limits, scroll restoration stops working.

**Causes and Solutions**:
- **Reduce stored data**: Store only necessary data (IDs instead of full objects when possible).
- **Implement quota error handling**: The system should handle this automatically with cleanup.
- **Clear old entries**: The `usePageStatePersistence` hook has automatic cleanup mechanisms.

**Reference Files**:
- `src/hooks/usePageStatePersistence.ts`

### 5. Mobile Issues

**Symptoms**: Scroll restoration works on desktop but not on mobile devices.

**Causes and Solutions**:
- **Touch scrolling**: Verify passive listeners are properly set up for touch events.
- **iOS Safari quirks**: iOS can be inconsistent with scroll restoration during page load.
- **Viewport changes**: Mobile viewport changes can affect scroll calculations.

**Reference Files**:
- `src/hooks/useElementScrollRestoration.ts`
- `src/hooks/useHorizontalScrollRestoration.ts`

### 6. Browser Back/Forward Issues

**Symptoms**: Scroll restoration doesn't work with browser back/forward buttons.

**Causes and Solutions**:
- **AnalyticsWrapper**: Verify `AnalyticsWrapper` is saving scroll on navigation.
- **URL param mismatches**: Check if URL parameters match persisted state.
- **History API**: Ensure `window.history.scrollRestoration = 'manual'` is set.

**Reference Files**:
- `src/components/AnalyticsWrapper.tsx`
- `src/routes.tsx`

### 7. Tab-Specific Restoration Not Working

**Symptoms**: Tab-specific scroll positions aren't maintained correctly.

**Causes and Solutions**:
- **Storage key format**: Verify storage keys include tab identifiers (e.g., `scroll-movie-details-popular`).
- **Hydration timing**: Ensure each tab's content is loaded before restoration.
- **Tab switching**: Verify scroll positions are properly saved when switching tabs.

**Reference Files**:
- `src/pages/MovieDetails.tsx`
- `src/pages/TVDetails.tsx`

### 8. Horizontal Scroll Not Restoring

**Symptoms**: Horizontal content rows don't maintain their scroll position.

**Causes and Solutions**:
- **Unique keys**: Verify each ContentRow has unique keys (`scroll-horizontal-{pathname}-{title}` or `scroll-horizontal-{pathname}-{title}-{rowId}`).
- **useHorizontalScrollRestoration integration**: Check that the hook is properly called in ContentRow.
- **Element availability**: Ensure the scrollable element is available before restoration.

**Reference Files**:
- `src/components/ContentRow.tsx`
- `src/hooks/useHorizontalScrollRestoration.ts`

## Debugging Steps

### 1. SessionStorage Check
```
// In DevTools Console
console.log('All scroll restoration keys:', 
  Object.keys(sessionStorage).filter(key => key.includes('scroll-'))
);
```

### 2. Debug Logs
Add temporary logs to hook restoration functions:
```javascript
// In any restoration hook, add:
console.log('Restoring scroll to position:', position, 'for key:', storageKey);
```

### 3. React DevTools Check
- Open React DevTools → Components → Check hydration state values
- Verify component states match expected values

### 4. Network Tab Check
- Check for API requests that might delay content loading
- Verify all data needed for restoration is loaded

## Reference Files

For each issue, check these files:
- **Hooks**: `src/hooks/useScrollRestoration.ts`, `src/hooks/useElementScrollRestoration.ts`, `src/hooks/useHorizontalScrollRestoration.ts`, `src/hooks/usePageStatePersistence.ts`
- **Pages**: `src/pages/Movies.tsx`, `src/pages/TVShowsPage.tsx`, `src/pages/MovieDetails.tsx`, `src/pages/TVDetails.tsx`
- **Global**: `src/components/AnalyticsWrapper.tsx`, `src/routes.tsx`, `src/components/ContentRow.tsx`