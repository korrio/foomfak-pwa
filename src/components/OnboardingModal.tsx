import React, { useState } from 'react'
import { X, User, Baby, Heart, CheckCircle, Calendar, Scale, Camera, Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ChildProfile } from '../types'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config'

interface Props {
  onComplete: () => void
}

export const OnboardingModal: React.FC<Props> = ({ onComplete }) => {
  const { currentUser, updateUserData, userData } = useAuth()
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | 'child' | 'complete'>('welcome')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ผู้ใช้',
    role: 'parent' as 'parent' | 'caretaker',
  })
  const [childProfile, setChildProfile] = useState<ChildProfile>({
    name: '',
    birthDate: new Date(),
    weight: 0,
    gender: 'male' as 'male' | 'female',
    photoUrl: ''
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    
    return age
  }

  const handlePhotoUpload = async (file: File): Promise<string> => {
    if (!currentUser) throw new Error('No authenticated user')
    
    const fileExtension = file.name.split('.').pop()
    const fileName = `child-photos/${currentUser.uid}/${Date.now()}.${fileExtension}`
    const storageRef = ref(storage, fileName)
    
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  }

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB')
      return
    }

    setPhotoFile(file)
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setChildProfile(prev => ({ ...prev, photoUrl: previewUrl }))
  }

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('profile')
    } else if (currentStep === 'profile') {
      if (formData.role === 'parent') {
        setCurrentStep('child')
      } else {
        setCurrentStep('complete')
      }
    } else if (currentStep === 'child') {
      setCurrentStep('complete')
    }
  }

  const handleComplete = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      const updateData: any = {
        name: formData.name,
        role: formData.role,
        points: (userData?.points || 0) + 100, // Add 100 welcome bonus to existing points
        level: 1,
        streak: 0
      }

      // Add child profile for parents
      if (formData.role === 'parent' && childProfile.name) {
        let finalPhotoUrl = childProfile.photoUrl

        // Upload photo if selected
        if (photoFile) {
          setUploadingPhoto(true)
          try {
            finalPhotoUrl = await handlePhotoUpload(photoFile)
          } catch (error) {
            console.error('Failed to upload photo:', error)
            // Continue without photo if upload fails
            finalPhotoUrl = ''
          } finally {
            setUploadingPhoto(false)
          }
        }

        const profileWithAge: ChildProfile = {
          ...childProfile,
          photoUrl: finalPhotoUrl,
          age: calculateAge(childProfile.birthDate)
        }
        updateData.childProfile = profileWithAge
        
        // Keep backward compatibility
        updateData.childName = childProfile.name
        updateData.childAge = calculateAge(childProfile.birthDate)
      }

      await updateUserData(updateData)
      onComplete()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    } finally {
      setLoading(false)
      setUploadingPhoto(false)
    }
  }

  const renderWelcomeStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Heart className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">ยินดีต้อนรับสู่ฟูมฟัก!</h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        แอปพลิเคชันดูแลลูกวัยปฐมวัยที่จะช่วยให้คุณบันทึกกิจกรรมการดูแลลูก 
        รับแต้มสะสม และแลกรางวัลที่มีประโยชน์
      </p>
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">คุณจะได้รับ:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• แต้มสะสมจากการบันทึกกิจกรรม</li>
          <li>• ความท้าทายและความสำเร็จรายวัน</li>
          <li>• รางวัลและส่วนลดจากร้านค้าพันธมิตร</li>
          <li>• คำแนะนำการดูแลลูกจากผู้เชี่ยวชาญ</li>
        </ul>
      </div>
      <button
        onClick={handleNext}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
      >
        เริ่มต้นใช้งาน
      </button>
    </div>
  )

  const renderProfileStep = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">ข้อมูลส่วนตัว</h2>
      <p className="text-gray-600 text-center mb-6">กรุณาระบุข้อมูลพื้นฐานเพื่อใช้งานแอป</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="ระบุชื่อ-นามสกุลของคุณ"
            required
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">บทบาทของคุณ</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'parent' })}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                formData.role === 'parent'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <Heart className="w-6 h-6 mb-2" />
                <span className="font-medium">ผู้ปกครอง</span>
                <span className="text-xs text-gray-500 mt-1">พ่อ แม่ หรือผู้ปกครอง</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'caretaker' })}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                formData.role === 'caretaker'
                  ? 'border-purple-500 bg-purple-50 text-purple-800'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <User className="w-6 h-6 mb-2" />
                <span className="font-medium">ผู้ดูแล</span>
                <span className="text-xs text-gray-500 mt-1">ครู พี่เลี้ยง หรือผู้ช่วย</span>
              </div>
            </button>
          </div>
        </div>
        
        {currentUser?.isAnonymous && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-700">
              💡 คุณกำลังใช้บัญชีแขก ข้อมูลจะถูกเก็บไว้ชั่วคราว
            </p>
          </div>
        )}
      </div>

      <div className="flex space-x-3 mt-8">
        <button
          onClick={() => setCurrentStep('welcome')}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
        >
          ย้อนกลับ
        </button>
        <button
          onClick={handleNext}
          disabled={!formData.name.trim()}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>
    </div>
  )

  const renderChildStep = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">ข้อมูลลูกน้อย</h2>
      <p className="text-gray-600 text-center mb-6">กรุณาใส่ข้อมูลลูกเพื่อปรับแต่งกิจกรรมให้เหมาะสม</p>

      <div className="space-y-6">
        {/* รูปภาพลูก */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Camera className="w-4 h-4 mr-2 text-purple-500" />
            รูปภาพลูก (ไม่บังคับ)
          </label>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-3 overflow-hidden">
              {childProfile.photoUrl ? (
                <img 
                  src={childProfile.photoUrl} 
                  alt="Child preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
              id="child-photo-upload"
            />
            <label
              htmlFor="child-photo-upload"
              className="cursor-pointer bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm hover:bg-purple-100 transition-colors flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              {childProfile.photoUrl ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ'}
            </label>
            <p className="text-xs text-gray-500 mt-1 text-center">
              รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
            </p>
          </div>
        </div>

        {/* ชื่อลูกน้อย */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Baby className="w-4 h-4 mr-2 text-pink-500" />
            ชื่อลูกน้อย
          </label>
          <input
            type="text"
            value={childProfile.name}
            onChange={(e) => setChildProfile({ ...childProfile, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
            placeholder="ระบุชื่อลูก"
            required
          />
        </div>

        {/* วันเกิด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
            วันเกิด
          </label>
          <input
            type="date"
            value={childProfile.birthDate.toISOString().split('T')[0]}
            onChange={(e) => setChildProfile({ ...childProfile, birthDate: new Date(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            max={new Date().toISOString().split('T')[0]} // ไม่เกินวันนี้
            required
          />
          {childProfile.birthDate && (
            <p className="text-xs text-gray-500 mt-1">
              อายุ: {calculateAge(childProfile.birthDate)} ปี
            </p>
          )}
        </div>

        {/* น้ำหนัก */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Scale className="w-4 h-4 mr-2 text-green-500" />
            น้ำหนัก (กก.)
          </label>
          <input
            type="number"
            value={childProfile.weight || ''}
            onChange={(e) => setChildProfile({ ...childProfile, weight: parseFloat(e.target.value) || 0 })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            placeholder="ระบุน้ำหนัก"
            min="1"
            max="50"
            step="0.1"
            required
          />
        </div>

        {/* เพศ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">เพศ</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setChildProfile({ ...childProfile, gender: 'male' })}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                childProfile.gender === 'male'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              👦 เด็กชาย
            </button>
            <button
              type="button"
              onClick={() => setChildProfile({ ...childProfile, gender: 'female' })}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                childProfile.gender === 'female'
                  ? 'border-pink-500 bg-pink-50 text-pink-800'
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
            >
              👧 เด็กหญิง
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mt-8">
        <button
          onClick={() => setCurrentStep('profile')}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
        >
          ย้อนกลับ
        </button>
        <button
          onClick={handleNext}
          disabled={!childProfile.name.trim() || !childProfile.weight}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">ยินดีด้วย!</h2>
      <p className="text-gray-600 mb-6">
        คุณได้ตั้งค่าบัญชีเรียบร้อยแล้ว พร้อมเริ่มบันทึกกิจกรรมและสะสมแต้มกันเลย!
      </p>

      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-white mb-2">🎉 โบนัสต้อนรับ</h3>
        <p className="text-white text-sm">คุณได้รับ 100 แต้มฟรี เพื่อเริ่มต้นการใช้งาน</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">เริ่มต้นด้วย:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• บันทึกกิจกรรมแรกของคุณ</li>
          <li>• ดูความท้าทายรายวัน</li>
          <li>• เยี่ยมชมร้านแลกรางวัล</li>
          <li>• ตั้งค่าการแจ้งเตือน</li>
        </ul>
      </div>

      <button
        onClick={handleComplete}
        disabled={loading || uploadingPhoto}
        className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50"
      >
        {loading || uploadingPhoto ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {uploadingPhoto ? 'กำลังอัพโหลดรูปภาพ...' : 'กำลังดำเนินการ...'}
          </div>
        ) : (
          'เริ่มใช้งานฟูมฟัก!'
        )}
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto mx-4">
        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex space-x-2">
              {['welcome', 'profile', 'child', 'complete'].map((step, index) => {
                // Hide child step for caretakers
                if (step === 'child' && formData.role === 'caretaker') {
                  return null
                }
                
                return (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step === currentStep
                        ? 'bg-blue-500'
                        : ['welcome', 'profile', 'child', 'complete'].indexOf(currentStep) > index
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {currentStep === 'welcome' && renderWelcomeStep()}
          {currentStep === 'profile' && renderProfileStep()}
          {currentStep === 'child' && renderChildStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  )
}