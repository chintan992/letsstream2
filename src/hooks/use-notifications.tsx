import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ToastActionElement } from "@/components/ui/toast";
import * as React from "react";

type NotificationVariant = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
    className?: string;
  };
}

export function useNotifications() {
  const { toast } = useToast();

  const getToastVariant = (
    variant: NotificationVariant
  ): "default" | "destructive" => {
    switch (variant) {
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  const notify = (
    variant: NotificationVariant,
    options: NotificationOptions
  ) => {
    const { title, description, duration = 5000, action } = options;

    let toastAction: ToastActionElement | undefined;
    if (action) {
      // Cast the Button component to ToastActionElement type to avoid TypeScript errors
      toastAction = (
        <Button
          onClick={action.onClick}
          className={
            action.className ||
            "hover:bg-primary/90 bg-primary text-primary-foreground"
          }
          variant="secondary"
          aria-label={action.label}
        >
          {action.label}
        </Button>
      ) as unknown as ToastActionElement;
    }

    return toast({
      variant: getToastVariant(variant),
      title,
      description,
      duration,
      action: toastAction,
    });
  };

  return {
    success: (options: NotificationOptions) => notify("success", options),
    error: (options: NotificationOptions) => notify("error", options),
    warning: (options: NotificationOptions) => notify("warning", options),
    info: (options: NotificationOptions) => notify("info", options),
    custom: (variant: NotificationVariant, options: NotificationOptions) =>
      notify(variant, options),
  };
}
