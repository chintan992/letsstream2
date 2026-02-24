import React from "react";
import { AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorStateProps {
  error: Error | null;
  onRetry?: () => void;
  isOffline?: boolean;
  title?: string;
  description?: string;
}

const ErrorState = ({
  error,
  onRetry,
  isOffline = false,
  title,
  description,
}: ErrorStateProps) => {
  const getErrorContent = () => {
    if (isOffline) {
      return {
        icon: <WifiOff className="h-16 w-16 text-white/30" />,
        title: "You're Offline",
        description:
          "Please check your internet connection and try again. We'll show you cached matches if available.",
      };
    }

    if (error) {
      return {
        icon: <AlertCircle className="h-16 w-16 text-red-400/70" />,
        title: title || "Something went wrong",
        description:
          description ||
          error.message ||
          "We couldn't load the matches. Please try again.",
      };
    }

    return {
      icon: <AlertCircle className="h-16 w-16 text-white/30" />,
      title: "Error",
      description: "An unexpected error occurred.",
    };
  };

  const content = getErrorContent();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12">
      <div className="mb-6">{content.icon}</div>

      <Alert className="mb-6 max-w-md border-red-500/20 bg-red-500/10">
        {isOffline ? (
          <WifiOff className="h-4 w-4 text-red-400" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-400" />
        )}
        <AlertTitle className="text-white">{content.title}</AlertTitle>
        <AlertDescription className="text-white/70">
          {content.description}
        </AlertDescription>
      </Alert>

      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2" size="lg">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}

      {isOffline && (
        <p className="mt-4 text-sm text-white/50">
          We'll automatically retry when you're back online
        </p>
      )}
    </div>
  );
};

export default ErrorState;
