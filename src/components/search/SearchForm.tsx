import { useRef, useEffect } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchSuggestions from "@/components/SearchSuggestions";
import { Media } from "@/utils/types";

interface SearchFormProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  showSuggestions: boolean;
  onShowSuggestionsChange: (show: boolean) => void;
  suggestions: string[];
  mediaSuggestions: Media[];
  searchHistory: string[];
  onSuggestionClick: (suggestion: string | Media) => void;
}

const SearchForm = ({
  query,
  onQueryChange,
  onSearch,
  onClear,
  showSuggestions,
  onShowSuggestionsChange,
  suggestions,
  mediaSuggestions,
  searchHistory,
  onSuggestionClick,
}: SearchFormProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onQueryChange(value);
    if (value.length > 1) {
      onShowSuggestionsChange(true);
    } else {
      onShowSuggestionsChange(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search for movies, TV shows..."
            className="h-12 border-white/10 bg-white/10 pl-10 pr-10 text-white placeholder:text-white/50"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length > 1 && onShowSuggestionsChange(true)}
            onBlur={() => {
              if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current);
              }
              suggestionTimeoutRef.current = setTimeout(
                () => onShowSuggestionsChange(false),
                200
              );
            }}
          />
          <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-white/50" />
          {query && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 transform text-white/50 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {showSuggestions &&
            (mediaSuggestions.length > 0 ? (
              <SearchSuggestions
                suggestions={mediaSuggestions}
                onSuggestionClick={onSuggestionClick}
                searchQuery={query}
                onViewAllResults={() => onSearch()}
              />
            ) : suggestions.length > 0 ? (
              <SearchSuggestions
                suggestions={suggestions}
                onSuggestionClick={onSuggestionClick}
                searchQuery={query}
                onViewAllResults={() => onSearch()}
              />
            ) : searchHistory.length > 0 ? (
              <SearchSuggestions
                suggestions={searchHistory.slice(0, 5)}
                onSuggestionClick={onSuggestionClick}
                searchQuery={query}
                onViewAllResults={() => onSearch()}
              />
            ) : null)}
        </div>

        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <Button
            type="submit"
            className="hover:bg-accent/80 ml-auto h-12 bg-accent px-6 md:ml-0"
          >
            <SearchIcon className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchForm;
