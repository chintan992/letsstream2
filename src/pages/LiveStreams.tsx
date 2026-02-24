import { useState, useEffect } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import LiveStreamCard from "@/components/LiveStreamCard";
import { useLiveStreams } from "@/hooks/use-live-streams";
import PageTransition from "@/components/PageTransition";

export interface LiveStream {
  event_catagory: string;
  event_name: string;
  match_id: number;
  match_name: string;
  team_1: string;
  team_1_flag: string;
  team_2: string;
  team_2_flag: string;
  banner: string;
  stream_link: string;
}

// Define the interface for the persisted state
interface LiveStreamsPageState {
  activeTab: string;
}

const LiveStreams = () => {
  // Use page state persistence hook
  const [persistedState, setPersistedState] =
    usePageStatePersistence<LiveStreamsPageState>("live-streams-page-state", {
      activeTab: "all",
    });

  // Initialize state from persisted state
  const [activeTab, setActiveTab] = useState<string>(persistedState.activeTab);

  // Apply scroll restoration - since there's no complex data to restore, hydration is immediate
  useScrollRestoration({ enabled: true });

  const { data, isLoading, isError, error, refetch } = useLiveStreams();

  // Effect to update persisted state when state changes
  useEffect(() => {
    setPersistedState(prevState => ({
      ...prevState,
      activeTab,
    }));
  }, [activeTab, setPersistedState]);

  // Handle manual refresh
  const handleRefresh = () => {
    toast({
      title: "Refreshing live streams",
      description: "Fetching the latest live streams data...",
    });
    refetch();
  };

  // Filter streams based on active tab
  const filteredStreams = data?.matches?.filter(
    stream =>
      activeTab === "all" || stream.event_catagory.toLowerCase() === activeTab
  );

  // Get unique categories for tabs
  const categories = data?.matches
    ? [
        "all",
        ...Array.from(
          new Set(
            data.matches.map(stream => stream.event_catagory.toLowerCase())
          )
        ),
      ]
    : ["all"];

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Live Streams</h1>
            <p className="mt-2 text-gray-400">
              {data
                ? `${data.total_mathes} live streams available • Last updated: ${data.last_upaded}`
                : "Loading available streams..."}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {isError ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-red-900/50 bg-red-900/20 p-6 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Failed to load live streams
            </h2>
            <p className="mb-4 max-w-md text-gray-400">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred. Please try again."}
            </p>
            <Button onClick={() => refetch()} variant="destructive">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={value => {
                setActiveTab(value);
                // Update the persisted state when tab changes
                setPersistedState(prevState => ({
                  ...prevState,
                  activeTab: value,
                }));
              }}
              className="mb-6"
            >
              <TabsList className="bg-background/30 backdrop-blur-sm">
                {categories.map(category => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="capitalize"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <div
                        key={`skeleton-${num}`}
                        className="bg-card/30 h-[320px] animate-pulse rounded-lg"
                      ></div>
                    ))}
                  </div>
                ) : filteredStreams && filteredStreams.length > 0 ? (
                  <m.div
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                  >
                    {filteredStreams.map(stream => (
                      <LiveStreamCard key={stream.match_id} stream={stream} />
                    ))}
                  </m.div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-gray-400">
                      No live streams available for this category.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default LiveStreams;
