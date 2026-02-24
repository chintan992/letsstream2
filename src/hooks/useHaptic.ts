import { createContext, useContext } from "react";

const HapticContext = createContext<{
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

export const useHaptic = () => useContext(HapticContext);
