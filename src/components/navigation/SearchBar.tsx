import React, { useState, useRef, useEffect } from "react";
import { Search, ArrowRight, Film, Tv, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { searchMedia } from "@/utils/api";
import { Media } from "@/utils/types";

interface SearchBarProps {
  isMobile?: boolean;
  onSearch?: () => void;
  className?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const SearchBar = ({
  isMobile = false,
  onSearch,
  className = "",
  expanded = false,
  onToggleExpand,
}: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchState, setSearchState] = useState<{
    suggestions: Media[];
    showSuggestions: boolean;
    isLoading: boolean;
    selectedIndex: number;
  }>({
    suggestions: [],
    showSuggestions: false,
    isLoading: false,
    selectedIndex: -1,
  });
  const {
    suggestions: searchSuggestions,
    showSuggestions,
    isLoading,
    selectedIndex,
  } = searchState;
  const navigate = useNavigate();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (onToggleExpand) onToggleExpand();
        else searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onToggleExpand]);

  useEffect(() => {
    if (expanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [expanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setSearchState(prev => ({ ...prev, showSuggestions: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 0) {
        setSearchState(prev => ({ ...prev, isLoading: true }));
        try {
          const results = await searchMedia(searchQuery);
          setSearchState(prev => ({
            ...prev,
            suggestions: results.slice(0, 6),
            showSuggestions: true,
            selectedIndex: -1,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSearchState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setSearchState(prev => ({
          ...prev,
          suggestions: [],
          showSuggestions: false,
          isLoading: false,
        }));
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchState(prev => ({ ...prev, showSuggestions: false }));
      if (onSearch) onSearch();
      if (onToggleExpand) onToggleExpand();

      toast({
        title: "Searching...",
        description: `Finding results for "${searchQuery.trim()}"`,
        duration: 2000,
      });
    }
  };

  const handleSuggestionClick = (item: Media) => {
    navigate(`/${item.media_type}/${item.id}`);
    setSearchQuery("");
    setSearchState(prev => ({ ...prev, showSuggestions: false }));
    if (onSearch) onSearch();
    if (onToggleExpand) onToggleExpand();

    toast({
      title: "Navigating...",
      description: `Going to ${item.title || item.name}`,
      duration: 2000,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions && searchQuery) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchState(prev => ({
        ...prev,
        selectedIndex:
          prev.selectedIndex < prev.suggestions.length - 1
            ? prev.selectedIndex + 1
            : prev.selectedIndex,
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchState(prev => ({
        ...prev,
        selectedIndex: prev.selectedIndex > -1 ? prev.selectedIndex - 1 : -1,
      }));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < searchSuggestions.length) {
        e.preventDefault();
        handleSuggestionClick(searchSuggestions[selectedIndex]);
      }
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchState(prev => ({
      ...prev,
      suggestions: [],
      showSuggestions: false,
    }));
    searchInputRef.current?.focus();
  };

  // For mobile collapsed state (icon only)
  if (isMobile && !expanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleExpand}
        className="text-white hover:bg-white/10"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`search-container ${isMobile ? "w-full" : ""} ${className}`}
    >
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white/60" />
        <Input
          type="search"
          placeholder={isMobile ? "Search..." : "Search... (Press /)"}
          className="search-input h-10 pl-10 pr-20" // Increased padding right for buttons
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          ref={searchInputRef}
        />

        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-10 top-1/2 h-8 w-8 -translate-y-1/2 transform text-white/50 hover:text-white"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Button
          type="submit"
          size="icon"
          className="search-button absolute right-2.5 top-1/2 -translate-y-1/2 transform" // Adjusted right position
          aria-label="Search"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>

        {showSuggestions && (
          <div ref={suggestionsRef} className="search-suggestions">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-white/70">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : searchSuggestions.length > 0 ? (
              <>
                {searchSuggestions.map((item, index) => (
                  <button
                    key={`${item.media_type}-${item.id}`}
                    className={`suggestion-item ${
                      index === selectedIndex ? "bg-white/10" : ""
                    }`}
                    onClick={() => handleSuggestionClick(item)}
                  >
                    <span className="mr-2 flex-shrink-0">
                      {item.media_type === "movie" ? (
                        <Film className="h-4 w-4 text-white/70" />
                      ) : (
                        <Tv className="h-4 w-4 text-white/70" />
                      )}
                    </span>
                    <span className="flex-1 truncate text-left">
                      {item.title || item.name}
                    </span>
                    <span className="ml-2 flex-shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-xs opacity-50">
                      Enter
                    </span>
                  </button>
                ))}
                <button
                  onClick={handleSearch}
                  className="suggestion-item justify-center font-medium text-white/90"
                >
                  View all results for "{searchQuery}"
                </button>
              </>
            ) : (
              <div className="px-4 py-3 text-center text-sm text-white/50">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
