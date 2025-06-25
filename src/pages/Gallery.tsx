import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Video {
  id: string
  title: string
  thumbnail_url: string
  duration: number
  created_at: string
  status: 'completed' | 'processing' | 'failed'
  clips_count: number
  total_views?: number
}

interface Clip {
  id: string
  video_id: string
  title: string
  thumbnail_url: string
  duration: number
  viral_score: number
  created_at: string
  views?: number
  likes?: number
  shares?: number
}

export default function Gallery() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock data - replace with real API calls
  const [videos, setVideos] = useState<Video[]>([
    {
      id: '1',
      title: 'Como Criar Conteúdo Viral',
      thumbnail_url: '/placeholder-thumbnail.jpg',
      duration: 300,
      created_at: '2024-01-20T10:00:00Z',
      status: 'completed',
      clips_count: 3,
      total_views: 15420
    },
    {
      id: '2',
      title: 'Marketing Digital em 2024',
      thumbnail_url: '/placeholder-thumbnail.jpg',
      duration: 450,
      created_at: '2024-01-19T15:30:00Z',
      status: 'completed',
      clips_count: 4,
      total_views: 8930
    },
    {
      id: '3',
      title: 'Tutorial React Avançado',
      thumbnail_url: '/placeholder-thumbnail.jpg',
      duration: 600,
      created_at: '2024-01-18T09:15:00Z',
      status: 'processing',
      clips_count: 0
    }
  ])

  const [clips, setClips] = useState<Clip[]>([
    {
      id: '1',
      video_id: '1',
      title: 'Hook Poderoso - Primeiros 15s',
      thumbnail_url: '/placeholder-thumbnail.jpg',
      duration: 15,
      viral_score: 95,
      created_at: '2024-01-20T10:30:00Z',
      views: 5420,
      likes: 234,
      shares: 89
    },
    {
      id: '2',
      video_id: '1',
      title: 'Dica Valiosa - Meio do Vídeo',
      thumbnail_url: '/placeholder-thumbnail.jpg',
      duration: 30,
      viral_score: 87,
      created_at: '2024-01-20T10:35:00Z',
      views: 3210,
      likes: 156,
      shares: 67
    },
    {
      id: '3',
      video_id: '2',
      title: 'Estatística Impressionante',
      thumbnail_url: '/placeholder-thumbnail.jpg',
      duration: 25,
      viral_score: 78,
      created_at: '2024-01-19T16:00:00Z',
      views: 2890,
      likes: 123,
      shares: 45
    }
  ])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getViralScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-yellow-500'
    if (score >= 70) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'processing': return 'Processando'
      case 'failed': return 'Falhou'
      default: return status
    }
  }

  const handleDeleteVideo = (videoId: string) => {
    setVideos(videos.filter(v => v.id !== videoId))
    toast({
      title: "Vídeo removido",
      description: "O vídeo foi removido com sucesso.",
    })
  }

  const handleDeleteClip = (clipId: string) => {
    setClips(clips.filter(c => c.id !== clipId))
    toast({
      title: "Clip removido",
      description: "O clip foi removido com sucesso.",
    })
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || video.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredClips = clips.filter(clip =>
    clip.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Galeria</h1>
            <p className="text-gray-600">Gerencie seus vídeos e clips</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar vídeos e clips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Filters */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="oldest">Mais Antigos</SelectItem>
                <SelectItem value="popular">Mais Populares</SelectItem>
                <SelectItem value="viral">Maior Score Viral</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex border border-gray-200 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="videos">
              Vídeos ({filteredVideos.length})
            </TabsTrigger>
            <TabsTrigger value="clips">
              Clips ({filteredClips.length})
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="failed">Falharam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center">
                          <Link to={`/editor/${video.id}`}>
                            <Button 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </Link>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className={getStatusColor(video.status)}>
                            {getStatusText(video.status)}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(video.created_at)}
                          </span>
                          <span>{video.clips_count} clips</span>
                        </div>

                        {video.total_views && (
                          <div className="flex items-center text-sm text-gray-600 mb-3">
                            <Eye className="h-3 w-3 mr-1" />
                            {formatNumber(video.total_views)} visualizações
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteVideo(video.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <Card key={video.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {video.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatDuration(video.duration)}</span>
                            <span>{formatDate(video.created_at)}</span>
                            <span>{video.clips_count} clips</span>
                            {video.total_views && (
                              <span>{formatNumber(video.total_views)} views</span>
                            )}
                          </div>
                        </div>
                        
                        <Badge className={getStatusColor(video.status)}>
                          {getStatusText(video.status)}
                        </Badge>
                        
                        <div className="flex items-center space-x-2">
                          <Link to={`/editor/${video.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </Link>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteVideo(video.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Clips Tab */}
          <TabsContent value="clips" className="mt-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredClips.map((clip) => (
                  <Card key={clip.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={clip.thumbnail_url}
                          alt={clip.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center">
                          <Button 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Reproduzir
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className={`${getViralScoreColor(clip.viral_score)} text-white`}>
                            <Sparkles className="h-3 w-3 mr-1" />
                            {clip.viral_score}%
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(clip.duration)}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {clip.title}
                        </h3>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(clip.created_at)}
                          </span>
                        </div>

                        {clip.views && (
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {formatNumber(clip.views)}
                              </span>
                              <span className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                {formatNumber(clip.likes || 0)}
                              </span>
                              <span className="flex items-center">
                                <Share className="h-3 w-3 mr-1" />
                                {formatNumber(clip.shares || 0)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteClip(clip.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClips.map((clip) => (
                  <Card key={clip.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={clip.thumbnail_url}
                          alt={clip.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {clip.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatDuration(clip.duration)}</span>
                            <span>{formatDate(clip.created_at)}</span>
                            {clip.views && (
                              <>
                                <span>{formatNumber(clip.views)} views</span>
                                <span>{formatNumber(clip.likes || 0)} likes</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Badge className={`${getViralScoreColor(clip.viral_score)} text-white`}>
                          <Sparkles className="h-3 w-3 mr-1" />
                          {clip.viral_score}%
                        </Badge>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Reproduzir
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteClip(clip.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
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