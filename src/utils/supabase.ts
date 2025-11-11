import { auth } from "@/lib/firebase";

// Generate a unique ID for database records
export const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

// Get the current user ID or generate an anonymous one for offline use
export const getUserId = () => {
  const user = auth.currentUser;
  if (user) return user.uid;

  // For offline or not logged in users, use a consistent local ID
  let anonymousId = localStorage.getItem("anonymous_user_id");
  if (!anonymousId) {
    anonymousId = `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("anonymous_user_id", anonymousId);
  }
  return anonymousId;
};

// Save data to localStorage with optional expiration
export const saveLocalData = <T>(key: string, data: T, ttl?: number) => {
  const item = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

// Get data from localStorage, respecting TTL if set
export const getLocalData = <T>(
  key: string,
  defaultValue: T | null = null
): T | null => {
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;

  try {
    const parsed = JSON.parse(item) as {
      data: T;
      timestamp: number;
      ttl?: number;
    };
    if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    return parsed.data;
  } catch {
    return defaultValue;
  }
};
