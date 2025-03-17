
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTVDetails, getSeasonDetails, backdropSizes, posterSizes } from '@/utils/api';
import { TVDetails, Episode } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import { Play, Calendar, Star, ArrowLeft, List } from 'lucide-react';

const TVDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [tvShow, setTVShow] = useState<TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const navigate = useNavigate();
  
  // Fetch TV show details
  useEffect(() => {
    const fetchTVDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const tvId = parseInt(id, 10);
        const data = await getTVDetails(tvId);
        setTVShow(data);
        
        if (data && data.seasons && data.seasons.length > 0) {
          // Set default season to the first one
          const firstSeason = data.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
            setSelectedSeason(firstSeason.season_number);
          }
        }
      } catch (error) {
        console.error('Error fetching TV show details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTVDetails();
  }, [id]);
  
  // Fetch episodes when selected season changes
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvShow || !selectedSeason) return;
      
      try {
        const episodesData = await getSeasonDetails(tvShow.id, selectedSeason);
        setEpisodes(episodesData);
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    };
    
    fetchEpisodes();
  }, [tvShow, selectedSeason]);
  
  const handlePlayEpisode = (seasonNumber: number, episodeNumber: number) => {
    if (tvShow) {
      navigate(`/player/tv/${tvShow.id}/${seasonNumber}/${episodeNumber}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse-slow text-white font-medium">Loading...</div>
      </div>
    );
  }
  
  if (!tvShow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <h1 className="text-2xl text-white mb-4">TV Show not found</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }
  
  const formatSeasonEpisodeCount = (count: number) => {
    return `${count} ${count === 1 ? 'Episode' : 'Episodes'}`;
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Backdrop Image */}
      <div className="relative w-full h-[70vh]">
        {/* Loading skeleton */}
        {!backdropLoaded && (
          <div className="absolute inset-0 bg-background image-skeleton" />
        )}
        
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-20 left-6 z-10 text-white p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <img
          src={`${backdropSizes.original}${tvShow.backdrop_path}`}
          alt={tvShow.name || 'TV Show backdrop'}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            backdropLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setBackdropLoaded(true)}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 details-gradient" />
        
        {/* TV show info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
          <div className="flex flex-col md:flex-row items-start gap-6 max-w-6xl mx-auto">
            <div className="hidden md:block flex-shrink-0 w-48 xl:w-64 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={`${posterSizes.medium}${tvShow.poster_path}`} 
                alt={tvShow.name || 'TV show poster'} 
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex-1 animate-slide-up">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 text-balance">
                {tvShow.name}
              </h1>
              
              {tvShow.tagline && (
                <p className="text-white/70 mb-4 italic text-lg">{tvShow.tagline}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {tvShow.first_air_date && (
                  <div className="flex items-center text-white/80">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(tvShow.first_air_date).getFullYear()}
                  </div>
                )}
                
                <div className="flex items-center text-white/80">
                  <List className="h-4 w-4 mr-2" />
                  {tvShow.number_of_seasons} {tvShow.number_of_seasons === 1 ? 'Season' : 'Seasons'}
                </div>
                
                {tvShow.vote_average > 0 && (
                  <div className="flex items-center text-amber-400">
                    <Star className="h-4 w-4 mr-2 fill-amber-400" />
                    {tvShow.vote_average.toFixed(1)}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {tvShow.genres.map((genre) => (
                    <span 
                      key={genre.id}
                      className="px-2 py-1 rounded bg-white/10 text-white/80 text-xs"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-white/80 mb-6">{tvShow.overview}</p>
              
              {episodes.length > 0 && (
                <Button 
                  onClick={() => handlePlayEpisode(selectedSeason, 1)}
                  className="bg-accent hover:bg-accent/80 text-white flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play Latest Episode
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Seasons and Episodes */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Seasons & Episodes</h2>
        
        {/* Season selector */}
        <div className="mb-6">
          <TabsList className="bg-white/10 p-1">
            {tvShow.seasons
              .filter(season => season.season_number > 0)
              .map(season => (
                <TabsTrigger 
                  key={season.id}
                  value={season.season_number.toString()}
                  onClick={() => setSelectedSeason(season.season_number)}
                  className={selectedSeason === season.season_number ? 'text-white' : 'text-white/70'}
                >
                  Season {season.season_number}
                </TabsTrigger>
              ))}
          </TabsList>
        </div>
        
        {/* Episodes list */}
        <div className="space-y-4">
          {episodes.length > 0 ? (
            episodes.map(episode => (
              <div key={episode.id} className="glass p-4 rounded-lg">
                <div className="flex flex-col md:flex-row gap-4">
                  {episode.still_path && (
                    <div className="flex-shrink-0 w-full md:w-48">
                      <img 
                        src={`${backdropSizes.small}${episode.still_path}`} 
                        alt={`${episode.name} still`}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">
                        {episode.episode_number}. {episode.name}
                      </h3>
                      {episode.vote_average > 0 && (
                        <div className="flex items-center text-amber-400 text-sm">
                          <Star className="h-3 w-3 mr-1 fill-amber-400" />
                          {episode.vote_average.toFixed(1)}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">{episode.overview}</p>
                    
                    <Button 
                      onClick={() => handlePlayEpisode(episode.season_number, episode.episode_number)}
                      size="sm"
                      className="bg-accent hover:bg-accent/80 text-white flex items-center"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-white/70">
              No episodes available for this season.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVDetailsPage;
