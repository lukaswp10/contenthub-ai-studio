import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const LandingPage: React.FC = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Redirecionar usuários logados para o dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se usuário logado, não renderizar (será redirecionado)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ClipsForge Pro
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8">
              Transforme Vídeos em{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Clips Virais
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto">
              Plataforma revolucionária que utiliza IA para transformar seus vídeos longos 
              em clips curtos otimizados para redes sociais. Maximize seu engajamento automaticamente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-4">
                  🚀 Começar Grátis
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                🎥 Ver Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">30+</div>
                <div className="text-gray-600">Clips por mês grátis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">95%</div>
                <div className="text-gray-600">Precisão da IA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">5x</div>
                <div className="text-gray-600">Mais engajamento</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por que escolher o ClipsForge Pro?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nossa IA avançada identifica os melhores momentos do seu vídeo e cria clips 
              otimizados para cada plataforma social.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                IA Avançada
              </h3>
              <p className="text-gray-600">
                Algoritmos de última geração que identificam automaticamente os momentos 
                mais envolventes do seu conteúdo.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Processamento Rápido
              </h3>
              <p className="text-gray-600">
                Transforme horas de vídeo em clips prontos para publicar em questão de minutos, 
                não de horas.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Multi-Plataforma
              </h3>
              <p className="text-gray-600">
                Clips otimizados automaticamente para TikTok, Instagram Reels, YouTube Shorts 
                e outras plataformas.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto para criar clips virais?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de criadores que já estão maximizando seu alcance com o ClipsForge Pro
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              🚀 Começar Agora - É Grátis!
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-bold mb-4">ClipsForge Pro</h3>
          <p className="text-gray-400 mb-8">
            Transformando vídeos em clips virais com inteligência artificial.
          </p>
          <div className="border-t border-gray-800 pt-8 text-gray-400">
            <p>&copy; 2024 ClipsForge Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 