import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import { Button } from "@/components/ui/button";
import ContentRow from "@/components/ContentRow";
import Navbar from "@/components/Navbar";
import ReviewSection from "@/components/ReviewSection";
import TVShowHeader from "@/components/tv/TVShowHeader";
import TVShowEpisodes from "@/components/tv/TVShowEpisodes";
import TVShowAbout from "@/components/tv/TVShowAbout";
import TVShowCast from "@/components/tv/TVShowCast";
import TVShowCreators from "@/components/tv/TVShowCreators";
import TVShowImages from "@/components/tv/TVShowImages";
import TVShowKeywords from "@/components/tv/TVShowKeywords";
import TVShowNetworks from "@/components/tv/TVShowNetworks";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTVDetails } from "@/hooks/use-tv-details";
import { DownloadSection } from "@/components/DownloadSection";
import { TVDownloadSection } from "@/components/tv/TVDownloadSection";
import { useAuth } from "@/hooks";

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
  const [lastWatchedEpisode, setLastWatchedEpisode] = useState<{
    season: number;
    episode: number;
    progress: number;
    episodeTitle: string;
    episodeThumbnail: string | null;
    timeRemaining: number;
    watchPosition: number;
    duration: number;
  } | null>(null);
  const [isLastWatchedLoading, setIsLastWatchedLoading] = useState(false);
  const { user } = useAuth();

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
    contentRatings,
    guestStars,
  } = useTVDetails(id);

  // Tab-aware scroll restoration with hydration tracking
  useScrollRestoration({
    storageKey: `scroll-tv-details-${activeTab}${activeTab === "episodes" ? "-s" + selectedSeason : ""}`,
    enabled: isContentHydrated,
  });

  // Fetch last watched episode when tvShow changes
  useEffect(() => {
    const fetchLastWatchedEpisode = async () => {
      if (!tvShow) return;

      try {
        setIsLastWatchedLoading(true);
        const episode = await getLastWatchedEpisode();
        setLastWatchedEpisode(episode);
      } catch (error) {
        console.error("Error fetching last watched episode:", error);
        setLastWatchedEpisode(null);
      } finally {
        setIsLastWatchedLoading(false);
      }
    };

    if (tvShow?.id) {
      fetchLastWatchedEpisode();
    }
  }, [tvShow, getLastWatchedEpisode]);

  // Handle hydration tracking for different tabs
  useEffect(() => {
    let isCancelled = false;

    const checkHydration = async () => {
      if (isCancelled) return;

      // Reset hydration status when tab changes or season changes (for episodes tab)
      setIsContentHydrated(false);

      // Add small delay to allow tab content to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (isCancelled) return;

      let hydrated = false;

      switch (activeTab) {
        case "episodes":
          // Episodes tab is hydrated when episodes data is available for the selected season
          hydrated = episodes && episodes.length > 0;
          break;
        case "about":
          // About tab is hydrated when tvShow data is available
          hydrated = !!tvShow;
          break;
        case "cast":
          // Cast tab is hydrated when cast data is available
          hydrated = !!tvShow && cast && cast.length > 0;
          break;
        case "reviews":
          // Reviews tab is considered hydrated immediately as ReviewSection handles its own loading
          hydrated = true;
          break;
        case "downloads":
          // Downloads tab is considered hydrated immediately as it lazy loads on user action
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
        <div className="hide-scrollbar mb-8 flex overflow-x-auto pb-2">
          <div className="flex space-x-1">
            <button
              className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "episodes"
                ? "shadow-accent/20 bg-accent text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setActiveTab("episodes")}
            >
              Episodes
            </button>
            <button
              className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "about"
                ? "shadow-accent/20 bg-accent text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setActiveTab("about")}
            >
              About
            </button>
            <button
              className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "cast"
                ? "shadow-accent/20 bg-accent text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setActiveTab("cast")}
            >
              Cast
            </button>
            <button
              className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "creators"
                ? "shadow-accent/20 bg-accent text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setActiveTab("creators")}
            >
              Creators
            </button>
            <button
              className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "reviews"
                ? "shadow-accent/20 bg-accent text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews
            </button>
            <button
              className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "keywords"
                ? "shadow-accent/20 bg-accent text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setActiveTab("keywords")}
            >
              Keywords
            </button>
            <button
              className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "networks"
                ? "shadow-accent/20 bg-accent text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setActiveTab("networks")}
            >
              Networks
            </button>
            <button
              className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "images"
                ? "shadow-accent/20 bg-accent text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setActiveTab("images")}
            >
              Images
            </button>
            {user && (
              <button
                className={`whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 ${activeTab === "downloads"
                  ? "shadow-accent/20 bg-accent text-white shadow-lg"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                onClick={() => setActiveTab("downloads")}
              >
                Downloads
              </button>
            )}
          </div>
        </div>

        <div className="transition-all duration-300 ease-in-out">
          {activeTab === "episodes" && (
            <TVShowEpisodes
              seasons={tvShow.seasons}
              episodes={episodes}
              selectedSeason={selectedSeason}
              onSeasonChange={setSelectedSeason}
              onPlayEpisode={handlePlayEpisode}
              guestStars={guestStars}
            />
          )}

          {activeTab === "about" && <TVShowAbout tvShow={tvShow} />}

          {activeTab === "cast" && <TVShowCast cast={cast} />}

          {activeTab === "creators" && <TVShowCreators creators={creators} />}

          {activeTab === "reviews" && (
            <div className="mb-8">
              <h2 className="mb-6 text-2xl font-bold text-white">
                User Reviews
              </h2>
              <ReviewSection mediaId={parseInt(id!, 10)} mediaType="tv" />
            </div>
          )}

          {activeTab === "keywords" && <TVShowKeywords keywords={keywords} />}

          {activeTab === "networks" && <TVShowNetworks networks={networks} />}

          {activeTab === "images" && (
            <TVShowImages
              images={images}
              tvShowName={tvShow?.name || "TV Show"}
            />
          )}

          {activeTab === "downloads" && (
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
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <ContentRow title="More Like This" media={recommendations} />
      )}
    </div>
  );
};

export default TVDetailsPage;
