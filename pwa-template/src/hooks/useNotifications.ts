import { useState, useEffect } from 'react'
import { notificationService } from '../services/notificationService'
import { NotificationPermissionState } from '../types'

export const useNotifications = (userId?: string) => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    granted: false,
    denied: false,
    default: false,
    supported: false
  })
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkPermissionState()
  }, [])

  useEffect(() => {
    if (userId) {
      loadNotifications()
    }
  }, [userId])

  const checkPermissionState = async () => {
    const state = await notificationService.getPermissionState()
    setPermissionState(state)
  }

  const loadNotifications = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const userNotifications = await notificationService.getUserNotifications(userId)
      setNotifications(userNotifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPermission = async () => {
    try {
      const token = await notificationService.requestPermission()
      await checkPermissionState()
      
      if (token && userId) {
        await notificationService.saveFCMToken(userId, token)
      }
      
      return token
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return null
    }
  }

  const showNotification = async (options: {
    title: string
    body: string
    icon?: string
    tag?: string
    data?: any
  }) => {
    await notificationService.showNotification(options)
    
    if (userId) {
      await notificationService.storeNotificationLocally(userId, {
        title: options.title,
        body: options.body,
        data: options.data
      })
      await loadNotifications()
    }
  }

  const markAsRead = async (notificationId: string) => {
    await notificationService.markNotificationAsRead(notificationId)
    await loadNotifications()
  }

  const clearAll = async () => {
    if (!userId) return
    
    await notificationService.clearAllNotifications(userId)
    await loadNotifications()
  }

  const scheduleNotification = async (options: {
    title: string
    body: string
    delay: number
    tag?: string
    data?: any
  }) => {
    await notificationService.scheduleLocalNotification(options)
  }

  return {
    permissionState,
    notifications,
    loading,
    requestPermission,
    showNotification,
    markAsRead,
    clearAll,
    scheduleNotification,
    refresh: loadNotifications
  }
}