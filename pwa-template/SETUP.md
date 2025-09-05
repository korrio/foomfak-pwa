# PWA Template Setup Guide

This guide will help you quickly set up and customize your PWA template for a new project.

## Quick Start

1. **Copy the template**:
   ```bash
   cp -r pwa-template your-new-project
   cd your-new-project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase** (see detailed steps below)

4. **Start development**:
   ```bash
   npm run dev
   ```

## Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Follow the setup wizard
4. Choose analytics settings

### 2. Enable Required Services

**Authentication:**
1. Go to Authentication > Get started
2. Go to Sign-in method tab
3. Enable "Email/Password" provider
4. Save changes

**Firestore Database:**
1. Go to Firestore Database > Create database
2. Choose "Start in test mode" (for development)
3. Select a location close to your users

**Cloud Messaging:**
1. Go to Project Settings (gear icon)
2. Go to Cloud Messaging tab
3. Generate a new key pair for "Web credentials"
4. Copy the VAPID key

### 3. Get Firebase Config

1. Go to Project Settings > General tab
2. Scroll down to "Your apps"
3. Click "Web" icon to add a web app
4. Register your app with a nickname
5. Copy the Firebase SDK configuration object

### 4. Update Configuration Files

**Update `src/firebase/config.ts`:**
```typescript
const firebaseConfig = {
  apiKey: "your-copied-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijk",
  measurementId: "G-ABCDEFGHIJ"
}
```

**Update `src/services/notificationService.ts`:**
```typescript
private vapidKey = 'your-copied-vapid-key'
```

**Update `public/firebase-messaging-sw.js`:**
```javascript
firebase.initializeApp({
  // Same config as above
})
```

### 5. Create Environment File

Create `.env` file in project root:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdefghijk
VITE_FCM_VAPID_KEY=your-vapid-key
```

## Customization

### 1. App Branding

**Update app name and description:**
- `index.html`: Update `<title>` and meta description
- `vite.config.ts`: Update manifest name and description
- `package.json`: Update name and description

**Replace logo:**
- Replace `public/logo.png` with your 512x512 logo
- Update favicon and other icons as needed

### 2. Color Scheme

**Update Tailwind colors in `tailwind.config.js`:**
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your brand colors
        50: '#...',
        500: '#...',
        600: '#...',
        // etc.
      }
    }
  }
}
```

### 3. Typography and Styling

Update global styles in `src/index.css`:
- Font families
- Component base styles
- Custom utility classes

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

### Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React Context providers
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # Business logic services
├── types/          # TypeScript definitions
├── firebase/       # Firebase configuration
├── App.tsx         # Main app component
└── main.tsx        # Entry point
```

### Adding New Features

1. **New page**: Add component in `pages/` and route in `App.tsx`
2. **New service**: Add service in `services/` for business logic
3. **New component**: Add reusable components in `components/`
4. **New hook**: Add custom hooks in `hooks/`

## Testing

### Test Authentication

1. Start dev server: `npm run dev`
2. Go to `/login`
3. Create a new account
4. Verify login/logout works

### Test PWA Features

1. Build: `npm run build`
2. Serve: `npm run preview`
3. Open DevTools > Application
4. Check:
   - Service Worker registered
   - Cache Storage populated
   - Install prompt (on mobile)

### Test Notifications

1. Allow notifications when prompted
2. Click "Test Notification" in the app
3. Verify notification appears
4. Test background notifications (requires FCM setup)

## Deployment

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

### Other Platforms

- **Netlify**: Connect repo, set build command to `npm run build`, publish dir to `dist`
- **Vercel**: Connect repo, build command `npm run build`, output dir `dist`
- **GitHub Pages**: Use GitHub Actions with build/deploy workflow

## Troubleshooting

### Common Issues

1. **Firebase config errors**: Double-check all config values
2. **Notifications not working**: Verify VAPID key and service worker
3. **Build errors**: Run `npm run typecheck` to find TypeScript issues
4. **PWA not installing**: Check manifest.json and HTTPS requirement

### Debug Mode

Enable debug mode by adding to `.env`:
```env
VITE_DEBUG=true
```

### Console Errors

Check browser console for:
- Service worker registration errors
- Firebase initialization errors
- Network request failures

## Support

- Check the main README.md for detailed documentation
- Review TypeScript types for API reference
- Check Firebase documentation for Firebase-specific issues
- Create GitHub issues for template bugs

Happy coding! 🚀