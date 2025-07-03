import { useCallback, useEffect, RefObject } from 'react'
import { formatTime } from '../../../utils/timeUtils'
import { 
  useVideoEditorStore, 
  useVideoData, 
  useVideoTime, 
  useVideoPlayback,
  type VideoClip,
  type PlaybackMode 
} from '../../../stores/videoEditorStore'

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
  
  // 🏪 Zustand selectors otimizados com shallow compare
  const videoData = useVideoData()
  const { currentTime, duration } = useVideoTime()
  const { isPlaying, togglePlayPause, seekTo } = useVideoPlayback()
  
  // ➕ SELECTOR OTIMIZADO: Sistema de reprodução inteligente (combinado para performance)
  const playbackState = useVideoEditorStore(
    state => ({
      playbackMode: state.playbackMode,
      activeClip: state.activeClip,
      clipBounds: state.clipBounds,
      loopClip: state.loopClip,
      autoSeekToClipStart: state.autoSeekToClipStart
    })
  )
  
  // Actions do store (estáveis, não recriam)
  const setCurrentTime = useVideoEditorStore(state => state.setCurrentTime)
  const setDuration = useVideoEditorStore(state => state.setDuration)
  const setIsPlaying = useVideoEditorStore(state => state.setIsPlaying)
  const playClip = useVideoEditorStore(state => state.playClip)
  const playFullVideo = useVideoEditorStore(state => state.playFullVideo)
  
  // 🎯 Função para buscar posição específica no vídeo
  const handleSeekTo = useCallback((percentage: number) => {
    if (videoRef.current && duration > 0) {
      const time = (percentage / 100) * duration
      
      // ➕ VERIFICAR BOUNDS do clip ativo
      if (playbackState.playbackMode !== 'full' && playbackState.clipBounds) {
        const clampedTime = Math.max(playbackState.clipBounds.start, Math.min(playbackState.clipBounds.end, time))
        videoRef.current.currentTime = clampedTime
        setCurrentTime(clampedTime)
        console.log(`🎯 Seek no clip: ${percentage}% = ${clampedTime}s (limitado entre ${playbackState.clipBounds.start}-${playbackState.clipBounds.end}s)`)
      } else {
        videoRef.current.currentTime = time
        setCurrentTime(time)
        console.log(`🎯 Seek no vídeo: ${percentage}% = ${time}s`)
      }
    }
  }, [videoRef, duration, setCurrentTime, playbackState.playbackMode, playbackState.clipBounds])

  // ➕ FUNÇÃO CORRIGIDA: Controle de reprodução inteligente (sem auto-pause)
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      
      // ➕ APENAS ATUALIZAR TEMPO - NÃO PAUSAR AUTOMATICAMENTE
      setCurrentTime(newTime)
      
      // ➕ VERIFICAR BOUNDS DO CLIP APENAS PARA LOOP
      if (playbackState.playbackMode !== 'full' && playbackState.clipBounds && playbackState.loopClip) {
        if (newTime >= playbackState.clipBounds.end) {
          // Loop: voltar ao início do clip
          videoRef.current.currentTime = playbackState.clipBounds.start
          setCurrentTime(playbackState.clipBounds.start)
          console.log(`🔄 Loop do clip: voltando para ${playbackState.clipBounds.start}s`)
        }
      }
    }
  }, [videoRef, setCurrentTime, playbackState.playbackMode, playbackState.clipBounds, playbackState.loopClip])

  // 🎯 Handler para carregamento do vídeo
  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      setDuration(videoDuration)
      console.log('🎬 Vídeo carregado, duração:', videoDuration)
      
      // ➕ AUTO-SEEK para início do clip se necessário
      if (playbackState.autoSeekToClipStart && playbackState.clipBounds) {
        videoRef.current.currentTime = playbackState.clipBounds.start
        setCurrentTime(playbackState.clipBounds.start)
        console.log(`🎯 Auto-seek para início do clip: ${playbackState.clipBounds.start}s`)
      }
    }
  }, [videoRef, setDuration, playbackState.autoSeekToClipStart, playbackState.clipBounds, setCurrentTime])

  // 🎯 Toggle play/pause integrado com sistema de clips
  const handleTogglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        console.log('⏸️ Pausado')
      } else {
        // ➕ VERIFICAR SE precisamos ir para o início do clip
        if (playbackState.playbackMode !== 'full' && playbackState.clipBounds) {
          const currentVideoTime = videoRef.current.currentTime
          if (currentVideoTime < playbackState.clipBounds.start || currentVideoTime >= playbackState.clipBounds.end) {
            videoRef.current.currentTime = playbackState.clipBounds.start
            setCurrentTime(playbackState.clipBounds.start)
            console.log(`🎯 Reposicionando para início do clip: ${playbackState.clipBounds.start}s`)
          }
        }
        
        videoRef.current.play()
        console.log('▶️ Reproduzindo')
      }
      togglePlayPause()
    }
  }, [videoRef, isPlaying, togglePlayPause, playbackState.playbackMode, playbackState.clipBounds, setCurrentTime])

  // ➕ NOVA FUNÇÃO: Reproduzir clip específico
  const handlePlayClip = useCallback((startTime: number, endTime: number, loop: boolean = false) => {
    if (videoRef.current) {
      playClip(startTime, endTime, loop)
      videoRef.current.currentTime = startTime
      if (!isPlaying) {
        videoRef.current.play()
      }
      console.log(`🎬 Reproduzindo clip: ${formatTime(startTime)} - ${formatTime(endTime)}`)
    }
  }, [videoRef, playClip, isPlaying])

  // ➕ NOVA FUNÇÃO: Voltar ao vídeo completo
  const handlePlayFullVideo = useCallback(() => {
    playFullVideo()
    console.log('🎬 Voltando ao vídeo completo')
  }, [playFullVideo])

  // 🎯 Configurar event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    console.log('🔧 Configurando event listeners com sistema de clips')

    // ✅ HANDLER PARA PLAY/PAUSE AUTOMÁTICO
    const handlePlay = () => {
      console.log('▶️ Vídeo iniciou reprodução (automático)')
      setIsPlaying(true)
    }

    const handlePause = () => {
      console.log('⏸️ Vídeo pausou (automático)')
      setIsPlaying(false)
    }

    // ✅ HANDLER PARA SYNC BIDIRECIONAL
    const handleSeeked = () => {
      console.log('🎯 Seek realizado, sincronizando tempo')
      if (video.currentTime !== undefined) {
        setCurrentTime(video.currentTime)
      }
    }

    // Adicionar listeners
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadeddata', handleVideoLoad)
    video.addEventListener('loadedmetadata', handleVideoLoad)
    video.addEventListener('canplay', handleVideoLoad)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeked', handleSeeked)

    // ✅ FORÇAR ATUALIZAÇÃO INICIAL
    if (video.duration && !isNaN(video.duration)) {
      handleVideoLoad()
    }

    // ✅ SINCRONIZAR ESTADO INICIAL
    if (video.paused !== !isPlaying) {
      if (isPlaying && video.paused) {
        video.play().catch(console.error)
      } else if (!isPlaying && !video.paused) {
        video.pause()
      }
    }

    // Cleanup
    return () => {
      console.log('🧹 Removendo event listeners')
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadeddata', handleVideoLoad)
      video.removeEventListener('loadedmetadata', handleVideoLoad)
      video.removeEventListener('canplay', handleVideoLoad)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [handleTimeUpdate, handleVideoLoad, isPlaying, setIsPlaying, setCurrentTime])

  // ➕ RETORNOS APRIMORADOS para a nova interface
  const hasVideo = Boolean(videoData?.url || videoData?.file)
  const videoUrl = videoData?.url || (videoData?.file ? URL.createObjectURL(videoData.file) : null)
  
  // Derived states otimizados
  const isClipMode = playbackState.playbackMode !== 'full'
  const clipDuration = playbackState.clipBounds ? playbackState.clipBounds.end - playbackState.clipBounds.start : 0
  const clipCurrentTime = playbackState.clipBounds ? Math.max(0, currentTime - playbackState.clipBounds.start) : currentTime
  const clipRemainingTime = playbackState.clipBounds ? Math.max(0, playbackState.clipBounds.end - currentTime) : 0
  const clipProgressPercentage = playbackState.clipBounds && playbackState.clipBounds.end > playbackState.clipBounds.start 
    ? Math.max(0, Math.min(100, ((currentTime - playbackState.clipBounds.start) / (playbackState.clipBounds.end - playbackState.clipBounds.start)) * 100))
    : 0

  return {
    // Estados básicos
    hasVideo,
    videoUrl,
    currentTime,
    duration,
    isPlaying,
    
    // ➕ NOVOS RETORNOS: Sistema de clips
    playClip: handlePlayClip,
    playFullVideo: handlePlayFullVideo,
    isClipMode,
    clipDuration,
    clipCurrentTime,
    clipRemainingTime,
    clipProgressPercentage,
    
    // Funções
    seekTo: handleSeekTo,
    togglePlayPause: handleTogglePlayPause,
    formatTime,
    
    // Formatters úteis
    currentTimeFormatted: formatTime(currentTime),
    durationFormatted: formatTime(duration),
    progressPercentage: duration > 0 ? (currentTime / duration) * 100 : 0
  }
} 