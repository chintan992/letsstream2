import React from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useUserPreferences } from "@/hooks/user-preferences";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import AccentColorPicker from "@/components/AccentColorPicker";
import { triggerSuccessHaptic } from "@/utils/haptic-feedback";
import { trackEvent } from "@/lib/analytics";

const PreferencesTab: React.FC = () => {
  const {
    userPreferences,
    updatePreferences,
    toggleWatchHistory,
    toggleNotifications,
  } = useUserPreferences();
  const { toast } = useToast();

  const handleDisplayOverrideChange = async (value: string) => {
    triggerSuccessHaptic();
    try {
      await updatePreferences({ display_override: value });
      await trackEvent({
        name: "user_profile_update",
        params: {
          field: "display_override",
          value,
          user: "current_user", // Would be actual user ID
        },
      });
      toast({
        title: "Display preference updated",
        description: "Your display mode has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update display preference.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="glass rounded-lg p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="mb-6 flex items-center text-xl font-semibold text-white">
        <Settings className="mr-2 h-5 w-5" />
        Your Preferences
      </h2>

      <div className="space-y-6">
        {/* Watch History Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-lg font-medium text-white">Watch History</h3>
            <p className="text-sm text-white/70">
              {userPreferences?.isWatchHistoryEnabled
                ? "Your watch history is being recorded"
                : "Your watch history is not being recorded"}
            </p>
          </div>
          <Switch
            checked={userPreferences?.isWatchHistoryEnabled}
            onCheckedChange={toggleWatchHistory}
            aria-label="Toggle watch history"
          />
        </div>

        {/* Feature Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-lg font-medium text-white">
              Feature Notifications
            </h3>
            <p className="text-sm text-white/70">
              Get notified about new features and updates
            </p>
          </div>
          <Switch
            checked={userPreferences?.isNotificationsEnabled}
            onCheckedChange={toggleNotifications}
            aria-label="Toggle feature notifications"
          />
        </div>

        {/* Accent Color Picker */}
        <AccentColorPicker />

        {/* Display Override */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-white">Display Override</h3>
          <p className="text-sm text-white/70">
            Select the display mode for the app
          </p>
          <Select
            value={userPreferences?.display_override || ""}
            onValueChange={handleDisplayOverrideChange}
          >
            <SelectTrigger className="w-full border-white/20 bg-white/10 text-white sm:w-[200px]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-background">
              {["fullscreen", "minimal-ui", "browser", "standalone"].map(
                mode => (
                  <SelectItem
                    key={mode}
                    value={mode}
                    className="text-white focus:bg-white/10 focus:text-white"
                  >
                    {mode}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
};

export default PreferencesTab;
