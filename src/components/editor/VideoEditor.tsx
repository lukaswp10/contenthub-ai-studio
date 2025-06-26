import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  Scissors,
  Type,
  Image,
  Download,
  Share2,
  Layers,
  Settings,
  Zap,
  Palette,
  Clock,
  Target,
  Video
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VideoEditorProps {
  videoUrl?: string
  videoId?: string
  onClipCreated?: (clip: any) => void
  uploadedFile?: File
}

interface TimelineClip {
  id: string
  type: 'video' | 'text' | 'image'
  startTime: number
  endTime: number
  content: string
  style?: any
  track: number
}

interface EditorState {
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  clips: TimelineClip[]
  selectedClip?: string
  zoom: number
}

export default function VideoEditor({ videoUrl, videoId, onClipCreated, uploadedFile }: VideoEditorProps) {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  const [editorState, setEditorState] = useState<EditorState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    clips: [],
    zoom: 1
  })

  const [newClip, setNewClip] = useState({
    startTime: 0,
    endTime: 30,
    title: '',
    platform: 'tiktok'
  })

  const [textEditor, setTextEditor] = useState({
    text: '',
    fontSize: 32,
    color: '#ffffff',
    position: 'center',
    style: 'bold'
  })

  // Initialize video when URL changes
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl
      videoRef.current.onloadedmetadata = () => {
        setEditorState(prev => ({
          ...prev,
          duration: videoRef.current?.duration || 0
        }))
      }
    }
  }, [videoUrl])

  // Update timeline as video plays
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      setEditorState(prev => ({
        ...prev,
        currentTime: video.currentTime
      }))
    }

    video.addEventListener('timeupdate', updateTime)
    return () => video.removeEventListener('timeupdate', updateTime)
  }, [])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (editorState.isPlaying) {
      video.pause()
    } else {
      video.play()
    }

    setEditorState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }))
  }

  const seekTo = (time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = time
    setEditorState(prev => ({
      ...prev,
      currentTime: time
    }))
  }

  const addTextClip = () => {
    const newTextClip: TimelineClip = {
      id: `text_${Date.now()}`,
      type: 'text',
      startTime: editorState.currentTime,
      endTime: editorState.currentTime + 5,
      content: textEditor.text,
      style: {
        fontSize: textEditor.fontSize,
        color: textEditor.color,
        position: textEditor.position,
        fontWeight: textEditor.style
      },
      track: 1
    }

    setEditorState(prev => ({
      ...prev,
      clips: [...prev.clips, newTextClip]
    }))

    toast({
      title: "Texto adicionado!",
      description: "Texto foi adicionado à timeline.",
    })
  }

  const createClip = async () => {
    if (!uploadedFile && !videoUrl) {
      toast({
        title: "Erro",
        description: "Nenhum vídeo carregado.",
        variant: "destructive"
      })
      return
    }

    if (!newClip.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título para o clip.",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('🎬 Criando clip com editor visual...')
      
      let finalVideoUrl = videoUrl
      let finalVideoId = videoId
      
      // Se temos um arquivo local, fazer upload real para Cloudinary
      if (uploadedFile && !videoId) {
        toast({
          title: "Fazendo upload...",
          description: "Enviando vídeo para o Cloudinary.",
        })
        
        console.log('📤 Upload do arquivo para Cloudinary:', uploadedFile.name)
        
        // Preparar dados para upload
        const uploadData = {
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          contentType: uploadedFile.type,
          title: newClip.title || `Clip ${Date.now()}`
        }
        
        // Chamar função de upload
        const uploadResponse = await fetch('/api/supabase/functions/v1/upload-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`
          },
          body: JSON.stringify(uploadData)
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Erro no upload para Cloudinary')
        }
        
        const uploadResult = await uploadResponse.json()
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Erro no upload')
        }
        
        console.log('✅ Upload realizado:', uploadResult)
        
        // Agora fazer upload real do arquivo usando os parâmetros do Cloudinary
        const formData = new FormData()
        formData.append('file', uploadedFile)
        formData.append('upload_preset', uploadResult.upload_preset || 'ml_default')
        formData.append('public_id', uploadResult.public_id)
        formData.append('folder', uploadResult.folder)
        formData.append('resource_type', 'video')
        formData.append('api_key', uploadResult.api_key)
        formData.append('timestamp', uploadResult.timestamp)
        formData.append('signature', uploadResult.signature)
        
        const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${uploadResult.cloud_name}/video/upload`, {
          method: 'POST',
          body: formData
        })
        
        if (!cloudinaryResponse.ok) {
          throw new Error('Erro no upload para Cloudinary')
        }
        
        const cloudinaryResult = await cloudinaryResponse.json()
        console.log('✅ Arquivo enviado para Cloudinary:', cloudinaryResult.secure_url)
        
        finalVideoUrl = cloudinaryResult.secure_url
        finalVideoId = uploadResult.video_id
        
        toast({
          title: "Upload concluído!",
          description: "Vídeo enviado com sucesso para o Cloudinary.",
        })
      }

      // Preparar dados do clip com informações da timeline
      const clipData = {
        video_id: finalVideoId,
        start_time: newClip.startTime,
        end_time: newClip.endTime,
        title: newClip.title,
        platform: newClip.platform,
        description: `Clip criado no Editor Visual - ${newClip.platform.toUpperCase()}`,
        
        // Dados avançados para Shotstack
        timeline_data: {
          clips: editorState.clips,
          settings: {
            platform: newClip.platform,
            resolution: newClip.platform === 'tiktok' || newClip.platform === 'stories' ? '1080x1920' :
                       newClip.platform === 'instagram' ? '1080x1080' : '1920x1080',
            aspectRatio: newClip.platform === 'tiktok' || newClip.platform === 'stories' ? '9:16' :
                        newClip.platform === 'instagram' ? '1:1' : '16:9',
            fps: 30,
            quality: 'high'
          },
          
          // Configuração Shotstack estruturada
          shotstack_config: {
            timeline: {
              background: '#000000',
              tracks: [
                // Track principal do vídeo
                {
                  clips: [
                    {
                      asset: {
                        type: 'video',
                        src: finalVideoUrl,
                        trim: newClip.startTime,
                        length: newClip.endTime - newClip.startTime
                      },
                      start: 0,
                      length: newClip.endTime - newClip.startTime,
                      effect: 'zoomIn'
                    }
                  ]
                },
                
                // Tracks de texto (se houver)
                ...editorState.clips
                  .filter(clip => clip.type === 'text')
                  .map((textClip, index) => ({
                    clips: [
                      {
                        asset: {
                          type: 'title',
                          text: textClip.content,
                          style: 'minimal',
                          color: textClip.style?.color || '#ffffff',
                          size: 'medium',
                          background: 'transparent',
                          position: textClip.style?.position || 'center'
                        },
                        start: textClip.startTime,
                        length: textClip.endTime - textClip.startTime,
                        transition: {
                          in: 'fade',
                          out: 'fade'
                        }
                      }
                    ]
                  }))
              ]
            },
            
            output: {
              format: 'mp4',
              resolution: newClip.platform === 'tiktok' || newClip.platform === 'stories' ? '1080x1920' :
                         newClip.platform === 'instagram' ? '1080x1080' : '1920x1080',
              aspectRatio: newClip.platform === 'tiktok' || newClip.platform === 'stories' ? '9:16' :
                          newClip.platform === 'instagram' ? '1:1' : '16:9',
              fps: 30,
              quality: 'high'
            }
          }
        }
      }

      console.log('📋 Dados do clip para API:', clipData)

      // Chamar a função de criação de clips manual
      const response = await fetch('/api/supabase/functions/v1/create-manual-clip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`
        },
        body: JSON.stringify(clipData)
      })

      if (!response.ok) {
        throw new Error('Erro na criação do clip')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido')
      }

      console.log('✅ Clip criado com sucesso:', result.clip)
      
      toast({
        title: "🎉 Clip criado com sucesso!",
        description: `"${newClip.title}" está sendo renderizado com Shotstack em alta qualidade.`,
      })

      // Resetar formulário
      setNewClip({
        startTime: 0,
        endTime: 30,
        title: '',
        platform: 'tiktok'
      })
      
      setEditorState(prev => ({
        ...prev,
        clips: []
      }))

      if (onClipCreated) {
        onClipCreated(result.clip)
      }

    } catch (error) {
      console.error('❌ Erro ao criar clip:', error)
      toast({
        title: "Erro ao criar clip",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const timelineWidth = 800
  const pixelsPerSecond = timelineWidth / (editorState.duration || 1)

  return (
    <div className="w-full h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scissors className="h-5 w-5 text-purple-400" />
            Editor Visual de Clips
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              Modo Canva
            </Badge>
            <Button 
              onClick={createClip}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!newClip.title}
            >
              <Download className="h-4 w-4 mr-2" />
              Criar Clip
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Tools */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <Tabs defaultValue="clip" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="clip" className="text-xs">
                <Scissors className="h-4 w-4 mr-1" />
                Clip
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                <Type className="h-4 w-4 mr-1" />
                Texto
              </TabsTrigger>
              <TabsTrigger value="effects" className="text-xs">
                <Zap className="h-4 w-4 mr-1" />
                Efeitos
              </TabsTrigger>
            </TabsList>

            {/* Clip Settings */}
            <TabsContent value="clip" className="p-4 space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Configurações do Clip
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-300">Título do Clip</Label>
                    <Input
                      value={newClip.title}
                      onChange={(e) => setNewClip(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Momento viral incrível"
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-300">Início (s)</Label>
                      <Input
                        type="number"
                        value={newClip.startTime}
                        onChange={(e) => setNewClip(prev => ({ ...prev, startTime: parseFloat(e.target.value) || 0 }))}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-300">Fim (s)</Label>
                      <Input
                        type="number"
                        value={newClip.endTime}
                        onChange={(e) => setNewClip(prev => ({ ...prev, endTime: parseFloat(e.target.value) || 30 }))}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-300">Plataforma</Label>
                    <select
                      value={newClip.platform}
                      onChange={(e) => setNewClip(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    >
                      <option value="tiktok">TikTok (9:16)</option>
                      <option value="instagram">Instagram (1:1)</option>
                      <option value="youtube">YouTube (16:9)</option>
                      <option value="stories">Stories (9:16)</option>
                    </select>
                  </div>

                  <div className="text-xs text-gray-400">
                    Duração: {formatTime(newClip.endTime - newClip.startTime)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Text Editor */}
            <TabsContent value="text" className="p-4 space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Editor de Texto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-300">Texto</Label>
                    <Input
                      value={textEditor.text}
                      onChange={(e) => setTextEditor(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Digite seu texto..."
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-300">Tamanho: {textEditor.fontSize}px</Label>
                    <Slider
                      value={[textEditor.fontSize]}
                      onValueChange={(value) => setTextEditor(prev => ({ ...prev, fontSize: value[0] }))}
                      max={72}
                      min={12}
                      step={2}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-300">Cor</Label>
                    <input
                      type="color"
                      value={textEditor.color}
                      onChange={(e) => setTextEditor(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-8 bg-gray-600 border border-gray-500 rounded"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-300">Posição</Label>
                    <select
                      value={textEditor.position}
                      onChange={(e) => setTextEditor(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    >
                      <option value="top">Topo</option>
                      <option value="center">Centro</option>
                      <option value="bottom">Baixo</option>
                    </select>
                  </div>

                  <Button 
                    onClick={addTextClip}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!textEditor.text}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Adicionar Texto
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Effects */}
            <TabsContent value="effects" className="p-4 space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Efeitos e Transições
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="bg-gray-600 border-gray-500">
                      Fade In
                    </Button>
                    <Button variant="outline" size="sm" className="bg-gray-600 border-gray-500">
                      Fade Out
                    </Button>
                    <Button variant="outline" size="sm" className="bg-gray-600 border-gray-500">
                      Zoom In
                    </Button>
                    <Button variant="outline" size="sm" className="bg-gray-600 border-gray-500">
                      Slide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <div className="relative">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                  onPlay={() => setEditorState(prev => ({ ...prev, isPlaying: true }))}
                  onPause={() => setEditorState(prev => ({ ...prev, isPlaying: false }))}
                />
              ) : (
                <div className="w-96 h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Video className="h-12 w-12 mx-auto mb-2" />
                    <p>Carregue um vídeo para começar</p>
                  </div>
                </div>
              )}

              {/* Text Overlays Preview */}
              {editorState.clips
                .filter(clip => clip.type === 'text' && 
                  editorState.currentTime >= clip.startTime && 
                  editorState.currentTime <= clip.endTime)
                .map(clip => (
                  <div
                    key={clip.id}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      fontSize: clip.style?.fontSize || 32,
                      color: clip.style?.color || '#ffffff',
                      fontWeight: clip.style?.fontWeight || 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {clip.content}
                  </div>
                ))
              }
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => seekTo(Math.max(0, editorState.currentTime - 10))}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={togglePlayPause}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {editorState.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => seekTo(Math.min(editorState.duration, editorState.currentTime + 10))}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 ml-4">
                <Volume2 className="h-4 w-4" />
                <Slider
                  value={[editorState.volume * 100]}
                  onValueChange={(value) => {
                    const newVolume = value[0] / 100
                    setEditorState(prev => ({ ...prev, volume: newVolume }))
                    if (videoRef.current) {
                      videoRef.current.volume = newVolume
                    }
                  }}
                  max={100}
                  min={0}
                  className="w-20"
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{formatTime(editorState.currentTime)}</span>
                <span>{formatTime(editorState.duration)}</span>
              </div>
              
              <div 
                ref={timelineRef}
                className="relative bg-gray-700 h-12 rounded cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const percentage = x / rect.width
                  const time = percentage * editorState.duration
                  seekTo(time)
                }}
              >
                {/* Progress bar */}
                <div 
                  className="absolute top-0 left-0 h-full bg-purple-600 rounded"
                  style={{ width: `${(editorState.currentTime / editorState.duration) * 100}%` }}
                />
                
                {/* Clip markers */}
                <div 
                  className="absolute top-0 h-full bg-green-500 bg-opacity-30 border-l-2 border-r-2 border-green-500"
                  style={{
                    left: `${(newClip.startTime / editorState.duration) * 100}%`,
                    width: `${((newClip.endTime - newClip.startTime) / editorState.duration) * 100}%`
                  }}
                />

                {/* Text clips on timeline */}
                {editorState.clips.map(clip => (
                  <div
                    key={clip.id}
                    className="absolute top-0 h-full bg-blue-500 bg-opacity-50 border border-blue-400"
                    style={{
                      left: `${(clip.startTime / editorState.duration) * 100}%`,
                      width: `${((clip.endTime - clip.startTime) / editorState.duration) * 100}%`
                    }}
                  >
                    <div className="text-xs text-white p-1 truncate">
                      {clip.content}
                    </div>
                  </div>
                ))}

                {/* Current time indicator */}
                <div 
                  className="absolute top-0 w-0.5 h-full bg-white"
                  style={{ left: `${(editorState.currentTime / editorState.duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 