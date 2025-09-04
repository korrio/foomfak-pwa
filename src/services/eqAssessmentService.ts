import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  EQAssessment, 
  EQResponse, 
  eqQuestions, 
  interpretationCriteria 
} from '../data/eqQuestionnaire'

export const eqAssessmentService = {
  // คำนวณคะแนน EQ
  calculateScores(responses: EQResponse[]): EQAssessment['scores'] {
    const scores = { good: 0, smart: 0, happy: 0, total: 0 }
    
    responses.forEach(response => {
      const question = eqQuestions.find(q => q.id === response.questionId)
      if (!question) return

      let score = response.value
      
      // สำหรับคำถามแบบกลับด้าน (reverse scoring)
      if (question.reverseScoring) {
        score = 5 - response.value // 1->4, 2->3, 3->2, 4->1
      }

      // เพิ่มคะแนนตามหมวดหมู่
      scores[question.category] += score
    })

    scores.total = scores.good + scores.smart + scores.happy
    return scores
  },

  // แปลผลคะแนน
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
  },

  // บันทึกผลการประเมิน
  async saveAssessment(assessment: Omit<EQAssessment, 'id' | 'completedAt'>): Promise<string> {
    try {
      console.log('Saving EQ assessment:', assessment)
      
      const docRef = await addDoc(collection(db, 'eqAssessments'), {
        ...assessment,
        completedAt: serverTimestamp()
      })
      
      console.log('EQ assessment saved successfully with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error in saveAssessment:', error)
      throw error
    }
  },

  // ดึงประวัติการประเมินของผู้ใช้
  async getUserAssessments(userId: string): Promise<EQAssessment[]> {
    const q = query(
      collection(db, 'eqAssessments'),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date()
    })) as EQAssessment[]
  },

  // ดึงการประเมินล่าสุด
  async getLatestAssessment(userId: string, type?: 'pre-test' | 'post-test'): Promise<EQAssessment | null> {
    let q = query(
      collection(db, 'eqAssessments'),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    )

    if (type) {
      q = query(
        collection(db, 'eqAssessments'),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('completedAt', 'desc')
      )
    }

    const querySnapshot = await getDocs(q)
    const assessments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date()
    })) as EQAssessment[]

    return assessments.length > 0 ? assessments[0] : null
  },

  // ดึงการประเมินตาม ID
  async getAssessmentById(assessmentId: string): Promise<EQAssessment | null> {
    const docRef = doc(db, 'eqAssessments', assessmentId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        completedAt: docSnap.data().completedAt?.toDate() || new Date()
      } as EQAssessment
    }
    
    return null
  },

  // เปรียบเทียบผล Pre-test และ Post-test
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
  },

  // สร้างรายงานสำหรับผู้ใช้
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
  },

  // คำแนะนำเฉพาะด้าน
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
}