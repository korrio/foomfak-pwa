/**
 * Offline Reward Service using IndexedDB
 * Provides offline-first reward redemption functionality
 */

import { offlineStorage } from './offlineStorageService'
import { Reward } from '../data/rewards'

export interface UserRedemption {
  id: string
  userId: string
  rewardId: string
  rewardTitle: string
  pointsUsed: number
  status: 'pending' | 'approved' | 'used' | 'expired'
  redeemedAt: Date
  usedAt?: Date
  expiresAt: Date
  redemptionCode: string
  reward?: Reward
  synced: boolean
  syncedAt?: Date
}

class OfflineRewardService {
  // Generate redemption code
  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Redeem a reward
  async redeemReward(userId: string, reward: Reward): Promise<{ success: boolean; redemption?: UserRedemption; error?: string }> {
    try {
      // Check if user has enough points
      const userData = await offlineStorage.get('users', userId)
      
      if (!userData) {
        return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' }
      }

      const userPoints = userData.points || 0

      if (userPoints < reward.pointsCost) {
        return { success: false, error: 'แต้มสะสมไม่เพียงพอ' }
      }

      // Check reward availability (if applicable)
      if (reward.availableQuantity !== undefined && reward.availableQuantity <= 0) {
        return { success: false, error: 'รางวัลหมดแล้ว' }
      }

      // Generate redemption code and ID
      const redemptionCode = this.generateRedemptionCode()
      const redemptionId = `${userId}_${reward.id}_${Date.now()}`

      // Calculate expiration date (30 days default)
      const expiresAt = reward.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Create redemption record
      const redemption: UserRedemption = {
        id: redemptionId,
        userId,
        rewardId: reward.id,
        rewardTitle: reward.title,
        pointsUsed: reward.pointsCost,
        status: 'pending',
        redeemedAt: new Date(),
        expiresAt,
        redemptionCode,
        synced: false
      }

      // Store redemption in IndexedDB
      await this.storeRedemption(redemption)

      // Deduct points from user
      const updatedUserData = {
        ...userData,
        points: userData.points - reward.pointsCost,
        updatedAt: new Date()
      }
      
      await offlineStorage.update('users', updatedUserData)

      return { success: true, redemption }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      return { success: false, error: 'เกิดข้อผิดพลาดในการแลกรางวัล' }
    }
  }

  // Store redemption in IndexedDB using generic rewards store
  private async storeRedemption(redemption: UserRedemption): Promise<void> {
    try {
      // Since the offlineStorageService has a rewards store, we'll use that
      // But we need to adapt our redemption data to fit the existing schema
      const rewardRecord = {
        id: redemption.id,
        userId: redemption.userId,
        rewardId: redemption.rewardId,
        name: redemption.rewardTitle,
        description: `รหัส: ${redemption.redemptionCode} | สถานะ: ${redemption.status}`,
        cost: redemption.pointsUsed,
        redeemedAt: redemption.redeemedAt,
        synced: false,
        // Store additional redemption data as extended fields
        redemptionCode: redemption.redemptionCode,
        status: redemption.status,
        expiresAt: redemption.expiresAt,
        usedAt: redemption.usedAt
      } as any

      await offlineStorage.create('rewards', rewardRecord)
    } catch (error) {
      console.error('Error storing redemption:', error)
      throw error
    }
  }

  // Get user's redemption history
  async getUserRedemptions(userId: string): Promise<UserRedemption[]> {
    try {
      const rawRedemptions = await offlineStorage.getUserRewards(userId)
      
      // Convert the stored rewards back to UserRedemption format
      const redemptions: UserRedemption[] = rawRedemptions.map(record => ({
        id: record.id,
        userId: record.userId,
        rewardId: (record as any).rewardId || record.id,
        rewardTitle: record.name,
        pointsUsed: record.cost,
        status: (record as any).status || 'pending',
        redeemedAt: record.redeemedAt,
        usedAt: (record as any).usedAt,
        expiresAt: (record as any).expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        redemptionCode: (record as any).redemptionCode || 'N/A',
        synced: record.synced || false,
        syncedAt: (record as any).syncedAt
      }))

      return redemptions.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime())
    } catch (error) {
      console.error('Error getting user redemptions:', error)
      return []
    }
  }

  // Mark redemption as used
  async markRedemptionAsUsed(redemptionId: string): Promise<boolean> {
    try {
      const record = await offlineStorage.get('rewards', redemptionId)
      if (!record) {
        return false
      }

      const updatedRecord = {
        ...record,
        status: 'used',
        usedAt: new Date(),
        description: record.description.replace(/สถานะ: \w+/, 'สถานะ: used')
      } as any

      await offlineStorage.update('rewards', updatedRecord)
      return true
    } catch (error) {
      console.error('Error marking redemption as used:', error)
      return false
    }
  }

  // Check redemption validity
  async validateRedemption(redemptionCode: string): Promise<{ valid: boolean; redemption?: UserRedemption; error?: string }> {
    try {
      // Since we don't have a direct way to query by redemption code in the current schema,
      // we'll need to get all redemptions and filter
      const allRewards = await offlineStorage.getAll('rewards')
      const matchingRecord = allRewards.find(record => 
        (record as any).redemptionCode === redemptionCode
      )

      if (!matchingRecord) {
        return { valid: false, error: 'ไม่พบรหัสแลกรางวัล' }
      }

      const redemption: UserRedemption = {
        id: matchingRecord.id,
        userId: matchingRecord.userId,
        rewardId: (matchingRecord as any).rewardId || matchingRecord.id,
        rewardTitle: matchingRecord.name,
        pointsUsed: matchingRecord.cost,
        status: (matchingRecord as any).status || 'pending',
        redeemedAt: matchingRecord.redeemedAt,
        usedAt: (matchingRecord as any).usedAt,
        expiresAt: (matchingRecord as any).expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        redemptionCode: (matchingRecord as any).redemptionCode || 'N/A',
        synced: matchingRecord.synced || false
      }

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
  }

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

// Export singleton instance
export const offlineRewardService = new OfflineRewardService()