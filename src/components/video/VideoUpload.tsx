import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

interface VideoUploadProps {
  onUploadComplete?: (videoUrl: string, videoData: any) => void
  onUploadStart?: () => void
  onUploadProgress?: (progress: number) => void
  onReset?: () => void
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadComplete,
  onUploadStart,
  onUploadProgress,
  onReset
}) => {
  const { user } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Formatos aceitos
  const acceptedFormats = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime']
  const maxFileSize = 500 * 1024 * 1024 // 500MB

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return 'Formato não suportado. Use MP4, MOV ou AVI.'
    }
    
    if (file.size > maxFileSize) {
      return 'Arquivo muito grande. Máximo 500MB.'
    }
    
    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)
    
    // Limpar preview anterior se existir
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    
    // Criar preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [previewUrl])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const simulateUpload = async () => {
    if (!selectedFile || !user) return

    setUploading(true)
    setUploadProgress(0)
    onUploadStart?.()

    try {
      // Simular processo de upload mais realista
      const totalSteps = 20 // Mais steps para suavidade
      const baseDelay = 150 // Delay base
      
      for (let step = 0; step <= totalSteps; step++) {
        // Simular velocidade variável - mais lento no início e fim
        let delay = baseDelay
        if (step < 3) delay = 800 // Início mais lento
        else if (step > totalSteps - 3) delay = 600 // Final mais lento
        else delay = 300 + Math.random() * 200 // Meio com variação
        
        await new Promise(resolve => setTimeout(resolve, delay))
        
        const progress = (step / totalSteps) * 100
        setUploadProgress(progress)
        onUploadProgress?.(progress)
      }

      // Aguardar um pouco para garantir que o vídeo carregou completamente
      await new Promise(resolve => setTimeout(resolve, 500))

      // Simular resposta do servidor
      const videoData = {
        id: Date.now().toString(),
        filename: selectedFile.name,
        size: selectedFile.size,
        duration: videoRef.current?.duration || Math.floor(Math.random() * 300) + 30, // 30-330s se não detectar
        uploadedAt: new Date().toISOString(),
        userId: user.id,
        status: 'uploaded'
      }

      console.log('Upload concluído:', videoData)
      onUploadComplete?.(previewUrl!, videoData)
      
      // NÃO resetar o form aqui - deixar para a página pai decidir
      setUploadProgress(0)
      
    } catch (err) {
      console.error('Erro no upload:', err)
      setError('Erro no upload. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onReset?.()
  }

  // Limpar recursos quando component é desmontado
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="p-6">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : selectedFile 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isDragging ? 'Solte o vídeo aqui' : 'Upload do seu vídeo'}
              </h3>
              <p className="text-gray-600 mb-4">
                Arraste e solte ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Formatos: MP4, MOV, AVI • Máx: 500MB
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Selecionar Vídeo
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <svg className="mx-auto h-12 w-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <Button 
                  onClick={simulateUpload}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {uploading ? 'Enviando...' : 'Enviar Vídeo'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearSelection}
                  disabled={uploading}
                >
                  Trocar Vídeo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Enviando vídeo...</span>
              <span>{uploadProgress}%</span>
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
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </Card>

      {/* Video Preview */}
      {previewUrl && !uploading && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preview do Vídeo
          </h3>
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video 
              ref={videoRef}
              src={previewUrl}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
              onLoadedMetadata={() => {
                console.log('Metadata carregada:', {
                  duration: videoRef.current?.duration,
                  videoWidth: videoRef.current?.videoWidth,
                  videoHeight: videoRef.current?.videoHeight
                })
              }}
              onLoadedData={() => {
                console.log('Dados do vídeo carregados')
              }}
              onError={(e) => {
                console.error('Erro ao carregar vídeo:', e)
                setError('Erro ao carregar preview do vídeo')
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              📹 <strong>{selectedFile?.name}</strong>
            </p>
            {selectedFile && (
              <div className="text-xs text-gray-500 space-y-1">
                <p>Tamanho: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                <p>Tipo: {selectedFile.type}</p>
                {videoRef.current?.duration && (
                  <p>Duração: {Math.round(videoRef.current.duration)}s</p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
} 