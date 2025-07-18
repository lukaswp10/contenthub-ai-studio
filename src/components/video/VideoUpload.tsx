import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { saveVideoToGallery } from '@/utils/galleryStorage'
import { uploadVideoToCloudinary, isValidVideoFile } from '@/services/cloudinaryService'

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
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null)
  
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
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
    
    // Estratégia mais robusta: usar data URL para arquivos pequenos, blob para grandes
    if (file.size < 100 * 1024 * 1024) { // < 100MB usa data URL
      console.log('Arquivo pequeno, usando data URL para máxima compatibilidade')
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          console.log('Data URL criado com sucesso')
          setPreviewUrl(e.target.result as string)
          setVideoError(false)
        }
      }
      reader.onerror = () => {
        console.log('Erro ao criar data URL, tentando blob URL')
        setVideoError(true)
        tryBlobUrl(file)
      }
      reader.readAsDataURL(file)
    } else {
      // Para arquivos grandes, usar blob URL
      console.log('Arquivo grande, usando blob URL')
      tryBlobUrl(file)
    }
  }, [previewUrl])

  const tryBlobUrl = (file: File) => {
    try {
      const url = URL.createObjectURL(file)
      console.log('Blob URL criado:', url)
      setPreviewUrl(url)
      
      // Testar se funciona
      const testVideo = document.createElement('video')
      testVideo.src = url
      testVideo.onloadeddata = () => {
        console.log('Blob URL testado e funcionando')
        setVideoError(false)
      }
      testVideo.onerror = () => {
        console.log('Blob URL falhou, sem preview mas upload funcionará')
        setVideoError(true)
      }
    } catch (err) {
      console.error('Erro ao criar blob URL:', err)
      setVideoError(true)
    }
  }

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
    setUploadSuccess(false)
    setCloudinaryUrl(null)
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

    console.log('🚀 Iniciando upload para Cloudinary:', selectedFile.name)
    
    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setUploadSuccess(false)
    onUploadStart?.()

    try {
      // Validar arquivo antes do upload
      if (!isValidVideoFile(selectedFile)) {
        throw new Error('Arquivo não é um vídeo válido ou é muito grande (máx 100MB)')
      }

      // Upload real para o Cloudinary
      setUploadProgress(10)
      console.log('📤 Enviando para Cloudinary...')
      
      const cloudinaryResponse = await uploadVideoToCloudinary(selectedFile)
      
      setUploadProgress(90)
      console.log('✅ Upload concluído no Cloudinary:', cloudinaryResponse.secure_url)

      // Aguardar um pouco para finalizar
      await new Promise(resolve => setTimeout(resolve, 500))
      setUploadProgress(100)

      // Dados do vídeo com informações do Cloudinary
      const videoData = {
        id: Date.now().toString(),
        filename: selectedFile.name,
        size: selectedFile.size,
        duration: cloudinaryResponse.duration || videoRef.current?.duration || 0,
        uploadedAt: new Date().toISOString(),
        userId: user.id,
        status: 'uploaded',
        cloudinaryPublicId: cloudinaryResponse.public_id,
        cloudinaryUrl: cloudinaryResponse.secure_url,
        cloudinaryBytes: cloudinaryResponse.bytes
      }

      console.log('📊 Dados do vídeo processados:', videoData)
      
      const videoDataWithFile = {
        ...videoData,
        file: selectedFile,
        reliableUrl: cloudinaryResponse.secure_url, // URL permanente do Cloudinary
        originalPreviewUrl: previewUrl
      }
      
      // Passar a URL permanente do Cloudinary
      onUploadComplete?.(cloudinaryResponse.secure_url, videoDataWithFile)
      
      // Salvar na galeria com dados do Cloudinary
      saveVideoToGallery({
        file: selectedFile,
        url: cloudinaryResponse.secure_url,
        duration: cloudinaryResponse.duration || 0,
        cloudinaryPublicId: cloudinaryResponse.public_id,
        cloudinaryUrl: cloudinaryResponse.secure_url
      })
      
      // Atualizar estado de sucesso
      setUploadSuccess(true)
      setCloudinaryUrl(cloudinaryResponse.secure_url)
      setUploadProgress(0)
      
      console.log('🎉 Vídeo salvo com sucesso no Cloudinary e na galeria!')
      
    } catch (err) {
      console.error('❌ Erro no upload:', err)
      setError(err instanceof Error ? err.message : 'Erro no upload. Tente novamente.')
      setUploadProgress(0)
      setUploadSuccess(false)
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

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-green-700 font-medium">
                  🎉 Upload concluído com sucesso!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ☁️ Seu vídeo foi salvo no Cloudinary e está disponível permanentemente
                </p>
                <p className="text-xs text-green-600 mt-1">
                  📁 Você pode encontrá-lo na galeria do editor
                </p>
              </div>
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
      {(previewUrl || cloudinaryUrl) && !uploading && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {uploadSuccess ? '🎬 Vídeo Enviado' : 'Preview do Vídeo'}
            </h3>
            {uploadSuccess && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Salvo no Cloudinary</span>
              </div>
            )}
          </div>
          
          {!videoError ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <video 
                ref={videoRef}
                src={cloudinaryUrl || previewUrl || undefined}
                controls
                preload="metadata"
                crossOrigin="anonymous"
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
                {uploadSuccess && cloudinaryUrl && (
                  <div className="mt-3 p-2 bg-green-50 rounded border">
                    <p className="text-green-700 font-medium">✅ URL Permanente:</p>
                    <p className="text-green-600 text-xs break-all">{cloudinaryUrl}</p>
                  </div>
                )}
                {videoError && (
                  <p className="text-orange-600">⚠️ Preview indisponível (upload ainda funcionará)</p>
                )}
              </div>
            )}
            
            {uploadSuccess && (
              <div className="mt-4 flex justify-center space-x-3">
                <Button 
                  onClick={() => window.open('/editor', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🎬 Abrir Editor
                </Button>
                <Button 
                  variant="outline"
                  onClick={clearSelection}
                >
                  📤 Enviar Outro Vídeo
                </Button>
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