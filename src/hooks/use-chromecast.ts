import { useState, useEffect, useCallback, useRef } from "react";

// Type declarations for the Cast SDK
declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: {
      framework: {
        CastContext: {
          getInstance: () => CastContext;
        };
        CastContextEventType: {
          SESSION_STATE_CHANGED: string;
        };
        SessionState: {
          SESSION_STARTED: string;
          SESSION_RESUMED: string;
          SESSION_ENDED: string;
        };
        RemotePlayerEventType: {
          IS_CONNECTED_CHANGED: string;
          CURRENT_TIME_CHANGED: string;
          IS_PAUSED_CHANGED: string;
          PLAYER_STATE_CHANGED: string;
        };
        RemotePlayer: new () => RemotePlayer;
        RemotePlayerController: new (
          player: RemotePlayer
        ) => RemotePlayerController;
      };
    };
    chrome?: {
      cast?: {
        media: {
          MediaInfo: new (contentId: string, contentType: string) => MediaInfo;
          GenericMediaMetadata: new () => GenericMediaMetadata;
          LoadRequest: new (mediaInfo: MediaInfo) => LoadRequest;
        };
        AutoJoinPolicy: {
          ORIGIN_SCOPED: string;
        };
      };
    };
  }
}

interface CastContext {
  setOptions: (options: Record<string, unknown>) => void;
  getCurrentSession: () => CastSession | null;
  addEventListener: (
    type: string,
    listener: (event: SessionStateEvent) => void
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: SessionStateEvent) => void
  ) => void;
  requestSession: () => Promise<void>;
  endCurrentSession: (stopCasting: boolean) => void;
}

interface CastSession {
  getMediaSession: () => unknown;
  loadMedia: (request: LoadRequest) => Promise<void>;
}

interface SessionStateEvent {
  sessionState: string;
}

interface RemotePlayer {
  isConnected: boolean;
  currentTime: number;
  isPaused: boolean;
  playerState: string;
}

interface RemotePlayerController {
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  playOrPause: () => void;
  seek: () => void;
  stop: () => void;
}

interface MediaInfo {
  metadata: GenericMediaMetadata;
  streamType: string;
}

interface GenericMediaMetadata {
  metadataType: number;
  title: string;
  images: Array<{ url: string }>;
}

interface LoadRequest {
  currentTime: number;
  autoplay: boolean;
}

interface UseChromecastResult {
  isAvailable: boolean;
  isConnected: boolean;
  castMedia: (
    url: string,
    title: string,
    posterUrl?: string,
    startTime?: number
  ) => void;
  stopCasting: () => void;
  toggleConnection: () => void;
}

export function useChromecast(): UseChromecastResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const castContextRef = useRef<CastContext | null>(null);
  const initializedRef = useRef(false);
  const sessionStateChangedListenerRef = useRef<
    ((event: SessionStateEvent) => void) | null
  >(null);

  useEffect(() => {
    // If cast SDK is already loaded
    if (window.cast?.framework) {
      initializeCast();
      return;
    }

    // Wait for cast SDK to load
    window.__onGCastApiAvailable = (isAvail: boolean) => {
      if (isAvail) {
        initializeCast();
      }
    };

    return () => {
      window.__onGCastApiAvailable = undefined;
      if (castContextRef.current && sessionStateChangedListenerRef.current) {
        castContextRef.current.removeEventListener(
          window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          sessionStateChangedListenerRef.current
        );
        sessionStateChangedListenerRef.current = null;
      }
    };
  }, []);

  function initializeCast() {
    if (
      initializedRef.current ||
      !window.cast?.framework ||
      !window.chrome?.cast
    )
      return;
    initializedRef.current = true;

    const castContext = window.cast.framework.CastContext.getInstance();
    castContext.setOptions({
      receiverApplicationId: "CC1AD845", // Default Media Receiver
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    castContextRef.current = castContext;
    setIsAvailable(true);

    // Listen for session state changes
    const onSessionStateChanged = (event: SessionStateEvent) => {
      const fw = window.cast!.framework;
      if (
        event.sessionState === fw.SessionState.SESSION_STARTED ||
        event.sessionState === fw.SessionState.SESSION_RESUMED
      ) {
        setIsConnected(true);
      } else if (event.sessionState === fw.SessionState.SESSION_ENDED) {
        setIsConnected(false);
      }
    };
    sessionStateChangedListenerRef.current = onSessionStateChanged;
    castContext.addEventListener(
      window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      onSessionStateChanged
    );
  }

  const castMedia = useCallback(
    (url: string, title: string, posterUrl?: string, startTime: number = 0) => {
      if (!castContextRef.current || !window.chrome?.cast) return;

      const session = castContextRef.current.getCurrentSession();
      if (!session) return;

      const mediaInfo = new window.chrome.cast.media.MediaInfo(
        url,
        "video/mp4"
      );
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.metadataType = 0;
      mediaInfo.metadata.title = title;
      if (posterUrl) {
        mediaInfo.metadata.images = [{ url: posterUrl }];
      }
      mediaInfo.streamType = "BUFFERED";

      const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = startTime;
      request.autoplay = true;

      session.loadMedia(request).catch((err: Error) => {
        console.error("Failed to load media on Chromecast:", err);
      });
    },
    []
  );

  const stopCasting = useCallback(() => {
    if (castContextRef.current) {
      castContextRef.current.endCurrentSession(true);
    }
  }, []);

  const toggleConnection = useCallback(() => {
    if (!castContextRef.current) return;
    if (isConnected) {
      stopCasting();
    } else {
      castContextRef.current.requestSession().catch((err: Error) => {
        console.error("Cast session request failed:", err);
      });
    }
  }, [isConnected, stopCasting]);

  // Note: cleanup of the listener is handled in the outer effect's cleanup
  return {
    isAvailable,
    isConnected,
    castMedia,
    stopCasting,
    toggleConnection,
  };
}
