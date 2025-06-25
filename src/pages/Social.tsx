import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Calendar,
  Clock,
  Send,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  Users,
  TrendingUp,
  Share2,
  Video,
  Image,
  Hash,
  Eye,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface SocialAccount {
  id: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin'
  username: string
  followers: number
  is_connected: boolean
  avatar_url?: string
  connection_status?: string
  total_followers?: number
  engagement_rate?: number
}

interface ScheduledPost {
  id: string
  clip_id: string
  clip_title: string
  platforms: string[]
  content: string
  scheduled_for: string
  status: 'scheduled' | 'published' | 'failed'
  engagement?: {
    views: number
    likes: number
    shares: number
  }
}

interface Clip {
  id: string
  title: string
  cloudinary_secure_url: string
  ai_viral_score: number
  duration_seconds: number
  created_at: string
}

export default function Social() {
  const { toast } = useToast()
  const [selectedClip, setSelectedClip] = useState('')
  const [postContent, setPostContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [realClips, setRealClips] = useState<Clip[]>([])
  const [realAccounts, setRealAccounts] = useState<SocialAccount[]>([])

  // Load real data
  const loadSocialAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading social accounts:', error)
        return
      }

      const mappedAccounts: SocialAccount[] = data?.map(account => ({
        id: account.id,
        platform: account.platform as any,
        username: account.username || account.display_name,
        followers: account.total_followers || 0,
        is_connected: account.connection_status === 'connected',
        avatar_url: account.avatar_url,
        connection_status: account.connection_status,
        total_followers: account.total_followers,
        engagement_rate: account.engagement_rate
      })) || []

      setRealAccounts(mappedAccounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const loadClips = async () => {
    try {
      const { data, error } = await supabase
        .from('clips')
        .select('*')
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading clips:', error)
        return
      }

      setRealClips(data || [])
    } catch (error) {
      console.error('Error loading clips:', error)
    }
  }

  const connectSocialAccount = async (platform: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('connect-social-account', {
        body: {
          platform,
          redirect_url: window.location.origin
        }
      })

      if (error) {
        toast({
          title: "Erro na conexão",
          description: error.message,
          variant: "destructive"
        })
        return
      }

      if (data?.success && data?.oauth_url) {
        toast({
          title: "Redirecionando...",
          description: `Conectando com ${platform}`,
        })
        // Open OAuth URL in new window
        window.open(data.oauth_url, '_blank', 'width=600,height=600')
        
        // Refresh accounts after connection
        setTimeout(() => {
          loadSocialAccounts()
        }, 3000)
      }
    } catch (error) {
      console.error('Error connecting account:', error)
      toast({
        title: "Erro na conexão",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSocialAccounts()
    loadClips()
  }, [])

  // Mock data - replace with real API calls
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      id: '1',
      platform: 'instagram',
      username: '@meucanal',
      followers: 15420,
      is_connected: true,
      avatar_url: '/placeholder-avatar.jpg'
    },
    {
      id: '2',
      platform: 'facebook',
      username: 'Minha Página',
      followers: 8930,
      is_connected: true,
      avatar_url: '/placeholder-avatar.jpg'
    },
    {
      id: '3',
      platform: 'twitter',
      username: '@meutwitter',
      followers: 5240,
      is_connected: false
    },
    {
      id: '4',
      platform: 'youtube',
      username: 'Meu Canal',
      followers: 12500,
      is_connected: true,
      avatar_url: '/placeholder-avatar.jpg'
    }
  ])

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: '1',
      clip_id: '1',
      clip_title: 'Hook Poderoso - Primeiros 15s',
      platforms: ['instagram', 'facebook'],
      content: 'Aprenda como criar hooks poderosos que prendem a atenção! 🚀 #marketing #contentcreator',
      scheduled_for: '2024-01-25T15:00:00Z',
      status: 'scheduled'
    },
    {
      id: '2',
      clip_id: '2',
      clip_title: 'Dica Valiosa - Meio do Vídeo',
      platforms: ['instagram', 'twitter'],
      content: 'Esta dica vai mudar sua forma de criar conteúdo! 💡 #dicas #viral',
      scheduled_for: '2024-01-24T18:30:00Z',
      status: 'published',
      engagement: {
        views: 3420,
        likes: 156,
        shares: 23
      }
    }
  ])

  const [availableClips] = useState([
    { id: '1', title: 'Hook Poderoso - Primeiros 15s', thumbnail: '/placeholder-thumbnail.jpg' },
    { id: '2', title: 'Dica Valiosa - Meio do Vídeo', thumbnail: '/placeholder-thumbnail.jpg' },
    { id: '3', title: 'Estatística Impressionante', thumbnail: '/placeholder-thumbnail.jpg' }
  ])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-5 w-5" />
      case 'facebook': return <Facebook className="h-5 w-5" />
      case 'twitter': return <Twitter className="h-5 w-5" />
      case 'youtube': return <Youtube className="h-5 w-5" />
      case 'linkedin': return <Linkedin className="h-5 w-5" />
      default: return <Share2 className="h-5 w-5" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'facebook': return 'bg-blue-600'
      case 'twitter': return 'bg-sky-500'
      case 'youtube': return 'bg-red-600'
      case 'linkedin': return 'bg-blue-700'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'published': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleConnectAccount = (platform: string) => {
    connectSocialAccount(platform)
  }

  const handleSchedulePost = async () => {
    if (!selectedClip || !postContent || selectedPlatforms.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um clip, escreva o conteúdo e escolha as plataformas.",
        variant: "destructive"
      })
      return
    }

    setIsScheduling(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newPost: ScheduledPost = {
        id: Date.now().toString(),
        clip_id: selectedClip,
        clip_title: availableClips.find(c => c.id === selectedClip)?.title || '',
        platforms: selectedPlatforms,
        content: postContent,
        scheduled_for: scheduledDate && scheduledTime 
          ? `${scheduledDate}T${scheduledTime}:00Z`
          : new Date().toISOString(),
        status: 'scheduled'
      }
      
      setScheduledPosts([newPost, ...scheduledPosts])
      
      // Reset form
      setSelectedClip('')
      setPostContent('')
      setSelectedPlatforms([])
      setScheduledDate('')
      setScheduledTime('')
      
      toast({
        title: "Post agendado!",
        description: "Seu post foi agendado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao agendar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Redes Sociais</h1>
            <p className="text-gray-600">Conecte contas e agende publicações</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Agendar Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agendar Publicação</DialogTitle>
                <DialogDescription>
                  Selecione um clip e configure sua publicação
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Clip Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Selecionar Clip
                  </label>
                  <Select value={selectedClip} onValueChange={setSelectedClip}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um clip..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(realClips.length > 0 ? realClips : availableClips).map((clip) => (
                        <SelectItem key={clip.id} value={clip.id}>
                          <div className="flex items-center space-x-2">
                            <Video className="h-4 w-4" />
                            <span>{clip.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Conteúdo do Post
                  </label>
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Escreva o conteúdo do seu post..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {postContent.length}/280 caracteres
                  </p>
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Plataformas
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(realAccounts.length > 0 ? realAccounts : accounts).filter(acc => acc.is_connected).map((account) => (
                      <div
                        key={account.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedPlatforms.includes(account.platform)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => togglePlatform(account.platform)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full text-white ${getPlatformColor(account.platform)}`}>
                            {getPlatformIcon(account.platform)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {account.username}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Data (opcional)
                    </label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Hora (opcional)
                    </label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogTrigger>
                  <Button 
                    onClick={handleSchedulePost}
                    disabled={isScheduling}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isScheduling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Agendando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {scheduledDate ? 'Agendar' : 'Publicar Agora'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full text-white ${getPlatformColor(account.platform)}`}>
                          {getPlatformIcon(account.platform)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                          </CardTitle>
                          <CardDescription>{account.username}</CardDescription>
                        </div>
                      </div>
                      
                      <Badge variant={account.is_connected ? 'default' : 'secondary'}>
                        {account.is_connected ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {account.is_connected ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Seguidores</span>
                          <span className="font-semibold">
                            {formatNumber(account.followers)}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>
                          <Button variant="outline" size="sm">
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          Conecte sua conta para começar a publicar
                        </p>
                        <Button 
                          onClick={() => handleConnectAccount(account.platform)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Conectar Conta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Scheduled Posts Tab */}
          <TabsContent value="scheduled" className="mt-6">
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                        <Image className="w-full h-full object-cover text-gray-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusIcon(post.status)}
                          <h3 className="font-semibold text-gray-900">
                            {post.clip_title}
                          </h3>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{post.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex space-x-1">
                              {post.platforms.map((platform) => (
                                <div
                                  key={platform}
                                  className={`p-1 rounded text-white ${getPlatformColor(platform)}`}
                                >
                                  {getPlatformIcon(platform)}
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(post.scheduled_for)}
                            </div>
                          </div>
                          
                          {post.engagement && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                {formatNumber(post.engagement.views)}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {formatNumber(post.engagement.likes)}
                              </span>
                              <span className="flex items-center">
                                <Share2 className="h-4 w-4 mr-1" />
                                {formatNumber(post.engagement.shares)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total de Posts</p>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                    </div>
                    <Send className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Visualizações</p>
                      <p className="text-2xl font-bold text-gray-900">125K</p>
                    </div>
                    <Eye className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Engajamento</p>
                      <p className="text-2xl font-bold text-gray-900">8.5K</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Crescimento</p>
                      <p className="text-2xl font-bold text-gray-900">+12%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance por Plataforma</CardTitle>
                <CardDescription>
                  Métricas dos últimos 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.filter(acc => acc.is_connected).map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full text-white ${getPlatformColor(account.platform)}`}>
                          {getPlatformIcon(account.platform)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                          </p>
                          <p className="text-sm text-gray-500">{account.username}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">
                            {Math.floor(Math.random() * 50) + 10}K
                          </p>
                          <p className="text-gray-500">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">
                            {Math.floor(Math.random() * 5) + 2}K
                          </p>
                          <p className="text-gray-500">Likes</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">
                            {Math.floor(Math.random() * 10) + 5}%
                          </p>
                          <p className="text-gray-500">Engagement</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 