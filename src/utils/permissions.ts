export interface PermissionStatus {
  granted: boolean
  denied: boolean
  prompt: boolean
}

export const requestNotificationPermission = async (): Promise<PermissionStatus> => {
  if (!('Notification' in window)) {
    return { granted: false, denied: true, prompt: false }
  }

  if (Notification.permission === 'granted') {
    return { granted: true, denied: false, prompt: false }
  }

  if (Notification.permission === 'denied') {
    return { granted: false, denied: true, prompt: false }
  }

  try {
    const permission = await Notification.requestPermission()
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      prompt: permission === 'default'
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return { granted: false, denied: true, prompt: false }
  }
}

export const requestCameraPermission = async (): Promise<PermissionStatus> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())
    return { granted: true, denied: false, prompt: false }
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return { granted: false, denied: true, prompt: false }
    }
    return { granted: false, denied: false, prompt: true }
  }
}

export const requestMicrophonePermission = async (): Promise<PermissionStatus> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    return { granted: true, denied: false, prompt: false }
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return { granted: false, denied: true, prompt: false }
    }
    return { granted: false, denied: false, prompt: true }
  }
}

export const requestAllPermissions = async () => {
  const results = await Promise.all([
    requestNotificationPermission(),
    requestCameraPermission(),
    requestMicrophonePermission()
  ])

  return {
    notifications: results[0],
    camera: results[1],
    microphone: results[2]
  }
}

export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    })
  }
  return null
}