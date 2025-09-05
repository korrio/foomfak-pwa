import React, { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../contexts/AuthContext'

const NotificationButton: React.FC = () => {
  const { currentUser } = useAuth()
  const { permissionState, requestPermission, showNotification } = useNotifications(currentUser?.uid)
  const [requesting, setRequesting] = useState(false)

  const handleRequestPermission = async () => {
    setRequesting(true)
    try {
      const token = await requestPermission()
      if (token) {
        await showNotification({
          title: 'Notifications Enabled!',
          body: 'You will now receive push notifications.',
          icon: '/logo.png'
        })
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    } finally {
      setRequesting(false)
    }
  }

  if (!permissionState.supported) {
    return null
  }

  return (
    <button
      onClick={handleRequestPermission}
      disabled={requesting || permissionState.granted}
      className={`p-2 rounded-full transition-colors ${
        permissionState.granted
          ? 'text-green-600 bg-green-100'
          : permissionState.denied
          ? 'text-red-600 bg-red-100'
          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={
        permissionState.granted
          ? 'Notifications enabled'
          : permissionState.denied
          ? 'Notifications denied'
          : 'Enable notifications'
      }
    >
      {requesting ? (
        <div className="w-5 h-5 animate-spin border-2 border-current border-t-transparent rounded-full" />
      ) : permissionState.granted ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
    </button>
  )
}

export default NotificationButton