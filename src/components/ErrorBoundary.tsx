import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    console.error("Uncaught error:", error, errorInfo);

    this.props.onError?.(error, errorInfo);

    // Dispatch custom event for toast notification
    window.dispatchEvent(
      new CustomEvent("app-error", {
        detail: {
          title: "Something went wrong",
          description: "An unexpected error occurred. Please try refreshing the page.",
          variant: "destructive",
        },
      })
    );
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex min-h-[400px] items-center justify-center px-4 bg-background"
          role="alert"
        >
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
            <h1 className="mb-2 text-2xl font-bold text-white">
              Something went wrong
            </h1>
            <p className="mb-6 text-white/70">
              An unexpected error occurred. Please try again or refresh the page.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={this.handleRetry}
                className="gap-2"
                size="lg"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
                size="lg"
              >
                Refresh Page
              </Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left max-w-md mx-auto">
                <summary className="cursor-pointer text-sm text-white/50">
                  Error Details (Development)
                </summary>
                <pre className="mt-4 overflow-auto rounded bg-black/50 p-4 text-xs text-white/80">
                  {this.state.error?.stack || this.state.error?.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}