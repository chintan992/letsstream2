import React, { useState, useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Stream } from "@/utils/sports-types";
import { getMatchStreams } from "@/utils/sports-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Sparkles, Tv, Languages, Check, Info } from "lucide-react";
import { useUserPreferences } from "@/hooks/user-preferences";

const SportMatch = () => {
  const { source, id } = useParams<{ source: string; id: string }>();
  useScrollRestoration();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";

  const [selectedStream, setSelectedStream] = useState<string>("");
  const [iframeUrl, setIframeUrl] = useState<string>("");

  // Fetch available streams
  const {
    data: streams = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sport-streams", source, id],
    queryFn: () =>
      source && id ? getMatchStreams(source, id) : Promise.resolve([]),
    enabled: !!source && !!id,
  });

  // Set the first stream as default when data loads
  useEffect(() => {
    if (streams.length > 0 && !selectedStream) {
      setSelectedStream(streams[0].id);
    }
  }, [streams, selectedStream]);

  // Update iframe when stream changes
  useEffect(() => {
    if (selectedStream) {
      const stream = streams.find(s => s.id === selectedStream);
      if (stream) {
        setIframeUrl(stream.embedUrl);
      }
    }
  }, [selectedStream, streams]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load streams. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleStreamChange = (streamId: string) => {
    setSelectedStream(streamId);
    const stream = streams.find(s => s.id === streamId);
    if (stream) {
      toast({
        title: "Stream Changed",
        description: `Switched to Stream #${stream.streamNo} (${stream.language})`,
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="px-4 pb-12 pt-16 md:px-6">
          <div className="mx-auto max-w-6xl">
            {/* Back button */}
            <div className="mb-4 flex items-center">
              <button
                onClick={() => navigate("/sports")}
                className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="ml-3 text-xl font-medium text-white">
                Stream Details
              </h1>
            </div>

            {isLoading ? (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-black/50">
                <div className="animate-pulse text-white">
                  Loading stream...
                </div>
              </div>
            ) : streams.length === 0 ? (
              <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg bg-black/50 text-white">
                <Info className="mb-4 h-12 w-12 text-white/50" />
                <p className="mb-2 text-lg">No streams available</p>
                <p className="mb-6 text-sm text-white/70">
                  This match doesn't have any available streams at the moment.
                </p>
                <Button
                  onClick={() => navigate("/sports")}
                  style={{ backgroundColor: accentColor }}
                >
                  Back to Sports
                </Button>
              </div>
            ) : (
              <>
                {/* Player */}
                <div className="mb-6 overflow-hidden rounded-lg bg-black shadow-xl">
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={iframeUrl}
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                      title="Sports Stream"
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>

                {/* Stream selector */}
                <div className="glass mb-8 rounded-lg p-4">
                  <h3 className="mb-3 font-medium text-white">
                    Available Streams
                  </h3>
                  <p className="mb-4 text-sm text-white/70">
                    If the current stream isn't working, try another one below.
                  </p>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="w-full sm:w-64">
                      <Select
                        value={selectedStream}
                        onValueChange={handleStreamChange}
                      >
                        <SelectTrigger className="border-white/20 bg-white/10 text-white">
                          <SelectValue placeholder="Select a stream" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-background">
                          {streams.map(stream => (
                            <SelectItem
                              key={stream.id}
                              value={stream.id}
                              className="text-white focus:bg-white/10 focus:text-white"
                            >
                              <div className="flex items-center gap-2">
                                {selectedStream === stream.id && (
                                  <Check className="h-4 w-4" />
                                )}
                                Stream #{stream.streamNo} ({stream.language})
                                {stream.hd && (
                                  <Badge
                                    variant="outline"
                                    className="ml-1 h-4 py-0 text-xs"
                                    style={{
                                      borderColor: accentColor,
                                      color: accentColor,
                                    }}
                                  >
                                    HD
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {streams.map(stream => (
                        <Button
                          key={stream.id}
                          variant={
                            selectedStream === stream.id ? "default" : "outline"
                          }
                          size="sm"
                          className={`gap-1.5 ${
                            selectedStream === stream.id
                              ? "text-white"
                              : "border-white/20 bg-black/50 text-white hover:bg-black/70"
                          }`}
                          style={{
                            backgroundColor:
                              selectedStream === stream.id
                                ? accentColor
                                : undefined,
                          }}
                          onClick={() => handleStreamChange(stream.id)}
                        >
                          <span>#{stream.streamNo}</span>
                          <span className="text-xs opacity-70">
                            {stream.language}
                          </span>
                          {stream.hd && (
                            <Badge
                              variant="outline"
                              className="ml-1 h-4 py-0 text-xs"
                              style={{
                                borderColor:
                                  selectedStream === stream.id
                                    ? "white"
                                    : accentColor,
                                color:
                                  selectedStream === stream.id
                                    ? "white"
                                    : accentColor,
                              }}
                            >
                              HD
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stream info cards */}
                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="glass flex items-start rounded-lg p-4">
                    <div
                      className="rounded-full p-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Languages className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-white">
                        Multiple Languages
                      </h3>
                      <p className="text-sm text-white/70">
                        Streams available in{" "}
                        {Array.from(new Set(streams.map(s => s.language))).join(
                          ", "
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="glass flex items-start rounded-lg p-4">
                    <div
                      className="rounded-full p-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-white">HD Quality</h3>
                      <p className="text-sm text-white/70">
                        {streams.filter(s => s.hd).length} of {streams.length}{" "}
                        streams available in HD
                      </p>
                    </div>
                  </div>

                  <div className="glass flex items-start rounded-lg p-4">
                    <div
                      className="rounded-full p-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Tv className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-white">
                        Multiple Sources
                      </h3>
                      <p className="text-sm text-white/70">
                        {streams.length} streams from{" "}
                        {Array.from(new Set(streams.map(s => s.source))).length}{" "}
                        sources
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default SportMatch;
