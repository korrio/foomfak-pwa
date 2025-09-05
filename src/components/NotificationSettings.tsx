import { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Target, Flame, Settings, X } from 'lucide-react';
import { notificationService, NotificationSchedule, NotificationPermissionState } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    granted: false,
    denied: false,
    default: true
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<NotificationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Notification preferences
  const [preferences, setPreferences] = useState({
    dailyCheckIn: true,
    activityReminders: true,
    assessmentReminders: true,
    streakReminders: true,
    checkInTime: '09:00',
    activityTime: '18:00'
  });

  useEffect(() => {
    initializeNotifications();
    loadPreferences();
  }, [currentUser]);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      const status = notificationService.getPermissionStatus();
      setPermissionState(status);
      
      if (currentUser && status.granted) {
        const notifications = await notificationService.getScheduledNotifications(currentUser.uid);
        setScheduledNotifications(notifications);
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = () => {
    const stored = localStorage.getItem('notificationPreferences');
    if (stored) {
      setPreferences(JSON.parse(stored));
    }
  };

  const savePreferences = (newPreferences: typeof preferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
  };

  const requestPermission = async () => {
    try {
      const newStatus = await notificationService.requestPermission();
      setPermissionState(newStatus);
      
      if (newStatus.granted && currentUser) {
        await setupNotifications();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const setupNotifications = async () => {
    if (!currentUser) return;

    try {
      // Cancel existing notifications
      await notificationService.cancelAllNotifications(currentUser.uid);

      // Setup new notifications based on preferences
      if (preferences.dailyCheckIn) {
        const checkInTime = new Date();
        const [hours, minutes] = preferences.checkInTime.split(':').map(Number);
        checkInTime.setHours(hours, minutes, 0, 0);
        
        if (checkInTime <= new Date()) {
          checkInTime.setDate(checkInTime.getDate() + 1);
        }
        
        await notificationService.scheduleDailyCheckIn(currentUser.uid, checkInTime);
      }

      if (preferences.activityReminders) {
        const activityTime = new Date();
        const [hours, minutes] = preferences.activityTime.split(':').map(Number);
        activityTime.setHours(hours, minutes, 0, 0);
        
        if (activityTime <= new Date()) {
          activityTime.setDate(activityTime.getDate() + 1);
        }
        
        await notificationService.scheduleActivityReminder(currentUser.uid, activityTime);
      }

      // Refresh scheduled notifications list
      const notifications = await notificationService.getScheduledNotifications(currentUser.uid);
      setScheduledNotifications(notifications);
      
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  };

  const togglePreference = async (key: keyof typeof preferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
    
    if (permissionState.granted && currentUser) {
      await setupNotifications();
    }
  };

  const formatNotificationType = (type: NotificationSchedule['type']) => {
    switch (type) {
      case 'daily_check':
        return { icon: Calendar, label: 'เช็คอินรายวัน', color: 'text-blue-600' };
      case 'activity_reminder':
        return { icon: Target, label: 'แจ้งเตือนกิจกรรม', color: 'text-green-600' };
      case 'assessment_reminder':
        return { icon: Settings, label: 'แจ้งเตือนประเมินผล', color: 'text-purple-600' };
      case 'streak_reminder':
        return { icon: Flame, label: 'แจ้งเตือนสตรีค', color: 'text-orange-600' };
      default:
        return { icon: Bell, label: 'การแจ้งเตือน', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden max-h-screen relative">
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      )}
      
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">การแจ้งเตือน</h2>
            <p className="text-blue-100 text-sm">จัดการการแจ้งเตือนของคุณ</p>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-y-auto max-h-96">
        {/* Permission Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">สถานะการอนุญาต</h3>
          {!permissionState.granted ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <Bell className="w-5 h-5" />
                <span className="font-medium">ยังไม่ได้เปิดการแจ้งเตือน</span>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                เปิดการแจ้งเตือนเพื่อรับการแจ้งเตือนกิจกรรมและการเช็คอิน
              </p>
              <button
                onClick={requestPermission}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                disabled={permissionState.denied}
              >
                {permissionState.denied ? 'การแจ้งเตือนถูกปฏิเสธ' : 'เปิดการแจ้งเตือน'}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800">
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">การแจ้งเตือนเปิดใช้งานแล้ว</span>
                </div>
                <button
                  onClick={() => currentUser && notificationService.sendTestNotification(currentUser.uid)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  ทดสอบ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        {permissionState.granted && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">ตั้งค่าการแจ้งเตือน</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>เช็คอินรายวัน</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.dailyCheckIn}
                      onChange={(e) => togglePreference('dailyCheckIn', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {preferences.dailyCheckIn && (
                  <div className="ml-8">
                    <label className="block text-sm text-gray-600 mb-1">เวลาเช็คอิน</label>
                    <input
                      type="time"
                      value={preferences.checkInTime}
                      onChange={(e) => togglePreference('checkInTime', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-green-600" />
                    <span>แจ้งเตือนกิจกรรม</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.activityReminders}
                      onChange={(e) => togglePreference('activityReminders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {preferences.activityReminders && (
                  <div className="ml-8">
                    <label className="block text-sm text-gray-600 mb-1">เวลาแจ้งเตือน</label>
                    <input
                      type="time"
                      value={preferences.activityTime}
                      onChange={(e) => togglePreference('activityTime', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <span>แจ้งเตือนประเมินผล</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.assessmentReminders}
                      onChange={(e) => togglePreference('assessmentReminders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Flame className="w-5 h-5 text-orange-600" />
                    <span>แจ้งเตือนสตรีค</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.streakReminders}
                      onChange={(e) => togglePreference('streakReminders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Scheduled Notifications */}
            {scheduledNotifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">การแจ้งเตือนที่จัดตารางไว้</h3>
                <div className="space-y-2">
                  {scheduledNotifications.map((notification) => {
                    const { icon: Icon, label, color } = formatNotificationType(notification.type);
                    return (
                      <div key={notification.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{label}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(notification.scheduledTime).toLocaleString('th-TH')}
                          </div>
                        </div>
                        {notification.recurring && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {notification.recurring === 'daily' ? 'รายวัน' : 'รายสัปดาห์'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;