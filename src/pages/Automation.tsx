import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { PLATFORMS, SocialAccount } from '@/types/social'
import { PlatformCard } from '@/components/automation/PlatformCard'
import { ConnectedAccountsList } from '@/components/automation/ConnectedAccountsList'
import { BulkAccountManager } from '@/components/automation/BulkAccountManager'
import { PostingSchedule } from '@/components/automation/PostingSchedule'
import { ConnectionModal } from '@/components/automation/ConnectionModal'
import { ScheduledPostsQueue } from '@/components/automation/ScheduledPostsQueue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AppLayout from '@/components/layout/AppLayout'
import { 
  Settings, 
  Calendar, 
  BarChart3, 
  Plus,
  Sparkles,
  AlertCircle,
  Loader2,
  Users,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AutomationPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [activeTab, setActiveTab] = useState('platforms')

  // Fetch connected accounts
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['social-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(account => ({
        ...account,
        posting_schedule: typeof account.posting_schedule === 'object' && account.posting_schedule 
          ? account.posting_schedule as any
          : {
              enabled: true,
              times: ['09:00', '15:00', '21:00'],
              timezone: 'America/Sao_Paulo',
              days: [1,2,3,4,5,6,0],
              max_posts_per_day: 3,
              min_interval_minutes: 180,
              randomize_minutes: 30
            }
      })) as SocialAccount[]
    },
    enabled: !!user,
  })

  // Fetch scheduled posts
  const { data: scheduledPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['scheduled-posts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          clip:clips(*),
          social_account:social_accounts(*)
        `)
        .eq('user_id', user!.id)
        .in('status', ['scheduled', 'queued'])
        .order('scheduled_for', { ascending: true })
        .limit(50)

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // Group accounts by platform
  const accountsByPlatform = accounts.reduce((acc, account) => {
    if (!acc[account.platform]) {
      acc[account.platform] = []
    }
    acc[account.platform].push(account)
    return acc
  }, {} as Record<string, SocialAccount[]>)

  // Check if user can add more accounts
  const canAddAccount = (platformId: string) => {
    const platform = PLATFORMS[platformId]
    const currentCount = accountsByPlatform[platformId]?.length || 0
    const maxAllowed = platform.maxAccounts[profile?.plan_type || 'free']
    return currentCount < maxAllowed
  }

  // Calculate overall analytics
  const totalConnectedAccounts = accounts.length
  const activeAccounts = accounts.filter(a => a.is_active && a.connection_status === 'connected').length
  const errorAccounts = accounts.filter(a => a.connection_status === 'error').length
  const rateLimitedAccounts = accounts.filter(a => a.connection_status === 'rate_limited').length
  const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.total_followers || 0), 0)
  const avgEngagement = accounts.length > 0 
    ? accounts.reduce((sum, acc) => sum + (acc.engagement_rate || 0), 0) / accounts.length 
    : 0
  const totalPostsToday = accounts.reduce((sum, acc) => sum + (acc.posts_today || 0), 0)
  const totalPostsThisWeek = accounts.reduce((sum, acc) => sum + (acc.posts_this_week || 0), 0)

  // Open connection modal
  const handleConnectPlatform = (platformId: string) => {
    if (!canAddAccount(platformId)) {
      toast({
        title: "Limite atingido",
        description: `Limite de contas ${PLATFORMS[platformId].name} atingido para seu plano`,
        variant: "destructive"
      })
      return
    }
    setSelectedPlatform(platformId)
    setShowConnectionModal(true)
  }

  return (
    <AppLayout>
      <DndProvider backend={HTML5Backend}>
        <div className="p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Automação Social</h1>
                <p className="text-muted-foreground mt-2">
                  Conecte suas redes sociais e automatize seus posts
                </p>
              </div>
              
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="p-3">
                    <p className="text-2xl sm:text-3xl font-bold">{totalConnectedAccounts}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Contas conectadas</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-3">
                    <p className="text-2xl sm:text-3xl font-bold">{activeAccounts}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Contas ativas</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-3">
                    <p className="text-2xl sm:text-3xl font-bold">{scheduledPosts.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Posts agendados</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-3">
                    <p className="text-2xl sm:text-3xl font-bold">{totalPostsToday}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Posts hoje</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Detailed analytics */}
            {accounts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Seguidores</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {totalFollowers > 1000000 
                        ? `${(totalFollowers / 1000000).toFixed(1)}M`
                        : totalFollowers > 1000 
                          ? `${(totalFollowers / 1000).toFixed(1)}K`
                          : totalFollowers.toLocaleString()
                      }
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Engajamento</span>
                    </div>
                    <p className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Posts semana</span>
                    </div>
                    <p className="text-2xl font-bold">{totalPostsThisWeek}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Auto-posting</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {accounts.filter(a => a.auto_posting_enabled).length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Alert for free users */}
            {profile?.plan_type === 'free' && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Plano Gratuito:</strong> Você pode conectar apenas 1 conta de cada rede principal.{' '}
                  <a href="/pricing" className="text-primary hover:underline">
                    Faça upgrade
                  </a>{' '}
                  para conectar múltiplas contas e desbloquear todas as redes.
                </AlertDescription>
              </Alert>
            )}

            {/* Error accounts alert */}
            {errorAccounts > 0 && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> {errorAccounts} conta(s) com erro de conexão. 
                  Verifique as configurações ou atualize as conexões.
                </AlertDescription>
              </Alert>
            )}

            {/* Rate limited accounts alert */}
            {rateLimitedAccounts > 0 && (
              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Rate Limit:</strong> {rateLimitedAccounts} conta(s) atingiram o limite de requisições. 
                  Aguarde alguns minutos antes de tentar novamente.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full overflow-x-auto">
              <TabsTrigger value="platforms" className="flex items-center gap-2 whitespace-nowrap">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Plataformas</span>
                <span className="sm:hidden">Plataformas</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2 whitespace-nowrap">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Gerenciar Contas</span>
                <span className="sm:hidden">Contas</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2 whitespace-nowrap">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
                <span className="sm:hidden">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="queue" className="flex items-center gap-2 whitespace-nowrap">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Fila de Posts</span>
                <span className="sm:hidden">Fila</span>
              </TabsTrigger>
            </TabsList>

            {/* Platforms Tab */}
            <TabsContent value="platforms" className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Available Platforms */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Conectar Redes Sociais</h2>
                  <div className="grid gap-4">
                    {Object.values(PLATFORMS).map(platform => {
                      const connectedAccounts = accountsByPlatform[platform.id] || []
                      const maxAllowed = platform.maxAccounts[profile?.plan_type || 'free']
                      const canAdd = connectedAccounts.length < maxAllowed
                      
                      return (
                        <PlatformCard
                          key={platform.id}
                          platform={platform}
                          connectedAccounts={connectedAccounts}
                          maxAllowed={maxAllowed}
                          onConnect={() => handleConnectPlatform(platform.id)}
                          canAdd={canAdd}
                          userPlan={profile?.plan_type || 'free'}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Connected Accounts */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Contas Conectadas ({accounts.length})
                  </h2>
                  {loadingAccounts ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : accounts.length > 0 ? (
                    <ConnectedAccountsList
                      accounts={accounts}
                      onUpdate={() => queryClient.invalidateQueries({ queryKey: ['social-accounts'] })}
                    />
                  ) : (
                    <div className="bg-card rounded-lg border p-8 text-center">
                      <div className="text-6xl mb-4">🔗</div>
                      <h3 className="text-lg font-medium mb-2">
                        Nenhuma conta conectada
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Conecte suas redes sociais para começar a automatizar seus posts
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Accounts Management Tab */}
            <TabsContent value="accounts">
              {loadingAccounts ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : accounts.length > 0 ? (
                <BulkAccountManager
                  accounts={accounts}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['social-accounts'] })}
                />
              ) : (
                <div className="bg-card rounded-lg border p-8 text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium mb-2">
                    Nenhuma conta para gerenciar
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Conecte suas redes sociais primeiro para usar o gerenciamento em massa
                  </p>
                  <Button onClick={() => setActiveTab('platforms')}>
                    Conectar Contas
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule">
              <PostingSchedule
                accounts={accounts}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['social-accounts'] })}
              />
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue">
              <ScheduledPostsQueue
                posts={scheduledPosts}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Connection Modal */}
        {selectedPlatform && (
          <ConnectionModal
            platform={PLATFORMS[selectedPlatform]}
            isOpen={showConnectionModal}
            onClose={() => {
              setShowConnectionModal(false)
              setSelectedPlatform(null)
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
              setShowConnectionModal(false)
              setSelectedPlatform(null)
            }}
          />
        )}
      </DndProvider>
    </AppLayout>
  )
}
