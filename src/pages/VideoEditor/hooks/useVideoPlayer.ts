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
  
  // 🏪 Zustand selectors para performance otimizada
  const videoData = useVideoData()
  const { currentTime, duration } = useVideoTime()
  const { isPlaying, togglePlayPause, seekTo } = useVideoPlayback()
  
  // ➕ NOVOS SELECTORS: Sistema de reprodução inteligente
  const playbackMode = useVideoEditorStore(state => state.playbackMode)
  const activeClip = useVideoEditorStore(state => state.activeClip)
  const clipBounds = useVideoEditorStore(state => state.clipBounds)
  const loopClip = useVideoEditorStore(state => state.loopClip)
  const autoSeekToClipStart = useVideoEditorStore(state => state.autoSeekToClipStart)
  
  // Actions do store
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
      if (playbackMode !== 'full' && clipBounds) {
        const clampedTime = Math.max(clipBounds.start, Math.min(clipBounds.end, time))
        videoRef.current.currentTime = clampedTime
        setCurrentTime(clampedTime)
        console.log(`🎯 Seek no clip: ${percentage}% = ${clampedTime}s (limitado entre ${clipBounds.start}-${clipBounds.end}s)`)
      } else {
        videoRef.current.currentTime = time
        setCurrentTime(time)
        console.log(`🎯 Seek no vídeo: ${percentage}% = ${time}s`)
      }
    }
  }, [videoRef, duration, setCurrentTime, playbackMode, clipBounds])

  // ➕ NOVA FUNÇÃO: Controle de reprodução inteligente
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      
      // ➕ VERIFICAR SE estamos no modo clip e se chegamos ao final
      if (playbackMode !== 'full' && clipBounds && newTime >= clipBounds.end) {
        if (loopClip) {
          // Loop: voltar ao início do clip
          videoRef.current.currentTime = clipBounds.start
          setCurrentTime(clipBounds.start)
          console.log(`🔄 Loop do clip: voltando para ${clipBounds.start}s`)
        } else {
          // Pausar no final do clip
          videoRef.current.pause()
          setIsPlaying(false)
          console.log(`⏸️ Fim do clip: pausando em ${clipBounds.end}s`)
        }
      } else {
        setCurrentTime(newTime)
      }
    }
  }, [videoRef, setCurrentTime, playbackMode, clipBounds, loopClip, setIsPlaying])

  // 🎯 Handler para carregamento do vídeo
  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      setDuration(videoDuration)
      console.log('🎬 Vídeo carregado, duração:', videoDuration)
      
      // ➕ AUTO-SEEK para início do clip se necessário
      if (autoSeekToClipStart && clipBounds) {
        videoRef.current.currentTime = clipBounds.start
        setCurrentTime(clipBounds.start)
        console.log(`🎯 Auto-seek para início do clip: ${clipBounds.start}s`)
      }
    }
  }, [videoRef, setDuration, autoSeekToClipStart, clipBounds, setCurrentTime])

  // 🎯 Toggle play/pause integrado com sistema de clips
  const handleTogglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        console.log('⏸️ Pausado')
      } else {
        // ➕ VERIFICAR SE precisamos ir para o início do clip
        if (playbackMode !== 'full' && clipBounds) {
          const currentVideoTime = videoRef.current.currentTime
          if (currentVideoTime < clipBounds.start || currentVideoTime >= clipBounds.end) {
            videoRef.current.currentTime = clipBounds.start
            setCurrentTime(clipBounds.start)
            console.log(`🎯 Reposicionando para início do clip: ${clipBounds.start}s`)
          }
        }
        
        videoRef.current.play()
        console.log('▶️ Reproduzindo')
      }
      togglePlayPause()
    }
  }, [videoRef, isPlaying, togglePlayPause, playbackMode, clipBounds, setCurrentTime])

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

  // ✅ SINCRONIZAR STORE -> VIDEO HTML5
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Sincronizar play/pause
    if (isPlaying && video.paused) {
      console.log('🔄 Sincronizando play do store para vídeo')
      video.play().catch(console.error)
    } else if (!isPlaying && !video.paused) {
      console.log('🔄 Sincronizando pause do store para vídeo')
      video.pause()
    }
  }, [isPlaying])

  // ➕ NOVO EFFECT: Sincronização com mudanças de clip
  useEffect(() => {
    const video = videoRef.current
    if (!video || !clipBounds) return

    // Se o tempo atual está fora dos bounds do clip, reposicionar
    if (currentTime < clipBounds.start || currentTime >= clipBounds.end) {
      video.currentTime = clipBounds.start
      setCurrentTime(clipBounds.start)
      console.log(`🎯 Reposicionando para bounds do clip: ${clipBounds.start}s`)
    }
  }, [clipBounds, currentTime, setCurrentTime])

  return {
    // Funções
    seekTo: handleSeekTo,
    togglePlayPause: handleTogglePlayPause,
    formatTime,
    
    // ➕ NOVAS FUNÇÕES: Sistema de clips
    playClip: handlePlayClip,
    playFullVideo: handlePlayFullVideo,
    
    // Estados derivados do store
    currentTimeFormatted: formatTime(currentTime),
    durationFormatted: formatTime(duration),
    progressPercentage: duration > 0 ? (currentTime / duration) * 100 : 0,
    
    // ➕ NOVO: Progresso relativo ao clip
    clipProgressPercentage: clipBounds && clipBounds.end > clipBounds.start 
      ? Math.max(0, Math.min(100, ((currentTime - clipBounds.start) / (clipBounds.end - clipBounds.start)) * 100))
      : 0,
    
    // ✅ CORRIGIDO: Dados do vídeo considerando file E url
    hasVideo: !!(videoData?.url || videoData?.file),
    videoUrl: videoData?.url || (videoData?.file ? URL.createObjectURL(videoData.file) : undefined),
    videoName: videoData?.name || 'Video',
    
    // Estados diretos do store
    currentTime,
    duration,
    isPlaying,
    
    // ➕ NOVOS ESTADOS: Sistema de clips
    playbackMode,
    activeClip,
    clipBounds,
    loopClip,
    isClipMode: playbackMode !== 'full',
    clipDuration: clipBounds ? clipBounds.end - clipBounds.start : 0,
    clipCurrentTime: clipBounds ? Math.max(0, currentTime - clipBounds.start) : currentTime,
    clipRemainingTime: clipBounds ? Math.max(0, clipBounds.end - currentTime) : 0
  }
} 