import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bot, 
  Zap, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Crown,
  RefreshCw,
  Settings,
  Video
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

  // Show loading state while authentication is loading
  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando...</p>
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
        title: 'Plano atualizado!',
        description: 'Seu plano foi recarregado com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao atualizar plano',
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

  const stats = [
    {
      title: "Gerações de IA",
      value: "0",
      limit: getGenerationLimit(),
      icon: Bot,
      color: "bg-blue-500"
    },
    {
      title: "Projetos Ativos",
      value: "0",
      icon: BarChart,
      color: "bg-green-500"
    },
    {
      title: "Contas Conectadas",
      value: "0",
      icon: Zap,
      color: "bg-purple-500"
    }
  ];

  const quickActions = [
    {
      title: "Automação Social",
      description: "Configure e gerencie suas redes sociais",
      icon: Zap,
      href: "/automation"
    }
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo ao ClipsForge. Gerencie seus conteúdos e automações.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link to="/upload">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Upload
              </Button>
            </Link>
            {userPlan !== 'free' && (
              <Badge variant="secondary" className="flex items-center gap-2 justify-center">
                <Crown className="h-4 w-4" />
                Plano {userPlan}
              </Badge>
            )}
            <Button onClick={handleRefreshProfile} variant="outline" size="sm" disabled={checkingProfile} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${checkingProfile ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Link to="/automation">
              <Button className="w-full sm:w-auto">
                <Zap className="h-4 w-4 mr-2" />
                Automação Social
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md ${stat.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stat.value}
                    {stat.limit && <span className="text-sm text-muted-foreground">/{stat.limit}</span>}
                  </div>
                  {stat.limit && (
                    <Progress value={0} className="mt-2" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.href}
                    className="flex items-center p-4 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-primary/10 mr-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Projetos Recentes</CardTitle>
              <CardDescription>
                Seus últimos projetos e conteúdos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectHistory />
            </CardContent>
          </Card>
        </div>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Uso</CardTitle>
            <CardDescription>
              Acompanhe seu consumo de APIs e recursos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Gerações este mês</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getGenerationLimit()}</div>
                <div className="text-sm text-muted-foreground">Limite do plano {userPlan}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-muted-foreground">Créditos utilizados</div>
              </div>
            </div>
            
            {userPlan === 'free' ? (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Upgrade para Pro</h4>
                    <p className="text-sm text-muted-foreground">
                      Desbloqueie 1000 gerações por mês e recursos avançados
                    </p>
                  </div>
                  <Button onClick={() => handleUpgrade('pro')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Plano {userPlan} Ativo
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Gerencie sua assinatura no portal do cliente
                    </p>
                  </div>
                  <Button onClick={handleManageSubscription}>
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
