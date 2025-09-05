// User types
export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  lastLoginAt: Date
  isOnline?: boolean
}

// Connection status types
export type ConnectionStatus = 'online' | 'offline' | 'syncing'

// Notification types
export interface NotificationData {
  id: string
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  timestamp: Date
  read: boolean
}

export interface NotificationPermissionState {
  granted: boolean
  denied: boolean
  default: boolean
  supported: boolean
}

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Offline storage types
export interface OfflineData {
  id: string
  type: string
  data: any
  timestamp: Date
  synced: boolean
  userId: string
}