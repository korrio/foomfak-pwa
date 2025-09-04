/**
 * Background Sync Service
 * Handles synchronization between IndexedDB and Firebase when online
 */

import { offlineStorage } from './offlineStorageService'
import { activityService as firebaseActivityService } from './activityService'
import { eqAssessmentService as firebaseEQService } from './eqAssessmentService'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncAt?: Date
  pendingSync: {
    activities: number
    assessments: number
    challenges: number
    achievements: number
    rewards: number
  }
  syncErrors: string[]
}

class SyncService {
  private isOnline = navigator.onLine
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null
  private lastSyncAt?: Date
  private syncErrors: string[] = []
  private readonly SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.setupEventListeners()
    this.startPeriodicSync()
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('📡 Connection restored, starting sync...')
      this.isOnline = true
      this.syncErrors = []
      this.performSync()
    })

    window.addEventListener('offline', () => {
      console.log('📡 Connection lost, working offline...')
      this.isOnline = false
    })

    // Listen for page visibility changes to sync when user returns
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.performSync()
      }
    })
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.performSync()
      }
    }, this.SYNC_INTERVAL)
  }

  /**
   * Perform full sync of all pending data
   */
  async performSync(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return
    }

    this.isSyncing = true
    this.syncErrors = []

    try {
      console.log('🔄 Starting background sync...')
      
      const unsyncedData = await offlineStorage.getUnsyncedData()
      
      const totalItems = 
        unsyncedData.activities.length +
        unsyncedData.assessments.length +
        unsyncedData.challenges.length +
        unsyncedData.achievements.length +
        unsyncedData.rewards.length

      if (totalItems === 0) {
        console.log('✅ No data to sync')
        this.lastSyncAt = new Date()
        return
      }

      console.log(`🔄 Syncing ${totalItems} items...`)

      // Sync activities
      await this.syncActivities(unsyncedData.activities)
      
      // Sync assessments
      await this.syncAssessments(unsyncedData.assessments)
      
      // Sync challenges (if implemented)
      await this.syncChallenges(unsyncedData.challenges)
      
      // Sync achievements (if implemented)
      await this.syncAchievements(unsyncedData.achievements)
      
      // Sync rewards (if implemented)
      await this.syncRewards(unsyncedData.rewards)

      this.lastSyncAt = new Date()
      console.log('✅ Sync completed successfully')

    } catch (error) {
      console.error('❌ Sync failed:', error)
      this.syncErrors.push(error instanceof Error ? error.message : 'Unknown sync error')
    } finally {
      this.isSyncing = false
    }
  }

  private async syncActivities(activities: any[]): Promise<void> {
    for (const activity of activities) {
      try {
        // Convert to Firebase format
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
          // Note: blob and uploadedFiles are not synced for storage efficiency
        }

        // Save to Firebase
        await firebaseActivityService.saveActivity(firebaseActivity)
        
        // Mark as synced in offline storage
        await offlineStorage.markAsSynced('activities', activity.id)
        
        console.log(`✅ Activity ${activity.id} synced`)
        
        // Small delay to avoid overwhelming Firebase
        await this.delay(100)
        
      } catch (error) {
        console.error(`❌ Failed to sync activity ${activity.id}:`, error)
        this.syncErrors.push(`Activity sync failed: ${activity.id}`)
      }
    }
  }

  private async syncAssessments(assessments: any[]): Promise<void> {
    for (const assessment of assessments) {
      try {
        // Convert to Firebase format
        const firebaseAssessment = {
          userId: assessment.userId,
          childAge: assessment.childAge,
          type: assessment.type,
          responses: assessment.responses,
          scores: assessment.scores,
          interpretation: assessment.interpretation,
          completedAt: assessment.completedAt
        }

        // Save to Firebase
        await firebaseEQService.saveAssessment(firebaseAssessment)
        
        // Mark as synced in offline storage
        await offlineStorage.markAsSynced('assessments', assessment.id)
        
        console.log(`✅ Assessment ${assessment.id} synced`)
        
        // Small delay to avoid overwhelming Firebase
        await this.delay(100)
        
      } catch (error) {
        console.error(`❌ Failed to sync assessment ${assessment.id}:`, error)
        this.syncErrors.push(`Assessment sync failed: ${assessment.id}`)
      }
    }
  }

  private async syncChallenges(challenges: any[]): Promise<void> {
    // TODO: Implement challenge sync when challenge service is available
    for (const challenge of challenges) {
      try {
        // Mark as synced for now (implement actual sync later)
        await offlineStorage.markAsSynced('challenges', challenge.id)
        console.log(`✅ Challenge ${challenge.id} marked as synced (placeholder)`)
      } catch (error) {
        console.error(`❌ Failed to sync challenge ${challenge.id}:`, error)
      }
    }
  }

  private async syncAchievements(achievements: any[]): Promise<void> {
    // TODO: Implement achievement sync when achievement service is available
    for (const achievement of achievements) {
      try {
        // Mark as synced for now (implement actual sync later)
        await offlineStorage.markAsSynced('achievements', achievement.id)
        console.log(`✅ Achievement ${achievement.id} marked as synced (placeholder)`)
      } catch (error) {
        console.error(`❌ Failed to sync achievement ${achievement.id}:`, error)
      }
    }
  }

  private async syncRewards(rewards: any[]): Promise<void> {
    // TODO: Implement reward sync when reward service is available
    for (const reward of rewards) {
      try {
        // Mark as synced for now (implement actual sync later)
        await offlineStorage.markAsSynced('rewards', reward.id)
        console.log(`✅ Reward ${reward.id} marked as synced (placeholder)`)
      } catch (error) {
        console.error(`❌ Failed to sync reward ${reward.id}:`, error)
      }
    }
  }

  /**
   * Force immediate sync
   */
  async forcSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }
    
    await this.performSync()
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const unsyncedData = await offlineStorage.getUnsyncedData()
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      pendingSync: {
        activities: unsyncedData.activities.length,
        assessments: unsyncedData.assessments.length,
        challenges: unsyncedData.challenges.length,
        achievements: unsyncedData.achievements.length,
        rewards: unsyncedData.rewards.length
      },
      syncErrors: this.syncErrors
    }
  }

  /**
   * Clear sync errors
   */
  clearSyncErrors(): void {
    this.syncErrors = []
  }

  /**
   * Enable/disable automatic sync
   */
  setAutoSyncEnabled(enabled: boolean): void {
    if (enabled && !this.syncInterval) {
      this.startPeriodicSync()
    } else if (!enabled && this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalSynced: number
    totalPending: number
    syncSuccessRate: number
    lastErrors: string[]
    dataSize: {
      total: number
      stores: { [key: string]: number }
    }
  }> {
    const unsyncedData = await offlineStorage.getUnsyncedData()
    const dbSize = await offlineStorage.getDatabaseSize()
    
    const totalPending = 
      unsyncedData.activities.length +
      unsyncedData.assessments.length +
      unsyncedData.challenges.length +
      unsyncedData.achievements.length +
      unsyncedData.rewards.length

    // This is a simplified calculation - in a real app you'd track these metrics
    const totalSynced = 0 // Would need to track synced items
    const syncSuccessRate = this.syncErrors.length > 0 ? 0 : 100

    return {
      totalSynced,
      totalPending,
      syncSuccessRate,
      lastErrors: this.syncErrors.slice(-5), // Last 5 errors
      dataSize: dbSize
    }
  }

  /**
   * Pause sync (useful during intensive operations)
   */
  pauseSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Resume sync
   */
  resumeSync(): void {
    if (!this.syncInterval) {
      this.startPeriodicSync()
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Download data from Firebase (for data recovery)
   */
  async downloadFromFirebase(userId: string): Promise<{
    activities: any[]
    assessments: any[]
  }> {
    if (!this.isOnline) {
      throw new Error('Cannot download while offline')
    }

    try {
      console.log('📥 Downloading data from Firebase...')
      
      // Download activities and assessments from Firebase
      const [activities, assessments] = await Promise.all([
        firebaseActivityService.getUserActivities(userId),
        firebaseEQService.getUserAssessments(userId)
      ])

      console.log(`📥 Downloaded ${activities.length} activities and ${assessments.length} assessments`)
      
      return { activities, assessments }
      
    } catch (error) {
      console.error('❌ Failed to download from Firebase:', error)
      throw error
    }
  }

  /**
   * Merge downloaded data with local data (conflict resolution)
   */
  async mergeDownloadedData(userId: string, downloadedData: {
    activities: any[]
    assessments: any[]
  }): Promise<void> {
    console.log('🔀 Merging downloaded data with local data...')
    
    // This is a simplified merge - in production you'd want more sophisticated conflict resolution
    
    // For now, we'll add any missing items to local storage
    for (const activity of downloadedData.activities) {
      const existingActivity = await offlineStorage.get('activities', activity.id)
      if (!existingActivity) {
        const localActivity = {
          ...activity,
          synced: true,
          syncedAt: new Date()
        }
        await offlineStorage.create('activities', localActivity)
      }
    }
    
    for (const assessment of downloadedData.assessments) {
      const existingAssessment = await offlineStorage.get('assessments', assessment.id)
      if (!existingAssessment) {
        const localAssessment = {
          ...assessment,
          synced: true,
          syncedAt: new Date()
        }
        await offlineStorage.create('assessments', localAssessment)
      }
    }
    
    console.log('✅ Data merge completed')
  }
}

// Export singleton instance
export const syncService = new SyncService()

// Initialize sync service
syncService.performSync().catch(console.error)

export default syncService