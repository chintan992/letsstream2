import { Search as SearchIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchHistoryProps {
  history: string[];
  onHistoryItemClick: (term: string) => void;
  onClearHistory: () => void;
}

const SearchHistory = ({
  history,
  onHistoryItemClick,
  onClearHistory,
}: SearchHistoryProps) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recent Searches</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-white/70 hover:text-white"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear History
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((term, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10"
            onClick={() => onHistoryItemClick(term)}
          >
            <SearchIcon className="mr-2 h-4 w-4" />
            {term}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SearchHistory;
