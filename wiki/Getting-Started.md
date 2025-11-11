# Getting Started

This guide will help you set up Let's Stream V2.0 for development.

## Prerequisites

Before you begin, ensure you have:

- Node.js (LTS version 20.x or higher)
- npm or yarn
- Git
- A code editor (VS Code recommended)
- Firebase account
- Supabase account

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/chintan992/letsstream2.git
cd lets-stream-v2.0
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

1. Copy `.example.env` to `.env`:

```bash
cp .example.env .env
```

2. Fill in the environment variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### 4. Development Server

```bash
npm run dev
```

Access the app at `http://localhost:8080`

## Project Structure

```bash
src/
├── components/     # Reusable React components
├── contexts/       # React context providers
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries
├── pages/         # Application routes
└── utils/         # Helper functions
```

## Key Features

### Authentication

- Email/Password login
- Google authentication
- Protected routes
- User profiles

### Content Management

- Movies and TV shows
- Sports streaming
- Search functionality
- Media playback

### User Features

- Watch history
- Favorites list
- User preferences
- Custom themes

### PWA Support

- Offline functionality
- Install prompt
- Push notifications
- Background sync

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:

- TypeScript
- ESLint
- Prettier
- Conventional Commits

### Component Guidelines

1. **File Structure**

```typescript
// ComponentName.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks";

interface Props {
  // Props definition
}

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Component logic
};

export default ComponentName;
```

2. **Styling**

- TailwindCSS for styling
- CSS modules for component-specific styles
- shadcn/ui components for UI elements

## Firebase Setup

1. **Create Project**
   - Go to Firebase Console
   - Create new project
   - Enable required services

2. **Authentication**
   - Enable Email/Password
   - Configure Google Sign-in
   - Set authorized domains

3. **Firestore**
   - Create database
   - Set up security rules
   - Configure indexes

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing

1. Test authentication flows
2. Verify media playback
3. Check PWA features
4. Test offline functionality

## Common Issues

### Build Errors

- Clear node_modules and reinstall
- Check TypeScript version
- Verify environment variables

### Authentication Issues

- Confirm Firebase configuration
- Check authorized domains
- Verify security rules

### PWA Problems

- Clear service worker
- Update manifest.json
- Check cache storage

## Next Steps

1. **Explore the Codebase**
   - Review components
   - Understand contexts
   - Study utilities

2. **Make Your First Change**
   - Pick an issue
   - Create a branch
   - Submit a PR

3. **Join the Community**
   - Star the repository
   - Report issues
   - Contribute code

## Resources

### Documentation

- [Project Wiki Home](/)
- [API Reference](./API-Reference.md)
- [Contributing Guide](./Contributing-Guide.md)

### External Links

- [React Documentation](https://react.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [TailwindCSS](https://tailwindcss.com/docs)

### Community

- GitHub Issues
- Discord Server
- Stack Overflow

## Development Tips

### Code Organization

- Keep components small and focused
- Use TypeScript strictly
- Follow project conventions
- Write meaningful comments

### Performance

- Implement lazy loading
- Optimize images
- Use proper caching
- Monitor bundle size

### Security

- Validate user input
- Implement rate limiting
- Use security headers
- Keep dependencies updated

## Workflow

### 1. Issue Selection

- Check existing issues
- Create new if needed
- Assign to yourself
- Add labels

### 2. Development

- Create feature branch
- Follow style guide
- Write tests
- Update documentation

### 3. Code Review

- Submit PR
- Request reviews
- Address feedback
- Maintain quality

### 4. Deployment

- Merge to main
- Verify deployment
- Monitor analytics
- Check performance
