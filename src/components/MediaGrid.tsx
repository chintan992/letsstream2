import { Media } from "@/utils/types";
import MediaCard from "./MediaCard";
import { motion, Variants } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Clock, Trash2, SquareCheck, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

// Extend Media type to include optional string ID and timestamp
interface ExtendedMedia extends Omit<Media, "id"> {
  id: string | number;
  media_id: number;
  docId?: string; // Document ID for deletion
  created_at?: string;
  watch_position?: number;
  duration?: number;
  season?: number;
  episode?: number;
  last_watched_at?: string;
  episodes_watched?: Array<{
    season: number;
    episode: number;
    watch_position: number;
    duration: number;
    watched_at: string;
  }>;
}

interface MediaGridProps {
  media: ExtendedMedia[];
  title?: string;
  listView?: boolean;
  selectable?: boolean;
  onDelete?: (id: string) => void;
  onDeleteSelected?: (ids: string[]) => void;
}

const MediaGrid = ({
  media,
  title,
  listView = false,
  selectable = false,
  onDelete,
  onDeleteSelected,
}: MediaGridProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  if (!media || media.length === 0) {
    return (
      <div className="py-8 text-center text-white">
        <p>No results found.</p>
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedItems([]);
  };

  const handleSelect = (docId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(docId)) {
        return prev.filter(item => item !== docId);
      }
      return [...prev, docId];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === media.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(media.map(item => item.docId!).filter(Boolean));
    }
  };

  const renderTimestamp = (media: ExtendedMedia) => {
    if (!media.created_at) return null;

    return (
      <div className="mb-2 flex items-center text-xs text-white/70">
        <Clock className="mr-1 h-3 w-3" />
        {formatDistanceToNow(new Date(media.created_at), { addSuffix: true })}
      </div>
    );
  };

  const renderSelectionButtons = () => {
    if (!selectable) return null;

    return (
      <div className="mb-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSelectMode}
          className="border-white/20 bg-black/50 text-white hover:bg-black/70"
        >
          {selectMode ? "Cancel Selection" : "Select Items"}
        </Button>

        {selectMode && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="border-white/20 bg-black/50 text-white hover:bg-black/70"
            >
              {selectedItems.length === media.length ? (
                <Square className="mr-2 h-4 w-4" />
              ) : (
                <SquareCheck className="mr-2 h-4 w-4" />
              )}
              {selectedItems.length === media.length
                ? "Deselect All"
                : "Select All"}
            </Button>

            {selectedItems.length > 0 && onDeleteSelected && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteSelected(selectedItems)}
                className="ml-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedItems.length})
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
        {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
        {renderSelectionButtons()}
      </div>

      {listView ? (
        <motion.div
          className="flex flex-col gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {media.map((mediaItem, idx) => (
            <motion.div
              key={`${mediaItem.media_type}-${mediaItem.id}-${mediaItem.docId ?? idx}`}
              variants={item}
              className="glass group rounded-lg p-4 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-4">
                {selectMode && mediaItem.docId && (
                  <div className="flex-shrink-0">
                    <Checkbox
                      checked={selectedItems.includes(mediaItem.docId)}
                      onCheckedChange={() => handleSelect(mediaItem.docId!)}
                    />
                  </div>
                )}
                <div className="md:h-30 h-24 w-16 flex-shrink-0 overflow-hidden rounded-md md:w-20">
                  <MediaCard
                    media={{ ...mediaItem, id: mediaItem.media_id }}
                    className="h-full w-full"
                    minimal
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {mediaItem.title || mediaItem.name}
                    </h3>
                    {!selectMode && onDelete && mediaItem.docId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(mediaItem.docId!)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-white/70 hover:text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="mb-2 flex items-center text-sm text-white/70">
                    <span>
                      {mediaItem.media_type === "movie"
                        ? mediaItem.release_date?.substring(0, 4)
                        : mediaItem.first_air_date?.substring(0, 4)}
                    </span>
                    {mediaItem.vote_average > 0 && (
                      <span className="ml-3 flex items-center text-amber-400">
                        ★ {mediaItem.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {renderTimestamp(mediaItem)}
                  <div className="flex flex-wrap items-center gap-2">
                    {mediaItem.media_type === "tv" && (
                      <span className="bg-accent/20 rounded px-2 py-1 text-xs font-medium">
                        S{mediaItem.season} E{mediaItem.episode}
                      </span>
                    )}
                    {mediaItem.media_type === "movie" && (
                      <span className="rounded bg-gray-700/50 px-2 py-1 text-xs font-medium">
                        Movie
                      </span>
                    )}
                  </div>

                  {/* Show additional episode information for TV shows */}
                  {mediaItem.media_type === "tv" &&
                    mediaItem.episodes_watched &&
                    mediaItem.episodes_watched.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-white/70">
                          Episodes watched: {mediaItem.episodes_watched.length}
                        </div>
                        {mediaItem.episodes_watched
                          .slice(0, 3)
                          .map((ep, idx) => (
                            <span
                              key={`${ep.season}-${ep.episode}-${idx}`}
                              className="mr-1 rounded bg-purple-600/30 px-1.5 py-0.5 text-xs"
                            >
                              S{ep.season}E{ep.episode}
                            </span>
                          ))}
                        {mediaItem.episodes_watched.length > 3 && (
                          <span className="text-xs text-white/50">
                            +{mediaItem.episodes_watched.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                  <p className="mt-2 line-clamp-2 text-sm text-white/70">
                    {mediaItem.overview}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {media.map((mediaItem, idx) => (
            <motion.div
              key={`${mediaItem.media_type}-${mediaItem.id}-${mediaItem.docId ?? idx}`}
              variants={item}
              className="group relative"
            >
              {selectMode && mediaItem.docId && (
                <div className="absolute left-2 top-2 z-10">
                  <Checkbox
                    checked={selectedItems.includes(mediaItem.docId)}
                    onCheckedChange={() => handleSelect(mediaItem.docId!)}
                  />
                </div>
              )}
              {!selectMode && onDelete && mediaItem.docId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(mediaItem.docId!)}
                  className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-white/70 hover:text-red-500" />
                </Button>
              )}
              <MediaCard media={{ ...mediaItem, id: mediaItem.media_id }} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MediaGrid;
