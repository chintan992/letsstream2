import { History, Heart, Bookmark, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HistoryEmptyStateProps {
  type: "history" | "favorites" | "watchlist" | "simkl" | "simkl-error";
  errorMessage?: string;
}

const HistoryEmptyState = ({ type, errorMessage }: HistoryEmptyStateProps) => {
  const getContent = () => {
    switch (type) {
      case "history":
        return {
          icon: <History className="mx-auto mb-4 h-12 w-12 text-white/50" />,
          title: "No watch history yet",
          description: "Start watching movies and shows to build your history.",
          action: (
            <Link to="/">
              <Button>Browse Content</Button>
            </Link>
          ),
        };
      case "favorites":
        return {
          icon: <Heart className="mx-auto mb-4 h-12 w-12 text-white/50" />,
          title: "No favorites yet",
          description:
            "Add movies and shows to your favorites for quick access.",
          action: (
            <Link to="/">
              <Button>Browse Content</Button>
            </Link>
          ),
        };
      case "watchlist":
        return {
          icon: <Bookmark className="mx-auto mb-4 h-12 w-12 text-white/50" />,
          title: "Your watchlist is empty",
          description: "Add movies and shows to your watchlist to watch later.",
          action: (
            <Link to="/">
              <Button>Browse Content</Button>
            </Link>
          ),
        };
      case "simkl":
        return {
          icon: <Cloud className="mx-auto mb-4 h-12 w-12 text-white/50" />,
          title: "No Simkl watch history",
          description:
            "Your Simkl watch history will appear here once you start tracking.",
          action: (
            <a
              href="https://simkl.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>Visit Simkl</Button>
            </a>
          ),
        };
      case "simkl-error":
        return {
          icon: <Cloud className="mx-auto mb-4 h-12 w-12 text-red-400" />,
          title: "Error Loading Simkl Data",
          description: errorMessage || "Failed to load Simkl watch history",
          action: null,
        };
      default:
        return {
          icon: null,
          title: "No content",
          description: "",
          action: null,
        };
    }
  };

  const content = getContent();

  return (
    <div className="glass rounded-lg p-8 text-center">
      {content.icon}
      <h3 className="mb-2 text-lg font-medium text-white">{content.title}</h3>
      <p className="mb-4 text-white/70">{content.description}</p>
      {content.action}
    </div>
  );
};

export default HistoryEmptyState;
