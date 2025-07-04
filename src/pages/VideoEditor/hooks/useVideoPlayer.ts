/**
 * 🎬 USE VIDEO PLAYER HOOK - ClipsForge Pro
 * 
 * Hook para controle do player de vídeo
 * Versão simplificada e otimizada
 * 
 * @version 2.0.0 - REFACTORED
 * @author ClipsForge Team
 */

import { useCallback, useEffect, RefObject } from 'react'
import { formatTime } from '../../../utils/timeUtils'
import { useVideoEditorStore } from '../../../stores/videoEditorStore'

// ===== TYPES =====

interface VideoData {
  file?: File | null
  url?: string
  name: string
  size: number
  duration?: number
  id?: string
  videoData?: Record<string, unknown>
}

interface UseVideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement>
}

interface UseVideoPlayerReturn {
  // State
  currentTime: number
  duration: number
  isPlaying: boolean
  
  // Actions
  play: () => void
  pause: () => void
  togglePlayPause: () => void
  seekTo: (time: number) => void
  seekToPercent: (percent: number) => void
  
  // Handlers
  handleSeekTo: (percentage: number) => void
  handleTogglePlayPause: () => void
  
  // Utils
  formatCurrentTime: () => string
  formatDuration: () => string
  getProgress: () => number
}

// ===== HOOK =====

export const useVideoPlayer = ({ videoRef }: UseVideoPlayerProps): UseVideoPlayerReturn => {
  
  // ===== STORE =====
  
  const { 
    currentTime, 
    duration, 
    isPlaying, 
    setCurrentTime, 
    setDuration, 
    setIsPlaying 
  } = useVideoEditorStore()
  
  // ===== PLAYBACK CONTROLS =====
  
  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }, [videoRef, setIsPlaying])
  
  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [videoRef, setIsPlaying])
  
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])
  
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      const clampedTime = Math.max(0, Math.min(duration, time))
      videoRef.current.currentTime = clampedTime
      setCurrentTime(clampedTime)
    }
  }, [videoRef, duration, setCurrentTime])
  
  const seekToPercent = useCallback((percent: number) => {
    if (duration > 0) {
      const time = (percent / 100) * duration
      seekTo(time)
    }
  }, [duration, seekTo])
  
  // ===== HANDLERS =====
  
  const handleSeekTo = useCallback((percentage: number) => {
    seekToPercent(percentage)
  }, [seekToPercent])
  
  const handleTogglePlayPause = useCallback(() => {
    togglePlayPause()
  }, [togglePlayPause])
  
  // ===== VIDEO EVENT HANDLERS =====
  
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      setCurrentTime(newTime)
    }
  }, [videoRef, setCurrentTime])
  
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      if (!isNaN(videoDuration) && videoDuration > 0) {
        setDuration(videoDuration)
        console.log('🎬 Video loaded, duration:', videoDuration)
      }
    }
  }, [videoRef, setDuration])
  
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [setIsPlaying])
  
  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [setIsPlaying])
  
  const handleSeeked = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [videoRef, setCurrentTime])
  
  const handleCanPlay = useCallback(() => {
    if (videoRef.current && !duration) {
      handleLoadedMetadata()
    }
  }, [videoRef, duration, handleLoadedMetadata])
  
  // ===== UTILITY FUNCTIONS =====
  
  const formatCurrentTime = useCallback(() => {
    return formatTime(currentTime)
  }, [currentTime])
  
  const formatDuration = useCallback(() => {
    return formatTime(duration)
  }, [duration])
  
  const getProgress = useCallback(() => {
    if (duration === 0) return 0
    return (currentTime / duration) * 100
  }, [currentTime, duration])
  
  // ===== EFFECTS =====
  
  // Setup video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    // Add event listeners
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('loadeddata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeked', handleSeeked)
    
    // Initial setup
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      setDuration(video.duration)
    }
    
    if (video.currentTime !== currentTime) {
      setCurrentTime(video.currentTime)
    }
    
    // Sync playing state
    if (video.paused !== !isPlaying) {
      if (isPlaying && video.paused) {
        video.play().catch(console.error)
      } else if (!isPlaying && !video.paused) {
        video.pause()
      }
    }
    
    return () => {
      // Remove event listeners
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('loadeddata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [
    videoRef,
    currentTime,
    isPlaying,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleCanPlay,
    handlePlay,
    handlePause,
    handleSeeked,
    setCurrentTime,
    setDuration
  ])
  
  // ===== RETURN =====
  
  return {
    // State
    currentTime,
    duration,
    isPlaying,
    
    // Actions
    play,
    pause,
    togglePlayPause,
    seekTo,
    seekToPercent,
    
    // Handlers
    handleSeekTo,
    handleTogglePlayPause,
    
    // Utils
    formatCurrentTime,
    formatDuration,
    getProgress
  }
}

export default useVideoPlayer 