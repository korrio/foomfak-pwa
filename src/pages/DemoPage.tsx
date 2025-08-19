import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import FoomFakApp from '../../FoomFakApp'

const DemoPage: React.FC = () => {
  return (
    <div>
      {/* Demo Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-black p-2 text-center text-sm font-medium">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center text-black hover:text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับหน้าหลัก
          </Link>
          <span>🧪 โหมดทดสอบ - ข้อมูลจำลอง</span>
        </div>
      </div>
      
      {/* Demo App with top padding */}
      <div className="pt-10">
        <FoomFakApp />
      </div>
    </div>
  )
}

export default DemoPage