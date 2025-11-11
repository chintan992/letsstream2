import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/analytics";

interface AnalyticsWrapperProps {
  children: React.ReactNode;
}

export function AnalyticsWrapper({ children }: AnalyticsWrapperProps) {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname);
  }, [location]);

  return <>{children}</>;
}
