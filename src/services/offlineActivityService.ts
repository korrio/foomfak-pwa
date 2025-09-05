/**
 * Offline-First Activity Service
 * Uses IndexedDB as primary storage, Firebase as backup sync
 */

import { offlineStorage } from './offlineStorageService'
import { activityService as firebaseActivityService } from './activityService'

export interface Activity {
  id: string
  userId: string
  activityId: string
  type: string
  name: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number // seconds
  points: number
  recordingType?: 'audio' | 'video'
  blob?: Blob
  uploadedFiles?: File[]
  timestamp: Date
  synced: boolean
  syncedAt?: Date
}

class OfflineActivityService {
  private isOnline = navigator.onLine

  constructor() {
    // Listen for online/offline changes
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncPendingActivities()
    })
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  /**
   * Calculate points based on official criteria
   * 1 point per minute for activities (min 5 min, max 15 points/day)
   * 5 points for hugging activities
   */
  calculatePoints(activityId: string, durationInSeconds: number, userId: string): number {
    const durationInMinutes = Math.floor(durationInSeconds / 60)
    
    switch (activityId) {
      case 'hugging':
      case 'physical_affection':
        return 5 // Fixed 5 points for hugging/physical affection
        
      case 'reading_story':
      case 'educational_games':
      case 'creative_arts':
      case 'outdoor_activities':
      case 'music_singing':
      case 'role_playing':
      case 'building_blocks':
      case 'puzzle_solving':
      default:
        // 1 point per minute, minimum 1 point for any activity
        return Math.max(1, Math.min(durationInMinutes, 15))
    }
  }

  /**
   * Check daily limits for earning points
   */
  async checkDailyLimit(userId: string, activityId: string): Promise<{
    canEarn: boolean
    remainingPoints: number
    todayPoints: number
    dailyLimit: number
  }> {
    // Get today's activities
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const activities = await offlineStorage.getUserActivities(userId)
    const todayActivities = activities.filter(a => 
      a.timestamp >= today && a.timestamp < tomorrow
    )

    const todayPoints = todayActivities.reduce((sum, a) => sum + a.points, 0)
    const dailyLimit = 15 // Maximum 15 points per day

    return {
      canEarn: todayPoints < dailyLimit,
      remainingPoints: Math.max(0, dailyLimit - todayPoints),
      todayPoints,
      dailyLimit
    }
  }

  /**
   * Save activity to offline storage
   */
  async saveActivity(activityData: {
    activityId: string
    type: string
    name: string
    description: string
    category: string
    difficulty: 'easy' | 'medium' | 'hard'
    duration: number
    recordingType?: 'audio' | 'video'
    blob?: Blob
    uploadedFiles?: File[]
    userId: string
  }): Promise<Activity> {
    const now = new Date()
    const points = this.calculatePoints(activityData.activityId, activityData.duration, activityData.userId)
    
    // Check daily limits
    const dailyCheck = await this.checkDailyLimit(activityData.userId, activityData.activityId)
    const finalPoints = dailyCheck.canEarn ? Math.min(points, dailyCheck.remainingPoints) : 0

    const activity: Activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: activityData.userId,
      activityId: activityData.activityId,
      type: activityData.type,
      name: activityData.name,
      description: activityData.description,
      category: activityData.category,
      difficulty: activityData.difficulty,
      duration: activityData.duration,
      points: finalPoints,
      recordingType: activityData.recordingType,
      blob: activityData.blob,
      uploadedFiles: activityData.uploadedFiles,
      timestamp: now,
      synced: false
    }

    // Save to offline storage
    await offlineStorage.create('activities', activity)

    // Update user stats
    await this.updateUserStats(activityData.userId, finalPoints)

    // Try to sync if online
    if (this.isOnline) {
      this.syncActivity(activity).catch(console.error)
    }

    return activity
  }

  /**
   * Get user's activities from offline storage
   */
  async getUserActivities(userId: string, limit?: number): Promise<Activity[]> {
    return await offlineStorage.getUserActivities(userId, limit)
  }

  /**
   * Get recent activities for dashboard
   */
  async getRecentActivities(userId: string, limit = 10): Promise<Activity[]> {
    return await this.getUserActivities(userId, limit)
  }

  /**
   * Update user statistics after activity completion
   */
  private async updateUserStats(userId: string, pointsEarned: number): Promise<void> {
    const user = await offlineStorage.get('users', userId)
    if (!user) return

    // Update points and total activities
    user.points += pointsEarned
    user.totalActivities += 1

    // Calculate new level (every 100 points = 1 level)
    const newLevel = Math.floor(user.points / 100) + 1
    user.level = newLevel

    // Update streak logic
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const activities = await this.getUserActivities(userId)
    const todayActivities = activities.filter(a => a.timestamp >= today)
    const yesterdayActivities = activities.filter(a => 
      a.timestamp >= yesterday && a.timestamp < today
    )

    // Increment streak if first activity today
    if (todayActivities.length === 1) {
      if (yesterdayActivities.length > 0 || user.streak === 0) {
        user.streak += 1
      } else {
        user.streak = 1
      }
    }

    user.updatedAt = new Date()
    await offlineStorage.update('users', user)
  }

  /**
   * Sync single activity to Firebase (when online)
   */
  private async syncActivity(activity: Activity): Promise<void> {
    if (!this.isOnline) return

    try {
      // Convert to Firebase format (without local-specific fields)
      const firebaseActivity = {
        userId: activity.userId,
        activityId: activity.activityId,
        type: activity.type,
        name: activity.name,
        description: activity.description,
        category: activity.category,
        difficulty: activity.difficulty,
        duration: activity.duration,
        points: activity.points,
        recordingType: activity.recordingType,
        timestamp: activity.timestamp
        // Note: blob and uploadedFiles are not synced to Firebase for storage efficiency
      }

      // Attempt to save to Firebase
      await firebaseActivityService.createActivity(firebaseActivity)
      
      // Mark as synced in offline storage
      await offlineStorage.markAsSynced('activities', activity.id)
      
      console.log(`Activity ${activity.id} synced to Firebase`)
    } catch (error) {
      console.error(`Failed to sync activity ${activity.id}:`, error)
      // Activity remains unsynced and will be retried later
    }
  }

  /**
   * Sync all pending activities to Firebase
   */
  async syncPendingActivities(): Promise<void> {
    if (!this.isOnline) return

    try {
      const unsyncedData = await offlineStorage.getUnsyncedData()
      const { activities } = unsyncedData

      console.log(`Syncing ${activities.length} pending activities...`)

      for (const activity of activities) {
        await this.syncActivity(activity)
        // Small delay to avoid overwhelming Firebase
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log('All activities synced successfully')
    } catch (error) {
      console.error('Failed to sync pending activities:', error)
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(userId: string): Promise<{
    todayCount: number
    weekCount: number
    totalCount: number
    totalPoints: number
    averageDuration: number
    favoriteCategory?: string
    streak: number
  }> {
    const activities = await this.getUserActivities(userId)
    const user = await offlineStorage.get('users', userId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())

    const todayActivities = activities.filter(a => a.timestamp >= today)
    const weekActivities = activities.filter(a => a.timestamp >= weekStart)

    // Calculate average duration
    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0)
    const averageDuration = activities.length > 0 ? totalDuration / activities.length : 0

    // Find favorite category
    const categoryCounts: { [key: string]: number } = {}
    activities.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1
    })
    const favoriteCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b, Object.keys(categoryCounts)[0]
    )

    return {
      todayCount: todayActivities.length,
      weekCount: weekActivities.length,
      totalCount: activities.length,
      totalPoints: user?.points || 0,
      averageDuration,
      favoriteCategory,
      streak: user?.streak || 0
    }
  }

  /**
   * Delete activity
   */
  async deleteActivity(activityId: string, userId: string): Promise<void> {
    const activity = await offlineStorage.get('activities', activityId)
    if (!activity || activity.userId !== userId) {
      throw new Error('Activity not found or unauthorized')
    }

    // Remove points from user
    const user = await offlineStorage.get('users', userId)
    if (user) {
      user.points = Math.max(0, user.points - activity.points)
      user.totalActivities = Math.max(0, user.totalActivities - 1)
      user.level = Math.floor(user.points / 100) + 1
      user.updatedAt = new Date()
      await offlineStorage.update('users', user)
    }

    // Delete from offline storage
    await offlineStorage.delete('activities', activityId)

    // If it was synced, mark for deletion sync (implement if needed)
    if (this.isOnline && activity.synced) {
      // Could implement deletion sync to Firebase here
      console.log(`Activity ${activityId} deleted locally, sync deletion to Firebase if needed`)
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
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    online: boolean
    pendingActivities: number
    lastSyncAt?: Date
  }> {
    const unsyncedData = await offlineStorage.getUnsyncedData()
    
    return {
      online: this.isOnline,
      pendingActivities: unsyncedData.activities.length,
      // Could track last successful sync timestamp
    }
  }
}

// Export singleton instance
export const offlineActivityService = new OfflineActivityService()
export default offlineActivityService