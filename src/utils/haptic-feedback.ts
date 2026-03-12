import { isTauri } from "./platform";

async function loadTauriHaptics() {
  if (!isTauri()) return null;
  try {
    return await import("@tauri-apps/plugin-haptics");
  } catch {
    return null;
  }
}

function isMobileTauri(): boolean {
  return isTauri() && /android|ios/i.test(navigator.userAgent);
}

export function triggerHapticFeedback(duration: number = 50): void {
  if (isMobileTauri()) {
    loadTauriHaptics().then(haptics => {
      if (!haptics) return;
      const style =
        duration <= 15 ? "light" : duration <= 35 ? "medium" : "heavy";
      haptics.impactFeedback(
        style as "light" | "medium" | "heavy" | "rigid" | "soft"
      );
    });
    return;
  }
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  } catch (error) {
    console.error("Haptic feedback error:", error);
  }
}

export function triggerHapticPattern(pattern: number[] = [50, 50, 50]): void {
  if (isMobileTauri()) {
    loadTauriHaptics().then(haptics => {
      if (!haptics) return;
      haptics.vibrate(pattern[0] / 1000);
    });
    return;
  }
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.error("Haptic feedback error:", error);
  }
}

export function triggerSuccessHaptic(): void {
  if (isMobileTauri()) {
    loadTauriHaptics().then(haptics => {
      if (!haptics) return;
      haptics.notificationFeedback("success");
    });
  } else {
    triggerHapticPattern([10, 30, 60]);
  }
}

export function triggerErrorHaptic(): void {
  if (isMobileTauri()) {
    loadTauriHaptics().then(haptics => {
      if (!haptics) return;
      haptics.notificationFeedback("error");
    });
  } else {
    triggerHapticPattern([100, 30, 100]);
  }
}
