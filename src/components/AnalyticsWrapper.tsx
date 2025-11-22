import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/analytics";

interface AnalyticsWrapperProps {
  children: React.ReactNode;
}

export function AnalyticsWrapper({ children }: AnalyticsWrapperProps) {
  const location = useLocation();
  const prevPathnameRef = useRef(location.pathname);

  useEffect(() => {
    // Save the previous page's scroll position under its pathname key
    // This captures the scroll before location changes and scroll resets
    const currentScroll = window.scrollY;
    if (currentScroll > 0 && prevPathnameRef.current !== location.pathname) {
      try {
        if (typeof sessionStorage !== "undefined") {
          const key = `scroll-positions-${prevPathnameRef.current}`;
          sessionStorage.setItem(key, currentScroll.toString());
        }
      } catch (error) {
        // Silently handle errors (e.g., privacy mode)
      }
    }

    // Update the ref to current pathname for next navigation
    prevPathnameRef.current = location.pathname;

    // Track page view on route change
    trackPageView(location.pathname);
  }, [location]);

  return <>{children}</>;
}
