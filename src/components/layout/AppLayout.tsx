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
  Video
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
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      description: 'Visão geral e métricas'
    },
    {
      name: 'Upload',
      href: '/upload',
      icon: Video,
      description: 'Enviar novo vídeo',
      highlight: true
    },
    { 
      name: 'Automação', 
      href: '/automation', 
      icon: Zap,
      description: 'Gerenciar contas sociais'
    },
    { 
      name: 'Workspace', 
      href: '/workspace', 
      icon: Bot,
      description: 'Criar conteúdo com IA'
    },
    { 
      name: 'Projetos', 
      href: '/projects', 
      icon: FolderOpen,
      description: 'Organizar campanhas'
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: BarChart,
      description: 'Relatórios e insights'
    },
    { 
      name: 'Configurações', 
      href: '/settings', 
      icon: Settings,
      description: 'Preferências da conta'
    },
  ];

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
    // Mock - você pode integrar com seu sistema de planos
    return {
      name: 'Free',
      icon: <Crown className="h-3 w-3" />,
      color: 'text-yellow-600'
    };
  };

  const planInfo = getPlanInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex h-16 items-center px-4 lg:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ContentHub AI
            </span>
          </Link>

          <div className="flex-1" />

          {/* Header actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </Button>
            
            {/* User menu */}
            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <div className="flex items-center space-x-1">
                      {planInfo.icon}
                      <p className="text-xs text-muted-foreground">{planInfo.name}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">Plano {planInfo.name}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/billing" className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Faturamento
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/help" className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Ajuda
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/privacy" className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacidade
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-transform lg:translate-x-0 lg:static lg:inset-0 shadow-lg
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex h-full flex-col pt-16 lg:pt-0">
            <div className="flex-1 px-4 py-6">
              <nav className="space-y-1">
                <ul className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-blue-50 dark:hover:bg-slate-800 ${isActive(item.href) ? 'bg-blue-100 dark:bg-slate-700 font-semibold' : ''} ${item.highlight ? 'border-l-4 border-blue-600 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                        {item.highlight && <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-600 text-white">Novo</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="p-4 space-y-4">
              <Separator />
              
              {/* Usage stats */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Uso deste mês
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">0/10</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Gerações de IA</span>
                    <span className="text-slate-500 dark:text-slate-400">0/10</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Posts agendados</span>
                    <span className="text-slate-500 dark:text-slate-400">0/50</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>

              {/* Upgrade card */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                    Upgrade para Pro
                  </h3>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-200 mb-3">
                  Desbloqueie recursos avançados e aumente seus limites
                </p>
                <Button size="sm" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Upgrade
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
