import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollRestoration } from "@/hooks";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import VideoPlayer, { VideoPlayerRef } from "@/components/player/VideoPlayer";
import { usePlayerState } from "@/hooks/use-player-state";
import { usePluginManager } from "@/hooks/use-plugin-manager";
import { useStreamAggregator } from "@/hooks/use-stream-aggregator";
import { useWatchHistory } from "@/hooks/watch-history";
import { trackEvent, trackMediaView } from "@/lib/analytics";
import type Player from "video.js/dist/types/player";

const MoviePlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useScrollRestoration();

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

  const { streams, isLoading: streamsLoading, error: streamsError } =
    useStreamAggregator(
      activePlugins,
      "movie",
      id ? parseInt(id, 10) : 0
    );

  const { updateWatchProgress } = useWatchHistory();
  const [selectedStream, setSelectedStream] = useState(0);
  const [movieTitle, setMovieTitle] = useState("Movie");
  const saveProgressInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (playerState.isPlaying && playerState.currentTime > 0) {
      if (saveProgressInterval.current) {
        clearInterval(saveProgressInterval.current);
      }

      saveProgressInterval.current = setInterval(() => {
        if (id && playerState.duration > 0) {
          updateWatchProgress({
            media_id: parseInt(id, 10),
            media_type: "movie",
            title: movieTitle,
            watch_position: playerState.currentTime,
            duration: playerState.duration,
          });
        }
      }, 30000);
    }

    return () => {
      if (saveProgressInterval.current) {
        clearInterval(saveProgressInterval.current);
      }
    };
  }, [playerState.isPlaying, playerState.currentTime, playerState.duration, id, movieTitle]);

  // Track media view on mount
  useEffect(() => {
    if (id) {
      trackMediaView({
        mediaType: "movie",
        mediaId: id,
        title: movieTitle,
      });

      trackEvent({
        name: "playback_started",
        params: {
          media_type: "movie",
          media_id: id,
        },
      });
    }
  }, [id, movieTitle]);

  const handlePlayerReady = (player: Player) => {
    console.log("Player ready");
  };

  const handlePlayerError = (error: any) => {
    console.error("Player error:", error);
    trackEvent({
      name: "playback_error",
      params: {
        media_type: "movie",
        media_id: id || "",
        error_message: error?.message || "Unknown error",
      },
    });
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    // Mark as complete when >90% watched
    if (duration > 0 && currentTime / duration > 0.9) {
      trackEvent({
        name: "playback_completed",
        params: {
          media_type: "movie",
          media_id: id || "",
          duration_watched: currentTime,
        },
      });
    }
  };

  // Select first valid stream
  useEffect(() => {
    const validStreamIndex = streams.findIndex(s => !s.hasError && s.url);
    if (validStreamIndex >= 0) {
      setSelectedStream(validStreamIndex);
    }
  }, [streams]);

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

  return (
    <PageTransition>
      <div
        className={`min-h-screen bg-background transition-all ${
          playerState.isLightsOut ? "brightness-50" : ""
        }`}
      >
        <Navbar />
        <div className={`container mx-auto px-4 py-6 pt-20 ${
          playerState.isTheaterMode ? "max-w-7xl" : ""
        }`}>
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLightsOut}
              >
                <Lightbulb className="h-4 w-4" />
                {playerState.isLightsOut ? "Lights On" : "Lights Out"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheaterMode}
              >
                {playerState.isTheaterMode ? "Normal" : "Theater"}
              </Button>
            </div>
          </div>

          {/* Video Player */}
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
              {movieTitle}
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
        </div>
      </div>
    </PageTransition>
  );
};

export default MoviePlayer;
