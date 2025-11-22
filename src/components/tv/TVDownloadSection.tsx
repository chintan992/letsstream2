import React, { useState } from "react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";
import { DownloadSection } from "@/components/DownloadSection";

interface TVDownloadSectionProps {
  tvShowName: string;
  seasons: Array<{
    season_number: number;
    name: string;
    episode_count: number;
  }>;
  episodesBySeason: Record<
    number,
    Array<{ episode_number: number; name: string }>
  >;
}

export const TVDownloadSection: React.FC<TVDownloadSectionProps> = ({
  tvShowName,
  seasons,
  episodesBySeason,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(
    seasons[0]?.season_number || 1
  );
  const [selectedEpisode, setSelectedEpisode] = useState<number>(
    episodesBySeason[selectedSeason]?.[0]?.episode_number || 1
  );

  React.useEffect(() => {
    // When season changes, reset episode to first in that season
    const firstEp = episodesBySeason[selectedSeason]?.[0]?.episode_number;
    if (firstEp) setSelectedEpisode(firstEp);
  }, [selectedSeason, episodesBySeason]);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-5 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          <label className="mb-2 block text-sm font-medium text-white">
            Season
          </label>
          <select
            className="hover:border-accent/50 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent"
            value={selectedSeason}
            onChange={e => {
              triggerHapticFeedback(15);
              setSelectedSeason(Number(e.target.value));
            }}
          >
            {seasons.map(season => (
              <option key={season.season_number} value={season.season_number}>
                {season.name || `Season ${season.season_number}`}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-2 block text-sm font-medium text-white">
            Episode
          </label>
          <select
            className="hover:border-accent/50 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent"
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
      <DownloadSection
        mediaName={tvShowName}
        season={selectedSeason}
        episode={selectedEpisode}
      />
    </div>
  );
};
