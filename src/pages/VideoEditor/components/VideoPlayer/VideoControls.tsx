import React, { memo, useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { useVideoEditorStore } from '../../../../stores/videoEditorStore'
import { formatTime } from '../../../../utils/timeUtils'

// ===== TYPES =====

interface VideoControlsProps {
  // Basic controls
  onSeek: (percentage: number) => void
  onTogglePlayPause: () => void
  
  // Captions
  onToggleCaptions: () => void
  hasTranscription: boolean
  transcriptionWordsCount: number
  
  // Optional props
  showingOriginalCaptions?: boolean
  hasEditedCaptions?: boolean
  onToggleCaptionMode?: () => void
  onToggleSyncControls?: () => void
  syncControlsVisible?: boolean
}

// ===== COMPONENT =====

const VideoControls = memo<VideoControlsProps>(({
  onSeek,
  onTogglePlayPause,
  onToggleCaptions,
  hasTranscription,
  transcriptionWordsCount,
  showingOriginalCaptions = false,
  hasEditedCaptions = false,
  onToggleCaptionMode,
  onToggleSyncControls,
  syncControlsVisible = false
}) => {
  
  // ===== STATE =====
  
  const [captionDropdownOpen, setCaptionDropdownOpen] = useState(false)
  
  // ===== STORE =====
  
  const {
    currentTime,
    duration,
    isPlaying
  } = useVideoEditorStore()
  
  // ===== COMPUTED VALUES =====
  
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const hasVideo = duration > 0
  
  // ===== HANDLERS =====
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value)
    onSeek(percentage)
  }
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    onSeek(percentage)
  }
  
  // ===== RENDER =====
  
  if (!hasVideo) {
    return (
      <div className="video-controls-container absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="text-center text-white/60">
          No video loaded
        </div>
      </div>
    )
  }
  
  return (
    <div className="video-controls-container absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
      
      {/* Progress Bar */}
      <div className="progress-section mb-4">
        <div 
          className="progress-bar bg-white/20 h-2 rounded-full cursor-pointer relative"
          onClick={handleProgressClick}
        >
          <div 
            className="progress-fill bg-blue-500 h-full rounded-full transition-all duration-150"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Time Display */}
        <div className="time-display flex justify-between items-center mt-2 text-white text-sm">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Main Controls */}
      <div className="main-controls flex items-center justify-center gap-4">
        
        {/* Play/Pause Button */}
        <Button
          onClick={onTogglePlayPause}
          className="play-pause-btn bg-white/20 hover:bg-white/30 text-white border-none p-3 rounded-full transition-all"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>
        
        {/* Caption Controls */}
        {hasTranscription && (
          <div className="caption-controls flex items-center gap-2">
            <Button
              onClick={onToggleCaptions}
              className="caption-btn bg-white/20 hover:bg-white/30 text-white border-none px-3 py-2 rounded transition-all"
            >
              📝 Captions
            </Button>
            
            {hasEditedCaptions && onToggleCaptionMode && (
              <Button
                onClick={onToggleCaptionMode}
                className={`caption-mode-btn px-3 py-2 rounded transition-all ${
                  showingOriginalCaptions 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {showingOriginalCaptions ? 'Original' : 'Edited'}
              </Button>
            )}
            
            {onToggleSyncControls && (
              <Button
                onClick={onToggleSyncControls}
                className={`sync-btn px-3 py-2 rounded transition-all ${
                  syncControlsVisible 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                🔄 Sync
              </Button>
            )}
          </div>
        )}
        
        {/* Caption Info */}
        {hasTranscription && (
          <div className="caption-info text-white/70 text-sm">
            {transcriptionWordsCount} words
          </div>
        )}
      </div>
      
      {/* Hidden Range Input for Accessibility */}
      <input
        type="range"
        min="0"
        max="100"
        value={progressPercentage}
        onChange={handleSeek}
        className="sr-only"
        aria-label="Video progress"
      />
    </div>
  )
})

VideoControls.displayName = 'VideoControls'

export default VideoControls 