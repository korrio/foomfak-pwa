import React, { useState, useEffect } from 'react'
import { 
  Star, 
  Gift, 
  Clock, 
  Users, 
  Tag, 
  ShoppingCart, 
  X, 
  Check, 
  AlertCircle,
  Filter,
  Search,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { rewardService, UserRedemption } from '../services/rewardService'
import { rewards, rewardCategories, getRewardsByCategory, getPopularRewards, getAffordableRewards, Reward } from '../data/rewards'

interface Props {
  onClose: () => void
}

export const RewardsMarketplace: React.FC<Props> = ({ onClose }) => {
  const { currentUser, userData, updateUserData } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyAffordable, setShowOnlyAffordable] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [showRedemptionHistory, setShowRedemptionHistory] = useState(false)
  const [redemptionHistory, setRedemptionHistory] = useState<UserRedemption[]>([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const [activeTab, setActiveTab] = useState<'marketplace' | 'history'>('marketplace')

  useEffect(() => {
    if (currentUser && showRedemptionHistory) {
      loadRedemptionHistory()
    }
  }, [currentUser, showRedemptionHistory])

  const loadRedemptionHistory = async () => {
    if (!currentUser) return
    
    try {
      const history = await rewardService.getUserRedemptions(currentUser.uid)
      setRedemptionHistory(history)
    } catch (error) {
      console.error('Failed to load redemption history:', error)
    }
  }

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(''), 4000)
  }

  const handleRedeemReward = async (reward: Reward) => {
    if (!currentUser || !userData) return
    
    setLoading(true)
    try {
      const result = await rewardService.redeemReward(currentUser.uid, reward)
      
      if (result.success) {
        // Update local user data
        await updateUserData({
          points: userData.points - reward.pointsCost
        })
        
        showNotification(`แลกรางวัล "${reward.title}" สำเร็จ! รหัส: ${result.redemption?.redemptionCode}`)
        setSelectedReward(null)
        
        // Refresh history if viewing
        if (showRedemptionHistory) {
          loadRedemptionHistory()
        }
      } else {
        showNotification(result.error || 'ไม่สามารถแลกรางวัลได้')
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      showNotification('เกิดข้อผิดพลาดในการแลกรางวัล')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRewards = () => {
    let filteredRewards = selectedCategory 
      ? getRewardsByCategory(selectedCategory)
      : rewards

    if (searchQuery) {
      filteredRewards = filteredRewards.filter(reward =>
        reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.partner.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (showOnlyAffordable && userData) {
      filteredRewards = filteredRewards.filter(reward => reward.pointsCost <= userData.points)
    }

    return filteredRewards.sort((a, b) => a.pointsCost - b.pointsCost)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'used': return 'bg-gray-100 text-gray-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอการอนุมัติ'
      case 'approved': return 'พร้อมใช้งาน'
      case 'used': return 'ใช้แล้ว'
      case 'expired': return 'หมดอายุ'
      default: return status
    }
  }

  const renderMarketplace = () => (
    <div className="space-y-6">
      {/* Points Balance */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">แต้มสะสมของคุณ</p>
            <p className="text-2xl font-bold">{userData?.points || 0} แต้ม</p>
          </div>
          <Star className="w-8 h-8 opacity-80" />
        </div>
      </div>

      {/* Popular Rewards */}
      <div>
        <div className="flex items-center mb-3">
          <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
          <h3 className="font-bold text-lg">รางวัลยอดนิยม</h3>
        </div>
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {getPopularRewards().slice(0, 5).map(reward => (
            <button
              key={reward.id}
              onClick={() => setSelectedReward(reward)}
              className="flex-shrink-0 w-48 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className={`${reward.color} p-2 rounded-lg inline-block mb-2`}>
                <reward.icon className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-medium text-sm mb-1">{reward.title}</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{reward.partner}</span>
                <div className="flex items-center text-yellow-500">
                  <Star className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">{reward.pointsCost}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-bold text-lg mb-3">หมวดหมู่รางวัล</h3>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด
          </button>
          {rewardCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                selectedCategory === category.name
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <category.icon className="w-4 h-4 mr-1" />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหารางวัล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={() => setShowOnlyAffordable(!showOnlyAffordable)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
            showOnlyAffordable
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4 mr-1" />
          แลกได้
        </button>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {getFilteredRewards().map(reward => {
          const canAfford = userData ? userData.points >= reward.pointsCost : false
          const isLowStock = reward.availableQuantity !== undefined && reward.availableQuantity < 5
          
          return (
            <div
              key={reward.id}
              className={`aspect-square border rounded-lg overflow-hidden transition-colors ${
                canAfford 
                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-md' 
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <button
                onClick={() => setSelectedReward(reward)}
                className="w-full h-full p-3 flex flex-col text-left"
              >
                {/* Icon and badges */}
                <div className="flex items-start justify-between mb-2">
                  <div className={`${reward.color} p-2 rounded-lg`}>
                    <reward.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    {reward.popular && (
                      <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs font-medium">
                        ยอดนิยม
                      </span>
                    )}
                    {isLowStock && (
                      <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs font-medium">
                        เหลือน้อย
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="font-medium text-sm mb-1 line-clamp-2 flex-shrink-0">{reward.title}</h3>
                
                {/* Partner */}
                <p className="text-xs text-gray-500 mb-2 flex-shrink-0">โดย {reward.partner}</p>
                
                {/* Description */}
                <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">{reward.description}</p>
                
                {/* Points and type */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-3 h-3 mr-1" />
                    <span className="text-xs font-bold">{reward.pointsCost}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    reward.type === 'voucher' ? 'bg-blue-100 text-blue-800' :
                    reward.type === 'discount' ? 'bg-green-100 text-green-800' :
                    reward.type === 'product' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {reward.type === 'voucher' ? 'บัตรกำนัล' :
                     reward.type === 'discount' ? 'ส่วนลด' :
                     reward.type === 'product' ? 'สินค้า' : 'บริการ'}
                  </span>
                </div>
              </button>
              
              {/* Redeem button */}
              {canAfford && (
                <div className="px-3 pb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRedeemReward(reward)
                    }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-1.5 rounded text-xs font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        แลกรางวัล
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {getFilteredRewards().length === 0 && (
        <div className="text-center py-8">
          <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">ไม่พบรางวัลที่ตรงกับเงื่อนไข</p>
        </div>
      )}
    </div>
  )

  const renderRedemptionHistory = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">ประวัติการแลกรางวัล</h3>
      
      {redemptionHistory.length > 0 ? (
        <div className="space-y-3">
          {redemptionHistory.map(redemption => (
            <div key={redemption.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium">รางวัลที่แลก</h4>
                  <p className="text-sm text-gray-600 mb-1">รหัส: {redemption.redemptionCode}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(redemption.status)}`}>
                  {getStatusText(redemption.status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">แต้มที่ใช้</p>
                  <p className="font-medium">{redemption.pointsUsed} แต้ม</p>
                </div>
                <div>
                  <p className="text-gray-500">วันที่แลก</p>
                  <p className="font-medium">{formatDate(redemption.redeemedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">หมดอายุ</p>
                  <p className="font-medium">{formatDate(redemption.expiresAt)}</p>
                </div>
                {redemption.usedAt && (
                  <div>
                    <p className="text-gray-500">วันที่ใช้</p>
                    <p className="font-medium">{formatDate(redemption.usedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">ยังไม่มีประวัติการแลกรางวัล</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-hidden mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="w-6 h-6 mr-3" />
              <h2 className="text-xl font-bold">ร้านแลกรางวัล</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'marketplace'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              ร้านรางวัล
            </button>
            <button
              onClick={() => {
                setActiveTab('history')
                setShowRedemptionHistory(true)
                loadRedemptionHistory()
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              ประวัติการแลก
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="bg-green-100 text-green-700 p-3 text-center text-sm">
            {notification}
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {activeTab === 'marketplace' ? renderMarketplace() : renderRedemptionHistory()}
        </div>

        {/* Reward Detail Modal */}
        {selectedReward && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">รายละเอียดรางวัล</h3>
                  <button
                    onClick={() => setSelectedReward(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`${selectedReward.color} p-4 rounded-lg mb-4`}>
                  <selectedReward.icon className="w-8 h-8 text-white mx-auto mb-2" />
                  <h4 className="text-white font-bold text-center">{selectedReward.title}</h4>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h5 className="font-medium mb-1">คำอธิบาย</h5>
                    <p className="text-gray-600 text-sm">{selectedReward.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-1">แต้มที่ต้องใช้</h5>
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 mr-1" />
                        <span className="font-bold">{selectedReward.pointsCost}</span>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">มูลค่า</h5>
                      <p className="text-green-600 font-bold">฿{selectedReward.value}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-1">พาร์ทเนอร์</h5>
                    <p className="text-gray-600">{selectedReward.partner}</p>
                  </div>

                  {selectedReward.validUntil && (
                    <div>
                      <h5 className="font-medium mb-1 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        ใช้ได้ถึง
                      </h5>
                      <p className="text-gray-600">{formatDate(selectedReward.validUntil)}</p>
                    </div>
                  )}

                  {selectedReward.terms.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">เงื่อนไข</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedReward.terms.map((term, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{term}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {userData && userData.points >= selectedReward.pointsCost ? (
                    <button
                      onClick={() => handleRedeemReward(selectedReward)}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      ) : (
                        <ShoppingCart className="w-5 h-5 mr-2" />
                      )}
                      {loading ? 'กำลังแลก...' : 'แลกรางวัล'}
                    </button>
                  ) : (
                    <div className="bg-gray-100 text-gray-600 p-3 rounded-lg text-center">
                      <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-sm">แต้มไม่เพียงพอ (ต้องการ {selectedReward.pointsCost - (userData?.points || 0)} แต้ม)</p>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedReward(null)}
                    className="w-full bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}