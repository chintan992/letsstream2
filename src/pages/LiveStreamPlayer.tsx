import { useState, useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import { useLiveStreams } from "@/hooks/use-live-streams";
import { LiveStream } from "@/pages/LiveStreams";
// Removed custom API proxy imports

const LiveStreamPlayer = () => {
  const { id } = useParams<{ id: string }>();
  useScrollRestoration();
  const location = useLocation();
  const navigate = useNavigate();

  // Try to get stream from location state first (for better UX)
  const [stream, setStream] = useState<LiveStream | null>(
    location.state?.stream || null
  );

  const { data, isLoading, isError } = useLiveStreams();
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Proxy initialization has been removed to avoid dead code in this component

  // If stream wasn't passed through navigation state, find it in the fetched data
  useEffect(() => {
    if (!stream && data?.matches && id) {
      const matchId = parseInt(id, 10);
      const foundStream = data.matches.find(
        match => match.match_id === matchId
      );

      if (foundStream) {
        const timeout = setTimeout(() => setStream(foundStream), 0);
        return () => clearTimeout(timeout);
      }
    }
  }, [data, id, stream]);

  // Handle sharing the stream
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: stream?.match_name || "Live Stream",
          text: `Watch ${stream?.match_name} live!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share it with anyone!",
      });
    }
  };

  // Player event handlers
  const handlePlayerLoad = () => {
    setIsPlayerLoaded(true);
    setPlayerError(null);
  };

  const handlePlayerError = (error: string) => {
    setPlayerError(error);
    setIsPlayerLoaded(false);

    toast({
      variant: "destructive",
      title: "Playback error",
      description: "Failed to load the live stream. Please try again later.",
    });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6 pt-20">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/live")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Live Streams
          </Button>

          {isLoading && !stream ? (
            <div className="bg-card/30 aspect-video w-full animate-pulse rounded-lg" />
          ) : isError || !stream ? (
            <div className="bg-card/30 flex aspect-video w-full items-center justify-center rounded-lg">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white">
                  Stream not found
                </h2>
                <p className="mt-2 text-gray-400">
                  The requested live stream could not be found
                </p>
                <Button className="mt-4" onClick={() => navigate("/live")}>
                  Browse available streams
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg shadow-xl">
                {stream && (
                  <video
                    src={stream.stream_link}
                    poster={stream.banner}
                    title={stream.match_name}
                    controls
                    className="h-full w-full"
                    onLoadedData={handlePlayerLoad}
                    onError={() => handlePlayerError("Failed to load video")}
                  />
                )}
              </div>

              <div className="bg-card/30 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {stream.match_name}
                    </h1>
                    <p className="text-gray-400">{stream.event_name}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={stream.stream_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open direct URL
                      </a>
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <img
                        src={stream.team_1_flag}
                        alt={stream.team_1}
                        className="h-12 w-12 rounded-full border-2 border-white/20 object-cover"
                      />
                      <span className="mt-2 text-center text-sm text-white">
                        {stream.team_1}
                      </span>
                    </div>

                    <div className="bg-card/50 flex h-10 w-10 items-center justify-center rounded-full">
                      <span className="font-semibold text-white">VS</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <img
                        src={stream.team_2_flag}
                        alt={stream.team_2}
                        className="h-12 w-12 rounded-full border-2 border-white/20 object-cover"
                      />
                      <span className="mt-2 text-center text-sm text-white">
                        {stream.team_2}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="bg-accent/20 border-accent/30 rounded-full border px-3 py-1 text-xs uppercase text-white">
                      {stream.event_catagory}
                    </span>
                  </div>
                </div>

                {playerError && (
                  <div className="mt-4 rounded-md border border-red-900/30 bg-red-900/20 p-3">
                    <p className="text-sm text-red-200">
                      There was an issue loading this stream. The source may be
                      temporarily unavailable.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default LiveStreamPlayer;
