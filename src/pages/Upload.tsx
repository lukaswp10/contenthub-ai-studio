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
import { RecentVideos } from '@/components/upload/RecentVideos';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';

type Video = Tables<'videos'>;

export default function Upload() {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showConfig, setShowConfig] = useState(false);
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
      await uploadVideo();
      toast({
        title: "Upload iniciado!",
        description: "Seu vídeo está sendo processado. Você pode acompanhar o progresso na aba 'Processamento'.",
      });
      setActiveTab('processing');
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

  return (
    <AppLayout>
      <div className="space-y-6">
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
              <Eye className="h-4 w-4" />
              Recentes
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UploadIcon className="h-5 w-5" />
                      Upload de Vídeo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* File Upload */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Selecione um arquivo de vídeo
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="video-upload"
                            disabled={isUploading}
                          />
                          <label
                            htmlFor="video-upload"
                            className="cursor-pointer block"
                          >
                            <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900">
                              {file ? file.name : 'Clique para selecionar um vídeo'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              MP4, MOV, AVI, WebM ou MKV (máx. 500MB)
                            </p>
                          </label>
                        </div>
                      </div>

                      {/* File Preview */}
                      {file && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <FileVideo className="h-8 w-8 text-blue-500" />
                            <div className="flex-1">
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFile(null)}
                              disabled={isUploading}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Título do Vídeo</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Digite um título para o vídeo"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isUploading}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Descrição</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Descreva o conteúdo do vídeo (opcional)"
                          rows={3}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isUploading}
                        />
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Fazendo upload...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Erro no upload:</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                        {uploadError.includes('Limite mensal') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                            onClick={() => window.open('https://clipsforge.com/upgrade', '_blank')}
                          >
                            Fazer upgrade
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Upload Button */}
                    <Button
                      onClick={handleUpload}
                      disabled={!file || !title.trim() || isUploading}
                      className="w-full"
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Fazendo upload...
                        </>
                      ) : (
                        <>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Fazer Upload e Processar
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Processing Configuration */}
              <div>
                <ProcessingConfig
                  onConfigChange={(config) => {
                    console.log('Processing config:', config);
                  }}
                />
              </div>
            </div>
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-6">
            <ProcessingViewer
              onVideoComplete={handleVideoComplete}
              onRetry={handleRetry}
            />
          </TabsContent>

          {/* Recent Videos Tab */}
          <TabsContent value="recent" className="space-y-6">
            <RecentVideos
              onVideoSelect={handleVideoSelect}
              onViewClips={handleViewClips}
              onShareVideo={handleShareVideo}
            />
          </TabsContent>
        </Tabs>

        {/* Selected Video Details Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalhes do Vídeo</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVideo(null)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {selectedVideo.cloudinary_secure_url ? (
                    <video
                      src={selectedVideo.cloudinary_secure_url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileVideo className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-lg">{selectedVideo.title}</h4>
                  {selectedVideo.description && (
                    <p className="text-muted-foreground mt-1">{selectedVideo.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Duração:</span>
                    <p>{formatDuration(selectedVideo.duration_seconds)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tamanho:</span>
                    <p>{formatFileSize(selectedVideo.file_size_bytes)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="capitalize">{selectedVideo.processing_status}</p>
                  </div>
                  <div>
                    <span className="font-medium">Criado:</span>
                    <p>{new Date(selectedVideo.created_at || '').toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {selectedVideo.processing_status === 'ready' && (
                  <div className="space-y-2">
                    {selectedVideo.ai_suggested_clips && selectedVideo.ai_suggested_clips > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Clipes sugeridos:</span>
                        <p>{selectedVideo.ai_suggested_clips}</p>
                      </div>
                    )}
                    {selectedVideo.ai_main_topics && selectedVideo.ai_main_topics.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Tópicos principais:</span>
                        <p>{selectedVideo.ai_main_topics.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleViewClips(selectedVideo.id)}
                    disabled={selectedVideo.processing_status !== 'ready'}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ver Clipes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShareVideo(selectedVideo)}
                    disabled={selectedVideo.processing_status !== 'ready'}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVideo(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 