import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "./ui/use-toast";

interface ServiceWorkerUpdateNotificationProps {
  onAcceptUpdate: () => void;
  onDismiss: () => void;
}

export function ServiceWorkerUpdateNotification({
  onAcceptUpdate,
  onDismiss,
}: ServiceWorkerUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  // Auto-update fallback after 60 seconds
  useEffect(() => {
    // Show a toast notification about the service worker error on mount
    toast({
      title: "Service Worker Issue Detected",
      description:
        "There might be issues with offline functionality. Updating might help resolve the problem.",
      variant: "destructive",
      duration: 5000,
    });
    const timeout = setTimeout(() => {
      if (isVisible) {
        setIsVisible(false);
        onAcceptUpdate();
      }
    }, 60000); // 60 seconds
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Card className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed bottom-4 left-4 z-50 w-auto max-w-[90vw] space-y-4 p-4 shadow-lg backdrop-blur">
      <div className="space-y-2">
        <h3 className="font-semibold">Update Available</h3>
        <p className="text-sm text-muted-foreground">
          A new version is available. Update now to fix service worker issues
          and get the latest features.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            setIsVisible(false);
            onAcceptUpdate();
          }}
        >
          Update Now
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
        >
          Later
        </Button>
      </div>
    </Card>
  );
}
