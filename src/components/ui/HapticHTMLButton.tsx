import React from "react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";

type HapticHTMLButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A regular HTML button component that automatically adds haptic feedback on click.
 * Use this component instead of regular button for all buttons that need haptic feedback.
 */
export const HapticHTMLButton = React.forwardRef<
  HTMLButtonElement,
  HapticHTMLButtonProps
>(({ onClick, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Standard button feedback (short and subtle)
    triggerHapticFeedback(15);

    // Call the original onClick handler if provided
    onClick?.(e);
  };

  return <button ref={ref} onClick={handleClick} {...props} />;
});

HapticHTMLButton.displayName = "HapticHTMLButton";
