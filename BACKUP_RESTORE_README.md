# Backup & Restore System

This document describes the JSON-based backup and restore system for user data in the LetsStream application.

## Overview

The backup and restore system allows users to create JSON backups of their watch history, favorites, and watchlist data, and restore this data when needed. This is useful for:

- Data migration between devices
- Data recovery after account issues
- Archiving user data
- Transferring data between different installations

## Features

- **Complete Data Backup**: Backs up all user watch history, favorites, and watchlist items
- **JSON Format**: Human-readable and portable backup files
- **Data Validation**: Validates backup files before restore operations
- **User Authentication**: Ensures users can only backup/restore their own data
- **Error Handling**: Comprehensive error handling and user feedback
- **Progress Tracking**: Shows progress during backup and restore operations
- **Error Boundaries**: React error boundaries for graceful error handling
- **Retry Mechanisms**: Automatic retry with exponential backoff for failed operations
- **File Size Limits**: 50MB maximum file size with validation
- **Analytics Tracking**: Comprehensive analytics for backup/restore events
- **Accessibility**: Full keyboard navigation and screen reader support
- **Confirmation Dialogs**: Safe confirmation dialogs for destructive operations
- **Network Resilience**: Handles offline scenarios and network interruptions
- **Timeout Protection**: Prevents hanging operations with configurable timeouts

## Data Structure

### Backup File Format

```json
{
  "version": "1.0",
  "user_id": "firebase-user-id",
  "backup_date": "2025-09-07T20:50:00.000Z",
  "data": {
    "watchHistory": [
      {
        "id": "unique-item-id",
        "user_id": "firebase-user-id",
        "media_id": 12345,
        "media_type": "movie",
        "title": "Movie Title",
        "poster_path": "/path/to/poster.jpg",
        "backdrop_path": "/path/to/backdrop.jpg",
        "overview": "Movie description...",
        "rating": 8.5,
        "watch_position": 1200,
        "duration": 5400,
        "created_at": "2025-09-07T20:45:00.000Z",
        "preferred_source": "vidlink"
      }
    ],
    "favorites": [
      {
        "id": "unique-item-id",
        "user_id": "firebase-user-id",
        "media_id": 12345,
        "media_type": "movie",
        "title": "Movie Title",
        "poster_path": "/path/to/poster.jpg",
        "backdrop_path": "/path/to/backdrop.jpg",
        "overview": "Movie description...",
        "rating": 8.5,
        "added_at": "2025-09-07T20:40:00.000Z"
      }
    ],
    "watchlist": [
      {
        "id": "unique-item-id",
        "user_id": "firebase-user-id",
        "media_id": 12345,
        "media_type": "movie",
        "title": "Movie Title",
        "poster_path": "/path/to/poster.jpg",
        "backdrop_path": "/path/to/backdrop.jpg",
        "overview": "Movie description...",
        "rating": 8.5,
        "added_at": "2025-09-07T20:35:00.000Z"
      }
    ]
  }
}
```

## Usage

### Accessing the Backup System

1. Log in to your LetsStream account
2. Navigate to your Profile page
3. Click on the "Backup & Restore" tab

### Creating a Backup

1. In the Backup & Restore tab, click "Create & Download Backup"
2. The system will fetch all your data from Firestore
3. A JSON file will be automatically downloaded to your device
4. **Customize Filename (Optional)**: You can enter a custom filename or choose from suggested options
5. Default filename format: `letsstream-backup-{user_id}-{date}.json`

#### Filename Suggestions

The system provides several filename suggestions based on your data:

- **Basic**: `LetsStream_Backup_{username}_{date}.json`
- **Descriptive**: `LetsStream_{username}_WatchHistory_{count}_items_{date}.json`
- **Date-focused**: `LetsStream_Backup_{date}_{time}.json`
- **User-friendly**: `My_LetsStream_Data_{date}.json`
- **Technical**: `letsstream_backup_v1.0_{user_id}_{datetime}.json`

**Examples:**

- `MyWatchData_john_2025-09-07.json`
- `LetsStream_john_WatchHistory_25_items_2025-09-07.json`
- `Backup_john_30_items_2025-09-07.json`
- `Personal_Watchlist_Backup_john.json`

### Restoring from Backup

1. In the Backup & Restore tab, click "Select Backup File"
2. Choose a previously created backup JSON file
3. The system will validate the file structure
4. If valid, click "Restore Backup" to import the data
5. The data will be merged with your existing data in Firestore

### Clearing Data

The system also provides a "Clear All Data" option in the Danger Zone section, which removes all watch history, favorites, and watchlist items from your account.

## Technical Implementation

### Files

- `src/utils/services/backup-restore.ts` - Core backup/restore service functions
- `src/components/BackupRestore.tsx` - React component for the UI
- `src/components/BackupRestoreErrorBoundary.tsx` - Error boundary for graceful error handling
- `src/pages/Profile.tsx` - Profile page with integrated backup tab

### Production-Ready Features

#### Error Handling & Resilience

- **React Error Boundaries**: Catches and handles component-level errors gracefully
- **Retry Mechanisms**: Automatic retry with exponential backoff (up to 3 attempts)
- **Timeout Protection**: 30-second timeouts for all Firestore operations
- **Network Resilience**: Handles offline scenarios and connection interruptions
- **Graceful Degradation**: Continues functioning even when some operations fail

#### Security & Validation

- **File Size Limits**: 50MB maximum with validation
- **File Type Validation**: Strict JSON file type checking
- **Content Validation**: Comprehensive backup data structure validation
- **User Authentication**: Firebase authentication required for all operations
- **Data Isolation**: Users can only access their own data

#### Performance & UX

- **Loading States**: Visual feedback during all operations
- **Progress Indicators**: Real-time progress tracking for long operations
- **Optimistic Updates**: Immediate UI updates with background sync
- **Batch Operations**: Efficient Firestore batch writes (up to 500 items)
- **Memory Management**: Proper cleanup and resource management

#### Analytics & Monitoring

- **Event Tracking**: Comprehensive analytics for all backup/restore operations
- **Error Reporting**: Detailed error logging with context
- **Performance Metrics**: Operation timing and success rates
- **User Behavior**: Tracks user interactions and preferences

#### Accessibility & UX

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Confirmation Dialogs**: Safe confirmation for destructive operations
- **Clear Messaging**: User-friendly error messages and instructions
- **Responsive Design**: Works on all device sizes

### Key Functions

#### Backup Service (`backup-restore.ts`)

- `createBackup(userId: string)` - Creates a complete backup of user data
- `downloadBackup(backupData)` - Downloads backup data as JSON file
- `parseBackupFile(file)` - Parses uploaded backup file
- `restoreBackup(backupData, targetUserId)` - Restores data to Firestore
- `validateBackupData(data)` - Validates backup file structure
- `clearUserData(userId)` - Removes all user data from Firestore

#### UI Component (`BackupRestore.tsx`)

- File upload handling
- Progress indicators
- Error and success messaging
- Validation feedback
- User authentication checks

### Security Considerations

- All operations require user authentication
- Users can only backup/restore their own data
- Backup files contain user-specific data but no sensitive information
- File validation prevents malicious uploads
- Firestore security rules ensure data isolation

### Error Handling

The system includes comprehensive error handling for:

- Network connectivity issues
- Invalid file formats
- Firestore operation failures
- Authentication errors
- Data validation failures

### Rate Limiting

The system respects existing rate limiting in the application:

- Uses the same rate limiters as the main application
- Queues operations when rate limits are exceeded
- Provides user feedback during rate-limited operations

## API Reference

### BackupData Interface

```typescript
interface BackupData {
  version: string;
  user_id: string;
  backup_date: string;
  data: {
    watchHistory: WatchHistoryItem[];
    favorites: FavoriteItem[];
    watchlist: WatchlistItem[];
  };
}
```

### RestoreResult Interface

```typescript
interface RestoreResult {
  success: boolean;
  message: string;
  stats: {
    watchHistory: { added: number; updated: number; errors: number };
    favorites: { added: number; updated: number; errors: number };
    watchlist: { added: number; updated: number; errors: number };
  };
}
```

### ValidationResult Interface

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

## Troubleshooting

### Common Issues

1. **"Authentication required" error**
   - Ensure you are logged in to your LetsStream account
   - Try refreshing the page and logging in again

2. **"Invalid backup file" error**
   - Ensure the file is a valid JSON file created by this system
   - Check that the file wasn't corrupted during download/upload

3. **"Rate limit exceeded" error**
   - Wait a few minutes before trying again
   - The system will automatically retry queued operations

4. **Large backup files fail to upload**
   - Try splitting large backups into smaller files
   - Check your internet connection stability

### File Size Considerations

- Typical backup files are small (few KB to few MB)
- Large watch histories may create larger files
- Consider browser upload limits for very large files

## Future Enhancements

Potential improvements for the backup system:

- **Selective Backup**: Allow users to choose which data to backup
- **Scheduled Backups**: Automatic periodic backups
- **Cloud Storage**: Store backups in cloud storage services
- **Encryption**: Encrypt sensitive data in backup files
- **Compression**: Compress backup files for smaller size
- **Version Compatibility**: Handle backups from different app versions

## Support

If you encounter issues with the backup and restore system:

1. Check this documentation for common solutions
2. Ensure your app is updated to the latest version
3. Contact support with specific error messages
4. Include backup file details when reporting issues (without sharing actual data)
