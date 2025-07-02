import React, { memo, useRef } from 'react'
import { useVideoPlayer } from '../../hooks/useVideoPlayer'
import { VideoControls } from './VideoControls'
import { VideoOverlay } from './VideoOverlay'
import { Button } from '../../../../components/ui/button'
import { useCaptions, useCaptionStyling } from '../../../../stores/videoEditorStore'
import { Caption } from '../../../../types/caption.types'

interface VideoPlayerProps {
  // Captions específicas
  currentCaption: Caption | null
  hasTranscription: boolean
  transcriptionWordsCount: number
  onTestCaptions: () => void
  
  // Canvas ref para efeitos
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export const VideoPlayer = memo(({
  currentCaption,
  hasTranscription,
  transcriptionWordsCount,
  onTestCaptions,
  canvasRef
}: VideoPlayerProps) => {
  
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // 🏪 Zustand hooks para state management
  const { captionsVisible, toggleCaptionsVisibility } = useCaptions()
  const captionStyling = useCaptionStyling()
  
  // ✅ Hook customizado integrado com Zustand
  const {
    seekTo,
    togglePlayPause,
    formatTime,
    currentTimeFormatted,
    durationFormatted,
    progressPercentage,
    hasVideo,
    videoUrl,
    currentTime,
    duration,
    isPlaying
  } = useVideoPlayer({ videoRef })

  console.log('🎬 VideoPlayer: Renderizando player', {
    hasVideo,
    currentTime,
    isPlaying,
    hasCaption: !!currentCaption,
    videoUrl
  })

  // ✅ FALLBACK: Quando não há vídeo carregado
  if (!hasVideo || !videoUrl) {
    return (
      <div className="video-container-visionario relative w-full max-w-6xl h-full max-h-[65vh] bg-black/40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <div className="text-6xl">🎬</div>
          <h3 className="text-2xl font-bold">Nenhum vídeo carregado</h3>
          <p className="text-gray-400">Clique no botão "Galeria" para selecionar um vídeo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="video-container-visionario relative w-full max-w-6xl h-full max-h-[65vh] bg-black/40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
      
      {/* ✅ VIDEO ELEMENT */}
      <video
        ref={videoRef}
        src={videoUrl}
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
        {...captionStyling}
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
        onSeek={seekTo}
        onToggleCaptions={toggleCaptionsVisibility}
        hasTranscription={hasTranscription}
        transcriptionWordsCount={transcriptionWordsCount}
        onTestCaptions={onTestCaptions}
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer' 