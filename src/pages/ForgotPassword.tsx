import { useState } from "react";
import {
  triggerHapticFeedback,
  triggerSuccessHaptic,
} from "@/utils/haptic-feedback";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import SEO from "@/components/SEO";
import AuthLayout from "@/components/auth/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback(20);
    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);
    setIsLoading(true);
    try {
      await resetPassword(trimmedEmail);
      triggerSuccessHaptic();
      setEmailSent(true);
    } catch (error) {
      // Error is handled in auth context (toast)
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout>
        <SEO title="Password Reset Sent" noIndex={true} />
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <h1 className="text-2xl font-bold">Check Your Email</h1>
            <CardDescription>
              We've sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Click the link in the email to reset your password. If you don't
              see it, check your spam folder.
            </p>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <SEO
        title="Reset Password"
        description="Reset your Let's Stream account password."
        noIndex={true}
      />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your
            password
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
                autoComplete="username"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
