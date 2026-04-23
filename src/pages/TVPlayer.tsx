import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrollRestoration } from "@/hooks";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import VideoPlayer, { VideoPlayerRef } from "@/components/player/VideoPlayer";
import { usePlayerState } from "@/hooks/use-player-state";
import { usePluginManager } from "@/hooks/use-plugin-manager";
import { useStreamAggregator } from "@/hooks/use-stream-aggregator";
import { useWatchHistory } from "@/hooks/watch-history";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackEvent, trackMediaView } from "@/lib/analytics";
import type Player from "video.js/dist/types/player";

interface Episode {
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
}

const TVPlayer = () => {
  const { id, season, episode } = useParams<{
    id: string;
    season: string;
    episode: string;
  }>();
  const navigate = useNavigate();
  useScrollRestoration();
  const isMobile = useIsMobile();

  const playerRef = useRef<VideoPlayerRef>(null);
  const { getActivePlugins } = usePluginManager();
  const activePlugins = getActivePlugins();

  const {
    state: playerState,
    togglePlay,
    toggleLightsOut,
    toggleTheaterMode,
    skipForward,
    skipBackward,
  } = usePlayerState(playerRef.current?.player || null);

  const {
    streams,
    isLoading: streamsLoading,
    error: streamsError,
  } = useStreamAggregator(
    activePlugins,
    "tv",
    id ? parseInt(id, 10) : 0,
    season ? parseInt(season, 10) : 1,
    episode ? parseInt(episode, 10) : 1
  );

  const { updateWatchProgress } = useWatchHistory();
  const [selectedStream, setSelectedStream] = useState(0);
  const [showEpisodeList, setShowEpisodeList] = useState(!isMobile);
  const [tvTitle, setTvTitle] = useState("TV Show");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(
    season ? parseInt(season, 10) : 1
  );
  const saveProgressInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (playerState.isPlaying && playerState.currentTime > 0) {
      if (saveProgressInterval.current) {
        clearInterval(saveProgressInterval.current);
      }

      saveProgressInterval.current = setInterval(() => {
        if (id && playerState.duration > 0 && season && episode) {
          updateWatchProgress({
            media_id: parseInt(id, 10),
            media_type: "tv",
            title: tvTitle,
            watch_position: playerState.currentTime,
            duration: playerState.duration,
            season: parseInt(season, 10),
            episode: parseInt(episode, 10),
          });
        }
      }, 30000);
    }

    return () => {
      if (saveProgressInterval.current) {
        clearInterval(saveProgressInterval.current);
      }
    };
  }, [
    playerState.isPlaying,
    playerState.currentTime,
    playerState.duration,
    id,
    tvTitle,
    season,
    episode,
  ]);

  // Track media view on mount
  useEffect(() => {
    if (id && season && episode) {
      trackMediaView({
        mediaType: "tv",
        mediaId: `${id}-s${season}e${episode}`,
        title: `${tvTitle} - S${season}E${episode}`,
      });

      trackEvent({
        name: "playback_started",
        params: {
          media_type: "tv",
          media_id: id,
          season: parseInt(season, 10),
          episode: parseInt(episode, 10),
        },
      });
    }
  }, [id, season, episode, tvTitle]);

  const handlePlayerReady = (player: Player) => {
    console.log("Player ready");
  };

  const handlePlayerError = (error: any) => {
    console.error("Player error:", error);
    trackEvent({
      name: "playback_error",
      params: {
        media_type: "tv",
        media_id: id || "",
        error_message: error?.message || "Unknown error",
      },
    });
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (duration > 0 && currentTime / duration > 0.9) {
      trackEvent({
        name: "playback_completed",
        params: {
          media_type: "tv",
          media_id: id || "",
          duration_watched: currentTime,
        },
      });

      // Auto-play next episode if enabled
      if (playerState.autoPlayNextEpisode && episodes.length > 0) {
        const currentEpisodeIndex = episodes.findIndex(
          e =>
            e.season_number === selectedSeason &&
            e.episode_number === parseInt(episode || "1", 10)
        );

        if (currentEpisodeIndex >= 0 && currentEpisodeIndex < episodes.length - 1) {
          const nextEpisode = episodes[currentEpisodeIndex + 1];
          setTimeout(() => {
            navigate(
              `/watch/tv/${id}/${nextEpisode.season_number}/${nextEpisode.episode_number}`
            );
          }, 5000);
        }
      }
    }
  };

  // Select first valid stream
  useEffect(() => {
    const validStreamIndex = streams.findIndex(s => !s.hasError && s.url);
    if (validStreamIndex >= 0) {
      setSelectedStream(validStreamIndex);
    }
  }, [streams]);

  const handleEpisodeClick = (episodeNum: number, seasonNum: number) => {
    navigate(`/watch/tv/${id}/${seasonNum}/${episodeNum}`);
  };

  if (streamsLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 py-6 pt-20">
            <div className="animate-pulse">
              <div className="bg-card/30 aspect-video w-full rounded-lg" />
              <div className="mt-4 h-8 w-48 rounded bg-card/30" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (streamsError || streams.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 py-6 pt-20">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <div className="flex flex-col items-center justify-center py-20">
              <h2 className="mb-4 text-2xl font-bold text-white">
                No Streams Available
              </h2>
              <p className="mb-6 text-muted-foreground">
                {streamsError || "No active plugins found. Please add a streaming plugin."}
              </p>
              <Button onClick={() => navigate("/settings/plugins")}>
                Manage Plugins
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const currentStream = streams[selectedStream];
  const currentEpisodeNum = episode ? parseInt(episode, 10) : 1;
  const currentSeasonNum = season ? parseInt(season, 10) : 1;

  return (
    <PageTransition>
      <div
        className={`min-h-screen bg-background transition-all ${
          playerState.isLightsOut ? "brightness-50" : ""
        }`}
      >
        <Navbar />
        <div
          className={`container mx-auto px-4 py-6 pt-20 ${
            playerState.isTheaterMode ? "max-w-7xl" : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleLightsOut}>
                <Lightbulb className="h-4 w-4" />
                {playerState.isLightsOut ? "Lights On" : "Lights Out"}
              </Button>
              {!isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheaterMode}
                >
                  {playerState.isTheaterMode ? "Normal" : "Theater"}
                </Button>
              )}
            </div>
          </div>

          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
            {/* Video Player */}
            <div className={isMobile ? "col-span-1" : "col-span-2"}>
              {currentStream && currentStream.url && (
                <VideoPlayer
                  ref={playerRef}
                  src={currentStream.url}
                  poster=""
                  autoplay={true}
                  onReady={handlePlayerReady}
                  onError={handlePlayerError}
                  onTimeUpdate={handleTimeUpdate}
                />
              )}

              {/* Stream Selector */}
              <div className="mt-4">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {tvTitle} - S{currentSeasonNum}E{currentEpisodeNum}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {streams
                    .filter(s => !s.hasError && s.url)
                    .map((stream, index) => (
                      <Button
                        key={index}
                        variant={selectedStream === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedStream(index)}
                      >
                        {stream.label}
                      </Button>
                    ))}
                </div>
              </div>

              {/* Episode Navigation */}
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleEpisodeClick(
                      Math.max(1, currentEpisodeNum - 1),
                      currentSeasonNum
                    )
                  }
                  disabled={currentEpisodeNum <= 1}
                >
                  Previous Episode
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleEpisodeClick(
                      currentEpisodeNum + 1,
                      currentSeasonNum
                    )
                  }
                >
                  Next Episode
                </Button>
              </div>
            </div>

            {/* Episode List Sidebar */}
            {!isMobile && (
              <div className="col-span-1">
                <div className="bg-card/30 rounded-lg p-4 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      Episodes
                    </h3>
                    <select
                      value={selectedSeason}
                      onChange={e =>
                        setSelectedSeason(parseInt(e.target.value, 10))
                      }
                      className="rounded border border-border bg-background px-2 py-1 text-sm text-white"
                    >
                      {[1, 2, 3, 4, 5].map(s => (
                        <option key={s} value={s}>
                          Season {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {episodes
                        .filter(e => e.season_number === selectedSeason)
                        .map(ep => (
                          <button
                            key={ep.episode_number}
                            onClick={() =>
                              handleEpisodeClick(
                                ep.episode_number,
                                ep.season_number
                              )
                            }
                            className={`w-full rounded p-3 text-left transition-colors ${
                              ep.episode_number === currentEpisodeNum
                                ? "bg-accent text-white"
                                : "bg-card/50 hover:bg-card/70"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              E{ep.episode_number}: {ep.name}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {ep.overview?.substring(0, 100)}...
                            </div>
                          </button>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Episode List */}
          {isMobile && (
            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowEpisodeList(!showEpisodeList)}
              >
                {showEpisodeList ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Hide Episodes
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show Episodes
                  </>
                )}
              </Button>

              {showEpisodeList && (
                <div className="bg-card/30 mt-4 rounded-lg p-4 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      Episodes
                    </h3>
                    <select
                      value={selectedSeason}
                      onChange={e =>
                        setSelectedSeason(parseInt(e.target.value, 10))
                      }
                      className="rounded border border-border bg-background px-2 py-1 text-sm text-white"
                    >
                      {[1, 2, 3, 4, 5].map(s => (
                        <option key={s} value={s}>
                          Season {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {episodes
                        .filter(e => e.season_number === selectedSeason)
                        .map(ep => (
                          <button
                            key={ep.episode_number}
                            onClick={() =>
                              handleEpisodeClick(
                                ep.episode_number,
                                ep.season_number
                              )
                            }
                            className={`w-full rounded p-3 text-left transition-colors ${
                              ep.episode_number === currentEpisodeNum
                                ? "bg-accent text-white"
                                : "bg-card/50 hover:bg-card/70"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              E{ep.episode_number}: {ep.name}
                            </div>
                          </button>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TVPlayer;
