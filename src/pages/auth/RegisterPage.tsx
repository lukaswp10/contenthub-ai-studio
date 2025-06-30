import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { Header } from '@/components/layout/Header'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres'
    }
    if (!/[A-Z]/.test(password)) {
      return 'A senha deve conter pelo menos uma letra maiúscula'
    }
    if (!/[a-z]/.test(password)) {
      return 'A senha deve conter pelo menos uma letra minúscula'
    }
    if (!/[0-9]/.test(password)) {
      return 'A senha deve conter pelo menos um número'
    }
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      await signUp(formData.email, formData.password, formData.fullName)
      setSuccess(true)
    } catch (err: any) {
      if (err.message?.includes('User already registered')) {
        setError('Este email já está cadastrado')
      } else if (err.message?.includes('Invalid email')) {
        setError('Email inválido')
      } else {
        setError('Ocorreu um erro ao criar sua conta. Tente novamente.')
      }
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
          <Card className="max-w-md w-full p-6 sm:p-8 text-center">
            <div className="mb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Conta criada com sucesso!
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Enviamos um email de confirmação para <strong className="break-all">{formData.email}</strong>.
              Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Ir para Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Criar uma conta gratuita
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="João Silva"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 8 caracteres, com letras maiúsculas, minúsculas e números
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar senha
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !formData.fullName || !formData.email || !formData.password || !formData.confirmPassword}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta gratuita'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Ao criar uma conta, você concorda com nossos{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Termos de Uso
                </a>{' '}
                e{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 