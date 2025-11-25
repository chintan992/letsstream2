import React from "react";
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

    const stats = [
        {
            label: "Live Now",
            value: liveMatches,
            icon: <Wifi className="h-4 w-4" />,
            color: "#ef4444", // Red for live
            bgColor: "rgba(239, 68, 68, 0.1)",
        },
        {
            label: "Upcoming",
            value: upcomingMatches,
            icon: <Calendar className="h-4 w-4" />,
            color: "#3b82f6", // Blue for upcoming
            bgColor: "rgba(59, 130, 246, 0.1)",
        },
        {
            label: "Popular",
            value: popularMatches,
            icon: <Activity className="h-4 w-4" />,
            color: "#f59e0b", // Amber for popular
            bgColor: "rgba(245, 158, 11, 0.1)",
        },
        {
            label: "Total Events",
            value: totalMatches,
            icon: <Trophy className="h-4 w-4" />,
            color: accentColor,
            bgColor: `${accentColor}1a`, // 10% opacity
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card
                        key={i}
                        className="flex items-center gap-3 border-white/5 bg-white/5 p-3 backdrop-blur-sm"
                    >
                        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                        <div className="space-y-2">
                            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                            <div className="h-5 w-8 animate-pulse rounded bg-white/10" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    className="group relative overflow-hidden border-white/10 bg-card/40 p-3 backdrop-blur-md transition-all duration-300 hover:bg-card/60 hover:shadow-lg"
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
                            <p className="text-xl font-bold text-white tabular-nums tracking-tight">
                                {stat.value}
                            </p>
                        </div>
                    </div>

                    {/* Decorative gradient glow */}
                    <div
                        className="absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-20"
                        style={{ backgroundColor: stat.color }}
                    />
                </Card>
            ))}
        </div>
    );
};

export default SportsStatsBar;
