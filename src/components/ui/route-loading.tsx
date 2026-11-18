import React from "react";
import Spinner from "@/components/ui/spinner";

interface RouteLoadingProps {
  /** What is being waited on. Kept short: it sits under the spinner. */
  label?: string;
}

/**
 * The fallback the app shows while a route chunk loads or auth state resolves.
 * It used to be bare text, which flashed unstyled on the app's dark surface.
 */
const RouteLoading: React.FC<RouteLoadingProps> = ({ label = "Loading" }) => (
  <div
    className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background"
    role="status"
    aria-live="polite"
  >
    <Spinner size="lg" />
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <span className="sr-only">Please wait</span>
  </div>
);

export default RouteLoading;
