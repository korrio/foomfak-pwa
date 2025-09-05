import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Camera, Mic, Clock, ChevronLeft, Search, Filter, Star, Upload, Image, Video, X, Plus, Edit3, Heart, Book, Gamepad2 } from 'lucide-react'
import { createMediaRecorder } from '../utils/mediaRecorder'
import { requestMicrophonePermission, requestCameraPermission } from '../utils/permissions'
import { activityTemplates, activityCategories, ActivityTemplate } from '../data/activities'
import { offlineActivityService } from '../services/offlineActivityService'
import { notificationService } from '../services/notificationService'
import WaveAnimation, { PulseWaveAnimation } from './WaveAnimation'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onActivityComplete: (activity: any) => void
  onClose: () => void
  preSelectedActivity?: ActivityTemplate | null
}

export const ActivityRecorder: React.FC<Props> = ({ onActivityComplete, onClose, preSelectedActivity }) => {
  const { currentUser } = useAuth()
  const [currentStep, setCurrentStep] = useState<'categories' | 'activities' | 'recording' | 'custom'>('categories')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<ActivityTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null)
  const [duration, setDuration] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState(createMediaRecorder())
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
  const [activityResult, setActivityResult] = useState<any>(null)
  const [customActivity, setCustomActivity] = useState({
    name: '',
    description: '',
    category: 'อื่นๆ',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    minDuration: 5 * 60, // 5 minutes in seconds
    points: 10
  })

  // Handle pre-selected activity
  useEffect(() => {
    if (preSelectedActivity) {
      setSelectedActivity(preSelectedActivity)
      setCurrentStep('recording')
    } else {
      setCurrentStep('categories')
    }
  }, [preSelectedActivity])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Filter for images and videos only
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    if (validFiles.length === 0) {
      alert('กรุณาเลือกไฟล์รูปภาพหรือวิดีโอเท่านั้น')
      return
    }

    // Limit total files to 5
    const totalFiles = uploadedFiles.length + validFiles.length
    if (totalFiles > 5) {
      alert('คุณสามารถอัปโหลดได้สูงสุด 5 ไฟล์')
      return
    }

    // Check file size (limit to 10MB per file)
    const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB ต่อไฟล์)')
      return
    }

    // Create previews for new files
    const newPreviews: string[] = []
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      newPreviews.push(url)
    })

    setUploadedFiles(prev => [...prev, ...validFiles])
    setUploadPreviews(prev => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    // Revoke object URL to prevent memory leak
    URL.revokeObjectURL(uploadPreviews[index])
    
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setUploadPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      let permission
      if (type === 'video') {
        permission = await requestCameraPermission()
      } else {
        permission = await requestMicrophonePermission()
      }

      if (!permission.granted) {
        alert('กรุณาอนุญาตการใช้งานกล้อง/ไมโครโฟนเพื่อบันทึกกิจกรรม')
        return
      }

      const started = await mediaRecorder.startRecording({
        video: type === 'video',
        audio: true
      })

      if (started) {
        setIsRecording(true)
        setRecordingType(type)
        setDuration(0)
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('ไม่สามารถเริ่มการบันทึกได้')
    }
  }

  const stopRecording = async () => {
    try {
      const blob = await mediaRecorder.stopRecording()
      setIsRecording(false)
      
      if ((blob || uploadedFiles.length > 0) && selectedActivity && currentUser) {
        // Use official scoring criteria
        const officialPoints = offlineActivityService.calculatePoints(selectedActivity.id, duration, currentUser.uid)
        
        // Check daily limits
        let canEarnPoints = true
        let remainingPoints = 0
        
        try {
          const dailyCheck = await offlineActivityService.checkDailyLimit(currentUser.uid, selectedActivity.id)
          canEarnPoints = dailyCheck.canEarn
          remainingPoints = dailyCheck.remainingPoints
        } catch (error) {
          console.error('Failed to check daily limits:', error)
          // Continue with calculation even if limit check fails
        }
        
        // Save activity using offline service
        const savedActivity = await offlineActivityService.saveActivity({
          activityId: selectedActivity.id,
          type: selectedActivity.type,
          name: selectedActivity.name,
          description: selectedActivity.description,
          category: selectedActivity.category,
          difficulty: selectedActivity.difficulty,
          duration,
          recordingType,
          blob,
          uploadedFiles,
          userId: currentUser.uid
        })
        
        // Create result object for component state (with additional info for UI)
        const result = {
          ...savedActivity,
          officialPoints,
          canEarnPoints,
          remainingPoints
        }
        
        setActivityResult(result)
        
        // Show activity completion notification
        const activityName = selectedActivity?.name || customActivity.name
        notificationService.notifyActivityComplete(activityName, result.points)
        
        // Automatically complete activity and close modal instead of showing results step
        onActivityComplete(result)
        
        // Clean up object URLs immediately
        uploadPreviews.forEach(url => URL.revokeObjectURL(url))
        
        // Reset state for next use
        setCurrentStep('categories')
        setSelectedCategory(null)
        setSelectedActivity(null)
        setRecordingType(null)
        setDuration(0)
        setUploadedFiles([])
        setUploadPreviews([])
        setActivityResult(null)
        setCustomActivity({
          name: '',
          description: '',
          category: 'อื่นๆ',
          difficulty: 'easy',
          minDuration: 5 * 60,
          points: 10
        })
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }


  const filteredActivities = activityTemplates.filter(activity => {
    const matchesCategory = !selectedCategory || activity.category === selectedCategory
    const matchesSearch = !searchQuery || 
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const renderCategoriesStep = () => (
    <div className="space-y-4">
      <div className="relative">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">เลือกประเภทกิจกรรม</h2>
          <p className="text-gray-600 text-sm">เลือกประเภทที่ต้องการบันทึก</p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Popular activities moved to top */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          กิจกรรมยอดนิยม
        </h3>
        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {activityTemplates.map(activity => (
            <button
              key={activity.id}
              onClick={() => {
                setSelectedActivity(activity)
                setCurrentStep('recording')
              }}
              className={`${activity.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity text-left flex items-center min-h-[60px]`}
            >
              <activity.icon className="w-6 h-6 mr-3 flex-shrink-0" />
              <span className="text-sm font-medium leading-tight">{activity.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Activity Button */}
      <div className="mt-6 pt-4 border-t">
        <button
          onClick={() => setCurrentStep('custom')}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="font-medium">สร้างกิจกรรมใหม่</div>
            <div className="text-sm opacity-90">กำหนดกิจกรรมเองตามที่ต้องการ</div>
          </div>
        </button>
      </div>

    </div>
  )

  const renderActivitiesStep = () => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => setCurrentStep('categories')}
          className="p-2 hover:bg-gray-100 rounded-full mr-3"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold">{selectedCategory}</h2>
          <p className="text-sm text-gray-600">{filteredActivities.length} กิจกรรม</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหากิจกรรม..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Activities List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredActivities.map(activity => (
          <button
            key={activity.id}
            onClick={() => {
              setSelectedActivity(activity)
              setCurrentStep('recording')
            }}
            className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-start">
              <div className={`${activity.color} p-2 rounded-lg mr-3`}>
                <activity.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">{activity.name}</h3>
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">{activity.points}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      activity.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      activity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.difficulty === 'easy' ? 'ง่าย' : 
                       activity.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.floor(activity.minDuration / 60)}-{Math.floor(activity.maxDuration / 60)} นาที
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderRecordingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => setCurrentStep('activities')}
          className="p-2 hover:bg-gray-100 rounded-full mr-3"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{selectedActivity?.name}</h2>
          <p className="text-sm text-gray-600">{selectedActivity?.category}</p>
        </div>
      </div>

      {/* Activity Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-3">
          <div className={`${selectedActivity?.color} p-2 rounded-lg mr-3`}>
            {selectedActivity && <selectedActivity.icon className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{selectedActivity?.points} แต้ม</span>
              <span className={`px-2 py-1 rounded text-xs ${
                selectedActivity?.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                selectedActivity?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedActivity?.difficulty === 'easy' ? 'ง่าย' : 
                 selectedActivity?.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{selectedActivity?.description}</p>
          </div>
        </div>

        {/* Tips */}
        {selectedActivity?.tips && selectedActivity.tips.length > 0 && (
          <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 เคล็ดลับ:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {selectedActivity.tips.slice(0, 2).map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-5 h-5 mr-2 text-gray-600" />
          <span className="text-2xl font-mono">{formatTime(duration)}</span>
        </div>
        
        {/* Wave Animation for Audio Recording */}
        {isRecording && recordingType === 'audio' && (
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center space-x-3">
              <PulseWaveAnimation 
                isRecording={isRecording && recordingType === 'audio'} 
                size="small"
                color="#ef4444" // red-500 for recording
              />
              <WaveAnimation 
                isRecording={isRecording && recordingType === 'audio'} 
                size="medium"
                color="#ef4444" // red-500 for recording
              />
              <PulseWaveAnimation 
                isRecording={isRecording && recordingType === 'audio'} 
                size="small"
                color="#ef4444" // red-500 for recording
              />
            </div>
          </div>
        )}
        
        {/* Recording Status Indicator for Video */}
        {isRecording && recordingType === 'video' && (
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-600">REC</span>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
        
        {isRecording && selectedActivity && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`${selectedActivity.color.replace('bg-', 'bg-')} h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${Math.min((duration / selectedActivity.minDuration) * 100, 100)}%` }}
            />
          </div>
        )}
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>ขั้นต่ำ: {selectedActivity && Math.floor(selectedActivity.minDuration / 60)} นาที</span>
          <span>{isRecording ? 
            (recordingType === 'audio' ? 'กำลังบันทึกเสียง...' : 
             recordingType === 'video' ? 'กำลังบันทึกวิดีโอ...' : 'กำลังบันทึก...') : 
            'พร้อมบันทึก'}</span>
        </div>
      </div>

      {/* Recording Controls */}
      {!isRecording ? (
        <div className="space-y-3">
          <button
            onClick={() => startRecording('audio')}
            className="w-full bg-green-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
          >
            <Mic className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-medium">บันทึกเสียง</div>
              <div className="text-sm opacity-80">เหมาะสำหรับการอ่าน ร้องเพลง</div>
            </div>
          </button>
          <button
            onClick={() => startRecording('video')}
            className="hidden w-full bg-blue-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <Camera className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-medium">บันทึกวิดีโอ</div>
              <div className="text-sm opacity-80">เหมาะสำหรับการเล่น กิจกรรม</div>
            </div>
          </button>

          {/* File Upload Section */}
          <div className="border-t pt-4">
            <p className="hidden text-sm text-gray-600 mb-3 text-center">หรืออัปโหลดรูปภาพ/วิดีโอ</p>
            
            <label className="w-full bg-purple-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
              <Camera className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-medium">อัปโหลดไฟล์</div>
                <div className="text-sm opacity-80">รูปภาพหรือวิดีโอ (สูงสุด 5 ไฟล์)</div>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">ไฟล์ที่อัปโหลด ({uploadedFiles.length}/5):</p>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                      {file.type.startsWith('image/') ? (
                        <div className="flex items-center">
                          <Image className="w-8 h-8 text-blue-500 mr-2" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Video className="w-8 h-8 text-red-500 mr-2" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Activity Button (when files are uploaded) */}
            {uploadedFiles.length > 0 && !isRecording && (
              <button
                onClick={stopRecording}
                className="w-full mt-3 bg-green-600 text-white p-4 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors"
              >
                <Square className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-medium">เสร็จสิ้นกิจกรรม</div>
                  <div className="text-sm opacity-80">บันทึกกิจกรรมพร้อมไฟล์ที่อัปโหลด</div>
                </div>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={stopRecording}
            className="w-full bg-red-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors button-recording-pulse"
          >
            <div className="flex items-center">
              {recordingType === 'audio' && (
                <div className="mr-3">
                  <WaveAnimation 
                    isRecording={true} 
                    size="small"
                    color="#ffffff" // white for button
                  />
                </div>
              )}
              <Square className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-medium">หยุดบันทึก</div>
                <div className="text-sm opacity-80">
                  {selectedActivity && duration >= selectedActivity.minDuration ? 
                    'เวลาเพียงพอแล้ว!' : 
                    `อีก ${selectedActivity ? Math.max(0, Math.ceil((selectedActivity.minDuration - duration) / 60)) : 0} นาที`}
                </div>
              </div>
            </div>
          </button>
          
          {/* Recording Status */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center justify-center">
              {recordingType === 'audio' ? (
                <div className="flex items-center space-x-2 text-red-700">
                  <Mic className="w-5 h-5" />
                  <WaveAnimation 
                    isRecording={true} 
                    size="small"
                    color="#b91c1c" // red-700
                  />
                  <span className="text-sm font-medium">กำลังบันทึกเสียง</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-700">
                  <Camera className="w-5 h-5" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">กำลังบันทึกวิดีโอ</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )


  const renderCustomStep = () => {
    const handleCreateCustomActivity = () => {
      if (!customActivity.name.trim()) {
        alert('กรุณาระบุชื่อกิจกรรม')
        return
      }

      const newActivity: ActivityTemplate = {
        id: `custom_${Date.now()}`,
        name: customActivity.name,
        description: customActivity.description,
        category: customActivity.category,
        difficulty: customActivity.difficulty,
        minDuration: customActivity.minDuration,
        maxDuration: customActivity.minDuration * 2,
        points: customActivity.points,
        icon: Edit3, // Default icon for custom activities
        color: 'bg-purple-500', // Default color
        type: 'custom'
      }

      setSelectedActivity(newActivity)
      setCurrentStep('recording')
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => setCurrentStep('categories')}
            className="p-2 hover:bg-gray-100 rounded-full mr-3"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold">สร้างกิจกรรมใหม่</h2>
            <p className="text-sm text-gray-600">กำหนดกิจกรรมเองตามที่ต้องการ</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Activity Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อกิจกรรม *
            </label>
            <input
              type="text"
              value={customActivity.name}
              onChange={(e) => setCustomActivity(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
              placeholder="เช่น เล่นซ่อนหา, ทำอาหารร่วมกัน, วาดรูป"
            />
          </div>

          {/* Activity Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รายละเอียดกิจกรรม
            </label>
            <textarea
              value={customActivity.description}
              onChange={(e) => setCustomActivity(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none h-24"
              placeholder="อธิบายกิจกรรมที่จะทำ เช่น เล่นซ่อนหากับลูกในบ้าน..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่กิจกรรม
            </label>
            <select
              value={customActivity.category}
              onChange={(e) => setCustomActivity(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            >
              <option value="อื่นๆ">อื่นๆ</option>
              <option value="การเรียนรู้">การเรียนรู้</option>
              <option value="การเล่น">การเล่น</option>
              <option value="การดูแลตนเอง">การดูแลตนเอง</option>
              <option value="กิจกรรมครอบครัว">กิจกรรมครอบครัว</option>
              <option value="ศิลปะและความคิดสร้างสรรค์">ศิลปะและความคิดสร้างสรรค์</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ระดับความยาก
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'easy', label: 'ง่าย', color: 'border-green-500 bg-green-50 text-green-800' },
                { value: 'medium', label: 'ปานกลาง', color: 'border-yellow-500 bg-yellow-50 text-yellow-800' },
                { value: 'hard', label: 'ยาก', color: 'border-red-500 bg-red-50 text-red-800' }
              ].map((diff) => (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() => setCustomActivity(prev => ({ 
                    ...prev, 
                    difficulty: diff.value as 'easy' | 'medium' | 'hard',
                    points: diff.value === 'easy' ? 10 : diff.value === 'medium' ? 15 : 20
                  }))}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    customActivity.difficulty === diff.value
                      ? diff.color
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เวลาที่แนะนำ (นาที)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={Math.floor(customActivity.minDuration / 60)}
              onChange={(e) => setCustomActivity(prev => ({ 
                ...prev, 
                minDuration: parseInt(e.target.value) * 60 || 5 * 60 
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Points Preview */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">แต้มที่จะได้รับ:</span>
              <span className="text-lg font-bold text-yellow-600">{customActivity.points} แต้ม</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              แต้มจะปรับตามระดับความยาก และอาจได้รับโบนัสเพิ่มเติม
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setCurrentStep('categories')}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            ย้อนกลับ
          </button>
          <button
            onClick={handleCreateCustomActivity}
            disabled={!customActivity.name.trim()}
            className="flex-1 bg-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Edit3 className="w-5 h-5 mr-2" />
            เริ่มกิจกรรม
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto mx-4 relative">
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        {currentStep === 'categories' && renderCategoriesStep()}
        {currentStep === 'activities' && renderActivitiesStep()}
        {currentStep === 'recording' && renderRecordingStep()}
        {currentStep === 'custom' && renderCustomStep()}
      </div>
    </div>
  )
}