# Backend Setup Guide

This guide covers how to set up the backend infrastructure for Let's Stream V2.0.

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name and follow setup wizard
4. Enable Google Analytics (recommended)

### 2. Set Up Authentication

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable the following providers:
   - Email/Password
   - Google Sign-in
3. Configure OAuth consent screen if required

### 3. Configure Firestore

1. Go to Firestore Database
2. Create database in your preferred region
3. Start in production mode
4. Apply the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User preferences
    match /userPreferences/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Watch history
    match /watchHistory/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }

    // Favorites
    match /favorites/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }

    // Watchlist
    match /watchlist/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Get Configuration Keys

1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Click web platform (\u003c/\u003e)
4. Register app and get configuration
5. Copy configuration values to your `.env` file:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

## Collection Structure

### userPreferences Collection

```javascript
{
  user_id: string,
  isWatchHistoryEnabled: boolean,
  accentColor: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### watchHistory Collection

```javascript
{
  user_id: string,
  media_id: string,
  media_type: 'movie' | 'tv',
  title: string,
  poster_path: string,
  watched_at: timestamp,
  progress: number // Playback progress in seconds
}
```

### favorites Collection

```javascript
{
  user_id: string,
  media_id: string,
  media_type: 'movie' | 'tv',
  title: string,
  poster_path: string,
  added_at: timestamp
}
```

### watchlist Collection

```javascript
{
  user_id: string,
  media_id: string,
  media_type: 'movie' | 'tv',
  title: string,
  poster_path: string,
  added_at: timestamp
}
```

## Rate Limiting

The project includes built-in rate limiting for API calls. Configure the limits in:

- `src/utils/firestore-rate-limiter.ts`
- `src/utils/rate-limiter.ts`

## Error Handling

Implement error tracking:

1. Set up Firebase Crashlytics
2. Configure error boundaries in React
3. Monitor Firestore quota usage
4. Set up alerts for authentication issues

## Security Best Practices

1. **Authentication**
   - Enable email verification
   - Set password requirements
   - Configure OAuth properly

2. **Firestore**
   - Use security rules
   - Implement data validation
   - Set up backups

3. **General**
   - Enable Firebase App Check
   - Configure CORS policies
   - Set up proper authentication domains
