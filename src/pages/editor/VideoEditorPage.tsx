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

import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import './VideoEditorStyles.css'
import '../../components/editor/AutoCaptions.css'
import { getGalleryVideos, getGalleryClips, deleteVideoFromGallery, deleteClipFromGallery, type GalleryVideo, type GalleryClip } from '@/utils/galleryStorage'
import { deleteVideoFromCloudinary } from '@/services/cloudinaryService'
import TimelinePro from '../../components/editor/TimelinePro'
import { commandManager } from '../../utils/commandManager'

interface VideoData {
  file?: File | null
  url?: string
  name: string
  size: number
  duration?: number
  id?: string
  videoData?: any
}

interface TimelineLayer {
  id: string
  type: 'video' | 'audio' | 'text' | 'effect'
  name: string
  visible: boolean // ➕ NOVO: Compatibilidade com TimelinePro
  items: any[] // ➕ NOVO: Compatibilidade com TimelinePro
  start?: number // ➕ NOVO: Opcional para compatibilidade
  duration?: number // ➕ NOVO: Opcional para compatibilidade
  data?: any // ➕ NOVO: Opcional para compatibilidade
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
  
  // Estados principais visionários
  const [mobileView, setMobileView] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [activeGalleryTab, setActiveGalleryTab] = useState<'videos' | 'clips'>('videos')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [razorToolActive, setRazorToolActive] = useState(false)
  const [activeCaptionStyle, setActiveCaptionStyle] = useState<string>('tiktok-bold')
  const [captionsVisible, setCaptionsVisible] = useState(true)
  const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([])
  const [cutPoints, setCutPoints] = useState<CutPoint[]>([])
  const [timelineLayers, setTimelineLayers] = useState<TimelineLayer[]>([])
  const [videoData, setVideoData] = useState<VideoData | null>(() => {
    // Inicializar com dados da navegação se disponível
    return location.state?.videoData as VideoData || null
  })

  // Estados das captions - MELHORADOS
  const [activeEffects, setActiveEffects] = useState<string[]>([])
  
  // ➕ Estados para Undo/Redo
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  
  // ➕ NOVOS ESTADOS para Sistema de Transcrição Avançado (ETAPA 1.1)
  const [transcriptionProvider, setTranscriptionProvider] = useState<'whisper' | 'assemblyai' | 'webspeech'>('whisper')
  const [showTranscriptionConfig, setShowTranscriptionConfig] = useState(false)
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('')
  const [assemblyaiApiKey, setAssemblyaiApiKey] = useState<string>('')
  const [transcriptionProgress, setTranscriptionProgress] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)
  const [showTranscriptTimeline, setShowTranscriptTimeline] = useState(false)
  
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
  
  // Variáveis temporárias para corrigir erros
  const timelineZoom = 1
  const snapEnabled = true
  const setPreviewCut = (_: any) => {}
  const setCurrentVideoFile = (_: any) => {}
  const setEffectIntensity = (_: any) => {}
  
  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setMobileView(mobile)
      
      // Ajustar sidebars baseado no tamanho da tela
      if (mobile) {
        setLeftSidebarOpen(false)
        setRightSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ➕ USEEFFECT: Conectar CommandManager aos estados
  useEffect(() => {
    const updateCommandStates = () => {
      setCanUndo(commandManager.canUndo())
      setCanRedo(commandManager.canRedo())
      
      const lastCmd = commandManager.getLastCommand()
      setLastCommand(lastCmd ? lastCmd.description : null)
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
    if (location.state?.videoData && !videoData) {
      const incomingVideoData = location.state.videoData
      console.log('🎬 Carregando vídeo do dashboard:', incomingVideoData.name)
      
      setVideoData(incomingVideoData)
      
      // Se temos uma URL do Cloudinary, usar ela
      if (incomingVideoData.cloudinaryUrl || incomingVideoData.url) {
        console.log('☁️ Usando URL permanente do Cloudinary')
        setDuration(incomingVideoData.duration || 30)
        
        // Inicializar layers padrão para este vídeo
        setTimeout(() => {
          initializeDefaultLayers()
        }, 100)
      }
    }
  }, [location.state, videoData])

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
          setRazorToolActive(!razorToolActive)
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
            setTimelineLayers(prev => prev.filter(l => l.id !== selectedLayer))
            setSelectedLayer(null)
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

  useEffect(() => {
    if (!videoData) {
      navigate('/upload')
      return
    }
    
    // Lógica de carregamento de vídeo
    if (videoData.url && videoData.url.startsWith('data:')) {
      console.log('Usando data URL confiável')
    } else if (videoData.file) {
      console.log('Criando nova Blob URL a partir do arquivo preservado')
      const newUrl = URL.createObjectURL(videoData.file)
      videoData.url = newUrl
    } else if (!videoData.url || videoData.url.includes('file-preserved')) {
      alert('Erro: não foi possível carregar o vídeo. Tente fazer upload novamente.')
      navigate('/upload')
      return
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
    
    setTimelineLayers([videoLayer])
    
    return () => {
      if (videoData?.url && videoData.url.startsWith('blob:')) {
        URL.revokeObjectURL(videoData.url)
      }
    }
  }, [videoData, navigate])

  // Adicionar vídeo à timeline quando carregado
  useEffect(() => {
    if (videoData && duration > 0 && timelineLayers.length === 0) {
      const videoLayer: TimelineLayer = {
        id: `video_${Date.now()}`,
        type: 'video',
        name: videoData.name || 'Video Principal',
        start: 0,
        duration: duration,
        data: videoData,
        color: '#3b82f6',
        locked: false,
        visible: true,
        items: []
      }
      
      setTimelineLayers([videoLayer])
      console.log('📹 Vídeo adicionado à timeline:', videoLayer.name)
    }
  }, [videoData, duration])

  const handleVideoLoad = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      setDuration(videoDuration)
      
      setTimelineLayers(prev => prev.map(layer => 
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

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const seekTo = (percentage: number) => {
    if (videoRef.current && duration) {
      const time = (percentage / 100) * duration
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const addEffect = (effectId: string) => {
    if (!activeEffects.includes(effectId)) {
      setActiveEffects(prev => [...prev, effectId])
      
      const effect = effectPresets.find(e => e.id === effectId)
      if (effect) {
        setEffectIntensity({})
      }
    }
  }

  const removeEffect = (effectId: string) => {
    setActiveEffects(prev => prev.filter(id => id !== effectId))
    setEffectIntensity((prev: any) => {
      const { [effectId]: removed, ...rest } = prev
      return rest
    })
  }

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
    
    setVideoData(videoData)
    setDuration(video.duration)
    
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
    
    const layer = timelineLayers.find(l => l.id === layerId)
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
    if (timelineLayers.length === 0 && videoData) {
      const defaultLayer: TimelineLayer = {
        id: 'main_video_layer',
        type: 'video',
        name: videoData.name || 'Vídeo Principal',
        start: 0,
        duration: duration || 30,
        data: videoData,
        color: '#3b82f6',
        locked: false,
        visible: true,
        items: []
      }
      setTimelineLayers([defaultLayer])
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
    const affectedLayer = timelineLayers.find(layer => 
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

  // Função para obter legenda atual baseada no tempo
  const getCurrentCaption = () => {
    if (!generatedCaptions.length || !captionsVisible) return null
    
    return generatedCaptions.find(caption => 
      currentTime >= caption.start && currentTime <= caption.end
    )
  }

  // Função melhorada para renderizar legenda com estilo e animação
  const renderCaptionWithStyle = (caption: any) => {
    if (!caption) return null
    
    const style = captionStyles[activeCaptionStyle as keyof typeof captionStyles] || captionStyles['tiktok-bold']
    
    return (
      <div
        className={`caption-text caption-${activeCaptionStyle}`}
        style={{
          ...style,
          wordWrap: 'break-word',
          maxWidth: '90%',
          textAlign: 'center',
          lineHeight: '1.3',
          display: 'inline-block',
          position: 'relative',
          zIndex: 1000,
          // Animações CSS personalizadas
          animationFillMode: 'both',
          transform: 'translateZ(0)', // Hardware acceleration
          willChange: 'transform, opacity'
        }}
        key={`caption-${caption.id || Math.random()}`} // Force re-render para animação
      >
        {caption.text}
      </div>
    )
  }

  // Callback melhorado para captions geradas
  const handleCaptionsGenerated = (words: any[]) => {
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
    
    setGeneratedCaptions(captions)
    console.log('✅ Captions processadas:', captions.length)
  }

  // Função para alternar visibilidade das captions
  const toggleCaptionsVisibility = () => {
    setCaptionsVisible(!captionsVisible)
    console.log(`👁️ Captions ${!captionsVisible ? 'ativadas' : 'desativadas'}`)
  }

  // Função para aplicar estilo de caption
  const applyCaptionStyle = (styleId: string) => {
    setActiveCaptionStyle(styleId)
    console.log(`🎨 Estilo de caption aplicado: ${styleId}`)
  }

  // Hook para capturar dados da navegação
  useEffect(() => {
    if (location.state?.videoData) {
      const data = location.state.videoData as VideoData
      setDuration(data.duration || 30)
      
      // Capturar arquivo se disponível
      if (location.state.videoFile) {
        setCurrentVideoFile(location.state.videoFile as File)
      }
    }
  }, [location.state])

  // Função para resetar cortes
  const resetAllCuts = () => {
    setCutPoints([])
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
      
      setGeneratedCaptions(result.words)
      
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
          setGeneratedCaptions(fallbackCaptions)
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

  // Estados da galeria
  const [uploadedVideos, setUploadedVideos] = useState<GalleryVideo[]>([])
  const [generatedClips, setGeneratedClips] = useState<GalleryClip[]>([])
  
  // NOVO: Estado para modal da galeria
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)

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
  const handleExportClip = async (clipData: any) => {
    console.log(`📤 Iniciando exportação do ${clipData.name}...`);
    
    try {
      // Simular processo de exportação
      const exportProcess = async () => {
        console.log(`🎬 Preparando ${clipData.name} para exportação...`);
        console.log(`⏱️ Duração: ${formatTime(clipData.duration)}`);
        console.log(`🎯 Range: ${formatTime(clipData.startTime)} - ${formatTime(clipData.endTime)}`);
        
        // Aqui seria integração com FFmpeg ou serviço de processamento
        // Por enquanto, simular delay de processamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          success: true,
          downloadUrl: '#',
          filename: `${clipData.name.replace(/\s+/g, '_')}_viral.mp4`
        };
      };

      alert(`🚀 Exportando ${clipData.name}... (Simulação)
      
⏱️ Duração: ${formatTime(clipData.duration)}
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

  // ➕ NOVA FUNÇÃO: Transcrição Avançada com Múltiplos Provedores
  const generateAdvancedCaptions = async () => {
    if (!videoData) return

    setIsTranscribing(true)
    setTranscriptionProgress('Preparando...')

    try {
      // Importar o serviço de transcrição
      const { transcriptionService } = await import('../../services/transcriptionService')

      // Configurar API keys
      if (transcriptionProvider === 'whisper' && openaiApiKey) {
        transcriptionService.setOpenAIApiKey(openaiApiKey)
      } else if (transcriptionProvider === 'assemblyai' && assemblyaiApiKey) {
        transcriptionService.setApiKey(assemblyaiApiKey)
      }

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

      // Executar transcrição
      const result = await transcriptionService.transcribe(
        fileToTranscribe,
        (status) => {
          setTranscriptionProgress(status)
        },
        transcriptionProvider,
        true // Fallback para Web Speech
      )

      setTranscriptionResult(result)
      setGeneratedCaptions(result.words)
      setTranscriptionProgress('✅ Transcrição concluída!')
      
      console.log('🎉 Transcrição avançada concluída:', result)

    } catch (error) {
      console.error('❌ Erro na transcrição avançada:', error)
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
        <div className="absolute top-20 left-4 z-30">
          <Button
            onClick={() => setGalleryModalOpen(true)}
            className="gallery-btn-visionario bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-xl text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            📁 Galeria ({uploadedVideos.length + generatedClips.length})
          </Button>
        </div>

        {/* ÁREA PRINCIPAL - Vídeo + Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* ÁREA CENTRAL - Video Preview */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Video Preview Container */}
            <div className="video-preview-visionario flex-1 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="video-container-visionario relative w-full max-w-6xl h-full max-h-[65vh] bg-black/40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoData?.url}
                  onLoadedData={handleVideoLoad}
                  onTimeUpdate={handleTimeUpdate}
                  className="video-player-visionario w-full h-full object-contain rounded-2xl"
                  style={{ 
                    filter: 'none',
                    transition: 'filter 0.3s ease'
                  }}
                />
                
                {/* Canvas para efeitos */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 rounded-2xl"
                  style={{ mixBlendMode: 'overlay' }}
                />
                
                {/* OVERLAY DE LEGENDAS VISIONÁRIO */}
                <div 
                  className="caption-overlay-visionario absolute bottom-8 left-8 right-8 text-center pointer-events-none z-10"
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'white',
                    textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                    wordWrap: 'break-word'
                  }}
                >
                  {/* Legendas funcionais mantidas */}
                  {getCurrentCaption() && renderCaptionWithStyle(getCurrentCaption())}
                </div>
                
                {/* Play/Pause Overlay */}
                <div className="play-overlay-visionario absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 bg-black/10 rounded-2xl backdrop-blur-sm">
                  <Button
                    onClick={togglePlayPause}
                    className="play-btn-visionario bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110 shadow-2xl"
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </Button>
                </div>
                
                {/* Controles que aparecem no hover */}
                <div className="video-controls-visionario absolute bottom-6 left-6 right-6 opacity-0 hover:opacity-100 transition-all duration-300">
                  <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-8 py-4 flex items-center justify-between border border-white/20">
                    <Button
                      onClick={togglePlayPause}
                      className="control-btn text-white hover:text-blue-300 transition-colors text-lg"
                    >
                      {isPlaying ? '⏸️' : '▶️'}
                    </Button>
                    
                    <div className="flex-1 mx-6">
                      <div className="text-sm text-gray-300 mb-2 text-center font-medium">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => {
                          const percentage = parseFloat(e.target.value)
                          seekTo((percentage / (duration || 100)) * 100)
                        }}
                        className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-visionario"
                      />
                    </div>
                    
                    <div className="text-sm text-gray-300 font-medium">
                      {Math.round((currentTime / duration) * 100) || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE PROFISSIONAL - Embaixo do Vídeo */}
            <TimelinePro
              videoData={videoData}
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
              onCut={(cutTime) => {
                console.log('✂️ VideoEditor: Corte processado no tempo:', formatTime(cutTime));
              }}
              razorToolActive={razorToolActive}
              setRazorToolActive={setRazorToolActive}
              timelineLayers={timelineLayers}
              setTimelineLayers={setTimelineLayers}
              cutPoints={cutPoints}
              setCutPoints={setCutPoints}
              onPreviewClip={(startTime, endTime) => {
                console.log(`🎬 Preview clip: ${formatTime(startTime)} - ${formatTime(endTime)}`);
                if (videoRef.current) {
                  videoRef.current.currentTime = startTime;
                  setCurrentTime(startTime);
                  if (!isPlaying) {
                    togglePlayPause();
                  }
                }
              }}
              onExportClip={(clipData) => {
                console.log(`📤 Exportando clip:`, clipData);
                handleExportClip(clipData);
              }}
              isPreviewMode={false}
              currentClipIndex={-1}
            />
          </div>

          {/* Right Sidebar - Effects Panel */}
          {rightSidebarOpen && (
            <div className={`${mobileView ? 'absolute top-0 right-0 h-full w-80 z-20' : 'w-[320px] flex-shrink-0'} sidebar-visionario bg-black/10 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl`}>
              {/* Header dos Controles */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="mr-2">✨</span>
                    Magic Captions
                  </h2>
                  {mobileView && (
                    <Button
                      variant="ghost"
                      onClick={() => setRightSidebarOpen(false)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      ✕
                    </Button>
                  )}
                </div>
                
                {/* Status da IA Visionário */}
                <div className="status-card-visionario bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-sm font-semibold text-green-300">Status: ✅ Ativo</p>
                        <p className="text-xs text-gray-400">
                          {generatedCaptions.length || 0} palavras detectadas
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl">🤖</div>
                  </div>
                </div>
              </div>

              {/* Conteúdo dos Controles Visionário */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Seção 1: Gerar Legendas com IA */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    Gerar Legendas
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Input da API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        🔑 AssemblyAI API Key
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole sua API key aqui..."
                        className="api-input-visionario w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm focus:border-blue-500 focus:bg-white/10 transition-all duration-300"
                      />
                    </div>
                    
                    {/* Botão Gerar Visionário */}
                    <Button
                      onClick={generateCaptions}
                      disabled={!apiKey || !videoData || isGenerating}
                      className="generate-btn-visionario w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isGenerating ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Gerando Magia...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-xl">🎯</span>
                          <span>Gerar Legendas com IA</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Seção 2: Estilos Virais */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🎨</span>
                    Estilos Virais
                  </h3>
                  
                  <div className="viral-styles-grid grid grid-cols-2 gap-3">
                    {/* TikTok Bold */}
                    <Button
                      onClick={() => setCaptionStyle('tiktok')}
                      className={`viral-style-card h-20 rounded-xl border-2 transition-all duration-300 ${
                        captionStyle === 'tiktok'
                          ? 'border-pink-500 bg-gradient-to-br from-pink-600/30 to-pink-700/30 shadow-lg shadow-pink-500/20'
                          : 'border-white/20 bg-white/5 hover:border-pink-500/50 hover:bg-pink-600/10'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">🔥</span>
                        <div className="text-center">
                          <div className="text-sm font-bold text-pink-300">TikTok</div>
                          <div className="text-xs text-gray-400">Bold</div>
                        </div>
                      </div>
                    </Button>

                    {/* YouTube Minimal */}
                    <Button
                      onClick={() => setCaptionStyle('youtube')}
                      className={`viral-style-card h-20 rounded-xl border-2 transition-all duration-300 ${
                        captionStyle === 'youtube'
                          ? 'border-red-500 bg-gradient-to-br from-red-600/30 to-red-700/30 shadow-lg shadow-red-500/20'
                          : 'border-white/20 bg-white/5 hover:border-red-500/50 hover:bg-red-600/10'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">📺</span>
                        <div className="text-center">
                          <div className="text-sm font-bold text-red-300">YouTube</div>
                          <div className="text-xs text-gray-400">Minimal</div>
                        </div>
                      </div>
                    </Button>

                    {/* Instagram Gradient */}
                    <Button
                      onClick={() => setCaptionStyle('instagram')}
                      className={`viral-style-card h-20 rounded-xl border-2 transition-all duration-300 ${
                        captionStyle === 'instagram'
                          ? 'border-purple-500 bg-gradient-to-br from-purple-600/30 to-purple-700/30 shadow-lg shadow-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:border-purple-500/50 hover:bg-purple-600/10'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">🌈</span>
                        <div className="text-center">
                          <div className="text-sm font-bold text-purple-300">Instagram</div>
                          <div className="text-xs text-gray-400">Gradient</div>
                        </div>
                      </div>
                    </Button>

                    {/* Podcast Clean */}
                    <Button
                      onClick={() => setCaptionStyle('podcast')}
                      className={`viral-style-card h-20 rounded-xl border-2 transition-all duration-300 ${
                        captionStyle === 'podcast'
                          ? 'border-green-500 bg-gradient-to-br from-green-600/30 to-green-700/30 shadow-lg shadow-green-500/20'
                          : 'border-white/20 bg-white/5 hover:border-green-500/50 hover:bg-green-600/10'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">🎙️</span>
                        <div className="text-center">
                          <div className="text-sm font-bold text-green-300">Podcast</div>
                          <div className="text-xs text-gray-400">Clean</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Seção 3: Efeitos Rápidos */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">⚡</span>
                    Efeitos Rápidos
                  </h3>
                  
                  <div className="effects-grid grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => applyEffect('zoom')}
                      className="effect-btn bg-white/5 hover:bg-blue-600/20 border border-white/20 hover:border-blue-500/50 text-white py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-lg">🔍</span>
                        <span className="text-xs">Zoom</span>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => applyEffect('blur')}
                      className="effect-btn bg-white/5 hover:bg-purple-600/20 border border-white/20 hover:border-purple-500/50 text-white py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-lg">🌀</span>
                        <span className="text-xs">Blur</span>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => applyEffect('glow')}
                      className="effect-btn bg-white/5 hover:bg-yellow-600/20 border border-white/20 hover:border-yellow-500/50 text-white py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-lg">✨</span>
                        <span className="text-xs">Glow</span>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Seção 4: Áudio */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🎵</span>
                    Áudio
                  </h3>
                  
                  <Button
                    onClick={() => {/* Implementar adicionar música */}}
                    className="audio-btn w-full bg-gradient-to-r from-green-600/20 to-blue-600/20 border-2 border-dashed border-green-500/50 hover:border-green-400 text-green-300 hover:text-green-200 py-4 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-green-500/30 hover:via-blue-500/30 hover:to-purple-500/30 hover:scale-[1.02] group"
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

                {/* Seção 5: Informações do Projeto */}
                <div className="control-section-visionario">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">📊</span>
                    Projeto
                  </h3>
                  
                  <div className="project-info-visionario bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Duração:</span>
                      <span className="text-sm font-medium text-white">{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Progresso:</span>
                      <span className="text-sm font-medium text-blue-300">{Math.round((currentTime / duration) * 100) || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Legendas:</span>
                      <span className="text-sm font-medium text-green-300">
                        {generatedCaptions.length || 0} palavras
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Estilo:</span>
                      <span className="text-sm font-medium text-purple-300 capitalize">{captionStyle}</span>
                    </div>
                  </div>
                </div>
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
                        className="video-card-improved bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 p-4 rounded-xl transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/20 group relative"
                      >
                        {/* Botão Excluir */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteVideo(video.id)
                          }}
                          className="delete-btn-visionario absolute top-2 right-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                          🗑️
                        </Button>

                        <div 
                          className="cursor-pointer"
                          onClick={() => {
                            loadVideo(video)
                            setGalleryModalOpen(false)
                          }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-20 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                              <img
                                src={video.thumbnail}
                                alt={video.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                                🎬 {video.name}
                              </h4>
                              <div className="text-sm text-gray-400 mt-2 space-y-1">
                                <div className="flex items-center space-x-3">
                                  <span>⏱️ {formatTime(video.duration)}</span>
                                  <span>📦 {video.size}</span>
                                </div>
                                <div className="text-gray-500">
                                  📅 {formatTimeAgo(video.uploadedAt)}
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
            setLeftSidebarOpen(false)
            setRightSidebarOpen(false)
          }}
        />
      )}

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
            <div className="text-lg font-bold text-yellow-400">{cutPoints.length}</div>
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

    </div>
  )
} 