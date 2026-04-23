import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import type Player from "video.js/dist/types/player";

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onReady?: (player: Player) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  className?: string;
}

export interface VideoPlayerRef {
  player: Player | null;
}

/**
 * Video.js player wrapper component for React
 * Supports MP4, MKV, AVI, and HLS (.m3u8) formats
 */
const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  (
    {
      src,
      poster,
      autoplay = false,
      muted = false,
      loop = false,
      onReady,
      onPlay,
      onPause,
      onEnded,
      onError,
      onTimeUpdate,
      onFullscreenChange,
      className = "",
    },
    ref
  ) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);

    // Expose player instance to parent
    useImperativeHandle(ref, () => ({
      get player() {
        return playerRef.current;
      },
    }));

    useEffect(() => {
      if (!videoRef.current) return;

      // Determine video type based on extension
      let type = "video/mp4";
      if (src.includes(".m3u8")) {
        type = "application/x-mpegURL";
      } else if (src.includes(".webm")) {
        type = "video/webm";
      }

      // Initialize Video.js player
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: autoplay,
        muted: muted,
        loop: loop,
        preload: "auto",
        fluid: true,
        aspectRatio: "16:9",
        poster: poster,
        sources: [
          {
            src: src,
            type: type,
          },
        ],
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          hls: {
            overrideNative: true,
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false,
        },
        controlBar: {
          playToggle: true,
          volumePanel: { inline: false },
          currentTimeDisplay: true,
          timeDivider: true,
          durationDisplay: true,
          progressControl: true,
          remainingTimeDisplay: false,
          fullscreenToggle: true,
          pictureInPictureToggle: true,
          playbackRateMenuButton: true,
        },
        userActions: {
          click: true,
          doubleClick: true,
          hotkeys: true,
        },
      });

      playerRef.current = player;

      // Event listeners
      if (onReady) {
        player.ready(() => onReady(player));
      }

      if (onPlay) {
        player.on("play", onPlay);
      }

      if (onPause) {
        player.on("pause", onPause);
      }

      if (onEnded) {
        player.on("ended", onEnded);
      }

      if (onError) {
        player.on("error", () => {
          const error = player.error();
          onError(error);
        });
      }

      if (onTimeUpdate) {
        player.on("timeupdate", () => {
          const currentTime = player.currentTime();
          const duration = player.duration();
          if (currentTime && duration) {
            onTimeUpdate(currentTime, duration);
          }
        });
      }

      if (onFullscreenChange) {
        player.on("fullscreenchange", () => {
          onFullscreenChange(player.isFullscreen());
        });
      }

      // Cleanup on unmount
      return () => {
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }, []);

    // Update source when it changes
    useEffect(() => {
      if (playerRef.current && src) {
        let type = "video/mp4";
        if (src.includes(".m3u8")) {
          type = "application/x-mpegURL";
        } else if (src.includes(".webm")) {
          type = "video/webm";
        }

        playerRef.current.src({ src, type });
        playerRef.current.load();
      }
    }, [src]);

    return (
      <div className={`relative ${className}`}>
        <div data-vjs-player>
          <video ref={videoRef} className="video-js vjs-big-play-centered" />
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
