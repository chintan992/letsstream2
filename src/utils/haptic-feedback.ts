/**
 * Utility for providing haptic feedback on mobile devices
 */

/**
 * Trigger a single haptic pulse
 * @param duration - Duration of vibration in milliseconds
 */
export function triggerHapticFeedback(duration: number = 50): void {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  } catch (error) {
    console.error("Haptic feedback error:", error);
  }
}

/**
 * Trigger a haptic pattern (multiple pulses)
 * @param pattern - Array of alternating vibration/pause durations
 */
export function triggerHapticPattern(pattern: number[] = [50, 50, 50]): void {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.error("Haptic feedback error:", error);
  }
}

/**
 * Trigger a success haptic pattern
 */
export function triggerSuccessHaptic(): void {
  triggerHapticPattern([10, 30, 60]);
}

/**
 * Trigger an error haptic pattern
 */
export function triggerErrorHaptic(): void {
  triggerHapticPattern([100, 30, 100]);
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHapticFeedback(): void {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  } catch (error) {
    console.error("Error canceling haptic feedback:", error);
  }
}

/**
 * Haptic feedback for button clicks
 * This is a standardized haptic feedback for all buttons in the application
 * @param callback - The function to call after haptic feedback
 * @returns A function that triggers haptic feedback and then calls the callback
 */
export function withButtonHaptics<T extends (...args: any[]) => any>(
  callback?: T
) {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    // Standard button feedback (short and subtle)
    triggerHapticFeedback(15);

    // Call the original callback if provided
    return callback?.(...args);
  };
}

/**
 * Higher-order component to add haptic feedback to onClick handlers
 * Usage example: onClick={withButtonHaptics(() => handleClick())}
 * Simplified usage: onClick={withButtonHaptics()}
 */
