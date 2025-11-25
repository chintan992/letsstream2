import React, { useState, useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { getMatchStreamsById, getMatchById } from "@/utils/sports-api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { swMonitor } from "@/utils/sw-monitor";
import { saveLocalData, getLocalData } from "@/utils/supabase";

const SportMatchPlayer = () => {
  const { id: matchId } = useParams();
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
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold text-white">
                {match.title}
              </h1>
              <p className="text-white/70">
                {match.category} • {new Date(match.date).toLocaleString()}
              </p>
            </div>

            {/* Source Selection Dropdown */}
            {streams && streams.length > 0 && (
              <div className="mb-4 flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition-colors">
                    {selectedStream
                      ? `${selectedStream.source} (Stream ${selectedStream.streamNo}) ${selectedStream.hd ? "HD" : ""}`
                      : "Select Source"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border border-white/20 bg-background max-h-[300px] overflow-y-auto">
                    {streams.map((stream, index) => (
                      <DropdownMenuItem
                        key={`${stream.source}-${stream.id}-${index}`} // Use composite key to ensure uniqueness
                        onSelect={() => handleStreamChange(stream.id, stream.source)}
                        className={cn(
                          "cursor-pointer",
                          selectedStreamId === stream.id && "bg-accent text-white focus:bg-accent focus:text-white"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {stream.source} (Stream {stream.streamNo})
                          {stream.hd && (
                            <span className="rounded bg-white/20 px-1 py-0.5 text-[10px] font-bold text-white">
                              HD
                            </span>
                          )}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="text-sm text-white/50">
                  {isPlayerLoaded ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                      Stream loaded
                    </span>
                  ) : embedUrl ? (
                    <span className="animate-pulse flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
                      Loading stream...
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Video Player */}
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              {embedUrl ? (
                <iframe
                  key={`${selectedStreamId}-${loadAttempts}`}
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  title="Video Player"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                ></iframe>
              ) : (
                <div className="flex h-full items-center justify-center text-white">
                  <p>No streams available for this match.</p>
                </div>
              )}

              {/* Loading overlay */}
              {!isPlayerLoaded && embedUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center text-white">
                    <div className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-t-2 border-accent"></div>
                    <p>Loading stream...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stream info */}
            {selectedStream && (
              <div className="mt-4 rounded-md bg-white/5 p-4">
                <h3 className="mb-2 text-lg font-medium text-white">
                  Stream Information
                </h3>
                <p className="text-sm text-white/70">
                  Source: {selectedStream.source} • Quality:{" "}
                  {selectedStream.hd ? "HD" : "SD"}{" "}
                  • Status: {isPlayerLoaded ? "Ready" : "Loading"}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  If the current stream isn't working, try switching to another
                  source.
                </p>
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
