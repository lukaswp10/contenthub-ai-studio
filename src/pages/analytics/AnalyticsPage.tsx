import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useClips } from '@/contexts/ClipsContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const AnalyticsPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const { clips, totalViews, totalEngagement, getClipsByFormat, loading } = useClips()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Calcular métricas
  const totalClips = clips.length
  const totalLikes = clips.reduce((sum, clip) => sum + clip.likes, 0)
  const totalShares = clips.reduce((sum, clip) => sum + clip.shares, 0)
  const avgEngagement = clips.length > 0 ? (totalEngagement).toFixed(1) : '0'
  const ctr = clips.length > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0'

  // Métricas por plataforma
  const platformStats = [
    {
      name: 'TikTok',
      clips: getClipsByFormat('TikTok'),
      icon: '🎵',
      color: 'bg-pink-100 text-pink-800'
    },
    {
      name: 'Instagram Reels',
      clips: getClipsByFormat('Instagram Reels'),
      icon: '📷',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      name: 'YouTube Shorts',
      clips: getClipsByFormat('YouTube Shorts'),
      icon: '🎬',
      color: 'bg-red-100 text-red-800'
    }
  ]

  // Top performing clips
  const topClips = [...clips]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userEmail={user?.email} onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando analytics...</span>
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
            <li className="text-gray-900 font-medium">Analytics</li>
          </ol>
        </nav>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Analytics 📊
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Acompanhe a performance dos seus clips e otimize seu conteúdo.
          </p>
        </div>

        {totalClips > 0 ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Engajamento Médio</p>
                    <p className="text-2xl font-bold text-gray-900">{avgEngagement}%</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Shares Totais</p>
                    <p className="text-2xl font-bold text-gray-900">{totalShares}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">CTR</p>
                    <p className="text-2xl font-bold text-gray-900">{ctr}%</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance por Plataforma */}
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Performance por Plataforma
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {platformStats.map((platform) => {
                  const views = platform.clips.reduce((sum, clip) => sum + clip.views, 0)
                  const engagement = platform.clips.length > 0 
                    ? platform.clips.reduce((sum, clip) => sum + clip.engagement, 0) / platform.clips.length 
                    : 0
                  
                  return (
                    <div key={platform.name} className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${platform.color}`}>
                        {platform.icon} {platform.name}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{platform.clips.length}</div>
                          <div className="text-xs text-gray-500">Clips</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-700">{views.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Views</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-700">{engagement.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">Engajamento</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Top Performing Clips */}
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Performing Clips
              </h3>
              {topClips.length > 0 ? (
                <div className="space-y-4">
                  {topClips.map((clip, index) => (
                    <div key={clip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{clip.title}</h4>
                          <p className="text-sm text-gray-500">{clip.format} • {clip.duration}s</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{clip.views.toLocaleString()} views</div>
                        <div className="text-sm text-gray-500">{clip.engagement}% engajamento</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum clip encontrado</p>
              )}
            </Card>
          </>
        ) : (
          /* Empty State */
          <Card className="p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum clip para analisar
            </h4>
            <p className="text-gray-600 mb-6">
              Crie seus primeiros clips para ver analytics detalhados aqui.
            </p>
            <Button 
              onClick={() => navigate('/upload')}
            >
              🎬 Criar Primeiro Clip
            </Button>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📹 Upload Vídeo
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Faça upload de um novo vídeo
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/upload')}
            >
              Upload
            </Button>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🎬 Ver Clips
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Visualize todos os seus clips
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/clips')}
            >
              Ver Clips
            </Button>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🏠 Dashboard
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Voltar para página principal
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </Card>
        </div>
      </main>
    </div>
  )
} 