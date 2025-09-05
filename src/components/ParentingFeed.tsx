import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { activityService } from '../services/activityService'
import { Activity } from '../types'
import ActivityFeedDisplay from './ActivityFeedDisplay'

interface ParentingFeedProps {
  onClose: () => void
}

const ParentingFeed: React.FC<ParentingFeedProps> = ({ onClose }) => {
  const { currentUser } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      loadActivities()
    }
  }, [currentUser])

  const loadActivities = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      const userActivities = await activityService.getUserActivities(currentUser.uid)
      // Sort by timestamp descending (most recent first)
      const sortedActivities = userActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setActivities(sortedActivities)
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActivityFeedDisplay 
      activities={activities}
      loading={loading}
      readOnly={false}
      showHeader={true}
      title="บันทึกการเลี้ยงดู"
      onClose={onClose}
    />
  )
}

export default ParentingFeed