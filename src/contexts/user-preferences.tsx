import { useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks";
import { useToast } from "@/components/ui/use-toast";
import {
  UserPreferencesContext,
  UserPreferences,
  UserPreferencesContextType,
} from "./types/user-preferences";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export { UserPreferencesContext };

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to map hex color to HSL
  const getHSLFromHex = useCallback((hex: string): string => {
    // Default HSL values for common accent colors
    const colorMap: Record<string, string> = {
      "#E63462": "347 80% 55%", // Pink
      "#9b87f5": "250 85% 75%", // Purple
      "#0EA5E9": "199 89% 48%", // Blue
      "#10B981": "160 84% 39%", // Green
      "#F59E0B": "38 92% 50%", // Yellow
      "#F97316": "24 94% 53%", // Orange
      "#EF4444": "0 84% 60%", // Red
    };

    return colorMap[hex] || "347 80% 55%"; // Default to pink if unknown
  }, []);

  // Apply accent color to CSS variables and update PWA theme
  const applyAccentColor = useCallback(
    (colorHex: string) => {
      // Update CSS variable
      const hsl = getHSLFromHex(colorHex);
      document.documentElement.style.setProperty("--accent", hsl);

      // Update theme-color meta tag
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", colorHex);
      }

      // Update manifest.json theme-color if running as PWA
      if (window.matchMedia("(display-mode: standalone)").matches) {
        fetch("/manifest.json")
          .then(response => response.json())
          .then(manifest => {
            manifest.theme_color = colorHex;
            console.log("PWA theme color updated:", colorHex);
          })
          .catch(error => {
            console.error("Error updating manifest theme color:", error);
          });
      }
    },
    [getHSLFromHex]
  );

  const toggleNotifications = useCallback(async () => {
    if (!user || !userPreferences) return;

    try {
      const updatedPreferences = {
        ...userPreferences,
        isNotificationsEnabled: !userPreferences.isNotificationsEnabled,
        updated_at: new Date().toISOString(),
      };

      const userPreferencesRef = doc(db, "userPreferences", user.uid);
      await setDoc(userPreferencesRef, updatedPreferences, { merge: true });
      setUserPreferences(updatedPreferences);

      toast({
        title: updatedPreferences.isNotificationsEnabled
          ? "Notifications enabled"
          : "Notifications disabled",
        description: updatedPreferences.isNotificationsEnabled
          ? "You'll receive notifications about new features and updates"
          : "You won't receive notifications about new features and updates",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    }
  }, [user, userPreferences, toast]);

  // Fetch user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setUserPreferences(null);
        setIsLoading(false);
        return;
      }

      try {
        const userPreferencesRef = doc(db, "userPreferences", user.uid);
        const userPreferencesDoc = await getDoc(userPreferencesRef);

        if (userPreferencesDoc.exists()) {
          const prefs = userPreferencesDoc.data() as UserPreferences;
          setUserPreferences(prefs);

          // Apply accent color if it exists
          if (prefs.accentColor) {
            applyAccentColor(prefs.accentColor);
          }
        } else {
          // Initialize with default preferences
          const defaultPreferences: UserPreferences = {
            user_id: user.uid,
            isWatchHistoryEnabled: true,
            isNotificationsEnabled: true, // Enable notifications by default
            accentColor: "#E63462", // Default accent color
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          try {
            await setDoc(userPreferencesRef, defaultPreferences);
            setUserPreferences(defaultPreferences);

            // Apply default accent color
            applyAccentColor(defaultPreferences.accentColor);
          } catch (error) {
            console.error("Error creating default preferences:", error);
            toast({
              title: "Error setting up preferences",
              description:
                "Please make sure you're signed in and try again. If the problem persists, try signing out and back in.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        toast({
          title: "Error loading preferences",
          description:
            "Please make sure you're signed in and try again. If the problem persists, try signing out and back in.",
          variant: "destructive",
        });
        // Set default preferences in memory even if save fails
        setUserPreferences({
          user_id: user.uid,
          isWatchHistoryEnabled: true,
          isNotificationsEnabled: true,
          accentColor: "#E63462",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user, toast, applyAccentColor]);

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user || !userPreferences) return;

    try {
      const userPrefsRef = doc(db, "userPreferences", user.uid);
      const updatedPreferences = {
        ...userPreferences,
        ...preferences,
        updated_at: new Date().toISOString(),
      };

      await setDoc(userPrefsRef, updatedPreferences);
      setUserPreferences(updatedPreferences);

      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences.",
        variant: "destructive",
      });
    }
  };

  const toggleWatchHistory = async () => {
    if (!user || !userPreferences) return;

    try {
      await updatePreferences({
        isWatchHistoryEnabled: !userPreferences.isWatchHistoryEnabled,
      });

      toast({
        title: userPreferences.isWatchHistoryEnabled
          ? "Watch History Disabled"
          : "Watch History Enabled",
        description: userPreferences.isWatchHistoryEnabled
          ? "Your watch history will no longer be recorded"
          : "Your watch history will now be recorded",
      });
    } catch (error) {
      console.error("Error toggling watch history:", error);
    }
  };

  const setAccentColor = async (color: string) => {
    if (!user || !userPreferences) return;

    try {
      await updatePreferences({
        accentColor: color,
      });

      // Apply the color and update PWA theme
      applyAccentColor(color);

      toast({
        title: "Theme Updated",
        description: "Your color preference has been saved and applied.",
      });
    } catch (error) {
      console.error("Error setting accent color:", error);
      toast({
        title: "Error",
        description: "Failed to update theme color. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        userPreferences,
        updatePreferences,
        isLoading,
        toggleWatchHistory,
        setAccentColor,
        toggleNotifications,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}
