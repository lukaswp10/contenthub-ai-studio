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

interface ClipSegment {
  id: string
  start: number
  end: number
  title: string
  platform: 'tiktok' | 'instagram' | 'youtube'
  description?: string
}

export function VideoEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { addClips } = useClips()
  
  const videoData = location.state as VideoData
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [clips, setClips] = useState<ClipSegment[]>([])
  const [selectedClip, setSelectedClip] = useState<ClipSegment | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [clipTitle, setClipTitle] = useState('')
  const [clipPlatform, setClipPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok')
  const [isExporting, setIsExporting] = useState(false)

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
      setEndTime(Math.min(30, videoDuration)) // Default 30s clip
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
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

  const setCurrentAsStart = () => {
    setStartTime(currentTime)
    if (endTime <= currentTime) {
      setEndTime(Math.min(currentTime + 30, duration))
    }
  }

  const setCurrentAsEnd = () => {
    setEndTime(currentTime)
    if (startTime >= currentTime) {
      setStartTime(Math.max(currentTime - 30, 0))
    }
  }

  const previewClip = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime
      videoRef.current.play()
      setIsPlaying(true)
      
      const timeout = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause()
          setIsPlaying(false)
        }
      }, (endTime - startTime) * 1000)

      return () => clearTimeout(timeout)
    }
  }

  const addClipSegment = () => {
    if (clipTitle.trim() && endTime > startTime) {
      const newClip: ClipSegment = {
        id: Date.now().toString(),
        start: startTime,
        end: endTime,
        title: clipTitle.trim(),
        platform: clipPlatform,
        description: `Clipe de ${formatTime(startTime)} até ${formatTime(endTime)}`
      }
      
      setClips([...clips, newClip])
      setClipTitle('')
      setStartTime(endTime)
      setEndTime(Math.min(endTime + 30, duration))
    }
  }

  const removeClip = (clipId: string) => {
    setClips(clips.filter(clip => clip.id !== clipId))
    if (selectedClip?.id === clipId) {
      setSelectedClip(null)
    }
  }

  const selectClip = (clip: ClipSegment) => {
    setSelectedClip(clip)
    setStartTime(clip.start)
    setEndTime(clip.end)
    setClipTitle(clip.title)
    setClipPlatform(clip.platform)
    handleSeek(clip.start)
  }

  const exportClips = async () => {
    if (clips.length === 0) return
    
    setIsExporting(true)
    const generatedClips = []
    
    // Simular processamento
    for (const clip of clips) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const generatedClip = {
        id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: clip.title,
        duration: clip.end - clip.start,
        format: (clip.platform === 'tiktok' ? 'TikTok' : 
                clip.platform === 'instagram' ? 'Instagram Reels' : 
                'YouTube Shorts') as 'TikTok' | 'Instagram Reels' | 'YouTube Shorts',
        createdAt: new Date().toISOString(),
        thumbnail: videoData.url,
        videoUrl: videoData.url,
        sourceVideoId: `manual_${Date.now()}`,
        views: Math.floor(Math.random() * 10000) + 1000,
        likes: Math.floor(Math.random() * 1000) + 100,
        shares: Math.floor(Math.random() * 100) + 10,
        engagement: Math.random() * 15 + 5,
        status: 'ready' as const
      }
      
      generatedClips.push(generatedClip)
    }
    
    // Adicionar todos os clips de uma vez
    addClips(generatedClips)
    
    setIsExporting(false)
    navigate('/clips', { 
      state: { 
        message: `🎉 ${clips.length} clips criados com sucesso!` 
      }
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok': return 'bg-black text-white'
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'youtube': return 'bg-red-600 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (!videoData) {
    return <div>Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎬 Editor de Vídeo Profissional
          </h1>
          <p className="text-gray-600">
            Crie clips personalizados do seu vídeo "{videoData.name}"
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player & Timeline */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                <video
                  ref={videoRef}
                  src={videoData.url}
                  className="w-full h-full object-contain"
                  onLoadedMetadata={handleVideoLoad}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  className="w-16 h-16 rounded-full"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </Button>
                <div className="text-center">
                  <div className="text-lg font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  
                  {/* Clip segments overlay */}
                  <div className="absolute top-0 left-0 w-full h-2 pointer-events-none">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        className={`absolute h-2 ${getPlatformColor(clip.platform)} opacity-70 rounded`}
                        style={{
                          left: `${(clip.start / duration) * 100}%`,
                          width: `${((clip.end - clip.start) / duration) * 100}%`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Clip Creation */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-4">✂️ Criar Novo Clip</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Início</label>
                    <div className="flex">
                      <input
                        type="number"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={startTime.toFixed(1)}
                        onChange={(e) => setStartTime(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border rounded-l-md"
                      />
                      <Button
                        onClick={setCurrentAsStart}
                        size="sm"
                        className="rounded-l-none"
                      >
                        Atual
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Fim</label>
                    <div className="flex">
                      <input
                        type="number"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={endTime.toFixed(1)}
                        onChange={(e) => setEndTime(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border rounded-l-md"
                      />
                      <Button
                        onClick={setCurrentAsEnd}
                        size="sm"
                        className="rounded-l-none"
                      >
                        Atual
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Título do Clip</label>
                    <input
                      type="text"
                      value={clipTitle}
                      onChange={(e) => setClipTitle(e.target.value)}
                      placeholder="Ex: Momento épico"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Plataforma</label>
                    <select
                      value={clipPlatform}
                      onChange={(e) => setClipPlatform(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="tiktok">TikTok (9:16)</option>
                      <option value="instagram">Instagram Reels</option>
                      <option value="youtube">YouTube Shorts</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={previewClip} variant="outline">
                    👁️ Preview
                  </Button>
                  <Button 
                    onClick={addClipSegment}
                    disabled={!clipTitle.trim() || endTime <= startTime}
                    className="flex-1"
                  >
                    ➕ Adicionar Clip ({formatTime(Math.max(0, endTime - startTime))})
                  </Button>
                </div>
              </Card>
            </Card>
          </div>

          {/* Clips List */}
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                📋 Clips Criados ({clips.length})
              </h3>

              {clips.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">✂️</div>
                  <p>Nenhum clip criado ainda</p>
                  <p className="text-sm">Use as ferramentas ao lado para criar clips</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {clips.map((clip) => (
                    <div
                      key={clip.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedClip?.id === clip.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => selectClip(clip)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{clip.title}</h4>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeClip(clip.id)
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          🗑️
                        </Button>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>{formatTime(clip.start)} - {formatTime(clip.end)}</span>
                        <span className={`px-2 py-1 rounded text-xs ${getPlatformColor(clip.platform)}`}>
                          {clip.platform.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {clips.length > 0 && (
                <Button
                  onClick={exportClips}
                  disabled={isExporting}
                  className="w-full"
                  size="lg"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Exportando... ({clips.length} clips)
                    </>
                  ) : (
                    <>
                      🚀 Exportar {clips.length} Clips
                    </>
                  )}
                </Button>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">⚡ Ações Rápidas</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/upload', { 
                    state: { 
                      mode: 'ai',
                      videoData: videoData 
                    }
                  })}
                  variant="outline"
                  className="w-full"
                >
                  🤖 Modo IA Automático
                </Button>
                <Button
                  onClick={() => navigate('/clips')}
                  variant="outline"
                  className="w-full"
                >
                  📱 Ver Meus Clips
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 