import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload as UploadIcon, 
  Video, 
  FileVideo,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Play,
  Home,
  Scissors,
  User,
  ArrowLeft,
  CloudUpload,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { useToast } from '@/hooks/use-toast';

const Upload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  
  const {
    file,
    setFile,
    title,
    setTitle,
    description,
    setDescription,
    isUploading,
    uploadProgress,
    uploadError,
    uploadVideo,
    resetUpload
  } = useVideoUpload();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      handleFileSelect(droppedFile);
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de vídeo.",
        variant: "destructive",
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo de vídeo válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 500MB.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um arquivo e adicione um título.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadVideo();
      toast({
        title: "Upload concluído!",
        description: "Seu vídeo está sendo processado. Você receberá uma notificação quando os clips estiverem prontos.",
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getUploadStepName = (progress: number) => {
    if (progress < 10) return 'Validando arquivo';
    if (progress < 20) return 'Criando registro';
    if (progress < 30) return 'Preparando upload';
    if (progress < 80) return 'Enviando vídeo';
    if (progress < 90) return 'Processando';
    if (progress < 100) return 'Finalizando';
    return 'Concluído';
  };

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
                <div className="flex items-center space-x-2 text-purple-600 font-medium">
                  <UploadIcon className="h-4 w-4" />
                  <span>Upload</span>
                </div>
                <Link to="/clips" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Scissors className="h-4 w-4" />
                  <span>Meus Clips</span>
                </Link>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard" className="hover:text-purple-600">Dashboard</Link>
            <span>/</span>
            <span>Upload</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload de Vídeo</h1>
          <p className="text-gray-600">
            Faça upload do seu vídeo e deixe nossa IA criar clips virais automaticamente
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">IA Avançada</h3>
              <p className="text-sm text-gray-600">
                Nossa IA analisa seu vídeo e identifica os melhores momentos para clips virais
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Processamento Rápido</h3>
              <p className="text-sm text-gray-600">
                Clips prontos em minutos, otimizados para cada plataforma social
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Score Viral</h3>
              <p className="text-sm text-gray-600">
                Cada clip recebe um score de viralidade para maximizar seu alcance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CloudUpload className="h-6 w-6 text-purple-600" />
              <span>Fazer Upload</span>
            </CardTitle>
            <CardDescription>
              Selecione um vídeo para começar. Formatos suportados: MP4, MOV, AVI (máx. 500MB)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!file ? (
              /* File Drop Zone */
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
                  dragOver 
                    ? 'border-purple-400 bg-purple-50' 
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <UploadIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Arraste e solte seu vídeo aqui
                    </h3>
                    <p className="text-gray-600 mb-4">
                      ou clique para selecionar um arquivo
                    </p>
                    
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>Selecionar Arquivo</span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Formatos: MP4, MOV, AVI, WEBM</p>
                    <p>Tamanho máximo: 500MB</p>
                  </div>
                </div>
              </div>
            ) : (
              /* File Selected */
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileVideo className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Video Details Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título do Vídeo *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Digite um título descritivo para seu vídeo"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Adicione uma descrição para ajudar a IA a entender melhor o conteúdo"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">
                          {getUploadStepName(uploadProgress)}
                        </p>
                        <p className="text-sm text-blue-700">
                          {uploadProgress}% concluído
                        </p>
                      </div>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900">Erro no upload</p>
                      <p className="text-sm text-red-700">{uploadError}</p>
                    </div>
                  </div>
                )}

                {/* Upload Success */}
                {uploadProgress === 100 && !uploadError && (
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">Upload concluído!</p>
                      <p className="text-sm text-green-700">
                        Seu vídeo está sendo processado. Os clips estarão disponíveis em breve.
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={resetUpload} disabled={isUploading}>
                    Cancelar
                  </Button>
                  
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading || !title.trim()}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Fazer Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm mt-8">
          <CardHeader>
            <CardTitle className="text-lg">💡 Dicas para melhores resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Qualidade do vídeo</h4>
                <p>Use vídeos em HD (1080p) ou superior para melhores clips</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Duração ideal</h4>
                <p>Vídeos de 5-30 minutos geram mais clips de qualidade</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Conteúdo dinâmico</h4>
                <p>Vídeos com mudanças de cena e energia alta performam melhor</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Áudio claro</h4>
                <p>Boa qualidade de áudio é essencial para transcrição precisa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload; 