/**
 * 🎬 INTEGRATED TIMELINE - ClipsForge Pro
 * 
 * Timeline profissional integrada com sistema de cortes existente
 * Compatível com legendas, narração e galeria
 * 
 * @version 1.0.0 - Integração com VideoEditorPageNew.tsx
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '../../ui/button'
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  ZoomIn, ZoomOut, CornerUpLeft, CornerUpRight, 
  Split, Scissors, RotateCcw
} from 'lucide-react'

// ===== INTERFACES =====
type TimelineMode = 'mini' | 'compact' | 'expanded'

interface CutSegment {
  id: string
  start: number
  end: number
  name: string
  selected: boolean
  color: string
}

interface TimelineMarker {
  id: string
  time: number
  type: 'cut' | 'in' | 'out'
  label: string
}

interface IntegratedTimelineProps {
  // Player state
  isPlaying: boolean
  currentTime: number
  duration: number
  
  // Handlers
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeek: (time: number) => void
  
  // Cortes
  cutSegments: CutSegment[]
  inPoint: number | null
  outPoint: number | null
  selectedSegment: string | null
  activeTool: string
  
  // Handlers de corte
  onSetInPoint: () => void
  onSetOutPoint: () => void
  onSplitAtCurrentTime: () => void
  onCreateCut: () => void
  onUndoCut: () => void
  onJumpToSegment: (segment: CutSegment) => void
  
  // Formatação
  formatTime: (time: number) => string
  getTimelinePosition: (time: number) => number
  
  // Estado do histórico
  cutHistory: CutSegment[][]
}

const IntegratedTimeline: React.FC<IntegratedTimelineProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  cutSegments,
  inPoint,
  outPoint,
  selectedSegment,
  activeTool,
  onSetInPoint,
  onSetOutPoint,
  onSplitAtCurrentTime,
  onCreateCut,
  onUndoCut,
  onJumpToSegment,
  formatTime,
  getTimelinePosition,
  cutHistory
}) => {
  // ===== ESTADO DA TIMELINE PROFISSIONAL =====
  const [zoom, setZoom] = useState(100)
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('compact')
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // ===== ESTADO PARA DRAG & DROP =====
  const [isDragging, setIsDragging] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  
  // ===== ZOOM CONTROLS =====
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 1600))
  }, [])
  
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 25))
  }, [])
  
  const handleZoomReset = useCallback(() => {
    setZoom(100)
  }, [])
  
  // ===== RULER CALCULATION =====
  const calculateRulerMarks = useCallback(() => {
    if (duration === 0) return []
    
    const marks = []
    const viewportWidth = 100 // Percentual da viewport
    const scaleFactor = zoom / 100
    const effectiveWidth = viewportWidth * scaleFactor
    
    // Determinar intervalo baseado no zoom
    let interval = 10 // 10 segundos por padrão
    if (zoom >= 400) interval = 1      // 1 segundo para zoom alto
    else if (zoom >= 200) interval = 2  // 2 segundos para zoom médio
    else if (zoom >= 100) interval = 5  // 5 segundos para zoom normal
    else if (zoom >= 50) interval = 10  // 10 segundos para zoom baixo
    else interval = 30                  // 30 segundos para zoom muito baixo
    
    for (let time = 0; time <= duration; time += interval) {
      const position = (time / duration) * effectiveWidth
      const isMajor = time % (interval * 2) === 0
      
      marks.push({
        time,
        position: `${position}%`,
        label: formatTime(time),
        isMajor
      })
    }
    
    return marks
  }, [duration, zoom, formatTime])
  
  const rulerMarks = calculateRulerMarks()
  
  // ===== TIMELINE DRAG HANDLING =====
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    const scaleFactor = zoom / 100
    const adjustedPercentage = percentage / scaleFactor
    const newTime = Math.max(0, Math.min(duration, (adjustedPercentage / 100) * duration))
    
    onSeek(newTime)
  }, [zoom, duration, onSeek])
  
  // ===== DRAG & DROP HANDLERS =====
  const handleProgressBarMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    
    // Seek imediatamente ao clicar
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100
      const newTime = Math.max(0, Math.min(duration, (percentage / 100) * duration))
      onSeek(newTime)
    }
  }, [duration, onSeek])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const newTime = Math.max(0, Math.min(duration, (percentage / 100) * duration))
    
    onSeek(newTime)
  }, [isDragging, duration, onSeek])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  // ===== EFEITO PARA EVENTOS GLOBAIS =====
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('mouseleave', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('mouseleave', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])
  
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent">
      {/* ===== CONTROLES DE CORTE ===== */}
      {activeTool === 'cut' && (
        <div className="flex items-center justify-center space-x-2 p-2 bg-black/50 backdrop-blur-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={onSetInPoint}
            className="bg-green-600 hover:bg-green-700 text-white text-xs"
            title="Definir ponto de entrada (I)"
          >
            <CornerUpLeft size={12} className="mr-1" />
            Entrada
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSetOutPoint}
            className="bg-red-600 hover:bg-red-700 text-white text-xs"
            title="Definir ponto de saída (O)"
          >
            <CornerUpRight size={12} className="mr-1" />
            Saída
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSplitAtCurrentTime}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            title="Dividir aqui (S)"
          >
            <Split size={12} className="mr-1" />
            Dividir
          </Button>
          
          {inPoint !== null && outPoint !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateCut}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs animate-pulse"
              title="Criar corte selecionado"
            >
              <Scissors size={12} className="mr-1" />
              Cortar
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onUndoCut}
            disabled={cutHistory.length === 0}
            className="bg-gray-600 hover:bg-gray-700 text-white text-xs"
            title="Desfazer último corte (Ctrl+Z)"
          >
            <RotateCcw size={12} className="mr-1" />
            Desfazer
          </Button>
        </div>
      )}
      
      {/* ===== TIMELINE PROFISSIONAL - DESIGN MELHORADO ===== */}
      <div className={`${
        timelineMode === 'mini' 
          ? 'p-1 bg-black/80 backdrop-blur border-t border-gray-600' 
          : 'p-4 space-y-3 bg-gradient-to-b from-gray-800 to-gray-900 border-t-2 border-blue-500 shadow-2xl'
      }`}>
        {/* Header com controles - VISUAL MELHORADO */}
        {timelineMode !== 'mini' && (
          <div className="flex items-center justify-between bg-gray-700/50 backdrop-blur p-3 rounded-xl border border-gray-600 shadow-lg">
            <div className="flex items-center space-x-4">
              {/* Controles de reprodução - MELHORADOS */}
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStop}
                  className="text-white hover:bg-red-600 bg-red-700 px-3 py-2 rounded transition-all"
                  title="Parar"
                >
                  <Square size={16} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSeek(Math.max(0, currentTime - 10))}
                  className="text-white hover:bg-gray-600 bg-gray-700 px-3 py-2 rounded transition-all"
                  title="Voltar 10s"
                >
                  <SkipBack size={16} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPlaying ? onPause : onPlay}
                  className={`text-white hover:brightness-110 px-4 py-2 rounded-lg transition-all shadow-lg ${
                    isPlaying ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-blue-600 to-blue-500'
                  }`}
                  title={isPlaying ? "Pausar" : "Reproduzir"}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  <span className="ml-2 text-sm font-medium">{isPlaying ? "Pause" : "Play"}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                  className="text-white hover:bg-gray-600 bg-gray-700 px-3 py-2 rounded transition-all"
                  title="Avançar 10s"
                >
                  <SkipForward size={16} />
                </Button>
              </div>
              
              {/* Tempo atual - MELHORADO */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 rounded-lg text-white text-sm font-mono border border-gray-600 shadow-inner">
                <span className="text-blue-300">{formatTime(currentTime)}</span>
                <span className="text-gray-400 mx-2">/</span>
                <span className="text-gray-300">{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Controles de zoom - MELHORADOS */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-2 border border-gray-600">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="text-white hover:bg-gray-600 p-2 rounded transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </Button>
                
                <div className="bg-gray-700 px-4 py-2 rounded text-white text-sm font-mono min-w-[80px] text-center border border-gray-600">
                  {zoom}%
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="text-white hover:bg-gray-600 p-2 rounded transition-all"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomReset}
                className="text-white hover:bg-gray-600 bg-gray-700 px-4 py-2 rounded-lg transition-all border border-gray-600"
                title="Reset Zoom"
              >
                Reset
              </Button>
              
              <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1 border border-gray-600">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimelineMode('mini')}
                  className={`text-white px-3 py-2 rounded transition-all ${
                    timelineMode === 'mini' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-600'
                  }`}
                  title="Timeline Mini"
                >
                  <span className="text-lg">➖</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimelineMode('compact')}
                  className={`text-white px-3 py-2 rounded transition-all ${
                    timelineMode === 'compact' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-600'
                  }`}
                  title="Timeline Compacta"
                >
                  <span className="text-lg">➕</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimelineMode('expanded')}
                  className={`text-white px-3 py-2 rounded transition-all ${
                    timelineMode === 'expanded' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-gray-600'
                  }`}
                  title="Timeline Expandida"
                >
                  <span className="text-lg">⬆️</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Ruler - MELHORADO */}
        {timelineMode !== 'mini' && (
          <div className="relative h-10 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg overflow-hidden border border-gray-600 shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full flex items-end"
              style={{ width: `${zoom}%` }}
            >
              {rulerMarks.map((mark, index) => (
                <div
                  key={index}
                  className="absolute flex flex-col items-center"
                  style={{ left: mark.position }}
                >
                  <div className={`w-px bg-gray-300 ${mark.isMajor ? 'h-6' : 'h-3'} shadow-sm`} />
                  {mark.isMajor && (
                    <span className="text-xs text-gray-200 mt-1 font-mono bg-gray-800/50 px-1 rounded" style={{ fontSize: '11px' }}>
                      {mark.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Timeline Principal - APENAS SE NÃO FOR MINI */}
        {timelineMode !== 'mini' && (
          <div className={`relative ${
            timelineMode === 'compact' ? 'h-20' : 'h-40'
          } bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg overflow-hidden cursor-pointer border border-gray-600 shadow-lg`}>
            <div 
              ref={timelineRef}
              className="absolute inset-0"
              onClick={handleTimelineClick}
              style={{ width: `${zoom}%` }}
            >
              {/* Fundo da timeline */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600" />
              
              {/* Barra de progresso */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-100"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              
              {/* Segmentos de corte */}
              {cutSegments.map(segment => (
                <div
                  key={segment.id}
                  className={`absolute top-0 h-full opacity-80 cursor-pointer hover:opacity-100 transition-all duration-200 ${
                    segment.selected ? 'ring-2 ring-white' : ''
                  } ${timelineMode === 'expanded' ? 'rounded-lg' : 'rounded'}`}
                  style={{
                    left: `${getTimelinePosition(segment.start)}%`,
                    width: `${getTimelinePosition(segment.end - segment.start)}%`,
                    backgroundColor: segment.color
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onJumpToSegment(segment)
                  }}
                  title={`${segment.name} (${formatTime(segment.start)} - ${formatTime(segment.end)})`}
                >
                  {timelineMode === 'expanded' && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                      {segment.name}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Marcadores de entrada/saída */}
              {inPoint !== null && (
                <div
                  className="absolute top-0 w-1 h-full bg-green-500 rounded-full z-20"
                  style={{ left: `${getTimelinePosition(inPoint)}%` }}
                  title={`Entrada: ${formatTime(inPoint)}`}
                />
              )}
              
              {outPoint !== null && (
                <div
                  className="absolute top-0 w-1 h-full bg-red-500 rounded-full z-20"
                  style={{ left: `${getTimelinePosition(outPoint)}%` }}
                  title={`Saída: ${formatTime(outPoint)}`}
                />
              )}
              
              {/* Área de seleção */}
              {inPoint !== null && outPoint !== null && (
                <div
                  className="absolute top-0 h-full bg-yellow-400 opacity-30 rounded z-10"
                  style={{
                    left: `${getTimelinePosition(Math.min(inPoint, outPoint))}%`,
                    width: `${getTimelinePosition(Math.abs(outPoint - inPoint))}%`
                  }}
                />
              )}
              
              {/* Playhead */}
              <div
                className="absolute top-0 w-0.5 h-full bg-white shadow-lg z-30"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full shadow-lg" />
              </div>
            </div>
          </div>
        )}
        
        {/* Timeline Mini - Layout Profissional Horizontal PREMIUM */}
        {timelineMode === 'mini' && (
          <div className="flex items-center h-5 px-2 space-x-2">
            {/* Controles de reprodução compactos */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={isPlaying ? onPause : onPlay}
                className={`text-white px-1.5 py-0.5 rounded transition-all hover:brightness-110 ${
                  isPlaying ? 'bg-green-600/80 hover:bg-green-600' : 'bg-blue-600/80 hover:bg-blue-600'
                }`}
                title={isPlaying ? "Pausar" : "Reproduzir"}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </Button>
            </div>
            
            {/* Barra de progresso interativa com DRAG & DROP */}
            <div 
              ref={progressBarRef}
              className={`flex-1 relative h-2 bg-gray-700 rounded-full transition-colors group ${
                isDragging ? 'cursor-grabbing' : 'cursor-pointer hover:bg-gray-600'
              }`}
              onMouseDown={handleProgressBarMouseDown}
              onMouseMove={(e) => {
                if (!isDragging) {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const percentage = (x / rect.width) * 100
                  const hoverTime = Math.max(0, Math.min(duration, (percentage / 100) * duration))
                  e.currentTarget.title = `${isDragging ? 'Arrastando' : 'Clique ou arraste'} para ${formatTime(hoverTime)}`
                }
              }}
              title="Clique ou arraste para navegar"
            >
              {/* Progresso */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-100"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              
              {/* Playhead MELHORADO para drag */}
              <div
                className={`absolute top-0 w-3 h-4 bg-white rounded-full shadow-lg transition-all duration-100 ${
                  isDragging ? 'bg-yellow-300 scale-110' : 'group-hover:bg-yellow-300'
                }`}
                style={{ 
                  left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  transform: `translateX(-50%) ${isDragging ? 'scale(1.1)' : 'scale(1)'}`
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleProgressBarMouseDown(e)
                }}
              >
                {/* Indicador visual de drag */}
                <div 
                  className={`absolute -top-1 -left-1 w-5 h-6 rounded-full transition-all duration-100 ${
                    isDragging ? 'bg-yellow-300/50 scale-110' : 'bg-transparent'
                  }`}
                />
              </div>
              
              {/* Hover indicator melhorado */}
              <div className={`absolute inset-0 bg-blue-400/20 rounded-full transition-opacity ${
                isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`} />
              
              {/* Indicador de drag ativo */}
              {isDragging && (
                <div className="absolute -top-1 -bottom-1 left-0 right-0 bg-yellow-300/10 rounded-full animate-pulse" />
              )}
            </div>
            
            {/* Tempo compacto */}
            <div className="text-white text-xs font-mono opacity-90 bg-gray-800/50 px-2 py-0.5 rounded backdrop-blur">
              {formatTime(currentTime)}/{formatTime(duration)}
            </div>
            
            {/* Controles de navegação */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSeek(Math.max(0, currentTime - 10))}
                className="text-white px-1.5 py-0.5 rounded transition-all hover:bg-gray-600 bg-gray-700/80"
                title="Voltar 10 segundos"
              >
                ⏪
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                className="text-white px-1.5 py-0.5 rounded transition-all hover:bg-gray-600 bg-gray-700/80"
                title="Avançar 10 segundos"
              >
                ⏩
              </Button>
            </div>
            
            {/* Botões de expansão */}
            <div className="flex items-center space-x-1 border-l border-gray-600 pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimelineMode('compact')}
                className="text-white px-1.5 py-0.5 rounded transition-all hover:bg-gray-700 text-xs"
                title="Timeline Compacta"
              >
                ➕
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimelineMode('expanded')}
                className="text-white px-1.5 py-0.5 rounded transition-all hover:bg-gray-700 text-xs"
                title="Timeline Expandida"
              >
                ⬆️
              </Button>
            </div>
          </div>
        )}
        
        {/* Informações da timeline - MELHORADAS */}
        {timelineMode !== 'mini' && (
          <div className="flex items-center justify-between bg-gray-700/30 backdrop-blur px-4 py-3 rounded-lg border border-gray-600 shadow-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Duração:</span>
                <span className="text-white font-mono text-sm bg-gray-800 px-2 py-1 rounded">{formatTime(duration)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Zoom:</span>
                <span className="text-blue-300 font-mono text-sm bg-gray-800 px-2 py-1 rounded">{zoom}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Segmentos:</span>
                <span className="text-green-300 font-mono text-sm bg-gray-800 px-2 py-1 rounded">{cutSegments.length}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedSegment && (
                <div className="flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500 px-3 py-2 rounded-lg">
                  <span className="text-yellow-300">📌</span>
                  <span className="text-yellow-200 text-sm font-medium">
                    {cutSegments.find(s => s.id === selectedSegment)?.name}
                  </span>
                </div>
              )}
              {inPoint !== null && outPoint !== null && (
                <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500 px-3 py-2 rounded-lg">
                  <span className="text-green-300">✂️</span>
                  <span className="text-green-200 text-sm font-medium">
                    Seleção: {formatTime(Math.abs(outPoint - inPoint))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegratedTimeline 