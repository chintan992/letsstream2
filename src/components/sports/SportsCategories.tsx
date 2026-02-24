import React from "react";
import { Sport } from "@/utils/sports-types";
import { getSportIcon } from "@/utils/sport-icons";

interface SportsCategoriesProps {
  sportsList: Sport[];
  selectedSport: string;
  sportsLoading: boolean;
  accentColor: string;
  onSportChange: (sportId: string) => void;
}

export function SportsCategories({
  sportsList,
  selectedSport,
  sportsLoading,
  accentColor,
  onSportChange,
}: SportsCategoriesProps) {
  return (
    <div className="mb-8 overflow-x-auto pb-2">
      <div className="flex min-w-max space-x-2" role="tablist">
        <button
          role="tab"
          onClick={() => onSportChange("all")}
          aria-selected={selectedSport === "all"}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedSport === "all"
            ? "text-white shadow-lg"
            : "text-white/70 hover:bg-white/5 hover:text-white/90"
            }`}
          style={{
            backgroundColor:
              selectedSport === "all" ? accentColor : "transparent",
            border: `1px solid ${selectedSport === "all" ? "transparent" : "rgba(255,255,255,0.2)"
              }`,
          }}
        >
          <span aria-hidden="true">🏅</span>
          All Sports
        </button>

        {sportsLoading ? (
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(num => (
              <div
                key={`skeleton-sports-${num}`}
                className="h-10 w-28 animate-pulse rounded-full bg-white/10"
              />
            ))}
          </div>
        ) : (
          sportsList.map(sport => (
            <button
              key={sport.id}
              role="tab"
              onClick={() => onSportChange(sport.id)}
              aria-selected={selectedSport === sport.id}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedSport === sport.id
                ? "text-white shadow-lg"
                : "text-white/70 hover:bg-white/5 hover:text-white/90"
                }`}
              style={{
                backgroundColor:
                  selectedSport === sport.id ? accentColor : "transparent",
                border: `1px solid ${selectedSport === sport.id
                  ? "transparent"
                  : "rgba(255,255,255,0.2)"
                  }`,
              }}
            >
              <span aria-hidden="true">{getSportIcon(sport.id)}</span>
              {sport.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
