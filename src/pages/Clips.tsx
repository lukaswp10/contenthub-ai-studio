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
  Zap,
  Video,
  ArrowLeft,
  Home,
  Upload,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
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
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'news': 'bg-blue-50 text-blue-700 border-blue-200',
      'educational': 'bg-green-50 text-green-700 border-green-200',
      'entertainment': 'bg-purple-50 text-purple-700 border-purple-200',
      'lifestyle': 'bg-pink-50 text-pink-700 border-pink-200',
      'gaming': 'bg-orange-50 text-orange-700 border-orange-200',
      'default': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando seus clips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Navegação */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  ClipsForge
                </span>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/upload" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Link>
                <div className="flex items-center space-x-2 text-purple-600 font-medium">
                  <Scissors className="h-4 w-4" />
                  <span>Meus Clips</span>
                </div>
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                {user?.email?.split('@')[0]}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard" className="hover:text-purple-600">Dashboard</Link>
            <span>/</span>
            <span>Meus Clips</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Clips</h1>
          <p className="text-gray-600">
            Gerencie e compartilhe seus clips criados pela IA
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Clips</p>
                  <p className="text-2xl font-bold text-gray-900">{clips.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Scissors className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Score Médio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clips.length > 0 ? (clips.reduce((acc, clip) => acc + (clip.ai_viral_score || 0), 0) / clips.length).toFixed(1) : '0.0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clips Virais</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clips.filter(clip => (clip.ai_viral_score || 0) >= 8).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mês</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clips.filter(clip => {
                      const clipDate = new Date(clip.created_at);
                      const now = new Date();
                      return clipDate.getMonth() === now.getMonth() && clipDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar clips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="news">Notícias</SelectItem>
                    <SelectItem value="educational">Educacional</SelectItem>
                    <SelectItem value="entertainment">Entretenimento</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais Recentes</SelectItem>
                    <SelectItem value="oldest">Mais Antigos</SelectItem>
                    <SelectItem value="viral">Score Viral</SelectItem>
                    <SelectItem value="hook">Força do Hook</SelectItem>
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
                <Button onClick={loadClips} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clips Grid/List */}
        {sortedClips.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Scissors className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum clip encontrado</h3>
              <p className="text-gray-600 mb-6">
                {clips.length === 0 
                  ? "Você ainda não criou nenhum clip. Faça upload de um vídeo para começar!"
                  : "Nenhum clip corresponde aos filtros selecionados."
                }
              </p>
              {clips.length === 0 && (
                <Link to="/upload">
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Fazer Upload
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {sortedClips.map((clip) => (
              <Card key={clip.id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all duration-200 group">
                {viewMode === 'grid' ? (
                  <div className="relative">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                      {clip.thumbnail_url ? (
                        <img 
                          src={clip.thumbnail_url} 
                          alt={clip.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                          <Video className="h-12 w-12 text-purple-400" />
                        </div>
                      )}
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" className="bg-white/90 text-gray-900 hover:bg-white">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Duration */}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(clip.start_time_seconds, clip.end_time_seconds)}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                            {clip.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(clip.created_at)}
                          </p>
                        </div>

                        {/* Scores */}
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs border ${getViralScoreColor(clip.ai_viral_score || 0)}`}>
                            <Zap className="h-3 w-3 mr-1" />
                            {clip.ai_viral_score || 0}/10
                          </Badge>
                          {clip.ai_content_category && (
                            <Badge variant="outline" className={`text-xs ${getCategoryColor(clip.ai_content_category)}`}>
                              {clip.ai_content_category}
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(clip)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleShare(clip)}
                              className="h-8 w-8 p-0"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                ) : (
                  // List View
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {clip.thumbnail_url ? (
                          <img 
                            src={clip.thumbnail_url} 
                            alt={clip.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                            <Video className="h-6 w-6 text-purple-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {clip.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(clip.created_at)} • {formatDuration(clip.start_time_seconds, clip.end_time_seconds)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`text-xs border ${getViralScoreColor(clip.ai_viral_score || 0)}`}>
                            {clip.ai_viral_score || 0}/10
                          </Badge>
                          {clip.ai_content_category && (
                            <Badge variant="outline" className={`text-xs ${getCategoryColor(clip.ai_content_category)}`}>
                              {clip.ai_content_category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(clip)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShare(clip)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clips; 