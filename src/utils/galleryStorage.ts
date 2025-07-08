// Utilitário para gerenciar persistência da galeria de vídeos (100% SUPABASE)
import { supabase } from '../lib/supabase'

export interface GalleryVideo {
  id: string
  name: string
  thumbnail: string
  duration: number
  size: string
  uploadedAt: Date
  file?: File
  url?: string
  cloudinaryPublicId?: string // ID do vídeo no Cloudinary
  cloudinaryUrl?: string // URL permanente do Cloudinary
  transcription?: { // ✅ NOVO: Suporte para transcrição persistente
    words: TranscriptionWord[]
    text: string
    language?: string
    confidence?: number
    provider?: 'whisper' | 'assemblyai' | 'webspeech'
    createdAt?: string
  }
  // ✅ NOVO: Sistema de legendas originais vs editadas
  captions?: {
    original: TranscriptionWord[] // Legendas originais da transcrição
    edited: TranscriptionWord[] // Legendas editadas pelo usuário
    hasEdits: boolean // Se tem edições feitas
    lastEditedAt?: string // Quando foi editado pela última vez
  }
}

// ✅ NOVA INTERFACE: Palavra de transcrição
export interface TranscriptionWord {
  text: string
  start: number
  end: number
  confidence: number
  highlight?: boolean
  speaker?: string
}

export interface GalleryClip {
  id: string
  name: string
  thumbnail: string
  duration: number
  format: 'TikTok' | 'Instagram' | 'YouTube'
  createdAt: Date
  status: 'processing' | 'ready' | 'error'
}

// ✅ Função para salvar vídeo no Supabase (100% REAL)
export const saveVideoToGallery = async (videoData: {
  file: File
  url: string
  duration: number
  cloudinaryPublicId?: string
  cloudinaryUrl?: string
}): Promise<GalleryVideo> => {
  const newVideo: GalleryVideo = {
    id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: videoData.file.name,
    thumbnail: videoData.cloudinaryUrl 
      ? `https://res.cloudinary.com/dyqjxsnjp/video/upload/so_2.0,w_300,h_200,c_fill,q_auto,f_jpg/${videoData.cloudinaryPublicId}.jpg`
      : videoData.url,
    duration: videoData.duration,
    size: formatFileSize(videoData.file.size),
    uploadedAt: new Date(),
    file: videoData.file,
    url: videoData.cloudinaryUrl || videoData.url,
    cloudinaryPublicId: videoData.cloudinaryPublicId,
    cloudinaryUrl: videoData.cloudinaryUrl
  }

  // ✅ SALVAR DIRETO NO SUPABASE (100% REAL)
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ Usuário não autenticado')
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase
      .from('videos')
      .insert({
        id: newVideo.id,
        user_id: user.id,
        filename: newVideo.name,
        size: videoData.file.size, // Bytes reais
        duration: newVideo.duration,
        status: 'uploaded',
        storage_path: newVideo.cloudinaryUrl || newVideo.url,
        created_at: newVideo.uploadedAt.toISOString()
      })

    if (error) {
      console.error('❌ Erro ao salvar vídeo no Supabase:', error)
      throw error
    }

    console.log('☁️ Vídeo salvo no Supabase (100% REAL):', newVideo.name)
    return newVideo
  } catch (error) {
    console.error('❌ Erro ao salvar vídeo:', error)
    throw error
  }
}

// ✅ Função para obter vídeos do Supabase (100% REAL)
export const getGalleryVideos = async (): Promise<GalleryVideo[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('⚠️ Usuário não autenticado')
      return []
    }

    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao carregar vídeos do Supabase:', error)
      return []
    }

    if (!videos || videos.length === 0) {
      console.log('📁 Nenhum vídeo encontrado no Supabase')
      return []
    }

    const galleryVideos: GalleryVideo[] = videos.map(video => {
      // Extrair public_id do storage_path para thumbnail
      let publicId = ''
      if (video.storage_path) {
        const matches = video.storage_path.match(/\/([^\/]+)\.mp4$/)
        publicId = matches ? matches[1] : ''
      }

      return {
        id: video.id,
        name: video.filename,
        thumbnail: publicId 
          ? `https://res.cloudinary.com/dyqjxsnjp/video/upload/so_2.0,w_300,h_200,c_fill,q_auto,f_jpg/${publicId}.jpg`
          : video.storage_path || '',
        duration: video.duration || 0,
        size: formatFileSize(video.size || 0),
        uploadedAt: new Date(video.created_at),
        url: video.storage_path,
        cloudinaryUrl: video.storage_path,
        cloudinaryPublicId: publicId
      }
    })

    console.log(`☁️ ${galleryVideos.length} vídeos carregados do Supabase (100% REAL)`)
    return galleryVideos
  } catch (error) {
    console.error('❌ Erro ao carregar vídeos do Supabase:', error)
    return []
  }
}

// ✅ Função para excluir vídeo do Supabase (100% REAL)
export const deleteVideoFromGallery = async (videoId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ Usuário não autenticado')
      return
    }

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)
      .eq('user_id', user.id) // Segurança: só deletar próprios vídeos

    if (error) {
      console.error('❌ Erro ao excluir vídeo do Supabase:', error)
      throw error
    }

    console.log('☁️ Vídeo excluído do Supabase (100% REAL):', videoId)
  } catch (error) {
    console.error('❌ Erro ao excluir vídeo:', error)
    throw error
  }
}

// Função utilitária para formatar tamanho do arquivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ✅ FUNÇÕES DE TRANSCRIÇÃO (mantidas para compatibilidade)
export const saveTranscriptionToGallery = (videoId: string, transcription: {
  words: TranscriptionWord[]
  text: string
  language?: string
  confidence?: number
  provider?: 'whisper' | 'assemblyai' | 'webspeech'
}): boolean => {
  console.warn('⚠️ saveTranscriptionToGallery: Função localStorage removida - usar Supabase')
  return false
}

export const hasTranscription = (videoId: string): boolean => {
  console.warn('⚠️ hasTranscription: Função localStorage removida - usar Supabase')
  return false
}

export const getTranscriptionFromGallery = (videoId: string) => {
  console.warn('⚠️ getTranscriptionFromGallery: Função localStorage removida - usar Supabase')
  return null
}

export const saveOriginalCaptions = (videoId: string, captions: TranscriptionWord[]): boolean => {
  console.warn('⚠️ saveOriginalCaptions: Função localStorage removida - usar Supabase')
  return false
}

export const saveEditedCaptions = (videoId: string, editedCaptions: TranscriptionWord[]): boolean => {
  console.warn('⚠️ saveEditedCaptions: Função localStorage removida - usar Supabase')
  return false
}

export const getOriginalCaptions = (videoId: string): TranscriptionWord[] | null => {
  console.warn('⚠️ getOriginalCaptions: Função localStorage removida - usar Supabase')
  return null
}

export const getEditedCaptions = (videoId: string): TranscriptionWord[] | null => {
  console.warn('⚠️ getEditedCaptions: Função localStorage removida - usar Supabase')
  return null
}

export const hasEditedCaptions = (videoId: string): boolean => {
  console.warn('⚠️ hasEditedCaptions: Função localStorage removida - usar Supabase')
  return false
}

export const resetToOriginalCaptions = (videoId: string): boolean => {
  console.warn('⚠️ resetToOriginalCaptions: Função localStorage removida - usar Supabase')
  return false
}

// ✅ MANTER FUNÇÃO PARA COMPATIBILIDADE (mas agora aponta para Supabase)
export const syncGalleryWithSupabase = async (): Promise<void> => {
  console.log('🔄 Sistema agora é 100% Supabase - sync desnecessário')
}

// ✅ CLIPS - Mantido para compatibilidade (localStorage temporário)
const GALLERY_CLIPS_KEY = 'clipsforge_gallery_clips'

// Função para salvar clip na galeria
export const saveClipToGallery = (clipData: Omit<GalleryClip, 'id' | 'createdAt'>): GalleryClip => {
  const newClip: GalleryClip = {
    ...clipData,
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date()
  }

  const existingClips = getGalleryClips()
  const updatedClips = [newClip, ...existingClips].slice(0, 15) // Limitar a 15 clips
  
  try {
    localStorage.setItem(GALLERY_CLIPS_KEY, JSON.stringify(updatedClips.map(clip => ({
      ...clip,
      createdAt: clip.createdAt.toISOString()
    }))))
    
    // Clip salvo na galeria
  } catch (error) {
    console.error('❌ Erro ao salvar clip na galeria:', error)
  }
  
  return newClip
}

// Função para obter clips da galeria
export const getGalleryClips = (): GalleryClip[] => {
  try {
    const stored = localStorage.getItem(GALLERY_CLIPS_KEY)
    if (!stored) return []
    
    const clips = JSON.parse(stored)
    return clips.map((clip: any) => ({
      ...clip,
      createdAt: new Date(clip.createdAt)
    }))
  } catch (error) {
    console.error('❌ Erro ao carregar clips da galeria:', error)
    return []
  }
}

// Função para excluir clip da galeria
export const deleteClipFromGallery = (clipId: string): void => {
  try {
    const existingClips = getGalleryClips()
    const updatedClips = existingClips.filter(clip => clip.id !== clipId)
    
    localStorage.setItem(GALLERY_CLIPS_KEY, JSON.stringify(updatedClips.map(clip => ({
      ...clip,
      createdAt: clip.createdAt.toISOString()
    }))))
    
    // Clip excluído da galeria
  } catch (error) {
    console.error('❌ Erro ao excluir clip da galeria:', error)
  }
} 