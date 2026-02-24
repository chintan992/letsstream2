import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentRow from "@/components/ContentRow";
import Navbar from "@/components/Navbar";
import ReviewSection from "@/components/ReviewSection";
import { TVShowHeader } from "@/components/tv/TVShowHeader";
import { TVShowEpisodes } from "@/components/tv/TVShowEpisodes";
import { TVShowAbout } from "@/components/tv/TVShowAbout";
import { TVShowCast } from "@/components/tv/TVShowCast";
import { TVShowCreators } from "@/components/tv/TVShowCreators";
import { TVShowImages } from "@/components/tv/TVShowImages";
import { TVShowKeywords } from "@/components/tv/TVShowKeywords";
import { TVShowNetworks } from "@/components/tv/TVShowNetworks";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTVDetails } from "@/hooks/use-tv-details";
import { TVDownloadSection } from "@/components/tv/TVDownloadSection";
import { useAuth } from "@/hooks";
import { useHaptic } from "@/hooks/useHaptic";

type TabType =
  | "episodes"
  | "about"
  | "cast"
  | "reviews"
  | "downloads"
  | "creators"
  | "images"
  | "keywords"
  | "networks";

const TVDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabType>("episodes");
  const [isContentHydrated, setIsContentHydrated] = useState(false);
  const [lastWatchedState, setLastWatchedState] = useState<{
    episode: {
      season: number;
      episode: number;
      progress: number;
      episodeTitle: string;
      episodeThumbnail: string | null;
      timeRemaining: number;
      watchPosition: number;
      duration: number;
    } | null;
    isLoading: boolean;
  }>({ episode: null, isLoading: false });
  const { episode: lastWatchedEpisode, isLoading: isLastWatchedLoading } =
    lastWatchedState;
  const { user } = useAuth();
  const { triggerHaptic } = useHaptic();

  const {
    tvShow,
    episodes,
    selectedSeason,
    setSelectedSeason,
    isLoading,
    error,
    recommendations,
    cast,
    trailerKey,
    isFavorite,
    isInMyWatchlist,
    handlePlayEpisode,
    handleToggleFavorite,
    handleToggleWatchlist,
    getLastWatchedEpisode,
    creators,
    images,
    keywords,
    networks,
  } = useTVDetails(id);

  // Tab-aware scroll restoration with hydration tracking
  useScrollRestoration({
    storageKey: `scroll-tv-details-${activeTab}${activeTab === "episodes" ? "-s" + selectedSeason : ""}`,
    enabled: isContentHydrated,
  });

  // Fetch last watched episode when tvShow changes
  useEffect(() => {
    let isOutdated = false;

    const fetchLastWatched = async () => {
      if (!tvShow?.id) return;

      setLastWatchedState({ episode: null, isLoading: true });

      try {
        const result = await getLastWatchedEpisode();
        if (!isOutdated) {
          setLastWatchedState({ episode: result, isLoading: false });
        }
      } catch (error) {
        console.error("Error fetching last watched episode:", error);
        if (!isOutdated) {
          setLastWatchedState({ episode: null, isLoading: false });
        }
      }
    };

    if (tvShow?.id) {
      fetchLastWatched();
    }

    return () => {
      isOutdated = true;
    };
  }, [tvShow?.id, getLastWatchedEpisode]);

  // Handle hydration tracking for different tabs
  useEffect(() => {
    let isCancelled = false;

    const checkHydration = async () => {
      if (isCancelled) return;
      await new Promise(resolve => setTimeout(resolve, 100));
      if (isCancelled) return;

      let hydrated = false;
      switch (activeTab) {
        case "episodes":
          hydrated = episodes && episodes.length > 0;
          break;
        case "about":
          hydrated = !!tvShow;
          break;
        case "cast":
          hydrated = !!tvShow && cast && cast.length > 0;
          break;
        case "reviews":
        case "downloads":
          hydrated = true;
          break;
        default:
          hydrated = true;
      }

      if (!isCancelled) {
        setIsContentHydrated(hydrated);
      }
    };

    checkHydration();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, selectedSeason, tvShow, episodes, cast]);

  // Handle hydration tracking for episodes tab specifically
  useEffect(() => {
    if (activeTab === "episodes" && episodes && episodes.length > 0) {
      setIsContentHydrated(true);
    }
  }, [episodes, activeTab]);

  // Handle hydration tracking for cast tab specifically
  useEffect(() => {
    if (activeTab === "cast" && cast && cast.length > 0) {
      setIsContentHydrated(true);
    }
  }, [cast, activeTab]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-slow font-medium text-white">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="mb-4 text-2xl text-white">{error}</h1>
        <Button onClick={() => navigate("/")} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="mb-4 text-2xl text-white">TV Show not found</h1>
        <Button onClick={() => navigate("/")} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-6 top-20 z-10 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {!isMobile && trailerKey && (
          <div className="absolute inset-0 bg-black/60">
            <iframe
              className="h-full w-full"
              title="TV Show Trailer"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailerKey}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <TVShowHeader
          tvShow={tvShow}
          isFavorite={isFavorite}
          isInWatchlist={isInMyWatchlist}
          onToggleFavorite={handleToggleFavorite}
          onToggleWatchlist={handleToggleWatchlist}
          onPlayEpisode={handlePlayEpisode}
          lastWatchedEpisode={lastWatchedEpisode}
          isLastWatchedLoading={isLastWatchedLoading}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={value => {
            triggerHaptic();
            setActiveTab(value as TabType);
          }}
        >
          <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-white/10 bg-transparent p-0">
            <TabsTrigger
              value="episodes"
              className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Episodes
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              About
            </TabsTrigger>
            <TabsTrigger
              value="cast"
              className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Cast
            </TabsTrigger>
            <TabsTrigger
              value="creators"
              className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Creators
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Reviews
            </TabsTrigger>
            <TabsTrigger
              value="keywords"
              className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Keywords
            </TabsTrigger>
            <TabsTrigger
              value="networks"
              className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Networks
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Images
            </TabsTrigger>
            {user && (
              <TabsTrigger
                value="downloads"
                className="rounded-lg px-5 py-3 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                Downloads
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="episodes">
            <TVShowEpisodes
              seasons={tvShow.seasons}
              episodes={episodes}
              selectedSeason={selectedSeason}
              onSeasonChange={setSelectedSeason}
              onPlayEpisode={handlePlayEpisode}
            />
          </TabsContent>

          <TabsContent value="about">
            <TVShowAbout tvShow={tvShow} />
          </TabsContent>

          <TabsContent value="cast">
            <TVShowCast cast={cast} />
          </TabsContent>

          <TabsContent value="creators">
            <TVShowCreators creators={creators} />
          </TabsContent>

          <TabsContent value="reviews">
            <div className="mb-8">
              <h2 className="mb-6 text-2xl font-bold text-white">
                User Reviews
              </h2>
              <ReviewSection mediaId={parseInt(id!, 10)} mediaType="tv" />
            </div>
          </TabsContent>

          <TabsContent value="keywords">
            <TVShowKeywords keywords={keywords} />
          </TabsContent>

          <TabsContent value="networks">
            <TVShowNetworks networks={networks} />
          </TabsContent>

          <TabsContent value="images">
            <TVShowImages
              images={images}
              tvShowName={tvShow?.name || "TV Show"}
            />
          </TabsContent>

          {user && (
            <TabsContent value="downloads">
              <div className="mb-8">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  Download Episodes
                </h2>
                <TVDownloadSection
                  tvShowName={tvShow.name}
                  tmdbId={tvShow.id}
                  seasons={tvShow.seasons}
                  selectedSeason={selectedSeason}
                  onSeasonChange={setSelectedSeason}
                  episodesBySeason={Object.fromEntries(
                    tvShow.seasons.map(season => [
                      season.season_number,
                      (episodes || []).filter(
                        ep => ep.season_number === season.season_number
                      ),
                    ])
                  )}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {recommendations.length > 0 && (
        <ContentRow title="More Like This" media={recommendations} />
      )}
    </div>
  );
};

export default TVDetailsPage;
