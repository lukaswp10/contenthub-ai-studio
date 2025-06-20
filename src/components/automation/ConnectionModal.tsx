import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'
import { SocialPlatform } from '@/types/social'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface ConnectionModalProps {
  platform: SocialPlatform
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ConnectionModal({
  platform,
  isOpen,
  onClose,
  onSuccess,
}: ConnectionModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [step, setStep] = useState<'info' | 'connecting' | 'success'>('info')
  const [accountInfo, setAccountInfo] = useState<any>(null)

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setStep('connecting')

      // Call Ayrshare to initiate OAuth
      const { data, error } = await supabase.functions.invoke('connect-social-account', {
        body: {
          platform: platform.id,
          redirect_url: window.location.href,
        },
      })

      if (error) throw error

      // For demo purposes, simulate OAuth flow
      // In production, this would redirect to OAuth provider
      if (data.oauth_url) {
        // Open OAuth in popup
        const width = 600
        const height = 700
        const left = window.innerWidth / 2 - width / 2
        const top = window.innerHeight / 2 - height / 2
        
        const popup = window.open(
          data.oauth_url,
          'oauth-popup',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        // Listen for OAuth callback
        const checkInterval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkInterval)
            checkOAuthResult()
          }
        }, 1000)
      } else {
        // Simulate successful connection for demo
        setTimeout(() => {
          simulateSuccessfulConnection()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Connection error:', error)
      toast({
        title: "Erro",
        description: error.message || 'Erro ao conectar conta',
        variant: "destructive"
      })
      setStep('info')
      setIsConnecting(false)
    }
  }

  const checkOAuthResult = async () => {
    try {
      // Check if account was connected
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('platform', platform.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setAccountInfo(data)
        setStep('success')
        setTimeout(() => {
          onSuccess()
          toast({
            title: "Sucesso",
            description: `${platform.name} conectado com sucesso!`
          })
        }, 1500)
      } else {
        throw new Error('Falha na conexão')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar conexão",
        variant: "destructive"
      })
      setStep('info')
      setIsConnecting(false)
    }
  }

  const simulateSuccessfulConnection = () => {
    // For demo purposes
    setAccountInfo({
      username: 'demo_user',
      display_name: 'Demo User',
      followers: 1234,
    })
    setStep('success')
    setTimeout(() => {
      onSuccess()
      toast({
        title: "Sucesso",
        description: `${platform.name} conectado com sucesso!`
      })
    }, 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ background: platform.bgGradient || platform.color }}
            >
              <span className="text-xl">{platform.icon}</span>
            </div>
            Conectar {platform.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'info' && (
            <>
              {/* What we'll do */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">O que vamos fazer:</h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Conectar sua conta {platform.name} com segurança</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Obter permissão para postar em seu nome</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Configurar horários otimizados automaticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Você sempre aprova antes de qualquer post</span>
                  </li>
                </ul>
              </div>

              {/* Security info */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Segurança:</strong> Usamos OAuth 2.0, o padrão da indústria. 
                  Nunca pedimos ou armazenamos sua senha do {platform.name}.
                </AlertDescription>
              </Alert>

              {/* Features */}
              <div>
                <h4 className="font-medium mb-3">Recursos disponíveis:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {platform.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connect button */}
              <Button
                onClick={handleConnect}
                className="w-full"
                size="lg"
                disabled={isConnecting}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Conectar {platform.name}
              </Button>
            </>
          )}

          {step === 'connecting' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Conectando ao {platform.name}...
              </h3>
              <p className="text-muted-foreground">
                Uma nova janela foi aberta. Complete o login no {platform.name}.
              </p>
            </div>
          )}

          {step === 'success' && accountInfo && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Conta conectada com sucesso!
              </h3>
              <div className="bg-muted rounded-lg p-4 mt-4">
                <div className="flex items-center gap-3">
                  <img
                    src={accountInfo.avatar_url || `https://ui-avatars.com/api/?name=${accountInfo.username}`}
                    alt={accountInfo.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="text-left">
                    <p className="font-medium">{accountInfo.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{accountInfo.username}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}