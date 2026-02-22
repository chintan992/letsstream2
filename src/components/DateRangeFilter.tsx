import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRangePreset = "today" | "tomorrow" | "week" | "all";

interface DateRangeFilterProps {
  value: DateRangePreset;
  onChange: (value: DateRangePreset) => void;
  className?: string;
}

const DateRangeFilter = ({
  value,
  onChange,
  className,
}: DateRangeFilterProps) => {
  const presets: { value: DateRangePreset; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "week", label: "This Week" },
    { value: "all", label: "All Dates" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start gap-2 border-white/20 bg-transparent text-white hover:bg-white/5",
            className
          )}
        >
          <Calendar className="h-4 w-4" />
          {presets.find(p => p.value === value)?.label || "Filter by Date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-card/95 w-56 border-white/20 p-2 backdrop-blur-sm">
        <div className="space-y-1">
          {presets.map(preset => (
            <Button
              key={preset.value}
              variant={value === preset.value ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                value === preset.value && "bg-accent text-white"
              )}
              onClick={() => onChange(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeFilter;
