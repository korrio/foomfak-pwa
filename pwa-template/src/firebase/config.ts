import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyDYq-RS6tKSnquDjlkvNyvynQtIbnJx3MU",
  authDomain: "pwa-template-react.firebaseapp.com",
  projectId: "pwa-template-react",
  storageBucket: "pwa-template-react.firebasestorage.app",
  messagingSenderId: "338412224909",
  appId: "1:338412224909:web:cd25318ce88bfffc76bdc4",
  measurementId: "G-ESSJMCBYJ6"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const analytics = getAnalytics(app)

// Initialize FCM only if supported
let messaging: any = null
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    }
  })
}
export { messaging }

// Connect to emulators in development (only if explicitly enabled)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  console.log('Development mode: connecting to Firebase emulators')
  
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
  } catch (error) {
    console.log('Emulators may already be connected or not available')
  }
}

export default app