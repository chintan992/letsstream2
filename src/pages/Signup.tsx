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
import {
  validatePassword,
  getStrengthLabel,
} from "@/utils/password-validation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<ReturnType<
    typeof validatePassword
  > | null>(null);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0) {
      setPasswordValidation(validatePassword(value));
    } else {
      setPasswordValidation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback(20);

    // Validate password before submission
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setErrorMessage(validation.errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signUp(email, password);
      triggerSuccessHaptic();
      await trackEvent({
        name: "user_signup",
        params: {
          method: "email",
          email,
        },
      });
      navigate("/login");
    } catch (error) {
      // Error toast is handled by AuthProvider
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
        name: "user_signup",
        params: {
          method: "google",
        },
      });
      navigate("/");
    } catch (error) {
      // Error toast is handled by AuthProvider
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => handlePasswordChange(e.target.value)}
                required
              />
              {passwordValidation && (
                <div className="space-y-1">
                  <div className="flex gap-1" role="none">
                    <div
                      aria-hidden="true"
                      className={`h-1 flex-1 rounded ${passwordValidation.strength === "weak" ? "bg-red-500" : passwordValidation.strength === "fair" ? "bg-orange-500" : passwordValidation.strength === "good" ? "bg-yellow-500" : "bg-green-500"}`}
                    />
                    <div
                      aria-hidden="true"
                      className={`h-1 flex-1 rounded ${passwordValidation.strength === "fair" || passwordValidation.strength === "good" || passwordValidation.strength === "strong" ? (passwordValidation.strength === "strong" ? "bg-green-500" : passwordValidation.strength === "good" ? "bg-yellow-500" : "bg-orange-500") : "bg-gray-600"}`}
                    />
                    <div
                      aria-hidden="true"
                      className={`h-1 flex-1 rounded ${passwordValidation.strength === "good" || passwordValidation.strength === "strong" ? (passwordValidation.strength === "strong" ? "bg-green-500" : "bg-yellow-500") : "bg-gray-600"}`}
                    />
                    <div
                      aria-hidden="true"
                      className={`h-1 flex-1 rounded ${passwordValidation.strength === "strong" ? "bg-green-500" : "bg-gray-600"}`}
                    />
                  </div>
                  <p
                    aria-live="polite"
                    role="status"
                    className={`text-xs ${
                      passwordValidation.strength === "weak"
                        ? "text-red-500"
                        : passwordValidation.strength === "fair"
                          ? "text-orange-500"
                          : passwordValidation.strength === "good"
                            ? "text-yellow-500"
                            : "text-green-500"
                    }`}
                  >
                    Password strength:{" "}
                    {getStrengthLabel(passwordValidation.strength)}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
            {errorMessage && (
              <div
                className="mt-2 text-center text-sm text-white/70"
                role="alert"
              >
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
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-white hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
