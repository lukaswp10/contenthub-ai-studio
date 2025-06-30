import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const UploadPage: React.FC = () => {
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
            <li className="text-gray-900 font-medium">Upload</li>
          </ol>
        </nav>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Upload de Vídeo 📹
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Faça upload do seu vídeo para transformá-lo em clips virais com IA.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="p-6 sm:p-8 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload do seu vídeo
            </h3>
            <p className="text-gray-600 mb-4">
              Arraste e solte ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Formatos suportados: MP4, MOV, AVI (máx. 500MB)
            </p>
            <Button size="lg" disabled>
              Em Breve - Fase 2
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📊 Meus Clips
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Visualize todos os seus clips criados
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
              📈 Analytics
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
              Ir para Dashboard
            </Button>
          </Card>
        </div>
      </main>
    </div>
  )
} 