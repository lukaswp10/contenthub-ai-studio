import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useClips } from '@/contexts/ClipsContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const ClipsPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const { clips, loading, deleteClip } = useClips()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
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

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'TikTok':
        return '🎵'
      case 'Instagram Reels':
        return '📷'
      case 'YouTube Shorts':
        return '🎬'
      default:
        return '🎥'
    }
  }

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'TikTok':
        return 'bg-pink-100 text-pink-800'
      case 'Instagram Reels':
        return 'bg-purple-100 text-purple-800'
      case 'YouTube Shorts':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userEmail={user?.email} onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando clips...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        userEmail={user?.email} 
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-800"
              >
                Dashboard
              </Button>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-900 font-medium">Meus Clips</li>
          </ol>
        </nav>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Meus Clips 🎬
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Visualize, gerencie e compartilhe todos os seus clips criados.
          </p>
        </div>

        {/* Stats Summary */}
        {clips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{clips.length}</div>
                <div className="text-sm text-gray-600">Total de Clips</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {clips.reduce((sum, clip) => sum + clip.views, 0)}
                </div>
                <div className="text-sm text-gray-600">Total de Views</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {clips.reduce((sum, clip) => sum + clip.likes, 0)}
                </div>
                <div className="text-sm text-gray-600">Total de Likes</div>
              </div>
            </Card>
          </div>
        )}

        {/* Clips Grid */}
        {clips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clips.map((clip) => (
              <Card key={clip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail/Video Preview */}
                <div className="aspect-video bg-gray-900 relative">
                  {clip.thumbnail ? (
                    <video 
                      src={clip.thumbnail}
                      className="w-full h-full object-cover"
                      muted
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Format Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFormatColor(clip.format)}`}>
                      {getFormatIcon(clip.format)} {clip.format}
                    </span>
                  </div>
                  
                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {clip.duration}s
                  </div>
                </div>

                {/* Clip Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">
                    {clip.title}
                  </h3>
                  
                  {/* Stats */}
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>👀 {clip.views}</span>
                    <span>❤️ {clip.likes}</span>
                    <span>📤 {clip.shares}</span>
                  </div>
                  
                  {/* Engagement */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Engajamento</span>
                      <span>{clip.engagement}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full"
                        style={{ width: `${Math.min(clip.engagement, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Creation Date */}
                  <p className="text-xs text-gray-500 mb-4">
                    Criado em {formatDate(clip.createdAt)}
                  </p>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        // Simular download
                        alert('Download iniciado! (Funcionalidade simulada)')
                      }}
                    >
                      📥 Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Simular compartilhamento
                        navigator.clipboard.writeText(`Confira meu clip: ${clip.title}`)
                        alert('Link copiado para a área de transferência!')
                      }}
                    >
                      📤
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este clip?')) {
                          deleteClip(clip.id)
                        }
                      }}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card className="p-8 sm:p-12 text-center mb-6">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum clip criado ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Faça upload de um vídeo para começar a criar clips virais com IA.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/upload')}
            >
              🎬 Criar Primeiro Clip
            </Button>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📹 Novo Upload
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Faça upload de um novo vídeo para criar mais clips
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/upload')}
            >
              Upload Vídeo
            </Button>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📈 Ver Analytics
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Acompanhe performance dos seus clips
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/analytics')}
            >
              Ver Analytics
            </Button>
          </Card>
        </div>
      </main>
    </div>
  )
} 