export interface AnalyticsData {
  total_videos: number
  total_clips: number
  total_views: number
  total_likes: number
  total_shares: number
  total_followers: number
  growth_rate: number
}

export interface PlatformMetrics {
  platform: string
  views: number
  likes: number
  shares: number
  comments: number
  followers: number
  engagement_rate: number
}

export interface VideoPerformance {
  video_id: string
  title: string
  total_views: number
  total_likes: number
  total_shares: number
  clips_performance: ClipPerformance[]
  created_at: string
}

export interface ClipPerformance {
  clip_id: string
  title: string
  platform: string
  views: number
  likes: number
  shares: number
  comments: number
  engagement_rate: number
  viral_score: number
}

export interface AnalyticsTimeRange {
  start_date: string
  end_date: string
  period: 'day' | 'week' | 'month' | 'year'
} 