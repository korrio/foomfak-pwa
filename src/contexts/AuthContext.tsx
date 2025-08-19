import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'

interface UserData {
  id: string
  email: string
  name: string
  phone: string
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
  login: (email: string, password: string) => Promise<void>
  register: (userData: Partial<UserData> & { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  updateUserData: (data: Partial<UserData>) => Promise<void>
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

  const register = async (formData: Partial<UserData> & { email: string; password: string }) => {
    const { email, password, ...userData } = formData
    
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update display name
    if (userData.name) {
      await updateProfile(user, { displayName: userData.name })
    }

    // Create user document in Firestore
    const userDocData: UserData = {
      id: user.uid,
      email: user.email!,
      name: userData.name || '',
      phone: userData.phone || '',
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

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
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
        await fetchUserData(user)
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
    login,
    register,
    logout,
    loading,
    updateUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}