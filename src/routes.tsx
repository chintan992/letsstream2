import { Routes, Route, Outlet } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { lazyLoadWithRetry } from "./utils/lazy-load-with-retry";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AnalyticsWrapper } from "@/components/AnalyticsWrapper";

// Lazy load pages
const Index = lazyLoadWithRetry(() => import("./pages/Index"));
const Login = lazyLoadWithRetry(() => import("./pages/Login"));
const Signup = lazyLoadWithRetry(() => import("./pages/Signup"));
const Profile = lazyLoadWithRetry(() => import("./pages/Profile"));
const Movies = lazyLoadWithRetry(() => import("./pages/Movies"));
const TVShowsPage = lazyLoadWithRetry(() => import("./pages/tv"));
const Sports = lazyLoadWithRetry(() => import("./pages/Sports"));
const Search = lazyLoadWithRetry(() => import("./pages/Search"));
const WatchHistory = lazyLoadWithRetry(() => import("./pages/WatchHistory"));
const MovieDetails = lazyLoadWithRetry(() => import("./pages/MovieDetails"));
const TVDetails = lazyLoadWithRetry(() => import("./pages/TVDetails"));
const SportMatchPlayer = lazyLoadWithRetry(() => import("./pages/SportMatchPlayer"));
const Player = lazyLoadWithRetry(() => import("./pages/Player"));
const NotFound = lazyLoadWithRetry(() => import("./pages/NotFound"));
const Trending = lazyLoadWithRetry(() => import("./pages/Trending"));

// Live streams pages
const LiveStreams = lazyLoadWithRetry(() => import("./pages/LiveStreams"));
const LiveStreamPlayer = lazyLoadWithRetry(() => import("./pages/LiveStreamPlayer"));

// Legal pages
const PrivacyPolicy = lazyLoadWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyLoadWithRetry(() => import("./pages/TermsOfService"));
const ContentRemoval = lazyLoadWithRetry(() => import("./pages/ContentRemoval"));
const DMCANotice = lazyLoadWithRetry(() => import("./pages/DMCANotice"));

export default function AppRoutes() {
  const enableManualRestoration =
    import.meta.env.VITE_SCROLL_RESTORATION_MANUAL === "true";

  useEffect(() => {
    // Set scroll restoration to manual to prevent browser's default behavior
    // Only enable this after all pages have integrated useScrollRestoration
    if (enableManualRestoration && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Cleanup on unmount
    return () => {
      if (enableManualRestoration && "scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, [enableManualRestoration]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyticsWrapper>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="/profile" element={<Profile />} />
            <Route path="/watch-history" element={<WatchHistory />} />
          </Route>

          {/* Content routes */}
          <Route path="/movie" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/tv" element={<TVShowsPage />} />
          <Route path="/tv/:id" element={<TVDetails />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/sports/player/:id" element={<SportMatchPlayer />} />
          <Route path="/watch/:type/:id" element={<Player />} />
          <Route
            path="/watch/:type/:id/:season/:episode"
            element={<Player />}
          />
          <Route path="/search" element={<Search />} />
          <Route path="/trending" element={<Trending />} />

          {/* Live streams routes */}
          <Route path="/live" element={<LiveStreams />} />
          <Route path="/watch/live/:id" element={<LiveStreamPlayer />} />

          {/* Legal routes */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/content-removal" element={<ContentRemoval />} />
          <Route path="/dmca" element={<DMCANotice />} />

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnalyticsWrapper>
    </Suspense>
  );
}
