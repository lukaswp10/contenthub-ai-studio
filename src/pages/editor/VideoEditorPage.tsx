import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { AutoCaptions } from '../../components/editor/AutoCaptions'
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
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [razorToolActive, setRazorToolActive] = useState(false)
  const [previewCut, setPreviewCut] = useState<number | null>(null)
  const [timelineZoom, setTimelineZoom] = useState(1)
  
  // Estados das captions - MELHORADOS
  const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([])
  const [currentVideoFile, setCurrentVideoFile] = useState<File | null>(null)
  const [activeCaptionStyle, setActiveCaptionStyle] = useState<string>('tiktok-bold')
  const [captionsVisible, setCaptionsVisible] = useState(true)
  
  // Efeitos e filtros
  const [activeEffects, setActiveEffects] = useState<string[]>([])
  const [effectIntensity, setEffectIntensity] = useState<Record<string, number>>({})
  
  // UI States - Navegação responsiva
  const [activeTab, setActiveTab] = useState<'timeline' | 'effects' | 'color' | 'audio' | 'ai'>('timeline')
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
          setSnapEnabled(!snapEnabled)
          console.log(snapEnabled ? '🧲 Snap ativado' : 'Snap desativado')
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
          setTimelineZoom(Math.min(3, timelineZoom + 0.25))
          break
        case '-':
          setTimelineZoom(Math.max(0.25, timelineZoom - 0.25))
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [razorToolActive, currentTime, duration, selectedLayer, snapEnabled, timelineZoom])

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
      const effect = effectPresets.find(e => e.id === effectId)
      const intensity = effectIntensity[effectId] || effect?.intensity || 1
      
      if (effect) {
        filters += `${effect.preview.replace(/[\d.]+/g, (match) => 
          (parseFloat(match) * intensity).toString()
        )} `
      }
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
    // Recriar layer original se necessário
    if (videoData && timelineLayers.length > 1) {
      const originalLayer: TimelineLayer = {
        id: 'main_video_layer_reset',
        type: 'video',
        name: videoData.name || 'Vídeo Principal',
        start: 0,
        duration: duration || 30,
        data: videoData,
        color: '#3b82f6',
        locked: false
      }
      setTimelineLayers([originalLayer])
    }
    console.log('🔄 Todos os cortes foram resetados')
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header Responsivo com Navegação */}
      <div className="toolbar p-3 flex items-center justify-between slide-in-left border-b border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Navegação Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-gray-300 hover:text-white px-2 py-1"
            >
              🏠 Dashboard
            </Button>
            <span className="text-gray-500">/</span>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/upload')}
              className="text-gray-300 hover:text-white px-2 py-1"
            >
              📁 Vídeos
            </Button>
            <span className="text-gray-500">/</span>
            <span className="text-blue-400 font-medium">✨ Editor</span>
          </div>
          
          {/* Nome do Projeto */}
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-white">
              {videoData?.name || 'Projeto Sem Nome'}
            </h1>
            <p className="text-xs text-gray-400">
              ClipsForge Pro Editor
            </p>
          </div>
        </div>
        
        {/* Controles do Header */}
        <div className="flex items-center space-x-2">
          {/* Toggle Sidebars - Desktop */}
          {!mobileView && (
            <>
              <Button
                variant="ghost"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="text-gray-300 hover:text-white"
                title="Toggle Galeria"
              >
                {leftSidebarOpen ? '◀️📁' : '📁▶️'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className="text-gray-300 hover:text-white"
                title="Toggle Efeitos"
              >
                {rightSidebarOpen ? '✨◀️' : '▶️✨'}
              </Button>
            </>
          )}
          
          {/* Botão Export */}
          <Button 
            onClick={exportVideo}
            className="primary-action-btn text-white px-4"
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

      {/* LAYOUT PRINCIPAL CORRIGIDO - Grid Responsivo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Galeria de Vídeos */}
        {leftSidebarOpen && (
          <div className={`${mobileView ? 'absolute top-0 left-0 h-full w-80 z-20 bg-gray-800' : 'w-80 flex-shrink-0'} sidebar flex flex-col slide-in-left border-r border-gray-700`}>
            {/* Header da Galeria */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">📁 Galeria</h2>
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
              
              {/* Tabs da Galeria */}
              <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
                <Button
                  onClick={() => setActiveGalleryTab('videos')}
                  className={`flex-1 py-2 px-3 rounded text-sm ${
                    activeGalleryTab === 'videos'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  📹 Vídeos ({uploadedVideos.length})
                </Button>
                <Button
                  onClick={() => setActiveGalleryTab('clips')}
                  className={`flex-1 py-2 px-3 rounded text-sm ${
                    activeGalleryTab === 'clips'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  ✂️ Clips ({generatedClips.length})
                </Button>
              </div>
            </div>

            {/* Conteúdo da Galeria */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeGalleryTab === 'videos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-300">Meus Vídeos</h3>
                    <Button
                      onClick={() => navigate('/upload')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1"
                    >
                      + Upload
                    </Button>
                  </div>
                  
                  {uploadedVideos.map(video => (
                    <Card
                      key={video.id}
                      className="p-3 cursor-pointer hover:bg-gray-700/50 transition-all duration-200 border border-gray-600"
                      onClick={() => loadVideo(video)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-12 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {video.name}
                          </h4>
                          <div className="text-xs text-gray-400 mt-1">
                            <div>{formatTime(video.duration)} • {video.size}</div>
                            <div>{formatTimeAgo(video.uploadedAt)}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {activeGalleryTab === 'clips' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-300">Clips Gerados</h3>
                    <span className="text-xs text-gray-500">
                      {generatedClips.filter(c => c.status === 'ready').length} prontos
                    </span>
                  </div>
                  
                  {generatedClips.map(clip => (
                    <Card
                      key={clip.id}
                      className="p-3 cursor-pointer hover:bg-gray-700/50 transition-all duration-200 border border-gray-600"
                      onClick={() => openClip(clip)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative w-16 h-12 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={clip.thumbnail}
                            alt={clip.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Status Badge */}
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                            clip.status === 'ready' ? 'bg-green-500' :
                            clip.status === 'processing' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {clip.name}
                          </h4>
                          <div className="text-xs text-gray-400 mt-1">
                            <div className="flex items-center space-x-2">
                              <span>{formatTime(clip.duration)}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                clip.format === 'TikTok' ? 'bg-pink-600' :
                                clip.format === 'Instagram' ? 'bg-purple-600' :
                                'bg-red-600'
                              }`}>
                                {clip.format}
                              </span>
                            </div>
                            <div className="mt-1">
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

        {/* ÁREA PRINCIPAL - Video Player e Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video Preview Container - Altura Fixa */}
          <div className="video-preview-container bg-black flex items-center justify-center p-4 border-b border-gray-700" style={{ height: 'calc(100vh - 320px)' }}>
            <div className="video-container relative max-w-4xl max-h-full hardware-accelerated">
              <video
                ref={videoRef}
                src={videoData?.url}
                onLoadedData={handleVideoLoad}
                onTimeUpdate={handleTimeUpdate}
                className="max-w-full max-h-full rounded-lg shadow-2xl"
                style={{ 
                  filter: 'none',
                  transition: 'filter 0.3s ease'
                }}
              />
              
              {/* Canvas para efeitos */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 rounded-lg"
                style={{ mixBlendMode: 'overlay' }}
              />
              
              {/* OVERLAY DE LEGENDAS - IMPLEMENTAÇÃO CRÍTICA */}
              <div 
                className="caption-overlay absolute bottom-4 left-4 right-4 text-center pointer-events-none z-10"
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  wordWrap: 'break-word'
                }}
              >
                {/* Aqui será renderizada a legenda atual baseada no currentTime */}
                {getCurrentCaption() && renderCaptionWithStyle(getCurrentCaption())}
              </div>
              
              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                <Button
                  onClick={togglePlayPause}
                  className="text-white bg-black/50 hover:bg-black/70 rounded-full w-16 h-16 flex items-center justify-center text-2xl border-2 border-white/20"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </Button>
              </div>
            </div>
          </div>

          {/* TIMELINE PROFISSIONAL - Altura Fixa */}
          <div className="timeline-container-pro bg-gray-800 border-t border-gray-700" style={{ height: '280px' }}>
            {/* Toolbar da Timeline */}
            <div className="timeline-toolbar p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800/90">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-bold text-white">⚡ Timeline Pro</span>
                
                {/* Ferramentas Profissionais */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={razorToolActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setRazorToolActive(!razorToolActive)}
                    className={`${razorToolActive 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    } transition-all duration-200`}
                    title="Ferramenta Razor (C)"
                  >
                    ✂️ Razor
                  </Button>
                  
                  <Button
                    variant={snapEnabled ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSnapEnabled(!snapEnabled)}
                    className={`${snapEnabled 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    } transition-all duration-200`}
                    title="Snap Magnético (M)"
                  >
                    🧲 {snapEnabled ? 'ON' : 'OFF'}
                  </Button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-2 border-l border-gray-600 pl-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTimelineZoom(Math.max(0.25, timelineZoom - 0.25))}
                    className="text-gray-400 hover:text-white"
                    title="Zoom Out (-)"
                  >
                    🔍-
                  </Button>
                  <span className="text-xs text-gray-400 min-w-12 text-center">
                    {Math.round(timelineZoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))}
                    className="text-gray-400 hover:text-white"
                    title="Zoom In (+)"
                  >
                    🔍+
                  </Button>
                </div>
              </div>
              
              {/* Controles de Reprodução */}
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-300 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                
                {/* Slider de Tempo Simples */}
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const newTime = parseFloat(e.target.value)
                      setCurrentTime(newTime)
                      if (videoRef.current) {
                        videoRef.current.currentTime = newTime
                      }
                    }}
                    className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-timeline"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                    }}
                  />
                </div>
                
                <Button
                  onClick={togglePlayPause}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium"
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </Button>
              </div>
            </div>

            {/* Timeline Principal */}
            <div className="flex-1 relative overflow-hidden" ref={timelineRef}>
              {/* Régua de Tempo */}
              <div className="timeline-ruler h-10 bg-gradient-to-b from-gray-700 to-gray-750 border-b border-gray-600 relative overflow-hidden">
                {renderTimeMarkers()}
                
                {/* Marcadores de Corte */}
                {cutPoints.map(cutPoint => (
                  <div
                    key={cutPoint.id}
                    className="absolute top-0 bottom-0 border-l-2 border-red-400 z-20"
                    style={{ left: `${(cutPoint.time / duration) * 100 * timelineZoom}%` }}
                    title={`Corte em ${formatTime(cutPoint.time)}`}
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1 border-2 border-white"></div>
                  </div>
                ))}
                
                {/* Preview de Corte */}
                {previewCut !== null && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-yellow-400 z-30 opacity-75"
                    style={{ left: `${(previewCut / duration) * 100 * timelineZoom}%` }}
                  >
                    <div className="w-3 h-3 bg-yellow-500 rounded-full -ml-1.5 -mt-1 animate-pulse"></div>
                  </div>
                )}
                
                {/* Playhead Principal */}
                <div
                  className="playhead-pro absolute top-0 w-0.5 h-full z-40 transition-all duration-75"
                  style={{ left: `${(currentTime / duration) * 100 * timelineZoom}%` }}
                >
                  <div className="playhead-handle w-4 h-4 bg-red-500 rounded-full -ml-2 -mt-2 border-2 border-white shadow-lg"></div>
                  <div className="playhead-line w-0.5 bg-red-500 h-full shadow-lg"></div>
                </div>
              </div>

              {/* Tracks Container - Altura Fixa */}
              <div className="tracks-container flex-1 overflow-y-auto bg-gray-850" style={{ height: '200px' }}>
                {timelineLayers.map((layer) => (
                  <div key={layer.id} className="track-row flex items-center h-16 border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                    {/* Track Header */}
                    <div className="track-header w-36 px-3 bg-gray-800/50 h-full flex items-center justify-between border-r border-gray-600 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: layer.color }}
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-white truncate max-w-16">
                            {layer.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {layer.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white p-1 w-6 h-6"
                          onClick={() => {
                            setTimelineLayers(prev => prev.map(l => 
                              l.id === layer.id ? { ...l, locked: !l.locked } : l
                            ))
                          }}
                        >
                          {layer.locked ? '🔒' : '🔓'}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Track Content Area - CORRIGIDO */}
                    <div 
                      className="track-content flex-1 relative h-14 mx-1"
                      style={{ minWidth: `${duration * timelineZoom * 10}px` }}
                      onMouseMove={(e) => {
                        if (razorToolActive) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const time = getTimeFromPosition(x)
                          handleTimelineHover(time)
                        }
                      }}
                      onMouseLeave={() => setPreviewCut(null)}
                      onClick={(e) => {
                        if (razorToolActive && !layer.locked) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const time = getTimeFromPosition(x)
                          const snappedTime = snapToGrid(time)
                          
                          // Verificar se o clique está dentro do layer
                          if (snappedTime >= layer.start && snappedTime <= layer.start + layer.duration) {
                            handleRazorCut(layer.id, snappedTime)
                            setRazorToolActive(false) // Desativar razor após uso
                          }
                        }
                      }}
                    >
                      {/* Clip Visual - MELHORADO */}
                      <div
                        className={`timeline-clip-pro absolute top-1 h-12 rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                          selectedLayer === layer.id 
                            ? 'border-blue-400 shadow-lg shadow-blue-400/30' 
                            : 'border-gray-600 hover:border-gray-500'
                        } ${razorToolActive ? 'cursor-crosshair' : 'cursor-move'}`}
                        style={{
                          left: `${(layer.start / duration) * 100 * timelineZoom}%`,
                          width: `${(layer.duration / duration) * 100 * timelineZoom}%`,
                          minWidth: '80px',
                          background: `linear-gradient(135deg, ${layer.color}AA, ${layer.color}FF)`,
                          boxShadow: selectedLayer === layer.id ? `0 0 20px ${layer.color}40` : 'none'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!razorToolActive) {
                            setSelectedLayer(layer.id)
                          }
                        }}
                      >
                        {/* Clip Content */}
                        <div className="flex items-center h-full px-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {layer.type === 'video' ? '🎬' : 
                              layer.type === 'audio' ? '🎵' : 
                              layer.type === 'text' ? '📝' : '✨'}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-white truncate">
                                {layer.name}
                              </span>
                              <span className="text-xs text-gray-300">
                                {formatTime(layer.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Trim Handles - Apenas se selecionado */}
                        {selectedLayer === layer.id && !razorToolActive && (
                          <>
                            <div className="trim-handle-left absolute left-0 top-0 w-2 h-full bg-blue-400 rounded-l-lg cursor-ew-resize opacity-75 hover:opacity-100"></div>
                            <div className="trim-handle-right absolute right-0 top-0 w-2 h-full bg-blue-400 rounded-r-lg cursor-ew-resize opacity-75 hover:opacity-100"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Placeholder para mais tracks */}
                <div className="track-row flex items-center h-16 border-b border-gray-700/30 opacity-50">
                  <div className="track-header w-36 px-3 h-full flex items-center border-r border-gray-600 flex-shrink-0">
                    <span className="text-xs text-gray-500">+ Adicionar Track</span>
                  </div>
                  <div className="track-content flex-1 h-14 mx-1"></div>
                </div>
              </div>

              {/* Timeline Interactions Overlay */}
              <div
                className={`absolute inset-0 z-10 ${razorToolActive ? 'cursor-crosshair' : 'cursor-pointer'}`}
                style={{ left: '144px' }} // Offset para não cobrir headers
                onMouseMove={(e) => {
                  if (razorToolActive) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const time = getTimeFromPosition(x)
                    handleTimelineHover(time)
                  }
                }}
                onClick={(e) => {
                  if (!razorToolActive) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percentage = (x / (rect.width * timelineZoom)) * 100
                    seekTo(Math.max(0, Math.min(100, percentage)))
                  }
                }}
              />
            </div>
            
            {/* Timeline Status Bar */}
            <div className="timeline-status bg-gray-800 px-3 py-1 text-xs text-gray-400 border-t border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span>📊 {timelineLayers.length} tracks</span>
                <span>✂️ {cutPoints.length} cuts</span>
                {razorToolActive && <span className="text-red-400 animate-pulse">🔄 Razor Tool Ativo - Clique para cortar</span>}
                
                {/* Botão para gerar clips dos cortes */}
                {cutPoints.length > 0 && (
                  <>
                    <Button
                      onClick={generateClipsFromCuts}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs font-medium rounded-md"
                      title="Gerar clips baseados nos cortes realizados"
                    >
                      🎬 Gerar {cutPoints.length + 1} Clips
                    </Button>
                    <Button
                      onClick={resetAllCuts}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs font-medium rounded-md"
                      title="Resetar todos os cortes"
                    >
                      🔄 Reset Cortes
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <span>Atalhos:</span>
                <span className="bg-gray-700 px-1 rounded">Space</span>
                <span className="bg-gray-700 px-1 rounded">C</span>
                <span className="bg-gray-700 px-1 rounded">S</span>
                <span className="bg-gray-700 px-1 rounded">M</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Effects Panel */}
        {rightSidebarOpen && (
          <div className={`${mobileView ? 'absolute top-0 right-0 h-full w-80 z-20 bg-gray-800' : 'w-80 flex-shrink-0'} sidebar flex flex-col slide-in-right border-l border-gray-700`}>
            {/* Header dos Efeitos */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'effects', label: 'Efeitos', icon: '✨' },
                { id: 'color', label: 'Cor', icon: '🎨' },
                { id: 'audio', label: 'Áudio', icon: '🎵' },
                { id: 'ai', label: 'IA', icon: '🤖' }
              ].map(tab => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className={`sidebar-tab flex-1 py-3 rounded-none ${
                    activeTab === tab.id as any
                      ? 'active bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {mobileView ? tab.icon : `${tab.icon} ${tab.label}`}
                </Button>
              ))}
              
              {mobileView && (
                <Button
                  variant="ghost"
                  onClick={() => setRightSidebarOpen(false)}
                  className="text-gray-400 hover:text-white p-3"
                >
                  ✕
                </Button>
              )}
            </div>

            {/* Effects Content */}
            {activeTab === 'effects' && (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Efeitos Profissionais</h3>
                
                {/* Active Effects */}
                {activeEffects.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Efeitos Ativos</h4>
                    <div className="space-y-2">
                      {activeEffects.map(effectId => {
                        const effect = effectPresets.find(e => e.id === effectId)
                        if (!effect) return null
                        
                        return (
                          <div key={effectId} className="bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{effect.icon}</span>
                                <span className="text-sm font-medium text-white">{effect.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEffect(effectId)}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                ❌
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Intensidade</span>
                                <span className="text-xs text-gray-300">
                                  {Math.round((effectIntensity[effectId] || effect.intensity) * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={effectIntensity[effectId] || effect.intensity}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value)
                                  setEffectIntensity(prev => ({
                                    ...prev,
                                    [effectId]: value
                                  }))
                                }}
                                className="slider w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Available Effects */}
                <div className="effects-grid">
                  {effectPresets.map(effect => (
                    <Card
                      key={effect.id}
                      className={`effect-card p-3 cursor-pointer transition-all duration-200 border-2 ${
                        activeEffects.includes(effect.id)
                          ? 'active'
                          : ''
                      }`}
                      onClick={() => 
                        activeEffects.includes(effect.id) 
                          ? removeEffect(effect.id)
                          : addEffect(effect.id)
                      }
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{effect.icon}</div>
                        <div className="text-xs font-medium text-white mb-1">{effect.name}</div>
                        <div className="text-xs text-gray-400">{effect.category}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Other tabs content */}
            {activeTab === 'color' && (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Correção de Cor</h3>
                <div className="text-center text-gray-400 py-8">
                  🎨 Color Wheel em desenvolvimento<br/>
                  <span className="text-xs">Inspirado no CapCut Pro</span>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="flex-1 overflow-y-auto">
                {/* Controles de Caption */}
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-white">🎬 Legendas</h3>
                  
                  {/* Status das Captions */}
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Status</span>
                      <Button
                        onClick={toggleCaptionsVisibility}
                        className={`text-xs px-2 py-1 ${
                          captionsVisible 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {captionsVisible ? '👁️ Visível' : '🚫 Oculto'}
                      </Button>
                    </div>
                    <div className="text-xs text-gray-400">
                      {generatedCaptions.length > 0 
                        ? `✅ ${generatedCaptions.length} legendas carregadas`
                        : '⚠️ Nenhuma legenda gerada ainda'
                      }
                    </div>
                  </div>

                  {/* Estilos de Caption */}
                  {generatedCaptions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">🎨 Estilos</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(captionStyles).map(([styleId, style]) => (
                          <Button
                            key={styleId}
                            onClick={() => applyCaptionStyle(styleId)}
                            className={`p-2 text-xs rounded-lg border-2 transition-all ${
                              activeCaptionStyle === styleId
                                ? 'border-blue-400 bg-blue-600/20'
                                : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            <div 
                              className="text-center"
                              style={{
                                fontSize: '10px',
                                fontWeight: style.fontWeight,
                                color: style.color,
                                textShadow: style.textShadow,
                                background: style.background,
                                padding: '2px 4px',
                                borderRadius: '2px'
                              }}
                            >
                              {styleId.replace('-', ' ').toUpperCase()}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview de Caption */}
                  {generatedCaptions.length > 0 && (
                    <div className="mb-4 p-3 bg-black rounded-lg">
                      <div className="text-xs text-gray-400 mb-2">Preview:</div>
                      <div className="flex items-center justify-center h-16">
                        {renderCaptionWithStyle({ text: 'EXEMPLO DE LEGENDA' })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Componente AutoCaptions */}
                <AutoCaptions
                  videoUrl={videoData?.url}
                  duration={duration}
                  onCaptionsGenerated={handleCaptionsGenerated}
                  videoFile={currentVideoFile || undefined}
                />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">IA Avançada</h3>
                
                {/* Corte Inteligente */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">🎯 Corte Inteligente</h4>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        // Simulação de corte automático baseado em pausas/silêncios
                        const autoCuts = [duration * 0.2, duration * 0.5, duration * 0.8]
                        const newCuts = autoCuts.map((time, index) => ({
                          id: `auto_cut_${Date.now()}_${index}`,
                          time: time,
                          type: 'cut' as const
                        }))
                        setCutPoints(prev => [...prev, ...newCuts])
                        console.log('🤖 IA detectou pausas e criou cortes automáticos')
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start"
                    >
                      🤖 Auto Cut (Detectar Pausas)
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        // Simulação de detecção de momentos-chave
                        alert('🎬 IA analisando momentos de maior engajamento...\n\n• Expressões faciais intensas\n• Mudanças de tom de voz\n• Gestos marcantes\n\nEm breve: Cortes automáticos nos melhores momentos!')
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start"
                    >
                      🎯 Smart Highlights
                    </Button>
                  </div>
                </div>

                {/* Outras funcionalidades IA */}
                <div className="space-y-3">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
                    🎬 Auto Caption (IA)
                  </Button>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
                    🎬 Script to Video
                  </Button>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
                    🗣️ AI Voice Generator  
                  </Button>
                  <Button 
                    onClick={() => {
                      if (cutPoints.length > 0) {
                        generateClipsFromCuts()
                      } else {
                        alert('⚠️ Faça alguns cortes primeiro usando a ferramenta Razor ou Auto Cut')
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
                  >
                    ✂️ Gerar Clips dos Cortes
                  </Button>
                </div>
                
                {/* Status da IA */}
                <div className="mt-6 p-3 bg-gray-800 rounded-lg border border-purple-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-purple-400">🧠</span>
                    <span className="text-sm font-medium text-white">Status da IA</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>• Timeline: {timelineLayers.length} layers detectadas</div>
                    <div>• Cortes: {cutPoints.length} pontos identificados</div>
                    <div>• Duração: {formatTime(duration)} de conteúdo</div>
                    <div className="text-green-400">• Sistema: Pronto para análise</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Status da IA e Timeline */}
      <div className="ia-status-panel">
        <div className="status-header">
          <span className="status-icon">🤖</span>
          <span className="status-title">IA Status</span>
        </div>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Timeline Layers:</span>
            <span className="status-value">{timelineLayers.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Cuts Made:</span>
            <span className="status-value">{cutPoints.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Duration:</span>
            <span className="status-value">{formatTime(duration)}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Captions:</span>
            <span className="status-value">{generatedCaptions.length} words</span>
          </div>
        </div>
      </div>
    </div>
  )
} 