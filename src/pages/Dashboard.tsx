import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Bot, 
  Zap, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Crown,
  RefreshCw,
  Settings,
  Video,
  Sparkles,
  Users,
  Clock,
  CheckCircle,
  Play,
  Upload,
  Target,
  Activity,
  Scissors,
  Calendar,
  Rocket,
  Eye,
  Share2,
  Download,
  Star,
  TrendingDown,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProjectHistory from "@/components/ProjectHistory";

const Dashboard = () => {
  const { toast } = useToast();
  const { user, profile, session, loading, refreshProfile } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [stats, setStats] = useState({
    totalVideos: 0,
    processingVideos: 0,
    completedVideos: 0,
    totalClips: 0,
    scheduledPosts: 0,
    connectedAccounts: 0
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentClips, setRecentClips] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentData();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar estatísticas dos vídeos
      const { data: videos } = await supabase
        .from('videos')
        .select('processing_status')
        .eq('user_id', user.id);

      // Carregar estatísticas dos clips
      const { data: clips } = await supabase
        .from('clips')
        .select('id')
        .eq('user_id', user.id);

      if (videos) {
        setStats({
          totalVideos: videos.length,
          processingVideos: videos.filter(v => ['uploading', 'queued', 'transcribing', 'analyzing', 'generating_clips'].includes(v.processing_status)).length,
          completedVideos: videos.filter(v => v.processing_status === 'ready').length,
          totalClips: clips?.length || 0,
          scheduledPosts: 0, // TODO: Implementar quando tiver tabela de posts agendados
          connectedAccounts: 0 // TODO: Implementar quando tiver tabela de contas conectadas
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar vídeos recentes
      const { data: videos } = await supabase
        .from('videos')
        .select('id, title, processing_status, created_at, duration_seconds')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Carregar clips recentes
      const { data: clips } = await supabase
        .from('clips')
        .select('id, title, created_at, ai_viral_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentVideos(videos || []);
      setRecentClips(clips || []);
    } catch (error) {
      console.error('Error loading recent data:', error);
    }
  };

  // Show loading state while authentication is loading
  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando Dashboard</h2>
            <p className="text-gray-500">Preparando sua experiência...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleRefreshProfile = async () => {
    setCheckingProfile(true);
    try {
      await refreshProfile();
      toast({
        title: 'Perfil atualizado!',
        description: 'Seus dados foram recarregados com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para assinar um plano",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar checkout",
        variant: "destructive"
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao abrir portal do cliente",
        variant: "destructive"
      });
    }
  };

  // Get user plan safely
  const userPlan = profile?.plan_type || 'free';

  // Update stats based on subscription tier
  const getGenerationLimit = () => {
    if (userPlan === 'pro') return "1000";
    if (userPlan === 'agency') return "∞";
    return "10";
  };

  const dashboardStats = [
    {
      title: "Total de Vídeos",
      value: stats.totalVideos.toString(),
      icon: Video,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Vídeos processados",
      trend: "+12% este mês"
    },
    {
      title: "Clips Criados",
      value: stats.totalClips.toString(),
      icon: Scissors,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Clips gerados",
      trend: "+25% esta semana"
    },
    {
      title: "Em Processamento",
      value: stats.processingVideos.toString(),
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description: "Vídeos sendo processados",
      trend: "2 em andamento"
    },
    {
      title: "Agendamentos",
      value: stats.scheduledPosts.toString(),
      icon: Calendar,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Posts programados",
      trend: "5 para esta semana"
    }
  ];

  const quickActions = [
    {
      title: "Upload de Vídeo",
      description: "Enviar novo vídeo para processamento",
      icon: Upload,
      href: "/upload",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Criar Clips",
      description: "Gerar clips de vídeos existentes",
      icon: Scissors,
      href: "/clips",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      title: "Agendar Posts",
      description: "Programar publicações nas redes",
      icon: Calendar,
      href: "/schedule",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Conectar Contas",
      description: "Adicionar redes sociais",
      icon: Share2,
      href: "/automation",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploading: { label: 'Upload', color: 'bg-blue-100 text-blue-800', icon: Upload },
      queued: { label: 'Na Fila', color: 'bg-gray-100 text-gray-800', icon: Clock },
      transcribing: { label: 'Transcrevendo', color: 'bg-yellow-100 text-yellow-800', icon: Activity },
      analyzing: { label: 'Analisando', color: 'bg-purple-100 text-purple-800', icon: Bot },
      generating_clips: { label: 'Gerando Clips', color: 'bg-green-100 text-green-800', icon: Scissors },
      ready: { label: 'Pronto', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { label: 'Falhou', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.queued;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 48) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <AppLayout>
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Bem-vindo de volta! Aqui está o resumo da sua atividade.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshProfile}
              disabled={checkingProfile}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checkingProfile ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button asChild>
              <Link to="/upload">
                <Upload className="h-4 w-4 mr-2" />
                Novo Vídeo
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-medium">{stat.trend}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.title}</p>
                    <p className="text-xs text-slate-500">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Link to={action.href}>
                  <CardContent className="p-6">
                    <div className={`p-3 rounded-xl ${action.bgColor} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 bg-gradient-to-r ${action.color} bg-clip-text text-transparent`} />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-slate-600 mb-4">{action.description}</p>
                    <div className="flex items-center text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                      Começar
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Videos */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vídeos Recentes
              </CardTitle>
              <CardDescription>Seus vídeos mais recentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVideos.length > 0 ? (
                  recentVideos.map((video: any) => (
                    <div key={video.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Video className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{video.title}</p>
                          <p className="text-sm text-slate-500">{formatDate(video.created_at)}</p>
                        </div>
                      </div>
                      {getStatusBadge(video.processing_status)}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhum vídeo ainda</p>
                    <Button asChild className="mt-4">
                      <Link to="/upload">
                        <Upload className="h-4 w-4 mr-2" />
                        Fazer Upload
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Clips */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Clips Recentes
              </CardTitle>
              <CardDescription>Seus clips mais recentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClips.length > 0 ? (
                  recentClips.map((clip: any) => (
                    <div key={clip.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Scissors className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{clip.title}</p>
                          <p className="text-sm text-slate-500">{formatDate(clip.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-slate-700">
                          {clip.ai_viral_score?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Scissors className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhum clip ainda</p>
                    <Button asChild className="mt-4">
                      <Link to="/upload">
                        <Upload className="h-4 w-4 mr-2" />
                        Criar Clips
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        {userPlan === 'free' && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Crown className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Upgrade para Pro</h3>
                    <p className="text-sm text-slate-600">Desbloqueie recursos avançados e aumente seus limites</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={() => handleUpgrade('pro')}>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                  <Button variant="outline" onClick={() => handleUpgrade('agency')}>
                    <Rocket className="h-4 w-4 mr-2" />
                    Agency
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
