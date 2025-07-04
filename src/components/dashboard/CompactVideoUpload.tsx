import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { saveVideoToGallery } from '@/utils/galleryStorage'
import { uploadVideoToCloudinary, isValidVideoFile } from '@/services/cloudinaryService'
import { Upload, X, Check, AlertCircle } from 'lucide-react'

interface CompactVideoUploadProps {
  onUploadComplete?: (videoId: string) => void
  className?: string
}

export const CompactVideoUpload: React.FC<CompactVideoUploadProps> = ({
  onUploadComplete,
  className = ''
}) => {
  const { user } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [successVideoId, setSuccessVideoId] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    console.log('📁 Arquivo selecionado no upload compacto:', file.name)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)
    setUploadSuccess(false)
    setSuccessVideoId(null)
  }, [])

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
    setSelectedFile(null)
    setError(null)
    setUploadProgress(0)
    setUploadSuccess(false)
    setSuccessVideoId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const startUpload = async () => {
    if (!selectedFile || !user) return

    console.log('🚀 Iniciando upload compacto:', selectedFile.name)
    
    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setUploadSuccess(false)

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

      // Salvar na galeria com dados do Cloudinary
      const galleryVideo = saveVideoToGallery({
        file: selectedFile,
        url: cloudinaryResponse.secure_url,
        duration: cloudinaryResponse.duration || 0,
        cloudinaryPublicId: cloudinaryResponse.public_id,
        cloudinaryUrl: cloudinaryResponse.secure_url
      })
      
      // Sucesso
      setUploadSuccess(true)
      setSuccessVideoId(galleryVideo.id)
      setUploadProgress(0)
      
      console.log('🎉 Vídeo salvo com sucesso no upload compacto!')
      
      // Notificar componente pai
      onUploadComplete?.(galleryVideo.id)
      
      // Limpar após 3 segundos
      setTimeout(() => {
        clearSelection()
      }, 3000)
      
    } catch (err) {
      console.error('❌ Erro no upload compacto:', err)
      setError(err instanceof Error ? err.message : 'Erro no upload. Tente novamente.')
      setUploadProgress(0)
      setUploadSuccess(false)
    } finally {
      setUploading(false)
    }
  }

  // Estado de sucesso
  if (uploadSuccess) {
    return (
      <Card className={`p-4 bg-green-50 border-green-200 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">
              🎉 Upload concluído!
            </h3>
            <p className="text-xs text-green-600 mt-1">
              {selectedFile?.name} foi salvo na galeria
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={clearSelection}
            className="text-green-600 border-green-300 hover:bg-green-100"
          >
            <Upload className="h-3 w-3 mr-1" />
            Novo
          </Button>
        </div>
      </Card>
    )
  }

  // Estado de upload em progresso
  if (uploading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                Enviando {selectedFile?.name}
              </h3>
              <p className="text-xs text-gray-600">
                {uploadProgress < 30 ? '⚡ Iniciando...' : 
                 uploadProgress < 70 ? '📡 Enviando...' : 
                 uploadProgress < 95 ? '✅ Quase pronto...' : 
                 '🎉 Finalizando...'}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(uploadProgress)}%
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      </Card>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <Card className={`p-4 bg-red-50 border-red-200 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Erro no upload
            </h3>
            <p className="text-xs text-red-600 mt-1">
              {error}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={clearSelection}
            className="text-red-600 border-red-300 hover:bg-red-100"
          >
            <X className="h-3 w-3 mr-1" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    )
  }

  // Estado com arquivo selecionado
  if (selectedFile) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {selectedFile.name}
            </h3>
            <p className="text-xs text-gray-600">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • {selectedFile.type}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={startUpload}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Enviar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearSelection}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Estado inicial - zona de drop
  return (
    <Card className={className}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          {isDragging ? 'Solte o vídeo aqui' : '📤 Upload Rápido'}
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          Arraste e solte ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500">
          MP4, MOV, AVI • Máx: 500MB
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </Card>
  )
} 