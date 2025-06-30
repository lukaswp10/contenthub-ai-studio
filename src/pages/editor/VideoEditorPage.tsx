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

interface TimelineSegment {
  id: string
  start: number
  end: number
  type: 'video' | 'text' | 'effect' | 'music'
  content?: any
  color: string
}

interface Caption {
  id: string
  text: string
  start: number
  end: number
  style: {
    fontSize: number
    color: string
    backgroundColor: string
    position: { x: number, y: number }
    fontFamily: string
  }
}

interface EffectLayer {
  id: string
  type: string
  start: number
  end: number
  intensity: number
  config: any
}

interface AudioTrack {
  id: string
  name: string
  url: string
  start: number
  volume: number
  loop: boolean
}

export function VideoEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { addClips } = useClips()
  
  const videoData = location.state as VideoData
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Estados principais
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  
  // Timeline e cortes
  const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [cutPoints, setCutPoints] = useState<number[]>([])
  
  // Legendas
  const [captions, setCaptions] = useState<Caption[]>([])
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null)
  const [captionText, setCaptionText] = useState('')
  
  // Efeitos
  const [effectLayers, setEffectLayers] = useState<EffectLayer[]>([])
  const [selectedEffect, setSelectedEffect] = useState('')
  const [previewMode, setPreviewMode] = useState(true)
  
  // Áudio
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [masterVolume, setMasterVolume] = useState(100)
  
  // UI
  const [activePanel, setActivePanel] = useState<'timeline' | 'effects' | 'audio' | 'captions'>('timeline')

  // Biblioteca de efeitos
  const effects = [
    { id: 'zoom-in', name: '🔍 Zoom In', preview: 'scale(1.2)' },
    { id: 'zoom-out', name: '🔍 Zoom Out', preview: 'scale(0.8)' },
    { id: 'blur', name: '💫 Blur', preview: 'blur(3px)' },
    { id: 'brightness', name: '☀️ Brightness', preview: 'brightness(1.3)' },
    { id: 'contrast', name: '🌓 Contrast', preview: 'contrast(1.3)' },
    { id: 'sepia', name: '🟤 Sepia', preview: 'sepia(0.8)' },
    { id: 'grayscale', name: '⚫ Grayscale', preview: 'grayscale(0.8)' },
    { id: 'hue-rotate', name: '🌈 Hue Rotate', preview: 'hue-rotate(90deg)' }
  ]

  // Biblioteca de música
  const musicLibrary = [
    { id: 'epic', name: '🎬 Epic Cinematic', url: '/audio/epic.mp3', duration: 180 },
    { id: 'upbeat', name: '🎵 Upbeat Pop', url: '/audio/upbeat.mp3', duration: 210 },
    { id: 'chill', name: '😌 Chill Vibes', url: '/audio/chill.mp3', duration: 195 },
    { id: 'dramatic', name: '🎭 Dramatic', url: '/audio/dramatic.mp3', duration: 160 }
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
      console.log('Vídeo carregado - Duração:', videoDuration)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      
      // Aplicar efeitos em tempo real se preview estiver ativo
      if (previewMode && canvasRef.current) {
        applyRealTimeEffects()
      }
    }
  }

  const applyRealTimeEffects = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    
    // Desenhar frame atual no canvas
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
    
    // Aplicar efeitos ativos
    const activeEffects = effectLayers.filter(effect => 
      currentTime >= effect.start && currentTime <= effect.end
    )
    
    activeEffects.forEach(effect => {
      applyCanvasEffect(ctx, effect)
    })
  }

  const applyCanvasEffect = (ctx: CanvasRenderingContext2D, effect: EffectLayer) => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    const data = imageData.data
    
    // Aplicar diferentes efeitos baseado no tipo
    switch (effect.type) {
      case 'brightness':
        for (let i = 0; i < data.length; i += 4) {
          data[i] *= effect.intensity     // R
          data[i + 1] *= effect.intensity // G
          data[i + 2] *= effect.intensity // B
        }
        break
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11
          data[i] = gray
          data[i + 1] = gray
          data[i + 2] = gray
        }
        break
      // Mais efeitos podem ser adicionados aqui
    }
    
    ctx.putImageData(imageData, 0, 0)
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

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const addCutPoint = () => {
    if (!cutPoints.includes(currentTime)) {
      setCutPoints([...cutPoints, currentTime].sort((a, b) => a - b))
      console.log('Ponto de corte adicionado:', currentTime)
    }
  }

  const addCaption = () => {
    if (!captionText.trim()) return
    
    const newCaption: Caption = {
      id: Date.now().toString(),
      text: captionText,
      start: currentTime,
      end: currentTime + 3, // 3 segundos por padrão
      style: {
        fontSize: 24,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.7)',
        position: { x: 50, y: 80 }, // Centro inferior
        fontFamily: 'Arial, sans-serif'
      }
    }
    
    setCaptions([...captions, newCaption])
    setCaptionText('')
    console.log('Legenda adicionada:', newCaption)
  }

  const addEffect = (effectType: string) => {
    const newEffect: EffectLayer = {
      id: Date.now().toString(),
      type: effectType,
      start: currentTime,
      end: currentTime + 2, // 2 segundos por padrão
      intensity: 1.2,
      config: {}
    }
    
    setEffectLayers([...effectLayers, newEffect])
    console.log('Efeito adicionado:', newEffect)
  }

  const addAudioTrack = (musicId: string) => {
    const music = musicLibrary.find(m => m.id === musicId)
    if (!music) return
    
    const newTrack: AudioTrack = {
      id: Date.now().toString(),
      name: music.name,
      url: music.url,
      start: currentTime,
      volume: 70,
      loop: false
    }
    
    setAudioTracks([...audioTracks, newTrack])
    console.log('Trilha adicionada:', newTrack)
  }

  const generateFinalClips = async () => {
    console.log('Gerando clips finais...')
    
    // Dividir vídeo baseado nos pontos de corte
    const segments = []
    const sortedCuts = [0, ...cutPoints, duration].sort((a, b) => a - b)
    
    for (let i = 0; i < sortedCuts.length - 1; i++) {
      segments.push({
        start: sortedCuts[i],
        end: sortedCuts[i + 1],
        captions: captions.filter(c => c.start >= sortedCuts[i] && c.end <= sortedCuts[i + 1]),
        effects: effectLayers.filter(e => e.start >= sortedCuts[i] && e.end <= sortedCuts[i + 1]),
        audio: audioTracks.filter(a => a.start >= sortedCuts[i])
      })
    }
    
    // Simular processamento
    const processedClips = segments.map((segment, index) => ({
      id: `clip_${Date.now()}_${index}`,
      title: `Clip ${index + 1} - ${videoData?.name}`,
      duration: segment.end - segment.start,
      format: 'TikTok' as const,
      createdAt: new Date().toISOString(),
      thumbnail: videoData?.url,
      videoUrl: videoData?.url,
      sourceVideoId: videoData?.id,
      views: Math.floor(Math.random() * 5000),
      likes: Math.floor(Math.random() * 500),
      shares: Math.floor(Math.random() * 100),
      engagement: Number((Math.random() * 10 + 5).toFixed(1)),
      status: 'ready' as const,
      metadata: {
        cutPoints: [segment.start, segment.end],
        captions: segment.captions,
        effects: segment.effects,
        audio: segment.audio
      }
    }))
    
    addClips(processedClips)
    
    navigate('/clips', { 
      state: { 
        message: `🎉 ${processedClips.length} clips profissionais criados com timeline interativa!`
      } 
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!videoData?.url) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Nenhum vídeo carregado</h2>
          <Button onClick={() => navigate('/upload')}>
            📤 Fazer Upload
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎬 Editor Profissional</h1>
            <p className="text-gray-400">{videoData.name}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant={previewMode ? 'default' : 'outline'}
              size="sm"
            >
              {previewMode ? '👁️ Preview ON' : '👁️ Preview OFF'}
            </Button>
            <Button onClick={generateFinalClips} className="bg-green-600 hover:bg-green-700">
              🚀 Gerar Clips
            </Button>
            <Button variant="outline" onClick={() => navigate('/upload')}>
              ← Voltar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Painel Principal - Video e Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="bg-black p-4 flex-1 flex items-center justify-center relative">
            <div className="relative max-w-4xl w-full">
              {/* Video Element (hidden when preview mode is on) */}
              <video
                ref={videoRef}
                src={videoData.url}
                className={`w-full h-auto ${previewMode ? 'opacity-0 absolute' : ''}`}
                onLoadedMetadata={handleVideoLoad}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls={!previewMode}
              />
              
              {/* Canvas para preview com efeitos */}
              {previewMode && (
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto"
                  width={1920}
                  height={1080}
                />
              )}
              
              {/* Legendas Overlay */}
              {captions.map(caption => (
                currentTime >= caption.start && currentTime <= caption.end && (
                  <div
                    key={caption.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${caption.style.position.x}%`,
                      top: `${caption.style.position.y}%`,
                      fontSize: `${caption.style.fontSize}px`,
                      color: caption.style.color,
                      backgroundColor: caption.style.backgroundColor,
                      fontFamily: caption.style.fontFamily,
                      transform: 'translate(-50%, -50%)',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {caption.text}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Controles de Reprodução */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <Button onClick={togglePlayPause} size="sm">
                {isPlaying ? '⏸️' : '▶️'}
              </Button>
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <Button onClick={addCutPoint} size="sm" variant="outline">
                ✂️ Cortar Aqui
              </Button>
              <div className="text-sm text-gray-400">
                {cutPoints.length} cortes • {cutPoints.length + 1} segmentos
              </div>
            </div>

            {/* Timeline Interativa */}
            <div 
              ref={timelineRef}
              className="relative bg-gray-700 h-24 rounded cursor-pointer overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const newTime = (x / rect.width) * duration
                seekTo(newTime)
              }}
            >
              {/* Background da timeline */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
              
              {/* Pontos de corte */}
              {cutPoints.map((cutTime, index) => (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-1 bg-red-500 z-20"
                  style={{ left: `${(cutTime / duration) * 100}%` }}
                  title={`Corte em ${formatTime(cutTime)}`}
                />
              ))}
              
              {/* Legendas na timeline */}
              {captions.map(caption => (
                <div
                  key={caption.id}
                  className="absolute top-0 h-4 bg-yellow-500/70 rounded"
                  style={{
                    left: `${(caption.start / duration) * 100}%`,
                    width: `${((caption.end - caption.start) / duration) * 100}%`
                  }}
                  title={caption.text}
                />
              ))}
              
              {/* Efeitos na timeline */}
              {effectLayers.map(effect => (
                <div
                  key={effect.id}
                  className="absolute top-4 h-4 bg-green-500/70 rounded"
                  style={{
                    left: `${(effect.start / duration) * 100}%`,
                    width: `${((effect.end - effect.start) / duration) * 100}%`
                  }}
                  title={`Efeito: ${effect.type}`}
                />
              ))}
              
              {/* Áudio na timeline */}
              {audioTracks.map(audio => (
                <div
                  key={audio.id}
                  className="absolute bottom-0 h-4 bg-purple-500/70 rounded"
                  style={{
                    left: `${(audio.start / duration) * 100}%`,
                    width: `30%` // Placeholder width
                  }}
                  title={audio.name}
                />
              ))}
              
              {/* Cursor de tempo atual */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white z-30 shadow-lg"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Painel Lateral - Ferramentas */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {[
              { id: 'timeline', label: '📽️ Timeline', icon: '📽️' },
              { id: 'effects', label: '✨ Efeitos', icon: '✨' },
              { id: 'audio', label: '🎵 Áudio', icon: '🎵' },
              { id: 'captions', label: '📝 Legendas', icon: '📝' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id as any)}
                className={`flex-1 p-3 text-sm font-medium transition-colors ${
                  activePanel === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          {/* Conteúdo dos Painéis */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'timeline' && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">📽️ Timeline</h3>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Segmentos ({cutPoints.length + 1})</h4>
                  {[0, ...cutPoints, duration].slice(0, -1).map((start, index) => {
                    const end = [0, ...cutPoints, duration][index + 1] || duration
                    return (
                      <div key={index} className="bg-gray-700 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Segmento {index + 1}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => seekTo(start)}
                          >
                            ▶️
                          </Button>
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatTime(start)} - {formatTime(end)} ({formatTime(end - start)})
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Pontos de Corte</h4>
                  {cutPoints.map((cutTime, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                      <span className="text-sm">{formatTime(cutTime)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCutPoints(cutPoints.filter((_, i) => i !== index))}
                      >
                        🗑️
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'effects' && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">✨ Efeitos</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {effects.map(effect => (
                    <Button
                      key={effect.id}
                      onClick={() => addEffect(effect.id)}
                      variant="outline"
                      size="sm"
                      className="h-auto p-3 flex flex-col"
                    >
                      <span className="text-lg mb-1">{effect.name.split(' ')[0]}</span>
                      <span className="text-xs">{effect.name.split(' ').slice(1).join(' ')}</span>
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Efeitos Aplicados ({effectLayers.length})</h4>
                  {effectLayers.map(effect => (
                    <div key={effect.id} className="bg-gray-700 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{effect.type}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEffectLayers(effectLayers.filter(e => e.id !== effect.id))}
                        >
                          🗑️
                        </Button>
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatTime(effect.start)} - {formatTime(effect.end)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'audio' && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">🎵 Biblioteca de Música</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Volume Master:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={masterVolume}
                      onChange={(e) => setMasterVolume(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{masterVolume}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {musicLibrary.map(music => (
                    <div key={music.id} className="bg-gray-700 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{music.name}</div>
                          <div className="text-sm text-gray-400">{formatTime(music.duration)}</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addAudioTrack(music.id)}
                        >
                          ➕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Trilhas Adicionadas ({audioTracks.length})</h4>
                  {audioTracks.map(track => (
                    <div key={track.id} className="bg-gray-700 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{track.name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAudioTracks(audioTracks.filter(t => t.id !== track.id))}
                        >
                          🗑️
                        </Button>
                      </div>
                      <div className="text-sm text-gray-400">
                        Início: {formatTime(track.start)} • Volume: {track.volume}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'captions' && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">📝 Legendas</h3>
                
                <div className="space-y-2">
                  <textarea
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="Digite a legenda..."
                    className="w-full p-2 bg-gray-700 rounded text-white resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={addCaption}
                    disabled={!captionText.trim()}
                    className="w-full"
                  >
                    ➕ Adicionar no Tempo Atual ({formatTime(currentTime)})
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Legendas Criadas ({captions.length})</h4>
                  {captions.map(caption => (
                    <div key={caption.id} className="bg-gray-700 p-3 rounded">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <div className="font-medium text-sm">{caption.text}</div>
                          <div className="text-xs text-gray-400">
                            {formatTime(caption.start)} - {formatTime(caption.end)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCaptions(captions.filter(c => c.id !== caption.id))}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 