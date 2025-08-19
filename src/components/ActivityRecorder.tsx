import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Camera, Mic, Clock, Baby, Heart, Utensils, Bath, BookOpen, Gamepad2 } from 'lucide-react'
import { createMediaRecorder } from '../utils/mediaRecorder'
import { requestMicrophonePermission, requestCameraPermission } from '../utils/permissions'

interface Activity {
  id: string
  type: string
  name: string
  icon: React.ReactNode
  points: number
  color: string
}

const activities: Activity[] = [
  { id: 'feeding', type: 'feeding', name: 'ให้อาหาร', icon: <Utensils className="w-6 h-6" />, points: 50, color: 'bg-orange-500' },
  { id: 'reading', type: 'reading', name: 'อ่านนิทาน', icon: <BookOpen className="w-6 h-6" />, points: 100, color: 'bg-blue-500' },
  { id: 'playing', type: 'playing', name: 'เล่นกับลูก', icon: <Gamepad2 className="w-6 h-6" />, points: 80, color: 'bg-green-500' },
  { id: 'bathing', type: 'bathing', name: 'อาบน้ำ', icon: <Bath className="w-6 h-6" />, points: 60, color: 'bg-cyan-500' },
  { id: 'health', type: 'health', name: 'ตรวจสุขภาพ', icon: <Heart className="w-6 h-6" />, points: 120, color: 'bg-red-500' },
  { id: 'sleep', type: 'sleep', name: 'นอนหลับ', icon: <Baby className="w-6 h-6" />, points: 40, color: 'bg-purple-500' }
]

interface Props {
  onActivityComplete: (activity: any) => void
  onClose: () => void
}

export const ActivityRecorder: React.FC<Props> = ({ onActivityComplete, onClose }) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
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
        const points = Math.min(selectedActivity.points + Math.floor(duration / 60) * 10, selectedActivity.points * 2)
        
        onActivityComplete({
          id: Date.now().toString(),
          activityId: selectedActivity.id,
          type: selectedActivity.type,
          name: selectedActivity.name,
          duration,
          points,
          recordingType,
          blob,
          timestamp: new Date()
        })
        
        // Reset state
        setSelectedActivity(null)
        setRecordingType(null)
        setDuration(0)
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }

  if (!selectedActivity) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96 max-h-screen overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-center">เลือกกิจกรรมที่จะบันทึก</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {activities.map(activity => (
              <button
                key={activity.id}
                onClick={() => setSelectedActivity(activity)}
                className={`${activity.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity`}
              >
                <div className="flex flex-col items-center">
                  {activity.icon}
                  <span className="text-sm mt-2 font-medium">{activity.name}</span>
                  <span className="text-xs mt-1">+{activity.points} แต้ม</span>
                </div>
              </button>
            ))}
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-4 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            ปิด
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="text-center mb-6">
          <div className={`${selectedActivity.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3`}>
            <span className="text-white text-2xl">{selectedActivity.icon}</span>
          </div>
          <h3 className="text-lg font-bold">{selectedActivity.name}</h3>
          <p className="text-sm text-gray-600">+{selectedActivity.points} แต้มพื้นฐาน</p>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            <span className="text-2xl font-mono">{formatTime(duration)}</span>
          </div>
          
          {isRecording && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${selectedActivity.color.replace('bg-', 'bg-')} h-2 rounded-full transition-all duration-1000`}
                style={{ width: `${Math.min((duration / 300) * 100, 100)}%` }}
              />
            </div>
          )}
          
          <p className="text-xs text-center mt-2">
            {isRecording ? 'กำลังบันทึก...' : 'เตรียมพร้อมสำหรับการบันทึก'}
          </p>
        </div>

        {!isRecording ? (
          <div className="space-y-3">
            <button
              onClick={() => startRecording('audio')}
              className="w-full bg-green-500 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-600"
            >
              <Mic className="w-5 h-5 mr-2" />
              บันทึกเสียง
            </button>
            <button
              onClick={() => startRecording('video')}
              className="w-full bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center hover:bg-blue-600"
            >
              <Camera className="w-5 h-5 mr-2" />
              บันทึกวิดีโอ
            </button>
          </div>
        ) : (
          <button
            onClick={stopRecording}
            className="w-full bg-red-500 text-white p-3 rounded-lg flex items-center justify-center hover:bg-red-600"
          >
            <Square className="w-5 h-5 mr-2" />
            หยุดบันทึก
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}