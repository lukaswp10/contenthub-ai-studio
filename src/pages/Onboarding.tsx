import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function Onboarding() {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()

  const handleCompleteOnboarding = async () => {
    try {
      await updateProfile({ onboarding_completed: true })
      navigate('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  // Auto-complete if already completed
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate('/dashboard')
    }
  }, [profile, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl">Bem-vindo ao ClipsForge!</CardTitle>
          <p className="text-gray-600 mt-2">
            Sua conta foi criada com sucesso. Vamos começar!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">O que você pode fazer agora:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Fazer upload do seu primeiro vídeo</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Conectar suas redes sociais</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Configurar posting automático</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Ver analytics dos seus clips</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCompleteOnboarding}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="lg"
          >
            Começar a Usar ClipsForge
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}