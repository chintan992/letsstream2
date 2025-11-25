import React from "react";
import { motion } from "framer-motion";

interface SportsHeroProps {
  liveMatchesCount: number;
}

const SportsHero: React.FC<SportsHeroProps> = ({ liveMatchesCount }) => {
  return (
    <div className="relative pt-20 pb-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
        <motion.div
          className="absolute -bottom-[30%] -left-[15%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <motion.h1
              className="mb-2 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Sports <span className="text-accent">Live</span>
            </motion.h1>
            <motion.p
              className="max-w-2xl text-lg text-white/70"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Stream live events, catch up on highlights, and follow your
              favorite teams across all major leagues.
            </motion.p>
          </div>
          {liveMatchesCount > 0 && (
            <motion.div
              className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-red-500 border border-red-500/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-bold">{liveMatchesCount} Live Events</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SportsHero;