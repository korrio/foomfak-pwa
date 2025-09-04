import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from '../firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

interface NotificationSchedule {
  id: string;
  title: string;
  body: string;
  scheduledTime: number; // timestamp
  type: 'activity_reminder' | 'daily_check' | 'assessment_reminder' | 'streak_reminder';
  data?: Record<string, any>;
  recurring?: 'daily' | 'weekly';
  isActive: boolean;
  userId: string;
}

interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private scheduledNotifications: Map<string, NotificationSchedule> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      await this.loadScheduledNotifications();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Legacy FCM methods (keeping for backward compatibility)
  async requestFCMPermission(): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('Firebase messaging not supported')
        return null
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // Add your VAPID key here
      })

      return token
    } catch (error) {
      console.error('Failed to get FCM token:', error)
      return null
    }
  }

  async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        lastTokenUpdate: new Date()
      })
    } catch (error) {
      console.error('Failed to save FCM token:', error)
    }
  }

  setupForegroundListener(callback: (payload: any) => void): () => void {
    if (!messaging) {
      return () => {}
    }

    return onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload)
      
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'ฟูมฟัก', {
          body: payload.notification?.body,
          icon: '/logo.png',
          badge: '/logo.png'
        })
      }
      
      callback(payload)
    })
  }

  // Enhanced notification scheduling methods
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  getPermissionStatus(): NotificationPermissionState {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  async scheduleNotification(notification: Omit<NotificationSchedule, 'id' | 'isActive'>): Promise<string> {
    const permissionState = this.getPermissionStatus();
    if (!permissionState.granted) {
      const newPermission = await this.requestPermission();
      if (!newPermission.granted) {
        throw new Error('Notification permission not granted');
      }
    }

    const id = this.generateNotificationId();
    const scheduleData: NotificationSchedule = {
      ...notification,
      id,
      isActive: true
    };

    this.scheduledNotifications.set(id, scheduleData);
    await this.saveScheduledNotifications();
    await this.scheduleSystemNotification(scheduleData);

    return id;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    const notification = this.scheduledNotifications.get(notificationId);
    if (notification) {
      notification.isActive = false;
      this.scheduledNotifications.set(notificationId, notification);
      await this.saveScheduledNotifications();
      
      // Clear timeout if exists
      const timeout = this.timeouts.get(notificationId);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(notificationId);
      }
    }
  }

  async cancelAllNotifications(userId: string): Promise<void> {
    for (const [id, notification] of this.scheduledNotifications) {
      if (notification.userId === userId) {
        await this.cancelNotification(id);
      }
    }
  }

  async scheduleActivityReminder(userId: string, reminderTime: Date, activityType?: string): Promise<string> {
    const title = 'เวลากิจกรรมแล้วค่ะ! 🎯';
    const body = activityType 
      ? `ถึงเวลาทำกิจกรรม "${activityType}" กับลูกแล้วค่ะ`
      : 'ถึงเวลาทำกิจกรรมกับลูกแล้วค่ะ มาสร้างความทรงจำดีๆ กันเถอะ!';

    return this.scheduleNotification({
      title,
      body,
      scheduledTime: reminderTime.getTime(),
      type: 'activity_reminder',
      data: { activityType },
      userId
    });
  }

  async scheduleDailyCheckIn(userId: string, checkInTime: Date): Promise<string> {
    const title = 'เช็คอินรายวันค่ะ! 📝';
    const body = 'มาดูความก้าวหน้าของคุณและทำกิจกรรมใหม่ๆ กันเถอะ!';

    return this.scheduleNotification({
      title,
      body,
      scheduledTime: checkInTime.getTime(),
      type: 'daily_check',
      recurring: 'daily',
      userId
    });
  }

  async scheduleAssessmentReminder(userId: string, reminderTime: Date, assessmentType: string): Promise<string> {
    const title = 'เวลาประเมินผลแล้วค่ะ! 📊';
    const body = `ถึงเวลาทำแบบประเมิน "${assessmentType}" เพื่อติดตามความก้าวหน้าของคุณ`;

    return this.scheduleNotification({
      title,
      body,
      scheduledTime: reminderTime.getTime(),
      type: 'assessment_reminder',
      data: { assessmentType },
      userId
    });
  }

  async scheduleStreakReminder(userId: string, currentStreak: number): Promise<string> {
    const reminderTime = new Date();
    reminderTime.setHours(19, 0, 0, 0); // 7 PM reminder
    
    const title = `อย่าให้เสียสตรีค ${currentStreak} วันนะคะ! 🔥`;
    const body = 'มาทำกิจกรรมเพื่อรักษาสตรีคของคุณให้ยาวนานที่สุด!';

    return this.scheduleNotification({
      title,
      body,
      scheduledTime: reminderTime.getTime(),
      type: 'streak_reminder',
      data: { currentStreak },
      recurring: 'daily',
      userId
    });
  }

  async getScheduledNotifications(userId: string): Promise<NotificationSchedule[]> {
    return Array.from(this.scheduledNotifications.values())
      .filter(notification => notification.userId === userId && notification.isActive);
  }

  // Legacy methods (keeping for backward compatibility)
  showLocalNotification(title: string, body: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      })
    }
  }

  notifyActivityComplete(activityName: string, points: number): void {
    this.showLocalNotification(
      'กิจกรรมเสร็จสิ้น! 🎉',
      `คุณได้รับ ${points} แต้มจากการ${activityName}`,
      {
        tag: 'activity-complete',
        requireInteraction: true
      }
    )
  }

  sendDailyReminder(): void {
    this.showLocalNotification(
      'อย่าลืมบันทึกกิจกรรมวันนี้! 📝',
      'มาสร้างความทรงจำดีๆ กับลูกน้อยกันเถอะ',
      {
        tag: 'daily-reminder',
        actions: [
          {
            action: 'record',
            title: 'บันทึกเลย'
          }
        ]
      }
    )
  }

  // Helper method to set up default notification schedule for a user
  async setupDefaultNotifications(userId: string): Promise<void> {
    const permissionState = await this.requestPermission();
    if (!permissionState.granted) {
      console.log('Notification permission not granted, skipping default setup');
      return;
    }

    try {
      // Cancel existing notifications for this user first
      await this.cancelAllNotifications(userId);

      // Daily check-in at 9 AM
      const checkInTime = new Date();
      checkInTime.setHours(9, 0, 0, 0);
      if (checkInTime <= new Date()) {
        checkInTime.setDate(checkInTime.getDate() + 1);
      }
      await this.scheduleDailyCheckIn(userId, checkInTime);

      // Evening activity reminder at 6 PM
      const activityTime = new Date();
      activityTime.setHours(18, 0, 0, 0);
      if (activityTime <= new Date()) {
        activityTime.setDate(activityTime.getDate() + 1);
      }
      await this.scheduleActivityReminder(userId, activityTime);

      console.log('Default notifications scheduled successfully');
    } catch (error) {
      console.error('Failed to setup default notifications:', error);
    }
  }

  // Test method for immediate notification (for development/testing)
  async sendTestNotification(userId: string): Promise<void> {
    const permissionState = this.getPermissionStatus();
    if (!permissionState.granted) {
      await this.requestPermission();
    }

    this.showLocalNotification(
      'ทดสอบการแจ้งเตือน! 🧪',
      'นี่คือการแจ้งเตือนทดสอบ ระบบแจ้งเตือนทำงานได้ปกติ',
      {
        tag: 'test-notification',
        requireInteraction: true
      }
    );
  }

  private async scheduleSystemNotification(notification: NotificationSchedule): Promise<void> {
    const now = Date.now();
    const delay = notification.scheduledTime - now;

    if (delay <= 0) {
      // Show immediately if time has passed
      await this.showNotification(notification);
      return;
    }

    // Schedule using setTimeout
    const timeoutId = setTimeout(async () => {
      await this.showNotification(notification);
      this.timeouts.delete(notification.id);
      
      // Handle recurring notifications
      if (notification.recurring) {
        await this.scheduleRecurringNotification(notification);
      }
    }, delay);

    this.timeouts.set(notification.id, timeoutId);
  }

  private async showNotification(notification: NotificationSchedule): Promise<void> {
    if (!this.registration) {
      // Fallback to regular notification if no service worker
      this.showLocalNotification(notification.title, notification.body, {
        tag: notification.id,
        data: notification.data
      });
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: notification.body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: {
        ...notification.data,
        notificationId: notification.id,
        type: notification.type,
        url: '/'
      },
      actions: [
        {
          action: 'open_app',
          title: 'เปิดแอป'
        },
        {
          action: 'dismiss',
          title: 'ปิด'
        }
      ],
      tag: notification.id,
      renotify: true,
      requireInteraction: false,
      silent: false
    };

    try {
      await this.registration.showNotification(notification.title, notificationOptions);
    } catch (error) {
      console.error('Failed to show notification:', error);
      // Fallback to regular notification
      this.showLocalNotification(notification.title, notification.body);
    }
  }

  private async scheduleRecurringNotification(notification: NotificationSchedule): Promise<void> {
    if (!notification.recurring) return;

    const nextTime = new Date(notification.scheduledTime);
    
    if (notification.recurring === 'daily') {
      nextTime.setDate(nextTime.getDate() + 1);
    } else if (notification.recurring === 'weekly') {
      nextTime.setDate(nextTime.getDate() + 7);
    }

    const newNotification: NotificationSchedule = {
      ...notification,
      id: this.generateNotificationId(),
      scheduledTime: nextTime.getTime()
    };

    this.scheduledNotifications.set(newNotification.id, newNotification);
    await this.saveScheduledNotifications();
    await this.scheduleSystemNotification(newNotification);
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = localStorage.getItem('scheduledNotifications');
      if (stored) {
        const notifications = JSON.parse(stored) as NotificationSchedule[];
        notifications.forEach(notification => {
          this.scheduledNotifications.set(notification.id, notification);
          
          // Reschedule active notifications that are still in the future
          if (notification.isActive && notification.scheduledTime > Date.now()) {
            this.scheduleSystemNotification(notification);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.scheduledNotifications.values());
      localStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
export type { NotificationSchedule, NotificationPermissionState };