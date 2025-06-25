import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessingViewer } from '@/components/upload/ProcessingViewer';
import { VideoPreviewEditor } from '@/components/video/VideoPreviewEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Download,
    Eye,
    Play,
    RefreshCw,
    Scissors,
    Share2,
    Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  description: string;
  duration_seconds: number;
  processing_status: string;
  cloudinary_secure_url: string;
  cloudinary_public_id: string;
  created_at: string;
  ai_main_topics: string[];
  ai_suggested_clips: number;
}

interface Clip {
  id: string;
  title: string;
  description: string;
  start_time_seconds: number;
  end_time_seconds: number;
  ai_viral_score: number;
  ai_hook_strength: number;
  ai_best_platform: string[];
  ai_content_category: string;
  hashtags: string[];
  cloudinary_secure_url: string;
  status: string;
}

export default function VideoStudio() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [video, setVideo] = useState<Video | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (videoId) {
      loadVideoData();
    }
  }, [videoId]);

  const loadVideoData = async () => {
    try {
      if (!user) return;

      // Carregar dados do vídeo
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .eq('user_id', user.id)
        .single();

      if (videoError) throw videoError;
      setVideo(videoData);

      // Carregar clips
      const { data: clipsData, error: clipsError } = await supabase
        .from('clips')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .order('clip_number', { ascending: true });

      if (clipsError) throw clipsError;
      setClips(clipsData || []);

    } catch (error) {
      console.error('Error loading video data:', error);
      toast({
        title: "Erro ao carregar vídeo",
        description: "Tente novamente.",
        variant: "destructive"
      });
      navigate('/clips');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateClips = async (videoId: string, editedSegments: any[]) => {
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-clips', {
        body: {
          video_id: videoId,
          edited_segments: editedSegments,
          preferences: {
            regenerate_all: false,
            keep_existing: true,
            target_platforms: ['tiktok', 'instagram', 'youtube'],
            clip_duration: 30,
            clip_count: 5
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Clips regenerados",
          description: `${data.clips_regenerated} novos clips foram gerados.`
        });
        loadVideoData(); // Recarregar dados
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error regenerating clips:', error);
      toast({
        title: "Erro na regeneração",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleClipsUpdated = (updatedClips: any[]) => {
    setClips(updatedClips);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ready':
        return {
          label: 'Pronto',
          color: 'bg-green-500',
          icon: CheckCircle,
          description: 'Vídeo processado e clips gerados'
        };
      case 'processing':
      case 'generating_clips':
        return {
          label: 'Processando',
          color: 'bg-yellow-500',
          icon: Clock,
          description: 'Processando vídeo...'
        };
      case 'failed':
        return {
          label: 'Erro',
          color: 'bg-red-500',
          icon: AlertCircle,
          description: 'Erro no processamento'
        };
      default:
        return {
          label: 'Processando',
          color: 'bg-gray-500',
          icon: Clock,
          description: 'Aguardando processamento'
        };
    }
  };

  const downloadClip = async (clip: Clip) => {
    try {
      const response = await fetch(clip.cloudinary_secure_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clip.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download iniciado",
        description: "O clip está sendo baixado."
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const shareClip = async (clip: Clip) => {
    try {
      await navigator.clipboard.writeText(clip.cloudinary_secure_url);
      toast({
        title: "Link copiado",
        description: "O link do clip foi copiado para a área de transferência."
      });
    } catch (error) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: clip.title,
            text: clip.description,
            url: clip.cloudinary_secure_url
          });
        } catch (shareError) {
          toast({
            title: "Erro ao compartilhar",
            description: "Tente novamente.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Erro ao copiar link",
          description: "Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando estúdio de vídeo...</span>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Vídeo não encontrado</h3>
              <p className="text-gray-600 mb-4">O vídeo pode ter sido removido ou você não tem permissão para acessá-lo.</p>
              <Button onClick={() => navigate('/clips')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Clips
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(video.processing_status);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/clips')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">{video.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className={statusConfig.color}>
                <statusConfig.icon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-gray-600">
                {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toFixed(0).padStart(2, '0')}
              </span>
              <span className="text-sm text-gray-600">
                {clips.length} clips gerados
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('clips')}
          >
            <Scissors className="h-4 w-4 mr-2" />
            Ver Clips ({clips.length})
          </Button>
          
          <Button
            onClick={() => handleRegenerateClips(video.id, [])}
            disabled={regenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerando...' : 'Regenerar Clips'}
          </Button>
        </div>
      </div>

      {/* Status do Processamento */}
      {video.processing_status !== 'ready' && (
        <Card>
          <CardContent className="p-4">
            <ProcessingViewer 
              onVideoComplete={() => loadVideoData()}
              onRetry={() => loadVideoData()}
            />
          </CardContent>
        </Card>
      )}

      {/* Tabs Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview & Editor
          </TabsTrigger>
          <TabsTrigger value="clips" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Clips ({clips.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Preview & Editor */}
        <TabsContent value="preview" className="space-y-6">
          {video.processing_status === 'ready' && video.cloudinary_secure_url ? (
            <VideoPreviewEditor
              videoId={video.id}
              videoUrl={video.cloudinary_secure_url}
              duration={video.duration_seconds}
              clipSuggestions={clips.map(clip => ({
                id: clip.id,
                start_time: clip.start_time_seconds,
                end_time: clip.end_time_seconds,
                title: clip.title,
                description: clip.description,
                viral_score: clip.ai_viral_score,
                hook_strength: clip.ai_hook_strength,
                hashtags: clip.hashtags,
                best_platforms: clip.ai_best_platform,
                content_category: clip.ai_content_category
              }))}
              onClipsUpdated={handleClipsUpdated}
              onRegenerateClips={handleRegenerateClips}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Vídeo ainda processando</h3>
                  <p className="text-gray-600">Aguarde o processamento terminar para usar o editor.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lista de Clips */}
        <TabsContent value="clips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Clips Gerados ({clips.length})
              </CardTitle>
              <CardDescription>
                Gerencie, baixe e compartilhe seus clips
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clips.length === 0 ? (
                <div className="text-center py-8">
                  <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum clip encontrado</h3>
                  <p className="text-gray-600 mb-4">Os clips serão gerados automaticamente após o processamento do vídeo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clips.map((clip) => (
                    <Card key={clip.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {Math.floor(clip.start_time_seconds / 60)}:
                            {(clip.start_time_seconds % 60).toFixed(0).padStart(2, '0')} - 
                            {Math.floor(clip.end_time_seconds / 60)}:
                            {(clip.end_time_seconds % 60).toFixed(0).padStart(2, '0')}
                          </Badge>
                          <Badge 
                            variant={clip.ai_viral_score >= 8 ? "default" : clip.ai_viral_score >= 6 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {clip.ai_viral_score.toFixed(1)}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-2 line-clamp-2">{clip.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{clip.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {clip.hashtags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(clip.cloudinary_secure_url, '_blank')}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadClip(clip)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareClip(clip)}
                            >
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {clip.ai_best_platform.slice(0, 2).map((platform, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Clips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clips.length}</div>
                <p className="text-xs text-gray-600">clips gerados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Score Viral Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clips.length > 0 
                    ? (clips.reduce((sum, clip) => sum + clip.ai_viral_score, 0) / clips.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <p className="text-xs text-gray-600">pontuação média</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clips High Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clips.filter(clip => clip.ai_viral_score >= 8).length}
                </div>
                <p className="text-xs text-gray-600">clips com score ≥ 8.0</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['tiktok', 'instagram', 'youtube', 'twitter'].map(platform => {
                  const count = clips.filter(clip => 
                    clip.ai_best_platform.includes(platform)
                  ).length;
                  const percentage = clips.length > 0 ? (count / clips.length) * 100 : 0;
                  
                  return (
                    <div key={platform} className="flex items-center space-x-2">
                      <div className="w-20 text-sm capitalize">{platform}</div>
                      <div className="flex-1">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <div className="w-12 text-sm text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 