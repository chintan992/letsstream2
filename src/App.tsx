import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/theme';
import { UserPreferencesProvider } from './contexts/user-preferences';
import { WatchHistoryProvider } from './contexts/watch-history';
import { UserProfileProvider } from './contexts/user-profile-context';
import { NotificationProvider } from './contexts/notification-context';
import { ServiceWorkerErrorBoundary } from './components/ServiceWorkerErrorBoundary';
import { ServiceWorkerUpdateNotification } from './components/ServiceWorkerUpdateNotification';
import { ServiceWorkerDebugPanel } from './components/ServiceWorkerDebugPanel';
import { AuthProvider } from './hooks/auth-context';
import { ChatbotProvider } from './contexts/chatbot-context';
import ChatbotButton from './components/chatbot/ChatbotButton';
import ChatbotWindow from './components/chatbot/ChatbotWindow';
import ProactiveSuggestions from './components/chatbot/ProactiveSuggestions';
import AppRoutes from './routes.tsx';
// ...existing code...
import { trackPageView } from './lib/analytics';
import './styles/notifications.css';
import { FeatureNotificationsListener } from './hooks/FeatureNotificationsListener';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname);
  }, [location]);

  return <>{children}</>;
}


function App() {
  const isDevelopment = import.meta.env.DEV;
  const [swUpdateAvailable, setSwUpdateAvailable] = React.useState(false);

  // React.useEffect(() => {
  // ...existing code...
  // }, []);


  /**
   * Handles acceptance of a service worker update.
   * Sends a message to the waiting service worker to skip waiting,
   * and reloads the page when the new service worker takes control.
   * Enhanced with error handling and user notification.
   */
  const handleSwUpdateAccept = () => {
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      // Listen for controllerchange and reload when new SW takes control
      const reloadOnControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', reloadOnControllerChange, { once: true });
    } catch (err) {
      console.error('Error during service worker update acceptance:', err);
      if (window && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Update Error', {
              body: 'Failed to apply the update. Please refresh the page manually.',
            });
          }
        });
      }
    }
  };
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
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ServiceWorkerErrorBoundary>
          <ThemeProvider>
            <NotificationProvider>
              <AuthProvider>
                <UserPreferencesProvider>
                  <WatchHistoryProvider>
                    <UserProfileProvider>
                      <ChatbotProvider>
                      <AnalyticsWrapper>
                        <FeatureNotificationsListener />
                        {swUpdateAvailable && (
                          <ServiceWorkerUpdateNotification 
                            onAcceptUpdate={handleSwUpdateAccept}
                            onDismiss={() => setSwUpdateAvailable(false)}
                          />
                        )}
                        {isDevelopment && <ServiceWorkerDebugPanel />}
                        <AppRoutes />
                        <ChatbotButton />
                        <ChatbotWindow />
                        <ProactiveSuggestions />
                        </AnalyticsWrapper>
                      </ChatbotProvider>
                    </UserProfileProvider>
                  </WatchHistoryProvider>
                </UserPreferencesProvider>
              </AuthProvider>
            </NotificationProvider>
          </ThemeProvider>
        </ServiceWorkerErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
