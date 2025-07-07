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
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  
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
      <div className="p-4 space-y-3">
        {/* Header com controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Controles de reprodução */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onStop}
              className="text-white hover:bg-gray-700"
              title="Parar"
            >
              <Square size={14} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="text-white hover:bg-gray-700"
              title="Voltar 10s"
            >
              <SkipBack size={14} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={isPlaying ? onPause : onPlay}
              className={`text-white hover:bg-gray-700 ${isPlaying ? 'bg-green-600' : 'bg-blue-600'}`}
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="text-white hover:bg-gray-700"
              title="Avançar 10s"
            >
              <SkipForward size={14} />
            </Button>
            
            {/* Tempo atual */}
            <div className="bg-gray-800 px-2 py-1 rounded text-white text-xs font-mono">
              {formatTime(currentTime)}
            </div>
          </div>
          
          {/* Controles de zoom */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-white hover:bg-gray-700"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </Button>
            
            <div className="bg-gray-800 px-2 py-1 rounded text-white text-xs font-mono min-w-[60px] text-center">
              {zoom}%
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-white hover:bg-gray-700"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomReset}
              className="text-white hover:bg-gray-700 text-xs"
              title="Reset Zoom"
            >
              100%
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
              className="text-white hover:bg-gray-700 text-xs"
              title={isTimelineExpanded ? "Comprimir Timeline" : "Expandir Timeline"}
            >
              {isTimelineExpanded ? "📐" : "🔍"}
            </Button>
          </div>
        </div>
        
        {/* Ruler */}
        <div className="relative h-6 bg-gray-800 rounded overflow-hidden">
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
                <div className={`w-px bg-gray-400 ${mark.isMajor ? 'h-4' : 'h-2'}`} />
                {mark.isMajor && (
                  <span className="text-xs text-gray-300 mt-1" style={{ fontSize: '10px' }}>
                    {mark.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline Principal */}
        <div className={`relative ${isTimelineExpanded ? 'h-32' : 'h-16'} bg-gray-800 rounded overflow-hidden cursor-pointer`}>
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
                } ${isTimelineExpanded ? 'rounded-lg' : 'rounded'}`}
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
                {isTimelineExpanded && (
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
        
        {/* Informações da timeline */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Duração: {formatTime(duration)}</span>
            <span>Zoom: {zoom}%</span>
            <span>Segmentos: {cutSegments.length}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedSegment && (
              <span className="text-yellow-400">
                📌 {cutSegments.find(s => s.id === selectedSegment)?.name}
              </span>
            )}
            {inPoint !== null && outPoint !== null && (
              <span className="text-green-400">
                ✂️ Seleção: {formatTime(Math.abs(outPoint - inPoint))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntegratedTimeline 