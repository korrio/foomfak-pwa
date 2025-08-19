import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Camera, Mic, Clock, ChevronLeft, Search, Filter, Star } from 'lucide-react'
import { createMediaRecorder } from '../utils/mediaRecorder'
import { requestMicrophonePermission, requestCameraPermission } from '../utils/permissions'
import { activityTemplates, activityCategories, ActivityTemplate } from '../data/activities'

interface Props {
  onActivityComplete: (activity: any) => void
  onClose: () => void
}

export const ActivityRecorder: React.FC<Props> = ({ onActivityComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState<'categories' | 'activities' | 'recording'>('categories')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<ActivityTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null)
  const [duration, setDuration] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState(createMediaRecorder())

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
      
      if (blob && selectedActivity) {
        // Calculate bonus points based on duration and difficulty
        let bonusMultiplier = 1
        if (duration >= selectedActivity.minDuration) {
          bonusMultiplier = selectedActivity.difficulty === 'hard' ? 1.5 : 
                          selectedActivity.difficulty === 'medium' ? 1.2 : 1.1
        }
        
        const finalPoints = Math.floor(selectedActivity.points * bonusMultiplier)
        
        onActivityComplete({
          id: Date.now().toString(),
          activityId: selectedActivity.id,
          type: selectedActivity.type,
          name: selectedActivity.name,
          description: selectedActivity.description,
          category: selectedActivity.category,
          difficulty: selectedActivity.difficulty,
          duration,
          points: finalPoints,
          recordingType,
          blob,
          timestamp: new Date()
        })
        
        // Reset state
        setCurrentStep('categories')
        setSelectedCategory(null)
        setSelectedActivity(null)
        setRecordingType(null)
        setDuration(0)
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
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2">เลือกประเภทกิจกรรม</h2>
        <p className="text-gray-600 text-sm">เลือกประเภทที่ต้องการบันทึก</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {activityCategories.map(category => {
          const categoryActivities = activityTemplates.filter(a => a.category === category.name)
          return (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.name)
                setCurrentStep('activities')
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${category.color}`}>
                {category.name}
              </div>
              <p className="text-sm text-gray-600">{categoryActivities.length} กิจกรรม</p>
            </button>
          )
        })}
      </div>

      {/* Quick access to popular activities */}
      <div className="border-t pt-4">
        <h3 className="font-medium mb-3 flex items-center">
          <Star className="w-4 h-4 mr-2 text-yellow-500" />
          กิจกรรมยอดนิยม
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {activityTemplates.slice(0, 6).map(activity => (
            <button
              key={activity.id}
              onClick={() => {
                setSelectedActivity(activity)
                setCurrentStep('recording')
              }}
              className={`${activity.color} text-white p-3 rounded-lg hover:opacity-90 transition-opacity text-center`}
            >
              <activity.icon className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs">{activity.name}</span>
            </button>
          ))}
        </div>
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
          <span>{isRecording ? 'กำลังบันทึก...' : 'พร้อมบันทึก'}</span>
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
            className="w-full bg-blue-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <Camera className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-medium">บันทึกวิดีโอ</div>
              <div className="text-sm opacity-80">เหมาะสำหรับการเล่น กิจกรรม</div>
            </div>
          </button>
        </div>
      ) : (
        <button
          onClick={stopRecording}
          className="w-full bg-red-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <Square className="w-6 h-6 mr-3" />
          <div className="text-left">
            <div className="font-medium">หยุดบันทึก</div>
            <div className="text-sm opacity-80">
              {selectedActivity && duration >= selectedActivity.minDuration ? 
                'เวลาเพียงพอแล้ว!' : 
                `อีก ${selectedActivity ? Math.max(0, Math.ceil((selectedActivity.minDuration - duration) / 60)) : 0} นาที`}
            </div>
          </div>
        </button>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto mx-4">
        {currentStep === 'categories' && renderCategoriesStep()}
        {currentStep === 'activities' && renderActivitiesStep()}
        {currentStep === 'recording' && renderRecordingStep()}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
        >
          ปิด
        </button>
      </div>
    </div>
  )
}