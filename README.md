# Let's Stream V2.0

A modern streaming platform built with React, TypeScript, and Firebase, featuring movies, TV shows, and sports content with PWA support.
[![CodeQL](https://github.com/chintan992/letsstream2/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/chintan992/letsstream2/actions/workflows/github-code-scanning/codeql)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/chintan992/letsstream2)

[[Deploy to Cloudflare Pages]](https://dash.cloudflare.com/pages/new?from=workers)

## Features

- 🎬 Stream movies and TV shows
- ⚽ Live sports streaming
- 🎯 Personalized watch history and recommendations
- 🔍 Advanced search functionality
- 📱 Progressive Web App (PWA) support
- 🌙 User preferences with customizable accent colours
- 🔐 Firebase authentication and real-time data
- 📺 Multi-source streaming support
- 📱 Responsive design for all devices
- 🔄 Advanced scroll restoration that remembers your position on every page

## Tech Stack

- **Frontend**:
  - React 18.x
  - TypeScript 5.9.x
  - Vite 7.x
  - TailwindCSS 4.x
  - Radix UI Components
  - Framer Motion
  - React Query (installed but not used)

- **Backend & Services**:
  - Firebase 12.x (Authentication, Firestore, Analytics)
  - Supabase (not currently used - only localStorage utilities in codebase)

_Note: Several dependencies are installed but unused and should be removed in a future cleanup: @supabase/supabase-js, @tanstack/react-query, axios, date-fns, next-themes, web-vitals, @google/generative-ai, @google/genai_

- **Development & Build Tools**:
  - ESLint 9.x
  - PostCSS
  - TypeScript
  - Vite PWA Plugin

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (required for Vite 7 and Firebase 12) - Check with `node --version`
- npm or yarn
- Firebase account and project
- Supabase account and project (not currently used in codebase)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example` and fill in your Firebase credentials:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

_Note: These values come from Firebase Console > Project Settings > General_

### Development

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

> **Note**: Ensure you're using Node.js 20.19+ or 22.12+. Check with `node --version`

### Verification

Run all verification checks before committing:

```bash
npm run verify
```

This runs TypeScript type checking, linting, and production build.

Run individual checks:

```bash
# Type checking
npm run tsc

# Linting
npm run lint

# Format the entire codebase
npm run format

# Check if codebase is formatted correctly
npm run format:check

# Production build
npm run build

# Test coverage (placeholder - No test framework configured)
npm run test:coverage
```

> **Note:** The `test:coverage` script is a temporary placeholder. The project currently does not have a test framework (such as Vitest) configured. This will be added in future updates.

### Testing

Currently, there are no automated tests in the codebase. However, the CI workflow includes runtime error checking using Playwright to catch any JavaScript runtime errors during page load.

For comprehensive testing, manual testing should be performed using the TESTING_CHECKLIST.md file after major updates.

Future improvements should include adding Vitest for unit testing and React Testing Library for component testing.

### Deployment

#### Deploy on Netlify

1. Click the "Deploy to Netlify" button above
2. Connect your GitHub repository
3. Configure your environment variables in Netlify's dashboard
4. Your site will be automatically deployed

#### Deploy on Cloudflare Pages

1. Click the "Deploy to Cloudflare Pages" button above
2. Connect your GitHub repository
3. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: `20.x` (or `20.19+`)
4. Add your environment variables in the Pages settings
5. Your site will be automatically deployed

## Project Structure

- `/src` - Main application source code
  - `/components` - Reusable React components
  - `/contexts` - React context providers
  - `/hooks` - Custom React hooks
  - `/lib` - Utility libraries and configurations
  - `/pages` - Application pages/routes
  - `/utils` - Helper functions and type definitions

## Features in Detail

### Authentication

- User signup/login with Firebase Authentication
- Protected routes for authenticated users
- User profile management

### Content Streaming

- Multiple streaming sources support
- HD quality indicators
- Continuous playback
- Watch history tracking

### Backend Services

- **Firebase Authentication**: User management and authentication
- **Cloud Firestore**: Data persistence for watch history, favorites, and watchlist
- **Firebase Analytics**: Usage tracking and analytics
- **Supabase**: Not currently used (only localStorage utilities exist in the codebase - see `src/utils/supabase.ts`)

### Sports Streaming

- Live sports events
- Multiple stream qualities
- Real-time updates
- Sports categories and filtering

### PWA Features

- Offline support
- Install prompt
- Service worker caching
- Push notifications (planned)

### User Preferences

- Custom accent colors
- Watch history
- Favorites list
- Watch later list

## Known Issues

Several dependencies were manually updated beyond the recommended versions in the migration guide:

- React Router v7 (recommended v6) - potential breaking changes with import paths and future flags
- recharts v3 (recommended v2) - potential breaking changes with tooltip typing and component props
- react-day-picker v9 (recommended v8) - potential breaking changes with controlled props and class names
- Zod v4 (not used in codebase) - no impact as no schemas exist

These manual updates may introduce compatibility issues that require additional testing.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is for educational demonstration purposes.

## Privacy Policy

## Scroll Restoration

This app features advanced scroll restoration that remembers your position on every page, providing a native app-like experience.

### Features

- **Window Scroll**: Automatically saves and restores vertical scroll position on all pages
- **Tab-Specific**: Each tab on a page (e.g., "Popular" vs "Top Rated") maintains its own scroll position
- **Horizontal Scroll**: Content rows remember horizontal scroll position
- **State Persistence**: Pagination progress, filters, and accumulated data are preserved
- **Browser Navigation**: Works seamlessly with browser back/forward buttons

### Configuration

Scroll restoration is controlled by the `VITE_SCROLL_RESTORATION_MANUAL` environment variable in `.env`:

```bash
VITE_SCROLL_RESTORATION_MANUAL=true  # Enable custom scroll restoration
VITE_SCROLL_RESTORATION_MANUAL=false # Use browser default (not recommended)
```

### Documentation

For detailed information, see:

- [Architecture Documentation](./docs/SCROLL_RESTORATION_ARCHITECTURE.md)
- [Testing Guide](./docs/SCROLL_RESTORATION_TESTING_GUIDE.md)
- [Troubleshooting](./docs/SCROLL_RESTORATION_TROUBLESHOOTING.md)
- [User Guide](./docs/SCROLL_RESTORATION_USER_GUIDE.md)

### Testing

Run scroll restoration tests:

```bash
npm run test:scroll-restoration
```

See [Privacy Policy](./src/pages/PrivacyPolicy.tsx) for details about data collection and usage.
