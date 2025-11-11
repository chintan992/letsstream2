# Project Overview

This is a modern streaming platform built with React, TypeScript, and Firebase. It's a Progressive Web App (PWA) that allows users to stream movies, TV shows, and live sports. The application features personalized watch history, advanced search, and customizable user preferences.

**Key Technologies:**

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Radix UI
- **Backend & Services:** Firebase (Authentication, Firestore, Analytics)
- **Development & Build Tools:** ESLint, PostCSS, Vite PWA Plugin

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
- **Testing:** The project currently lacks a dedicated test framework like Vitest or React Testing Library. However, it uses Playwright for runtime error checking in the CI/CD pipeline.
- **Code Style:** The project uses Prettier with Tailwind CSS plugin for consistent code formatting across the codebase.

# Software Development Life Cycle (SDLC)

The project follows a typical agile development process. The use of a `dev` script in `package.json` suggests a local development environment. The `verify` script, which runs `tsc`, `eslint`, and `build`, indicates a pre-commit or pre-push hook to ensure code quality. The presence of `.github/workflows` suggests a CI/CD pipeline for automated testing and deployment.

# User Flow

The `src/routes.tsx` file defines the application's routes. The user flow starts with the `Index` page, which is the landing page. From there, users can navigate to `Login`, `Signup`, `Movies`, `TVShows`, `Sports`, `Search`, and `Trending` pages. The `ProtectedRoute` component ensures that certain routes, like `Profile` and `WatchHistory`, are only accessible to authenticated users.

# User Activity Tracking

The `src/lib/analytics.ts` file shows that the application uses Firebase Analytics to track user activity. It tracks page views, media views, media completion, media preferences, and media engagement. This data can be used to understand user behavior and improve the application.

# UI/UX and Design System

The `src/components/ui` directory contains a set of reusable UI components that form the project's design system. The `button.tsx` file, for example, uses `class-variance-authority` to create a flexible and consistent button component with different variants and sizes. The use of Radix UI components, as seen in `package.json`, provides a solid foundation for building accessible and customizable UI components. The `src/contexts/theme.tsx` file shows that the application has a theme provider that allows users to switch between light, dark, and system themes.

# Component Dependencies

The project uses a variety of libraries to build its UI and functionality. In addition to React and Firebase, it uses `react-router-dom` for routing, `@tanstack/react-query` for data fetching and caching, `framer-motion` for animations, and `recharts` for charts. The `package.json` file provides a complete list of dependencies.

# Error Handling and Logging

The application has a robust error handling and logging mechanism. The `ServiceWorkerErrorBoundary` component catches and logs errors related to the service worker to the console and Firebase Analytics. The `auth-context.tsx` file has a comprehensive error handling mechanism for authentication-related errors, providing user-friendly messages and suggestions. The `auth-errors.ts` file contains a mapping of Firebase Auth error codes to user-friendly messages.

# Offline Support

The application has offline support for analytics. The `analytics-offline.ts` file implements a queue for storing analytics events when the user is offline and sends them to Firebase Analytics when the user is back online.

# Authentication

The `auth-context.tsx` file provides a detailed implementation of the authentication context. It handles user sign-in, sign-up, sign-out, and sign-in with Google. It also includes a token refresh mechanism to keep the user logged in. It uses `sessionStorage` to store the Firebase token securely.

# API Interaction

The `src/utils/api.ts` file re-exports all the API-related functions from the `src/utils/services` directory. This provides a single entry point for all API interactions. The `src/utils/services` directory contains separate files for different services like movies, TV shows, search, etc. This modular approach makes it easy to manage and maintain the API code.

# Chatbot

The application has a chatbot that provides movie and TV show recommendations. The `src/utils/chatbot-utils.ts` file contains functions for extracting media items from the chatbot's response and creating media objects for displaying in the UI. The `src/utils/gemini-api.ts` file handles the communication with the Gemini API, which powers the chatbot.

# Haptic Feedback

The application provides haptic feedback on mobile devices to enhance the user experience. The `src/utils/haptic-feedback.ts` file contains functions for triggering different haptic feedback patterns, such as success and error patterns.

# Performance Monitoring

The application monitors its performance using the `web-vitals` library and a custom performance monitor. The `src/utils/performance-monitor.ts` file contains a `PerformanceMonitor` class that tracks custom performance metrics and reports them to Firebase Analytics.

# Rate Limiting

The application uses a rate limiter to prevent abuse of the TMDb and Gemini APIs. The `src/utils/rate-limiter.ts` file contains a `RateLimiter` class that limits the number of requests per minute.

# TMDb Search

The application uses the TMDb API to search for movies and TV shows. The `src/utils/tmdb-search.ts` file contains functions for searching and validating TMDb data.
