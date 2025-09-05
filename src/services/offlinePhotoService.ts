/**
 * Offline Photo Service
 * Handles photo storage both locally (IndexedDB) and remotely (Firebase Storage)
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config'

interface PhotoData {
  id: string
  blob: Blob
  filename: string
  uploadedAt: Date
  firebaseUrl?: string
  synced: boolean
}

class OfflinePhotoService {
  private dbName = 'FoomFakPhotos'
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

        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' })
          photoStore.createIndex('filename', 'filename', { unique: false })
          photoStore.createIndex('synced', 'synced', { unique: false })
        }
      }
    })
  }

  async storePhotoLocally(file: File, userId: string, type: 'child' | 'profile' = 'child'): Promise<string> {
    if (!this.db) {
      await this.initDatabase()
    }

    const photoId = `${type}_${userId}_${Date.now()}`
    const filename = `${type}-photos/${userId}/${Date.now()}.${file.name.split('.').pop()}`
    
    // Convert file to blob for storage
    const blob = new Blob([file], { type: file.type })

    const photoData: PhotoData = {
      id: photoId,
      blob,
      filename,
      uploadedAt: new Date(),
      synced: false
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite')
      const store = transaction.objectStore('photos')
      const request = store.add(photoData)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        // Create a blob URL for immediate use
        const blobUrl = URL.createObjectURL(blob)
        resolve(blobUrl)
      }
    })
  }

  async uploadToFirebaseStorage(photoId: string, userId: string): Promise<string | null> {
    if (!this.db) {
      await this.initDatabase()
    }

    try {
      // Get photo from local storage
      const photoData = await this.getPhotoData(photoId)
      if (!photoData) {
        throw new Error('Photo not found in local storage')
      }

      // Upload to Firebase Storage
      const storageRef = ref(storage, photoData.filename)
      const snapshot = await uploadBytes(storageRef, photoData.blob)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update local record with Firebase URL
      await this.updatePhotoRecord(photoId, {
        firebaseUrl: downloadURL,
        synced: true
      })

      return downloadURL
    } catch (error) {
      console.error('Failed to upload photo to Firebase:', error)
      return null
    }
  }

  async getPhotoData(photoId: string): Promise<PhotoData | null> {
    if (!this.db) {
      await this.initDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly')
      const store = transaction.objectStore('photos')
      const request = store.get(photoId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async updatePhotoRecord(photoId: string, updates: Partial<PhotoData>): Promise<void> {
    if (!this.db) {
      await this.initDatabase()
    }

    const photoData = await this.getPhotoData(photoId)
    if (!photoData) {
      throw new Error('Photo not found')
    }

    const updatedData = { ...photoData, ...updates }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite')
      const store = transaction.objectStore('photos')
      const request = store.put(updatedData)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPhotoUrl(photoId: string): Promise<string | null> {
    const photoData = await this.getPhotoData(photoId)
    if (!photoData) return null

    // Prefer Firebase URL if available and synced
    if (photoData.synced && photoData.firebaseUrl) {
      return photoData.firebaseUrl
    }

    // Otherwise return blob URL
    return URL.createObjectURL(photoData.blob)
  }

  async savePhotoWithFallback(file: File, userId: string, type: 'child' | 'profile' = 'child'): Promise<{
    photoId: string
    localUrl: string
    firebaseUrl?: string
  }> {
    // First, store locally for immediate use
    const localUrl = await this.storePhotoLocally(file, userId, type)
    const photoId = `${type}_${userId}_${Date.now()}`

    let firebaseUrl: string | undefined

    // Try to upload to Firebase if online
    if (navigator.onLine) {
      try {
        firebaseUrl = await this.uploadToFirebaseStorage(photoId, userId) || undefined
      } catch (error) {
        console.log('Firebase upload failed, will retry later:', error)
      }
    }

    return {
      photoId,
      localUrl,
      firebaseUrl
    }
  }

  async syncPendingPhotos(userId: string): Promise<void> {
    if (!this.db || !navigator.onLine) return

    // Get all unsynced photos
    const unsyncedPhotos = await this.getUnsyncedPhotos()
    
    for (const photo of unsyncedPhotos) {
      try {
        await this.uploadToFirebaseStorage(photo.id, userId)
        console.log(`Successfully synced photo: ${photo.id}`)
      } catch (error) {
        console.error(`Failed to sync photo ${photo.id}:`, error)
      }
    }
  }

  private async getUnsyncedPhotos(): Promise<PhotoData[]> {
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly')
      const store = transaction.objectStore('photos')
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async deletePhoto(photoId: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite')
      const store = transaction.objectStore('photos')
      const request = store.delete(photoId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

// Export singleton instance
export const offlinePhotoService = new OfflinePhotoService()

// Initialize on import
offlinePhotoService.initDatabase().catch(console.error)

export default offlinePhotoService