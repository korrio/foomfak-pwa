import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { Activity, ActivityType } from '../types'

export interface ActivityData {
  userId: string
  type: ActivityType
  title: string
  description: string
  duration: number
  points: number
  mediaUrl?: string
  location?: string
  status: 'completed' | 'in_progress' | 'verified'
}

export const activityService = {
  // Create new activity
  async createActivity(activityData: ActivityData): Promise<string> {
    const docRef = await addDoc(collection(db, 'activities'), {
      ...activityData,
      timestamp: serverTimestamp()
    })
    return docRef.id
  },

  // Get user activities
  async getUserActivities(userId: string): Promise<Activity[]> {
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })) as Activity[]
  },

  // Upload media file
  async uploadMedia(file: Blob, userId: string, activityId: string): Promise<string> {
    const fileExtension = file.type.includes('video') ? 'webm' : 'wav'
    const fileName = `activities/${userId}/${activityId}.${fileExtension}`
    const storageRef = ref(storage, fileName)
    
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  },

  // Update activity with media URL
  async updateActivityMedia(activityId: string, mediaUrl: string): Promise<void> {
    await updateDoc(doc(db, 'activities', activityId), {
      mediaUrl
    })
  },

  // Complete activity with media
  async completeActivityWithMedia(
    activityData: ActivityData, 
    mediaFile?: Blob
  ): Promise<Activity> {
    // Create activity first
    const activityId = await this.createActivity(activityData)
    
    let mediaUrl: string | undefined
    
    // Upload media if provided
    if (mediaFile) {
      try {
        mediaUrl = await this.uploadMedia(mediaFile, activityData.userId, activityId)
        await this.updateActivityMedia(activityId, mediaUrl)
      } catch (error) {
        console.error('Failed to upload media:', error)
        // Continue without media if upload fails
      }
    }

    return {
      id: activityId,
      ...activityData,
      mediaUrl,
      timestamp: new Date()
    } as Activity
  }
}