import React, { createContext, useContext, useState, useEffect } from 'react'
import { Activity, User } from '../types'
import { EQAssessment } from '../data/eqQuestionnaire'

interface DemoUser extends User {
  demoMode: true
}

interface DemoData {
  activities: Activity[]
  assessments: EQAssessment[]
  redemptions: any[]
}

interface DemoContextType {
  isDemoMode: boolean
  demoUser: DemoUser | null
  demoData: DemoData
  setDemoMode: (enabled: boolean) => void
  addDemoActivity: (activity: Activity) => void
  addDemoAssessment: (assessment: EQAssessment) => void
  updateDemoUser: (updates: Partial<DemoUser>) => void
  resetDemoData: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

const createDemoUser = (): DemoUser => ({
  id: 'demo-user-001',
  email: 'demo@foomfak.app',
  name: 'ผู้ใช้ทดสอบ',
  phone: '0812345678',
  role: 'parent',
  points: 0,
  level: 1,
  streak: 0,
  totalActivities: 0,
  childName: '',
  childAge: 0,
  experience: '',
  rating: 0,
  createdAt: new Date(),
  lastActive: new Date(),
  demoMode: true
})

const createInitialDemoData = (): DemoData => ({
  activities: [],
  assessments: [],
  redemptions: []
})

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null)
  const [demoData, setDemoData] = useState<DemoData>(createInitialDemoData())

  useEffect(() => {
    // Load demo mode from localStorage
    const savedDemoMode = localStorage.getItem('foomfak-demo-mode') === 'true'
    const savedDemoData = localStorage.getItem('foomfak-demo-data')
    
    if (savedDemoMode) {
      setIsDemoMode(true)
      setDemoUser(createDemoUser())
      
      if (savedDemoData) {
        try {
          const parsedData = JSON.parse(savedDemoData)
          // Convert date strings back to Date objects
          parsedData.activities = parsedData.activities.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          }))
          parsedData.assessments = parsedData.assessments.map((assessment: any) => ({
            ...assessment,
            completedAt: new Date(assessment.completedAt)
          }))
          setDemoData(parsedData)
        } catch (error) {
          console.error('Failed to parse demo data:', error)
          setDemoData(createInitialDemoData())
        }
      }
    }
  }, [])

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled)
    localStorage.setItem('foomfak-demo-mode', enabled.toString())
    
    if (enabled) {
      setDemoUser(createDemoUser())
    } else {
      setDemoUser(null)
      localStorage.removeItem('foomfak-demo-data')
    }
  }

  const saveDemoData = (data: DemoData) => {
    setDemoData(data)
    localStorage.setItem('foomfak-demo-data', JSON.stringify(data))
  }

  const addDemoActivity = (activity: Activity) => {
    const newData = {
      ...demoData,
      activities: [activity, ...demoData.activities]
    }
    saveDemoData(newData)
  }

  const addDemoAssessment = (assessment: EQAssessment) => {
    const newData = {
      ...demoData,
      assessments: [assessment, ...demoData.assessments]
    }
    saveDemoData(newData)
  }

  const updateDemoUser = (updates: Partial<DemoUser>) => {
    if (demoUser) {
      const updatedUser = { ...demoUser, ...updates }
      setDemoUser(updatedUser)
    }
  }

  const resetDemoData = () => {
    const initialData = createInitialDemoData()
    saveDemoData(initialData)
    setDemoUser(createDemoUser())
  }

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoUser,
      demoData,
      setDemoMode,
      addDemoActivity,
      addDemoAssessment,
      updateDemoUser,
      resetDemoData
    }}>
      {children}
    </DemoContext.Provider>
  )
}

export const useDemo = () => {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider')
  }
  return context
}