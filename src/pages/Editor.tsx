import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Scissors, Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import ClipEditor from '@/components/editor/ClipEditor'

interface VideoData {
  id: string
  title: string
  cloudinary_secure_url: string
  duration_seconds: number
  processing_status: string
}

interface ClipData {
  id: string
  title: string
  duration_seconds: number
  ai_viral_score: number
  status: string
  created_at: string
}

export default function Editor() {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [video, setVideo] = useState<VideoData | null>(null)
  const [clips, setClips] = useState<ClipData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (videoId) {
      loadVideoData()
    }
  }, [videoId])

  const loadVideoData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Carregar dados do vídeo
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single()

      if (videoError) {
        throw new Error('Vídeo não encontrado')
      }

      if (!videoData.cloudinary_secure_url) {
        throw new Error('Vídeo ainda não foi processado')
      }

      setVideo(videoData)

      // Carregar clips existentes
      const { data: clipsData, error: clipsError } = await supabase
        .from('clips')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })

      if (clipsError) {
        console.error('Erro ao carregar clips:', clipsError)
      } else {
        setClips(clipsData || [])
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message)
      toast({
        title: "Erro ao carregar vídeo",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClipCreated = (newClip: any) => {
    setClips(prev => [newClip, ...prev])
    toast({
      title: "Clip adicionado!",
      description: "O clip foi criado e adicionado à lista",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500'
      case 'processing': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando vídeo...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error || 'Vídeo não encontrado'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{video.title}</h1>
              <p className="text-purple-100 flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Editor de Clips Manual - Controle total sobre seus cortes
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Scissors className="h-3 w-3 mr-1" />
              {clips.length} clips criados
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Sparkles className="h-3 w-3 mr-1" />
              {Math.round(video.duration_seconds)}s duração
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <a href="/gallery">
                Ver Gallery
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Principal */}
          <div className="lg:col-span-2">
            <ClipEditor 
              video={video} 
              onClipCreated={handleClipCreated}
            />
          </div>

          {/* Sidebar com Clips Existentes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Clips Criados ({clips.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clips.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum clip criado ainda</p>
                    <p className="text-sm">Use o editor ao lado para criar seu primeiro clip</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clips.map((clip) => (
                      <div key={clip.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{clip.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(clip.status)} text-white`}
                          >
                            {clip.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{Math.round(clip.duration_seconds)}s</span>
                          <span className={`font-medium ${getScoreColor(clip.ai_viral_score)}`}>
                            Score: {clip.ai_viral_score?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(clip.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 