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
  Users
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ClipsForge
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>
              <a href="#casos" className="text-muted-foreground hover:text-foreground transition-colors">
                Casos de Uso
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button className="bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md hover:from-green-600 hover:to-blue-700 flex items-center gap-2 w-full sm:w-auto">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/upload">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 w-full sm:w-auto">
                      <Upload className="h-4 w-4" />
                      Novo Upload
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="w-full sm:w-auto">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto">
                      Começar Grátis
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 border-purple-200 bg-purple-50 text-purple-700">
            <Video className="h-4 w-4 mr-2" />
            Automação de Clips Virais
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            De Podcast para TikTok Viral
            <br />
            em 10 Minutos
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            IA corta seus vídeos longos em clips épicos e posta automaticamente 3x por dia.
            <br />
            <span className="font-semibold text-foreground">
              Transforme 2h de conteúdo em 12 clips virais sem esforço.
            </span>
          </p>
          
          {/* Demo Visual */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="bg-card rounded-xl border border-border p-8 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">📤 Upload 2h de podcast</h3>
                  <p className="text-sm text-muted-foreground">
                    Arraste e solte seu vídeo longo
                  </p>
                </div>
                
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Scissors className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">🤖 IA gera 12 clips automáticos</h3>
                  <p className="text-sm text-muted-foreground">
                    Analisa conteúdo e corta momentos virais
                  </p>
                </div>
                
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Smartphone className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">📱 3 posts/dia automáticos</h3>
                  <p className="text-sm text-muted-foreground">
                    TikTok + Instagram + YouTube Shorts
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Play className="h-5 w-5 mr-2" />
                Começar Gratuitamente
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-purple-200 hover:bg-purple-50">
              <Video className="h-5 w-5 mr-2" />
              Ver Demo
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            ✨ Sem cartão de crédito • 1 vídeo grátis • Setup em 2 minutos
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Automação Completa de Clips
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Da transcrição até o posting automático, nossa IA cuida de tudo para você viralizar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="casos" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Para Todos os Criadores
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Não importa seu nicho, ClipsForge transforma seu conteúdo longo em viralização automática.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="text-center border-border/50 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50">
                <CardContent className="pt-8">
                  <div className="text-4xl mb-4">{useCase.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{useCase.title}</h3>
                  <p className="text-muted-foreground font-medium">{useCase.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Preços Baseados em Uso Real
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pague apenas pelo que usar. Comece grátis e escale conforme cresce.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-purple-500 shadow-2xl scale-105 bg-gradient-to-br from-white to-purple-50' : 'border-border/50 bg-white'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <Crown className="h-4 w-4 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="block">
                    <Button className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`} variant={plan.popular ? "default" : "outline"}>
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Criadores Que Viralizaram
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Centenas de criadores já multiplicaram seu alcance com ClipsForge.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50 bg-gradient-to-br from-white to-gray-50">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground font-medium">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto para Viralizar Automaticamente?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Transforme seu primeiro vídeo em clips virais em menos de 10 minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100">
                  <Play className="h-5 w-5 mr-2" />
                  Começar Agora - Grátis
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                <Users className="h-5 w-5 mr-2" />
                Falar com Vendas
              </Button>
            </div>
            <p className="text-sm opacity-75">
              ✨ 1 vídeo grátis • Setup em 2 minutos • Suporte 24/7
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ClipsForge
                </span>
              </div>
              <p className="text-muted-foreground">
                Transforme vídeos longos em clips virais automaticamente.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Como Funciona</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Casos de Uso</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Podcasters</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Educadores</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Streamers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Empresas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutoriais</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 ClipsForge. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;