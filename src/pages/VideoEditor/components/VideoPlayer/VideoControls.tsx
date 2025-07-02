import React, { memo } from 'react'
import { Button } from '../../../../components/ui/button'

interface VideoControlsProps {
  // Estado do vídeo
  isPlaying: boolean
  currentTime: number
  duration: number
  progressPercentage: number
  
  // Formatação
  currentTimeFormatted: string
  durationFormatted: string
  
  // Controles
  onTogglePlayPause: () => void
  onSeek: (percentage: number) => void
  
  // Legendas
  captionsVisible: boolean
  onToggleCaptions: () => void
  hasTranscription: boolean
  transcriptionWordsCount: number
  
  // Teste
  onTestCaptions: () => void
}

export const VideoControls = memo(({
  isPlaying,
  currentTime,
  duration,
  progressPercentage,
  currentTimeFormatted,
  durationFormatted,
  onTogglePlayPause,
  onSeek,
  captionsVisible,
  onToggleCaptions,
  hasTranscription,
  transcriptionWordsCount,
  onTestCaptions
}: VideoControlsProps) => {
  
  console.log('🎮 VideoControls: Renderizando controles', {
    isPlaying,
    currentTime,
    captionsVisible,
    hasTranscription
  })

  return (
    <div className="video-controls-visionario absolute bottom-6 left-6 right-6 transition-all duration-300">
      <div className="bg-black/70 backdrop-blur-xl rounded-2xl px-8 py-4 flex items-center justify-between border border-white/20 shadow-2xl">
        
        {/* ✅ CONTROLES ESQUERDOS */}
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <Button
            onClick={onTogglePlayPause}
            className="control-btn text-white hover:text-blue-300 transition-colors text-xl bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </Button>
          
          {/* ✅ BOTÃO CC SEMPRE VISÍVEL E DESTACADO */}
          <Button
            onClick={onToggleCaptions}
            className={`cc-btn transition-all duration-300 text-sm px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              hasTranscription
                ? captionsVisible 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                : 'bg-gray-600/50 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!hasTranscription}
            title={
              !hasTranscription 
                ? 'Faça transcrição primeiro' 
                : captionsVisible 
                  ? 'Ocultar legendas' 
                  : 'Mostrar legendas'
            }
          >
            <span className="text-lg">📝</span>
            <span>CC</span>
            {hasTranscription && (
              <div className={`w-2 h-2 rounded-full ${captionsVisible ? 'bg-green-400' : 'bg-gray-400'}`} />
            )}
          </Button>

          {/* ✅ INDICADOR DE STATUS DAS LEGENDAS */}
          {hasTranscription && (
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>{transcriptionWordsCount} palavras</span>
            </div>
          )}
          
          {/* ✅ BOTÃO DE TESTE URGENTE */}
          <Button
            onClick={onTestCaptions}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded"
            title="TESTE URGENTE: Forçar legendas"
          >
            🚨 TESTE
          </Button>
        </div>
        
        {/* ✅ TIMELINE CENTRAL */}
        <div className="flex-1 mx-6">
          <div className="text-sm text-gray-300 mb-2 text-center font-medium">
            {currentTimeFormatted} / {durationFormatted}
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const percentage = parseFloat(e.target.value)
              onSeek((percentage / (duration || 100)) * 100)
            }}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-visionario"
          />
        </div>
        
        {/* ✅ PERCENTUAL DIREITO */}
        <div className="text-sm text-gray-300 font-medium">
          {Math.round(progressPercentage) || 0}%
        </div>
      </div>
    </div>
  )
})

VideoControls.displayName = 'VideoControls' 