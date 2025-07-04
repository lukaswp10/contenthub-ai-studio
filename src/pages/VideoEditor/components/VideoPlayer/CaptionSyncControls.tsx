import React, { memo, useCallback, useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { useVideoEditorStore } from '../../../../stores/videoEditorStore'
import { formatTime } from '../../../../utils/timeUtils'

// ===== TYPES =====

interface CaptionSyncControlsProps {
  visible: boolean
  onClose: () => void
}

// ===== COMPONENT =====

const CaptionSyncControls = memo<CaptionSyncControlsProps>(({
  visible,
  onClose
}) => {
  
  // ===== STATE =====
  
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null)
  
  // ===== STORE =====
  
  const {
    currentTime,
    duration,
    subtitles
  } = useVideoEditorStore()
  
  // ===== HANDLERS =====
  
  const handleWordClick = useCallback((wordIndex: number) => {
    setSelectedWordIndex(wordIndex)
  }, [])
  
  const handleSyncWord = useCallback(() => {
    if (selectedWordIndex !== null) {
      console.log(`Syncing word ${selectedWordIndex} to time ${currentTime}`)
      // Basic sync functionality would go here
    }
  }, [selectedWordIndex, currentTime])
  
  const handleAutoSync = useCallback(() => {
    console.log('Auto-syncing captions...')
    // Auto sync functionality would go here
  }, [])
  
  // ===== RENDER =====
  
  if (!visible) return null
  
  return (
    <div className="caption-sync-controls absolute top-0 left-0 right-0 bottom-0 bg-black/80 z-50">
      <div className="h-full flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/60 border-b border-white/20">
          <h3 className="text-white font-medium">Caption Sync Controls</h3>
          <Button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white border-none px-3 py-2 rounded"
          >
            ✕ Close
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex">
          
          {/* Caption List */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <h4 className="text-white text-sm font-medium mb-3">Captions</h4>
            
            {subtitles.length > 0 ? (
              <div className="space-y-2">
                {subtitles.map((subtitle, index) => (
                  <div
                    key={subtitle.id}
                    className={`p-3 rounded cursor-pointer transition-all ${
                      selectedWordIndex === index
                        ? 'bg-blue-500/30 border border-blue-400'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    onClick={() => handleWordClick(index)}
                  >
                    <div className="text-white text-sm">{subtitle.text}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No captions available</div>
            )}
          </div>
          
          {/* Sync Controls */}
          <div className="w-1/2 p-4 border-l border-white/20">
            <h4 className="text-white text-sm font-medium mb-3">Sync Tools</h4>
            
            <div className="space-y-4">
              
              {/* Current Time */}
              <div className="bg-white/10 p-3 rounded">
                <div className="text-gray-300 text-xs mb-1">Current Time</div>
                <div className="text-white font-mono">{formatTime(currentTime)}</div>
              </div>
              
              {/* Selected Caption */}
              {selectedWordIndex !== null && subtitles[selectedWordIndex] && (
                <div className="bg-blue-500/20 p-3 rounded border border-blue-400/50">
                  <div className="text-blue-300 text-xs mb-1">Selected Caption</div>
                  <div className="text-white text-sm mb-2">
                    {subtitles[selectedWordIndex].text}
                  </div>
                  <div className="text-gray-300 text-xs">
                    {formatTime(subtitles[selectedWordIndex].startTime)} - {formatTime(subtitles[selectedWordIndex].endTime)}
                  </div>
                </div>
              )}
              
              {/* Sync Actions */}
              <div className="space-y-2">
                <Button
                  onClick={handleSyncWord}
                  disabled={selectedWordIndex === null}
                  className="w-full bg-green-600 hover:bg-green-700 text-white border-none py-2 disabled:opacity-50"
                >
                  🎯 Sync Selected Caption
                </Button>
                
                <Button
                  onClick={handleAutoSync}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white border-none py-2"
                >
                  🤖 Auto Sync All
                </Button>
              </div>
              
              {/* Instructions */}
              <div className="bg-yellow-500/20 p-3 rounded border border-yellow-400/50">
                <div className="text-yellow-300 text-xs font-medium mb-1">Instructions</div>
                <div className="text-yellow-200 text-xs">
                  1. Click on a caption to select it<br/>
                  2. Seek to the correct time in the video<br/>
                  3. Click "Sync Selected Caption" to align it
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

CaptionSyncControls.displayName = 'CaptionSyncControls'

export default CaptionSyncControls 