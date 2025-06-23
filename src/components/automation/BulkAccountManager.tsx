import { useState } from 'react'
import { SocialAccount, PLATFORMS } from '@/types/social'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
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
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface BulkAccountManagerProps {
  accounts: SocialAccount[]
  onUpdate: () => void
}

export function BulkAccountManager({ accounts, onUpdate }: BulkAccountManagerProps) {
  const { toast } = useToast()
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(accounts.map(acc => acc.id))
    }
  }

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleBulkAction = async (action: string) => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma conta",
        variant: "destructive"
      })
      return
    }

    setBulkAction(action)
  }

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedAccounts.length === 0) return

    setIsProcessing(true)
    try {
      let updateData: any = {}
      
      switch (bulkAction) {
        case 'enable_auto_posting':
          updateData = { auto_posting_enabled: true }
          break
        case 'disable_auto_posting':
          updateData = { auto_posting_enabled: false }
          break
        case 'activate':
          updateData = { is_active: true }
          break
        case 'deactivate':
          updateData = { is_active: false }
          break
        case 'refresh':
          // Refresh each account individually
          for (const accountId of selectedAccounts) {
            await supabase.functions.invoke('refresh-social-account', {
              body: { account_id: accountId }
            })
          }
          break
        case 'delete':
          // Delete selected accounts
          await supabase
            .from('social_accounts')
            .delete()
            .in('id', selectedAccounts)
          break
      }

      if (bulkAction !== 'refresh' && bulkAction !== 'delete') {
        await supabase
          .from('social_accounts')
          .update(updateData)
          .in('id', selectedAccounts)
      }

      const actionLabels = {
        enable_auto_posting: 'Auto-posting ativado',
        disable_auto_posting: 'Auto-posting desativado',
        activate: 'Contas ativadas',
        deactivate: 'Contas desativadas',
        refresh: 'Conexões atualizadas',
        delete: 'Contas removidas'
      }

      toast({
        title: "Sucesso",
        description: `${actionLabels[bulkAction as keyof typeof actionLabels]} para ${selectedAccounts.length} conta(s)`
      })

      setSelectedAccounts([])
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao executar ação em massa",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setBulkAction(null)
    }
  }

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

  // Calculate bulk analytics
  const selectedAccountsData = accounts.filter(acc => selectedAccounts.includes(acc.id))
  const totalFollowers = selectedAccountsData.reduce((sum, acc) => sum + (acc.total_followers || 0), 0)
  const activeAccounts = selectedAccountsData.filter(acc => acc.connection_status === 'connected').length
  const errorAccounts = selectedAccountsData.filter(acc => acc.connection_status === 'error').length
  const avgEngagement = selectedAccountsData.length > 0 
    ? selectedAccountsData.reduce((sum, acc) => sum + (acc.engagement_rate || 0), 0) / selectedAccountsData.length 
    : 0

  return (
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      <div className="bg-muted rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedAccounts.length === accounts.length && accounts.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedAccounts.length} de {accounts.length} selecionadas
            </span>
          </div>

          {selectedAccounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('enable_auto_posting')}
                disabled={isProcessing}
                className="text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Ativar Auto-posting</span>
                <span className="sm:hidden">Ativar</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('disable_auto_posting')}
                disabled={isProcessing}
                className="text-xs"
              >
                <Pause className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Desativar Auto-posting</span>
                <span className="sm:hidden">Desativar</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('refresh')}
                disabled={isProcessing}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Atualizar</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction('delete')}
                disabled={isProcessing}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Remover</span>
                <span className="sm:hidden">Del</span>
              </Button>
            </div>
          )}
        </div>

        {/* Selected accounts analytics */}
        {selectedAccounts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-background rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <Users className="h-3 w-3" />
                <span className="text-xs font-medium">{activeAccounts}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {totalFollowers > 1000000 
                    ? `${(totalFollowers / 1000000).toFixed(1)}M`
                    : totalFollowers > 1000 
                      ? `${(totalFollowers / 1000).toFixed(1)}K`
                      : totalFollowers.toLocaleString()
                  }
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                <BarChart3 className="h-3 w-3" />
                <span className="text-xs font-medium">{avgEngagement.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Engajamento</p>
            </div>
            
            {errorAccounts > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs font-medium">{errorAccounts}</span>
                </div>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accounts List */}
      <div className="space-y-2">
        {accounts.map(account => {
          const platform = PLATFORMS[account.platform]
          
          return (
            <div
              key={account.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border transition-colors ${
                selectedAccounts.includes(account.id) 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-card'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Checkbox
                  checked={selectedAccounts.includes(account.id)}
                  onCheckedChange={() => handleSelectAccount(account.id)}
                />

                {/* Platform Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: platform.color }}
                >
                  {platform.icon}
                </div>

                {/* Account Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">@{account.username}</h4>
                    {getStatusIcon(account.connection_status)}
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(account.connection_status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {account.display_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{account.total_followers?.toLocaleString() || 0} seguidores</span>
                    <span>{account.posts_today || 0} posts hoje</span>
                    <span>{account.engagement_rate?.toFixed(1) || 0}% engajamento</span>
                  </div>
                </div>
              </div>

              {/* Auto-posting Toggle */}
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden sm:inline">Auto-posting</span>
                <Switch
                  checked={account.auto_posting_enabled}
                  onCheckedChange={async () => {
                    try {
                      await supabase
                        .from('social_accounts')
                        .update({ 
                          auto_posting_enabled: !account.auto_posting_enabled,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', account.id)
                      onUpdate()
                    } catch (error) {
                      toast({
                        title: "Erro",
                        description: "Erro ao atualizar configuração",
                        variant: "destructive"
                      })
                    }
                  }}
                />
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar Conexão
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'delete' && (
                `Tem certeza que deseja remover ${selectedAccounts.length} conta(s)? Esta ação não pode ser desfeita.`
              )}
              {bulkAction === 'enable_auto_posting' && (
                `Ativar auto-posting para ${selectedAccounts.length} conta(s)?`
              )}
              {bulkAction === 'disable_auto_posting' && (
                `Desativar auto-posting para ${selectedAccounts.length} conta(s)?`
              )}
              {bulkAction === 'activate' && (
                `Ativar ${selectedAccounts.length} conta(s)?`
              )}
              {bulkAction === 'deactivate' && (
                `Desativar ${selectedAccounts.length} conta(s)?`
              )}
              {bulkAction === 'refresh' && (
                `Atualizar conexão de ${selectedAccounts.length} conta(s)?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkAction}
              disabled={isProcessing}
              className={bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 