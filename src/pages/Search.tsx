import { useState, useEffect, useRef, useCallback } from "react";
import {
  triggerHapticFeedback,
  triggerSuccessHaptic,
} from "@/utils/haptic-feedback";
import { trackEvent } from "@/lib/analytics";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchMedia } from "@/utils/api";
import { Media } from "@/utils/types";
import Navbar from "@/components/Navbar";
import MediaGrid from "@/components/MediaGrid";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { Search as SearchIcon, X, Filter, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SearchSuggestions from "@/components/SearchSuggestions";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";

const RESULTS_PER_PAGE = 20;

interface ExtendedMedia extends Omit<Media, "id"> {
  id: string | number;
  media_id: number;
  docId?: string;
  created_at?: string;
  watch_position?: number;
  duration?: number;
}

// Define the interface for the persisted state
interface SearchPageState {
  page: number;
  mediaType: string;
  sortBy: string;
  advancedSearch: boolean;
  resultIds: (string | number)[]; // Store only IDs to minimize storage
  queryParam: string; // Store query to validate state matches current search
}

const Search = () => {
  const [searchParams] = useSearchParams();

  // State for hydration tracking
  const [isHydrated, setIsHydrated] = useState(false);

  // Use page state persistence hook based on search query
  const searchQuery = searchParams.get("q") || "";
  const storageKey = `search-state-${searchQuery}`;

  const [persistedState, setPersistedState] =
    usePageStatePersistence<SearchPageState>(storageKey, {
      page: 1,
      mediaType: "all",
      sortBy: "popularity",
      advancedSearch: false,
      resultIds: [],
      queryParam: searchQuery,
    });

  // Initialize state from persisted state only if query matches
  const [allResults, setAllResults] = useState<ExtendedMedia[]>([]);
  const [displayedResults, setDisplayedResults] = useState<ExtendedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(() => {
    // Only use persisted state if the query matches
    return searchQuery && searchQuery === persistedState.queryParam
      ? persistedState.page
      : 1;
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [advancedSearch, setAdvancedSearch] = useState(() => {
    return searchQuery && searchQuery === persistedState.queryParam
      ? persistedState.advancedSearch
      : false;
  });
  const [mediaType, setMediaType] = useState<string>(() => {
    return searchQuery && searchQuery === persistedState.queryParam
      ? persistedState.mediaType
      : searchParams.get("type") || "all";
  });
  const [sortBy, setSortBy] = useState<string>(() => {
    return searchQuery && searchQuery === persistedState.queryParam
      ? persistedState.sortBy
      : searchParams.get("sort") || "popularity";
  });

  // Apply scroll restoration only after hydration
  useScrollRestoration({ enabled: isHydrated });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("searchHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [mediaSuggestions, setMediaSuggestions] = useState<Media[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        toast({
          title: "Search Shortcut",
          description: "Press / anytime to quickly search",
          duration: 2000,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const generateSuggestions = useCallback(
    async (input: string) => {
      if (!input || input.length < 2) {
        setSuggestions([]);
        setMediaSuggestions([]);
        return;
      }

      try {
        const results = await searchMedia(input);

        setMediaSuggestions(results.slice(0, 4));

        const apiSuggestions = results
          .slice(0, 3)
          .map(item => item.title || item.name || "");

        const historySuggestions = searchHistory
          .filter(h => h.toLowerCase().includes(input.toLowerCase()))
          .slice(0, 2);

        const combinedSuggestions = [
          ...new Set([...historySuggestions, ...apiSuggestions]),
        ];
        setSuggestions(combinedSuggestions);
      } catch (error) {
        console.error("Error generating suggestions:", error);
      }
    },
    [searchHistory]
  );

  // State to track if we've already restored for this query
  const [hasRestoredForQuery, setHasRestoredForQuery] = useState<string | null>(
    null
  );

  // Effect to handle search results restoration
  useEffect(() => {
    const searchQuery = searchParams.get("q");

    // If no search query, reset and mark as hydrated
    if (!searchQuery) {
      setAllResults([]);
      setDisplayedResults([]);
      setHasRestoredForQuery(null);
      setIsHydrated(true);
      return;
    }

    // If we've already restored for this query, don't run again
    if (hasRestoredForQuery === searchQuery && isHydrated) {
      return;
    }

    // Set the query being restored to prevent loops
    setHasRestoredForQuery(searchQuery);

    // Check if we have persisted state for this query and if it's valid
    if (
      searchQuery === persistedState.queryParam &&
      persistedState.resultIds.length > 0
    ) {
      // Try to restore from persisted state
      const fetchSearchResults = async () => {
        setIsLoading(true);
        try {
          const results = await searchMedia(searchQuery);

          let filteredResults = results.map(item => ({
            ...item,
            id: item.id,
            media_id: item.id,
            media_type: item.media_type,
            title: item.title || "",
            name: item.name || "",
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            overview: item.overview,
            vote_average: item.vote_average,
            release_date: item.release_date,
            first_air_date: item.first_air_date,
            genre_ids: item.genre_ids,
          })) as ExtendedMedia[];

          if (mediaType !== "all") {
            filteredResults = filteredResults.filter(
              item => item.media_type === mediaType
            );
          }

          const sortedResults = [...filteredResults];
          if (sortBy === "rating") {
            sortedResults.sort((a, b) => b.vote_average - a.vote_average);
          } else if (sortBy === "newest") {
            sortedResults.sort((a, b) => {
              const dateA = a.release_date || a.first_air_date || "";
              const dateB = b.release_date || b.first_air_date || "";
              return dateB.localeCompare(dateA);
            });
          }

          // Filter to only the results that correspond to the persisted IDs
          const restoredResults = sortedResults.filter(item =>
            persistedState.resultIds.includes(item.id)
          );

          setAllResults(restoredResults);

          // Set displayed results based on the persisted page
          const startIndex = (persistedState.page - 1) * RESULTS_PER_PAGE;
          const endIndex = startIndex + RESULTS_PER_PAGE;
          setDisplayedResults(restoredResults.slice(startIndex, endIndex));
          setPage(persistedState.page);
        } catch (error) {
          console.error("Error fetching search results:", error);
          // If restoration fails, fall back to fresh search
          performNewSearch(searchQuery);
        } finally {
          setIsLoading(false);
          setIsHydrated(true);
        }
      };

      fetchSearchResults();
    } else {
      // Perform fresh search if no persisted state
      performNewSearch(searchQuery);
    }

    setQuery(searchQuery);
    setMediaType(searchParams.get("type") || "all");
    setSortBy(searchParams.get("sort") || "popularity");
  }, [
    searchParams,
    toast,
    mediaType,
    sortBy,
    persistedState.resultIds,
    persistedState.queryParam,
    hasRestoredForQuery,
    isHydrated,
  ]);

  // Helper function to perform a new search
  const performNewSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const results = await searchMedia(searchQuery);

      let filteredResults = results.map(item => ({
        ...item,
        id: item.id,
        media_id: item.id,
        media_type: item.media_type,
        title: item.title || "",
        name: item.name || "",
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        vote_average: item.vote_average,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        genre_ids: item.genre_ids,
      })) as ExtendedMedia[];

      if (mediaType !== "all") {
        filteredResults = filteredResults.filter(
          item => item.media_type === mediaType
        );
      }

      const sortedResults = [...filteredResults];
      if (sortBy === "rating") {
        sortedResults.sort((a, b) => b.vote_average - a.vote_average);
      } else if (sortBy === "newest") {
        sortedResults.sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || "";
          const dateB = b.release_date || b.first_air_date || "";
          return dateB.localeCompare(dateA);
        });
      }

      setAllResults(sortedResults);
      setDisplayedResults(sortedResults.slice(0, RESULTS_PER_PAGE));
      setPage(1); // Reset to page 1 for new searches
    } catch (error) {
      console.error("Error fetching search results:", error);
      setAllResults([]);
      setDisplayedResults([]);
      toast({
        title: "Search Error",
        description: "Failed to retrieve search results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsHydrated(true);
    }
  };

  const updateSearchHistory = useCallback((term: string) => {
    setSearchHistory(prev => {
      const newHistory = [term, ...prev.filter(h => h !== term)].slice(0, 5);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Effect to update persisted state when results or search parameters change
  useEffect(() => {
    // Only update persisted state if we have search results
    if (searchParams.get("q") && allResults.length > 0) {
      setPersistedState(prevState => ({
        ...prevState,
        queryParam: searchParams.get("q") || "",
        page,
        mediaType,
        sortBy,
        advancedSearch,
        resultIds: allResults.map(result => result.id),
      }));
    }
  }, [
    searchParams,
    allResults,
    page,
    mediaType,
    sortBy,
    advancedSearch,
    setPersistedState,
  ]);

  const handleSearch = async (e?: React.FormEvent) => {
    triggerHapticFeedback(20);
    if (e) {
      e.preventDefault();
    }
    if (!query.trim()) return;
    let searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;
    if (advancedSearch) {
      if (mediaType !== "all") {
        searchUrl += `&type=${mediaType}`;
      }
      if (sortBy !== "popularity") {
        searchUrl += `&sort=${sortBy}`;
      }
    }
    updateSearchHistory(query.trim());
    // Analytics: log search event
    await trackEvent({
      name: "search",
      params: {
        query: query.trim(),
        mediaType,
        sortBy,
        advanced: advancedSearch,
      },
    });
    navigate(searchUrl);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setQuery("");
    setShowSuggestions(false);
    navigate("/search");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    generateSuggestions(value);
    if (value.length > 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string | Media) => {
    if (typeof suggestion === "string") {
      setQuery(suggestion);
      updateSearchHistory(suggestion);
      // Analytics: log search suggestion click
      await trackEvent({
        name: "search_suggestion_click",
        params: {
          suggestion,
          query,
        },
      });
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    } else {
      // Analytics: log search result click
      await trackEvent({
        name: "search_result_click",
        params: {
          mediaId: suggestion.id,
          mediaType: suggestion.media_type,
          title: suggestion.title || suggestion.name,
          query,
        },
      });
      navigate(`/${suggestion.media_type}/${suggestion.id}`);
      toast({
        title: "Navigating...",
        description: `Going to ${suggestion.title || suggestion.name}`,
        duration: 2000,
      });
      const term = suggestion.title || suggestion.name || "";
      if (term) {
        updateSearchHistory(term);
      }
    }
    setShowSuggestions(false);
  };

  const handleShowMore = () => {
    const nextPage = page + 1;
    const nextResults = allResults.slice(0, nextPage * RESULTS_PER_PAGE);
    setDisplayedResults(nextResults);
    setPage(nextPage);
    // Update the persisted state when page changes
    setPersistedState(prevState => ({
      ...prevState,
      page: nextPage,
    }));
  };

  const hasMoreResults = allResults.length > displayedResults.length;

  const toggleAdvancedSearch = () => {
    triggerHapticFeedback(20);
    setAdvancedSearch(prev => {
      const newAdvancedSearch = !prev;
      // Update the persisted state when advanced search changes
      setPersistedState(prevState => ({
        ...prevState,
        advancedSearch: newAdvancedSearch,
      }));
      return newAdvancedSearch;
    });
  };

  const clearSearchHistory = () => {
    triggerHapticFeedback(15);
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
    toast({
      title: "Search history cleared",
      description: "Your search history has been cleared.",
      duration: 2000,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="mx-auto w-full max-w-6xl flex-grow px-4 pt-24 md:px-8">
        <h1 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          Search
        </h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search for movies, TV shows..."
                className="h-12 border-white/10 bg-white/10 pl-10 pr-10 text-white placeholder:text-white/50"
                value={query}
                onChange={handleInputChange}
                onFocus={() => query.length > 1 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-white/50" />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {showSuggestions &&
                (mediaSuggestions.length > 0 ? (
                  <SearchSuggestions
                    suggestions={mediaSuggestions}
                    onSuggestionClick={handleSuggestionClick}
                    searchQuery={query}
                    onViewAllResults={() => handleSearch()}
                  />
                ) : suggestions.length > 0 ? (
                  <SearchSuggestions
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                    searchQuery={query}
                    onViewAllResults={() => handleSearch()}
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

              <Button
                type="button"
                variant="outline"
                className="h-12 border-white/10 text-white"
                onClick={toggleAdvancedSearch}
              >
                <Filter className="mr-2 h-4 w-4" />
                Advanced Search
              </Button>
            </div>

            {advancedSearch && (
              <div className="animate-fade-in rounded-md bg-white/5 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Media Type
                    </label>
                    <Select
                      value={mediaType}
                      onValueChange={value => {
                        setMediaType(value);
                        // Update the persisted state when media type changes
                        setPersistedState(prevState => ({
                          ...prevState,
                          mediaType: value,
                        }));
                      }}
                    >
                      <SelectTrigger className="border-white/10 bg-white/10 text-white">
                        <SelectValue placeholder="Select media type" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-background">
                        <SelectItem value="all" className="text-white">
                          All
                        </SelectItem>
                        <SelectItem value="movie" className="text-white">
                          Movies
                        </SelectItem>
                        <SelectItem value="tv" className="text-white">
                          TV Shows
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Sort By
                    </label>
                    <Select
                      value={sortBy}
                      onValueChange={value => {
                        setSortBy(value);
                        // Update the persisted state when sort changes
                        setPersistedState(prevState => ({
                          ...prevState,
                          sortBy: value,
                        }));
                      }}
                    >
                      <SelectTrigger className="border-white/10 bg-white/10 text-white">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-background">
                        <SelectItem value="popularity" className="text-white">
                          Popularity
                        </SelectItem>
                        <SelectItem value="rating" className="text-white">
                          Rating
                        </SelectItem>
                        <SelectItem value="newest" className="text-white">
                          Newest
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {!searchParams.get("q") && searchHistory.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Recent Searches
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearchHistory}
                className="text-white/70 hover:text-white"
              >
                Clear History
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/10"
                  onClick={() => {
                    setQuery(term);
                    navigate(`/search?q=${encodeURIComponent(term)}`);
                  }}
                >
                  <SearchIcon className="mr-2 h-4 w-4" />
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-white">Loading results...</div>
          </div>
        ) : (
          <>
            {searchParams.get("q") ? (
              <div>
                <MediaGrid
                  media={displayedResults}
                  title={`Results for "${searchParams.get("q")}"`}
                />

                {hasMoreResults && (
                  <div className="my-8 flex justify-center">
                    <Button
                      onClick={handleShowMore}
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      Show More <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {allResults.length > 0 && (
                  <Pagination className="my-8">
                    <PaginationContent>
                      <PaginationItem>
                        <div className="text-sm text-white/70">
                          Showing {displayedResults.length} of{" "}
                          {allResults.length} results
                        </div>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}

                {allResults.length > 0 && (
                  <Accordion type="single" collapsible className="mb-8">
                    <AccordionItem
                      value="search-tips"
                      className="border-white/10"
                    >
                      <AccordionTrigger className="text-white hover:text-accent">
                        Search Tips
                      </AccordionTrigger>
                      <AccordionContent className="text-white/70">
                        <ul className="list-inside list-disc space-y-2">
                          <li>
                            Use the advanced search options to filter by media
                            type and sort results
                          </li>
                          <li>
                            Press the "/" key anywhere on the site to quickly
                            focus the search bar
                          </li>
                          <li>
                            Try using more specific terms for better results
                          </li>
                          <li>
                            Use the search suggestions that appear as you type
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-white/70">
                <p>Enter a search term to find movies and TV shows</p>
                <p className="mt-2 text-sm">
                  Pro tip: Press "/" anywhere to quickly search
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Search;
