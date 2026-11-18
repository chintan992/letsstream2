import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * Renders the toasts queued by `useToast()` / `toast()`.
 *
 * The toast store in `src/hooks/use-toast.ts` is a module-level reducer, so
 * nothing is displayed until a viewport is mounted. Mount exactly one
 * <Toaster /> near the root of the app.
 */
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastPrimitives.Provider swipeDirection="right">
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <ToastPrimitives.Root
          key={id}
          className={cn(
            "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-10 shadow-lg backdrop-blur-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out",
            "data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-full",
            "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
            variant === "destructive"
              ? "border-error/40 bg-error/15 text-foreground"
              : "bg-background/95 border-white/10 text-foreground",
            props.className
          )}
          {...props}
        >
          <div className="flex-1 space-y-1">
            {title ? (
              <ToastPrimitives.Title className="text-sm font-semibold leading-tight">
                {title}
              </ToastPrimitives.Title>
            ) : null}
            {description ? (
              <ToastPrimitives.Description className="text-sm leading-snug text-muted-foreground">
                {description}
              </ToastPrimitives.Description>
            ) : null}
          </div>
          {action}
          <ToastPrimitives.Close
            aria-label="Dismiss notification"
            onClick={() => dismiss(id)}
            className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </ToastPrimitives.Close>
        </ToastPrimitives.Root>
      ))}
      {/* Anchored to the bottom at every width: at the top a full-width toast
          covered the navbar and its logo. */}
      <ToastPrimitives.Viewport className="fixed inset-x-0 bottom-0 z-[100] flex w-full flex-col gap-2 p-4 sm:inset-x-auto sm:right-0 sm:w-[380px] sm:p-6" />
    </ToastPrimitives.Provider>
  );
}

export default Toaster;
