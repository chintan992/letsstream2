// Generate a unique ID for database records
export const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
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
