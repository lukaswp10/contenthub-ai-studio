import { useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export function ConfirmEmailPage() {
  const location = useLocation()
  const email = location.state?.email || 'seu email'

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Verifique seu email</h2>
          
          <p className="text-gray-600 mb-6">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Clique no link para ativar sua conta.
          </p>

          <div className="space-y-4">
            <Button asChild className="w-full">
              <a href="https://gmail.com" target="_blank" rel="noopener noreferrer">
                Abrir Gmail
              </a>
            </Button>

            <p className="text-sm text-gray-500">
              Não recebeu o email?{' '}
              <button className="text-primary hover:underline">
                Reenviar
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-600">
          Já confirmou seu email?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}