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
  MoreVertical,
  Play,
  Download,
  Share2,
  Eye,
  TrendingUp,
  Calendar,
  RefreshCw,
  CalendarPlus,
  Palette,
  Type,
  Settings
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProcessingLogs from '@/components/upload/ProcessingLogs'

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
  thumbnail_url?: string
  duration_seconds?: number
}

interface Clip {
  id: string
  video_id: string
  title: string
  description: string
  duration_seconds: number
  ai_viral_score: number
  ai_hook_strength: number
  ai_best_platform: string[]
  hashtags: string[]
  created_at: string
  thumbnail_url?: string
  cloudinary_secure_url?: string
  status: string
}

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    videosUploaded: 0,
    clipsGenerated: 0,
    postsScheduled: 0,
    totalViews: 0
  })
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([])
  const [recentClips, setRecentClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  
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
    resetUpload,
    currentVideoId
  } = useVideoUpload()

  // Prevent auth issues on refresh
  useEffect(() => {
    if (!authLoading && !user) {
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

      // Carregar vídeos recentes com dados completos
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          original_filename,
          processing_status,
          created_at,
          cloudinary_secure_url,
          duration_seconds
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (videosError) {
        console.error('Erro ao carregar vídeos:', videosError)
      } else {
        // Verificar clips reais e atualizar status
        const videosWithClips = await Promise.all(
          (videos || []).map(async (video) => {
            const { count } = await supabase
              .from('clips')
              .select('*', { count: 'exact', head: true })
              .eq('video_id', video.id)
            
            let updatedStatus = video.processing_status
            if (count && count > 0) {
              updatedStatus = 'ready'
            }
            
            return {
              ...video,
              title: video.title || video.original_filename,
              clips_count: count || 0,
              processing_status: updatedStatus
            }
          })
        )
        
        setRecentVideos(videosWithClips)
      }

      // Carregar clips recentes
      const { data: clips, error: clipsError } = await supabase
        .from('clips')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(12)

      if (clipsError) {
        console.error('Erro ao carregar clips:', clipsError)
      } else {
        setRecentClips(clips || [])
      }

      // Carregar estatísticas
      try {
        const { count: videosCount } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)

        const { count: clipsCount } = await supabase
          .from('clips')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)

        const { data: clipsViews } = await supabase
          .from('clips')
          .select('total_views')
          .eq('user_id', user?.id)

        const totalViews = clipsViews?.reduce((acc, clip) => acc + (clip.total_views || 0), 0) || 0

        setStats({
          videosUploaded: videosCount || 0,
          clipsGenerated: clipsCount || 0,
          postsScheduled: 0,
          totalViews
        })
      } catch (statsError) {
        console.error('Erro ao carregar estatísticas:', statsError)
      }

    } catch (error) {
      console.error('Erro geral ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => file.type.startsWith('video/'))
    
    if (videoFile) {
      setFile(videoFile)
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo de vídeo.",
        variant: "destructive"
      })
    }
  }, [setFile, toast])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({
        title: "Dados obrigatórios",
        description: "Por favor, selecione um arquivo e digite um título.",
        variant: "destructive"
      })
      return
    }

    try {
      // Mostrar logs e iniciar com upload
      setShowTerminal(true)
      setCurrentStep('upload')
      
      // Log inicial
      if (window.addProcessingLog) {
        window.addProcessingLog('🚀 Iniciando processamento completo do vídeo', 'info', {
          filename: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          title: title,
          description: description
        })
      }
      
      // 1. Upload do vídeo
      const videoId = await uploadVideo()
      if (!videoId) {
        throw new Error('Falha no upload do vídeo')
      }
      
      if (window.addProcessingLog) {
        window.addProcessingLog('✅ Upload concluído com sucesso', 'success', { videoId })
      }
      
      // 2. Aguardar transcrição (já é feita automaticamente no upload)
      setCurrentStep('transcription')
      if (window.addProcessingLog) {
        window.addProcessingLog('🎤 Iniciando transcrição do áudio...', 'info')
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000)) // Aguardar processamento
      
      if (window.addProcessingLog) {
        window.addProcessingLog('✅ Transcrição processada', 'success')
      }
      
      // 3. Análise de conteúdo
      setCurrentStep('analysis')
      if (window.addProcessingLog) {
        window.addProcessingLog('🧠 Iniciando análise de conteúdo com IA...', 'info')
      }
      
      try {
        const analysisResult = await supabase.functions.invoke('analyze-content', {
          body: { video_id: videoId }
        })
        
        if (analysisResult.error) {
          if (window.addProcessingLog) {
            window.addProcessingLog('⚠️ Análise de conteúdo falhou, continuando com clips automáticos', 'warning', {
              error: analysisResult.error.message
            })
          }
        } else {
          if (window.addProcessingLog) {
            window.addProcessingLog('✅ Análise de conteúdo concluída', 'success', {
              suggestions: analysisResult.data?.clips_suggestions?.length || 0
            })
          }
        }
      } catch (analysisError: any) {
        if (window.addProcessingLog) {
          window.addProcessingLog('⚠️ Erro na análise, continuando com clips automáticos', 'warning', {
            error: analysisError.message
          })
        }
      }
      
      // 4. Gerar clips - AQUI É ONDE PODE TRAVAR
      setCurrentStep('clips')
      if (window.addProcessingLog) {
        window.addProcessingLog('🎬 Iniciando geração de clips virais...', 'info')
        window.addProcessingLog('⏳ Conectando com API de geração de clips...', 'info')
      }
      
      // Timeout para detectar travamentos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('TIMEOUT: Geração de clips travou após 3 minutos'))
        }, 180000) // 3 minutos
      })
      
      // Monitorar progresso
      const progressInterval = setInterval(() => {
        if (window.addProcessingLog) {
          window.addProcessingLog('⏳ Ainda processando clips... (pode demorar alguns minutos)', 'info')
        }
      }, 30000) // A cada 30 segundos
      
      try {
        const clipsPromise = supabase.functions.invoke('generate-clips', {
          body: { video_id: videoId }
        })
        
        if (window.addProcessingLog) {
          window.addProcessingLog('📡 Chamada para generate-clips enviada', 'info')
        }
        
        const clipsResult = await Promise.race([clipsPromise, timeoutPromise]) as any
        
        clearInterval(progressInterval)
        
        if (window.addProcessingLog) {
          window.addProcessingLog('📨 Resposta recebida da API', 'info', {
            hasError: !!clipsResult.error,
            hasData: !!clipsResult.data
          })
        }
        
        if (clipsResult.error) {
          if (window.addProcessingLog) {
            window.addProcessingLog('❌ Erro na geração de clips', 'error', {
              error: clipsResult.error.message,
              details: clipsResult.error
            })
          }
          throw new Error(clipsResult.error.message || 'Erro na geração de clips')
        }
        
        const clipsCount = clipsResult.data?.clips_generated || 0
        
        if (window.addProcessingLog) {
          window.addProcessingLog(`🎉 ${clipsCount} clips gerados com sucesso!`, 'success', {
            clipsGenerated: clipsCount,
            usingShortstack: clipsResult.data?.using_shotstack || false
          })
        }
        
        toast({
          title: "Processamento concluído!",
          description: `${clipsCount} clips foram gerados com sucesso.`,
        })
        
      } catch (timeoutError: any) {
        clearInterval(progressInterval)
        
        if (window.addProcessingLog) {
          window.addProcessingLog('🚨 TIMEOUT DETECTADO!', 'error', {
            error: timeoutError.message,
            possibleCauses: [
              'API do Shotstack pode estar lenta',
              'Vídeo muito grande para processar',
              'Problema de conectividade',
              'Limite de API atingido'
            ]
          })
        }
        
        throw timeoutError
      }
      
      // Recarregar dados após processamento
      if (window.addProcessingLog) {
        window.addProcessingLog('🔄 Recarregando dados do dashboard...', 'info')
      }
      
      await loadDashboardData()
      
      if (window.addProcessingLog) {
        window.addProcessingLog('✅ Processamento completo finalizado!', 'success')
      }
      
      // Esconder logs após sucesso (mas deixar tempo para ver)
      setTimeout(() => {
        setShowTerminal(false)
        setCurrentStep('')
      }, 5000)
      
    } catch (error: any) {
      console.error('Erro no processamento:', error)
      
      if (window.addProcessingLog) {
        window.addProcessingLog('💥 ERRO CRÍTICO NO PROCESSAMENTO', 'error', {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        })
      }
      
      toast({
        title: "Erro no processamento",
        description: error.message || 'Erro durante o processamento do vídeo',
        variant: "destructive"
      })
      
      // Manter logs visíveis em caso de erro para debug
      // setShowTerminal(false)
      // setCurrentStep('')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const safeSeconds = seconds || 0
    const mins = Math.floor(safeSeconds / 60)
    const secs = safeSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getViralScoreColor = (score: number) => {
    const safeScore = score || 0
    if (safeScore >= 8) return 'text-green-600 bg-green-100'
    if (safeScore >= 6) return 'text-yellow-600 bg-yellow-100'
    if (safeScore >= 4) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o vídeo "${videoTitle}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user?.id)

      if (error) throw error
      
      toast({
        title: "Vídeo removido",
        description: "O vídeo foi removido com sucesso.",
      })

      loadDashboardData()
    } catch (error) {
      console.error('Erro ao remover vídeo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o vídeo.",
        variant: "destructive"
      })
    }
  }

  // New functions for clip actions
  const handleViewClip = (clip: Clip) => {
    if (clip.cloudinary_secure_url) {
      window.open(clip.cloudinary_secure_url, '_blank')
    } else {
      toast({
        title: "Vídeo não disponível",
        description: "O vídeo ainda está sendo processado.",
        variant: "destructive"
      })
    }
  }

  const handleDownloadClip = async (clip: Clip) => {
    if (!clip.cloudinary_secure_url) {
      toast({
        title: "Download não disponível",
        description: "O vídeo ainda está sendo processado.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(clip.cloudinary_secure_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download iniciado",
        description: "O download do clip foi iniciado.",
      })
    } catch (error) {
      console.error('Erro no download:', error)
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o clip.",
        variant: "destructive"
      })
    }
  }

  const handleShareClip = (clip: Clip) => {
    const shareData = {
      title: clip.title,
      text: clip.description,
      url: clip.cloudinary_secure_url || window.location.href
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
    } else {
      // Fallback: copy link to clipboard
      const shareText = `${clip.title}\n\n${clip.description}\n\n${shareData.url}`
      navigator.clipboard.writeText(shareText)
      toast({
        title: "Link copiado!",
        description: "O link do clip foi copiado para a área de transferência.",
      })
    }
  }

  const handleScheduleClip = (clip: Clip) => {
    // Navigate to social page with clip data
    navigate('/social', { 
      state: { 
        clipId: clip.id,
        clipTitle: clip.title,
        clipDescription: clip.description,
        clipUrl: clip.cloudinary_secure_url,
        hashtags: clip.hashtags,
        platforms: clip.ai_best_platform
      } 
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Olá, {profile?.full_name || user?.email?.split('@')[0]} 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Transforme seus vídeos em clips virais e poste automaticamente
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vídeos Enviados</CardTitle>
              <Video className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.videosUploaded}</div>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Clips Gerados</CardTitle>
              <Scissors className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.clipsGenerated}</div>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Posts Automáticos</CardTitle>
              <Bot className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.postsScheduled}</div>
              <p className="text-xs text-gray-500 mt-1">Este mês</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Visualizações</CardTitle>
              <Eye className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Editor Visual Highlight */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Scissors className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">🎬 Editor Visual - Estilo Canva</h3>
                  <p className="text-purple-100">
                    Crie clips profissionais com nossa interface moderna e intuitiva
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-purple-100">
                    <span>• Timeline interativa</span>
                    <span>• Editor de texto visual</span>
                    <span>• Preview em tempo real</span>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-purple-50 font-semibold"
                asChild
              >
                <a href="/editor">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Abrir Editor
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dois Fluxos Principais */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* FLUXO 1: IA AUTOMÁTICA */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Bot className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-800">🤖 Fluxo Automático (IA)</CardTitle>
                  <CardDescription className="text-green-600">
                    Upload e nossa IA cria clips virais automaticamente
                  </CardDescription>
                </div>
              </div>
              
              <div className="bg-green-100 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Processo 100% Automatizado:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Upload → Cloudinary</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Transcrição (Whisper AI)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Análise de Conteúdo (Groq)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Clips Virais (Shotstack)</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                  border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                    ${dragOver 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-green-300 hover:border-green-400 hover:bg-green-50/50'
                    }
                  `}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <CloudUpload className="mx-auto h-10 w-10 text-green-400 mb-3" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-800">
                      Arraste seu vídeo aqui
                    </p>
                    <p className="text-sm text-green-600">
                      ou clique para selecionar
                    </p>
                    <p className="text-xs text-green-500">
                      MP4, MOV, AVI até 500MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <FileVideo className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{file.name}</p>
                        <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
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

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-green-800">Título do Vídeo *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Digite um título atrativo..."
                        className="mt-1 border-green-300 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-green-800">Descrição (Opcional)</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o conteúdo do seu vídeo..."
                        className="mt-1 border-green-300 focus:border-green-500"
                        rows={2}
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
                    <span className="text-green-700">Processando com IA...</span>
                    <span className="font-medium text-green-800">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 bg-green-100" />
                  <div className="text-xs text-green-600 text-center">
                    {currentStep === 'upload' && '📤 Fazendo upload...'}
                    {currentStep === 'transcription' && '🎤 Transcrevendo áudio...'}
                    {currentStep === 'analysis' && '🧠 Analisando conteúdo...'}
                    {currentStep === 'clips' && '🎬 Gerando clips virais...'}
                  </div>
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
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Gerar Clips Automáticos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* FLUXO 2: EDITOR MANUAL */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-purple-800">🎨 Fluxo Manual (Editor)</CardTitle>
                  <CardDescription className="text-purple-600">
                    Controle total com editor visual estilo Canva
                  </CardDescription>
                </div>
              </div>
              
              <div className="bg-purple-100 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Processo Manual Profissional:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-purple-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Upload → Cloudinary</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Editor Visual (Timeline)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Textos e Efeitos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Render (Shotstack)</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <Scissors className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  Editor Visual Profissional
                </h3>
                <p className="text-purple-600 mb-4">
                  Interface moderna com timeline interativa, editor de texto e preview em tempo real
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <Clock className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-purple-700 font-medium">Timeline Visual</p>
                    <p className="text-xs text-purple-500">Corte preciso</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <Type className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-purple-700 font-medium">Editor de Texto</p>
                    <p className="text-xs text-purple-500">Posicionamento</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <Target className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-purple-700 font-medium">Multi-Plataforma</p>
                    <p className="text-xs text-purple-500">TikTok, IG, YT</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <Zap className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-purple-700 font-medium">Render HD</p>
                    <p className="text-xs text-purple-500">Shotstack API</p>
                  </div>
                </div>
              </div>

              <Button 
                asChild
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                size="lg"
              >
                <a href="/editor">
                  <Palette className="h-4 w-4 mr-2" />
                  Abrir Editor Visual
                </a>
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-purple-500">
                  ✨ Novo! Interface estilo Canva com controle total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
          {/* Videos and Clips Section */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Manual Clip Editor Highlight */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Scissors className="h-6 w-6 text-purple-600" />
                  🎬 Editor Manual de Clips
                </CardTitle>
                <CardDescription>
                  Crie clips personalizados com controle total sobre timing e conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Corte preciso por segundo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Preview em tempo real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Múltiplas plataformas</span>
                    </div>
                  </div>
                  
                  {recentVideos.filter(v => v.processing_status === 'ready').length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Vídeos prontos para edição:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recentVideos
                          .filter(v => v.processing_status === 'ready')
                          .slice(0, 4)
                          .map((video) => (
                            <div key={video.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-200 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{video.title}</p>
                                <p className="text-xs text-gray-500">{formatDuration(video.duration_seconds)} • {video.clips_count || 0} clips</p>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-purple-600 hover:bg-purple-700 text-white ml-2"
                                asChild
                              >
                                <a href={`/editor/${video.id}`}>
                                  <Scissors className="h-3 w-3 mr-1" />
                                  Editar
                                </a>
                              </Button>
                            </div>
                          ))}
                      </div>
                      <div className="text-center pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href="/gallery">
                            Ver todos os vídeos →
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Scissors className="h-12 w-12 mx-auto mb-3 text-purple-400" />
                      <p className="text-gray-600 mb-2">Nenhum vídeo pronto para edição</p>
                      <p className="text-sm text-gray-500">Faça upload de um vídeo para começar a criar clips manuais</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Clips */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Scissors className="h-6 w-6 text-indigo-600" />
                      Clips Recentes
                  </CardTitle>
                  <CardDescription>
                      Seus clips gerados pela IA prontos para usar
                  </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/gallery">Ver Todos</a>
                          </Button>
                        </div>
              </CardHeader>
              <CardContent>
                {recentClips.length === 0 ? (
                  <div className="text-center py-8">
                    <Scissors className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum clip gerado ainda</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Faça upload de um vídeo para gerar clips automaticamente
                    </p>
                      </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentClips.slice(0, 6).map((clip) => (
                      <div key={clip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{clip.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{clip.description}</p>
                                </div>
                                                    <Badge className={`ml-2 ${getViralScoreColor(clip.ai_viral_score || 0)}`}>
                            {(clip.ai_viral_score || 0).toFixed(1)}
                          </Badge>
                                </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{formatDuration(clip.duration_seconds)}</span>
                          <span>{formatDate(clip.created_at)}</span>
                                </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {(clip.hashtags || []).slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {tag}
                            </span>
                        ))}
                      </div>

                                                <div className="grid grid-cols-2 gap-2 mb-3">
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="flex-1"
                            onClick={() => handleViewClip(clip)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Visualizar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadClip(clip)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShareClip(clip)}
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            Compartilhar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                            onClick={() => handleScheduleClip(clip)}
                          >
                            <CalendarPlus className="h-3 w-3 mr-1" />
                            Agendar
                          </Button>
                        </div>
                    </div>
                  ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            {/* Recent Videos */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Video className="h-6 w-6 text-purple-600" />
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
                      Faça upload do seu primeiro vídeo para começar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentVideos.map((video) => (
                      <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{video.title}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{formatDate(video.created_at)}</span>
                              {video.duration_seconds && (
                                <span>{formatDuration(video.duration_seconds)}</span>
                              )}
                              <span>{video.clips_count || 0} clips</span>
                          </div>
                        </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={video.processing_status === 'ready' ? 'default' : 'secondary'}
                            className={
                              video.processing_status === 'ready' ? 'bg-green-100 text-green-800' :
                              video.processing_status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {video.processing_status === 'ready' ? 'Pronto' : 
                             video.processing_status === 'failed' ? 'Erro' : 
                             video.clips_count && video.clips_count > 0 ? 'Clips Criados' : 'Processando'}
                          </Badge>
                          
                          <div className="flex gap-2">
                            {video.clips_count && video.clips_count > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                              >
                                <a href={`/gallery?video=${video.id}`}>
                                  Ver Clips ({video.clips_count})
                                </a>
                              </Button>
                            )}
                            
                            {video.processing_status === 'ready' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                asChild
                              >
                                <a href={`/editor/${video.id}`}>
                                  <Scissors className="h-3 w-3 mr-1" />
                                  Editar Clips
                                </a>
                              </Button>
                            )}
                          </div>
                          
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
          </div>
        </div>

        {/* Features Overview */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Como Funciona o ClipsForge</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CloudUpload className="h-6 w-6" />
                </div>
                <h4 className="font-semibold mb-2">1. Upload</h4>
                <p className="text-sm opacity-90">Envie seu vídeo longo</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6" />
                </div>
                <h4 className="font-semibold mb-2">2. IA Analisa</h4>
                <p className="text-sm opacity-90">Nossa IA identifica os melhores momentos</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Scissors className="h-6 w-6" />
                </div>
                <h4 className="font-semibold mb-2">3. Clips Gerados</h4>
                <p className="text-sm opacity-90">Clips otimizados para cada plataforma</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h4 className="font-semibold mb-2">4. Viral</h4>
                <p className="text-sm opacity-90">Publique e acompanhe o crescimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress - Fixed Bottom Right */}
      <ProcessingLogs
        isVisible={showTerminal}
        onToggle={() => setShowTerminal(false)}
        currentStep={currentStep}
        progress={uploadProgress}
        videoId={currentVideoId || undefined}
      />
    </div>
  )
} 