import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Bot, 
  Image, 
  Zap, 
  Search, 
  MoreHorizontal,
  Copy,
  Download,
  Trash2,
  Edit,
  Calendar,
  Filter
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
  type: 'text' | 'image' | 'social';
  content: string;
  createdAt: string;
  platform?: string;
}

const ProjectHistory: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image' | 'social'>('all');
  
  // Mock data - em produção viria do banco de dados
  const [projects] = useState<Project[]>([
    {
      id: '1',
      title: 'Artigo sobre IA no Marketing',
      type: 'text',
      content: 'A inteligência artificial está revolucionando o marketing digital...',
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      title: 'Post Instagram - Produtividade',
      type: 'social',
      content: '🚀 Dicas de produtividade que vão transformar seu dia...',
      createdAt: '2024-01-14T15:20:00Z',
      platform: 'instagram'
    },
    {
      id: '3',
      title: 'Imagem: Gato fofo dormindo',
      type: 'image',
      content: 'https://picsum.photos/300/300?random=1',
      createdAt: '2024-01-13T09:15:00Z',
    },
    {
      id: '4',
      title: 'Email Marketing - Newsletter',
      type: 'text',
      content: 'Assunto: Novidades incríveis chegando! Olá! Esperamos que você esteja bem...',
      createdAt: '2024-01-12T14:45:00Z',
    }
  ]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || project.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Bot className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'social': return <Zap className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-500';
      case 'image': return 'bg-purple-500';
      case 'social': return 'bg-orange-500';
      default: return 'bg-gray-500';
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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  const handleDownload = (project: Project) => {
    if (project.type === 'image' && project.content.startsWith('http')) {
      // Download da imagem
      const link = document.createElement('a');
      link.href = project.content;
      link.download = `${project.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Download do texto
      const blob = new Blob([project.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.title}.txt`;
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

  const handleDelete = (projectId: string) => {
    // Em produção, faria a exclusão no banco de dados
    toast({
      title: "Projeto excluído",
      description: "O projeto foi removido com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Todos
          </Button>
          <Button
            variant={filterType === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('text')}
          >
            <Bot className="h-4 w-4 mr-1" />
            Texto
          </Button>
          <Button
            variant={filterType === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('image')}
          >
            <Image className="h-4 w-4 mr-1" />
            Imagem
          </Button>
          <Button
            variant={filterType === 'social' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('social')}
          >
            <Zap className="h-4 w-4 mr-1" />
            Social
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Nenhum projeto encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Tente ajustar os termos de busca' : 'Você ainda não criou nenhum projeto'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${getTypeColor(project.type)}`}>
                      {getTypeIcon(project.type)}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {project.type}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopy(project.content)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(project)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(project.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-base line-clamp-2">
                  {project.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {project.type === 'image' && project.content.startsWith('http') ? (
                  <div className="relative mb-3">
                    <img 
                      src={project.content} 
                      alt={project.title}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {project.content}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(project.createdAt)}
                  </div>
                  {project.platform && (
                    <Badge variant="outline" className="text-xs">
                      {project.platform}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectHistory;