import React, { memo, useState } from 'react'
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
  
  // ➕ FASE 2: Sincronização
  onToggleSyncControls?: () => void
  syncControlsVisible?: boolean
  
  // ➕ FASE 1: Controle direto de clips
  onPlayClip?: (startTime: number, endTime: number, loop?: boolean) => void
  onPlayFullVideo?: () => void
  clipData?: {
    isClipMode: boolean
    clipDuration: number
    clipCurrentTime: number
    clipRemainingTime: number
    clipProgressPercentage: number
  }
}

export const VideoControls = memo(({
  onSeek,
  onToggleCaptions,
  hasTranscription,
  transcriptionWordsCount,
  onTestCaptions,
  onToggleSyncControls,
  syncControlsVisible,
  onPlayClip,
  onPlayFullVideo,
  clipData
}: VideoControlsProps) => {
  
  // Store states
  const currentTime = useVideoEditorStore(state => state.currentTime)
  const duration = useVideoEditorStore(state => state.duration)
  const isPlaying = useVideoEditorStore(state => state.isPlaying)
  const playbackMode = useVideoEditorStore(state => state.playbackMode)
  const activeClip = useVideoEditorStore(state => state.activeClip)
  const clipBounds = useVideoEditorStore(state => state.clipBounds)
  const loopClip = useVideoEditorStore(state => state.loopClip)
  
  // ➕ NOVOS ESTADOS: Estilo de legenda e dropdown
  const captionStyle = useVideoEditorStore(state => state.captionStyle || 'phrase')
  const setCaptionStyle = useVideoEditorStore(state => state.setCaptionStyle)
  const captionsVisible = useVideoEditorStore(state => state.captionsVisible)
  
  // ➕ ESTADO LOCAL: Dropdown de legendas
  const [captionDropdownOpen, setCaptionDropdownOpen] = useState(false)
  
  const { cutPoints } = useTimeline()
  
  // Actions
  const togglePlayPause = useVideoEditorStore(state => state.togglePlayPause)
  const setLoopClip = useVideoEditorStore(state => state.setLoopClip)
  
  // ➕ USAR DADOS DO HOOK AO INVÉS DE CALCULAR AQUI
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  
  // ➕ DERIVAR PROPRIEDADES: Usar clipData se disponível, senão fallback para cálculo local
  const isClipMode = clipData ? clipData.isClipMode : playbackMode !== 'full'
  const clipDuration = clipData ? clipData.clipDuration : (clipBounds ? clipBounds.end - clipBounds.start : 0)
  const clipCurrentTime = clipData ? clipData.clipCurrentTime : (clipBounds ? Math.max(0, currentTime - clipBounds.start) : currentTime)
  const clipRemainingTime = clipData ? clipData.clipRemainingTime : (clipBounds ? Math.max(0, clipBounds.end - currentTime) : 0)
  const clipProgressPercentage = clipData ? clipData.clipProgressPercentage : 
    (clipBounds && clipBounds.end > clipBounds.start 
      ? Math.max(0, Math.min(100, ((currentTime - clipBounds.start) / (clipBounds.end - clipBounds.start)) * 100))
      : 0)

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
    if (clipIndex >= 0 && clipIndex < availableClips.length && onPlayClip) {
      const clip = availableClips[clipIndex]
      onPlayClip(clip.startTime, clip.endTime, loopClip)
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
            onClick={onPlayFullVideo}
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
          {/* ✅ DROPDOWN DE LEGENDAS MELHORADO */}
          <div className="relative">
            <Button
              onClick={() => setCaptionDropdownOpen(!captionDropdownOpen)}
              className={`px-3 py-1 text-sm rounded transition-all flex items-center gap-1 ${
                captionsVisible 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              📝 Legendas {captionDropdownOpen ? '▼' : '▶'}
            </Button>
            
            {/* Dropdown Menu */}
            {captionDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl min-w-[250px] z-50">
                <div className="p-3">
                  <div className="text-white text-sm font-medium mb-3">⚙️ Configurações de Legenda</div>
                  
                  {/* Toggle ON/OFF */}
                  <div className="mb-3">
                    <Button
                      onClick={() => {
                        onToggleCaptions()
                        setCaptionDropdownOpen(false)
                      }}
                      className={`w-full justify-start px-3 py-2 text-sm transition-all ${
                        captionsVisible 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600/80 text-white'
                      }`}
                    >
                      {captionsVisible ? '✅ Legendas Ativadas' : '❌ Legendas Desativadas'}
                    </Button>
                  </div>
                  
                  {/* Separador */}
                  <div className="border-t border-white/10 my-3"></div>
                  <div className="text-gray-300 text-xs mb-2">🎨 Estilos de Legenda:</div>
                  
                  {/* Opções de Estilo */}
                  <div className="space-y-1">
                    <Button
                      onClick={() => {
                        setCaptionStyle('phrase')
                        setCaptionDropdownOpen(false)
                      }}
                      className={`w-full justify-start px-3 py-2 text-sm transition-all ${
                        captionStyle === 'phrase' 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      📄 Frase Completa (6 palavras)
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setCaptionStyle('tiktok')
                        setCaptionDropdownOpen(false)
                      }}
                      className={`w-full justify-start px-3 py-2 text-sm transition-all ${
                        captionStyle === 'tiktok' 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      🎵 TikTok (1 palavra)
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setCaptionStyle('youtube')
                        setCaptionDropdownOpen(false)
                      }}
                      className={`w-full justify-start px-3 py-2 text-sm transition-all ${
                        captionStyle === 'youtube' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      🎬 YouTube (3-4 palavras)
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setCaptionStyle('instagram')
                        setCaptionDropdownOpen(false)
                      }}
                      className={`w-full justify-start px-3 py-2 text-sm transition-all ${
                        captionStyle === 'instagram' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      📸 Instagram (2-3 palavras)
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setCaptionStyle('podcast')
                        setCaptionDropdownOpen(false)
                      }}
                      className={`w-full justify-start px-3 py-2 text-sm transition-all ${
                        captionStyle === 'podcast' 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      🎙️ Podcast (8-10 palavras)
                    </Button>
                  </div>
                  
                  {/* Separador */}
                  <div className="border-t border-white/10 my-3"></div>
                  
                  {/* Status */}
                  <div className="text-xs text-gray-400">
                    📊 {transcriptionWordsCount} palavras transcritas
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* ✅ BOTÃO DE TESTE SIMPLIFICADO */}
          {hasTranscription && (
            <Button
              onClick={onTestCaptions}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 text-sm rounded"
              title="Testar legendas com dados de exemplo"
            >
              🧪 Testar
            </Button>
          )}
        </div>
      </div>
      
      {/* ✅ BARRA DE PROGRESSO UNIFICADA */}
      <div className="progress-bar mt-4 relative">
        {/* Barra Principal */}
        <div 
          className="w-full bg-gray-700 rounded-full h-2 cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const clickPercentage = ((e.clientX - rect.left) / rect.width) * 100
            
            // ➕ SEEK INTELIGENTE: No modo clip, fazer seek dentro do clip
            if (isClipMode && clipBounds) {
              // Calcular a posição dentro do clip
              const clipStartPercentage = (clipBounds.start / duration) * 100
              const clipEndPercentage = (clipBounds.end / duration) * 100
              
              // Se o clique foi dentro da área do clip
              if (clickPercentage >= clipStartPercentage && clickPercentage <= clipEndPercentage) {
                // Fazer seek proporcional dentro do clip
                const clipClickPercentage = ((clickPercentage - clipStartPercentage) / (clipEndPercentage - clipStartPercentage)) * 100
                const targetTime = clipBounds.start + ((clipClickPercentage / 100) * (clipBounds.end - clipBounds.start))
                const targetPercentage = (targetTime / duration) * 100
                onSeek(targetPercentage)
              } else {
                // Clicou fora do clip, fazer seek normal
                onSeek(clickPercentage)
              }
            } else {
              // Modo vídeo completo, seek normal
              onSeek(clickPercentage)
            }
          }}
        >
          {/* Progress do vídeo completo (sempre visível como base) */}
          <div 
            className="h-2 rounded-full transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50"
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Progress do clip (sobreposto quando em modo clip) */}
          {isClipMode && clipBounds && (
            <>
              {/* Área do clip destacada */}
              <div 
                className="absolute top-0 h-2 bg-white/10 rounded-full"
                style={{ 
                  left: `${(clipBounds.start / duration) * 100}%`,
                  width: `${((clipBounds.end - clipBounds.start) / duration) * 100}%`
                }}
              />
              
              {/* Progress dentro do clip */}
              <div 
                className="absolute top-0 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-200"
                style={{ 
                  left: `${(clipBounds.start / duration) * 100}%`,
                  width: `${((currentTime - clipBounds.start) / duration) * 100}%`
                }}
              />
            </>
          )}
        </div>
        
        {/* ➕ INDICADORES DE CORTE na barra de progresso */}
        {cutPoints.length > 0 && (
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