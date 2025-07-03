import React, { memo } from 'react'
import { Button } from '../../../../components/ui/button'
import { useVideoEditorStore, useTimeline } from '../../../../stores/videoEditorStore'
import { formatTime } from '../../../../utils/timeUtils'

interface VideoControlsProps {
  // Controles
  onSeek: (percentage: number) => void
  
  // Legendas
  onToggleCaptions: () => void
  hasTranscription: boolean
  transcriptionWordsCount: number
  
  // Teste
  onTestCaptions: () => void
}

export const VideoControls = memo(({
  onSeek,
  onToggleCaptions,
  hasTranscription,
  transcriptionWordsCount,
  onTestCaptions
}: VideoControlsProps) => {
  
  // Store states
  const currentTime = useVideoEditorStore(state => state.currentTime)
  const duration = useVideoEditorStore(state => state.duration)
  const isPlaying = useVideoEditorStore(state => state.isPlaying)
  const playbackMode = useVideoEditorStore(state => state.playbackMode)
  const activeClip = useVideoEditorStore(state => state.activeClip)
  const clipBounds = useVideoEditorStore(state => state.clipBounds)
  const loopClip = useVideoEditorStore(state => state.loopClip)
  
  const { cutPoints } = useTimeline()
  
  // Actions
  const togglePlayPause = useVideoEditorStore(state => state.togglePlayPause)
  const playFullVideo = useVideoEditorStore(state => state.playFullVideo)
  const setLoopClip = useVideoEditorStore(state => state.setLoopClip)
  const playClip = useVideoEditorStore(state => state.playClip)
  
  // ➕ DERIVAR PROPRIEDADES
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const isClipMode = playbackMode !== 'full'
  const clipDuration = clipBounds ? clipBounds.end - clipBounds.start : 0
  const clipCurrentTime = clipBounds ? Math.max(0, currentTime - clipBounds.start) : currentTime
  const clipRemainingTime = clipBounds ? Math.max(0, clipBounds.end - currentTime) : 0
  const clipProgressPercentage = clipBounds && clipBounds.end > clipBounds.start 
    ? Math.max(0, Math.min(100, ((currentTime - clipBounds.start) / (clipBounds.end - clipBounds.start)) * 100))
    : 0

  // ➕ CALCULAR CLIPS DISPONÍVEIS
  const availableClips = React.useMemo(() => {
    if (cutPoints.length === 0) return []
    
    const sortedCuts = [...cutPoints].sort((a, b) => a.time - b.time)
    const clips = []
    
    // Primeiro clip (início até primeiro corte)
    if (sortedCuts[0].time > 0) {
      clips.push({
        id: 'clip-0',
        name: 'Clip 1',
        startTime: 0,
        endTime: sortedCuts[0].time,
        duration: sortedCuts[0].time
      })
    }
    
    // Clips intermediários
    for (let i = 0; i < sortedCuts.length - 1; i++) {
      clips.push({
        id: `clip-${i + 1}`,
        name: `Clip ${i + 2}`,
        startTime: sortedCuts[i].time,
        endTime: sortedCuts[i + 1].time,
        duration: sortedCuts[i + 1].time - sortedCuts[i].time
      })
    }
    
    // Último clip (último corte até final)
    if (sortedCuts[sortedCuts.length - 1].time < duration) {
      clips.push({
        id: `clip-${sortedCuts.length}`,
        name: `Clip ${sortedCuts.length + 1}`,
        startTime: sortedCuts[sortedCuts.length - 1].time,
        endTime: duration,
        duration: duration - sortedCuts[sortedCuts.length - 1].time
      })
    }
    
    return clips.filter(clip => clip.duration > 0.1)
  }, [cutPoints, duration])

  // ➕ HANDLER: Reproduzir clip específico
  const handlePlayClip = (clipIndex: number) => {
    if (clipIndex >= 0 && clipIndex < availableClips.length) {
      const clip = availableClips[clipIndex]
      playClip(clip.startTime, clip.endTime, loopClip)
    }
  }

  // ➕ HANDLER: Próximo clip
  const handleNextClip = () => {
    if (!activeClip || availableClips.length === 0) return
    
    const currentIndex = availableClips.findIndex(clip => 
      clip.startTime === activeClip.startTime && clip.endTime === activeClip.endTime
    )
    
    if (currentIndex >= 0 && currentIndex < availableClips.length - 1) {
      handlePlayClip(currentIndex + 1)
    }
  }

  // ➕ HANDLER: Clip anterior
  const handlePrevClip = () => {
    if (!activeClip || availableClips.length === 0) return
    
    const currentIndex = availableClips.findIndex(clip => 
      clip.startTime === activeClip.startTime && clip.endTime === activeClip.endTime
    )
    
    if (currentIndex > 0) {
      handlePlayClip(currentIndex - 1)
    }
  }

  return (
    <div className="video-controls-container absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
      
      {/* ➕ NOVA SEÇÃO: Controle de Modo de Reprodução */}
      <div className="playback-mode-controls mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={playFullVideo}
            className={`px-3 py-1 text-sm transition-all ${
              playbackMode === 'full' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🎬 Vídeo Completo
          </Button>
          
          {availableClips.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                onClick={handlePrevClip}
                disabled={!activeClip}
                className="px-2 py-1 text-sm bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
              >
                ⏮️
              </Button>
              
              <div className="flex gap-1">
                {availableClips.map((clip, index) => (
                  <Button
                    key={clip.id}
                    onClick={() => handlePlayClip(index)}
                    className={`px-2 py-1 text-xs transition-all ${
                      activeClip && 
                      clip.startTime === activeClip.startTime && 
                      clip.endTime === activeClip.endTime
                        ? 'bg-orange-500 text-white' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={`${clip.name} (${formatTime(clip.duration)})`}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              
              <Button
                onClick={handleNextClip}
                disabled={!activeClip}
                className="px-2 py-1 text-sm bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
              >
                ⏭️
              </Button>
            </div>
          )}
        </div>
        
        {/* ➕ CONTROLE DE LOOP */}
        {isClipMode && (
          <Button
            onClick={() => setLoopClip(!loopClip)}
            className={`px-3 py-1 text-sm transition-all ${
              loopClip 
                ? 'bg-green-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🔄 {loopClip ? 'Loop ON' : 'Loop OFF'}
          </Button>
        )}
      </div>

      {/* ➕ NOVA SEÇÃO: Informações do Clip Ativo */}
      {isClipMode && activeClip && (
        <div className="clip-info mb-3 p-2 bg-black/40 rounded-lg">
          <div className="flex items-center justify-between text-sm text-white">
            <span className="font-medium">📹 {activeClip.name}</span>
            <span className="text-gray-300">
              {formatTime(clipCurrentTime)} / {formatTime(clipDuration)}
              {clipRemainingTime > 0 && (
                <span className="text-orange-300"> (-{formatTime(clipRemainingTime)})</span>
              )}
            </span>
          </div>
          
          {/* Progress bar do clip */}
          <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-1 rounded-full transition-all duration-200"
              style={{ width: `${clipProgressPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      {/* ✅ CONTROLES PRINCIPAIS */}
      <div className="main-controls flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <Button
            onClick={togglePlayPause}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-full w-12 h-12 flex items-center justify-center text-xl border border-white/20"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </Button>
          
          {/* Tempo */}
          <div className="text-white text-sm font-mono">
            {isClipMode ? (
              <>
                <span className="text-orange-300">{formatTime(clipCurrentTime)}</span>
                <span className="text-gray-400"> / </span>
                <span className="text-white">{formatTime(clipDuration)}</span>
              </>
            ) : (
              <>
                <span>{formatTime(currentTime)}</span>
                <span className="text-gray-400"> / </span>
                <span>{formatTime(duration)}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Controle de Legendas */}
          <Button
            onClick={onToggleCaptions}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 text-sm rounded"
          >
            📝 Legendas
          </Button>
          
          {hasTranscription && (
            <Button
              onClick={onTestCaptions}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 text-sm rounded"
            >
              🎯 Testar ({transcriptionWordsCount} palavras)
            </Button>
          )}
        </div>
      </div>
      
      {/* ✅ BARRA DE PROGRESSO */}
      <div className="progress-bar mt-4">
        <div 
          className="w-full bg-gray-700 rounded-full h-2 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const percentage = ((e.clientX - rect.left) / rect.width) * 100
            onSeek(percentage)
          }}
        >
          <div 
            className={`h-2 rounded-full transition-all duration-200 ${
              isClipMode 
                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${isClipMode ? clipProgressPercentage : progressPercentage}%` }}
          />
        </div>
        
        {/* ➕ INDICADORES DE CORTE na barra de progresso */}
        {!isClipMode && cutPoints.length > 0 && (
          <div className="cut-indicators absolute inset-x-0 top-0 h-2 pointer-events-none">
            {cutPoints.map((cut, index) => (
              <div
                key={cut.id}
                className="absolute top-0 w-0.5 h-full bg-yellow-400 shadow-lg"
                style={{ left: `${(cut.time / duration) * 100}%` }}
                title={`Corte ${index + 1}: ${formatTime(cut.time)}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

VideoControls.displayName = 'VideoControls' 