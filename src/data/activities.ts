import { Heart, Utensils, BookOpen, Gamepad2, Bath, Baby, Stethoscope, GraduationCap, Music, Camera, Car, TreePine } from 'lucide-react'
import { ActivityType } from '../types'

export interface ActivityTemplate {
  id: string
  type: ActivityType
  name: string
  description: string
  icon: React.ComponentType<any>
  points: number
  color: string
  category: string
  minDuration: number // in seconds
  maxDuration: number
  tips: string[]
  ageGroups: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export const activityTemplates: ActivityTemplate[] = [
  // Basic Care
  {
    id: 'feeding_bottle',
    type: 'feeding',
    name: 'ให้นมขวด',
    description: 'ให้นมขวดกับลูกน้อย',
    icon: Utensils,
    points: 30,
    color: 'bg-orange-500',
    category: 'การดูแลพื้นฐาน',
    minDuration: 300, // 5 minutes
    maxDuration: 1800, // 30 minutes
    tips: ['ตรวจอุณหภูมินม', 'ให้ลูกอิ่มท้อง', 'เรอลมหลังดื่มนม'],
    ageGroups: ['0-6 เดือน', '6-12 เดือน'],
    difficulty: 'easy'
  },
  {
    id: 'feeding_solid',
    type: 'feeding',
    name: 'ให้อาหารแข็ง',
    description: 'ให้อาหารแข็งกับลูก',
    icon: Utensils,
    points: 50,
    color: 'bg-orange-500',
    category: 'การดูแลพื้นฐาน',
    minDuration: 600, // 10 minutes
    maxDuration: 2700, // 45 minutes
    tips: ['เตรียมอาหารให้เหมาะกับวัย', 'ให้ลูกฝึกจับช้อน', 'สร้างบรรยากาศสนุก'],
    ageGroups: ['6-12 เดือน', '1-2 ปี', '2-3 ปี'],
    difficulty: 'medium'
  },

  // Learning & Development  
  {
    id: 'reading_picture',
    type: 'reading',
    name: 'อ่านหนังสือภาพ',
    description: 'อ่านหนังสือภาพให้ลูกฟัง',
    icon: BookOpen,
    points: 80,
    color: 'bg-blue-500',
    category: 'การเรียนรู้',
    minDuration: 600, // 10 minutes
    maxDuration: 1800, // 30 minutes
    tips: ['ใช้เสียงที่น่าสนใจ', 'ชี้รูปภาพให้ดู', 'ถามคำถามเกี่ยวกับเรื่อง'],
    ageGroups: ['6-12 เดือน', '1-2 ปี', '2-3 ปี', '3-5 ปี'],
    difficulty: 'easy'
  },
  {
    id: 'reading_story',
    type: 'reading',
    name: 'เล่านิทาน',
    description: 'เล่านิทานให้ลูกฟัง',
    icon: BookOpen,
    points: 100,
    color: 'bg-blue-600',
    category: 'การเรียนรู้',
    minDuration: 900, // 15 minutes
    maxDuration: 2400, // 40 minutes
    tips: ['แต่งเสียงตามตัวละคร', 'สร้างจังหวะที่น่าตื่นเต้น', 'อธิบายคำศัพท์ใหม่'],
    ageGroups: ['2-3 ปี', '3-5 ปี'],
    difficulty: 'medium'
  },

  // Play & Entertainment
  {
    id: 'play_toys',
    type: 'playing',
    name: 'เล่นของเล่น',
    description: 'เล่นของเล่นกับลูก',
    icon: Gamepad2,
    points: 60,
    color: 'bg-green-500',
    category: 'การเล่น',
    minDuration: 900, // 15 minutes
    maxDuration: 3600, // 60 minutes
    tips: ['เลือกของเล่นให้เหมาะกับวัย', 'เล่นร่วมกันอย่างสนุกสนาน', 'ฝึกการแก้ปัญหา'],
    ageGroups: ['6-12 เดือน', '1-2 ปี', '2-3 ปี', '3-5 ปี'],
    difficulty: 'easy'
  },
  {
    id: 'play_music',
    type: 'playing',
    name: 'ร้องเพลง-เต้นรำ',
    description: 'ร้องเพลงและเต้นรำกับลูก',
    icon: Music,
    points: 70,
    color: 'bg-green-600',
    category: 'การเล่น',
    minDuration: 600, // 10 minutes
    maxDuration: 1800, // 30 minutes
    tips: ['เลือกเพลงที่เด็กชอบ', 'สอนการเคลื่อนไหวง่ายๆ', 'สนุกไปด้วยกัน'],
    ageGroups: ['1-2 ปี', '2-3 ปี', '3-5 ปี'],
    difficulty: 'easy'
  },

  // Health & Hygiene
  {
    id: 'bathing',
    type: 'bathing',
    name: 'อาบน้ำ',
    description: 'อาบน้ำให้ลูก',
    icon: Bath,
    points: 40,
    color: 'bg-cyan-500',
    category: 'สุขอนามัย',
    minDuration: 600, // 10 minutes
    maxDuration: 1800, // 30 minutes
    tips: ['ตรวจอุณหภูมิน้ำ', 'ใช้สบู่เด็กอ่อนโยน', 'ทำให้เป็นเวลาที่สนุก'],
    ageGroups: ['0-6 เดือน', '6-12 เดือน', '1-2 ปี', '2-3 ปี'],
    difficulty: 'medium'
  },
  {
    id: 'health_checkup',
    type: 'health_checkup',
    name: 'ตรวจสุขภาพ',
    description: 'ตรวจวัดน้ำหนัก ส่วนสูง อุณหภูมิ',
    icon: Stethoscope,
    points: 90,
    color: 'bg-red-500',
    category: 'สุขภาพ',
    minDuration: 300, // 5 minutes
    maxDuration: 900, // 15 minutes
    tips: ['บันทึกข้อมูลเจริญเติบโต', 'สังเกตอาการผิดปกติ', 'ปรึกษาแพทย์หากจำเป็น'],
    ageGroups: ['0-6 เดือน', '6-12 เดือน', '1-2 ปี', '2-3 ปี', '3-5 ปี'],
    difficulty: 'medium'
  },

  // Sleep & Rest
  {
    id: 'sleeping_nap',
    type: 'sleeping',
    name: 'นอนกลางวัน',
    description: 'ดูแลลูกนอนกลางวัน',
    icon: Baby,
    points: 50,
    color: 'bg-purple-500',
    category: 'การพักผ่อน',
    minDuration: 1800, // 30 minutes
    maxDuration: 7200, // 2 hours
    tips: ['สร้างบรรยากาศเงียบ', 'ลดแสงไฟ', 'อ่านนิทานก่อนนอน'],
    ageGroups: ['0-6 เดือน', '6-12 เดือน', '1-2 ปี', '2-3 ปี'],
    difficulty: 'easy'
  },
  {
    id: 'sleeping_night',
    type: 'sleeping',
    name: 'นอนกลางคืน',
    description: 'ดูแลลูกนอนกลางคืน',
    icon: Baby,
    points: 60,
    color: 'bg-purple-600',
    category: 'การพักผ่อน',
    minDuration: 3600, // 1 hour
    maxDuration: 36000, // 10 hours
    tips: ['รักษาเวลานอนให้คงที่', 'สร้างกิจกรรมก่อนนอน', 'หลีกเลี่ยงหน้าจอก่อนนอน'],
    ageGroups: ['0-6 เดือน', '6-12 เดือน', '1-2 ปี', '2-3 ปี', '3-5 ปี'],
    difficulty: 'medium'
  },

  // Education & Skills
  {
    id: 'education_colors',
    type: 'education',
    name: 'สอนสี',
    description: 'สอนการจำแนกสีต่างๆ',
    icon: GraduationCap,
    points: 70,
    color: 'bg-indigo-500',
    category: 'การศึกษา',
    minDuration: 600, // 10 minutes
    maxDuration: 1800, // 30 minutes
    tips: ['ใช้ของเล่นหลายสี', 'เล่นเกมจับคู่สี', 'ชื่อสีซ้ำๆ'],
    ageGroups: ['1-2 ปี', '2-3 ปี', '3-5 ปี'],
    difficulty: 'medium'
  },
  {
    id: 'education_numbers',
    type: 'education',
    name: 'สอนตัวเลข',
    description: 'สอนการนับและตัวเลข',
    icon: GraduationCap,
    points: 80,
    color: 'bg-indigo-600',
    category: 'การศึกษา',
    minDuration: 900, // 15 minutes
    maxDuration: 2400, // 40 minutes
    tips: ['เริ่มจากเลข 1-10', 'ใช้นิ้วมือช่วยนับ', 'หาของในบ้านมานับ'],
    ageGroups: ['2-3 ปี', '3-5 ปี'],
    difficulty: 'hard'
  },

  // Outdoor Activities
  {
    id: 'outdoor_walk',
    type: 'outdoor_activity',
    name: 'เดินเล่นกลางแจ้ง',
    description: 'เดินเล่นในสวน หรือพื้นที่เปิด',
    icon: TreePine,
    points: 60,
    color: 'bg-emerald-500',
    category: 'กิจกรรมกลางแจ้ง',
    minDuration: 900, // 15 minutes
    maxDuration: 3600, // 60 minutes
    tips: ['เลือกสถานที่ปลอดภัย', 'ให้ลูกสำรวจธรรมชาติ', 'ระวังแดดจัดหรือฝน'],
    ageGroups: ['1-2 ปี', '2-3 ปี', '3-5 ปี'],
    difficulty: 'easy'
  },
  {
    id: 'outdoor_playground',
    type: 'outdoor_activity',
    name: 'เล่นสนามเด็กเล่น',
    description: 'เล่นอุปกรณ์ในสนามเด็กเล่น',
    icon: Gamepad2,
    points: 80,
    color: 'bg-emerald-600',
    category: 'กิจกรรมกลางแจ้ง',
    minDuration: 1200, // 20 minutes
    maxDuration: 3600, // 60 minutes
    tips: ['ดูแลความปลอดภัย', 'สอนการรอคิว', 'ให้กำลังใจลูก'],
    ageGroups: ['1-2 ปี', '2-3 ปี', '3-5 ปี'],
    difficulty: 'medium'
  }
]

export const activityCategories = [
  { id: 'basic_care', name: 'การดูแลพื้นฐาน', color: 'bg-orange-100 text-orange-800' },
  { id: 'learning', name: 'การเรียนรู้', color: 'bg-blue-100 text-blue-800' },
  { id: 'play', name: 'การเล่น', color: 'bg-green-100 text-green-800' },
  { id: 'health', name: 'สุขอนามัย', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'health_check', name: 'สุขภาพ', color: 'bg-red-100 text-red-800' },
  { id: 'rest', name: 'การพักผ่อน', color: 'bg-purple-100 text-purple-800' },
  { id: 'education', name: 'การศึกษา', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'outdoor', name: 'กิจกรรมกลางแจ้ง', color: 'bg-emerald-100 text-emerald-800' }
]