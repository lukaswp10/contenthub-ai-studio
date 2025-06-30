import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { LandingPage } from '@/pages/landing/LandingPage'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    }
  }
}))

// Helper para renderizar com router e AuthProvider
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <Router>
      <AuthProvider>
        {component}
      </AuthProvider>
    </Router>
  )
}

describe.skip('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render landing page with header', () => {
      renderWithRouter(<LandingPage />)
      
      // Header deve estar presente - usando getAllByText já que há múltiplas instâncias
      const clipsForgeTexts = screen.getAllByText('ClipsForge Pro')
      expect(clipsForgeTexts.length).toBeGreaterThan(0)
      
      // Botões de navegação no header
      expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument()
      const registerLinks = screen.getAllByRole('link', { name: /começar grátis/i })
      expect(registerLinks.length).toBeGreaterThan(0)
    })

    it('should have hero section', () => {
      renderWithRouter(<LandingPage />)
      
      // Título principal - texto pode estar separado
      expect(screen.getByText(/transforme vídeos em/i)).toBeInTheDocument()
      expect(screen.getByText('Clips Virais')).toBeInTheDocument()
      
      // Descrição
      expect(screen.getByText(/plataforma revolucionária que utiliza ia/i)).toBeInTheDocument()
    })

    it('should have call-to-action buttons', () => {
      renderWithRouter(<LandingPage />)
      
      // Botões CTA principais
      expect(screen.getByRole('link', { name: /🚀 começar grátis/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🎥 ver demo/i })).toBeInTheDocument()
    })

    it('should display statistics section', () => {
      renderWithRouter(<LandingPage />)
      
      // Stats numéricas
      expect(screen.getByText('30+')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('5x')).toBeInTheDocument()
      
      // Descrições dos stats
      expect(screen.getByText('Clips por mês grátis')).toBeInTheDocument()
      expect(screen.getByText('Precisão da IA')).toBeInTheDocument()
      expect(screen.getByText('Mais engajamento')).toBeInTheDocument()
    })
  })

  describe('Features Section', () => {
    it('should display features section title', () => {
      renderWithRouter(<LandingPage />)
      
      expect(screen.getByText('Por que escolher o ClipsForge Pro?')).toBeInTheDocument()
      expect(screen.getByText(/nossa ia avançada identifica/i)).toBeInTheDocument()
    })

    it('should display all feature cards', () => {
      renderWithRouter(<LandingPage />)
      
      // Feature 1 - IA
      expect(screen.getByText('IA Avançada')).toBeInTheDocument()
      expect(screen.getByText(/algoritmos de última geração/i)).toBeInTheDocument()
      
      // Feature 2 - Velocidade
      expect(screen.getByText('Processamento Rápido')).toBeInTheDocument()
      expect(screen.getByText(/transforme horas de vídeo/i)).toBeInTheDocument()
      
      // Feature 3 - Multi-plataforma
      expect(screen.getByText('Multi-Plataforma')).toBeInTheDocument()
      expect(screen.getByText(/clips otimizados automaticamente/i)).toBeInTheDocument()
    })

    it('should have feature emojis', () => {
      renderWithRouter(<LandingPage />)
      
      expect(screen.getByText('🤖')).toBeInTheDocument()
      expect(screen.getByText('⚡')).toBeInTheDocument()
      expect(screen.getByText('📱')).toBeInTheDocument()
    })
  })

  describe('Final CTA Section', () => {
    it('should display final call-to-action', () => {
      renderWithRouter(<LandingPage />)
      
      expect(screen.getByText('Pronto para criar clips virais?')).toBeInTheDocument()
      expect(screen.getByText(/junte-se a milhares de criadores/i)).toBeInTheDocument()
      
      // Botão CTA final
      expect(screen.getByRole('link', { name: /🚀 começar agora - é grátis!/i })).toBeInTheDocument()
    })

    it('should have gradient background styling', () => {
      renderWithRouter(<LandingPage />)
      
      const ctaSection = document.querySelector('.bg-gradient-to-r.from-blue-600.to-purple-600')
      expect(ctaSection).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('should display footer content', () => {
      renderWithRouter(<LandingPage />)
      
      // Múltiplas instâncias do texto "ClipsForge Pro"
      const clipsForgeTexts = screen.getAllByText('ClipsForge Pro')
      expect(clipsForgeTexts.length).toBeGreaterThan(0)
      
      expect(screen.getByText(/transformando vídeos em clips virais/i)).toBeInTheDocument()
      expect(screen.getByText(/© 2024 ClipsForge Pro/i)).toBeInTheDocument()
    })

    it('should have proper footer styling', () => {
      renderWithRouter(<LandingPage />)
      
      const footer = document.querySelector('footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('bg-gray-900', 'text-white')
    })
  })

  describe('Navigation Links', () => {
    it('should have correct links to auth pages', () => {
      renderWithRouter(<LandingPage />)
      
      // Links no header
      const headerLoginLink = screen.getByRole('link', { name: /entrar/i })
      const headerRegisterLinks = screen.getAllByRole('link', { name: /começar grátis/i })
      
      expect(headerLoginLink).toHaveAttribute('href', '/login')
      expect(headerRegisterLinks[0]).toHaveAttribute('href', '/register')
      
      // Links nos CTAs
      const ctaButtons = screen.getAllByRole('link', { name: /começar/i })
      ctaButtons.forEach(button => {
        expect(button).toHaveAttribute('href', '/register')
      })
    })

    it('should have accessible navigation', () => {
      renderWithRouter(<LandingPage />)
      
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      
      // Todos os links devem ter href
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive layout classes', () => {
      renderWithRouter(<LandingPage />)
      
      // Container principal
      const mainContainer = document.querySelector('.max-w-7xl')
      expect(mainContainer).toBeInTheDocument()
      
      // Grid de features responsivo
      const featuresGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3')
      expect(featuresGrid).toBeInTheDocument()
    })

    it('should have responsive text sizes', () => {
      renderWithRouter(<LandingPage />)
      
      // Título responsivo
      const heroTitle = document.querySelector('.text-5xl.lg\\:text-7xl')
      expect(heroTitle).toBeInTheDocument()
      
      // Subtítulo responsivo
      const heroSubtitle = document.querySelector('.text-xl.lg\\:text-2xl')
      expect(heroSubtitle).toBeInTheDocument()
    })

    it('should have responsive spacing', () => {
      renderWithRouter(<LandingPage />)
      
      // Padding responsivo
      const sections = document.querySelectorAll('.px-4.sm\\:px-6.lg\\:px-8')
      expect(sections.length).toBeGreaterThan(0)
    })
  })

  describe('Visual Design', () => {
    it('should have gradient backgrounds', () => {
      renderWithRouter(<LandingPage />)
      
      // Background geral
      const pageBackground = document.querySelector('.bg-gradient-to-br.from-blue-50')
      expect(pageBackground).toBeInTheDocument()
      
      // Header com backdrop blur
      const header = document.querySelector('.bg-white\\/80.backdrop-blur-sm')
      expect(header).toBeInTheDocument()
    })

    it('should have proper brand colors', () => {
      renderWithRouter(<LandingPage />)
      
      // Gradient de texto do título
      const brandText = document.querySelector('.bg-gradient-to-r.from-blue-600.to-purple-600.bg-clip-text')
      expect(brandText).toBeInTheDocument()
    })

    it('should have card styling', () => {
      renderWithRouter(<LandingPage />)
      
      // Cards com hover effect
      const hoverCards = document.querySelectorAll('.hover\\:shadow-lg')
      expect(hoverCards.length).toBe(3) // 3 feature cards
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<LandingPage />)
      
      // H1 principal - existem 2 H1 na página
      const mainHeadings = screen.getAllByRole('heading', { level: 1 })
      expect(mainHeadings.length).toBe(2) // Header + Hero
      
      // Verificar que um dos H1 contém o texto do hero
      const heroHeading = mainHeadings.find(heading => 
        heading.textContent?.includes('Transforme Vídeos em')
      )
      expect(heroHeading).toBeDefined()
      
      // H2 seções
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(sectionHeadings.length).toBeGreaterThan(0)
      
      // H3 features
      const featureHeadings = screen.getAllByRole('heading', { level: 3 })
      expect(featureHeadings.length).toBe(4) // 3 features + footer title
    })

    it('should have semantic structure', () => {
      renderWithRouter(<LandingPage />)
      
      // Header, main, footer
      expect(document.querySelector('header')).toBeInTheDocument()
      expect(document.querySelector('section')).toBeInTheDocument()
      expect(document.querySelector('footer')).toBeInTheDocument()
      
      // Sections
      const sections = document.querySelectorAll('section')
      expect(sections.length).toBeGreaterThan(0)
    })

    it('should have button interactions', () => {
      renderWithRouter(<LandingPage />)
      
      const buttons = screen.getAllByRole('button')
      const links = screen.getAllByRole('link')
      
      expect(buttons.length).toBeGreaterThan(0)
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('Content Quality', () => {
    it('should have compelling copy', () => {
      renderWithRouter(<LandingPage />)
      
      // Value propositions - textos podem estar em elementos separados
      expect(screen.getByText(/transforme vídeos em/i)).toBeInTheDocument()
      expect(screen.getByText('Clips Virais')).toBeInTheDocument()
      expect(screen.getByText(/maximize seu engajamento automaticamente/i)).toBeInTheDocument()
      expect(screen.getByText(/tiktok, instagram reels, youtube shorts/i)).toBeInTheDocument()
    })

    it('should have clear benefits', () => {
      renderWithRouter(<LandingPage />)
      
      // Benefits específicos
      expect(screen.getByText(/identificam automaticamente os momentos mais envolventes/i)).toBeInTheDocument()
      expect(screen.getByText(/em questão de minutos, não de horas/i)).toBeInTheDocument()
      expect(screen.getByText(/otimizados automaticamente para/i)).toBeInTheDocument()
    })

    it('should have social proof elements', () => {
      renderWithRouter(<LandingPage />)
      
      // Números de credibilidade
      expect(screen.getByText('30+')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('5x')).toBeInTheDocument()
      
      // Testimonial implícito
      expect(screen.getByText(/milhares de criadores/i)).toBeInTheDocument()
    })
  })
}) 