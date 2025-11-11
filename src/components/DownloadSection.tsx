import React from "react";
import {
  triggerHapticFeedback,
  triggerSuccessHaptic,
} from "@/utils/haptic-feedback";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { extractQualityTags } from "@/utils/quality-tags";
import { fetchDownloadLinks } from "@/api/download";

interface DownloadLink {
  title: string;
  size: string;
  download_url: string;
  file_id: string;
}

interface DownloadSectionProps {
  mediaName: string;
  season?: number;
  episode?: number;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  mediaName,
  season,
  episode,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [downloadLinks, setDownloadLinks] = React.useState<DownloadLink[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLinks = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    triggerHapticFeedback(20);
    try {
      const links = await fetchDownloadLinks(mediaName, season, episode);
      setDownloadLinks(links);
      if (links.length > 0) {
        triggerSuccessHaptic();
      }
    } catch (err) {
      setError("Failed to fetch download links");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [mediaName, season, episode]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!downloadLinks.length && !isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Button onClick={fetchLinks} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Show Download Links
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {downloadLinks.map(link => {
            const qualityTags = extractQualityTags(link.title);
            return (
              <div
                key={link.file_id}
                className="group relative flex min-h-[140px] flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#181c24] to-[#23272f] p-4 shadow-xl transition-transform hover:scale-[1.025] hover:shadow-2xl sm:p-5"
              >
                {/* Cinematic Glow */}
                <div className="bg-accent/10 pointer-events-none absolute -inset-1 z-0 opacity-0 blur-lg transition-opacity group-hover:opacity-100" />

                {/* File Title */}
                <div className="relative z-10 mb-1 line-clamp-2 break-all font-mono text-xs text-white/90 sm:text-sm">
                  {link.title}
                </div>

                {/* Quality Tags */}
                <div className="relative z-10 mb-1 flex flex-wrap gap-2">
                  {qualityTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-accent bg-black/40 px-2 py-0.5 text-xs text-accent"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* File Size & Download Button */}
                <div className="relative z-10 mt-auto flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                  <span className="mb-1 rounded bg-black/30 px-2 py-1 text-xs font-semibold tracking-wide text-white/70 shadow sm:mb-0">
                    {link.size}
                  </span>
                  <Button
                    onClick={() => {
                      triggerHapticFeedback(25);
                      window.open(link.download_url, "_blank");
                    }}
                    variant="outline"
                    size="sm"
                    className="to-accent/80 hover:from-accent/80 w-full border-none bg-gradient-to-r from-accent text-white shadow-lg hover:to-accent sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
