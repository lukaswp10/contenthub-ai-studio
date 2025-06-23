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
import AppLayout from '@/components/layout/AppLayout'
import { 
  Settings, 
  Calendar, 
  BarChart3, 
  Plus,
  Sparkles,
  AlertCircle,
  Loader2,
  Users
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

  // Group accounts by platforma
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

  // Get total connected accounts
  const totalConnectedAccounts = accounts.length
  const activeAccounts = accounts.filter(a => a.is_active && a.connection_status === 'connected').length

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
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">Automação Social</h1>
                <p className="text-muted-foreground mt-2">
                  Conecte suas redes sociais e automatize seus posts
                </p>
              </div>
              
              {/* Quick stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{totalConnectedAccounts}</p>
                  <p className="text-sm text-muted-foreground">Contas conectadas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{activeAccounts}</p>
                  <p className="text-sm text-muted-foreground">Contas ativas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{scheduledPosts.length}</p>
                  <p className="text-sm text-muted-foreground">Posts agendados</p>
                </div>
              </div>
            </div>

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
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="platforms" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Plataformas
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gerenciar Contas
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Agenda
              </TabsTrigger>
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Fila de Posts
              </TabsTrigger>
            </TabsList>

            {/* Platforms Tab */}
            <TabsContent value="platforms" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
