# Contributing Guide

Thank you for your interest in contributing to Let's Stream V2.0! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please follow these guidelines:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the Repository**
   - Click the "Fork" button on GitHub
   - Clone your fork locally:
     ```bash
     git clone https://github.com/chintan992/letsstream2.git
     cd lets-stream-v2.0
     ```

2. **Set Up Development Environment**
   - Install dependencies:
     ```bash
     npm install
     ```
   - Set up environment variables:
     ```bash
     cp .example.env .env
     ```
   - Fill in the required environment variables

3. **Create a Branch**
   - For features: `feature/description`
   - For fixes: `fix/description`
   - For docs: `docs/description`
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. **Run Development Server**

   ```bash
   npm run dev
   ```

2. **Code Style**
   - Follow the TypeScript style guide
   - Use ESLint and Prettier with Tailwind CSS plugin configurations
   - Format code before committing:
     ```bash
     npm run format
     ```
   - Run linting before committing:
     ```bash
     npm run lint
     ```

3. **Commit Messages**
   Follow the conventional commits specification:
   - feat: A new feature
   - fix: A bug fix
   - docs: Documentation changes
   - style: Code style changes
   - refactor: Code refactoring
   - test: Adding or updating tests
   - chore: Maintenance tasks

   Example:

   ```bash
   git commit -m "feat: add dark mode support"
   ```

## Pull Request Process

1. **Before Submitting**
   - Update documentation
   - Add/update tests
   - Run all tests locally
   - Ensure CI/CD pipeline passes
   - Update changelog if applicable

2. **PR Description**
   - Clear description of changes
   - Link to related issues
   - Screenshots/GIFs for UI changes
   - List of testing steps

3. **Review Process**
   - Address review comments
   - Keep commits atomic
   - Rebase if needed
   - Squash commits when ready

## Style Guide

### TypeScript Guidelines

```typescript
// Use interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions/intersections
type MediaType = "movie" | "tv" | "sport";

// Use functional components
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // ...
};

// Use hooks for state/effects
const [state, setState] = useState<string>("");
useEffect(() => {
  // Side effects here
}, [dependencies]);
```

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // 3.1 Hooks
  const [state, setState] = useState();

  // 3.2 Effects
  useEffect(() => {
    // ...
  }, []);

  // 3.3 Handlers
  const handleClick = () => {
    // ...
  };

  // 3.4 Render
  return (
    // JSX
  );
};

// 4. Export
export default ComponentName;
```

## Testing

1. **Unit Tests**
   - Test individual components
   - Test hooks and utilities
   - Mock external dependencies

2. **Integration Tests**
   - Test component interactions
   - Test data flow
   - Test routing

3. **End-to-End Tests**
   - Test critical user flows
   - Test authentication
   - Test media playback

## Documentation

1. **Code Documentation**
   - Document complex functions
   - Add JSDoc comments
   - Include usage examples

2. **Component Documentation**
   - Document props
   - Add usage examples
   - Include edge cases

3. **Wiki Updates**
   - Update relevant wiki pages
   - Add new features documentation
   - Keep guides up to date
