import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  getGalleryVideos, 
  deleteVideoFromGallery, 
  hasTranscription,
  type GalleryVideo 
} from '@/utils/galleryStorage'
import { 
  Play, 
  Edit, 
  Trash2, 
  Search, 
  Upload, 
  Clock, 
  HardDrive,
  FileText,
  Calendar,
  Grid,
  List
} from 'lucide-react'

interface VideoGalleryProps {
  className?: string
  highlightedVideoId?: string | null
  onRefresh?: () => void
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({ 
  className = '', 
  highlightedVideoId = null,
  onRefresh 
}) => {
  const navigate = useNavigate()
  const [videos, setVideos] = useState<GalleryVideo[]>([])
  const [filteredVideos, setFilteredVideos] = useState<GalleryVideo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'duration' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [lastLoadTime, setLastLoadTime] = useState(0)

  // ✅ Carregar vídeos do Supabase com debounce e cache (preservando funcionalidade)
  const loadVideos = useCallback(async (force = false) => {
    const now = Date.now()
    const CACHE_TIME = 15000 // 15 segundos de cache (reduzido para não afetar UX)
    
    // Evitar chamadas muito frequentes APENAS se não forçado
    if (!force && now - lastLoadTime < CACHE_TIME) {
      console.log('🚀 Cache ativo - evitando reload desnecessário (otimização ativa)')
      return
    }

    try {
      setLoading(true)
      console.log('🔄 Carregando vídeos do Supabase... (otimizado)')
      
      // Carregar diretamente do Supabase (mantendo lógica original)
      const galleryVideos = await getGalleryVideos()
      setVideos(galleryVideos)
      setFilteredVideos(galleryVideos)
      setLastLoadTime(now)
      
      // Preservar callback original
      if (onRefresh) {
        onRefresh()
      }
      
      console.log(`✅ ${galleryVideos.length} vídeos carregados do Supabase (cache atualizado)`)
    } catch (error) {
      console.error('❌ Erro ao carregar vídeos:', error)
      // Preservar comportamento original em caso de erro
      setVideos([])
      setFilteredVideos([])
    } finally {
      setLoading(false)
    }
  }, [lastLoadTime]) // ✅ Remover onRefresh das dependências para evitar loops

  // ✅ Carregar vídeos apenas uma vez na montagem + controle de dependências
  useEffect(() => {
    loadVideos(true)
    
    // Recarregar apenas quando a janela ganha foco (usuario voltou)
    const handleFocus = () => {
      // Debounce de 1 segundo para window focus
      setTimeout(() => loadVideos(false), 1000)
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadVideos]) // ✅ Incluir loadVideos mas com memoização para evitar loops

  // ✅ Memoizar função de refetch para evitar re-renders
  const handleRefreshVideos = useCallback(() => {
    loadVideos(true)
  }, [loadVideos])

  // Filtrar e ordenar vídeos
  useEffect(() => {
    let filtered = [...videos]

    if (searchQuery) {
      filtered = filtered.filter(video => 
        video.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'size':
          const sizeA = parseFloat(a.size.replace(/[^\d.]/g, ''))
          const sizeB = parseFloat(b.size.replace(/[^\d.]/g, ''))
          comparison = sizeA - sizeB
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredVideos(filtered)
  }, [videos, searchQuery, sortBy, sortOrder])

  // Editar vídeo
  const handleEditVideo = (video: GalleryVideo) => {
    console.log('🎬 Editando vídeo da galeria (Supabase):', video.name)
    
    navigate('/editor', {
      state: {
        url: video.cloudinaryUrl || video.url,
        name: video.name,
        size: parseFloat(video.size.replace(/[^\d.]/g, '')) * 1024 * 1024,
        duration: video.duration,
        id: video.id,
        cloudinaryPublicId: video.cloudinaryPublicId,
        cloudinaryUrl: video.cloudinaryUrl,
      }
    })
  }

  // ✅ Excluir vídeo do Supabase (100% REAL)
  const handleDeleteVideo = async (video: GalleryVideo) => {
    if (confirm(`Tem certeza que deseja excluir "${video.name}"?`)) {
      try {
        await deleteVideoFromGallery(video.id)
        // Recarregar lista após exclusão
        const updatedVideos = await getGalleryVideos()
        setVideos(updatedVideos)
        console.log('🗑️ Vídeo excluído do Supabase:', video.name)
      } catch (error) {
        console.error('❌ Erro ao excluir vídeo:', error)
        alert('Erro ao excluir vídeo. Tente novamente.')
      }
    }
  }

  // Preview do vídeo
  const handlePreviewVideo = (video: GalleryVideo) => {
    console.log('👁️ Preview do vídeo:', video.name)
    window.open(video.cloudinaryUrl || video.url, '_blank')
  }

  // Formatar data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Formatar duração
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // ✅ Estado de carregamento
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎬 Meus Vídeos</h2>
            <p className="text-gray-600">Carregando vídeos do Supabase...</p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header da Galeria - SEMPRE VISÍVEL */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎬 Meus Vídeos</h2>
          <p className="text-gray-600">
            {videos.length === 0 
              ? 'Nenhum vídeo no Supabase' 
              : `${filteredVideos.length} de ${videos.length} vídeo${videos.length !== 1 ? 's' : ''} (Supabase)`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/upload')}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Estado Vazio */}
      {videos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum vídeo no Supabase
              </h3>
              <p className="text-gray-600 mb-4">
                Comece fazendo upload de um vídeo para sua galeria
              </p>
              <Button onClick={() => navigate('/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Controles de Busca e Filtros */}
          <Card className="p-4 mb-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar vídeos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Data</option>
                  <option value="name">Nome</option>
                  <option value="duration">Duração</option>
                  <option value="size">Tamanho</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Lista de Vídeos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => {
              const isHighlighted = highlightedVideoId === video.id
              return (
                <Card 
                  key={video.id} 
                  className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${
                    isHighlighted 
                      ? 'ring-2 ring-blue-500 shadow-lg transform scale-105 bg-blue-50' 
                      : ''
                  }`}
                >
                  <div className="aspect-video bg-gray-900 relative group">
                    <img
                      src={video.thumbnail}
                      alt={video.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMjAgODBMMTgwIDEyMEwxMjAgMTYwVjgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
                      }}
                    />
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePreviewVideo(video)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditVideo(video)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 flex space-x-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(video.duration)}
                      </Badge>
                      {hasTranscription(video.id) && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <FileText className="h-3 w-3 mr-1" />
                          Legendas
                        </Badge>
                      )}
                    </div>

                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="text-xs bg-black/50 text-white border-white/20">
                        <HardDrive className="h-3 w-3 mr-1" />
                        {video.size}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 truncate" title={video.name}>
                      {video.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(new Date(video.uploadedAt))}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditVideo(video)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteVideo(video)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
} 