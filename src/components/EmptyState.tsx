import React from "react";
import { Search, Calendar, TrendingUp, Wifi, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserPreferences } from "@/hooks/user-preferences";

interface EmptyStateProps {
  type: "search" | "no-matches" | "no-popular" | "no-live";
  searchQuery?: string;
  sportName?: string;
  onClearFilters?: () => void;
}

const EmptyState = ({
  type,
  searchQuery,
  sportName,
  onClearFilters,
}: EmptyStateProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";

  const getContent = () => {
    switch (type) {
      case "search":
        return {
          icon: <Search className="h-20 w-20" />,
          title: "No matches found",
          description: searchQuery
            ? `No matches found for "${searchQuery}"`
            : "Try adjusting your search terms",
          suggestions: [
            "Try different keywords",
            "Check your spelling",
            "Use broader search terms",
          ],
          action: onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="mt-6 border-white/20 bg-white/5 transition-all duration-300 hover:border-white/30 hover:bg-white/10"
              style={{
                boxShadow: `0 0 20px ${accentColor}20`,
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              Clear search
            </Button>
          ),
        };

      case "no-matches":
        return {
          icon: <Calendar className="h-20 w-20" />,
          title: "No matches available",
          description: sportName
            ? `No ${sportName} matches scheduled at the moment`
            : "No matches scheduled at the moment",
          suggestions: [
            "Check back later for new matches",
            "Try viewing other sports",
            "Browse popular matches",
          ],
          action: onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="mt-6 border-white/20 bg-white/5 transition-all duration-300 hover:border-white/30 hover:bg-white/10"
              style={{
                boxShadow: `0 0 20px ${accentColor}20`,
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              View all sports
            </Button>
          ),
        };

      case "no-popular":
        return {
          icon: <TrendingUp className="h-20 w-20" />,
          title: "No popular matches",
          description: sportName
            ? `No popular ${sportName} matches right now`
            : "Check back later for popular matches",
          suggestions: [
            "Try viewing all matches",
            "Check live matches",
            "Browse other sports",
          ],
          action: null,
        };

      case "no-live":
        return {
          icon: <Wifi className="h-20 w-20" />,
          title: "No live matches",
          description: sportName
            ? `No live ${sportName} matches at the moment`
            : "No live matches at the moment",
          suggestions: [
            "Check upcoming matches",
            "View popular matches",
            "Browse match schedule",
          ],
          action: null,
        };

      default:
        return {
          icon: <Calendar className="h-20 w-20" />,
          title: "No matches",
          description: "No matches available",
          suggestions: [],
          action: null,
        };
    }
  };

  const content = getContent();

  return (
    <div className="relative flex min-h-[500px] flex-col items-center justify-center px-4 py-16 text-center">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${accentColor} 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent opacity-50" />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon with gradient */}
        <div
          className="mb-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-lg backdrop-blur-sm"
          style={{
            boxShadow: `0 0 40px ${accentColor}15, inset 0 0 20px ${accentColor}10`,
          }}
        >
          {content.icon}
        </div>

        <h3 className="mb-3 text-2xl font-bold text-white">{content.title}</h3>

        <p className="mb-6 max-w-md text-base leading-relaxed text-white/60">
          {content.description}
        </p>

        {/* Suggestions */}
        {content.suggestions && content.suggestions.length > 0 && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {content.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 backdrop-blur-sm"
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {content.action}
      </div>
    </div>
  );
};

export default EmptyState;
