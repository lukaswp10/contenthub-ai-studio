import React, { useState, useEffect } from 'react'
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

  // Carregar vídeos da galeria
  useEffect(() => {
    const loadVideos = () => {
      const galleryVideos = getGalleryVideos()
      setVideos(galleryVideos)
      setFilteredVideos(galleryVideos)
      onRefresh?.() // Notificar componente pai que foi atualizado
    }

    loadVideos()
    
    // Recarregar quando voltar para a página
    const handleFocus = () => loadVideos()
    window.addEventListener('focus', handleFocus)
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [onRefresh])

  // Método público para recarregar (chamado pelo componente pai)
  const refreshGallery = () => {
    const galleryVideos = getGalleryVideos()
    setVideos(galleryVideos)
    setFilteredVideos(galleryVideos)
  }

  // Expor método de refresh via useEffect
  useEffect(() => {
    if (onRefresh) {
      // Armazenar referência do método refresh
      (window as any).refreshVideoGallery = refreshGallery
    }
  }, [onRefresh])

  // Filtrar e ordenar vídeos
  useEffect(() => {
    let filtered = [...videos]

    // Aplicar busca
    if (searchQuery) {
      filtered = filtered.filter(video => 
        video.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Aplicar ordenação
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

  // Editar vídeo - navegar para o editor
  const handleEditVideo = (video: GalleryVideo) => {
    console.log('🎬 Editando vídeo da galeria:', video.name)
    
    navigate('/editor', {
      state: {
        url: video.cloudinaryUrl || video.url,
        name: video.name,
        size: parseFloat(video.size.replace(/[^\d.]/g, '')) * 1024 * 1024, // Converter para bytes
        duration: video.duration,
        id: video.id,
        cloudinaryPublicId: video.cloudinaryPublicId,
        cloudinaryUrl: video.cloudinaryUrl,
        // Não incluir file object para evitar problemas de storage
      }
    })
  }

  // Excluir vídeo
  const handleDeleteVideo = (video: GalleryVideo) => {
    if (confirm(`Tem certeza que deseja excluir "${video.name}"?`)) {
      deleteVideoFromGallery(video.id)
      const updatedVideos = videos.filter(v => v.id !== video.id)
      setVideos(updatedVideos)
      console.log('🗑️ Vídeo excluído da galeria:', video.name)
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

  if (videos.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Nenhum vídeo na galeria
          </h3>
          <p className="text-gray-600 mb-6">
            Faça upload de um vídeo para começar a criar clips virais!
          </p>
          <Button 
            onClick={() => navigate('/upload')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Fazer Upload
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header da Galeria */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎬 Meus Vídeos</h2>
          <p className="text-gray-600">
            {filteredVideos.length} de {videos.length} vídeo{videos.length !== 1 ? 's' : ''}
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

      {/* Controles de Busca e Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar vídeos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-2">
            {/* Ordenação */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
                setSortBy(newSortBy)
                setSortOrder(newSortOrder)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Mais recentes</option>
              <option value="date-asc">Mais antigos</option>
              <option value="name-asc">Nome A-Z</option>
              <option value="name-desc">Nome Z-A</option>
              <option value="duration-desc">Maior duração</option>
              <option value="duration-asc">Menor duração</option>
              <option value="size-desc">Maior tamanho</option>
              <option value="size-asc">Menor tamanho</option>
            </select>

            {/* Modo de visualização */}
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

      {/* Lista de Vídeos - Modo Grid */}
      {viewMode === 'grid' ? (
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
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-900 relative group">
                <img
                  src={video.thumbnail}
                  alt={video.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback para thumbnail
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMjAgODBMMTgwIDEyMEwxMjAgMTYwVjgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
                  }}
                />
                
                {/* Overlay com controles */}
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

                {/* Badges */}
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

                {/* Tamanho do arquivo */}
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs bg-black/50 text-white border-white/20">
                    {video.size}
                  </Badge>
                </div>
              </div>

              {/* Informações */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 truncate" title={video.name}>
                  {video.name}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(video.uploadedAt)}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditVideo(video)}
                    className={`flex-1 ${
                      isHighlighted 
                        ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {isHighlighted ? '🔥 Editar Agora' : 'Editar'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteVideo(video)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
            )
          })}
        </div>
      ) : (
        /* Modo Lista */
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredVideos.map((video) => {
              const isHighlighted = highlightedVideoId === video.id
              return (
              <div 
                key={video.id} 
                className={`p-4 transition-colors ${
                  isHighlighted 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Thumbnail pequeno */}
                  <div className="w-16 h-12 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA2NCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNiAxOEwzOCAyNEwyNiAzMFYxOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg=='
                      }}
                    />
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{video.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(video.duration)}
                      </div>
                      <div className="flex items-center">
                        <HardDrive className="h-3 w-3 mr-1" />
                        {video.size}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(video.uploadedAt)}
                      </div>
                      {hasTranscription(video.id) && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <FileText className="h-3 w-3 mr-1" />
                          Legendas
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewVideo(video)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditVideo(video)}
                      className={`${
                        isHighlighted 
                          ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {isHighlighted ? '🔥 Editar' : 'Editar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteVideo(video)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Resultado vazio da busca */}
      {filteredVideos.length === 0 && searchQuery && (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum vídeo encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar sua busca ou filtros
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
            >
              Limpar busca
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
} 