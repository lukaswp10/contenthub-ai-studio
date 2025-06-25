import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Download,
  Share2,
  Sparkles,
  Type,
  Palette,
  Volume2,
  ArrowLeft,
  Save,
  Wand2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VideoClip {
  id: string
  title: string
  start_time: number
  end_time: number
  viral_score: number
  thumbnail_url: string
}

export default function Editor() {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null)
  const [clipTitle, setClipTitle] = useState('')
  const [clipDescription, setClipDescription] = useState('')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock data - replace with real API calls
  const [video] = useState({
    id: videoId,
    title: 'Meu Vídeo Incrível',
    url: '/placeholder-video.mp4',
    duration: 300,
    thumbnail: '/placeholder-thumbnail.jpg'
  })

  const [clips, setClips] = useState<VideoClip[]>([
    {
      id: '1',
      title: 'Momento Viral #1',
      start_time: 45,
      end_time: 75,
      viral_score: 95,
      thumbnail_url: '/placeholder-thumbnail.jpg'
    },
    {
      id: '2', 
      title: 'Hook Poderoso',
      start_time: 120,
      end_time: 150,
      viral_score: 87,
      thumbnail_url: '/placeholder-thumbnail.jpg'
    },
    {
      id: '3',
      title: 'Conclusão Impactante',
      start_time: 240,
      end_time: 270,
      viral_score: 78,
      thumbnail_url: '/placeholder-thumbnail.jpg'
    }
  ])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleClipSelect = (clip: VideoClip) => {
    setSelectedClip(clip)
    setClipTitle(clip.title)
    setStartTime(clip.start_time)
    setEndTime(clip.end_time)
    handleSeek(clip.start_time)
  }

  const handleGenerateNewClip = async () => {
    setIsGenerating(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newClip: VideoClip = {
        id: Date.now().toString(),
        title: clipTitle || `Novo Clip ${clips.length + 1}`,
        start_time: startTime,
        end_time: endTime,
        viral_score: Math.floor(Math.random() * 30) + 70,
        thumbnail_url: '/placeholder-thumbnail.jpg'
      }
      
      setClips([...clips, newClip])
      toast({
        title: "Clip gerado com sucesso!",
        description: "Seu novo clip está pronto para ser publicado.",
      })
    } catch (error) {
      toast({
        title: "Erro ao gerar clip",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getViralScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-yellow-500'
    if (score >= 70) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>
              <p className="text-sm text-gray-500">Editor de Vídeo</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Share2 className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-6 h-full flex flex-col">
              {/* Video Player */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4 flex-1">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  poster={video.thumbnail}
                >
                  <source src={video.url} type="video/mp4" />
                </video>
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center space-x-4 text-white">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    
                    <div className="flex-1">
                      <Slider
                        value={[currentTime]}
                        max={duration}
                        step={0.1}
                        onValueChange={([value]) => handleSeek(value)}
                        className="w-full"
                      />
                    </div>
                    
                    <span className="text-sm font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <Volume2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Timeline with Clips */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="relative h-16 bg-white rounded border">
                  {/* Timeline */}
                  <div className="absolute inset-0 flex items-center">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        className={`absolute h-12 rounded cursor-pointer border-2 transition-all ${
                          selectedClip?.id === clip.id 
                            ? 'border-purple-500 bg-purple-100' 
                            : 'border-gray-300 bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{
                          left: `${(clip.start_time / duration) * 100}%`,
                          width: `${((clip.end_time - clip.start_time) / duration) * 100}%`,
                        }}
                        onClick={() => handleClipSelect(clip)}
                      >
                        <div className="p-1 text-xs font-medium truncate">
                          {clip.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-6">
            {/* Clips Generated */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Clips Gerados ({clips.length})
              </h3>
              
              <div className="space-y-3">
                {clips.map((clip) => (
                  <Card 
                    key={clip.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedClip?.id === clip.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => handleClipSelect(clip)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                          <img 
                            src={clip.thumbnail_url} 
                            alt={clip.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {clip.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
                          </p>
                          <div className="flex items-center mt-2">
                            <Badge 
                              className={`${getViralScoreColor(clip.viral_score)} text-white`}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              {clip.viral_score}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Clip Editor */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Editor de Clip
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Título do Clip
                  </label>
                  <Input
                    value={clipTitle}
                    onChange={(e) => setClipTitle(e.target.value)}
                    placeholder="Digite o título do clip..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Descrição
                  </label>
                  <Textarea
                    value={clipDescription}
                    onChange={(e) => setClipDescription(e.target.value)}
                    placeholder="Adicione uma descrição..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Início (s)
                    </label>
                    <Input
                      type="number"
                      value={startTime}
                      onChange={(e) => setStartTime(Number(e.target.value))}
                      min={0}
                      max={duration}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Fim (s)
                    </label>
                    <Input
                      type="number"
                      value={endTime}
                      onChange={(e) => setEndTime(Number(e.target.value))}
                      min={startTime}
                      max={duration}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSeek(startTime)}
                  >
                    <SkipBack className="h-4 w-4 mr-1" />
                    Ir para início
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSeek(endTime)}
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Ir para fim
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button
                    onClick={handleGenerateNewClip}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Gerar Novo Clip
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Type className="h-4 w-4 mr-1" />
                      Legendas
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Palette className="h-4 w-4 mr-1" />
                      Filtros
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Clip
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 