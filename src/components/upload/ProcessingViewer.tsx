import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileVideo,
  FileText,
  Scissors,
  Share2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Video = Tables<'videos'>;

interface ProcessingVideo extends Video {
  clips?: any[];
  scheduled_posts?: any[];
}

interface ProcessingViewerProps {
  onVideoComplete?: (video: ProcessingVideo) => void;
  onRetry?: (videoId: string) => void;
}

const statusConfig = {
  uploading: {
    label: 'Fazendo upload',
    icon: FileVideo,
    color: 'bg-blue-500',
    description: 'Enviando vídeo para processamento'
  },
  queued: {
    label: 'Na fila',
    icon: Clock,
    color: 'bg-gray-500',
    description: 'Aguardando processamento'
  },
  transcribing: {
    label: 'Transcrevendo',
    icon: FileText,
    color: 'bg-yellow-500',
    description: 'Convertendo áudio em texto'
  },
  analyzing: {
    label: 'Analisando',
    icon: FileText,
    color: 'bg-purple-500',
    description: 'Analisando conteúdo do vídeo'
  },
  generating_clips: {
    label: 'Gerando clipes',
    icon: Scissors,
    color: 'bg-green-500',
    description: 'Criando clipes automáticos'
  },
  ready: {
    label: 'Pronto',
    icon: CheckCircle,
    color: 'bg-green-600',
    description: 'Processamento finalizado'
  },
  failed: {
    label: 'Falhou',
    icon: AlertCircle,
    color: 'bg-red-500',
    description: 'Erro no processamento'
  },
  cancelled: {
    label: 'Cancelado',
    icon: AlertCircle,
    color: 'bg-gray-400',
    description: 'Processamento cancelado'
  }
};

const statusSteps = [
  { key: 'uploading', label: 'Upload', icon: FileVideo },
  { key: 'queued', label: 'Fila', icon: Clock },
  { key: 'transcribing', label: 'Transcrição', icon: FileText },
  { key: 'analyzing', label: 'Análise', icon: FileText },
  { key: 'generating_clips', label: 'Clips', icon: Scissors },
  { key: 'ready', label: 'Pronto', icon: CheckCircle },
];

export function ProcessingViewer({ onVideoComplete, onRetry }: ProcessingViewerProps) {
  const [videos, setVideos] = useState<ProcessingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepTimestamps, setStepTimestamps] = useState<Record<string, number>>({});
  const [timeoutWarning, setTimeoutWarning] = useState(false);

  useEffect(() => {
    loadProcessingVideos();
    const interval = setInterval(loadProcessingVideos, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!videos.length) return;
    const video = videos[0];
    // Timeout: se etapa atual durar mais de 5 minutos, alerta
    const now = Date.now();
    const currentStep = video.processing_status;
    setStepTimestamps((prev) => {
      if (!prev[currentStep]) {
        return { ...prev, [currentStep]: now };
      }
      return prev;
    });
    if (stepTimestamps[currentStep] && now - stepTimestamps[currentStep] > 5 * 60 * 1000) {
      setTimeoutWarning(true);
    } else {
      setTimeoutWarning(false);
    }
  }, [videos, stepTimestamps]);

  const loadProcessingVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          processing_status,
          error_message,
          created_at,
          duration_seconds,
          file_size_bytes,
          transcription,
          ai_main_topics,
          ai_suggested_clips
        `)
        .eq('user_id', user.id)
        .in('processing_status', ['uploading', 'queued', 'transcribing', 'analyzing', 'generating_clips', 'ready', 'failed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setVideos((data || []) as ProcessingVideo[]);
      
      // Check for completed videos
      const completedVideos = data?.filter(v => v.processing_status === 'ready') || [];
      completedVideos.forEach(video => {
        onVideoComplete?.(video as ProcessingVideo);
      });
    } catch (error) {
      console.error('Error loading processing videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ 
          processing_status: 'uploading', 
          error_message: null 
        })
        .eq('id', videoId);

      if (error) throw error;

      // Trigger reprocessing
      const { error: functionError } = await supabase.functions.invoke('upload-video', {
        body: { video_id: videoId, retry: true }
      });

      if (functionError) throw functionError;

      onRetry?.(videoId);
      loadProcessingVideos();
    } catch (error) {
      console.error('Error retrying video:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (video: ProcessingVideo) => {
    if (video.processing_status === 'ready') return 100;
    if (video.processing_status === 'failed' || video.processing_status === 'cancelled') return 0;
    
    const statusOrder = ['uploading', 'queued', 'transcribing', 'analyzing', 'generating_clips', 'ready'];
    const currentIndex = statusOrder.indexOf(video.processing_status || 'uploading');
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Carregando vídeos em processamento...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vídeos em Processamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum vídeo em processamento</p>
            <p className="text-sm">Faça upload de um vídeo para começar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Vídeos em Processamento ({videos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {videos.map((video) => {
          const config = statusConfig[video.processing_status as keyof typeof statusConfig] || statusConfig.uploading;
          const Icon = config.icon;
          const progress = calculateProgress(video);
          const currentStepIndex = statusSteps.findIndex(s => s.key === video.processing_status);

          return (
            <div key={video.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${config.color} text-white rounded p-0.5`} />
                    <h4 className="font-medium">{video.title}</h4>
                    <Badge variant={video.processing_status === 'failed' ? 'destructive' : 'secondary'}>
                      {config.label}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {config.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>Duração: {formatDuration(video.duration_seconds)}</span>
                    <span>Tamanho: {formatFileSize(video.file_size_bytes)}</span>
                    <span>Criado: {new Date(video.created_at || '').toLocaleString('pt-BR')}</span>
                  </div>

                  {/* Barra de progresso multi-etapas */}
                  <div className="flex items-center gap-2 mb-2">
                    {statusSteps.map((step, idx) => (
                      <div key={step.key} className="flex flex-col items-center">
                        <div className={cn(
                          'rounded-full p-1 border-2',
                          idx < currentStepIndex ? 'border-green-500 bg-green-500 text-white' :
                          idx === currentStepIndex ? 'border-blue-500 bg-blue-500 text-white animate-pulse' :
                          'border-gray-300 bg-gray-100 text-gray-400')
                        }>
                          <step.icon className="h-5 w-5" />
                        </div>
                        <span className={cn('text-xs mt-1', idx === currentStepIndex ? 'font-bold text-blue-600' : 'text-gray-400')}>{step.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Barra de progresso linear */}
                  {video.processing_status !== 'ready' && video.processing_status !== 'failed' && video.processing_status !== 'cancelled' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Logs detalhados */}
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    {statusSteps.slice(0, currentStepIndex + 1).map((step, idx) => (
                      <div key={step.key} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{step.label} {idx === currentStepIndex ? '(em andamento)' : 'concluído'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Timeout/Travamento */}
                  {timeoutWarning && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">Ainda processando, pode demorar alguns minutos. Se persistir, tente novamente ou entre em contato com o suporte.</span>
                      <Button size="sm" variant="outline" onClick={loadProcessingVideos} className="ml-2">Recarregar status</Button>
                    </div>
                  )}

                  {video.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Erro:</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">{video.error_message}</p>
                    </div>
                  )}

                  {video.processing_status === 'ready' && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Processamento concluído com sucesso!</span>
                      </div>
                      
                      {video.transcription && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Transcrição:</strong> {JSON.stringify(video.transcription).length} caracteres
                        </div>
                      )}
                      
                      {video.ai_suggested_clips && video.ai_suggested_clips > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Clipes sugeridos:</strong> {video.ai_suggested_clips}
                        </div>
                      )}
                      
                      {video.ai_main_topics && video.ai_main_topics.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Tópicos principais:</strong> {video.ai_main_topics.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {video.processing_status === 'failed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(video.id)}
                    className="ml-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 