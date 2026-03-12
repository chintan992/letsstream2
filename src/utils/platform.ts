declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
      event?: {
        listen: <T>(
          event: string,
          handler: (event: { payload: T }) => void
        ) => Promise<() => void>;
        emit: (event: string, payload?: unknown) => Promise<void>;
      };
      deepLink?: {
        getCurrent: () => Promise<string[] | null>;
        onOpenUrl: (handler: (urls: string[]) => void) => Promise<void>;
      };
      [key: string]: unknown;
    };
  }
}

export const isTauri = (): boolean => {
  return window.__TAURI__ !== undefined;
};

export const isMobileTauri = (): boolean => {
  return isTauri() && /android|ios/i.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return isTauri() && /android/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  return isTauri() && /ios|iphone|ipad/i.test(navigator.userAgent);
};

export const isWeb = (): boolean => {
  return !isTauri();
};
