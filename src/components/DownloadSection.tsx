import React from "react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadSectionProps {
  mediaName: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
  season?: number;
  episode?: number;
  children?: React.ReactNode;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  mediaName,
  mediaType,
  tmdbId,
  season,
  episode,
  children,
}) => {
  const getDownloadUrl = () => {
    if (mediaType === "movie") {
      return `https://dl.vidsrc.vip/movie/${tmdbId}`;
    }
    if (mediaType === "tv" && season && episode) {
      return `https://dl.vidsrc.vip/tv/${tmdbId}/${season}/${episode}`;
    }
    return "#";
  };

  const handleDownload = () => {
    triggerHapticFeedback(25);
    const url = getDownloadUrl();
    if (url !== "#") {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        {/* Background Glow */}
        <div className="bg-accent/10 pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl" />
        <div className="bg-accent/5 pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <div className="bg-accent/10 ring-accent/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-1">
              <Download className="h-8 w-8 text-accent" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                Download {mediaType === "movie" ? "Movie" : "Episode"}
              </h3>
              <p className="mx-auto max-w-lg text-base text-white/60">
                Click below to open the download page for{" "}
                <span className="font-medium text-white">{mediaName}</span>
                {mediaType === "tv" && season && episode && (
                  <span>
                    {" "}
                    (S{season}:E{episode})
                  </span>
                )}
                .
              </p>
            </div>
          </div>

          {children && (
            <div className="w-full max-w-2xl rounded-xl bg-black/20 p-4 ring-1 ring-white/5">
              {children}
            </div>
          )}

          <div className="w-full space-y-4">
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl">
              <iframe
                key={getDownloadUrl()}
                src={getDownloadUrl()}
                className="h-[600px] w-full border-0"
                title="Download Page"
                allowFullScreen
              />
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                variant="link"
                className="text-white/60 hover:text-white"
                size="sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
