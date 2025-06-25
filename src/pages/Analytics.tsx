import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  Users,
  Video,
  Clock,
  Target,
  Award,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Sparkles
} from 'lucide-react'

interface AnalyticsData {
  period: string
  views: number
  likes: number
  shares: number
  comments: number
  followers: number
}

interface PlatformData {
  platform: string
  views: number
  engagement: number
  color: string
}

interface TopClip {
  id: string
  title: string
  views: number
  likes: number
  shares: number
  viral_score: number
  platform: string
  thumbnail: string
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('views')
  const [isLoading, setIsLoading] = useState(false)

  // Mock data - replace with real API calls
  const [overallStats] = useState({
    total_videos: 45,
    total_clips: 134,
    total_views: 2450000,
    total_likes: 89500,
    total_shares: 12300,
    total_followers: 45200,
    growth_rate: 15.8,
    avg_viral_score: 78
  })

  const [chartData] = useState<AnalyticsData[]>([
    { period: '1 Jan', views: 12000, likes: 450, shares: 89, comments: 156, followers: 42000 },
    { period: '8 Jan', views: 15000, likes: 520, shares: 112, comments: 189, followers: 42500 },
    { period: '15 Jan', views: 18000, likes: 680, shares: 145, comments: 234, followers: 43200 },
    { period: '22 Jan', views: 22000, likes: 780, shares: 167, comments: 298, followers: 44100 },
    { period: '29 Jan', views: 28000, likes: 920, shares: 201, comments: 356, followers: 45200 }
  ])

  const [platformData] = useState<PlatformData[]>([
    { platform: 'Instagram', views: 890000, engagement: 8.5, color: '#E4405F' },
    { platform: 'YouTube', views: 650000, engagement: 6.2, color: '#FF0000' },
    { platform: 'TikTok', views: 520000, engagement: 12.8, color: '#000000' },
    { platform: 'Facebook', views: 290000, engagement: 4.1, color: '#1877F2' },
    { platform: 'Twitter', views: 100000, engagement: 3.7, color: '#1DA1F2' }
  ])

  const [topClips] = useState<TopClip[]>([
    {
      id: '1',
      title: 'Como Criar Hooks Irresistíveis',
      views: 145000,
      likes: 5200,
      shares: 890,
      viral_score: 95,
      platform: 'Instagram',
      thumbnail: '/placeholder-thumbnail.jpg'
    },
    {
      id: '2',
      title: 'Segredo do Marketing Viral',
      views: 128000,
      likes: 4800,
      shares: 756,
      viral_score: 92,
      platform: 'TikTok',
      thumbnail: '/placeholder-thumbnail.jpg'
    },
    {
      id: '3',
      title: 'Dica de Ouro para Creators',
      views: 98000,
      likes: 3400,
      shares: 567,
      viral_score: 87,
      platform: 'YouTube',
      thumbnail: '/placeholder-thumbnail.jpg'
    },
    {
      id: '4',
      title: 'Estratégia que Mudou Tudo',
      views: 76000,
      likes: 2900,
      shares: 445,
      viral_score: 83,
      platform: 'Instagram',
      thumbnail: '/placeholder-thumbnail.jpg'
    }
  ])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getGrowthIcon = (rate: number) => {
    return rate > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getGrowthColor = (rate: number) => {
    return rate > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getViralScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-yellow-500'
    if (score >= 70) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  const handleExport = () => {
    // Simulate export functionality
    const data = {
      period: timeRange,
      stats: overallStats,
      charts: chartData,
      platforms: platformData,
      topClips: topClips
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Acompanhe a performance do seu conteúdo</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(overallStats.total_views)}
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(overallStats.growth_rate)}
                    <span className={`text-sm ml-1 ${getGrowthColor(overallStats.growth_rate)}`}>
                      +{overallStats.growth_rate}%
                    </span>
                  </div>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Likes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(overallStats.total_likes)}
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(12.4)}
                    <span className="text-sm ml-1 text-green-600">+12.4%</span>
                  </div>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Seguidores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(overallStats.total_followers)}
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(8.7)}
                    <span className="text-sm ml-1 text-green-600">+8.7%</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score Viral Médio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.avg_viral_score}%
                  </p>
                  <div className="flex items-center mt-1">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm ml-1 text-purple-600">Excelente</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="platforms">Plataformas</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="growth">Crescimento</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Views Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Visualizações ao Longo do Tempo</CardTitle>
                  <CardDescription>
                    Evolução das visualizações nos últimos {timeRange}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Engagement Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Engajamento</CardTitle>
                  <CardDescription>
                    Likes, shares e comentários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="likes" fill="#EF4444" />
                      <Bar dataKey="shares" fill="#10B981" />
                      <Bar dataKey="comments" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Plataforma</CardTitle>
                  <CardDescription>
                    Visualizações por rede social
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="views"
                        label={({ platform, percent }) => `${platform} ${(percent * 100).toFixed(0)}%`}
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Platform Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Plataforma</CardTitle>
                  <CardDescription>
                    Métricas detalhadas de cada rede
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {platformData.map((platform) => (
                      <div key={platform.platform} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{platform.platform}</p>
                          <p className="text-sm text-gray-500">
                            {formatNumber(platform.views)} views
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {platform.engagement}%
                          </p>
                          <p className="text-sm text-gray-500">Engajamento</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Clips */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Clips</CardTitle>
                  <CardDescription>
                    Seus clips com melhor performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topClips.map((clip, index) => (
                      <div key={clip.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold">
                          {index + 1}
                        </div>
                        
                        <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                          <img 
                            src={clip.thumbnail} 
                            alt={clip.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {clip.title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {formatNumber(clip.views)}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {formatNumber(clip.likes)}
                            </span>
                            <span className="flex items-center">
                              <Share2 className="h-3 w-3 mr-1" />
                              {formatNumber(clip.shares)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge className={`${getViralScoreColor(clip.viral_score)} text-white mb-1`}>
                            {clip.viral_score}%
                          </Badge>
                          <p className="text-xs text-gray-500">{clip.platform}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Conteúdo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Video className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.total_videos}
                      </p>
                      <p className="text-sm text-gray-500">Vídeos Processados</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Award className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.total_clips}
                      </p>
                      <p className="text-sm text-gray-500">Clips Gerados</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.avg_viral_score}%
                      </p>
                      <p className="text-sm text-gray-500">Score Viral Médio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Growth Tab */}
          <TabsContent value="growth" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Followers Growth */}
              <Card>
                <CardHeader>
                  <CardTitle>Crescimento de Seguidores</CardTitle>
                  <CardDescription>
                    Evolução da base de seguidores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      <Line 
                        type="monotone" 
                        dataKey="followers" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Growth Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Crescimento</CardTitle>
                  <CardDescription>
                    Indicadores de performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Taxa de Crescimento</p>
                          <p className="text-sm text-gray-500">Últimos 30 dias</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        +{overallStats.growth_rate}%
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Eye className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Views por Clip</p>
                          <p className="text-sm text-gray-500">Média</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-blue-600">
                        {formatNumber(Math.floor(overallStats.total_views / overallStats.total_clips))}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Target className="h-6 w-6 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900">Taxa de Viralização</p>
                          <p className="text-sm text-gray-500">Clips com score > 80%</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-purple-600">67%</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-6 w-6 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">Tempo Médio</p>
                          <p className="text-sm text-gray-500">Processamento por vídeo</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-orange-600">3.2min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 