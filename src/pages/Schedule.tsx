import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Share2,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Facebook,
  Music,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScheduledPost {
  id: string;
  clip_id: string;
  platform: string;
  scheduled_time: string;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  caption: string;
  hashtags: string[];
  created_at: string;
  clip?: {
    title: string;
    thumbnail_url: string;
    cloudinary_secure_url: string;
    ai_viral_score: number;
  };
}

const Schedule = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [availableClips, setAvailableClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedClip, setSelectedClip] = useState('');
  const [caption, setCaption] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600' },
    { id: 'tiktok', name: 'TikTok', icon: Music, color: 'from-black to-gray-800' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'from-blue-400 to-blue-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-700' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700' }
  ];

  useEffect(() => {
    loadScheduledPosts();
    loadAvailableClips();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // TODO: Implementar quando tiver tabela de posts agendados
      // Por enquanto, vamos simular dados
      const mockPosts: ScheduledPost[] = [
        {
          id: '1',
          clip_id: 'clip-1',
          platform: 'instagram',
          scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
          caption: 'Confira este incrível momento! 🎬✨',
          hashtags: ['#viral', '#trending', '#content'],
          created_at: new Date().toISOString(),
          clip: {
            title: 'Momentos Incríveis',
            thumbnail_url: '',
            cloudinary_secure_url: '',
            ai_viral_score: 8.5
          }
        }
      ];

      setScheduledPosts(mockPosts);
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableClips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clips')
        .select('id, title, thumbnail_url, ai_viral_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableClips(data || []);
    } catch (error) {
      console.error('Error loading clips:', error);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedDate || !selectedTime || !selectedPlatform || !selectedClip) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos necessários.",
        variant: "destructive"
      });
      return;
    }

    try {
      const scheduledDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // TODO: Implementar quando tiver tabela de posts agendados
      const newPost: ScheduledPost = {
        id: Date.now().toString(),
        clip_id: selectedClip,
        platform: selectedPlatform,
        scheduled_time: scheduledDateTime.toISOString(),
        status: 'scheduled',
        caption,
        hashtags: [],
        created_at: new Date().toISOString(),
        clip: availableClips.find((c: any) => c.id === selectedClip)
      };

      setScheduledPosts(prev => [newPost, ...prev]);
      setShowScheduleForm(false);
      resetForm();

      toast({
        title: "Post agendado!",
        description: "Seu post foi agendado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao agendar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedPlatform('');
    setSelectedClip('');
    setCaption('');
  };

  const handleCancelPost = async (postId: string) => {
    try {
      setScheduledPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'cancelled' as const } : post
      ));
      
      toast({
        title: "Post cancelado",
        description: "O agendamento foi cancelado."
      });
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-800', icon: Clock },
      published: { label: 'Publicado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { label: 'Falhou', color: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return Share2;
    return platform.icon;
  };

  const getPlatformColor = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.color || 'from-gray-500 to-gray-600';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const upcomingPosts = scheduledPosts.filter(post => 
    post.status === 'scheduled' && new Date(post.scheduled_time) > new Date()
  );

  const publishedPosts = scheduledPosts.filter(post => post.status === 'published');

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Carregando agendamentos...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Agendamento</h1>
            <p className="text-slate-600 mt-1">
              Programe suas publicações nas redes sociais
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={loadScheduledPosts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setShowScheduleForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agendar Post
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{upcomingPosts.length}</p>
                  <p className="text-sm text-slate-600">Agendados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{publishedPosts.length}</p>
                  <p className="text-sm text-slate-600">Publicados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{platforms.length}</p>
                  <p className="text-sm text-slate-600">Plataformas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {scheduledPosts.length > 0 ? 
                      (scheduledPosts.reduce((acc, post) => acc + (post.clip?.ai_viral_score || 0), 0) / scheduledPosts.length).toFixed(1) : '0'
                    }
                  </p>
                  <p className="text-sm text-slate-600">Score Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Form Modal */}
        {showScheduleForm && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agendar Novo Post
              </CardTitle>
              <CardDescription>
                Configure quando e onde publicar seu clip
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Clip Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecionar Clip</label>
                  <Select value={selectedClip} onValueChange={setSelectedClip}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um clip" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClips.map((clip: any) => (
                        <SelectItem key={clip.id} value={clip.id}>
                          <div className="flex items-center space-x-2">
                            <span>{clip.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {clip.ai_viral_score?.toFixed(1) || 'N/A'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plataforma</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map(platform => {
                        const Icon = platform.icon;
                        return (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span>{platform.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Escolha uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Horário</label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Legenda</label>
                <Textarea
                  placeholder="Escreva uma legenda atrativa para seu post..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowScheduleForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSchedulePost}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Agendar Post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Posts */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">Posts Agendados</h2>
          
          {scheduledPosts.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum post agendado</h3>
                <p className="text-slate-600 mb-6">
                  Comece agendando seus primeiros posts para automatizar suas publicações.
                </p>
                <Button onClick={() => setShowScheduleForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Primeiro Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {scheduledPosts.map((post) => {
                const PlatformIcon = getPlatformIcon(post.platform);
                return (
                  <Card key={post.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${getPlatformColor(post.platform)}`}>
                            <PlatformIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {post.clip?.title || 'Clip'}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {formatDateTime(post.scheduled_time)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(post.status)}
                      </div>

                      {post.caption && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {post.caption}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {post.clip?.ai_viral_score && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {post.clip.ai_viral_score.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {post.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelPost(post.id)}
                            >
                              <Pause className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Schedule; 