import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { getMatchStreams } from "@/utils/sports-api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { swMonitor } from "@/utils/sw-monitor";
import { saveLocalData, getLocalData } from "@/utils/supabase";

const SportMatchPlayer = () => {
  const { matchId } = useParams();
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
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

  const {
    data: streams,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["match-streams", matchId],
    queryFn: () => getMatchStreams(null, matchId),
    placeholderData: cachedStreams, // Use cached data as placeholder
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Cache streams when we get them
  useEffect(() => {
    if (streams && streams.length > 0) {
      saveLocalData(`sport-streams-${matchId}`, streams, 30 * 60 * 1000); // Cache for 30 minutes

      // Set initial source if not already set
      if (!selectedSource) {
        const initialSource = streams[0]?.source || null;
        setSelectedSource(initialSource);
      }
    }
  }, [streams, matchId, selectedSource]);

  const handleSourceChange = source => {
    setSelectedSource(source);
    setIsPlayerLoaded(false); // Reset player loaded state when changing source
    setLoadAttempts(0); // Reset load attempts counter

    toast({
      title: "Source changed",
      description: `Switched to ${source}`,
      duration: 2000,
    });
  };

  const embedUrl =
    streams && selectedSource
      ? streams.find(s => s.source === selectedSource)?.embedUrl
      : "";

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

  if (isLoading && !cachedStreams) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-accent"></div>
          <p>Loading video player...</p>
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="pb-12 pt-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold text-white">
                Sport Match Player
              </h1>
              <p className="text-white/70">Watch the match: {matchId}</p>
            </div>

            {/* Source Selection Dropdown */}
            {streams && streams.length > 1 && (
              <div className="mb-4 flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md bg-white/10 px-4 py-2 text-white">
                    {selectedSource
                      ? `Source: ${selectedSource}`
                      : "Select Source"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border border-white/20 bg-background">
                    {streams.map(stream => (
                      <DropdownMenuItem
                        key={stream.source}
                        onSelect={() => handleSourceChange(stream.source)}
                      >
                        {stream.source}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="text-sm text-white/50">
                  {isPlayerLoaded ? (
                    <span className="text-green-400">✓ Stream loaded</span>
                  ) : embedUrl ? (
                    <span className="animate-pulse">Loading stream...</span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Video Player */}
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              {embedUrl ? (
                <iframe
                  key={`${selectedSource}-${loadAttempts}`}
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
            {selectedSource && (
              <div className="mt-4 rounded-md bg-white/5 p-4">
                <h3 className="mb-2 text-lg font-medium text-white">
                  Stream Information
                </h3>
                <p className="text-sm text-white/70">
                  Source: {selectedSource} • Quality:{" "}
                  {streams?.find(s => s.source === selectedSource)?.hd
                    ? "HD"
                    : "SD"}{" "}
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
