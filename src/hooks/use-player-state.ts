import { useState, useCallback, useEffect } from "react";
import type Player from "video.js/dist/types/player";

interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isEnded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isTheaterMode: boolean;
  isLightsOut: boolean;
  isPictureInPicture: boolean;
  isFullscreen: boolean;
  autoPlayNextEpisode: boolean;
  autoPlayNextSeason: boolean;
  selectedSubtitleTrack: string | null;
  selectedAudioTrack: string | null;
}

/**
 * Hook to manage video player state
 * Integrates with Video.js player instance
 */
export function usePlayerState(player: Player | null) {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isPaused: true,
    isEnded: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    isTheaterMode: false,
    isLightsOut: false,
    isPictureInPicture: false,
    isFullscreen: false,
    autoPlayNextEpisode: true,
    autoPlayNextSeason: true,
    selectedSubtitleTrack: null,
    selectedAudioTrack: null,
  });

  // Sync state with player events
  useEffect(() => {
    if (!player) return;

    const handlePlay = () => {
      setState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        isEnded: false,
      }));
    };

    const handlePause = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
      }));
    };

    const handleEnded = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
        isEnded: true,
      }));
    };

    const handleTimeUpdate = () => {
      const currentTime = player.currentTime();
      const duration = player.duration();
      setState(prev => ({
        ...prev,
        currentTime,
        duration,
      }));
    };

    const handleVolumeChange = () => {
      setState(prev => ({
        ...prev,
        volume: player.volume(),
        isMuted: player.muted(),
      }));
    };

    const handlePlaybackRateChange = () => {
      setState(prev => ({
        ...prev,
        playbackRate: player.playbackRate(),
      }));
    };

    const handleFullscreenChange = () => {
      setState(prev => ({
        ...prev,
        isFullscreen: player.isFullscreen(),
      }));
    };

    player.on("play", handlePlay);
    player.on("pause", handlePause);
    player.on("ended", handleEnded);
    player.on("timeupdate", handleTimeUpdate);
    player.on("volumechange", handleVolumeChange);
    player.on("ratechange", handlePlaybackRateChange);
    player.on("fullscreenchange", handleFullscreenChange);

    return () => {
      player.off("play", handlePlay);
      player.off("pause", handlePause);
      player.off("ended", handleEnded);
      player.off("timeupdate", handleTimeUpdate);
      player.off("volumechange", handleVolumeChange);
      player.off("ratechange", handlePlaybackRateChange);
      player.off("fullscreenchange", handleFullscreenChange);
    };
  }, [player]);

  // Player control functions
  const togglePlay = useCallback(() => {
    if (!player) return;
    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  }, [player]);

  const seek = useCallback(
    (time: number) => {
      if (!player) return;
      player.currentTime(time);
    },
    [player]
  );

  const skipForward = useCallback(
    (seconds: number = 10) => {
      if (!player) return;
      const currentTime = player.currentTime();
      const duration = player.duration();
      player.currentTime(Math.min(currentTime + seconds, duration));
    },
    [player]
  );

  const skipBackward = useCallback(
    (seconds: number = 10) => {
      if (!player) return;
      const currentTime = player.currentTime();
      player.currentTime(Math.max(currentTime - seconds, 0));
    },
    [player]
  );

  const setVolume = useCallback(
    (volume: number) => {
      if (!player) return;
      player.volume(Math.max(0, Math.min(1, volume)));
    },
    [player]
  );

  const toggleMute = useCallback(() => {
    if (!player) return;
    player.muted(!player.muted());
  }, [player]);

  const setPlaybackRate = useCallback(
    (rate: number) => {
      if (!player) return;
      player.playbackRate(rate);
    },
    [player]
  );

  const toggleTheaterMode = useCallback(() => {
    setState(prev => ({ ...prev, isTheaterMode: !prev.isTheaterMode }));
  }, []);

  const toggleLightsOut = useCallback(() => {
    setState(prev => ({ ...prev, isLightsOut: !prev.isLightsOut }));
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    if (!player) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setState(prev => ({ ...prev, isPictureInPicture: false }));
      } else {
        await (player.tech() as any).el_.requestPictureInPicture();
        setState(prev => ({ ...prev, isPictureInPicture: true }));
      }
    } catch (error) {
      console.error("Picture-in-Picture error:", error);
    }
  }, [player]);

  const toggleFullscreen = useCallback(() => {
    if (!player) return;
    if (player.isFullscreen()) {
      player.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  }, [player]);

  const toggleAutoPlayNextEpisode = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoPlayNextEpisode: !prev.autoPlayNextEpisode,
    }));
  }, []);

  const toggleAutoPlayNextSeason = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoPlayNextSeason: !prev.autoPlayNextSeason,
    }));
  }, []);

  const setSubtitleTrack = useCallback(
    (trackId: string | null) => {
      if (!player) return;
      const tracks = player.textTracks();
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = tracks[i].id === trackId ? "showing" : "disabled";
      }
      setState(prev => ({ ...prev, selectedSubtitleTrack: trackId }));
    },
    [player]
  );

  const setAudioTrack = useCallback(
    (trackId: string | null) => {
      if (!player) return;
      const tracks = player.audioTracks();
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].enabled = tracks[i].id === trackId;
      }
      setState(prev => ({ ...prev, selectedAudioTrack: trackId }));
    },
    [player]
  );

  return {
    state,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleTheaterMode,
    toggleLightsOut,
    togglePictureInPicture,
    toggleFullscreen,
    toggleAutoPlayNextEpisode,
    toggleAutoPlayNextSeason,
    setSubtitleTrack,
    setAudioTrack,
  };
}
