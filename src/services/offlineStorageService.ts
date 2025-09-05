/**
 * Offline Storage Service using IndexedDB
 * Provides offline-first data storage for all app functionality
 * Firebase is used only for auth; all data is stored locally
 */

interface DBSchema {
  users: {
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
  activities: {
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
    recordingType?: 'audio' | 'video' | 'image'
    blob?: Blob
    uploadedFiles?: { url: string; name: string; type: string; size: number }[]
    timestamp: Date
    synced: boolean
    syncedAt?: Date
  }
  assessments: {
    id: string
    userId: string
    childAge: number
    type: 'pre-test' | 'post-test'
    responses: Array<{ questionId: string; value: 1 | 2 | 3 | 4 }>
    scores: {
      good: number
      smart: number
      happy: number
      total: number
    }
    interpretation: {
      good: string
      smart: string
      happy: string
      overall: string
    }
    completedAt: Date
    synced: boolean
    syncedAt?: Date
  }
  challenges: {
    id: string
    userId: string
    challengeId: string
    name: string
    description: string
    target: number
    currentValue: number
    points: number
    completed: boolean
    completedAt?: Date
    createdAt: Date
    expiresAt: Date
    synced: boolean
  }
  achievements: {
    id: string
    userId: string
    achievementId: string
    name: string
    description: string
    icon: string
    points: number
    unlockedAt: Date
    synced: boolean
  }
  rewards: {
    id: string
    userId: string
    rewardId: string
    name: string
    description: string
    cost: number
    redeemedAt: Date
    synced: boolean
  }
}

class OfflineStorageService {
  private dbName = 'FoomFakOfflineDB'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' })
          usersStore.createIndex('email', 'email', { unique: false })
          usersStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // Create activities store
        if (!db.objectStoreNames.contains('activities')) {
          const activitiesStore = db.createObjectStore('activities', { keyPath: 'id' })
          activitiesStore.createIndex('userId', 'userId', { unique: false })
          activitiesStore.createIndex('timestamp', 'timestamp', { unique: false })
          activitiesStore.createIndex('synced', 'synced', { unique: false })
          activitiesStore.createIndex('userIdTimestamp', ['userId', 'timestamp'], { unique: false })
        }

        // Create assessments store
        if (!db.objectStoreNames.contains('assessments')) {
          const assessmentsStore = db.createObjectStore('assessments', { keyPath: 'id' })
          assessmentsStore.createIndex('userId', 'userId', { unique: false })
          assessmentsStore.createIndex('type', 'type', { unique: false })
          assessmentsStore.createIndex('completedAt', 'completedAt', { unique: false })
          assessmentsStore.createIndex('synced', 'synced', { unique: false })
          assessmentsStore.createIndex('userIdType', ['userId', 'type'], { unique: false })
        }

        // Create challenges store
        if (!db.objectStoreNames.contains('challenges')) {
          const challengesStore = db.createObjectStore('challenges', { keyPath: 'id' })
          challengesStore.createIndex('userId', 'userId', { unique: false })
          challengesStore.createIndex('completed', 'completed', { unique: false })
          challengesStore.createIndex('expiresAt', 'expiresAt', { unique: false })
          challengesStore.createIndex('synced', 'synced', { unique: false })
        }

        // Create achievements store
        if (!db.objectStoreNames.contains('achievements')) {
          const achievementsStore = db.createObjectStore('achievements', { keyPath: 'id' })
          achievementsStore.createIndex('userId', 'userId', { unique: false })
          achievementsStore.createIndex('unlockedAt', 'unlockedAt', { unique: false })
          achievementsStore.createIndex('synced', 'synced', { unique: false })
        }

        // Create rewards store
        if (!db.objectStoreNames.contains('rewards')) {
          const rewardsStore = db.createObjectStore('rewards', { keyPath: 'id' })
          rewardsStore.createIndex('userId', 'userId', { unique: false })
          rewardsStore.createIndex('redeemedAt', 'redeemedAt', { unique: false })
          rewardsStore.createIndex('synced', 'synced', { unique: false })
        }
      }
    })
  }

  // Generic CRUD operations
  async create<K extends keyof DBSchema>(
    storeName: K,
    data: DBSchema[K]
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(data.id)
    })
  }

  async get<K extends keyof DBSchema>(
    storeName: K,
    id: string
  ): Promise<DBSchema[K] | null> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async update<K extends keyof DBSchema>(
    storeName: K,
    data: DBSchema[K]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete<K extends keyof DBSchema>(
    storeName: K,
    id: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getByIndex<K extends keyof DBSchema>(
    storeName: K,
    indexName: string,
    value: any,
    limit?: number
  ): Promise<DBSchema[K][]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.openCursor(IDBKeyRange.only(value))
      
      const results: DBSchema[K][] = []
      let count = 0

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && (!limit || count < limit)) {
          results.push(cursor.value)
          count++
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  async getAll<K extends keyof DBSchema>(
    storeName: K,
    limit?: number
  ): Promise<DBSchema[K][]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.openCursor()
      
      const results: DBSchema[K][] = []
      let count = 0

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && (!limit || count < limit)) {
          results.push(cursor.value)
          count++
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  // User-specific operations
  async createOrUpdateUser(userData: Omit<DBSchema['users'], 'updatedAt'> & Partial<Pick<DBSchema['users'], 'updatedAt'>>): Promise<string> {
    const now = new Date()
    const user: DBSchema['users'] = {
      ...userData,
      updatedAt: now
    }

    try {
      await this.create('users', user)
    } catch (error) {
      // If user exists, update it
      await this.update('users', user)
    }

    return user.id
  }

  async getUserActivities(userId: string, limit?: number): Promise<DBSchema['activities'][]> {
    const activities = await this.getByIndex('activities', 'userId', userId, limit)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  async getUserAssessments(userId: string, type?: 'pre-test' | 'post-test'): Promise<DBSchema['assessments'][]> {
    let assessments: DBSchema['assessments'][]
    
    if (type) {
      assessments = await this.getByIndex('assessments', 'userIdType', [userId, type])
    } else {
      assessments = await this.getByIndex('assessments', 'userId', userId)
    }
    
    return assessments.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
  }

  async getUserChallenges(userId: string, activeOnly = false): Promise<DBSchema['challenges'][]> {
    const challenges = await this.getByIndex('challenges', 'userId', userId)
    
    if (activeOnly) {
      const now = new Date()
      return challenges.filter(c => !c.completed && c.expiresAt > now)
    }
    
    return challenges
  }

  async getUserAchievements(userId: string): Promise<DBSchema['achievements'][]> {
    const achievements = await this.getByIndex('achievements', 'userId', userId)
    return achievements.sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
  }

  async getUserRewards(userId: string): Promise<DBSchema['rewards'][]> {
    const rewards = await this.getByIndex('rewards', 'userId', userId)
    return rewards.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime())
  }

  // Statistics and analytics
  async getUserStats(userId: string): Promise<{
    totalActivities: number
    totalPoints: number
    currentStreak: number
    level: number
    thisWeekActivities: number
    todayActivities: number
    averageDuration: number
    favoriteActivity?: string
  }> {
    const user = await this.get('users', userId)
    const activities = await this.getUserActivities(userId)
    
    if (!user) throw new Error('User not found')

    // Calculate today's activities
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayActivities = activities.filter(a => a.timestamp >= today).length

    // Calculate this week's activities
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const thisWeekActivities = activities.filter(a => a.timestamp >= weekStart).length

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

    return {
      totalActivities: user.totalActivities,
      totalPoints: user.points,
      currentStreak: user.streak,
      level: user.level,
      thisWeekActivities,
      todayActivities,
      averageDuration,
      favoriteActivity
    }
  }

  // Data sync status
  async getUnsyncedData(): Promise<{
    activities: DBSchema['activities'][]
    assessments: DBSchema['assessments'][]
    challenges: DBSchema['challenges'][]
    achievements: DBSchema['achievements'][]
    rewards: DBSchema['rewards'][]
  }> {
    const [activities, assessments, challenges, achievements, rewards] = await Promise.all([
      this.getByIndex('activities', 'synced', false),
      this.getByIndex('assessments', 'synced', false),
      this.getByIndex('challenges', 'synced', false),
      this.getByIndex('achievements', 'synced', false),
      this.getByIndex('rewards', 'synced', false)
    ])

    return {
      activities,
      assessments,
      challenges,
      achievements,
      rewards
    }
  }

  async markAsSynced<K extends keyof DBSchema>(
    storeName: K,
    id: string
  ): Promise<void> {
    const item = await this.get(storeName, id)
    if (item) {
      (item as any).synced = true;
      (item as any).syncedAt = new Date()
      await this.update(storeName, item)
    }
  }

  // Clear all data (for logout)
  async clearUserData(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const stores = ['activities', 'assessments', 'challenges', 'achievements', 'rewards']
    
    for (const storeName of stores) {
      const items = await this.getByIndex(storeName as keyof DBSchema, 'userId', userId)
      for (const item of items) {
        await this.delete(storeName as keyof DBSchema, item.id)
      }
    }
    
    // Also remove user data
    await this.delete('users', userId)
  }

  // Database maintenance
  async getDatabaseSize(): Promise<{ 
    total: number
    stores: { [key: string]: number }
  }> {
    if (!this.db) throw new Error('Database not initialized')

    const stores = ['users', 'activities', 'assessments', 'challenges', 'achievements', 'rewards']
    const storeSizes: { [key: string]: number } = {}
    let total = 0

    for (const storeName of stores) {
      const items = await this.getAll(storeName as keyof DBSchema)
      const size = JSON.stringify(items).length
      storeSizes[storeName] = size
      total += size
    }

    return { total, stores: storeSizes }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService()

// Initialize on import
offlineStorage.initDatabase().catch(console.error)

export default offlineStorage