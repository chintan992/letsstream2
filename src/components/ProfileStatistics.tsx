import React from "react";
import { m } from "framer-motion";
import { Clock, Film, Star, Calendar, TrendingUp } from "lucide-react";
import { ProfileStats } from "@/hooks/useProfileData";

interface ProfileStatisticsProps {
  stats: ProfileStats;
  className?: string;
}

const ProfileStatistics: React.FC<ProfileStatisticsProps> = ({
  stats,
  className = "",
}) => {
  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const statItems = [
    {
      icon: Film,
      label: "Total Watched",
      value: stats.totalWatched.toString(),
      color: "text-blue-400",
    },
    {
      icon: Clock,
      label: "Watch Time",
      value: formatWatchTime(stats.totalWatchTime),
      color: "text-green-400",
    },
    {
      icon: Star,
      label: "Avg Rating",
      value: stats.averageRating.toFixed(1),
      color: "text-yellow-400",
    },
    {
      icon: Calendar,
      label: "Watch Streak",
      value: `${stats.watchStreak} days`,
      color: "text-purple-400",
    },
    {
      icon: TrendingUp,
      label: "This Month",
      value: "12 items", // This would be calculated
      color: "text-red-400",
    },
  ];

  return (
    <m.div
      className={`glass rounded-lg p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="mb-4 text-xl font-semibold text-white">Your Statistics</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statItems.map((item, index) => (
          <m.div
            key={item.label}
            className="rounded-lg bg-white/5 p-3 text-center transition-colors hover:bg-white/10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <item.icon className={`mx-auto mb-2 h-6 w-6 ${item.color}`} />
            <div className="text-lg font-bold text-white">{item.value}</div>
            <div className="text-xs text-white/70">{item.label}</div>
          </m.div>
        ))}
      </div>

      {stats.favoriteGenres.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-medium text-white/80">
            Favorite Genres
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.favoriteGenres.map((genre, index) => (
              <span
                key={genre}
                className="bg-accent/20 rounded-full px-3 py-1 text-xs text-accent"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </m.div>
  );
};

export default ProfileStatistics;
