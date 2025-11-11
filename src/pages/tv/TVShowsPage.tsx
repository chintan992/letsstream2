import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import TVShowsTabs from "./components/TVShowsTabs";
import TVShowsHeader from "./components/TVShowsHeader";
import TVShowsFilters from "./components/TVShowsFilters";
import { useToast } from "@/hooks/use-toast";
import { trackMediaPreference } from "@/lib/analytics";
import { Media } from "@/utils/types";

const TVShowsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "popular" | "top_rated" | "trending"
  >("popular");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "default" | "name" | "first_air_date" | "rating"
  >("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [platformFilters, setPlatformFilters] = useState<string[]>([]);
  const [showPlatformBar, setShowPlatformBar] = useState(false);

  // Track initial page visit
  useEffect(() => {
    void trackMediaPreference("tv", "browse");
  }, []);

  const handleShowSelect = async (show: Media) => {
    await trackMediaPreference("tv", "select");
    navigate(`/tv/${show.id}`);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "popular" | "top_rated" | "trending");
    void trackMediaPreference("tv", "browse");
  };

  const toggleViewMode = () => {
    setViewMode(prev => (prev === "grid" ? "list" : "grid"));
  };

  const togglePlatformBar = () => {
    setShowPlatformBar(prev => !prev);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <TVShowsHeader />
          <TVShowsFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            genreFilter={genreFilter}
            onGenreChange={setGenreFilter}
            viewMode={viewMode}
            toggleViewMode={toggleViewMode}
            platformFilters={platformFilters}
            setPlatformFilters={setPlatformFilters}
            showPlatformBar={showPlatformBar}
            togglePlatformBar={togglePlatformBar}
          />
          <TVShowsTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            viewMode={viewMode}
            sortBy={sortBy}
            genreFilter={genreFilter}
            platformFilters={platformFilters}
          />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default TVShowsPage;
