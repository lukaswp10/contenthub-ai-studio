import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Video, 
  Scissors, 
  Calendar, 
  BarChart3,
  PlayCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  videosUploaded: number
  clipsGenerated: number
  postsScheduled: number
  totalViews: number
}

interface RecentActivity {
  id: string
  type: 'upload' | 'analysis' | 'clips' | 'schedule'
  title: string
  status: 'processing' | 'completed' | 'failed'
  timestamp: string
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    videosUploaded: 0,
    clipsGenerated: 0,
    postsScheduled: 0,
    totalViews: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🏠 Dashboard: Inicializando para usuário:', user?.email)
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      console.log('📊 Dashboard: Carregando dados...')
      setLoading(true)

      // Simular carregamento de dados (será substituído por chamadas reais à API)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock data - será substituído por dados reais
      setStats({
        videosUploaded: profile?.usage_videos_current_month || 0,
        clipsGenerated: 0, // Será implementado
        postsScheduled: 0, // Será implementado
        totalViews: 0
      })

      setRecentActivity([])
      
      console.log('✅ Dashboard: Dados carregados com sucesso')
    } catch (error) {
      console.error('❌ Dashboard: Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Olá, {profile?.full_name || user?.email} 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Transforme seus vídeos em clips virais automaticamente
            </p>
          </div>
          <Button 
            onClick={() => navigate('/upload')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Vídeo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vídeos Enviados</CardTitle>
              <Video className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.videosUploaded}</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clips Gerados</CardTitle>
              <Scissors className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clipsGenerated}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts Agendados</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.postsScheduled}</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-purple-600" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Comece seu fluxo de criação de conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate('/upload')}
                className="w-full justify-start bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Enviar Novo Vídeo
              </Button>
              
              <Button 
                onClick={() => navigate('/clips')}
                variant="outline" 
                className="w-full justify-start border-purple-200 hover:bg-purple-50"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Ver Meus Clips
              </Button>
              
              <Button 
                onClick={() => navigate('/schedule')}
                variant="outline" 
                className="w-full justify-start border-indigo-200 hover:bg-indigo-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Posts
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso dos seus vídeos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma atividade ainda
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Envie seu primeiro vídeo para começar a gerar clips virais
                  </p>
                  <Button 
                    onClick={() => navigate('/upload')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Vídeo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(activity.status)}
                        <div>
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        {stats.videosUploaded > 0 && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Progresso do Plano</CardTitle>
              <CardDescription>
                Acompanhe o uso do seu plano {profile?.plan_type || 'free'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Vídeos este mês</span>
                    <span>{stats.videosUploaded}/10</span>
                  </div>
                  <Progress value={(stats.videosUploaded / 10) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 