import React, { useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
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
  }, [toast]);

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
      const userCredential = await retryWithBackoff(async () => {
        return await signInWithEmailAndPassword(auth, email, password);
      });

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        toast({
          title: "Email Not Verified",
          description:
            "Please verify your email before signing in. Check your inbox for the verification link.",
          variant: "destructive",
        });
        throw new Error("Email not verified");
      }

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
    let userCreated = false;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      userCreated = true;

      // Send email verification with retry mechanism
      try {
        await retryWithBackoff(async () => {
          return await sendEmailVerification(userCredential.user);
        });
      } catch (verificationError) {
        // Still sign out even if verification fails
        try {
          await signOut(auth);
        } catch {
          // Ignore signout error
        }
        toast({
          title: "Account Created – Verification Failed",
          description:
            "Your account was created but we couldn't send the verification email. Please try again later or contact support.",
          variant: "destructive",
        });
        throw verificationError;
      }

      // Sign out the user until they verify their email
      try {
        await retryWithBackoff(async () => {
          return await signOut(auth);
        });
      } catch {
        // Ignore signout error - user is already created
      }

      toast({
        title: "Account Created",
        description:
          "Please check your email to verify your account before signing in.",
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
      // Use retry mechanism for network-related operations
      await retryWithBackoff(async () => {
        return await signInWithPopup(auth, provider);
      });
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

  const resetPassword = async (email: string) => {
    try {
      await retryWithBackoff(async () => {
        return await sendPasswordResetEmail(auth, email);
      });
      toast({
        title: "Password Reset Email Sent",
        description:
          "Check your email for instructions to reset your password.",
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
        throw error;
      }
      toast({
        title: "Reset Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) {
      toast({
        title: "No User",
        description: "You must be signed in to verify your email.",
        variant: "destructive",
      });
      throw new Error("No user signed in");
    }
    try {
      await retryWithBackoff(async () => {
        return await sendEmailVerification(user);
      });
      toast({
        title: "Verification Email Sent",
        description: "Check your email for the verification link.",
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
        throw error;
      }
      toast({
        title: "Verification Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      throw error;
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
        resetPassword,
        sendVerificationEmail,
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
