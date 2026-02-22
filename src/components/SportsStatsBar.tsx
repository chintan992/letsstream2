import React, { useMemo } from "react";
import { Activity, Calendar, Trophy, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUserPreferences } from "@/hooks/user-preferences";

interface SportsStatsBarProps {
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  popularMatches: number;
  isLoading?: boolean;
}

const SportsStatsBar = ({
  totalMatches,
  liveMatches,
  upcomingMatches,
  popularMatches,
  isLoading = false,
}: SportsStatsBarProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";

  const resolvedBgColor = useMemo(() => {
    const color = accentColor?.trim();
    if (!color) return "rgba(0,0,0,0.15)";

    if (typeof color === "string" && color.startsWith("#")) {
      const hex = color.substring(1);
      let r = 0,
        g = 0,
        b = 0;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
      if (!Number.isFinite(r)) r = 0;
      if (!Number.isFinite(g)) g = 0;
      if (!Number.isFinite(b)) b = 0;
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      return `rgba(${r}, ${g}, ${b}, 0.15)`;
    }
    if (
      typeof color === "string" &&
      (color.startsWith("hsl(") || color.startsWith("rgb("))
    ) {
      const match = color.match(/(hsla?|rgba?)\(([^)]+)\)/);
      if (match) {
        const parts = match[2].split(",").map((s: string) => s.trim());
        if (color.startsWith("rgb(") && parts.length >= 3) {
          const r = parseInt(parts[0], 10);
          const g = parseInt(parts[1], 10);
          const b = parseInt(parts[2], 10);
          if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
            return `rgba(${r}, ${g}, ${b}, 0.15)`;
          }
        }
        if (color.startsWith("hsl(") && parts.length >= 3) {
          const h = parseFloat(parts[0]);
          const s = parseFloat(parts[1]);
          const l = parseFloat(parts[2]);
          if (Number.isFinite(h) && Number.isFinite(s) && Number.isFinite(l)) {
            const hslToRgb = (h: number, s: number, l: number) => {
              s /= 100;
              l /= 100;
              const k = (n: number) => (n + h / 30) % 12;
              const a = s * Math.min(l, 1 - l);
              const f = (n: number) =>
                l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
              return [
                Math.round(f(0) * 255),
                Math.round(f(8) * 255),
                Math.round(f(4) * 255),
              ];
            };
            const [r, g, b] = hslToRgb(h, s, l);
            return `rgba(${r}, ${g}, ${b}, 0.15)`;
          }
        }
      }
    }
    if (typeof color === "string" && color.startsWith("var(")) {
      const varName = color.match(/var\(([^)]+)\)/)?.[1];
      if (varName && typeof window !== "undefined") {
        const el = document.createElement("div");
        try {
          el.style.color = color;
          document.body.appendChild(el);
          const computed = getComputedStyle(el).color;
          if (computed && computed.startsWith("rgb(")) {
            const match = computed.match(/rgba?\(([^)]+)\)/);
            if (match) {
              const parts = match[1].split(",").map((s: string) => s.trim());
              const r = parseInt(parts[0], 10);
              const g = parseInt(parts[1], 10);
              const b = parseInt(parts[2], 10);
              if (
                Number.isFinite(r) &&
                Number.isFinite(g) &&
                Number.isFinite(b)
              ) {
                return `rgba(${r}, ${g}, ${b}, 0.15)`;
              }
            }
          }
        } finally {
          document.body.removeChild(el);
        }
      }
    }
    if (
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("color: color-mix(in srgb, red, transparent)")
    ) {
      return `color-mix(in srgb, ${accentColor}, transparent 85%)`;
    }
    return "rgba(0,0,0,0.15)";
  }, [accentColor]);

  const stats = [
    {
      id: "live",
      label: "Live Now",
      value: liveMatches,
      icon: <Wifi className="h-4 w-4" />,
      color: "#ef4444", // Red for live
      bgColor: "rgba(239, 68, 68, 0.1)",
    },
    {
      id: "upcoming",
      label: "Upcoming",
      value: upcomingMatches,
      icon: <Calendar className="h-4 w-4" />,
      color: "#3b82f6", // Blue for upcoming
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      id: "popular",
      label: "Popular",
      value: popularMatches,
      icon: <Activity className="h-4 w-4" />,
      color: "#f59e0b", // Amber for popular
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
      id: "total-events",
      label: "Total Events",
      value: totalMatches,
      icon: <Trophy className="h-4 w-4" />,
      color: accentColor,
      bgColor: resolvedBgColor,
    },
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card
          key="skeleton-1"
          className="flex items-center gap-3 border-white/5 bg-white/5 p-3 backdrop-blur-sm"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-8 animate-pulse rounded bg-white/10" />
          </div>
        </Card>
        <Card
          key="skeleton-2"
          className="flex items-center gap-3 border-white/5 bg-white/5 p-3 backdrop-blur-sm"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-8 animate-pulse rounded bg-white/10" />
          </div>
        </Card>
        <Card
          key="skeleton-3"
          className="flex items-center gap-3 border-white/5 bg-white/5 p-3 backdrop-blur-sm"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-8 animate-pulse rounded bg-white/10" />
          </div>
        </Card>
        <Card
          key="skeleton-4"
          className="flex items-center gap-3 border-white/5 bg-white/5 p-3 backdrop-blur-sm"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-8 animate-pulse rounded bg-white/10" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(stat => (
        <Card
          key={stat.id}
          className="bg-card/40 hover:bg-card/60 group relative overflow-hidden border-white/10 p-3 backdrop-blur-md transition-all duration-300 hover:shadow-lg"
          style={{
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: stat.bgColor,
                color: stat.color,
              }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-white/50">{stat.label}</p>
              <p className="text-xl font-bold tabular-nums tracking-tight text-white">
                {stat.value}
              </p>
            </div>
          </div>

          {/* Decorative gradient glow */}
          <div
            className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
            style={{ backgroundColor: stat.color }}
          />
        </Card>
      ))}
    </div>
  );
};

export default SportsStatsBar;
