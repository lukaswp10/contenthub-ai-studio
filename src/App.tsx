import { BrowserRouter as Router } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/globals.css'

// Criar instância do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (novo nome para cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          {/* Temporary landing content */}
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient">
                ClipsForge Pro
              </h1>
              <p className="text-xl text-muted-foreground">
                Transforme vídeos em clips virais com IA
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-brand-gradient text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Começar Agora
                </button>
                <button className="border border-border px-8 py-3 rounded-lg font-medium hover:bg-accent transition-colors">
                  Ver Demo
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                <div className="glass p-6 rounded-xl text-center">
                  <div className="text-2xl mb-2">🤖</div>
                  <h3 className="font-semibold mb-2">IA Avançada</h3>
                  <p className="text-sm text-muted-foreground">
                    Análise inteligente de conteúdo
                  </p>
                </div>
                <div className="glass p-6 rounded-xl text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-semibold mb-2">Super Rápido</h3>
                  <p className="text-sm text-muted-foreground">
                    Processamento em segundos
                  </p>
                </div>
                <div className="glass p-6 rounded-xl text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-2">Viral Score</h3>
                  <p className="text-sm text-muted-foreground">
                    Predição de engajamento
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App 