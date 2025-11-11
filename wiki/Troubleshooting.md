# Troubleshooting Guide

This guide helps you diagnose and fix common issues in Let's Stream V2.0.

## Common Issues

### Build Problems

#### 1. TypeScript Errors

```
Error: Cannot find module '@/components' or its corresponding type declarations.
```

**Solution:**

1. Check path aliases in `tsconfig.json`
2. Verify file exists in correct location
3. Run `npm install` to update dependencies
4. Clear TypeScript cache: `rm -rf node_modules/.cache`

#### 2. Vite Build Failures

```
Error: Failed to resolve import "xyz" from "src/App.tsx"
```

**Solution:**

1. Clear Vite cache:

   ```bash
   rm -rf node_modules/.vite
   ```

2. Verify import path
3. Check file extensions
4. Update Vite config if needed

### Authentication Issues

#### 1. Firebase Auth Errors

```typescript
// Common error: Invalid API key
FirebaseError: Invalid API key provided
```

**Solution:**

1. Verify environment variables
2. Check Firebase console configuration
3. Ensure authorized domains are set
4. Clear browser cache and cookies

#### 2. OAuth Problems

```
Error: redirect_uri_mismatch
```

**Solution:**

1. Add domain to authorized redirect URIs
2. Check Google Cloud Console settings
3. Verify OAuth consent screen
4. Update Firebase authentication settings

### PWA Features

#### 1. Service Worker Not Registering

```javascript
// Service worker registration failed
Error: Registration failed - Service worker not found
```

**Solution:**

1. Check service worker path
2. Verify HTTPS or localhost
3. Clear browser cache
4. Check browser console for errors

#### 2. Offline Mode Issues

```typescript
// Cache storage problems
Error: QuotaExceededError;
```

**Solution:**

1. Clear site data
2. Adjust cache size limits
3. Review caching strategy
4. Check storage quota

### Performance Issues

#### 1. Slow Initial Load

**Symptoms:**

- Long First Contentful Paint
- Poor Lighthouse score
- High bundle size

**Solution:**

1. Enable code splitting:

```typescript
// Add dynamic imports
const Component = lazy(() => import("./Component"));
```

2. Optimize images:
   - Use WebP format
   - Implement lazy loading
   - Set proper dimensions

3. Review bundle size:

   ```bash
   npm run build -- --report
   ```

#### 2. Memory Leaks

**Symptoms:**

- Growing memory usage
- Browser tab crashes
- Performance degradation

**Solution:**

1. Clean up event listeners
2. Cancel async operations
3. Clear intervals/timeouts
4. Use proper cleanup in useEffect

### API Issues

#### 1. Rate Limiting

```typescript
// Rate limit exceeded
Error: Too many requests
```

**Solution:**

1. Implement request queuing:

```typescript
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  timeWindow: 60000,
});
```

2. Add retry logic:

```typescript
const fetchWithRetry = async (url, options, retries = 3) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
```

#### 2. CORS Issues

```
Access to fetch at 'URL' has been blocked by CORS policy
```

**Solution:**

1. Add proper CORS headers
2. Use proxy in development
3. Update API configuration
4. Check server settings

### State Management

#### 1. Context Updates Not Reflecting

**Symptoms:**

- UI not updating
- Stale data
- Inconsistent state

**Solution:**

1. Verify context provider wrapper
2. Check dependency arrays
3. Use proper state updates
4. Implement proper memoization

#### 2. React Query Cache Issues

```typescript
// Stale data in cache
const { data } = useQuery(["key"], fetcher, {
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 30, // 30 minutes
});
```

**Solution:**

1. Adjust cache settings
2. Manual cache invalidation
3. Force refetch when needed
4. Clear query cache

## Debugging Tools

### 1. Chrome DevTools

- Network tab for API calls
- Application tab for PWA/storage
- Performance tab for metrics
- Sources tab for debugging

### 2. React DevTools

- Components tab for hierarchy
- Profiler for performance
- Props/state inspection
- Context viewing

### 3. Firebase Console

- Authentication status
- Database operations
- Analytics data
- Error reporting

### 4. Logging Utilities

```typescript
// Enhanced logging
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // Add error reporting service here
  },
};
```

## Error Boundaries

### Implementation

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Error boundary caught error:', error);
    // Report to error service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Usage

```typescript
<ErrorBoundary>
  <Route path="/media/:id" component={MediaPlayer} />
</ErrorBoundary>
```

## Testing Issues

### 1. Failed Tests

**Problem:** Tests failing after changes

**Solution:**

1. Update test snapshots:

   ```bash
   npm test -- -u
   ```

2. Check test environment
3. Update mock data
4. Verify test coverage

### 2. Integration Test Failures

**Problem:** E2E tests failing

**Solution:**

1. Check test environment
2. Update test data
3. Verify API mocks
4. Check browser compatibility

## Production Issues

### 1. Deployment Failures

**Problem:** Build fails in production

**Solution:**

1. Check environment variables
2. Verify build configuration
3. Test in production mode locally
4. Review deployment logs

### 2. Runtime Errors

**Problem:** Errors in production environment

**Solution:**

1. Enable source maps
2. Implement error tracking
3. Add logging service
4. Monitor performance metrics

## Support Resources

### Documentation

- React documentation
- Firebase guides
- Vite documentation
- TailwindCSS docs

### Community

- GitHub issues
- Stack Overflow
- Discord server
- Developer forums

### Tools

- Browser DevTools
- React DevTools
- Firebase Console
- VS Code debugger
