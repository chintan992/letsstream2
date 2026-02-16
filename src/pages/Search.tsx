import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  triggerHapticFeedback,
  triggerSuccessHaptic,
} from "@/utils/haptic-feedback";
import { trackEvent } from "@/lib/analytics";
import { searchMedia } from "@/utils/api";
import { Media } from "@/utils/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import {
  SearchForm,
  SearchFilters,
  SearchHistory,
  SearchResults,
} from "@/components/search";

const RESULTS_PER_PAGE = 20;

interface ExtendedMedia extends Omit<Media, "id"> {
  id: string | number;
  media_id: number;
  docId?: string;
  created_at?: string;
  watch_position?: number;
  duration?: number;
}

interface SearchPageState {
  page: number;
  mediaType: string;
  sortBy: string;
  advancedSearch: boolean;
  resultIds: (string | number)[];
  queryParam: string;
}

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [mediaSuggestions, setMediaSuggestions] = useState<Media[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("searchHistory");
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Error parsing search history:", error);
      localStorage.removeItem("searchHistory");
      return [];
    }
  });

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
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

  // Debounce search term for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Generate suggestions
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

    if (!searchQuery) {
      setAllResults([]);
      setDisplayedResults([]);
      setHasRestoredForQuery(null);
      setIsHydrated(true);
      return;
    }

    if (hasRestoredForQuery === searchQuery && isHydrated) {
      return;
    }

    setHasRestoredForQuery(searchQuery);

    if (
      searchQuery === persistedState.queryParam &&
      persistedState.resultIds.length > 0
    ) {
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

          const restoredResults = sortedResults.filter(item =>
            persistedState.resultIds.includes(item.id)
          );

          setAllResults(restoredResults);

          const startIndex = (persistedState.page - 1) * RESULTS_PER_PAGE;
          const endIndex = startIndex + RESULTS_PER_PAGE;
          setDisplayedResults(restoredResults.slice(startIndex, endIndex));
          setPage(persistedState.page);
        } catch (error) {
          console.error("Error fetching search results:", error);
          performNewSearch(searchQuery);
        } finally {
          setIsLoading(false);
          setIsHydrated(true);
        }
      };

      fetchSearchResults();
    } else {
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
      setPage(1);
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

  const handleSearch = async () => {
    triggerHapticFeedback(20);
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

  const handleSuggestionClick = async (suggestion: string | Media) => {
    if (typeof suggestion === "string") {
      setQuery(suggestion);
      updateSearchHistory(suggestion);
      await trackEvent({
        name: "search_suggestion_click",
        params: {
          suggestion,
          query,
        },
      });
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    } else {
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

        <SearchForm
          query={query}
          onQueryChange={value => {
            setQuery(value);
            generateSuggestions(value);
          }}
          onSearch={handleSearch}
          onClear={handleClearSearch}
          showSuggestions={showSuggestions}
          onShowSuggestionsChange={setShowSuggestions}
          suggestions={suggestions}
          mediaSuggestions={mediaSuggestions}
          searchHistory={searchHistory}
          onSuggestionClick={handleSuggestionClick}
        />

        <SearchFilters
          advancedSearch={advancedSearch}
          onToggleAdvanced={toggleAdvancedSearch}
          mediaType={mediaType}
          onMediaTypeChange={value => {
            setMediaType(value);
            setPersistedState(prev => ({ ...prev, mediaType: value }));
          }}
          sortBy={sortBy}
          onSortByChange={value => {
            setSortBy(value);
            setPersistedState(prev => ({ ...prev, sortBy: value }));
          }}
        />

        {!searchParams.get("q") && searchHistory.length > 0 && (
          <SearchHistory
            history={searchHistory}
            onHistoryItemClick={term => {
              setQuery(term);
              navigate(`/search?q=${encodeURIComponent(term)}`);
            }}
            onClearHistory={clearSearchHistory}
          />
        )}

        <SearchResults
          displayedResults={displayedResults}
          allResults={allResults}
          isLoading={isLoading}
          query={searchParams.get("q") || ""}
          hasMore={hasMoreResults}
          onShowMore={handleShowMore}
        />
      </div>

      <Footer />
    </div>
  );
};

export default Search;
