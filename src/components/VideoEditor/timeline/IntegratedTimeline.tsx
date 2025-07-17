/**
 * 🎬 INTEGRATED TIMELINE - ClipsForge Pro v2.0
 * 
 * Timeline profissional integrada com sistema de cortes existente
 * Compatível com legendas, narração e galeria
 * 
 * @version 2.0.0 - REFATORAÇÃO COMPLETA
 * @fixes: Sincronização, Drag & Drop, Zoom, Estado unificado
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  ZoomIn, ZoomOut, RotateCcw, 
  CornerUpLeft, CornerUpRight, 
  Split, Scissors, Trash2
} from 'lucide-react'
import { useCustomModal } from '../ui/CustomModal'

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
  uuid: string
  start: number
  end: number
  name: string
  color: string
  isDragging: boolean
  isSelected: boolean
  depth: number
  parentId?: string
  childIds: string[]
  created: number
  lastModified: number
  metadata: {
    originalStart: number
    originalEnd: number
    splitCount: number
    hasChildren: boolean
    isRoot: boolean
  }
}

interface ActiveSegment {
  start: number
  end: number
}

interface ProjectTimeline {
  start: number
  end: number
}

// Interface para sistema de comandos (Undo/Redo)
interface Command {
  id: string
  name: string
  description: string
  timestamp: number
  execute: () => void
  undo: () => void
  data: any
}

interface CommandHistory {
  commands: Command[]
  currentIndex: number
  maxSize: number
}

// Interface para sistema de marcadores
interface Marker {
  id: string
  time: number
  name: string
  description: string
  category: 'todo' | 'approved' | 'review' | 'note' | 'cut' | 'sync'
  color: string
  icon: string
  created: number
  lastModified: number
}

interface MarkerCategory {
  id: string
  name: string
  color: string
  icon: string
  shortcut?: string
}

// Interface para sistema de grupos
interface BlockGroup {
  id: string
  name: string
  color: string
  icon: string
  isCollapsed: boolean
  blockIds: string[]
  parentGroupId?: string
  childGroupIds: string[]
  layer: number
  created: number
  lastModified: number
  metadata: {
    totalDuration: number
    blockCount: number
    hasSubgroups: boolean
    isLocked: boolean
  }
}

interface LayerInfo {
  id: string
  name: string
  color: string
  isVisible: boolean
  isLocked: boolean
  opacity: number
  zIndex: number
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
  onClearAll: () => void
  
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

// Função para gerar UUID único
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Sistema de logs condicionais para produção
const isDevelopment = process.env.NODE_ENV === 'development'
const debugLog = (message: string, ...args: any[]) => {
  if (isDevelopment) {
    console.log(message, ...args)
  }
}
const debugWarn = (message: string, ...args: any[]) => {
  if (isDevelopment) {
    console.warn(message, ...args)
  }
}
const debugError = (message: string, ...args: any[]) => {
  console.error(message, ...args) // Sempre mostrar erros
}

// Sistema de snap-to-grid unificado
const snapToGrid = (time: number, snapInterval: number = 0.5) => {
  return Math.round(time / snapInterval) * snapInterval
}

// Função para criar bloco com interface completa
const createSplitBlock = (
  id: string,
  start: number,
  end: number,
  name: string,
  color: string,
  parentId?: string,
  depth: number = 0
): SplitBlock => {
  const now = Date.now()
  return {
    id,
    uuid: generateUUID(),
    start,
    end,
    name,
    color,
    isDragging: false,
    isSelected: false,
    depth,
    parentId,
    childIds: [],
    created: now,
    lastModified: now,
    metadata: {
      originalStart: start,
      originalEnd: end,
      splitCount: 0,
      hasChildren: false,
      isRoot: !parentId
    }
  }
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
  onClearAll,
  formatTime,
  getTimelinePosition,
  cutHistory
}) => {
  // ===== ESTADOS =====
  const [zoom, setZoom] = useState(100)
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('compact')
  const [activeSegment, setActiveSegment] = useState<ActiveSegment>({ start: 0, end: 0 })
  
  // Estado separado para timeline do projeto (barra amarela editável)
  const [projectTimeline, setProjectTimeline] = useState<ProjectTimeline>({ start: 0, end: 0 })
  
  // Estado para reprodução de bloco individual
  const [playingBlock, setPlayingBlock] = useState<string | null>(null)
  
  // Estado para reprodução seletiva (múltiplos blocos)
  const [selectivePlayback, setSelectivePlayback] = useState<{
    isActive: boolean
    selectedBlocks: string[]
    currentBlockIndex: number
  }>({
    isActive: false,
    selectedBlocks: [],
    currentBlockIndex: 0
  })
  
  // Estado para exportação
  const [exportSettings, setExportSettings] = useState<{
    isExporting: boolean
    quality: 'HD' | 'Full HD' | '4K'
    showPreview: boolean
  }>({
    isExporting: false,
    quality: 'Full HD',
    showPreview: false
  })
  
  // Estado para sistema de comandos (Undo/Redo)
  const [commandHistory, setCommandHistory] = useState<CommandHistory>({
    commands: [],
    currentIndex: -1,
    maxSize: 50
  })
  
  // Estado para mostrar histórico de comandos
  const [showCommandHistory, setShowCommandHistory] = useState(false)
  
  // Estado para sistema de marcadores
  const [markers, setMarkers] = useState<Marker[]>([])
  const [showMarkerPanel, setShowMarkerPanel] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  
  // Estado para sistema de grupos e layers
  const [blockGroups, setBlockGroups] = useState<BlockGroup[]>([])
  const [layers, setLayers] = useState<LayerInfo[]>([
    { id: 'layer-1', name: 'Layer 1', color: '#3b82f6', isVisible: true, isLocked: false, opacity: 100, zIndex: 1 },
    { id: 'layer-2', name: 'Layer 2', color: '#10b981', isVisible: true, isLocked: false, opacity: 100, zIndex: 2 },
    { id: 'layer-3', name: 'Layer 3', color: '#f59e0b', isVisible: true, isLocked: false, opacity: 100, zIndex: 3 }
  ])
  const [showGroupPanel, setShowGroupPanel] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null)
  
  // Categorias de marcadores predefinidas (memoizadas)
  const markerCategories: MarkerCategory[] = useMemo(() => [
    { id: 'todo', name: 'To-Do', color: '#ff6b6b', icon: '📝', shortcut: '1' },
    { id: 'approved', name: 'Aprovado', color: '#51cf66', icon: '✅', shortcut: '2' },
    { id: 'review', name: 'Revisar', color: '#ffd43b', icon: '👁️', shortcut: '3' },
    { id: 'note', name: 'Nota', color: '#74c0fc', icon: '📄', shortcut: '4' },
    { id: 'cut', name: 'Corte', color: '#ff8cc8', icon: '✂️', shortcut: '5' },
    { id: 'sync', name: 'Sincronização', color: '#9775fa', icon: '🔄', shortcut: '6' }
  ], [])
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
    currentX: number
    dropZone: {
      isActive: boolean
      insertIndex: number
      insertTime: number
    }
  }>({
    blockId: null,
    isDragging: false,
    startX: 0,
    startTime: 0,
    currentX: 0,
    dropZone: {
      isActive: false,
      insertIndex: -1,
      insertTime: 0
    }
  })
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  
  // Modal customizado
  const { showModal, ModalComponent } = useCustomModal()
  
  // ===== INICIALIZAÇÃO DOS SEGMENTOS =====
  useEffect(() => {
    if (duration > 0 && activeSegment.start === 0 && activeSegment.end === 0) {
      // Barra AZUL = Espaço total disponível (sempre 0-duration)
      const newActiveSegment = {
        start: 0,        // Início do vídeo
        end: duration    // Fim completo do vídeo
      }
      setActiveSegment(newActiveSegment)
      
      // Barra AMARELA = Timeline do projeto (inicialmente 100%, mas editável)
      const newProjectTimeline = {
        start: 0,        // Início do projeto
        end: duration    // Fim do projeto (editável pelo usuário)
      }
      setProjectTimeline(newProjectTimeline)
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
  
  // ===== CÁLCULO DAS MARCAÇÕES DA RÉGUA (MEMOIZADO) =====
  const calculateRulerMarks = useMemo(() => {
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
  
  const rulerMarks = calculateRulerMarks
  
  // ===== HANDLERS DE CLIQUE =====
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    // Prevenir clique se algum handle estiver sendo arrastado
    const anyDragging = startHandleState.isDragging || endHandleState.isDragging || moveSegmentState.isDragging
    if (!timelineRef.current || anyDragging) return
    
    const { percentage } = getCoordinatesFromEvent(e, timelineRef.current)
    const newTime = calculateTimeFromPosition(percentage, duration, zoom)
    
    // Verificar se clique está dentro da barra amarela (timeline do projeto)
    const isInActiveArea = newTime >= projectTimeline.start && newTime <= projectTimeline.end
    
    if (isInActiveArea) {
    onSeek(newTime)
    } else {
      // Clique na área morta - mover para o início da timeline do projeto
      debugLog('🚫 Clique na área morta - movendo para início da timeline do projeto')
      onSeek(projectTimeline.start)
    }
  }, [zoom, duration, onSeek, projectTimeline, startHandleState.isDragging, endHandleState.isDragging, moveSegmentState.isDragging])
  
  // ===== HANDLERS DE DRAG SEPARADOS =====
  
  // Handler específico para handle de INÍCIO (controla barra amarela)
  const handleStartHandleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setStartHandleState({
      isDragging: true,
      startX: e.clientX,
      initialValue: projectTimeline.start
    })
  }, [projectTimeline.start])
  
  // Handler específico para handle de FIM (controla barra amarela)
  const handleEndHandleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setEndHandleState({
      isDragging: true,
      startX: e.clientX,
      initialValue: projectTimeline.end
    })
  }, [projectTimeline.end])
  
  // Handler específico para MOVER segmento (barra amarela)
  const handleMoveSegmentDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setMoveSegmentState({
      isDragging: true,
      startX: e.clientX,
      startSegment: { ...projectTimeline }
    })
  }, [projectTimeline])
  
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
    
    // Limitar movimento dentro da timeline do projeto (barra amarela)
    const constrainedTime = Math.max(
      projectTimeline.start + 0.1,
      Math.min(projectTimeline.end - 0.1, newTime)
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
  
  // Cores disponíveis para os blocos (memoizadas)
  const blockColors = useMemo(() => [
    '#10B981', // Verde
    '#8B5CF6', // Roxo
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#3B82F6', // Azul
    '#EC4899', // Rosa
    '#6366F1', // Indigo
    '#14B8A6'  // Teal
  ], [])



  // Função para dividir na timeline do projeto (raiz)
  const createSplitBlocks = useCallback(() => {
    if (!splitHandleState.isVisible) return
    
    const splitTime = splitHandleState.position
    const timestamp = Date.now()
    const blockId1 = `block-${timestamp}-1`
    const blockId2 = `block-${timestamp}-2`
    
    const newBlocks: SplitBlock[] = [
      createSplitBlock(
        blockId1,
        projectTimeline.start,
        splitTime,
        `Bloco ${splitBlocks.length + 1}`,
        blockColors[splitBlocks.length % blockColors.length],
        undefined,
        0
      ),
      createSplitBlock(
        blockId2,
        splitTime,
        projectTimeline.end,
        `Bloco ${splitBlocks.length + 2}`,
        blockColors[(splitBlocks.length + 1) % blockColors.length],
        undefined,
        0
      )
    ]
    
    setSplitBlocks(prev => [...prev, ...newBlocks])
    
    // Ocultar handle de divisão após criar blocos
    setSplitHandleState(prev => ({ ...prev, isVisible: false }))
    
    debugLog('🎬 Blocos raiz criados:', newBlocks)
  }, [splitHandleState.isVisible, splitHandleState.position, projectTimeline, splitBlocks.length])
  
  // Função para reproduzir bloco específico
  const playSpecificBlock = useCallback((blockId: string) => {
    const block = splitBlocks.find(b => b.id === blockId)
    if (block) {
      setPlayingBlock(blockId)
      setSelectivePlayback(prev => ({ ...prev, isActive: false })) // Desativar reprodução seletiva
      onSeek(block.start)
      if (!isPlaying) {
        onPlay()
      }
      debugLog('🎬 Reproduzindo bloco:', block.name, `(${formatTime(block.start)} - ${formatTime(block.end)})`)
    }
  }, [splitBlocks, onSeek, onPlay, isPlaying, formatTime])
  
  // Função para selecionar/deselecionar bloco com Ctrl+Click
  const toggleBlockSelection = useCallback((blockId: string, isCtrlPressed: boolean) => {
    setSplitBlocks(prev => prev.map(block => {
      if (block.id === blockId) {
        return { ...block, isSelected: isCtrlPressed ? !block.isSelected : true, lastModified: Date.now() }
      }
      // Se não é Ctrl+Click, deselecionar outros blocos
      return isCtrlPressed ? block : { ...block, isSelected: false }
    }))
  }, [])
  
  // Função para reprodução seletiva (blocos selecionados)
  const playSelectedBlocks = useCallback(() => {
    const selectedBlocks = splitBlocks.filter(b => b.isSelected).sort((a, b) => a.start - b.start)
    if (selectedBlocks.length === 0) return
    
    setSelectivePlayback({
      isActive: true,
      selectedBlocks: selectedBlocks.map(b => b.id),
      currentBlockIndex: 0
    })
    
    setPlayingBlock(null) // Desativar reprodução individual
    onSeek(selectedBlocks[0].start)
    if (!isPlaying) {
      onPlay()
    }
    
    console.log('🎬 Reprodução seletiva:', selectedBlocks.map(b => b.name).join(' → '))
  }, [splitBlocks, onSeek, onPlay, isPlaying])
  
  // Função para selecionar todos os blocos
  const selectAllBlocks = useCallback(() => {
    setSplitBlocks(prev => prev.map(block => ({ 
      ...block, 
      isSelected: true, 
      lastModified: Date.now() 
    })))
  }, [])
  
  // Função para deselecionar todos os blocos
  const deselectAllBlocks = useCallback(() => {
    setSplitBlocks(prev => prev.map(block => ({ 
      ...block, 
      isSelected: false, 
      lastModified: Date.now() 
    })))
  }, [])
  
  // Função para calcular duração total dos blocos selecionados
  const getSelectedBlocksTotalDuration = useCallback(() => {
    const selectedBlocks = splitBlocks.filter(b => b.isSelected)
    return selectedBlocks.reduce((total, block) => total + (block.end - block.start), 0)
  }, [splitBlocks])
  
  // Função para gerar timeline final (apenas blocos selecionados)
  const generateFinalTimeline = useCallback(() => {
    const selectedBlocks = splitBlocks.filter(b => b.isSelected).sort((a, b) => a.start - b.start)
    if (selectedBlocks.length === 0) return []
    
    // Criar timeline consecutiva
    let currentTime = 0
    return selectedBlocks.map(block => {
      const duration = block.end - block.start
      const finalBlock = {
        ...block,
        originalStart: block.start,
        originalEnd: block.end,
        start: currentTime,
        end: currentTime + duration
      }
      currentTime += duration
      return finalBlock
    })
  }, [splitBlocks])
  
  // Função para exportar blocos selecionados
  const exportSelectedBlocks = useCallback(async () => {
    const selectedBlocks = splitBlocks.filter(b => b.isSelected)
    if (selectedBlocks.length === 0) {
      alert('⚠️ Selecione pelo menos um bloco para exportar!')
      return
    }
    
    setExportSettings(prev => ({ ...prev, isExporting: true }))
    
    try {
      const finalTimeline = generateFinalTimeline()
      const totalDuration = getSelectedBlocksTotalDuration()
      
      // Simular processo de exportação (na vida real seria FFmpeg ou similar)
      console.log('🎬 Iniciando exportação...')
      console.log('📊 Blocos selecionados:', selectedBlocks.length)
      console.log('⏱️ Duração total:', formatTime(totalDuration))
      console.log('🎯 Qualidade:', exportSettings.quality)
      console.log('🎞️ Timeline final:', finalTimeline)
      
      // Aguardar simulação (3 segundos)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Gerar informações do arquivo exportado
      const exportInfo = {
        filename: `clipsforge_export_${Date.now()}.mp4`,
        duration: totalDuration,
        blocks: selectedBlocks.length,
        quality: exportSettings.quality,
        size: Math.round(totalDuration * 2.5), // MB estimado
        timeline: finalTimeline
      }
      
      // Simular download (na vida real seria o arquivo real)
      const exportData = JSON.stringify(exportInfo, null, 2)
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clipsforge_timeline_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert(`✅ Exportação concluída!\n📱 Arquivo: ${exportInfo.filename}\n⏱️ Duração: ${formatTime(totalDuration)}\n📊 Blocos: ${selectedBlocks.length}\n💾 Tamanho: ~${exportInfo.size}MB`)
      
    } catch (error) {
      console.error('❌ Erro na exportação:', error)
      alert('❌ Erro durante a exportação. Tente novamente.')
    } finally {
      setExportSettings(prev => ({ ...prev, isExporting: false }))
    }
  }, [splitBlocks, exportSettings.quality, generateFinalTimeline, getSelectedBlocksTotalDuration, formatTime])
  
  // Função para alternar preview da timeline final
  const toggleFinalPreview = useCallback(() => {
    setExportSettings(prev => ({ ...prev, showPreview: !prev.showPreview }))
  }, [])
  
  // ===== SISTEMA DE COMANDOS (UNDO/REDO) =====
  const executeCommand = useCallback((command: Command) => {
    // Executar comando
    command.execute()
    
    // Atualizar histórico
    setCommandHistory(prev => {
      const newCommands = [...prev.commands]
      
      // Remover comandos após o índice atual (quando fazemos undo e depois uma nova ação)
      if (prev.currentIndex < prev.commands.length - 1) {
        newCommands.splice(prev.currentIndex + 1)
      }
      
      // Adicionar novo comando
      newCommands.push(command)
      
      // Limitar tamanho máximo
      if (newCommands.length > prev.maxSize) {
        newCommands.shift()
      }
      
      return {
        ...prev,
        commands: newCommands,
        currentIndex: newCommands.length - 1
      }
    })
    
    console.log('📝 Comando executado:', command.name)
  }, [])
  
  const undoCommand = useCallback(() => {
    if (commandHistory.currentIndex < 0) return
    
    const command = commandHistory.commands[commandHistory.currentIndex]
    if (command) {
      command.undo()
      setCommandHistory(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1
      }))
      console.log('↩️ Comando desfeito:', command.name)
    }
  }, [commandHistory.commands, commandHistory.currentIndex])
  
  const redoCommand = useCallback(() => {
    if (commandHistory.currentIndex >= commandHistory.commands.length - 1) return
    
    const command = commandHistory.commands[commandHistory.currentIndex + 1]
    if (command) {
      command.execute()
      setCommandHistory(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }))
      console.log('↪️ Comando refeito:', command.name)
    }
  }, [commandHistory.commands, commandHistory.currentIndex])
  
  const clearCommandHistory = useCallback(() => {
    setCommandHistory({
      commands: [],
      currentIndex: -1,
      maxSize: 50
    })
    console.log('🗑️ Histórico de comandos limpo')
  }, [])
  
  // Função para criar comando de divisão de bloco
  const createSplitCommand = useCallback((blockId: string, splitTime: number) => {
    const originalBlock = splitBlocks.find(b => b.id === blockId)
    if (!originalBlock) return null
    
    const newBlock1Id = `${blockId}_1`
    const newBlock2Id = `${blockId}_2`
    
    const command: Command = {
      id: generateUUID(),
      name: 'Dividir Bloco',
      description: `Dividir "${originalBlock.name}" em ${formatTime(splitTime)}`,
      timestamp: Date.now(),
      execute: () => {
        setSplitBlocks(prev => {
          const blockIndex = prev.findIndex(b => b.id === blockId)
          if (blockIndex === -1) return prev
          
          const block = prev[blockIndex]
          const newBlocks = [...prev]
          
          // Substituir bloco original por dois novos
          newBlocks[blockIndex] = createSplitBlock(
            newBlock1Id,
            block.start,
            splitTime,
            `${block.name} (1)`,
            block.color,
            block.parentId,
            block.depth
          )
          
          newBlocks.splice(blockIndex + 1, 0, createSplitBlock(
            newBlock2Id,
            splitTime,
            block.end,
            `${block.name} (2)`,
            block.color,
            block.parentId,
            block.depth
          ))
          
          return newBlocks
        })
      },
      undo: () => {
        setSplitBlocks(prev => prev.filter(b => b.id !== newBlock1Id && b.id !== newBlock2Id).concat([originalBlock]))
      },
      data: { originalBlock, splitTime, newBlock1Id, newBlock2Id }
    }
    
    return command
  }, [splitBlocks, formatTime])
  
  // Função para criar comando de exclusão de bloco
  const createDeleteCommand = useCallback((blockId: string) => {
    const blockToDelete = splitBlocks.find(b => b.id === blockId)
    if (!blockToDelete) return null
    
    const blockDuration = blockToDelete.end - blockToDelete.start
    const originalTimeline = { ...projectTimeline }
    const originalBlocks = [...splitBlocks]
    
    const command: Command = {
      id: generateUUID(),
      name: 'Deletar Bloco',
      description: `Deletar "${blockToDelete.name}" (-${formatTime(blockDuration)})`,
      timestamp: Date.now(),
      execute: () => {
        // Parar reprodução se estiver reproduzindo este bloco
        if (playingBlock === blockId) {
          setPlayingBlock(null)
          onPause()
        }
        
        // Remover bloco
        setSplitBlocks(prev => prev.filter(block => block.id !== blockId))
        
        // Atualizar timeline do projeto
        setProjectTimeline(prev => ({
          start: prev.start,
          end: Math.max(prev.start + 1, prev.end - blockDuration)
        }))
        
        // Reajustar posições dos outros blocos
        setSplitBlocks(prev => prev.map(block => {
          if (block.start > blockToDelete.end) {
            return {
              ...block,
              start: block.start - blockDuration,
              end: block.end - blockDuration,
              lastModified: Date.now()
            }
          }
          return block
        }))
      },
      undo: () => {
        // Restaurar timeline original
        setProjectTimeline(originalTimeline)
        // Restaurar blocos originais
        setSplitBlocks(originalBlocks)
        console.log('🔄 Bloco restaurado:', blockToDelete.name)
      },
      data: { blockToDelete, blockDuration, originalTimeline, originalBlocks }
    }
    
    return command
  }, [splitBlocks, projectTimeline, playingBlock, onPause, formatTime])
  
  // Função para criar comando de seleção de blocos
  const createSelectionCommand = useCallback((blockIds: string[], action: 'select' | 'deselect') => {
    const originalStates = splitBlocks.map(block => ({ id: block.id, isSelected: block.isSelected }))
    
    const command: Command = {
      id: generateUUID(),
      name: action === 'select' ? 'Selecionar Blocos' : 'Deselecionar Blocos',
      description: `${action === 'select' ? 'Selecionar' : 'Deselecionar'} ${blockIds.length} blocos`,
      timestamp: Date.now(),
      execute: () => {
        setSplitBlocks(prev => prev.map(block => ({
          ...block,
          isSelected: blockIds.includes(block.id) ? (action === 'select') : block.isSelected,
          lastModified: Date.now()
        })))
      },
      undo: () => {
        setSplitBlocks(prev => prev.map(block => {
          const originalState = originalStates.find(s => s.id === block.id)
          return {
            ...block,
            isSelected: originalState?.isSelected || false,
            lastModified: Date.now()
          }
        }))
      },
      data: { blockIds, action, originalStates }
    }
    
    return command
  }, [splitBlocks])
  
  // Função para dividir um bloco específico (usando sistema de comandos)
  const splitSpecificBlock = useCallback((blockId: string, splitTime: number) => {
    const block = splitBlocks.find(b => b.id === blockId)
    if (!block) return
    
    // Validar se o tempo está dentro do bloco
    if (splitTime <= block.start || splitTime >= block.end) {
      console.warn('⚠️ Tempo de divisão inválido:', splitTime, 'para bloco', block.start, '-', block.end)
      return
    }
    
    // Criar e executar comando de divisão
    const command = createSplitCommand(blockId, splitTime)
    if (command) {
      executeCommand(command)
    }
  }, [splitBlocks, createSplitCommand, executeCommand])
  
  // Função para deletar bloco usando sistema de comandos
  const deleteBlockWithCommand = useCallback((blockId: string) => {
    const command = createDeleteCommand(blockId)
    if (command) {
      executeCommand(command)
    }
  }, [createDeleteCommand, executeCommand])
  
  // Função para selecionar todos os blocos usando sistema de comandos
  const selectAllBlocksWithCommand = useCallback(() => {
    const allBlockIds = splitBlocks.map(b => b.id)
    const command = createSelectionCommand(allBlockIds, 'select')
    if (command) {
      executeCommand(command)
    }
  }, [splitBlocks, createSelectionCommand, executeCommand])
  
  // Função para deselecionar todos os blocos usando sistema de comandos
  const deselectAllBlocksWithCommand = useCallback(() => {
    const allBlockIds = splitBlocks.map(b => b.id)
    const command = createSelectionCommand(allBlockIds, 'deselect')
    if (command) {
      executeCommand(command)
    }
  }, [splitBlocks, createSelectionCommand, executeCommand])
  
  // ===== SISTEMA DE MARCADORES =====
  const createMarker = useCallback((time: number, category: MarkerCategory['id'] = 'note', name?: string, description?: string) => {
    const markerCategory = markerCategories.find(c => c.id === category) || markerCategories[3] // default 'note'
    const newMarker: Marker = {
      id: generateUUID(),
      time: snapToGrid(time), // Usar snap unificado
      name: name || `Marcador ${markers.length + 1}`,
      description: description || '',
      category: category as Marker['category'],
      color: markerCategory.color,
      icon: markerCategory.icon,
      created: Date.now(),
      lastModified: Date.now()
    }
    
    setMarkers(prev => [...prev, newMarker].sort((a, b) => a.time - b.time))
    debugLog('📍 Marcador criado:', newMarker.name, 'em', formatTime(newMarker.time))
    return newMarker.id
  }, [markers.length, markerCategories, formatTime])
  
  const deleteMarker = useCallback((markerId: string) => {
    setMarkers(prev => prev.filter(m => m.id !== markerId))
    if (selectedMarker === markerId) {
      setSelectedMarker(null)
    }
    debugLog('🗑️ Marcador removido:', markerId)
  }, [selectedMarker])
  
  const updateMarker = useCallback((markerId: string, updates: Partial<Marker>) => {
    setMarkers(prev => prev.map(marker => 
      marker.id === markerId 
        ? { ...marker, ...updates, lastModified: Date.now() }
        : marker
    ))
  }, [])
  
  const jumpToMarker = useCallback((markerId: string) => {
    const marker = markers.find(m => m.id === markerId)
    if (marker) {
      onSeek(marker.time)
      setSelectedMarker(markerId)
      debugLog('🎯 Navegando para marcador:', marker.name, 'em', formatTime(marker.time))
    }
  }, [markers, onSeek, formatTime])
  
  const getNextMarker = useCallback((currentTime: number) => {
    return markers.find(m => m.time > currentTime)
  }, [markers])
  
  const getPreviousMarker = useCallback((currentTime: number) => {
    return markers.filter(m => m.time < currentTime).pop()
  }, [markers])
  
  const jumpToNextMarker = useCallback(() => {
    const nextMarker = getNextMarker(currentTime)
    if (nextMarker) {
      jumpToMarker(nextMarker.id)
    } else {
      debugLog('⚠️ Nenhum marcador encontrado após o tempo atual')
    }
  }, [currentTime, getNextMarker, jumpToMarker])
  
  const jumpToPreviousMarker = useCallback(() => {
    const prevMarker = getPreviousMarker(currentTime)
    if (prevMarker) {
      jumpToMarker(prevMarker.id)
    } else {
      debugLog('⚠️ Nenhum marcador encontrado antes do tempo atual')
    }
  }, [currentTime, getPreviousMarker, jumpToMarker])
  
  const addMarkerAtCurrentTime = useCallback((category: MarkerCategory['id'] = 'note') => {
    const markerId = createMarker(currentTime, category)
    setSelectedMarker(markerId)
    return markerId
  }, [currentTime, createMarker])
  
  // ===== SISTEMA DE GRUPOS E LAYERS =====
  const createGroup = useCallback((name: string, blockIds: string[], parentGroupId?: string, layer: number = 1) => {
    const blocks = splitBlocks.filter(b => blockIds.includes(b.id))
    if (blocks.length === 0) return null
    
    const totalDuration = blocks.reduce((sum, block) => sum + (block.end - block.start), 0)
    const groupColors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#f97316']
    
    const newGroup: BlockGroup = {
      id: generateUUID(),
      name: name || `Grupo ${blockGroups.length + 1}`,
      color: groupColors[blockGroups.length % groupColors.length],
      icon: '📁',
      isCollapsed: false,
      blockIds,
      parentGroupId,
      childGroupIds: [],
      layer,
      created: Date.now(),
      lastModified: Date.now(),
      metadata: {
        totalDuration,
        blockCount: blocks.length,
        hasSubgroups: false,
        isLocked: false
      }
    }
    
    setBlockGroups(prev => {
      const updated = [...prev, newGroup]
      
      // Atualizar grupo pai se existir
      if (parentGroupId) {
        return updated.map(group => 
          group.id === parentGroupId 
            ? { ...group, childGroupIds: [...group.childGroupIds, newGroup.id], metadata: { ...group.metadata, hasSubgroups: true } }
            : group
        )
      }
      
      return updated
    })
    
    debugLog('📁 Grupo criado:', newGroup.name, 'com', blockIds.length, 'blocos')
    return newGroup.id
  }, [splitBlocks, blockGroups.length])
  
  const deleteGroup = useCallback((groupId: string) => {
    const group = blockGroups.find(g => g.id === groupId)
    if (!group) return
    
    setBlockGroups(prev => {
      let updated = prev.filter(g => g.id !== groupId)
      
      // Remover das referências de grupos pais
      if (group.parentGroupId) {
        updated = updated.map(g => 
          g.id === group.parentGroupId 
            ? { 
                ...g, 
                childGroupIds: g.childGroupIds.filter(id => id !== groupId),
                metadata: { ...g.metadata, hasSubgroups: g.childGroupIds.length > 1 }
              }
            : g
        )
      }
      
      // Remover grupos filhos
      group.childGroupIds.forEach(childId => {
        updated = updated.filter(g => g.id !== childId)
      })
      
      return updated
    })
    
    if (selectedGroup === groupId) {
      setSelectedGroup(null)
    }
    
    debugLog('🗑️ Grupo removido:', group.name)
  }, [blockGroups, selectedGroup])
  
  const toggleGroupCollapse = useCallback((groupId: string) => {
    setBlockGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, isCollapsed: !group.isCollapsed, lastModified: Date.now() }
        : group
    ))
  }, [])
  
  const updateGroup = useCallback((groupId: string, updates: Partial<BlockGroup>) => {
    setBlockGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, ...updates, lastModified: Date.now() }
        : group
    ))
  }, [])
  
  const addBlockToGroup = useCallback((blockId: string, groupId: string) => {
    const block = splitBlocks.find(b => b.id === blockId)
    if (!block) return
    
    setBlockGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            blockIds: [...group.blockIds, blockId],
            metadata: { 
              ...group.metadata, 
              blockCount: group.metadata.blockCount + 1,
              totalDuration: group.metadata.totalDuration + (block.end - block.start)
            },
            lastModified: Date.now()
          }
        : group
    ))
  }, [splitBlocks])
  
  const removeBlockFromGroup = useCallback((blockId: string, groupId: string) => {
    const block = splitBlocks.find(b => b.id === blockId)
    if (!block) return
    
    setBlockGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            blockIds: group.blockIds.filter(id => id !== blockId),
            metadata: { 
              ...group.metadata, 
              blockCount: group.metadata.blockCount - 1,
              totalDuration: group.metadata.totalDuration - (block.end - block.start)
            },
            lastModified: Date.now()
          }
        : group
    ))
  }, [splitBlocks])
  
  const getBlockGroup = useCallback((blockId: string) => {
    return blockGroups.find(group => group.blockIds.includes(blockId))
  }, [blockGroups])
  
  const getGroupBlocks = useCallback((groupId: string) => {
    const group = blockGroups.find(g => g.id === groupId)
    if (!group) return []
    
    return splitBlocks.filter(block => group.blockIds.includes(block.id))
  }, [blockGroups, splitBlocks])
  
  const selectGroup = useCallback((groupId: string) => {
    const group = blockGroups.find(g => g.id === groupId)
    if (!group) return
    
    // Selecionar todos os blocos do grupo
    setSplitBlocks(prev => prev.map(block => ({
      ...block,
      isSelected: group.blockIds.includes(block.id),
      lastModified: Date.now()
    })))
    
    setSelectedGroup(groupId)
          debugLog('📁 Grupo selecionado:', group.name, 'com', group.blockIds.length, 'blocos')
  }, [blockGroups])
  
  const createGroupFromSelected = useCallback(async () => {
    const selectedBlocks = splitBlocks.filter(b => b.isSelected)
    if (selectedBlocks.length < 2) {
      debugWarn('⚠️ Selecione pelo menos 2 blocos para criar um grupo')
      return null
    }
    
    const groupName = await showModal(
      'Criar Novo Grupo',
      'Digite o nome do grupo...',
      `Grupo ${blockGroups.length + 1}`
    )
    if (!groupName) return null
    
    const groupId = createGroup(groupName, selectedBlocks.map(b => b.id))
    if (groupId) {
      setSelectedGroup(groupId)
      setShowGroupPanel(true)
    }
    
    return groupId
  }, [splitBlocks, blockGroups.length, createGroup, showModal])
  
  const duplicateGroup = useCallback((groupId: string) => {
    const group = blockGroups.find(g => g.id === groupId)
    if (!group) return
    
    const groupBlocks = getGroupBlocks(groupId)
    const newBlockIds: string[] = []
    
    // Duplicar todos os blocos do grupo
    groupBlocks.forEach(block => {
      const newBlock = createSplitBlock(
        generateUUID(),
        block.end + 0.5, // Posicionar após o bloco original
        block.end + 0.5 + (block.end - block.start),
        `${block.name} (Cópia)`,
        block.color,
        block.parentId,
        block.depth
      )
      
      setSplitBlocks(prev => [...prev, newBlock])
      newBlockIds.push(newBlock.id)
    })
    
    // Criar novo grupo com os blocos duplicados
    const newGroupId = createGroup(`${group.name} (Cópia)`, newBlockIds, group.parentGroupId, group.layer)
    if (newGroupId) {
      setSelectedGroup(newGroupId)
    }
    
    console.log('📁 Grupo duplicado:', group.name)
  }, [blockGroups, getGroupBlocks, createGroup])
  
  const moveGroupToLayer = useCallback((groupId: string, targetLayer: number) => {
    updateGroup(groupId, { layer: targetLayer })
    
    // Mover todos os blocos do grupo para a nova layer
    const group = blockGroups.find(g => g.id === groupId)
    if (group) {
      setSplitBlocks(prev => prev.map(block => 
        group.blockIds.includes(block.id) 
          ? { ...block, depth: targetLayer, lastModified: Date.now() }
          : block
      ))
    }
    
    console.log('📁 Grupo movido para layer:', targetLayer)
  }, [blockGroups, updateGroup])
  
  // Atalhos de teclado otimizados - Undo/Redo
  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault()
              redoCommand()
            } else {
              e.preventDefault()
              undoCommand()
            }
            break
          case 'y':
            e.preventDefault()
            redoCommand()
            break
        }
      }
    }
    
    window.addEventListener('keydown', handleUndoRedo)
    return () => window.removeEventListener('keydown', handleUndoRedo)
  }, [undoCommand, redoCommand])

  // Atalhos de teclado otimizados - Painéis
  useEffect(() => {
    const handlePanelShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'm':
            e.preventDefault()
            setShowMarkerPanel(prev => !prev)
            break
          case 'u':
            e.preventDefault()
            setShowGroupPanel(prev => !prev)
            break
        }
      }
    }
    
    window.addEventListener('keydown', handlePanelShortcuts)
    return () => window.removeEventListener('keydown', handlePanelShortcuts)
  }, [])

  // Atalhos de teclado otimizados - Marcadores
  const handleMarkerShortcuts = useCallback((e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      switch (e.key) {
        case 'm':
          e.preventDefault()
          addMarkerAtCurrentTime('note')
          break
        case 'M':
          e.preventDefault()
          jumpToNextMarker()
          break
        case ',':
          e.preventDefault()
          jumpToPreviousMarker()
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          e.preventDefault()
          const categoryIndex = parseInt(e.key) - 1
          const category = markerCategories[categoryIndex]
          if (category) {
            addMarkerAtCurrentTime(category.id)
          }
          break
      }
    }
  }, [addMarkerAtCurrentTime, jumpToNextMarker, jumpToPreviousMarker, markerCategories])

  // Atalhos de teclado otimizados - Grupos
  const handleGroupShortcuts = useCallback((e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      switch (e.key) {
        case 'g':
          e.preventDefault()
          createGroupFromSelected()
          break
        case 'u':
          e.preventDefault()
          if (selectedGroup) {
            toggleGroupCollapse(selectedGroup)
          }
          break
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (e.key === 'g') {
        e.preventDefault()
        createGroupFromSelected()
      }
    }
  }, [createGroupFromSelected, selectedGroup, toggleGroupCollapse])

  useEffect(() => {
    window.addEventListener('keydown', handleMarkerShortcuts)
    window.addEventListener('keydown', handleGroupShortcuts)
    return () => {
      window.removeEventListener('keydown', handleMarkerShortcuts)
      window.removeEventListener('keydown', handleGroupShortcuts)
    }
  }, [handleMarkerShortcuts, handleGroupShortcuts])
  
  // Função para parar reprodução de bloco
  const stopBlockPlayback = useCallback(() => {
    setPlayingBlock(null)
    debugLog('⏹️ Parou reprodução de bloco')
  }, [])
  

  

  
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
      startTime: block.start,
      currentX: e.clientX,
      dropZone: {
        isActive: false,
        insertIndex: -1,
        insertTime: 0
      }
    })
    
    // Marcar bloco como sendo arrastado e atualizar lastModified
    setSplitBlocks(prev => prev.map(b => 
      b.id === blockId 
        ? { ...b, isDragging: true, lastModified: Date.now() } 
        : b
    ))
  }, [splitBlocks])
  
  // Função para deletar bloco (remove do vídeo original)
  const deleteBlock = useCallback((blockId: string) => {
    const blockToDelete = splitBlocks.find(b => b.id === blockId)
    if (!blockToDelete) return
    
    // Parar reprodução se estiver reproduzindo este bloco
    if (playingBlock === blockId) {
      setPlayingBlock(null)
      onPause()
    }
    
    // Calcular duração do bloco a ser removido
    const blockDuration = blockToDelete.end - blockToDelete.start
    
    // Remover bloco da lista
    setSplitBlocks(prev => prev.filter(block => block.id !== blockId))
    
    // Atualizar timeline do projeto (diminuir barra amarela)
    setProjectTimeline(prev => ({
      start: prev.start,
      end: Math.max(prev.start + 1, prev.end - blockDuration) // Diminuir duração
    }))
    
    // Reajustar posições dos outros blocos (mover para a esquerda)
    setSplitBlocks(prev => prev.map(block => {
      if (block.start > blockToDelete.end) {
        // Bloco está após o deletado - mover para a esquerda
        return {
          ...block,
          start: block.start - blockDuration,
          end: block.end - blockDuration,
          lastModified: Date.now()
        }
      }
      return block
    }))
    
    console.log('🗑️ Bloco deletado:', blockToDelete.name, `(-${formatTime(blockDuration)} do vídeo)`)
  }, [splitBlocks, playingBlock, onPause, formatTime])
  

  
  
  
  const handleBlockMove = useCallback((e: MouseEvent) => {
    if (!blockDragState.isDragging || !blockDragState.blockId) return
    
    const container = timelineMode === 'mini' ? progressBarRef.current : timelineRef.current
    if (!container) return
    
    const block = splitBlocks.find(b => b.id === blockDragState.blockId)
    if (!block) return
    
    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const percentage = (mouseX / rect.width) * 100
    const scaleFactor = timelineMode === 'mini' ? 1 : (zoom / 100)
    const newTime = (percentage / scaleFactor / 100) * duration
    
    // Atualizar posição atual do mouse
    setBlockDragState(prev => ({ ...prev, currentX: e.clientX }))
    
    // Calcular drop zone (onde o bloco seria inserido)
    const otherBlocks = splitBlocks.filter(b => b.id !== blockDragState.blockId).sort((a, b) => a.start - b.start)
    let insertIndex = 0
    let insertTime = newTime
    
    // Snap to grid (a cada 0.5 segundos)
    insertTime = Math.round(insertTime * 2) / 2
    
    // Encontrar posição de inserção entre outros blocos
    for (let i = 0; i < otherBlocks.length; i++) {
      if (insertTime <= otherBlocks[i].start) {
        insertIndex = i
        break
      }
      insertIndex = i + 1
    }
    
    // Garantir que não sobreponha outros blocos
    const blockDuration = block.end - block.start
    if (insertIndex > 0 && insertTime < otherBlocks[insertIndex - 1].end) {
      insertTime = otherBlocks[insertIndex - 1].end
    }
    if (insertIndex < otherBlocks.length && insertTime + blockDuration > otherBlocks[insertIndex].start) {
      insertTime = otherBlocks[insertIndex].start - blockDuration
    }
    
    // Garantir que não saia dos limites
    insertTime = Math.max(0, Math.min(duration - blockDuration, insertTime))
    
    const newStart = insertTime
    const newEnd = newStart + blockDuration
    
    // Atualizar drop zone
    setBlockDragState(prev => ({
      ...prev,
      dropZone: {
        isActive: true,
        insertIndex,
        insertTime: newStart
      }
    }))
    
    // Atualizar posição do bloco
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
      startTime: 0,
      currentX: 0,
      dropZone: {
        isActive: false,
        insertIndex: -1,
        insertTime: 0
      }
    })
  }, [blockDragState.isDragging, blockDragState.blockId])

  // Handlers de movimento separados - controla barra amarela (projectTimeline)
  const handleStartHandleMove = useCallback((e: MouseEvent) => {
    if (!startHandleState.isDragging) return
    
    const container = timelineMode === 'mini' ? progressBarRef.current : timelineRef.current
    if (!container) return
    
    const { percentage } = getCoordinatesFromEvent(e, container)
    const newTime = calculateTimeFromPosition(percentage, duration, timelineMode === 'mini' ? 100 : zoom)
    
    // Redimensionar início da barra amarela (não pode passar do fim)
    const newStart = Math.max(0, Math.min(projectTimeline.end - 1, newTime))
    setProjectTimeline(prev => ({ ...prev, start: newStart }))
  }, [startHandleState.isDragging, projectTimeline.end, duration, zoom, timelineMode])
  
  const handleEndHandleMove = useCallback((e: MouseEvent) => {
    if (!endHandleState.isDragging) return
    
    const container = timelineMode === 'mini' ? progressBarRef.current : timelineRef.current
    if (!container) return
    
    const { percentage } = getCoordinatesFromEvent(e, container)
    const newTime = calculateTimeFromPosition(percentage, duration, timelineMode === 'mini' ? 100 : zoom)
    
    // Redimensionar fim da barra amarela (não pode passar do início)
    const newEnd = Math.max(projectTimeline.start + 1, Math.min(duration, newTime))
    setProjectTimeline(prev => ({ ...prev, end: newEnd }))
  }, [endHandleState.isDragging, projectTimeline.start, duration, zoom, timelineMode])
  
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
    
    setProjectTimeline({ start: newStart, end: newEnd })
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
    
    // Sincronizar área amarela com a timeline do projeto
    setProjectTimeline(currentTimeline => {
      onSeek(currentTimeline.start)
      requestAnimationFrame(() => {
        onSetInPoint()
        onSeek(currentTimeline.end)
        requestAnimationFrame(() => onSetOutPoint())
      })
      return currentTimeline
    })
    
    setMoveSegmentState({ isDragging: false, startX: 0, startSegment: { start: 0, end: 0 } })
  }, [moveSegmentState.isDragging, onSeek, onSetInPoint, onSetOutPoint])
  
  // ===== CONTROLE DE REPRODUÇÃO INTELIGENTE =====
  useEffect(() => {
    if (isPlaying) {
      if (selectivePlayback.isActive && selectivePlayback.selectedBlocks.length > 0) {
        // Reprodução seletiva (múltiplos blocos)
        const currentBlockId = selectivePlayback.selectedBlocks[selectivePlayback.currentBlockIndex]
        const currentBlock = splitBlocks.find(b => b.id === currentBlockId)
        
        if (currentBlock) {
          if (currentTime >= currentBlock.end) {
            // Passou para o próximo bloco
            const nextIndex = selectivePlayback.currentBlockIndex + 1
            if (nextIndex < selectivePlayback.selectedBlocks.length) {
              // Próximo bloco
              const nextBlockId = selectivePlayback.selectedBlocks[nextIndex]
              const nextBlock = splitBlocks.find(b => b.id === nextBlockId)
              if (nextBlock) {
                setSelectivePlayback(prev => ({ ...prev, currentBlockIndex: nextIndex }))
                onSeek(nextBlock.start)
                console.log('🎬 Próximo bloco seletivo:', nextBlock.name)
              }
            } else {
              // Terminou todos os blocos selecionados - reiniciar
              setSelectivePlayback(prev => ({ ...prev, currentBlockIndex: 0 }))
              const firstBlock = splitBlocks.find(b => b.id === selectivePlayback.selectedBlocks[0])
              if (firstBlock) {
                onSeek(firstBlock.start)
                console.log('🎬 Reprodução seletiva reiniciada')
              }
            }
          }
          if (currentTime < currentBlock.start) {
            onSeek(currentBlock.start)
          }
        }
      } else if (playingBlock) {
        // Reprodução de bloco individual
        const block = splitBlocks.find(b => b.id === playingBlock)
        if (block) {
          if (currentTime >= block.end) {
            onSeek(block.start) // Loop do bloco
          }
          if (currentTime < block.start) {
            onSeek(block.start)
          }
        }
      } else if (projectTimeline.start !== projectTimeline.end) {
        // Reprodução da timeline do projeto
        if (currentTime >= projectTimeline.end) {
          onSeek(projectTimeline.start)
        }
        if (currentTime < projectTimeline.start) {
          onSeek(projectTimeline.start)
        }
      }
    }
  }, [currentTime, isPlaying, onSeek, projectTimeline, playingBlock, splitBlocks, selectivePlayback])

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
    setProjectTimeline(prev => {
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
          
          {inPoint !== null && outPoint !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Aplicar o corte - mesma função do botão "Limpar" 
                onSetInPoint?.()
                onSetOutPoint?.()
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-xs animate-pulse ml-2"
              title="Aplicar corte na parte selecionada"
            >
              <Scissors size={12} className="mr-1" />
              ✂️ Aplicar Corte
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
              {/* Botão Limpar - sempre visível */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Aplicar o corte - mesma função do botão "Limpar" original
                  onClearAll?.()
                }}
                className={`text-black font-semibold border-yellow-300 ${
                  inPoint !== null && outPoint !== null 
                    ? 'bg-yellow-300 hover:bg-yellow-400 animate-pulse' 
                    : 'bg-yellow-200 hover:bg-yellow-300'
                }`}
                title="Limpar todos os cortes, seleções e marcadores"
              >
                <Scissors size={14} className="mr-2" />
                Aplicar Corte
              </Button>
              
              {/* Seletor de qualidade de exportação */}
              {splitBlocks.some(b => b.isSelected) && (
                <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-2 border border-orange-500/30">
                  <span className="text-xs text-gray-300">Qualidade:</span>
                  <select
                    value={exportSettings.quality}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, quality: e.target.value as 'HD' | 'Full HD' | '4K' }))}
                    className="text-xs bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
                  >
                    <option value="HD">HD (720p)</option>
                    <option value="Full HD">Full HD (1080p)</option>
                    <option value="4K">4K (2160p)</option>
                  </select>
                </div>
              )}
              
              {/* Controles de seleção de blocos */}
              {splitBlocks.length > 0 && (
                <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllBlocksWithCommand}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 text-xs"
                    title="Selecionar todos os blocos"
                  >
                    ✓ Todos
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllBlocksWithCommand}
                    className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500 text-xs"
                    title="Deselecionar todos os blocos"
                  >
                    ✗ Nenhum
                  </Button>
                  
                  {splitBlocks.some(b => b.isSelected) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={playSelectedBlocks}
                        className="bg-green-600 hover:bg-green-700 text-white border-green-500 text-xs animate-pulse"
                        title="Reproduzir apenas blocos selecionados"
                      >
                        ▶️ Reproduzir Selecionados
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFinalPreview}
                        className={`text-white border-purple-500 text-xs ${
                          exportSettings.showPreview ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600/50 hover:bg-purple-600'
                        }`}
                        title="Preview da timeline final"
                      >
                        👁️ Preview Final
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportSelectedBlocks}
                        disabled={exportSettings.isExporting}
                        className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500 text-xs"
                        title={`Exportar ${splitBlocks.filter(b => b.isSelected).length} blocos selecionados`}
                      >
                        {exportSettings.isExporting ? '⏳ Exportando...' : '📤 Exportar'}
                      </Button>
                    </>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    {splitBlocks.filter(b => b.isSelected).length} de {splitBlocks.length} selecionados
                    {splitBlocks.some(b => b.isSelected) && (
                      <span className="ml-2 text-orange-400">
                        | ⏱️ {formatTime(getSelectedBlocksTotalDuration())} final
                      </span>
                    )}
                  </div>
                </div>
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
              

              
              {/* Botão original (quando não há handle vermelho)
              {currentTime >= projectTimeline.start && currentTime <= projectTimeline.end && !splitHandleState.isVisible && (
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
              )} */}
              
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
            
            {/* BOTÕES REMOVIDOS - Controles de Undo/Redo, Marcadores e Grupos */}
            {/* 
            <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
              <Button
                variant="outline"
                size="sm"
                onClick={undoCommand}
                disabled={commandHistory.currentIndex < 0}
                className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                title={`Desfazer ${commandHistory.commands[commandHistory.currentIndex]?.name || ''} (Ctrl+Z)`}
              >
                ↩️ Undo
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={redoCommand}
                disabled={commandHistory.currentIndex >= commandHistory.commands.length - 1}
                className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                title={`Refazer ${commandHistory.commands[commandHistory.currentIndex + 1]?.name || ''} (Ctrl+Y)`}
              >
                ↪️ Redo
              </Button>
              
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommandHistory(!showCommandHistory)}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 text-xs"
                  title="Mostrar/ocultar histórico de comandos"
                >
                  📋 ({commandHistory.commands.length})
                </Button>
              </div>
              
              <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMarkerAtCurrentTime('note')}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 text-xs"
                  title="Adicionar marcador no tempo atual (M)"
                >
                  📍 Marcador
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={jumpToPreviousMarker}
                  disabled={!getPreviousMarker(currentTime)}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  title="Marcador anterior (,)"
                >
                  ⬅️
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={jumpToNextMarker}
                  disabled={!getNextMarker(currentTime)}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  title="Próximo marcador (Shift+M)"
                >
                  ➡️
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMarkerPanel(!showMarkerPanel)}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 text-xs"
                  title="Mostrar/ocultar painel de marcadores (Ctrl+M)"
                >
                  📝 ({markers.length})
                </Button>
              </div>
              
              <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createGroupFromSelected}
                  disabled={splitBlocks.filter(b => b.isSelected).length < 2}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  title="Criar grupo dos blocos selecionados (G ou Ctrl+G)"
                >
                  📁 Grupo
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedGroup && selectGroup(selectedGroup)}
                  disabled={!selectedGroup}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  title="Selecionar blocos do grupo"
                >
                  ✅ Selecionar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedGroup && toggleGroupCollapse(selectedGroup)}
                  disabled={!selectedGroup}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  title="Expandir/colapsar grupo (U)"
                >
                  {selectedGroup && blockGroups.find(g => g.id === selectedGroup)?.isCollapsed ? '📂' : '📁'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGroupPanel(!showGroupPanel)}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 text-xs"
                  title="Mostrar/ocultar painel de grupos (Ctrl+U)"
                >
                  🗂️ ({blockGroups.length})
              </Button>
            </div>
            */}
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
              {/* Fundo da timeline - AZUL (espaço total) */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-700" />
              
              {/* Áreas mortas (antes e depois da timeline do projeto) */}
              <div 
                className="absolute inset-y-0 left-0 bg-gray-600/70 opacity-50"
                style={{ 
                  width: `${calculateTimelinePosition(projectTimeline.start, duration, zoom)}%` 
                }}
                title="Área morta - clique sem efeito"
              />
              <div 
                className="absolute inset-y-0 bg-gray-600/70 opacity-50"
                style={{ 
                  left: `${calculateTimelinePosition(projectTimeline.end, duration, zoom)}%`,
                  width: `${100 - calculateTimelinePosition(projectTimeline.end, duration, zoom)}%`
                }}
                title="Área morta - clique sem efeito"
              />
              
              {/* Barra Redimensionável Principal - Timeline do Projeto (AMARELA) */}
              <ResizableSegment
                segment={projectTimeline}
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
                onSegmentChange={(newSegment) => setProjectTimeline(newSegment)}
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
              
              {/* Marcadores personalizados */}
              {markers.map(marker => (
                <div
                  key={marker.id}
                  className={`absolute top-0 h-full z-30 cursor-pointer group transition-all ${
                    selectedMarker === marker.id ? 'scale-110' : 'hover:scale-105'
                  }`}
                  style={{ left: `${calculateTimelinePosition(marker.time, duration, zoom)}%` }}
                  onClick={(e) => {
                    e.stopPropagation()
                    jumpToMarker(marker.id)
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    // Double click para editar marcador
                    setSelectedMarker(marker.id)
                    setShowMarkerPanel(true)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    deleteMarker(marker.id)
                  }}
                  title={`${marker.icon} ${marker.name}
📅 ${formatTime(marker.time)}
📝 ${marker.description || 'Sem descrição'}
🏷️ ${markerCategories.find(c => c.id === marker.category)?.name}
🖱️ Click: Navegar | 🖱️🖱️ Double: Editar | 🖱️➡️ Right: Deletar`}
                >
                  {/* Linha do marcador */}
                  <div 
                    className="absolute w-0.5 h-full shadow-lg"
                    style={{ backgroundColor: marker.color }}
                  />
                  
                  {/* Ícone do marcador */}
                  <div 
                    className={`absolute -top-2 -left-3 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm font-bold transition-all ${
                      selectedMarker === marker.id ? 'ring-2 ring-yellow-400 animate-pulse' : 'group-hover:ring-2 group-hover:ring-white/50'
                    }`}
                    style={{ backgroundColor: marker.color }}
                  >
                    {marker.icon}
                  </div>
                  
                  {/* Label do marcador (apenas em timeline expandida) */}
                  {timelineMode === 'expanded' && (
                    <div 
                      className="absolute -bottom-8 -left-8 px-2 py-1 rounded text-xs font-medium text-white shadow-lg max-w-24 truncate opacity-0 group-hover:opacity-100 transition-opacity z-40"
                      style={{ backgroundColor: marker.color }}
                    >
                      {marker.name}
                    </div>
                  )}
                </div>
              ))}
              
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
              
              {/* INDICADOR DE DROP ZONE */}
              {blockDragState.dropZone.isActive && blockDragState.isDragging && (
                <div
                  className="absolute top-0 w-1 h-full bg-yellow-400 shadow-lg z-40 animate-pulse"
                  style={{ 
                    left: `${calculateTimelinePosition(blockDragState.dropZone.insertTime, duration, zoom)}%` 
                  }}
                  title={`Drop zone: ${formatTime(blockDragState.dropZone.insertTime)}`}
                >
                  <div className="absolute -top-2 -left-2 w-5 h-5 bg-yellow-400 rounded-full animate-ping" />
                  <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-yellow-400 rounded-full animate-ping" />
                </div>
              )}
              
              {/* BLOCOS CRIADOS PELA DIVISÃO */}
              {splitBlocks.map(block => {
                const blockGroup = getBlockGroup(block.id)
                const isGroupCollapsed = blockGroup?.isCollapsed || false
                
                return (
                  <div
                    key={block.id}
                    className={`absolute top-0 h-full rounded-lg border-2 transition-all duration-200 ${
                      selectivePlayback.isActive && selectivePlayback.selectedBlocks[selectivePlayback.currentBlockIndex] === block.id
                        ? 'border-purple-400 ring-2 ring-purple-400/50 animate-pulse' 
                        : playingBlock === block.id
                          ? 'border-green-400 ring-2 ring-green-400/50 animate-pulse' 
                          : block.isSelected 
                            ? 'border-yellow-400 ring-2 ring-yellow-400/50' 
                            : 'border-white/50'
                    } ${
                      block.isDragging 
                        ? 'cursor-grabbing shadow-2xl ring-4 ring-yellow-400/50 z-30 transform scale-105 brightness-125' 
                        : 'cursor-grab hover:brightness-110 z-20'
                    } ${
                      blockGroup ? `ring-2 ring-offset-1` : ''
                    } ${
                      isGroupCollapsed ? 'opacity-50' : ''
                    }`}
                                      style={{
                      left: `${calculateTimelinePosition(block.start, duration, zoom)}%`,
                      width: `${calculateTimelinePosition(block.end - block.start, duration, zoom)}%`,
                      backgroundColor: block.color,
                      minWidth: '40px'
                    }}
                  onMouseDown={(e) => {
                    if (e.button === 0) { // Botão esquerdo
                      if (e.altKey) {
                        // Alt+Click - iniciar drag
                        e.preventDefault()
                        handleBlockDragStart(e, block.id)
                      } else if (e.detail === 1) {
                        // Single click - reproduzir bloco ou seleção múltipla
                        const isCtrlPressed = e.ctrlKey || e.metaKey
                        
                        // Use requestAnimationFrame instead of setTimeout to avoid setState during render
                        requestAnimationFrame(() => {
                          if (isCtrlPressed) {
                            // Ctrl+Click - seleção múltipla
                            toggleBlockSelection(block.id, true)
                          } else {
                            // Click normal - reproduzir bloco
                            playSpecificBlock(block.id)
                          }
                        })
                      }
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Double click - dividir bloco
                    const rect = e.currentTarget.getBoundingClientRect()
                    const clickX = e.clientX - rect.left
                    const clickPercentage = clickX / rect.width
                    const splitTime = block.start + (block.end - block.start) * clickPercentage
                    splitSpecificBlock(block.id, splitTime)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    // Right click - deletar bloco
                    deleteBlockWithCommand(block.id)
                  }}
                  title={`${block.name} (${formatTime(block.start)} - ${formatTime(block.end)})
🖱️ Click: Reproduzir | Ctrl+Click: Seleção múltipla | Alt+Drag: Mover bloco
🖱️🖱️ Double: Dividir | 🖱️➡️ Right: Deletar

📍 MARCADORES:
M: Novo marcador | Shift+M: Próximo | ,: Anterior | 1-6: Categorias
Ctrl+M: Painel de marcadores | Click marcador: Navegar

📁 GRUPOS:
G: Criar grupo | Ctrl+G: Criar grupo | U: Expandir/colapsar | Ctrl+U: Painel

${blockGroup ? `📁 GRUPO: ${blockGroup.name} (${blockGroup.isCollapsed ? 'Colapsado' : 'Expandido'})` : ''}
${playingBlock === block.id ? '▶️ REPRODUZINDO ESTE BLOCO' : ''}
${selectivePlayback.isActive && selectivePlayback.selectedBlocks[selectivePlayback.currentBlockIndex] === block.id ? '🎯 REPRODUÇÃO SELETIVA ATIVA' : ''}
${block.isSelected ? '✅ SELECIONADO' : ''}
${block.isDragging ? '🔄 MOVENDO BLOCO' : ''}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold bg-black/20 rounded-lg">
                    <span className="flex items-center space-x-1">
                      {selectivePlayback.isActive && selectivePlayback.selectedBlocks[selectivePlayback.currentBlockIndex] === block.id && (
                        <span className="text-purple-300 animate-bounce">🎯</span>
                      )}
                      {playingBlock === block.id && (
                        <span className="text-green-300 animate-bounce">▶️</span>
                      )}
                      <span>{block.name}</span>
                      {block.metadata.hasChildren && (
                        <span className="text-yellow-300">📁</span>
                      )}
                      {block.depth > 0 && (
                        <span className="text-blue-300">{'→'.repeat(block.depth)}</span>
                      )}
                      {blockGroup && (
                        <span className="text-purple-300" title={`Grupo: ${blockGroup.name}`}>🗂️</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Indicador de grupo */}
                  {blockGroup && (
                    <div 
                      className="absolute -top-1 -left-1 w-3 h-3 rounded-full border border-white/50 flex items-center justify-center text-xs"
                      style={{ backgroundColor: blockGroup.color }}
                      title={`Grupo: ${blockGroup.name}`}
                    >
                      📁
                    </div>
                  )}
                  
                  {/* Indicador de seleção */}
                  {block.isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                  )}
                  
                  {/* Indicador de drag */}
                  {block.isDragging && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full animate-ping" />
                  )}
                  
                  {/* Indicadores de profundidade */}
                  {block.depth > 0 && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-white/30 rounded-l-lg" />
                  )}
                </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* ===== PREVIEW DA TIMELINE FINAL ===== */}
        {exportSettings.showPreview && splitBlocks.some(b => b.isSelected) && timelineMode !== 'mini' && (
          <div className="bg-gradient-to-r from-orange-800 to-orange-700 rounded-lg p-4 border border-orange-500/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <span>📱 Preview da Timeline Final</span>
                <span className="text-xs bg-orange-600 px-2 py-1 rounded">
                  {splitBlocks.filter(b => b.isSelected).length} blocos | {formatTime(getSelectedBlocksTotalDuration())}
                </span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFinalPreview}
                className="text-white hover:bg-orange-600"
                title="Fechar preview"
              >
                ✕
              </Button>
            </div>
            
            <div className="relative h-16 bg-gradient-to-r from-orange-900 to-orange-800 rounded overflow-hidden border border-orange-600/50">
              {generateFinalTimeline().map((block, index) => {
                const totalDuration = getSelectedBlocksTotalDuration()
                const widthPercent = ((block.end - block.start) / totalDuration) * 100
                const leftPercent = (block.start / totalDuration) * 100
                
                return (
                  <div
                    key={`final-${block.id}`}
                    className="absolute top-0 h-full rounded border border-white/30 flex items-center justify-center text-white text-xs font-bold bg-gradient-to-b from-orange-500 to-orange-600 hover:brightness-110 transition-all"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      minWidth: '30px'
                    }}
                    title={`${block.name} | Original: ${formatTime(block.originalStart)}-${formatTime(block.originalEnd)} | Final: ${formatTime(block.start)}-${formatTime(block.end)}`}
                  >
                    <span className="truncate px-1">
                      {index + 1}. {block.name}
                    </span>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-2 text-xs text-orange-200 flex items-center justify-between">
              <span>🎬 Sequência final na ordem de reprodução</span>
              <span>📊 Tamanho estimado: ~{Math.round(getSelectedBlocksTotalDuration() * 2.5)}MB ({exportSettings.quality})</span>
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
                onClick={() => {
                  if (isPlaying) {
                    onPause()
                    stopBlockPlayback()
                  } else {
                    onPlay()
                  }
                }}
                className={`text-white px-1.5 py-0.5 rounded transition-all hover:brightness-110 ${
                  isPlaying ? 'bg-green-600/80 hover:bg-green-600' : 'bg-blue-600/80 hover:bg-blue-600'
                }`}
                title={isPlaying ? "Pausar" : "Reproduzir"}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </Button>
            </div>
            
            {/* Barra redimensionável mini - Timeline do Projeto */}
            <div 
              ref={progressBarRef}
              className="flex-1 relative h-2 bg-blue-700 rounded-full transition-colors group cursor-pointer"
              title="Timeline do projeto (barra amarela)"
            >
              <ResizableSegment
                segment={projectTimeline}
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
                onSegmentChange={(newSegment) => setProjectTimeline(newSegment)}
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
        
        {/* ===== PAINEL DE GRUPOS ===== */}
        {showGroupPanel && (
          <div className="bg-gradient-to-r from-purple-800 to-purple-700 rounded-lg p-4 border border-purple-500/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <span>🗂️ Gerenciador de Grupos</span>
                <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                  {blockGroups.length} grupos | {selectedGroup ? 'Selecionado' : 'Nenhum selecionado'}
                </span>
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={createGroupFromSelected}
                  disabled={splitBlocks.filter(b => b.isSelected).length < 2}
                  className="text-white hover:bg-purple-600 text-xs"
                  title="Criar grupo dos selecionados"
                >
                  ➕ Novo Grupo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGroupPanel(false)}
                  className="text-white hover:bg-purple-600"
                  title="Fechar painel"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            {/* Informações de layers */}
            <div className="flex flex-wrap gap-1 mb-3">
              {layers.map(layer => (
                <div
                  key={layer.id}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-xs border border-purple-500"
                  style={{ backgroundColor: layer.color + '20' }}
                >
                  <div 
                    className="w-3 h-3 rounded-full border border-white/30"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="text-white">{layer.name}</span>
                  <span className="text-purple-200">
                    ({blockGroups.filter(g => g.layer === layer.zIndex).length})
                  </span>
                </div>
              ))}
            </div>
            
            {blockGroups.length === 0 ? (
              <div className="text-center py-8 text-purple-200">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-sm">Nenhum grupo criado ainda</p>
                <p className="text-xs text-purple-300 mt-1">
                  Selecione 2+ blocos e pressione G para criar um grupo
                </p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {blockGroups.map(group => (
                  <div
                    key={group.id}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${
                      selectedGroup === group.id
                        ? 'bg-purple-600 text-white border border-purple-400'
                        : 'bg-purple-700/50 text-purple-200 hover:bg-purple-700'
                    }`}
                    onClick={() => selectGroup(group.id)}
                    title="Clique para selecionar todos os blocos do grupo"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div 
                        className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center text-xs flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      >
                        {group.isCollapsed ? '📂' : '📁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center space-x-1">
                          <span>{group.name}</span>
                          {group.metadata.isLocked && <span>🔒</span>}
                          {group.metadata.hasSubgroups && <span>📁</span>}
                        </div>
                        <div className="text-purple-300 text-xs">
                          {group.metadata.blockCount} blocos | {formatTime(group.metadata.totalDuration)} | Layer {group.layer}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleGroupCollapse(group.id)
                        }}
                        className="text-purple-200 hover:text-white hover:bg-purple-600 p-1 h-auto"
                        title="Expandir/colapsar grupo"
                      >
                        {group.isCollapsed ? '📂' : '📁'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateGroup(group.id)
                        }}
                        className="text-blue-200 hover:text-white hover:bg-blue-600 p-1 h-auto"
                        title="Duplicar grupo"
                      >
                        📋
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation()
                          const newName = await showModal('Editar Grupo', 'Digite o novo nome:', group.name)
                          if (newName && newName !== group.name) {
                            updateGroup(group.id, { name: newName })
                          }
                        }}
                        className="text-purple-200 hover:text-white hover:bg-purple-600 p-1 h-auto"
                        title="Editar grupo"
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteGroup(group.id)
                        }}
                        className="text-red-200 hover:text-white hover:bg-red-600 p-1 h-auto"
                        title="Deletar grupo"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-3 text-xs text-purple-200 flex items-center justify-between">
              <span>💡 G: Novo grupo | U: Expandir/colapsar | Ctrl+G/Ctrl+U: Atalhos</span>
              <span>Click: Selecionar | Drag: Reordenar</span>
            </div>
          </div>
        )}
        
        {/* ===== PAINEL DE MARCADORES ===== */}
        {showMarkerPanel && (
          <div className="bg-gradient-to-r from-blue-800 to-blue-700 rounded-lg p-4 border border-blue-500/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <span>📝 Gerenciador de Marcadores</span>
                <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                  {markers.length} marcadores | {selectedMarker ? 'Selecionado' : 'Nenhum selecionado'}
                </span>
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addMarkerAtCurrentTime('note')}
                  className="text-white hover:bg-blue-600 text-xs"
                  title="Adicionar marcador"
                >
                  ➕ Novo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMarkerPanel(false)}
                  className="text-white hover:bg-blue-600"
                  title="Fechar painel"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            {/* Botões de categoria rápida */}
            <div className="flex flex-wrap gap-1 mb-3">
              {markerCategories.map(category => (
                <Button
                  key={category.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addMarkerAtCurrentTime(category.id)}
                  className="text-white border-blue-500 hover:bg-blue-600 text-xs px-2 py-1"
                  style={{ backgroundColor: category.color + '40' }}
                  title={`Adicionar ${category.name} (${category.shortcut})`}
                >
                  {category.icon} {category.name}
                </Button>
              ))}
            </div>
            
            {markers.length === 0 ? (
              <div className="text-center py-8 text-blue-200">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-sm">Nenhum marcador criado ainda</p>
                <p className="text-xs text-blue-300 mt-1">
                  Pressione M para adicionar um marcador no tempo atual
                </p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {markers.map(marker => {
                  const category = markerCategories.find(c => c.id === marker.category)
                  return (
                    <div
                      key={marker.id}
                      className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${
                        selectedMarker === marker.id
                          ? 'bg-blue-600 text-white border border-blue-400'
                          : 'bg-blue-700/50 text-blue-200 hover:bg-blue-700'
                      }`}
                      onClick={() => jumpToMarker(marker.id)}
                      title="Clique para navegar para este marcador"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div 
                          className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center text-xs flex-shrink-0"
                          style={{ backgroundColor: marker.color }}
                        >
                          {marker.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{marker.name}</div>
                          {marker.description && (
                            <div className="text-blue-300 truncate text-xs">{marker.description}</div>
                          )}
                        </div>
                        <div className="text-blue-300 font-mono text-xs flex-shrink-0">
                          {formatTime(marker.time)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation()
                            // Editar marcador - simplesmente alternar nome por agora
                            const newName = await showModal('Editar Marcador', 'Digite o novo nome:', marker.name)
                            if (newName && newName !== marker.name) {
                              updateMarker(marker.id, { name: newName })
                            }
                          }}
                          className="text-blue-200 hover:text-white hover:bg-blue-600 p-1 h-auto"
                          title="Editar marcador"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMarker(marker.id)
                          }}
                          className="text-red-200 hover:text-white hover:bg-red-600 p-1 h-auto"
                          title="Deletar marcador"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            <div className="mt-3 text-xs text-blue-200 flex items-center justify-between">
              <span>💡 M: Novo marcador | Shift+M: Próximo | ,: Anterior</span>
              <span>1-6: Categorias rápidas</span>
            </div>
          </div>
        )}
        
        {/* ===== PAINEL DE HISTÓRICO DE COMANDOS ===== */}
        {showCommandHistory && commandHistory.commands.length > 0 && (
          <div className="bg-gradient-to-r from-purple-800 to-purple-700 rounded-lg p-4 border border-purple-500/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <span>📋 Histórico de Comandos</span>
                <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                  {commandHistory.commands.length} comandos | Atual: {commandHistory.currentIndex + 1}
                </span>
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCommandHistory}
                  className="text-white hover:bg-purple-600 text-xs"
                  title="Limpar histórico"
                >
                  🗑️ Limpar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCommandHistory(false)}
                  className="text-white hover:bg-purple-600"
                  title="Fechar histórico"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            <div className="max-h-32 overflow-y-auto space-y-1">
              {commandHistory.commands.map((command, index) => (
                <div
                  key={command.id}
                  className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${
                    index === commandHistory.currentIndex
                      ? 'bg-purple-600 text-white border border-purple-400'
                      : index <= commandHistory.currentIndex
                      ? 'bg-purple-700/50 text-purple-200 hover:bg-purple-700'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    // Navegar para este comando
                    const difference = index - commandHistory.currentIndex
                    if (difference > 0) {
                      // Redo múltiplo
                      for (let i = 0; i < difference; i++) {
                        redoCommand()
                      }
                    } else if (difference < 0) {
                      // Undo múltiplo
                      for (let i = 0; i < Math.abs(difference); i++) {
                        undoCommand()
                      }
                    }
                  }}
                  title={`Clique para ir para este comando`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-4 text-center">
                      {index === commandHistory.currentIndex ? '👉' : index <= commandHistory.currentIndex ? '✅' : '⏳'}
                    </span>
                    <span className="font-medium">{command.name}</span>
                    <span className="text-gray-300">-</span>
                    <span>{command.description}</span>
                  </div>
                  <span className="text-gray-400">
                    {new Date(command.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-2 text-xs text-purple-200 flex items-center justify-between">
              <span>💡 Clique em um comando para navegar no histórico</span>
              <span>Atalhos: Ctrl+Z (Undo) | Ctrl+Y (Redo)</span>
            </div>
          </div>
        )}
        
        {/* ===== INFORMAÇÕES DA TIMELINE ===== */}
        {timelineMode !== 'mini' && (
          <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg">
            <span>
              🟡 Timeline do Projeto: {formatTime(projectTimeline.start)} - {formatTime(projectTimeline.end)} ({formatTime(projectTimeline.end - projectTimeline.start)})
              {projectTimeline.start !== activeSegment.start || projectTimeline.end !== activeSegment.end ? (
                <span className="ml-2 text-blue-400">
                  | 🔵 Espaço Total: {formatTime(activeSegment.start)} - {formatTime(activeSegment.end)}
                </span>
              ) : (
                <span className="ml-2 text-green-400">
                  | ✅ Usando todo o espaço disponível
                </span>
              )}
              {splitHandleState.isVisible && (
                <span className="ml-2 text-red-400">
                  | ✂️ Divisão: {formatTime(splitHandleState.position)}
                </span>
              )}
            </span>
            <span>
              Cortes: {cutSegments.length} | 
              Blocos: {splitBlocks.length} | 
              Selecionados: {splitBlocks.filter(b => b.isSelected).length} |
              Marcadores: {markers.length} |
              Grupos: {blockGroups.length} |
              {selectivePlayback.isActive ? (
                `🎯 Reprodução Seletiva: ${selectivePlayback.currentBlockIndex + 1}/${selectivePlayback.selectedBlocks.length} | `
              ) : playingBlock ? (
                `▶️ Reproduzindo: ${splitBlocks.find(b => b.id === playingBlock)?.name} | `
              ) : selectedMarker ? (
                `📍 Marcador: ${markers.find(m => m.id === selectedMarker)?.name} | `
              ) : selectedGroup ? (
                `📁 Grupo: ${blockGroups.find(g => g.id === selectedGroup)?.name} | `
              ) : ''}
              Zoom: {zoom}% | Duração: {formatTime(duration)}
            </span>
          </div>
        )}
        

      </div>
      
      {/* Modal customizado */}
      <ModalComponent />
    </div>
  )
}

export default IntegratedTimeline 