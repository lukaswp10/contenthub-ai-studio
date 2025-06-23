
import { useState } from 'react'
import { SocialAccount, PLATFORMS } from '@/types/social'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  MoreVertical, 
  Settings, 
  RefreshCw, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Zap
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

interface ConnectedAccountsListProps {
  accounts: SocialAccount[]
  onUpdate: () => void
}

export function ConnectedAccountsList({ accounts, onUpdate }: ConnectedAccountsListProps) {
  const { toast } = useToast()
  const [disconnectingAccount, setDisconnectingAccount] = useState<string | null>(null)
  const [updatingAccount, setUpdatingAccount] = useState<string | null>(null)

  const getStatusIcon = (status: SocialAccount['connection_status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'error':
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'rate_limited':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: SocialAccount['connection_status']) => {
    const labels = {
      connected: 'Conectado',
      expired: 'Expirado',
      error: 'Erro',
      disconnected: 'Desconectado',
      rate_limited: 'Limite atingido',
    }
    return labels[status] || status
  }

  const handleToggleAutoPosting = async (account: SocialAccount) => {
    try {
      setUpdatingAccount(account.id)
      
      const { error } = await supabase
        .from('social_accounts')
        .update({ 
          auto_posting_enabled: !account.auto_posting_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: account.auto_posting_enabled 
          ? 'Auto-posting desativado' 
          : 'Auto-posting ativado'
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração",
        variant: "destructive"
      })
    } finally {
      setUpdatingAccount(null)
    }
  }

  const handleRefreshConnection = async (account: SocialAccount) => {
    try {
      setUpdatingAccount(account.id)
      
      const { data, error } = await supabase.functions.invoke('refresh-social-account', {
        body: { account_id: account.id }
      })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Conexão atualizada com sucesso"
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar conexão",
        variant: "destructive"
      })
    } finally {
      setUpdatingAccount(null)
    }
  }

  const handleDisconnect = async () => {
    if (!disconnectingAccount) return

    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', disconnectingAccount)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Conta desconectada com sucesso"
      })
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao desconectar conta",
        variant: "destructive"
      })
    } finally {
      setDisconnectingAccount(null)
    }
  }

  // Group accounts by platform
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.platform]) {
      acc[account.platform] = []
    }
    acc[account.platform].push(account)
    return acc
  }, {} as Record<string, SocialAccount[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedAccounts).map(([platformId, platformAccounts]) => {
        const platform = PLATFORMS[platformId]
        
        return (
          <div key={platformId} className="space-y-3">
            {/* Platform header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-white text-sm"
                style={{ background: platform.color }}
              >
                {platform.icon}
              </div>
              <h3 className="font-medium">{platform.name}</h3>
              <Badge variant="secondary" className="ml-auto">
                {platformAccounts.length} {platformAccounts.length === 1 ? 'conta' : 'contas'}
              </Badge>
            </div>

            {/* Accounts list */}
            {platformAccounts.map(account => (
              <div
                key={account.id}
                className="bg-card rounded-lg border p-4 space-y-3"
              >
                {/* Account header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={account.avatar_url || `https://ui-avatars.com/api/?name=${account.username}&size=40`}
                      alt={account.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{account.display_name}</p>
                        {account.verified && (
                          <Badge variant="secondary" className="text-xs px-1">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{account.username}</p>
                    </div>
                  </div>

                  {/* Actions menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRefreshConnection(account)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar conexão
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDisconnectingAccount(account.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Desconectar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status and info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {/* Connection status */}
                    <div className="flex items-center gap-1">
                      {getStatusIcon(account.connection_status)}
                      <span className="text-muted-foreground">
                        {getStatusLabel(account.connection_status)}
                      </span>
                    </div>

                    {/* Stats */}
                    <span className="text-muted-foreground">
                      {account.total_followers.toLocaleString()} seguidores
                    </span>
                    
                    {/* Last post */}
                    {account.last_posted_at && (
                      <span className="text-muted-foreground">
                        Último post {formatDistanceToNow(new Date(account.last_posted_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    )}
                  </div>

                  {/* Auto posting toggle */}
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Auto-posting</span>
                    <Switch
                      checked={account.auto_posting_enabled}
                      onCheckedChange={() => handleToggleAutoPosting(account)}
                      disabled={updatingAccount === account.id}
                    />
                  </div>
                </div>

                {/* Posting schedule */}
                {account.auto_posting_enabled && account.posting_schedule.enabled && (
                  <div className="bg-muted rounded p-3 text-sm">
                    <p className="text-muted-foreground mb-1">Horários de postagem:</p>
                    <div className="flex flex-wrap gap-2">
                      {account.posting_schedule.times.map(time => (
                        <Badge key={time} variant="secondary">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {account.last_error_message && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {account.last_error_message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        )
      })}

      {/* Disconnect confirmation */}
      <AlertDialog 
        open={!!disconnectingAccount} 
        onOpenChange={() => setDisconnectingAccount(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a conta e todos os posts agendados para ela.
              Você precisará reconectar para postar novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700"
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
