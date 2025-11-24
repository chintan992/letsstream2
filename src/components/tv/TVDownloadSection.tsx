import React, { useState } from "react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";
import { DownloadSection } from "@/components/DownloadSection";

interface TVDownloadSectionProps {
  tvShowName: string;
  tmdbId: number;
  seasons: Array<{
    season_number: number;
    name: string;
    episode_count: number;
  }>;
  episodesBySeason: Record<
    number,
    Array<{ episode_number: number; name: string }>
  >;
  selectedSeason: number;
  onSeasonChange: (season: number) => void;
}

export const TVDownloadSection: React.FC<TVDownloadSectionProps> = ({
  tvShowName,
  tmdbId,
  seasons,
  episodesBySeason,
  selectedSeason,
  onSeasonChange,
}) => {
  const [selectedEpisode, setSelectedEpisode] = useState<number>(
    episodesBySeason[selectedSeason]?.[0]?.episode_number || 1
  );

  React.useEffect(() => {
    // When season changes, reset episode to first in that season
    const firstEp = episodesBySeason[selectedSeason]?.[0]?.episode_number;
    if (firstEp) setSelectedEpisode(firstEp);
  }, [selectedSeason, episodesBySeason]);

  return (
    <DownloadSection
      mediaName={tvShowName}
      mediaType="tv"
      tmdbId={tmdbId}
      season={selectedSeason}
      episode={selectedEpisode}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
        <div className="w-full sm:w-64">
          <label className="mb-2 block text-sm font-medium text-white/80 text-left">
            Season
          </label>
          <select
            className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white shadow-sm transition-all duration-300 hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={selectedSeason}
            onChange={e => {
              triggerHapticFeedback(15);
              onSeasonChange(Number(e.target.value));
            }}
          >
            {seasons.map(season => (
              <option key={season.season_number} value={season.season_number}>
                {season.name || `Season ${season.season_number}`}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-64">
          <label className="mb-2 block text-sm font-medium text-white/80 text-left">
            Episode
          </label>
          <select
            className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white shadow-sm transition-all duration-300 hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={selectedEpisode}
            onChange={e => {
              triggerHapticFeedback(15);
              setSelectedEpisode(Number(e.target.value));
            }}
          >
            {(episodesBySeason[selectedSeason] || []).map(ep => (
              <option key={ep.episode_number} value={ep.episode_number}>
                {ep.name
                  ? `${ep.episode_number}. ${ep.name}`
                  : `Episode ${ep.episode_number}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </DownloadSection>
  );
};
