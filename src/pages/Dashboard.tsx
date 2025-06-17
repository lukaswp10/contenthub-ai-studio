import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bot, 
  Image, 
  Zap, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Plus,
  Crown,
  RefreshCw,
  CreditCard,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const { subscription, session, checkSubscription } = useAuth();
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const handleCheckSubscription = async () => {
    setCheckingSubscription(true);
    await checkSubscription();
    setCheckingSubscription(false);
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

  // Update stats based on subscription tier
  const getGenerationLimit = () => {
    if (subscription.subscription_tier === 'Pro') return "1000";
    if (subscription.subscription_tier === 'Team') return "∞";
    return "10";
  };

  const stats = [
    {
      title: "Gerações de IA",
      value: "0",
      limit: "10",
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
      title: "Conteúdos Criados",
      value: "0",
      icon: Image,
      color: "bg-purple-500"
    },
    {
      title: "Automações",
      value: "0",
      icon: Zap,
      color: "bg-orange-500"
    }
  ];

  const recentProjects = [
    // Vazio por enquanto - será preenchido quando houver dados reais
  ];

  const quickActions = [
    {
      title: "Criar Texto com IA",
      description: "Gere conteúdo usando modelos de linguagem avançados",
      icon: Bot,
      href: "/workspace?type=text"
    },
    {
      title: "Gerar Imagens",
      description: "Crie imagens únicas com inteligência artificial",
      icon: Image,
      href: "/workspace?type=image"
    },
    {
      title: "Automatizar Posts",
      description: "Configure automação para redes sociais",
      icon: Zap,
      href: "/workspace?type=social"
    }
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo ao ContentHub AI. Comece criando seu primeiro conteúdo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {subscription.subscribed && (
              <Badge variant="secondary" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Plano {subscription.subscription_tier}
              </Badge>
            )}
            <Button onClick={handleCheckSubscription} variant="outline" size="sm" disabled={checkingSubscription}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checkingSubscription ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Link to="/workspace">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Conteúdo
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                Comece a criar conteúdo em segundos
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
              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">Nenhum projeto ainda</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comece criando seu primeiro projeto
                  </p>
                  <Link to="/workspace">
                    <Button variant="outline" size="sm">
                      Criar Projeto
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Projects will be listed here when available */}
                </div>
              )}
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
                <div className="text-2xl font-bold text-green-600">10</div>
                <div className="text-sm text-muted-foreground">Limite do plano Free</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-muted-foreground">Créditos utilizados</div>
              </div>
            </div>
            
            {!subscription.subscribed ? (
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
                      Plano {subscription.subscription_tier} Ativo
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