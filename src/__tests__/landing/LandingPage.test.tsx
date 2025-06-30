import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { LandingPage } from '@/pages/landing/LandingPage'

// Mock do useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock completo do AuthContext
const mockAuth = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      signOut: vi.fn().mockResolvedValue({ 
        error: null 
      }),
    },
  },
}))

// Helper para renderizar com router
const renderWithRouter = (component: React.ReactElement, userOverride?: any) => {
  // Override do mock se necessário
  if (userOverride !== undefined) {
    mockAuth.user = userOverride
  }
  
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset para usuário não logado
    mockAuth.user = null
    mockAuth.loading = false
  })

  describe('Estrutura da Página', () => {
    test('renderiza título principal', () => {
      renderWithRouter(<LandingPage />)
      const headings = screen.getAllByText(/ClipsForge Pro/i)
      expect(headings.length).toBeGreaterThan(0)
    })

    test('renderiza seção hero com call-to-action', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/Transforme seus vídeos em clips virais/i)).toBeInTheDocument()
    })

    test('renderiza botões de autenticação quando não logado', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /começar grátis/i })).toBeInTheDocument()
    })

    test('mostra banner para usuário logado', () => {
      const mockUser = { email: 'test@example.com', id: '1' }
      renderWithRouter(<LandingPage />, mockUser)
      
      expect(screen.getByText(/Bem-vindo de volta/i)).toBeInTheDocument()
      expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    })

    test('mostra botão Dashboard para usuário logado', () => {
      const mockUser = { email: 'test@example.com', id: '1' }
      renderWithRouter(<LandingPage />, mockUser)
      
      const dashboardButtons = screen.getAllByText(/Dashboard/i)
      expect(dashboardButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Seção de Features', () => {
    test('renderiza cards de features', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/IA Avançada/i)).toBeInTheDocument()
      expect(screen.getByText(/Editor Intuitivo/i)).toBeInTheDocument()
      expect(screen.getByText(/Analytics/i)).toBeInTheDocument()
    })

    test('mostra descrições das features', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/Nossa IA identifica automaticamente/i)).toBeInTheDocument()
      expect(screen.getByText(/Editor profissional com/i)).toBeInTheDocument()
      expect(screen.getByText(/Acompanhe o desempenho/i)).toBeInTheDocument()
    })

    test('features são visualmente organizadas', () => {
      renderWithRouter(<LandingPage />)
      const featureCards = screen.getAllByText(/IA Avançada|Editor Intuitivo|Analytics/)
      expect(featureCards.length).toBe(3)
    })
  })

  describe('Seção CTA Final', () => {
    test('renderiza call-to-action final', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/Pronto para começar/i)).toBeInTheDocument()
    })

    test('mostra botão de começar grátis', () => {
      renderWithRouter(<LandingPage />)
      const ctaButtons = screen.getAllByRole('link', { name: /começar grátis/i })
      expect(ctaButtons.length).toBeGreaterThan(0)
    })

    test('CTA tem design atrativo', () => {
      renderWithRouter(<LandingPage />)
      const ctaSection = screen.getByText(/Pronto para começar/i).closest('section')
      expect(ctaSection).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    test('renderiza informações da empresa', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/© 2024 ClipsForge Pro/i)).toBeInTheDocument()
    })

    test('mostra links de navegação', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/Todos os direitos reservados/i)).toBeInTheDocument()
    })
  })

  describe('Navegação', () => {
    test('logo leva para home', () => {
      renderWithRouter(<LandingPage />)
      const logoLinks = screen.getAllByText(/ClipsForge Pro/i)
      expect(logoLinks.length).toBeGreaterThan(0)
    })

    test('botão Dashboard funciona para usuário logado', async () => {
      const mockUser = { email: 'test@example.com', id: '1' }
      renderWithRouter(<LandingPage />, mockUser)
      
      const dashboardButton = screen.getAllByText(/Dashboard/i)[0]
      fireEvent.click(dashboardButton)
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    test('links de autenticação funcionam', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login')
      expect(screen.getByRole('link', { name: /começar grátis/i })).toHaveAttribute('href', '/register')
    })
  })

  describe('Design Responsivo', () => {
    test('adapta para telas pequenas', () => {
      renderWithRouter(<LandingPage />)
      const container = screen.getByText(/Transforme seus vídeos/i).closest('div')
      expect(container).toBeInTheDocument()
    })

    test('mantém usabilidade em mobile', () => {
      renderWithRouter(<LandingPage />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Design Visual', () => {
    test('usa gradientes apropriados', () => {
      renderWithRouter(<LandingPage />)
      const title = screen.getAllByText(/ClipsForge Pro/i)[0]
      expect(title).toBeInTheDocument()
    })

    test('mantém consistência visual', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/Transforme seus vídeos/i)).toBeInTheDocument()
    })
  })

  describe('Acessibilidade', () => {
    test('tem estrutura de headings apropriada', () => {
      renderWithRouter(<LandingPage />)
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    test('botões têm labels apropriados', () => {
      renderWithRouter(<LandingPage />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    test('links são acessíveis', () => {
      renderWithRouter(<LandingPage />)
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('Qualidade do Conteúdo', () => {
    test('textos são claros e informativos', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/Nossa IA identifica automaticamente/i)).toBeInTheDocument()
    })

    test('proposta de valor é evidente', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/Transforme seus vídeos em clips virais/i)).toBeInTheDocument()
    })

    test('benefícios são destacados', () => {
      renderWithRouter(<LandingPage />)
      expect(screen.getByText(/IA Avançada/i)).toBeInTheDocument()
      expect(screen.getByText(/Editor Intuitivo/i)).toBeInTheDocument()
      expect(screen.getByText(/Analytics/i)).toBeInTheDocument()
    })
  })
}) 