import { createContext } from "react";
import { User } from "firebase/auth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Sends a password reset email to the specified address.
   * Note: For privacy, no email address is logged in error messages.
   * @param email - The email address to send the reset link to
   */
  resetPassword: (email: string) => Promise<void>;
  /**
   * Sends a verification email to the current user.
   * Requires a non-null authenticated user (user: User | null must not be null).
   * @throws Error if no user is currently authenticated
   */
  sendVerificationEmail: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
