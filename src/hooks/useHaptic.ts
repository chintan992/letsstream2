import React, { createContext, useContext } from "react";
import { triggerHapticFeedback } from "../utils/haptic-feedback";

// Create a context for haptic feedback
export const HapticContext = createContext<{
  triggerHaptic: (duration?: number) => void;
  triggerSuccess: () => void;
  triggerError: () => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}>({
  triggerHaptic: () => {},
  triggerSuccess: () => {},
  triggerError: () => {},
  isEnabled: true,
  setEnabled: () => {},
});

// Create a provider component
export const HapticProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isEnabled, setEnabled] = React.useState(true);

  // Check if the device supports haptic feedback
  React.useEffect(() => {
    const supportsHaptics = "vibrate" in navigator;
    if (!supportsHaptics) {
      setEnabled(false);
    }
  }, []);

  const triggerHaptic = (duration = 15) => {
    if (isEnabled) {
      triggerHapticFeedback(duration);
    }
  };

  const triggerSuccess = () => {
    if (isEnabled) {
      triggerHapticFeedback(20);
    }
  };

  const triggerError = () => {
    if (isEnabled) {
      triggerHapticFeedback(30);
    }
  };

  return React.createElement(
    HapticContext.Provider,
    {
      value: {
        triggerHaptic,
        triggerSuccess,
        triggerError,
        isEnabled,
        setEnabled,
      },
    },
    children
  );
};

// Hook for using haptic feedback
export const useHaptic = () => useContext(HapticContext);
