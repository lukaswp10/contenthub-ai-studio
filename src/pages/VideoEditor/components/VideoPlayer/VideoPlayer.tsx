import React, { memo, useRef, useState } from 'react'
import { useVideoPlayer } from '../../hooks/useVideoPlayer'
import VideoControls from './VideoControls'
import VideoOverlay from './VideoOverlay'
import CaptionSyncControls from './CaptionSyncControls'
import { Button } from '../../../../components/ui/button'
import { useVideoEditorStore } from '../../../../stores/videoEditorStore'

// ===== TYPES =====

interface VideoPlayerProps {
  // Basic props
  hasTranscription: boolean
  transcriptionWordsCount: number
  
  // Caption props
  videoId?: string
  showingOriginalCaptions?: boolean
  hasEditedCaptions?: boolean
  onToggleCaptionMode?: () => void
  onCaptionEdit?: (captions: any[]) => void
  
  // Canvas ref for effects
  canvasRef: React.RefObject<HTMLCanvasElement>
}

// ===== COMPONENT =====

export const VideoPlayer = memo<VideoPlayerProps>(({
  hasTranscription,
  transcriptionWordsCount,
  videoId,
  showingOriginalCaptions = false,
  hasEditedCaptions = false,
  onToggleCaptionMode,
  onCaptionEdit,
  canvasRef
}) => {
  
  // ===== REFS =====
  
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // ===== STATE =====
  
  const [syncControlsVisible, setSyncControlsVisible] = useState(false)
  const [captionsVisible, setCaptionsVisible] = useState(false)
  
  // ===== STORE =====
  
  const { 
    currentTime, 
    duration, 
    isPlaying,
    subtitles 
  } = useVideoEditorStore()
  
  // ===== HOOKS =====
  
  const {
    play,
    pause,
    togglePlayPause,
    seekTo,
    seekToPercent,
    handleSeekTo,
    handleTogglePlayPause,
    formatCurrentTime,
    formatDuration,
    getProgress
  } = useVideoPlayer({ videoRef })
  
  // ===== COMPUTED VALUES =====
  
  const hasVideo = duration > 0
  const currentSubtitle = subtitles.find(sub => 
    currentTime >= sub.startTime && currentTime <= sub.endTime
  )
  
  // ===== HANDLERS =====
  
  const handleToggleCaptions = () => {
    setCaptionsVisible(!captionsVisible)
  }
  
  const handleToggleSyncControls = () => {
    setSyncControlsVisible(!syncControlsVisible)
  }
  
  const handleSeekToPercent = (percentage: number) => {
    seekToPercent(percentage)
  }
  
  // ===== RENDER =====
  
  if (!hasVideo) {
    return (
      <div className="video-player-container relative bg-black rounded-lg overflow-hidden aspect-video">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60 text-center">
            <div className="text-2xl mb-2">📹</div>
            <div>No video loaded</div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="video-player-container relative bg-black rounded-lg overflow-hidden aspect-video">
      
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        crossOrigin="anonymous"
        playsInline
        preload="metadata"
      />
      
      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />
      
      {/* Current Subtitle Display */}
      {captionsVisible && currentSubtitle && (
        <div className="absolute bottom-20 left-4 right-4 z-20">
          <div className="bg-black/80 text-white p-3 rounded-lg text-center">
            <div className="text-lg font-medium">{currentSubtitle.text}</div>
            <div className="text-xs text-gray-300 mt-1">
              {formatCurrentTime()} - {formatDuration()}
            </div>
          </div>
        </div>
      )}
      
      {/* Video Controls */}
      <VideoControls
        onSeek={handleSeekToPercent}
        onTogglePlayPause={handleTogglePlayPause}
        onToggleCaptions={handleToggleCaptions}
        hasTranscription={hasTranscription}
        transcriptionWordsCount={transcriptionWordsCount}
        showingOriginalCaptions={showingOriginalCaptions}
        hasEditedCaptions={hasEditedCaptions}
        onToggleCaptionMode={onToggleCaptionMode}
        onToggleSyncControls={handleToggleSyncControls}
        syncControlsVisible={syncControlsVisible}
      />
      
      {/* Caption Sync Controls */}
      <CaptionSyncControls
        visible={syncControlsVisible}
        onClose={() => setSyncControlsVisible(false)}
      />
      
      {/* Video Overlay for Effects */}
      <VideoOverlay 
        currentCaption={currentSubtitle ? {
          text: currentSubtitle.text,
          start: currentSubtitle.startTime,
          end: currentSubtitle.endTime,
          confidence: 1.0
        } : null}
        captionsVisible={captionsVisible}
        captionPosition="bottom"
        captionFontSize={24}
        captionTextColor="#ffffff"
        captionShadowIntensity={2}
        captionShadowColor="#000000"
        captionOpacity={100}
        captionBackgroundColor="rgba(0,0,0,0.7)"
        captionFontFamily="Arial, sans-serif"
        captionAnimation="fadeIn"
      />
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/60 text-white p-2 rounded text-xs font-mono z-30">
          <div>Time: {formatCurrentTime()} / {formatDuration()}</div>
          <div>Progress: {getProgress().toFixed(1)}%</div>
          <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
          <div>Subtitles: {subtitles.length}</div>
          <div>Current: {currentSubtitle?.text || 'None'}</div>
        </div>
      )}
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer 