import { useState, useEffect, Suspense, lazy } from "react";
import {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
  getTopRatedTVShows,
} from "@/utils/api";
import { Media } from "@/utils/types";
import { useAuth } from "@/hooks";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ContentRow from "@/components/ContentRow";
import ContinueWatching from "@/components/ContinueWatching";
import Footer from "@/components/Footer";
import Spinner from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-loaded secondary content
const SecondaryContent = lazy(() => import("./components/SecondaryContent"));

const Index = () => {
  const { user } = useAuth();
  const [trendingMedia, setTrendingMedia] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<Media[]>([]);
  // const [topRatedMovies, setTopRatedMovies] = useState<Media[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);

  // Primary data fetch - critical for initial render
  useEffect(() => {
    const fetchPrimaryData = async () => {
      try {
        // Use Promise.all for parallel requests
        const [trendingData, popularMoviesData, popularTVData, topTVData] =
          await Promise.all([
            getTrending(),
            getPopularMovies(),
            getPopularTVShows(),
            getTopRatedTVShows(),
          ]);

        const filteredTrendingData = trendingData.filter(
          item => item.backdrop_path
        );

        setTrendingMedia(filteredTrendingData);
        setPopularMovies(popularMoviesData);
        setPopularTVShows(popularTVData);
        setTopRatedTVShows(topTVData);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setIsLoading(false);
        // Add a slight delay for content fade-in
        setTimeout(() => {
          setContentVisible(true);
        }, 100); // Reduced from 300ms to 100ms for faster perceived performance

        // After primary content is visible, load secondary content
        setTimeout(() => {
          setSecondaryLoaded(true);
        }, 1000);
      }
    };

    fetchPrimaryData();
  }, []);

  // Content placeholder skeleton
  const RowSkeleton = () => (
    <div className="mb-8">
      <Skeleton className="mb-4 h-8 w-48" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-64 flex-shrink-0 rounded-lg" />
        ))}
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen min-h-svh w-full flex-col overflow-x-hidden bg-background">
      <Navbar />

      <div className="flex w-full flex-1 flex-col items-stretch justify-start">
        {isLoading ? (
          <div className="flex w-full flex-1 flex-col gap-8 px-0 pt-24 md:px-0">
            <Skeleton className="h-[60vh] w-full rounded-none" />{" "}
            {/* Hero skeleton */}
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : (
          <>
            <div className="w-full flex-shrink-0 pt-16">
              {" "}
              {/* Add padding-top to account for navbar */}
              {trendingMedia.length > 0 && (
                <Hero
                  media={trendingMedia.slice(0, 10)}
                  className="hero w-full"
                />
              )}
            </div>

            <div
              className={`mt-8 flex w-full flex-1 flex-col px-0 transition-opacity duration-300 md:mt-12 md:px-0 ${contentVisible ? "opacity-100" : "opacity-0"}`}
            >
              <div className="container mx-auto px-6 md:px-10 lg:px-16">
                {user && <ContinueWatching />}
                <ContentRow
                  title="Trending Now"
                  media={trendingMedia}
                  featured
                />
                <ContentRow title="Popular Movies" media={popularMovies} />
                <ContentRow title="Popular TV Shows" media={popularTVShows} />
                <ContentRow
                  title="Top Rated TV Shows"
                  media={topRatedTVShows}
                />
                {/* Lazy load secondary content */}
                {secondaryLoaded && (
                  <Suspense
                    fallback={
                      <div className="py-8">
                        <Spinner size="lg" className="mx-auto" />
                      </div>
                    }
                  >
                    <SecondaryContent />
                  </Suspense>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
};

export default Index;
