# Notifications System

This page documents the Notifications System in Let's Stream V2.0, providing details on its features, technical implementation, usage, configuration, and best practices.

---

## Overview

The notification system informs authenticated users about new features, updates, and important information. It uses a toast notification pattern and integrates with authentication for personalized, version-aware notifications.

## Features

- Feature announcement notifications for authenticated users
- Version-based notification tracking
- User-controlled notification preferences
- Persistent storage of viewed notifications and preferences
- Support for rich content (links, images)
- Automatic re-checking when tab becomes visible
- Customizable notification duration
- Support for follow-up notifications
- Accessibility-friendly implementation

## Technical Implementation

### Core Components

1. **Feature Notifications API** (`src/api/feature-notifications.ts`)

   ```typescript
   interface FeatureNotification {
     id: string;
     title: string;
     description: string;
     version: string;
     date: string;
     details?: {
       link?: string;
       imageUrl?: string;
       category?: string;
     };
   }
   ```

2. **Notification Hook** (`src/hooks/use-feature-notifications.ts`)
   - Manages notification state and display logic
   - Handles version comparison and user acknowledgment
   - Integrates with authentication context

### Usage

#### Basic Implementation

```typescript
import { useFeatureNotifications } from '@/hooks/use-feature-notifications';

function App() {
  useFeatureNotifications();
  return <YourApp />;
}
```

#### Adding New Feature Notifications

1. Update the `feature-notifications.ts` file:
   ```typescript
   const notifications: FeatureNotification[] = [
     {
       id: "feature-2023-1",
       title: "🎥 New Feature",
       description: "Feature description",
       version: "1.0.1",
       date: "2023-12-01",
       details: {
         link: "/feature-page",
         category: "feature-category",
       },
     },
   ];
   ```
2. Update the `currentVersion` to match your deployment:
   ```typescript
   return {
     notifications,
     currentVersion: "1.0.1",
   };
   ```

### Version Management

- Versions follow semantic versioning (MAJOR.MINOR.PATCH)
- Users see notifications for versions newer than their last acknowledged version
- Version history is stored per user in localStorage
- Version checks occur on:
  - Initial page load
  - Tab focus
  - After authentication

### Configuration Options

#### Notification Duration

- Default: 10 seconds for main notifications
- Follow-up notifications: 8 seconds
- Can be customized per notification

#### Storage

- Version history stored in `localStorage`
  - Key format: `lastSeenFeature-${userId}`
- Notification preferences stored in Firestore
  - Collection: `user_preferences`
  - Field: `isNotificationsEnabled`
  - Default value: `true`

### User Preferences

- Users can control notification visibility from their profile settings
- Toggle located in Profile → Settings section
- Changes take effect immediately
- Preferences persist across sessions
- Default enabled for new users
- Does not affect critical system notifications

### Best Practices

1. **Content Guidelines**
   - Keep titles short and descriptive
   - Use emojis for visual hierarchy
   - Include clear call-to-action in descriptions
   - Provide relevant links for detailed information
2. **Version Management**
   - Increment versions for significant changes
   - Group related features under the same version
   - Document version changes in changelog
3. **User Experience**
   - Limit concurrent notifications
   - Space out follow-up notifications
   - Provide clear dismissal options
   - Ensure notifications are not disruptive

### Production Implementation

For production, replace static notifications with a backend API:

```typescript
export async function fetchFeatureNotifications(): Promise<FeatureNotificationResponse> {
  const response = await fetch("/api/feature-notifications");
  return response.json();
}
```

You can source notifications from:

- Backend database
- CMS
- GitHub releases API
- Feature flag system

---

## Testing

### Basic Notification Flow

1. Ensure you're authenticated
2. Increment the version number in `feature-notifications.ts`
3. Clear localStorage or use a new user account
4. Refresh the application

### Testing Notification Preferences

1. Navigate to Profile → Settings
2. Locate the "Feature Notifications" toggle
3. Test the following scenarios:
   - Toggle notifications off: No new feature notifications should appear
   - Toggle notifications on: Feature notifications should resume
   - Close and reopen browser: Preference should persist
   - Log in on different device: Preference should sync
4. Verify that the preference is saved in Firestore
   ```typescript
   // Check preference in Firestore
   const userPreferencesRef = doc(db, "user_preferences", userId);
   const userPreferencesDoc = await getDoc(userPreferencesRef);
   console.log(userPreferencesDoc.data().isNotificationsEnabled);
   ```

## Troubleshooting

**Notifications not showing:**

- Check authentication status
- Verify version numbers
- Check localStorage for existing acknowledgments

**Duplicate notifications:**

- Ensure unique notification IDs
- Check version comparison logic

**Missing follow-up notifications:**

- Verify timing configuration
- Check details object structure

## Future Improvements

- [ ] Add support for notification categories
- [ ] Implement notification priority levels
- [ ] Add notification analytics
- [ ] Support for rich media content
- [x] Add notification preferences
- [ ] Implement offline support
- [ ] Add notification history view
- [ ] Add notification scheduling
- [ ] Support for user-defined notification duration
- [ ] Add notification sound options
- [ ] Implement notification grouping
