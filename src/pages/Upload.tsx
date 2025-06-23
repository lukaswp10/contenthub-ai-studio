import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload as UploadIcon, 
  Video, 
  Settings, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  FileVideo,
  Play,
  Download,
  Share2
} from 'lucide-react';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { ProcessingConfig } from '@/components/upload/ProcessingConfig';
import { ProcessingViewer } from '@/components/upload/ProcessingViewer';
import { ProcessingMonitor } from '@/components/upload/ProcessingMonitor';
import { RecentVideos } from '@/components/upload/RecentVideos';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';

type Video = Tables<'videos'>;

export default function Upload() {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const { toast } = useToast();
  
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
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
      const result = await uploadVideo();
      toast({
        title: "Upload iniciado!",
        description: "Seu vídeo está sendo processado. Você pode acompanhar o progresso na aba 'Processamento'.",
      });
      setActiveTab('processing');
      setShowMonitor(true);
      resetUpload();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleVideoComplete = (video: Video) => {
    toast({
      title: "Processamento concluído!",
      description: `${video.title} foi processado com sucesso.`,
    });
  };

  const handleRetry = (videoId: string) => {
    toast({
      title: "Reprocessamento iniciado",
      description: "O vídeo será reprocessado.",
    });
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setActiveTab('processing');
  };

  const handleViewClips = (videoId: string) => {
    // TODO: Navigate to clips page
    toast({
      title: "Visualizar clipes",
      description: "Funcionalidade em desenvolvimento.",
    });
  };

  const handleShareVideo = (video: Video) => {
    // TODO: Open share modal
    toast({
      title: "Compartilhar vídeo",
      description: "Funcionalidade em desenvolvimento.",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUploadStepName = (progress: number) => {
    if (progress < 10) return 'Validando arquivo';
    if (progress < 20) return 'Criando registro';
    if (progress < 30) return 'Preparando upload';
    if (progress < 80) return 'Enviando vídeo';
    if (progress < 85) return 'Atualizando dados';
    if (progress < 100) return 'Iniciando processamento';
    return 'Upload concluído';
  };

  const getUploadStepDescription = (progress: number) => {
    if (progress < 10) return 'Verificando formato e tamanho do arquivo';
    if (progress < 20) return 'Criando registro do vídeo no banco de dados';
    if (progress < 30) return 'Gerando URL de upload segura';
    if (progress < 80) return 'Enviando arquivo para o Cloudinary';
    if (progress < 85) return 'Salvando informações do vídeo';
    if (progress < 100) return 'Iniciando transcrição e análise';
    return 'Vídeo enviado com sucesso!';
  };

  const handleProcessingComplete = (result: any) => {
    toast({
      title: "Processamento concluído!",
      description: "Todas as etapas foram executadas com sucesso.",
    });
    setShowMonitor(false);
  };

  const handleProcessingError = (error: any) => {
    toast({
      title: "Erro no processamento",
      description: error.message || "Ocorreu um erro durante o processamento.",
      variant: "destructive",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8 w-full px-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Upload de Vídeo</h1>
            <p className="text-muted-foreground">
              Faça upload de seus vídeos e deixe a IA processar automaticamente
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Video className="h-3 w-3 mr-1" />
              IA Processing
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Processamento
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <FileVideo className="h-4 w-4" />
              Recentes
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  Upload de Vídeo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <div className="space-y-4">
                      <UploadIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium">
                          {file ? file.name : "Clique para selecionar um vídeo"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {file ? `${formatFileSize(file.size)}` : "MP4, MOV, AVI até 500MB"}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* File Info */}
                {file && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileVideo className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload Form */}
                {file && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Título do Vídeo
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o título do vídeo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Descrição (opcional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Descreva o conteúdo do vídeo"
                      />
                    </div>

                    {/* Processing Options */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConfig(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </Button>
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{getUploadStepName(uploadProgress)}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-500">
                          {getUploadStepDescription(uploadProgress)}
                        </p>
                      </div>
                    )}

                    {/* Upload Error */}
                    {uploadError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <p className="text-red-700">{uploadError}</p>
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <Button
                      onClick={handleUpload}
                      disabled={!file || !title.trim() || isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Enviar Vídeo
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-6">
            {showMonitor ? (
              <ProcessingMonitor
                videoId={selectedVideo?.id}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            ) : (
              <ProcessingViewer
                onVideoComplete={handleVideoComplete}
                onRetry={handleRetry}
              />
            )}
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-6">
            <RecentVideos
              onVideoSelect={handleVideoSelect}
              onViewClips={handleViewClips}
              onShareVideo={handleShareVideo}
            />
          </TabsContent>
        </Tabs>

        {/* Processing Config Modal */}
        {showConfig && (
          <ProcessingConfig
            onConfigChange={(config) => {
              console.log('Processing config:', config);
              setShowConfig(false);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
} 