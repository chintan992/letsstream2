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
