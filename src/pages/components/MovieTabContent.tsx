import { useInfiniteQuery } from "@tanstack/react-query";
import { getPopularMovies, getTopRatedMovies } from "@/utils/api";
import { ensureExtendedMediaArray } from "@/utils/types";
import MediaGrid from "@/components/MediaGrid";
import { MediaGridSkeleton } from "@/components/MediaSkeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

interface MovieTabContentProps {
    type: "popular" | "top_rated";
    viewMode: "grid" | "list";
    sortBy: "default" | "title" | "release_date" | "rating";
    genreFilter: string;
}

const MovieTabContent = ({
    type,
    viewMode,
    sortBy,
    genreFilter,
}: MovieTabContentProps) => {
    const getQueryFn = ({ pageParam = 1 }) => {
        switch (type) {
            case "popular":
                return getPopularMovies(pageParam);
            case "top_rated":
                return getTopRatedMovies(pageParam);
            default:
                return getPopularMovies(pageParam);
        }
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: [type === "popular" ? "popularMovies" : "topRatedMovies"],
        queryFn: getQueryFn,
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            // Assuming API returns empty array or less than 20 items when no more pages
            return lastPage.length === 20 ? allPages.length + 1 : undefined;
        },
    });

    // Flatten the pages into a single array of movies
    const allMovies = useMemo(() => {
        return data?.pages.flatMap(page => page) || [];
    }, [data]);

    // Filter and sort movies based on current criteria
    const filteredMovies = useMemo(() => {
        let movies = [...allMovies];

        if (genreFilter !== "all") {
            movies = movies.filter(movie =>
                movie.genre_ids?.includes(parseInt(genreFilter))
            );
        }

        switch (sortBy) {
            case "title":
                movies.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "release_date":
                movies.sort(
                    (a, b) =>
                        new Date(b.release_date).getTime() -
                        new Date(a.release_date).getTime()
                );
                break;
            case "rating":
                movies.sort((a, b) => b.vote_average - a.vote_average);
                break;
            default:
                break;
        }

        return movies;
    }, [allMovies, genreFilter, sortBy]);

    // Loading state handler
    if (isLoading) {
        return <MediaGridSkeleton listView={viewMode === "list"} />;
    }

    // Error state handler
    if (isError) {
        return (
            <div className="py-12 text-center text-white">
                Error loading movies. Please try again.
            </div>
        );
    }

    // Determine the title based on the type
    const title = type === "popular" ? "Popular Movies" : "Top Rated Movies";

    return (
        <>
            <MediaGrid
                media={ensureExtendedMediaArray(filteredMovies)}
                title={title}
                listView={viewMode === "list"}
            />
            {hasNextPage && (
                <div className="my-8 flex justify-center">
                    <Button
                        onClick={() => fetchNextPage()}
                        variant="outline"
                        className="hover:bg-accent/20 hover:border-accent/50 border-white/10 text-white transition-all duration-300 hover:text-white"
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? (
                            <>Loading...</>
                        ) : (
                            <>
                                Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" />
                            </>
                        )}
                    </Button>
                </div>
            )}
        </>
    );
};

export default MovieTabContent;
