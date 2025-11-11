import * as React from "react";
import { useAuth } from "@/hooks";
import { ToastAction, type ToastActionElement } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
// Custom API references removed
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserPreferences } from "@/contexts/types/user-preferences";

// NOTE: This file must be named .tsx to support JSX below!
export function useFeatureNotifications(): void {
  const { user } = useAuth();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!user) return;

    const checkForNewFeatures = async () => {
      try {
        // Check if notifications are enabled in user preferences
        const userPreferencesRef = doc(db, "userPreferences", user.uid);
        const userPreferencesDoc = await getDoc(userPreferencesRef);
        const userPreferences = userPreferencesDoc.data() as
          | UserPreferences
          | undefined;

        // If notifications are explicitly disabled, do not show any notifications
        if (userPreferences?.isNotificationsEnabled === false) {
          return;
        }

        const lastSeenVersion =
          localStorage.getItem(`lastSeenFeature-${user.uid}`) || "0.0.0";
        // Custom API feature notification logic removed
      } catch (error) {
        console.error("Error checking for new features:", error);
      }
    };

    // Check for new features when the component mounts
    checkForNewFeatures();

    // Also check when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForNewFeatures();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, toast]);

  // No return needed
}
