# PWA Integration Guide

This guide covers the Progressive Web App (PWA) features in Let's Stream V2.0 and how to work with them.

## Overview

Let's Stream V2.0 is built as a Progressive Web App, offering:

- Offline functionality
- Installation capability
- Push notifications
- Background sync
- App-like experience

## PWA Configuration

### Vite PWA Plugin Setup

```typescript
// Configuration in vite.config.ts
VitePWA({
  registerType: "prompt",
  includeAssets: [
    "favicon.ico",
    "apple-icon-180.png",
    "manifest-icon-192.maskable.png",
    "manifest-icon-512.maskable.png",
  ],
  manifest: {
    name: "Let's Stream V2.0",
    short_name: "Let's Stream",
    description: "Watch movies and TV shows online",
    theme_color: "#3b82f6",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f0f",
  },
});
```

### Service Worker Features

- Cache management
- API request caching
- Offline content serving
- Push notification handling
- Background sync

## Installation Flow

### Install Prompt

```typescript
// Example: PWA install prompt component
const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setShowPrompt(true);
    });
  }, []);

  return showPrompt ? (
    <div className="pwa-prompt">
      <h3>Install App</h3>
      <p>Install Let's Stream for a better experience!</p>
      <button onClick={handleInstall}>Install</button>
    </div>
  ) : null;
};
```

## Caching Strategy

### Network-First Strategy

- Used for dynamic content
- Fallback to cache
- Regular cache updates
- Configurable timeouts

### Cache-First Strategy

- Static assets
- Images and icons
- CSS and JavaScript
- Fonts and media

## Offline Support

### Content Availability

- Cached media metadata
- User preferences
- Watch history
- UI components

### Offline Detection

```typescript
// Example: Offline status hook
const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
};
```

## Push Notifications

### Configuration

1. Generate VAPID keys
2. Configure Firebase Cloud Messaging
3. Request user permission
4. Handle push events

### Implementation

```typescript
// Example: Push notification registration
const registerPushNotifications = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getMessagingToken();
      await saveUserToken(token);
    }
  } catch (error) {
    console.error("Error registering push notifications:", error);
  }
};
```

## Background Sync

### Sync Registration

```typescript
// Example: Register background sync
const registerSync = async () => {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register("syncUserData");
    } catch (error) {
      console.error("Background sync failed:", error);
    }
  }
};
```

### Sync Events

- Watch history sync
- User preferences sync
- Offline actions queue
- Failed request retry

## PWA Best Practices

### Performance

1. **Lazy Loading**
   - Route-based code splitting
   - Image lazy loading
   - Component lazy loading

2. **Asset Optimization**
   - Image compression
   - Font subsetting
   - CSS optimization

### Security

1. **Data Protection**
   - Secure storage
   - Token management
   - offline data encryption

2. **Update Management**
   - Version control
   - Cache invalidation
   - Update notification

## Testing

### PWA Checklist

- [ ] Manifest validation
- [ ] Service worker registration
- [ ] Offline functionality
- [ ] Install prompt
- [ ] Push notifications
- [ ] Background sync

### Testing Tools

1. **Lighthouse**
   - PWA score
   - Performance metrics
   - Best practices

2. **Chrome DevTools**
   - Application tab
   - Service worker debugging
   - Cache inspection

## Troubleshooting

### Common Issues

1. **Service Worker**
   - Registration failures
   - Update issues
   - Cache problems

2. **Installation**
   - Prompt not showing
   - Installation failures
   - Update issues

3. **Offline Mode**
   - Cache misses
   - Sync failures
   - Data persistence issues

### Debug Tools

```typescript
// Example: Service worker debugging
if (process.env.NODE_ENV === "development") {
  window.addEventListener("sw-state-change", e => {
    console.log("Service Worker state:", e.detail);
  });

  navigator.serviceWorker.addEventListener("message", event => {
    console.log("Message from Service Worker:", event.data);
  });
}
```

## Resources

### Documentation

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Tools

- Lighthouse
- Chrome DevTools
- PWA Builder
- Firebase Console
