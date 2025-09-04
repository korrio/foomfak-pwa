import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from '../firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export const notificationService = {
  // Request notification permission and get FCM token
  async requestPermission(): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('Firebase messaging not supported')
        return null
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // Add your VAPID key here
      })

      return token
    } catch (error) {
      console.error('Failed to get FCM token:', error)
      return null
    }
  },

  // Save FCM token to user document
  async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        lastTokenUpdate: new Date()
      })
    } catch (error) {
      console.error('Failed to save FCM token:', error)
    }
  },

  // Setup foreground message listener
  setupForegroundListener(callback: (payload: any) => void): () => void {
    if (!messaging) {
      return () => {}
    }

    return onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload)
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'ฟูมฟัก', {
          body: payload.notification?.body,
          icon: '/logo.png',
          badge: '/logo.png'
        })
      }
      
      callback(payload)
    })
  },

  // Show local notification
  showLocalNotification(title: string, body: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      })
    }
  },

  // Send activity completion notification
  notifyActivityComplete(activityName: string, points: number): void {
    this.showLocalNotification(
      'กิจกรรมเสร็จสิ้น! 🎉',
      `คุณได้รับ ${points} แต้มจากการ${activityName}`,
      {
        tag: 'activity-complete',
        requireInteraction: true
      }
    )
  },

  // Send daily reminder
  sendDailyReminder(): void {
    this.showLocalNotification(
      'อย่าลืมบันทึกกิจกรรมวันนี้! 📝',
      'มาสร้างความทรงจำดีๆ กับลูกน้อยกันเถอะ',
      {
        tag: 'daily-reminder',
        actions: [
          {
            action: 'record',
            title: 'บันทึกเลย'
          }
        ]
      }
    )
  }
}