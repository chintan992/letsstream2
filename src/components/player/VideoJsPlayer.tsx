import { useEffect, useRef, useState, useCallback } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { LabeledStreamLink, Watch32Subtitle } from "@/utils/types";
import { m, AnimatePresence } from "framer-motion";
import { useChromecast } from "@/hooks/use-chromecast";

/**
 * Detect video MIME type from URL. For MKV files, return undefined
 * to let the browser attempt native playback (Chrome supports MKV with H.264).
 */
function getVideoType(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith(".mp4")) return "video/mp4";
    if (pathname.endsWith(".webm")) return "video/webm";
    if (pathname.endsWith(".ogg") || pathname.endsWith(".ogv"))
      return "video/ogg";
    if (pathname.endsWith(".m3u8")) return "application/x-mpegURL";
    if (pathname.endsWith(".mpd")) return "application/dash+xml";
    return undefined;
  } catch {
    return undefined;
  }
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VideoJsPlayerProps {
  links: LabeledStreamLink[];
  title: string;
  poster?: string;
  onLoaded: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  apiError: string | null;
}

const VideoJsPlayer = ({
  links,
  title,
  poster,
  onLoaded,
  onError,
  isLoading,
  apiError,
}: VideoJsPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  // Default to first 1080p link if available
  const defaultIndex = links.findIndex(l => l.quality === "1080p");
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(
    defaultIndex >= 0 ? defaultIndex : 0
  );
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [playerState, setPlayerState] = useState<{
    ready: boolean;
    activeSubtitleIndex: number;
  }>({ ready: false, activeSubtitleIndex: -1 });
  const { ready: playerReady, activeSubtitleIndex } = playerState;
  const qualityRef = useRef<HTMLDivElement>(null);

  const [isSubtitleOpen, setIsSubtitleOpen] = useState(false);
  const subtitleRef = useRef<HTMLDivElement>(null);

  // Chromecast
  const {
    isAvailable: isCastAvailable,
    isConnected: isCasting,
    castMedia,
    toggleConnection: toggleCast,
  } = useChromecast();

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioState, setAudioState] = useState({ volume: 1, isMuted: false });
  const { volume, isMuted } = audioState;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seekIndicator, setSeekIndicator] = useState<string | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Get subtitles from the current link
  const currentSubtitles: Watch32Subtitle[] =
    links[selectedLinkIndex]?.subtitles || [];

  // Show controls temporarily
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying && !isQualityOpen && !isSubtitleOpen)
        setShowControls(false);
    }, 3000);
  }, [isPlaying, isQualityOpen, isSubtitleOpen]);

  // Show seek indicator briefly
  const flashSeekIndicator = useCallback((text: string) => {
    setSeekIndicator(text);
    if (seekIndicatorTimer.current) clearTimeout(seekIndicatorTimer.current);
    seekIndicatorTimer.current = setTimeout(() => setSeekIndicator(null), 800);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        qualityRef.current &&
        !qualityRef.current.contains(e.target as Node)
      ) {
        setIsQualityOpen(false);
      }
      if (
        subtitleRef.current &&
        !subtitleRef.current.contains(e.target as Node)
      ) {
        setIsSubtitleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Add VTT subtitle tracks to the Video.js player.
   * Removes any existing remote text tracks before adding new ones.
   */
  const updateSubtitleTracks = useCallback(
    (player: Player, subtitles: Watch32Subtitle[], activeIdx: number) => {
      // Remove existing remote text tracks
      const existingTracks = player.remoteTextTracks();
      // Iterate backwards to avoid index shifting during removal
      for (let i = existingTracks.length - 1; i >= 0; i--) {
        const track = existingTracks[i];
        if (track) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          player.removeRemoteTextTrack(track as any);
        }
      }

      // Add new subtitle tracks
      subtitles.forEach((sub, idx) => {
        const trackOptions: Record<string, unknown> = {
          kind: "subtitles" as const,
          label: sub.label,
          language: sub.label.toLowerCase().substring(0, 2),
          src: sub.url,
          default: false,
        };
        const addedTrack = player.addRemoteTextTrack(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trackOptions as any,
          false
        );

        // Set the active track mode
        // HTMLTrackElement has .track at runtime but TS DOM typings may not expose it
        const textTrack = (addedTrack as unknown as { track?: TextTrack })
          ?.track;
        if (textTrack) {
          textTrack.mode = idx === activeIdx ? "showing" : "disabled";
        }
      });
    },
    []
  );

  // Initialize Video.js player — only runs on first mount or when links array changes
  useEffect(() => {
    if (!videoRef.current || links.length === 0) return;

    // Use the currently selected link (via ref to avoid stale closure)
    const initialLink = links[selectedLinkIndex] || links[0];

    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoElement.style.width = "100%";
      videoElement.style.height = "100%";
      videoRef.current.appendChild(videoElement);

      const player = videojs(videoElement, {
        autoplay: false,
        controls: false,
        responsive: false,
        fluid: false,
        preload: "auto",
        poster: poster || undefined,
        sources: [
          {
            src: initialLink.url,
            type: getVideoType(initialLink.url),
          },
        ],
        html5: {
          nativeAudioTracks: false,
          nativeVideoTracks: false,
        },
      });

      player.ready(() => {
        playerRef.current = player;
        onLoaded();

        const subs = initialLink.subtitles || [];
        const defaultIdx = subs.findIndex(s => s.default);
        const initialSubIdx =
          subs.length > 0 ? (defaultIdx >= 0 ? defaultIdx : -1) : -1;
        setPlayerState({ ready: true, activeSubtitleIndex: initialSubIdx });
        if (subs.length > 0) {
          updateSubtitleTracks(player, subs, initialSubIdx);
        }
      });

      player.on("play", () => setIsPlaying(true));
      player.on("pause", () => setIsPlaying(false));
      player.on("ended", () => setIsPlaying(false));
      player.on("timeupdate", () => {
        setCurrentTime(player.currentTime() || 0);
      });
      player.on("durationchange", () => {
        setDuration(player.duration() || 0);
      });
      player.on("volumechange", () => {
        setAudioState({
          volume: player.volume() || 0,
          isMuted: player.muted() || false,
        });
      });
      player.on("progress", () => {
        const buf = player.buffered();
        if (buf && buf.length > 0) {
          setBuffered(buf.end(buf.length - 1));
        }
      });
      player.on("error", () => {
        const err = player.error();
        onError(
          err ? `Playback error: ${err.message || "Unknown"}` : "Playback error"
        );
      });
    }
    // NOTE: Quality switching is handled entirely by handleQualityChange,
    // NOT by this effect. This prevents double-setting the source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links, poster, onLoaded, onError]);

  // Cleanup
  useEffect(() => {
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
        setPlayerState(prev => ({ ...prev, ready: false }));
      }
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      if (seekIndicatorTimer.current) clearTimeout(seekIndicatorTimer.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current || !playerReady) return;
      // Don't capture keys if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const player = playerRef.current;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (player.paused()) player.play();
          else player.pause();
          showControlsTemporarily();
          break;
        case "ArrowRight":
          e.preventDefault();
          player.currentTime(
            Math.min((player.currentTime() || 0) + 10, player.duration() || 0)
          );
          flashSeekIndicator("+10s");
          showControlsTemporarily();
          break;
        case "ArrowLeft":
          e.preventDefault();
          player.currentTime(Math.max((player.currentTime() || 0) - 10, 0));
          flashSeekIndicator("-10s");
          showControlsTemporarily();
          break;
        case "ArrowUp":
          e.preventDefault();
          player.volume(Math.min((player.volume() || 0) + 0.1, 1));
          showControlsTemporarily();
          break;
        case "ArrowDown":
          e.preventDefault();
          player.volume(Math.max((player.volume() || 0) - 0.1, 0));
          showControlsTemporarily();
          break;
        case "m":
        case "M":
          player.muted(!player.muted());
          showControlsTemporarily();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "c":
        case "C":
          // Toggle subtitles on/off
          if (currentSubtitles.length > 0) {
            if (activeSubtitleIndex >= 0) {
              handleSubtitleChange(-1);
            } else {
              const defaultIdx = currentSubtitles.findIndex(s => s.default);
              handleSubtitleChange(defaultIdx >= 0 ? defaultIdx : 0);
            }
            showControlsTemporarily();
          }
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9": {
          const pct = parseInt(e.key) / 10;
          player.currentTime(pct * (player.duration() || 0));
          showControlsTemporarily();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    playerReady,
    showControlsTemporarily,
    flashSeekIndicator,
    activeSubtitleIndex,
    currentSubtitles,
  ]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (playerRef.current.paused()) playerRef.current.play();
    else playerRef.current.pause();
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const seekBy = useCallback(
    (seconds: number) => {
      if (!playerRef.current) return;
      const newTime = Math.max(
        0,
        Math.min(
          (playerRef.current.currentTime() || 0) + seconds,
          playerRef.current.duration() || 0
        )
      );
      playerRef.current.currentTime(newTime);
      flashSeekIndicator(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
      showControlsTemporarily();
    },
    [flashSeekIndicator, showControlsTemporarily]
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const handleVolumeChange = useCallback((newVol: number) => {
    if (!playerRef.current) return;
    playerRef.current.volume(newVol);
    if (newVol > 0 && playerRef.current.muted()) {
      playerRef.current.muted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.muted(!playerRef.current.muted());
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!playerRef.current || !progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      playerRef.current.currentTime(pct * (playerRef.current.duration() || 0));
      showControlsTemporarily();
    },
    [showControlsTemporarily]
  );

  const handleQualityChange = useCallback(
    (index: number) => {
      if (!playerRef.current || !links[index]) return;
      if (index === selectedLinkIndex) {
        setIsQualityOpen(false);
        return;
      }

      const ct = playerRef.current.currentTime() || 0;
      const wasPlaying = !playerRef.current.paused();

      setSelectedLinkIndex(index);
      setIsQualityOpen(false);

      playerRef.current.src({
        src: links[index].url,
        type: getVideoType(links[index].url),
      });

      // Update subtitles for the new server/link
      const newSubs = links[index].subtitles || [];
      if (newSubs.length > 0) {
        const defaultIdx = newSubs.findIndex(s => s.default);
        const subIdx =
          defaultIdx >= 0
            ? defaultIdx
            : activeSubtitleIndex >= 0
              ? Math.min(activeSubtitleIndex, newSubs.length - 1)
              : -1;
        setPlayerState(prev => ({ ...prev, activeSubtitleIndex: subIdx }));
        updateSubtitleTracks(playerRef.current, newSubs, subIdx);
      } else {
        setPlayerState(prev => ({ ...prev, activeSubtitleIndex: -1 }));
      }

      playerRef.current.one("loadedmetadata", () => {
        if (playerRef.current) {
          playerRef.current.currentTime(ct);
          if (wasPlaying) {
            playerRef.current.play()?.catch(() => {});
          }
        }
      });
    },
    [links, selectedLinkIndex, activeSubtitleIndex, updateSubtitleTracks]
  );

  const handleSubtitleChange = useCallback((index: number) => {
    setPlayerState(prev => ({ ...prev, activeSubtitleIndex: index }));
    setIsSubtitleOpen(false);

    if (playerRef.current) {
      const tracks = playerRef.current.remoteTextTracks();
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track) {
          track.mode = i === index ? "showing" : "disabled";
        }
      }
    }
  }, []);

  // Error state
  if (apiError) {
    return (
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black shadow-2xl">
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 ring-1 ring-red-500/30">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Streaming Error
            </h3>
            <p className="mt-1 max-w-sm text-sm text-white/60">{apiError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || links.length === 0) {
    return (
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black shadow-2xl">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
          <p className="text-sm font-medium text-white/50">
            Fetching streaming links...
          </p>
        </m.div>
      </div>
    );
  }

  const currentLink = links[selectedLinkIndex] || links[0];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;
  const remaining = duration - currentTime;
  const hasSubtitles = currentSubtitles.length > 0;

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-xl bg-black shadow-2xl"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
      style={{ aspectRatio: isFullscreen ? undefined : "16/9" }}
    >
      {/* Video.js container */}
      <div
        ref={videoRef}
        data-vjs-player
        className="absolute inset-0 h-full w-full cursor-pointer [&_.video-js]:!h-full [&_.video-js]:!w-full [&_.video-js]:!p-0 [&_.vjs-big-play-button]:!hidden [&_.vjs-control-bar]:!hidden [&_.vjs-loading-spinner]:!hidden [&_.vjs-poster]:bg-cover [&_.vjs-tech]:object-contain"
        role="button"
        tabIndex={0}
        aria-label="Toggle play"
        onClick={togglePlay}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          }
        }}
      />

      {/* Seek indicator overlay */}
      <AnimatePresence>
        {seekIndicator && (
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          >
            <div className="rounded-xl bg-black/70 px-6 py-3 text-2xl font-bold text-white backdrop-blur-sm">
              {seekIndicator}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Play/Pause center overlay (when paused) */}
      {!isPlaying && playerReady && (
        <div
          className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center"
          role="button"
          tabIndex={0}
          aria-label="Play video"
          onClick={togglePlay}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              togglePlay();
            }
          }}
        >
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-md transition-transform hover:scale-110"
          >
            <svg
              className="ml-1 h-8 w-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </m.div>
        </div>
      )}

      {/* Custom Controls Bar */}
      <m.div
        initial={false}
        animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-12"
      >
        {/* Progress bar */}
        <div
          ref={progressBarRef}
          className="group/progress mb-2 h-1.5 cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
          role="slider"
          tabIndex={0}
          aria-label="Video progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          onClick={handleProgressClick}
          onKeyDown={e => {
            // Stop propagation to avoid global window key handlers
            e.stopPropagation();
            switch (e.key) {
              case "ArrowRight":
              case "ArrowUp":
                e.preventDefault();
                seekBy(5);
                break;
              case "ArrowLeft":
              case "ArrowDown":
                e.preventDefault();
                seekBy(-5);
                break;
              case "Home":
                e.preventDefault();
                playerRef.current?.currentTime(0);
                showControlsTemporarily();
                break;
              case "End":
                e.preventDefault();
                playerRef.current?.currentTime(
                  playerRef.current?.duration() || 0
                );
                showControlsTemporarily();
                break;
            }
          }}
          onMouseDown={e => {
            setIsSeeking(true);
            handleProgressClick(e);
          }}
          onMouseUp={() => setIsSeeking(false)}
        >
          {/* Buffered */}
          <div
            className="absolute h-full rounded-full bg-white/30"
            style={{ width: `${bufferProgress}%` }}
          />
          {/* Progress */}
          <div
            className="relative h-full rounded-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          >
            {/* Thumb */}
            <div className="absolute -right-1.5 -top-0.5 h-3 w-3 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover/progress:opacity-100" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Rewind 10s */}
          <button
            onClick={() => seekBy(-10)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Rewind 10 seconds"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
              />
            </svg>
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => seekBy(10)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Forward 10 seconds"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
              />
            </svg>
          </button>

          {/* Volume */}
          <div className="group/vol flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : volume < 0.5 ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>
            <div className="flex w-0 items-center overflow-hidden opacity-0 transition-all duration-200 ease-out group-hover/vol:w-24 group-hover/vol:opacity-100">
              <div className="relative flex h-8 w-24 items-center px-1">
                {/* Track background */}
                <div className="absolute left-1 right-1 h-1 rounded-full bg-white/20" />
                {/* Track fill */}
                <div
                  className="absolute left-1 h-1 rounded-full bg-white"
                  style={{ width: `${(isMuted ? 0 : volume) * (96 - 8)}px` }}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  className="relative z-10 h-1 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>

          {/* Time display */}
          <div className="ml-1 select-none text-xs font-medium tabular-nums text-white/70">
            <span className="text-white">{formatTime(currentTime)}</span>
            <span className="mx-1 text-white/40">/</span>
            <span>{formatTime(duration)}</span>
            <span className="ml-2 text-white/40">-{formatTime(remaining)}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Subtitle selector */}
          {hasSubtitles && (
            <div ref={subtitleRef} className="relative">
              <button
                onClick={() => setIsSubtitleOpen(!isSubtitleOpen)}
                className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all hover:bg-white/15 ${
                  activeSubtitleIndex >= 0
                    ? "border-blue-400/40 bg-blue-500/20 text-blue-300"
                    : "border-white/10 bg-white/5 text-white/90"
                }`}
                aria-label="Select subtitles"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                CC
              </button>

              <AnimatePresence>
                {isSubtitleOpen && (
                  <m.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full right-0 mb-2 max-h-52 w-44 overflow-y-auto rounded-lg border border-white/15 bg-gray-900/95 py-1 shadow-2xl backdrop-blur-lg"
                  >
                    {/* Off option */}
                    <button
                      onClick={() => handleSubtitleChange(-1)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${
                        activeSubtitleIndex === -1
                          ? "bg-white/10 text-white"
                          : "text-white/70"
                      }`}
                    >
                      <span className="font-medium">Off</span>
                      {activeSubtitleIndex === -1 && (
                        <svg
                          className="h-3 w-3 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    {currentSubtitles.map((sub, index) => (
                      <button
                        key={`${sub.label}-${index}`}
                        onClick={() => handleSubtitleChange(index)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${
                          index === activeSubtitleIndex
                            ? "bg-white/10 text-white"
                            : "text-white/70"
                        }`}
                      >
                        <span className="font-medium">{sub.label}</span>
                        {index === activeSubtitleIndex && (
                          <svg
                            className="h-3 w-3 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quality selector */}
          {links.length > 1 && (
            <div ref={qualityRef} className="relative">
              <button
                onClick={() => setIsQualityOpen(!isQualityOpen)}
                className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-white/90 transition-all hover:bg-white/15"
                aria-label="Select quality"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {currentLink.label}
              </button>

              <AnimatePresence>
                {isQualityOpen && (
                  <m.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full right-0 mb-2 max-h-52 w-44 overflow-y-auto rounded-lg border border-white/15 bg-gray-900/95 py-1 shadow-2xl backdrop-blur-lg"
                  >
                    {links.map((link, index) => (
                      <button
                        key={`${link.quality}-${link.tier}-${index}`}
                        onClick={() => handleQualityChange(index)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${
                          index === selectedLinkIndex
                            ? "bg-white/10 text-white"
                            : "text-white/70"
                        }`}
                      >
                        <span className="font-medium">{link.label}</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                          {link.tier}
                        </span>
                      </button>
                    ))}
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Chromecast */}
          {isCastAvailable && (
            <button
              onClick={() => {
                if (isCasting) {
                  toggleCast();
                } else {
                  toggleCast();
                  // After connection is established, cast the current media
                  const currentUrl = links[selectedLinkIndex]?.url;
                  if (currentUrl) {
                    setTimeout(() => {
                      castMedia(
                        currentUrl,
                        title,
                        poster,
                        playerRef.current?.currentTime() || 0
                      );
                    }, 2000);
                  }
                }
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 ${
                isCasting ? "text-blue-400" : "text-white/80 hover:text-white"
              }`}
              aria-label={isCasting ? "Stop casting" : "Cast to device"}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                {isCasting ? (
                  <>
                    <path d="M1 18v3h3c0-1.66-1.34-3-3-3z" />
                    <path d="M1 14v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7z" />
                    <path d="M1 10v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z" />
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                  </>
                ) : (
                  <>
                    <path d="M1 18v3h3c0-1.66-1.34-3-3-3z" />
                    <path d="M1 14v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7z" />
                    <path d="M1 10v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z" />
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                  </>
                )}
              </svg>
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
            )}
          </button>
        </div>
      </m.div>

      {/* Keyboard shortcuts hint - shown briefly on first hover */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="rounded-md bg-black/50 px-2 py-1 text-[10px] text-white/40 backdrop-blur-sm">
          Space: play/pause · ← → seek · ↑ ↓ volume · M: mute · F: fullscreen ·
          C: subtitles
        </div>
      </div>
    </div>
  );
};

export default VideoJsPlayer;
