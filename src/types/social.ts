export interface SocialPlatform {
  id: string
  name: string
  icon: string
  color: string
  bgGradient?: string
  maxAccounts: {
    free: number
    pro: number
    agency: number
  }
  features: string[]
  postFormats: string[]
  aspectRatios: string[]
  maxVideoDuration: number
  optimalPostTimes: string[]
  hashtagLimit: number
}

export interface SocialAccount {
  id: string
  user_id: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin'
  account_id: string
  username: string
  avatar_url?: string
  followers_count?: number
  is_connected: boolean
  connected_at: string
}

export interface ScheduledPost {
  id: string
  user_id: string
  clip_id: string
  platforms: string[]
  content: {
    caption: string
    hashtags: string[]
    media_url: string
  }
  scheduled_for: string
  status: 'scheduled' | 'published' | 'failed'
  ayrshare_post_id?: string
  created_at: string
}

export interface PostTemplate {
  id: string
  user_id: string
  name: string
  caption_template: string
  hashtags: string[]
  platforms: string[]
  is_default: boolean
}

export interface AyrshareResponse {
  status: 'success' | 'error'
  id?: string
  postIds?: { [platform: string]: string }
  errors?: { [platform: string]: string }
}

export interface SocialMetrics {
  platform: string
  followers: number
  following: number
  posts: number
  engagement_rate: number
  last_updated: string
}

export const PLATFORMS: Record<string, SocialPlatform> = {
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    bgGradient: 'linear-gradient(135deg, #FF0050 0%, #00F2EA 100%)',
    maxAccounts: { free: 1, pro: 5, agency: 20 },
    features: [
      'Vídeos curtos até 60s',
      'Hashtags virais automáticas',
      'Análise de trends',
      'Melhor horário por região'
    ],
    postFormats: ['video'],
    aspectRatios: ['9:16'],
    maxVideoDuration: 60,
    optimalPostTimes: ['06:00', '10:00', '19:00', '22:00'],
    hashtagLimit: 30
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    bgGradient: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)',
    maxAccounts: { free: 1, pro: 5, agency: 20 },
    features: [
      'Reels, Feed e Stories',
      'Hashtags e localização',
      'Menções automáticas',
      'Agendamento otimizado'
    ],
    postFormats: ['reels', 'feed', 'stories', 'igtv'],
    aspectRatios: ['9:16', '1:1', '4:5'],
    maxVideoDuration: 90,
    optimalPostTimes: ['08:00', '12:00', '17:00', '20:00'],
    hashtagLimit: 30
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Shorts',
    icon: '📺',
    color: '#FF0000',
    bgGradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    maxAccounts: { free: 0, pro: 3, agency: 10 },
    features: [
      'Shorts até 60s',
      'Thumbnails automáticas',
      'SEO tags otimizadas',
      'Analytics detalhado'
    ],
    postFormats: ['shorts'],
    aspectRatios: ['9:16'],
    maxVideoDuration: 60,
    optimalPostTimes: ['14:00', '16:00', '20:00'],
    hashtagLimit: 15
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '🐦',
    color: '#1DA1F2',
    bgGradient: 'linear-gradient(135deg, #1DA1F2 0%, #0C85D0 100%)',
    maxAccounts: { free: 0, pro: 3, agency: 10 },
    features: [
      'Vídeos até 2:20',
      'Thread automática',
      'Trending topics',
      'Engajamento em tempo real'
    ],
    postFormats: ['video', 'thread'],
    aspectRatios: ['16:9', '1:1'],
    maxVideoDuration: 140,
    optimalPostTimes: ['09:00', '12:00', '15:00', '18:00'],
    hashtagLimit: 5
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0077B5',
    bgGradient: 'linear-gradient(135deg, #0077B5 0%, #005885 100%)',
    maxAccounts: { free: 0, pro: 2, agency: 5 },
    features: [
      'Vídeos profissionais',
      'Posts com artigos',
      'Networking automático',
      'B2B targeting'
    ],
    postFormats: ['video', 'article'],
    aspectRatios: ['16:9', '1:1'],
    maxVideoDuration: 600,
    optimalPostTimes: ['08:00', '12:00', '17:00'],
    hashtagLimit: 5
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '👤',
    color: '#1877F2',
    bgGradient: 'linear-gradient(135deg, #1877F2 0%, #0C5FCD 100%)',
    maxAccounts: { free: 1, pro: 3, agency: 10 },
    features: [
      'Vídeos e Reels',
      'Cross-posting',
      'Grupos targeting',
      'Boost automático'
    ],
    postFormats: ['video', 'reels'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    maxVideoDuration: 240,
    optimalPostTimes: ['09:00', '13:00', '16:00', '20:00'],
    hashtagLimit: 10
  }
}