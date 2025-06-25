
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useVideoUpload } from '@/hooks/useVideoUpload'
import { supabase } from '@/integrations/supabase/client'
import {
  AlertCircle,
  BarChart3,
  Bot,
  CheckCircle,
  Clock,
  CloudUpload,
  FileVideo,
  Scissors,
  Sparkles,
  Target,
  Video,
  X,
  Zap
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DashboardStats {
  videosUploaded: number
  clipsGenerated: number
  postsScheduled: number
  totalViews: number
}

interface RecentVideo {
  id: string
  title: string
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  clips_count?: number
  thumbnail_url?: string
}



export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    videosUploaded: 0,
    clipsGenerated: 0,
    postsScheduled: 0,
    totalViews: 0
  })
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  
  // Upload states
  const {
    file,
    setFile,
    title,
    setTitle,
    description,
    setDescription,
    isUploading,
    uploadProgress,
    uploadError,
    uploadVideo,
    resetUpload
  } = useVideoUpload()

  // Prevent auth issues on refresh
  useEffect(() => {
    if (!authLoading && !user) {
      // Don't redirect immediately, wait a bit for auth to settle
      const timer = setTimeout(() => {
        if (!user) {
          window.location.href = '/login'
        }
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (user && !authLoading) {
      console.log('🏠 Dashboard: Inicializando para usuário:', user?.email)
      loadDashboardData()
    }
  }, [user, authLoading])

  const loadDashboardData = async () => {
    try {
      console.log('📊 Dashboard: Carregando dados...')
      setLoading(true)

      // Carregar vídeos recentes
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          status,
          created_at,
          thumbnail_url,
          clips (count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (videosError) {
        console.error('Erro ao carregar vídeos:', videosError)
      } else {
        setRecentVideos(videos?.map(video => ({
          ...video,
          clips_count: video.clips?.[0]?.count || 0
        })) || [])
      }

      // Carregar estatísticas
      const { data: statsData, error: statsError } = await supabase
        .from('videos')
        .select(`
          id,
          status,
          clips (id, views)
        `)
        .eq('user_id', user?.id)

      if (!statsError && statsData) {
        const totalVideos = statsData.length
        const totalClips = statsData.reduce((acc, video) => acc + (video.clips?.length || 0), 0)
        const totalViews = statsData.reduce((acc, video) => 
          acc + (video.clips?.reduce((clipAcc: number, clip: any) => clipAcc + (clip.views || 0), 0) || 0), 0
        )

        setStats({
          videosUploaded: totalVideos,
          clipsGenerated: totalClips,
          postsScheduled: 0, // Será implementado
          totalViews
        })
      }


      
      console.log('✅ Dashboard: Dados carregados com sucesso')
    } catch (error) {
      console.error('❌ Dashboard: Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Upload handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      handleFileSelect(droppedFile)
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de vídeo.",
        variant: "destructive",
      })
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo de vídeo válido.",
        variant: "destructive",
      })
      return
    }

    const maxSize = 500 * 1024 * 1024 // 500MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 500MB.",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um arquivo e adicione um título.",
        variant: "destructive",
      })
      return
    }

    try {
      await uploadVideo()
      toast({
        title: "Upload concluído!",
        description: "Seu vídeo está sendo processado. Os clips serão gerados automaticamente.",
      })
      
      // Recarregar dados após upload
      setTimeout(() => {
        loadDashboardData()
      }, 2000)
    } catch (error) {
      console.error('Upload error:', error)
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

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getUploadStepName = (progress: number) => {
    if (progress < 10) return 'Validando arquivo'
    if (progress < 20) return 'Criando registro'
    if (progress < 30) return 'Preparando upload'
    if (progress < 80) return 'Enviando vídeo'
    if (progress < 90) return 'Processando'
    if (progress < 100) return 'Finalizando'
    return 'Concluído'
  }

  // Show loading while auth is settling
  if (authLoading || (loading && !user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
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
              Olá, {profile?.full_name || user?.email?.split('@')[0]} 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Transforme seus vídeos em clips virais e poste automaticamente
            </p>
          </div>
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
              <p className="text-xs text-muted-foreground">Total</p>
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
              <CardTitle className="text-sm font-medium">Posts Automáticos</CardTitle>
              <Bot className="h-4 w-4 text-green-600" />
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

        {/* Main Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4" />
              Upload & IA
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Automação
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Meus Vídeos
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Upload Section */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CloudUpload className="h-5 w-5 text-purple-600" />
                    Upload de Vídeo
                  </CardTitle>
                  <CardDescription>
                    Envie seu vídeo e nossa IA criará clips virais automaticamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!file ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
                        ${dragOver 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                        }
                      `}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900">
                          Arraste seu vídeo aqui
                        </p>
                        <p className="text-sm text-gray-500">
                          ou clique para selecionar
                        </p>
                        <p className="text-xs text-gray-400">
                          MP4, MOV, AVI até 500MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileVideo className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFile(null)
                            setTitle('')
                            setDescription('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Título do Vídeo *</Label>
                          <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Digite um título atrativo..."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="description">Descrição (Opcional)</Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o conteúdo do seu vídeo..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    id="file-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {isUploading && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{getUploadStepName(uploadProgress)}</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                  )}

                  <Button 
                    onClick={handleUpload}
                    disabled={!file || !title.trim() || isUploading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Clips com IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* AI Features */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    Recursos de IA
                  </CardTitle>
                  <CardDescription>
                    Nossa inteligência artificial fará tudo automaticamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Zap className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Transcrição Automática</p>
                        <p className="text-sm text-gray-600">Converte áudio em texto com precisão</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Análise de Conteúdo</p>
                        <p className="text-sm text-gray-600">Identifica os melhores momentos</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Scissors className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Clips Inteligentes</p>
                        <p className="text-sm text-gray-600">Cria clips otimizados para cada plataforma</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Score Viral</p>
                        <p className="text-sm text-gray-600">Calcula potencial de viralização</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Tempo de Processamento</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      • Upload: 5-10 segundos<br/>
                      • Processamento completo: 1-2 minutos<br/>
                      • Clips prontos para download e postagem
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Automação de Redes Sociais
                </CardTitle>
                <CardDescription>
                  Configure publicações automáticas dos seus clips
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Funcionalidade em desenvolvimento</p>
                <p className="text-sm text-gray-500">
                  Em breve você poderá conectar suas redes sociais e automatizar publicações
                </p>
                <Button className="mt-4" variant="outline" disabled>
                  Configurar Automação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-600" />
                  Vídeos Recentes
                </CardTitle>
                <CardDescription>
                  Seus vídeos enviados e status de processamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentVideos.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum vídeo enviado ainda</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Faça upload do seu primeiro vídeo na aba "Upload & IA"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentVideos.map((video) => (
                      <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(video.status)}
                          <div>
                            <p className="font-medium text-gray-900">{video.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(video.created_at).toLocaleDateString('pt-BR')} • {video.clips_count} clips
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(video.status)}>
                            {video.status === 'processing' ? 'Processando' : 
                             video.status === 'completed' ? 'Concluído' : 'Erro'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Ver Clips
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 