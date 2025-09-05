/**
 * Offline Storage Service using IndexedDB
 * Provides offline-first data storage for PWA functionality
 */

interface DBSchema {
  users: {
    id: string
    email: string
    displayName?: string
    photoURL?: string
    createdAt: Date
    updatedAt: Date
    lastSyncAt?: Date
    isOnline?: boolean
  }
  notifications: {
    id: string
    userId: string
    title: string
    body: string
    data?: any
    timestamp: Date
    read: boolean
    synced: boolean
  }
  offlineData: {
    id: string
    type: string
    userId: string
    data: any
    timestamp: Date
    synced: boolean
    syncedAt?: Date
  }
}

class OfflineStorageService {
  private dbName = 'PWATemplateDB'
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

        // Create notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id' })
          notificationsStore.createIndex('userId', 'userId', { unique: false })
          notificationsStore.createIndex('timestamp', 'timestamp', { unique: false })
          notificationsStore.createIndex('synced', 'synced', { unique: false })
          notificationsStore.createIndex('read', 'read', { unique: false })
        }

        // Create offline data store
        if (!db.objectStoreNames.contains('offlineData')) {
          const offlineDataStore = db.createObjectStore('offlineData', { keyPath: 'id' })
          offlineDataStore.createIndex('userId', 'userId', { unique: false })
          offlineDataStore.createIndex('type', 'type', { unique: false })
          offlineDataStore.createIndex('timestamp', 'timestamp', { unique: false })
          offlineDataStore.createIndex('synced', 'synced', { unique: false })
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

  // Sync operations
  async getUnsyncedData(): Promise<{
    notifications: DBSchema['notifications'][]
    offlineData: DBSchema['offlineData'][]
  }> {
    const [notifications, offlineData] = await Promise.all([
      this.getByIndex('notifications', 'synced', false),
      this.getByIndex('offlineData', 'synced', false)
    ])

    return { notifications, offlineData }
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

  // Clear all data (for logout)
  async clearUserData(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const stores = ['notifications', 'offlineData']
    
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

    const stores = ['users', 'notifications', 'offlineData']
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