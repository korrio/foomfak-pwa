import React from 'react'
import { Plus, Gift, ClipboardList, Home } from 'lucide-react'

interface Props {
  activeTab: 'home' | 'record' | 'rewards' | 'assessment'
  onTabChange: (tab: 'home' | 'record' | 'rewards' | 'assessment') => void
}

export const BottomNavigation: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const navItems = [
    {
      id: 'home' as const,
      label: 'หน้าหลัก',
      icon: Home,
      color: 'text-blue-500'
    },
    {
      id: 'record' as const,
      label: 'บันทึก',
      icon: Plus,
      color: 'text-green-500'
    },
    {
      id: 'rewards' as const,
      label: 'รางวัล',
      icon: Gift,
      color: 'text-purple-500'
    },
    {
      id: 'assessment' as const,
      label: 'แบบประเมิน',
      icon: ClipboardList,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const IconComponent = item.icon
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? `${item.color} bg-opacity-10` 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all duration-200 ${
                  isActive ? `bg-current bg-opacity-10` : ''
                }`}>
                  <IconComponent 
                    className={`w-6 h-6 transition-all duration-200 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`} 
                  />
                </div>
                <span className={`text-xs font-medium mt-1 transition-all duration-200 ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}