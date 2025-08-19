import { Trophy, Target, Zap, Calendar, Star, Heart, BookOpen, Gamepad2 } from 'lucide-react'

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'milestone'
  category: string
  targetValue: number
  currentValue?: number
  pointsReward: number
  icon: React.ComponentType<any>
  color: string
  difficulty: 'easy' | 'medium' | 'hard'
  startDate?: Date
  endDate?: Date
  active: boolean
  requirements?: {
    minLevel?: number
    completedChallenges?: string[]
    activityTypes?: string[]
  }
}

export interface Achievement {
  id: string
  title: string
  description: string
  category: string
  pointsReward: number
  icon: React.ComponentType<any>
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
  requirements: {
    type: 'activities_count' | 'streak_days' | 'points_total' | 'challenge_complete' | 'category_master' | 'perfect_week'
    value: number
    activityType?: string
    category?: string
  }
}

// Daily Challenges
export const dailyChallenges: Challenge[] = [
  {
    id: 'daily_reading',
    title: 'อ่านนิทานวันนี้',
    description: 'อ่านหนังสือหรือนิทานให้ลูกฟัง 1 ครั้ง',
    type: 'daily',
    category: 'การเรียนรู้',
    targetValue: 1,
    pointsReward: 50,
    icon: BookOpen,
    color: 'bg-blue-500',
    difficulty: 'easy',
    active: true
  },
  {
    id: 'daily_play',
    title: 'เล่นกับลูก',
    description: 'ใช้เวลาเล่นกับลูกอย่างน้อย 30 นาที',
    type: 'daily',
    category: 'การเล่น',
    targetValue: 1800, // 30 minutes in seconds
    pointsReward: 60,
    icon: Gamepad2,
    color: 'bg-green-500',
    difficulty: 'easy',
    active: true
  },
  {
    id: 'daily_care_trio',
    title: 'ดูแลครบ 3 กิจกรรม',
    description: 'ทำกิจกรรมดูแลลูกครบ 3 ประเภทในวันนี้',
    type: 'daily',
    category: 'การดูแล',
    targetValue: 3,
    pointsReward: 100,
    icon: Heart,
    color: 'bg-pink-500',
    difficulty: 'medium',
    active: true
  }
]

// Weekly Challenges
export const weeklyChallenges: Challenge[] = [
  {
    id: 'weekly_streak',
    title: 'สัปดาห์ต่อเนื่อง',
    description: 'บันทึกกิจกรรมทุกวันเป็นเวลา 7 วันติดต่อกัน',
    type: 'weekly',
    category: 'ความต่อเนื่อง',
    targetValue: 7,
    pointsReward: 300,
    icon: Zap,
    color: 'bg-yellow-500',
    difficulty: 'medium',
    active: true
  },
  {
    id: 'weekly_variety',
    title: 'นักกิจกรรมรอบด้าน',
    description: 'ทำกิจกรรมครบทุกประเภท (8 ประเภท) ในสัปดาห์นี้',
    type: 'weekly',
    category: 'ความหลากหลาย',
    targetValue: 8,
    pointsReward: 400,
    icon: Target,
    color: 'bg-purple-500',
    difficulty: 'hard',
    active: true
  },
  {
    id: 'weekly_educator',
    title: 'ครูของลูก',
    description: 'ทำกิจกรรมการเรียนรู้รวม 10 ครั้งในสัปดาห์นี้',
    type: 'weekly',
    category: 'การเรียนรู้',
    targetValue: 10,
    pointsReward: 250,
    icon: BookOpen,
    color: 'bg-indigo-500',
    difficulty: 'medium',
    active: true,
    requirements: {
      activityTypes: ['reading', 'education']
    }
  }
]

// Monthly Challenges
export const monthlyChallenges: Challenge[] = [
  {
    id: 'monthly_master',
    title: 'เซียนการเลี้ยงลูก',
    description: 'ทำกิจกรรมรวม 100 ครั้งในเดือนนี้',
    type: 'monthly',
    category: 'ความต่อเนื่อง',
    targetValue: 100,
    pointsReward: 1000,
    icon: Trophy,
    color: 'bg-gold-500',
    difficulty: 'hard',
    active: true
  },
  {
    id: 'monthly_points',
    title: 'นักสะสมแต้ม',
    description: 'สะสมแต้มรวม 5,000 แต้มในเดือนนี้',
    type: 'monthly',
    category: 'แต้มสะสม',
    targetValue: 5000,
    pointsReward: 800,
    icon: Star,
    color: 'bg-amber-500',
    difficulty: 'hard',
    active: true
  }
]

// Achievements
export const achievements: Achievement[] = [
  // Beginner Achievements
  {
    id: 'first_activity',
    title: 'ก้าวแรกของพ่อแม่',
    description: 'บันทึกกิจกรรมแรกของคุณ',
    category: 'เริ่มต้น',
    pointsReward: 100,
    icon: Star,
    color: 'bg-blue-500',
    rarity: 'common',
    requirements: {
      type: 'activities_count',
      value: 1
    }
  },
  {
    id: 'first_week',
    title: 'สัปดาห์แรก',
    description: 'ใช้แอปต่อเนื่อง 7 วัน',
    category: 'ความต่อเนื่อง',
    pointsReward: 200,
    icon: Calendar,
    color: 'bg-green-500',
    rarity: 'common',
    requirements: {
      type: 'streak_days',
      value: 7
    }
  },

  // Intermediate Achievements  
  {
    id: 'reading_enthusiast',
    title: 'คนรักการอ่าน',
    description: 'ทำกิจกรรมการอ่านครบ 50 ครั้ง',
    category: 'การเรียนรู้',
    pointsReward: 300,
    icon: BookOpen,
    color: 'bg-blue-600',
    rarity: 'rare',
    requirements: {
      type: 'activities_count',
      value: 50,
      activityType: 'reading'
    }
  },
  {
    id: 'play_master',
    title: 'เซียนการเล่น',
    description: 'ทำกิจกรรมการเล่นครบ 50 ครั้ง',
    category: 'การเล่น',
    pointsReward: 300,
    icon: Gamepad2,
    color: 'bg-green-600',
    rarity: 'rare',
    requirements: {
      type: 'activities_count',
      value: 50,
      activityType: 'playing'
    }
  },
  {
    id: 'care_expert',
    title: 'ผู้เชี่ยวชาญการดูแล',
    description: 'ทำกิจกรรมดูแลพื้นฐานครบ 100 ครั้ง',
    category: 'การดูแล',
    pointsReward: 400,
    icon: Heart,
    color: 'bg-pink-600',
    rarity: 'rare',
    requirements: {
      type: 'category_master',
      value: 100,
      category: 'การดูแลพื้นฐาน'
    }
  },

  // Advanced Achievements
  {
    id: 'streak_champion',
    title: 'แชมป์ความต่อเนื่อง',
    description: 'ทำกิจกรรมติดต่อกัน 30 วัน',
    category: 'ความต่อเนื่อง',
    pointsReward: 500,
    icon: Zap,
    color: 'bg-yellow-600',
    rarity: 'epic',
    requirements: {
      type: 'streak_days',
      value: 30
    }
  },
  {
    id: 'point_collector',
    title: 'นักสะสมแต้มตัวจริง',
    description: 'สะสมแต้มรวม 10,000 แต้ม',
    category: 'แต้มสะสม',
    pointsReward: 600,
    icon: Star,
    color: 'bg-amber-600',
    rarity: 'epic',
    requirements: {
      type: 'points_total',
      value: 10000
    }
  },
  {
    id: 'perfect_parent',
    title: 'พ่อแม่แห่งปี',
    description: 'ทำกิจกรรมครบทุกประเภทใน 7 วันติดต่อกัน',
    category: 'ความสมบูรณ์แบบ',
    pointsReward: 800,
    icon: Trophy,
    color: 'bg-purple-600',
    rarity: 'epic',
    requirements: {
      type: 'perfect_week',
      value: 1
    }
  },

  // Legendary Achievements
  {
    id: 'parenting_legend',
    title: 'ตำนานการเลี้ยงลูก',
    description: 'ทำกิจกรรมครบ 1,000 ครั้ง',
    category: 'ความเป็นตำนาน',
    pointsReward: 1000,
    icon: Trophy,
    color: 'bg-gold-600',
    rarity: 'legendary',
    requirements: {
      type: 'activities_count',
      value: 1000
    }
  },
  {
    id: 'ultimate_streak',
    title: 'ความต่อเนื่องสุดยอด',
    description: 'ทำกิจกรรมติดต่อกัน 100 วัน',
    category: 'ความต่อเนื่อง',
    pointsReward: 2000,
    icon: Zap,
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    rarity: 'legendary',
    requirements: {
      type: 'streak_days',
      value: 100
    }
  }
]

export const challengeCategories = [
  { id: 'learning', name: 'การเรียนรู้', color: 'bg-blue-100 text-blue-800' },
  { id: 'play', name: 'การเล่น', color: 'bg-green-100 text-green-800' },
  { id: 'care', name: 'การดูแล', color: 'bg-pink-100 text-pink-800' },
  { id: 'continuity', name: 'ความต่อเนื่อง', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'variety', name: 'ความหลากหลาย', color: 'bg-purple-100 text-purple-800' },
  { id: 'points', name: 'แต้มสะสม', color: 'bg-amber-100 text-amber-800' }
]

export const rarityColors = {
  common: 'bg-gray-100 text-gray-800 border-gray-300',
  rare: 'bg-blue-100 text-blue-800 border-blue-300',
  epic: 'bg-purple-100 text-purple-800 border-purple-300',
  legendary: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-300'
}