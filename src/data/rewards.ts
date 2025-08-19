import { Gift, ShoppingCart, Baby, Heart, BookOpen, Gamepad2, Car, Home } from 'lucide-react'

export interface Reward {
  id: string
  title: string
  description: string
  category: string
  pointsCost: number
  icon: React.ComponentType<any>
  color: string
  image?: string
  type: 'voucher' | 'discount' | 'product' | 'service'
  value: number // actual value in baht
  partner: string
  availableQuantity?: number
  validUntil?: Date
  terms: string[]
  popular: boolean
}

export const rewardCategories = [
  { id: 'baby_products', name: 'สินค้าเด็ก', color: 'bg-pink-100 text-pink-800', icon: Baby },
  { id: 'food', name: 'อาหาร', color: 'bg-orange-100 text-orange-800', icon: Heart },
  { id: 'education', name: 'การศึกษา', color: 'bg-blue-100 text-blue-800', icon: BookOpen },
  { id: 'toys', name: 'ของเล่น', color: 'bg-green-100 text-green-800', icon: Gamepad2 },
  { id: 'transport', name: 'การเดินทาง', color: 'bg-purple-100 text-purple-800', icon: Car },
  { id: 'services', name: 'บริการ', color: 'bg-indigo-100 text-indigo-800', icon: Home }
]

export const rewards: Reward[] = [
  // Baby Products
  {
    id: 'diapers_discount',
    title: 'ส่วนลดผ้าอ้อม 20%',
    description: 'ส่วนลดผ้าอ้อมแบรนด์ดัง สูงสุด 200 บาท',
    category: 'สินค้าเด็ก',
    pointsCost: 500,
    icon: Baby,
    color: 'bg-pink-500',
    type: 'discount',
    value: 200,
    partner: 'Baby Mart',
    availableQuantity: 50,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    terms: [
      'ใช้ได้กับผ้าอ้อมทุกแบรนด์',
      'ส่วนลดสูงสุด 200 บาท',
      'ไม่สามารถใช้ร่วมกับโปรโมชั่นอื่นได้',
      'ใช้ได้ภายใน 30 วัน'
    ],
    popular: true
  },
  {
    id: 'baby_formula_voucher',
    title: 'บัตรกำนัลนมผง 100 บาท',
    description: 'บัตรกำนัลซื้อนมผงเด็ก มูลค่า 100 บาท',
    category: 'สินค้าเด็ก',
    pointsCost: 400,
    icon: Baby,
    color: 'bg-pink-600',
    type: 'voucher',
    value: 100,
    partner: 'Mother Care',
    availableQuantity: 100,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    terms: [
      'ใช้ได้กับนมผงเด็กทุกแบรนด์',
      'ไม่สามารถทอนเงินได้',
      'ใช้ได้ภายใน 60 วัน',
      'ต้องซื้อขั้นต่ำ 150 บาท'
    ],
    popular: false
  },

  // Food & Nutrition
  {
    id: 'organic_food_discount',
    title: 'ส่วนลดอาหารออร์แกนิค 15%',
    description: 'ส่วนลดอาหารเด็กออร์แกนิค สูงสุด 150 บาท',
    category: 'อาหาร',
    pointsCost: 350,
    icon: Heart,
    color: 'bg-orange-500',
    type: 'discount',
    value: 150,
    partner: 'Organic Baby',
    availableQuantity: 30,
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    terms: [
      'ใช้ได้กับอาหารเด็กออร์แกนิคเท่านั้น',
      'ส่วนลดสูงสุด 150 บาท',
      'ซื้อขั้นต่ำ 300 บาท',
      'ใช้ได้ภายใน 45 วัน'
    ],
    popular: true
  },
  {
    id: 'meal_delivery_voucher',
    title: 'บัตรกำนัลส่งอาหาร 200 บาท',
    description: 'บัตรกำนัลสั่งอาหารส่งถึงบ้าน มูลค่า 200 บาท',
    category: 'อาหาร',
    pointsCost: 600,
    icon: Heart,
    color: 'bg-orange-600',
    type: 'voucher',
    value: 200,
    partner: 'FoodPanda',
    availableQuantity: 25,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    terms: [
      'ใช้ได้กับร้านอาหารทุกร้าน',
      'ไม่รวมค่าส่ง',
      'สั่งขั้นต่ำ 100 บาท',
      'ใช้ได้ภายใน 30 วัน'
    ],
    popular: false
  },

  // Education
  {
    id: 'books_discount',
    title: 'ส่วนลดหนังสือเด็ก 25%',
    description: 'ส่วนลดหนังสือและนิทานเด็ก สูงสุด 250 บาท',
    category: 'การศึกษา',
    pointsCost: 450,
    icon: BookOpen,
    color: 'bg-blue-500',
    type: 'discount',
    value: 250,
    partner: 'Book Depot',
    availableQuantity: 40,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    terms: [
      'ใช้ได้กับหนังสือเด็กทุกประเภท',
      'ส่วนลดสูงสุด 250 บาท',
      'ซื้อขั้นต่ำ 200 บาท',
      'ใช้ได้ภายใน 90 วัน'
    ],
    popular: true
  },
  {
    id: 'online_course_voucher',
    title: 'คอร์สเรียนออนไลน์ฟรี',
    description: 'คอร์สการเลี้ยงลูกออนไลน์ 1 เดือน',
    category: 'การศึกษา',
    pointsCost: 800,
    icon: BookOpen,
    color: 'bg-blue-600',
    type: 'service',
    value: 500,
    partner: 'Parent Academy',
    availableQuantity: 20,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    terms: [
      'เข้าถึงคอร์สได้ 1 เดือน',
      'รวมใบประกาศการผ่านหลักสูตร',
      'ต้องลงทะเบียนภายใน 60 วัน',
      'ไม่สามารถโอนหรือขายต่อได้'
    ],
    popular: false
  },

  // Toys
  {
    id: 'educational_toys_discount',
    title: 'ส่วนลดของเล่นเสริมทักษะ 30%',
    description: 'ส่วนลดของเล่นเสริมพัฒนาการ สูงสุด 300 บาท',
    category: 'ของเล่น',
    pointsCost: 550,
    icon: Gamepad2,
    color: 'bg-green-500',
    type: 'discount',
    value: 300,
    partner: 'Smart Toys',
    availableQuantity: 35,
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    terms: [
      'ใช้ได้กับของเล่นเสริมทักษะเท่านั้น',
      'ส่วนลดสูงสุด 300 บาท',
      'ซื้อขั้นต่ำ 500 บาท',
      'ใช้ได้ภายใน 45 วัน'
    ],
    popular: true
  },
  {
    id: 'toy_rental_voucher',
    title: 'บัตรเช่าของเล่น 1 เดือน',
    description: 'เช่าของเล่นคุณภาพสูง 1 เดือน',
    category: 'ของเล่น',
    pointsCost: 700,
    icon: Gamepad2,
    color: 'bg-green-600',
    type: 'service',
    value: 400,
    partner: 'Toy Library',
    availableQuantity: 15,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    terms: [
      'เลือกของเล่นได้ 5 ชิ้น',
      'ส่งถึงบ้านฟรี',
      'ต้องใช้บริการภายใน 30 วัน',
      'ต้องคืนของเล่นในสภาพดี'
    ],
    popular: false
  },

  // Transport
  {
    id: 'taxi_voucher',
    title: 'บัตรกำนัลแท็กซี่ 150 บาท',
    description: 'บัตรกำนัลเรียกแท็กซี่ มูลค่า 150 บาท',
    category: 'การเดินทาง',
    pointsCost: 500,
    icon: Car,
    color: 'bg-purple-500',
    type: 'voucher',
    value: 150,
    partner: 'Grab',
    availableQuantity: 60,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    terms: [
      'ใช้ได้กับการเดินทางทุกประเภท',
      'ไม่สามารถใช้ร่วมกับโปรโมชั่นอื่นได้',
      'ใช้ได้ภายใน 30 วัน',
      'จำกัด 1 ใบต่อการเดินทาง'
    ],
    popular: true
  },

  // Services
  {
    id: 'babysitter_discount',
    title: 'ส่วนลดเบบี้ซิตเตอร์ 20%',
    description: 'ส่วนลดบริการเบบี้ซิตเตอร์ สูงสุด 400 บาท',
    category: 'บริการ',
    pointsCost: 900,
    icon: Home,
    color: 'bg-indigo-500',
    type: 'discount',
    value: 400,
    partner: 'Care4Kids',
    availableQuantity: 10,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    terms: [
      'ใช้ได้กับบริการเบบี้ซิตเตอร์ที่ได้รับการรับรอง',
      'ส่วนลดสูงสุด 400 บาท',
      'จองขั้นต่ำ 4 ชั่วโมง',
      'ใช้ได้ภายใน 60 วัน'
    ],
    popular: false
  },
  {
    id: 'house_cleaning_voucher',
    title: 'บัตรทำความสะอาดบ้าน',
    description: 'บริการทำความสะอาดบ้าน 1 ครั้ง',
    category: 'บริการ',
    pointsCost: 1200,
    icon: Home,
    color: 'bg-indigo-600',
    type: 'service',
    value: 800,
    partner: 'Clean House',
    availableQuantity: 8,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    terms: [
      'ทำความสะอาดบ้านได้สูงสุด 100 ตร.ม.',
      'รวมอุปกรณ์ทำความสะอาด',
      'จองล่วงหน้า 3 วัน',
      'ใช้ได้ภายใน 90 วัน'
    ],
    popular: false
  }
]

export const getRewardsByCategory = (category?: string) => {
  if (!category) return rewards
  return rewards.filter(reward => reward.category === category)
}

export const getPopularRewards = () => {
  return rewards.filter(reward => reward.popular)
}

export const getAffordableRewards = (userPoints: number) => {
  return rewards.filter(reward => reward.pointsCost <= userPoints)
}