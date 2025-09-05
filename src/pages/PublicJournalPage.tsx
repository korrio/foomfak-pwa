import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { activityService } from '../services/activityService'
import { Activity } from '../types'
import ActivityFeedDisplay from '../components/ActivityFeedDisplay'
import { Share2, Baby, Calendar, Scale, ArrowLeft } from 'lucide-react'

const PublicJournalPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (userId) {
      loadPublicJournal()
    }
  }, [userId])

  const loadPublicJournal = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Load user's activities
      const userActivities = await activityService.getUserActivities(userId)
      
      // Sort by timestamp descending (most recent first)
      const sortedActivities = userActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      
      setActivities(sortedActivities)
      
      // Load user profile data
      const profile = await activityService.getUserProfile(userId)
      setUserProfile(profile)
    } catch (error) {
      console.error('Failed to load public journal:', error)
      setError('ไม่สามารถโหลดบันทึกการเลี้ยงดูได้')
    } finally {
      setLoading(false)
    }
  }

  const shareJournal = () => {
    if (navigator.share) {
      navigator.share({
        title: `บันทึกการเลี้ยงดูของ ${userProfile?.name || 'ผู้ปกครอง'}`,
        text: 'ดูบันทึกการเลี้ยงดูที่น่าสนใจ',
        url: window.location.href
      }).catch(console.error)
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('คัดลอกลิงก์แล้ว!')
      }).catch(() => {
        alert('ไม่สามารถคัดลอกลิงก์ได้')
      })
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white relative text-gray-800">
      {/* Circuit Board - Light Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
            radial-gradient(circle at 20px 20px, rgba(55, 65, 81, 0.12) 2px, transparent 2px),
            radial-gradient(circle at 40px 40px, rgba(55, 65, 81, 0.12) 2px, transparent 2px)
          `,
          backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px',
        }}
      />
      
      {/* Header Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10 relative">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 transition-colors mr-4"
                title="กลับ"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-800">
                  ฟูมฟัก 
                </h1>
                <p className="text-sm text-gray-500">
                  กองทุนเพื่อความเสมอภาคทางการศึกษา (กสศ.)
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={shareJournal}
                className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4 mr-2" />
                แชร์
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Content */}
      <div className="max-w-4xl mx-auto p-4 relative z-10">
        {/* Family & Child Profile Section */}
        <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start space-x-6">
            {/* Child Profile */}
            {userProfile?.childProfile && (
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {userProfile.childProfile.photoUrl ? (
                    <img 
                      src={userProfile.childProfile.photoUrl} 
                      alt="รูปลูก" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Baby className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {userProfile.childProfile.name || userProfile.childName || 'ลูกน้อย'}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {(userProfile.childProfile.age || userProfile.childAge) && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        อายุ {userProfile.childProfile.age || userProfile.childAge} ปี
                      </div>
                    )}
                    {userProfile.childProfile.weight && (
                      <div className="flex items-center">
                        <Scale className="w-4 h-4 mr-1" />
                        น้ำหนัก {userProfile.childProfile.weight} กก.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Family Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🏠 บันทึกการเลี้ยงดูของครอบครัว
              </h2>
              <p className="text-gray-600 mb-4">
                ติดตามและแชร์ประสบการณ์การเลี้ยงดูลูกที่มีคุณค่า ผ่านกิจกรรมต่างๆ ที่เต็มไปด้วยความรักและการเรียนรู้
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>📊 {activities.length} กิจกรรมทั้งหมด</span>
                <span>⭐ {activities.reduce((sum, activity) => sum + (activity.points || 0), 0)} คะแนนรวม</span>
                <span>⏱️ {Math.floor(activities.reduce((sum, activity) => sum + (activity.duration || 0), 0) / 60)} นาทีรวม</span>
              </div>
            </div>
          </div>
        </div>

        <ActivityFeedDisplay 
          activities={activities}
          loading={loading}
          readOnly={true}
          showHeader={false}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12 relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="ฟูมฟัก" 
              className="w-8 h-8 rounded-full border border-gray-200 mr-2"
            />
            <span className="font-bold text-blue-600">ฟูมฟัก</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            แอปพลิเคชันสำหรับผู้ปกครองวัยรุ่น เพื่อการเลี้ยงดูที่ดีขึ้น
          </p>
          <div className="mb-2">
            <img 
              src="https://www.eef.or.th/wp-content/uploads/2020/09/th-logo-eef-1400x621.png" 
              alt="กองทุนเพื่อความเสมอภาคทางการศึกษา"
              className="h-6 mx-auto mb-2"
            />
          </div>
          <p className="text-xs text-gray-400">
            พัฒนาภายใต้งบประมาณจาก<br />กองทุนเพื่อความเสมอภาคทางการศึกษา (กสศ.)
          </p>
        </div>
      </div>
    </div>
  )
}

export default PublicJournalPage