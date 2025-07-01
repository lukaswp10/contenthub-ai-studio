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

// Função para salvar vídeo na galeria
export const saveVideoToGallery = (videoData: {
  file: File
  url: string
  duration: number
}): GalleryVideo => {
  const newVideo: GalleryVideo = {
    id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: videoData.file.name,
    thumbnail: videoData.url, // Usar a URL do vídeo como thumbnail
    duration: videoData.duration,
    size: formatFileSize(videoData.file.size),
    uploadedAt: new Date(),
    file: videoData.file,
    url: videoData.url
  }

  // Obter vídeos existentes
  const existingVideos = getGalleryVideos()
  
  // Adicionar novo vídeo no início da lista
  const updatedVideos = [newVideo, ...existingVideos]
  
  // Limitar a 10 vídeos para não sobrecarregar o localStorage
  const limitedVideos = updatedVideos.slice(0, 10)
  
  // Salvar no localStorage
  try {
    localStorage.setItem(GALLERY_VIDEOS_KEY, JSON.stringify(limitedVideos.map(video => ({
      ...video,
      uploadedAt: video.uploadedAt.toISOString(),
      file: undefined // Não salvar o File object no localStorage
    }))))
    
    console.log('✅ Vídeo salvo na galeria:', newVideo.name)
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
    
    console.log('✅ Vídeo excluído da galeria:', videoId)
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
    
    console.log('✅ Clip salvo na galeria:', newClip.name)
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
    
    console.log('✅ Clip excluído da galeria:', clipId)
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