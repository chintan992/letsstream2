import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/pagination";
import MediaGrid from "@/components/MediaGrid";

// Match the ExtendedMedia interface from MediaGrid
interface ExtendedMedia {
  id: string | number;
  media_id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  media_type: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

interface SearchResultsProps {
  displayedResults: ExtendedMedia[];
  allResults: ExtendedMedia[];
  isLoading: boolean;
  query: string;
  hasMore: boolean;
  onShowMore: () => void;
}

const SearchResults = ({
  displayedResults,
  allResults,
  isLoading,
  query,
  hasMore,
  onShowMore,
}: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-white">Loading results...</div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="py-12 text-center text-white/70">
        <p>Enter a search term to find movies and TV shows</p>
        <p className="mt-2 text-sm">
          Pro tip: Press "/" anywhere to quickly search
        </p>
      </div>
    );
  }

  return (
    <div>
      <MediaGrid media={displayedResults} title={`Results for "${query}"`} />

      {hasMore && (
        <div className="my-8 flex justify-center">
          <Button
            onClick={onShowMore}
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
                Showing {displayedResults.length} of {allResults.length} results
              </div>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {allResults.length > 0 && (
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="search-tips" className="border-white/10">
            <AccordionTrigger className="text-white hover:text-accent">
              Search Tips
            </AccordionTrigger>
            <AccordionContent className="text-white/70">
              <ul className="list-inside list-disc space-y-2">
                <li>
                  Use the advanced search options to filter by media type and
                  sort results
                </li>
                <li>
                  Press the "/" key anywhere on the site to quickly focus the
                  search bar
                </li>
                <li>Try using more specific terms for better results</li>
                <li>Use the search suggestions that appear as you type</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export default SearchResults;
