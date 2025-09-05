import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { offlineEQAssessmentService } from '../services/offlineEQAssessmentService'
import { 
  eqQuestions, 
  assessmentInstructions, 
  EQResponse, 
  EQAssessment as EQAssessmentType 
} from '../data/eqQuestionnaire'
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Heart,
  Brain,
  Smile,
  FileText,
  Award
} from 'lucide-react'

interface Props {
  type: 'pre-test' | 'post-test'
  onComplete: (assessment: EQAssessmentType) => void
  onClose: () => void
}

export const EQAssessment: React.FC<Props> = ({ type, onComplete, onClose }) => {
  const { currentUser, userData } = useAuth()
  const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'results'>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<EQResponse[]>([])
  const [childAge, setChildAge] = useState<number>(
    userData?.childAge || 
    userData?.childProfile?.age || 
    (userData?.childProfile?.birthDate ? 
      new Date().getFullYear() - new Date(userData.childProfile.birthDate).getFullYear() : 3)
  )
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<EQAssessmentType | null>(null)

  const currentQuestion = eqQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / eqQuestions.length) * 100

  const handleResponse = (value: 1 | 2 | 3 | 4) => {
    const newResponses = [...responses]
    const existingIndex = newResponses.findIndex(r => r.questionId === currentQuestion.id)
    
    if (existingIndex >= 0) {
      newResponses[existingIndex].value = value
    } else {
      newResponses.push({ questionId: currentQuestion.id, value })
    }
    
    setResponses(newResponses)
  }

  const getCurrentResponse = (): number | null => {
    const response = responses.find(r => r.questionId === currentQuestion.id)
    return response ? response.value : null
  }

  const canProceed = () => {
    return getCurrentResponse() !== null
  }

  const handleNext = () => {
    if (currentQuestionIndex < eqQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!currentUser || responses.length !== eqQuestions.length) {
      console.error('Invalid submission:', { 
        currentUser: !!currentUser, 
        responsesLength: responses.length, 
        expectedLength: eqQuestions.length 
      })
      return
    }

    setLoading(true)
    try {
      console.log('Starting EQ assessment submission...')
      console.log('User ID:', currentUser.uid)
      console.log('Child age:', childAge)
      console.log('Assessment type:', type)
      console.log('Responses:', responses)
      
      const scores = offlineEQAssessmentService.calculateScores(responses)
      console.log('Calculated scores:', scores)
      
      const interpretation = offlineEQAssessmentService.interpretScores(scores)
      console.log('Interpretation:', interpretation)

      const assessment: Omit<EQAssessmentType, 'id' | 'completedAt'> = {
        userId: currentUser.uid,
        childAge,
        type,
        responses,
        scores,
        interpretation
      }

      const savedAssessment = await offlineEQAssessmentService.saveAssessment(assessment)

      setResults(savedAssessment)
      setCurrentStep('results')
      onComplete(savedAssessment)
    } catch (error: any) {
      console.error('Failed to save assessment:', error)
      
      // More specific error messages
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกผล กรุณาลองใหม่'
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'ไม่มีสิทธิ์ในการบันทึกข้อมูล กรุณาเข้าสู่ระบบใหม่'
      } else if (error?.code === 'unavailable') {
        errorMessage = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      } else if (error?.message?.includes('Missing or insufficient permissions')) {
        errorMessage = 'ไม่มีสิทธิ์ในการเข้าถึงข้อมูล กรุณาเข้าสู่ระบบใหม่'
      }
      
      alert(errorMessage)
      
      // Even if saving fails, still show results for user feedback
      const fallbackScores = offlineEQAssessmentService.calculateScores(responses)
      const localAssessment: EQAssessmentType = {
        id: 'local_assessment',
        userId: currentUser.uid,
        childAge,
        type,
        responses,
        scores: fallbackScores,
        interpretation: offlineEQAssessmentService.interpretScores(fallbackScores),
        completedAt: new Date(),
        synced: false
      }
      
      setResults(localAssessment)
      setCurrentStep('results')
    } finally {
      setLoading(false)
    }
  }

  const renderIntro = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <FileText className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {assessmentInstructions.title}
        </h2>
        <p className="text-lg text-blue-600 mb-2">
          {type === 'pre-test' ? 'แบบประเมินก่อนใช้แอป' : 'แบบประเมินหลังใช้แอป'}
        </p>
        <p className="text-gray-600">
          {assessmentInstructions.subtitle}
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-bold text-blue-800 mb-3">วัตถุประสงค์:</h3>
        <p className="text-blue-700 text-sm">
          {assessmentInstructions.description}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="font-bold text-gray-800">เกณฑ์การตอบ:</h3>
        {assessmentInstructions.options.map((option) => (
          <div key={option.value} className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              {option.value}
            </div>
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Child age is automatically fetched from user profile data */}

      <button
        onClick={() => setCurrentStep('questions')}
        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
      >
        เริ่มทำแบบประเมิน
        <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  )

  const renderQuestions = () => (
    <div className="p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            คำถามที่ {currentQuestionIndex + 1} จาก {eqQuestions.length}
          </span>
          <span className="text-sm text-blue-600 font-medium">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Category Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          currentQuestion.category === 'good' ? 'bg-green-100 text-green-800' :
          currentQuestion.category === 'smart' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {currentQuestion.category === 'good' ? <Heart className="w-4 h-4 mr-1" /> :
           currentQuestion.category === 'smart' ? <Brain className="w-4 h-4 mr-1" /> :
           <Smile className="w-4 h-4 mr-1" />}
          {currentQuestion.category === 'good' ? 'ด้านดี' :
           currentQuestion.category === 'smart' ? 'ด้านเก่ง' : 'ด้านสุข'}
        </span>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          {currentQuestion.question}
        </h3>
        <p className="text-gray-600 text-sm">
          {currentQuestion.description}
        </p>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-6">
        {assessmentInstructions.options.map((option) => {
          const isSelected = getCurrentResponse() === option.value
          return (
            <button
              key={option.value}
              onClick={() => handleResponse(option.value as 1 | 2 | 3 | 4)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-800' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          ก่อนหน้า
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <>
              {currentQuestionIndex === eqQuestions.length - 1 ? 'ดูผล' : 'ถัดไป'}
              <ChevronRight className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  )

  const renderResults = () => {
    if (!results) {
      return (
        <div className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto mb-2" />
            <h3 className="text-lg font-medium">ไม่พบผลการประเมิน</h3>
            <p className="text-sm text-gray-600">กรุณาลองทำแบบประเมินใหม่</p>
          </div>
          <button
            onClick={() => {
              setCurrentStep('intro')
              setCurrentQuestionIndex(0)
              setResponses([])
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            ทำแบบประเมินใหม่
          </button>
        </div>
      )
    }

    const report = offlineEQAssessmentService.generateReport(results)

    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Award className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ผลการประเมิน{type === 'pre-test' ? 'ก่อนใช้แอป' : 'หลังใช้แอป'}
          </h2>
          <p className="text-gray-600">
            ความฉลาดทางอารมณ์ของลูก
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{results.scores.total}/60</div>
            <div className="text-lg mb-1">คะแนนรวม</div>
            <div className="text-sm opacity-90">
              ระดับ: {results.interpretation.overall}
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="space-y-4 mb-6">
          {report.details.map((detail, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">{detail.category}</h3>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  detail.interpretation === 'สูงกว่าเกณฑ์' ? 'bg-green-100 text-green-800' :
                  detail.interpretation === 'ปกติ' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {detail.interpretation}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{detail.score}/{detail.maxScore} คะแนน</span>
                  <span>{detail.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${detail.percentage}%` }}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">คำแนะนำ:</h4>
                <ul className="space-y-1">
                  {detail.recommendations.map((rec, recIndex) => (
                    <li key={recIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-gray-800 mb-2">สรุป</h3>
          <p className="text-gray-600 text-sm">{report.summary}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          เสร็จสิ้น
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-bold text-gray-800">
            แบบประเมิน EQ {type === 'pre-test' ? 'ก่อนใช้แอป' : 'หลังใช้แอป'}
          </h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {currentStep === 'intro' && renderIntro()}
        {currentStep === 'questions' && renderQuestions()}
        {currentStep === 'results' && renderResults()}
      </div>
    </div>
  )
}