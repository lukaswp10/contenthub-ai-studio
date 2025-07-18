import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useClips } from '@/contexts/ClipsContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VideoGallery } from '@/components/dashboard/VideoGallery'
import { CompactVideoUpload } from '@/components/dashboard/CompactVideoUpload'
import { getGalleryVideos } from '@/utils/galleryStorage'

export const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const { clips, totalViews, totalEngagement, loading } = useClips()
  const navigate = useNavigate()
  
  // Estado para destacar vídeo recém-enviado
  const [highlightedVideoId, setHighlightedVideoId] = React.useState<string | null>(null)
  
  // Função chamada quando upload compacto é concluído
  const handleUploadComplete = (videoId: string) => {
    console.log('📤 Upload concluído, destacando vídeo:', videoId)
    
    // Destacar o vídeo na galeria
    setHighlightedVideoId(videoId)
    
    // Remover destaque após 5 segundos
    setTimeout(() => {
      setHighlightedVideoId(null)
    }, 5000)
    
    // Refresh da galeria para mostrar o novo vídeo
    if ((window as any).refreshVideoGallery) {
      (window as any).refreshVideoGallery()
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Função para abrir editor (com último vídeo se disponível)
  const openEditorWithLastVideo = () => {
    const galleryVideos = getGalleryVideos()
    
    if (galleryVideos.length > 0) {
      // Pegar o vídeo mais recente (primeiro da lista)
      const lastVideo = galleryVideos[0]
      
      console.log('🎬 Abrindo editor com último vídeo:', lastVideo.name)
      
      // Navegar para o editor com os dados do vídeo
      navigate('/editor', {
        state: {
          videoData: {
            file: null, // Não temos o File object, mas temos a URL
            url: lastVideo.cloudinaryUrl || lastVideo.url,
            name: lastVideo.name,
            size: parseInt(lastVideo.size.replace(/[^\d]/g, '')) * 1024 * 1024, // Converter de "X.X MB" para bytes
            duration: lastVideo.duration,
            id: lastVideo.id,
            cloudinaryPublicId: lastVideo.cloudinaryPublicId,
            cloudinaryUrl: lastVideo.cloudinaryUrl
          }
        }
      })
    } else {
      // Se não há vídeos, ir para editor vazio para fazer upload
      console.log('🎬 Nenhum vídeo encontrado, abrindo editor vazio')
      navigate('/editor')
    }
  }

  // Calcular métricas para o dashboard
  const safeClips = clips || []
  const totalClips = safeClips.length
  const totalShares = safeClips.reduce((sum, clip) => sum + clip.shares, 0)
  const recentClips = [...safeClips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userEmail={user?.email} onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando dashboard...</span>
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
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {totalClips > 0 ? 'Bem-vindo de volta!' : 'Bem-vindo ao ClipsForge Pro!'} 👋
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {totalClips > 0 
              ? `Você já criou ${totalClips} clip${totalClips > 1 ? 's' : ''} com ${totalViews.toLocaleString()} visualizações totais.`
              : 'Pronto para transformar seus vídeos em clips virais? Comece fazendo o upload do seu primeiro vídeo.'
            }
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clips</p>
                <p className="text-2xl font-bold text-gray-900">{totalClips}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Views</p>
                <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Engajamento</p>
                <p className="text-2xl font-bold text-gray-900">{totalClips > 0 ? totalEngagement.toFixed(1) : '0'}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shares</p>
                <p className="text-2xl font-bold text-gray-900">{totalShares}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Upload Rápido */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📤 Upload Rápido
          </h2>
          <CompactVideoUpload 
            onUploadComplete={handleUploadComplete}
            className="w-full"
          />
        </div>

        {/* Galeria de Vídeos */}
        <VideoGallery 
          className="mb-8" 
          highlightedVideoId={highlightedVideoId}
          onRefresh={() => {
            // Callback quando galeria é atualizada
            console.log('📁 Galeria atualizada')
          }}
        />

        {/* Ações Rápidas */}
        <Card className="p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-6">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* COMENTADO: Botão upload agora está integrado acima */}
            {/* 
            <Button
              size="lg"
              className="h-20 sm:h-24 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-col sm:flex-row"
              onClick={() => navigate('/upload')}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-center">Upload de Vídeo</span>
            </Button>
            */}

            {/* BOTÃO EDITOR MANUAL MELHORADO */}
            <Button
              size="lg"
              className="h-20 sm:h-24 text-base sm:text-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 flex-col sm:flex-row"
              onClick={openEditorWithLastVideo}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-center">Editor Manual</span>
            </Button>


            
            <Button
              size="lg"
              variant="outline"
              className="h-20 sm:h-24 text-base sm:text-lg flex-col sm:flex-row"
              onClick={() => navigate('/clips')}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-center">Meus Clips</span>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="h-20 sm:h-24 text-base sm:text-lg flex-col sm:flex-row"
              onClick={() => navigate('/analytics')}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-center">Analytics</span>
            </Button>
          </div>
        </Card>

        {/* COMENTADO: Galeria agora está integrada acima */}
        {/* <VideoGallery className="mb-8" /> */}

        {/* Clips Recentes ou Call to Action */}
        {recentClips.length > 0 ? (
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Clips Recentes
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/clips')}
              >
                Ver Todos
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentClips.map((clip) => (
                <div key={clip.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-900 relative">
                    {clip.thumbnail ? (
                      <video 
                        src={clip.thumbnail}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        muted
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {clip.format}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 truncate">
                      {clip.title}
                    </h3>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>👀 {clip.views}</span>
                      <span>❤️ {clip.likes}</span>
                      <span>{clip.engagement}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Crie seu primeiro clip viral!
              </h3>
              <p className="text-gray-600 mb-6">
                Faça upload de um vídeo e nossa IA criará clips otimizados para TikTok, Instagram Reels e YouTube Shorts.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/upload')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                🚀 Começar Agora
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
} 