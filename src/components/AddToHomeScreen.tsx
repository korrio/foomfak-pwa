import React, { useState, useEffect } from 'react'
import { X, Download, Share, Plus, Home } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export const AddToHomeScreen: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosPrompt, setShowIosPrompt] = useState(false)
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Detect device type and standalone mode
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /ipad|iphone|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')

    setIsIos(isIosDevice)
    setIsAndroid(isAndroidDevice)
    setIsStandalone(isInStandaloneMode)

    // Check if already dismissed
    const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true'
    setDismissed(isDismissed)

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      if (!isDismissed && !isInStandaloneMode) {
        setShowAndroidPrompt(true)
      }
    }

    // Show iOS prompt if conditions are met
    if (isIosDevice && !isInStandaloneMode && !isDismissed) {
      // Delay showing iOS prompt to avoid immediate popup
      setTimeout(() => {
        setShowIosPrompt(true)
      }, 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return

    setShowAndroidPrompt(false)
    
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installed')
      } else {
        console.log('PWA installation dismissed')
      }
    } catch (error) {
      console.error('Error installing PWA:', error)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = (permanent: boolean = false) => {
    setShowAndroidPrompt(false)
    setShowIosPrompt(false)
    
    if (permanent) {
      localStorage.setItem('pwa-install-dismissed', 'true')
      setDismissed(true)
    }
  }

  // Don't show if already in standalone mode or dismissed
  if (isStandalone || dismissed) return null

  // Android Install Prompt
  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto">
        <div className="flex items-start">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Home className="w-5 h-5 mr-2" />
              <h3 className="font-semibold text-sm">ติดตั้งฟูมฟัก</h3>
            </div>
            <p className="text-xs opacity-90 mb-3">
              เพิ่มแอปลงในหน้าจอหลักเพื่อเข้าถึงง่ายและใช้งานแบบออฟไลน์
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleAndroidInstall}
                className="bg-white text-blue-600 px-3 py-1.5 rounded text-xs font-semibold flex items-center hover:bg-blue-50 transition-colors"
              >
                <Download className="w-3 h-3 mr-1" />
                ติดตั้ง
              </button>
              <button
                onClick={() => handleDismiss(false)}
                className="text-white text-xs px-3 py-1.5 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                ไว้ทีหลัง
              </button>
              <button
                onClick={() => handleDismiss(true)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // iOS Install Prompt
  if (showIosPrompt && isIos) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto">
        <div className="flex items-start">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Home className="w-5 h-5 mr-2" />
              <h3 className="font-semibold text-sm">เพิ่มลงหน้าจอหลัก</h3>
            </div>
            <p className="text-xs opacity-90 mb-3">
              ติดตั้งฟูมฟักในหน้าจอหลักเพื่อประสบการณ์การใช้งานที่ดีที่สุด
            </p>
            <div className="bg-white bg-opacity-20 p-3 rounded mb-3">
              <div className="flex items-center text-xs">
                <span className="mr-2">1.</span>
                <Share className="w-4 h-4 mr-1" />
                <span>แตะปุ่ม Share ด้านล่าง</span>
              </div>
              <div className="flex items-center text-xs mt-2">
                <span className="mr-2">2.</span>
                <div className="w-4 h-4 mr-1 border border-white rounded-sm flex items-center justify-center">
                  <Plus className="w-2 h-2" />
                </div>
                <span>เลือก "Add to Home Screen"</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDismiss(false)}
                className="bg-white text-blue-600 px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-50 transition-colors"
              >
                เข้าใจแล้ว
              </button>
              <button
                onClick={() => handleDismiss(true)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}