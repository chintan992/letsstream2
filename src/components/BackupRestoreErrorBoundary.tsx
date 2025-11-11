import React, { Component, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class BackupRestoreErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "BackupRestore Error Boundary caught an error:",
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    // Log to analytics if available
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "exception", {
        description: `BackupRestore Error: ${error.message}`,
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">
                Something went wrong
              </CardTitle>
            </div>
            <CardDescription>
              The backup and restore feature encountered an unexpected error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p className="font-mono text-sm">
                    {this.state.error?.message || "Unknown error occurred"}
                  </p>
                  {process.env.NODE_ENV === "development" &&
                    this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          Stack Trace (Development Only)
                        </summary>
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                          {this.state.error?.stack}
                        </pre>
                      </details>
                    )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="default">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                If this problem persists, please contact support with the error
                details above.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
