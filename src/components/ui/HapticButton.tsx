import React from "react";
import { Button, ButtonProps } from "./button";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";

/**
 * A button component that automatically adds haptic feedback on click.
 * This is a wrapper around the Button component that adds haptic feedback.
 * Use this component instead of Button for all buttons that need haptic feedback.
 */
export const HapticButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Standard button feedback (short and subtle)
      triggerHapticFeedback(15);

      // Call the original onClick handler if provided
      onClick?.(e);
    };

    return <Button ref={ref} onClick={handleClick} {...props} />;
  }
);

HapticButton.displayName = "HapticButton";
