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
  Activity
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
    connectedAccounts: 0
  });

  useEffect(() => {
    loadStats();
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

      if (videos) {
        setStats({
          totalVideos: videos.length,
          processingVideos: videos.filter(v => ['uploading', 'queued', 'transcribing', 'analyzing', 'generating_clips'].includes(v.processing_status)).length,
          completedVideos: videos.filter(v => v.processing_status === 'ready').length,
          connectedAccounts: 0 // TODO: Implementar quando tiver tabela de contas conectadas
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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
      description: "Vídeos processados"
    },
    {
      title: "Em Processamento",
      value: stats.processingVideos.toString(),
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      description: "Vídeos sendo processados"
    },
    {
      title: "Concluídos",
      value: stats.completedVideos.toString(),
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      description: "Vídeos prontos"
    },
    {
      title: "Contas Conectadas",
      value: stats.connectedAccounts.toString(),
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      description: "Redes sociais"
    }
  ];

  const quickActions = [
    {
      title: "Upload de Vídeo",
      description: "Faça upload e processe seus vídeos com IA",
      icon: Upload,
      href: "/upload",
      color: "from-blue-500 to-purple-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Automação Social",
      description: "Configure e gerencie suas redes sociais",
      icon: Zap,
      href: "/automation",
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50"
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-8">
          {/* Header with Welcome Message */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold">
                      Bem-vindo, {profile?.full_name || user?.email?.split('@')[0]}!
                    </h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Transforme seus vídeos em conteúdo viral com IA
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link to="/upload">
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Novo Upload
                    </Button>
                  </Link>
                  {userPlan !== 'free' && (
                    <Badge className="bg-white/20 text-white border-white/30 flex items-center gap-2 justify-center">
                      <Crown className="h-4 w-4" />
                      Plano {userPlan.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-800 group-hover:text-gray-900">
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-500">{stat.description}</div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors">
                      {stat.title}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions and Recent Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Ações Rápidas</CardTitle>
                    <CardDescription>
                      Acesse rapidamente as principais funcionalidades
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="group flex items-center p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-300 hover:shadow-md"
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} mr-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 group-hover:text-gray-900">{action.title}</h4>
                        <p className="text-sm text-gray-600 group-hover:text-gray-700">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Projetos Recentes</CardTitle>
                    <CardDescription>
                      Seus últimos projetos e conteúdos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProjectHistory />
              </CardContent>
            </Card>
          </div>

          {/* Usage Overview */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Resumo de Uso</CardTitle>
                  <CardDescription>
                    Acompanhe seu consumo de APIs e recursos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="text-center p-6 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                  <div className="text-sm text-blue-700 font-medium">Gerações este mês</div>
                </div>
                <div className="text-center p-6 rounded-xl bg-gradient-to-r from-green-50 to-green-100">
                  <div className="text-3xl font-bold text-green-600 mb-2">{getGenerationLimit()}</div>
                  <div className="text-sm text-green-700 font-medium">Limite do plano {userPlan}</div>
                </div>
                <div className="text-center p-6 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100">
                  <div className="text-3xl font-bold text-purple-600 mb-2">0%</div>
                  <div className="text-sm text-purple-700 font-medium">Utilização</div>
                </div>
              </div>
              
              {userPlan === 'free' ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xl font-semibold flex items-center gap-2">
                          <Crown className="h-5 w-5" />
                          Upgrade para Pro
                        </h4>
                        <p className="text-blue-100">
                          Desbloqueie 1000 gerações por mês e recursos avançados
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleUpgrade('pro')}
                        className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Fazer Upgrade
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xl font-semibold flex items-center gap-2">
                          <Crown className="h-5 w-5" />
                          Plano {userPlan.toUpperCase()} Ativo
                        </h4>
                        <p className="text-green-100">
                          Gerencie sua assinatura no portal do cliente
                        </p>
                      </div>
                      <Button 
                        onClick={handleManageSubscription}
                        className="bg-white text-green-600 hover:bg-green-50 shadow-lg"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar Assinatura
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
