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
import { auth, db } from '../firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'

// Test phone numbers for development (no SMS sent, no reCAPTCHA required)
const TEST_PHONE_NUMBERS = {
  '+66812345678': '123456',
  '+66887654321': '654321',
  '+66811111111': '111111',
  '+66826539264': '111111'
}

interface UserData {
  id: string
  phone: string
  name: string
  role: 'parent' | 'caretaker' | 'admin'
  points: number
  level: number
  streak: number
  childName?: string
  childAge?: number
  experience?: string
  rating?: number
  onboardingCompleted?: boolean
  createdAt: Date
  lastActive: Date
}

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
      
      // Check if user already exists in our database
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (!userDoc.exists()) {
        // Create new user document for Google sign-in (with minimal data - onboarding will complete it)
        const userData: Partial<UserData> = {
          name: user.displayName || 'ผู้ใช้ Google',
          phone: user.phoneNumber || user.email || '',
          role: 'parent', // Default role, user can change during onboarding
          points: 0, // Will be updated to 100 during onboarding
          level: 1,
          streak: 0
        }
        
        await createUserDocument(user, userData)
      }
      
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
      
      // Create guest user document
      const userData: Partial<UserData> = {
        name: 'ผู้ใช้แขก',
        phone: '',
        role: 'parent',
        points: 0,
        level: 1,
        streak: 0
      }
      
      await createUserDocument(user, userData)
      console.log('Anonymous sign-in successful')
    } catch (error: any) {
      console.error('Anonymous sign-in failed:', error)
      throw new Error('ไม่สามารถเข้าสู่ระบบแบบแขกได้: ' + error.message)
    }
  }


  const createUserDocument = async (user: User, userData: Partial<UserData>) => {
    // Update display name
    if (userData.name) {
      await updateProfile(user, { displayName: userData.name })
    }

    // Create user document in Firestore
    const userDocData: UserData = {
      id: user.uid,
      phone: userData.phone || user.phoneNumber || '',
      name: userData.name || user.displayName || user.email?.split('@')[0] || 'ผู้ใช้',
      role: userData.role || 'parent',
      points: 0,
      level: 1,
      streak: 0,
      childName: userData.childName,
      childAge: userData.childAge,
      experience: userData.experience,
      rating: userData.rating,
      createdAt: new Date(),
      lastActive: new Date()
    }

    await setDoc(doc(db, 'users', user.uid), userDocData)
    setUserData(userDocData)
  }

  const logout = async () => {
    await signOut(auth)
    setUserData(null)
  }

  const updateUserData = async (data: Partial<UserData>) => {
    if (!currentUser || !userData) return

    const updatedData = { ...userData, ...data, lastActive: new Date() }
    await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true })
    setUserData(updatedData)
  }

  const fetchUserData = async (user: User) => {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (userDoc.exists()) {
      const data = userDoc.data() as UserData
      setUserData({
        ...data,
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
        lastActive: data.lastActive instanceof Date ? data.lastActive : new Date(data.lastActive)
      })
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