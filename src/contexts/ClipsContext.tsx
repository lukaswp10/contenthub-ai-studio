import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

export interface Clip {
  id: string
  title: string
  duration: number
  format: 'TikTok' | 'Instagram Reels' | 'YouTube Shorts'
  createdAt: string
  thumbnail?: string
  videoUrl?: string
  sourceVideoId: string
  views: number
  likes: number
  shares: number
  engagement: number
  status: 'processing' | 'ready' | 'error'
}

interface ClipsContextType {
  clips: Clip[]
  addClips: (newClips: Clip[]) => void
  updateClip: (id: string, updates: Partial<Clip>) => void
  deleteClip: (id: string) => void
  getClipsByFormat: (format: string) => Clip[]
  totalViews: number
  totalEngagement: number
  loading: boolean
}

const ClipsContext = createContext<ClipsContextType | null>(null)

export const useClips = () => {
  const context = useContext(ClipsContext)
  if (!context) {
    throw new Error('useClips must be used within a ClipsProvider')
  }
  return context
}

export const ClipsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(false)

  // Simular carregamento de clips do usuário
  useEffect(() => {
    if (user) {
      setLoading(true)
      // Simular delay de carregamento
      setTimeout(() => {
        // Clips de exemplo - em produção viriam do backend
        const exampleClips: Clip[] = []
        setClips(exampleClips)
        setLoading(false)
      }, 500)
    }
  }, [user])

  const addClips = (newClips: Clip[]) => {
    setClips(prev => [...prev, ...newClips])
  }

  const updateClip = (id: string, updates: Partial<Clip>) => {
    setClips(prev => 
      prev.map(clip => 
        clip.id === id ? { ...clip, ...updates } : clip
      )
    )
  }

  const deleteClip = (id: string) => {
    setClips(prev => prev.filter(clip => clip.id !== id))
  }

  const getClipsByFormat = (format: string) => {
    return clips.filter(clip => clip.format === format)
  }

  const totalViews = clips.reduce((sum, clip) => sum + clip.views, 0)
  const totalEngagement = clips.length > 0 
    ? clips.reduce((sum, clip) => sum + clip.engagement, 0) / clips.length 
    : 0

  const value: ClipsContextType = {
    clips,
    addClips,
    updateClip,
    deleteClip,
    getClipsByFormat,
    totalViews,
    totalEngagement,
    loading
  }

  return (
    <ClipsContext.Provider value={value}>
      {children}
    </ClipsContext.Provider>
  )
} 