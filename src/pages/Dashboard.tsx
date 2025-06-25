import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Zap,
  Trash2,
  MoreVertical
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
  processing_status: 'uploading' | 'queued' | 'transcribing' | 'analyzing' | 'generating_clips' | 'ready' | 'failed' | 'cancelled'
  created_at: string
  clips_count?: number
  cloudinary_secure_url?: string
}

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: any
  details?: string
}

interface VideoProcessingStatus {
  videoId: string
  currentStep: string
  steps: ProcessingStep[]
  error?: any
  lastUpdated: string
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

  const [processingVideos, setProcessingVideos] = useState<VideoProcessingStatus[]>([])
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

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
          processing_status,
          created_at,
          cloudinary_secure_url
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (videosError) {
        console.error('Erro ao carregar vídeos:', videosError)
      } else {
        // Carregar contagem de clips separadamente
        const videosWithClips = await Promise.all(
          (videos || []).map(async (video) => {
            const { count } = await supabase
              .from('clips')
              .select('*', { count: 'exact', head: true })
              .eq('video_id', video.id)
            
            return {
              ...video,
              clips_count: count || 0
            }
          })
        )
        
        setRecentVideos(videosWithClips)
      }

      // Carregar estatísticas separadamente para evitar erros
      try {
        // Contar vídeos
        const { count: videosCount } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)

        // Contar clips do usuário
        const { count: clipsCount } = await supabase
          .from('clips')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)

        // Somar views dos clips
        const { data: clipsViews } = await supabase
          .from('clips')
          .select('total_views')
          .eq('user_id', user?.id)

        const totalViews = clipsViews?.reduce((acc, clip) => acc + (clip.total_views || 0), 0) || 0

        setStats({
          videosUploaded: videosCount || 0,
          clipsGenerated: clipsCount || 0,
          postsScheduled: 0, // Será implementado
          totalViews
        })
      } catch (statsError) {
        console.error('Erro ao carregar estatísticas:', statsError)
        // Definir valores padrão se houver erro
        setStats({
          videosUploaded: 0,
          clipsGenerated: 0,
          postsScheduled: 0,
          totalViews: 0
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

    // Inicializar monitor ANTES do upload começar
    const tempVideoId = `temp_${Date.now()}`
    initializeUploadMonitor(tempVideoId)

    try {
      const result = await uploadVideo()
      toast({
        title: "Upload concluído!",
        description: "Seu vídeo está sendo processado. Os clips serão gerados automaticamente.",
      })
      
      // Recarregar dados após upload
      setTimeout(() => {
        loadDashboardData()
      }, 2000)

      // Atualizar o monitor com o videoId real
      if (result) {
        updateMonitorWithRealId(tempVideoId, result)
      }
      
    } catch (error) {
      console.error('Upload error:', error)
      // Remover monitor em caso de erro
      setProcessingVideos(prev => prev.filter(p => p.videoId !== tempVideoId))
    }
  }

  // Função para inicializar o monitoramento durante o upload
  const initializeUploadMonitor = (tempVideoId: string) => {
    const initialSteps: ProcessingStep[] = [
      { id: 'upload', name: 'Upload do Vídeo', status: 'processing', details: 'Enviando arquivo...' },
      { id: 'transcribe', name: 'Transcrição Automática', status: 'pending', details: 'Aguardando início da transcrição' },
      { id: 'analyze', name: 'Análise de Conteúdo', status: 'pending', details: 'Aguardando análise do conteúdo' },
      { id: 'generate', name: 'Geração de Clips', status: 'pending', details: 'Aguardando geração dos clips' },
      { id: 'finalize', name: 'Finalização', status: 'pending', details: 'Aguardando finalização do processo' }
    ]

    const processingStatus: VideoProcessingStatus = {
      videoId: tempVideoId,
      currentStep: 'uploading',
      steps: initialSteps,
      lastUpdated: new Date().toISOString()
    }

    setProcessingVideos(prev => [...prev.filter(p => p.videoId !== tempVideoId), processingStatus])
  }

  // Função para atualizar o monitor com o ID real após upload
  const updateMonitorWithRealId = (tempVideoId: string, realVideoId: string) => {
    setProcessingVideos(prev => prev.map(processing => {
      if (processing.videoId === tempVideoId) {
        const updatedSteps = [...processing.steps]
        updatedSteps[0] = { ...updatedSteps[0], status: 'completed', details: 'Arquivo enviado com sucesso' }
        
        return {
          ...processing,
          videoId: realVideoId,
          currentStep: 'queued',
          steps: updatedSteps,
          lastUpdated: new Date().toISOString()
        }
      }
      return processing
    }))
    
    // Iniciar polling agora que temos o ID real
    startPolling()
  }

  // Função para inicializar o monitoramento de processamento (para uso direto)
  const initializeProcessingMonitor = (videoId: string) => {
    const initialSteps: ProcessingStep[] = [
      { id: 'upload', name: 'Upload do Vídeo', status: 'completed', details: 'Arquivo enviado com sucesso' },
      { id: 'transcribe', name: 'Transcrição Automática', status: 'pending', details: 'Aguardando início da transcrição' },
      { id: 'analyze', name: 'Análise de Conteúdo', status: 'pending', details: 'Aguardando análise do conteúdo' },
      { id: 'generate', name: 'Geração de Clips', status: 'pending', details: 'Aguardando geração dos clips' },
      { id: 'finalize', name: 'Finalização', status: 'pending', details: 'Aguardando finalização do processo' }
    ]

    const processingStatus: VideoProcessingStatus = {
      videoId,
      currentStep: 'transcribe',
      steps: initialSteps,
      lastUpdated: new Date().toISOString()
    }

    setProcessingVideos(prev => [...prev.filter(p => p.videoId !== videoId), processingStatus])
    startPolling()
  }

  // Função para atualizar status do processamento
  const updateProcessingStatus = async (videoId: string) => {
    try {
      const { data: video, error } = await supabase
        .from('videos')
        .select('id, processing_status, error_log, updated_at')
        .eq('id', videoId)
        .single()

      if (error) throw error

      setProcessingVideos(prev => prev.map(processing => {
        if (processing.videoId !== videoId) return processing

        const updatedSteps = [...processing.steps]
        const currentStatus = video.processing_status

        // Atualizar status dos steps baseado no processing_status
        switch (currentStatus) {
          case 'transcribing':
            updatedSteps[1] = { ...updatedSteps[1], status: 'processing', startedAt: video.updated_at, details: 'Convertendo áudio em texto...' }
            break
          case 'analyzing':
            updatedSteps[1] = { ...updatedSteps[1], status: 'completed', completedAt: video.updated_at, details: 'Transcrição concluída' }
            updatedSteps[2] = { ...updatedSteps[2], status: 'processing', startedAt: video.updated_at, details: 'Analisando momentos importantes...' }
            break
          case 'generating_clips':
            updatedSteps[2] = { ...updatedSteps[2], status: 'completed', completedAt: video.updated_at, details: 'Análise concluída' }
            updatedSteps[3] = { ...updatedSteps[3], status: 'processing', startedAt: video.updated_at, details: 'Criando clips inteligentes...' }
            break
          case 'ready':
            updatedSteps[3] = { ...updatedSteps[3], status: 'completed', completedAt: video.updated_at, details: 'Clips gerados com sucesso' }
            updatedSteps[4] = { ...updatedSteps[4], status: 'completed', completedAt: video.updated_at, details: 'Processamento finalizado' }
            // Remove do monitoramento após conclusão
            setTimeout(() => {
              setProcessingVideos(prev => prev.filter(p => p.videoId !== videoId))
            }, 5000)
            break
          case 'failed':
            const failedStepIndex = updatedSteps.findIndex(step => step.status === 'processing')
            if (failedStepIndex !== -1) {
              updatedSteps[failedStepIndex] = { 
                ...updatedSteps[failedStepIndex], 
                status: 'failed', 
                error: video.error_log,
                details: 'Erro durante o processamento' 
              }
            }
            break
        }

        return {
          ...processing,
          currentStep: currentStatus,
          steps: updatedSteps,
          error: currentStatus === 'failed' ? video.error_log : undefined,
          lastUpdated: video.updated_at
        }
      }))

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  // Polling para atualizar status
  const startPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval)
    
    const interval = setInterval(() => {
      processingVideos.forEach(processing => {
        if (!['ready', 'failed'].includes(processing.currentStep)) {
          updateProcessingStatus(processing.videoId)
        }
      })
    }, 3000) // Atualiza a cada 3 segundos

    setPollingInterval(interval)
  }

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [pollingInterval])

  // Monitorar progresso do upload e atualizar o monitor
  useEffect(() => {
    if (isUploading && processingVideos.length > 0) {
      const tempVideo = processingVideos.find(p => p.videoId.startsWith('temp_'))
      if (tempVideo) {
        setProcessingVideos(prev => prev.map(processing => {
          if (processing.videoId === tempVideo.videoId) {
            const updatedSteps = [...processing.steps]
            updatedSteps[0] = { 
              ...updatedSteps[0], 
              status: 'processing', 
              details: `Enviando arquivo... ${uploadProgress}%` 
            }
            
            return {
              ...processing,
              steps: updatedSteps,
              lastUpdated: new Date().toISOString()
            }
          }
          return processing
        }))
      }
    }
  }, [uploadProgress, isUploading, processingVideos])

  // Função para forçar atualização
  const forceRefreshProcessing = (videoId: string) => {
    updateProcessingStatus(videoId)
    toast({
      title: "Status atualizado",
      description: "Verificando o progresso do processamento...",
    })
  }

  // Função para copiar log de erro
  const copyErrorLog = (error: any, videoId: string) => {
    const errorLog = {
      videoId,
      timestamp: new Date().toISOString(),
      error: error,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    navigator.clipboard.writeText(JSON.stringify(errorLog, null, 2))
    toast({
      title: "Log copiado",
      description: "Log de erro copiado para a área de transferência. Cole em seu chamado de suporte.",
    })
  }

  const getStatusIcon = (processing_status: string) => {
    switch (processing_status) {
      case 'uploading':
      case 'queued':
      case 'transcribing':
      case 'analyzing':
      case 'generating_clips':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (processing_status: string) => {
    switch (processing_status) {
      case 'uploading':
      case 'queued':
        return 'bg-blue-100 text-blue-800'
      case 'transcribing':
      case 'analyzing':
      case 'generating_clips':
        return 'bg-yellow-100 text-yellow-800'
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'failed':
      case 'cancelled':
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

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user?.id) // Segurança extra

      if (error) throw error

      // Atualizar a lista local
      setRecentVideos(recentVideos.filter(v => v.id !== videoId))
      
      toast({
        title: "Vídeo excluído",
        description: `"${videoTitle}" foi removido com sucesso.`,
      })

      // Recarregar estatísticas
      loadDashboardData()
    } catch (error: any) {
      console.error('Erro ao excluir vídeo:', error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover o vídeo. Tente novamente.",
        variant: "destructive",
      })
    }
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

              {/* AI Features - Atualizado com monitoramento */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    Recursos de IA
                    {processingVideos.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {processingVideos.length} processando
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {processingVideos.length > 0 
                      ? "Acompanhe o processamento em tempo real"
                      : "Nossa inteligência artificial fará tudo automaticamente"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Monitor de Processamento em Tempo Real */}
                  {processingVideos.map((processing) => (
                    <div key={processing.videoId} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Processamento em Andamento</h4>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => forceRefreshProcessing(processing.videoId)}
                            className="h-7"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Atualizar
                          </Button>
                          {processing.error && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyErrorLog(processing.error, processing.videoId)}
                              className="h-7 text-red-600 hover:text-red-700"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Copiar Log
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {processing.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {step.status === 'completed' && (
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              )}
                              {step.status === 'processing' && (
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                                </div>
                              )}
                              {step.status === 'failed' && (
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                  <X className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                              {step.status === 'pending' && (
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium ${
                                  step.status === 'completed' ? 'text-green-900' :
                                  step.status === 'processing' ? 'text-blue-900' :
                                  step.status === 'failed' ? 'text-red-900' :
                                  'text-gray-700'
                                }`}>
                                  {step.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  {step.startedAt && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(step.startedAt).toLocaleTimeString('pt-BR')}
                                    </span>
                                  )}
                                  <Badge 
                                    variant={
                                      step.status === 'completed' ? 'default' :
                                      step.status === 'processing' ? 'secondary' :
                                      step.status === 'failed' ? 'destructive' :
                                      'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {step.status === 'completed' ? 'Concluído' :
                                     step.status === 'processing' ? 'Processando' :
                                     step.status === 'failed' ? 'Erro' :
                                     'Pendente'}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{step.details}</p>
                              
                              {step.error && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                  <p className="text-red-700 font-medium">Erro:</p>
                                  <p className="text-red-600">{JSON.stringify(step.error)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Última atualização: {new Date(processing.lastUpdated).toLocaleTimeString('pt-BR')}</span>
                          <span>ID: {processing.videoId.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Recursos estáticos quando não há processamento */}
                  {processingVideos.length === 0 && (
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
                  )}

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
                          {getStatusIcon(video.processing_status)}
                          <div>
                            <p className="font-medium text-gray-900">{video.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(video.created_at).toLocaleDateString('pt-BR')} • {video.clips_count || 0} clips
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(video.processing_status)}>
                            {video.processing_status === 'ready' ? 'Concluído' : 
                             video.processing_status === 'failed' || video.processing_status === 'cancelled' ? 'Erro' : 'Processando'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Ver Clips
                          </Button>
                          
                          {/* Menu de opções */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleDeleteVideo(video.id, video.title)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir vídeo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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