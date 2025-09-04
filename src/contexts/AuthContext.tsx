import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User,
  signOut,
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { offlineUserService, UserProfile } from '../services/offlineUserService'
import { syncService } from '../services/syncService'
import { notificationService } from '../services/notificationService'

// Test phone numbers for development (no SMS sent, no reCAPTCHA required)
const TEST_PHONE_NUMBERS = {
  '+66812345678': '123456',
  '+66887654321': '654321',
  '+66811111111': '111111',
  '+66826539264': '111111'
}

// Use the offline UserProfile type
type UserData = UserProfile

interface AuthContextType {
  currentUser: User | null
  userData: UserData | null
  sendOTP: (phoneNumber: string) => Promise<ConfirmationResult>
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>
  registerWithPhone: (userData: Partial<UserData> & { phone: string }) => Promise<ConfirmationResult>
  signInWithGoogle: () => Promise<void>
  signInAsGuest: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  updateUserData: (data: Partial<UserData>) => Promise<void>
  setupRecaptcha: (containerId: string) => RecaptchaVerifier
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    // Clear any existing reCAPTCHA
    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = ''
    }
    
    return new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
      callback: (response: any) => {
        console.log('reCAPTCHA solved:', response)
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired - please refresh')
      },
      'error-callback': (error: any) => {
        console.error('reCAPTCHA error:', error)
      }
    })
  }

  const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+66${phoneNumber.substring(1)}`
    
    console.log('Attempting to send OTP to:', formattedPhoneNumber)
    
    // Check if it's a test phone number
    if (TEST_PHONE_NUMBERS[formattedPhoneNumber as keyof typeof TEST_PHONE_NUMBERS]) {
      console.log('Using test phone number - no SMS will be sent')
    }
    
    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container')
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier)
      console.log('OTP request successful')
      return confirmationResult
    } catch (error: any) {
      console.error('Failed to send OTP:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      // Clean up reCAPTCHA on error
      const container = document.getElementById('recaptcha-container')
      if (container) {
        container.innerHTML = ''
      }
      
      throw error
    }
  }

  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string): Promise<void> => {
    await confirmationResult.confirm(otp)
  }

  const registerWithPhone = async (userData: Partial<UserData> & { phone: string }): Promise<ConfirmationResult> => {
    // First, send OTP for phone verification
    const confirmationResult = await sendOTP(userData.phone)
    
    // Store temporary user data for after OTP verification
    sessionStorage.setItem('pendingUserData', JSON.stringify(userData))
    
    return confirmationResult
  }

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      // Check if user already exists in offline storage
      let existingUser = await offlineUserService.getUser(user.uid)
      
      if (!existingUser) {
        // Create new user document for Google sign-in (with minimal data - onboarding will complete it)
        existingUser = await offlineUserService.createOrUpdateUser({
          id: user.uid,
          name: user.displayName || 'ผู้ใช้ Google',
          email: user.email || undefined,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
          role: 'parent' // Default role, user can change during onboarding
        })
      }
      
      setUserData(existingUser)
      
      console.log('Google sign-in successful')
    } catch (error: any) {
      console.error('Google sign-in failed:', error)
      throw new Error('ไม่สามารถเข้าสู่ระบบด้วย Google ได้: ' + error.message)
    }
  }

  const signInAsGuest = async (): Promise<void> => {
    try {
      const result = await signInAnonymously(auth)
      const user = result.user
      
      // Create guest user document in offline storage
      const guestUser = await offlineUserService.createOrUpdateUser({
        id: user.uid,
        name: 'ผู้ใช้แขก'
      })
      
      setUserData(guestUser)
      console.log('Anonymous sign-in successful')
    } catch (error: any) {
      console.error('Anonymous sign-in failed:', error)
      throw new Error('ไม่สามารถเข้าสู่ระบบแบบแขกได้: ' + error.message)
    }
  }


  const createUserDocument = async (user: User, userData: Partial<UserData>) => {
    // Update Firebase profile (display name only)
    if (userData.name) {
      await updateProfile(user, { displayName: userData.name })
    }

    // Create user document in offline storage
    const userProfile = await offlineUserService.createOrUpdateUser({
      id: user.uid,
      name: userData.name || user.displayName || user.email?.split('@')[0] || 'ผู้ใช้',
      email: user.email || undefined,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      role: (userData.role as 'parent' | 'relative' | 'teacher') || 'parent',
      childName: userData.childName,
      childAge: userData.childAge
    })

    setUserData(userProfile)
  }

  const logout = async () => {
    // Clear offline data and notifications for current user
    if (currentUser) {
      await offlineUserService.deleteUser(currentUser.uid)
      await notificationService.cancelAllNotifications(currentUser.uid)
      localStorage.removeItem(`notifications_setup_${currentUser.uid}`)
    }
    
    // Sign out from Firebase
    await signOut(auth)
    setUserData(null)
  }

  const updateUserData = async (data: Partial<UserData>) => {
    if (!currentUser || !userData) return

    const updatedUser = await offlineUserService.updateUser(currentUser.uid, data)
    setUserData(updatedUser)
  }

  const fetchUserData = async (user: User) => {
    const userData = await offlineUserService.getUser(user.uid)
    if (userData) {
      setUserData(userData)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        // Check if this is a new user (just registered)
        const pendingUserData = sessionStorage.getItem('pendingUserData')
        if (pendingUserData) {
          const userData = JSON.parse(pendingUserData)
          await createUserDocument(user, userData)
          sessionStorage.removeItem('pendingUserData')
        } else {
          await fetchUserData(user)
        }
        
        // Initialize notification service and set up default notifications for logged-in users
        try {
          await notificationService.initialize()
          
          // Check if this is a new user or first time setting up notifications
          const hasSetupNotifications = localStorage.getItem(`notifications_setup_${user.uid}`)
          if (!hasSetupNotifications) {
            // Wait a bit to ensure user data is loaded before setting up notifications
            setTimeout(async () => {
              await notificationService.setupDefaultNotifications(user.uid)
              localStorage.setItem(`notifications_setup_${user.uid}`, 'true')
            }, 2000)
          }
        } catch (error) {
          console.error('Failed to initialize notifications:', error)
        }
      } else {
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    currentUser,
    userData,
    sendOTP,
    verifyOTP,
    registerWithPhone,
    signInWithGoogle,
    signInAsGuest,
    logout,
    loading,
    updateUserData,
    setupRecaptcha
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}