import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  showAuthButtons?: boolean
  userEmail?: string
  onLogout?: () => void
}

export const Header: React.FC<HeaderProps> = ({ 
  showAuthButtons = false, 
  userEmail,
  onLogout 
}) => {
  // Navegação inteligente do logo
  const logoDestination = userEmail ? '/dashboard' : '/'
  const logoTitle = userEmail ? 'Ir para Dashboard' : 'Voltar para página inicial'

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Navegação inteligente */}
          <div className="flex items-center">
            <Link 
              to={logoDestination}
              className="group flex items-center space-x-2 hover:opacity-80 transition-opacity"
              title={logoTitle}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ClipsForge Pro
              </h1>
            </Link>
          </div>
          
          {/* Auth Buttons ou User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showAuthButtons ? (
              <>
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
              </>
            ) : userEmail && onLogout ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-600 max-w-32 sm:max-w-none truncate">
                  {userEmail}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                >
                  Sair
                </Button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="hidden sm:inline-flex">
                    Começar Grátis
                  </Button>
                  <Button size="sm" className="sm:hidden">
                    Registrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 