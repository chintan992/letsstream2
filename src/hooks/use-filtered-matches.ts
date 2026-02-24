import { useMemo, useState, useEffect } from "react";
import { APIMatch } from "@/utils/sports-types";
import { DateRangePreset } from "@/components/DateRangeFilter";

interface UseFilteredMatchesProps {
  activeTab: string;
  selectedSport: string;
  searchQuery: string;
  sortOrder: "time" | "relevance";
  dateRange: DateRangePreset;
  popularMatches: APIMatch[];
  sportPopularMatches: APIMatch[];
  liveMatches: APIMatch[];
  todayMatches: APIMatch[];
  sportAllMatches: APIMatch[];
}

export function useFilteredMatches({
  activeTab,
  selectedSport,
  searchQuery,
  sortOrder,
  dateRange,
  popularMatches,
  sportPopularMatches,
  liveMatches,
  todayMatches,
  sportAllMatches,
}: UseFilteredMatchesProps) {
  const [currentDay, setCurrentDay] = useState(() => new Date().setHours(0, 0, 0, 0));

  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().setHours(0, 0, 0, 0);
      setCurrentDay(prev => (prev !== today ? today : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    let matches: APIMatch[] = [];

    if (activeTab === "popular") {
      matches = selectedSport === "all" ? popularMatches : sportPopularMatches;
    } else if (activeTab === "live") {
      matches = liveMatches;
    } else {
      matches = selectedSport === "all" ? todayMatches : sportAllMatches;
    }

    if (dateRange !== "all") {
      const now = new Date(currentDay);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      matches = matches.filter(match => {
        const matchDate = new Date(match.date);
        const matchDay = new Date(
          matchDate.getFullYear(),
          matchDate.getMonth(),
          matchDate.getDate()
        );

        switch (dateRange) {
          case "today":
            return matchDay.getTime() === today.getTime();
          case "tomorrow":
            return matchDay.getTime() === tomorrow.getTime();
          case "week":
            return matchDate >= today && matchDate < nextWeek;
          default:
            return true;
        }
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matches = matches.filter(
        match =>
          match.title?.toLowerCase().includes(query) ||
          match.category?.toLowerCase().includes(query) ||
          match.teams?.home?.name?.toLowerCase().includes(query) ||
          match.teams?.away?.name?.toLowerCase().includes(query)
      );
    }

    if (selectedSport !== "all") {
      matches = matches.filter(match => match.category === selectedSport);
    }

    if (sortOrder === "time") {
      matches = [...matches].sort((a, b) => a.date - b.date);
    } else {
      matches = [...matches].sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return a.date - b.date;
      });
    }

    return matches;
  }, [
    activeTab,
    selectedSport,
    popularMatches,
    sportPopularMatches,
    liveMatches,
    todayMatches,
    sportAllMatches,
    searchQuery,
    sortOrder,
    dateRange,
    currentDay,
  ]);
}
