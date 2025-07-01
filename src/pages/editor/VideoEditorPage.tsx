import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import './VideoEditorStyles.css'
import '../../components/editor/AutoCaptions.css'

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
  start: number
  duration: number
  data: any
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
  
  const videoData = location.state?.videoData as VideoData
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Estados principais
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Timeline e camadas
  const [timelineLayers, setTimelineLayers] = useState<TimelineLayer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  
  // Estados profissionais da timeline
  const [cutPoints, setCutPoints] = useState<CutPoint[]>([])
  const [razorToolActive, setRazorToolActive] = useState(false)
  
  // Estados das captions - MELHORADOS
  const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([])
  const [activeCaptionStyle, setActiveCaptionStyle] = useState<string>('tiktok-bold')
  const [captionsVisible, setCaptionsVisible] = useState(true)
  
  // Efeitos e filtros
  const [activeEffects, setActiveEffects] = useState<string[]>([])
  
  // UI States - Navegação responsiva
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [mobileView, setMobileView] = useState(false)
  
  // Galeria e Clips
  const [activeGalleryTab, setActiveGalleryTab] = useState<'videos' | 'clips'>('videos')
  
  // Mock data - Em produção viria do backend
  const [uploadedVideos] = useState<UploadedVideo[]>([
    {
      id: '1',
      name: 'Video Marketing.mp4',
      thumbnail: '/placeholder.svg',
      duration: 120,
      size: '45 MB',
      uploadedAt: new Date(Date.now() - 86400000)
    },
    {
      id: '2', 
      name: 'Apresentação.mov',
      thumbnail: '/placeholder.svg',
      duration: 85,
      size: '32 MB',
      uploadedAt: new Date(Date.now() - 172800000)
    },
    {
      id: '3',
      name: 'Tutorial.mp4',
      thumbnail: '/placeholder.svg', 
      duration: 200,
      size: '78 MB',
      uploadedAt: new Date(Date.now() - 259200000)
    }
  ])

  const [generatedClips] = useState<GeneratedClip[]>([
    {
      id: '1',
      name: 'Hook Viral - TikTok',
      thumbnail: '/placeholder.svg',
      duration: 15,
      format: 'TikTok',
      createdAt: new Date(Date.now() - 3600000),
      status: 'ready'
    },
    {
      id: '2',
      name: 'Apresentação - Instagram',
      thumbnail: '/placeholder.svg',
      duration: 30,
      format: 'Instagram',
      createdAt: new Date(Date.now() - 7200000),
      status: 'ready'
    },
    {
      id: '3',
      name: 'Tutorial Rápido - YouTube',
      thumbnail: '/placeholder.svg',
      duration: 60,
      format: 'YouTube',
      createdAt: new Date(Date.now() - 10800000),
      status: 'processing'
    }
  ])

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
  
  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false)
        setRightSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keyboard shortcuts profissionais
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      
      switch (e.key.toLowerCase()) {
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
      locked: false
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
        locked: false
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
        setEffectIntensity(prev => ({
          ...prev,
          [effectId]: effect.intensity
        }))
      }
    }
  }

  const removeEffect = (effectId: string) => {
    setActiveEffects(prev => prev.filter(id => id !== effectId))
    setEffectIntensity(prev => {
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

  const exportVideo = async () => {
    console.log('Exportando vídeo com efeitos:', activeEffects)
    alert('🎬 Exportação em desenvolvimento! Em breve teremos renderização profissional.')
  }

  const loadVideo = (video: UploadedVideo) => {
    // Simular carregamento de um vídeo da galeria
    console.log('Carregando vídeo:', video.name)
    // Em produção, isso faria a navegação com os dados do vídeo
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
    console.log(`✂️ Executando corte no layer ${layerId} no tempo ${formatTime(time)}`)
    
    const layer = timelineLayers.find(l => l.id === layerId)
    if (!layer || layer.locked) {
      console.log('❌ Layer não encontrado ou está bloqueado')
      return
    }

    // Verificar se o tempo está dentro do layer
    if (time < layer.start || time > layer.start + layer.duration) {
      console.log('❌ Tempo fora do range do layer')
      return
    }

    // Criar novo ponto de corte
    const newCutPoint: CutPoint = {
      id: `cut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time: time,
      type: 'cut'
    }

    // Adicionar ponto de corte
    setCutPoints(prev => {
      const updated = [...prev, newCutPoint]
      console.log(`📍 Ponto de corte adicionado. Total: ${updated.length}`)
      return updated
    })

    // Dividir o layer no ponto de corte
    const cutTime = time - layer.start
    if (cutTime > 0.1 && cutTime < layer.duration - 0.1) { // Margem mínima de 0.1s
      // Criar dois novos layers
      const firstPart: TimelineLayer = {
        ...layer,
        id: `${layer.id}_part1_${Date.now()}`,
        duration: cutTime,
        name: `${layer.name} (1/${2})`,
        color: layer.color
      }

      const secondPart: TimelineLayer = {
        ...layer,
        id: `${layer.id}_part2_${Date.now()}`,
        start: time,
        duration: layer.duration - cutTime,
        name: `${layer.name} (2/${2})`,
        color: layer.color
      }

      // Atualizar timeline
      setTimelineLayers(prev => {
        const updated = prev.map(l => l.id === layerId ? firstPart : l).concat([secondPart])
        console.log(`🎬 Layer dividido: "${firstPart.name}" (${formatTime(firstPart.duration)}) + "${secondPart.name}" (${formatTime(secondPart.duration)})`)
        return updated
      })

      // Feedback visual
      console.log(`✅ Corte realizado em ${formatTime(time)}! Layer dividido em 2 partes.`)
      
      // Auto-desativar razor após corte bem-sucedido
      setTimeout(() => {
        setRazorToolActive(false)
        console.log('🔄 Razor tool desativado automaticamente')
      }, 1000)
    } else {
      console.log('❌ Corte muito próximo das bordas do layer')
      console.log('❌ Erro: Corte muito próximo das bordas. Tente em outro ponto.')
    }
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
        locked: false
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

  // Função para gerar legendas com IA - NOVA
  const generateCaptions = async () => {
    if (!apiKey || !videoData) return
    
    setIsGenerating(true)
    try {
      // Salvar API key no localStorage
      localStorage.setItem('assemblyai_api_key', apiKey)
      
      // Simular chamada para AssemblyAI (implementar chamada real)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock de dados de transcrição
      const mockTranscription = {
        words: Array.from({ length: 200 }, (_, i) => ({
          text: `palavra${i + 1}`,
          start: i * 0.5,
          end: (i + 1) * 0.5,
          confidence: 0.95
        }))
      }
      
      // setTranscriptionData(mockTranscription) // Removido para simplificar
      setGeneratedCaptions(mockTranscription.words)
      
      console.log('✅ Legendas geradas com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao gerar legendas:', error)
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
          {/* Toggle Sidebars - Desktop */}
          {!mobileView && (
            <>
              <Button
                variant="ghost"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="icon-btn w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-300"
                title="Toggle Galeria"
              >
                {leftSidebarOpen ? '◀️' : '📁'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className="icon-btn w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-300"
                title="Toggle Controles"
              >
                {rightSidebarOpen ? '▶️' : '⚙️'}
              </Button>
            </>
          )}
          
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
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="text-gray-300 hover:text-white"
            >
              ☰
            </Button>
          )}
        </div>
      </div>

      {/* LAYOUT PRINCIPAL - Grid 3 Colunas Visionário */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Galeria Visionária (280px) */}
        {leftSidebarOpen && (
          <div className={`${mobileView ? 'absolute top-0 left-0 h-full w-80 z-20' : 'w-[280px] flex-shrink-0'} sidebar-visionario bg-black/10 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl`}>
            {/* Header da Galeria */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <span className="mr-2">📁</span>
                  Galeria
                </h2>
                {mobileView && (
                  <Button
                    variant="ghost"
                    onClick={() => setLeftSidebarOpen(false)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    ✕
                  </Button>
                )}
              </div>
              
              {/* Tabs da Galeria estilo Apple */}
              <div className="flex bg-white/5 rounded-full p-1">
                <Button
                  onClick={() => setActiveGalleryTab('videos')}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeGalleryTab === 'videos'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Videos ({uploadedVideos.length})
                </Button>
                <Button
                  onClick={() => setActiveGalleryTab('clips')}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeGalleryTab === 'clips'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Clips ({generatedClips.length})
                </Button>
              </div>
            </div>

            {/* Conteúdo da Galeria Visionário */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeGalleryTab === 'videos' && (
                <div className="space-y-4">
                  {/* Botão Upload Visionário */}
                  <Button 
                    onClick={() => navigate('/upload')}
                    className="upload-btn-visionario w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-dashed border-blue-500/50 hover:border-blue-400 text-blue-300 hover:text-blue-200 py-4 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">📁</span>
                      <span className="font-medium">+ Upload Novo</span>
                    </div>
                  </Button>
                  
                  {/* Lista de Vídeos com Cards Visionários */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Meus Vídeos</h3>
                    {uploadedVideos.map(video => (
                      <Card
                        key={video.id}
                        className="video-card-visionario bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/20 rounded-xl group"
                        onClick={() => loadVideo(video)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                            <img
                              src={video.thumbnail}
                              alt={video.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                              🎬 {video.name}
                            </h4>
                            <div className="text-xs text-gray-400 mt-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span>{formatTime(video.duration)}</span>
                                <span>•</span>
                                <span>{video.size}</span>
                              </div>
                              <div className="text-gray-500">
                                {formatTimeAgo(video.uploadedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeGalleryTab === 'clips' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Clips Gerados</h3>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                      {generatedClips.filter(c => c.status === 'ready').length} prontos
                    </span>
                  </div>
                  
                  {generatedClips.map(clip => (
                    <Card
                      key={clip.id}
                      className="clip-card-visionario bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20 rounded-xl group"
                      onClick={() => openClip(clip)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative w-16 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                          <img
                            src={clip.thumbnail}
                            alt={clip.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Status Badge */}
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                            clip.status === 'ready' ? 'bg-green-500' :
                            clip.status === 'processing' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                            ✂️ {clip.name}
                          </h4>
                          <div className="text-xs text-gray-400 mt-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span>{formatTime(clip.duration)}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                clip.format === 'TikTok' ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30' :
                                clip.format === 'Instagram' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' :
                                'bg-red-600/20 text-red-300 border border-red-500/30'
                              }`}>
                                {clip.format}
                              </span>
                            </div>
                            <div className="text-gray-500">
                              {clip.status === 'processing' ? '⏳ Processando...' : formatTimeAgo(clip.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ÁREA CENTRAL - Video Preview Visionário */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video Preview Container Visionário */}
          <div className="video-preview-visionario flex-1 bg-black/20 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="video-container-visionario relative max-w-5xl max-h-full bg-black/40 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <video
                ref={videoRef}
                src={videoData?.url}
                onLoadedData={handleVideoLoad}
                onTimeUpdate={handleTimeUpdate}
                className="video-player-visionario max-w-full max-h-full rounded-2xl"
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
              
              {/* OVERLAY DE LEGENDAS VISIONÁRIO - MANTIDO FUNCIONANDO */}
              <div 
                className="caption-overlay-visionario absolute bottom-8 left-8 right-8 text-center pointer-events-none z-10"
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  wordWrap: 'break-word'
                }}
              >
                {/* Legendas funcionais mantidas */}
                {getCurrentCaption() && renderCaptionWithStyle(getCurrentCaption())}
              </div>
              
              {/* Play/Pause Overlay Visionário */}
              <div className="play-overlay-visionario absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 bg-black/10 rounded-2xl backdrop-blur-sm">
                <Button
                  onClick={togglePlayPause}
                  className="play-btn-visionario bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110 shadow-2xl"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </Button>
              </div>
              
              {/* Controles minimalistas que aparecem no hover */}
              <div className="video-controls-visionario absolute bottom-4 left-4 right-4 opacity-0 hover:opacity-100 transition-all duration-300">
                <div className="bg-black/50 backdrop-blur-xl rounded-full px-6 py-3 flex items-center justify-between border border-white/20">
                  <Button
                    onClick={togglePlayPause}
                    className="control-btn text-white hover:text-blue-300 transition-colors"
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </Button>
                  
                  <div className="flex-1 mx-4">
                    <div className="text-xs text-gray-300 mb-1 text-center">
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
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider-visionario"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-300">
                    {Math.round((currentTime / duration) * 100) || 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                  className="audio-btn w-full bg-gradient-to-r from-green-600/20 to-blue-600/20 border-2 border-dashed border-green-500/50 hover:border-green-400 text-green-300 hover:text-green-200 py-4 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-green-600/30 hover:to-blue-600/30"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-xl">🎵</span>
                    <span className="font-medium">Adicionar Música</span>
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

      {/* TIMELINE VISIONÁRIA INFERIOR (280px) */}
      <div className="timeline-visionario bg-black/30 backdrop-blur-xl border-t border-white/10 shadow-2xl" style={{ height: '280px' }}>
        {/* Header da Timeline Visionário */}
        <div className="timeline-header-visionario bg-black/20 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">⚡</span>
              Timeline Pro
            </h2>
            
            {/* Ferramentas Visionárias */}
            <div className="flex items-center space-x-3">
              <Button
                variant={razorToolActive ? "default" : "ghost"}
                onClick={() => setRazorToolActive(!razorToolActive)}
                className={`tool-btn-visionario ${razorToolActive 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20' 
                  : 'bg-white/5 hover:bg-red-600/20 text-gray-300 hover:text-red-300 border border-white/20 hover:border-red-500/50'
                } px-4 py-2 rounded-xl transition-all duration-300`}
                title="Ferramenta Razor (C)"
              >
                <span className="mr-2">✂️</span>
                Razor
              </Button>
              
              <Button
                variant="ghost"
                className="tool-btn-visionario bg-white/5 hover:bg-blue-600/20 text-gray-300 hover:text-blue-300 border border-white/20 hover:border-blue-500/50 px-4 py-2 rounded-xl transition-all duration-300"
                title="Zoom Fit"
              >
                <span className="mr-2">🎯</span>
                Fit
              </Button>
              
              <Button
                variant="ghost"
                className="tool-btn-visionario bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-purple-300 border border-white/20 hover:border-purple-500/50 px-4 py-2 rounded-xl transition-all duration-300"
                title="Configurações"
              >
                <span className="mr-2">⚙️</span>
                Config
              </Button>
            </div>
          </div>
          
          {/* Controles de Reprodução Visionários */}
          <div className="flex items-center space-x-4">
            {/* Slider de Progresso Visionário */}
            <div className="flex items-center space-x-3">
              <div className="progress-indicator-visionario bg-white/5 rounded-full px-3 py-1 border border-white/20">
                <span className="text-sm text-gray-300 font-mono">
                  {Math.round((currentTime / duration) * 100) || 0}%
                </span>
              </div>
              
              <div className="time-display-visionario bg-white/5 rounded-full px-4 py-2 border border-white/20">
                <span className="text-sm text-white font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Principal Visionária */}
        <div className="timeline-main-visionario flex-1 relative overflow-hidden">
          {/* Régua de Tempo Visionária */}
          <div className="timeline-ruler-visionario h-12 bg-gradient-to-b from-black/40 to-black/20 border-b border-white/10 relative overflow-hidden">
            {/* Marcadores de tempo */}
            <div className="absolute inset-0 flex items-end pb-2">
              {Array.from({ length: Math.ceil(duration / 10) + 1 }, (_, i) => (
                <div
                  key={i}
                  className="time-marker-visionario absolute bottom-0"
                  style={{ left: `${(i * 10 / duration) * 100}%` }}
                >
                  <div className="w-px h-6 bg-white/30"></div>
                  <div className="text-xs text-gray-400 mt-1 -translate-x-1/2">
                    {formatTime(i * 10)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Playhead Visionário */}
            <div
              className="playhead-visionario absolute top-0 w-0.5 h-full z-40 transition-all duration-75"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="playhead-handle-visionario w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full -ml-2 -mt-2 border-2 border-white shadow-lg shadow-red-500/50"></div>
              <div className="playhead-line-visionario w-0.5 bg-gradient-to-b from-red-500 to-red-600 h-full shadow-lg"></div>
            </div>
          </div>

          {/* Tracks Container Visionário */}
          <div className="tracks-container-visionario flex-1 overflow-y-auto bg-black/10" style={{ height: '200px' }}>
            {/* Track de Vídeo */}
            <div className="track-visionario flex items-center h-16 border-b border-white/10 hover:bg-white/5 transition-colors group">
              <div className="track-header-visionario w-32 px-4 bg-black/20 h-full flex items-center border-r border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-400"></div>
                  <div>
                    <div className="text-sm font-medium text-white">🎬 Video</div>
                    <div className="text-xs text-gray-400">Principal</div>
                  </div>
                </div>
              </div>
              
              <div className="track-content-visionario flex-1 relative h-14 mx-2">
                <div
                  className="video-clip-visionario absolute top-1 h-12 rounded-lg cursor-pointer border-2 border-blue-500/50 hover:border-blue-400 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-blue-500/20"
                  style={{
                    left: '0%',
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.6))',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <div className="flex items-center h-full px-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🎬</span>
                      <div>
                        <div className="text-xs font-medium text-white truncate">
                          {videoData?.name || 'Video Principal'}
                        </div>
                        <div className="text-xs text-blue-200">
                          {formatTime(duration)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Track de Legendas */}
            <div className="track-visionario flex items-center h-16 border-b border-white/10 hover:bg-white/5 transition-colors group">
              <div className="track-header-visionario w-32 px-4 bg-black/20 h-full flex items-center border-r border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 border border-green-400"></div>
                  <div>
                    <div className="text-sm font-medium text-white">💬 Captions</div>
                    <div className="text-xs text-gray-400">IA</div>
                  </div>
                </div>
              </div>
              
              <div className="track-content-visionario flex-1 relative h-14 mx-2">
                {/* Blocos de legendas */}
                {generatedCaptions.length > 0 && (
                  <div className="caption-blocks-visionario absolute top-1 h-12 flex space-x-1">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div
                        key={i}
                        className="caption-block bg-gradient-to-r from-green-500/30 to-green-600/30 rounded border border-green-500/50 flex-1 min-w-12"
                        style={{ height: '48px' }}
                      >
                        <div className="text-xs text-green-200 p-1 truncate">
                          Legenda {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Track de Efeitos */}
            <div className="track-visionario flex items-center h-16 border-b border-white/10 hover:bg-white/5 transition-colors group">
              <div className="track-header-visionario w-32 px-4 bg-black/20 h-full flex items-center border-r border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 border border-purple-400"></div>
                  <div>
                    <div className="text-sm font-medium text-white">✨ Effects</div>
                    <div className="text-xs text-gray-400">Visual</div>
                  </div>
                </div>
              </div>
              
              <div className="track-content-visionario flex-1 relative h-14 mx-2">
                {activeEffects.length > 0 && (
                  <div className="effects-blocks-visionario absolute top-1 h-12 flex space-x-1">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div
                        key={i}
                        className="effect-block bg-gradient-to-r from-purple-500/30 to-purple-600/30 rounded border border-purple-500/50"
                        style={{ width: '80px', height: '48px' }}
                      >
                        <div className="text-xs text-purple-200 p-1 text-center">
                          FX{i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Track de Áudio */}
            <div className="track-visionario flex items-center h-16 border-b border-white/10 hover:bg-white/5 transition-colors group">
              <div className="track-header-visionario w-32 px-4 bg-black/20 h-full flex items-center border-r border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 border border-orange-400"></div>
                  <div>
                    <div className="text-sm font-medium text-white">🎵 Audio</div>
                    <div className="text-xs text-gray-400">Wave</div>
                  </div>
                </div>
              </div>
              
              <div className="track-content-visionario flex-1 relative h-14 mx-2">
                {/* Waveform visual */}
                <div className="waveform-visionario absolute top-1 h-12 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded border border-orange-500/30 w-full">
                  <div className="flex items-end h-full px-2 space-x-1">
                    {Array.from({ length: 50 }, (_, i) => (
                      <div
                        key={i}
                        className="bg-orange-400 rounded-sm"
                        style={{
                          width: '2px',
                          height: `${Math.random() * 40 + 8}px`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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


    </div>
  )
} 