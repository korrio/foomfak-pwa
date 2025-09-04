/**
 * App Version and Update Management Service
 * Handles version checking and PWA updates
 */

import packageJson from '../../package.json'

export interface VersionInfo {
  current: string
  latest?: string
  hasUpdate: boolean
  updateAvailable: boolean
}

class VersionService {
  private currentVersion: string = packageJson.version
  private updateAvailable: boolean = false
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.initServiceWorker()
  }

  /**
   * Initialize service worker for updates
   */
  private async initServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Get existing registration
        const registration = await navigator.serviceWorker.ready
        this.serviceWorkerRegistration = registration

        // Listen for update available
        registration.addEventListener('updatefound', () => {
          console.log('🔄 New version found, installing...')
          const newWorker = registration.installing

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version is available
                console.log('✅ New version ready to install')
                this.updateAvailable = true
                this.notifyUpdateAvailable()
              }
            })
          }
        })

        // Listen for controlling service worker change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 New version activated, reloading...')
          window.location.reload()
        })

      } catch (error) {
        console.error('Service worker initialization failed:', error)
      }
    }
  }

  /**
   * Check for app updates
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      console.log('❌ Service worker not available')
      return false
    }

    try {
      console.log('🔍 Checking for updates...')
      await this.serviceWorkerRegistration.update()
      return this.updateAvailable
    } catch (error) {
      console.error('Update check failed:', error)
      return false
    }
  }

  /**
   * Apply available update
   */
  async applyUpdate(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not available')
    }

    if (!this.updateAvailable) {
      throw new Error('No update available')
    }

    try {
      console.log('📦 Applying update...')
      
      // Tell the waiting service worker to skip waiting and take control
      if (this.serviceWorkerRegistration.waiting) {
        this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }

      // Force reload will happen automatically via controllerchange event
    } catch (error) {
      console.error('Failed to apply update:', error)
      throw error
    }
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return this.currentVersion
  }

  /**
   * Get version info
   */
  getVersionInfo(): VersionInfo {
    return {
      current: this.currentVersion,
      hasUpdate: this.updateAvailable,
      updateAvailable: this.updateAvailable
    }
  }

  /**
   * Check if update is available
   */
  isUpdateAvailable(): boolean {
    return this.updateAvailable
  }

  /**
   * Notify listeners about update availability
   */
  private notifyUpdateAvailable(): void {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('app-update-available', {
      detail: {
        version: this.currentVersion,
        updateAvailable: true
      }
    }))
  }

  /**
   * Force check for updates (manual refresh)
   */
  async forceUpdateCheck(): Promise<boolean> {
    console.log('🔄 Force checking for updates...')
    
    // Clear cache and check for updates
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }

    return await this.checkForUpdate()
  }

  /**
   * Get build info
   */
  getBuildInfo(): {
    version: string
    buildTime: string
    environment: string
  } {
    return {
      version: this.currentVersion,
      buildTime: new Date().toISOString(), // In production, this would be set at build time
      environment: process.env.NODE_ENV || 'development'
    }
  }

  /**
   * Show update notification (can be customized)
   */
  showUpdateNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ฟูมฟัก - อัปเดตใหม่พร้อมใช้งาน', {
        body: 'มีเวอร์ชันใหม่ของแอป กดเพื่ือปรับปรุง',
        icon: '/logo.png',
        badge: '/logo.png'
      })
    }
  }

  /**
   * Format version for display
   */
  formatVersion(version: string): string {
    return `v${version}`
  }
}

// Export singleton instance
export const versionService = new VersionService()
export default versionService