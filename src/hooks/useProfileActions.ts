import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";
import { useAuth } from "@/hooks";
import { useWatchHistory } from "@/hooks/watch-history";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

export const useProfileActions = () => {
  const { user, logout } = useAuth();
  const { clearWatchHistory } = useWatchHistory();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleClearHistory = useCallback(() => {
    triggerHapticFeedback(25);
    clearWatchHistory();
    toast({
      title: "Watch history cleared",
      description: "Your watch history has been successfully cleared.",
    });
  }, [clearWatchHistory, toast]);

  const handleSignOut = useCallback(async () => {
    triggerHapticFeedback(25);
    try {
      await logout();
      await trackEvent({
        name: "user_logout",
        params: {
          user: user?.email || user?.uid || "unknown",
        },
      });
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  }, [logout, user, navigate, toast]);

  const handleTabChange = useCallback(
    (value: string, setActiveTab: (value: string) => void) => {
      triggerHapticFeedback(15);
      setActiveTab(value);
    },
    []
  );

  return {
    handleClearHistory,
    handleSignOut,
    handleTabChange,
  };
};
