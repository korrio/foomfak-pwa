export interface EQQuestion {
  id: string
  category: 'good' | 'smart' | 'happy'
  question: string
  description: string
  reverseScoring?: boolean // For questions where lower frequency is better
}

export interface EQResponse {
  questionId: string
  value: 1 | 2 | 3 | 4 // 1=ไม่เป็นเลย, 2=เป็นบางครั้ง, 3=เป็นบ่อยครั้ง, 4=เป็นประจำ
}

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
    good: 'ต่ำกว่าเกณฑ์' | 'ปกติ' | 'สูงกว่าเกณฑ์'
    smart: 'ต่ำกว่าเกณฑ์' | 'ปกติ' | 'สูงกว่าเกณฑ์'
    happy: 'ต่ำกว่าเกณฑ์' | 'ปกติ' | 'สูงกว่าเกณฑ์'
    overall: 'ต่ำกว่าเกณฑ์' | 'ปกติ' | 'สูงกว่าเกณฑ์'
  }
  completedAt: Date
}

// แบบประเมินความฉลาดทางอารมณ์เด็ก อายุ 3-5 ปี
export const eqQuestions: EQQuestion[] = [
  // 1. ด้านดี (Good) - มีจิตใจดี มีคุณธรรม
  {
    id: 'good_1',
    category: 'good',
    question: 'แสดงความเห็นใจเมื่อเห็นเพื่อนหรือผู้อื่นทุกข์ร้อน',
    description: 'เช่น บอกว่าสงสาร เข้าไปปลอบหรือเข้าไปช่วย'
  },
  {
    id: 'good_2',
    category: 'good',
    question: 'หยุดการกระทำที่ไม่ดีเมื่อผู้ใหญ่ห้าม',
    description: 'เมื่อผู้ใหญ่บอกให้หยุดทำสิ่งที่ไม่ดี เด็กจะหยุดทำ'
  },
  {
    id: 'good_3',
    category: 'good',
    question: 'แบ่งปันสิ่งของให้คนอื่นๆ',
    description: 'เช่น ขนม ของเล่น แบ่งให้เพื่อนหรือคนอื่น'
  },
  {
    id: 'good_4',
    category: 'good',
    question: 'บอกขอโทษหรือแสดงท่าทียอมรับผิดเมื่อรู้ว่าทำผิด',
    description: 'เมื่อทำผิดพลาดจะขอโทษหรือแสดงความเสียใจ'
  },
  {
    id: 'good_5',
    category: 'good',
    question: 'อดทนและรอคอยได้',
    description: 'สามารถรอได้เมื่อต้องรอคิว รอของ หรือรอให้ผู้ใหญ่ว่าง'
  },

  // 2. ด้านเก่ง (Smart) - มีความสามารถในการเรียนรู้
  {
    id: 'smart_1',
    category: 'smart',
    question: 'อยากรู้อยากเห็นกับของเล่นหรือสิ่งแปลกใหม่',
    description: 'แสดงความสนใจเมื่อเห็นสิ่งใหม่ๆ อยากสำรวจ อยากลอง'
  },
  {
    id: 'smart_2',
    category: 'smart',
    question: 'สนใจรู้สึกสนุกกับงานหรือกิจกรรมใหม่',
    description: 'พร้อมที่จะลองทำกิจกรรมใหม่ๆ และแสดงความสนุกสนาน'
  },
  {
    id: 'smart_3',
    category: 'smart',
    question: 'ซักถามในสิ่งที่อยากรู้',
    description: 'ชอบถาม "ทำไม" "อะไร" "ยังไง" เมื่ออยากรู้เรื่องใดเรื่องหนึ่ง'
  },
  {
    id: 'smart_4',
    category: 'smart',
    question: 'เมื่อไม่ได้ของเล่นที่อยากได้ก็สามารถเล่นของอื่นแทน',
    description: 'ปรับตัวได้เมื่อไม่ได้สิ่งที่ต้องการ หาทางเลือกอื่น'
  },
  {
    id: 'smart_5',
    category: 'smart',
    question: 'ยอมรับกฎเกณฑ์หรือข้อตกลง แม้จะผิดหวัง/ไม่ได้สิ่งที่ต้องการ',
    description: 'เข้าใจและปฏิบัติตามกฎที่ผู้ใหญ่กำหนด แม้จะไม่ชอบ'
  },

  // 3. ด้านสุข (Happy) - มีความสุขและสร้างความสุขให้ผู้อื่น
  {
    id: 'happy_1',
    category: 'happy',
    question: 'แสดงความภาคภูมิใจเมื่อได้รับคำชมเชย',
    description: 'เช่น บอกเล่าให้ผู้อื่นรู้ ยิ้มแย้ม แสดงความดีใจ'
  },
  {
    id: 'happy_2',
    category: 'happy',
    question: 'รู้จักหาของเล่นหรือกิจกรรมเพื่อสร้างความสนุกสนานเพลิดเพลิน',
    description: 'สามารถหาสิ่งที่ทำให้ตนเองสนุกได้ ไม่ต้องรอให้ผู้อื่นหาให้'
  },
  {
    id: 'happy_3',
    category: 'happy',
    question: 'แสดงอารมณ์สนุกหรือร่วมสนุกตามไปกับสิ่งที่เห็น',
    description: 'เช่น ร้องเพลง กระโดดโลดเต้น หัวเราะเฮฮา เมื่อเห็นสิ่งสนุกๆ'
  },
  {
    id: 'happy_4',
    category: 'happy',
    question: 'เก็บตัว ไม่เล่นสนุกสนานกับเด็กคนอื่นๆ',
    description: 'อยู่คนเดียว ไม่ค่อยเข้าสังคมกับเพื่อน (คำถามแบบกลับด้าน)',
    reverseScoring: true
  },
  {
    id: 'happy_5',
    category: 'happy',
    question: 'ไม่กลัวเมื่อต้องอยู่กับคนที่ไม่สนิทสนม',
    description: 'ปรับตัวได้ดีเมื่อต้องอยู่กับคนแปลกหน้าหรือสถานที่ใหม่'
  }
]

// คำแนะนำการใช้งาน
export const assessmentInstructions = {
  title: 'แบบประเมินความฉลาดทางอารมณ์ของลูก',
  subtitle: 'สำหรับเด็กอายุ 3-5 ปี',
  description: 'ให้ผู้ปกครองตอบคำถามเกี่ยวกับพฤติกรรมของลูกในช่วง 4 เดือนที่ผ่านมา โดยเลือกคำตอบที่ใกล้เคียงกับตัวลูกมากที่สุด',
  options: [
    { value: 1, label: 'ไม่เป็นเลย', description: 'ไม่เคยปรากฏ' },
    { value: 2, label: 'เป็นบางครั้ง', description: 'นานๆ ครั้งหรือทำบ้างไม่ทำบ้าง' },
    { value: 3, label: 'เป็นบ่อยครั้ง', description: 'ทำบ่อยๆ หรือเกือบทุกครั้ง' },
    { value: 4, label: 'เป็นประจำ', description: 'ทำทุกครั้งเมื่อเกิดสถานการณ์นั้น' }
  ],
  timeFrame: '4 เดือนที่ผ่านมา',
  purpose: 'เพื่อช่วยให้ทราบจุดเด่นและจุดที่ควรพัฒนาของลูก รวมทั้งติดตามความก้าวหน้าทางอารมณ์'
}

// เกณฑ์การแปลผล
export const interpretationCriteria = {
  good: { // ด้านดี (เต็ม 20 คะแนน)
    low: { min: 1, max: 11, label: 'ต่ำกว่าเกณฑ์' },
    normal: { min: 12, max: 19, label: 'ปกติ' },
    high: { min: 20, max: 20, label: 'สูงกว่าเกณฑ์' }
  },
  smart: { // ด้านเก่ง (เต็ม 20 คะแนน)
    low: { min: 1, max: 12, label: 'ต่ำกว่าเกณฑ์' },
    normal: { min: 13, max: 19, label: 'ปกติ' },
    high: { min: 20, max: 20, label: 'สูงกว่าเกณฑ์' }
  },
  happy: { // ด้านสุข (เต็ม 20 คะแนน)
    low: { min: 1, max: 12, label: 'ต่ำกว่าเกณฑ์' },
    normal: { min: 13, max: 18, label: 'ปกติ' },
    high: { min: 19, max: 20, label: 'สูงกว่าเกณฑ์' }
  },
  overall: { // ความฉลาดทางอารมณ์รวม (เต็ม 60 คะแนน)
    low: { min: 1, max: 39, label: 'ต่ำกว่าเกณฑ์' },
    normal: { min: 40, max: 55, label: 'ปกติ' },
    high: { min: 56, max: 60, label: 'สูงกว่าเกณฑ์' }
  }
}

// คำแนะนำตามผลการประเมิน
export const recommendations = {
  high: {
    title: 'ยอดเยี่ยม! ควรส่งเสริมและรักษาไว้',
    description: 'ลูกมีความฉลาดทางอารมณ์ในระดับดีมาก ควรส่งเสริมให้คงความสามารถนี้ไว้อย่างต่อเนื่อง'
  },
  normal: {
    title: 'ดีแล้ว แต่ยังพัฒนาได้อีก',
    description: 'ลูกมีความฉลาดทางอารมณ์ในระดับปกติ แต่ยังสามารถพัฒนาให้ดีขึ้นได้อีก ควรใส่ใจและส่งเสริมอย่างต่อเนื่อง'
  },
  low: {
    title: 'ต้องเอาใจใส่และพัฒนาเพิ่มเติม',
    description: 'ลูกควรได้รับการพัฒนาความฉลาดทางอารมณ์เพิ่มเติม แนะนำให้ปรึกษาผู้เชี่ยวชาญหรือทำแบบประเมินเพิ่มเติม'
  }
}