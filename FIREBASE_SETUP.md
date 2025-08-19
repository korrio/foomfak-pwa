# Firebase Setup Guide

## Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

## Initial Setup

1. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   Select:
   - ✅ Firestore
   - ✅ Hosting  
   - ✅ Storage
   - ✅ Emulators

2. Deploy security rules:
   ```bash
   npm run firebase:deploy:rules
   ```

## Firebase Console Setup

### 1. Authentication
- Go to Firebase Console → Authentication
- Enable **Phone** provider
  - Make sure to add your domain to authorized domains
  - For development: `localhost` and `127.0.0.1`
  - For production: your actual domain
- (Optional) Enable **Google** provider for additional login methods

### 2. Firestore Database
- Create Firestore database in production mode
- Deploy security rules: `npm run firebase:deploy:rules`

### 3. Storage
- Set up Firebase Storage
- Deploy storage rules (included in deploy:rules command)

### 4. Cloud Messaging (FCM)
- Go to Project Settings → Cloud Messaging
- Generate Web Push certificates
- Add your domain to authorized domains

## Environment Variables

Make sure your `.env` file has all Firebase config values:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-measurement-id
```

## Development

### Run with Firebase Emulators
```bash
npm run firebase:emulators
```

Then in another terminal:
```bash
npm run dev
```

This allows you to develop with local Firebase emulators.

### Run with Production Firebase
```bash
npm run dev
```

Uses your production Firebase project.

## Deployment

### Deploy everything:
```bash
npm run firebase:deploy
```

### Deploy only hosting:
```bash
npm run firebase:deploy:hosting
```

### Deploy only rules:
```bash
npm run firebase:deploy:rules
```

## Database Collections Structure

The app uses these Firestore collections:

### users
```javascript
{
  id: string,
  phone: string,
  name: string,
  role: 'parent' | 'caretaker' | 'admin',
  points: number,
  level: number,
  streak: number,
  childName?: string,
  childAge?: number,
  fcmToken?: string,
  createdAt: timestamp,
  lastActive: timestamp
}
```

### activities
```javascript
{
  id: string,
  userId: string,
  type: ActivityType,
  title: string,
  description: string,
  duration: number,
  points: number,
  mediaUrl?: string,
  status: 'completed' | 'in_progress' | 'verified',
  timestamp: timestamp
}
```

### notifications
```javascript
{
  id: string,
  userId: string,
  title: string,
  message: string,
  type: 'achievement' | 'reminder' | 'challenge' | 'reward',
  read: boolean,
  createdAt: timestamp,
  actionUrl?: string
}
```

## Storage Structure

```
activities/
  {userId}/
    {activityId}.webm  # Video files
    {activityId}.wav   # Audio files
    
profiles/
  {userId}/
    avatar.jpg
    
app-assets/
  logos/
  icons/
```

## Security Rules

The app uses these security principles:

1. **Users** can only access their own data
2. **Activities** are private to the user who created them
3. **Admin role** required for managing rewards, challenges, and partners
4. **Media files** are private to the uploading user
5. **Public read** access to rewards and challenges for all authenticated users

## Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Check Firestore security rules
   - Ensure user is authenticated
   - Verify user has correct role

2. **Storage upload fails**
   - Check storage security rules
   - Verify file size limits
   - Ensure user is authenticated

3. **FCM not working**
   - Add VAPID key to notification service
   - Check domain is authorized
   - Verify service worker registration

### Testing

1. Test with demo mode: `/demo` (no Firebase required)
2. Test with Firebase emulators: `npm run firebase:emulators`
3. Test authentication flow
4. Test activity recording and storage
5. Test push notifications

## Production Checklist

- [ ] Firebase project created
- [ ] Environment variables configured
- [ ] Authentication providers enabled
- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed
- [ ] FCM configured with VAPID key
- [ ] Domain authorized for FCM
- [ ] App deployed to Firebase Hosting
- [ ] PWA installation tested on mobile
- [ ] Push notifications tested
- [ ] Offline functionality tested