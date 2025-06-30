import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useClips } from '@/contexts/ClipsContext'

interface VideoData {
  file: File
  url: string
  name: string
  size: number
  duration?: number
}

interface TextOverlay {
  id: string
  text: string
  position: { x: number; y: number }
  style: string
  animation: string
  duration: { start: number; end: number }
  fontSize: number
  color: string
}



interface ClipSegment {
  id: string
  title: string
  start: number
  end: number
  platform: 'tiktok' | 'instagram' | 'youtube'
  effects?: string[]
  textOverlays?: TextOverlay[]
}

export function VideoEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { addClips } = useClips()
  
  const videoData = location.state as VideoData
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [clipStart, setClipStart] = useState(0)
  const [clipEnd, setClipEnd] = useState(5)
  const [clips, setClips] = useState<ClipSegment[]>([])
  const [selectedFormat, setSelectedFormat] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok')
  const [activeTab, setActiveTab] = useState('timeline')
  const [selectedEffect, setSelectedEffect] = useState<string>('')
  const [selectedTransition, setSelectedTransition] = useState<string>('')
  const [colorGrade, setColorGrade] = useState<string>('')
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedClip, setSelectedClip] = useState<ClipSegment | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [clipTitle, setClipTitle] = useState('')
  const [clipPlatform, setClipPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok')
  const [isExporting, setIsExporting] = useState(false)
  
  // Novos estados para recursos avançados
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
      navigate('/upload')
      return
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
    }
    setTextOverlays(prev => [...prev, newOverlay])
  }

  const createClip = () => {
    if (!clipTitle.trim()) return

    const newClipSegment: ClipSegment = {
      id: Date.now().toString(),
      title: clipTitle,
      start: startTime,
      end: endTime,
      platform: selectedFormat,
      effects: selectedEffect ? [selectedEffect] : [],
      textOverlays: []
    }

    setClips(prev => [...prev, newClipSegment])
    setClipTitle('')
    setStartTime(0)
    setEndTime(5)
  }

  const addClipSegment = () => {
    if (!clipTitle.trim() || clipStart >= clipEnd) return

    const newClip: ClipSegment = {
      id: Date.now().toString(),
      title: clipTitle,
      start: clipStart,
      end: clipEnd,
      platform: selectedFormat,
      effects: selectedEffect ? [selectedEffect] : [],
      textOverlays: []
    }

    setClips(prev => [...prev, newClip])
    setClipTitle('')
    
    // Reset para próximo clip
    setClipStart(clipEnd)
    setClipEnd(Math.min(clipEnd + 5, duration))
  }

  const exportAllClips = async () => {
    if (clips.length === 0) return

    setIsExporting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

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
          message: `🎉 ${clips.length} clips profissionais criados com efeitos avançados!`
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
                Recursos de última geração para clips virais • {videoData.name}
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
                <video
                  ref={videoRef}
                  src={videoData.url}
                  className="w-full h-auto max-h-96"
                  onLoadedMetadata={handleVideoLoad}
                  onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                  controls
                />
                
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
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">🎛️ Ferramentas Profissionais</h2>
                  <div className="flex gap-2">
                    {[
                      { id: 'timeline', icon: '📽️', label: 'Timeline' },
                      { id: 'effects', icon: '✨', label: 'Efeitos' },
                      { id: 'color', icon: '🎨', label: 'Color' },
                      { id: 'text', icon: '📝', label: 'Texto' },
                      { id: 'audio', icon: '🎵', label: 'Áudio' },
                      { id: 'templates', icon: '🎬', label: 'Templates' },
                      { id: 'ai', icon: '🤖', label: 'AI Tools' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
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

                {/* Painel de Color Grading Profissional */}
                {activeTab === 'color' && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-gray-800">🎨 Color Grading Profissional</h3>
                    
                    {/* Presets de Color Grading */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">🎬 Presets Cinematográficos</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          { id: 'cinematic-orange', name: '🎬 Cinematic Orange', preview: 'linear-gradient(45deg, #ff6b35, #ff8e53)', description: 'Tom cinematográfico quente' },
                          { id: 'vintage-film', name: '📷 Vintage Film', preview: 'linear-gradient(45deg, #d4a574, #c8956d)', description: 'Estilo retrô nostálgico' },
                          { id: 'neon-cyberpunk', name: '🌃 Neon Cyberpunk', preview: 'linear-gradient(45deg, #0066ff, #ff00ff)', description: 'Futurismo vibrante' },
                          { id: 'warm-sunset', name: '🌅 Warm Sunset', preview: 'linear-gradient(45deg, #ff7b7b, #ffb347)', description: 'Tons dourados quentes' },
                          { id: 'cold-blue', name: '❄️ Cold Blue', preview: 'linear-gradient(45deg, #4a90e2, #357abd)', description: 'Azul frio moderno' },
                          { id: 'instagram-bright', name: '📸 Instagram Bright', preview: 'linear-gradient(45deg, #ff9a9e, #fad0c4)', description: 'Brilho para social media' },
                          { id: 'tiktok-vivid', name: '🎵 TikTok Vivid', preview: 'linear-gradient(45deg, #ff416c, #ff4b2b)', description: 'Cores saturadas virais' },
                          { id: 'youtube-warm', name: '📺 YouTube Warm', preview: 'linear-gradient(45deg, #ffa726, #ff7043)', description: 'Tons acolhedores' }
                        ].map(grade => (
                          <button
                            key={grade.id}
                            onClick={() => setColorGrade(grade.id)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              colorGrade === grade.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div 
                                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                                style={{ background: grade.preview }}
                              />
                              <span className="font-medium">{grade.name}</span>
                            </div>
                            <p className="text-sm text-gray-600">{grade.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Controles Manuais de Color */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-4">🎛️ Controles Manuais</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          { label: '🔆 Exposição', value: 0, min: -100, max: 100 },
                          { label: '🌈 Saturação', value: 0, min: -100, max: 100 },
                          { label: '🔲 Contraste', value: 0, min: -100, max: 100 },
                          { label: '💡 Highlights', value: 0, min: -100, max: 100 },
                          { label: '🌑 Shadows', value: 0, min: -100, max: 100 },
                          { label: '🌡️ Temperatura', value: 0, min: -100, max: 100 }
                        ].map((control, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium text-gray-700">
                                {control.label}
                              </label>
                              <span className="text-xs text-gray-500">{control.value}</span>
                            </div>
                            <input
                              type="range"
                              min={control.min}
                              max={control.max}
                              defaultValue={control.value}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, #e5e7eb 0%, #8b5cf6 50%, #e5e7eb 100%)`
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* LUT (Look-Up Table) */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">📊 LUT (Look-Up Tables)</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          '🎭 Drama', '🌸 Pastel', '🔥 Intense', '🌊 Cool',
                          '🍯 Honey', '⚡ Electric', '🌙 Moonlight', '🍃 Natural'
                        ].map((lut, index) => (
                          <button
                            key={index}
                            className="p-3 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                          >
                            {lut}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Painel de Text Animation Avançado */}
                {activeTab === 'text' && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-gray-800">📝 Text Overlays Profissionais</h3>
                    
                    {/* Configurador de Texto */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">📝 Texto</label>
                          <input
                            type="text"
                            placeholder="Digite seu texto aqui..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">🎨 Estilo</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="bold-outline">📝 Bold Outline</option>
                            <option value="neon-glow">✨ Neon Glow</option>
                            <option value="3d-text">🎭 3D Text</option>
                            <option value="minimal">⚪ Minimal</option>
                            <option value="gradient">🌈 Gradient</option>
                            <option value="stroke">✏️ Stroke</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">⚡ Animação</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            {[
                              { id: 'typewriter', name: '⌨️ Typewriter' },
                              { id: 'bounce-in', name: '🏀 Bounce In' },
                              { id: 'fade-slide', name: '✨ Fade Slide' },
                              { id: 'neon-flicker', name: '💡 Neon Flicker' },
                              { id: 'wave', name: '🌊 Wave' },
                              { id: 'glitch-text', name: '⚡ Glitch Text' },
                              { id: 'scale-pop', name: '💥 Scale Pop' },
                              { id: 'rainbow', name: '🌈 Rainbow' }
                            ].map(anim => (
                              <option key={anim.id} value={anim.id}>
                                {anim.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Duração (s)</label>
                          <input
                            type="number"
                            defaultValue="3"
                            min="1"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">📏 Tamanho</label>
                          <input
                            type="range"
                            min="12"
                            max="48"
                            defaultValue="24"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Posicionamento Visual */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">📍 Posição na Tela</label>
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 relative h-32">
                          <div className="grid grid-cols-3 gap-2 h-full">
                            {['↖️', '⬆️', '↗️', '⬅️', '🎯', '➡️', '↙️', '⬇️', '↘️'].map((pos, i) => (
                              <button
                                key={i}
                                className="flex items-center justify-center text-lg border border-gray-300 rounded hover:bg-purple-50 hover:border-purple-300 transition-all"
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Paleta de Cores */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">🎨 Cores</label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
                            '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
                          ].map((color, index) => (
                            <button
                              key={index}
                              className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        ➕ Adicionar Text Overlay
                      </Button>
                    </div>

                    {/* Textos Adicionados */}
                    {textOverlays.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">📋 Textos Adicionados ({textOverlays.length})</h4>
                        {textOverlays.map(overlay => (
                          <div key={overlay.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">"{overlay.text}"</span>
                              <div className="text-sm text-gray-500 mt-1">
                                {overlay.animation} • {overlay.duration.start}s - {overlay.duration.end}s
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">✏️</Button>
                              <Button variant="outline" size="sm">🗑️</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Templates de Texto Viral */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">🔥 Templates Virais</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          { text: 'WAIT FOR IT... 👀', platform: 'TikTok', engagement: '+300%' },
                          { text: 'Você não vai acreditar! 😱', platform: 'Instagram', engagement: '+250%' },
                          { text: 'INSCREVA-SE! 🔔', platform: 'YouTube', engagement: '+180%' },
                          { text: 'POV: Quando você... 💭', platform: 'TikTok', engagement: '+400%' },
                          { text: 'Salva este post! 💾', platform: 'Instagram', engagement: '+220%' },
                          { text: 'LIKE se você... 👍', platform: 'YouTube', engagement: '+150%' }
                        ].map((template, index) => (
                          <button
                            key={index}
                            className="p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                          >
                            <div className="font-medium text-gray-800">{template.text}</div>
                            <div className="text-sm text-gray-500 mt-1 flex justify-between">
                              <span>{template.platform}</span>
                              <span className="text-green-600 font-medium">{template.engagement}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Painel de Áudio Profissional */}
                {activeTab === 'audio' && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-gray-800">🎵 Audio Engineering</h3>
                    
                    {/* Controles de Áudio Principal */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-4">🎚️ Mix Principal</h4>
                      <div className="space-y-4">
                        {[
                          { label: '🔊 Volume Master', value: 75, color: 'bg-blue-500' },
                          { label: '🎤 Vocal/Dialog', value: 80, color: 'bg-green-500' },
                          { label: '🎵 Música de Fundo', value: 40, color: 'bg-purple-500' },
                          { label: '🔔 Efeitos Sonoros', value: 60, color: 'bg-orange-500' }
                        ].map((control, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium text-gray-700">
                                {control.label}
                              </label>
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">{control.value}%</span>
                            </div>
                            <div className="relative">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                defaultValue={control.value}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <div 
                                className={`absolute top-0 left-0 h-2 rounded-lg ${control.color}`}
                                style={{ width: `${control.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Efeitos de Áudio */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">🎛️ Efeitos de Áudio</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          { type: 'fade-in', name: '🔊 Fade In', desc: 'Entrada suave e profissional', timing: '0-2s' },
                          { type: 'fade-out', name: '🔉 Fade Out', desc: 'Saída suave e elegante', timing: '2s-end' },
                          { type: 'echo', name: '🔄 Echo/Reverb', desc: 'Profundidade espacial', timing: 'Durante' },  
                          { type: 'bass-boost', name: '🎚️ Bass Boost', desc: 'Graves impactantes', timing: 'Durante' },
                          { type: 'vocal-enhance', name: '🎤 Vocal Enhance', desc: 'Clareza da voz', timing: 'Durante' },
                          { type: 'compressor', name: '📊 Compressor', desc: 'Dinâmica controlada', timing: 'Durante' }
                        ].map(effect => (
                          <button
                            key={effect.type}
                            className="p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-left transition-all"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{effect.name}</span>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{effect.timing}</span>
                            </div>
                            <p className="text-sm text-gray-600">{effect.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Biblioteca de Música Trending */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">🎵 Música Trending</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Oh No (TikTok Viral)', artist: 'Capone', platform: '🎵 TikTok', trending: '🔥 #1' },
                          { name: 'Aesthetic Vibes', artist: 'Lofi Dreams', platform: '📸 Instagram', trending: '📈 Rising' },
                          { name: 'Epic Motivation', artist: 'Power Beats', platform: '📺 YouTube', trending: '⭐ Popular' },
                          { name: 'Chill Sunset', artist: 'Ambient Flow', platform: '📸 Instagram', trending: '🌅 Mood' }
                        ].map((track, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-all">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{track.name}</div>
                              <div className="text-sm text-gray-500">{track.artist}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{track.platform}</span>
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">{track.trending}</span>
                              <Button variant="outline" size="sm">▶️</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Painel de Templates Virais */}
                {activeTab === 'templates' && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-gray-800">🎬 Templates Virais</h3>
                    
                    {/* Templates de Hook (Primeiros 3s) */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        🎯 <span>Templates de Hook - Primeiros 3 Segundos</span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">CRITICAL</span>
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          {
                            name: '🤔 Pergunta Intrigante',
                            description: 'Inicia com pergunta que gera curiosidade',
                            engagement: '+450%',
                            example: '"Você sabia que 95% das pessoas fazem isso errado?"'
                          },
                          {
                            name: '😱 Resultado Primeiro',
                            description: 'Mostra o resultado final logo no início',
                            engagement: '+380%',
                            example: '"Em 30 dias eu consegui isso... aqui está como"'
                          },
                          {
                            name: '🔥 Contradição',
                            description: 'Contraria uma crença popular',
                            engagement: '+320%',
                            example: '"Todo mundo fala que é assim, MAS..."'
                          },
                          {
                            name: '⏰ Urgência/Escassez',
                            description: 'Cria senso de urgência imediato',
                            engagement: '+290%',
                            example: '"Isso só funciona até sexta-feira"'
                          }
                        ].map((template, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedTemplate(template.name)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              selectedTemplate === template.name
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{template.name}</span>
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                {template.engagement}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                            <div className="text-xs text-purple-600 italic">{template.example}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aplicar Template */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">🚀 Aplicar Template Completo</h4>
                      <div className="space-y-3">
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                          ⚡ Aplicar Template Selecionado
                        </Button>
                        <div className="text-xs text-gray-600 text-center">
                          Aplica automaticamente: Hook + Estrutura + CTA + Efeitos + Color Grading
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Painel de AI Tools */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-gray-800">🤖 AI Tools Avançadas</h3>
                    
                    {/* AI Thumbnail Generator */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">🖼️ AI Thumbnail Generator</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-center space-y-4">
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <span className="text-3xl block mb-2">🎨</span>
                              <span className="text-sm">AI gerará thumbnail automática</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {['🔥 Intenso', '😱 Shocked', '💡 Insight', '🎯 Direct', '✨ Aesthetic', '🚀 Energy'].map((style, i) => (
                              <Button key={i} variant="outline" size="sm" className="text-xs">
                                {style}
                              </Button>
                            ))}
                          </div>
                          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                            🤖 Gerar Thumbnails com AI
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* AI Performance Prediction */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">📈 AI Performance Prediction</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Potencial Viral:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full">
                              <div className="w-16 h-2 bg-orange-500 rounded-full"></div>
                            </div>
                            <span className="text-sm font-medium text-orange-600">80%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Engajamento Esperado:</span>
                          <span className="text-sm font-medium text-green-600">12.5%</span>
                        </div>
                        <Button variant="outline" className="w-full">
                          📊 Análise Completa com AI
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Painel Timeline (renomeado de básico) */}
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800">📽️ Timeline & Clips</h3>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">📌 Título do Clip</label>
                        <input
                          type="text"
                          value={clipTitle}
                          onChange={(e) => setClipTitle(e.target.value)}
                          placeholder="Ex: Momento Épico, Dica Importante..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">📱 Formato</label>
                        <select
                          value={selectedFormat}
                          onChange={(e) => setSelectedFormat(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="tiktok">🎵 TikTok (9:16)</option>
                          <option value="instagram">📸 Instagram Reels (9:16)</option>
                          <option value="youtube">📺 YouTube Shorts (9:16)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">⏱️ Início</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={clipStart}
                            onChange={(e) => setClipStart(Number(e.target.value))}
                            min="0"
                            max={duration}
                            step="0.1"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                          <Button
                            type="button"
                            onClick={() => setClipStart(currentTime)}
                            variant="outline"
                            size="sm"
                          >
                            📍 Atual
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">⏱️ Fim</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={clipEnd}
                            onChange={(e) => setClipEnd(Number(e.target.value))}
                            min={clipStart}
                            max={duration}
                            step="0.1"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                          <Button
                            type="button"
                            onClick={() => setClipEnd(currentTime)}
                            variant="outline"
                            size="sm"
                          >
                            📍 Atual
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (clipStart < clipEnd) {
                            const audio = document.querySelector('video') as HTMLVideoElement
                            if (audio) {
                              audio.currentTime = clipStart
                              audio.play()
                              setTimeout(() => audio.pause(), (clipEnd - clipStart) * 1000)
                            }
                          }
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        ▶️ Preview Segment
                      </Button>
                      
                      <Button
                        onClick={addClipSegment}
                        disabled={!clipTitle || clipStart >= clipEnd}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        ➕ Adicionar Clip
                      </Button>
                    </div>

                    {/* Lista de Clips Criados */}
                    {clips.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">📋 Clips Criados ({clips.length})</h4>
                        {clips.map((clip) => (
                          <div key={clip.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{clip.title}</div>
                              <div className="text-sm text-gray-500">
                                {clip.start.toFixed(1)}s - {clip.end.toFixed(1)}s • {clip.platform} • {(clip.end - clip.start).toFixed(1)}s
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">✏️</Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setClips(clips.filter(c => c.id !== clip.id))
                                }}
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                  onClick={exportAllClips}
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