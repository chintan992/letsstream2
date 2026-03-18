# Project Overview

This is a modern streaming platform built with React, TypeScript, and Firebase. It's a Progressive Web App (PWA) that allows users to stream movies, TV shows, and live sports. The application features personalized watch history, advanced search, customizable user preferences, and offline capabilities.

**Key Technologies:**

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Radix UI
- **Backend & Services:** Firebase (Authentication, Firestore, Analytics)
- **Development & Build Tools:** ESLint, PostCSS, Vite PWA Plugin
- **Deployment:** Cloudflare Pages, Netlify, GitHub Pages

# Building and Running

**Prerequisites:**

- Node.js 20.19+ or 22.12+
- npm or yarn
- Firebase account and project

**Installation:**

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.example` and fill in your Firebase credentials.

**Development:**

Run the development server:

```bash
npm run dev
```

**Building for Production:**

```bash
npm run build
```

**Previewing the Production Build:**

```bash
npm run preview
```

# Development Conventions

- **Linting:** The project uses ESLint for code quality. Run `npm run lint` to check for linting errors.
- **Type Checking:** TypeScript is used for static type checking. Run `npm run tsc` to check for type errors.
- **Verification:** A verification script is available to run all checks before committing:
  ```bash
  npm run verify
  ```
- **Testing:** The project uses Playwright for runtime error checking in the CI/CD pipeline.
- **Code Style:** The project uses Prettier with the Tailwind CSS plugin for consistent code formatting across the codebase. Run `npm run format` to auto-format.

# Software Development Life Cycle (SDLC)

The project follows an agile development process. The `verify` script acts as a pre-commit or pre-push hook to ensure code quality. The CI/CD pipeline configured via `.github/workflows` automates runtime error checks, PR checks, and deployments.

# Deployment

The application is structured to easily deploy across various platforms:
- **Cloudflare Pages:** Configuration managed in `wrangler.toml`, `_routes.json`, and documented in `docs/cloudflare-pages-guide.md`.
- **Netlify:** Configuration managed in `netlify.toml`.
- **GitHub Pages:** Automated through GitHub actions (`.github/workflows/deploy-gh-pages.yml`).

# User Flow

The application routing starts at the `Index` landing page. Users can navigate across sections such as `Movies`, `TVShows`, `Sports`, `Search`, and `Trending`. A `ProtectedRoute` component ensures authenticated-only access for sections like `Profile`, `WatchHistory`, and the `BackupRestore` functionality.

# Core Features

## Data Backup and Restore
Users can securely backup and restore their data (such as watch history and preferences) directly from the application UI (`src/components/BackupRestore.tsx`, `BACKUP_RESTORE_README.md`).

## Scroll Restoration
Custom architecture ensures that a user's scroll position is restored effectively when navigating back and forth across different pages. See `docs/SCROLL_RESTORATION_ARCHITECTURE.md` for more.

## Progressive Web App (PWA) and Offline Support
Configured via `vite-plugin-pwa`, the application operates with a service worker to provide an offline fallback (`public/offline.html`), caching, and a native app-like experience complete with a `PWAInstallPrompt` component. Offline events are managed dynamically (e.g., `analytics-offline.ts`).

## Multi-theme and Customization
The application supports Light, Dark, and System themes, along with an accent color customization option (`AccentColorPicker.tsx`), managed using `next-themes` and a custom Context.

## Haptic Feedback
Optimized for mobile interfaces, the application implements distinct vibration feedback patterns for various UI interactions (`DOCS/HAPTIC_FEEDBACK_GUIDE.md`).

## User Activity Tracking
It uses Firebase Analytics to record key interactions, such as page views, media progression, preferences, and engagements (`src/components/AnalyticsWrapper.tsx`, `src/lib/analytics.ts`).

# UI/UX and Design System

The `src/components/ui` directory contains the foundational design components using Radix UI for accessibility and Framer Motion for smooth transitions. Tools like `class-variance-authority` simplify building consistent and flexible variants (e.g., buttons and cards). 

# Error Handling and Logging

Robust error boundaries (e.g., `ServiceWorkerErrorBoundary`, `BackupRestoreErrorBoundary`) catch UI thread crashes and log errors cleanly to Firebase. Authentication errors are mapped to user-friendly messages (`auth-errors.ts`). A dedicated `ServiceWorkerDebugPanel.tsx` exists for real-time monitoring and debugging.

# Authentication

The application uses Firebase Auth for a comprehensive authentication layer. `auth-context.tsx` orchestrates sign in, sign out, sign up, and Google single-sign-on (SSO), complete with secure token refreshes and session management.

# API Interaction

The `src/utils/api.ts` file re-exports all API-related functions from `src/utils/services/`, offering a unified entry point. This decoupled modular design splits the logic by domain (movies, TV shows, search, etc.).

# Chatbot

Powered by `@google/generative-ai` (Gemini API), the app features an integrated chatbot that provides custom media recommendations based on context, processing responses into displayable media objects (`chatbot-utils.ts`, `gemini-api.ts`).

# Performance Monitoring

Performance metrics are captured using the `web-vitals` library and a custom `PerformanceMonitor` class, which dispatches critical load statistics directly to Firebase Analytics for long-term tracking.

# Rate Limiting

The application embeds a custom client-side rate limiter (`src/utils/rate-limiter.ts`) to manage throughput towards external APIs such as TMDb and Gemini API, mitigating abuse and limiting quota consumption.

# TMDb Search

The application seamlessly interacts with the TMDb API via structured queries, defined across `src/utils/tmdb-search.ts`, to search, fetch, and validate up-to-date movies and TV show content.