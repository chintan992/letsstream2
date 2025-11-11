# Project Structure

This document explains the organization and architecture of Let's Stream V2.0.

## Directory Structure

```
├── src/                  # Source code
│   ├── components/       # React components
│   ├── contexts/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── pages/           # Application routes
│   └── utils/           # Helper functions
├── public/              # Static assets
├── functions/           # Firebase functions
├── dev-dist/            # Development build files
└── wiki/                # Project documentation
```

## Core Components

### Application Root

- `src/App.tsx`: Main application component
- `src/main.tsx`: Application entry point
- `src/index.css`: Global styles
- `src/vite-env.d.ts`: TypeScript declarations

### Components Directory

```
components/
├── ui/                 # Shared UI components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── AccentColorPicker.tsx
├── ContentRow.tsx
├── Footer.tsx
├── Hero.tsx
├── MediaCard.tsx
├── Navbar.tsx
└── ...
```

### Context Providers

```
contexts/
├── auth.ts            # Authentication context
├── user-preferences.tsx
├── watch-history.tsx
└── types/             # TypeScript definitions
```

### Custom Hooks

```
hooks/
├── auth-context.tsx
├── use-auth.tsx
├── use-mobile.tsx
├── use-toast.ts
├── use-user-preferences.tsx
└── use-watch-history.tsx
```

### Pages Directory

```
pages/
├── Index.tsx          # Home page
├── Movies.tsx
├── TVShows.tsx
├── Sports.tsx
├── Profile.tsx
├── Player.tsx
└── ...
```

## Key Architectural Patterns

### Component Architecture

1. **Presentational Components**
   - Focus on UI rendering
   - Receive data via props
   - Minimal state management
   - Located in `components/`

2. **Container Components**
   - Handle data fetching
   - Manage component state
   - Pass data to presentational components
   - Located in `pages/`

### State Management

1. **React Context**
   - Authentication state
   - User preferences
   - Watch history
   - Theme settings

2. **Local State**
   - Form data
   - UI interactions
   - Component-specific state

### Routing Structure

```typescript
// Main routing configuration
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Index />} />
  <Route path="/movies" element={<Movies />} />
  <Route path="/tv" element={<TVShows />} />
  <Route path="/sports" element={<Sports />} />

  {/* Protected Routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/profile" element={<Profile />} />
    <Route path="/watch-history" element={<WatchHistory />} />
  </Route>

  {/* Auth Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />

  {/* Utility Routes */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

## Data Flow

### Authentication Flow

```
Login/Signup → Firebase Auth → Auth Context → Protected Routes
```

### Content Flow

```
API Request → Rate Limiter → Data Fetch → State Update → Render
```

### User Preferences Flow

```
User Action → Context Update → Firestore → UI Update
```

## File Naming Conventions

### Components

- PascalCase for component files
- `.tsx` extension for components
- Corresponding `.test.tsx` for tests

### Utilities

- camelCase for utility files
- `.ts` extension for TypeScript files
- Descriptive, function-focused names

### Styles

- Same name as component
- `.module.css` for CSS modules
- TailwindCSS classes in components

## Module Dependencies

### Core Dependencies

- React & React DOM
- TypeScript
- Vite
- Firebase
- TailwindCSS

### UI Dependencies

- Radix UI components
- Framer Motion
- Lucide icons
- Sonner toasts

### Development Dependencies

- ESLint
- TypeScript ESLint
- Prettier
- PostCSS

## Configuration Files

### TypeScript

- `tsconfig.json`: Base configuration
- `tsconfig.app.json`: App-specific config
- `tsconfig.node.json`: Node-specific config

### Vite

- `vite.config.ts`: Build configuration
- PWA plugin setup
- Path aliases
- Development server settings

### Environment

- `.env`: Environment variables
- `.env.example`: Template
- `.env.development`: Development values
- `.env.production`: Production values

## Performance Optimizations

### Code Splitting

```typescript
// Dynamic imports for routes
const Movies = lazy(() => import("./pages/Movies"));
const TVShows = lazy(() => import("./pages/TVShows"));
```

### Asset Optimization

- Image compression
- Font subsetting
- SVG optimization
- Cache strategies

### Lazy Loading

- Route-based splitting
- Component lazy loading
- Image lazy loading
- Data prefetching

## Testing Structure

### Unit Tests

```
__tests__/
├── components/
├── hooks/
└── utils/
```

### Integration Tests

```
tests/
├── auth/
├── media/
└── user/
```

### E2E Tests

```
cypress/
└── e2e/
```

## Build Output

### Production Build

```
dist/
├── assets/
├── index.html
└── manifest.json
```

### Development Build

```
dev-dist/
├── sw.js
├── workbox-*.js
└── registerSW.js
```

## Documentation

### API Documentation

- Component props
- Hook parameters
- Utility functions
- Type definitions

### Code Comments

```typescript
/**
 * Component description
 * @param {Props} props - Component props
 * @returns {JSX.Element} Rendered component
 */
```

### JSDoc Comments

```typescript
/**
 * Function description
 * @param {string} param1 - Parameter description
 * @returns {Promise<Result>} Return value description
 * @throws {Error} Error description
 */
```

## Security Considerations

### Authentication

- Protected routes
- Token management
- Session handling
- OAuth integration

### Data Protection

- Input validation
- XSS prevention
- CSRF protection
- Rate limiting

### Error Handling

- Global error boundary
- API error handling
- Fallback components
- Error logging
