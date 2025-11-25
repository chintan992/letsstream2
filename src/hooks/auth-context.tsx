import React, { useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AuthContext, AuthContextType } from "@/contexts/auth";

import {
  getAuthErrorConfig,
  formatAuthError,
  isNetworkError,
} from "@/utils/auth-errors";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        // User is signed in
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthError = (error: FirebaseError) => {
    const errorConfig = formatAuthError(error.code);
    toast({
      title: errorConfig.title,
      description: errorConfig.suggestion
        ? `${errorConfig.description} ${errorConfig.suggestion}`
        : errorConfig.description,
      variant: "destructive",
    });
    // Re-throw the error so the calling component can handle it
    throw error;
  };

  const signIn = async (email: string, password: string) => {
    try {
      await retryWithBackoff(async () => {
        return await signInWithEmailAndPassword(auth, email, password);
      });
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        const errorConfig = formatAuthError(error.code);
        toast({
          title: errorConfig.title,
          description: errorConfig.suggestion
            ? `${errorConfig.description} ${errorConfig.suggestion}`
            : errorConfig.description,
          variant: "destructive",
        });
        throw error; // Propagate the error so the calling component can handle it
      }
      // Optionally handle non-Firebase errors here
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      throw error; // Propagate the error so the calling component can handle it
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        // Handle specific Firebase Auth errors with user-friendly messages
        switch (error.code) {
          case "auth/email-already-in-use":
            toast({
              title: "Account Issue",
              description:
                "An account with this email already exists. Please use a different email or sign in to your existing account.",
              variant: "destructive",
            });
            throw error; // Propagate the error so the calling component can handle it
            break;
          case "auth/invalid-email":
            toast({
              title: "Account Issue",
              description:
                "The email address format is not correct. Please enter a valid email like example@domain.com",
              variant: "destructive",
            });
            throw error; // Propagate the error so the calling component can handle it
            break;
          case "auth/weak-password":
            toast({
              title: "Account Issue",
              description:
                "Your password is too weak. Please create a stronger password with at least 6 characters.",
              variant: "destructive",
            });
            throw error; // Propagate the error so the calling component can handle it
            break;
          case "auth/too-many-requests":
            toast({
              title: "Too Many Attempts",
              description:
                "We've noticed multiple failed attempts. Please wait a few minutes before trying again.",
              variant: "destructive",
            });
            throw error; // Propagate the error so the calling component can handle it
            break;
          default:
            // For any other authentication errors, use the general error handler
            handleAuthError(error);
            throw error; // Propagate the error so the calling component can handle it
            break;
        }
      }
      // Optionally handle non-Firebase errors here
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      throw error; // Propagate the error so the calling component can handle it
    }
  };

  // Note: To fully resolve COOP/COEP issues with popup authentication,
  // ensure your server sets these headers:
  // Cross-Origin-Opener-Policy: same-origin
  // Cross-Origin-Embedder-Policy: require-corp
  // This is required for secure popup window handling in modern browsers.

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const popup = window.open("", "_blank");
      if (popup) {
        popup.close(); // Preload and close to avoid popup blockers
      }
      // Use retry mechanism for network-related operations
      await retryWithBackoff(async () => {
        return await signInWithPopup(auth, provider);
      });
      // Check if popup was closed by user
      if (popup && popup.closed) {
        toast({
          title: "Popup Closed",
          description:
            "Authentication popup was closed before completing sign-in.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Welcome!",
        description: "You have successfully signed in with Google.",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        const errorConfig = formatAuthError(error.code);

        // Special handling for specific error cases
        if (error.code === "auth/cancelled-popup-request") {
          // This error can happen when multiple popups are triggered, we can ignore it quietly
          return; // Just return without throwing for this specific case
        }

        toast({
          title: errorConfig.title,
          description: errorConfig.suggestion
            ? `${errorConfig.description} ${errorConfig.suggestion}`
            : errorConfig.description,
          variant: "destructive",
        });
        throw error; // Propagate the error so the calling component can handle it
      }
      // Optionally handle non-Firebase errors here
      toast({
        title: "Sign In Failed",
        description:
          "An unexpected error occurred during Google sign-in. Please try again.",
        variant: "destructive",
      });
      throw error; // Propagate the error so the calling component can handle it
    }
  };

  const logout = async () => {
    console.log("logout function called");
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleAuthError(error);
        return;
      }
      // Optionally handle non-Firebase errors here
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Helper function to retry operations with exponential backoff
const retryWithBackoff = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000 // 1 second
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Only retry on network errors
      if (
        error instanceof FirebaseError &&
        isNetworkError(error.code) &&
        attempt < maxRetries
      ) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(
          `Network error occurred, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // If it's not a network error or we're out of retries, re-throw
        throw error;
      }
    }
  }
  throw new Error("Max retries reached");
};
