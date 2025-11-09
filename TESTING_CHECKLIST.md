# Manual Testing Checklist

**Purpose:** Verify all functionality after dependency updates or before releases
**Last Updated:** 2025-11-08
**Version:** 1.0

---

## Pre-Testing Setup

- [ ] Node.js version verified (20.19+ or 22.x)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env` file)
- [ ] Firebase project configured
- [ ] Production build completed (`npm run build`)
- [ ] Preview server running (`npm run preview`)

## Authentication Testing

- [ ] Login page loads without errors
- [ ] Email/password login works
- [ ] Invalid credentials show error message
- [ ] Signup page loads without errors
- [ ] User registration works
- [ ] Form validation works (email format, password strength)
- [ ] Google sign-in works (if configured)
- [ ] Logout works
- [ ] Protected routes redirect to login
- [ ] Authenticated users can access protected routes
- [ ] Session persistence works (refresh page while logged in)

## Content Browsing Testing

- [ ] Movies page loads and displays grid
- [ ] Movie cards display correctly (poster, title, rating)
- [ ] Movie card hover effects work
- [ ] Movie details page loads
- [ ] Movie details display correctly (cast, synopsis, trailer)
- [ ] TV shows page loads and displays grid
- [ ] TV show cards display correctly
- [ ] TV show details page loads
- [ ] Seasons and episodes display correctly
- [ ] Sports page loads
- [ ] Sports events display correctly
- [ ] Sports filtering works
- [ ] Trending page loads
- [ ] Live streams page loads

## Search Testing

- [ ] Search bar is accessible from navbar
- [ ] Search input accepts text
- [ ] Search suggestions appear (if implemented)
- [ ] Search results display for movies
- [ ] Search results display for TV shows
- [ ] Search results display for actors
- [ ] Empty search results handled gracefully
- [ ] Search pagination works (if implemented)

## Video Player Testing

- [ ] Video player loads on watch page
- [ ] Play button works
- [ ] Pause button works
- [ ] Volume controls work
- [ ] Mute/unmute works
- [ ] Fullscreen mode works
- [ ] Exit fullscreen works
- [ ] Video source selector displays
- [ ] Switching video sources works
- [ ] Quality selector works (if available)
- [ ] Video progress bar works
- [ ] Seeking works (click on progress bar)
- [ ] Episode navigation works (TV shows)
- [ ] Next episode button works
- [ ] Previous episode button works
- [ ] Auto-play next episode works (if implemented)

## User Profile Testing

- [ ] Profile page loads (requires authentication)
- [ ] Overview tab displays user stats
- [ ] Profile edit modal opens
- [ ] Profile edit form works
- [ ] Profile picture upload works (if implemented)
- [ ] Favorites tab displays favorites list
- [ ] Add to favorites works
- [ ] Remove from favorites works
- [ ] Watchlist tab displays watchlist
- [ ] Add to watchlist works
- [ ] Remove from watchlist works
- [ ] Preferences tab loads
- [ ] Accent color picker displays
- [ ] Changing accent color works
- [ ] Theme toggle works (dark/light)
- [ ] Backup tab loads
- [ ] Export backup works
- [ ] Import backup works

## Watch History Testing

- [ ] Watch history page loads
- [ ] Watch history items display
- [ ] Continue watching section displays
- [ ] Watch progress is accurate
- [ ] Clicking continue watching resumes video
- [ ] Delete watch history item works
- [ ] Clear all watch history works
- [ ] Watch history syncs across devices (if logged in)

## PWA Testing

- [ ] Service worker registers successfully
- [ ] Service worker is active (check DevTools)
- [ ] PWA manifest is valid
- [ ] Install prompt appears (desktop)
- [ ] Install prompt appears (mobile)
- [ ] Installing PWA works
- [ ] PWA opens as standalone app
- [ ] PWA icon displays correctly
- [ ] Offline page displays when offline
- [ ] Previously visited pages load offline
- [ ] Cached content displays offline
- [ ] Online sync works after reconnecting
- [ ] Service worker update notification appears
- [ ] Updating service worker works

## Firebase Integration Testing

- [ ] Firebase initializes without errors
- [ ] Firebase Analytics initializes (if supported)
- [ ] Firestore write operations work
- [ ] Firestore read operations work
- [ ] Firestore update operations work
- [ ] Firestore delete operations work
- [ ] Firestore queries work
- [ ] Firestore pagination works
- [ ] Offline persistence works
- [ ] Offline operations queue correctly
- [ ] Queued operations execute when online
- [ ] Analytics events are logged
- [ ] Analytics events appear in Firebase Console

## UI Components Testing

- [ ] Dialogs open and close correctly
- [ ] Dropdown menus work
- [ ] Tooltips appear on hover
- [ ] Tabs switch correctly
- [ ] Accordions expand/collapse
- [ ] Toast notifications appear
- [ ] Toast notifications dismiss
- [ ] Drawer/sheet opens (mobile menu)
- [ ] Drawer/sheet closes
- [ ] Carousel navigation works
- [ ] Progress bars display correctly
- [ ] Checkboxes toggle
- [ ] Switches toggle
- [ ] Select dropdowns work
- [ ] Calendar/date picker works (if used)
- [ ] Form validation displays errors
- [ ] Form submission works

## Routing Testing

- [ ] Home page (/) loads
- [ ] Movies page (/movies) loads
- [ ] TV shows page (/tv) loads
- [ ] Sports page (/sports) loads
- [ ] Search page (/search) loads
- [ ] Trending page (/trending) loads
- [ ] Live streams page (/live) loads
- [ ] Login page (/login) loads
- [ ] Signup page (/signup) loads
- [ ] Profile page (/profile) loads
- [ ] Watch history page (/watch-history) loads
- [ ] Movie details page (/movie/:id) loads
- [ ] TV details page (/tv/:id) loads
- [ ] Sports match page (/sports/:id) loads
- [ ] Watch page (/watch/:type/:id) loads
- [ ] Episode watch page (/watch/tv/:id/:season/:episode) loads
- [ ] 404 page displays for invalid routes
- [ ] Browser back button works
- [ ] Browser forward button works
- [ ] Direct URL navigation works
- [ ] Page refresh works on any route

## Responsive Design Testing

- [ ] Desktop (1920x1080) displays correctly
- [ ] Desktop (1366x768) displays correctly
- [ ] Tablet (768x1024) displays correctly
- [ ] Mobile (375x667) displays correctly
- [ ] Mobile (414x896) displays correctly
- [ ] Mobile menu works
- [ ] Touch interactions work on mobile
- [ ] All content is accessible on small screens
- [ ] Landscape orientation works
- [ ] Portrait orientation works
- [ ] No horizontal scrolling on mobile
- [ ] Text is readable on all screen sizes

## Performance Testing

- [ ] Lighthouse Performance score > 80
- [ ] Lighthouse Accessibility score > 90
- [ ] Lighthouse Best Practices score > 90
- [ ] Lighthouse SEO score > 80
- [ ] Lighthouse PWA score = 100
- [ ] Initial page load < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Images load quickly
- [ ] Images are lazy-loaded
- [ ] Code splitting is working
- [ ] Bundle size is reasonable
- [ ] No memory leaks (check DevTools Memory)

## Browser Compatibility Testing

- [ ] Chrome (latest) works
- [ ] Edge (latest) works
- [ ] Firefox (latest) works
- [ ] Safari (latest) works
- [ ] Chrome Mobile works
- [ ] Safari iOS works
- [ ] No console errors in any browser
- [ ] Service worker works in all browsers
- [ ] PWA install works in all browsers

## Error Handling Testing

- [ ] Network errors display user-friendly messages
- [ ] API errors are handled gracefully
- [ ] 404 errors show 404 page
- [ ] Firebase errors are caught and displayed
- [ ] Form validation errors are clear
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Error boundaries catch React errors

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Screen reader labels are present
- [ ] ARIA attributes are correct
- [ ] Color contrast meets WCAG standards
- [ ] Images have alt text
- [ ] Forms have proper labels
- [ ] Buttons have descriptive text

---

## Post-Testing

- [ ] All critical issues documented
- [ ] All medium issues documented
- [ ] All low issues documented
- [ ] Test results shared with team
- [ ] GitHub issues created for bugs
- [ ] MIGRATION.md updated with findings

## Sign-off

- **Tester Name:** Chintan992
- **Date:** 2025-11-08
- **Build Version:** 
- **Overall Status:** ☐ Pass ☐ Pass with Issues ☐ Fail
- **Notes:** _______________