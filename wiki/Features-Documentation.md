# Features Documentation

This document provides detailed information about Let's Stream V2.0's features and how to use them.

## Core Features

### Authentication

- **Email/Password Authentication**
  - User registration with email verification
  - Password reset functionality
  - Account management
- **Social Authentication**
  - Google Sign-in integration
  - OAuth2 flow implementation
  - Profile data synchronization

### Content Management

- **Movies & TV Shows**
  - Browse popular content
  - View trending items
  - Search functionality with filters
  - Detailed media information
- **Sports Content**
  - Live sports streaming
  - Match schedules
  - Multiple stream qualities
  - Real-time updates

### User Features

- **Watch History**
  - Automatic background tracking
  - Intelligent resume playback
  - Duplicate prevention system
  - Clear history option
  - Cross-device synchronization
  - Responsive viewing cards
  - Time-based progress tracking

- **Continue Watching**
  - Visually enhanced cards
  - Progress indicators
  - Time remaining display
  - Quick access to resume playback
  - Smart duplicate handling
  - Responsive design for all devices
  - Cross-device synchronization

- **Favorites & Watchlist**
  - Add/remove favorites
  - Manage watchlist
  - Sort and filter saved items
  - Sync across devices

### PWA Features

- **Offline Support**
  - Cache management
  - Offline content access
  - Background sync
  - Push notifications

- **Installation**
  - Install prompt
  - Add to home screen
  - App-like experience
  - Automatic updates

## User Interface

### Theme Customization

```typescript
// Example: Using the accent color picker
const { userPreferences } = useUserPreferences();
const accentColor = userPreferences?.accentColor || "#3b82f6";

// Apply accent color
document.documentElement.style.setProperty(
  "--accent",
  getHSLFromHex(accentColor)
);
```

### Responsive Design

- Mobile-first approach
- Breakpoint system:
  ```css
  /* Breakpoints */
  sm: '640px'   // Small devices
  md: '768px'   // Medium devices
  lg: '1024px'  // Large devices
  xl: '1280px'  // Extra large devices
  2xl: '1400px' // 2X large devices
  ```

### Component Library

- Radix UI integration
- Custom UI components
- Consistent styling
- Accessibility features

## Continue Watching Implementation

### Basic Usage

The Continue Watching feature automatically tracks and displays recently watched content:

```tsx
// Example: Continue Watching component (simplified)
const ContinueWatching = () => {
  const { user } = useAuth();
  const { watchHistory } = useWatchHistory();

  // Items are filtered, deduplicated and sorted by most recent
  const processedHistory = useMemo(() => {
    const uniqueMediaMap = new Map();

    watchHistory.forEach(item => {
      // Create a unique key for each media item
      const key = `${item.media_type}-${item.media_id}${item.media_type === "tv" ? `-s${item.season}-e${item.episode}` : ""}`;

      // Only keep the most recent item
      if (
        !uniqueMediaMap.has(key) ||
        new Date(item.created_at) > new Date(uniqueMediaMap.get(key).created_at)
      ) {
        uniqueMediaMap.set(key, item);
      }
    });

    return Array.from(uniqueMediaMap.values()).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [watchHistory]);

  return (
    <div className="continue-watching-row">
      {processedHistory.map(item => (
        <WatchCard key={item.id} watchItem={item} />
      ))}
    </div>
  );
};
```

### Watch History Deduplication

The system implements a smart deduplication strategy:

```typescript
// Example: Deduplication utility
export const deduplicateWatchHistory = (
  items: WatchHistoryItem[]
): WatchHistoryItem[] => {
  const mediaMap = new Map<string, WatchHistoryItem>();

  items.forEach(item => {
    // Create a unique key for TV episodes or movies
    const key = `${item.media_type}-${item.media_id}${item.media_type === "tv" ? `-s${item.season}-e${item.episode}` : ""}`;

    // Keep only the most recent version
    if (
      !mediaMap.has(key) ||
      new Date(item.created_at) > new Date(mediaMap.get(key)!.created_at)
    ) {
      mediaMap.set(key, item);
    }
  });

  return Array.from(mediaMap.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};
```

## Media Playback

### Video Player

- HLS support
- Quality selection
- Playback controls
- Progress tracking

### Streaming Features

```typescript
// Example: Quality selection
interface Quality {
  label: string;
  src: string;
  resolution: string;
}

const qualities: Quality[] = [
  { label: "4K", src: "4k_stream_url", resolution: "2160p" },
  { label: "HD", src: "hd_stream_url", resolution: "1080p" },
  { label: "SD", src: "sd_stream_url", resolution: "720p" },
];
```

## Data Management

### Firebase Integration

- Real-time updates
- Data synchronization
- Offline persistence
- Security rules

### Rate Limiting

```typescript
// Example: API rate limiting
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  timeWindow: 60000, // 1 minute
});

// Usage
if (await rateLimiter.shouldAllowRequest()) {
  // Make API request
} else {
  // Handle rate limit
}
```

## Search & Discovery

### Search Implementation

- Real-time suggestions
- Advanced filters
- Sort options
- Search history

### Content Discovery

- Personalized recommendations
- Trending content
- New releases
- Categories

## Performance Optimization

### Caching Strategy

```javascript
// Service Worker caching
workbox.routing.registerRoute(
  /^https:\/\/api\.themoviedb\.org\/3\/.*/i,
  new workbox.strategies.NetworkFirst({
    cacheName: "tmdb-api-cache",
    networkTimeoutSeconds: 10,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 86400,
      }),
    ],
  })
);
```

### Code Splitting

- Route-based splitting
- Component lazy loading
- Dynamic imports
- Bundle optimization

## Error Handling

### Error Boundaries

```typescript
// Example: Error boundary implementation
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to service
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Toast Notifications

- Success messages
- Error notifications
- Warning alerts
- Info messages

## Security Features

### Authentication Flow

- Token management
- Session handling
- Secure storage
- Auth state persistence

### Data Protection

- Input validation
- XSS prevention
- CSRF protection
- Content security policy
