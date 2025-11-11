import React from "react";
import {
  triggerHapticFeedback,
  triggerSuccessHaptic,
} from "@/utils/haptic-feedback";
import { CircleDot, Circle } from "lucide-react";
import { useUserPreferences } from "@/hooks/user-preferences";
import { Button } from "./ui/button";

interface AccentColorOption {
  name: string;
  value: string;
  hsl: string;
}

export default function AccentColorPicker() {
  const { userPreferences, setAccentColor } = useUserPreferences();
  const currentColor = userPreferences?.accentColor || "#E63462";

  // Predefined accent colors with HSL values
  const accentColors: AccentColorOption[] = [
    { name: "Pink", value: "#E63462", hsl: "347 80% 55%" },
    { name: "Purple", value: "#9b87f5", hsl: "250 85% 75%" },
    { name: "Blue", value: "#0EA5E9", hsl: "199 89% 48%" },
    { name: "Green", value: "#10B981", hsl: "160 84% 39%" },
    { name: "Yellow", value: "#F59E0B", hsl: "38 92% 50%" },
    { name: "Orange", value: "#F97316", hsl: "24 94% 53%" },
    { name: "Red", value: "#EF4444", hsl: "0 84% 60%" },
  ];

  // Apply the selected accent color
  const applyAccentColor = (color: AccentColorOption) => {
    // Provide haptic feedback when changing accent color
    triggerSuccessHaptic();

    // Update CSS variable
    document.documentElement.style.setProperty("--accent", color.hsl);

    // Save to preferences
    setAccentColor(color.value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Accent Color</h3>
      <div className="flex flex-wrap gap-3">
        {accentColors.map(color => (
          <Button
            key={color.value}
            type="button"
            variant="outline"
            className="h-10 w-10 rounded-full border-2 p-0"
            style={{
              backgroundColor: color.value,
              borderColor:
                currentColor === color.value ? "white" : "transparent",
            }}
            onClick={() => applyAccentColor(color)}
            title={color.name}
          >
            {currentColor === color.value && (
              <CircleDot className="h-6 w-6 text-white drop-shadow-md" />
            )}
          </Button>
        ))}
      </div>
      <div className="mt-2 text-sm text-white/70">
        Choose an accent color to personalize your experience
      </div>
    </div>
  );
}
