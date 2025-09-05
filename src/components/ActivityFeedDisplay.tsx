import React, { useState } from 'react'
import { Activity } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { 
  X, 
  ArrowLeft,
  Calendar, 
  Clock, 
  Star, 
  Play, 
  Pause, 
  Volume2, 
  Image as ImageIcon,
  Video,
  FileText,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react'

interface ActivityFeedDisplayProps {
  activities: Activity[]
  loading: boolean
  readOnly?: boolean
  showHeader?: boolean
  title?: string
  onClose?: () => void
}

const ActivityFeedDisplay: React.FC<ActivityFeedDisplayProps> = ({ 
  activities, 
  loading, 
  readOnly = false,
  showHeader = true,
  title = "บันทึกการเลี้ยงดู",
  onClose 
}) => {
  const { currentUser } = useAuth()
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({})
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const shareJournalUrl = () => {
    if (!currentUser) return
    
    const journalUrl = `${window.location.origin}/journal/${currentUser.uid}`
    
    if (navigator.share) {
      navigator.share({
        title: 'บันทึกการเลี้ยงดูของฉัน',
        text: 'ดูบันทึกการเลี้ยงดูที่น่าสนใจ',
        url: journalUrl
      }).catch(console.error)
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(journalUrl).then(() => {
        alert('คัดลอกลิงก์บันทึกการเลี้ยงดูแล้ว!')
      }).catch(() => {
        // Final fallback: show in prompt
        prompt('คัดลอกลิงก์บันทึกการเลี้ยงดู:', journalUrl)
      })
    }
  }

  const openPublicJournal = () => {
    if (!currentUser) return
    const journalUrl = `${window.location.origin}/journal/${currentUser.uid}`
    window.open(journalUrl, '_blank')
  }

  const playAudio = (audioUrl: string, activityId: string) => {
    // Stop any currently playing audio
    if (playingAudio && audioElements[playingAudio]) {
      audioElements[playingAudio].pause()
      audioElements[playingAudio].currentTime = 0
    }

    if (playingAudio === activityId) {
      setPlayingAudio(null)
      return
    }

    // Create audio element if it doesn't exist
    if (!audioElements[activityId]) {
      const audio = new Audio(audioUrl)
      audio.addEventListener('ended', () => {
        setPlayingAudio(null)
      })
      setAudioElements(prev => ({ ...prev, [activityId]: audio }))
      audio.play()
      setPlayingAudio(activityId)
    } else {
      audioElements[activityId].play()
      setPlayingAudio(activityId)
    }
  }

  const pauseAudio = (activityId: string) => {
    if (audioElements[activityId]) {
      audioElements[activityId].pause()
    }
    setPlayingAudio(null)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60)
        return `${minutes} นาทีที่แล้ว`
      }
      return `${Math.floor(diffInHours)} ชั่วโมงที่แล้ว`
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24)
      return `${days} วันที่แล้ว`
    }
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isImageFile = (file: any) => {
    // Check file type first
    if (file.type && file.type.startsWith('image/')) {
      return true
    }
    
    // If no type, check file extension or name
    if (file.name) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
      const fileName = file.name.toLowerCase()
      return imageExtensions.some(ext => fileName.endsWith(ext))
    }
    
    // Check URL for common image extensions
    if (file.url) {
      const imageUrlPattern = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i
      return imageUrlPattern.test(file.url)
    }
    
    return false
  }

  const renderMediaAttachment = (activity: Activity) => {
    if (!activity.mediaUrl && (!activity.uploadedFiles || activity.uploadedFiles.length === 0)) {
      return null
    }

    return (
      <div className="mt-3 space-y-3">
        {/* Audio recording */}
        {activity.mediaUrl && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Volume2 className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">เสียงบันทึก</span>
              </div>
              <button
                onClick={() => 
                  playingAudio === activity.id 
                    ? pauseAudio(activity.id) 
                    : playAudio(activity.mediaUrl!, activity.id)
                }
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
              >
                {playingAudio === activity.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {playingAudio === activity.id ? 'หยุด' : 'เล่น'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Uploaded files */}
        {activity.uploadedFiles && activity.uploadedFiles.length > 0 && (
          <div className="space-y-3">
            {/* Image grid */}
            {activity.uploadedFiles.filter(f => isImageFile(f)).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {activity.uploadedFiles
                  .filter(f => isImageFile(f))
                  .map((file, index) => (
                    <div key={`image-${index}`} className="relative group cursor-pointer" onClick={() => setExpandedImage(file.url)}>
                      <img 
                        src={file.url} 
                        alt={`รูปภาพ ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
            
            {/* Other file types */}
            {activity.uploadedFiles.filter(f => !isImageFile(f)).map((file, index) => {
              const fileType = file.type || ''
              const isVideo = fileType.startsWith('video/')
              const isAudio = fileType.startsWith('audio/')

              return (
                <div key={`file-${index}`} className="border rounded-lg overflow-hidden">
                  {isVideo && (
                    <div className="relative">
                      <video 
                        controls 
                        className="w-full max-h-64"
                        preload="metadata"
                      >
                        <source src={file.url} type={fileType} />
                      </video>
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center">
                        <Video className="w-3 h-3 mr-1" />
                        วิดีโอ
                      </div>
                    </div>
                  )}
                  
                  {isAudio && (
                    <div className="p-3 bg-purple-50 border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Volume2 className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-purple-800">ไฟล์เสียง</span>
                        </div>
                        <audio controls className="h-8">
                          <source src={file.url} type={fileType} />
                        </audio>
                      </div>
                    </div>
                  )}
                  
                  {!isVideo && !isAudio && (
                    <div className="p-3 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-600 mr-2" />
                        <span className="text-sm text-gray-700">{file.name || 'ไฟล์แนบ'}</span>
                      </div>
                      <a 
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`${readOnly ? 'min-h-screen bg-gray-50' : 'fixed inset-0 bg-black bg-opacity-50 z-50'} flex items-center justify-center p-4`}>
        <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl ${readOnly ? 'min-h-[50vh]' : 'max-h-[90vh]'} overflow-hidden`}>
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดบันทึกการเลี้ยงดู...</p>
          </div>
        </div>
      </div>
    )
  }

  const containerClasses = readOnly 
    ? "min-h-screen bg-gray-50 p-4"
    : "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"

  const contentClasses = readOnly
    ? "bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto"
    : "bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-center p-4 border-b border-gray-200">
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors mr-3"
                title="กลับ"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          </div>
        )}

        {/* Feed Content */}
        <div className={`${readOnly ? 'p-4' : 'flex-1 overflow-y-auto p-4'}`}>
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">ยังไม่มีบันทึกการเลี้ยงดู</p>
              <p className="text-gray-400">
                {readOnly ? 'ผู้ใช้นี้ยังไม่มีบันทึกการเลี้ยงดูที่แชร์' : 'เริ่มบันทึกกิจกรรมแรกของคุณเลย!'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Activity Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{activity.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center text-yellow-500 mb-1">
                        <Star className="w-4 h-4 mr-1" />
                        <span className="font-medium">{activity.points}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(activity.duration)}
                      </div>
                    </div>
                  </div>

                  {/* Media Attachments */}
                  {renderMediaAttachment(activity)}

                  {/* Activity Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(activity.timestamp)}
                    </div>
                  
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Show only for non-readonly mode and when user is authenticated */}
        {!readOnly && currentUser && (
          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={shareJournalUrl}
                className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4 mr-2" />
                แชร์บันทึกการเลี้ยงดู
              </button>
              <button
                onClick={openPublicJournal}
                className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                ดูแบบสาธารณะ
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              แชร์บันทึกการเลี้ยงดูของคุณให้เพื่อนและครอบครัวได้ดู
            </p>
          </div>
        )}
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-60 flex items-center justify-center p-4" onClick={() => setExpandedImage(null)}>
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 z-70 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={expandedImage} 
              alt="รูปภาพขยาย"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityFeedDisplay