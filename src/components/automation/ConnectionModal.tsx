import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { SocialPlatform } from '@/types/social'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, CheckCircle } from 'lucide-react'

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
  const [oauthUrl, setOauthUrl] = useState<string | null>(null)

  const handleConnect = async () => {
    try {
      console.log('🔄 Iniciando conexão com:', platform.id)
      setIsConnecting(true)
      setStep('connecting')

      // Call Ayrshare to initiate OAuth
      console.log('📡 Chamando Edge Function connect-social-account...')
      const { data, error } = await supabase.functions.invoke('connect-social-account', {
        body: {
          platform: platform.id,
          redirect_url: `${window.location.origin}/automation`,
        },
      })

      console.log('📥 Resposta da Edge Function:', { data, error })

      if (error) {
        console.error('❌ Erro na Edge Function:', error)
        throw error
      }

      if (data.oauth_url) {
        console.log('🔗 URL de OAuth recebida:', data.oauth_url)
        setOauthUrl(data.oauth_url)
        
        // Open OAuth in popup
        const width = 600
        const height = 700
        const left = window.innerWidth / 2 - width / 2
        const top = window.innerHeight / 2 - height / 2
        
        console.log('🪟 Abrindo popup OAuth...')
        const popup = window.open(
          data.oauth_url,
          'oauth-popup',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        if (!popup) {
          console.error('❌ Popup bloqueado pelo navegador')
          throw new Error('Popup bloqueado. Permita popups para este site.')
        }

        console.log('✅ Popup aberto com sucesso')

        // Listen for OAuth callback
        const checkInterval = setInterval(() => {
          if (popup?.closed) {
            console.log('🔄 Popup fechado, verificando resultado...')
            clearInterval(checkInterval)
            checkOAuthResult(data.profile_key)
          }
        }, 1000)

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!popup?.closed) {
            console.error('⏰ Timeout - popup não foi fechado')
            popup.close()
            throw new Error('Tempo limite excedido. Tente novamente.')
          }
        }, 300000)
      } else {
        console.error('❌ URL de OAuth não foi gerada')
        throw new Error('URL de OAuth não foi gerada')
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error)
      toast({
        title: "Erro",
        description: error.message || 'Erro ao conectar conta',
        variant: "destructive"
      })
      setStep('info')
      setIsConnecting(false)
    }
  }

  const checkOAuthResult = async (profileKey: string) => {
    try {
      // Call complete-oauth function to verify connection
      const { data, error } = await supabase.functions.invoke('complete-oauth', {
        body: {
          profile_key: profileKey,
          platform: platform.id,
        },
      })

      if (error) throw error

      if (data.success) {
        setAccountInfo(data.account_data)
        setStep('success')
        setTimeout(() => {
          onSuccess()
          toast({
            title: "Sucesso",
            description: `${platform.name} conectado com sucesso!`
          })
        }, 1500)
      } else {
        throw new Error(data.error || 'Falha na conexão')
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar conexão",
        variant: "destructive"
      })
      setStep('info')
      setIsConnecting(false)
    }
  }

  const handleClose = () => {
    if (step === 'connecting') {
      toast({
        title: "Atenção",
        description: "Processo de conexão em andamento. Aguarde a conclusão.",
        variant: "destructive"
      })
      return
    }
    
    setStep('info')
    setIsConnecting(false)
    setAccountInfo(null)
    setOauthUrl(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: platform.bgGradient || platform.color }}
            >
              {platform.icon}
            </div>
            Conectar {platform.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'info' && (
            <>
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para {platform.name} para autorizar o acesso à sua conta.
              </p>
              
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">O que será acessado:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Informações básicas do perfil</li>
                  <li>• Publicar conteúdo em seu nome</li>
                  <li>• Visualizar estatísticas de engajamento</li>
                </ul>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Conectar Conta'
                )}
              </Button>
            </>
          )}

          {step === 'connecting' && (
            <div className="text-center space-y-4">
              <LoaderCircle className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div>
                <h3 className="font-medium mb-2">Conectando com {platform.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Uma nova janela foi aberta. Complete a autorização e feche a janela quando terminar.
                </p>
              </div>
              
              {oauthUrl && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Se a janela não abriu automaticamente:</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(oauthUrl, '_blank')}
                    className="w-full"
                  >
                    Abrir {platform.name} Manualmente
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="font-medium mb-2">Conta Conectada!</h3>
                {accountInfo && (
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <p><strong>@{accountInfo.username}</strong></p>
                    <p className="text-muted-foreground">
                      {accountInfo.followers?.toLocaleString() || 0} seguidores
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
