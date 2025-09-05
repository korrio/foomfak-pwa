import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { offlineEQAssessmentService } from '../services/offlineEQAssessmentService'
import { EQAssessment as EQAssessmentType } from '../data/eqQuestionnaire'
import { 
  X, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Award,
  BarChart3,
  CheckCircle,
  PlayCircle,
  ArrowRight
} from 'lucide-react'

interface Props {
  onStartAssessment: (type: 'pre-test' | 'post-test') => void
  onClose: () => void
  refreshTrigger?: number // Add optional prop to trigger refresh
}

export const AssessmentDashboard: React.FC<Props> = ({ onStartAssessment, onClose, refreshTrigger }) => {
  const { currentUser } = useAuth()
  const [assessments, setAssessments] = useState<EQAssessmentType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      loadAssessments()
    }
  }, [currentUser])

  // Refresh assessments when refreshTrigger changes
  useEffect(() => {
    if (currentUser && refreshTrigger) {
      loadAssessments()
    }
  }, [refreshTrigger, currentUser])

  const loadAssessments = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      const userAssessments = await offlineEQAssessmentService.getUserAssessments(currentUser.uid)
      setAssessments(userAssessments)
    } catch (error) {
      console.error('Failed to load assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLatestAssessment = (type: 'pre-test' | 'post-test') => {
    return assessments
      .filter(a => a.type === type)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())[0]
  }

  const preTest = getLatestAssessment('pre-test')
  const postTest = getLatestAssessment('post-test')

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const renderAssessmentCard = (
    type: 'pre-test' | 'post-test',
    title: string,
    description: string,
    assessment: EQAssessmentType | undefined
  ) => (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg mr-4 ${
            type === 'pre-test' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            <FileText className={`w-6 h-6 ${
              type === 'pre-test' ? 'text-blue-600' : 'text-green-600'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        </div>
        {assessment && (
          <CheckCircle className="w-6 h-6 text-green-500" />
        )}
      </div>

      {assessment ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">ครั้งล่าสุด:</span>
            <span className="text-sm font-medium">{formatDate(assessment.completedAt)}</span>
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className={`text-lg font-bold ${
                assessment.interpretation.good === 'สูงกว่าเกณฑ์' ? 'text-green-600' :
                assessment.interpretation.good === 'ปกติ' ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {assessment.scores.good}
              </div>
              <div className="text-xs text-gray-600">ด้านดี</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                assessment.interpretation.smart === 'สูงกว่าเกณฑ์' ? 'text-green-600' :
                assessment.interpretation.smart === 'ปกติ' ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {assessment.scores.smart}
              </div>
              <div className="text-xs text-gray-600">ด้านเก่ง</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                assessment.interpretation.happy === 'สูงกว่าเกณฑ์' ? 'text-green-600' :
                assessment.interpretation.happy === 'ปกติ' ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {assessment.scores.happy}
              </div>
              <div className="text-xs text-gray-600">ด้านสุข</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                assessment.interpretation.overall === 'สูงกว่าเกณฑ์' ? 'text-green-600' :
                assessment.interpretation.overall === 'ปกติ' ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {assessment.scores.total}
              </div>
              <div className="text-xs text-gray-600">รวม/60</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-gray-500 text-sm">ยังไม่ได้ทำแบบประเมิน</div>
        </div>
      )}

      <button
        onClick={() => onStartAssessment(type)}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
          type === 'pre-test'
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-green-500 text-white hover:bg-green-600'
        }`}
      >
        <PlayCircle className="w-5 h-5 mr-2" />
        {assessment ? 'ทำใหม่' : 'เริ่มทำแบบประเมิน'}
      </button>
    </div>
  )

  const renderComparison = () => {
    if (!preTest || !postTest) return null

    const improvement = {
      good: postTest.scores.good - preTest.scores.good,
      smart: postTest.scores.smart - preTest.scores.smart,
      happy: postTest.scores.happy - preTest.scores.happy,
      total: postTest.scores.total - preTest.scores.total
    }

    return (
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-6 h-6 mr-2" />
          <h3 className="font-bold text-lg">ความก้าวหน้า</h3>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className={`text-lg font-bold ${improvement.good >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {improvement.good >= 0 ? '+' : ''}{improvement.good}
            </div>
            <div className="text-xs opacity-90">ด้านดี</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${improvement.smart >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {improvement.smart >= 0 ? '+' : ''}{improvement.smart}
            </div>
            <div className="text-xs opacity-90">ด้านเก่ง</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${improvement.happy >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {improvement.happy >= 0 ? '+' : ''}{improvement.happy}
            </div>
            <div className="text-xs opacity-90">ด้านสุข</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${improvement.total >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {improvement.total >= 0 ? '+' : ''}{improvement.total}
            </div>
            <div className="text-xs opacity-90">รวม</div>
          </div>
        </div>

        {improvement.total > 0 && (
          <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
            <div className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              <span className="text-sm">
                ยินดีด้วย! ลูกมีความฉลาดทางอารมณ์เพิ่มขึ้น {improvement.total} คะแนน
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-xl font-bold text-gray-800">แบบประเมินความฉลาดทางอารมณ์</h1>
            <p className="text-gray-600 text-sm">ติดตามพัฒนาการของลูกก่อนและหลังใช้แอป</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <BarChart3 className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">วิธีการใช้งาน</h3>
                  <p className="text-blue-700 text-sm">
                    ทำแบบประเมิน <strong>ก่อนใช้แอป</strong> เพื่อวัดพื้นฐาน จากนั้นใช้แอปบันทึกกิจกรรมกับลูก 
                    และทำแบบประเมิน <strong>หลังใช้แอป</strong> เพื่อดูความก้าวหน้า
                  </p>
                </div>
              </div>
            </div>

            {/* Pre-test Card */}
            {renderAssessmentCard(
              'pre-test',
              'แบบประเมินก่อนใช้แอป',
              'วัดความฉลาดทางอารมณ์ของลูกก่อนเริ่มใช้กิจกรรม',
              preTest
            )}

            {/* Post-test Card */}
            {renderAssessmentCard(
              'post-test',
              'แบบประเมินหลังใช้แอป',
              'วัดความฉลาดทางอารมณ์ของลูกหลังใช้กิจกรรมแล้ว',
              postTest
            )}

            {/* Comparison */}
            {renderComparison()}

            {/* History */}
            {assessments.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3">ประวัติการประเมิน</h3>
                <div className="space-y-2">
                  {assessments.slice(0, 5).map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mr-2 ${
                          assessment.type === 'pre-test' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {assessment.type === 'pre-test' ? 'ก่อนใช้แอป' : 'หลังใช้แอป'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatDate(assessment.completedAt)}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {assessment.scores.total}/60 คะแนน
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}