export interface Video {
  id: string
  user_id: string
  title: string
  description?: string
  file_url: string
  thumbnail_url?: string
  duration?: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface Clip {
  id: string
  video_id: string
  title: string
  start_time: number
  end_time: number
  file_url: string
  thumbnail_url?: string
  viral_score: number
  status: 'generating' | 'completed' | 'failed'
  created_at: string
}

export interface ContentAnalysis {
  id: string
  video_id: string
  transcript: string
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  viral_factors: {
    hooks: string[]
    emotional_peaks: number[]
    engagement_points: number[]
  }
  created_at: string
}

export interface UploadProgress {
  progress: number
  stage: 'uploading' | 'transcribing' | 'analyzing' | 'generating' | 'completed'
  message: string
} 