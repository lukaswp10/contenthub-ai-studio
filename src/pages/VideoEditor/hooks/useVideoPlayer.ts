import { useCallback, useEffect, RefObject } from 'react'
import { formatTime } from '../../../utils/timeUtils'
import { useVideoEditorStore, useVideoData, useVideoTime, useVideoPlayback } from '../../../stores/videoEditorStore'

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
}

export const useVideoPlayer = ({ videoRef }: UseVideoPlayerProps) => {
  
  // 🏪 Zustand selectors para performance otimizada
  const videoData = useVideoData()
  const { currentTime, duration } = useVideoTime()
  const { isPlaying, togglePlayPause, seekTo } = useVideoPlayback()
  const setCurrentTime = useVideoEditorStore(state => state.setCurrentTime)
  const setDuration = useVideoEditorStore(state => state.setDuration)
  
  // 🎯 Função para buscar posição específica no vídeo
  const handleSeekTo = useCallback((percentage: number) => {
    if (videoRef.current && duration > 0) {
      const time = (percentage / 100) * duration
      videoRef.current.currentTime = time
      setCurrentTime(time)
      
      console.log('🎯 VideoPlayer: Seek para', percentage + '%', '=', time + 's')
    }
  }, [videoRef, duration, setCurrentTime])

  // 🎯 Handler para atualização de tempo
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      setCurrentTime(newTime)
    }
  }, [videoRef, setCurrentTime])

  // 🎯 Handler para carregamento do vídeo
  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      setDuration(videoDuration)
      console.log('🎬 VideoPlayer: Vídeo carregado, duração:', videoDuration)
    }
  }, [videoRef, setDuration])

  // 🎯 Toggle play/pause integrado com store
  const handleTogglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        console.log('⏸️ VideoPlayer: Pausado')
      } else {
        videoRef.current.play()
        console.log('▶️ VideoPlayer: Reproduzindo')
      }
      togglePlayPause()
    }
  }, [videoRef, isPlaying, togglePlayPause])

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

  return {
    // Funções
    seekTo: handleSeekTo,
    togglePlayPause: handleTogglePlayPause,
    formatTime,
    
    // Estados derivados do store
    currentTimeFormatted: formatTime(currentTime),
    durationFormatted: formatTime(duration),
    progressPercentage: duration > 0 ? (currentTime / duration) * 100 : 0,
    
    // ✅ CORRIGIDO: Dados do vídeo considerando file E url
    hasVideo: !!(videoData?.url || videoData?.file),
    videoUrl: videoData?.url || (videoData?.file ? URL.createObjectURL(videoData.file) : undefined),
    videoName: videoData?.name || 'Video',
    
    // Estados diretos do store
    currentTime,
    duration,
    isPlaying
  }
} 