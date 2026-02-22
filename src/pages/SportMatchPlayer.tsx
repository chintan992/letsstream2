import React, { useState, useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Radio } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { getMatchStreamsById, getMatchById } from "@/utils/sports-api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { saveLocalData, getLocalData } from "@/utils/supabase";

const SportMatchPlayer = () => {
  const { id: matchId } = useParams();
  const navigate = useNavigate();
  useScrollRestoration();
  const { toast } = useToast();
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [cachedStreams, setCachedStreams] = useState(null);

  // Load cached stream data if available
  useEffect(() => {
    const loadCachedData = async () => {
      const data = await getLocalData(`sport-streams-${matchId}`, null);
      setCachedStreams(data);
    };

    loadCachedData();
  }, [matchId]);

  // Fetch match details
  const {
    data: match,
    isLoading: matchLoading,
    error: matchError,
  } = useQuery({
    queryKey: ["match-details", matchId],
    queryFn: () => getMatchById(matchId!),
    enabled: !!matchId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch streams using the new function
  const {
    data: streams,
    isLoading: streamsLoading,
    error: streamsError,
  } = useQuery({
    queryKey: ["match-streams", matchId],
    queryFn: () => getMatchStreamsById(matchId!),
    enabled: !!matchId,
    placeholderData: cachedStreams,
    staleTime: 5 * 60 * 1000,
  });

  // Cache streams when we get them
  useEffect(() => {
    if (streams && streams.length > 0) {
      saveLocalData(`sport-streams-${matchId}`, streams, 30 * 60 * 1000); // Cache for 30 minutes

      // Set initial source if not already set
      if (!selectedStreamId) {
        const initialStreamId = streams[0]?.id || null;
        setSelectedStreamId(initialStreamId);
      }
    }
  }, [streams, matchId, selectedStreamId]);

  const handleStreamChange = (streamId: string, sourceName: string) => {
    setSelectedStreamId(streamId);
    setIsPlayerLoaded(false); // Reset player loaded state when changing source
    setLoadAttempts(0); // Reset load attempts counter

    toast({
      title: "Source changed",
      description: `Switched to ${sourceName}`,
      duration: 2000,
    });
  };

  const selectedStream = streams?.find(s => s.id === selectedStreamId);
  const embedUrl = selectedStream?.embedUrl || "";

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsPlayerLoaded(true);

    // Record successful stream load without using recordCacheAccess
    console.log("Stream loaded successfully:", embedUrl);

    toast({
      title: "Stream loaded",
      description: "Video player ready",
      duration: 2000,
    });
  };

  // Handle iframe load error
  const handleIframeError = () => {
    setLoadAttempts(prev => prev + 1);

    if (loadAttempts < 2) {
      toast({
        title: "Stream loading failed",
        description: "Attempting to reload...",
        variant: "destructive",
        duration: 3000,
      });

      // Force refresh of the iframe by toggling the key
      setIsPlayerLoaded(false);
    } else {
      toast({
        title: "Stream unavailable",
        description: "Please try another source",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const isLoading = matchLoading || streamsLoading;
  const error = matchError || streamsError;

  if (isLoading && !cachedStreams) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-accent"></div>
          <p>Loading match and streams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md p-6 text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">Error Loading Player</h2>
          <p className="mb-4 text-white/70">
            We couldn't load the video player for this match.
          </p>
          <p className="text-sm text-white/50">
            Technical details: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md p-6 text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">Match Not Found</h2>
          <p className="text-white/70">
            The match you're looking for could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="pb-12 pt-20">
          <div className="container mx-auto px-4 md:px-6">
            {/* Header with back button */}
            <div className="mb-6 flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>

            {/* Match Info */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <Radio className="h-4 w-4 animate-pulse text-red-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-red-400">
                  Live
                </span>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">
                {match.title}
              </h1>
              <p className="text-white/60">
                {match.category} • {new Date(match.date).toLocaleString()}
              </p>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
              {embedUrl ? (
                <iframe
                  key={`${selectedStreamId}-${loadAttempts}`}
                  src={embedUrl}
                  className="h-full w-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="no-referrer"
                  title="Video Player"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white">
                  <div className="text-center">
                    <Radio className="mx-auto mb-4 h-12 w-12 text-white/30" />
                    <p className="text-white/60">
                      No streams available for this match.
                    </p>
                  </div>
                </div>
              )}

              {/* Loading overlay with source info */}
              {!isPlayerLoaded && embedUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
                    <p className="text-sm text-white/80">Loading stream...</p>
                    {selectedStream && (
                      <p className="mt-1 text-xs text-white/50">
                        {selectedStream.source} • Stream{" "}
                        {selectedStream.streamNo}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Source Selection - Visible Toggle Buttons */}
            {streams && streams.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">
                    Available Sources
                  </h3>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                    {streams.length} streams
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {streams.map((stream, index) => (
                    <button
                      key={`${stream.source}-${stream.id}-${index}`}
                      onClick={() =>
                        handleStreamChange(stream.id, stream.source)
                      }
                      className={cn(
                        "relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                        selectedStreamId === stream.id
                          ? "bg-accent/20 border-accent text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span className="font-medium">{stream.source}</span>
                      <span className="text-white/50">#{stream.streamNo}</span>
                      {stream.hd && (
                        <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                          HD
                        </span>
                      )}
                      {selectedStreamId === stream.id && (
                        <Check className="ml-1 h-3.5 w-3.5 text-accent" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Stream status indicator */}
                <div className="mt-3 text-xs text-white/50">
                  {isPlayerLoaded ? (
                    <span className="flex items-center gap-1.5 text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      Stream connected
                    </span>
                  ) : embedUrl ? (
                    <span className="flex animate-pulse items-center gap-1.5 text-yellow-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                      Connecting to stream...
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default SportMatchPlayer;
