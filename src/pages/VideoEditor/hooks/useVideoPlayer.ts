import { useCallback, useEffect, RefObject } from 'react'

interface VideoData {
  file?: File | null
  url?: string
  name: string
  size: number
  duration?: number
  id?: string
  videoData?: any
}

interface UseVideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement>
  videoData: VideoData | null
  currentTime: number
  duration: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onTogglePlayPause: () => void
  onVideoLoad: () => void
}

export const useVideoPlayer = ({
  videoRef,
  videoData,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onTogglePlayPause,
  onVideoLoad
}: UseVideoPlayerProps) => {
  
  // 🎯 Função para buscar posição específica no vídeo
  const seekTo = useCallback((percentage: number) => {
    if (videoRef.current && duration > 0) {
      const time = (percentage / duration) * duration
      videoRef.current.currentTime = time
      onTimeUpdate(time)
      
      console.log('🎯 VideoPlayer: Seek para', percentage + '%', '=', time + 's')
    }
  }, [videoRef, duration, onTimeUpdate])

  // 🎯 Handler para atualização de tempo
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      onTimeUpdate(newTime)
    }
  }, [videoRef, onTimeUpdate])

  // 🎯 Handler para carregamento do vídeo
  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      console.log('🎬 VideoPlayer: Vídeo carregado, duração:', videoDuration)
      onVideoLoad()
    }
  }, [videoRef, onVideoLoad])

  // 🎯 Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        console.log('⏸️ VideoPlayer: Pausado')
      } else {
        videoRef.current.play()
        console.log('▶️ VideoPlayer: Reproduzindo')
      }
      onTogglePlayPause()
    }
  }, [videoRef, isPlaying, onTogglePlayPause])

  // 🎯 Configurar event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Adicionar listeners
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadeddata', handleVideoLoad)

    // Cleanup
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadeddata', handleVideoLoad)
    }
  }, [handleTimeUpdate, handleVideoLoad])

  // 🎯 Formatar tempo em MM:SS
  const formatTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00'
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    // Funções
    seekTo,
    togglePlayPause,
    formatTime,
    
    // Estados derivados
    currentTimeFormatted: formatTime(currentTime),
    durationFormatted: formatTime(duration),
    progressPercentage: duration > 0 ? (currentTime / duration) * 100 : 0,
    
    // Dados do vídeo
    hasVideo: !!videoData?.url,
    videoUrl: videoData?.url,
    videoName: videoData?.name || 'Video'
  }
} 