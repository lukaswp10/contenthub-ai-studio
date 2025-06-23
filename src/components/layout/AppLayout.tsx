import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Zap, 
  FolderOpen, 
  BarChart, 
  Settings, 
  Bot, 
  Bell, 
  Menu, 
  X,
  LogOut,
  User,
  ChevronDown,
  Crown,
  CreditCard,
  HelpCircle,
  Shield,
  Video,
  Sparkles,
  Home,
  Scissors,
  Calendar,
  TrendingUp,
  PlayCircle,
  Upload,
  Target,
  Rocket
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, profile } = useAuth();
  const { toast } = useToast();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      description: 'Visão geral e métricas',
      category: 'main'
    },
    {
      name: 'Upload',
      href: '/upload',
      icon: Upload,
      description: 'Enviar novo vídeo',
      highlight: true,
      category: 'main'
    },
    { 
      name: 'Meus Clips', 
      href: '/clips', 
      icon: Scissors,
      description: 'Gerenciar clips criados',
      category: 'content'
    },
    { 
      name: 'Agendamento', 
      href: '/schedule', 
      icon: Calendar,
      description: 'Programar publicações',
      category: 'content'
    },
    { 
      name: 'Automação', 
      href: '/automation', 
      icon: Zap,
      description: 'Gerenciar contas sociais',
      category: 'automation'
    },
    { 
      name: 'Workspace', 
      href: '/workspace', 
      icon: Bot,
      description: 'Criar conteúdo com IA',
      category: 'automation'
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: TrendingUp,
      description: 'Relatórios e insights',
      category: 'analytics'
    },
    { 
      name: 'Configurações', 
      href: '/settings', 
      icon: Settings,
      description: 'Preferências da conta',
      category: 'settings'
    },
  ];

  const navigationGroups = {
    main: { title: 'Principal', icon: Home },
    content: { title: 'Conteúdo', icon: PlayCircle },
    automation: { title: 'Automação', icon: Rocket },
    analytics: { title: 'Analytics', icon: Target },
    settings: { title: 'Configurações', icon: Settings }
  };

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const getPlanInfo = () => {
    const plan = profile?.plan_type || 'free';
    let name = plan.charAt(0).toUpperCase() + plan.slice(1);
    let color = 'text-yellow-600';
    let bgColor = 'bg-yellow-50';
    if (plan === 'pro') {
      color = 'text-purple-600';
      bgColor = 'bg-purple-50';
    } else if (plan === 'agency') {
      color = 'text-blue-600';
      bgColor = 'bg-blue-50';
    }
    return {
      name,
      icon: <Crown className="h-3 w-3" />,
      color,
      bgColor
    };
  };

  const planInfo = getPlanInfo();

  const groupedNavigation = Object.entries(navigationGroups).map(([key, group]) => ({
    ...group,
    items: navigation.filter(item => item.category === key)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-row">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ClipsForge
                </h1>
                <p className="text-sm text-slate-500 font-medium">AI Studio</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {groupedNavigation.map((group) => (
              <div key={group.title} className="space-y-2">
                <div className="flex items-center px-3 py-2">
                  <group.icon className="h-4 w-4 text-slate-400 mr-2" />
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                          active
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mr-3 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                        <span className="flex-1">{item.name}</span>
                        {item.highlight && !active && (
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                        )}
                        {active && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200/50">
            <div className={`${planInfo.bgColor} rounded-2xl p-4 border border-slate-200/50`}>
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/50">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center space-x-1">
                    {planInfo.icon}
                    <p className={`text-xs font-medium ${planInfo.color}`}>{planInfo.name}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-slate-200 hover:bg-white/50"
                onClick={handleLogout}
              >
                <LogOut className="h-3 w-3 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-72 w-full">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-sm w-full">
          <div className="flex h-16 items-center px-4 lg:px-8">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb */}
            <div className="flex items-center space-x-3 text-sm text-slate-600">
              <Home className="h-4 w-4" />
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </span>
            </div>

            <div className="flex-1" />

            {/* Header actions */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions */}
              <Button variant="outline" size="sm" className="hidden sm:flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Novo Vídeo</span>
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
              </Button>
              
              {/* User menu */}
              <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2 rounded-xl">
                    <Avatar className="h-9 w-9 ring-2 ring-slate-100">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold truncate max-w-32 lg:max-w-40">{user?.email}</p>
                      <div className="flex items-center space-x-1">
                        {planInfo.icon}
                        <p className={`text-xs font-medium ${planInfo.color}`}>{planInfo.name}</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="p-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{user?.email}</p>
                        <p className={`text-xs font-medium ${planInfo.color}`}>{planInfo.name} Plan</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="p-3 rounded-lg">
                    <Link to="/settings" className="flex items-center">
                      <User className="h-4 w-4 mr-3" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="p-3 rounded-lg">
                    <Link to="/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-3" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="p-3 rounded-lg">
                    <Link to="/billing" className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-3" />
                      Faturamento
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 p-3 rounded-lg">
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="w-full grow">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;
