import React, { useState } from 'react'
import { X, User, Baby, Heart, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onComplete: () => void
}

export const OnboardingModal: React.FC<Props> = ({ onComplete }) => {
  const { currentUser, updateUserData } = useAuth()
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | 'role' | 'complete'>('welcome')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    role: 'parent' as 'parent' | 'caretaker',
    childName: '',
    childAge: '',
    experience: ''
  })

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('profile')
    } else if (currentStep === 'profile') {
      setCurrentStep('role')
    } else if (currentStep === 'role') {
      setCurrentStep('complete')
    }
  }

  const handleComplete = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      await updateUserData({
        name: formData.name,
        role: formData.role,
        childName: formData.role === 'parent' ? formData.childName : undefined,
        childAge: formData.role === 'parent' && formData.childAge ? parseInt(formData.childAge) : undefined,
        experience: formData.role === 'caretaker' ? formData.experience : undefined,
        points: 100, // Welcome bonus
        level: 1,
        streak: 0
      })
      
      onComplete()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    } finally {
      setLoading(false)
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

  const renderRoleStep = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">คุณคือใคร?</h2>
      <p className="text-gray-600 text-center mb-6">เลือกบทบาทของคุณเพื่อปรับแต่งประสบการณ์การใช้งาน</p>

      <div className="space-y-4 mb-6">
        <button
          onClick={() => setFormData({ ...formData, role: 'parent' })}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            formData.role === 'parent'
              ? 'border-pink-500 bg-pink-50'
              : 'border-gray-200 bg-white hover:border-pink-300'
          }`}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mr-4">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">ผู้ปกครอง (พ่อแม่)</h3>
              <p className="text-sm text-gray-600">บันทึกกิจกรรมการดูแลลูกของคุณ</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFormData({ ...formData, role: 'caretaker' })}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            formData.role === 'caretaker'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-green-300'
          }`}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">ผู้ดูแลเด็ก</h3>
              <p className="text-sm text-gray-600">ดูแลเด็กและรับงานจากผู้ปกครอง</p>
            </div>
          </div>
        </button>
      </div>

      {formData.role === 'parent' && (
        <div className="space-y-4 bg-pink-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อลูก</label>
            <input
              type="text"
              value={formData.childName}
              onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
              placeholder="ระบุชื่อลูก"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อายุลูก (ปี)</label>
            <input
              type="number"
              value={formData.childAge}
              onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
              placeholder="ระบุอายุลูก"
              min="0"
              max="10"
            />
          </div>
        </div>
      )}

      {formData.role === 'caretaker' && (
        <div className="bg-green-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ประสบการณ์การดูแลเด็ก</label>
            <input
              type="text"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              placeholder="เช่น มี 3 ปี, เป็นยายข้างบ้าน"
            />
          </div>
        </div>
      )}

      <div className="flex space-x-3 mt-8">
        <button
          onClick={() => setCurrentStep('profile')}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
        >
          ย้อนกลับ
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
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
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            กำลังดำเนินการ...
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
              {['welcome', 'profile', 'role', 'complete'].map((step, index) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step === currentStep
                      ? 'bg-blue-500'
                      : ['welcome', 'profile', 'role', 'complete'].indexOf(currentStep) > index
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {currentStep === 'welcome' && renderWelcomeStep()}
          {currentStep === 'profile' && renderProfileStep()}
          {currentStep === 'role' && renderRoleStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  )
}