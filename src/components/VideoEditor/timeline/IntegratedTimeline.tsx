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

// Função para gerar UUID único
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
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
    
    // Verificar se clique está dentro da barra amarela (timeline do projeto)
    const isInActiveArea = newTime >= projectTimeline.start && newTime <= projectTimeline.end
    
    if (isInActiveArea) {
      onSeek(newTime)
    } else {
      // Clique na área morta - mover para o início da timeline do projeto
      console.log('🚫 Clique na área morta - movendo para início da timeline do projeto')
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
  
  // Cores disponíveis para os blocos
  const blockColors = [
    '#10B981', // Verde
    '#8B5CF6', // Roxo
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#3B82F6', // Azul
    '#EC4899', // Rosa
    '#6366F1', // Indigo
    '#14B8A6'  // Teal
  ]

  // Função para dividir um bloco específico
  const splitSpecificBlock = useCallback((blockId: string, splitTime: number) => {
    const blockIndex = splitBlocks.findIndex(b => b.id === blockId)
    if (blockIndex === -1) return
    
    const originalBlock = splitBlocks[blockIndex]
    const timestamp = Date.now()
    const childId1 = `${blockId}-child-${timestamp}-1`
    const childId2 = `${blockId}-child-${timestamp}-2`
    
    // Criar dois blocos filhos
    const childBlock1 = createSplitBlock(
      childId1,
      originalBlock.start,
      splitTime,
      `${originalBlock.name}.1`,
      blockColors[(splitBlocks.length) % blockColors.length],
      originalBlock.id,
      originalBlock.depth + 1
    )
    
    const childBlock2 = createSplitBlock(
      childId2,
      splitTime,
      originalBlock.end,
      `${originalBlock.name}.2`,
      blockColors[(splitBlocks.length + 1) % blockColors.length],
      originalBlock.id,
      originalBlock.depth + 1
    )
    
    // Atualizar bloco pai
    const updatedParentBlock = {
      ...originalBlock,
      childIds: [childId1, childId2],
      lastModified: timestamp,
      metadata: {
        ...originalBlock.metadata,
        hasChildren: true,
        splitCount: originalBlock.metadata.splitCount + 1
      }
    }
    
    // Atualizar array de blocos
    setSplitBlocks(prev => {
      const newBlocks = [...prev]
      newBlocks[blockIndex] = updatedParentBlock
      newBlocks.push(childBlock1, childBlock2)
      return newBlocks
    })
    
    console.log('🎬 Bloco dividido:', {
      parent: updatedParentBlock,
      children: [childBlock1, childBlock2]
    })
  }, [splitBlocks])

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
    
    console.log('🎬 Blocos raiz criados:', newBlocks)
  }, [splitHandleState.isVisible, splitHandleState.position, projectTimeline, splitBlocks.length])
  
  // Função para selecionar/deselecionar bloco
  const toggleBlockSelection = useCallback((blockId: string) => {
    setSplitBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, isSelected: !block.isSelected, lastModified: Date.now() }
        : block
    ))
  }, [])
  
  // Função para obter blocos visíveis (sem filhos se pai existe)
  const getVisibleBlocks = useCallback(() => {
    return splitBlocks.filter(block => {
      // Se tem pai, só mostrar se pai não tem filhos visíveis
      if (block.parentId) {
        const parent = splitBlocks.find(b => b.id === block.parentId)
        return parent && parent.metadata.hasChildren
      }
      // Se é raiz, mostrar apenas se não tem filhos
      return !block.metadata.hasChildren
    })
  }, [splitBlocks])
  
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
    
    // Marcar bloco como sendo arrastado e atualizar lastModified
    setSplitBlocks(prev => prev.map(b => 
      b.id === blockId 
        ? { ...b, isDragging: true, lastModified: Date.now() } 
        : b
    ))
  }, [splitBlocks])
  
  // Função para deletar bloco selecionado
  const deleteSelectedBlocks = useCallback(() => {
    setSplitBlocks(prev => {
      const selectedIds = prev.filter(b => b.isSelected).map(b => b.id)
      
      // Remover blocos selecionados e seus filhos
      const filteredBlocks = prev.filter(block => {
        if (selectedIds.includes(block.id)) return false
        if (block.parentId && selectedIds.includes(block.parentId)) return false
        return true
      })
      
      // Atualizar childIds dos pais
      return filteredBlocks.map(block => {
        if (block.childIds.length > 0) {
          const validChildIds = block.childIds.filter(childId => 
            filteredBlocks.some(b => b.id === childId)
          )
          return {
            ...block,
            childIds: validChildIds,
            metadata: {
              ...block.metadata,
              hasChildren: validChildIds.length > 0
            }
          }
        }
        return block
      })
    })
  }, [])
  
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
      setTimeout(() => {
        onSetInPoint()
        onSeek(currentTimeline.end)
        setTimeout(() => onSetOutPoint(), 50)
      }, 50)
      return currentTimeline
    })
    
    setMoveSegmentState({ isDragging: false, startX: 0, startSegment: { start: 0, end: 0 } })
  }, [moveSegmentState.isDragging, onSeek, onSetInPoint, onSetOutPoint])
  
  // ===== CONTROLE DE REPRODUÇÃO INTELIGENTE =====
  // Reprodução limitada à barra amarela (projectTimeline)
  useEffect(() => {
    if (isPlaying && projectTimeline.start !== projectTimeline.end) {
      // Se chegou no fim da timeline do projeto, voltar ao início
      if (currentTime >= projectTimeline.end) {
        onSeek(projectTimeline.start)
      }
      // Se playhead está antes do início da timeline, mover para o início
      if (currentTime < projectTimeline.start) {
        onSeek(projectTimeline.start)
      }
    }
  }, [currentTime, isPlaying, onSeek, projectTimeline])

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
              
              {/* Controles de gerenciamento de blocos */}
              {splitBlocks.length > 0 && (
                <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllBlocks}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 text-xs"
                    title="Selecionar todos os blocos"
                  >
                    ✓ Todos
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllBlocks}
                    className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500 text-xs"
                    title="Deselecionar todos os blocos"
                  >
                    ✗ Nenhum
                  </Button>
                  
                  {splitBlocks.some(b => b.isSelected) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteSelectedBlocks}
                      className="bg-red-600 hover:bg-red-700 text-white border-red-500 text-xs"
                      title="Deletar blocos selecionados"
                    >
                      🗑️ Deletar
                    </Button>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    {splitBlocks.filter(b => b.isSelected).length} de {getVisibleBlocks().length} selecionados
                  </div>
                </div>
              )}
              
              {/* Botão original (quando não há handle vermelho) */}
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
              {getVisibleBlocks().map(block => (
                <div
                  key={block.id}
                  className={`absolute top-0 h-full rounded-lg border-2 transition-all duration-200 ${
                    block.isSelected 
                      ? 'border-yellow-400 ring-2 ring-yellow-400/50' 
                      : 'border-white/50'
                  } ${
                    block.isDragging 
                      ? 'cursor-grabbing shadow-2xl ring-4 ring-white/30 z-30' 
                      : 'cursor-grab hover:brightness-110 z-20'
                  }`}
                  style={{
                    left: `${calculateTimelinePosition(block.start, duration, zoom)}%`,
                    width: `${calculateTimelinePosition(block.end - block.start, duration, zoom)}%`,
                    backgroundColor: block.color,
                    minWidth: '40px'
                  }}
                  onMouseDown={(e) => {
                    if (e.detail === 1) {
                      // Single click - selecionar
                      setTimeout(() => {
                        if (e.detail === 1) {
                          toggleBlockSelection(block.id)
                        }
                      }, 200)
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
                  title={`${block.name} (${formatTime(block.start)} - ${formatTime(block.end)})
Profundidade: ${block.depth} | UUID: ${block.uuid.slice(0, 8)}...
Single click: Selecionar | Double click: Dividir`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold bg-black/20 rounded-lg">
                    <span className="flex items-center space-x-1">
                      <span>{block.name}</span>
                      {block.metadata.hasChildren && (
                        <span className="text-yellow-300">📁</span>
                      )}
                      {block.depth > 0 && (
                        <span className="text-blue-300">{'→'.repeat(block.depth)}</span>
                      )}
                    </span>
                  </div>
                  
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
              Blocos: {splitBlocks.length} (Visíveis: {getVisibleBlocks().length}) | 
              Selecionados: {splitBlocks.filter(b => b.isSelected).length} |
              Zoom: {zoom}% | Duração: {formatTime(duration)}
            </span>
          </div>
        )}
        
        {/* ===== INFORMAÇÕES DOS BLOCOS ===== */}
        {splitBlocks.length > 0 && timelineMode !== 'mini' && (
          <div className="bg-gray-800/50 px-3 py-2 rounded-lg">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Estrutura de Blocos (Sistema Hierárquico):</span>
              <span>
                Total: {splitBlocks.length} | 
                Raiz: {splitBlocks.filter(b => b.metadata.isRoot).length} |
                Filhos: {splitBlocks.filter(b => !b.metadata.isRoot).length} |
                Visíveis: {getVisibleBlocks().length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {getVisibleBlocks().map(block => (
                <div
                  key={block.id}
                  className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all border ${
                    block.isSelected 
                      ? 'bg-yellow-500/20 border-yellow-400/50 ring-1 ring-yellow-400/30' 
                      : block.isDragging 
                        ? 'bg-white/20 ring-2 ring-white/30 border-white/50' 
                        : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white/30"
                        style={{ backgroundColor: block.color }}
                      />
                      <span className="text-white font-semibold">{block.name}</span>
                      {block.metadata.hasChildren && (
                        <span className="text-yellow-300" title="Tem filhos">📁</span>
                      )}
                      {block.depth > 0 && (
                        <span className="text-blue-300" title={`Profundidade: ${block.depth}`}>
                          {'→'.repeat(block.depth)}
                        </span>
                      )}
                      {block.isSelected && (
                        <span className="text-yellow-400" title="Selecionado">✓</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-gray-400">
                    <span>
                      {formatTime(block.start)} - {formatTime(block.end)}
                    </span>
                    <span className="text-gray-500">
                      ({formatTime(block.end - block.start)})
                    </span>
                    <span className="text-xs text-gray-600">
                      UUID: {block.uuid.slice(0, 8)}...
                    </span>
                    {block.metadata.splitCount > 0 && (
                      <span className="text-xs text-blue-400">
                        Divisões: {block.metadata.splitCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Instruções de uso */}
              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-900/50 rounded border border-gray-700">
                💡 <strong>Instruções:</strong> 
                Single click = Selecionar | 
                Double click = Dividir bloco | 
                Botões: ✓Todos/✗Nenhum/🗑️Deletar
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegratedTimeline 