# PWA Bootstrap Template

A comprehensive Progressive Web App (PWA) template built with React, TypeScript, Firebase, and Tailwind CSS. This template provides a solid foundation for building offline-first PWAs with authentication, push notifications, and modern web app capabilities.

## 🚀 Features

- **🔐 Authentication**: Firebase Auth with email/password, registration, and password reset
- **📱 PWA Ready**: Service worker, offline functionality, installable
- **🔔 Push Notifications**: Firebase Cloud Messaging (FCM) integration
- **💾 Offline Storage**: IndexedDB with offline-first architecture
- **🌐 Connection Status**: Real-time online/offline/syncing indicators
- **📱 Responsive Design**: Mobile-first responsive design with Tailwind CSS
- **⚡ Modern Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **🔄 State Management**: Context API with custom hooks
- **🎨 UI Components**: Reusable components with Lucide React icons

## 📦 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: IndexedDB (offline) + Firebase Firestore (cloud sync)
- **Notifications**: Firebase Cloud Messaging (FCM)
- **PWA**: Vite PWA Plugin with Workbox
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 🛠️ Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Firebase project with Auth, Firestore, and FCM enabled

### Installation

1. **Clone or copy this template**:
   ```bash
   # Copy the pwa-template folder to your project location
   cp -r pwa-template your-project-name
   cd your-project-name
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Firebase**:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password provider)
   - Enable Firestore Database
   - Enable Cloud Messaging
   - Get your Firebase config object
   - Update `src/firebase/config.ts` with your Firebase configuration:

   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   }
   ```

4. **Configure FCM (Push Notifications)**:
   - Generate a VAPID key pair in Firebase Console > Project Settings > Cloud Messaging
   - Update the `vapidKey` in `src/services/notificationService.ts`
   - Create `public/firebase-messaging-sw.js` for background notifications (see setup guide below)

5. **Start development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Build for production**:
   ```bash
   npm run build
   # or
   yarn build
   ```

## 🔧 Configuration

### Firebase Setup

1. **Authentication**:
   - Enable Email/Password provider in Firebase Console
   - Configure authorized domains for production

2. **Firestore Database**:
   - Create database in test or production mode
   - Set up security rules as needed

3. **Cloud Messaging**:
   - Generate Web credentials (VAPID key)
   - Update notification service configuration

### PWA Configuration

The PWA configuration is in `vite.config.ts`. You can customize:
- App name and description
- Theme colors
- Icons and splash screens
- Caching strategies

### Environment Variables

Create a `.env` file for environment-specific configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ConnectionStatus.tsx
│   ├── LoadingSpinner.tsx
│   └── NotificationButton.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── hooks/             # Custom React hooks
│   ├── useConnectionStatus.ts
│   └── useNotifications.ts
├── pages/             # Page components
│   ├── LoginPage.tsx
│   └── MainApp.tsx
├── services/          # Service layers
│   ├── notificationService.ts
│   └── offlineStorageService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── firebase/          # Firebase configuration
│   └── config.ts
├── App.tsx           # Main app component
├── main.tsx          # App entry point
└── index.css         # Global styles
```

## 🎨 Customization

### Styling

This template uses Tailwind CSS with a custom design system. You can customize:

1. **Colors**: Update `tailwind.config.js` for your brand colors
2. **Components**: Modify component classes in `src/index.css`
3. **Layout**: Adjust responsive breakpoints and spacing

### Adding Features

The template is designed to be extended. Common additions:

1. **New Pages**: Add routes in `src/App.tsx`
2. **Data Models**: Extend types in `src/types/index.ts`
3. **Storage**: Add new stores in `offlineStorageService.ts`
4. **API Integration**: Create new services in `src/services/`

## 📱 PWA Features

### Installation

Users can install the app to their home screen when accessing from a mobile browser or desktop.

### Offline Functionality

- App shell cached for offline access
- User authentication state persisted
- Data stored in IndexedDB for offline access
- Background sync when connectivity returns

### Push Notifications

- Permission request flow
- Foreground and background message handling
- Local notification storage and management

## 🚀 Deployment

### Build

```bash
npm run build
```

### Deploy to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

### Deploy to Netlify/Vercel

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

## 🔒 Security

### Firebase Security Rules

Set up proper Firestore security rules:

```javascript
// Firestore rules example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Environment Variables

Never commit sensitive keys to version control. Use environment variables for:
- Firebase configuration
- API keys
- Third-party service credentials

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the inline code comments and type definitions
- **Issues**: Report bugs or request features via GitHub Issues
- **Firebase**: Check [Firebase Documentation](https://firebase.google.com/docs) for Firebase-specific issues

## 🎯 Roadmap

- [ ] Dark mode support
- [ ] Multi-language support (i18n)
- [ ] Advanced caching strategies
- [ ] Background sync implementation
- [ ] Web Share API integration
- [ ] Biometric authentication
- [ ] Push notification scheduling

---

Built with ❤️ for the modern web. Happy coding! 🚀