import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "localStorage", {
  writable: true,
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

Object.defineProperty(window, "sessionStorage", {
  writable: true,
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

Object.defineProperty(window, "crypto", {
  writable: true,
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).substring(7),
  },
});

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  browserLocalPersistence: "local",
  browserSessionPersistence: "session",
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => callback(null)),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
  })),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
  deleteField: vi.fn(),
}));

vi.mock("firebase/analytics", () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(false),
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClient: vi.fn(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: "/" }),
  Link: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  Routes: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  Route: () => null,
  Outlet: () => null,
}));

vi.mock("react-helmet-async", () => ({
  HelmetProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => React.createElement("div", props, children),
  },
  LazyMotion: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  domAnimation: [],
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  trackMediaView: vi.fn(),
  trackMediaPreference: vi.fn(),
}));

vi.mock("@/utils/haptic-feedback", () => ({
  triggerHapticFeedback: vi.fn(),
  triggerSuccessHaptic: vi.fn(),
}));

vi.mock("@/hooks/useHaptic", () => ({
  useHaptic: () => ({
    triggerHaptic: vi.fn(),
  }),
}));

vi.mock("@/hooks/auth-context", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    sendVerificationEmail: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/hooks/user-preferences", () => ({
  useUserPreferences: () => ({
    userPreferences: {
      isWatchHistoryEnabled: true,
      isSimklEnabled: false,
      preferred_source: "",
    },
    loading: false,
  }),
  UserPreferencesProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/contexts/watch-history-context", () => ({
  useWatchHistory: () => ({
    watchHistory: [],
    hasMore: false,
    isLoading: false,
    loadMore: vi.fn(),
    addToWatchHistory: vi.fn(),
    updateWatchPosition: vi.fn(),
    clearWatchHistory: vi.fn(),
    deleteWatchHistoryItem: vi.fn(),
    deleteSelectedWatchHistory: vi.fn(),
  }),
  WatchHistoryProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/contexts/favorites-context", () => ({
  useFavorites: () => ({
    favorites: [],
    isLoading: false,
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    isInFavorites: vi.fn(),
    deleteFavoriteItem: vi.fn(),
    deleteSelectedFavorites: vi.fn(),
  }),
  FavoritesProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/contexts/watchlist-context", () => ({
  useWatchlist: () => ({
    watchlist: [],
    isLoading: false,
    addToWatchlist: vi.fn(),
    removeFromWatchlist: vi.fn(),
    isInWatchlist: vi.fn(),
    deleteWatchlistItem: vi.fn(),
    deleteSelectedWatchlist: vi.fn(),
  }),
  WatchlistProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/contexts/user-profile-context", () => ({
  useUserProfile: () => ({
    profile: null,
    loading: false,
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
  }),
  UserProfileProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/contexts/notification-context", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/contexts/chatbot-context", () => ({
  useChatbot: () => ({
    messages: [],
    isOpen: false,
    sendMessage: vi.fn(),
    toggleChat: vi.fn(),
  }),
  ChatbotProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
  storage: {},
  getAnalyticsInstance: vi.fn(),
}));

console.error = vi.fn();
console.warn = vi.fn();