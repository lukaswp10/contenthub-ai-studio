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
  Star,
  Video,
  Home,
  Upload,
  Scissors,
  User,
  ArrowLeft,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
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
      scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      published: { label: 'Publicado', color: 'bg-green-100 text-green-800 border-green-200' },
      failed: { label: 'Falhou', color: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return (
      <Badge className={`${config.color} border`}>
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
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando agendamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Navegação */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  ClipsForge
                </span>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/upload" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Link>
                <Link to="/clips" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Scissors className="h-4 w-4" />
                  <span>Meus Clips</span>
                </Link>
                <div className="flex items-center space-x-2 text-purple-600 font-medium">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Agendamento</span>
                </div>
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                {user?.email?.split('@')[0]}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard" className="hover:text-purple-600">Dashboard</Link>
            <span>/</span>
            <span>Agendamento</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agendamento</h1>
              <p className="text-gray-600">
                Programe suas publicações nas redes sociais
              </p>
            </div>
            <Button 
              onClick={() => setShowScheduleForm(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agendar Post
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agendados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {scheduledPosts.filter(p => p.status === 'scheduled').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Publicados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {scheduledPosts.filter(p => p.status === 'published').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Plataformas</p>
                  <p className="text-2xl font-bold text-gray-900">6</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mês</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {scheduledPosts.filter(p => {
                      const postDate = new Date(p.scheduled_time);
                      const now = new Date();
                      return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Form Modal */}
        {showScheduleForm && (
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Agendar Novo Post</span>
                <Button variant="ghost" size="sm" onClick={() => setShowScheduleForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Selecione um clip e configure quando e onde publicar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Clip Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clip *</label>
                  <Select value={selectedClip} onValueChange={setSelectedClip}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um clip" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClips.map((clip: any) => (
                        <SelectItem key={clip.id} value={clip.id}>
                          {clip.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plataforma *</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          <div className="flex items-center space-x-2">
                            <platform.icon className="h-4 w-4" />
                            <span>{platform.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Horário *</label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Legenda</label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escreva uma legenda envolvente para seu post..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowScheduleForm(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSchedulePost}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  Agendar Post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Posts */}
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Posts Agendados</CardTitle>
                <CardDescription>Gerencie suas publicações programadas</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadScheduledPosts}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {scheduledPosts.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum post agendado</h3>
                <p className="text-gray-600 mb-6">
                  Comece agendando seu primeiro post para as redes sociais
                </p>
                <Button 
                  onClick={() => setShowScheduleForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Primeiro Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledPosts.map((post) => {
                  const PlatformIcon = getPlatformIcon(post.platform);
                  return (
                    <div key={post.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                      {/* Platform Icon */}
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getPlatformColor(post.platform)} flex items-center justify-center flex-shrink-0`}>
                        <PlatformIcon className="h-6 w-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {post.clip?.title || 'Clip sem título'}
                          </h3>
                          {getStatusBadge(post.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {post.caption || 'Sem legenda'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatDateTime(post.scheduled_time)}
                          </span>
                          <span className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {platforms.find(p => p.id === post.platform)?.name}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {post.status === 'scheduled' && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleCancelPost(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Schedule; 