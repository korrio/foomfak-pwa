# ฟูมฟัก (FoomFak) - Parenting Activity Tracker PWA

A Progressive Web App designed for teenage parents to track their parenting activities with gamification elements.

## Features

- 📱 **Mobile-First PWA**: Installable on iOS/Android devices
- 🎮 **Gamification**: Points, levels, streaks, and rewards
- 📝 **Activity Tracking**: Record parenting activities with audio/video
- 🏆 **Rewards System**: Redeem points for baby products and services
- 🔐 **Role-Based Access**: Parent, Caretaker, and Admin roles
- 🎯 **Challenges**: Daily and weekly parenting challenges
- 📊 **Progress Tracking**: Monitor streaks and achievements
- 💳 **Shop Integration**: Use points at partner stores
- 🔔 **Notifications**: Reminders and achievement alerts

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: Vite PWA plugin with Workbox
- **Icons**: Lucide React
- **Backend**: Firebase (Auth, Firestore, Storage, Messaging)
- **Build Tool**: Vite

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## User Roles

### Parent (พ่อแม่วัยรุ่น)
- Record parenting activities (feeding, reading, playing, etc.)
- Earn points and money for completed activities
- Participate in daily challenges
- Redeem rewards at partner stores

### Caretaker (ผู้ดูแลเด็ก)
- Provide childcare services
- Record care sessions
- Earn income from services
- Build reputation through ratings

### Admin (ผู้ดูแลระบบ)
- Manage app content
- Monitor user activities
- Configure rewards and challenges
- Manage partner stores

## Key Features

### Activity Recording
- Simple tap-to-record interface
- Audio/video recording capabilities
- Pre-defined activity categories
- Automatic point calculation

### Gamification System
- **Points**: Earned for completed activities
- **Levels**: Progress based on total points
- **Streaks**: Daily activity consistency
- **Challenges**: Time-based goals
- **Rewards**: Redeemable items and services

### PWA Capabilities
- Works offline
- Push notifications
- Camera/microphone access
- Installable on mobile devices
- Background sync

## Demo Accounts

- **Parent**: parent@example.com / password
- **Caretaker**: caregiver@example.com / password  
- **Admin**: admin@example.com / password

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication, Firestore, Storage, and Cloud Messaging
3. Add your configuration to `.env`
4. Deploy security rules for Firestore

## Deployment

The app can be deployed to:
- Firebase Hosting
- Vercel
- Netlify
- Any static hosting service

## License

MIT License