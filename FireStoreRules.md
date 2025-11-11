rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// Helper functions from new config
function isAuthenticated() {
return request.auth != null;
}

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Original user-centric rules (old config)
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/watchlist/{document=**} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/history/{document=**} {
      allow read, write: if isOwner(userId);
    }

    // New collection-centric rules (new config)

    // Allow both camelCase and kebab-case for user preferences and notifications
    match /userPreferences/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /user-preferences/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /feature-notifications/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /featureNotifications/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /media-preferences/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /mediaPreferences/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Allow users to read their own feature notifications
    match /feature-notifications/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Allow users to read their own media preferences
    match /media-preferences/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /watchHistory/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }

    match /favorites/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
      match /watchlist/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }    // No more caching in Firestore

    // Default deny for all other paths
    match /{document=**} {
      allow read, write: if false;
    }

}
}
