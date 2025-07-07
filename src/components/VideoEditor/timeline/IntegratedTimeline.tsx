/**
 * 🎬 INTEGRATED TIMELINE - ClipsForge Pro
 * 
 * Timeline profissional integrada com sistema de cortes existente
 * Compatível com legendas, narração e galeria
 * 
 * @version 1.0.0 - Integração com VideoEditorPageNew.tsx
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  ZoomIn, ZoomOut, RotateCcw, 
  CornerUpLeft, CornerUpRight, 
  Split, Scissors
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
  
  // ===== ESTADO PARA SEGMENTO REDIMENSIONÁVEL =====
  const [activeSegment, setActiveSegment] = useState({
    start: 0,
    end: 0
  })
  const [dragType, setDragType] = useState<'start' | 'end' | 'move' | 'seek' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartSegment, setDragStartSegment] = useState({ start: 0, end: 0 })
  
  const progressBarRef = useRef<HTMLDivElement>(null)
  
  // ===== EFEITO PARA INICIALIZAR SEGMENTO =====
  useEffect(() => {
    if (duration > 0) {
      console.log('🎯 Inicializando segmento com duration:', duration)
      setActiveSegment({
        start: duration * 0.25, // 25% do início
        end: duration * 0.75     // 75% do fim
      })
    }
  }, [duration])
  
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
    const viewportWidth = 100
    const scaleFactor = zoom / 100
    const effectiveWidth = viewportWidth * scaleFactor
    
    let interval = 10
    if (zoom >= 400) interval = 1
    else if (zoom >= 200) interval = 2
    else if (zoom >= 100) interval = 5
    else if (zoom >= 50) interval = 10
    else interval = 30
    
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
  
  // ===== HANDLERS PARA SEGMENTO REDIMENSIONÁVEL =====
  const handleSegmentHandleMouseDown = useCallback((e: React.MouseEvent, type: 'start' | 'end') => {
    e.stopPropagation()
    setIsDragging(true)
    setDragType(type)
    setDragStartX(e.clientX)
    setDragStartSegment({ ...activeSegment })
  }, [activeSegment])
  
  const handleSegmentBodyMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    setDragType('move')
    setDragStartX(e.clientX)
    setDragStartSegment({ ...activeSegment })
  }, [activeSegment])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const newTime = Math.max(0, Math.min(duration, (percentage / 100) * duration))
    
    if (dragType === 'seek') {
      onSeek(newTime)
    } else if (dragType === 'start') {
      const newStart = Math.max(0, Math.min(activeSegment.end - 1, newTime))
      setActiveSegment(prev => ({ ...prev, start: newStart }))
    } else if (dragType === 'end') {
      const newEnd = Math.max(activeSegment.start + 1, Math.min(duration, newTime))
      setActiveSegment(prev => ({ ...prev, end: newEnd }))
    } else if (dragType === 'move') {
      const deltaX = e.clientX - dragStartX
      const deltaTime = (deltaX / rect.width) * duration
      const segmentDuration = dragStartSegment.end - dragStartSegment.start
      const newStart = Math.max(0, Math.min(duration - segmentDuration, dragStartSegment.start + deltaTime))
      const newEnd = newStart + segmentDuration
      setActiveSegment({ start: newStart, end: newEnd })
    }
  }, [isDragging, dragType, onSeek, duration, activeSegment, dragStartX, dragStartSegment])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
    setDragStartX(0)
    setDragStartSegment({ start: 0, end: 0 })
  }, [])
  
  // ===== EVENT LISTENERS =====
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
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
      
      {/* ===== TIMELINE PROFISSIONAL ===== */}
      <div className={`${
        timelineMode === 'mini' 
          ? 'p-1 bg-black/80 backdrop-blur border-t border-gray-600' 
          : 'p-4 space-y-3 bg-gradient-to-b from-gray-800 to-gray-900 border-t-2 border-blue-500 shadow-2xl'
      }`}>
        {/* Header com controles */}
        {timelineMode !== 'mini' && (
          <div className="flex items-center justify-between bg-gray-700/50 backdrop-blur p-3 rounded-xl border border-gray-600 shadow-lg">
            <div className="flex items-center space-x-4">
              {/* Controles de reprodução */}
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
              
              {/* Tempo atual */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 rounded-lg text-white text-sm font-mono border border-gray-600 shadow-inner">
                <span className="text-blue-300">{formatTime(currentTime)}</span>
                <span className="text-gray-400 mx-2">/</span>
                <span className="text-gray-300">{formatTime(duration)}</span>
              </div>
              
              {/* Controles de zoom */}
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="text-white hover:bg-gray-600 px-2 py-1 rounded transition-all"
                  title="Diminuir zoom"
                >
                  <ZoomOut size={14} />
                </Button>
                
                <span className="text-white text-xs font-mono bg-gray-700 px-2 py-1 rounded">
                  {zoom}%
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="text-white hover:bg-gray-600 px-2 py-1 rounded transition-all"
                  title="Aumentar zoom"
                >
                  <ZoomIn size={14} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomReset}
                  className="text-white hover:bg-gray-600 px-2 py-1 rounded transition-all text-xs"
                  title="Resetar zoom"
                >
                  100%
                </Button>
              </div>
            </div>
            
            {/* Controles de modo */}
            <div className="flex items-center space-x-2">
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
        )}
        
        {/* Ruler */}
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
        
        {/* Timeline Principal */}
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
        
        {/* Timeline Mini - Barra Redimensionável Estilo Opus Clips */}
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
            
            {/* Barra de progresso REDIMENSIONÁVEL */}
            <div 
              ref={progressBarRef}
              className="flex-1 relative h-2 bg-gray-700 rounded-full transition-colors group cursor-pointer"
              title="Timeline com segmento redimensionável"
            >
              {/* Fundo cinza */}
              <div className="absolute inset-0 bg-gray-600 rounded-full" />
              
              {/* Área não selecionada do início */}
              <div 
                className="absolute top-0 left-0 h-full bg-gray-800 rounded-l-full cursor-pointer"
                style={{ width: `${duration > 0 ? (activeSegment.start / duration) * 100 : 0}%` }}
                onClick={(e) => {
                  const rect = progressBarRef.current?.getBoundingClientRect()
                  if (!rect) return
                  const x = e.clientX - rect.left
                  const percentage = (x / rect.width) * 100
                  const newTime = Math.max(0, (percentage / 100) * activeSegment.start)
                  const segmentDuration = activeSegment.end - activeSegment.start
                  setActiveSegment({ start: newTime, end: newTime + segmentDuration })
                }}
                title="Clique para mover segmento ◄"
              />
              
              {/* Segmento AZUL redimensionável */}
              <div 
                className={`absolute top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-100 ${
                  dragType === 'move' ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{ 
                  left: `${duration > 0 ? (activeSegment.start / duration) * 100 : 0}%`,
                  width: `${duration > 0 ? ((activeSegment.end - activeSegment.start) / duration) * 100 : 0}%`
                }}
                onMouseDown={handleSegmentBodyMouseDown}
                title={`Segmento: ${formatTime(activeSegment.start)} - ${formatTime(activeSegment.end)}`}
              >
                {/* Handle esquerdo */}
                <div 
                  className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-lg cursor-ew-resize hover:scale-110 transition-transform ${
                    dragType === 'start' ? 'animate-ping' : ''
                  }`}
                  onMouseDown={(e) => handleSegmentHandleMouseDown(e, 'start')}
                  title="◄ Redimensionar início"
                />
                
                {/* Handle direito */}
                <div 
                  className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-lg cursor-ew-resize hover:scale-110 transition-transform ${
                    dragType === 'end' ? 'animate-ping' : ''
                  }`}
                  onMouseDown={(e) => handleSegmentHandleMouseDown(e, 'end')}
                  title="► Redimensionar fim"
                />
              </div>
              
              {/* Área não selecionada do fim */}
              <div 
                className="absolute top-0 right-0 h-full bg-gray-800 rounded-r-full cursor-pointer"
                style={{ width: `${duration > 0 ? ((duration - activeSegment.end) / duration) * 100 : 0}%` }}
                onClick={(e) => {
                  const rect = progressBarRef.current?.getBoundingClientRect()
                  if (!rect) return
                  const x = e.clientX - rect.left
                  const percentage = (x / rect.width) * 100
                  const newTime = Math.min(duration, activeSegment.end + ((percentage / 100) * (duration - activeSegment.end)))
                  const segmentDuration = activeSegment.end - activeSegment.start
                  setActiveSegment({ start: newTime - segmentDuration, end: newTime })
                }}
                title="Clique para mover segmento ►"
              />
              
              {/* Playhead */}
              <div
                className="absolute top-0 w-0.5 h-full bg-white shadow-lg z-30"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full shadow-lg" />
              </div>
            </div>
            
            {/* Tempo compacto */}
            <div className="text-xs text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded">
              {formatTime(currentTime)}/{formatTime(duration)}
            </div>
            
            {/* Botões de expansão */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimelineMode('compact')}
                className="text-white px-1.5 py-0.5 rounded transition-all hover:bg-gray-600"
                title="Timeline Compacta"
              >
                <span className="text-sm">➕</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimelineMode('expanded')}
                className="text-white px-1.5 py-0.5 rounded transition-all hover:bg-gray-600"
                title="Timeline Expandida"
              >
                <span className="text-sm">⬆️</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegratedTimeline 