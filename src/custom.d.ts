// TypeScript declarations for browser APIs

interface Window {
  webkitSpeechRecognition: typeof SpeechRecognition;
  SpeechRecognition: typeof SpeechRecognition;
}

interface Navigator {
  vibrate: (pattern: number | number[]) => boolean;
}
