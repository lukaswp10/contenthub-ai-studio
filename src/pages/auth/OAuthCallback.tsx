import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { LoaderCircle, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processando autorização...')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get URL parameters
        const profileKey = searchParams.get('profileKey')
        const platform = searchParams.get('platform')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`Erro de autorização: ${error}`)
        }

        if (!profileKey || !platform) {
          throw new Error('Parâmetros de autorização inválidos')
        }

        setMessage('Verificando conexão...')

        // Call complete-oauth function
        const { data, error: oauthError } = await supabase.functions.invoke('complete-oauth', {
          body: {
            profile_key: profileKey,
            platform: platform,
          },
        })

        if (oauthError) throw oauthError

        if (data.success) {
          setStatus('success')
          setMessage(`${platform} conectado com sucesso!`)
          
          toast({
            title: "Sucesso",
            description: `Conta ${platform} conectada com sucesso!`
          })

          // Redirect back to automation page after 2 seconds
          setTimeout(() => {
            navigate('/automation')
          }, 2000)
        } else {
          throw new Error(data.error || 'Falha na conexão')
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Erro ao processar autorização')
        
        toast({
          title: "Erro",
          description: error.message || 'Erro ao processar autorização',
          variant: "destructive"
        })

        // Redirect back to automation page after 3 seconds
        setTimeout(() => {
          navigate('/automation')
        }, 3000)
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          {status === 'loading' && (
            <LoaderCircle className="h-12 w-12 animate-spin text-primary mx-auto" />
          )}
          
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          )}
          
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          )}

          <div>
            <h2 className="text-xl font-semibold mb-2">
              {status === 'loading' && 'Processando...'}
              {status === 'success' && 'Autorização Concluída'}
              {status === 'error' && 'Erro na Autorização'}
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>

          {status !== 'loading' && (
            <p className="text-sm text-gray-500">
              Redirecionando automaticamente...
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 