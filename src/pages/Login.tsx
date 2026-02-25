import { useState } from "react";
import {
  triggerHapticFeedback,
  triggerSuccessHaptic,
} from "@/utils/haptic-feedback";
import { useNavigate, Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatAuthError } from "@/utils/auth-errors";
// import { FcGoogle } from 'react-icons/fc'; // Removed colorful icon

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // The error handling is now done in the AuthProvider with proper toast notifications
  // This function is kept for potential inline error display if needed
  const getFriendlyError = (error: unknown) => {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string"
    ) {
      // Use the centralized error mapping
      const errorConfig = formatAuthError((error as { code: string }).code);
      // Combine description and suggestion for comprehensive message
      return errorConfig.suggestion
        ? `${errorConfig.description} ${errorConfig.suggestion}`
        : errorConfig.description;
    }
    return "We had trouble signing you in. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback(20);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signIn(email, password);
      triggerSuccessHaptic();
      await trackEvent({
        name: "user_login",
        params: {
          method: "email",
          email,
        },
      });
      navigate("/");
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error));
      // Error is also handled in auth context (toast)
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    triggerHapticFeedback(20);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      await trackEvent({
        name: "user_login",
        params: {
          method: "google",
        },
      });
      navigate("/");
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error));
      // Error is also handled in auth context (toast)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-center text-sm">
              <Link
                to="/forgot-password"
                className="text-muted-foreground hover:text-white"
              >
                Forgot password?
              </Link>
            </div>
            {errorMessage && (
              <div
                className="mt-2 text-center text-sm text-white/70"
                role="alert"
              >
                {" "}
                {/* Changed text-red-500 to text-white/70 */}
                {errorMessage}
              </div>
            )}
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {/* <FcGoogle className="mr-2 h-4 w-4" /> */}{" "}
            {/* Removed colorful icon */}
            Google {/* Replaced icon with text */}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-white hover:underline">
              {" "}
              {/* Changed text-primary to text-white */}
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
