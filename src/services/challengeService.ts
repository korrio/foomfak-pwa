import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Challenge, Achievement, dailyChallenges, weeklyChallenges, monthlyChallenges, achievements } from '../data/challenges'

export interface UserChallenge {
  id: string
  userId: string
  challengeId: string
  currentValue: number
  completed: boolean
  completedAt?: Date
  startedAt: Date
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: Date
}

export const challengeService = {
  // Initialize daily challenges for user
  async initializeDailyChallenges(userId: string): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const challenge of dailyChallenges) {
      const userChallengeId = `${userId}_${challenge.id}_${today.getTime()}`
      
      const userChallenge: UserChallenge = {
        id: userChallengeId,
        userId,
        challengeId: challenge.id,
        currentValue: 0,
        completed: false,
        startedAt: today
      }

      await setDoc(doc(db, 'userChallenges', userChallengeId), userChallenge)
    }
  },

  // Get user's active challenges
  async getUserChallenges(userId: string): Promise<(UserChallenge & Challenge)[]> {
    const q = query(
      collection(db, 'userChallenges'),
      where('userId', '==', userId),
      where('completed', '==', false)
    )
    
    const querySnapshot = await getDocs(q)
    const userChallenges = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate()
    })) as UserChallenge[]

    // Merge with challenge definitions
    const allChallenges = [...dailyChallenges, ...weeklyChallenges, ...monthlyChallenges]
    
    return userChallenges.map(userChallenge => {
      const challengeDefinition = allChallenges.find(c => c.id === userChallenge.challengeId)
      return {
        ...userChallenge,
        ...challengeDefinition
      } as UserChallenge & Challenge
    }).filter(c => c.title) // Filter out challenges without definitions
  },

  // Update challenge progress
  async updateChallengeProgress(
    userId: string, 
    challengeId: string, 
    increment: number = 1
  ): Promise<boolean> {
    try {
      // Find active user challenge
      const q = query(
        collection(db, 'userChallenges'),
        where('userId', '==', userId),
        where('challengeId', '==', challengeId),
        where('completed', '==', false)
      )
      
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) return false

      const userChallengeDoc = querySnapshot.docs[0]
      const userChallenge = userChallengeDoc.data() as UserChallenge
      const challengeDefinition = [...dailyChallenges, ...weeklyChallenges, ...monthlyChallenges]
        .find(c => c.id === challengeId)
      
      if (!challengeDefinition) return false

      const newValue = userChallenge.currentValue + increment
      const isCompleted = newValue >= challengeDefinition.targetValue

      await updateDoc(userChallengeDoc.ref, {
        currentValue: newValue,
        completed: isCompleted,
        ...(isCompleted && { completedAt: serverTimestamp() })
      })

      // Award points if completed
      if (isCompleted) {
        await this.awardChallengeCompletion(userId, challengeDefinition)
      }

      return isCompleted
    } catch (error) {
      console.error('Error updating challenge progress:', error)
      return false
    }
  },

  // Award challenge completion
  async awardChallengeCompletion(userId: string, challenge: Challenge): Promise<void> {
    try {
      // Update user points
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const currentPoints = userDoc.data().points || 0
        await updateDoc(userRef, {
          points: currentPoints + challenge.pointsReward
        })

        // Create notification
        await setDoc(doc(db, 'notifications', `${userId}_challenge_${challenge.id}_${Date.now()}`), {
          userId,
          title: 'ความท้าทายสำเร็จ! 🎉',
          message: `คุณได้รับ ${challenge.pointsReward} แต้มจากการทำ "${challenge.title}" สำเร็จ`,
          type: 'challenge',
          read: false,
          createdAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Error awarding challenge completion:', error)
    }
  },

  // Check and unlock achievements
  async checkAchievements(userId: string, activityData?: any): Promise<Achievement[]> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) return []

      const userData = userDoc.data()
      const unlockedAchievements: Achievement[] = []

      // Get user's current achievements
      const userAchievementsQuery = query(
        collection(db, 'userAchievements'),
        where('userId', '==', userId)
      )
      const userAchievementsSnapshot = await getDocs(userAchievementsQuery)
      const currentAchievements = new Set(
        userAchievementsSnapshot.docs.map(doc => doc.data().achievementId)
      )

      // Check each achievement
      for (const achievement of achievements) {
        if (currentAchievements.has(achievement.id)) continue

        let qualified = false

        switch (achievement.requirements.type) {
          case 'activities_count':
            // Count user activities
            const activitiesQuery = achievement.requirements.activityType
              ? query(
                  collection(db, 'activities'),
                  where('userId', '==', userId),
                  where('type', '==', achievement.requirements.activityType)
                )
              : query(collection(db, 'activities'), where('userId', '==', userId))
            
            const activitiesSnapshot = await getDocs(activitiesQuery)
            qualified = activitiesSnapshot.size >= achievement.requirements.value
            break

          case 'streak_days':
            qualified = (userData.streak || 0) >= achievement.requirements.value
            break

          case 'points_total':
            qualified = (userData.points || 0) >= achievement.requirements.value
            break

          case 'category_master':
            if (achievement.requirements.category) {
              const categoryQuery = query(
                collection(db, 'activities'),
                where('userId', '==', userId),
                where('category', '==', achievement.requirements.category)
              )
              const categorySnapshot = await getDocs(categoryQuery)
              qualified = categorySnapshot.size >= achievement.requirements.value
            }
            break

          case 'perfect_week':
            // This would require more complex logic to check if user completed all activity types in 7 consecutive days
            // For now, we'll skip this complex check
            break
        }

        if (qualified) {
          // Unlock achievement
          const userAchievementId = `${userId}_${achievement.id}`
          await setDoc(doc(db, 'userAchievements', userAchievementId), {
            id: userAchievementId,
            userId,
            achievementId: achievement.id,
            unlockedAt: serverTimestamp()
          })

          // Award points
          const currentPoints = userData.points || 0
          await updateDoc(userRef, {
            points: currentPoints + achievement.pointsReward,
            achievements: arrayUnion(achievement.id)
          })

          // Create notification
          await setDoc(doc(db, 'notifications', `${userId}_achievement_${achievement.id}_${Date.now()}`), {
            userId,
            title: 'ปลดล็อคความสำเร็จใหม่! 🏆',
            message: `คุณได้รับ "${achievement.title}" และ ${achievement.pointsReward} แต้ม`,
            type: 'achievement',
            read: false,
            createdAt: serverTimestamp()
          })

          unlockedAchievements.push(achievement)
        }
      }

      return unlockedAchievements
    } catch (error) {
      console.error('Error checking achievements:', error)
      return []
    }
  },

  // Get user achievements
  async getUserAchievements(userId: string): Promise<(UserAchievement & Achievement)[]> {
    try {
      const q = query(
        collection(db, 'userAchievements'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const userAchievements = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        unlockedAt: doc.data().unlockedAt?.toDate() || new Date()
      })) as UserAchievement[]

      return userAchievements.map(userAchievement => {
        const achievementDefinition = achievements.find(a => a.id === userAchievement.achievementId)
        return {
          ...userAchievement,
          ...achievementDefinition
        } as UserAchievement & Achievement
      }).filter(a => a.title)
    } catch (error) {
      console.error('Error getting user achievements:', error)
      return []
    }
  },

  // Process activity for challenges and achievements
  async processActivity(userId: string, activityData: any): Promise<{
    completedChallenges: Challenge[]
    newAchievements: Achievement[]
  }> {
    const completedChallenges: Challenge[] = []
    
    // Update relevant challenges
    const challengeUpdates = [
      // Daily challenges
      { challengeId: 'daily_reading', condition: ['reading'].includes(activityData.type) },
      { challengeId: 'daily_play', condition: ['playing'].includes(activityData.type), value: activityData.duration },
      { challengeId: 'daily_care_trio', condition: true }, // All activities count
      
      // Weekly challenges  
      { challengeId: 'weekly_variety', condition: true }, // Track unique activity types
      { challengeId: 'weekly_educator', condition: ['reading', 'education'].includes(activityData.type) }
    ]

    for (const update of challengeUpdates) {
      if (update.condition) {
        const completed = await this.updateChallengeProgress(
          userId, 
          update.challengeId, 
          update.value || 1
        )
        if (completed) {
          const challenge = [...dailyChallenges, ...weeklyChallenges, ...monthlyChallenges]
            .find(c => c.id === update.challengeId)
          if (challenge) completedChallenges.push(challenge)
        }
      }
    }

    // Check for new achievements
    const newAchievements = await this.checkAchievements(userId, activityData)

    return { completedChallenges, newAchievements }
  }
}