import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'

export const DashboardPage: React.FC = () => {
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
      {/* Header com navegação para home */}
      <Header 
        userEmail={user?.email} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao ClipsForge Pro! 🎉
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Este é seu dashboard. Em breve você poderá criar clips virais aqui.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Créditos Disponíveis
              </h3>
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">30</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              de 30 clips mensais
            </p>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Vídeos Processados
              </h3>
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              este mês
            </p>
          </Card>

          <Card className="p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Clips Criados
              </h3>
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              total
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 sm:p-8 mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Button
              size="lg"
              className="h-20 sm:h-24 text-base sm:text-lg flex-col sm:flex-row"
              onClick={() => navigate('/upload')}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-center">Upload de Vídeo</span>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="h-20 sm:h-24 text-base sm:text-lg flex-col sm:flex-row"
              onClick={() => navigate('/clips')}
              disabled
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-center">Meus Clips</span>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="h-20 sm:h-24 text-base sm:text-lg flex-col sm:flex-row sm:col-span-2 lg:col-span-1"
              onClick={() => navigate('/analytics')}
              disabled
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-center">Analytics</span>
            </Button>
          </div>
        </Card>

        {/* User Info Card */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Informações da Conta
          </h3>
          <dl className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-sm text-gray-500">Email:</dt>
              <dd className="text-sm text-gray-900 break-all">{user?.email}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-sm text-gray-500">ID do Usuário:</dt>
              <dd className="text-sm text-gray-900 font-mono break-all">{user?.id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-sm text-gray-500">Plano:</dt>
              <dd className="text-sm text-gray-900">Gratuito</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-sm text-gray-500">Membro desde:</dt>
              <dd className="text-sm text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </dd>
            </div>
          </dl>
        </Card>
      </main>
    </div>
  )
} 