import React, { memo, useRef } from 'react'
import { useVideoPlayer } from '../../hooks/useVideoPlayer'
import { VideoControls } from './VideoControls'
import { VideoOverlay } from './VideoOverlay'
import { Button } from '../../../../components/ui/button'

interface VideoData {
  file?: File | null
  url?: string
  name: string
  size: number
  duration?: number
  id?: string
  videoData?: any
}

interface Caption {
  id: string
  text: string
  start: number
  end: number
  confidence: number
}

interface VideoPlayerProps {
  // Video data
  videoData: VideoData | null
  currentTime: number
  duration: number
  isPlaying: boolean
  
  // Handlers
  onTimeUpdate: (time: number) => void
  onTogglePlayPause: () => void
  onVideoLoad: () => void
  
  // Captions
  currentCaption: Caption | null
  captionsVisible: boolean
  onToggleCaptions: () => void
  hasTranscription: boolean
  transcriptionWordsCount: number
  onTestCaptions: () => void
  
  // Caption styling
  captionPosition: 'top' | 'center' | 'bottom'
  captionFontSize: number
  captionTextColor: string
  captionShadowIntensity: number
  captionShadowColor: string
  captionOpacity: number
  captionBackgroundColor: string
  captionFontFamily: string
  captionAnimation: string
  
  // Canvas ref for effects
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export const VideoPlayer = memo(({
  videoData,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onTogglePlayPause,
  onVideoLoad,
  currentCaption,
  captionsVisible,
  onToggleCaptions,
  hasTranscription,
  transcriptionWordsCount,
  onTestCaptions,
  captionPosition,
  captionFontSize,
  captionTextColor,
  captionShadowIntensity,
  captionShadowColor,
  captionOpacity,
  captionBackgroundColor,
  captionFontFamily,
  captionAnimation,
  canvasRef
}: VideoPlayerProps) => {
  
  const videoRef = useRef<HTMLVideoElement>(null)
  
  console.log('🎬 VideoPlayer: Renderizando player', {
    hasVideo: !!videoData?.url,
    currentTime,
    isPlaying,
    hasCaption: !!currentCaption
  })

  // ✅ Hook customizado para lógica do player
  const {
    seekTo,
    togglePlayPause,
    formatTime,
    currentTimeFormatted,
    durationFormatted,
    progressPercentage,
    hasVideo,
    videoUrl
  } = useVideoPlayer({
    videoRef,
    videoData,
    currentTime,
    duration,
    isPlaying,
    onTimeUpdate,
    onTogglePlayPause,
    onVideoLoad
  })

  return (
    <div className="video-container-visionario relative w-full max-w-6xl h-full max-h-[65vh] bg-black/40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
      
      {/* ✅ VIDEO ELEMENT */}
      <video
        ref={videoRef}
        src={videoUrl}
        onLoadedData={onVideoLoad}
        className="video-player-visionario w-full h-full object-contain rounded-2xl"
        style={{ 
          filter: 'none',
          transition: 'filter 0.3s ease'
        }}
      />
      
      {/* ✅ CANVAS PARA EFEITOS */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 rounded-2xl"
        style={{ mixBlendMode: 'overlay' }}
      />
      
      {/* ✅ OVERLAY DE LEGENDAS */}
      <VideoOverlay
        currentCaption={currentCaption}
        captionsVisible={captionsVisible}
        captionPosition={captionPosition}
        captionFontSize={captionFontSize}
        captionTextColor={captionTextColor}
        captionShadowIntensity={captionShadowIntensity}
        captionShadowColor={captionShadowColor}
        captionOpacity={captionOpacity}
        captionBackgroundColor={captionBackgroundColor}
        captionFontFamily={captionFontFamily}
        captionAnimation={captionAnimation}
      />
      
      {/* ✅ PLAY/PAUSE OVERLAY */}
      <div className="play-overlay-visionario absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 bg-black/10 rounded-2xl backdrop-blur-sm">
        <Button
          onClick={togglePlayPause}
          className="play-btn-visionario bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110 shadow-2xl"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>
      </div>
      
      {/* ✅ CONTROLES DO VÍDEO */}
      <VideoControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        progressPercentage={progressPercentage}
        currentTimeFormatted={currentTimeFormatted}
        durationFormatted={durationFormatted}
        onTogglePlayPause={togglePlayPause}
        onSeek={seekTo}
        captionsVisible={captionsVisible}
        onToggleCaptions={onToggleCaptions}
        hasTranscription={hasTranscription}
        transcriptionWordsCount={transcriptionWordsCount}
        onTestCaptions={onTestCaptions}
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer' 