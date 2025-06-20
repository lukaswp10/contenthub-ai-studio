import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Image, 
  Zap, 
  Sparkles, 
  Copy, 
  Download, 
  Share, 
  Crown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Wand2
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Workspace = () => {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'text');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // Form states
  const [textPrompt, setTextPrompt] = useState('');
  const [textType, setTextType] = useState('blog');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('realistic');
  const [socialPlatform, setSocialPlatform] = useState('instagram');
  const [socialTopic, setSocialTopic] = useState('');

  // Usage stats (mock data for now)
  const [usageStats, setUsageStats] = useState({
    used: 0,
    limit: profile?.plan_type !== 'free' ? (profile?.plan_type === 'agency' ? 999 : 1000) : 10
  });

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['text', 'image', 'social'].includes(type)) {
      setActiveTab(type);
    }
  }, [searchParams]);

  const checkUsageLimit = () => {
    if (usageStats.used >= usageStats.limit) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de gerações. Faça upgrade para continuar.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const updateUsage = () => {
    setUsageStats(prev => ({ ...prev, used: prev.used + 1 }));
  };

  const generateText = async () => {
    if (!checkUsageLimit()) return;
    
    setLoading(true);
    try {
      // Simular chamada para API de IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = {
        blog: `# ${textPrompt}

Este é um exemplo de conteúdo gerado por IA para blog. 

## Introdução
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Desenvolvimento
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Conclusão
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
        
        email: `Assunto: ${textPrompt}

Olá!

Esperamos que você esteja bem. Estamos escrevendo para informar sobre nossa nova funcionalidade incrível.

Com nossa plataforma, você pode:
• Gerar conteúdo em segundos
• Automatizar suas redes sociais  
• Criar imagens únicas

Não perca essa oportunidade!

Atenciosamente,
Equipe ContentHub AI`,

        social: `🚀 ${textPrompt}

✨ Conteúdo criado com inteligência artificial
🎯 Otimizado para engajamento
💡 Pronto para publicar

#IA #ContentHub #Automacao #Marketing`
      };

      setResult(mockResults[textType as keyof typeof mockResults] || mockResults.blog);
      updateUsage();
      
      toast({
        title: "Conteúdo gerado!",
        description: "Seu texto foi criado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar conteúdo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!checkUsageLimit()) return;
    
    setLoading(true);
    try {
      // Simular chamada para API de IA
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // URL de imagem placeholder
      setResult('https://picsum.photos/512/512?random=' + Date.now());
      updateUsage();
      
      toast({
        title: "Imagem gerada!",
        description: "Sua imagem foi criada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar imagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSocial = async () => {
    if (!checkUsageLimit()) return;
    
    setLoading(true);
    try {
      // Simular chamada para API de IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPosts = {
        instagram: `📸 ${socialTopic}

✨ Momento incrível capturado! 
🌟 Cada detalhe conta uma história
💫 Inspire-se e seja inspiração

#${socialTopic.replace(/\s+/g, '')} #ContentHub #IA #Inspiration`,

        twitter: `🚀 ${socialTopic}

A revolução da IA está transformando como criamos conteúdo. Em segundos, ideias se tornam realidade!

#${socialTopic.replace(/\s+/g, '')} #IA #Inovacao`,

        linkedin: `💼 ${socialTopic}

No mundo dos negócios de hoje, a eficiência é fundamental. Nossa plataforma de IA permite que profissionais criem conteúdo de qualidade em uma fração do tempo.

Principais benefícios:
• Economia de tempo
• Consistência na comunicação  
• Maior produtividade

#${socialTopic.replace(/\s+/g, '')} #Negocios #IA #Produtividade`
      };

      setResult(mockPosts[socialPlatform as keyof typeof mockPosts] || mockPosts.instagram);
      updateUsage();
      
      toast({
        title: "Post gerado!",
        description: "Seu conteúdo para redes sociais foi criado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar post. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  const downloadResult = () => {
    if (activeTab === 'image' && result.startsWith('http')) {
      // Download da imagem
      const link = document.createElement('a');
      link.href = result;
      link.download = 'generated-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Download do texto
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-content.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: "Download iniciado!",
      description: "Arquivo baixado com sucesso.",
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workspace</h1>
            <p className="text-muted-foreground">
              Crie conteúdo incrível com inteligência artificial
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profile?.plan_type !== 'free' && (
              <Badge variant="secondary" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Plano {profile.plan_type}
              </Badge>
            )}
          </div>
        </div>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uso Mensal</CardTitle>
            <CardDescription>
              {usageStats.used} de {usageStats.limit === 999 ? '∞' : usageStats.limit} gerações utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress 
              value={(usageStats.used / (usageStats.limit === 999 ? 100 : usageStats.limit)) * 100} 
              className="w-full" 
            />
            {usageStats.used >= usageStats.limit && (
              <div className="flex items-center gap-2 mt-3 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Limite atingido. Faça upgrade para continuar.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Criar Conteúdo</CardTitle>
              <CardDescription>
                Escolha o tipo de conteúdo e descreva o que deseja gerar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Texto
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Imagem
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Social
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-type">Tipo de Conteúdo</Label>
                    <Select value={textType} onValueChange={setTextType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Artigo de Blog</SelectItem>
                        <SelectItem value="email">Email Marketing</SelectItem>
                        <SelectItem value="social">Post para Redes Sociais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="text-prompt">Descreva o que deseja</Label>
                    <Textarea
                      id="text-prompt"
                      placeholder="Ex: Escreva um artigo sobre os benefícios da inteligência artificial no marketing digital..."
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={generateText} 
                    disabled={loading || !textPrompt.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Texto
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-style">Estilo da Imagem</Label>
                    <Select value={imageStyle} onValueChange={setImageStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Realista</SelectItem>
                        <SelectItem value="artistic">Artístico</SelectItem>
                        <SelectItem value="cartoon">Cartoon</SelectItem>
                        <SelectItem value="abstract">Abstrato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-prompt">Descreva a imagem</Label>
                    <Textarea
                      id="image-prompt"
                      placeholder="Ex: Um gato fofo dormindo em uma cama com raios de sol..."
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={generateImage} 
                    disabled={loading || !imagePrompt.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Gerar Imagem
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="social-platform">Plataforma</Label>
                    <Select value={socialPlatform} onValueChange={setSocialPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social-topic">Tópico do Post</Label>
                    <Input
                      id="social-topic"
                      placeholder="Ex: Dicas de produtividade"
                      value={socialTopic}
                      onChange={(e) => setSocialTopic(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={generateSocial} 
                    disabled={loading || !socialTopic.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Gerar Post
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Result Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Resultado
                {result && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">Gerado!</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {result ? 'Seu conteúdo está pronto!' : 'O resultado aparecerá aqui após a geração'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {activeTab === 'image' && result.startsWith('http') ? (
                    <div className="relative">
                      <img 
                        src={result} 
                        alt="Imagem gerada" 
                        className="w-full rounded-lg border"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button onClick={copyToClipboard} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button onClick={downloadResult} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aguardando geração de conteúdo...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Workspace;