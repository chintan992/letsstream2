import React from "react";
import { APIMatch } from "@/utils/sports-types";
import SportMatchCard from "./SportMatchCard";
import { motion, Variants } from "framer-motion";

interface SportMatchGridProps {
  matches: APIMatch[];
  title?: string;
  emptyMessage?: string;
}

const SportMatchGrid = ({
  matches,
  title,
  emptyMessage = "No matches found.",
}: SportMatchGridProps) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="py-8 text-center text-white/70">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="px-4 py-6 md:px-8">
      {title && <h2 className="mb-6 text-2xl font-bold text-white">{title}</h2>}

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {matches.map(match => (
          <motion.div
            key={`${match.id}-${match.sources[0]?.source}`}
            variants={item}
          >
            <SportMatchCard match={match} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SportMatchGrid;
