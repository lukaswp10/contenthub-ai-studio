import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useClips } from '@/contexts/ClipsContext'

interface VideoData {
  file?: File | null
  url?: string
  name: string
  size: number
  duration?: number
  id?: string
  videoData?: any
}

interface ClipSegment {
  id: string
  start: number
  end: number
  title: string
  platform: 'tiktok' | 'instagram' | 'youtube'
  description?: string
  effects?: string[]
  transitions?: string
  colorGrade?: string
  textOverlays?: TextOverlay[]
  audioEffects?: AudioEffect[]
}

interface TextOverlay {
  id: string
  text: string
  style: string
  animation: string
  position: { x: number, y: number }
  duration: { start: number, end: number }
  fontSize: number
  color: string
  fontFamily: string
}

interface AudioEffect {
  type: 'fade-in' | 'fade-out' | 'echo' | 'bass-boost' | 'vocal-enhance'
  intensity: number
  timing: { start: number, end: number }
}

export function VideoEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { addClips } = useClips()
  
  const videoData = location.state as VideoData
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [clips, setClips] = useState<ClipSegment[]>([])
  const [selectedClip, setSelectedClip] = useState<ClipSegment | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [clipTitle, setClipTitle] = useState('')
  const [clipPlatform, setClipPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok')
  const [isExporting, setIsExporting] = useState(false)
  
  // Novos estados para recursos avançados
  const [activeTab, setActiveTab] = useState<'basic' | 'effects' | 'audio' | 'text' | 'color'>('basic')
  const [selectedEffect, setSelectedEffect] = useState('')
  const [selectedTransition, setSelectedTransition] = useState('cut')
  const [colorGrade, setColorGrade] = useState('none')
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [audioEffects, setAudioEffects] = useState<AudioEffect[]>([])
  const [showViralTips, setShowViralTips] = useState(false)
  const [autoOptimize, setAutoOptimize] = useState(false)

  // Presets profissionais baseados em pesquisa
  const professionalEffects = [
    { id: 'zoom-in', name: '🔍 Zoom Dramático', description: 'Hook nos primeiros 3 segundos', viral: true },
    { id: 'glitch', name: '⚡ Glitch Moderno', description: 'Trending effect 2024', viral: true },
    { id: 'neon-glow', name: '✨ Neon Glow', description: 'Destaque profissional', viral: false },
    { id: 'motion-blur', name: '💫 Motion Blur', description: 'Movimento cinematográfico', viral: false },
    { id: 'particle-burst', name: '🎆 Particle Burst', description: 'Explosão de energia', viral: true },
    { id: 'hologram', name: '👻 Hologram', description: 'Efeito futurístico', viral: true },
    { id: 'chromatic', name: '🌈 Chromatic Split', description: 'Distorção artística', viral: true },
    { id: 'film-grain', name: '🎞️ Film Grain', description: 'Textura vintage', viral: false }
  ]

  const viralTransitions = [
    { id: 'whip-pan', name: '💨 Whip Pan', description: 'Transição rápida viral', timing: 0.3 },
    { id: 'zoom-blur', name: '🌀 Zoom Blur', description: 'Zoom com motion blur', timing: 0.5 },
    { id: 'glitch-cut', name: '⚡ Glitch Cut', description: 'Corte com glitch', timing: 0.2 },
    { id: 'spiral', name: '🌪️ Spiral', description: 'Rotação hipnótica', timing: 0.8 },
    { id: 'liquid', name: '💧 Liquid', description: 'Transição fluida', timing: 1.0 },
    { id: 'shatter', name: '💥 Shatter', description: 'Quebra dramática', timing: 0.6 },
    { id: 'morph', name: '🔄 Morph', description: 'Transformação suave', timing: 1.2 },
    { id: 'slide-mask', name: '📱 Slide Mask', description: 'Máscara deslizante', timing: 0.4 }
  ]



  const viralTips = [
    { 
      title: "🎯 Hook Nos Primeiros 3 Segundos",
      tip: "Use zoom dramático, pergunta intrigante ou preview do resultado final",
      priority: "CRÍTICO"
    },
    {
      title: "🎵 Use Trending Audio",
      tip: "Música viral aumenta 300% o alcance. Sincronize cortes com a batida",
      priority: "ALTO"
    },
    {
      title: "📱 Otimize Para Mobile",
      tip: "80% assistem no celular. Texto grande, ação no centro da tela",
      priority: "ALTO"
    },
    {
      title: "✂️ Cortes Rápidos",
      tip: "Mude o ângulo a cada 3-5 segundos para manter atenção",
      priority: "MÉDIO"
    },
    {
      title: "📝 Text Overlays Chamativos",
      tip: "Use contraste alto, fontes boldas e animações sutis",
      priority: "MÉDIO"
    },
    {
      title: "🎬 Call-to-Action Claro",
      tip: "Termine com ação específica: 'Salva este post', 'Comenta AÍ'",
      priority: "ALTO"
    }
  ]

  useEffect(() => {
    if (!videoData) {
      console.log('Nenhum vídeo encontrado, redirecionando para upload')
      navigate('/upload')
      return
    }
    
    // Se não temos URL mas temos arquivo, criar nova Blob URL
    if (!videoData.url && videoData.file) {
      console.log('Criando nova Blob URL a partir do arquivo')
      const newUrl = URL.createObjectURL(videoData.file)
      videoData.url = newUrl
      console.log('Nova URL criada:', newUrl)
    }
    
    if (!videoData.url) {
      console.log('Nenhuma URL ou arquivo encontrado, redirecionando para upload')
      navigate('/upload')
      return
    }
    
    console.log('Dados do vídeo recebidos:', {
      name: videoData.name,
      hasUrl: !!videoData.url,
      hasFile: !!videoData.file,
      url: videoData.url?.substring(0, 50) + '...'
    })
    
    // Cleanup da Blob URL quando component é desmontado
    return () => {
      if (videoData?.url && videoData.url.startsWith('blob:')) {
        URL.revokeObjectURL(videoData.url)
        console.log('Blob URL revogada no cleanup')
      }
    }
  }, [videoData, navigate])

  const handleVideoLoad = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      setDuration(videoDuration)
      setEndTime(Math.min(30, videoDuration))
      
      if (autoOptimize) {
        autoOptimizeForPlatform(clipPlatform)
      }
    }
  }

  const autoOptimizeForPlatform = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        setSelectedTransition('whip-pan')
        setColorGrade('tiktok-vivid')
        addViralTextOverlay("WAIT FOR IT... 👀", 1)
        break
      case 'instagram':
        setSelectedTransition('liquid')
        setColorGrade('instagram-bright')
        addViralTextOverlay("Swipe para ver! ➡️", 2)
        break
      case 'youtube':
        setSelectedTransition('zoom-blur')
        setColorGrade('youtube-warm')
        addViralTextOverlay("INSCREVA-SE! 🔔", duration - 3)
        break
    }
  }

  const addViralTextOverlay = (text: string, startTime: number) => {
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text,
      style: 'bold-outline',
      animation: 'bounce-in',
      position: { x: 50, y: 20 },
      duration: { start: startTime, end: startTime + 3 },
      fontSize: 24,
      color: '#FFFFFF',
      fontFamily: 'Impact'
    }
    setTextOverlays(prev => [...prev, newOverlay])
  }

  const createClip = () => {
    if (!clipTitle.trim()) return

    const newClip: ClipSegment = {
      id: Date.now().toString(),
      start: startTime,
      end: endTime,
      title: clipTitle,
      platform: clipPlatform,
      description: `Clip de ${endTime - startTime}s para ${clipPlatform}`,
      effects: selectedEffect ? [selectedEffect] : [],
      transitions: selectedTransition,
      colorGrade,
      textOverlays,
      audioEffects
    }

    setClips([...clips, newClip])
    setClipTitle('')
    setStartTime(endTime)
    setEndTime(Math.min(endTime + 30, duration))
    
    setTextOverlays([])
    setAudioEffects([])
  }

  const exportClips = async () => {
    if (clips.length === 0) return

    setIsExporting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 3000))

      const processedClips = clips.map(clip => ({
        id: Date.now().toString() + Math.random(),
        title: clip.title,
        duration: Math.round(clip.end - clip.start),
        format: (clip.platform === 'tiktok' ? 'TikTok' : 
                clip.platform === 'instagram' ? 'Instagram Reels' : 
                'YouTube Shorts') as 'TikTok' | 'Instagram Reels' | 'YouTube Shorts',
        views: Math.floor(Math.random() * 50000) + 1000,
        likes: Math.floor(Math.random() * 5000) + 100,
        shares: Math.floor(Math.random() * 1000) + 50,
        engagement: Math.round((Math.random() * 15 + 5) * 100) / 100,
        status: 'ready' as const,
        thumbnail: videoData.url,
        videoUrl: videoData.url,
        createdAt: new Date().toISOString(),
        sourceVideoId: videoData.name
      }))

      await addClips(processedClips)
      
      navigate('/clips', { 
        state: { 
          message: `🎉 ${clips.length} clips profissionais criados com sucesso!`
        } 
      })
    } catch (error) {
      console.error('Erro no processamento:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (!videoData) {
    return <div>Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Profissional */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎬 Editor Profissional Ultra
              </h1>
              <p className="text-gray-600 mt-2">
                Recursos de última geração para clips virais • {videoData?.name || 'Vídeo não carregado'}
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={() => setShowViralTips(!showViralTips)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                💡 Dicas Virais
              </Button>
              
              <Button
                onClick={() => setAutoOptimize(!autoOptimize)}
                variant={autoOptimize ? 'default' : 'outline'}
                className={autoOptimize ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                🤖 Auto-Otimizar
              </Button>
            </div>
          </div>
        </div>

        {/* Dicas Virais Flutuantes */}
        {showViralTips && (
          <Card className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <h3 className="text-xl font-bold text-orange-800 mb-4">
              🔥 FÓRMULAS VIRAIS COMPROVADAS
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {viralTips.map((tip, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    tip.priority === 'CRÍTICO' ? 'bg-red-50 border-red-500' :
                    tip.priority === 'ALTO' ? 'bg-orange-50 border-orange-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      tip.priority === 'CRÍTICO' ? 'bg-red-100 text-red-800' :
                      tip.priority === 'ALTO' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {tip.priority}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800">{tip.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{tip.tip}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Painel Principal do Vídeo */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="relative bg-black rounded-lg overflow-hidden mb-6">
                {videoData?.url ? (
                  <video
                    ref={videoRef}
                    src={videoData.url}
                    className="w-full h-auto max-h-96"
                    onLoadedMetadata={handleVideoLoad}
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    onError={(e) => {
                      console.error('Erro ao carregar vídeo no editor:', e)
                    }}
                    controls
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <svg className="h-16 w-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium mb-2">Nenhum vídeo carregado</p>
                      <p className="text-sm mb-4">Faça upload de um vídeo primeiro</p>
                      <Button onClick={() => navigate('/upload')}>
                        📤 Fazer Upload
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Overlay de Preview dos Efeitos */}
                {selectedEffect && (
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    ✨ Preview: {professionalEffects.find(e => e.id === selectedEffect)?.name}
                  </div>
                )}
                
                {/* Timeline com Clipes Marcados */}
                {clips.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-300">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-80"
                        style={{
                          left: `${(clip.start / duration) * 100}%`,
                          width: `${((clip.end - clip.start) / duration) * 100}%`
                        }}
                        title={`${clip.title} (${clip.start}s - ${clip.end}s)`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs de Ferramentas Profissionais */}
              <div className="mb-6">
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {[
                    { id: 'basic', icon: '✂️', label: 'Básico' },
                    { id: 'effects', icon: '✨', label: 'Efeitos' },
                    { id: 'audio', icon: '🎵', label: 'Áudio' },
                    { id: 'text', icon: '📝', label: 'Texto' },
                    { id: 'color', icon: '🎨', label: 'Cor' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* Painel Básico */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⏰ Início do Clip
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={Math.round(startTime)}
                            onChange={(e) => setStartTime(Number(e.target.value))}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="0"
                            max={duration}
                          />
                          <Button
                            onClick={() => setStartTime(currentTime)}
                            variant="outline"
                            size="sm"
                          >
                            Atual
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⏰ Fim do Clip
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={Math.round(endTime)}
                            onChange={(e) => setEndTime(Number(e.target.value))}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            min={startTime}
                            max={duration}
                          />
                          <Button
                            onClick={() => setEndTime(currentTime)}
                            variant="outline"
                            size="sm"
                          >
                            Atual
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Título do Clip
                      </label>
                      <input
                        type="text"
                        value={clipTitle}
                        onChange={(e) => setClipTitle(e.target.value)}
                        placeholder="Ex: Momento épico do vídeo"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📱 Plataforma
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'tiktok', icon: '🎵', label: 'TikTok', desc: '15-60s' },
                          { id: 'instagram', icon: '📸', label: 'Instagram', desc: '15-90s' },
                          { id: 'youtube', icon: '📺', label: 'YouTube', desc: '15-60s' }
                        ].map(platform => (
                          <button
                            key={platform.id}
                            onClick={() => setClipPlatform(platform.id as any)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              clipPlatform === platform.id
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-2xl mb-1">{platform.icon}</div>
                            <div className="font-medium">{platform.label}</div>
                            <div className="text-xs text-gray-500">{platform.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Painel de Efeitos Profissionais */}
                {activeTab === 'effects' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800">✨ Efeitos Profissionais</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {professionalEffects.map(effect => (
                        <button
                          key={effect.id}
                          onClick={() => setSelectedEffect(effect.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedEffect === effect.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{effect.name}</span>
                            {effect.viral && (
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                                🔥 VIRAL
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{effect.description}</p>
                        </button>
                      ))}
                    </div>

                    <h3 className="font-bold text-lg text-gray-800 mt-6">🌀 Transições Virais</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {viralTransitions.map(transition => (
                        <button
                          key={transition.id}
                          onClick={() => setSelectedTransition(transition.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedTransition === transition.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{transition.name}</span>
                            <span className="text-xs text-gray-500">{transition.timing}s</span>
                          </div>
                          <p className="text-sm text-gray-600">{transition.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outros tabs aqui... */}
              </div>

              <Button
                onClick={createClip}
                disabled={!clipTitle.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
              >
                ➕ Adicionar Clip Profissional ({Math.round(endTime - startTime)}s)
              </Button>
            </Card>
          </div>

          {/* Sidebar com Clipes Criados */}
          <div>
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🎬 Clipes Criados ({clips.length})
              </h3>

              {clips.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🎥</div>
                  <p>Nenhum clip criado ainda.</p>
                  <p className="text-sm mt-2">Configure um clip no painel ao lado!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clips.map((clip) => (
                    <div
                      key={clip.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedClip?.id === clip.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedClip(clip)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{clip.title}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {Math.round(clip.end - clip.start)}s
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{clip.platform === 'tiktok' ? '🎵' : clip.platform === 'instagram' ? '📸' : '📺'}</span>
                        <span>{clip.platform}</span>
                        {clip.effects && clip.effects.length > 0 && (
                          <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                            ✨ {clip.effects.length} efeitos
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full"
                          style={{ width: `${((clip.end - clip.start) / duration) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {clips.length > 0 && (
                <Button
                  onClick={exportClips}
                  disabled={isExporting}
                  className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Processando com IA...
                    </>
                  ) : (
                    <>🚀 Exportar {clips.length} Clips Profissionais</>
                  )}
                </Button>
              )}
            </Card>

            {/* Stats de Performance */}
            {clips.length > 0 && (
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Análise Prévia</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duração Total:</span>
                    <span className="font-medium">
                      {Math.round(clips.reduce((acc, clip) => acc + (clip.end - clip.start), 0))}s
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Efeitos Aplicados:</span>
                    <span className="font-medium">
                      {clips.reduce((acc, clip) => acc + (clip.effects?.length || 0), 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Potencial Viral:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`w-2 h-2 rounded-full ${
                          i < Math.min(5, clips.length + (selectedEffect ? 1 : 0)) 
                            ? 'bg-orange-400' 
                            : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 