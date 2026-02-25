import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Load Firebase configuration from environment variables - no fallbacks to ensure proper project usage
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required Firebase config values are present
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.storageBucket ||
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  const missingKeys = [];
  if (!firebaseConfig.apiKey) missingKeys.push("VITE_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) missingKeys.push("VITE_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) missingKeys.push("VITE_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket)
    missingKeys.push("VITE_FIREBASE_STORAGE_BUCKET");
  if (!firebaseConfig.messagingSenderId)
    missingKeys.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
  if (!firebaseConfig.appId) missingKeys.push("VITE_FIREBASE_APP_ID");

  console.warn(`Missing required Firebase configuration environment variables: ${missingKeys.join(", ")}. 
  Please ensure all required Firebase environment variables are set in your .env file. 
  Refer to .env.example for the required variables.`);
}

// Initialize Firebase with specified config or get existing instance
let app: ReturnType<typeof initializeApp>;
const existingApps = getApps();
if (existingApps.length > 0) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
// Set Firebase Auth persistence to local storage to keep users logged in across browser sessions
auth.setPersistence(browserLocalPersistence).catch(error => {
  console.error(
    "Failed to set local persistence, falling back to session:",
    error
  );
  auth.setPersistence(browserSessionPersistence);
});

// Initialize analytics only if it's supported in the current environment
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

const initAnalytics = async () => {
  if (await isSupported()) {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  }
  return null;
};

// Get the analytics instance, initializing it if necessary
export const getAnalyticsInstance = async () => {
  if (!analyticsInstance) {
    return initAnalytics();
  }
  return analyticsInstance;
};

// Initialize Firestore with IndexedDB persistence for offline support and multi-tab sync.
// Falls back to in-memory cache in environments where IndexedDB is unavailable
// (e.g., private/incognito mode in Safari, certain WebViews).
let db: ReturnType<typeof initializeFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // Fallback for environments where IndexedDB is unavailable
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
}
export { db };

export const storage = getStorage(app);
