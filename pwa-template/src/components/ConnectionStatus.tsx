import React from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useConnectionStatus } from '../hooks/useConnectionStatus'

const ConnectionStatus: React.FC = () => {
  const { connectionStatus } = useConnectionStatus()

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          text: 'Online',
          icon: Wifi,
          color: 'text-green-500',
          bgColor: 'bg-green-500'
        }
      case 'offline':
        return {
          text: 'Offline',
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-500'
        }
      case 'syncing':
        return {
          text: 'Syncing',
          icon: RefreshCw,
          color: 'text-blue-500 animate-spin',
          bgColor: 'bg-blue-500'
        }
      default:
        return {
          text: 'Online',
          icon: Wifi,
          color: 'text-green-500',
          bgColor: 'bg-green-500'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const IconComponent = statusInfo.icon

  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-1 ${statusInfo.bgColor}`} />
      <p className={`text-xs ${statusInfo.color}`}>
        {statusInfo.text}
      </p>
    </div>
  )
}

export default ConnectionStatus