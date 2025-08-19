import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Reward } from '../data/rewards'

export interface UserRedemption {
  id: string
  userId: string
  rewardId: string
  pointsUsed: number
  status: 'pending' | 'approved' | 'used' | 'expired'
  redeemedAt: Date
  usedAt?: Date
  expiresAt: Date
  redemptionCode: string
  reward?: Reward
}

export const rewardService = {
  // Redeem a reward
  async redeemReward(userId: string, reward: Reward): Promise<{ success: boolean; redemption?: UserRedemption; error?: string }> {
    try {
      // Check if user has enough points
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' }
      }

      const userData = userDoc.data()
      const userPoints = userData.points || 0

      if (userPoints < reward.pointsCost) {
        return { success: false, error: 'แต้มสะสมไม่เพียงพอ' }
      }

      // Check reward availability
      if (reward.availableQuantity !== undefined && reward.availableQuantity <= 0) {
        return { success: false, error: 'รางวัลหมดแล้ว' }
      }

      // Generate redemption code
      const redemptionCode = this.generateRedemptionCode()
      const redemptionId = `${userId}_${reward.id}_${Date.now()}`

      // Calculate expiration date
      const expiresAt = reward.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default

      // Create redemption record
      const redemption: UserRedemption = {
        id: redemptionId,
        userId,
        rewardId: reward.id,
        pointsUsed: reward.pointsCost,
        status: 'pending',
        redeemedAt: new Date(),
        expiresAt,
        redemptionCode
      }

      await setDoc(doc(db, 'redemptions', redemptionId), {
        ...redemption,
        redeemedAt: serverTimestamp(),
        expiresAt: expiresAt
      })

      // Deduct points from user
      await updateDoc(userRef, {
        points: increment(-reward.pointsCost),
        totalRedemptions: increment(1)
      })

      // Update reward availability if limited
      if (reward.availableQuantity !== undefined) {
        const rewardRef = doc(db, 'rewards', reward.id)
        await updateDoc(rewardRef, {
          availableQuantity: increment(-1)
        })
      }

      // Create notification
      await setDoc(doc(db, 'notifications', `${userId}_redemption_${Date.now()}`), {
        userId,
        title: 'แลกรางวัลสำเร็จ! 🎁',
        message: `คุณได้แลก "${reward.title}" เรียบร้อยแล้ว รหัส: ${redemptionCode}`,
        type: 'redemption',
        read: false,
        createdAt: serverTimestamp()
      })

      return { success: true, redemption }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      return { success: false, error: 'เกิดข้อผิดพลาดในการแลกรางวัล' }
    }
  },

  // Get user's redemption history
  async getUserRedemptions(userId: string): Promise<(UserRedemption & { reward?: Reward })[]> {
    try {
      const q = query(
        collection(db, 'redemptions'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const redemptions = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        redeemedAt: doc.data().redeemedAt?.toDate() || new Date(),
        usedAt: doc.data().usedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date()
      })) as UserRedemption[]

      return redemptions.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime())
    } catch (error) {
      console.error('Error getting user redemptions:', error)
      return []
    }
  },

  // Mark redemption as used
  async markRedemptionAsUsed(redemptionId: string): Promise<boolean> {
    try {
      const redemptionRef = doc(db, 'redemptions', redemptionId)
      await updateDoc(redemptionRef, {
        status: 'used',
        usedAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error('Error marking redemption as used:', error)
      return false
    }
  },

  // Check redemption validity
  async validateRedemption(redemptionCode: string): Promise<{ valid: boolean; redemption?: UserRedemption; error?: string }> {
    try {
      const q = query(
        collection(db, 'redemptions'),
        where('redemptionCode', '==', redemptionCode)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return { valid: false, error: 'ไม่พบรหัสแลกรางวัล' }
      }

      const redemptionDoc = querySnapshot.docs[0]
      const redemption = {
        ...redemptionDoc.data(),
        redeemedAt: redemptionDoc.data().redeemedAt?.toDate() || new Date(),
        usedAt: redemptionDoc.data().usedAt?.toDate(),
        expiresAt: redemptionDoc.data().expiresAt?.toDate() || new Date()
      } as UserRedemption

      // Check if expired
      if (redemption.expiresAt < new Date()) {
        return { valid: false, error: 'รางวัลหมดอายุแล้ว' }
      }

      // Check if already used
      if (redemption.status === 'used') {
        return { valid: false, error: 'รางวัลถูกใช้แล้ว' }
      }

      return { valid: true, redemption }
    } catch (error) {
      console.error('Error validating redemption:', error)
      return { valid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบ' }
    }
  },

  // Generate redemption code
  generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // Get user's redemption stats
  async getUserRedemptionStats(userId: string): Promise<{
    totalRedeemed: number
    totalPointsUsed: number
    activeRedemptions: number
    expiredRedemptions: number
  }> {
    try {
      const redemptions = await this.getUserRedemptions(userId)
      
      const stats = {
        totalRedeemed: redemptions.length,
        totalPointsUsed: redemptions.reduce((sum, r) => sum + r.pointsUsed, 0),
        activeRedemptions: redemptions.filter(r => 
          r.status === 'pending' && r.expiresAt > new Date()
        ).length,
        expiredRedemptions: redemptions.filter(r => 
          r.status !== 'used' && r.expiresAt <= new Date()
        ).length
      }

      return stats
    } catch (error) {
      console.error('Error getting redemption stats:', error)
      return {
        totalRedeemed: 0,
        totalPointsUsed: 0,
        activeRedemptions: 0,
        expiredRedemptions: 0
      }
    }
  }
}