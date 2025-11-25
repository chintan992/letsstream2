import React from "react";
import { motion } from "framer-motion";
import { Sport } from "@/utils/sports-types";
import { getSportIcon } from "@/utils/sport-icons";
import { useUserPreferences } from "@/hooks/user-preferences";

interface SportsCategoryListProps {
  sports: Sport[];
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
  isLoading: boolean;
}

const SportsCategoryList: React.FC<SportsCategoryListProps> = ({
  sports,
  selectedSport,
  onSelectSport,
  isLoading,
}) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="mb-8 overflow-x-auto pb-4">
      <motion.div
        className="flex min-w-max space-x-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          onClick={() => onSelectSport("all")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105`}
          style={{
            backgroundColor:
              selectedSport === "all" ? accentColor : "rgba(255,255,255,0.05)",
            border: `1px solid ${
              selectedSport === "all"
                ? "transparent"
                : "rgba(255,255,255,0.1)"
            }`,
            color: selectedSport === "all" ? "white" : "rgba(255,255,255,0.7)",
          }}
          variants={itemVariants}
        >
          <span>🏅</span>
          All Sports
        </motion.button>

        {isLoading ? (
          <div className="flex space-x-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="h-10 w-28 animate-pulse rounded-full bg-white/10"
                variants={itemVariants}
              />
            ))}
          </div>
        ) : (
          sports.map((sport: Sport) => (
            <motion.button
              key={sport.id}
              onClick={() => onSelectSport(sport.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105`}
              style={{
                backgroundColor:
                  selectedSport === sport.id
                    ? accentColor
                    : "rgba(255,255,255,0.05)",
                border: `1px solid ${
                  selectedSport === sport.id
                    ? "transparent"
                    : "rgba(255,255,255,0.1)"
                }`,
                color:
                  selectedSport === sport.id
                    ? "white"
                    : "rgba(255,255,255,0.7)",
              }}
              variants={itemVariants}
            >
              <span>{getSportIcon(sport.id)}</span>
              {sport.name}
            </motion.button>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default SportsCategoryList;