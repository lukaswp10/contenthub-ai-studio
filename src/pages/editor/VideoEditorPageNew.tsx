/**
 * 🎬 VIDEO EDITOR PROFISSIONAL - ClipsForge Pro
 * 
 * Editor com sistema completo: corte, narração e galeria de clipes
 * 
 * @version 4.0.0 - GALERIA DE CLIPES IMPLEMENTADA
 * @author ClipsForge Team
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import {
  ArrowLeft, Save, Download, Settings, Pause, Square, SkipBack, SkipForward, VolumeX,
  MousePointer, Scissors, Type, Image, X, FileText, Mic, Share2, Plus, Volume2, Play,
  Split, Trash2, RotateCcw, Copy, Layers, Target, CornerUpLeft, CornerUpRight,
  MicIcon, StopCircle, PlayCircle, PauseCircle, Upload, Headphones, Activity,
  FolderOpen, Star, Clock, Calendar, Search, Filter, Grid, List, Edit3, 
  Heart, Tag, Archive, FileVideo, Bookmark
} from 'lucide-react'

// ===== INTERFACES =====
interface VideoLocationState {
  url: string
  name: string
  size: number
  duration: number
  file?: File
  id?: string
  videoData?: any
  cloudinaryPublicId?: string
  cloudinaryUrl?: string
}

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

interface AudioRecording {
  id: string
  name: string
  blob: Blob
  url: string
  duration: number
  waveform: number[]
  startTime: number
  endTime: number
  volume: number
  muted: boolean
  selected: boolean
  color?: string
  createdAt: Date
}

interface NarrationProject {
  id: string
  name: string
  recordings: AudioRecording[]
  mixSettings: {
    masterVolume: number
    videoVolume: number
    narrationVolume: number
    fadeIn: number
    fadeOut: number
  }
  createdAt: Date
  updatedAt: Date
}

interface ClipItem {
  id: string
  name: string
  description: string
  thumbnail: string
  duration: number
  segments: CutSegment[]
  recordings: AudioRecording[]
  videoData: VideoLocationState
  tags: string[]
  category: string
  rating: number
  favorite: boolean
  createdAt: Date
  updatedAt: Date
  viewCount: number
  exportFormat?: 'mp4' | 'webm' | 'avi'
  resolution?: '1080p' | '720p' | '480p'
  size?: number
}

interface ClipProject {
  id: string
  name: string
  description: string
  clips: ClipItem[]
  createdAt: Date
  updatedAt: Date
  version: string
  settings: {
    autoSave: boolean
    backupInterval: number
    maxHistory: number
  }
}

interface GalleryFilter {
  category: string
  tags: string[]
  rating: number
  dateRange: {
    start: Date | null
    end: Date | null
  }
  duration: {
    min: number
    max: number
  }
  sortBy: 'name' | 'date' | 'rating' | 'duration' | 'views'
  sortOrder: 'asc' | 'desc'
  searchQuery: string
}

const VideoEditorPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null) // ✅ NOVO: Ref para player container
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Refs para handlers de redimensionamento
  const resizeMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const resizeEndHandlerRef = useRef<(() => void) | null>(null)
  
  // ✅ NOVO: Refs para handlers de arraste das legendas (estáveis)
  const dragHandlersRef = useRef<{
    move: ((e: MouseEvent) => void) | null
    up: (() => void) | null
    abortController: AbortController | null
  }>({
    move: null,
    up: null,
    abortController: null
  })

  // ===== LOGGER CONDICIONAL =====
  const logger = {
    log: process.env.NODE_ENV === 'development' ? console.log : () => {},
    error: console.error, // Sempre mostrar erros
    warn: console.warn   // Sempre mostrar warnings
  }
  
  // ===== ESTADO PRINCIPAL =====
  const [videoData, setVideoData] = useState<VideoLocationState | null>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  
  // ===== ESTADO DO PLAYER =====
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  
  // ===== ESTADO DO EDITOR =====
  const [activeTool, setActiveTool] = useState<'select' | 'cut' | 'text' | 'image' | 'narration'>('select')
  const [activePanel, setActivePanel] = useState<'captions' | 'effects' | 'transitions' | 'audio' | 'motion' | 'export' | 'settings' | 'cuts' | 'narration' | 'gallery' | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // ===== ESTADO DO SISTEMA DE CORTE =====
  const [cutSegments, setCutSegments] = useState<CutSegment[]>([])
  const [markers, setMarkers] = useState<TimelineMarker[]>([])
  const [inPoint, setInPoint] = useState<number | null>(null)
  const [outPoint, setOutPoint] = useState<number | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [cutMode, setCutMode] = useState<'split' | 'range' | 'timeline'>('timeline')
  const [cutHistory, setCutHistory] = useState<CutSegment[][]>([])
  
  // ===== ESTADO DO SISTEMA DE NARRAÇÃO =====
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [currentRecording, setCurrentRecording] = useState<AudioRecording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [audioLevels, setAudioLevels] = useState<number[]>([])
  const [devicePermission, setDevicePermission] = useState<boolean | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])
  const [narrationProject, setNarrationProject] = useState<NarrationProject | null>(null)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)
  const [syncWithVideo, setSyncWithVideo] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [recordingQuality, setRecordingQuality] = useState<'high' | 'medium' | 'low'>('high')
  
  // ===== ESTADO DA GALERIA DE CLIPES =====
  const [clips, setClips] = useState<ClipItem[]>([])
  const [currentProject, setCurrentProject] = useState<ClipProject | null>(null)
  const [projects, setProjects] = useState<ClipProject[]>([])
  const [selectedClip, setSelectedClip] = useState<string | null>(null)
  const [galleryView, setGalleryView] = useState<'grid' | 'list'>('grid')
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>({
    category: 'all',
    tags: [],
    rating: 0,
    dateRange: { start: null, end: null },
    duration: { min: 0, max: 3600 },
    sortBy: 'date',
    sortOrder: 'desc',
    searchQuery: ''
  })
  const [isCreatingClip, setIsCreatingClip] = useState(false)
  const [clipName, setClipName] = useState('')
  const [clipDescription, setClipDescription] = useState('')
  const [clipTags, setClipTags] = useState<string[]>([])
  const [clipCategory, setClipCategory] = useState('general')
  const [autoSave, setAutoSave] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  
  // ===== ESTADO DO SISTEMA DE LEGENDAS =====
  const [transcriptionWords, setTranscriptionWords] = useState<any[]>([])
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false)
  const [captionProgress, setCaptionProgress] = useState('')
  
  // ===== ESTADO DO OVERLAY DE LEGENDAS ARRASTÁVEIS =====
  const [captionOverlay, setCaptionOverlay] = useState({
    x: 50,        // 50% horizontal (centro)
    y: 85,        // 85% vertical (embaixo)
    fontSize: 24,
    isDragging: false,
    isResizing: false,
    isEditing: false,
    style: 'tiktok-bold' // Estilo padrão
  })
  const [captionDragStart, setCaptionDragStart] = useState({ x: 0, y: 0 })
  const [captionInitialPos, setCaptionInitialPos] = useState({ x: 0, y: 0 })
  const [captionEditingText, setCaptionEditingText] = useState('')

  // ===== ESTADO DO PLAYER REDIMENSIONÁVEL =====
  const [playerDimensions, setPlayerDimensions] = useState({
    width: 800,
    height: 450,
    aspectRatio: 16/9,
    lockAspectRatio: true
  })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<'ne' | 'nw' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null>(null)
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [resizeStartDimensions, setResizeStartDimensions] = useState({ width: 0, height: 0 })

  // ===== COORDENADAS PROPORCIONAIS - NÃO PRECISA DE RECENTRALIZAÇÃO =====
  // As coordenadas em % se ajustam automaticamente quando o player redimensiona

  // ===== FUNÇÃO PARA CALCULAR DIMENSÕES REAIS DO VÍDEO =====
  const getVideoRealDimensions = useCallback(() => {
    if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      return { width: playerDimensions.width, height: playerDimensions.height }
    }
    
    const video = videoRef.current
    const containerWidth = playerDimensions.width
    const containerHeight = playerDimensions.height
    const videoAspectRatio = video.videoWidth / video.videoHeight
    const containerAspectRatio = containerWidth / containerHeight
    
    let realWidth, realHeight
    
    if (videoAspectRatio > containerAspectRatio) {
      // Vídeo mais largo - limitado pela largura
      realWidth = containerWidth
      realHeight = containerWidth / videoAspectRatio
    } else {
      // Vídeo mais alto - limitado pela altura
      realHeight = containerHeight
      realWidth = containerHeight * videoAspectRatio
    }
    
    return { width: realWidth, height: realHeight }
  }, [playerDimensions.width, playerDimensions.height])

  // ===== FUNÇÃO PARA CONVERTER % PARA PIXELS =====
  const getAbsolutePosition = useCallback(() => {
    const realDimensions = getVideoRealDimensions()
    return {
      x: (captionOverlay.x / 100) * realDimensions.width,
      y: (captionOverlay.y / 100) * realDimensions.height
    }
  }, [captionOverlay.x, captionOverlay.y, getVideoRealDimensions])

  // ===== CONTROLE DE ARRASTE BASEADO NO TRAVAMENTO =====
  const canDragCaption = playerDimensions.lockAspectRatio

  // ===== HANDLERS DO PLAYER =====
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }, [])
  
  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [])
  
  const handleStop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [])
  
  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])
  
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])
  
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setVideoLoaded(true)
      
      // Criar segmento inicial do vídeo completo
      const initialSegment: CutSegment = {
        id: 'initial',
        start: 0,
        end: videoRef.current.duration,
        name: 'Vídeo Completo',
        selected: false,
        color: '#3b82f6'
      }
      setCutSegments([initialSegment])
    }
  }, [])
  
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
    }
  }, [])
  
  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !muted
      setMuted(!muted)
    }
  }, [muted])

  // ===== HANDLERS DO PLAYER REDIMENSIONÁVEL =====
  
  const handleResizeMove = useCallback((e: MouseEvent) => {
    // Usar estado funcional para pegar valores atuais
    setIsResizing(currentResizing => {
      if (!currentResizing) return currentResizing

      setResizeHandle(currentHandle => {
        if (!currentHandle) return currentHandle

        setResizeStartPos(currentStartPos => {
          setResizeStartDimensions(currentStartDimensions => {
            setPlayerDimensions(currentPlayerDimensions => {
              const deltaX = e.clientX - currentStartPos.x
              const deltaY = e.clientY - currentStartPos.y
              
              let newWidth = currentStartDimensions.width
              let newHeight = currentStartDimensions.height

              // Calcular novas dimensões baseado no handle
              if (currentHandle.includes('e')) newWidth = Math.max(200, currentStartDimensions.width + deltaX)
              if (currentHandle.includes('w')) newWidth = Math.max(200, currentStartDimensions.width - deltaX)
              if (currentHandle.includes('s')) newHeight = Math.max(150, currentStartDimensions.height + deltaY)
              if (currentHandle.includes('n')) newHeight = Math.max(150, currentStartDimensions.height - deltaY)

              // Manter aspect ratio se ativo
              if (currentPlayerDimensions.lockAspectRatio) {
                const aspectRatio = currentPlayerDimensions.aspectRatio
                if (currentHandle.includes('e') || currentHandle.includes('w')) {
                  newHeight = newWidth / aspectRatio
                } else if (currentHandle.includes('n') || currentHandle.includes('s')) {
                  newWidth = newHeight * aspectRatio
                } else {
                  // Para handles de canto, usar a maior mudança
                  if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    newHeight = newWidth / aspectRatio
                  } else {
                    newWidth = newHeight * aspectRatio
                  }
                }
              }

              // Limitar dimensões máximas (90% da tela)
              const maxWidth = window.innerWidth * 0.9
              const maxHeight = window.innerHeight * 0.9
              
              if (newWidth > maxWidth) {
                newWidth = maxWidth
                if (currentPlayerDimensions.lockAspectRatio) {
                  newHeight = newWidth / currentPlayerDimensions.aspectRatio
                }
              }
              
              if (newHeight > maxHeight) {
                newHeight = maxHeight
                if (currentPlayerDimensions.lockAspectRatio) {
                  newWidth = newHeight * currentPlayerDimensions.aspectRatio
                }
              }

              return {
                ...currentPlayerDimensions,
                width: Math.round(newWidth),
                height: Math.round(newHeight)
              }
            })
            return currentStartDimensions
          })
          return currentStartPos
        })
        return currentHandle
      })
      return currentResizing
    })
  }, [])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeHandle(null)
    
    // Remover listeners globais
    if (resizeMoveHandlerRef.current) {
      document.removeEventListener('mousemove', resizeMoveHandlerRef.current)
    }
    if (resizeEndHandlerRef.current) {
      document.removeEventListener('mouseup', resizeEndHandlerRef.current)
    }
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    // Limpar refs
    resizeMoveHandlerRef.current = null
    resizeEndHandlerRef.current = null
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeHandle(handle as any)
    setResizeStartPos({ x: e.clientX, y: e.clientY })
    setResizeStartDimensions({ 
      width: playerDimensions.width, 
      height: playerDimensions.height 
    })
    
    // Armazenar handlers nas refs e adicionar listeners
    resizeMoveHandlerRef.current = handleResizeMove
    resizeEndHandlerRef.current = handleResizeEnd
    
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = `${handle}-resize`
    document.body.style.userSelect = 'none'
  }, [playerDimensions, handleResizeMove, handleResizeEnd])

  const handleAspectRatioToggle = useCallback(() => {
    setPlayerDimensions(prev => ({
      ...prev,
      lockAspectRatio: !prev.lockAspectRatio
    }))
  }, [])

  const handleResetPlayerSize = useCallback(() => {
    setPlayerDimensions({
      width: 800,
      height: 450,
      aspectRatio: 16/9,
      lockAspectRatio: true
    })
  }, [])

  // ===== HANDLERS DAS LEGENDAS ARRASTÁVEIS - SISTEMA PROPORCIONAL =====
  
  // ✅ NOVO: Handlers com coordenadas proporcionais
  useEffect(() => {
    // Handler de movimento proporcional
    dragHandlersRef.current.move = (e: MouseEvent) => {
      console.log('🖱️ Mouse move detected:', { clientX: e.clientX, clientY: e.clientY })
      
      setCaptionOverlay(prev => {
        if (!prev.isDragging || !playerDimensions.lockAspectRatio) {
          console.log('⚠️ Not dragging or aspect ratio not locked, ignoring mouse move')
          return prev
        }
        
        // Calcular dimensões reais do vídeo
        const realDimensions = getVideoRealDimensions()
        const deltaX = e.clientX - captionDragStart.x
        const deltaY = e.clientY - captionDragStart.y
        
        // ✅ NOVO: Converter delta de pixels para porcentagem
        const deltaXPercent = (deltaX / realDimensions.width) * 100
        const deltaYPercent = (deltaY / realDimensions.height) * 100
        
        // ✅ CORRIGIDO: Considerar tamanho da legenda e limites mais conservadores
        const captionWidthPercent = (200 / realDimensions.width) * 100  // ~200px estimado
        const captionHeightPercent = (60 / realDimensions.height) * 100 // ~60px estimado
        
        const maxXPercent = Math.min(85, 100 - captionWidthPercent)
        const maxYPercent = Math.min(85, 100 - captionHeightPercent)
        
        const newX = Math.max(5, Math.min(maxXPercent, captionInitialPos.x + deltaXPercent))
        const newY = Math.max(5, Math.min(maxYPercent, captionInitialPos.y + deltaYPercent))
        
        console.log('📍 New position calculated (%):', { 
          deltaX, deltaY, 
          deltaXPercent: deltaXPercent.toFixed(1), 
          deltaYPercent: deltaYPercent.toFixed(1),
          oldPos: { x: prev.x, y: prev.y },
          newPos: { x: newX.toFixed(1), y: newY.toFixed(1) }
        })
        
        return {
          ...prev,
          x: newX,
          y: newY
        }
      })
    }
    
    // Handler de mouse up
    dragHandlersRef.current.up = () => {
      console.log('🎯 Caption mouse up - arraste finalizado')
      
      setCaptionOverlay(prev => ({ ...prev, isDragging: false }))
      
      // Cleanup
      if (dragHandlersRef.current.abortController) {
        dragHandlersRef.current.abortController.abort()
        dragHandlersRef.current.abortController = null
      }
      
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [playerDimensions.lockAspectRatio, getVideoRealDimensions, captionDragStart, captionInitialPos])

  const handleCaptionMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    // ✅ NOVO: Verificar se pode arrastar (aspect ratio travado)
    if (!playerDimensions.lockAspectRatio) {
      alert('🔒 Trave o aspect ratio do player (botão 🔒) para arrastar a legenda')
      return
    }
    
    console.log('🎯 Caption mouse down:', { 
      clientX: e.clientX, 
      clientY: e.clientY,
      currentPos: { x: captionOverlay.x, y: captionOverlay.y },
      canDrag: playerDimensions.lockAspectRatio
    })
    
    // Cleanup listeners anteriores
    if (dragHandlersRef.current.abortController) {
      dragHandlersRef.current.abortController.abort()
    }
    
    // Criar novo AbortController
    dragHandlersRef.current.abortController = new AbortController()
    
    // Definir estado inicial
    setCaptionOverlay(prev => {
      // Armazenar posição inicial em % para cálculo correto do delta
      setCaptionInitialPos({ x: prev.x, y: prev.y })
      return { ...prev, isDragging: true }
    })
    setCaptionDragStart({ x: e.clientX, y: e.clientY })
    
    // Adicionar event listeners
    if (dragHandlersRef.current.move && dragHandlersRef.current.up) {
      console.log('📝 Adding event listeners with AbortController...')
      
      document.addEventListener('mousemove', dragHandlersRef.current.move, { 
        signal: dragHandlersRef.current.abortController.signal,
        passive: false 
      })
      document.addEventListener('mouseup', dragHandlersRef.current.up, { 
        signal: dragHandlersRef.current.abortController.signal,
        passive: false 
      })
      
      console.log('✅ Event listeners added successfully')
      
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    } else {
      console.error('❌ Handlers not available!')
    }
  }, [playerDimensions.lockAspectRatio, captionOverlay.x, captionOverlay.y])

  const handleCaptionDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const currentText = getCurrentCaptionText()
    setCaptionEditingText(currentText)
    setCaptionOverlay(prev => ({ ...prev, isEditing: true }))
  }, [])

  const handleCaptionEditSave = useCallback(() => {
    if (captionEditingText.trim()) {
      // Editar realmente o array transcriptionWords
      const newText = captionEditingText.trim()
      const wordsInNewText = newText.split(' ')
      
      setTranscriptionWords(prev => {
        // Encontrar palavras que estão sendo exibidas no tempo atual
        const currentWords = prev.filter(word => 
          word.start <= currentTime && currentTime <= word.end
        )
        
        if (currentWords.length === 0) return prev
        
        // Pegar tempo de início e fim do segmento atual
        const segmentStart = Math.min(...currentWords.map(w => w.start))
        const segmentEnd = Math.max(...currentWords.map(w => w.end))
        const segmentDuration = segmentEnd - segmentStart
        
        // Criar novas palavras distribuindo o tempo
        const timePerWord = segmentDuration / wordsInNewText.length
        const newWords = wordsInNewText.map((word, index) => ({
          text: word,
          start: segmentStart + (index * timePerWord),
          end: segmentStart + ((index + 1) * timePerWord),
          highlight: false
        }))
        
        // Substituir palavras antigas pelas novas
        const updatedWords = prev.filter(word => 
          !(word.start <= currentTime && currentTime <= word.end)
        ).concat(newWords)
        
        // Ordenar por tempo
        updatedWords.sort((a, b) => a.start - b.start)
        
        logger.log('💾 Legenda editada:', {
          original: currentWords.map(w => w.text).join(' '),
          novo: newText,
          palavrasAntigas: currentWords.length,
          palavrasNovas: newWords.length
        })
        
        return updatedWords
      })
    }
    
    setCaptionOverlay(prev => ({ ...prev, isEditing: false }))
    setCaptionEditingText('')
  }, [captionEditingText, currentTime, logger])

  const handleCaptionEditCancel = useCallback(() => {
    setCaptionOverlay(prev => ({ ...prev, isEditing: false }))
    setCaptionEditingText('')
  }, [])

  const handleCaptionResize = useCallback((direction: 'bigger' | 'smaller') => {
    setCaptionOverlay(prev => ({
      ...prev,
      fontSize: direction === 'bigger' 
        ? Math.min(48, prev.fontSize + 2)
        : Math.max(12, prev.fontSize - 2)
    }))
  }, [])

  // ===== SISTEMA DE CACHE DAS LEGENDAS =====
  const getCacheKey = useCallback((videoData: VideoLocationState) => {
    // Criar chave única baseada no vídeo
    const identifier = videoData.cloudinaryPublicId || videoData.name || videoData.id || 'unknown'
    return `transcription_${identifier}_${videoData.size || 0}`
  }, [])

  const saveTranscriptionToCache = useCallback((videoData: VideoLocationState, words: any[]) => {
    try {
      const cacheKey = getCacheKey(videoData)
      const cacheData = {
        words,
        timestamp: Date.now(),
        videoName: videoData.name,
        duration: videoData.duration
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      logger.log('💾 Legendas salvas no cache:', cacheKey)
    } catch (error) {
      logger.warn('⚠️ Erro ao salvar cache:', error)
    }
  }, [getCacheKey, logger])

  const loadTranscriptionFromCache = useCallback((videoData: VideoLocationState) => {
    try {
      const cacheKey = getCacheKey(videoData)
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        const cacheData = JSON.parse(cached)
        const age = Date.now() - cacheData.timestamp
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 dias
        
        if (age < maxAge && cacheData.words && cacheData.words.length > 0) {
          logger.log('🔄 Legendas carregadas do cache:', {
            key: cacheKey,
            palavras: cacheData.words.length,
            idade: Math.round(age / (1000 * 60 * 60)) + 'h'
          })
          return cacheData.words
        } else {
          // Cache expirado, remover
          localStorage.removeItem(cacheKey)
          logger.log('🗑️ Cache expirado removido:', cacheKey)
        }
      }
      
      return null
    } catch (error) {
      logger.warn('⚠️ Erro ao carregar cache:', error)
      return null
    }
  }, [getCacheKey, logger])

  const clearTranscriptionCache = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('transcription_'))
      keys.forEach(key => localStorage.removeItem(key))
      logger.log('🧹 Cache de legendas limpo:', keys.length + ' itens removidos')
    } catch (error) {
      logger.warn('⚠️ Erro ao limpar cache:', error)
    }
  }, [logger])

  // Função para obter o texto atual da legenda
  const getCurrentCaptionText = useCallback(() => {
    if (transcriptionWords.length === 0) return ''
    
    // ✅ CORRIGIR: Adicionar tolerância de tempo para capturar melhor
    const tolerance = 0.5 // 500ms de tolerância
    const currentWords = transcriptionWords.filter(word => 
      (word.start - tolerance) <= currentTime && currentTime <= (word.end + tolerance)
    )
    
    // Se não encontrou com tolerância, buscar palavras mais próximas
    if (currentWords.length === 0) {
      const nearbyWords = transcriptionWords.filter(word => {
        const wordMidpoint = (word.start + word.end) / 2
        const timeDiff = Math.abs(wordMidpoint - currentTime)
        return timeDiff <= 2.0 // 2 segundos de busca próxima
      })
      
      if (nearbyWords.length > 0) {
        // Ordenar por proximidade e pegar até 5 palavras mais próximas
        nearbyWords.sort((a, b) => {
          const diffA = Math.abs(((a.start + a.end) / 2) - currentTime)
          const diffB = Math.abs(((b.start + b.end) / 2) - currentTime)
          return diffA - diffB
        })
        return nearbyWords.slice(0, 5).map(word => word.text).join(' ')
      }
    }
    
    return currentWords.map(word => word.text).join(' ')
  }, [transcriptionWords, currentTime])
  
  // ===== HANDLERS DOS PAINÉIS =====
  const handlePanelToggle = useCallback((panel: typeof activePanel) => {
    if (activePanel === panel) {
      setActivePanel(null)
      setSidebarOpen(false)
    } else {
      setActivePanel(panel)
      setSidebarOpen(true)
    }
  }, [activePanel])
  
  const handleToolSelect = useCallback((tool: typeof activeTool) => {
    setActiveTool(tool)
    
    // Se selecionou ferramenta de corte, abrir painel de cortes
    if (tool === 'cut') {
      setActivePanel('cuts')
      setSidebarOpen(true)
    }
    
    // Se selecionou ferramenta de narração, abrir painel de narração
    if (tool === 'narration') {
      setActivePanel('narration')
      setSidebarOpen(true)
    }
  }, [])
  
  // ===== HANDLERS DO SISTEMA DE CORTE =====
  const handleSetInPoint = useCallback(() => {
    setInPoint(currentTime)
    console.log('📍 Ponto de entrada definido:', currentTime)
    
    // Adicionar marcador visual
    const marker: TimelineMarker = {
      id: `in-${Date.now()}`,
      time: currentTime,
      type: 'in',
      label: 'Entrada'
    }
    setMarkers(prev => [...prev.filter(m => m.type !== 'in'), marker])
  }, [currentTime])
  
  const handleSetOutPoint = useCallback(() => {
    setOutPoint(currentTime)
    console.log('📍 Ponto de saída definido:', currentTime)
    
    // Adicionar marcador visual
    const marker: TimelineMarker = {
      id: `out-${Date.now()}`,
      time: currentTime,
      type: 'out',
      label: 'Saída'
    }
    setMarkers(prev => [...prev.filter(m => m.type !== 'out'), marker])
  }, [currentTime])
  
  const handleCreateCut = useCallback(() => {
    if (inPoint !== null && outPoint !== null) {
      const start = Math.min(inPoint, outPoint)
      const end = Math.max(inPoint, outPoint)
      
      // Salvar estado atual no histórico
      setCutHistory(prev => [...prev, cutSegments])
      
      const newCut: CutSegment = {
        id: `cut-${Date.now()}`,
        start,
        end,
        name: `Clipe ${cutSegments.length}`,
        selected: true,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      }
      
      setCutSegments(prev => [...prev, newCut])
      setSelectedSegment(newCut.id)
      
      // Limpar pontos
      setInPoint(null)
      setOutPoint(null)
      setMarkers(prev => prev.filter(m => m.type === 'cut'))
      
      console.log('✂️ Corte criado:', newCut)
    }
  }, [inPoint, outPoint, cutSegments])
  
  const handleSplitAtCurrentTime = useCallback(() => {
    if (cutSegments.length === 0) return
    
    // Salvar estado atual no histórico
    setCutHistory(prev => [...prev, cutSegments])
    
    // Encontrar segmento que contém o tempo atual
    const segmentToSplit = cutSegments.find(seg => 
      currentTime >= seg.start && currentTime <= seg.end
    )
    
    if (segmentToSplit) {
      const newSegments = cutSegments.filter(seg => seg.id !== segmentToSplit.id)
      
      // Criar dois novos segmentos
      const segment1: CutSegment = {
        id: `split-${Date.now()}-1`,
        start: segmentToSplit.start,
        end: currentTime,
        name: `${segmentToSplit.name} (1)`,
        selected: true,
        color: segmentToSplit.color
      }
      
      const segment2: CutSegment = {
        id: `split-${Date.now()}-2`,
        start: currentTime,
        end: segmentToSplit.end,
        name: `${segmentToSplit.name} (2)`,
        selected: false,
        color: segmentToSplit.color
      }
      
      setCutSegments([...newSegments, segment1, segment2])
      setSelectedSegment(segment1.id)
      
      console.log('✂️ Segmento dividido:', { segment1, segment2 })
    }
  }, [currentTime, cutSegments])
  
  const handleDeleteSegment = useCallback((segmentId: string) => {
    // Salvar estado atual no histórico
    setCutHistory(prev => [...prev, cutSegments])
    
    setCutSegments(prev => prev.filter(seg => seg.id !== segmentId))
    if (selectedSegment === segmentId) {
      setSelectedSegment(null)
    }
    
    console.log('🗑️ Segmento deletado:', segmentId)
  }, [cutSegments, selectedSegment])
  
  const handleUndoCut = useCallback(() => {
    if (cutHistory.length > 0) {
      const previousState = cutHistory[cutHistory.length - 1]
      setCutSegments(previousState)
      setCutHistory(prev => prev.slice(0, -1))
      
      console.log('↩️ Corte desfeito')
    }
  }, [cutHistory])
  
  const handleJumpToSegment = useCallback((segment: CutSegment) => {
    handleSeek(segment.start)
    setSelectedSegment(segment.id)
    
    console.log('🎯 Navegando para segmento:', segment.name)
  }, [handleSeek])
  
  const handleSelectSegment = useCallback((segmentId: string) => {
    setCutSegments(prev => prev.map(seg => ({
      ...seg,
      selected: seg.id === segmentId
    })))
    setSelectedSegment(segmentId)
  }, [])
  
  // ===== HANDLERS DO SISTEMA DE NARRAÇÃO =====
  const initializeAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      console.log('🎵 AudioContext inicializado')
    } catch (error) {
      console.error('❌ Erro ao inicializar AudioContext:', error)
    }
  }, [])
  
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: recordingQuality === 'high' ? 48000 : recordingQuality === 'medium' ? 44100 : 22050
        }
      })
      
      streamRef.current = stream
      setDevicePermission(true)
      
      // Obter dispositivos disponíveis
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(device => device.kind === 'audioinput')
      setAvailableDevices(audioDevices)
      
      if (audioDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(audioDevices[0].deviceId)
      }
      
      console.log('🎤 Permissão de microfone concedida')
      console.log('🎧 Dispositivos de áudio:', audioDevices)
      
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão de microfone:', error)
      setDevicePermission(false)
    }
  }, [recordingQuality, selectedDevice])
  
  const startRecording = useCallback(async () => {
    try {
      if (!streamRef.current) {
        await requestMicrophonePermission()
      }
      
      if (!streamRef.current) {
        throw new Error('Não foi possível acessar o microfone')
      }
      
      await initializeAudioContext()
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
        const url = URL.createObjectURL(blob)
        
        // Criar nova gravação
        const newRecording: AudioRecording = {
          id: `recording-${Date.now()}`,
          name: `Narração ${recordings.length + 1}`,
          blob,
          url,
          duration: recordingTime,
          waveform: audioLevels,
          startTime: recordingStartTime || 0,
          endTime: (recordingStartTime || 0) + recordingTime,
          volume: 1,
          muted: false,
          selected: false,
          createdAt: new Date()
        }
        
        setRecordings(prev => [...prev, newRecording])
        setCurrentRecording(newRecording)
        
        console.log('🎤 Gravação concluída:', newRecording)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingStartTime(syncWithVideo ? currentTime : 0)
      setRecordingTime(0)
      
      console.log('🎤 Gravação iniciada')
      
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error)
      alert('Erro ao iniciar gravação. Verifique as permissões do microfone.')
    }
  }, [streamRef, recordingTime, audioLevels, recordingStartTime, recordings, currentTime, syncWithVideo, requestMicrophonePermission, initializeAudioContext])
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      console.log('🛑 Gravação parada')
    }
  }, [isRecording])
  
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        console.log('▶️ Gravação retomada')
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        console.log('⏸️ Gravação pausada')
      }
    }
  }, [isRecording, isPaused])
  
  const playRecording = useCallback((recording: AudioRecording) => {
    if (playingRecording === recording.id) {
      setPlayingRecording(null)
      return
    }
    
    const audio = new Audio(recording.url)
    audio.volume = recording.volume
    audio.muted = recording.muted
    
    audio.onplay = () => {
      setPlayingRecording(recording.id)
      
      // Sincronizar com vídeo se habilitado
      if (syncWithVideo && autoSync) {
        handleSeek(recording.startTime)
        handlePlay()
      }
    }
    
    audio.onended = () => {
      setPlayingRecording(null)
    }
    
    audio.play()
    
    console.log('▶️ Reproduzindo gravação:', recording.name)
  }, [playingRecording, syncWithVideo, autoSync, handleSeek, handlePlay])
  
  const deleteRecording = useCallback((recordingId: string) => {
    const recording = recordings.find(r => r.id === recordingId)
    if (recording) {
      URL.revokeObjectURL(recording.url)
      setRecordings(prev => prev.filter(r => r.id !== recordingId))
      
      if (currentRecording?.id === recordingId) {
        setCurrentRecording(null)
      }
      
      console.log('🗑️ Gravação deletada:', recordingId)
    }
  }, [recordings, currentRecording])
  
  const updateRecordingSettings = useCallback((recordingId: string, updates: Partial<AudioRecording>) => {
    setRecordings(prev => prev.map(r => 
      r.id === recordingId ? { ...r, ...updates } : r
    ))
    
    console.log('🔄 Configurações da gravação atualizadas:', recordingId, updates)
  }, [])
  
  // ===== VALIDAÇÃO DE URL =====
  const validateVideoUrl = useCallback(async (url: string): Promise<boolean> => {
    try {
      // ✅ URLs locais são sempre válidas
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        logger.log('✅ URL local válida (blob/data):', url.substring(0, 50) + '...')
        return true
      }
      
      // ✅ URLs do Cloudinary são sempre válidas (não precisam validação)
      if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
        logger.log('✅ URL do Cloudinary válida:', url.substring(0, 50) + '...')
        return true
      }
      
      // ✅ Para outras URLs HTTP/HTTPS, validar com fetch (mas sem bloquear)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos máximo
          
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          const isValid = response.ok
          logger.log(isValid ? '✅ URL externa válida' : '⚠️ URL externa com problemas (mas aceita)', url.substring(0, 50) + '...')
          return true // ✅ SEMPRE aceitar URLs HTTP/HTTPS (não bloquear)
        } catch (error) {
          logger.warn('⚠️ Erro ao validar URL externa (mas aceita):', error)
          return true // ✅ SEMPRE aceitar em caso de erro de rede
        }
      }
      
      // ✅ Aceitar todos os tipos de URL por padrão
      logger.log('✅ URL aceita por padrão:', url.substring(0, 50) + '...')
      return true
    } catch (error) {
      logger.error('❌ Erro ao validar URL do vídeo:', error)
      return true // ✅ SEMPRE aceitar em caso de erro
    }
  }, [logger])

  // ===== HANDLERS DO SISTEMA DE GALERIA =====
  const generateThumbnail = useCallback(async (): Promise<string> => {
    if (!videoRef.current || !canvasRef.current) {
      return ''
    }
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    // Configurar dimensões do canvas
    canvas.width = 320
    canvas.height = 180
    
    // Desenhar frame atual do vídeo
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Converter para data URL
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [])
  
  const saveCurrentClip = useCallback(async () => {
    if (!videoData || cutSegments.length === 0) {
      alert('❌ Não há segmentos para salvar. Crie alguns cortes primeiro.')
      return
    }
    
    setIsCreatingClip(true)
    
    try {
      const thumbnail = await generateThumbnail()
      const totalDuration = cutSegments.reduce((acc, seg) => acc + (seg.end - seg.start), 0)
      
      const newClip: ClipItem = {
        id: `clip-${Date.now()}`,
        name: clipName || `Clipe ${clips.length + 1}`,
        description: clipDescription || 'Clipe criado no ClipsForge',
        thumbnail,
        duration: totalDuration,
        segments: [...cutSegments],
        recordings: [...recordings],
        videoData: { ...videoData },
        tags: [...clipTags],
        category: clipCategory,
        rating: 5,
        favorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        exportFormat: 'mp4',
        resolution: '1080p',
        size: Math.round(totalDuration * 1000000) // Estimativa aproximada
      }
      
      setClips(prev => [...prev, newClip])
      setUnsavedChanges(false)
      setLastSaved(new Date())
      
      // Resetar formulário
      setClipName('')
      setClipDescription('')
      setClipTags([])
      setClipCategory('general')
      
      logger.log('💾 Clipe salvo:', newClip)
      alert(`✅ Clipe "${newClip.name}" salvo com sucesso!\n\nSegmentos: ${newClip.segments.length}\nGravações: ${newClip.recordings.length}\nDuração: ${formatTime(newClip.duration)}`)
      
    } catch (error) {
      console.error('❌ Erro ao salvar clipe:', error)
      alert('❌ Erro ao salvar clipe. Tente novamente.')
    } finally {
      setIsCreatingClip(false)
    }
  }, [videoData, cutSegments, recordings, clipName, clipDescription, clipTags, clipCategory, clips, generateThumbnail])
  
  const loadClip = useCallback((clip: ClipItem) => {
    // Restaurar dados do vídeo
    setVideoData(clip.videoData)
    
    // Restaurar segmentos
    setCutSegments(clip.segments)
    setSelectedSegment(clip.segments[0]?.id || null)
    
    // Restaurar gravações
    setRecordings(clip.recordings)
    setCurrentRecording(clip.recordings[0] || null)
    
    // Atualizar contador de visualizações
    setClips(prev => prev.map(c => 
      c.id === clip.id ? { ...c, viewCount: c.viewCount + 1 } : c
    ))
    
            logger.log('📁 Clipe carregado:', clip.name)
    alert(`📁 Clipe "${clip.name}" carregado com sucesso!`)
  }, [])
  
  const deleteClip = useCallback((clipId: string) => {
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return
    
    if (confirm(`🗑️ Tem certeza que deseja deletar o clipe "${clip.name}"?\n\nEsta ação não pode ser desfeita.`)) {
      setClips(prev => prev.filter(c => c.id !== clipId))
      
      if (selectedClip === clipId) {
        setSelectedClip(null)
      }
      
      console.log('🗑️ Clipe deletado:', clip.name)
    }
  }, [clips, selectedClip])
  
  const updateClipSettings = useCallback((clipId: string, updates: Partial<ClipItem>) => {
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, ...updates, updatedAt: new Date() } : c
    ))
    
    console.log('🔄 Configurações do clipe atualizadas:', clipId, updates)
  }, [])
  
  const toggleClipFavorite = useCallback((clipId: string) => {
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, favorite: !c.favorite, updatedAt: new Date() } : c
    ))
  }, [])
  
  const filterClips = useCallback((clips: ClipItem[]): ClipItem[] => {
    let filteredClips = [...clips]
    
    // Filtro por busca
    if (galleryFilter.searchQuery) {
      const query = galleryFilter.searchQuery.toLowerCase()
      filteredClips = filteredClips.filter(clip => 
        clip.name.toLowerCase().includes(query) ||
        clip.description.toLowerCase().includes(query) ||
        clip.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Filtro por categoria
    if (galleryFilter.category !== 'all') {
      filteredClips = filteredClips.filter(clip => clip.category === galleryFilter.category)
    }
    
    // Filtro por rating
    if (galleryFilter.rating > 0) {
      filteredClips = filteredClips.filter(clip => clip.rating >= galleryFilter.rating)
    }
    
    // Filtro por duração
    filteredClips = filteredClips.filter(clip => 
      clip.duration >= galleryFilter.duration.min && 
      clip.duration <= galleryFilter.duration.max
    )
    
    // Filtro por tags
    if (galleryFilter.tags.length > 0) {
      filteredClips = filteredClips.filter(clip => 
        galleryFilter.tags.some(tag => clip.tags.includes(tag))
      )
    }
    
    // Ordenação
    filteredClips.sort((a, b) => {
      let comparison = 0
      
      switch (galleryFilter.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'views':
          comparison = a.viewCount - b.viewCount
          break
      }
      
      return galleryFilter.sortOrder === 'desc' ? -comparison : comparison
    })
    
    return filteredClips
  }, [galleryFilter])
  
  const updateGalleryFilter = useCallback((updates: Partial<GalleryFilter>) => {
    setGalleryFilter(prev => ({ ...prev, ...updates }))
  }, [])
  
  const exportClip = useCallback((clip: ClipItem) => {
    console.log('📤 Exportando clipe:', clip.name)
    alert(`📤 Exportar Clipe: ${clip.name}\n\nEsta função será implementada na próxima fase!\n\nFormato: ${clip.exportFormat}\nResolução: ${clip.resolution}\nSegmentos: ${clip.segments.length}`)
  }, [])
  
  const createNewProject = useCallback(() => {
    const newProject: ClipProject = {
      id: `project-${Date.now()}`,
      name: `Projeto ${projects.length + 1}`,
      description: 'Novo projeto criado no ClipsForge',
      clips: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      settings: {
        autoSave: true,
        backupInterval: 300,
        maxHistory: 10
      }
    }
    
    setProjects(prev => [...prev, newProject])
    setCurrentProject(newProject)
    
          logger.log('📁 Novo projeto criado:', newProject.name)
  }, [projects])
  
  const saveProject = useCallback(() => {
    if (!currentProject) return
    
    const updatedProject: ClipProject = {
      ...currentProject,
      clips: [...clips],
      updatedAt: new Date()
    }
    
    setProjects(prev => prev.map(p => 
      p.id === currentProject.id ? updatedProject : p
    ))
    setCurrentProject(updatedProject)
    setLastSaved(new Date())
    setUnsavedChanges(false)
    
    console.log('💾 Projeto salvo:', updatedProject.name)
  }, [currentProject, clips])
  
  // ===== HANDLERS DE LEGENDAS =====
  const handleVideoCaption = useCallback(async () => {
    logger.log('📝 Gerando legenda do vídeo...')
    
    // ✅ DEBUG COMPLETO DO ESTADO ATUAL
    logger.log('🔍 DEBUG - Estado atual:', {
      videoData,
      hasVideoData: !!videoData,
      videoDataKeys: videoData ? Object.keys(videoData) : [],
      sessionStorage: sessionStorage.getItem('currentVideoData'),
      locationState: location.state
    })
    
    if (!videoData) {
      // ✅ TENTAR RECUPERAR DADOS UMA ÚLTIMA VEZ
      const savedVideoData = sessionStorage.getItem('currentVideoData')
      if (savedVideoData) {
        try {
          const parsedData = JSON.parse(savedVideoData)
          logger.log('🔄 Recuperando dados do sessionStorage para legendas:', parsedData)
          setVideoData(parsedData)
          
          // Aguardar um pouco para o estado atualizar e tentar novamente
          setTimeout(() => {
            handleVideoCaption()
          }, 500)
          return
        } catch (error) {
          logger.error('❌ Erro ao recuperar dados para legendas:', error)
        }
      }
      
      alert('❌ Nenhum vídeo carregado para gerar legendas!\n\n💡 Dica: Se você acabou de fazer upload, aguarde alguns segundos e tente novamente.\n\n🔄 Você pode voltar ao dashboard e tentar novamente.')
      return
    }

    try {
      setIsGeneratingCaption(true)
      setCaptionProgress('Verificando cache...')
      
      // ✅ NOVO: Verificar cache antes de chamar API
      const cachedWords = loadTranscriptionFromCache(videoData)
      if (cachedWords) {
        setTranscriptionWords(cachedWords)
        logger.log('🎯 Legendas carregadas do cache! Créditos da API economizados.')
        setCaptionProgress('')
        setIsGeneratingCaption(false)
        return
      }
      
      setCaptionProgress('Cache não encontrado, gerando nova transcrição...')
      
      // Criar file object a partir da URL se não existir
      let fileToTranscribe = videoData.file
      
      if (!fileToTranscribe && videoData.url) {
        logger.log('🔄 File object não encontrado, criando a partir da URL...')
        setCaptionProgress('Baixando vídeo para transcrição...')
        
        try {
          const response = await fetch(videoData.url)
          const blob = await response.blob()
          fileToTranscribe = new File([blob], videoData.name, { type: blob.type })
          logger.log('✅ File object criado com sucesso:', fileToTranscribe.name)
        } catch (fetchError) {
          logger.warn('⚠️ Erro ao criar file object da URL:', fetchError)
          alert('❌ Erro ao acessar o vídeo para transcrição.\n\nPossíveis causas:\n• Vídeo não está mais disponível\n• Problemas de rede\n• URL inválida\n\nTente fazer upload novamente.')
          return
        }
      }
      
      if (!fileToTranscribe) {
        alert('❌ Não foi possível acessar o arquivo de vídeo para transcrição!')
        return
      }
      
      setCaptionProgress('Iniciando transcrição...')
      
      // ✅ USAR SISTEMA UNIFICADO DE TRANSCRIÇÃO
      const { transcriptionUnifiedService } = await import('../../services/transcriptionUnified.service')
      
      const result = await transcriptionUnifiedService.transcribe(
        fileToTranscribe,
        (status) => {
          setCaptionProgress(status)
        }
      )

      logger.log('🎉 Transcrição Unificada concluída!')
      logger.log('📄 Texto completo:', result.text)
      logger.log('🔤 Idioma detectado:', result.language)
      logger.log('📊 Palavras processadas:', result.words.length)
      
      // Atualizar estado com as palavras transcritas
      setTranscriptionWords(result.words)
      
      // ✅ NOVO: Salvar no cache para próximas vezes
      saveTranscriptionToCache(videoData, result.words)
      
      // Log silencioso de sucesso (sem pop-up)
      logger.log('✅ Legenda gerada com sucesso!')
      logger.log(`📊 Estatísticas: ${result.words.length} palavras, ${result.segments?.length || 0} segmentos`)
      logger.log(`🎯 Idioma: ${result.language}, Confiança: ${(result.confidence * 100).toFixed(1)}%`)
      
    } catch (error) {
      logger.error('❌ Erro ao gerar legenda:', error)
      
      let errorMessage = 'Erro ao gerar legenda'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      alert(`❌ Erro ao gerar legenda:\n\n${errorMessage}\n\n💡 Dicas:\n• Verifique sua conexão com a internet\n• Certifique-se de que o vídeo tem áudio\n• Tente novamente em alguns minutos\n• Se o problema persistir, faça upload novamente`)
    } finally {
      setIsGeneratingCaption(false)
      setCaptionProgress('')
    }
  }, [videoData, logger, loadTranscriptionFromCache, saveTranscriptionToCache])
  
  const handleVoiceOver = useCallback(() => {
    logger.log('🎤 Adicionando voz de fora...')
    setActiveTool('narration')
    setActivePanel('narration')
    setSidebarOpen(true)
    
    // Inicializar sistema de narração
    initializeAudioContext()
    requestMicrophonePermission()
  }, [initializeAudioContext, requestMicrophonePermission])
  
  const handleOpenGallery = useCallback(() => {
    logger.log('📁 Abrindo galeria de clipes...')
    setActivePanel('gallery')
    setSidebarOpen(true)
  }, [])
  
  // ===== VERIFICAÇÕES =====
  const handleGoBack = () => {
    navigate('/upload')
  }
  
  // ===== EFFECTS =====
  // ===== FUNÇÃO PARA SALVAR DADOS LEVES NO SESSIONSTORAGE =====
  const saveToSessionStorage = useCallback((data: VideoLocationState) => {
    try {
      // Salvar apenas dados essenciais (sem file object para evitar QuotaExceededError)
      const lightData = {
        url: data.url,
        name: data.name,
        size: data.size,
        duration: data.duration,
        id: data.id,
        cloudinaryPublicId: data.cloudinaryPublicId,
        cloudinaryUrl: data.cloudinaryUrl
        // Excluindo: file, videoData (objetos grandes que causam QuotaExceededError)
      }
      
      sessionStorage.setItem('currentVideoData', JSON.stringify(lightData))
      logger.log('💾 Dados leves salvos no sessionStorage')
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.warn('⚠️ SessionStorage quota excedida, limpando dados antigos...')
        // Limpar dados antigos e tentar novamente
        sessionStorage.clear()
        try {
          const lightData = {
            url: data.url,
            name: data.name,
            size: data.size,
            duration: data.duration,
            id: data.id,
            cloudinaryPublicId: data.cloudinaryPublicId,
            cloudinaryUrl: data.cloudinaryUrl
          }
          sessionStorage.setItem('currentVideoData', JSON.stringify(lightData))
          logger.log('💾 Dados salvos após limpeza do storage')
        } catch (retryError) {
          logger.error('❌ Falha ao salvar no sessionStorage mesmo após limpeza:', retryError)
        }
      } else {
        logger.error('❌ Erro ao salvar no sessionStorage:', error)
      }
    }
  }, [logger])

  useEffect(() => {
    const state = location.state as VideoLocationState
    if (state) {
      logger.log('📁 Dados de vídeo recebidos via navigation state:', state)
      
      // ✅ SEMPRE aceitar dados do state (não bloquear com validação)
      setVideoData(state)
      saveToSessionStorage(state)
      
      // Validar URL em background (sem bloquear)
      if (state.url) {
        validateVideoUrl(state.url).then(isValid => {
          if (!isValid) {
            logger.warn('⚠️ URL do vídeo com problemas (mas mantendo dados):', state.url)
          }
        }).catch(error => {
          logger.warn('⚠️ Erro na validação de URL (mas mantendo dados):', error)
        })
      }
    } else {
      // Tentar recuperar do sessionStorage se não veio pelo state
      const savedVideoData = sessionStorage.getItem('currentVideoData')
      if (savedVideoData) {
        try {
          const parsedData = JSON.parse(savedVideoData)
          logger.log('📁 Dados de vídeo recuperados do sessionStorage:', parsedData)
          setVideoData(parsedData)
        } catch (error) {
          logger.error('❌ Erro ao recuperar dados do sessionStorage:', error)
          // Limpar dados corrompidos
          sessionStorage.removeItem('currentVideoData')
        }
      }
    }
  }, [location.state, validateVideoUrl, navigate, saveToSessionStorage])
  
  useEffect(() => {
    if (!videoData) {
      // ✅ AGUARDAR MAIS TEMPO e tentar recuperar dados antes de redirecionar
      const timeout = setTimeout(() => {
        // Verificar novamente se há dados
        const savedVideoData = sessionStorage.getItem('currentVideoData')
        const urlParams = new URLSearchParams(window.location.search)
        const hasVideoParam = urlParams.has('video') || location.state
        
        if (!savedVideoData && !hasVideoParam) {
          logger.log('❌ Nenhum dado de vídeo encontrado após timeout de 10s, redirecionando...')
          navigate('/upload')
        } else if (savedVideoData) {
          // Tentar recuperar dados do sessionStorage uma última vez
          try {
            const parsedData = JSON.parse(savedVideoData)
            logger.log('📁 Dados recuperados no timeout:', parsedData)
            setVideoData(parsedData)
          } catch (error) {
            logger.error('❌ Erro ao recuperar dados no timeout:', error)
            navigate('/upload')
          }
        }
      }, 10000) // ✅ AGUARDAR 10 segundos (mais tempo)
      
      return () => clearTimeout(timeout)
    }
  }, [videoData, navigate, location.state])
  
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [handleTimeUpdate, handleLoadedMetadata])
  
  // Timer para gravação
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 0.1)
      }, 100)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRecording, isPaused])
  
  // Cleanup de resize listeners
  useEffect(() => {
    return () => {
      // Limpar listeners de redimensionamento ao desmontar
      if (resizeMoveHandlerRef.current) {
        document.removeEventListener('mousemove', resizeMoveHandlerRef.current)
      }
      if (resizeEndHandlerRef.current) {
        document.removeEventListener('mouseup', resizeEndHandlerRef.current)
      }
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [])

  // ✅ CORRIGIDO: Cleanup de caption listeners com AbortController
  useEffect(() => {
    return () => {
      // Limpar listeners de legendas ao desmontar
      if (dragHandlersRef.current.abortController) {
        dragHandlersRef.current.abortController.abort()
        dragHandlersRef.current.abortController = null
      }
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [])

  // Cleanup de streams
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      
      recordings.forEach(recording => {
        URL.revokeObjectURL(recording.url)
      })
    }
  }, [recordings])
  
  // Monitoramento de alterações para auto-save
  useEffect(() => {
    if (cutSegments.length > 0 || recordings.length > 0) {
      setUnsavedChanges(true)
    }
  }, [cutSegments, recordings])
  
  // Auto-save
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoSave && unsavedChanges && currentProject) {
      interval = setInterval(() => {
        saveProject()
        logger.log('💾 Auto-save executado')
      }, 30000) // Auto-save a cada 30 segundos
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [autoSave, unsavedChanges, currentProject, saveProject])
  
  // Inicializar projeto padrão
  useEffect(() => {
    if (projects.length === 0) {
      createNewProject()
    }
  }, [projects, createNewProject])
  
  // ===== LOADING STATE =====
  if (!videoData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando editor profissional...</p>
        </div>
      </div>
    )
  }
  
  // ===== UTILITIES =====
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  const getTimelinePosition = (time: number) => {
    return duration > 0 ? (time / duration) * 100 : 0
  }

      return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-white font-medium truncate max-w-[200px]">
                {videoData.name}
              </span>
              <span className="text-gray-400 text-sm hidden md:inline">
                ({(videoData.size / 1024 / 1024).toFixed(1)} MB • {formatTime(videoData.duration)})
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hidden md:flex"
            >
              <Save size={16} className="mr-2" />
              Salvar
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
      
      {/* ===== TOOLBAR PRINCIPAL ===== */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Controles de Reprodução */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="text-white hover:bg-gray-700"
              title="Parar"
            >
              <Square size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek(Math.max(0, currentTime - 10))}
              className="text-white hover:bg-gray-700"
              title="Voltar 10s"
            >
              <SkipBack size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={isPlaying ? handlePause : handlePlay}
              className={`text-white hover:bg-gray-700 ${isPlaying ? 'bg-green-600' : 'bg-blue-600'}`}
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
              className="text-white hover:bg-gray-700"
              title="Avançar 10s"
            >
              <SkipForward size={16} />
            </Button>
            
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className="text-white hover:bg-gray-700"
                title={muted ? "Ativar som" : "Silenciar"}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 hidden md:block"
                title="Volume"
              />
            </div>
          </div>
          
          {/* Ferramentas de Edição */}
          <div className="flex items-center space-x-1">
            <Button
              variant={activeTool === 'select' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('select')}
              className="text-white hover:bg-gray-700"
              title="Selecionar"
            >
              <MousePointer size={16} />
            </Button>
            
            <Button
              variant={activeTool === 'cut' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('cut')}
              className="text-white hover:bg-gray-700"
              title="Cortar"
            >
              <Scissors size={16} />
            </Button>
            
            <Button
              variant={activeTool === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('text')}
              className="text-white hover:bg-gray-700"
              title="Texto"
            >
              <Type size={16} />
            </Button>
            
            <Button
              variant={activeTool === 'image' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('image')}
              className="text-white hover:bg-gray-700"
              title="Imagem"
            >
              <Image size={16} />
            </Button>
            
            <Button
              variant={activeTool === 'narration' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('narration')}
              className="text-white hover:bg-blue-700"
              title="Narração"
            >
              <MicIcon size={16} />
            </Button>
          </div>
          
          {/* Painéis Principais */}
          <div className="flex items-center space-x-1 flex-wrap">
            <Button
              variant={activePanel === 'cuts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('cuts')}
              className="text-white hover:bg-red-600"
              style={{ backgroundColor: activePanel === 'cuts' ? '#dc2626' : 'transparent' }}
              title="Sistema de Corte"
            >
              ✂️
            </Button>
            
            <Button
              variant={activePanel === 'captions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('captions')}
              className="text-white hover:bg-yellow-600"
              style={{ backgroundColor: activePanel === 'captions' ? '#eab308' : 'transparent' }}
              title="Legendas Automáticas"
            >
              📝
            </Button>
            
            <Button
              variant={activePanel === 'narration' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('narration')}
              className="text-white hover:bg-blue-600"
              style={{ backgroundColor: activePanel === 'narration' ? '#3b82f6' : 'transparent' }}
              title="Sistema de Narração"
            >
              🎤
            </Button>
            
            <Button
              variant={activePanel === 'effects' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('effects')}
              className="text-white hover:bg-blue-600"
              style={{ backgroundColor: activePanel === 'effects' ? '#3b82f6' : 'transparent' }}
              title="Efeitos"
            >
              🎨
            </Button>
            
            <Button
              variant={activePanel === 'transitions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('transitions')}
              className="text-white hover:bg-purple-600"
              style={{ backgroundColor: activePanel === 'transitions' ? '#8b5cf6' : 'transparent' }}
              title="Transições"
            >
              🔄
            </Button>
            
            <Button
              variant={activePanel === 'audio' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('audio')}
              className="text-white hover:bg-green-600"
              style={{ backgroundColor: activePanel === 'audio' ? '#10b981' : 'transparent' }}
              title="Áudio"
            >
              🎵
            </Button>
            
            <Button
              variant={activePanel === 'motion' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('motion')}
              className="text-white hover:bg-orange-600"
              style={{ backgroundColor: activePanel === 'motion' ? '#f59e0b' : 'transparent' }}
              title="Motion Graphics"
            >
              🎬
            </Button>
            
            <Button
              variant={activePanel === 'export' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('export')}
              className="text-white hover:bg-emerald-600"
              style={{ backgroundColor: activePanel === 'export' ? '#059669' : 'transparent' }}
              title="Exportar"
            >
              📤
            </Button>
            
            <Button
              variant={activePanel === 'gallery' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('gallery')}
              className="text-white hover:bg-indigo-600"
              style={{ backgroundColor: activePanel === 'gallery' ? '#4f46e5' : 'transparent' }}
              title="Galeria de Clipes"
            >
              📁
            </Button>
          </div>
          
          {/* Tempo e Configurações */}
          <div className="flex items-center space-x-2">
            <div className="text-white font-mono text-sm hidden lg:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            
            <Button
              variant={activePanel === 'settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('settings')}
              className="text-white hover:bg-gray-600"
              title="Configurações"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área Principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Player Redimensionável */}
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {/* Container do Player com Handles */}
            <div 
              ref={playerContainerRef}
              className={`relative player-container ${isResizing ? 'shadow-2xl' : 'shadow-lg'} transition-shadow duration-200`}
              style={{
                width: `${playerDimensions.width}px`,
                height: `${playerDimensions.height}px`,
                border: isResizing ? '2px solid #3b82f6' : '1px solid #374151',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                src={videoData.url}
                className="w-full h-full object-contain bg-black"
                controls={false}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />

              {/* Resize Handles */}
              {!isResizing && (
                <>
                  {/* Corner Handles */}
                  <div
                    className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'nw')}
                    title="Redimensionar (canto superior esquerdo)"
                  />
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'ne')}
                    title="Redimensionar (canto superior direito)"
                  />
                  <div
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'sw')}
                    title="Redimensionar (canto inferior esquerdo)"
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                    title="Redimensionar (canto inferior direito)"
                  />

                  {/* Edge Handles */}
                  <div
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-blue-500 border border-white rounded cursor-n-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'n')}
                    title="Redimensionar altura (topo)"
                  />
                  <div
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-blue-500 border border-white rounded cursor-s-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 's')}
                    title="Redimensionar altura (baixo)"
                  />
                  <div
                    className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-6 bg-blue-500 border border-white rounded cursor-w-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'w')}
                    title="Redimensionar largura (esquerda)"
                  />
                  <div
                    className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-6 bg-blue-500 border border-white rounded cursor-e-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'e')}
                    title="Redimensionar largura (direita)"
                  />
                </>
              )}

              {/* Info de Dimensões */}
              {isResizing && (
                <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {playerDimensions.width} × {playerDimensions.height}
                  {playerDimensions.lockAspectRatio && ' (🔒)'}
                </div>
              )}
            </div>

            {/* Controles de Player */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAspectRatioToggle}
                className={`text-white hover:bg-white/20 ${playerDimensions.lockAspectRatio ? 'bg-blue-600' : ''}`}
                title={`${playerDimensions.lockAspectRatio ? 'Desbloquear' : 'Bloquear'} proporção`}
              >
                {playerDimensions.lockAspectRatio ? '🔒' : '🔓'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetPlayerSize}
                className="text-white hover:bg-white/20"
                title="Resetar tamanho padrão"
              >
                📐
              </Button>
              
              <div className="text-white text-xs">
                {playerDimensions.width}×{playerDimensions.height}
              </div>
            </div>
            
            {/* Canvas invisível para geração de thumbnails */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ display: 'none' }}
            />
            
            {/* Overlay de Loading */}
            {!videoLoaded && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-white text-sm">Carregando vídeo...</p>
                </div>
              </div>
            )}
            
            {/* ✅ OVERLAY DE LEGENDAS ARRASTÁVEIS - SISTEMA PROPORCIONAL */}
            {transcriptionWords.length > 0 && (() => {
              const absolutePos = getAbsolutePosition()
              const canDrag = canDragCaption
              return (
                <div 
                  className={`absolute z-50 inline-block select-none ${
                    !canDrag ? 'cursor-not-allowed opacity-60' : 
                    captionOverlay.isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    left: `${absolutePos.x}px`,
                    top: `${absolutePos.y}px`,
                    transition: captionOverlay.isDragging ? 'none' : 'all 0.2s ease'
                  }}
                  title={!canDrag ? '🔒 Trave o aspect ratio do player para arrastar' : 'Arrastar legenda'}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.nativeEvent.stopImmediatePropagation()
                    handleCaptionMouseDown(e)
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.nativeEvent.stopImmediatePropagation()
                    handleCaptionDoubleClick(e)
                  }}
                >
                {/* ✅ CORRIGIDO: Texto da Legenda - Tamanho Dinâmico */}
                <div 
                  className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg shadow-lg text-center whitespace-nowrap font-bold leading-tight"
                  style={{
                    fontSize: `${captionOverlay.fontSize}px`,
                    border: captionOverlay.isDragging ? '2px solid #3b82f6' : '1px solid transparent',
                    textShadow: captionOverlay.style === 'tiktok-bold' ? '2px 2px 0px #000000' : 'none'
                  }}
                >
                  {transcriptionWords
                    .filter(word => word.start <= currentTime && currentTime <= word.end)
                    .map((word, index, arr) => (
                      <span key={index}>
                        <span
                          className={`${
                            word.highlight ? 'bg-yellow-400 bg-opacity-30 text-yellow-200' : ''
                          } px-1`}
                        >
                          {word.text}
                        </span>
                        {index < arr.length - 1 && ' '}
                      </span>
                    ))}
                </div>

                {/* ✅ CONTROLES REORGANIZADOS - LAYOUT HORIZONTAL MELHORADO */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/90 rounded-lg px-3 py-2 shadow-lg border border-gray-600">
                  <div className="flex items-center space-x-3">
                    {/* Status compacto */}
                    <span className={`text-sm ${canDrag ? 'text-green-400' : 'text-red-400'}`} title={canDrag ? 'Arraste ativo' : 'Trave o aspect ratio do player'}>
                      {canDrag ? '🔒' : '🔓'}
                    </span>
                    
                    {/* Separador visual */}
                    <div className="w-px h-4 bg-gray-600"></div>
                    
                    {/* Controles de fonte agrupados */}
                    <div className="flex items-center space-x-1">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCaptionResize('smaller')
                        }}
                        className="text-white hover:text-blue-400 text-sm px-1.5 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                        title="Diminuir fonte"
                      >
                        🔽
                      </button>
                      <span className="text-white text-xs bg-gray-700 px-2 py-1 rounded min-w-[35px] text-center">
                        {captionOverlay.fontSize}px
                      </span>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCaptionResize('bigger')
                        }}
                        className="text-white hover:text-blue-400 text-sm px-1.5 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                        title="Aumentar fonte"
                      >
                        🔼
                      </button>
                    </div>
                    
                    {/* Separador visual */}
                    <div className="w-px h-4 bg-gray-600"></div>
                    
                    {/* Reset */}
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCaptionOverlay(prev => ({ 
                          ...prev, 
                          x: 50,  // 50% horizontal (centro)
                          y: 85   // 85% vertical (embaixo)
                        }))
                      }}
                      className="text-white hover:text-green-400 text-sm px-1.5 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                      title="Centralizar legenda"
                    >
                      📐
                    </button>
                  </div>
                </div>

                {/* Indicadores de Drag */}
                <div className="absolute -top-5 -right-2 text-white text-xs opacity-70 pointer-events-none">
                  {captionOverlay.isDragging ? '👆' : '✏️'}
                </div>
              </div>
            )})()}

            {/* ✅ EDITOR INLINE DE LEGENDAS */}
            {captionOverlay.isEditing && (
              <div className="absolute z-60 bg-gray-900 border-2 border-blue-500 rounded-lg shadow-xl p-4 min-w-[400px]"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">Editando Legenda</span>
                </div>
                
                <textarea
                  value={captionEditingText}
                  onChange={(e) => setCaptionEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleCaptionEditCancel()
                    } else if (e.key === 'Enter' && e.ctrlKey) {
                      // Ctrl+Enter para salvar
                      handleCaptionEditSave()
                    }
                    // Enter simples permite quebra de linha
                  }}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Digite o texto da legenda..."
                  autoFocus
                />
                
                <div className="flex justify-end space-x-2 mt-3">
                  <Button
                    onClick={handleCaptionEditCancel}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCaptionEditSave}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 text-sm"
                  >
                    Salvar
                  </Button>
                </div>
                
                <div className="text-xs text-gray-400 mt-2">
                  Ctrl+Enter para salvar • Enter para quebrar linha • Esc para cancelar
                </div>
              </div>
            )}
            
            {/* Timeline Avançada com Sistema de Corte */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              {/* Controles de Corte */}
              {activeTool === 'cut' && (
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSetInPoint}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    title="Definir ponto de entrada (I)"
                  >
                    <CornerUpLeft size={12} className="mr-1" />
                    Entrada
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSetOutPoint}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                    title="Definir ponto de saída (O)"
                  >
                    <CornerUpRight size={12} className="mr-1" />
                    Saída
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSplitAtCurrentTime}
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
                      onClick={handleCreateCut}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs animate-pulse"
                      title="Criar corte selecionado"
                    >
                      <Scissors size={12} className="mr-1" />
                      Cortar
                    </Button>
                  )}
                </div>
              )}
              
              {/* Timeline Principal */}
              <div className="flex items-center space-x-2">
                <span className="text-white text-xs font-mono w-12 text-center">
                  {formatTime(currentTime)}
                </span>
                
                <div className="flex-1 relative">
                  {/* Fundo da timeline */}
                  <div className="bg-gray-600 rounded-full h-2 relative">
                    {/* Barra de progresso */}
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-100 relative z-10"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    ></div>
                    
                    {/* Segmentos de corte */}
                    {cutSegments.map(segment => (
                      <div
                        key={segment.id}
                        className={`absolute top-0 h-2 rounded-full opacity-70 cursor-pointer hover:opacity-90 transition-opacity ${
                          segment.selected ? 'ring-2 ring-white' : ''
                        }`}
                        style={{
                          left: `${getTimelinePosition(segment.start)}%`,
                          width: `${getTimelinePosition(segment.end - segment.start)}%`,
                          backgroundColor: segment.color
                        }}
                        onClick={() => handleJumpToSegment(segment)}
                        title={`${segment.name} (${formatTime(segment.start)} - ${formatTime(segment.end)})`}
                      />
                    ))}
                    
                    {/* Marcadores de entrada/saída */}
                    {inPoint !== null && (
                      <div
                        className="absolute top-0 w-1 h-4 bg-green-500 rounded-full z-20"
                        style={{ left: `${getTimelinePosition(inPoint)}%` }}
                        title={`Entrada: ${formatTime(inPoint)}`}
                      />
                    )}
                    
                    {outPoint !== null && (
                      <div
                        className="absolute top-0 w-1 h-4 bg-red-500 rounded-full z-20"
                        style={{ left: `${getTimelinePosition(outPoint)}%` }}
                        title={`Saída: ${formatTime(outPoint)}`}
                      />
                    )}
                    
                    {/* Área de seleção */}
                    {inPoint !== null && outPoint !== null && (
                      <div
                        className="absolute top-0 h-2 bg-yellow-400 opacity-30 rounded-full z-10"
                        style={{
                          left: `${getTimelinePosition(Math.min(inPoint, outPoint))}%`,
                          width: `${getTimelinePosition(Math.abs(outPoint - inPoint))}%`
                        }}
                      />
                    )}
                    
                    {/* Controle de arrasto */}
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={currentTime}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                      title="Arrastar para navegar"
                    />
                  </div>
                  
                  {/* Indicadores de tempo */}
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0:00</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                <span className="text-white text-xs font-mono w-12 text-center">
                  {formatTime(duration)}
                </span>
              </div>
              
              {/* Informações do segmento atual */}
              {selectedSegment && (
                <div className="text-center mt-2">
                  <div className="text-xs text-gray-300">
                    Segmento selecionado: {cutSegments.find(s => s.id === selectedSegment)?.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar dos Painéis */}
        {sidebarOpen && activePanel && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">
                  {activePanel === 'captions' && '📝 Legendas'}
                  {activePanel === 'effects' && '🎨 Efeitos'}
                  {activePanel === 'transitions' && '🔄 Transições'}
                  {activePanel === 'audio' && '🎵 Áudio'}
                  {activePanel === 'motion' && '🎬 Motion'}
                  {activePanel === 'export' && '📤 Exportar'}
                  {activePanel === 'settings' && '⚙️ Configurações'}
                  {activePanel === 'cuts' && '✂️ Cortes'}
                  {activePanel === 'narration' && '🎤 Narração'}
                  {activePanel === 'gallery' && '📁 Galeria'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'captions' && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                      <h4 className="text-yellow-300 font-medium mb-3">🎤 Opções de Legenda</h4>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left hover:bg-yellow-600/20"
                          onClick={handleVideoCaption}
                          disabled={isGeneratingCaption}
                        >
                          <FileText size={16} className="mr-3 text-yellow-400" />
                          <div className="flex-1">
                            <div className="font-medium">
                              {isGeneratingCaption ? 'Gerando legendas...' : 'Legenda do Vídeo'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {isGeneratingCaption ? 'Aguarde o processamento' : 'Transcrever áudio do vídeo'}
                            </div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left hover:bg-yellow-600/20"
                          onClick={handleVoiceOver}
                        >
                          <Mic size={16} className="mr-3 text-yellow-400" />
                          <div className="flex-1">
                            <div className="font-medium">Adicionar Voz de Fora</div>
                            <div className="text-xs text-gray-400">Gravar narração externa</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Status</h4>
                      {isGeneratingCaption ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                            <span className="text-yellow-400 text-sm font-medium">Gerando legendas...</span>
                          </div>
                          {captionProgress && (
                            <p className="text-gray-300 text-xs">
                              {captionProgress}
                            </p>
                          )}
                        </div>
                      ) : transcriptionWords.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-400 text-sm font-medium">✅ Legendas ativas!</span>
                          </div>
                          <div className="text-gray-300 text-xs space-y-1">
                            <p>📝 {transcriptionWords.length} palavras carregadas</p>
                            <p>🎯 Legendas aparecendo no vídeo em tempo real</p>
                            <p>⏱️ Sincronização automática com o player</p>
                          </div>
                          <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                            <p className="text-green-300 text-xs font-medium">
                              🎬 As legendas estão sendo exibidas sobre o vídeo!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          Nenhuma legenda gerada ainda. Clique em "Legenda do Vídeo" para começar.
                        </p>
                      )}
                    </div>
                    
                    {/* ✅ NOVO: Seção de Cache */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        💾 Cache de Legendas
                        {videoData && loadTranscriptionFromCache(videoData) && (
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                            Cache disponível
                          </span>
                        )}
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="text-gray-300 text-xs space-y-1">
                          <p>🎯 Legendas são salvas automaticamente no cache</p>
                          <p>⚡ Carregamento instantâneo em próximos usos</p>
                          <p>💰 Economiza créditos da API</p>
                          <p>📅 Cache válido por 7 dias</p>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            onClick={() => {
                              const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('transcription_'))
                              if (cacheKeys.length > 0) {
                                const confirmClear = confirm(`💾 Encontradas ${cacheKeys.length} legendas no cache.\n\n⚠️ Tem certeza que deseja limpar o cache?\n\nIsso forçará nova transcrição na próxima vez.`)
                                if (confirmClear) {
                                  clearTranscriptionCache()
                                  alert('🧹 Cache limpo com sucesso!')
                                }
                              } else {
                                alert('📭 Nenhuma legenda encontrada no cache.')
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                            size="sm"
                          >
                            🗑️ Limpar Cache
                          </Button>
                          
                          <div className="text-xs text-gray-400">
                            {(() => {
                              const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('transcription_'))
                              return `${cacheKeys.length} ${cacheKeys.length === 1 ? 'vídeo' : 'vídeos'} em cache`
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
                             {activePanel === 'cuts' && (
                 <div className="p-4">
                   <div className="space-y-4">
                     {/* Header do Sistema de Corte */}
                     <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                       <h4 className="text-red-300 font-medium mb-3">✂️ Sistema de Corte Profissional</h4>
                       <div className="text-xs text-gray-400 space-y-1">
                         <p>1. Selecione a ferramenta de corte</p>
                         <p>2. Defina pontos de entrada e saída</p>
                         <p>3. Crie cortes ou divida segmentos</p>
                         <p>4. Gerencie seus clipes</p>
                       </div>
                     </div>
 
                     {/* Controles Rápidos */}
                     <div className="bg-gray-700 rounded-lg p-3">
                       <div className="flex items-center justify-between mb-2">
                         <h4 className="text-white font-medium text-sm">Controles Rápidos</h4>
                         <div className="flex space-x-1">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={handleUndoCut}
                             disabled={cutHistory.length === 0}
                             className="text-gray-400 hover:text-white"
                             title="Desfazer último corte (Ctrl+Z)"
                           >
                             <RotateCcw size={12} />
                           </Button>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={handleSetInPoint}
                           className="bg-green-600 hover:bg-green-700 text-white text-xs"
                           title="Definir ponto de entrada [I]"
                         >
                           <CornerUpLeft size={12} className="mr-1" />
                           Entrada
                         </Button>
                         
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={handleSetOutPoint}
                           className="bg-red-600 hover:bg-red-700 text-white text-xs"
                           title="Definir ponto de saída [O]"
                         >
                           <CornerUpRight size={12} className="mr-1" />
                           Saída
                         </Button>
                         
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={handleSplitAtCurrentTime}
                           disabled={cutSegments.length === 0}
                           className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                           title="Dividir no tempo atual [S]"
                         >
                           <Split size={12} className="mr-1" />
                           Dividir
                         </Button>
                         
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={handleCreateCut}
                           disabled={inPoint === null || outPoint === null}
                           className={`text-white text-xs ${
                             inPoint !== null && outPoint !== null 
                               ? 'bg-purple-600 hover:bg-purple-700 animate-pulse' 
                               : 'bg-gray-600 cursor-not-allowed'
                           }`}
                           title="Criar corte selecionado"
                         >
                           <Scissors size={12} className="mr-1" />
                           Cortar
                         </Button>
                       </div>
                     </div>
 
                     {/* Informações dos Pontos */}
                     <div className="bg-gray-700 rounded-lg p-3">
                       <h4 className="text-white font-medium text-sm mb-2">Pontos de Corte</h4>
                       <div className="space-y-2 text-xs">
                         <div className="flex items-center justify-between">
                           <span className="text-gray-300">Entrada:</span>
                           <span className={`font-mono ${inPoint !== null ? 'text-green-400' : 'text-gray-500'}`}>
                             {inPoint !== null ? formatTime(inPoint) : '--:--'}
                           </span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-gray-300">Saída:</span>
                           <span className={`font-mono ${outPoint !== null ? 'text-red-400' : 'text-gray-500'}`}>
                             {outPoint !== null ? formatTime(outPoint) : '--:--'}
                           </span>
                         </div>
                         {inPoint !== null && outPoint !== null && (
                           <div className="flex items-center justify-between border-t border-gray-600 pt-2">
                             <span className="text-gray-300">Duração:</span>
                             <span className="font-mono text-yellow-400">
                               {formatTime(Math.abs(outPoint - inPoint))}
                             </span>
                           </div>
                         )}
                       </div>
                     </div>
 
                     {/* Lista de Segmentos */}
                     <div className="bg-gray-700 rounded-lg p-3">
                       <div className="flex items-center justify-between mb-2">
                         <h4 className="text-white font-medium text-sm">Segmentos ({cutSegments.length})</h4>
                         <div className="text-xs text-gray-400">
                           Total: {formatTime(cutSegments.reduce((acc, seg) => acc + (seg.end - seg.start), 0))}
                         </div>
                       </div>
                       
                       <div className="space-y-2 max-h-60 overflow-y-auto">
                         {cutSegments.map((segment, index) => (
                           <div
                             key={segment.id}
                             className={`bg-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-500 transition-colors ${
                               selectedSegment === segment.id ? 'ring-2 ring-blue-500' : ''
                             }`}
                             onClick={() => handleSelectSegment(segment.id)}
                           >
                             <div className="flex items-center justify-between">
                               <div className="flex items-center space-x-2">
                                 <div 
                                   className="w-3 h-3 rounded-full"
                                   style={{ backgroundColor: segment.color }}
                                 />
                                 <span className="text-white text-sm font-medium truncate">
                                   {segment.name}
                                 </span>
                               </div>
                               
                               <div className="flex items-center space-x-1">
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     handleJumpToSegment(segment)
                                   }}
                                   className="text-gray-400 hover:text-white p-1"
                                   title="Ir para segmento"
                                 >
                                   <Target size={12} />
                                 </Button>
                                 
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     handleDeleteSegment(segment.id)
                                   }}
                                   className="text-gray-400 hover:text-red-400 p-1"
                                   title="Deletar segmento"
                                 >
                                   <Trash2 size={12} />
                                 </Button>
                               </div>
                             </div>
                             
                             <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                               <span>{formatTime(segment.start)} → {formatTime(segment.end)}</span>
                               <span>{formatTime(segment.end - segment.start)}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
 
                     {/* Ações em Lote */}
                     <div className="bg-gray-700 rounded-lg p-3">
                       <h4 className="text-white font-medium text-sm mb-2">Ações em Lote</h4>
                       <div className="grid grid-cols-2 gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             setCutSegments([])
                             setSelectedSegment(null)
                             setInPoint(null)
                             setOutPoint(null)
                             setMarkers([])
                           }}
                           className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
                           title="Limpar todos os cortes"
                         >
                           <Trash2 size={12} className="mr-1" />
                           Limpar
                         </Button>
                         
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             console.log('📋 Exportando segmentos:', cutSegments)
                             alert(`🎬 Exportar ${cutSegments.length} segmentos\n\nEsta função será implementada na próxima fase!`)
                           }}
                           className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs"
                           title="Exportar segmentos"
                         >
                           <Download size={12} className="mr-1" />
                           Exportar
                         </Button>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
              
              {activePanel === 'narration' && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-300 font-medium mb-3">�� Sistema de Narração</h4>
                      <div className="text-xs text-gray-400 space-y-2">
                        <p>1. Permita o acesso ao microfone para começar a gravar.</p>
                        <p>2. Defina o ponto de entrada (I) e saída (O) para o corte da narração.</p>
                        <p>3. Clique em "Iniciar Gravação" para começar a gravar.</p>
                        <p>4. Para pausar/retomar, clique no botão de "Gravar" (⏸️).</p>
                        <p>5. Para parar a gravação, clique em "Parar Gravação".</p>
                        <p>6. A narração será sincronizada com o vídeo se "Sincronizar com Vídeo" estiver marcado.</p>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Status da Gravação</h4>
                      <div className="flex items-center space-x-2 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={requestMicrophonePermission}
                          disabled={devicePermission === null || devicePermission === false}
                          className="text-gray-400 hover:text-white"
                          title={devicePermission === null ? "Verificando permissão..." : devicePermission ? "Permitir microfone" : "Permissão negada"}
                        >
                          <MicIcon size={16} />
                          {devicePermission === null ? "Verificar Permissão" : devicePermission ? "Permitir Microfone" : "Permissão Negada"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={initializeAudioContext}
                          disabled={!devicePermission}
                          className="text-gray-400 hover:text-white"
                          title="Inicializar AudioContext"
                        >
                          <Headphones size={16} />
                          Inicializar AudioContext
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startRecording}
                          disabled={!devicePermission || !audioContextRef.current || isRecording}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          title="Iniciar Gravação"
                        >
                          <PlayCircle size={12} className="mr-1" />
                          Iniciar Gravação
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={stopRecording}
                          disabled={!isRecording}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs"
                          title="Parar Gravação"
                        >
                          <StopCircle size={12} className="mr-1" />
                          Parar Gravação
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={pauseRecording}
                          disabled={!isRecording}
                          className="text-gray-400 hover:text-white"
                          title={isPaused ? "Retomar Gravação" : "Pausar Gravação"}
                        >
                          {isPaused ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSyncWithVideo(!syncWithVideo)}
                          className="text-gray-400 hover:text-white"
                          title={syncWithVideo ? "Desabilitar sincronização" : "Habilitar sincronização"}
                        >
                          <Activity size={12} />
                          {syncWithVideo ? "Sincronizar com Vídeo" : "Não Sincronizar"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAutoSync(!autoSync)}
                          className="text-gray-400 hover:text-white"
                          title={autoSync ? "Desabilitar auto-sincronização" : "Habilitar auto-sincronização"}
                        >
                          <Upload size={12} />
                          {autoSync ? "Auto-sincronizar" : "Não Auto-sincronizar"}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Configurações de Qualidade</h4>
                      <div className="flex items-center space-x-2 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRecordingQuality('high')}
                          className={`text-gray-400 hover:text-white ${recordingQuality === 'high' ? 'bg-blue-600' : ''}`}
                          title="Alta qualidade (48kHz)"
                        >
                          <Activity size={12} />
                          Alta
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRecordingQuality('medium')}
                          className={`text-gray-400 hover:text-white ${recordingQuality === 'medium' ? 'bg-blue-600' : ''}`}
                          title="Média qualidade (44.1kHz)"
                        >
                          <Activity size={12} />
                          Média
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRecordingQuality('low')}
                          className={`text-gray-400 hover:text-white ${recordingQuality === 'low' ? 'bg-blue-600' : ''}`}
                          title="Baixa qualidade (22.05kHz)"
                        >
                          <Activity size={12} />
                          Baixa
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Gravações</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {recordings.map((recording, index) => (
                          <div
                            key={recording.id}
                            className={`bg-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-500 transition-colors ${
                              recording.selected ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => updateRecordingSettings(recording.id, { selected: !recording.selected })}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: recording.color || '#3b82f6' }}
                                />
                                <span className="text-white text-sm font-medium truncate">
                                  {recording.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    playRecording(recording)
                                  }}
                                  className="text-gray-400 hover:text-white p-1"
                                  title="Reproduzir gravação"
                                >
                                  <PlayCircle size={12} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteRecording(recording.id)
                                  }}
                                  className="text-gray-400 hover:text-red-400 p-1"
                                  title="Deletar gravação"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                              <span>{formatTime(recording.startTime)} → {formatTime(recording.endTime)}</span>
                              <span>{formatTime(recording.duration)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Configurações de Sincronização</h4>
                      <div className="flex items-center space-x-2 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSyncWithVideo(!syncWithVideo)}
                          className="text-gray-400 hover:text-white"
                          title={syncWithVideo ? "Desabilitar sincronização" : "Habilitar sincronização"}
                        >
                          <Activity size={12} />
                          {syncWithVideo ? "Sincronizar com Vídeo" : "Não Sincronizar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAutoSync(!autoSync)}
                          className="text-gray-400 hover:text-white"
                          title={autoSync ? "Desabilitar auto-sincronização" : "Habilitar auto-sincronização"}
                        >
                          <Upload size={12} />
                          {autoSync ? "Auto-sincronizar" : "Não Auto-sincronizar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Painel de Galeria */}
              {activePanel === 'gallery' && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                      <h4 className="text-indigo-300 font-medium mb-3">📁 Galeria de Clipes</h4>
                      <div className="text-xs text-gray-400 space-y-2">
                        <p>1. Crie cortes no vídeo usando a ferramenta de corte (✂️).</p>
                        <p>2. Adicione gravações de voz se necessário (🎤).</p>
                        <p>3. Preencha os detalhes do clipe (nome, descrição, categoria).</p>
                        <p>4. Clique em "Salvar Clipe" para adicionar à galeria.</p>
                        <p>5. Use os filtros para encontrar clipes específicos.</p>
                        <p>6. Carregue clipes salvos para continuar editando.</p>
                      </div>
                    </div>

                    {/* Formulário de Novo Clipe */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">💾 Salvar Clipe Atual</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Nome do Clipe</label>
                          <input
                            type="text"
                            value={clipName}
                            onChange={(e) => setClipName(e.target.value)}
                            placeholder="Digite o nome do clipe..."
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Descrição</label>
                          <textarea
                            value={clipDescription}
                            onChange={(e) => setClipDescription(e.target.value)}
                            placeholder="Descrição do clipe..."
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm h-16 resize-none"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Categoria</label>
                            <select
                              value={clipCategory}
                              onChange={(e) => setClipCategory(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                            >
                              <option value="general">Geral</option>
                              <option value="educational">Educacional</option>
                              <option value="entertainment">Entretenimento</option>
                              <option value="marketing">Marketing</option>
                              <option value="tutorial">Tutorial</option>
                              <option value="review">Review</option>
                              <option value="vlog">Vlog</option>
                              <option value="news">Notícias</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Tags</label>
                            <input
                              type="text"
                              value={clipTags.join(', ')}
                              onChange={(e) => setClipTags(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                              placeholder="tag1, tag2, tag3"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            onClick={saveCurrentClip}
                            disabled={!videoData || cutSegments.length === 0 || isCreatingClip}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            {isCreatingClip ? '💾 Salvando...' : '💾 Salvar Clipe'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => {
                              setClipName('')
                              setClipDescription('')
                              setClipTags([])
                              setClipCategory('general')
                            }}
                            size="sm"
                            className="text-gray-400 border-gray-600"
                            title="Limpar"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">🔍 Filtros</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Buscar</label>
                          <input
                            type="text"
                            value={galleryFilter.searchQuery}
                            onChange={(e) => updateGalleryFilter({ searchQuery: e.target.value })}
                            placeholder="Buscar clipes..."
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Categoria</label>
                            <select
                              value={galleryFilter.category}
                              onChange={(e) => updateGalleryFilter({ category: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                            >
                              <option value="all">Todas</option>
                              <option value="general">Geral</option>
                              <option value="educational">Educacional</option>
                              <option value="entertainment">Entretenimento</option>
                              <option value="marketing">Marketing</option>
                              <option value="tutorial">Tutorial</option>
                              <option value="review">Review</option>
                              <option value="vlog">Vlog</option>
                              <option value="news">Notícias</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Ordenar por</label>
                            <select
                              value={galleryFilter.sortBy}
                              onChange={(e) => updateGalleryFilter({ sortBy: e.target.value as any })}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                            >
                              <option value="date">Data</option>
                              <option value="name">Nome</option>
                              <option value="rating">Avaliação</option>
                              <option value="duration">Duração</option>
                              <option value="views">Visualizações</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateGalleryFilter({ sortOrder: galleryFilter.sortOrder === 'asc' ? 'desc' : 'asc' })}
                            className="text-gray-400 hover:bg-gray-600"
                            title="Inverter Ordem"
                          >
                            {galleryFilter.sortOrder === 'asc' ? '↑' : '↓'}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setGalleryFilter({
                              searchQuery: '',
                              category: 'all',
                              rating: 0,
                              duration: { min: 0, max: 3600 },
                              tags: [],
                              dateRange: { start: null, end: null },
                              sortBy: 'date',
                              sortOrder: 'desc'
                            })}
                            className="text-gray-400 hover:bg-gray-600"
                            title="Limpar Filtros"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Clipes */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">
                        📝 Clipes Salvos ({filterClips(clips).length})
                      </h4>
                      
                      {filterClips(clips).length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-4xl mb-2">📁</div>
                          <p>Nenhum clipe encontrado</p>
                          <p className="text-sm mt-1">
                            {clips.length === 0 ? 'Crie seu primeiro clipe!' : 'Ajuste os filtros'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {filterClips(clips).map((clip) => (
                            <div
                              key={clip.id}
                              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                selectedClip === clip.id
                                  ? 'border-blue-500 bg-blue-900/20'
                                  : 'border-gray-600 bg-gray-800/50 hover:bg-gray-800/70'
                              }`}
                              onClick={() => setSelectedClip(clip.id)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Thumbnail */}
                                <div className="w-16 h-9 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                                  {clip.thumbnail ? (
                                    <img
                                      src={clip.thumbnail}
                                      alt={clip.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      🎬
                                    </div>
                                  )}
                                </div>
                                
                                {/* Informações */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-white text-sm truncate">
                                      {clip.name}
                                    </h5>
                                    {clip.favorite && (
                                      <span className="text-yellow-400 text-xs">⭐</span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>⏱️ {formatTime(clip.duration)}</span>
                                    <span>📊 {clip.segments.length} segmentos</span>
                                    <span>👁️ {clip.viewCount}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        loadClip(clip)
                                      }}
                                      className="text-blue-400 hover:bg-blue-900/20 text-xs px-2 py-1"
                                    >
                                      📁 Carregar
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleClipFavorite(clip.id)
                                      }}
                                      className="text-yellow-400 hover:bg-yellow-900/20 text-xs px-2 py-1"
                                    >
                                      {clip.favorite ? '⭐' : '☆'}
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        exportClip(clip)
                                      }}
                                      className="text-green-400 hover:bg-green-900/20 text-xs px-2 py-1"
                                    >
                                      📤
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteClip(clip.id)
                                      }}
                                      className="text-red-400 hover:bg-red-900/20 text-xs px-2 py-1"
                                    >
                                      🗑️
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Informações do Projeto */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">📋 Projeto Atual</h4>
                      
                      {currentProject ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white">{currentProject.name}</span>
                            <span className="text-xs text-gray-400">
                              v{currentProject.version}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-400">
                            <p>Criado: {currentProject.createdAt.toLocaleDateString()}</p>
                            <p>Atualizado: {currentProject.updatedAt.toLocaleDateString()}</p>
                            <p>Clipes: {currentProject.clips.length}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={saveProject}
                              disabled={!unsavedChanges}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                            >
                              {unsavedChanges ? '💾 Salvar' : '✅ Salvo'}
                            </Button>
                            
                            <Button
                              variant="outline"
                              onClick={() => setAutoSave(!autoSave)}
                              size="sm"
                              className={`${autoSave ? 'text-green-400 border-green-600' : 'text-gray-400 border-gray-600'}`}
                              title={autoSave ? 'Auto-save Ativo' : 'Auto-save Inativo'}
                            >
                              {autoSave ? '🔄' : '⏸️'}
                            </Button>
                          </div>
                          
                          {lastSaved && (
                            <div className="text-xs text-gray-400">
                              Último save: {lastSaved.toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400">
                          <p>Nenhum projeto ativo</p>
                          <Button
                            onClick={createNewProject}
                            className="mt-2 bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            📁 Criar Projeto
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Outros painéis simplificados */}
              {activePanel !== 'captions' && activePanel !== 'cuts' && activePanel !== 'narration' && activePanel !== 'gallery' && (
                <div className="p-4">
                  <div className="text-center text-gray-400">
                    <p>Painel {activePanel} será implementado na próxima fase</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* ===== FOOTER ===== */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span>🎬 ClipsForge Pro</span>
            <span>•</span>
            <span>Editor Profissional - Sistema de Galeria</span>
            <span>•</span>
            <span className="text-indigo-400">Fase 4 Implementada</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Segmentos: {cutSegments.length}</span>
            <span>•</span>
            <span>Gravações: {recordings.length}</span>
            <span>•</span>
            <span>Clipes: {clips.length}</span>
            <span>•</span>
            <span>Ferramenta: {activeTool}</span>
            <span>•</span>
            {isRecording ? (
              <span className="text-red-400">🔴 Gravando</span>
            ) : unsavedChanges ? (
              <span className="text-yellow-400">⚠️ Alterações não salvas</span>
            ) : (
              <span>Pronto para edição</span>
            )}
            <div className={`w-2 h-2 rounded-full animate-pulse ${isRecording ? 'bg-red-500' : unsavedChanges ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoEditorPage 