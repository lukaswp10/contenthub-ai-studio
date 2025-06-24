import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Scissors, 
  Zap, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Crown,
  Play,
  TrendingUp,
  Clock,
  BarChart3,
  Upload,
  Smartphone,
  Users,
  Brain,
  Target,
  Sparkles,
  Rocket,
  Globe,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const features = [
    {
      icon: Scissors,
      title: "Corte Inteligente",
      description: "IA analisa transcrição e encontra momentos virais automaticamente em 99 idiomas."
    },
    {
      icon: Smartphone,
      title: "12+ Redes Sociais", 
      description: "TikTok, Instagram, YouTube, Twitter, LinkedIn... Uma upload, posts em todas."
    },
    {
      icon: Clock,
      title: "Agenda Automática",
      description: "3 posts por dia nos melhores horários. Nunca repete o mesmo clip."
    },
    {
      icon: BarChart3,
      title: "Analytics Reais",
      description: "Views, likes, shares de cada clip. Descubra que tipo de conteúdo viraliza."
    }
  ];

  const useCases = [
    {
      icon: "🎙️",
      title: "Podcasters",
      description: "Episódios → Clips TikTok"
    },
    {
      icon: "📚", 
      title: "Educadores",
      description: "Aulas → Pílulas conhecimento"
    },
    {
      icon: "🎮",
      title: "Streamers", 
      description: "Lives → Highlights épicos"
    },
    {
      icon: "💼",
      title: "Empresas",
      description: "Webinars → Marketing content"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "R$ 0",
      period: "/mês",
      description: "Para experimentar",
      features: [
        "1 vídeo por mês",
        "3 clips por vídeo",
        "1 conta social",
        "1GB de armazenamento"
      ],
      cta: "Começar Grátis",
      popular: false
    },
    {
      name: "Creator",
      price: "R$ 29",
      period: "/mês", 
      description: "Para criadores profissionais",
      features: [
        "10 vídeos por mês",
        "Clips ilimitados",
        "5 contas sociais",
        "50GB de armazenamento",
        "Analytics avançados",
        "Suporte prioritário"
      ],
      cta: "Assinar Creator",
      popular: true
    },
    {
      name: "Agency",
      price: "R$ 99",
      period: "/mês",
      description: "Para agências e equipes",
      features: [
        "Vídeos ilimitados",
        "Clips ilimitados", 
        "20 contas sociais",
        "500GB de armazenamento",
        "Analytics avançados",
        "White-label",
        "Suporte 24/7"
      ],
      cta: "Assinar Agency",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Felipe Castro",
      role: "Podcaster - 2M seguidores",
      content: "Meu podcast de 3h virou 15 clips virais. ClipsForge aumentou meu alcance no TikTok em 500%!",
      rating: 5
    },
    {
      name: "Ana Oliveira", 
      role: "Educadora Online",
      content: "Transformo minhas aulas em pílulas de conhecimento que viralizam. 10 minutos e tenho conteúdo para a semana toda.",
      rating: 5
    },
    {
      name: "Lucas Mendes",
      role: "Streamer Twitch",
      content: "Meus highlights agora viram clips automáticos no TikTok. Nunca mais vou cortar vídeo manualmente!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              ClipsForge
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/auth/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth/register">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-200">
            🚀 Revolucione seu conteúdo com IA
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent leading-tight">
            Transforme Vídeos em
            <br />
            <span className="relative">
              Clips Virais
              <div className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-yellow-300 to-orange-300 opacity-30 rounded-full"></div>
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Nossa IA avançada analisa seus vídeos longos e cria automaticamente clips curtos otimizados 
            para TikTok, Instagram Reels e YouTube Shorts. Maximize seu alcance sem esforço.
          </p>
          
                     <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
             <Link to="/auth/register">
               <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-8 py-4">
                 <Rocket className="mr-2 h-5 w-5" />
                 Começar Grátis Agora
               </Button>
             </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 hover:bg-gray-50">
              <Play className="mr-2 h-5 w-5" />
              Ver Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">10x</div>
              <div className="text-gray-600">Mais Engajamento</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">5min</div>
              <div className="text-gray-600">Para Processar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">50+</div>
              <div className="text-gray-600">Clips por Vídeo</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Recursos Revolucionários
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tecnologia de ponta para transformar seu conteúdo em viral
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">IA Avançada</CardTitle>
                <CardDescription>
                  Algoritmos de machine learning identificam automaticamente os melhores momentos do seu vídeo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Geração Automática</CardTitle>
                <CardDescription>
                  Crie dezenas de clips otimizados em minutos, não horas de edição manual
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Multi-Plataforma</CardTitle>
                <CardDescription>
                  Formatos otimizados para TikTok, Instagram Reels, YouTube Shorts e mais
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Analytics Inteligente</CardTitle>
                <CardDescription>
                  Insights profundos sobre performance e engajamento dos seus clips
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Agendamento Automático</CardTitle>
                <CardDescription>
                  Publique seus clips nos melhores horários para máximo engajamento
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-pink-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Templates Profissionais</CardTitle>
                <CardDescription>
                  Biblioteca de templates e estilos para diferentes nichos e audiências
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600">
              3 passos simples para clips virais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload do Vídeo</h3>
              <p className="text-gray-600">
                Faça upload do seu vídeo longo. Suportamos MP4, MOV, AVI e mais formatos
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">IA Analisa</h3>
              <p className="text-gray-600">
                Nossa IA identifica os momentos mais envolventes e cria clips otimizados
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Publique & Monitore</h3>
              <p className="text-gray-600">
                Publique automaticamente e acompanhe o desempenho com analytics detalhados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para Viralizar?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a milhares de criadores que já estão transformando seus vídeos em clips virais
          </p>
          
                     <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
             <Link to="/auth/register">
               <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4">
                 <TrendingUp className="mr-2 h-5 w-5" />
                 Começar Grátis Agora
               </Button>
             </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm opacity-75">
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Sem cartão de crédito
            </div>
            <div className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              100% Seguro
            </div>
            <div className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Suporte 24/7
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold">ClipsForge</span>
            </div>
            
            <div className="text-center text-gray-400">
              <p>&copy; 2024 ClipsForge. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;