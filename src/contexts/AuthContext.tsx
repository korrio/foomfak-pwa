import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User,
  signOut,
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'

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
  createdAt: Date
  lastActive: Date
}

interface AuthContextType {
  currentUser: User | null
  userData: UserData | null
  sendOTP: (phoneNumber: string) => Promise<ConfirmationResult>
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>
  registerWithPhone: (userData: Partial<UserData> & { phone: string }) => Promise<ConfirmationResult>
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
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved')
      }
    })
  }

  const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
    const recaptchaVerifier = setupRecaptcha('recaptcha-container')
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+66${phoneNumber.substring(1)}`
    
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier)
      return confirmationResult
    } catch (error) {
      recaptchaVerifier.clear()
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

  const createUserDocument = async (user: User, userData: Partial<UserData>) => {
    // Update display name
    if (userData.name) {
      await updateProfile(user, { displayName: userData.name })
    }

    // Create user document in Firestore
    const userDocData: UserData = {
      id: user.uid,
      phone: userData.phone || user.phoneNumber || '',
      name: userData.name || '',
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