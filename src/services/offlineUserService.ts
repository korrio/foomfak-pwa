/**
 * Offline-First User Service
 * Manages user data, statistics, and profile information in IndexedDB
 */

import { offlineStorage } from './offlineStorageService'

export interface UserProfile {
  id: string
  name: string
  email?: string
  displayName?: string
  photoURL?: string
  role?: 'parent' | 'relative' | 'teacher'
  childName?: string
  childAge?: number
  points: number
  level: number
  streak: number
  totalActivities: number
  completedOnboarding: boolean
  createdAt: Date
  updatedAt: Date
  lastSyncAt?: Date
}

export interface UserStats {
  totalActivities: number
  totalPoints: number
  currentStreak: number
  level: number
  thisWeekActivities: number
  todayActivities: number
  averageDuration: number
  favoriteActivity?: string
  favoriteCategory?: string
  longestStreak: number
  assessmentsCompleted: number
  challengesCompleted: number
  achievementsUnlocked: number
}

class OfflineUserService {
  private isOnline = navigator.onLine

  constructor() {
    // Listen for online/offline changes
    window.addEventListener('online', () => {
      this.isOnline = true
    })
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateUser(userData: {
    id: string
    name: string
    email?: string
    displayName?: string
    photoURL?: string
    role?: 'parent' | 'relative' | 'teacher'
    childName?: string
    childAge?: number
  }): Promise<UserProfile> {
    const existingUser = await offlineStorage.get('users', userData.id)
    const now = new Date()

    const user: UserProfile = {
      ...userData,
      points: existingUser?.points || 0,
      level: existingUser?.level || 1,
      streak: existingUser?.streak || 0,
      totalActivities: existingUser?.totalActivities || 0,
      completedOnboarding: existingUser?.completedOnboarding || false,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now
    }

    await offlineStorage.createOrUpdateUser(user)
    return user
  }

  /**
   * Get user profile
   */
  async getUser(userId: string): Promise<UserProfile | null> {
    return await offlineStorage.get('users', userId)
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile> {
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      updatedAt: new Date()
    }

    await offlineStorage.update('users', updatedUser)
    return updatedUser
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(userId: string, onboardingData: {
    role: 'parent' | 'relative' | 'teacher'
    childName: string
    childAge: number
  }): Promise<UserProfile> {
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Award welcome bonus points
    const welcomeBonus = 100
    const updatedUser: UserProfile = {
      ...user,
      ...onboardingData,
      points: user.points + welcomeBonus,
      level: Math.floor((user.points + welcomeBonus) / 100) + 1,
      completedOnboarding: true,
      updatedAt: new Date()
    }

    await offlineStorage.update('users', updatedUser)
    return updatedUser
  }

  /**
   * Add points to user account
   */
  async addPoints(userId: string, points: number): Promise<UserProfile> {
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser: UserProfile = {
      ...user,
      points: user.points + points,
      level: Math.floor((user.points + points) / 100) + 1,
      updatedAt: new Date()
    }

    await offlineStorage.update('users', updatedUser)
    return updatedUser
  }

  /**
   * Spend points (for rewards)
   */
  async spendPoints(userId: string, points: number): Promise<UserProfile> {
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (user.points < points) {
      throw new Error('Insufficient points')
    }

    const updatedUser: UserProfile = {
      ...user,
      points: user.points - points,
      level: Math.floor((user.points - points) / 100) + 1,
      updatedAt: new Date()
    }

    await offlineStorage.update('users', updatedUser)
    return updatedUser
  }

  /**
   * Update activity streak
   */
  async updateStreak(userId: string): Promise<UserProfile> {
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const activities = await offlineStorage.getUserActivities(userId)
    const todayActivities = activities.filter(a => a.timestamp >= today)
    const yesterdayActivities = activities.filter(a => 
      a.timestamp >= yesterday && a.timestamp < today
    )

    let newStreak = user.streak

    // If first activity today
    if (todayActivities.length === 1) {
      if (yesterdayActivities.length > 0 || user.streak === 0) {
        // Continue or start streak
        newStreak = user.streak + 1
      } else {
        // Reset streak if missed yesterday
        newStreak = 1
      }
    }

    const updatedUser: UserProfile = {
      ...user,
      streak: newStreak,
      totalActivities: user.totalActivities + 1,
      updatedAt: new Date()
    }

    await offlineStorage.update('users', updatedUser)
    return updatedUser
  }

  /**
   * Get comprehensive user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get all user data
    const [activities, assessments, challenges, achievements] = await Promise.all([
      offlineStorage.getUserActivities(userId),
      offlineStorage.getUserAssessments(userId),
      offlineStorage.getUserChallenges(userId),
      offlineStorage.getUserAchievements(userId)
    ])

    // Calculate time-based statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())

    const todayActivities = activities.filter(a => a.timestamp >= today)
    const weekActivities = activities.filter(a => a.timestamp >= weekStart)

    // Calculate average duration
    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0)
    const averageDuration = activities.length > 0 ? totalDuration / activities.length : 0

    // Find favorite activity
    const activityCounts: { [key: string]: number } = {}
    activities.forEach(a => {
      activityCounts[a.name] = (activityCounts[a.name] || 0) + 1
    })
    const favoriteActivity = Object.keys(activityCounts).reduce((a, b) => 
      activityCounts[a] > activityCounts[b] ? a : b, Object.keys(activityCounts)[0]
    )

    // Find favorite category
    const categoryCounts: { [key: string]: number } = {}
    activities.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1
    })
    const favoriteCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b, Object.keys(categoryCounts)[0]
    )

    // Calculate longest streak (simplified - could be more sophisticated)
    let longestStreak = user.streak

    // Count completed challenges and achievements
    const completedChallenges = challenges.filter(c => c.completed).length
    const unlockedAchievements = achievements.length

    return {
      totalActivities: user.totalActivities,
      totalPoints: user.points,
      currentStreak: user.streak,
      level: user.level,
      thisWeekActivities: weekActivities.length,
      todayActivities: todayActivities.length,
      averageDuration,
      favoriteActivity,
      favoriteCategory,
      longestStreak,
      assessmentsCompleted: assessments.length,
      challengesCompleted: completedChallenges,
      achievementsUnlocked: unlockedAchievements
    }
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboard(userId: string): Promise<{
    user: UserProfile
    stats: UserStats
    recentActivities: any[]
    activeChallenges: any[]
    latestAssessment?: any
    nextLevel: {
      current: number
      next: number
      pointsToNext: number
      progress: number
    }
  }> {
    const [user, stats] = await Promise.all([
      this.getUser(userId),
      this.getUserStats(userId)
    ])

    if (!user) {
      throw new Error('User not found')
    }

    // Get recent activities
    const recentActivities = await offlineStorage.getUserActivities(userId, 5)

    // Get active challenges
    const activeChallenges = await offlineStorage.getUserChallenges(userId, true)

    // Get latest assessment
    const assessments = await offlineStorage.getUserAssessments(userId)
    const latestAssessment = assessments[0]

    // Calculate next level progress
    const currentLevelPoints = (user.level - 1) * 100
    const nextLevelPoints = user.level * 100
    const pointsToNext = nextLevelPoints - user.points
    const progress = ((user.points - currentLevelPoints) / 100) * 100

    return {
      user,
      stats,
      recentActivities,
      activeChallenges,
      latestAssessment,
      nextLevel: {
        current: user.level,
        next: user.level + 1,
        pointsToNext: Math.max(0, pointsToNext),
        progress: Math.max(0, Math.min(100, progress))
      }
    }
  }

  /**
   * Reset user streak (if needed)
   */
  async resetStreak(userId: string): Promise<UserProfile> {
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser: UserProfile = {
      ...user,
      streak: 0,
      updatedAt: new Date()
    }

    await offlineStorage.update('users', updatedUser)
    return updatedUser
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(userId: string): Promise<void> {
    await offlineStorage.clearUserData(userId)
  }

  /**
   * Get user level information
   */
  getLevelInfo(points: number): {
    level: number
    currentLevelPoints: number
    nextLevelPoints: number
    pointsToNext: number
    progress: number
  } {
    const level = Math.floor(points / 100) + 1
    const currentLevelPoints = (level - 1) * 100
    const nextLevelPoints = level * 100
    const pointsToNext = nextLevelPoints - points
    const progress = ((points - currentLevelPoints) / 100) * 100

    return {
      level,
      currentLevelPoints,
      nextLevelPoints,
      pointsToNext: Math.max(0, pointsToNext),
      progress: Math.max(0, Math.min(100, progress))
    }
  }

  /**
   * Check if user can afford something
   */
  async canAfford(userId: string, cost: number): Promise<boolean> {
    const user = await this.getUser(userId)
    return user ? user.points >= cost : false
  }

  /**
   * Get user rank/leaderboard position (if implemented)
   */
  async getUserRank(userId: string): Promise<number> {
    // This would require getting all users and ranking them
    // For now, return a placeholder
    return 1
  }

  /**
   * Export user data
   */
  async exportUserData(userId: string): Promise<{
    user: UserProfile
    activities: any[]
    assessments: any[]
    challenges: any[]
    achievements: any[]
    rewards: any[]
  }> {
    const [user, activities, assessments, challenges, achievements, rewards] = await Promise.all([
      this.getUser(userId),
      offlineStorage.getUserActivities(userId),
      offlineStorage.getUserAssessments(userId),
      offlineStorage.getUserChallenges(userId),
      offlineStorage.getUserAchievements(userId),
      offlineStorage.getUserRewards(userId)
    ])

    if (!user) {
      throw new Error('User not found')
    }

    return {
      user,
      activities,
      assessments,
      challenges,
      achievements,
      rewards
    }
  }

  /**
   * Check if service is ready
   */
  async isReady(): Promise<boolean> {
    try {
      await offlineStorage.initDatabase()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get app usage statistics
   */
  async getUsageStats(userId: string): Promise<{
    totalTimeSpent: number // in seconds
    averageSessionLength: number
    activeDays: number
    lastActiveDate: Date
    mostActiveHour: number
    weeklyActivity: { [day: string]: number }
  }> {
    const activities = await offlineStorage.getUserActivities(userId)
    
    const totalTimeSpent = activities.reduce((sum, a) => sum + a.duration, 0)
    const averageSessionLength = activities.length > 0 ? totalTimeSpent / activities.length : 0
    
    // Count unique days
    const uniqueDays = new Set(
      activities.map(a => a.timestamp.toDateString())
    ).size
    
    const lastActivity = activities[0]
    const lastActiveDate = lastActivity ? lastActivity.timestamp : new Date()
    
    // Find most active hour (simplified)
    const hourCounts: { [hour: number]: number } = {}
    activities.forEach(a => {
      const hour = a.timestamp.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const mostActiveHour = parseInt(Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b, '0'
    ))
    
    // Weekly activity
    const weeklyActivity: { [day: string]: number } = {}
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    activities.forEach(a => {
      const day = days[a.timestamp.getDay()]
      weeklyActivity[day] = (weeklyActivity[day] || 0) + 1
    })
    
    return {
      totalTimeSpent,
      averageSessionLength,
      activeDays: uniqueDays,
      lastActiveDate,
      mostActiveHour,
      weeklyActivity
    }
  }
}

// Export singleton instance
export const offlineUserService = new OfflineUserService()
export default offlineUserService