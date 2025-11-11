import React, { Component, ErrorInfo, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ServiceWorkerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Service Worker error:", error, errorInfo);
    this.setState({ errorInfo });
    // Log error to analytics
    await trackEvent({
      name: "client_error",
      params: {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        boundary: "ServiceWorkerErrorBoundary",
      },
    });
  }

  private handleRetry = () => {
    // Reset error state and attempt to render again
    this.setState({ hasError: false, error: null, errorInfo: null });

    // Attempt to re-initialize service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });

        // Reload the page after unregistering
        window.location.reload();
      });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Service Worker Error</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              There was an issue with the service worker. Some features may not
              work properly.
            </p>
            <p className="mb-4 text-sm">
              {this.state.error?.message || "Unknown error"}
            </p>
            <Button size="sm" onClick={this.handleRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
