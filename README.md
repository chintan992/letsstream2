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

## Tech Stack

- **Frontend**:
  - React 18.x
  - TypeScript
  - Vite
  - TailwindCSS
  - Radix UI Components
  - Framer Motion
  - React Query

- **Backend & Services**:
  - Firebase (Authentication, Firestore)
  - Supabase

- **Development & Build Tools**:
  - ESLint
  - PostCSS
  - TypeScript
  - Vite PWA Plugin

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (required for Vite 7)
- npm or yarn
- Firebase account and project
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.example.env` and fill in your Firebase credentials:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

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
   - Node.js version: `18.x`
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
- User signup/login with Firebase
- Protected routes for authenticated users
- User profile management

### Content Streaming
- Multiple streaming sources support
- HD quality indicators
- Continuous playback
- Watch history tracking

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is for educational demonstration purposes.

## Privacy Policy

See [Privacy Policy](./src/pages/PrivacyPolicy.tsx) for details about data collection and usage.
