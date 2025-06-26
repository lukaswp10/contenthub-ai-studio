import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Scissors, 
  Wand2, 
  Video, 
  FileText, 
  Play,
  Palette,
  Layers,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ClipEditor from '@/components/editor/ClipEditor'
import VideoEditor from '@/components/editor/VideoEditor'

interface Video {
  id: string
  title: string
  file_url: string
  created_at: string
  status: string
}

interface Clip {
  id: string
  title: string
  start_time: number
  end_time: number
  platform: string
  status: string
  created_at: string
}

export default function Editor() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [editorMode, setEditorMode] = useState<'list' | 'visual' | 'manual'>('list')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>('')

  // Load user videos
  useEffect(() => {
    if (user) {
      loadVideos()
    }
  }, [user])

  // Load clips when video is selected
  useEffect(() => {
    if (selectedVideo) {
      loadClips(selectedVideo.id)
    }
  }, [selectedVideo])

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os vídeos.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadClips = async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from('clips')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClips(data || [])
    } catch (error) {
      console.error('Erro ao carregar clips:', error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const url = URL.createObjectURL(file)
      setUploadedVideoUrl(url)
      setEditorMode('visual')
      
      toast({
        title: "Vídeo carregado!",
        description: "Agora você pode editar seu vídeo no editor visual.",
      })
    }
  }

  const handleClipCreated = (clipData: any) => {
    console.log('Novo clip criado:', clipData)
    toast({
      title: "Clip criado com sucesso!",
      description: "Seu clip foi processado e está sendo renderizado.",
    })
    
    // Reload clips if we have a selected video
    if (selectedVideo) {
      loadClips(selectedVideo.id)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando editor...</p>
          </div>
        </div>
      </div>
    )
  }

  // Visual Editor Mode (Canva-style)
  if (editorMode === 'visual') {
    return (
      <div className="h-screen bg-gray-900">
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setEditorMode('list')}
                className="text-white hover:bg-gray-700"
              >
                ← Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-400" />
                <span className="text-white font-semibold">Editor Visual</span>
                <Badge className="bg-purple-600 text-white">Novo!</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-400 border-green-400">
                Modo Pro
              </Badge>
            </div>
          </div>
        </div>
        
        <VideoEditor
          videoUrl={uploadedVideoUrl || selectedVideo?.file_url}
          videoId={selectedVideo?.id}
          uploadedFile={uploadedFile}
          onClipCreated={handleClipCreated}
        />
      </div>
    )
  }

  // Manual Editor Mode (existing)
  if (editorMode === 'manual' && selectedVideo) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setEditorMode('list')}
            className="mb-4"
          >
            ← Voltar para lista
          </Button>
          <h1 className="text-2xl font-bold mb-2">Editor Manual</h1>
          <p className="text-gray-600">Editando: {selectedVideo.title}</p>
        </div>

        <ClipEditor
          video={{
            id: selectedVideo.id,
            cloudinary_secure_url: selectedVideo.file_url,
            duration_seconds: 300, // Placeholder - seria melhor ter isso no banco
            title: selectedVideo.title
          }}
          onClipCreated={handleClipCreated}
        />
      </div>
    )
  }

  // Main Editor Page (List Mode)
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Scissors className="h-8 w-8 text-purple-600" />
          Editor de Clips
        </h1>
        <p className="text-gray-600">
          Crie clips virais dos seus vídeos com IA ou edite manualmente
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload & Editar
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Meus Vídeos
          </TabsTrigger>
          <TabsTrigger value="clips" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Meus Clips
          </TabsTrigger>
        </TabsList>

        {/* Upload & Edit Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Novo Editor Visual
              </CardTitle>
              <p className="text-sm text-gray-600">
                Upload um vídeo e edite diretamente no navegador com nossa interface estilo Canva
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Faça upload do seu vídeo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Arraste e solte ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <Label htmlFor="video-upload">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Vídeo
                    </Button>
                  </Label>
                </div>

                {uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          {uploadedFile.name}
                        </p>
                        <p className="text-sm text-green-600">
                          Pronto para edição visual
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editor Mode Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-purple-200 hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => uploadedVideoUrl && setEditorMode('visual')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-600" />
                  Editor Visual
                  <Badge className="bg-purple-100 text-purple-800">Novo!</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Interface moderna estilo Canva com timeline visual, editor de texto e efeitos em tempo real.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Timeline interativa</li>
                  <li>• Editor de texto visual</li>
                  <li>• Preview em tempo real</li>
                  <li>• Múltiplos formatos (TikTok, Instagram, YouTube)</li>
                </ul>
                <Button 
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                  disabled={!uploadedVideoUrl}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Abrir Editor Visual
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:border-gray-400 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Editor Manual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Controle preciso com configurações manuais para usuários avançados.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Configuração manual de tempos</li>
                  <li>• Controles avançados</li>
                  <li>• Máxima precisão</li>
                  <li>• Ideal para profissionais</li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  disabled
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Em breve
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <div className="grid gap-4">
            {videos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum vídeo encontrado</h3>
                  <p className="text-gray-600">
                    Faça upload de um vídeo na aba "Upload & Editar" para começar
                  </p>
                </CardContent>
              </Card>
            ) : (
              videos.map((video) => (
                <Card key={video.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Video className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{video.title}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                          <Badge variant={video.status === 'processed' ? 'default' : 'secondary'}>
                            {video.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedVideo(video)
                            setUploadedVideoUrl(video.file_url)
                            setEditorMode('visual')
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          Editor Visual
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedVideo(video)
                            setEditorMode('manual')
                          }}
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Editor Manual
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Clips Tab */}
        <TabsContent value="clips" className="space-y-6">
          <div className="grid gap-4">
            {clips.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum clip encontrado</h3>
                  <p className="text-gray-600">
                    Selecione um vídeo e crie clips usando nossos editores
                  </p>
                </CardContent>
              </Card>
            ) : (
              clips.map((clip) => (
                <Card key={clip.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{clip.title}</h3>
                        <p className="text-sm text-gray-600">
                          {clip.start_time}s - {clip.end_time}s • {clip.platform}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(clip.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={clip.status === 'ready' ? 'default' : 'secondary'}>
                          {clip.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 