import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

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
  const [zoom, setZoom] = useState(1)
  
  // Timeline e camadas
  const [timelineLayers, setTimelineLayers] = useState<TimelineLayer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [playheadPosition, setPlayheadPosition] = useState(0)
  
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
      setPlayheadPosition((time / duration) * 100)
      
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
      setPlayheadPosition(percentage)
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

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header Responsivo com Navegação */}
      <div className="toolbar p-3 flex items-center justify-between slide-in-left">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Galeria de Vídeos */}
        {leftSidebarOpen && (
          <div className={`${mobileView ? 'absolute top-0 left-0 h-full w-80 z-20' : 'w-80'} sidebar flex flex-col slide-in-left`}>
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <div className="video-container max-w-4xl max-h-full hardware-accelerated">
              <video
                ref={videoRef}
                src={videoData?.url}
                onLoadedData={handleVideoLoad}
                onTimeUpdate={handleTimeUpdate}
                className="max-w-full max-h-full"
                style={{ 
                  filter: 'none',
                  transition: 'filter 0.3s ease'
                }}
              />
              
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0"
                style={{ mixBlendMode: 'overlay' }}
              />
              
              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  onClick={togglePlayPause}
                  className="text-white bg-black/50 hover:bg-black/70 rounded-full w-16 h-16 flex items-center justify-center text-2xl border-2 border-white/20"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </Button>
              </div>
            </div>
          </div>

          {/* Professional Timeline */}
          <div className="h-64 timeline-container slide-in-right">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-300">Timeline</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                    className="text-gray-400 hover:text-white"
                  >
                    🔍-
                  </Button>
                  <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                    className="text-gray-400 hover:text-white"
                  >
                    🔍+
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <Button
                  onClick={togglePlayPause}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                >
                  {isPlaying ? '⏸️ Pausar' : '▶️ Play'}
                </Button>
              </div>
            </div>

            {/* Timeline Tracks */}
            <div className="flex-1 relative overflow-auto" ref={timelineRef}>
              {/* Time ruler */}
              <div className="h-8 bg-gray-700 border-b border-gray-600 relative">
                {duration > 0 && Array.from({ length: Math.ceil(duration) }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-gray-500 text-xs text-gray-400 pl-1 pt-1"
                    style={{ left: `${(i / duration) * 100 * zoom}%` }}
                  >
                    {formatTime(i)}
                  </div>
                ))}
                
                {/* Playhead */}
                <div
                  className="playhead absolute top-0 w-0.5 h-full z-10 pointer-events-none"
                  style={{ left: `${playheadPosition * zoom}%` }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1"></div>
                </div>
              </div>

              {/* Video Tracks */}
              <div className="space-y-1 p-2">
                {timelineLayers.map((layer) => (
                  <div key={layer.id} className="timeline-track flex items-center h-12 bg-gray-750 rounded">
                    {/* Track Header */}
                    <div className="w-32 px-3 border-r border-gray-600 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="text-xs text-gray-300 truncate">
                          {layer.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white p-1"
                      >
                        {layer.locked ? '🔒' : '🔓'}
                      </Button>
                    </div>
                    
                    {/* Track Content */}
                    <div className="flex-1 relative h-10 mx-2">
                      <div
                        className={`timeline-clip absolute top-1 h-8 rounded cursor-pointer border-2 flex items-center px-2 ${
                          selectedLayer === layer.id 
                            ? 'selected' 
                            : ''
                        }`}
                        style={{
                          left: `${(layer.start / duration) * 100 * zoom}%`,
                          width: `${(layer.duration / duration) * 100 * zoom}%`,
                          minWidth: '60px'
                        }}
                        onClick={() => setSelectedLayer(layer.id)}
                      >
                        <span className="text-xs text-white truncate">
                          {layer.type === 'video' ? '🎬' : 
                           layer.type === 'audio' ? '🎵' : 
                           layer.type === 'text' ? '📝' : '✨'} 
                          {layer.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clickable timeline for seeking */}
              <div
                className="absolute inset-0 cursor-pointer z-5"
                onClick={(e) => {
                  const rect = timelineRef.current?.getBoundingClientRect()
                  if (rect) {
                    const x = e.clientX - rect.left - 128
                    const percentage = (x / ((rect.width - 128) * zoom)) * 100
                    seekTo(Math.max(0, Math.min(100, percentage)))
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Effects Panel */}
        {rightSidebarOpen && (
          <div className={`${mobileView ? 'absolute top-0 right-0 h-full w-80 z-20' : 'w-80'} sidebar flex flex-col slide-in-right`}>
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
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Áudio Profissional</h3>
                <div className="text-center text-gray-400 py-8">
                  🎵 Mixer profissional em desenvolvimento<br/>
                  <span className="text-xs">Em breve: Auto captions como CapCut</span>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">IA Avançada</h3>
                <div className="space-y-3">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
                    🤖 Auto Caption (IA)
                  </Button>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
                    🎬 Script to Video
                  </Button>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
                    🗣️ AI Voice Generator  
                  </Button>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
                    ✂️ Smart Cut (IA)
                  </Button>
                </div>
                <div className="text-center text-gray-400 text-xs mt-4">
                  Powered by ClipsForge AI Engine
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
    </div>
  )
} 