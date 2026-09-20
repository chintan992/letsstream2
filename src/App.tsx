import React, { useEffect, useState, useRef } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { BrowserRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./contexts/theme";
import { UserPreferencesProvider } from "./contexts/user-preferences";
import { WatchHistoryProvider } from "./contexts/watch-history-context";
import { FavoritesProvider } from "./contexts/favorites-context";
import { WatchlistProvider } from "./contexts/watchlist-context";
import { UserProfileProvider } from "./contexts/user-profile-context";
import { NotificationProvider } from "./contexts/notification-context";
import { ServiceWorkerErrorBoundary } from "./components/ServiceWorkerErrorBoundary";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ServiceWorkerDebugPanel } from "./components/ServiceWorkerDebugPanel";
import { AuthProvider } from "./hooks/auth-context";
import { ChatbotProvider } from "./contexts/chatbot-context";
import ChatbotButton from "./components/chatbot/ChatbotButton";
import ChatbotWindow from "./components/chatbot/ChatbotWindow";
import ProactiveSuggestions from "./components/chatbot/ProactiveSuggestions";
import SEO from "./components/SEO";
import AppRoutes from "./routes.tsx";
import { useToast } from "./components/ui/use-toast";
import "./styles/notifications.css";
import { FeatureNotificationsListener } from "./hooks/FeatureNotificationsListener";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 60 * 24,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
      },
      mutations: {
        retry: 1,
      },
    },
  });

function QueryClientProviderWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const client = createQueryClient();
    setQueryClient(client);
  }, []);

  if (!queryClient) {
    return <div>Initializing...</div>;
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function App() {
  const isDevelopment = import.meta.env.DEV;
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (event: CustomEvent) => {
      const { title, description, variant } = event.detail;
      toast({ title, description, variant });
    };

    window.addEventListener("app-error", handleError as EventListener);
    return () => window.removeEventListener("app-error", handleError as EventListener);
  }, [toast]);

  return (
    <HelmetProvider>
      <SEO themeColor="#000000" />
      <QueryClientProviderWrapper>
        <BrowserRouter>
          <LazyMotion features={domAnimation}>
            <ServiceWorkerErrorBoundary>
              <ErrorBoundary>
                <ThemeProvider>
                  <NotificationProvider>
                    <AuthProvider>
                      <UserPreferencesProvider>
                        <WatchHistoryProvider>
                          <FavoritesProvider>
                            <WatchlistProvider>
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
                            </WatchlistProvider>
                          </FavoritesProvider>
                        </WatchHistoryProvider>
                      </UserPreferencesProvider>
                    </AuthProvider>
                  </NotificationProvider>
                </ThemeProvider>
              </ErrorBoundary>
            </ServiceWorkerErrorBoundary>
          </LazyMotion>
        </BrowserRouter>
      </QueryClientProviderWrapper>
    </HelmetProvider>
  );
}

export default App;