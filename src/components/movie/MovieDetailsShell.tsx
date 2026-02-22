import React from "react";
import { MovieDetails } from "@/utils/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MovieHeader } from "@/components/movie";
import { useEffect } from "react";
// no direct button usage here

type TabTypeExternal = "about" | "cast" | "images" | "reviews" | "downloads";

type MovieDetailsShellProps = {
  movie: MovieDetails;
  trailerKey: string | null;
  isFavorite: boolean;
  isInMyWatchlist: boolean;
  onToggleFavorite: () => void;
  onToggleWatchlist: () => void;
  onPlayMovie: () => void;
  activeTab: TabTypeExternal;
  onTabChange: (t: TabTypeExternal) => void;
  showDownloads?: boolean;
  children?: React.ReactNode;
};

const MovieDetailsShell: React.FC<MovieDetailsShellProps> = ({
  movie,
  trailerKey,
  isFavorite,
  isInMyWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  onPlayMovie,
  activeTab,
  onTabChange,
  showDownloads,
  children,
}) => {
  // Guard: if downloads tab is not visible, ensure active tab doesn't remain on downloads
  useEffect(() => {
    if (activeTab === "downloads" && !showDownloads) {
      onTabChange("about");
    }
  }, [activeTab, showDownloads, onTabChange]);
  return (
    <>
      <MovieHeader
        movie={movie}
        trailerKey={trailerKey}
        isFavorite={isFavorite}
        isInMyWatchlist={isInMyWatchlist}
        onToggleFavorite={onToggleFavorite}
        onToggleWatchlist={onToggleWatchlist}
        onPlayMovie={onPlayMovie}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={t => onTabChange(t as TabTypeExternal)}
        >
          <TabsList className="mb-6 border-b border-white/10 bg-transparent">
            <TabsTrigger
              value="about"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
            >
              About
            </TabsTrigger>
            <TabsTrigger
              value="cast"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
            >
              Cast
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
            >
              Images
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
            >
              Reviews
            </TabsTrigger>
            {showDownloads && (
              <TabsTrigger
                value="downloads"
                className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
              >
                Downloads
              </TabsTrigger>
            )}
          </TabsList>
          {children}
        </Tabs>
      </div>
    </>
  );
};

export default MovieDetailsShell;
