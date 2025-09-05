import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { activityService } from '../services/activityService'
import { Activity } from '../types'
import ActivityFeedDisplay from '../components/ActivityFeedDisplay'
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react'

const PublicJournalPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ name?: string; displayName?: string } | null>(null)

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
      
      // Try to get user profile info from the first activity or other sources
      if (sortedActivities.length > 0) {
        // You might want to add a separate service to get user profile
        setUserProfile({ name: 'ผู้ปกครอง' }) // Placeholder
      }
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
          <Link 
            to="/"
            className="inline-flex items-center bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                to="/"
                className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span className="text-sm">กลับ</span>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  บันทึกการเลี้ยงดูของ {userProfile?.name || 'ผู้ปกครอง'}
                </h1>
                <p className="text-sm text-gray-500">
                  บันทึกสาธารณะ • {activities.length} กิจกรรม
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
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                ไปที่แอป
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🏠 บันทึกการเลี้ยงดูของครอบครัว
          </h2>
          <p className="text-gray-600">
            ติดตามและแชร์ประสบการณ์การเลี้ยงดูลูกที่มีคุณค่า ผ่านกิจกรรมต่างๆ ที่เต็มไปด้วยความรักและการเรียนรู้
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>📊 {activities.length} กิจกรรมทั้งหมด</span>
            <span>⭐ {activities.reduce((sum, activity) => sum + (activity.points || 0), 0)} คะแนนรวม</span>
            <span>⏱️ {Math.floor(activities.reduce((sum, activity) => sum + (activity.duration || 0), 0) / 60)} นาทีรวม</span>
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
      <div className="bg-white border-t border-gray-200 mt-12">
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