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
import { activityTemplates } from '../data/activities'

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
  // Calculate points based on official criteria
  calculatePoints(activityId: string, durationInSeconds: number, userId: string): number {
    const template = activityTemplates.find(t => t.id === activityId)
    if (!template) return 0

    // Official point calculation rules (แรกเกิด – 6 ขวบ)
    switch (activityId) {
      case 'reading_story': // อ่านนิทานให้ลูกฟัง
        // อ่านอย่างน้อย 5 นาที นาทีละ 1 คะแนน
        // วันละไม่เกิน 15 นาที (15 คะแนน)
        if (durationInSeconds < 5 * 60) return 0 // ต้องอ่านอย่างน้อย 5 นาที
        const readingMinutes = Math.floor(durationInSeconds / 60)
        return Math.min(readingMinutes, 15)
      
      case 'hugging': // กอดลูกอย่างน้อย 5 วินาที
        // อย่างน้อย 2 ครั้ง/วัน = 5 คะแนน (นับแต้มวันละ 1 ครั้ง)
        if (durationInSeconds < 5) return 0 // ต้องกอดอย่างน้อย 5 วินาที
        return 5 // ได้ 5 คะแนนเต็ม (วันละครั้ง)
      
      case 'playing_together': // เล่นกับลูก/วาดรูป/ระบายสีกับลูก
      case 'drawing': 
      case 'coloring':
        // อย่างน้อย 5 นาที นาทีละ 1 คะแนน
        // วันละไม่เกิน 15 นาที (15 คะแนน)
        if (durationInSeconds < 5 * 60) return 0 // ต้องทำอย่างน้อย 5 นาที
        const playingMinutes = Math.floor(durationInSeconds / 60)
        return Math.min(playingMinutes, 15)
      
      default: // For other activities, use template points
        return template.points
    }
  },

  // Check daily limits for core activities
  async checkDailyLimit(userId: string, activityId: string): Promise<{ canEarn: boolean; remainingPoints: number }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Query today's activities for this user and activity type
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      where('type', '==', activityTemplates.find(t => t.id === activityId)?.type || ''),
      where('timestamp', '>=', today),
      where('timestamp', '<', tomorrow)
    )
    
    const querySnapshot = await getDocs(q)
    const todayActivities = querySnapshot.docs.map(doc => doc.data())

    // Calculate points earned today for this activity type
    let pointsEarnedToday = 0
    todayActivities.forEach(activity => {
      if (activity.type === 'reading' && activityId === 'reading_story') {
        pointsEarnedToday += activity.points || 0
      } else if (activity.type === 'playing' && activityId === 'playing_together') {
        pointsEarnedToday += activity.points || 0
      } else if (activity.type === 'affection' && activityId === 'hugging') {
        pointsEarnedToday = 5 // Already earned today
      }
    })

    // Check limits
    const dailyLimits = {
      'reading_story': 15,
      'playing_together': 15, 
      'hugging': 5
    }

    const limit = dailyLimits[activityId as keyof typeof dailyLimits] || 999
    const canEarn = pointsEarnedToday < limit
    const remainingPoints = Math.max(0, limit - pointsEarnedToday)

    return { canEarn, remainingPoints }
  },

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

  // Upload multiple files (photos/videos)
  async uploadMultipleFiles(files: File[], userId: string, activityId: string): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const fileName = `activities/${userId}/${activityId}_${index}.${fileExtension}`
      const storageRef = ref(storage, fileName)
      
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    })

    try {
      const urls = await Promise.all(uploadPromises)
      return urls
    } catch (error) {
      console.error('Failed to upload some files:', error)
      // Try to upload individually and return successful ones
      const results: string[] = []
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i]
          const fileExtension = file.name.split('.').pop() || 'jpg'
          const fileName = `activities/${userId}/${activityId}_${i}.${fileExtension}`
          const storageRef = ref(storage, fileName)
          
          const snapshot = await uploadBytes(storageRef, file)
          const downloadURL = await getDownloadURL(snapshot.ref)
          results.push(downloadURL)
        } catch (fileError) {
          console.error(`Failed to upload file ${files[i].name}:`, fileError)
        }
      }
      return results
    }
  },

  // Update activity with media URL
  async updateActivityMedia(activityId: string, mediaUrl: string): Promise<void> {
    await updateDoc(doc(db, 'activities', activityId), {
      mediaUrl
    })
  },

  // Update activity with multiple media URLs
  async updateActivityMultipleMedia(activityId: string, mediaUrls: string[], recordedMediaUrl?: string): Promise<void> {
    const updateData: any = {}
    
    if (recordedMediaUrl) {
      updateData.mediaUrl = recordedMediaUrl
    }
    
    if (mediaUrls.length > 0) {
      updateData.uploadedFiles = mediaUrls
    }

    await updateDoc(doc(db, 'activities', activityId), updateData)
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
  },

  // Complete activity with media and uploaded files
  async completeActivityWithFiles(
    activityData: ActivityData, 
    mediaFile?: Blob,
    uploadedFiles?: File[]
  ): Promise<Activity> {
    // Create activity first
    const activityId = await this.createActivity(activityData)
    
    let mediaUrl: string | undefined
    let uploadedFileUrls: string[] = []
    
    // Upload recorded media if provided
    if (mediaFile) {
      try {
        mediaUrl = await this.uploadMedia(mediaFile, activityData.userId, activityId)
      } catch (error) {
        console.error('Failed to upload recorded media:', error)
      }
    }

    // Upload additional files if provided
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        uploadedFileUrls = await this.uploadMultipleFiles(uploadedFiles, activityData.userId, activityId)
      } catch (error) {
        console.error('Failed to upload files:', error)
      }
    }

    // Update activity with all media URLs
    if (mediaUrl || uploadedFileUrls.length > 0) {
      await this.updateActivityMultipleMedia(activityId, uploadedFileUrls, mediaUrl)
    }

    return {
      id: activityId,
      ...activityData,
      mediaUrl,
      uploadedFiles: uploadedFileUrls,
      timestamp: new Date()
    } as Activity
  }
}