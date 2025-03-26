import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getPopularMovies, getTopRatedMovies } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { MediaGridSkeleton } from '@/components/MediaSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Film, ChevronDown, Grid3X3, List } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 20;

const Movies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated'>('popular');
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allPopularMovies, setAllPopularMovies] = useState<Media[]>([]);
  const [allTopRatedMovies, setAllTopRatedMovies] = useState<Media[]>([]);
  
  const popularMoviesQuery = useQuery({
    queryKey: ['popularMovies', popularPage],
    queryFn: () => getPopularMovies(popularPage),
    placeholderData: keepPreviousData,
  });
  
  const topRatedMoviesQuery = useQuery({
    queryKey: ['topRatedMovies', topRatedPage],
    queryFn: () => getTopRatedMovies(topRatedPage),
    placeholderData: keepPreviousData,
  });

  // Update all movies when new data arrives
  useEffect(() => {
    if (popularMoviesQuery.data) {
      setAllPopularMovies(prev => {
        const newMovies = popularMoviesQuery.data.filter(
          movie => !prev.some(p => p.id === movie.id)
        );
        return [...prev, ...newMovies];
      });
    }
  }, [popularMoviesQuery.data]);

  useEffect(() => {
    if (topRatedMoviesQuery.data) {
      setAllTopRatedMovies(prev => {
        const newMovies = topRatedMoviesQuery.data.filter(
          movie => !prev.some(p => p.id === movie.id)
        );
        return [...prev, ...newMovies];
      });
    }
  }, [topRatedMoviesQuery.data]);

  // Prefetch next pages
  useEffect(() => {
    if (popularMoviesQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['popularMovies', popularPage + 1],
        queryFn: () => getPopularMovies(popularPage + 1),
      });
    }
  }, [popularPage, queryClient, popularMoviesQuery.data]);

  useEffect(() => {
    if (topRatedMoviesQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['topRatedMovies', topRatedPage + 1],
        queryFn: () => getTopRatedMovies(topRatedPage + 1),
      });
    }
  }, [topRatedPage, queryClient, topRatedMoviesQuery.data]);
  
  const handleShowMorePopular = () => {
    setPopularPage(prev => prev + 1);
  };
  
  const handleShowMoreTopRated = () => {
    setTopRatedPage(prev => prev + 1);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // Check if there are more items to load
  const hasMorePopular = popularMoviesQuery.data?.length === ITEMS_PER_PAGE;
  const hasMoreTopRated = topRatedMoviesQuery.data?.length === ITEMS_PER_PAGE;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 animate-fade-in" style={{ animationDuration: '0.5s' }}>
          <div className="container px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 pt-10">
                <Film className="h-8 w-8 text-accent animate-pulse-slow" />
                <h1 className="text-3xl font-bold text-white">Movies</h1>
              </div>
              
              <div className="flex items-center gap-4 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/10 group"
                  onClick={toggleViewMode}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <List className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                      List View
                    </>
                  ) : (
                    <>
                      <Grid3X3 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                      Grid View
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="popular" onValueChange={(value) => setActiveTab(value as 'popular' | 'top_rated')}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <TabsList className="mb-4 md:mb-0">
                  <TabsTrigger value="popular" className="data-[state=active]:bg-accent/20">Popular</TabsTrigger>
                  <TabsTrigger value="top_rated" className="data-[state=active]:bg-accent/20">Top Rated</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="popular" className="focus-visible:outline-none animate-fade-in">
                {popularMoviesQuery.isLoading ? (
                  <MediaGridSkeleton listView={viewMode === 'list'} />
                ) : popularMoviesQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={allPopularMovies} title="Popular Movies" listView={viewMode === 'list'} />
                    
                    {hasMorePopular && (
                      <div className="flex justify-center my-8">
                        <Button 
                          onClick={handleShowMorePopular}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          {popularMoviesQuery.isFetching ? (
                            <>Loading...</>
                          ) : (
                            <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="top_rated" className="focus-visible:outline-none animate-fade-in">
                {topRatedMoviesQuery.isLoading ? (
                  <MediaGridSkeleton listView={viewMode === 'list'} />
                ) : topRatedMoviesQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={allTopRatedMovies} title="Top Rated Movies" listView={viewMode === 'list'} />
                    
                    {hasMoreTopRated && (
                      <div className="flex justify-center my-8">
                        <Button 
                          onClick={handleShowMoreTopRated}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          {topRatedMoviesQuery.isFetching ? (
                            <>Loading...</>
                          ) : (
                            <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Movies;
