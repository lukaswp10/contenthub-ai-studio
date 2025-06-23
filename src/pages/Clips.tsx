import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Scissors, 
  Search, 
  Filter, 
  Play, 
  Download, 
  Share2, 
  Star, 
  Calendar,
  Eye,
  TrendingUp,
  MoreHorizontal,
  Grid3X3,
  List,
  RefreshCw,
  Plus,
  Sparkles,
  Target,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Clip {
  id: string;
  title: string;
  created_at: string;
  ai_viral_score: number;
  ai_hook_strength: number;
  ai_content_category: string;
  ai_best_platform: string[];
  hashtags: string[];
  thumbnail_url: string;
  cloudinary_secure_url: string;
  video_id: string;
  start_time_seconds: number;
  end_time_seconds: number;
}

const Clips = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadClips();
  }, []);

  const loadClips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clips')
        .select(`
          id,
          title,
          created_at,
          ai_viral_score,
          ai_hook_strength,
          ai_content_category,
          ai_best_platform,
          hashtags,
          thumbnail_url,
          cloudinary_secure_url,
          video_id,
          start_time_seconds,
          end_time_seconds
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClips(data || []);
    } catch (error) {
      console.error('Error loading clips:', error);
      toast({
        title: "Erro ao carregar clips",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClips = clips.filter(clip => {
    const matchesSearch = clip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clip.hashtags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || clip.ai_content_category === filterCategory;
    const matchesPlatform = filterPlatform === 'all' || clip.ai_best_platform?.includes(filterPlatform);
    
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  const sortedClips = [...filteredClips].sort((a, b) => {
    switch (sortBy) {
      case 'viral':
        return (b.ai_viral_score || 0) - (a.ai_viral_score || 0);
      case 'hook':
        return (b.ai_hook_strength || 0) - (a.ai_hook_strength || 0);
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  const handleDownload = async (clip: Clip) => {
    try {
      const response = await fetch(clip.cloudinary_secure_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clip.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download iniciado",
        description: "O clip está sendo baixado."
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (clip: Clip) => {
    try {
      await navigator.clipboard.writeText(clip.cloudinary_secure_url);
      toast({
        title: "Link copiado",
        description: "O link do clip foi copiado para a área de transferência."
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: number, end: number) => {
    const duration = end - start;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getViralScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'news': 'bg-blue-100 text-blue-800',
      'educational': 'bg-green-100 text-green-800',
      'entertainment': 'bg-purple-100 text-purple-800',
      'lifestyle': 'bg-pink-100 text-pink-800',
      'gaming': 'bg-orange-100 text-orange-800',
      'music': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const categories = ['all', 'news', 'educational', 'entertainment', 'lifestyle', 'gaming', 'music'];
  const platforms = ['all', 'youtube', 'instagram', 'tiktok', 'twitter', 'linkedin'];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Carregando seus clips...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Meus Clips</h1>
            <p className="text-slate-600 mt-1">
              Gerencie e organize seus clips criados com IA
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={loadClips}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button asChild>
              <Link to="/upload">
                <Plus className="h-4 w-4 mr-2" />
                Novo Vídeo
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Scissors className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{clips.length}</p>
                  <p className="text-sm text-slate-600">Total de Clips</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {clips.length > 0 ? (clips.reduce((acc, clip) => acc + (clip.ai_viral_score || 0), 0) / clips.length).toFixed(1) : '0'}
                  </p>
                  <p className="text-sm text-slate-600">Score Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {clips.filter(clip => (clip.ai_viral_score || 0) >= 8).length}
                  </p>
                  <p className="text-sm text-slate-600">Alto Potencial</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {clips.filter(clip => (clip.ai_hook_strength || 0) >= 8).length}
                  </p>
                  <p className="text-sm text-slate-600">Hooks Fortes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 items-center space-x-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar clips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Plataformas</SelectItem>
                    {platforms.slice(1).map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais Recentes</SelectItem>
                    <SelectItem value="oldest">Mais Antigos</SelectItem>
                    <SelectItem value="viral">Score Viral</SelectItem>
                    <SelectItem value="hook">Hook Strength</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clips Grid/List */}
        {sortedClips.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Scissors className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum clip encontrado</h3>
              <p className="text-slate-600 mb-6">
                {searchTerm || filterCategory !== 'all' || filterPlatform !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece fazendo upload de um vídeo para gerar clips com IA.'
                }
              </p>
              <Button asChild>
                <Link to="/upload">
                  <Plus className="h-4 w-4 mr-2" />
                  Fazer Upload
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {sortedClips.map((clip) => (
              <Card key={clip.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-100 rounded-t-lg overflow-hidden">
                    {clip.thumbnail_url ? (
                      <img 
                        src={clip.thumbnail_url} 
                        alt={clip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                        <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white" onClick={() => handleDownload(clip)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white" onClick={() => handleShare(clip)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(clip.start_time_seconds, clip.end_time_seconds)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 line-clamp-2 flex-1">
                        {clip.title}
                      </h3>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className={`text-sm font-medium px-2 py-1 rounded ${getViralScoreColor(clip.ai_viral_score || 0)}`}>
                          {clip.ai_viral_score?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-slate-600">
                          {clip.ai_hook_strength?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getCategoryColor(clip.ai_content_category)}>
                        {clip.ai_content_category}
                      </Badge>
                      {clip.ai_best_platform?.slice(0, 2).map(platform => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>

                    {/* Hashtags */}
                    {clip.hashtags && clip.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {clip.hashtags.slice(0, 3).map(hashtag => (
                          <span key={hashtag} className="text-xs text-slate-500">
                            {hashtag}
                          </span>
                        ))}
                        {clip.hashtags.length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{clip.hashtags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(clip.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(clip)}>
                          <Download className="h-3 w-3 mr-1" />
                          Baixar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleShare(clip)}>
                          <Share2 className="h-3 w-3 mr-1" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Clips; 