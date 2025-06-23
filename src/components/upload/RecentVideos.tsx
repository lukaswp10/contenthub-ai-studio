import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Play, 
  Eye, 
  Clock, 
  FileVideo,
  CheckCircle, 
  AlertCircle,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Video = Tables<'videos'>;

interface RecentVideosProps {
  onVideoSelect?: (video: Video) => void;
  onViewClips?: (videoId: string) => void;
  onShareVideo?: (video: Video) => void;
}

const statusConfig = {
  uploading: {
    label: 'Fazendo upload',
    icon: FileVideo,
    color: 'bg-blue-500',
    variant: 'secondary' as const
  },
  queued: {
    label: 'Na fila',
    icon: Clock,
    color: 'bg-gray-500',
    variant: 'secondary' as const
  },
  transcribing: {
    label: 'Transcrevendo',
    icon: Clock,
    color: 'bg-yellow-500',
    variant: 'secondary' as const
  },
  analyzing: {
    label: 'Analisando',
    icon: Clock,
    color: 'bg-purple-500',
    variant: 'secondary' as const
  },
  generating_clips: {
    label: 'Gerando clipes',
    icon: Clock,
    color: 'bg-green-500',
    variant: 'secondary' as const
  },
  ready: {
    label: 'Pronto',
    icon: CheckCircle,
    color: 'bg-green-600',
    variant: 'default' as const
  },
  failed: {
    label: 'Falhou',
    icon: AlertCircle,
    color: 'bg-red-500',
    variant: 'destructive' as const
  },
  cancelled: {
    label: 'Cancelado',
    icon: AlertCircle,
    color: 'bg-gray-400',
    variant: 'secondary' as const
  }
};

export function RecentVideos({ onVideoSelect, onViewClips, onShareVideo }: RecentVideosProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentVideos();
  }, []);

  const loadRecentVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          processing_status,
          created_at,
          duration_seconds,
          file_size_bytes,
          cloudinary_secure_url,
          ai_suggested_clips,
          ai_main_topics
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      setVideos((data || []) as Video[]);
    } catch (error) {
      console.error('Error loading recent videos:', error);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 48) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  const handleDelete = async (videoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este vídeo? Essa ação não pode ser desfeita.')) return;
    
    setDeletingId(videoId);
    try {
      // Excluir do Supabase
      const { error } = await supabase.from('videos').delete().eq('id', videoId);
      if (error) throw error;
      
      // Remover da lista local
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      
      // Remover da seleção se estiver selecionado
      setSelectedVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
      
      toast({
        title: "Vídeo excluído",
        description: "O vídeo foi removido com sucesso.",
      });
    } catch (err) {
      console.error('Erro ao excluir vídeo:', err);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o vídeo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectVideo = (videoId: string, checked: boolean) => {
    setSelectedVideos((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(videoId);
      } else {
        newSet.delete(videoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVideos(new Set(videos.map(v => v.id)));
    } else {
      setSelectedVideos(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedVideos.size === 0) return;
    
    const count = selectedVideos.size;
    if (!window.confirm(`Tem certeza que deseja excluir ${count} vídeo${count > 1 ? 's' : ''}? Essa ação não pode ser desfeita.`)) return;
    
    setDeletingMultiple(true);
    try {
      // Excluir do Supabase
      const { error } = await supabase
        .from('videos')
        .delete()
        .in('id', Array.from(selectedVideos));
      
      if (error) throw error;
      
      // Remover da lista local
      setVideos((prev) => prev.filter((v) => !selectedVideos.has(v.id)));
      
      // Limpar seleção
      setSelectedVideos(new Set());
      setIsSelectMode(false);
      
      toast({
        title: "Vídeos excluídos",
        description: `${count} vídeo${count > 1 ? 's' : ''} removido${count > 1 ? 's' : ''} com sucesso.`,
      });
    } catch (err) {
      console.error('Erro ao excluir vídeos:', err);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir os vídeos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingMultiple(false);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedVideos(new Set());
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vídeos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-lg mb-2"></div>
                <div className="bg-gray-200 h-4 rounded mb-1"></div>
                <div className="bg-gray-200 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vídeos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum vídeo encontrado</p>
            <p className="text-sm">Faça upload do seu primeiro vídeo para começar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vídeos Recentes</CardTitle>
          <div className="flex items-center gap-2">
            {isSelectMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(true)}
                  disabled={selectedVideos.size === videos.length}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Selecionar Todos
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedVideos.size === 0 || deletingMultiple}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir ({selectedVideos.size})
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectMode}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {isSelectMode ? 'Cancelar' : 'Selecionar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const config = statusConfig[video.processing_status as keyof typeof statusConfig] || statusConfig.uploading;
            const Icon = config.icon;

            return (
              <div key={video.id} className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Checkbox for selection mode */}
                {isSelectMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <Checkbox
                      checked={selectedVideos.has(video.id)}
                      onCheckedChange={(checked) => handleSelectVideo(video.id, checked as boolean)}
                      className="bg-white border-2"
                    />
                  </div>
                )}
                
                {/* Thumbnail */}
                <div className="relative h-32 bg-gray-100">
                  {video.cloudinary_secure_url ? (
                    <img 
                      src={video.cloudinary_secure_url} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <FileVideo className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay with play button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onVideoSelect?.(video)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant={config.variant} className="text-xs">
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="text-xs bg-black bg-opacity-70 text-white">
                      {formatDuration(video.duration_seconds)}
                    </Badge>
                  </div>
                </div>

                {/* Video info */}
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-1 line-clamp-2" title={video.title}>
                    {video.title}
                  </h4>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{formatDate(video.created_at)}</span>
                    <span>{formatFileSize(video.file_size_bytes)}</span>
                  </div>

                  {/* AI insights */}
                  {video.processing_status === 'ready' && (
                    <div className="space-y-1 mb-3">
                      {video.ai_suggested_clips && video.ai_suggested_clips > 0 && (
                        <div className="text-xs text-green-600">
                          ✂️ {video.ai_suggested_clips} clipes sugeridos
                        </div>
                      )}
                      {video.ai_main_topics && video.ai_main_topics.length > 0 && (
                        <div className="text-xs text-blue-600">
                          🎯 {video.ai_main_topics.slice(0, 2).join(', ')}
                          {video.ai_main_topics.length > 2 && '...'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-8 text-xs"
                      onClick={() => onVideoSelect?.(video)}
                      disabled={isSelectMode}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    
                    {video.processing_status === 'ready' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => onViewClips?.(video.id)}
                          disabled={isSelectMode}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => onShareVideo?.(video)}
                          disabled={isSelectMode}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600"
                      title="Excluir vídeo"
                      disabled={deletingId === video.id || isSelectMode}
                      onClick={() => handleDelete(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 