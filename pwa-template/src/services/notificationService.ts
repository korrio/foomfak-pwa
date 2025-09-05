/**
 * Notification Service
 * Handles push notifications, FCM tokens, and notification permissions
 */

import { getToken, onMessage, MessagePayload } from 'firebase/messaging'
import { messaging } from '../firebase/config'
import { offlineStorage } from './offlineStorageService'
import { NotificationPermissionState } from '../types'

class NotificationService {
  private vapidKey = 'your-vapid-key' // TODO: Replace with your VAPID key

  async initialize(): Promise<void> {
    if (!messaging) {
      console.log('Firebase Messaging not supported')
      return
    }

    try {
      await this.setupForegroundListener()
      console.log('Notification service initialized')
    } catch (error) {
      console.error('Failed to initialize notification service:', error)
    }
  }

  async requestPermission(): Promise<string | null> {
    if (!messaging || !('Notification' in window)) {
      console.log('Notifications not supported')
      return null
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: this.vapidKey
        })
        return token
      } else {
        console.log('Notification permission denied')
        return null
      }
    } catch (error) {
      console.error('Error getting notification permission:', error)
      return null
    }
  }

  async getPermissionState(): Promise<NotificationPermissionState> {
    const supported = 'Notification' in window
    
    if (!supported) {
      return {
        granted: false,
        denied: false,
        default: false,
        supported: false
      }
    }

    const permission = Notification.permission
    
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
      supported: true
    }
  }

  async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      // Store FCM token locally for offline-first approach
      localStorage.setItem(`fcm_token_${userId}`, token)
      localStorage.setItem(`fcm_token_updated_${userId}`, new Date().toISOString())
      
      // Mark for sync to backend when online
      if (!navigator.onLine) {
        localStorage.setItem(`fcm_token_pending_sync_${userId}`, 'true')
      }
    } catch (error) {
      console.error('Failed to save FCM token locally:', error)
    }
  }

  async setupForegroundListener(onMessageReceived?: (payload: MessagePayload) => void): Promise<void> {
    if (!messaging) return

    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      
      if (onMessageReceived) {
        onMessageReceived(payload)
      } else {
        // Default behavior: show browser notification
        this.showNotification({
          title: payload.notification?.title || 'New Notification',
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/logo.png',
          tag: payload.data?.tag || 'default',
          data: payload.data
        })
      }
    })
  }

  async showNotification(options: {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    data?: any
    actions?: NotificationAction[]
  }): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('Cannot show notification: permission not granted')
      return
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use service worker to show notification
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: options
        })
      } else {
        // Fallback to direct notification
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/logo.png',
          badge: options.badge,
          tag: options.tag,
          data: options.data
        })
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  async storeNotificationLocally(userId: string, notification: {
    title: string
    body: string
    data?: any
  }): Promise<void> {
    try {
      const notificationData = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        timestamp: new Date(),
        read: false,
        synced: false
      }

      await offlineStorage.create('notifications', notificationData)
    } catch (error) {
      console.error('Failed to store notification locally:', error)
    }
  }

  async getUserNotifications(userId: string, limit = 50): Promise<any[]> {
    try {
      return await offlineStorage.getByIndex('notifications', 'userId', userId, limit)
    } catch (error) {
      console.error('Failed to get user notifications:', error)
      return []
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notification = await offlineStorage.get('notifications', notificationId)
      if (notification) {
        notification.read = true
        await offlineStorage.update('notifications', notification)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Schedule local notifications (for offline usage)
  async scheduleLocalNotification(options: {
    title: string
    body: string
    delay: number // in milliseconds
    tag?: string
    data?: any
  }): Promise<void> {
    setTimeout(() => {
      this.showNotification({
        title: options.title,
        body: options.body,
        tag: options.tag,
        data: options.data
      })
    }, options.delay)
  }

  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId)
      for (const notification of notifications) {
        await offlineStorage.delete('notifications', notification.id)
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

export default notificationService