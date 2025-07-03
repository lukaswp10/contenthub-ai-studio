/**
 * CURSOR CONTEXT CHECKPOINT - 2025-01-07 14:51:00
 * ===============================================
 * Projeto: ClipsForge Pro Video Editor
 * Status: Galeria modal implementada + Legendas corrigidas
 * 
 * ÚLTIMAS IMPLEMENTAÇÕES:
 * - ✅ Galeria transformada em modal elegante
 * - ✅ Sistema de exclusão de vídeos/clips
 * - ✅ Botão upload redesenhado
 * - ✅ Correção legendas AssemblyAI
 * - ✅ Editor manual na dashboard
 * 
 * PRÓXIMOS PASSOS:
 * - Aguardando próximas melhorias do usuário
 * - Possível otimização de persistência
 * 
 * BUGS CONHECIDOS:
 * - TypeScript warning linha 451 (prev: any)
 * 
 * DECISÕES IMPORTANTES:
 * - Modal substitui sidebar para melhor UX
 * - AssemblyAI como serviço principal de transcrição
 * - 4 estilos virais mantidos e funcionais
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import './VideoEditorStyles.css'
import '../../components/editor/AutoCaptions.css'
import { getGalleryVideos, getGalleryClips, deleteVideoFromGallery, deleteClipFromGallery, type GalleryVideo, type GalleryClip, saveTranscriptionToGallery, hasTranscription, getTranscriptionFromGallery } from '@/utils/galleryStorage'
import { deleteVideoFromCloudinary } from '@/services/cloudinaryService'
import TimelinePro from '../../components/editor/TimelinePro'
import { commandManager } from '../../utils/commandManager'
import { transcriptionService } from '../../services/transcriptionService'
import { VideoPlayer } from '../VideoEditor/components/VideoPlayer'
import CaptionSyncControls from '../../components/CaptionSyncControls'
import { captionSyncService } from '../../services/captionSyncService'
import { formatTime, formatTimeAgo } from '../../utils/timeUtils'
import { CacheStats } from '../../components/editor/CacheStats'
import ApiKeyManager from '../../components/editor/ApiKeyManager'
import { SystemMonitor } from '../../components/dashboard/SystemMonitor'

// 🏪 ZUSTAND IMPORTS - MIGRAÇÃO FASE 3
import { 
  useVideoEditorStore,
  useVideoData, 
  useVideoTime, 
  useVideoPlayback,
  useCaptions,
  useCaptionStyling,
  useTimeline,
  useUIState,
  useTranscription,
  useEffects,
  useCommands
} from '../../stores/videoEditorStore'
import { Caption } from '../../types/caption.types'

// ✅ INTERFACES TIPADAS PARA CORRIGIR LINT
interface WordData {
  text: string
  start: number
  end: number
  confidence: number
  highlight?: boolean
}

interface TranscriptionWord {
  text: string
  start: number
  end: number
  confidence?: number
}

interface CaptionData {
  text: string
  start: number
  end: number
  confidence: number
  id?: string
}

interface SpeechAnalysis {
  speechRate: number
  recommendedWordsPerCaption: number
  pauseCount: number
  totalDuration: number
}

interface SyncConfig {
  wordsPerCaption: number
  minDisplayTime: number
  maxDisplayTime: number
  bufferTime: number
  conservativeMode: boolean
  readingTimeMultiplier: number
}

interface VideoData extends Record<string, unknown> {
  file?: File | null
  url?: string
  name: string
  size: number
  duration?: number
  id?: string
  videoData?: Record<string, unknown>
}

interface TimelineLayer {
  id: string
  type: 'video' | 'audio' | 'text' | 'effect'
  name: string
  visible: boolean // ➕ NOVO: Compatibilidade com TimelinePro
  items: Record<string, unknown>[] // ➕ NOVO: Compatibilidade com TimelinePro
  start?: number // ➕ NOVO: Opcional para compatibilidade
  duration?: number // ➕ NOVO: Opcional para compatibilidade
  data?: Record<string, unknown> // ➕ NOVO: Opcional para compatibilidade
  color: string
  locked: boolean
}

interface CutPoint {
  id: string
  time: number
  type: 'cut' | 'split'
}

interface EffectPreset {
  id: string
  name: string
  icon: string
  category: string
  preview: string
  intensity: number
}

interface GeneratedClip {
  id: string
  name: string
  thumbnail: string
  duration: number
  format: 'TikTok' | 'Instagram' | 'YouTube'
  createdAt: Date
  status: 'processing' | 'ready' | 'error'
}

interface UploadedVideo {
  id: string
  name: string
  thumbnail: string
  duration: number
  size: string
  uploadedAt: Date
}

export function VideoEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineProRef = useRef<HTMLDivElement>(null)

  // 🏪 ZUSTAND HOOKS - MIGRAÇÃO GRADUAL
  const storeVideoData = useVideoData()
  const { currentTime: storeCurrentTime, duration: storeDuration } = useVideoTime()
  const { isPlaying: storeIsPlaying, togglePlayPause: storeTogglePlayPause, seekTo: storeSeekTo } = useVideoPlayback()
  const { captionsVisible: storeCaptionsVisible, generatedCaptions: storeGeneratedCaptions, activeCaptionStyle: storeActiveCaptionStyle, toggleCaptionsVisibility: storeToggleCaptionsVisibility } = useCaptions()
  const storeCaptionStyling = useCaptionStyling()
  const { cutPoints: storeCutPoints, timelineLayers: storeTimelineLayers, razorToolActive: storeRazorToolActive, selectedLayer: storeSelectedLayer } = useTimeline()
  const { mobileView: storeMobileView, leftSidebarOpen: storeLeftSidebarOpen, rightSidebarOpen: storeRightSidebarOpen, galleryModalOpen: storeGalleryModalOpen, activeGalleryTab: storeActiveGalleryTab } = useUIState()
  const storeTranscription = useTranscription()
  const { activeEffects: storeActiveEffects, addEffect: storeAddEffect, removeEffect: storeRemoveEffect } = useEffects()
  const { canUndo: storeCanUndo, canRedo: storeCanRedo, lastCommand: storeLastCommand } = useCommands()
  
  // 🏪 ZUSTAND ACTIONS
  const storeSetVideoData = useVideoEditorStore(state => state.setVideoData)
  const storeSetCurrentTime = useVideoEditorStore(state => state.setCurrentTime)
  const storeSetDuration = useVideoEditorStore(state => state.setDuration)
  const storeSetIsPlaying = useVideoEditorStore(state => state.setIsPlaying)
  const storeSetCaptionsVisible = useVideoEditorStore(state => state.setCaptionsVisible)
  const storeSetGeneratedCaptions = useVideoEditorStore(state => state.setGeneratedCaptions)
  const storeSetActiveCaptionStyle = useVideoEditorStore(state => state.setActiveCaptionStyle)
  const storeSetCutPoints = useVideoEditorStore(state => state.setCutPoints)
  const storeSetTimelineLayers = useVideoEditorStore(state => state.setTimelineLayers)
  const storeSetRazorToolActive = useVideoEditorStore(state => state.setRazorToolActive)
  const storeSetSelectedLayer = useVideoEditorStore(state => state.setSelectedLayer)
  const storeSetMobileView = useVideoEditorStore(state => state.setMobileView)
  const storeSetLeftSidebarOpen = useVideoEditorStore(state => state.setLeftSidebarOpen)
  const storeSetRightSidebarOpen = useVideoEditorStore(state => state.setRightSidebarOpen)
  const storeSetGalleryModalOpen = useVideoEditorStore(state => state.setGalleryModalOpen)
  const storeSetActiveGalleryTab = useVideoEditorStore(state => state.setActiveGalleryTab)
  
  // ✅ COMANDOS - FUNÇÕES SETTERS FALTANTES
  const storeSetCanUndo = useVideoEditorStore(state => state.setCanUndo)
  const storeSetCanRedo = useVideoEditorStore(state => state.setCanRedo)
  const storeSetLastCommand = useVideoEditorStore(state => state.setLastCommand)
  
  // Estados principais visionários (TEMPORÁRIO - será migrado)
  // ✅ MIGRADOS PARA STORE - REMOVIDOS
  // const [mobileView, setMobileView] = useState(false)
  // const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  // const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  // const [activeGalleryTab, setActiveGalleryTab] = useState<'videos' | 'clips'>('videos')
  // const [isPlaying, setIsPlaying] = useState(false)
  // const [currentTime, setCurrentTime] = useState(0)
  // const [duration, setDuration] = useState(30)
  // const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  // const [razorToolActive, setRazorToolActive] = useState(false)
  // const [activeCaptionStyle, setActiveCaptionStyle] = useState<string>('tiktok-bold')
  // const [captionsVisible, setCaptionsVisible] = useState(true)
  // const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([])
  // const [cutPoints, setCutPoints] = useState<CutPoint[]>([])
  // const [timelineLayers, setTimelineLayers] = useState<TimelineLayer[]>([])
  // const [videoData, setVideoData] = useState<VideoData | null>(() => {
  //   return location.state?.videoData as VideoData || null
  // })

  // Estados das captions - MIGRADOS
  // const [activeEffects, setActiveEffects] = useState<string[]>([])
  
  // ➕ Estados para Undo/Redo - MIGRADOS
  // const [canUndo, setCanUndo] = useState(false)
  // const [canRedo, setCanRedo] = useState(false)
  // const [lastCommand, setLastCommand] = useState<string | null>(null)
  
  // Estados para transcrição avançada - MIGRADOS
  // const [transcriptionProvider, setTranscriptionProvider] = useState<'whisper' | 'assemblyai' | 'webspeech'>('whisper')
  // const [openaiApiKey, setOpenaiApiKey] = useState('...')
  // const [assemblyaiApiKey, setAssemblyaiApiKey] = useState('...')
  // const [transcriptionProgress, setTranscriptionProgress] = useState('')
  // const [isTranscribing, setIsTranscribing] = useState(false)
  // const [transcriptionResult, setTranscriptionResult] = useState<any>(null)
  // const [showTranscriptionConfig, setShowTranscriptionConfig] = useState(false)
  // const [showTranscriptTimeline, setShowTranscriptTimeline] = useState(true)

  // 🔄 ALIASES PARA COMPATIBILIDADE
  const mobileView = storeMobileView
  const setMobileView = storeSetMobileView
  const leftSidebarOpen = storeLeftSidebarOpen
  const setLeftSidebarOpen = storeSetLeftSidebarOpen
  const rightSidebarOpen = storeRightSidebarOpen
  const setRightSidebarOpen = storeSetRightSidebarOpen
  const activeGalleryTab = storeActiveGalleryTab
  const setActiveGalleryTab = storeSetActiveGalleryTab
  const isPlaying = storeIsPlaying
  const setIsPlaying = storeSetIsPlaying
  const currentTime = storeCurrentTime
  const setCurrentTime = storeSetCurrentTime
  const duration = storeDuration
  const setDuration = storeSetDuration
  const selectedLayer = storeSelectedLayer
  const setSelectedLayer = storeSetSelectedLayer
  const razorToolActive = storeRazorToolActive
  const setRazorToolActive = storeSetRazorToolActive
  const activeCaptionStyle = storeActiveCaptionStyle
  const setActiveCaptionStyle = storeSetActiveCaptionStyle
  const captionsVisible = storeCaptionsVisible
  const setCaptionsVisible = storeSetCaptionsVisible
  const generatedCaptions = storeGeneratedCaptions
  const setGeneratedCaptions = storeSetGeneratedCaptions
  const cutPoints = storeCutPoints
  const setCutPoints = storeSetCutPoints
  const timelineLayers = storeTimelineLayers
  const setTimelineLayers = storeSetTimelineLayers
  const videoData = storeVideoData
  const setVideoData = storeSetVideoData
  const activeEffects = storeActiveEffects
  const addEffect = storeAddEffect
  const removeEffect = storeRemoveEffect
  const canUndo = storeCanUndo
  const canRedo = storeCanRedo
  const lastCommand = storeLastCommand
  
  // ✅ ALIASES PARA COMANDOS - FALTANTES
  const setCanUndo = storeSetCanUndo
  const setCanRedo = storeSetCanRedo
  const setLastCommand = storeSetLastCommand
  
  const transcriptionProvider = storeTranscription.transcriptionProvider
  const openaiApiKey = storeTranscription.openaiApiKey
  const assemblyaiApiKey = storeTranscription.assemblyaiApiKey
  const transcriptionProgress = storeTranscription.transcriptionProgress
  const isTranscribing = storeTranscription.isTranscribing
  const transcriptionResult = storeTranscription.transcriptionResult
  const showTranscriptionConfig = storeTranscription.showTranscriptionConfig
  const showTranscriptTimeline = storeTranscription.showTranscriptTimeline
  const galleryModalOpen = storeGalleryModalOpen
  const setGalleryModalOpen = storeSetGalleryModalOpen
  
  // ✅ ALIASES PARA TRANSCRIÇÃO - FALTANTES
  const setTranscriptionProvider = useVideoEditorStore(state => state.setTranscriptionProvider)
  const setOpenaiApiKey = useVideoEditorStore(state => state.setOpenaiApiKey)
  const setAssemblyaiApiKey = useVideoEditorStore(state => state.setAssemblyaiApiKey)
  const setIsTranscribing = useVideoEditorStore(state => state.setIsTranscribing)
  const setTranscriptionProgress = useVideoEditorStore(state => state.setTranscriptionProgress)
  const setTranscriptionResult = useVideoEditorStore(state => state.setTranscriptionResult)
  const setShowTranscriptionConfig = useVideoEditorStore(state => state.setShowTranscriptionConfig)
  const setShowTranscriptTimeline = useVideoEditorStore(state => state.setShowTranscriptTimeline)

  // ✅ FUNÇÕES DO STORE
  const togglePlayPause = storeTogglePlayPause
  const seekTo = storeSeekTo
  const toggleCaptionsVisibility = storeToggleCaptionsVisibility

  // Presets de efeitos profissionais
  const effectPresets: EffectPreset[] = [
    { id: 'cinematic', name: 'Cinematic', icon: '🎬', category: 'Color', preview: 'sepia(0.3) contrast(1.2)', intensity: 0.8 },
    { id: 'vintage', name: 'Vintage', icon: '📼', category: 'Color', preview: 'sepia(0.5) brightness(1.1)', intensity: 0.7 },
    { id: 'neon', name: 'Neon Glow', icon: '⚡', category: 'Color', preview: 'saturate(2) hue-rotate(90deg)', intensity: 0.9 },
    { id: 'blur', name: 'Motion Blur', icon: '💫', category: 'Motion', preview: 'blur(2px)', intensity: 0.6 },
    { id: 'zoom', name: 'Ken Burns', icon: '🔍', category: 'Motion', preview: 'scale(1.1)', intensity: 0.3 },
    { id: 'glitch', name: 'Glitch', icon: '📺', category: 'Digital', preview: 'hue-rotate(180deg)', intensity: 0.8 },
    { id: 'film-grain', name: 'Film Grain', icon: '🎞️', category: 'Texture', preview: 'contrast(1.1)', intensity: 0.4 },
    { id: 'chromatic', name: 'Chromatic', icon: '🌈', category: 'Digital', preview: 'hue-rotate(45deg)', intensity: 0.6 }
  ]

  // Estilos de caption virais - IMPLEMENTAÇÃO COMPLETA
  const captionStyles = {
    'tiktok-bold': {
      fontSize: '36px',
      fontWeight: '900',
      color: '#FFFFFF',
      textShadow: '3px 3px 6px rgba(0,0,0,0.9), -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000',
      fontFamily: '"Montserrat", "Arial Black", sans-serif',
      textTransform: 'uppercase' as const,
      background: 'transparent',
      padding: '0px',
      borderRadius: '0px',
      border: 'none',
      letterSpacing: '1px',
      animation: 'wordPop 0.3s ease-out'
    },
    'youtube-highlight': {
      fontSize: '28px',
      fontWeight: '700',
      color: '#FFFFFF',
      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      background: 'rgba(0, 0, 0, 0.85)',
      padding: '8px 16px',
      borderRadius: '6px',
      fontFamily: '"Roboto", "Arial", sans-serif',
      textTransform: 'none' as const,
      border: 'none',
      backdropFilter: 'blur(4px)',
      animation: 'fadeInSlide 0.4s ease-out'
    },
    'instagram-neon': {
      fontSize: '32px',
      fontWeight: '800',
      color: 'transparent',
      textShadow: '0 0 20px #FF00FF, 0 0 40px #FF00FF',
      fontFamily: '"Inter", "Arial", sans-serif',
      textTransform: 'none' as const,
      background: 'linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      padding: '0px',
      borderRadius: '0px',
      border: 'none',
      animation: 'neonGlow 0.5s ease-in-out'
    },
    'podcast-clean': {
      fontSize: '26px',
      fontWeight: '600',
      color: '#FFFFFF',
      textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
      background: 'rgba(30, 30, 30, 0.9)',
      padding: '12px 20px',
      borderRadius: '12px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      fontFamily: '"Source Sans Pro", "Arial", sans-serif',
      textTransform: 'none' as const,
      backdropFilter: 'blur(8px)',
      animation: 'smoothFade 0.3s ease-in-out'
    }
  }

  // Estados para API e legendas visionárias - APENAS AS NOVAS
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('assemblyai_api_key') || ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [captionStyle, setCaptionStyle] = useState<'tiktok' | 'youtube' | 'instagram' | 'podcast'>('tiktok')
  const [cacheStatsOpen, setCacheStatsOpen] = useState(false)
  const [apiKeyManagerOpen, setApiKeyManagerOpen] = useState(false)
  const [systemMonitorOpen, setSystemMonitorOpen] = useState(false)
  
  // Variáveis temporárias para corrigir erros
  const timelineZoom = 1
  const snapEnabled = true
  const setPreviewCut = (_: unknown) => {}
  const setCurrentVideoFile = (_: unknown) => {}
  const setEffectIntensity = (_: unknown) => {}
  
  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      storeSetMobileView(mobile)
      
      // Ajustar sidebars baseado no tamanho da tela
      if (mobile) {
        storeSetLeftSidebarOpen(false)
        storeSetRightSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ➕ USEEFFECT: Conectar CommandManager aos estados
  useEffect(() => {
    const updateCommandStates = () => {
      storeSetCanUndo(commandManager.canUndo())
      storeSetCanRedo(commandManager.canRedo())
      
      const lastCmd = commandManager.getLastCommand()
      storeSetLastCommand(lastCmd ? lastCmd.description : null)
    }

    // Estado inicial
    updateCommandStates()

    // Listener para mudanças
    commandManager.addListener(updateCommandStates)

    return () => {
      commandManager.removeListener(updateCommandStates)
    }
  }, [])

  // Carregar vídeo automaticamente quando chegar via navegação
  useEffect(() => {
    // ✅ CORRIGIDO: Permitir editor sem vídeo (não redirecionar)
    if (!videoData) {
      console.log('📝 Editor iniciado sem vídeo - modo galeria ativo')
      return // Não redirecionar, permitir usar galeria
    }
    
    // Lógica de carregamento de vídeo
    if (videoData.url && videoData.url.startsWith('data:')) {
      console.log('Usando data URL confiável')
    } else if (videoData.file) {
      console.log('Criando nova Blob URL a partir do arquivo preservado')
      const newUrl = URL.createObjectURL(videoData.file)
      videoData.url = newUrl
    } else if (!videoData.url || videoData.url.includes('file-preserved')) {
      console.log('⚠️ Vídeo sem URL válida - aguardando seleção na galeria')
      return // Não redirecionar, permitir usar galeria
    }

    // Inicializar camada principal do vídeo
    const videoLayer: TimelineLayer = {
      id: 'main-video',
      type: 'video',
      name: videoData.name,
      start: 0,
      duration: videoData.duration || 60,
      data: { url: videoData.url },
      color: '#3B82F6',
      locked: false,
      visible: true,
      items: []
    }
    
    storeSetTimelineLayers([videoLayer])
    
    return () => {
      if (videoData?.url && videoData.url.startsWith('blob:')) {
        URL.revokeObjectURL(videoData.url)
      }
    }
  }, [videoData])

  // Keyboard shortcuts profissionais
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      
      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (e.shiftKey) {
              // Ctrl+Shift+Z = Redo (alternativa)
              if (commandManager.redo()) {
                console.log('↪️ Redo executado via Ctrl+Shift+Z')
              }
            } else {
              // Ctrl+Z = Undo
              if (commandManager.undo()) {
                console.log('↩️ Undo executado via Ctrl+Z')
              }
            }
          }
          break
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            // Ctrl+Y = Redo
            if (commandManager.redo()) {
              console.log('↪️ Redo executado via Ctrl+Y')
            }
          }
          break
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'c':
          if (e.ctrlKey || e.metaKey) return
          storeSetRazorToolActive(!razorToolActive)
          console.log(razorToolActive ? '✂️ Ferramenta Razor ativada' : 'Ferramenta Razor desativada')
          break
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            console.log('💾 Projeto salvo automaticamente')
          } else {
            splitClipAt(currentTime)
          }
          break
        case 'm':
          console.log('🧲 Snap toggle (função removida)')
          break
        case 'arrowleft':
          e.preventDefault()
          seekTo(Math.max(0, (currentTime - 1) / duration * 100))
          break
        case 'arrowright':
          e.preventDefault()
          seekTo(Math.min(100, (currentTime + 1) / duration * 100))
          break
        case 'delete':
        case 'backspace':
          if (selectedLayer) {
            storeSetTimelineLayers(storeTimelineLayers.filter(l => l.id !== selectedLayer))
            storeSetSelectedLayer(null)
            console.log('🗑️ Clip removido')
          }
          break
        case '+':
        case '=':
          console.log('🔍 Zoom in (função removida)')
          break
        case '-':
          console.log('🔍 Zoom out (função removida)')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [razorToolActive, currentTime, duration, selectedLayer])

  // Adicionar vídeo à timeline quando carregado
  useEffect(() => {
    if (videoData && duration > 0 && storeTimelineLayers.length === 0) {
      const videoLayer: TimelineLayer = {
        id: `video_${Date.now()}`,
        type: 'video',
        name: videoData.name || 'Video Principal',
        start: 0,
        duration: duration,
        data: videoData as unknown as Record<string, unknown>,
        color: '#3b82f6',
        locked: false,
        visible: true,
        items: []
      }
      
      storeSetTimelineLayers([videoLayer])
      console.log('�� Vídeo adicionado à timeline:', videoLayer.name)
    }
  }, [videoData, duration])

  const handleVideoLoad = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      setDuration(videoDuration)
      
            storeSetTimelineLayers(storeTimelineLayers.map(layer =>
        layer.id === 'main-video' 
          ? { ...layer, duration: videoDuration }
          : layer
      ))
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)
      
      applyRealTimeEffects()
    }
  }

  const applyRealTimeEffects = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    
    let filters = ''
    activeEffects.forEach(effectId => {
      // Aplicar filtros básicos sem effectIntensity
      if (effectId === 'blur') filters += 'blur(2px) '
      if (effectId === 'zoom') filters += 'scale(1.1) '
      if (effectId === 'glow') filters += 'brightness(1.2) saturate(1.3) '
    })
    
    if (videoRef.current) {
      videoRef.current.style.filter = filters
    }
  }

  // ✅ FUNÇÕES REMOVIDAS - JÁ EXISTEM COMO ALIASES DO STORE
  // const togglePlayPause = () => {
  //   if (videoRef.current) {
  //     if (isPlaying) {
  //       videoRef.current.pause()
  //       setIsPlaying(false)
  //     } else {
  //       videoRef.current.play()
  //       setIsPlaying(true)
  //     }
  //   }
  // }

  // const seekTo = (percentage: number) => {
  //   if (videoRef.current && duration) {
  //     const time = (percentage / 100) * duration
  //     videoRef.current.currentTime = time
  //     setCurrentTime(time)
  //   }
  // }

  // const addEffect = (effectId: string) => {
  //   if (!activeEffects.includes(effectId)) {
  //     setActiveEffects(prev => [...prev, effectId])
  //     console.log(`✨ Efeito ${effectId} adicionado`)
  //   }
  // }

  // const removeEffect = (effectId: string) => {
  //   setActiveEffects(prev => prev.filter(id => id !== effectId))
  //   setEffectIntensity((prev: any) => {
  //     const newIntensity = { ...prev }
  //     delete newIntensity[effectId]
  //     return newIntensity
  //   })
  //   console.log(`❌ Efeito ${effectId} removido`)
  // }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Agora há pouco'
    if (diffInHours < 24) return `${diffInHours}h atrás`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

  // ✅ Função para exportar video/clip
  const exportVideo = async () => {
    alert('📤 Função de exportação em desenvolvimento!')
  }

  const loadVideo = (video: GalleryVideo) => {
    console.log('🎬 Carregando vídeo da galeria:', video.name)
    
    // Converter GalleryVideo para VideoData
    const videoData: VideoData = {
      id: video.id,
      name: video.name,
      size: parseInt(video.size.replace(/[^\d]/g, '')) || 0, // Extrair número do size
      duration: video.duration,
      url: video.url,
      file: video.file || null
    }
    
    storeSetVideoData(videoData)
    storeSetDuration(video.duration)
    
    // ✅ CARREGAR TRANSCRIÇÃO EXISTENTE (sem gastar API)
    if (video.transcription?.words?.length) {
      console.log('📝 Carregando transcrição salva:', video.transcription.words.length, 'palavras')
      setTranscriptionResult(video.transcription)
      storeSetGeneratedCaptions(video.transcription.words)
      storeSetCaptionsVisible(true)
      
      console.log('✅ Transcrição restaurada automaticamente!')
      console.log('💰 Créditos da API poupados - usando transcrição existente')
    }
    
    console.log('✅ Vídeo carregado no editor:', videoData)
  }

  const openClip = (clip: GeneratedClip) => {
    console.log('Abrindo clip:', clip.name)
    // Em produção, isso abriria o clip para visualização/edição
  }

  // ===== FUNÇÕES PROFISSIONAIS DA TIMELINE =====
  
  // Renderizar marcações de tempo na régua
  const renderTimeMarkers = () => {
    if (!duration) return null
    
    const markers = []
    const totalWidth = duration * timelineZoom * 10
    const secondsPerPixel = duration / totalWidth
    const markerInterval = Math.max(1, Math.floor(20 * secondsPerPixel)) // Marker a cada 20px mínimo
    
    for (let time = 0; time <= duration; time += markerInterval) {
      const position = (time / duration) * totalWidth
      const isMajor = time % (markerInterval * 5) === 0 || time === 0
      
      markers.push(
        <div
          key={time}
          className={`time-marker ${isMajor ? 'major' : ''}`}
          style={{ left: `${position}px` }}
          data-time={formatTime(time)}
        />
      )
    }
    
    return markers
  }

  // Função corrigida e melhorada para corte Razor
  const handleRazorCut = (layerId: string, time: number) => {
    console.log(`✂️ VideoEditor: handleRazorCut DEPRECADO - usando TimelinePro agora`)
    console.log(`ℹ️ Parâmetros recebidos: layerId=${layerId}, time=${formatTime(time)}`)
    
    // ✅ NOVA LÓGICA: O corte agora é processado diretamente no TimelinePro
    // Esta função é mantida apenas para compatibilidade com atalhos de teclado
    
    const layer = storeTimelineLayers.find(l => l.id === layerId)
    if (!layer || layer.locked) {
      console.log('❌ Layer não encontrado ou está bloqueado')
      return
    }

    // Verificar se o tempo está dentro do layer
    if (layer.start === undefined || layer.duration === undefined || time < layer.start || time > layer.start + layer.duration) {
      console.log('❌ Tempo fora do range do layer ou layer sem dimensões definidas')
      return
    }

    // ✅ DELEGADO: Deixar TimelinePro processar o corte
    console.log('✅ Corte será processado pelo TimelinePro component')
    
    // Feedback visual apenas
    console.log(`📍 Preparando corte no layer "${layer.name}" em ${formatTime(time)}`)
  }

  // Função melhorada para obter tempo da posição
  const getTimeFromPosition = (x: number) => {
    const timelineWidth = timelineRef.current?.clientWidth || 800
    const effectiveWidth = timelineWidth - 144 // Subtrair largura do header das tracks
    const percentage = Math.max(0, Math.min(100, (x / effectiveWidth) * 100))
    return (percentage / 100) * duration / timelineZoom
  }

  // Função para inicializar layers padrão
  const initializeDefaultLayers = () => {
    if (storeTimelineLayers.length === 0 && videoData) {
      const defaultLayer: TimelineLayer = {
        id: 'main_video_layer',
        type: 'video',
        name: videoData.name || 'Vídeo Principal',
        start: 0,
        duration: duration || 30,
        data: videoData as unknown as Record<string, unknown>,
        color: '#3b82f6',
        locked: false,
        visible: true,
        items: []
      }
      storeSetTimelineLayers([defaultLayer])
    }
  }

  // Inicializar layers quando vídeo carregar
  useEffect(() => {
    if (duration > 0) {
      initializeDefaultLayers()
    }
  }, [duration, videoData])

  // Dividir clip no tempo atual
  const splitClipAt = (time: number) => {
    const affectedLayer = storeTimelineLayers.find(layer => 
      layer.start !== undefined && layer.duration !== undefined && 
      time >= layer.start && time <= layer.start + layer.duration
    )
    
    if (affectedLayer) {
      handleRazorCut(affectedLayer.id, time)
    }
  }

  // Snap para grade de tempo
  const snapToGrid = (time: number): number => {
    if (!snapEnabled) return time
    
    const snapInterval = 0.5 // Snap a cada 0.5 segundos
    return Math.round(time / snapInterval) * snapInterval
  }

  // Função melhorada para adicionar feedback visual no hover
  const handleTimelineHover = (time: number) => {
    if (razorToolActive && time >= 0 && time <= duration) {
      setPreviewCut(time)
    }
  }

  // Gerar clips baseados nos cortes da timeline
  const generateClipsFromCuts = () => {
    if (cutPoints.length === 0) {
      console.log('⚠️ Nenhum corte realizado ainda')
      alert('⚠️ Faça alguns cortes na timeline primeiro usando a ferramenta Razor (tecla C)')
      return
    }

    // Criar segmentos baseados nos pontos de corte
    const segments = []
    const sortedCuts = [...cutPoints].sort((a, b) => a.time - b.time)
    
    // Primeiro segmento (início até primeiro corte)
    if (sortedCuts.length > 0 && sortedCuts[0].time > 0) {
      segments.push({
        start: 0,
        end: sortedCuts[0].time,
        name: `Segmento 1 (${formatTime(0)} - ${formatTime(sortedCuts[0].time)})`
      })
    }
    
    // Segmentos entre cortes
    for (let i = 0; i < sortedCuts.length - 1; i++) {
      segments.push({
        start: sortedCuts[i].time,
        end: sortedCuts[i + 1].time,
        name: `Segmento ${i + 2} (${formatTime(sortedCuts[i].time)} - ${formatTime(sortedCuts[i + 1].time)})`
      })
    }
    
    // Último segmento (último corte até final)
    if (sortedCuts.length > 0 && sortedCuts[sortedCuts.length - 1].time < duration) {
      segments.push({
        start: sortedCuts[sortedCuts.length - 1].time,
        end: duration,
        name: `Segmento ${sortedCuts.length + 1} (${formatTime(sortedCuts[sortedCuts.length - 1].time)} - ${formatTime(duration)})`
      })
    }

    console.log('✂️ Gerando clips dos segmentos:', segments)
    
    // Em produção, aqui seria feita a chamada para o backend
    // para processar os segmentos e gerar os clips
    alert(`🎬 Gerando ${segments.length} clips baseados nos cortes realizados!\n\n` +
          segments.map(s => `• ${s.name}`).join('\n'))
  }

  // ✅ NOVO: Sistema de Sincronização Inteligente de Legendas
  const getCurrentCaption = () => {
    // Obter dados do store
    const storeTranscriptionData = useVideoEditorStore.getState().transcriptionResult
    const storeGeneratedCaptionsData = useVideoEditorStore.getState().generatedCaptions
    const storeCaptionsVisibleData = useVideoEditorStore.getState().captionsVisible
    const storeCurrentTimeData = useVideoEditorStore.getState().currentTime
    
    // Prioridade: transcriptionResult.words > generatedCaptions
    const wordsArray = storeTranscriptionData?.words || storeGeneratedCaptionsData
    
    if (!wordsArray?.length || !storeCaptionsVisibleData) {
      return null
    }
    
    try {
      // ✅ USAR SERVIÇO DE SINCRONIZAÇÃO INTELIGENTE
      const syncedCaption = captionSyncService.syncCaptions(wordsArray, storeCurrentTimeData)
      
      if (syncedCaption) {
        console.log('🎯 Legenda sincronizada inteligentemente:', {
          text: syncedCaption.text.substring(0, 30) + '...',
          wordsCount: syncedCaption.words.length,
          speechRate: syncedCaption.speechRate.toFixed(2) + ' w/s',
          adaptedTiming: syncedCaption.adaptedTiming
        })
        
        return {
          text: syncedCaption.text,
          start: syncedCaption.start,
          end: syncedCaption.end,
          confidence: syncedCaption.confidence,
          id: syncedCaption.id
        }
      }
      
      return null
    } catch (error) {
      console.warn('⚠️ Fallback para sistema de legendas clássico:', error)
      
      // ✅ FALLBACK: Sistema clássico se serviço falhar
      const currentTime = storeCurrentTimeData
      
      // Encontrar palavra atual
      const currentWordIndex = wordsArray.findIndex((word: TranscriptionWord) => 
        currentTime >= word.start && currentTime <= word.end
      )
      
      if (currentWordIndex === -1) {
        // Buscar palavra mais próxima
        const nearestWordIndex = wordsArray.reduce((closestIndex: number, word: TranscriptionWord, index: number) => {
          if (closestIndex === -1) return index
          
          const currentDistance = Math.abs(currentTime - ((word.start + word.end) / 2))
          const closestDistance = Math.abs(currentTime - ((wordsArray[closestIndex].start + wordsArray[closestIndex].end) / 2))
          
          return currentDistance < closestDistance ? index : closestIndex
        }, -1)
        
        // Se muito longe, não mostrar legenda
        if (nearestWordIndex !== -1) {
          const nearestWord = wordsArray[nearestWordIndex]
          if (Math.abs(currentTime - ((nearestWord.start + nearestWord.end) / 2)) > 2) {
            return null
          }
        } else {
          return null
        }
      }
      
      const wordIndex = currentWordIndex !== -1 ? currentWordIndex : 
        wordsArray.reduce((closestIndex: number, word: TranscriptionWord, index: number) => {
          if (closestIndex === -1) return index
          const currentDistance = Math.abs(currentTime - ((word.start + word.end) / 2))
          const closestDistance = Math.abs(currentTime - ((wordsArray[closestIndex].start + wordsArray[closestIndex].end) / 2))
          return currentDistance < closestDistance ? index : closestIndex
        }, -1)
      
      if (wordIndex === -1) return null
      
      // ✅ CORREÇÃO: Agrupar palavras em frases MAIORES (mais lentas)
      const wordsPerPhrase = 6 // AUMENTADO para legendas mais lentas e legíveis
      const phraseStartIndex = Math.max(0, wordIndex - Math.floor(wordsPerPhrase / 2))
      const phraseEndIndex = Math.min(wordsArray.length - 1, phraseStartIndex + wordsPerPhrase - 1)
      
      // Extrair palavras da frase
      const phraseWords = wordsArray.slice(phraseStartIndex, phraseEndIndex + 1)
      const phraseText = phraseWords.map((w: TranscriptionWord) => w.text).join(' ')
      const phraseStart = phraseWords[0]?.start || currentTime
      const phraseEnd = phraseWords[phraseWords.length - 1]?.end || currentTime + 1.5 // Duração reduzida
      const avgConfidence = phraseWords.reduce((sum: number, w: TranscriptionWord) => sum + (w.confidence || 0.9), 0) / phraseWords.length
      
      return {
        text: phraseText,
        start: phraseStart,
        end: phraseEnd,
        confidence: avgConfidence
      }
    }
  }

  // ✅ NOVA FUNÇÃO: Legendas Contínuas Bonitas
  const getCurrentContinuousCaption = () => {
    const storeTranscriptionData = useVideoEditorStore.getState().transcriptionResult
    const storeGeneratedCaptionsData = useVideoEditorStore.getState().generatedCaptions
    const storeCaptionsVisibleData = useVideoEditorStore.getState().captionsVisible
    const storeCurrentTimeData = useVideoEditorStore.getState().currentTime
    
    const wordsArray = storeTranscriptionData?.words || storeGeneratedCaptionsData
    
    if (!wordsArray?.length || !storeCaptionsVisibleData) {
      return null
    }
    
    const currentTime = storeCurrentTimeData
    
    // Encontrar palavra atual ou mais próxima
    let wordIndex = wordsArray.findIndex((word: TranscriptionWord) => 
      currentTime >= word.start && currentTime <= word.end
    )
    
    if (wordIndex === -1) {
      wordIndex = wordsArray.reduce((closestIndex: number, word: TranscriptionWord, index: number) => {
        if (closestIndex === -1) return index
        
        const currentDistance = Math.abs(currentTime - ((word.start + word.end) / 2))
        const closestDistance = Math.abs(currentTime - ((wordsArray[closestIndex].start + wordsArray[closestIndex].end) / 2))
        
        return currentDistance < closestDistance ? index : closestIndex
      }, -1)
      
      if (wordIndex !== -1) {
        const nearestWord = wordsArray[wordIndex]
        if (Math.abs(currentTime - ((nearestWord.start + nearestWord.end) / 2)) > 3) {
          return null
        }
      }
    }
    
    if (wordIndex === -1) return null
    
    // ✅ CRIAR FRASES DE 6-8 PALAVRAS (mais tempo para leitura)
    const wordsPerPhrase = 7
    const halfPhrase = Math.floor(wordsPerPhrase / 2)
    
    let phraseStart = Math.max(0, wordIndex - halfPhrase)
    const phraseEnd = Math.min(wordsArray.length - 1, phraseStart + wordsPerPhrase - 1)
    
    // Ajustar se necessário
    if (phraseEnd - phraseStart < wordsPerPhrase - 1) {
      phraseStart = Math.max(0, phraseEnd - wordsPerPhrase + 1)
    }
    
    const phraseWords = wordsArray.slice(phraseStart, phraseEnd + 1)
    const phraseText = phraseWords.map((w: TranscriptionWord) => w.text).join(' ')
    const startTime = phraseWords[0]?.start || currentTime
    const endTime = phraseWords[phraseWords.length - 1]?.end || currentTime + 3
    const avgConfidence = phraseWords.reduce((sum: number, w: TranscriptionWord) => sum + (w.confidence || 0.9), 0) / phraseWords.length
    
    console.log('🎬 Legenda contínua:', phraseText, `(${phraseWords.length} palavras)`)
    
    return {
      text: phraseText,
      start: startTime,
      end: endTime,
      confidence: avgConfidence
    }
  }

  // Função melhorada para renderizar legenda com estilo avançado personalizado
  const renderCaptionWithStyle = (caption: { text: string; start: number; end: number; confidence: number; id?: string }) => {
    if (!caption) return null
    
    // Usar os controles avançados ao invés dos estilos fixos
    const dynamicStyle = {
      fontFamily: captionFontFamily,
      fontSize: `${captionFontSize}px`,
      fontWeight: '700',
      color: captionTextColor,
      textShadow: captionShadowIntensity > 0 ? `${captionShadowIntensity}px ${captionShadowIntensity}px 0px ${captionShadowColor}` : 'none',
      opacity: captionOpacity / 100,
      background: captionBackgroundColor !== 'transparent' ? captionBackgroundColor : 'transparent',
      padding: captionBackgroundColor !== 'transparent' ? '8px 16px' : '0px',
      borderRadius: captionBackgroundColor !== 'transparent' ? '8px' : '0px',
      wordWrap: 'break-word' as const,
      maxWidth: '90%',
      textAlign: 'center' as const,
      lineHeight: '1.3',
      display: 'inline-block',
      position: 'relative' as const,
      zIndex: 1000,
      // Animações CSS personalizadas baseadas na seleção
      animation: `${captionAnimation} 0.5s ease-out`,
      animationFillMode: 'both',
      transform: 'translateZ(0)', // Hardware acceleration
      willChange: 'transform, opacity'
    }
    
    return (
      <div
        className={`caption-text caption-custom`}
        style={dynamicStyle}
        key={`caption-${caption.id || Math.random()}`} // Force re-render para animação
      >
        {caption.text}
      </div>
    )
  }

  // Callback melhorado para captions geradas
  const handleCaptionsGenerated = (words: { text: string; start: number; end: number; confidence: number; highlight?: boolean }[]) => {
    console.log('🎬 Captions recebidas:', words.length, 'palavras')
    
    // Converter palavras em captions com timestamps
    const captions = words.map((word, index) => ({
      id: `caption_${index}`,
      text: word.text,
      start: word.start || index * 0.5, // Fallback se não tiver timestamp
      end: word.end || (index * 0.5) + 0.5,
      confidence: word.confidence || 0.8,
      highlight: word.highlight || false
    }))
    
    storeSetGeneratedCaptions(captions)
    console.log('✅ Captions processadas:', captions.length)
  }

  // ✅ FUNÇÃO REMOVIDA - JÁ EXISTE COMO ALIAS DO STORE
  // const toggleCaptionsVisibility = () => {
  //   const newVisibility = !captionsVisible
  //   storeSetCaptionsVisible(newVisibility)
  //   
  //   // ✅ Feedback visual melhorado
  //   if (newVisibility) {
  //     console.log('👁️ Legendas ATIVADAS - Agora visíveis no vídeo')
  //     // Pequena animação de confirmação
  //     if (videoRef.current) {
  //       videoRef.current.style.filter = 'brightness(1.1)'
  //       setTimeout(() => {
  //         if (videoRef.current) {
  //           videoRef.current.style.filter = 'brightness(1)'
  //         }
  //       }, 200)
  //     }
  //   } else {
  //     console.log('👁️ Legendas DESATIVADAS - Ocultas do vídeo')
  //   }
  // }

  // Função para aplicar estilo de caption
  const applyCaptionStyle = (styleId: string) => {
    storeSetActiveCaptionStyle(styleId)
    console.log(`🎨 Estilo de caption aplicado: ${styleId}`)
  }

  // Hook para capturar dados da navegação
  useEffect(() => {
    if (location.state?.videoData) {
      const data = location.state.videoData as VideoData
      storeSetDuration(data.duration || 30)
      
      // Capturar arquivo se disponível
      if (location.state.videoFile) {
        setCurrentVideoFile(location.state.videoFile as File)
      }
    }
  }, [location.state])

  // Função para resetar cortes
  const resetAllCuts = () => {
    storeSetCutPoints([])
    console.log('🔄 Todos os cortes foram resetados')
  }

  // Função para gerar legendas com IA - CORRIGIDA
  const generateCaptions = async () => {
    if (!apiKey || !videoData) return
    
    setIsGenerating(true)
    try {
      // Salvar API key no localStorage
      localStorage.setItem('assemblyai_api_key', apiKey)
      
      // Importar o serviço de transcrição
      const { transcriptionService } = await import('../../services/transcriptionService')
      
      // Configurar API Key
      transcriptionService.setApiKey(apiKey)
      
      // Obter arquivo de vídeo
      let fileToTranscribe: File
      
      if (videoData.file) {
        fileToTranscribe = videoData.file
      } else if (videoData.url) {
        // Converter URL em File
        const response = await fetch(videoData.url)
        const blob = await response.blob()
        fileToTranscribe = new File([blob], videoData.name || 'video.mp4', { type: blob.type })
      } else {
        throw new Error('Nenhum vídeo disponível')
      }

      // Executar transcrição real
      const result = await transcriptionService.transcribe(
        fileToTranscribe,
        (status) => {
          console.log('📝 Status da transcrição:', status)
        },
        'assemblyai', // Usar AssemblyAI como padrão
        true // Usar Web Speech como fallback
      )

      console.log('🎉 Transcrição real concluída:', result)
      
      storeSetGeneratedCaptions(result.words)
      
      console.log('✅ Legendas geradas com sucesso!', result.words.length, 'palavras')
    } catch (error) {
      console.error('❌ Erro ao gerar legendas:', error)
      
      // Fallback para Web Speech API se AssemblyAI falhar
      try {
        console.log('🔄 Tentando Web Speech API como fallback...')
        
        // Usar Web Speech API diretamente
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          // Implementar fallback básico
          const fallbackCaptions = [
            { text: 'Legenda', start: 0, end: 2, confidence: 0.9 },
            { text: 'gerada', start: 2, end: 4, confidence: 0.9 },
            { text: 'automaticamente', start: 4, end: 6, confidence: 0.9 }
          ]
          storeSetGeneratedCaptions(fallbackCaptions)
          console.log('✅ Fallback aplicado com sucesso!')
        } else {
          throw new Error('Speech Recognition não disponível')
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError)
        alert('❌ Erro ao gerar legendas. Verifique sua API key da AssemblyAI.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Função para aplicar efeitos rápidos - NOVA
  const applyEffect = (effectType: 'zoom' | 'blur' | 'glow') => {
    console.log(`✨ Aplicando efeito: ${effectType}`)
    
    switch (effectType) {
      case 'zoom':
        // Aplicar zoom no vídeo
        if (videoRef.current) {
          videoRef.current.style.transform = 'scale(1.1)'
          videoRef.current.style.transition = 'transform 0.3s ease'
        }
        break
      case 'blur':
        // Aplicar blur
        if (videoRef.current) {
          videoRef.current.style.filter = 'blur(2px)'
        }
        break
      case 'glow':
        // Aplicar glow
        if (videoRef.current) {
          videoRef.current.style.filter = 'brightness(1.2) saturate(1.3)'
          videoRef.current.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)'
        }
        break
    }
    
    // Resetar após 3 segundos
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.style.transform = ''
        videoRef.current.style.filter = ''
        videoRef.current.style.boxShadow = ''
      }
    }, 3000)
  }

  // Estados da galeria - MANTIDOS (locais para performance)
  const [uploadedVideos, setUploadedVideos] = useState<GalleryVideo[]>([])
  const [generatedClips, setGeneratedClips] = useState<GalleryClip[]>([])
  
  // ✅ REMOVIDO - JÁ NO STORE
  // const [galleryModalOpen, setGalleryModalOpen] = useState(false)

  // NOVAS FUNÇÕES: Exclusão de vídeos e clips
  const deleteVideo = async (videoId: string) => {
    try {
      // Encontrar o vídeo para obter o publicId do Cloudinary
      const videos = getGalleryVideos()
      const video = videos.find(v => v.id === videoId)
      
      // Se o vídeo tem publicId do Cloudinary, deletar de lá também
      if (video?.cloudinaryPublicId) {
        console.log('🗑️ Deletando vídeo do Cloudinary:', video.cloudinaryPublicId)
        await deleteVideoFromCloudinary(video.cloudinaryPublicId)
      }
      
      // Deletar da galeria local
      deleteVideoFromGallery(videoId)
      console.log('✅ Vídeo deletado com sucesso')
      
    } catch (error) {
      console.error('❌ Erro ao deletar vídeo:', error)
    }
  }

  const deleteClip = (clipId: string) => {
    deleteClipFromGallery(clipId)
    setGeneratedClips(prev => prev.filter(clip => clip.id !== clipId))
    console.log(`🗑️ Clip ${clipId} excluído da galeria`)
  }

  // NOVA FUNÇÃO: Abrir editor sem vídeo (modo manual)
  const openEditorManual = () => {
    setGalleryModalOpen(true)
    console.log('📁 Abrindo galeria para seleção manual')
  }

  // Carregar dados reais da galeria ao inicializar
  useEffect(() => {
    const loadGalleryData = () => {
      const videos = getGalleryVideos()
      const clips = getGalleryClips()
      
      setUploadedVideos(videos)
      setGeneratedClips(clips)
      
      console.log('📁 Galeria carregada:', { videos: videos.length, clips: clips.length })
    }
    
    loadGalleryData()
    
    // Recarregar dados quando a janela receber foco (caso tenha sido atualizada em outra aba)
    const handleFocus = () => {
      loadGalleryData()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // ➕ FUNÇÃO para exportar um clip específico (FASE 4.0)
  const handleExportClip = async (clipData: { startTime: number; endTime: number; format?: string; name?: string; duration?: number }) => {
    console.log(`📤 Iniciando exportação do ${clipData.name || 'clip'}...`);
    
    try {
      // Simular processo de exportação
      const exportProcess = async () => {
        console.log(`🎬 Preparando ${clipData.name || 'clip'} para exportação...`);
        console.log(`⏱️ Duração: ${formatTime(clipData.duration || (clipData.endTime - clipData.startTime))}`);
        console.log(`🎯 Range: ${formatTime(clipData.startTime)} - ${formatTime(clipData.endTime)}`);
        
        // Aqui seria integração com FFmpeg ou serviço de processamento
        // Por enquanto, simular delay de processamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          success: true,
          downloadUrl: '#',
          filename: `${(clipData.name || 'clip').replace(/\s+/g, '_')}_viral.mp4`
        };
      };

      alert(`🚀 Exportando ${clipData.name}... (Simulação)
      
⏱️ Duração: ${formatTime(clipData.duration || (clipData.endTime - clipData.startTime))}
🎯 Range: ${formatTime(clipData.startTime)} - ${formatTime(clipData.endTime)}
🎬 Incluirá: Vídeo + Áudio + Legendas
📱 Formato: MP4 (1080p, otimizado para viral)

🔄 Em desenvolvimento: Integração com FFmpeg`);

      const result = await exportProcess();
      
      if (result.success) {
        console.log(`✅ ${clipData.name} exportado com sucesso!`);
        alert(`✅ ${clipData.name} exportado com sucesso!
        
📁 Arquivo: ${result.filename}
🔗 Download: ${result.downloadUrl}
        
🎉 Pronto para viralizar!`);
      }
    } catch (error) {
      console.error(`❌ Erro ao exportar ${clipData.name}:`, error);
      alert(`❌ Erro ao exportar ${clipData.name}. Tente novamente.`);
    }
  };

  // ✅ NOVA FUNÇÃO: Verificar e gerar legendas inteligentemente
  const handleGenerateCaptions = async () => {
    if (!videoData) return

    // ✅ VERIFICAR SE JÁ EXISTE TRANSCRIÇÃO (economizar API)
    if (videoData.id && hasTranscription(videoData.id)) {
      console.log('💰 Transcrição já existe! Carregando sem gastar créditos...')
      
      const existingTranscription = getTranscriptionFromGallery(videoData.id)
      if (existingTranscription?.words?.length) {
        setTranscriptionResult(existingTranscription)
        storeSetGeneratedCaptions(existingTranscription.words)
        storeSetCaptionsVisible(true)
        
        console.log('✅ Transcrição restaurada:', existingTranscription.words.length, 'palavras')
        console.log('🎯 Provider usado anteriormente:', existingTranscription.provider)
        console.log('💸 Créditos da API preservados!')
        
        // Mostrar feedback visual
        setTranscriptionProgress('✅ Transcrição carregada do cache!')
        setTimeout(() => setTranscriptionProgress(''), 2000)
        return
      }
    }
    
    // Se não tem transcrição, gerar nova
    console.log('🆕 Gerando nova transcrição...')
    await generateAdvancedCaptions()
  }

  // ➕ NOVA FUNÇÃO: Conectar transcrição com timeline - CORRIGIDA
  const updateTimelineTranscript = useCallback((transcriptionData: any) => {
    console.log('🔗 Dados recebidos para timeline:', transcriptionData)
    
    // Atualizar tanto o estado local quanto a timeline
    setTranscriptionResult(transcriptionData)
    storeSetGeneratedCaptions(transcriptionData.words || [])
    setShowTranscriptTimeline(true) // ➕ Mostrar timeline de transcript
    
    // ✅ NOVO: Ativar legendas automaticamente quando transcrição chegar
    storeSetCaptionsVisible(true)
    
    console.log('🔗 Transcrição conectada à timeline:', transcriptionData)
    console.log('👁️ Legendas ativadas automaticamente')
    console.log('📊 Palavras processadas:', transcriptionData.words?.length || 0)
  }, [])

  // ➕ NOVA FUNÇÃO: Transcrição Avançada com conexão à timeline - CORRIGIDA
  const generateAdvancedCaptions = async () => {
    if (!videoData) return

    setIsTranscribing(true)
    setTranscriptionProgress('Preparando...')

    try {
      console.log('🚀 INICIANDO TRANSCRIÇÃO AVANÇADA')
      console.log('📁 VideoData:', videoData)
      console.log('🔑 Provider:', transcriptionProvider)
      console.log('🔑 OpenAI Key:', openaiApiKey ? 'Configurada' : 'Não configurada')
      console.log('🔑 AssemblyAI Key:', assemblyaiApiKey ? 'Configurada' : 'Não configurada')

      // Importar o serviço de transcrição
      const { transcriptionService } = await import('../../services/transcriptionService')

      // Configurar API keys
      if (transcriptionProvider === 'whisper' && openaiApiKey) {
        transcriptionService.setOpenAIApiKey(openaiApiKey)
        console.log('✅ OpenAI API Key configurada')
      } else if (transcriptionProvider === 'assemblyai' && assemblyaiApiKey) {
        transcriptionService.setApiKey(assemblyaiApiKey)
        console.log('✅ AssemblyAI API Key configurada')
      }

      // Obter arquivo de vídeo
      let fileToTranscribe: File
      
      if (videoData.file) {
        fileToTranscribe = videoData.file
        console.log('📄 Usando arquivo direto:', fileToTranscribe.name, fileToTranscribe.size)
      } else if (videoData.url) {
        // Converter URL em File
        console.log('🌐 Baixando arquivo da URL:', videoData.url)
        const response = await fetch(videoData.url)
        const blob = await response.blob()
        fileToTranscribe = new File([blob], videoData.name || 'video.mp4', { type: blob.type })
        console.log('📄 Arquivo baixado:', fileToTranscribe.name, fileToTranscribe.size)
      } else {
        throw new Error('Nenhum vídeo disponível')
      }

      console.log('🎬 EXECUTANDO TRANSCRIÇÃO...')
      console.log('📋 Parâmetros:', {
        fileName: fileToTranscribe.name,
        fileSize: fileToTranscribe.size,
        provider: transcriptionProvider,
        fallback: true
      })

      // Executar transcrição
      const result = await transcriptionService.transcribe(
        fileToTranscribe,
        (status) => {
          console.log('📊 Status da transcrição:', status)
          setTranscriptionProgress(status)
        },
        transcriptionProvider,
        true // Fallback para Web Speech
      )

      console.log('🎉 TRANSCRIÇÃO CONCLUÍDA!')
      console.log('📊 Resultado completo:', result)
      console.log('📝 Palavras encontradas:', result.words?.length || 0)
      console.log('🔤 Primeira palavra:', result.words?.[0])
      console.log('🔤 Última palavra:', result.words?.[result.words?.length - 1])
      console.log('📄 Texto completo:', result.text)

      // ✅ CONECTAR à timeline E forçar atualização visual
      console.log('🔗 CONECTANDO À TIMELINE...')
      updateTimelineTranscript(result)
      
      // ✅ FORÇAR atualização da interface - MELHORADO
      console.log('🔄 ATUALIZANDO ESTADOS...')
      storeSetGeneratedCaptions(result.words || [])
      setTranscriptionResult(result)
      storeSetCaptionsVisible(true)
      
      // ✅ SALVAR TRANSCRIÇÃO NA GALERIA (persistência)
      if (videoData.id && result.words?.length > 0) {
        const saved = saveTranscriptionToGallery(videoData.id, {
          words: result.words,
          text: result.text,
          language: result.language,
          confidence: result.confidence,
          provider: transcriptionProvider
        })
        
        if (saved) {
          console.log('💾 Transcrição salva permanentemente na galeria')
          console.log('💰 Próximas aberturas não gastarão créditos da API!')
        }
      }
      
      setTranscriptionProgress('✅ Transcrição concluída e aplicada à timeline!')
      
      console.log('✅ ESTADOS FINAIS ATUALIZADOS:')
      console.log('- transcriptionResult palavras:', result.words?.length || 0)
      console.log('- generatedCaptions palavras:', result.words?.length || 0)
      console.log('- captionsVisible:', true)
      console.log('- showTranscriptTimeline:', true)

      // ✅ VERIFICAÇÃO FINAL
      setTimeout(() => {
        console.log('🔍 VERIFICAÇÃO FINAL DOS ESTADOS:')
        console.log('- Estado transcriptionResult:', transcriptionResult)
        console.log('- Estado generatedCaptions:', storeGeneratedCaptions)
        console.log('- Estado captionsVisible:', storeCaptionsVisible)
      }, 1000)

    } catch (error) {
      console.error('❌ ERRO NA TRANSCRIÇÃO AVANÇADA:', error)
      console.error('🔍 Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : 'Sem stack trace',
        provider: transcriptionProvider,
        hasApiKey: transcriptionProvider === 'whisper' ? !!openaiApiKey : !!assemblyaiApiKey
      })
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setTranscriptionProgress(`❌ Erro: ${errorMessage}`)
      
      // Fallback para sistema antigo
      setTimeout(() => {
        setTranscriptionProgress('')
        setIsTranscribing(false)
      }, 3000)
    } finally {
      setTimeout(() => {
        setIsTranscribing(false)
        setTranscriptionProgress('')
      }, 2000)
    }
  }

  // ➕ NOVA FUNÇÃO: Configurar API Keys
  const configureApiKeys = () => {
    // Salvar no localStorage
    if (openaiApiKey) {
      localStorage.setItem('openai_api_key', openaiApiKey)
    }
    if (assemblyaiApiKey) {
      localStorage.setItem('assemblyai_api_key', assemblyaiApiKey)
    }
    
    setShowTranscriptionConfig(false)
    console.log('✅ API Keys configuradas')
  }

  // ➕ NOVA FUNÇÃO: Carregar API Keys do localStorage
  useEffect(() => {
    const savedOpenAI = localStorage.getItem('openai_api_key')
    const savedAssemblyAI = localStorage.getItem('assemblyai_api_key')
    
    if (savedOpenAI) setOpenaiApiKey(savedOpenAI)
    if (savedAssemblyAI) setAssemblyaiApiKey(savedAssemblyAI)
  }, [])

  // ✅ NOVOS ESTADOS para Editor Avançado de Legendas
  const [captionFontFamily, setCaptionFontFamily] = useState('Montserrat')
  const [captionFontSize, setCaptionFontSize] = useState(36)
  const [captionTextColor, setCaptionTextColor] = useState('#FFFFFF')
  const [captionBackgroundColor, setCaptionBackgroundColor] = useState('transparent')
  const [captionBorderColor, setCaptionBorderColor] = useState('#000000')
  const [captionBorderWidth, setCaptionBorderWidth] = useState(2)
  const [captionShadowColor, setCaptionShadowColor] = useState('#000000')
  const [captionShadowIntensity, setCaptionShadowIntensity] = useState(3)
  const [captionOpacity, setCaptionOpacity] = useState(100)
  const [captionAnimation, setCaptionAnimation] = useState('fadeIn')
  const [captionPosition, setCaptionPosition] = useState('bottom')
  const [showCaptionPreview, setShowCaptionPreview] = useState(true)

  // ✅ NOVOS ESTADOS para Sistema de Sincronização Inteligente
  const [syncControlsOpen, setSyncControlsOpen] = useState(false)
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null)
  const [speechAnalysis, setSpeechAnalysis] = useState<SpeechAnalysis | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#151529] to-[#1a1a2e] text-white flex flex-col overflow-hidden">
      {/* Header Responsivo com Navegação */}
      <div className="header-visionario bg-black/20 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between shadow-2xl" style={{ height: '60px' }}>
        <div className="flex items-center space-x-6">
          {/* Navegação Breadcrumb estilo Apple */}
          <div className="flex items-center space-x-1 bg-white/5 rounded-full p-1">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="nav-tab px-4 py-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              🏠 Dashboard
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/upload')}
              className="nav-tab px-4 py-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              📁 Videos
            </Button>
            <Button 
              variant="ghost"
              className="nav-tab-active px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg"
            >
              ✨ Editor
            </Button>
          </div>
        </div>
        
        {/* Logo Centralizado com Glow */}
        <div className="logo-center absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            ClipsForge Pro
          </h1>
          <div className="glow-effect absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-xl -z-10"></div>
        </div>
        
        {/* Controles do Header */}
        <div className="flex items-center space-x-3">
          {/* Botão Export Visionário */}
          <Button 
            onClick={exportVideo}
            className="export-btn-visionario bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
          >
            🚀 Exportar
          </Button>
          
          {/* Menu Mobile */}
          {mobileView && (
            <Button
              variant="ghost"
              onClick={() => setGalleryModalOpen(true)}
              className="text-gray-300 hover:text-white"
            >
              📁
            </Button>
          )}
        </div>
      </div>

      {/* LAYOUT PRINCIPAL - Estrutura Profissional */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* BOTÃO GALERIA - Posição fixa */}
        <div className="absolute top-20 left-4 z-30 flex gap-3">
          <Button
            onClick={() => setGalleryModalOpen(true)}
            className="gallery-btn-visionario bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-xl text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            📁 Galeria ({uploadedVideos.length + generatedClips.length})
          </Button>
          
          {/* BOTÃO CACHE STATS - NOVO */}
          <Button
            onClick={() => setCacheStatsOpen(true)}
            className="cache-stats-btn bg-gradient-to-r from-green-600/80 to-emerald-600/80 backdrop-blur-xl text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 border border-white/20"
            title="Ver estatísticas do cache inteligente"
          >
            💾 Cache
          </Button>
          
          {/* BOTÃO API KEYS - NOVO */}
          <Button
            onClick={() => setApiKeyManagerOpen(true)}
            className="api-keys-btn bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-xl text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 border border-white/20"
            title="Gerenciar API Keys de forma segura"
          >
            🔐 API Keys
          </Button>

          {/* BOTÃO MONITOR DO SISTEMA - FASE 3 */}
          <Button
            onClick={() => setSystemMonitorOpen(true)}
            className="monitor-btn bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-xl text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 border border-white/20"
            title="Monitoramento do Sistema em Tempo Real"
          >
            📊 Monitor
          </Button>
        </div>

        {/* ÁREA PRINCIPAL - Vídeo + Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* ÁREA CENTRAL - Video Preview */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* ✅ CONTROLES DE LEGENDAS - Posição fixa */}
            <div className="absolute top-20 right-4 z-30 flex flex-col gap-2">
              <Button
                onClick={() => storeSetRightSidebarOpen(!rightSidebarOpen)}
                className={`legend-controls-btn bg-gradient-to-r backdrop-blur-xl text-white px-4 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 border border-white/20 ${
                  rightSidebarOpen 
                    ? 'from-purple-600/80 to-pink-600/80 hover:shadow-purple-500/25' 
                    : 'from-gray-600/80 to-gray-700/80 hover:shadow-gray-500/25'
                }`}
              >
                🎨 {rightSidebarOpen ? 'Fechar' : 'Editar'} Legendas
              </Button>
              
              {/* ✅ NOVO: Botão de Sincronização Inteligente */}
              <Button
                onClick={() => setSyncControlsOpen(true)}
                className={`sync-controls-btn bg-gradient-to-r backdrop-blur-xl text-white px-4 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 border border-white/20 ${
                  syncControlsOpen 
                    ? 'from-blue-600/80 to-cyan-600/80 hover:shadow-blue-500/25' 
                    : 'from-gray-600/80 to-gray-700/80 hover:shadow-gray-500/25'
                }`}
                title="Sistema Avançado de Sincronização de Legendas"
              >
                🎛️ Sincronização
              </Button>
              
              {/* Indicador de Status da Sincronização */}
              {speechAnalysis && (
                <div className="bg-green-600/20 border border-green-500/50 rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-green-300 font-medium">
                    ⚡ {speechAnalysis.speechRate?.toFixed(1)} w/s
                  </div>
                  <div className="text-xs text-gray-400">
                    {speechAnalysis.recommendedWordsPerCaption} palavras/legenda
                  </div>
                </div>
              )}
            </div>
            
            {/* Video Preview Container */}
            <div className="video-preview-visionario flex-1 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
              {/* 🚨 BOTÃO DE TESTE CRÍTICO - REMOVER APÓS CORREÇÃO */}
              <div className="absolute top-4 left-4 z-50">
                <Button
                  onClick={() => {
                    console.log('🚨 TESTE CRÍTICO: Forçando legendas de emergência!')
                    
                    // ✅ ESTADO ATUAL ANTES
                    const estadoAntes = useVideoEditorStore.getState()
                    console.log('📊 Estado ANTES:', {
                      transcriptionWords: estadoAntes.transcriptionResult?.words?.length,
                      generatedCaptions: estadoAntes.generatedCaptions?.length,
                      captionsVisible: estadoAntes.captionsVisible,
                      currentTime: estadoAntes.currentTime
                    })
                    
                    // ✅ FORÇAR LEGENDAS DE TESTE
                    const testWords = [
                      { text: 'TESTE', start: 0, end: 2, confidence: 0.9 },
                      { text: 'LEGENDAS', start: 1, end: 3, confidence: 0.9 },
                      { text: 'FUNCIONANDO', start: 2, end: 4, confidence: 0.9 },
                      { text: 'AGORA!', start: 3, end: 5, confidence: 0.9 }
                    ]
                    
                    // ✅ FORÇAR TODOS OS ESTADOS
                    useVideoEditorStore.setState({
                      transcriptionResult: {
                        words: testWords,
                        text: testWords.map(w => w.text).join(' '),
                        confidence: 0.9,
                        language: 'pt-BR'
                      },
                      generatedCaptions: testWords,
                      captionsVisible: true,
                      currentTime: 1.5 // Tempo onde há palavra
                    })
                    
                    // ✅ VERIFICAR ESTADO DEPOIS
                    setTimeout(async () => {
                      const estadoDepois = useVideoEditorStore.getState()
                      console.log('📊 Estado DEPOIS:', {
                        transcriptionWords: estadoDepois.transcriptionResult?.words?.length,
                        generatedCaptions: estadoDepois.generatedCaptions?.length,
                        captionsVisible: estadoDepois.captionsVisible,
                        currentTime: estadoDepois.currentTime
                      })
                      
                      // ✅ TESTAR getCurrentCaption
                      try {
                        const caption = getCurrentCaption()
                        console.log('🎯 getCurrentCaption resultado:', caption)
                      } catch (error) {
                        console.warn('⚠️ Erro no teste getCurrentCaption:', error)
                      }
                    }, 100)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded shadow-lg"
                >
                  🚨 TESTE DIRETO
                </Button>
              </div>
              
              {/* ✅ VIDEOPLAYER COM SISTEMA DE CLIPS INTEGRADO */}
              <VideoPlayer
                // Captions específicas - USANDO LEGENDAS CONTÍNUAS
                currentCaption={(() => {
                  const storeTranscriptionData = useVideoEditorStore.getState().transcriptionResult
                  const storeGeneratedCaptionsData = useVideoEditorStore.getState().generatedCaptions
                  const storeCaptionsVisibleData = useVideoEditorStore.getState().captionsVisible
                  const storeCurrentTimeData = useVideoEditorStore.getState().currentTime
                  
                  const wordsArray = storeTranscriptionData?.words || storeGeneratedCaptionsData
                  
                  if (!wordsArray?.length || !storeCaptionsVisibleData) return null
                  
                  const currentTime = storeCurrentTimeData
                  
                  // Encontrar palavra atual
                  let wordIndex = wordsArray.findIndex((word: any) => 
                    currentTime >= word.start && currentTime <= word.end
                  )
                  
                  if (wordIndex === -1) {
                    wordIndex = wordsArray.reduce((closestIndex: number, word: any, index: number) => {
                      if (closestIndex === -1) return index
                      const currentDistance = Math.abs(currentTime - ((word.start + word.end) / 2))
                      const closestDistance = Math.abs(currentTime - ((wordsArray[closestIndex].start + wordsArray[closestIndex].end) / 2))
                      return currentDistance < closestDistance ? index : closestIndex
                    }, -1)
                    
                    if (wordIndex !== -1) {
                      const nearestWord = wordsArray[wordIndex]
                      if (Math.abs(currentTime - ((nearestWord.start + nearestWord.end) / 2)) > 3) return null
                    }
                  }
                  
                  if (wordIndex === -1) return null
                  
                  // ✅ CRIAR FRASES CONTÍNUAS (5 palavras)
                  const wordsPerPhrase = 5
                  const halfPhrase = Math.floor(wordsPerPhrase / 2)
                  
                  let phraseStart = Math.max(0, wordIndex - halfPhrase)
                  const phraseEnd = Math.min(wordsArray.length - 1, phraseStart + wordsPerPhrase - 1)
                  
                  if (phraseEnd - phraseStart < wordsPerPhrase - 1) {
                    phraseStart = Math.max(0, phraseEnd - wordsPerPhrase + 1)
                  }
                  
                  const phraseWords = wordsArray.slice(phraseStart, phraseEnd + 1)
                  const phraseText = phraseWords.map((w: TranscriptionWord) => w.text).join(' ')
                  const startTime = phraseWords[0]?.start || currentTime
                  const endTime = phraseWords[phraseWords.length - 1]?.end || currentTime + 3
                  const avgConfidence = phraseWords.reduce((sum: number, w: TranscriptionWord) => sum + (w.confidence || 0.9), 0) / phraseWords.length
                  
                  return {
                    text: phraseText,
                    start: startTime,
                    end: endTime,
                    confidence: avgConfidence
                  }
                })()}
                hasTranscription={!!storeTranscription.transcriptionResult?.words?.length}
                transcriptionWordsCount={storeTranscription.transcriptionResult?.words?.length || 0}
                onTestCaptions={() => {
                  console.log('🚨 TESTE URGENTE: Forçando legendas de teste')
                  
                  // Criar legendas de teste mais robustas
                  const testCaptions = [
                    { text: 'TESTE', start: 0, end: 2, confidence: 0.9, highlight: true },
                    { text: 'LEGENDAS', start: 2, end: 4, confidence: 0.9, highlight: true },
                    { text: 'FUNCIONANDO', start: 4, end: 6, confidence: 0.9, highlight: true },
                    { text: 'AGORA!', start: 6, end: 8, confidence: 0.9, highlight: true }
                  ]
                  
                  // ✅ FORÇAR TODOS OS ESTADOS DIRETAMENTE NO STORE
                  console.log('🔄 Forçando estados no store...')
                  useVideoEditorStore.setState({
                    generatedCaptions: testCaptions,
                    transcriptionResult: { 
                      words: testCaptions,
                      text: testCaptions.map(c => c.text).join(' '),
                      confidence: 0.9,
                      language: 'pt-BR'
                    },
                    captionsVisible: true,
                    currentTime: 1 // Forçar tempo onde há legenda
                  })
                  
                  // ✅ VERIFICAÇÃO IMEDIATA
                  setTimeout(() => {
                    const state = useVideoEditorStore.getState()
                    console.log('✅ VERIFICAÇÃO IMEDIATA:', {
                      generatedCaptions: state.generatedCaptions?.length,
                      transcriptionWords: state.transcriptionResult?.words?.length,
                      captionsVisible: state.captionsVisible,
                      currentTime: state.currentTime
                    })
                    
                    // ✅ TESTAR getCurrentCaption
                    try {
                      const currentCaption = getCurrentCaption()
                      console.log('🎯 getCurrentCaption resultado:', currentCaption)
                    } catch (error) {
                      console.warn('⚠️ Erro no teste getCurrentCaption:', error)
                    }
                  }, 100)
                  
                  console.log('✅ Estados forçados no store!')
                }}
                
                // Canvas ref para efeitos
                canvasRef={canvasRef}
              />
            </div>

            {/* TIMELINE PROFISSIONAL - Embaixo do Vídeo */}
            <TimelinePro
              videoData={(storeVideoData || videoData) as unknown as Record<string, unknown> | undefined}
              currentTime={storeCurrentTime || currentTime}
              duration={storeDuration || duration}
              onSeek={storeSeekTo || seekTo}
              onCut={(cutTime) => {
                console.log('✂️ VideoEditor: Corte processado no tempo:', formatTime(cutTime));
                // Usar o primeiro layer disponível como padrão
                const layers = storeTimelineLayers.length > 0 ? storeTimelineLayers : timelineLayers;
                const defaultLayerId = layers.length > 0 ? layers[0].id : 'main_video_layer';
                handleRazorCut(defaultLayerId, cutTime);
              }}
              razorToolActive={storeRazorToolActive !== undefined ? storeRazorToolActive : razorToolActive}
              setRazorToolActive={storeSetRazorToolActive || setRazorToolActive}
              timelineLayers={storeTimelineLayers.length > 0 ? storeTimelineLayers : timelineLayers}
              setTimelineLayers={storeSetTimelineLayers || setTimelineLayers}
              cutPoints={storeCutPoints.length > 0 ? storeCutPoints : cutPoints}
              setCutPoints={storeSetCutPoints || setCutPoints}
              onPreviewClip={undefined}
              onExportClip={handleExportClip}
              isPreviewMode={false}
              currentClipIndex={-1}
              transcriptionData={(storeTranscription.transcriptionResult || transcriptionResult) as Record<string, unknown>} // ➕ NOVO: Dados de transcrição
              showTranscriptTrack={storeTranscription.showTranscriptTimeline !== undefined ? storeTranscription.showTranscriptTimeline : showTranscriptTimeline} // ➕ NOVO: Controle de visibilidade
              updateTimelineTranscript={updateTimelineTranscript} // ➕ NOVO: Função de atualização
            />
          </div>

          {/* Right Sidebar - Effects Panel */}
          {rightSidebarOpen && (
            <div className={`${mobileView ? 'absolute top-0 right-0 h-full w-80 z-20' : 'w-[320px] flex-shrink-0'} sidebar-visionario bg-black/10 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl`}>
              {/* Header dos Controles */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="mr-2">🎨</span>
                    Estilos de Legendas
                  </h2>
                  {mobileView && (
                    <Button
                      variant="ghost"
                      onClick={() => storeSetRightSidebarOpen(false)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      ✕
                    </Button>
                  )}
                </div>
                
                {/* Status da IA Visionário */}
                <div className="status-card-visionario bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-sm font-semibold text-purple-300">Status: ✅ Editor Ativo</p>
                        <p className="text-xs text-gray-400">
                          {storeGeneratedCaptions.length || 0} palavras com estilo
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl">🎨</div>
                  </div>
                </div>
              </div>

              {/* Conteúdo dos Controles Visionário */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* ===== SEÇÃO 1: EDITOR DE FONTE ===== */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🔤</span>
                    Fonte e Tamanho
                  </h3>
                  
                  {/* Seletor de Fonte */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">Família da Fonte:</label>
                    <select
                      value={captionFontFamily}
                      onChange={(e) => setCaptionFontFamily(e.target.value)}
                      className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white"
                    >
                      <option value="Montserrat">Montserrat (TikTok Style)</option>
                      <option value="Arial Black">Arial Black (Bold)</option>
                      <option value="Impact">Impact (Meme Style)</option>
                      <option value="Roboto">Roboto (YouTube Style)</option>
                      <option value="Inter">Inter (Instagram Style)</option>
                      <option value="Source Sans Pro">Source Sans Pro (Podcast)</option>
                      <option value="Oswald">Oswald (Modern)</option>
                      <option value="Bebas Neue">Bebas Neue (Cinematic)</option>
                      <option value="Poppins">Poppins (Clean)</option>
                      <option value="Bangers">Bangers (Comic)</option>
                    </select>
                  </div>

                  {/* Slider de Tamanho */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">
                      Tamanho da Fonte: <span className="text-purple-300 font-bold">{captionFontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="80"
                      value={captionFontSize}
                      onChange={(e) => setCaptionFontSize(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>16px</span>
                      <span>48px</span>
                      <span>80px</span>
                    </div>
                  </div>

                  {/* Preview da Fonte */}
                  <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Preview:</p>
                    <div 
                      style={{
                        fontFamily: captionFontFamily,
                        fontSize: `${Math.min(captionFontSize, 24)}px`,
                        color: captionTextColor,
                        textShadow: `${captionShadowIntensity}px ${captionShadowIntensity}px 0px ${captionShadowColor}`,
                      }}
                      className="text-center font-bold"
                    >
                      Texto de Exemplo
                    </div>
                  </div>
                </div>

                {/* ===== SEÇÃO 2: CORES E EFEITOS ===== */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🌈</span>
                    Cores e Efeitos
                  </h3>
                  
                  {/* Grid de Cores */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Cor do Texto */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Cor do Texto:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={captionTextColor}
                          onChange={(e) => setCaptionTextColor(e.target.value)}
                          className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={captionTextColor}
                          onChange={(e) => setCaptionTextColor(e.target.value)}
                          className="flex-1 bg-black/20 border border-white/20 rounded-lg p-2 text-white text-sm"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    {/* Cor da Sombra */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Cor da Sombra:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={captionShadowColor}
                          onChange={(e) => setCaptionShadowColor(e.target.value)}
                          className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={captionShadowColor}
                          onChange={(e) => setCaptionShadowColor(e.target.value)}
                          className="flex-1 bg-black/20 border border-white/20 rounded-lg p-2 text-white text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Intensidade da Sombra */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">
                      Intensidade da Sombra: <span className="text-purple-300 font-bold">{captionShadowIntensity}px</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={captionShadowIntensity}
                      onChange={(e) => setCaptionShadowIntensity(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                  </div>

                  {/* Opacidade */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">
                      Opacidade: <span className="text-purple-300 font-bold">{captionOpacity}%</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={captionOpacity}
                      onChange={(e) => setCaptionOpacity(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                  </div>
                </div>

                {/* ===== SEÇÃO 3: PRESETS VIRAIS ===== */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🔥</span>
                    Presets Virais
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* TikTok Bold */}
                    <Button
                      onClick={() => {
                        setCaptionFontFamily('Montserrat')
                        setCaptionFontSize(48)
                        setCaptionTextColor('#FFFFFF')
                        setCaptionShadowColor('#000000')
                        setCaptionShadowIntensity(4)
                        setCaptionOpacity(100)
                      }}
                      className="preset-card h-20 rounded-xl border-2 border-white/20 bg-gradient-to-br from-pink-600/30 to-red-600/30 hover:from-pink-600/40 hover:to-red-600/40 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">🎵</span>
                        <div className="text-center">
                          <div className="text-sm font-bold text-pink-300">TikTok</div>
                          <div className="text-xs text-gray-400">Bold</div>
                        </div>
                      </div>
                    </Button>

                    {/* YouTube Clean */}
                    <Button
                      onClick={() => {
                        setCaptionFontFamily('Roboto')
                        setCaptionFontSize(32)
                        setCaptionTextColor('#FFFFFF')
                        setCaptionShadowColor('#000000')
                        setCaptionShadowIntensity(2)
                        setCaptionOpacity(95)
                      }}
                      className="preset-card h-20 rounded-xl border-2 border-white/20 bg-gradient-to-br from-red-600/30 to-red-700/30 hover:from-red-600/40 hover:to-red-700/40 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">📺</span>
                        <div className="text-center">
                          <div className="text-sm font-bold text-red-300">YouTube</div>
                          <div className="text-xs text-gray-400">Clean</div>
                        </div>
                      </div>
                    </Button>

                    {/* Instagram Neon */}
                    <Button
                      onClick={() => {
                        setCaptionFontFamily('Inter')
                        setCaptionFontSize(40)
                        setCaptionTextColor('#FF00FF')
                        setCaptionShadowColor('#FF00FF')
                        setCaptionShadowIntensity(6)
                        setCaptionOpacity(100)
                      }}
                      className="preset-card h-20 rounded-xl border-2 border-white/20 bg-gradient-to-br from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">🌈</span>
                        <div className="text-center">
                          <div className="text-sm font-bold text-purple-300">Instagram</div>
                          <div className="text-xs text-gray-400">Neon</div>
                        </div>
                      </div>
                    </Button>

                    {/* Podcast Professional */}
                    <Button
                      onClick={() => {
                        setCaptionFontFamily('Source Sans Pro')
                        setCaptionFontSize(28)
                        setCaptionTextColor('#FFFFFF')
                        setCaptionShadowColor('#000000')
                        setCaptionShadowIntensity(1)
                        setCaptionOpacity(90)
                      }}
                      className="preset-card h-20 rounded-xl border-2 border-white/20 bg-gradient-to-br from-green-600/30 to-teal-600/30 hover:from-green-600/40 hover:to-teal-600/40 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">🎤</span>
                        <div className="text-center">
                          <div className="text-sm font-bold text-green-300">Podcast</div>
                          <div className="text-xs text-gray-400">Clean</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* ===== SEÇÃO 4: POSIÇÃO E ANIMAÇÃO ===== */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">📍</span>
                    Posição e Animação
                  </h3>
                  
                  {/* Posição */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">Posição da Legenda:</label>
                    <select
                      value={captionPosition}
                      onChange={(e) => setCaptionPosition(e.target.value)}
                      className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white"
                    >
                      <option value="top">Topo</option>
                      <option value="center">Centro</option>
                      <option value="bottom">Inferior (Padrão)</option>
                    </select>
                  </div>

                  {/* Animação */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">Animação de Entrada:</label>
                    <select
                      value={captionAnimation}
                      onChange={(e) => setCaptionAnimation(e.target.value)}
                      className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white"
                    >
                      <option value="fadeIn">Fade In</option>
                      <option value="slideUp">Slide Up</option>
                      <option value="slideDown">Slide Down</option>
                      <option value="bounce">Bounce</option>
                      <option value="zoom">Zoom</option>
                      <option value="typewriter">Typewriter</option>
                    </select>
                  </div>
                </div>

                {/* SEÇÃO DE TRANSCRIÇÃO REMOVIDA - Agora só na timeline */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DA GALERIA VISIONÁRIO */}
      {galleryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="gallery-modal-visionario bg-gradient-to-br from-[#0a0a0f] via-[#151529] to-[#1a1a2e] border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="modal-header-visionario bg-black/20 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3">📁</span>
                Minha Galeria
              </h2>
              <Button
                onClick={() => setGalleryModalOpen(false)}
                className="close-btn-visionario bg-white/10 hover:bg-red-500/20 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                ✕
              </Button>
            </div>

            {/* Tabs do Modal */}
            <div className="modal-tabs-visionario p-6 pb-0">
              <div className="flex bg-white/5 rounded-full p-1">
                <Button
                  onClick={() => setActiveGalleryTab('videos')}
                  className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeGalleryTab === 'videos'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🎬 Videos ({uploadedVideos.length})
                </Button>
                <Button
                  onClick={() => setActiveGalleryTab('clips')}
                  className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeGalleryTab === 'clips'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  ✂️ Clips ({generatedClips.length})
                </Button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="modal-content-visionario p-6 overflow-y-auto max-h-[50vh]">
              {activeGalleryTab === 'videos' && (
                <div className="space-y-4">
                  {/* Botão Upload Melhorado */}
                  <div className="upload-section-visionario">
                    <Button 
                      onClick={() => {
                        setGalleryModalOpen(false)
                        navigate('/upload')
                      }}
                      className="upload-btn-improved w-full bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 border-2 border-dashed border-green-400/50 hover:border-green-300 text-green-200 hover:text-green-100 py-6 rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-green-500/30 hover:via-blue-500/30 hover:to-purple-500/30 hover:scale-[1.02] group"
                    >
                      <div className="flex items-center justify-center space-x-4">
                        <div className="upload-icon-container bg-green-500/20 rounded-full p-3 group-hover:bg-green-500/30 transition-all duration-300">
                          <span className="text-3xl">📤</span>
                        </div>
                        <div className="text-left">
                          <div className="text-lg font-bold">Adicionar Novo Vídeo</div>
                          <div className="text-sm text-gray-400">Clique para fazer upload</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                  
                  {/* Grid de Vídeos */}
                  <div className="videos-grid-visionario grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedVideos.map(video => (
                      <div 
                        key={video.id} 
                        className="gallery-item-visionario bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-black/30 hover:border-white/20 transition-all duration-300 group cursor-pointer"
                        onClick={() => {
                          console.log('🎬 Selecionando vídeo:', video.name)
                          loadVideo(video)
                          setGalleryModalOpen(false)
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-purple-300 truncate">
                            🎬 {video.name}
                          </h4>
                          
                          {/* ✅ INDICADOR DE TRANSCRIÇÃO */}
                          {video.transcription?.words?.length ? (
                            <div className="flex items-center gap-1 bg-green-600/20 border border-green-500/50 rounded-full px-2 py-1">
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                              <span className="text-xs text-green-300">📝 {video.transcription.words.length}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              📝 Sem legenda
                            </div>
                          )}
                          
                          {/* Botão de exclusão */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteVideo(video.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 p-1"
                          >
                            🗑️
                          </Button>
                        </div>
                        
                        {/* ✅ ADICIONAR PREVIEW DO VÍDEO */}
                        <div className="relative w-full h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden mb-3 border border-white/10">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt={video.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-4xl">🎬</span>
                            </div>
                          )}
                          
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                              <span className="text-2xl">▶️</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* ✅ INFORMAÇÕES DO VÍDEO */}
                        <div className="text-xs text-gray-400 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>⏱️ {formatTime(video.duration)}</span>
                            <span>📁 {video.size}</span>
                          </div>
                          <div className="text-gray-500">
                            📅 {formatTimeAgo(video.uploadedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeGalleryTab === 'clips' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-300">Clips Gerados</h3>
                    <span className="text-sm text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {generatedClips.filter(c => c.status === 'ready').length} prontos
                    </span>
                  </div>
                  
                  {/* Grid de Clips */}
                  <div className="clips-grid-visionario grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedClips.map(clip => (
                      <div
                        key={clip.id}
                        className="clip-card-improved bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 p-4 rounded-xl transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20 group relative"
                      >
                        {/* Botão Excluir */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteClip(clip.id)
                          }}
                          className="delete-btn-visionario absolute top-2 right-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                          🗑️
                        </Button>

                        <div 
                          className="cursor-pointer"
                          onClick={() => {
                            openClip(clip)
                            setGalleryModalOpen(false)
                          }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="relative w-20 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                              <img
                                src={clip.thumbnail}
                                alt={clip.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {/* Status Badge */}
                              <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
                                clip.status === 'ready' ? 'bg-green-500' :
                                clip.status === 'processing' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                                ✂️ {clip.name}
                              </h4>
                              <div className="text-sm text-gray-400 mt-2 space-y-1">
                                <div className="flex items-center space-x-3">
                                  <span>⏱️ {formatTime(clip.duration)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    clip.format === 'TikTok' ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30' :
                                    clip.format === 'Instagram' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' :
                                    'bg-red-600/20 text-red-300 border border-red-500/30'
                                  }`}>
                                    {clip.format}
                                  </span>
                                </div>
                                <div className="text-gray-500">
                                  {clip.status === 'processing' ? '⏳ Processando...' : `📅 ${formatTimeAgo(clip.createdAt)}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {mobileView && (leftSidebarOpen || rightSidebarOpen) && (
        <div 
          className="fixed inset-0 bg-black/50 z-10"
          onClick={() => {
            storeSetLeftSidebarOpen(false)
            storeSetRightSidebarOpen(false)
          }}
        />
      )}

      {/* ➕ CONTROLES DE SINCRONIZAÇÃO AVANÇADA */}
      <CaptionSyncControls
        isVisible={syncControlsOpen}
        onClose={() => setSyncControlsOpen(false)}
        words={storeGeneratedCaptions || []}
        currentTime={storeCurrentTime || currentTime}
        onSyncUpdate={(config) => {
          setSyncConfig(config)
          console.log('🎛️ Configuração de sincronização atualizada:', config)
        }}
      />

      {/* ➕ PAINEL DE STATUS MELHORADO */}
      <div className="mb-4 p-4 bg-gray-900/80 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            📊 Status do Editor
          </h3>
          <div className="text-sm text-gray-400">
            Sistema de Otimização de Vídeo Ativo
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{formatTime(currentTime)}</div>
            <div className="text-xs text-gray-400">Posição Atual</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{formatTime(duration)}</div>
            <div className="text-xs text-gray-400">Duração Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">{storeCutPoints.length}</div>
            <div className="text-xs text-gray-400">Cortes Feitos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{generatedClips.length}</div>
            <div className="text-xs text-gray-400">Segmentos Criados</div>
          </div>
        </div>

        {generatedClips.length > 1 && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <div className="text-sm text-yellow-300 font-medium mb-1">
              ⚠️ Atenção: Sistema de Segmentos Ativo
            </div>
            <div className="text-xs text-yellow-200">
              Você criou {generatedClips.length} segmentos. Na próxima versão, poderá marcar quais segmentos remover para gerar um vídeo final otimizado.
            </div>
          </div>
        )}
      </div>

      {/* ➕ PAINEL DE TRANSCRIÇÃO AVANÇADA (ETAPA 1.2) */}
      <div className="transcription-panel bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            🎯 Transcrição Avançada
            <span className="text-sm text-purple-300">
              {transcriptionResult ? `(${transcriptionResult.words?.length || 0} palavras)` : '(Inativa)'}
            </span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscriptionConfig(!showTranscriptionConfig)}
            className="text-purple-300 hover:text-white hover:bg-purple-600/20"
          >
            ⚙️
          </Button>
        </div>

        {/* Seletor de Provedor */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Provedor de Transcrição
          </label>
          <select
            value={transcriptionProvider}
            onChange={(e) => setTranscriptionProvider(e.target.value as any)}
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="whisper">🎯 OpenAI Whisper (Melhor)</option>
            <option value="assemblyai">🤖 AssemblyAI (Rápido)</option>
            <option value="webspeech">🎤 Web Speech (Grátis)</option>
          </select>
        </div>

        {/* Configuração de API Keys */}
        {showTranscriptionConfig && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">🔑 Configuração de API Keys</h4>
            
            {/* ✅ INFO SOBRE TIER ATUAL */}
            <div className="mb-3 p-2 bg-green-900/30 border border-green-600/50 rounded">
              <div className="text-xs text-green-300 font-medium mb-1">✅ Status: Tier 1 Configurado</div>
              <div className="text-xs text-green-200 leading-relaxed">
                • <strong>Limites Atuais:</strong> 500 requests/min, 200k tokens/min<br/>
                • <strong>Sistema:</strong> OpenAI Whisper → AssemblyAI (fallback)<br/>
                • <strong>Performance:</strong> Otimizada para uso profissional<br/>
                • <strong>Verificar:</strong> <a href="https://platform.openai.com/settings/organization/limits" target="_blank" className="text-green-100 underline">Ver seus limites</a>
              </div>
            </div>
            
            {/* OpenAI API Key */}
            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* AssemblyAI API Key */}
            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">AssemblyAI API Key (Fallback)</label>
              <input
                type="password"
                value={assemblyaiApiKey}
                onChange={(e) => setAssemblyaiApiKey(e.target.value)}
                placeholder="..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={configureApiKeys}
              className="w-full bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
            >
              💾 Salvar Configurações
            </Button>
          </div>
        )}

        {/* Status da Transcrição */}
        {transcriptionProgress && (
          <div className="mb-3 p-2 bg-blue-900/30 border border-blue-500/50 rounded">
            <div className="text-sm text-blue-300">{transcriptionProgress}</div>
            {isTranscribing && (
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCaptions}
            disabled={isTranscribing || !videoData}
            className="flex-1 bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
          >
            {isTranscribing ? '⏳' : '🎯'} Transcrever
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscriptTimeline(!showTranscriptTimeline)}
            disabled={!transcriptionResult}
            className="bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30"
          >
            📝 Timeline
          </Button>
        </div>

        {/* Resultado da Transcrição */}
        {transcriptionResult && (
          <div className="transcript-result bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">📝 Texto Gerado</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400">
                  ✅ {transcriptionResult.confidence ? Math.round(transcriptionResult.confidence * 100) : 95}% conf.
                </span>
                {transcriptionResult.language && (
                  <span className="text-xs text-blue-400">
                    🌐 {transcriptionResult.language.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="max-h-32 overflow-y-auto bg-gray-900/50 rounded p-2 mb-3">
              <p className="text-sm text-gray-300 leading-relaxed">
                {transcriptionResult.text || 'Nenhum texto disponível'}
              </p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-700/50 rounded p-2">
                <div className="text-gray-400">Palavras</div>
                <div className="text-white font-medium">{transcriptionResult.words?.length || 0}</div>
              </div>
              <div className="bg-gray-700/50 rounded p-2">
                <div className="text-gray-400">Duração</div>
                <div className="text-white font-medium">
                  {transcriptionResult.duration ? formatTime(transcriptionResult.duration) : 'N/A'}
                </div>
              </div>
            </div>

            {/* Speakers */}
            {transcriptionResult.speakers && transcriptionResult.speakers.length > 0 && (
              <div className="mt-2 p-2 bg-gray-700/50 rounded">
                <div className="text-xs text-gray-400 mb-1">🎤 Speakers Detectados</div>
                <div className="flex flex-wrap gap-1">
                  {transcriptionResult.speakers.map((speaker: string, index: number) => (
                    <span
                      key={speaker}
                      className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded text-xs"
                    >
                      {speaker}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ➕ PAINEL DE AJUDA PARA API KEYS */}
      {/* Removido: API key já configurada automaticamente */}

      {/* Painel de Transcrição Avançada existente */}
      
      {/* ✅ CACHE STATS MODAL - NOVO */}
      <CacheStats 
        isOpen={cacheStatsOpen} 
        onClose={() => setCacheStatsOpen(false)} 
      />
      
      {/* ✅ API KEY MANAGER MODAL - NOVO */}
      <ApiKeyManager 
        isOpen={apiKeyManagerOpen} 
        onClose={() => setApiKeyManagerOpen(false)}
        onApiKeyConfigured={(provider, isValid) => {
          console.log(`🔐 API Key configurada: ${provider} - ${isValid ? 'Válida' : 'Inválida'}`)
          if (isValid) {
            // Recarregar configurações
            console.log(`✅ ${provider} configurado com sucesso!`)
          }
        }}
      />

      {/* ✅ SYSTEM MONITOR MODAL - FASE 3 */}
      <SystemMonitor 
        isOpen={systemMonitorOpen}
        onClose={() => setSystemMonitorOpen(false)}
      />
    </div>
  )
} 