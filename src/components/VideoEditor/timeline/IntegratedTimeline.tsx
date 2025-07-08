/**
 * 🎬 INTEGRATED TIMELINE - ClipsForge Pro v2.0
 * 
 * Timeline profissional integrada com sistema de cortes existente
 * Compatível com legendas, narração e galeria
 * 
 * @version 2.0.0 - REFATORAÇÃO COMPLETA
 * @fixes: Sincronização, Drag & Drop, Zoom, Estado unificado
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  ZoomIn, ZoomOut, RotateCcw, 
  CornerUpLeft, CornerUpRight, 
  Split, Scissors, Trash2
} from 'lucide-react'

// ===== INTERFACES =====
type TimelineMode = 'mini' | 'compact' | 'expanded'
type DragType = 'start' | 'end' | 'move' | 'seek' | null

interface CutSegment {
  id: string
  start: number
  end: number
  name: string
  selected: boolean
  color: string
}

interface SplitBlock {
  id: string
  start: number
  end: number
  name: string
  color: string
  isDragging: boolean
}

interface ActiveSegment {
  start: number
  end: number
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

// ===== UTILITÁRIOS DE CÁLCULO =====
const calculateTimelinePosition = (time: number, duration: number, zoom: number = 100) => {
  if (duration === 0) return 0
  return (time / duration) * zoom
}

const calculateTimeFromPosition = (position: number, duration: number, zoom: number = 100) => {
  const percentage = (position / zoom) * 100
  return Math.max(0, Math.min(duration, (percentage / 100) * duration))
}

const getCoordinatesFromEvent = (e: React.MouseEvent | MouseEvent, container: HTMLElement) => {
  const rect = container.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percentage = (x / rect.width) * 100
  return { x, percentage }
}

// ===== COMPONENTE REUTILIZÁVEL PARA BARRA REDIMENSIONÁVEL =====
interface ResizableSegmentProps {
  segment: ActiveSegment
  duration: number
  currentTime: number
  dragType: DragType
  isDragging: boolean
  isMainTimeline?: boolean
  zoom?: number
  formatTime: (time: number) => string
  onSegmentChange: (segment: ActiveSegment) => void
  onDragStart?: (e: React.MouseEvent, type: 'start' | 'end' | 'move') => void // Opcional temporariamente
  onAreaClick: (time: number) => void
  containerRef: React.RefObject<HTMLDivElement>
  // Novos handlers específicos
  onStartHandleDragStart?: (e: React.MouseEvent) => void
  onEndHandleDragStart?: (e: React.MouseEvent) => void
  onMoveSegmentDragStart?: (e: React.MouseEvent) => void
}

const ResizableSegment: React.FC<ResizableSegmentProps> = ({
  segment,
  duration,
  currentTime,
  dragType,
  isDragging,
  isMainTimeline = false,
  zoom = 100,
  formatTime,
  onSegmentChange,
  onDragStart,
  onAreaClick,
  containerRef,
  onStartHandleDragStart,
  onEndHandleDragStart,
  onMoveSegmentDragStart
}) => {
  // Cálculos de posição unificados
  const startPercent = calculateTimelinePosition(segment.start, duration, zoom)
  const endPercent = calculateTimelinePosition(segment.end, duration, zoom)
  const widthPercent = endPercent - startPercent
  const playheadPercent = calculateTimelinePosition(currentTime, duration, zoom)
  
  // Área antes do segmento
  const beforeAreaPercent = startPercent
  const afterAreaPercent = 100 - endPercent

  const handleAreaClick = (e: React.MouseEvent, isStart: boolean) => {
    e.stopPropagation()
    if (!containerRef.current) return
    
    const { percentage } = getCoordinatesFromEvent(e, containerRef.current)
    const clickTime = calculateTimeFromPosition(percentage, duration, zoom)
    
    if (isStart) {
      // Mover segmento para posição clicada (mantendo duração)
      const segmentDuration = segment.end - segment.start
      const newStart = Math.max(0, Math.min(duration - segmentDuration, clickTime))
      const newEnd = newStart + segmentDuration
      onSegmentChange({ start: newStart, end: newEnd })
    } else {
      // Mover segmento para posição clicada (mantendo duração)
      const segmentDuration = segment.end - segment.start
      const newEnd = Math.min(duration, clickTime)
      const newStart = Math.max(0, newEnd - segmentDuration)
      onSegmentChange({ start: newStart, end: newEnd })
    }
  }

  // Estilos condicionais baseados no tipo de timeline
  const handleSize = isMainTimeline ? 'w-6 h-6' : 'w-4 h-4'
  const containerStyle = isMainTimeline ? 'rounded-lg border border-blue-300' : 'rounded-full'
  const areaStyle = isMainTimeline ? 'rounded-l-lg' : 'rounded-l-full'

  return (
    <>
      {/* Área não selecionada - INÍCIO */}
      {beforeAreaPercent > 0 && (
        <div 
          className={`absolute top-0 left-0 h-full bg-gray-800 cursor-pointer transition-all hover:bg-gray-700 ${areaStyle}`}
          style={{ width: `${beforeAreaPercent}%` }}
          onClick={(e) => handleAreaClick(e, true)}
          title="Clique para mover segmento ◄"
        />
      )}
      
      {/* SEGMENTO AZUL REDIMENSIONÁVEL */}
      <div 
        className={`absolute top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-200 shadow-lg ${
          dragType === 'move' ? 'cursor-grabbing' : 'cursor-grab'
        } ${containerStyle} ${
          isDragging ? 'shadow-2xl ring-4 ring-blue-300 ring-opacity-50' : 'hover:shadow-xl'
        }`}
        style={{ 
          left: `${startPercent}%`,
          width: `${widthPercent}%`,
          minWidth: '20px' // Largura mínima para visibilidade
        }}
        onMouseDown={onMoveSegmentDragStart}
        title={`Segmento: ${formatTime(segment.start)} - ${formatTime(segment.end)} (${formatTime(segment.end - segment.start)})`}
      >
        {/* Label do segmento - apenas na timeline principal */}
        {isMainTimeline && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium bg-black/20 rounded-lg pointer-events-none">
            Vídeo Selecionado
          </div>
        )}
        
        {/* Handle ESQUERDO - Redimensionar início */}
        <div 
          className={`absolute -left-3 top-1/2 -translate-y-1/2 ${handleSize} bg-yellow-400 rounded-full border-2 border-white shadow-lg cursor-ew-resize hover:scale-110 transition-transform z-10 ${
            dragType === 'start' ? 'animate-pulse ring-2 ring-yellow-300' : ''
          }`}
          onMouseDown={onStartHandleDragStart}
          title="◄ Redimensionar início"
        />
        
        {/* Handle DIREITO - Redimensionar fim */}
        <div 
          className={`absolute -right-3 top-1/2 -translate-y-1/2 ${handleSize} bg-yellow-400 rounded-full border-2 border-white shadow-lg cursor-ew-resize hover:scale-110 transition-transform z-10 ${
            dragType === 'end' ? 'animate-pulse ring-2 ring-yellow-300' : ''
          }`}
          onMouseDown={onEndHandleDragStart}
          title="► Redimensionar fim"
        />
      </div>
      
      {/* Área não selecionada - FIM */}
      {afterAreaPercent > 0 && (
        <div 
          className={`absolute top-0 right-0 h-full bg-gray-800 cursor-pointer transition-all hover:bg-gray-700 ${
            isMainTimeline ? 'rounded-r-lg' : 'rounded-r-full'
          }`}
          style={{ width: `${afterAreaPercent}%` }}
          onClick={(e) => handleAreaClick(e, false)}
          title="Clique para mover segmento ►"
        />
      )}
      
      {/* Playhead */}
      <div
        className="absolute top-0 w-0.5 h-full bg-white shadow-lg z-30 transition-all duration-100"
        style={{ left: `${playheadPercent}%` }}
      >
        <div className={`absolute -top-1 -left-1 ${isMainTimeline ? 'w-3 h-3' : 'w-2 h-2'} bg-white rounded-full shadow-lg`} />
      </div>
    </>
  )
}

// ===== COMPONENTE PRINCIPAL =====
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
  // ===== ESTADOS =====
  const [zoom, setZoom] = useState(100)
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('compact')
  const [activeSegment, setActiveSegment] = useState<ActiveSegment>({ start: 0, end: 0 })
  // Estados de drag COMPLETAMENTE separados
  const [startHandleState, setStartHandleState] = useState<{
    isDragging: boolean
    startX: number
    initialValue: number
  }>({
    isDragging: false,
    startX: 0,
    initialValue: 0
  })
  
  const [endHandleState, setEndHandleState] = useState<{
    isDragging: boolean
    startX: number
    initialValue: number
  }>({
    isDragging: false,
    startX: 0,
    initialValue: 0
  })
  
  const [moveSegmentState, setMoveSegmentState] = useState<{
    isDragging: boolean
    startX: number
    startSegment: ActiveSegment
  }>({
    isDragging: false,
    startX: 0,
    startSegment: { start: 0, end: 0 }
  })
  
  // Estado para handle de divisão (vermelho)
  const [splitHandleState, setSplitHandleState] = useState<{
    position: number
    isDragging: boolean
    startX: number
    isVisible: boolean
  }>({
    position: 0,
    isDragging: false,
    startX: 0,
    isVisible: false
  })
  
  // Estado para blocos criados pela divisão
  const [splitBlocks, setSplitBlocks] = useState<SplitBlock[]>([])
  
  // Estado para drag de blocos
  const [blockDragState, setBlockDragState] = useState<{
    blockId: string | null
    isDragging: boolean
    startX: number
    startTime: number
  }>({
    blockId: null,
    isDragging: false,
    startX: 0,
    startTime: 0
  })
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  
  // ===== INICIALIZAÇÃO DO SEGMENTO =====
  useEffect(() => {
    if (duration > 0 && activeSegment.start === 0 && activeSegment.end === 0) {
      const newSegment = {
        start: duration * 0.25, // 25% do início
        end: duration * 0.75     // 75% do fim
      }
      setActiveSegment(newSegment)
    }
  }, [duration, activeSegment.start, activeSegment.end])

  // ===== SINCRONIZAÇÃO INTELIGENTE =====
  // Quando inPoint/outPoint mudam (por ferramentas de corte), sincronizar barra azul
  useEffect(() => {
    if (inPoint !== null && outPoint !== null) {
      const start = Math.min(inPoint, outPoint)
      const end = Math.max(inPoint, outPoint)
      
      // Só sincronizar se for significativamente diferente (evitar loops)
      setActiveSegment(prev => {
        const currentDuration = prev.end - prev.start
        const newDuration = end - start
        const significantChange = Math.abs(newDuration - currentDuration) > 0.1 ||
                                 Math.abs(prev.start - start) > 0.1
        
        if (significantChange) {
          return { start, end }
        }
        return prev
      })
    }
  }, [inPoint, outPoint])
  
  // ===== CONTROLE DE VISIBILIDADE DO HANDLE DE DIVISÃO =====
  useEffect(() => {
    // Mostrar handle de divisão apenas quando playhead estiver dentro do segmento azul
    const isInsideSegment = currentTime >= activeSegment.start && currentTime <= activeSegment.end
    setSplitHandleState(prev => ({
      ...prev,
      isVisible: isInsideSegment,
      position: currentTime
    }))
  }, [currentTime, activeSegment])
  
  // ===== CONTROLES DE ZOOM =====
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev * 1.5, 1600)), [])
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev / 1.5, 25)), [])
  const handleZoomReset = useCallback(() => setZoom(100), [])
  
  // ===== CÁLCULO DAS MARCAÇÕES DA RÉGUA =====
  const calculateRulerMarks = useCallback(() => {
    if (duration === 0) return []
    
    const marks = []
    const scaleFactor = zoom / 100
    
    // Intervalos adaptativos baseados no zoom
    let interval = 10
    if (zoom >= 400) interval = 1
    else if (zoom >= 200) interval = 2
    else if (zoom >= 100) interval = 5
    else if (zoom >= 50) interval = 10
    else interval = 30
    
    for (let time = 0; time <= duration; time += interval) {
      const position = calculateTimelinePosition(time, duration, zoom)
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
  
  // ===== HANDLERS DE CLIQUE =====
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    // Prevenir clique se algum handle estiver sendo arrastado
    const anyDragging = startHandleState.isDragging || endHandleState.isDragging || moveSegmentState.isDragging
    if (!timelineRef.current || anyDragging) return
    
    const { percentage } = getCoordinatesFromEvent(e, timelineRef.current)
    const newTime = calculateTimeFromPosition(percentage, duration, zoom)
    
    onSeek(newTime)
  }, [zoom, duration, onSeek, startHandleState.isDragging, endHandleState.isDragging, moveSegmentState.isDragging])
  
  // ===== HANDLERS DE DRAG SEPARADOS =====
  
  // Handler específico para handle de INÍCIO
  const handleStartHandleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setStartHandleState({
      isDragging: true,
      startX: e.clientX,
      initialValue: activeSegment.start
    })
  }, [activeSegment.start])
  
  // Handler específico para handle de FIM  
  const handleEndHandleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setEndHandleState({
      isDragging: true,
      startX: e.clientX,
      initialValue: activeSegment.end
    })
  }, [activeSegment.end])
  
  // Handler específico para MOVER segmento
  const handleMoveSegmentDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setMoveSegmentState({
      isDragging: true,
      startX: e.clientX,
      startSegment: { ...activeSegment }
    })
  }, [activeSegment])
  
  // ===== HANDLERS PARA HANDLE DE DIVISÃO (VERMELHO) =====
  
  const handleSplitHandleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setSplitHandleState(prev => ({
      ...prev,
      isDragging: true,
      startX: e.clientX
    }))
  }, [])
  
  const handleSplitHandleMove = useCallback((e: MouseEvent) => {
    if (!splitHandleState.isDragging) return
    
    const container = timelineMode === 'mini' ? progressBarRef.current : timelineRef.current
    if (!container) return
    
    const { percentage } = getCoordinatesFromEvent(e, container)
    const newTime = calculateTimeFromPosition(percentage, duration, timelineMode === 'mini' ? 100 : zoom)
    
    // Limitar movimento dentro do segmento azul
    const constrainedTime = Math.max(
      activeSegment.start + 0.1,
      Math.min(activeSegment.end - 0.1, newTime)
    )
    
    setSplitHandleState(prev => ({
      ...prev,
      position: constrainedTime
    }))
  }, [splitHandleState.isDragging, activeSegment, duration, zoom, timelineMode])
  
  const handleSplitHandleEnd = useCallback(() => {
    if (!splitHandleState.isDragging) return
    setSplitHandleState(prev => ({ ...prev, isDragging: false, startX: 0 }))
  }, [splitHandleState.isDragging])
  
  // ===== FUNÇÃO PARA CRIAR BLOCOS PELA DIVISÃO =====
  
  const createSplitBlocks = useCallback(() => {
    if (!splitHandleState.isVisible) return
    
    const splitTime = splitHandleState.position
    const blockId1 = `block-${Date.now()}-1`
    const blockId2 = `block-${Date.now()}-2`
    
    const newBlocks: SplitBlock[] = [
      {
        id: blockId1,
        start: activeSegment.start,
        end: splitTime,
        name: `Bloco 1`,
        color: '#10B981', // Verde
        isDragging: false
      },
      {
        id: blockId2,
        start: splitTime,
        end: activeSegment.end,
        name: `Bloco 2`,
        color: '#8B5CF6', // Roxo
        isDragging: false
      }
    ]
    
    setSplitBlocks(prev => [...prev, ...newBlocks])
    
    // Ocultar handle de divisão após criar blocos
    setSplitHandleState(prev => ({ ...prev, isVisible: false }))
    
    console.log('🎬 Blocos criados:', newBlocks)
  }, [splitHandleState.isVisible, splitHandleState.position, activeSegment])
  
  // ===== HANDLERS PARA DRAG & DROP DE BLOCOS =====
  
  const handleBlockDragStart = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation()
    e.preventDefault()
    
    const block = splitBlocks.find(b => b.id === blockId)
    if (!block) return
    
    setBlockDragState({
      blockId,
      isDragging: true,
      startX: e.clientX,
      startTime: block.start
    })
    
    // Marcar bloco como sendo arrastado
    setSplitBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, isDragging: true } : b
    ))
  }, [splitBlocks])
  
  const handleBlockMove = useCallback((e: MouseEvent) => {
    if (!blockDragState.isDragging || !blockDragState.blockId) return
    
    const container = timelineMode === 'mini' ? progressBarRef.current : timelineRef.current
    if (!container) return
    
    const block = splitBlocks.find(b => b.id === blockDragState.blockId)
    if (!block) return
    
    const deltaX = e.clientX - blockDragState.startX
    const rect = container.getBoundingClientRect()
    const deltaPercentage = (deltaX / rect.width) * 100
    const scaleFactor = timelineMode === 'mini' ? 1 : (zoom / 100)
    const deltaTime = (deltaPercentage / scaleFactor / 100) * duration
    
    const blockDuration = block.end - block.start
    const newStart = Math.max(0, Math.min(duration - blockDuration, blockDragState.startTime + deltaTime))
    const newEnd = newStart + blockDuration
    
    setSplitBlocks(prev => prev.map(b => 
      b.id === blockDragState.blockId ? { ...b, start: newStart, end: newEnd } : b
    ))
  }, [blockDragState, splitBlocks, duration, zoom, timelineMode])
  
  const handleBlockDragEnd = useCallback(() => {
    if (!blockDragState.isDragging) return
    
    // Desmarcar bloco como sendo arrastado
    setSplitBlocks(prev => prev.map(b => 
      b.id === blockDragState.blockId ? { ...b, isDragging: false } : b
    ))
    
    setBlockDragState({
      blockId: null,
      isDragging: false,
      startX: 0,
      startTime: 0
    })
  }, [blockDragState.isDragging, blockDragState.blockId])

  // Handlers de movimento separados
  const handleStartHandleMove = useCallback((e: MouseEvent) => {
    if (!startHandleState.isDragging) return
    
    const container = timelineMode === 'mini' ? progressBarRef.current : timelineRef.current
    if (!container) return
    
    const { percentage } = getCoordinatesFromEvent(e, container)
    const newTime = calculateTimeFromPosition(percentage, duration, timelineMode === 'mini' ? 100 : zoom)
    
    // Redimensionar início (não pode passar do fim)
    const newStart = Math.max(0, Math.min(activeSegment.end - 1, newTime))
    setActiveSegment(prev => ({ ...prev, start: newStart }))
  }, [startHandleState.isDragging, activeSegment.end, duration, zoom, timelineMode])
  
  const handleEndHandleMove = useCallback((e: MouseEvent) => {
    if (!endHandleState.isDragging) return
    
    const container = timelineMode === 'mini' ? progressBarRef.current : timelineRef.current
    if (!container) return
    
    const { percentage } = getCoordinatesFromEvent(e, container)
    const newTime = calculateTimeFromPosition(percentage, duration, timelineMode === 'mini' ? 100 : zoom)
    
    // Redimensionar fim (não pode passar do início)
    const newEnd = Math.max(activeSegment.start + 1, Math.min(duration, newTime))
    setActiveSegment(prev => ({ ...prev, end: newEnd }))
  }, [endHandleState.isDragging, activeSegment.start, duration, zoom, timelineMode])
  
  const handleMoveSegmentMove = useCallback((e: MouseEvent) => {
    if (!moveSegmentState.isDragging) return
    
    const container = timelineMode === 'mini' ? progressBarRef.current : timelineRef.current
    if (!container) return
    
    const deltaX = e.clientX - moveSegmentState.startX
    const rect = container.getBoundingClientRect()
    const deltaPercentage = (deltaX / rect.width) * 100
    const scaleFactor = timelineMode === 'mini' ? 1 : (zoom / 100)
    const deltaTime = (deltaPercentage / scaleFactor / 100) * duration
    
    const segmentDuration = moveSegmentState.startSegment.end - moveSegmentState.startSegment.start
    const newStart = Math.max(0, Math.min(duration - segmentDuration, moveSegmentState.startSegment.start + deltaTime))
    const newEnd = newStart + segmentDuration
    
    setActiveSegment({ start: newStart, end: newEnd })
  }, [moveSegmentState, duration, zoom, timelineMode])
  
  // Handlers de finalização separados
  const handleStartHandleEnd = useCallback(() => {
    if (!startHandleState.isDragging) return
    setStartHandleState({ isDragging: false, startX: 0, initialValue: 0 })
  }, [startHandleState.isDragging])
  
  const handleEndHandleEnd = useCallback(() => {
    if (!endHandleState.isDragging) return
    setEndHandleState({ isDragging: false, startX: 0, initialValue: 0 })
  }, [endHandleState.isDragging])
  
  const handleMoveSegmentEnd = useCallback(() => {
    if (!moveSegmentState.isDragging) return
    
    // Sincronizar área amarela apenas quando mover o segmento inteiro
    setActiveSegment(currentSegment => {
      onSeek(currentSegment.start)
      setTimeout(() => {
        onSetInPoint()
        onSeek(currentSegment.end)
        setTimeout(() => onSetOutPoint(), 50)
      }, 50)
      return currentSegment
    })
    
    setMoveSegmentState({ isDragging: false, startX: 0, startSegment: { start: 0, end: 0 } })
  }, [moveSegmentState.isDragging, onSeek, onSetInPoint, onSetOutPoint])
  
  // ===== CONTROLE DE REPRODUÇÃO INTELIGENTE =====
  useEffect(() => {
    if (isPlaying) {
      setActiveSegment(segment => {
        if (segment.start !== 0 && segment.end !== duration) {
          // Só controlar se chegou no fim do segmento
          if (currentTime >= segment.end && currentTime > segment.start) {
            onSeek(segment.start)
          }
        }
        return segment
      })
    }
  }, [currentTime, isPlaying, onSeek, duration])

  // ===== EVENT LISTENERS SEPARADOS =====
  
  // Listeners para handle de INÍCIO
  useEffect(() => {
    if (startHandleState.isDragging) {
      document.addEventListener('mousemove', handleStartHandleMove)
      document.addEventListener('mouseup', handleStartHandleEnd)
      return () => {
        document.removeEventListener('mousemove', handleStartHandleMove)
        document.removeEventListener('mouseup', handleStartHandleEnd)
      }
    }
  }, [startHandleState.isDragging, handleStartHandleMove, handleStartHandleEnd])
  
  // Listeners para handle de FIM
  useEffect(() => {
    if (endHandleState.isDragging) {
      document.addEventListener('mousemove', handleEndHandleMove)
      document.addEventListener('mouseup', handleEndHandleEnd)
      return () => {
        document.removeEventListener('mousemove', handleEndHandleMove)
        document.removeEventListener('mouseup', handleEndHandleEnd)
      }
    }
  }, [endHandleState.isDragging, handleEndHandleMove, handleEndHandleEnd])
  
  // Listeners para MOVER segmento
  useEffect(() => {
    if (moveSegmentState.isDragging) {
      document.addEventListener('mousemove', handleMoveSegmentMove)
      document.addEventListener('mouseup', handleMoveSegmentEnd)
      return () => {
        document.removeEventListener('mousemove', handleMoveSegmentMove)
        document.removeEventListener('mouseup', handleMoveSegmentEnd)
      }
    }
  }, [moveSegmentState.isDragging, handleMoveSegmentMove, handleMoveSegmentEnd])
  
  // Listeners para HANDLE DE DIVISÃO (vermelho)
  useEffect(() => {
    if (splitHandleState.isDragging) {
      document.addEventListener('mousemove', handleSplitHandleMove)
      document.addEventListener('mouseup', handleSplitHandleEnd)
      return () => {
        document.removeEventListener('mousemove', handleSplitHandleMove)
        document.removeEventListener('mouseup', handleSplitHandleEnd)
      }
    }
  }, [splitHandleState.isDragging, handleSplitHandleMove, handleSplitHandleEnd])
  
  // Listeners para DRAG & DROP DE BLOCOS
  useEffect(() => {
    if (blockDragState.isDragging) {
      document.addEventListener('mousemove', handleBlockMove)
      document.addEventListener('mouseup', handleBlockDragEnd)
      return () => {
        document.removeEventListener('mousemove', handleBlockMove)
        document.removeEventListener('mouseup', handleBlockDragEnd)
      }
    }
  }, [blockDragState.isDragging, handleBlockMove, handleBlockDragEnd])
  
  // ===== HANDLERS DE SEGMENTO =====
  const handleSegmentChange = useCallback((newSegment: ActiveSegment) => {
    setActiveSegment(newSegment)
  }, [])
  
  const handleAreaClick = useCallback((time: number) => {
    setActiveSegment(prev => {
      const segmentDuration = prev.end - prev.start
      const newStart = Math.max(0, Math.min(duration - segmentDuration, time))
      const newEnd = newStart + segmentDuration
      return { start: newStart, end: newEnd }
    })
  }, [duration])
  
  // ===== HANDLER PARA DIVISÃO =====
  const handleSplitSegment = useCallback(() => {
    setActiveSegment(segment => {
      if (currentTime >= segment.start && currentTime <= segment.end) {
        console.log('🎬 Dividir segmento na posição:', formatTime(currentTime))
        // TODO: Implementar divisão real do segmento
      }
      return segment
    })
  }, [currentTime, formatTime])

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
        
        {/* ===== HEADER COM CONTROLES ===== */}
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
              
              {/* Botão de divisão */}
              {/* Botão para criar blocos (quando handle vermelho está visível) */}
              {splitHandleState.isVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createSplitBlocks}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-500 animate-pulse"
                  title={`Criar blocos em ${formatTime(splitHandleState.position)}`}
                >
                  <Scissors size={14} className="mr-2" />
                  ✂️ Criar Blocos
                </Button>
              )}
              
              {/* Botão para limpar blocos */}
              {splitBlocks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSplitBlocks([])}
                  className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
                  title="Limpar todos os blocos"
                >
                  <Trash2 size={14} className="mr-2" />
                  Limpar Blocos ({splitBlocks.length})
                </Button>
              )}
              
              {/* Botão original (quando não há handle vermelho) */}
              {currentTime >= activeSegment.start && currentTime <= activeSegment.end && !splitHandleState.isVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSplitSegment}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500 animate-pulse"
                  title={`Dividir segmento em ${formatTime(currentTime)}`}
                >
                  <Scissors size={14} className="mr-2" />
                  Dividir Aqui
                </Button>
              )}
              
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
                className="text-white px-3 py-2 rounded transition-all hover:bg-gray-600"
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
        
        {/* ===== RÉGUA ===== */}
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
        
        {/* ===== TIMELINE PRINCIPAL COM BARRA REDIMENSIONÁVEL ===== */}
        {timelineMode !== 'mini' && (
          <div className={`relative ${
            timelineMode === 'compact' ? 'h-20' : 'h-40'
          } bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg overflow-hidden border border-gray-600 shadow-lg`}>
            <div 
              ref={timelineRef}
              className="absolute inset-0 cursor-crosshair"
              onClick={handleTimelineClick}
              style={{ width: `${zoom}%` }}
            >
              {/* Fundo da timeline */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600" />
              
              {/* Barra Redimensionável Principal */}
              <ResizableSegment
                segment={activeSegment}
                duration={duration}
                currentTime={currentTime}
                dragType={
                  startHandleState.isDragging ? 'start' : 
                  endHandleState.isDragging ? 'end' : 
                  moveSegmentState.isDragging ? 'move' : null
                }
                isDragging={startHandleState.isDragging || endHandleState.isDragging || moveSegmentState.isDragging}
                isMainTimeline={true}
                zoom={zoom}
                formatTime={formatTime}
                onSegmentChange={handleSegmentChange}
                onDragStart={undefined} // Usando novos handlers específicos
                onAreaClick={handleAreaClick}
                containerRef={timelineRef}
                // Novos handlers específicos
                onStartHandleDragStart={handleStartHandleDragStart}
                onEndHandleDragStart={handleEndHandleDragStart}
                onMoveSegmentDragStart={handleMoveSegmentDragStart}
              />
              
              {/* Segmentos de corte existentes */}
              {cutSegments.map(segment => (
                <div
                  key={segment.id}
                  className={`absolute top-0 h-full opacity-60 cursor-pointer hover:opacity-80 transition-all duration-200 border border-white/30 ${
                    segment.selected ? 'ring-2 ring-white' : ''
                  } ${timelineMode === 'expanded' ? 'rounded-lg' : 'rounded'}`}
                  style={{
                    left: `${getTimelinePosition(segment.start)}%`,
                    width: `${getTimelinePosition(segment.end - segment.start)}%`,
                    backgroundColor: segment.color,
                    zIndex: 5
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
              
              {/* Área de seleção amarela */}
              {inPoint !== null && outPoint !== null && (
                <div
                  className="absolute top-0 h-full bg-yellow-400 opacity-30 rounded z-10"
                  style={{
                    left: `${getTimelinePosition(Math.min(inPoint, outPoint))}%`,
                    width: `${getTimelinePosition(Math.abs(outPoint - inPoint))}%`
                  }}
                />
              )}
              
              {/* HANDLE DE DIVISÃO (VERMELHO) */}
              {splitHandleState.isVisible && (
                <div
                  className="absolute top-0 h-full z-25 flex items-center justify-center"
                  style={{ left: `${calculateTimelinePosition(splitHandleState.position, duration, zoom)}%` }}
                >
                  {/* Linha de divisão */}
                  <div className="absolute w-0.5 h-full bg-red-500 shadow-lg" />
                  
                  {/* Handle arrastável */}
                  <div
                    className={`w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-grab hover:scale-110 transition-transform ${
                      splitHandleState.isDragging ? 'cursor-grabbing animate-pulse ring-2 ring-red-300' : ''
                    }`}
                    onMouseDown={handleSplitHandleDragStart}
                    title="✂️ Arrastar para dividir"
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ✂️ {formatTime(splitHandleState.position)}
                  </div>
                </div>
              )}
              
              {/* BLOCOS CRIADOS PELA DIVISÃO */}
              {splitBlocks.map(block => (
                <div
                  key={block.id}
                  className={`absolute top-0 h-full rounded-lg border-2 border-white/50 cursor-grab hover:brightness-110 transition-all duration-200 ${
                    block.isDragging ? 'cursor-grabbing shadow-2xl ring-4 ring-white/30 z-30' : 'z-20'
                  }`}
                  style={{
                    left: `${calculateTimelinePosition(block.start, duration, zoom)}%`,
                    width: `${calculateTimelinePosition(block.end - block.start, duration, zoom)}%`,
                    backgroundColor: block.color,
                    minWidth: '40px'
                  }}
                  onMouseDown={(e) => handleBlockDragStart(e, block.id)}
                  title={`${block.name} (${formatTime(block.start)} - ${formatTime(block.end)})`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold bg-black/20 rounded-lg">
                    {block.name}
                  </div>
                  
                  {/* Indicador de drag */}
                  {block.isDragging && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full animate-ping" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* ===== TIMELINE MINI ===== */}
        {timelineMode === 'mini' && (
          <div className="flex items-center h-5 px-2 space-x-2">
            {/* Controles compactos */}
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
            
            {/* Barra redimensionável mini */}
            <div 
              ref={progressBarRef}
              className="flex-1 relative h-2 bg-gray-700 rounded-full transition-colors group cursor-pointer"
              title="Timeline com segmento redimensionável"
            >
              <ResizableSegment
                segment={activeSegment}
                duration={duration}
                currentTime={currentTime}
                dragType={
                  startHandleState.isDragging ? 'start' : 
                  endHandleState.isDragging ? 'end' : 
                  moveSegmentState.isDragging ? 'move' : null
                }
                isDragging={startHandleState.isDragging || endHandleState.isDragging || moveSegmentState.isDragging}
                isMainTimeline={false}
                zoom={100}
                formatTime={formatTime}
                onSegmentChange={handleSegmentChange}
                onDragStart={undefined}
                onAreaClick={handleAreaClick}
                containerRef={progressBarRef}
                onStartHandleDragStart={handleStartHandleDragStart}
                onEndHandleDragStart={handleEndHandleDragStart}
                onMoveSegmentDragStart={handleMoveSegmentDragStart}
              />
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
        
        {/* ===== INFORMAÇÕES DA TIMELINE ===== */}
        {timelineMode !== 'mini' && (
          <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg">
            <span>
              Segmento Ativo: {formatTime(activeSegment.start)} - {formatTime(activeSegment.end)} ({formatTime(activeSegment.end - activeSegment.start)})
              {splitHandleState.isVisible && (
                <span className="ml-2 text-red-400">
                  | ✂️ Divisão: {formatTime(splitHandleState.position)}
                </span>
              )}
            </span>
            <span>
              Cortes: {cutSegments.length} | Blocos: {splitBlocks.length} | Zoom: {zoom}% | Duração: {formatTime(duration)}
            </span>
          </div>
        )}
        
        {/* ===== INFORMAÇÕES DOS BLOCOS ===== */}
        {splitBlocks.length > 0 && timelineMode !== 'mini' && (
          <div className="bg-gray-800/50 px-3 py-2 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Blocos Criados:</div>
            <div className="flex flex-wrap gap-2">
              {splitBlocks.map(block => (
                <div
                  key={block.id}
                  className={`flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all ${
                    block.isDragging ? 'bg-white/20 ring-2 ring-white/30' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  style={{ color: block.color }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: block.color }}
                  />
                  <span>{block.name}</span>
                  <span className="text-gray-400">
                    {formatTime(block.start)} - {formatTime(block.end)}
                  </span>
                  <span className="text-gray-500">
                    ({formatTime(block.end - block.start)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegratedTimeline 