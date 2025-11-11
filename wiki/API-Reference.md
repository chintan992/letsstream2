# API Reference

This document provides detailed information about the APIs used in Let's Stream V2.0.

## Authentication API

### User Management

#### Sign Up

```typescript
interface SignUpParams {
  email: string;
  password: string;
}

interface SignUpResponse {
  user: User;
  token: string;
}
```

#### Sign In

```typescript
interface SignInParams {
  email: string;
  password: string;
}

interface SignInResponse {
  user: User;
  token: string;
}
```

#### Social Authentication

```typescript
interface SocialAuthParams {
  provider: "google";
}

interface SocialAuthResponse {
  user: User;
  token: string;
  provider: string;
}
```

## Media API

### Movies

#### Get Popular Movies

```typescript
interface MovieParams {
  page?: number;
  language?: string;
}

interface MovieResponse {
  results: Movie[];
  page: number;
  total_pages: number;
  total_results: number;
}
```

#### Search Movies

```typescript
interface SearchParams {
  query: string;
  page?: number;
  include_adult?: boolean;
  language?: string;
}
```

### TV Shows

#### Get Popular Shows

```typescript
interface TVParams {
  page?: number;
  language?: string;
}

interface TVResponse {
  results: TVShow[];
  page: number;
  total_pages: number;
  total_results: number;
}
```

### Sports

#### Get Live Matches

```typescript
interface LiveMatchesParams {
  sport?: string;
  league?: string;
  limit?: number;
}

interface LiveMatchesResponse {
  matches: SportMatch[];
  total: number;
}
```

## Video Streaming APIs

### Custom Streaming API

#### Get Movie Stream

```typescript
interface MovieStreamParams {
  id: number;
}

interface StreamResponse {
  source?: {
    provider: string;
    files: Array<{
      file: string;
      type: string;
      quality: string;
      lang: string;
    }>;
    headers?: Record<string, string>;
    subtitles?: Array<any>;
  };
  ERROR?: Array<{
    error: string;
    what_happened: string;
    report_issue: string;
  }>;
}
```

#### Get TV Stream

```typescript
interface TVStreamParams {
  id: number;
  s: number; // season
  e: number; // episode
}

// Uses the same StreamResponse interface as Movie Stream
```

#### Proxy Implementation

```typescript
interface ProxyParams {
  url: string;
  headers?: string; // JSON stringified headers
}

// Example usage
const proxyUrl = `${PROXY_URL}/v2?url=${encodeURIComponent(videoUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
```

## User Data API

### Watch History

#### Add to History

```typescript
interface WatchHistoryEntry {
  user_id: string;
  media_id: string;
  media_type: "movie" | "tv";
  progress: number;
  timestamp: number;
}
```

#### Get History

```typescript
interface GetHistoryParams {
  user_id: string;
  limit?: number;
  offset?: number;
}

interface GetHistoryResponse {
  history: WatchHistoryEntry[];
  total: number;
}
```

### User Preferences

#### Update Preferences

```typescript
interface UserPreferences {
  user_id: string;
  theme?: string;
  accentColor?: string;
  isWatchHistoryEnabled: boolean;
  notifications: {
    enabled: boolean;
    types: string[];
  };
}
```

## Firestore Collections

### Collection: userPreferences

```typescript
interface UserPreferencesDoc {
  user_id: string;
  isWatchHistoryEnabled: boolean;
  accentColor: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Collection: watchHistory

```typescript
interface WatchHistoryDoc {
  user_id: string;
  media_id: string;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string;
  watched_at: Timestamp;
  progress: number;
}
```

## Error Handling

### Error Codes

```typescript
enum ErrorCode {
  INVALID_CREDENTIALS = "auth/invalid-credentials",
  USER_NOT_FOUND = "auth/user-not-found",
  EMAIL_IN_USE = "auth/email-already-in-use",
  WEAK_PASSWORD = "auth/weak-password",
  NETWORK_ERROR = "network/error",
  API_ERROR = "api/error",
  RATE_LIMIT = "api/rate-limit",
}
```

### Error Responses

```typescript
interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
}
```

## Rate Limiting

### Configuration

```typescript
interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number;
  errorCode: ErrorCode;
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  timeWindow: 60000,
  errorCode: ErrorCode.RATE_LIMIT,
};
```

## WebSocket Events

### User Events

```typescript
interface UserEvent {
  type: "presence" | "status" | "preferences";
  user_id: string;
  data: any;
  timestamp: number;
}
```

### Media Events

```typescript
interface MediaEvent {
  type: "play" | "pause" | "seek" | "end";
  media_id: string;
  user_id: string;
  timestamp: number;
  data: {
    progress?: number;
    position?: number;
  };
}
```

## PWA Events

### Service Worker

```typescript
interface ServiceWorkerEvent {
  type: "install" | "activate" | "update" | "error";
  timestamp: number;
  details?: any;
}
```

### Push Notifications

```typescript
interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  data?: {
    url?: string;
    action?: string;
    [key: string]: any;
  };
}
```

## Authentication Flow

### Token Management

```typescript
interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}
```

### Session Management

```typescript
interface Session {
  user: User;
  tokens: AuthToken;
  created_at: number;
  expires_at: number;
}
```

## Example Usage

### Authentication

```typescript
const auth = new Auth();

// Sign up
const user = await auth.signUp({
  email: "user@example.com",
  password: "password123",
});

// Sign in
const session = await auth.signIn({
  email: "user@example.com",
  password: "password123",
});

// Google sign in
const googleUser = await auth.socialAuth({
  provider: "google",
});
```

### Media Operations

```typescript
const media = new MediaAPI();

// Get popular movies
const movies = await media.getPopular({
  page: 1,
  language: "en",
});

// Search content
const results = await media.search({
  query: "matrix",
  include_adult: false,
});

// Get live sports
const matches = await media.getLiveMatches({
  sport: "football",
  limit: 10,
});
```

### User Operations

```typescript
const userAPI = new UserAPI();

// Update preferences
await userAPI.updatePreferences({
  user_id: "user123",
  accentColor: "#ff0000",
  isWatchHistoryEnabled: true,
});

// Get watch history
const history = await userAPI.getHistory({
  user_id: "user123",
  limit: 20,
});
```
