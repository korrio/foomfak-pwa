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
import { BottomNavigation } from '../components/BottomNavigation'
import { EQAssessment } from '../components/EQAssessment'
import { AssessmentDashboard } from '../components/AssessmentDashboard'
import InstallPWA from '../components/InstallPWA'
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
  Gift,
  Download
} from 'lucide-react'

const HomePage: React.FC = () => {
  const { currentUser, userData, logout, loading, updateUserData } = useAuth()
  const [activeTab, setActiveTab] = useState<'home' | 'record' | 'rewards' | 'assessment'>('home')
  const [showActivityRecorder, setShowActivityRecorder] = useState(false)
  const [preSelectedActivity, setPreSelectedActivity] = useState<any>(null)
  const [showRewardsMarketplace, setShowRewardsMarketplace] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showEQAssessment, setShowEQAssessment] = useState(false)
  const [showAssessmentDashboard, setShowAssessmentDashboard] = useState(false)
  const [assessmentType, setAssessmentType] = useState<'pre-test' | 'post-test'>('pre-test')
  const [activities, setActivities] = useState<Activity[]>([])
  const [challenges, setChallenges] = useState<(Challenge & { currentValue?: number })[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [notification, setNotification] = useState('')
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [assessmentRefreshTrigger, setAssessmentRefreshTrigger] = useState(0)

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
      // Show onboarding if user is new and signed in via Google or Anonymous
      const isGoogleUser = currentUser.providerData.some(provider => provider.providerId === 'google.com')
      const isAnonymousUser = currentUser.isAnonymous
      
      // Check if onboarding has been completed (we'll use a flag in userData or check if child profile exists)
      const hasCompletedOnboarding = userData.onboardingCompleted || 
        (userData.childName && userData.childName.length > 0)
      
      const needsOnboarding = (isGoogleUser || isAnonymousUser) && !hasCompletedOnboarding
      
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
      // Save activity to Firestore with both recorded media and uploaded files
      const activity = await activityService.completeActivityWithFiles({
        userId: currentUser.uid,
        type: activityData.type,
        title: activityData.name,
        description: activityData.description || `${activityData.name} เป็นเวลา ${Math.floor(activityData.duration / 60)} นาที`,
        duration: activityData.duration,
        points: activityData.points,
        status: 'completed'
      }, activityData.blob, activityData.uploadedFiles)

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

      // Refresh activities from server to ensure consistency
      await loadUserActivities()

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
      
      // Close modal and clear pre-selected activity
      setShowActivityRecorder(false)
      setPreSelectedActivity(null)
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

  const handleTabChange = (tab: 'home' | 'record' | 'rewards' | 'assessment') => {
    setActiveTab(tab)
    
    // Handle navigation actions
    switch (tab) {
      case 'record':
        setPreSelectedActivity(null) // No pre-selected activity for manual selection
        setShowActivityRecorder(true)
        setActiveTab('home') // Reset to home after opening modal
        break
      case 'rewards':
        setShowRewardsMarketplace(true)
        setActiveTab('home') // Reset to home after opening modal
        break
      case 'assessment':
        setShowAssessmentDashboard(true)
        setActiveTab('home') // Reset to home after opening modal
        break
      case 'home':
      default:
        // Already on home, do nothing
        break
    }
  }

  const handleStartAssessment = (type: 'pre-test' | 'post-test') => {
    setAssessmentType(type)
    setShowAssessmentDashboard(false)
    setShowEQAssessment(true)
  }

  const handleEQAssessmentComplete = (assessment: any) => {
    showNotification(`ทำแบบประเมิน ${assessment.type === 'pre-test' ? 'ก่อนใช้แอป' : 'หลังใช้แอป'} เสร็จเรียบร้อยแล้ว!`)
    setShowEQAssessment(false)
    
    // Trigger refresh of assessment dashboard
    setAssessmentRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#fafafa] relative text-gray-900 flex items-center justify-center">
        {/* Diagonal Grid with Electric Orange */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, rgba(255, 0, 100, 0.1) 0, rgba(255, 0, 100, 0.1) 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(-45deg, rgba(255, 0, 100, 0.1) 0, rgba(255, 0, 100, 0.1) 1px, transparent 1px, transparent 20px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 text-center">
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
    <div className="min-h-screen w-full bg-[#fafafa] relative text-gray-900">
      {/* Diagonal Grid with Electric Orange */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(255, 0, 100, 0.1) 0, rgba(255, 0, 100, 0.1) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(-45deg, rgba(255, 0, 100, 0.1) 0, rgba(255, 0, 100, 0.1) 1px, transparent 1px, transparent 20px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="ฟูมฟัก" 
              className="w-10 h-10 rounded-full border-2 border-blue-100 mr-3"
            />
            <div>
              <h1 className="text-2xl font-bold text-blue-600">ฟูมฟัก</h1>
              <p className="text-xs text-gray-500">เชื่อมต่อ Firebase</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowOnboarding(true)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center"
            >
              <User className="w-4 h-4 mr-1" />
              ประวัติลูกน้อย
            </button>
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
      <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
        {/* User Stats */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">สวัสดี {userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ผู้ใช้'}</h2>
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
                  onClick={() => {
                    setPreSelectedActivity(activity)
                    setShowActivityRecorder(true)
                  }}
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
          onClose={() => {
            setShowActivityRecorder(false)
            setPreSelectedActivity(null)
          }}
          preSelectedActivity={preSelectedActivity}
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
          onComplete={async () => {
            setShowOnboarding(false)
            
            // Mark onboarding as completed (points are already updated in OnboardingModal)
            if (currentUser && userData) {
              await updateUserData({
                onboardingCompleted: true,
                lastActive: new Date()
              })
            }
            
            showNotification('ยินดีต้อนรับสู่ฟูมฟัก! คุณได้รับโบนัสต้อนรับ 100 แต้ม 🎉')
          }}
        />
      )}

      {/* Add to Home Screen Prompt */}
      <AddToHomeScreen />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Assessment Dashboard Modal */}
      {showAssessmentDashboard && (
        <AssessmentDashboard
          onStartAssessment={handleStartAssessment}
          onClose={() => setShowAssessmentDashboard(false)}
          refreshTrigger={assessmentRefreshTrigger}
        />
      )}

      {/* EQ Assessment Modal */}
      {showEQAssessment && (
        <EQAssessment
          type={assessmentType}
          onComplete={handleEQAssessmentComplete}
          onClose={() => setShowEQAssessment(false)}
        />
      )}
      </div>
    </div>
  )
}

// Auth Screen Component
const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInAsGuest } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  return (
    <div className="min-h-screen w-full bg-[#fafafa] relative text-gray-900 flex items-center justify-center p-4">
      {/* Diagonal Grid with Electric Orange */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(255, 0, 100, 0.1) 0, rgba(255, 0, 100, 0.1) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(-45deg, rgba(255, 0, 100, 0.1) 0, rgba(255, 0, 100, 0.1) 1px, transparent 1px, transparent 20px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mb-4">
            <img 
              src="/logo.png" 
              alt="ฟูมฟัก" 
              className="w-20 h-20 mx-auto rounded-full border-4 border-blue-100"
            />
          </div>
          <h1 className="text-3xl font-bold text-blue-600 mb-2">ฟูมฟัก</h1>
          <p className="text-gray-600">แอปพลิเคชันสำหรับผู้ปกครองวัยรุ่น</p>
          <p className="text-sm text-gray-500 mt-1">เลือกวิธีการเข้าสู่ระบบ</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
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
            className="w-full bg-red-500 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
            className="w-full bg-gray-500 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors disabled:opacity-50 font-medium"
          >
            <User className="w-5 h-5 mr-3" />
            เข้าสู่ระบบแบบแขก
          </button>

          {/* InstallPWA Component */}
          <InstallPWA />
        </div>

        {/* Add to Home Screen Button */}
        <div className="mt-6">
          <AddToHomeScreenButton />
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            สำหรับผู้ปกครองวัยรุ่นที่ต้องการพัฒนาทักษะการเลี้ยงดูลูก
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}

// Add to Home Screen Button Component for Login Page
const AddToHomeScreenButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /ipad|iphone|ipod/.test(userAgent)
    setIsIos(iosDevice)

    // Check if already in standalone mode
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    setIsStandalone(standalone)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Store it globally too for other components
      ;(window as any).deferredPrompt = e
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isStandalone) {
      alert('แอปถูกติดตั้งแล้ว!')
      return
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          console.log('PWA installed')
        }
        setDeferredPrompt(null)
        ;(window as any).deferredPrompt = null
      } catch (error) {
        console.error('Error installing PWA:', error)
      }
    } else if (isIos) {
      alert('สำหรับ iOS: กดปุ่ม Share (แชร์) ด้านล่าง แล้วเลือก "Add to Home Screen" เพื่อติดตั้งแอป')
    } else {
      // For browsers that don't support PWA install yet
      alert('เพื่อใช้งานแอปแบบออฟไลน์ กรุณาเพิ่มหน้าเว็บนี้เป็นบุ๊กมาร์กหรือเพิ่มลงหน้าจอหลัก')
    }
  }

  return (
    <button
      onClick={handleInstallClick}
      className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:from-green-600 hover:to-blue-600 transition-all font-medium"
    >
      <Download className="w-5 h-5 mr-3" />
      <div className="text-left">
        <div className="font-medium">
          {isStandalone ? 'แอปติดตั้งแล้ว' : 'เพิ่มลงหน้าจอหลัก'}
        </div>
        <div className="text-sm opacity-90">
          {isStandalone ? 'พร้อมใช้งานแบบออฟไลน์' : 'ติดตั้งแอปเพื่อใช้งานแบบออฟไลน์'}
        </div>
      </div>
    </button>
  )
}

export default HomePage