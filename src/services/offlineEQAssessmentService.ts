/**
 * Offline-First EQ Assessment Service
 * Uses IndexedDB as primary storage, Firebase as backup sync
 */

import { offlineStorage } from './offlineStorageService'
import { eqAssessmentService as firebaseEQService } from './eqAssessmentService'
import { 
  eqQuestions, 
  interpretationCriteria,
  EQResponse 
} from '../data/eqQuestionnaire'

export interface EQAssessment {
  id: string
  userId: string
  childAge: number
  type: 'pre-test' | 'post-test'
  responses: EQResponse[]
  scores: {
    good: number
    smart: number
    happy: number
    total: number
  }
  interpretation: {
    good: string
    smart: string
    happy: string
    overall: string
  }
  completedAt: Date
  synced: boolean
  syncedAt?: Date
}

class OfflineEQAssessmentService {
  private isOnline = navigator.onLine

  constructor() {
    // Listen for online/offline changes
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncPendingAssessments()
    })
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  /**
   * Calculate EQ scores from responses
   */
  calculateScores(responses: EQResponse[]): EQAssessment['scores'] {
    const scores = { good: 0, smart: 0, happy: 0, total: 0 }
    
    responses.forEach(response => {
      const question = eqQuestions.find(q => q.id === response.questionId)
      if (!question) return

      let score = response.value
      
      // For reverse scoring questions
      if (question.reverseScoring) {
        score = 5 - response.value // 1->4, 2->3, 3->2, 4->1
      }

      // Add score to appropriate category
      scores[question.category] += score
    })

    scores.total = scores.good + scores.smart + scores.happy
    return scores
  }

  /**
   * Interpret scores based on criteria
   */
  interpretScores(scores: EQAssessment['scores']): EQAssessment['interpretation'] {
    const interpretScore = (score: number, category: keyof typeof interpretationCriteria) => {
      const criteria = interpretationCriteria[category]
      if (score >= criteria.high.min && score <= criteria.high.max) return 'สูงกว่าเกณฑ์' as const
      if (score >= criteria.normal.min && score <= criteria.normal.max) return 'ปกติ' as const
      return 'ต่ำกว่าเกณฑ์' as const
    }

    return {
      good: interpretScore(scores.good, 'good'),
      smart: interpretScore(scores.smart, 'smart'), 
      happy: interpretScore(scores.happy, 'happy'),
      overall: interpretScore(scores.total, 'overall')
    }
  }

  /**
   * Save assessment to offline storage
   */
  async saveAssessment(assessmentData: {
    userId: string
    childAge: number
    type: 'pre-test' | 'post-test'
    responses: EQResponse[]
  }): Promise<EQAssessment> {
    const now = new Date()
    const scores = this.calculateScores(assessmentData.responses)
    const interpretation = this.interpretScores(scores)

    const assessment: EQAssessment = {
      id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: assessmentData.userId,
      childAge: assessmentData.childAge,
      type: assessmentData.type,
      responses: assessmentData.responses,
      scores,
      interpretation,
      completedAt: now,
      synced: false
    }

    // Save to offline storage
    await offlineStorage.create('assessments', assessment)

    console.log('EQ assessment saved to offline storage:', assessment.id)

    // Try to sync if online
    if (this.isOnline) {
      this.syncAssessment(assessment).catch(console.error)
    }

    return assessment
  }

  /**
   * Get user's assessments from offline storage
   */
  async getUserAssessments(userId: string): Promise<EQAssessment[]> {
    return await offlineStorage.getUserAssessments(userId)
  }

  /**
   * Get latest assessment of specific type
   */
  async getLatestAssessment(userId: string, type?: 'pre-test' | 'post-test'): Promise<EQAssessment | null> {
    const assessments = await offlineStorage.getUserAssessments(userId, type)
    return assessments.length > 0 ? assessments[0] : null
  }

  /**
   * Get assessment by ID
   */
  async getAssessmentById(assessmentId: string): Promise<EQAssessment | null> {
    return await offlineStorage.get('assessments', assessmentId)
  }

  /**
   * Compare pre-test and post-test results
   */
  async compareAssessments(userId: string): Promise<{
    preTest: EQAssessment | null
    postTest: EQAssessment | null
    improvement: {
      good: number
      smart: number
      happy: number
      total: number
    } | null
  }> {
    const preTest = await this.getLatestAssessment(userId, 'pre-test')
    const postTest = await this.getLatestAssessment(userId, 'post-test')
    
    let improvement = null
    if (preTest && postTest) {
      improvement = {
        good: postTest.scores.good - preTest.scores.good,
        smart: postTest.scores.smart - preTest.scores.smart,
        happy: postTest.scores.happy - preTest.scores.happy,
        total: postTest.scores.total - preTest.scores.total
      }
    }

    return { preTest, postTest, improvement }
  }

  /**
   * Generate comprehensive report for assessment
   */
  generateReport(assessment: EQAssessment): {
    summary: string
    details: Array<{
      category: string
      score: number
      maxScore: number
      percentage: number
      interpretation: string
      recommendations: string[]
    }>
  } {
    const details = [
      {
        category: 'ด้านดี (มีจิตใจดี มีคุณธรรม)',
        score: assessment.scores.good,
        maxScore: 20,
        percentage: Math.round((assessment.scores.good / 20) * 100),
        interpretation: assessment.interpretation.good,
        recommendations: this.getRecommendations('good', assessment.interpretation.good)
      },
      {
        category: 'ด้านเก่ง (มีความสามารถในการเรียนรู้)',
        score: assessment.scores.smart,
        maxScore: 20,
        percentage: Math.round((assessment.scores.smart / 20) * 100),
        interpretation: assessment.interpretation.smart,
        recommendations: this.getRecommendations('smart', assessment.interpretation.smart)
      },
      {
        category: 'ด้านสุข (มีความสุขและสร้างความสุขให้ผู้อื่น)',
        score: assessment.scores.happy,
        maxScore: 20,
        percentage: Math.round((assessment.scores.happy / 20) * 100),
        interpretation: assessment.interpretation.happy,
        recommendations: this.getRecommendations('happy', assessment.interpretation.happy)
      }
    ]

    const overallPercentage = Math.round((assessment.scores.total / 60) * 100)
    
    let summary = `ลูกของคุณมีความฉลาดทางอารมณ์โดยรวมอยู่ในระดับ${assessment.interpretation.overall} (${assessment.scores.total}/60 คะแนน, ${overallPercentage}%)`

    return { summary, details }
  }

  /**
   * Get recommendations for specific category and level
   */
  getRecommendations(category: 'good' | 'smart' | 'happy', level: string): string[] {
    const recommendations = {
      good: {
        'สูงกว่าเกณฑ์': [
          'เป็นแบบอย่างที่ดีให้เพื่อนๆ',
          'ส่งเสริมให้เป็นผู้นำในการทำความดี',
          'ชมเชยและให้กำลังใจเมื่อแสดงพฤติกรรมดี'
        ],
        'ปกติ': [
          'อ่านนิทานที่มีข้อคิดเรื่องคุณธรรม',
          'ให้เป็นตัวอย่างในการแบ่งปันและช่วยเหลือ',
          'สอนให้ขอโทษเมื่อทำผิดและยกย่องเมื่อแสดงความดี'
        ],
        'ต่ำกว่าเกณฑ์': [
          'สอนด้วยแบบอย่างที่ดีจากผู้ใหญ่',
          'ฝึกการแบ่งปันและช่วยเหลือผู้อื่นเป็นประจำ',
          'ใช้การเล่นเพื่อสอนเรื่องความดีและความเห็นใจ'
        ]
      },
      smart: {
        'สูงกว่าเกณฑ์': [
          'ท้าทายด้วยกิจกรรมที่ซับซ้อนขึ้น',
          'ส่งเสริมความอยากรู้อยากเห็นด้วยการสำรวจสิ่งใหม่',
          'ให้โอกาสแก้ปัญหาด้วยตนเอง'
        ],
        'ปกติ': [
          'อ่านหนังสือและเล่าเรื่องที่กระตุ้นการคิด',
          'ให้เลือกกิจกรรมที่ตนเองสนใจ',
          'ตอบคำถามอย่างเป็นมิตรและอดทน'
        ],
        'ต่ำกว่าเกณฑ์': [
          'เริ่มจากกิจกรรมง่ายๆ ที่เด็กสนใจ',
          'ให้เวลาในการเรียนรู้และไม่เร่งรีบ',
          'สร้างบรรยากาศการเรียนรู้ที่สนุกสนาน'
        ]
      },
      happy: {
        'สูงกว่าเกณฑ์': [
          'เป็นแหล่งแรงบันดาลใจให้เพื่อนๆ',
          'ส่งเสริมให้แสดงความสุขในกิจกรรมต่างๆ',
          'สนับสนุนให้เข้าสังคมและสร้างมิตรภาพ'
        ],
        'ปกติ': [
          'จัดกิจกรรมสนุกๆ ร่วมกับเพื่อนและครอบครัว',
          'สร้างโอกาสให้ได้แสดงความสามารถ',
          'ชื่นชมและให้กำลังใจอย่างสม่ำเสมอ'
        ],
        'ต่ำกว่าเกณฑ์': [
          'หากิจกรรมที่เด็กชอบและเก่งเพื่อสร้างความมั่นใจ',
          'ค่อยๆ ให้เข้าสังคมโดยเริ่มจากกลุ่มเล็ก',
          'แสดงความรักและการยอมรับอย่างไม่มีเงื่อนไข'
        ]
      }
    }

    return recommendations[category][level as keyof typeof recommendations[typeof category]] || []
  }

  /**
   * Sync single assessment to Firebase (when online)
   */
  private async syncAssessment(assessment: EQAssessment): Promise<void> {
    if (!this.isOnline) return

    try {
      // Convert to Firebase format (without local-specific fields)
      const firebaseAssessment = {
        userId: assessment.userId,
        childAge: assessment.childAge,
        type: assessment.type,
        responses: assessment.responses,
        scores: assessment.scores,
        interpretation: assessment.interpretation,
        completedAt: assessment.completedAt
      }

      // Attempt to save to Firebase
      await firebaseEQService.saveAssessment(firebaseAssessment)
      
      // Mark as synced in offline storage
      await offlineStorage.markAsSynced('assessments', assessment.id)
      
      console.log(`Assessment ${assessment.id} synced to Firebase`)
    } catch (error) {
      console.error(`Failed to sync assessment ${assessment.id}:`, error)
      // Assessment remains unsynced and will be retried later
    }
  }

  /**
   * Sync all pending assessments to Firebase
   */
  async syncPendingAssessments(): Promise<void> {
    if (!this.isOnline) return

    try {
      const unsyncedData = await offlineStorage.getUnsyncedData()
      const { assessments } = unsyncedData

      console.log(`Syncing ${assessments.length} pending assessments...`)

      for (const assessment of assessments) {
        await this.syncAssessment(assessment)
        // Small delay to avoid overwhelming Firebase
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log('All assessments synced successfully')
    } catch (error) {
      console.error('Failed to sync pending assessments:', error)
    }
  }

  /**
   * Delete assessment
   */
  async deleteAssessment(assessmentId: string, userId: string): Promise<void> {
    const assessment = await offlineStorage.get('assessments', assessmentId)
    if (!assessment || assessment.userId !== userId) {
      throw new Error('Assessment not found or unauthorized')
    }

    // Delete from offline storage
    await offlineStorage.delete('assessments', assessmentId)

    // If it was synced, mark for deletion sync (implement if needed)
    if (this.isOnline && assessment.synced) {
      console.log(`Assessment ${assessmentId} deleted locally, sync deletion to Firebase if needed`)
    }
  }

  /**
   * Get assessment statistics
   */
  async getAssessmentStats(userId: string): Promise<{
    totalAssessments: number
    preTestsCompleted: number
    postTestsCompleted: number
    latestPreTest?: EQAssessment
    latestPostTest?: EQAssessment
    improvement?: {
      good: number
      smart: number  
      happy: number
      total: number
    }
  }> {
    const assessments = await this.getUserAssessments(userId)
    const preTests = assessments.filter(a => a.type === 'pre-test')
    const postTests = assessments.filter(a => a.type === 'post-test')

    const latestPreTest = preTests[0] // Already sorted by date desc
    const latestPostTest = postTests[0]

    let improvement
    if (latestPreTest && latestPostTest) {
      improvement = {
        good: latestPostTest.scores.good - latestPreTest.scores.good,
        smart: latestPostTest.scores.smart - latestPreTest.scores.smart,
        happy: latestPostTest.scores.happy - latestPreTest.scores.happy,
        total: latestPostTest.scores.total - latestPreTest.scores.total
      }
    }

    return {
      totalAssessments: assessments.length,
      preTestsCompleted: preTests.length,
      postTestsCompleted: postTests.length,
      latestPreTest,
      latestPostTest,
      improvement
    }
  }

  /**
   * Check if service is ready
   */
  async isReady(): Promise<boolean> {
    try {
      await offlineStorage.initDatabase()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    online: boolean
    pendingAssessments: number
    lastSyncAt?: Date
  }> {
    const unsyncedData = await offlineStorage.getUnsyncedData()
    
    return {
      online: this.isOnline,
      pendingAssessments: unsyncedData.assessments.length
    }
  }
}

// Export singleton instance
export const offlineEQAssessmentService = new OfflineEQAssessmentService()
export default offlineEQAssessmentService