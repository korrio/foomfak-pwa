import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { offlineStorage } from '../services/offlineStorageService'
import { notificationService } from '../services/notificationService'
import { User } from '../types'

interface AuthContextType {
  currentUser: FirebaseUser | null
  userData: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface Props {
  children: React.ReactNode
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        await loadUserData(user)
        await setupNotifications(user.uid)
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const loadUserData = async (firebaseUser: FirebaseUser) => {
    try {
      // Try to get user data from offline storage first
      let user = await offlineStorage.get('users', firebaseUser.uid)
      
      if (!user) {
        // Create user data from Firebase user
        user = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnline: navigator.onLine
        }
        
        await offlineStorage.createOrUpdateUser(user)
      } else {
        // Update last login and online status
        user.updatedAt = new Date()
        user.isOnline = navigator.onLine
        await offlineStorage.update('users', user)
      }
      
      setUserData(user)
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const setupNotifications = async (userId: string) => {
    try {
      await notificationService.initialize()
      
      const token = await notificationService.requestPermission()
      if (token) {
        await notificationService.saveFCMToken(userId, token)
      }
    } catch (error) {
      console.error('Failed to setup notifications:', error)
    }
  }

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Update last login time
      if (userCredential.user) {
        await updateUserProfile({ 
          lastLoginAt: new Date(),
          isOnline: navigator.onLine 
        })
      }
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const register = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
      }
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const logout = async (): Promise<void> => {
    try {
      if (currentUser) {
        // Clear offline data
        await offlineStorage.clearUserData(currentUser.uid)
        
        // Clear notification tokens
        localStorage.removeItem(`fcm_token_${currentUser.uid}`)
        localStorage.removeItem(`fcm_token_updated_${currentUser.uid}`)
        localStorage.removeItem(`fcm_token_pending_sync_${currentUser.uid}`)
      }
      
      await signOut(auth)
    } catch (error: any) {
      throw new Error('Failed to logout')
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    try {
      if (!userData) return
      
      const updatedUser = {
        ...userData,
        ...data,
        updatedAt: new Date()
      }
      
      await offlineStorage.update('users', updatedUser)
      setUserData(updatedUser)
    } catch (error) {
      console.error('Failed to update user profile:', error)
      throw new Error('Failed to update profile')
    }
  }

  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email address'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/email-already-in-use':
        return 'Email address is already in use'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/invalid-email':
        return 'Invalid email address'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection'
      default:
        return 'Authentication error occurred'
    }
  }

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}