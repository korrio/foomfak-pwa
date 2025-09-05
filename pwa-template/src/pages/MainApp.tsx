import React, { useState } from 'react'
import { 
  User, 
  Settings, 
  LogOut, 
  Home,
  Database,
  Wifi,
  Bell
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import ConnectionStatus from '../components/ConnectionStatus'
import NotificationButton from '../components/NotificationButton'
import LoadingSpinner from '../components/LoadingSpinner'

const MainApp: React.FC = () => {
  const { currentUser, userData, logout } = useAuth()
  const { showNotification } = useNotifications(currentUser?.uid)
  const { connectionStatus } = useConnectionStatus()
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'settings'>('home')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleTestNotification = async () => {
    await showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from your PWA!',
      icon: '/logo.png',
      tag: 'test'
    })
  }

  const renderHome = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to PWA Template!
        </h2>
        <p className="text-gray-600">
          Your offline-first progressive web application is ready to use.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Database className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Offline Ready</h3>
          <p className="text-sm text-gray-600">Works without internet</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Bell className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Push Notifications</h3>
          <p className="text-sm text-gray-600">Stay connected</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleTestNotification}
          className="w-full btn-primary"
        >
          Test Notification
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Connection Status:</p>
          <div className="flex items-center justify-center">
            <ConnectionStatus />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Template Features</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Firebase Authentication
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Offline-first IndexedDB Storage
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Push Notifications (FCM)
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            PWA with Service Worker
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Connection Status Monitoring
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            TypeScript + React + Tailwind CSS
          </li>
        </ul>
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {userData?.displayName || 'User'}
        </h2>
        <p className="text-gray-600">{userData?.email}</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Profile Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{userData?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">User ID:</span>
            <span className="font-mono text-xs">{currentUser?.uid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Account Created:</span>
            <span className="text-sm">
              {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`text-sm font-medium ${userData?.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {userData?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Settings</h2>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Push Notifications</span>
          <NotificationButton />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Connection</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status</span>
            <ConnectionStatus />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Browser Support</span>
            <span className="text-sm text-green-600">
              {'serviceWorker' in navigator ? '✓ PWA Ready' : '✗ Not Supported'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Storage</h3>
        <p className="text-sm text-gray-600">
          This app uses IndexedDB for offline storage and Firebase for cloud sync.
        </p>
      </div>

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full btn-secondary flex items-center justify-center text-red-600 hover:bg-red-50"
      >
        {isLoggingOut ? (
          <LoadingSpinner size="sm" color="secondary" className="mr-2" />
        ) : (
          <LogOut className="w-4 h-4 mr-2" />
        )}
        {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">PWA Template</h1>
              <ConnectionStatus />
            </div>
            <div className="flex items-center space-x-2">
              <NotificationButton />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-responsive py-6">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="container-responsive">
          <div className="flex justify-around items-center py-2">
            {[
              { id: 'home', label: 'Home', icon: Home, color: 'text-primary-500' },
              { id: 'profile', label: 'Profile', icon: User, color: 'text-purple-500' },
              { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-500' }
            ].map((item) => {
              const isActive = activeTab === item.id
              const IconComponent = item.icon
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? `${item.color} bg-opacity-10` 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-all duration-200 ${
                    isActive ? `bg-current bg-opacity-10` : ''
                  }`}>
                    <IconComponent 
                      className={`w-6 h-6 transition-all duration-200 ${
                        isActive ? 'scale-110' : 'scale-100'
                      }`} 
                    />
                  </div>
                  <span className={`text-xs font-medium mt-1 transition-all duration-200 ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom padding to avoid navigation overlap */}
      <div className="h-20" />
    </div>
  )
}

export default MainApp