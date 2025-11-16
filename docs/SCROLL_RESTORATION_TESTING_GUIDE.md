# Scroll Restoration Testing Guide

This document provides a systematic approach to test the scroll restoration system across all scenarios before production deployment.

## Basic Tests

### Window Scroll Restoration
- [ ] Navigate to `/movie`, scroll to 500px, navigate to `/`, go back
  - Expected: `window.scrollY` is approximately 500px (±50px tolerance)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

- [ ] Navigate to `/movie`, scroll to 500px, refresh page
  - Expected: `window.scrollY` is approximately 500px
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

- [ ] Navigate to `/movie`, scroll to 500px, navigate to `/movie/123`, click browser back
  - Expected: `window.scrollY` is approximately 500px
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

- [ ] Navigate to `/movie`, scroll to 500px, navigate to `/movie/123`, back, forward
  - Expected: On `/movie/123`, scroll is at top (new page)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

- [ ] Verify sessionStorage persistence
  - Expected: `sessionStorage.getItem('scroll-positions-/movie')` equals '500'
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## List/Grid Pages

### Infinite Scroll Coordination
- [ ] Navigate to `/movie`, scroll to trigger 3 page loads, navigate away, return
  - Expected: All 3 pages of data are present, scroll position restored
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Tab Switches - Independent Scroll
- [ ] Navigate to `/movie`, scroll "Popular" tab to 500px, switch to "Top Rated", scroll to 300px, switch back
  - Expected: "Popular" tab scroll is 500px, "Top Rated" tab scroll is 300px
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Filter Changes - Reset Scroll
- [ ] Navigate to `/movie`, scroll to 500px, change genre filter
  - Expected: Scroll resets to top, new filtered data is shown
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Sort Changes - Maintain Scroll
- [ ] Navigate to `/movie`, scroll to 500px, change sort order
  - Expected: Scroll position maintained, data is re-sorted
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### State Persistence - Page Number
- [ ] Navigate to `/movie`, load 3 pages, navigate away, return
  - Expected: `sessionStorage` contains page number 3, all 3 pages of data are loaded
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## Detail Pages

### Tab-Specific Restoration
- [ ] Navigate to `/movie/123`, scroll "About" tab to 500px, switch to "Cast", scroll to 300px, switch back
  - Expected: "About" tab scroll is 500px, "Cast" tab scroll is 300px
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Dynamic Content Hydration
- [ ] Navigate to `/movie/123`, immediately switch to "Cast" tab (before data loads)
  - Expected: Scroll restoration waits for cast data to load before restoring
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Recommendations Section
- [ ] Navigate to `/movie/123`, scroll "More Like This" row horizontally to 200px, navigate away, return
  - Expected: Horizontal scroll in "More Like This" row is 200px
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## Player Page

### Media-Type Specific Keys
- [ ] Navigate to `/watch/movie/123`, scroll to 500px, navigate away, return
  - Expected: Scroll position is 500px, storage key is `scroll-player-movie-123`
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Season-Specific Scroll
- [ ] Navigate to `/watch/tv/456/1/1`, scroll to 500px, navigate to `/watch/tv/456/2/1`, scroll to 300px, go back
  - Expected: S1 scroll is 500px (key: `scroll-player-tv-456-1`), S2 scroll is 300px (key: `scroll-player-tv-456-2`)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Episode Sidebar Element Scroll
- [ ] Navigate to `/watch/tv/456/1/1`, scroll episode sidebar to episode 10, navigate away, return
  - Expected: Episode sidebar scroll restored to episode 10 area
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## Profile/WatchHistory

### Tab-Specific Restoration
- [ ] Navigate to `/profile`, scroll "Watch History" tab to 500px, switch to "Favorites", scroll to 300px, switch back
  - Expected: "Watch History" tab scroll is 500px, "Favorites" tab scroll is 300px
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Lazy-Loaded Tabs
- [ ] Navigate to `/profile`, immediately switch to "Watch History" tab (before data loads)
  - Expected: Scroll restoration waits for data to load before restoring
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## Index Page

### Phased Content Loading
- [ ] Navigate to `/`, scroll to 500px, wait for all content to load, navigate away, return
  - Expected: Scroll position restored after all content is loaded
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Multiple ContentRows
- [ ] Navigate to `/`, scroll different ContentRows to different positions, navigate away, return
  - Expected: Each ContentRow maintains its own horizontal scroll position
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## ContentRow

### Per-Row Horizontal Restoration
- [ ] Scroll multiple ContentRows on the same page to different positions
  - Expected: Each ContentRow maintains independent scroll position
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Arrow Navigation
- [ ] Use arrow buttons to scroll a ContentRow, navigate away, return
  - Expected: Scroll position preserved from arrow navigation
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Haptic Feedback
- [ ] Scroll to ContentRow edges using touch or arrows
  - Expected: Haptic feedback triggered when reaching edges
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## Edge Cases

### Rapid Navigation
- [ ] Rapidly click 5 links in succession (< 1 second between clicks)
  - Expected: No errors, final page scroll is correct, no scroll jumps
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### SessionStorage Quota Exceeded
- [ ] Fill sessionStorage to near-quota, navigate to `/movie`, scroll, navigate away
  - Expected: Graceful handling (cleanup or error message), no app crash
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Empty Page - No Data
- [ ] Navigate to `/search?q=nonexistentmovie123456` (no results), scroll
  - Expected: No errors, scroll at top when returning
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Slow Network - Hydration Timeout
- [ ] Throttle network to "Slow 3G", navigate to `/movie`, scroll
  - Expected: Scroll restoration happens within 2 seconds (fallback timeout)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Browser Tab Switch
- [ ] Navigate to `/movie`, scroll to 500px, open new tab with same URL, scroll to 300px, switch back to first tab
  - Expected: First tab scroll is still 500px (independent sessionStorage per tab)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Incognito Mode
- [ ] Run all basic tests in incognito mode
  - Expected: Graceful fallback (scroll to top), no errors
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Browser Back/Forward - Rapid Clicks
- [ ] Navigate through 5 pages, rapidly click back 5 times, rapidly click forward 5 times
  - Expected: Scroll positions correct at each step, no errors
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Filter Mismatch - Browser Back
- [ ] Navigate to `/movie`, change genre filter, navigate to `/movie/123`, browser back
  - Expected: Correct filtered data shown (not cached from previous filter)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## Mobile vs Desktop

### Touch Scrolling
- [ ] Test touch scrolling on mobile devices
  - Expected: Scroll restoration works correctly with touch events
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Mouse Wheel
- [ ] Test mouse wheel scrolling on desktop
  - Expected: Scroll restoration works correctly with mouse wheel
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Hybrid Input
- [ ] Test on devices with both touch and mouse support
  - Expected: Scroll restoration works correctly with both input types
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

## Performance Tests

### Memory Leak Detection
- [ ] Navigate between 50 pages, measure memory usage before and after
  - Expected: Memory usage increase is < 10MB, no detached DOM nodes
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### SessionStorage Write Frequency
- [ ] Scroll continuously for 10 seconds, count sessionStorage writes
  - Expected: < 100 writes (debouncing effective, ~10 writes/second max)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Restoration Time
- [ ] Navigate to `/movie`, scroll to 500px, navigate away, return, measure time to restoration
  - Expected: Restoration completes in < 100ms
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Re-render Count
- [ ] Use React DevTools Profiler, navigate to `/movie`, scroll, navigate away, return
  - Expected: < 5 re-renders during restoration process
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Event Listener Cleanup
- [ ] Navigate to `/movie`, check event listener count, navigate away, check again
  - Expected: Event listeners are removed (no leak)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### Hydration Time
- [ ] Navigate to `/movie`, measure time from page load to hydration complete
  - Expected: Hydration completes in < 500ms (normal network)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail

### SessionStorage Size
- [ ] Load 10 pages with full state persistence, measure sessionStorage size
  - Expected: < 1MB total (reasonable usage)
  - Actual: ____________
  - Status: [ ] Pass [ ] Fail