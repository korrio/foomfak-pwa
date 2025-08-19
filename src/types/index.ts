export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'parent' | 'caretaker' | 'admin'
  points: number
  level: number
  streak: number
  totalActivities: number
  childName?: string
  childAge?: number
  experience?: string
  rating?: number
  createdAt: Date
  lastActive: Date
}

export interface Activity {
  id: string
  userId: string
  type: ActivityType
  title: string
  description: string
  duration: number
  points: number
  mediaUrl?: string
  location?: string
  timestamp: Date
  status: 'completed' | 'in_progress' | 'verified'
}

export type ActivityType = 
  | 'feeding'
  | 'reading'
  | 'playing'
  | 'sleeping'
  | 'bathing'
  | 'health_checkup'
  | 'outdoor_activity'
  | 'education'
  | 'care_giving'

export interface Reward {
  id: string
  title: string
  description: string
  points: number
  category: 'baby_products' | 'education' | 'health' | 'entertainment'
  imageUrl: string
  partnerId: string
  available: boolean
  expiredAt?: Date
}

export interface UserReward {
  id: string
  userId: string
  rewardId: string
  redeemedAt: Date
  used: boolean
  expiresAt: Date
  qrCode: string
}

export interface Partner {
  id: string
  name: string
  category: string
  location: string
  imageUrl: string
  qrCode: string
  active: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly'
  targetValue: number
  pointsReward: number
  activityType: ActivityType
  startDate: Date
  endDate: Date
  active: boolean
}

export interface UserChallenge {
  id: string
  userId: string
  challengeId: string
  currentValue: number
  completed: boolean
  completedAt?: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'achievement' | 'reminder' | 'challenge' | 'reward'
  read: boolean
  createdAt: Date
  actionUrl?: string
}