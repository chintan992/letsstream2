# Deployment Guide

This guide covers different deployment options for Let's Stream V2.0.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
  - [Netlify Deployment](#netlify-deployment)
  - [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
- [Post-deployment Steps](#post-deployment-steps)

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account
2. Firebase account and project set up
3. All environment variables ready
4. Project built and tested locally

## Environment Setup

Create a `.env` file with the following variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Deployment Options

### Netlify Deployment

1. **Quick Deploy**
   - Click the "Deploy to Netlify" button in the README
   - Connect your GitHub repository
   - Configure environment variables in Netlify's dashboard

2. **Manual Deploy**
   - Log in to Netlify
   - Click "New site from Git"
   - Select your repository
   - Configure build settings:
     ```
     Build command: npm run build
     Publish directory: dist
     Node version: 18.x
     ```
   - Add environment variables in site settings

3. **Deploy Configuration**
   The `netlify.toml` file in the repository root configures:
   - Build settings
   - Redirects for SPA routing
   - Node.js version

### Cloudflare Pages Deployment

1. **Quick Deploy**
   - Click the "Deploy to Cloudflare Pages" button in the README
   - Connect your GitHub repository
   - Configure build settings:
     ```
     Build command: npm run build
     Build output directory: dist
     Node.js version: 18.x
     ```

2. **Manual Deploy**
   - Log in to Cloudflare Dashboard
   - Go to Pages
   - Create new project
   - Connect your repository
   - Configure build settings
   - Add environment variables

3. **Environment Variables**
   Add all required Firebase environment variables in the Cloudflare Pages settings.

## Post-deployment Steps

1. **Verify Configuration**
   - Test authentication flows
   - Verify PWA functionality
   - Check media playback
   - Test responsive design

2. **Performance Monitoring**
   - Set up Firebase Analytics
   - Configure error tracking
   - Monitor CDN performance

3. **Domain Configuration (Optional)**
   - Add custom domain
   - Configure SSL/TLS
   - Update Firebase authentication settings

4. **Testing Checklist**
   - [ ] Authentication works
   - [ ] Media playback functions
   - [ ] PWA installs correctly
   - [ ] Offline functionality works
   - [ ] Environment variables are set
   - [ ] Routes work correctly
   - [ ] API endpoints are accessible
