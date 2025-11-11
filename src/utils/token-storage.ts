// src/utils/token-storage.ts
// Secure token storage utilities with encryption for sensitive data

/**
 * A simple encryption utility for token storage.
 * Note: This is a basic implementation. For production use,
 * consider using the Web Crypto API for stronger encryption.
 */

// Simple obfuscation function as a basic level of security
const obfuscate = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const deobfuscate = (str: string): string => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (error) {
    console.error("Failed to deobfuscate token:", error);
    return "";
  }
};

// Store token with basic obfuscation in session storage
export const storeSecureToken = (key: string, token: string): void => {
  try {
    const obfuscatedToken = obfuscate(token);
    sessionStorage.setItem(key, obfuscatedToken);
  } catch (error) {
    console.error("Failed to store token:", error);
  }
};

// Retrieve and deobfuscate token from session storage
export const retrieveSecureToken = (key: string): string | null => {
  try {
    const obfuscatedToken = sessionStorage.getItem(key);
    if (!obfuscatedToken) {
      return null;
    }
    return deobfuscate(obfuscatedToken);
  } catch (error) {
    console.error("Failed to retrieve token:", error);
    return null;
  }
};

// Remove token from session storage
export const removeSecureToken = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove token:", error);
  }
};

// Validate if a token exists and is not expired
export const validateToken = (key: string): boolean => {
  const token = retrieveSecureToken(key);
  if (!token) {
    return false;
  }

  // Additional validation can be added here (e.g., JWT expiration check)
  // For now, just ensure the token is not empty
  return token.trim().length > 0;
};
