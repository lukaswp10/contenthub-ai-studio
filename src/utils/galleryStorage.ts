// Utilitário para gerenciar persistência da galeria de vídeos
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

const GALLERY_VIDEOS_KEY = 'clipsforge_gallery_videos'
const GALLERY_CLIPS_KEY = 'clipsforge_gallery_clips'

// Função para salvar vídeo na galeria (com suporte ao Cloudinary)
export const saveVideoToGallery = (videoData: {
  file: File
  url: string
  duration: number
  cloudinaryPublicId?: string
  cloudinaryUrl?: string
}): GalleryVideo => {
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
    url: videoData.cloudinaryUrl || videoData.url, // Preferir URL do Cloudinary
    cloudinaryPublicId: videoData.cloudinaryPublicId,
    cloudinaryUrl: videoData.cloudinaryUrl
  }

  // Obter vídeos existentes
  const existingVideos = getGalleryVideos()
  
  // Adicionar novo vídeo no início da lista
  const updatedVideos = [newVideo, ...existingVideos]
  
  // Limitar a 50 vídeos (agora que temos Cloudinary, podemos armazenar mais)
  const limitedVideos = updatedVideos.slice(0, 50)
  
  // Salvar no localStorage
  try {
    localStorage.setItem(GALLERY_VIDEOS_KEY, JSON.stringify(limitedVideos.map(video => ({
      ...video,
      uploadedAt: video.uploadedAt.toISOString(),
      file: undefined // Não salvar o File object no localStorage
    }))))
    
    // Vídeo salvo na galeria
  } catch (error) {
    console.error('❌ Erro ao salvar vídeo na galeria:', error)
  }
  
  return newVideo
}

// Função para obter vídeos da galeria
export const getGalleryVideos = (): GalleryVideo[] => {
  try {
    const stored = localStorage.getItem(GALLERY_VIDEOS_KEY)
    if (!stored) return []
    
    const videos = JSON.parse(stored)
    return videos.map((video: any) => ({
      ...video,
      uploadedAt: new Date(video.uploadedAt)
    }))
  } catch (error) {
    console.error('❌ Erro ao carregar vídeos da galeria:', error)
    return []
  }
}

// Função para excluir vídeo da galeria
export const deleteVideoFromGallery = (videoId: string): void => {
  try {
    const existingVideos = getGalleryVideos()
    const updatedVideos = existingVideos.filter(video => video.id !== videoId)
    
    localStorage.setItem(GALLERY_VIDEOS_KEY, JSON.stringify(updatedVideos.map(video => ({
      ...video,
      uploadedAt: video.uploadedAt.toISOString(),
      file: undefined
    }))))
    
    // Vídeo excluído da galeria
  } catch (error) {
    console.error('❌ Erro ao excluir vídeo da galeria:', error)
  }
}

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

// Função utilitária para formatar tamanho do arquivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ✅ NOVA FUNÇÃO: Salvar transcrição na galeria
export const saveTranscriptionToGallery = (videoId: string, transcription: {
  words: TranscriptionWord[]
  text: string
  language?: string
  confidence?: number
  provider?: 'whisper' | 'assemblyai' | 'webspeech'
}): boolean => {
  try {
    const videos = getGalleryVideos()
    const videoIndex = videos.findIndex(v => v.id === videoId)
    
    if (videoIndex !== -1) {
      videos[videoIndex].transcription = {
        ...transcription,
        createdAt: new Date().toISOString()
      }
      
      // Salvar no localStorage
      localStorage.setItem(GALLERY_VIDEOS_KEY, JSON.stringify(videos.map(video => ({
        ...video,
        uploadedAt: video.uploadedAt.toISOString(),
        file: undefined
      }))))
      
      // Transcrição salva na galeria
      return true
    }
    
    console.warn('⚠️ Vídeo não encontrado para salvar transcrição:', videoId)
    return false
  } catch (error) {
    console.error('❌ Erro ao salvar transcrição na galeria:', error)
    return false
  }
}

// ✅ NOVA FUNÇÃO: Verificar se vídeo tem transcrição
export const hasTranscription = (videoId: string): boolean => {
  try {
    const videos = getGalleryVideos()
    const video = videos.find(v => v.id === videoId)
    return !!(video?.transcription?.words?.length)
  } catch (error) {
    console.error('❌ Erro ao verificar transcrição:', error)
    return false
  }
}

// ✅ NOVA FUNÇÃO: Obter transcrição de um vídeo
export const getTranscriptionFromGallery = (videoId: string) => {
  try {
    const videos = getGalleryVideos()
    const video = videos.find(v => v.id === videoId)
    return video?.transcription || null
  } catch (error) {
    console.error('❌ Erro ao carregar transcrição:', error)
    return null
  }
}

// ✅ NOVAS FUNÇÕES: Sistema de legendas originais vs editadas

// Salvar legendas originais (primeira vez que transcreve)
export const saveOriginalCaptions = (videoId: string, captions: TranscriptionWord[]): boolean => {
  try {
    const videos = getGalleryVideos()
    const videoIndex = videos.findIndex(v => v.id === videoId)
    
    if (videoIndex !== -1) {
      if (!videos[videoIndex].captions) {
        videos[videoIndex].captions = {
          original: captions,
          edited: [...captions], // Cópia inicial
          hasEdits: false
        }
      } else {
        // Atualizar apenas as originais se já existir
        const captionsData = videos[videoIndex].captions
        if (captionsData) {
          captionsData.original = captions
          if (!captionsData.hasEdits) {
            captionsData.edited = [...captions]
          }
        }
      }
      
      // Salvar no localStorage
      localStorage.setItem(GALLERY_VIDEOS_KEY, JSON.stringify(videos.map(video => ({
        ...video,
        uploadedAt: video.uploadedAt.toISOString(),
        file: undefined
      }))))
      
      return true
    }
    
    return false
  } catch (error) {
    return false
  }
}

// Salvar legendas editadas
export const saveEditedCaptions = (videoId: string, editedCaptions: TranscriptionWord[]): boolean => {
  try {
    const videos = getGalleryVideos()
    const videoIndex = videos.findIndex(v => v.id === videoId)
    
    if (videoIndex !== -1) {
      if (!videos[videoIndex].captions) {
        // Se não tem legendas ainda, criar com as editadas
        videos[videoIndex].captions = {
          original: [...editedCaptions],
          edited: editedCaptions,
          hasEdits: false
        }
      } else {
        // Atualizar legendas editadas
        const captionsData = videos[videoIndex].captions
        if (captionsData) {
          captionsData.edited = editedCaptions
          captionsData.hasEdits = true
          captionsData.lastEditedAt = new Date().toISOString()
        }
      }
      
      // Salvar no localStorage
      localStorage.setItem(GALLERY_VIDEOS_KEY, JSON.stringify(videos.map(video => ({
        ...video,
        uploadedAt: video.uploadedAt.toISOString(),
        file: undefined
      }))))
      
      return true
    }
    
    return false
  } catch (error) {
    return false
  }
}

// Obter legendas originais
export const getOriginalCaptions = (videoId: string): TranscriptionWord[] | null => {
  try {
    const videos = getGalleryVideos()
    const video = videos.find(v => v.id === videoId)
    return video?.captions?.original || null
  } catch (error) {
    return null
  }
}

// Obter legendas editadas
export const getEditedCaptions = (videoId: string): TranscriptionWord[] | null => {
  try {
    const videos = getGalleryVideos()
    const video = videos.find(v => v.id === videoId)
    return video?.captions?.edited || null
  } catch (error) {
    return null
  }
}

// Verificar se tem edições
export const hasEditedCaptions = (videoId: string): boolean => {
  try {
    const videos = getGalleryVideos()
    const video = videos.find(v => v.id === videoId)
    return video?.captions?.hasEdits || false
  } catch (error) {
    return false
  }
}

// Resetar para legendas originais
export const resetToOriginalCaptions = (videoId: string): boolean => {
  try {
    const videos = getGalleryVideos()
    const videoIndex = videos.findIndex(v => v.id === videoId)
    
    if (videoIndex !== -1 && videos[videoIndex].captions) {
      const captionsData = videos[videoIndex].captions
      if (captionsData) {
        captionsData.edited = [...captionsData.original]
        captionsData.hasEdits = false
        captionsData.lastEditedAt = undefined
        
        // Salvar no localStorage
        localStorage.setItem(GALLERY_VIDEOS_KEY, JSON.stringify(videos.map(video => ({
          ...video,
          uploadedAt: video.uploadedAt.toISOString(),
          file: undefined
        }))))
        
        return true
      }
    }
    
    return false
  } catch (error) {
    return false
  }
} 