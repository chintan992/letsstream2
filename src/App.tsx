import React, { useEffect } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { BrowserRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/theme";
import { UserPreferencesProvider } from "./contexts/user-preferences";
import { WatchHistoryProvider } from "./contexts/watch-history";
import { UserProfileProvider } from "./contexts/user-profile-context";
import { NotificationProvider } from "./contexts/notification-context";
import { ServiceWorkerErrorBoundary } from "./components/ServiceWorkerErrorBoundary";
import { ServiceWorkerDebugPanel } from "./components/ServiceWorkerDebugPanel";
import { AuthProvider } from "./hooks/auth-context";
import { ChatbotProvider } from "./contexts/chatbot-context";
import ChatbotButton from "./components/chatbot/ChatbotButton";
import ChatbotWindow from "./components/chatbot/ChatbotWindow";
import ProactiveSuggestions from "./components/chatbot/ProactiveSuggestions";
import AppRoutes from "./routes.tsx";
// ...existing code...
import { trackPageView } from "./lib/analytics";
import "./styles/notifications.css";
import { FeatureNotificationsListener } from "./hooks/FeatureNotificationsListener";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function App() {
  const isDevelopment = import.meta.env.DEV;
  /*
   * Service Worker updates are handled automatically by vite-plugin-pwa (autoUpdate behavior)
   * and the lazyLoadWithRetry utility (reloading on ChunkLoadError).
   */
  /**
   * App component for the Let's Stream PWA.
   *
   * Handles service worker update notifications, error boundaries, and context providers.
   *
   * - Shows a notification when a new service worker is available.
   * - Handles update acceptance and reloads the app when the new service worker takes control.
   * - Provides enhanced error handling and user notifications for critical failures.
   */

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LazyMotion features={domAnimation}>
          <ServiceWorkerErrorBoundary>
            <ThemeProvider>
              <NotificationProvider>
                <AuthProvider>
                  <UserPreferencesProvider>
                    <WatchHistoryProvider>
                      <UserProfileProvider>
                        <ChatbotProvider>
                          <FeatureNotificationsListener />
                          {isDevelopment && <ServiceWorkerDebugPanel />}
                          <AppRoutes />
                          <ChatbotButton />
                          <ChatbotWindow />
                          <ProactiveSuggestions />
                        </ChatbotProvider>
                      </UserProfileProvider>
                    </WatchHistoryProvider>
                  </UserPreferencesProvider>
                </AuthProvider>
              </NotificationProvider>
            </ThemeProvider>
          </ServiceWorkerErrorBoundary>
        </LazyMotion>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
