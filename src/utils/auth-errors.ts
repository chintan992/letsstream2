// src/utils/auth-errors.ts
// Comprehensive mapping of Firebase Auth error codes to user-friendly messages with recovery suggestions

interface AuthErrorConfig {
  title: string;
  description: string;
  suggestion?: string;
  isNetworkError?: boolean;
}

// Map of Firebase Auth error codes to user-friendly messages
export const AUTH_ERROR_MESSAGES: Record<string, AuthErrorConfig> = {
  // Email/password errors
  "auth/invalid-email": {
    title: "Invalid Email",
    description: "The email address format is not correct.",
    suggestion: "Please enter a valid email like example@domain.com",
  },
  "auth/user-disabled": {
    title: "Account Disabled",
    description: "Your account has been disabled.",
    suggestion: "Please contact support for assistance.",
  },
  "auth/user-not-found": {
    title: "Account Not Found",
    description: "We couldn't find an account with this email address.",
    suggestion: "Please check your email or create a new account.",
  },
  "auth/wrong-password": {
    title: "Incorrect Password",
    description: "Your password is not correct.",
    suggestion: "Please try again or reset your password.",
  },
  "auth/too-many-requests": {
    title: "Too Many Attempts",
    description: "We've noticed multiple failed login attempts.",
    suggestion: "Please wait a few minutes before trying again.",
  },

  // Sign up specific errors
  "auth/email-already-in-use": {
    title: "Email Already in Use",
    description: "An account with this email already exists.",
    suggestion:
      "Please use a different email or sign in to your existing account.",
  },
  "auth/weak-password": {
    title: "Weak Password",
    description: "Your password is too weak.",
    suggestion:
      "Please create a stronger password with at least 6 characters, including uppercase, lowercase, and special characters.",
  },

  // Network/Connection errors
  "auth/network-request-failed": {
    title: "Connection Issue",
    description: "We couldn't connect to the internet.",
    suggestion: "Please check your connection and try again.",
    isNetworkError: true,
  },

  // Google sign-in specific errors
  "auth/popup-closed-by-user": {
    title: "Sign In Interrupted",
    description: "Google sign-in was canceled.",
    suggestion: "Please click the Google button again to continue.",
  },
  "auth/popup-blocked": {
    title: "Popup Blocked",
    description: "Your browser is blocking popups.",
    suggestion:
      "Please allow popups for this site in your browser settings and try again.",
  },
  "auth/cancelled-popup-request": {
    title: "Sign In Canceled",
    description: "Another sign in request may be in progress.",
    suggestion: "Please try again in a moment.",
  },

  // Phone auth errors (if needed in future)
  "auth/invalid-phone-number": {
    title: "Invalid Phone Number",
    description: "The phone number you entered is not valid.",
    suggestion: "Please enter a valid phone number in the correct format.",
  },
  "auth/missing-phone-number": {
    title: "Missing Phone Number",
    description: "No phone number was provided.",
    suggestion: "Please enter a phone number to continue.",
  },

  // Verification errors
  "auth/code-expired": {
    title: "Code Expired",
    description: "The verification code has expired.",
    suggestion: "Please request a new verification code and try again.",
  },
  "auth/invalid-verification-code": {
    title: "Invalid Verification Code",
    description: "The verification code you entered is not correct.",
    suggestion: "Please check your code and try again.",
  },
  "auth/missing-verification-code": {
    title: "Missing Verification Code",
    description: "No verification code was provided.",
    suggestion: "Please enter the verification code sent to you.",
  },

  // Other common errors
  "auth/operation-not-allowed": {
    title: "Operation Not Allowed",
    description: "This authentication method is not enabled for your account.",
    suggestion: "Please contact support or try a different sign-in method.",
  },
  "auth/credential-already-in-use": {
    title: "Account Already Linked",
    description: "This credential is already associated with another account.",
    suggestion: "Please sign in with the original account or unlink first.",
  },
  "auth/email-not-verified": {
    title: "Email Not Verified",
    description: "Your email address has not been verified.",
    suggestion: "Please check your email for a verification link.",
  },
};

// Default error configuration for unknown errors
export const DEFAULT_ERROR_CONFIG: AuthErrorConfig = {
  title: "Authentication Error",
  description: "An unexpected error occurred during authentication.",
  suggestion: "Please try again or contact support if the issue persists.",
};

/**
 * Gets the appropriate error configuration based on the Firebase error code
 * @param errorCode The Firebase Auth error code
 * @returns The corresponding AuthErrorConfig object
 */
export const getAuthErrorConfig = (errorCode: string): AuthErrorConfig => {
  return AUTH_ERROR_MESSAGES[errorCode] || DEFAULT_ERROR_CONFIG;
};

/**
 * Checks if a specific error is a network error
 * @param errorCode The Firebase Auth error code
 * @returns Boolean indicating if the error is a network error
 */
export const isNetworkError = (errorCode: string): boolean => {
  const config = getAuthErrorConfig(errorCode);
  return config.isNetworkError || false;
};

/**
 * Formats an error message with title, description, and suggestion
 * @param errorCode The Firebase Auth error code
 * @returns Formatted error message object
 */
export const formatAuthError = (errorCode: string) => {
  const config = getAuthErrorConfig(errorCode);
  return {
    title: config.title,
    description: config.description,
    suggestion: config.suggestion,
  };
};
