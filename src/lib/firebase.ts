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
  getFirestore,
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
// Note: persistentLocalCache will throw when IndexedDB is unavailable (e.g., Safari private mode).
// Historically, a try/catch explicitly switched to memoryLocalCache to handle this failure mode.
// We now wrap the persistent initializeFirestore in a try/catch and fall back to getFirestore(app)
// so that a functional db is still returned even if IndexedDB is unavailable.
// Module-level boolean to track if this module initialized Firestore (for HMR and persistence checks)
interface FirestoreGlobal {
  firestoreInitializedInThisModule?: boolean;
}
const globalScope = globalThis as FirestoreGlobal;
let firestoreInitializedInThisModule =
  globalScope.firestoreInitializedInThisModule || false;

let db: ReturnType<typeof getFirestore>;

if (existingApps.length > 0) {
  // Check for an already-initialized Firestore instance and reuse it to prevent "failed-precondition"
  db = getFirestore(app);

  if (!firestoreInitializedInThisModule) {
    console.warn(
      "An App exists but firestoreInitializedInThisModule is false. Firestore persistence may not have been enabled. Reusing existing instance."
    );
  }
} else {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    firestoreInitializedInThisModule = true;
    globalScope.firestoreInitializedInThisModule = true;
  } catch (error) {
    console.warn(
      "Firestore initialization failed. Falling back to non-persistent getFirestore:",
      error
    );
    db = getFirestore(app);
  }
}

export { db };

export const storage = getStorage(app);
