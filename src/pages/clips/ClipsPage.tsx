import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const ClipsPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação consistente */}
      <Header 
        userEmail={user?.email} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
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

        {/* Empty State */}
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
            disabled
          >
            Criar Primeiro Clip - Em Breve
          </Button>
        </Card>

        {/* Future Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 opacity-60">
            <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Clip Viral #1</h3>
            <p className="text-sm text-gray-600 mb-3">Duração: 30s • TikTok Format</p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" disabled>Editar</Button>
              <Button size="sm" variant="outline" disabled>Download</Button>
            </div>
          </Card>

          <Card className="p-6 opacity-60">
            <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Clip Viral #2</h3>
            <p className="text-sm text-gray-600 mb-3">Duração: 60s • Instagram Reels</p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" disabled>Editar</Button>
              <Button size="sm" variant="outline" disabled>Download</Button>
            </div>
          </Card>

          <Card className="p-6 opacity-60">
            <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Clip Viral #3</h3>
            <p className="text-sm text-gray-600 mb-3">Duração: 15s • YouTube Shorts</p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" disabled>Editar</Button>
              <Button size="sm" variant="outline" disabled>Download</Button>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📹 Novo Upload
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Faça upload de um novo vídeo
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
              Acompanhe performance dos clips
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