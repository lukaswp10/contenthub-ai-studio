import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Search,
  Filter,
  Grid3X3,
  List,
  Play,
  Download,
  Share2,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  Clock,
  TrendingUp,
  Eye,
  Heart,
  Share,
  Sparkles,
  Video,
  Scissors,
  ArrowLeft,
  ExternalLink,
  Copy,
  RefreshCw,
  Home,
  CalendarPlus,
  Link as LinkIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

interface Video {
  id: string
  title: string
  original_filename: string
  thumbnail_url?: string
  duration_seconds?: number
  created_at: string
  processing_status: string
  clips_count: number
  cloudinary_secure_url?: string
}

interface Clip {
  id: string
  video_id: string
  title: string
  description: string
  thumbnail_url?: string
  duration_seconds: number
  ai_viral_score: number
  ai_hook_strength: number
  ai_best_platform: string[]
  hashtags: string[]
  created_at: string
  total_views?: number
  total_likes?: number
  total_shares?: number
  cloudinary_secure_url?: string
  status: string
}

export default function Gallery() {
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const [videos, setVideos] = useState<Video[]>([])
  const [clips, setClips] = useState<Clip[]>([])

  useEffect(() => {
    if (user) {
      loadGalleryData()
    }
  }, [user])

  // Handle URL params for filtering
  useEffect(() => {
    const videoId = searchParams.get('video')
    const clipId = searchParams.get('clip')
    
    if (videoId) {
      setSelectedVideo(videoId)
    }
    
    if (clipId && clips.length > 0) {
      const clip = clips.find(c => c.id === clipId)
      if (clip) {
        setSelectedClip(clip)
      }
    }
  }, [searchParams, clips])

  const loadGalleryData = async () => {
    try {
      setLoading(true)
      
      // Carregar vídeos com contagem de clips
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (videosError) {
        console.error('Erro ao carregar vídeos:', videosError)
      } else {
        const videosWithClips = await Promise.all(
          (videosData || []).map(async (video) => {
            const { count } = await supabase
              .from('clips')
              .select('*', { count: 'exact', head: true })
              .eq('video_id', video.id)
            
            return {
              ...video,
              clips_count: count || 0
            }
          })
        )
        setVideos(videosWithClips)
      }

      // Carregar clips
      const { data: clipsData, error: clipsError } = await supabase
        .from('clips')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (clipsError) {
        console.error('Erro ao carregar clips:', clipsError)
      } else {
        setClips(clipsData || [])
      }
    } catch (error) {
      console.error('Erro ao carregar galeria:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da galeria.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const safeSeconds = seconds || 0
    const mins = Math.floor(safeSeconds / 60)
    const secs = safeSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getViralScoreColor = (score: number) => {
    const safeScore = score || 0
    if (safeScore >= 8) return 'bg-green-500 text-white'
    if (safeScore >= 6) return 'bg-yellow-500 text-white'
    if (safeScore >= 4) return 'bg-orange-500 text-white'
    return 'bg-red-500 text-white'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Pronto'
      case 'draft': return 'Rascunho'
      case 'processing': return 'Processando'
      case 'failed': return 'Erro'
      default: return status
    }
  }

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o vídeo "${videoTitle}" e todos os seus clips?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user?.id)

      if (error) throw error

    toast({
      title: "Vídeo removido",
        description: "O vídeo e seus clips foram removidos com sucesso.",
      })

      loadGalleryData()
    } catch (error) {
      console.error('Erro ao remover vídeo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o vídeo.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteClip = async (clipId: string, clipTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o clip "${clipTitle}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('clips')
        .delete()
        .eq('id', clipId)
        .eq('user_id', user?.id)

      if (error) throw error

    toast({
      title: "Clip removido",
      description: "O clip foi removido com sucesso.",
      })

      loadGalleryData()
      setSelectedClip(null)
    } catch (error) {
      console.error('Erro ao remover clip:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o clip.",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    })
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = (video.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (video.original_filename || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'completed' && video.clips_count > 0) ||
                         (filterStatus === 'processing' && video.clips_count === 0)
    
    return matchesSearch && matchesFilter
  })

  const filteredClips = clips.filter(clip => {
    const matchesSearch = (clip.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (clip.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVideo = !selectedVideo || clip.video_id === selectedVideo
    
    return matchesSearch && matchesVideo
  })

  const sortedClips = [...filteredClips].sort((a, b) => {
    switch (sortBy) {
      case 'viral_score':
        return (b.ai_viral_score || 0) - (a.ai_viral_score || 0)
      case 'duration':
        return (b.duration_seconds || 0) - (a.duration_seconds || 0)
      case 'views':
        return (b.total_views || 0) - (a.total_views || 0)
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // New functions for clip actions
  const handleViewClip = (clip: Clip) => {
    if (clip.cloudinary_secure_url) {
      window.open(clip.cloudinary_secure_url, '_blank')
    } else {
      toast({
        title: "Vídeo não disponível",
        description: "O vídeo ainda está sendo processado.",
        variant: "destructive"
      })
    }
  }

  const handleDownloadClip = async (clip: Clip) => {
    if (!clip.cloudinary_secure_url) {
      toast({
        title: "Download não disponível",
        description: "O vídeo ainda está sendo processado.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(clip.cloudinary_secure_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download iniciado",
        description: "O download do clip foi iniciado.",
      })
    } catch (error) {
      console.error('Erro no download:', error)
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o clip.",
        variant: "destructive"
      })
    }
  }

  const handleShareClip = (clip: Clip) => {
    const shareData = {
      title: clip.title,
      text: clip.description,
      url: clip.cloudinary_secure_url || window.location.href
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
    } else {
      // Fallback: copy link to clipboard
      const shareText = `${clip.title}\n\n${clip.description}\n\n${shareData.url}`
      navigator.clipboard.writeText(shareText)
      toast({
        title: "Link copiado!",
        description: "O link do clip foi copiado para a área de transferência.",
      })
    }
  }

  const handleScheduleClip = (clip: Clip) => {
    // Navigate to social page with clip data
    navigate('/social', { 
      state: { 
        clipId: clip.id,
        clipTitle: clip.title,
        clipDescription: clip.description,
        clipUrl: clip.cloudinary_secure_url,
        hashtags: clip.hashtags,
        platforms: clip.ai_best_platform
      } 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando galeria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Always show back to dashboard button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            
            {selectedVideo && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedVideo(null)
                  setSearchParams({})
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Todos os Clips
              </Button>
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {selectedVideo ? 'Clips do Vídeo' : 'Galeria de Conteúdo'}
              </h1>
              <p className="text-gray-600">
                {selectedVideo 
                  ? `Visualize e gerencie os clips deste vídeo`
                  : 'Seus vídeos e clips gerados pela IA'
                }
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={loadGalleryData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        
        {/* Editor Manual Banner */}
        {!selectedVideo && videos.filter(v => v.processing_status === 'ready').length > 0 && (
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Scissors className="h-6 w-6" />
                    🎬 Crie Clips Personalizados
                  </h3>
                  <p className="text-purple-100 mb-3">
                    Use nosso editor manual para criar clips com controle total sobre timing, cortes e conteúdo
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Corte preciso por segundo
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Preview em tempo real
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Múltiplas plataformas
                    </span>
                  </div>
                </div>
                <div className="ml-6">
                  <Select onValueChange={(videoId) => navigate(`/editor/${videoId}`)}>
                    <SelectTrigger className="w-48 bg-white text-gray-900">
                      <SelectValue placeholder="Escolher vídeo para editar" />
                    </SelectTrigger>
                    <SelectContent>
                      {videos
                        .filter(v => v.processing_status === 'ready')
                        .map((video) => (
                          <SelectItem key={video.id} value={video.id}>
                            {video.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                  placeholder="Buscar por título, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>

              <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="viral_score">Score viral</SelectItem>
                    <SelectItem value="duration">Duração</SelectItem>
                    <SelectItem value="views">Visualizações</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
              </SelectContent>
            </Select>

                <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                    className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue={selectedVideo ? "clips" : "videos"} className="space-y-6">
          {!selectedVideo && (
            <TabsList className="grid w-full grid-cols-2 bg-white/90 backdrop-blur-sm">
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Vídeos ({videos.length})
              </TabsTrigger>
              <TabsTrigger value="clips" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Clips ({clips.length})
              </TabsTrigger>
            </TabsList>
          )}

          {/* Videos Tab */}
          {!selectedVideo && (
            <TabsContent value="videos" className="space-y-6">
              {filteredVideos.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nenhum vídeo encontrado
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? 'Tente ajustar sua busca.' : 'Faça upload do seu primeiro vídeo para começar.'}
                    </p>
                    <Button asChild>
                      <a href="/dashboard">Fazer Upload</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredVideos.map((video) => (
                    <Card key={video.id} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                            {formatDate(video.created_at)}
                          </span>
                              {video.duration_seconds && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(video.duration_seconds)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Scissors className="h-3 w-3" />
                                {video.clips_count} clips
                              </span>
              </div>
                          </div>
                          <Badge className={getStatusColor(video.processing_status)}>
                            {video.clips_count > 0 ? 'Pronto' : 'Processando'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {video.clips_count > 0 && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                setSelectedVideo(video.id)
                                setSearchParams({ video: video.id })
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Ver Clips ({video.clips_count})
                            </Button>
                          )}
                          
                          {video.processing_status === 'ready' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                              asChild
                            >
                              <a href={`/editor/${video.id}`}>
                                <Scissors className="h-3 w-3 mr-1" />
                                Editar
                              </a>
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {video.processing_status === 'ready' && (
                                <DropdownMenuItem asChild>
                                  <a href={`/editor/${video.id}`} className="flex items-center">
                                    <Scissors className="h-4 w-4 mr-2" />
                                    Editar Clips
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteVideo(video.id, video.title)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir vídeo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          )}

          {/* Clips Tab */}
          <TabsContent value="clips" className="space-y-6">
            {sortedClips.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Scissors className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum clip encontrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedVideo 
                      ? 'Este vídeo ainda não possui clips gerados.'
                      : searchTerm 
                        ? 'Tente ajustar sua busca.' 
                        : 'Faça upload de um vídeo para gerar clips automaticamente.'
                    }
                  </p>
                  {!selectedVideo && (
                    <Button asChild>
                      <a href="/dashboard">Fazer Upload</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {sortedClips.map((clip) => (
                  <Card key={clip.id} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {clip.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {clip.description}
                          </p>
                        </div>
                        <Badge className={getViralScoreColor(clip.ai_viral_score || 0)}>
                          {(clip.ai_viral_score || 0).toFixed(1)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(clip.duration_seconds)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(clip.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(clip.total_views || 0)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {(clip.hashtags || []).slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {(clip.hashtags || []).length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{(clip.hashtags || []).length - 3}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="flex-1"
                          onClick={() => handleViewClip(clip)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Visualizar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadClip(clip)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Baixar
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShareClip(clip)}
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Compartilhar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                          onClick={() => handleScheduleClip(clip)}
                        >
                          <CalendarPlus className="h-3 w-3 mr-1" />
                          Agendar
                        </Button>
                      </div>

                      {/* Detailed Modal */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{clip.title}</DialogTitle>
                            <DialogDescription>
                              {clip.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Clip Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">{(clip.ai_viral_score || 0).toFixed(1)}</div>
                                <div className="text-xs text-gray-600">Score Viral</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-indigo-600">{(clip.ai_hook_strength || 0).toFixed(1)}</div>
                                <div className="text-xs text-gray-600">Hook Strength</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{formatDuration(clip.duration_seconds)}</div>
                                <div className="text-xs text-gray-600">Duração</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">{formatNumber(clip.total_views || 0)}</div>
                                <div className="text-xs text-gray-600">Visualizações</div>
                              </div>
                            </div>

                            {/* Platforms */}
                            <div>
                              <h4 className="font-medium mb-2">Plataformas Recomendadas:</h4>
                              <div className="flex gap-2">
                                {(clip.ai_best_platform || []).map((platform, idx) => (
                                  <Badge key={idx} variant="outline">
                                    {platform}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Hashtags */}
                            <div>
                              <h4 className="font-medium mb-2">Hashtags:</h4>
                              <div className="flex flex-wrap gap-2">
                                {(clip.hashtags || []).map((tag, idx) => (
                                  <span 
                                    key={idx} 
                                    className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full cursor-pointer hover:bg-purple-200 transition-colors"
                                    onClick={() => copyToClipboard(tag, 'Hashtag')}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <Button 
                                className="flex-1"
                                onClick={() => handleViewClip(clip)}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Visualizar
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleDownloadClip(clip)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleShareClip(clip)}
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                                onClick={() => handleScheduleClip(clip)}
                              >
                                <CalendarPlus className="h-4 w-4 mr-2" />
                                Agendar
                              </Button>
                            </div>
                            
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClip(clip.id, clip.title)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir clip
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 