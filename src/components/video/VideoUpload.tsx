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
  const [videoError, setVideoError] = useState(false)
  
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
    console.log('Arquivo selecionado:', file)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)
    setVideoError(false)
    
    // Limpar preview anterior se existir
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    
    // Tentar criar preview com blob URL primeiro
    try {
      const url = URL.createObjectURL(file)
      console.log('Blob URL criado:', url)
      setPreviewUrl(url)
      
      // Testar se o blob URL funciona
      const testVideo = document.createElement('video')
      testVideo.src = url
      testVideo.onloadeddata = () => {
        console.log('Blob URL testado e funcionando')
        setVideoError(false)
      }
      testVideo.onerror = () => {
        console.log('Blob URL bloqueado pelo CSP, usando fallback')
        setVideoError(true)
        URL.revokeObjectURL(url)
        setPreviewUrl(null)
        
        // Fallback: usar File Reader para data URL (mais lento mas funciona)
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            console.log('Data URL criado como fallback')
            setPreviewUrl(e.target.result as string)
            setVideoError(false)
          }
        }
        reader.onerror = () => {
          console.log('Erro ao criar data URL, mantendo sem preview')
          setVideoError(true)
        }
        // Para vídeos grandes, não usar data URL (limite ~50MB)
        if (file.size < 50 * 1024 * 1024) {
          reader.readAsDataURL(file)
        } else {
          console.log('Arquivo muito grande para data URL fallback')
          setVideoError(true)
        }
      }
    } catch (err) {
      console.error('Erro ao criar blob URL:', err)
      setError('Erro ao criar preview do vídeo. O upload ainda pode funcionar.')
      setVideoError(true)
    }
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

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setVideoError(false)
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

  const simulateUpload = async () => {
    if (!selectedFile || !user) return

    console.log('Iniciando upload para:', selectedFile.name)
    
    setUploading(true)
    setUploadProgress(0)
    setError(null)
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
        
        console.log(`Upload progress: ${progress.toFixed(1)}%`)
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
      
      // Em vez de passar apenas a URL, vamos preservar o arquivo
      // A Blob URL expira entre navegações, então vamos usar uma estratégia diferente
      const videoDataWithFile = {
        ...videoData,
        file: selectedFile, // Preservar o arquivo original
        blobUrl: previewUrl // Para preview se ainda estiver disponível
      }
      
      // Para compatibilidade, ainda passar a URL como primeiro parâmetro
      onUploadComplete?.(previewUrl || 'file-preserved', videoDataWithFile)
      
      // NÃO resetar o form aqui - deixar para a página pai decidir
      setUploadProgress(0)
      
    } catch (err) {
      console.error('Erro no upload:', err)
      setError('Erro no upload. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

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
              <span>🚀 Enviando vídeo...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress > 10 && (
                  <span className="text-xs text-white font-medium">
                    {Math.round(uploadProgress)}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-sm text-gray-700 font-medium">
                📤 {selectedFile?.name}
              </p>
              <p className="text-xs text-gray-500">
                {uploadProgress < 30 ? '⚡ Iniciando upload...' : 
                 uploadProgress < 70 ? '📡 Enviando dados...' : 
                 uploadProgress < 95 ? '✅ Quase concluído...' : 
                 '🎉 Finalizando...'}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm text-red-700 font-medium">
                  {error}
                </p>
                {error.includes('preview') && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Problema de segurança do navegador, mas o upload pode funcionar normalmente.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Video Preview */}
      {previewUrl && !uploading && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preview do Vídeo
          </h3>
          
          {!videoError ? (
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
                  setVideoError(false)
                }}
                onError={(e) => {
                  console.error('Erro ao carregar vídeo:', e)
                  setVideoError(true)
                }}
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="h-16 w-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Preview não disponível</p>
                <p className="text-xs">O vídeo pode ser processado normalmente</p>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              📹 <strong>{selectedFile?.name}</strong>
            </p>
            {selectedFile && (
              <div className="text-xs text-gray-500 space-y-1">
                <p>Tamanho: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                <p>Tipo: {selectedFile.type}</p>
                {videoRef.current?.duration && !videoError && (
                  <p>Duração: {Math.round(videoRef.current.duration)}s</p>
                )}
                {videoError && (
                  <p className="text-orange-600">⚠️ Preview indisponível (upload ainda funcionará)</p>
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