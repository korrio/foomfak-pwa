import { useState, useEffect } from 'react'
import { ConnectionStatus } from '../types'

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    navigator.onLine ? 'online' : 'offline'
  )
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setConnectionStatus('online')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial status
    setIsOnline(navigator.onLine)
    setConnectionStatus(navigator.onLine ? 'online' : 'offline')

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const setToSyncing = () => {
    setConnectionStatus('syncing')
  }

  const resetToOnlineStatus = () => {
    setConnectionStatus(isOnline ? 'online' : 'offline')
  }

  return {
    connectionStatus,
    isOnline,
    setToSyncing,
    resetToOnlineStatus
  }
}