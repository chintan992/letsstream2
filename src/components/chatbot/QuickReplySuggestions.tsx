import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuickReplySuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  className?: string;
}

const QuickReplySuggestions: React.FC<QuickReplySuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  className,
}) => {
  if (!suggestions.length) return null;

  return (
    <div
      className={cn(
        "scrollbar-hide flex snap-x gap-2 overflow-x-auto px-1 py-2",
        className
      )}
    >
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion}
          className="bg-muted/50 border-border/20 flex-shrink-0 snap-start whitespace-nowrap rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted active:scale-95"
          onClick={() => onSelectSuggestion(suggestion)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          whileTap={{ scale: 0.95 }}
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
};

export default QuickReplySuggestions;
