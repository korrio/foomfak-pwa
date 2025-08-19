import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ActivityRecorder } from '../components/ActivityRecorder'
import { activityService } from '../services/activityService'
import { notificationService } from '../services/notificationService'
import { Activity } from '../types'
import { 
  Play, 
  User, 
  Award, 
  History, 
  Settings, 
  Plus, 
  Star, 
  Trophy, 
  Zap,
  TestTube,
  LogOut,
  Bell,
  Calendar,
  TrendingUp
} from 'lucide-react'

const HomePage: React.FC = () => {
  const { currentUser, userData, logout, loading, updateUserData } = useAuth()
  const [showActivityRecorder, setShowActivityRecorder] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [notification, setNotification] = useState('')
  const [loadingActivities, setLoadingActivities] = useState(false)

  useEffect(() => {
    if (currentUser && userData) {
      loadUserActivities()
      setupNotifications()
    }
  }, [currentUser, userData])

  const loadUserActivities = async () => {
    if (!currentUser) return
    
    setLoadingActivities(true)
    try {
      const userActivities = await activityService.getUserActivities(currentUser.uid)
      setActivities(userActivities)
    } catch (error) {
      console.error('Failed to load activities:', error)
      showNotification('ไม่สามารถโหลดข้อมูลกิจกรรมได้')
    } finally {
      setLoadingActivities(false)
    }
  }

  const setupNotifications = async () => {
    if (!currentUser) return

    try {
      const fcmToken = await notificationService.requestPermission()
      if (fcmToken) {
        await notificationService.saveFCMToken(currentUser.uid, fcmToken)
      }

      // Setup foreground listener
      notificationService.setupForegroundListener((payload) => {
        showNotification(payload.notification?.body || 'ได้รับการแจ้งเตือนใหม่')
      })
    } catch (error) {
      console.error('Failed to setup notifications:', error)
    }
  }

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(''), 4000)
  }

  const handleActivityComplete = async (activityData: any) => {
    if (!currentUser || !userData) return

    try {
      // Save activity to Firestore
      const activity = await activityService.completeActivityWithMedia({
        userId: currentUser.uid,
        type: activityData.type,
        title: activityData.name,
        description: `${activityData.name} เป็นเวลา ${Math.floor(activityData.duration / 60)} นาที`,
        duration: activityData.duration,
        points: activityData.points,
        status: 'completed'
      }, activityData.blob)

      // Update user points and stats
      await updateUserData({
        points: userData.points + activityData.points,
        streak: userData.streak + 1,
        lastActive: new Date()
      })

      // Add to local activities list
      setActivities(prev => [activity, ...prev])

      // Show success notification
      notificationService.notifyActivityComplete(activityData.name, activityData.points)
      showNotification(`บันทึก${activityData.name}สำเร็จ! +${activityData.points} แต้ม`)
      
      setShowActivityRecorder(false)
    } catch (error) {
      console.error('Failed to save activity:', error)
      showNotification('ไม่สามารถบันทึกกิจกรรมได้ กรุณาลองใหม่')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      showNotification('ออกจากระบบแล้ว')
    } catch (error) {
      console.error('Logout failed:', error)
      showNotification('ไม่สามารถออกจากระบบได้')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">ฟูมฟัก</h1>
            <p className="text-xs text-gray-500">เชื่อมต่อ Firebase</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/demo"
              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm flex items-center"
            >
              <TestTube className="w-4 h-4 mr-1" />
              ทดสอบ
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-green-100 text-green-700 p-3 text-center text-sm max-w-md mx-auto">
          {notification}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* User Stats */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">สวัสดี {userData?.name}</h2>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-1 text-yellow-300" />
              <span>{userData?.points || 0} แต้ม</span>
            </div>
            <div className="flex items-center">
              <Trophy className="w-5 h-5 mr-1 text-yellow-300" />
              <span>เลเวล {userData?.level || 1}</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-1 text-orange-300" />
              <span>{userData?.streak || 0} วัน</span>
            </div>
          </div>
        </div>

        {/* Main Action */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg p-6">
          <h3 className="font-bold text-lg mb-2">บันทึกกิจกรรมลูก</h3>
          <p className="text-sm mb-4 opacity-90">
            บันทึกกิจกรรมการดูแลลูกและรับแต้มสะสม
          </p>
          <button
            onClick={() => setShowActivityRecorder(true)}
            className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold flex items-center hover:bg-pink-50 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            เริ่มบันทึกกิจกรรม
          </button>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <History className="w-5 h-5 mr-2" />
            กิจกรรมล่าสุด
          </h3>
          
          {loadingActivities ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.timestamp).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+{activity.points} แต้ม</p>
                    <p className="text-sm text-gray-500">
                      {Math.floor(activity.duration / 60)} นาที
                    </p>
                  </div>
                </div>
              ))}
              {activities.length > 5 && (
                <p className="text-center text-gray-500 text-sm">
                  และอีก {activities.length - 5} กิจกรรม
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">ยังไม่มีกิจกรรมที่บันทึก</p>
              <p className="text-gray-400 text-sm">เริ่มบันทึกกิจกรรมแรกของคุณเลย!</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{activities.length}</p>
            <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <Bell className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{userData?.streak || 0}</p>
            <p className="text-sm text-gray-600">วันติดต่อกัน</p>
          </div>
        </div>
      </div>

      {/* Activity Recorder Modal */}
      {showActivityRecorder && (
        <ActivityRecorder
          onActivityComplete={handleActivityComplete}
          onClose={() => setShowActivityRecorder(false)}
        />
      )}
    </div>
  )
}

// Auth Screen Component
const AuthScreen: React.FC = () => {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'parent' as 'parent' | 'caretaker',
    childName: '',
    childAge: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
      } else {
        await register({
          ...formData,
          childAge: formData.childAge ? parseInt(formData.childAge) : undefined
        })
      }
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">ฟูมฟัก</h1>
          <p className="text-gray-600">แอปบันทึกกิจกรรมเลี้ยงลูก</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="อีเมล"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-input"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <input
                  type="tel"
                  placeholder="เบอร์โทรศัพท์"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'parent' | 'caretaker' })}
                  className="form-input"
                >
                  <option value="parent">ผู้ปกครอง</option>
                  <option value="caretaker">ผู้ดูแลเด็ก</option>
                </select>
              </div>

              {formData.role === 'parent' && (
                <>
                  <div>
                    <input
                      type="text"
                      placeholder="ชื่อลูก"
                      value={formData.childName}
                      onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="อายุลูก (ปี)"
                      value={formData.childAge}
                      onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'กำลังดำเนินการ...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {isLogin ? 'ยังไม่มีบัญชี? สมัครเลย' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
          </button>
        </div>

        <div className="text-center mt-6 pt-6 border-t">
          <Link
            to="/demo"
            className="bg-yellow-500 text-white px-4 py-2 rounded text-sm flex items-center justify-center hover:bg-yellow-600 transition-colors"
          >
            <TestTube className="w-4 h-4 mr-2" />
            ทดลองใช้โหมดDemo
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage