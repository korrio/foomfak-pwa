import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ActivityRecorder } from '../components/ActivityRecorder'
import { activityService } from '../services/activityService'
import { notificationService } from '../services/notificationService'
import { Activity } from '../types'
import { challengeService } from '../services/challengeService'
import { Challenge, Achievement } from '../data/challenges'
import { activityTemplates } from '../data/activities'
import { RewardsMarketplace } from '../components/RewardsMarketplace'
import { OnboardingModal } from '../components/OnboardingModal'
import { AddToHomeScreen } from '../components/AddToHomeScreen'
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
  TrendingUp,
  Target,
  Gift
} from 'lucide-react'

const HomePage: React.FC = () => {
  const { currentUser, userData, logout, loading, updateUserData } = useAuth()
  const [showActivityRecorder, setShowActivityRecorder] = useState(false)
  const [showRewardsMarketplace, setShowRewardsMarketplace] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [challenges, setChallenges] = useState<(Challenge & { currentValue?: number })[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [notification, setNotification] = useState('')
  const [loadingActivities, setLoadingActivities] = useState(false)

  useEffect(() => {
    if (currentUser && userData) {
      loadUserActivities()
      loadUserChallenges()
      loadUserAchievements()
      setupNotifications()
      initializeDailyChallenges()
    }
  }, [currentUser, userData])

  // Check if user needs onboarding
  useEffect(() => {
    if (currentUser && userData) {
      // Show onboarding if user is new (has default values) and signed in via Google or Anonymous
      const isGoogleUser = currentUser.providerData.some(provider => provider.providerId === 'google.com')
      const isAnonymousUser = currentUser.isAnonymous
      const isNewUser = userData.points === 0 && userData.level === 1 && userData.streak === 0
      const needsOnboarding = (isGoogleUser || isAnonymousUser) && isNewUser && 
        (!userData.name || userData.name === 'ผู้ใช้ Google' || userData.name === 'ผู้ใช้แขก')
      
      if (needsOnboarding) {
        setShowOnboarding(true)
      }
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

  const loadUserChallenges = async () => {
    if (!currentUser) return
    
    try {
      const userChallenges = await challengeService.getUserChallenges(currentUser.uid)
      setChallenges(userChallenges)
    } catch (error) {
      console.error('Failed to load challenges:', error)
    }
  }

  const loadUserAchievements = async () => {
    if (!currentUser) return
    
    try {
      const userAchievements = await challengeService.getUserAchievements(currentUser.uid)
      setAchievements(userAchievements)
    } catch (error) {
      console.error('Failed to load achievements:', error)
    }
  }

  const initializeDailyChallenges = async () => {
    if (!currentUser) return
    
    try {
      await challengeService.initializeDailyChallenges(currentUser.uid)
    } catch (error) {
      console.error('Failed to initialize daily challenges:', error)
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
        description: activityData.description || `${activityData.name} เป็นเวลา ${Math.floor(activityData.duration / 60)} นาที`,
        duration: activityData.duration,
        points: activityData.points,
        status: 'completed'
      }, activityData.blob)

      // Process challenges and achievements
      const { completedChallenges, newAchievements } = await challengeService.processActivity(
        currentUser.uid, 
        activityData
      )

      // Update user points and stats
      const bonusPoints = completedChallenges.reduce((sum, c) => sum + c.pointsReward, 0) +
                         newAchievements.reduce((sum, a) => sum + a.pointsReward, 0)
      
      await updateUserData({
        points: userData.points + activityData.points + bonusPoints,
        streak: userData.streak + 1,
        lastActive: new Date()
      })

      // Add to local activities list
      setActivities(prev => [activity, ...prev])

      // Refresh challenges and achievements
      await loadUserChallenges()
      await loadUserAchievements()

      // Show success notification with bonuses
      let message = `บันทึก${activityData.name}สำเร็จ! +${activityData.points} แต้ม`
      
      if (completedChallenges.length > 0) {
        message += ` 🏆 ทำความท้าทายสำเร็จ ${completedChallenges.length} อัน!`
      }
      
      if (newAchievements.length > 0) {
        message += ` ⭐ ปลดล็อคความสำเร็จใหม่ ${newAchievements.length} อัน!`
      }

      notificationService.notifyActivityComplete(activityData.name, activityData.points + bonusPoints)
      showNotification(message)
      
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
          <div className="flex justify-between items-center mb-4">
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
          <button
            onClick={() => setShowRewardsMarketplace(true)}
            className="w-full bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-all flex items-center justify-center"
          >
            <Gift className="w-5 h-5 mr-2" />
            ร้านแลกรางวัล
          </button>
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

        {/* Popular Activities */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
            กิจกรรมยอดนิยม
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {activityTemplates
              .filter(activity => 
                // Show core activities first (reading, hugging, playing)
                ['reading_story', 'hugging', 'playing_together'].includes(activity.id) ||
                // Then show easy activities
                activity.difficulty === 'easy'
              )
              .slice(0, 6)
              .map(activity => (
                <button
                  key={activity.id}
                  onClick={() => setShowActivityRecorder(true)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                >
                  <div className={`${activity.color} p-2 rounded-lg inline-block mb-2`}>
                    <activity.icon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{activity.name}</h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{activity.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      activity.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      activity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.difficulty === 'easy' ? 'ง่าย' :
                       activity.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
                    </span>
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-3 h-3 mr-1" />
                      <span className="text-xs font-bold">{activity.points}</span>
                    </div>
                  </div>
                </button>
              ))
            }
          </div>
        </div>

        {/* Daily Challenges */}
        {challenges.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-500" />
              ความท้าทายวันนี้
            </h3>
            <div className="space-y-3">
              {challenges.slice(0, 3).map(challenge => {
                const progress = (challenge.currentValue || 0) / challenge.targetValue * 100
                return (
                  <div key={challenge.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <challenge.icon className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="font-medium text-sm">{challenge.title}</span>
                      </div>
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">{challenge.pointsReward}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`${challenge.color?.replace('bg-', 'bg-')} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{challenge.currentValue || 0} / {challenge.targetValue}</span>
                      <span>{Math.round(progress)}% เสร็จสิ้น</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-amber-500" />
              ความสำเร็จล่าสุด
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {achievements.slice(0, 4).map(achievement => (
                <div key={achievement.id} className="border border-gray-200 rounded-lg p-3 text-center">
                  <achievement.icon className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <h4 className="text-sm font-medium mb-1">{achievement.title}</h4>
                  <div className="flex items-center justify-center text-yellow-500">
                    <Star className="w-3 h-3 mr-1" />
                    <span className="text-xs">{achievement.pointsReward}</span>
                  </div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                    achievement.rarity === 'common' ? 'bg-gray-100 text-gray-800' :
                    achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                    achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                    'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800'
                  }`}>
                    {achievement.rarity === 'common' ? 'ธรรมดา' :
                     achievement.rarity === 'rare' ? 'หายาก' :
                     achievement.rarity === 'epic' ? 'มหาวิเศษ' : 'ตำนาน'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* Rewards Marketplace Modal */}
      {showRewardsMarketplace && (
        <RewardsMarketplace
          onClose={() => setShowRewardsMarketplace(false)}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => {
            setShowOnboarding(false)
            showNotification('ยินดีต้อนรับสู่ฟูมฟัก! คุณได้รับโบนัสต้อนรับ 100 แต้ม 🎉')
          }}
        />
      )}

      {/* Add to Home Screen Prompt */}
      <AddToHomeScreen />
    </div>
  )
}

// Auth Screen Component
const AuthScreen: React.FC = () => {
  const { sendOTP, verifyOTP, registerWithPhone, signInWithGoogle, signInAsGuest, setupRecaptcha } = useAuth()
  const [currentStep, setCurrentStep] = useState<'phone' | 'otp' | 'register'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    name: '',
    role: 'parent' as 'parent' | 'caretaker',
    childName: '',
    childAge: ''
  })

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await sendOTP(formData.phone)
      setConfirmationResult(result)
      setCurrentStep('otp')
    } catch (error: any) {
      console.error('Phone auth error:', error)
      
      let errorMessage = 'ไม่สามารถส่ง OTP ได้: '
      
      switch (error.code) {
        case 'auth/invalid-app-credential':
          errorMessage += 'กรุณาตรวจสอบการตั้งค่า Firebase (Phone Auth ต้องถูกเปิดใช้งานใน Firebase Console)'
          break
        case 'auth/user-not-found':
          setIsNewUser(true)
          setCurrentStep('register')
          return
        case 'auth/invalid-phone-number':
          errorMessage += 'หมายเลขโทรศัพท์ไม่ถูกต้อง'
          break
        case 'auth/too-many-requests':
          errorMessage += 'มีการร้องขอมากเกินไป กรุณารอสักครู่'
          break
        case 'auth/captcha-check-failed':
          errorMessage += 'การยืนยัน reCAPTCHA ล้มเหลว'
          break
        default:
          errorMessage += error.message || 'กรุณาลองใหม่อีกครั้ง'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await verifyOTP(confirmationResult, formData.otp)
      // Auth state change will handle navigation automatically
    } catch (error: any) {
      setError('รหัส OTP ไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await registerWithPhone({
        ...formData,
        childAge: formData.childAge ? parseInt(formData.childAge) : undefined
      })
      setConfirmationResult(result)
      setCurrentStep('otp')
    } catch (error: any) {
      setError('ไม่สามารถสมัครสมาชิกได้: ' + (error.message || 'กรุณาลองใหม่'))
    } finally {
      setLoading(false)
    }
  }

  const renderPhoneStep = () => (
    <form onSubmit={handlePhoneSubmit} className="space-y-4">
      <div>
        <input
          type="tel"
          placeholder="หมายเลขโทรศัพท์ (08xxxxxxxx)"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="form-input"
          required
          maxLength={10}
        />
        <p className="text-xs text-gray-500 mt-1">ใส่เบอร์โทรศัพท์เพื่อรับรหัส OTP</p>
        <div className="mt-2 p-2 bg-blue-50 rounded border">
          <p className="text-xs font-medium text-blue-800 mb-1">เบอร์ทดสอบ (ไม่ต้องรับ SMS):</p>
          <div className="text-xs text-blue-700 space-y-1">
            <div>0812345678 → OTP: 123456</div>
            <div>0887654321 → OTP: 654321</div>
            <div>0811111111 → OTP: 111111</div>
            <div>0826539264 → OTP: 111111</div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50"
      >
        {loading ? 'กำลังส่ง OTP...' : 'ส่งรหัส OTP'}
      </button>
    </form>
  )

  const renderOTPStep = () => (
    <form onSubmit={handleOTPVerify} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="รหัส OTP (6 หลัก)"
          value={formData.otp}
          onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
          className="form-input text-center text-lg tracking-widest"
          required
          maxLength={6}
          autoComplete="one-time-code"
        />
        <p className="text-xs text-gray-500 mt-1 text-center">
          ใส่รหัส OTP ที่ส่งไปยัง {formData.phone}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50"
      >
        {loading ? 'กำลังยืนยัน...' : 'ยืนยันรหัส'}
      </button>

      <button
        type="button"
        onClick={() => setCurrentStep('phone')}
        className="w-full text-gray-600 hover:text-gray-700 text-sm"
      >
        กลับไปแก้ไขเบอร์โทร
      </button>
    </form>
  )

  const renderRegisterStep = () => (
    <form onSubmit={handleRegister} className="space-y-4">
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

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50"
      >
        {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
      </button>

      <button
        type="button"
        onClick={() => setCurrentStep('phone')}
        className="w-full text-gray-600 hover:text-gray-700 text-sm"
      >
        กลับไปแก้ไขเบอร์โทร
      </button>
    </form>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">ฟูมฟัก</h1>
          <p className="text-gray-600">
            {currentStep === 'phone' && 'เข้าสู่ระบบด้วยเบอร์โทร'}
            {currentStep === 'otp' && 'ยืนยันรหัส OTP'}
            {currentStep === 'register' && 'สมัครสมาชิกใหม่'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {currentStep === 'phone' && renderPhoneStep()}
        {currentStep === 'otp' && renderOTPStep()}
        {currentStep === 'register' && renderRegisterStep()}

        {currentStep === 'phone' && (
          <>
            <div className="text-center mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-4">หรือเข้าสู่ระบบด้วยวิธีอื่น</p>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    setLoading(true)
                    setError('')
                    try {
                      await signInWithGoogle()
                    } catch (error: any) {
                      setError(error.message)
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  เข้าสู่ระบบด้วย Google
                </button>
                
                <button
                  onClick={async () => {
                    setLoading(true)
                    setError('')
                    try {
                      await signInAsGuest()
                    } catch (error: any) {
                      setError(error.message)
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded flex items-center justify-center hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <User className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบแบบแขก
                </button>
                
                <Link
                  to="/demo"
                  className="bg-yellow-500 text-white px-4 py-2 rounded text-sm flex items-center justify-center hover:bg-yellow-600 transition-colors"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  ทดลองใช้โหมดDemo
                </Link>
              </div>
            </div>
          </>
        )}

        {/* reCAPTCHA container */}
        <div className="mt-4">
          <p className="text-xs text-gray-600 mb-2">กรุณายืนยัน reCAPTCHA เพื่อส่ง OTP:</p>
          <div id="recaptcha-container" className="flex justify-center"></div>
        </div>
      </div>
    </div>
  )
}

export default HomePage