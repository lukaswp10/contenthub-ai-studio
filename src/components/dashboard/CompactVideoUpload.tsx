import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { uploadVideoToCloudinary, isValidVideoFile } from '@/services/cloudinaryService'
import { saveVideoToGallery } from '@/utils/galleryStorage'

interface CompactVideoUploadProps {
  onUploadComplete?: (videoId: string) => void
  className?: string
}

export const CompactVideoUpload: React.FC<CompactVideoUploadProps> = ({
  onUploadComplete,
  className = ''
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successVideoId, setSuccessVideoId] = useState<string | null>(null)
  const [galleryVideoData, setGalleryVideoData] = useState<any>(null)

  // ✨ MELHORADO: Validação de arquivo com feedback específico
  const validateFile = (file: File): string | null => {
    // Verificar se é um arquivo de vídeo
    if (!isValidVideoFile(file)) {
      return 'Formato não suportado. Use MP4, MOV, AVI, MKV, WEBM, FLV.'
    }
    
    // Verificar tamanho (limite de 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo: 500MB.'
    }
    
    // Verificar tamanho mínimo (1MB)
    const minSize = 1 * 1024 * 1024 // 1MB
    if (file.size < minSize) {
      return 'Arquivo muito pequeno. Mínimo: 1MB.'
    }
    
    return null
  }

  // Selecionar arquivo
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)
    setUploadSuccess(false)
    setGalleryVideoData(null)
    console.log('📁 Arquivo selecionado no upload compacto:', file.name)
  }, [])

  // Limpar seleção
  const clearSelection = () => {
    setSelectedFile(null)
    setError(null)
    setUploadSuccess(false)
    setUploadProgress(0)
    setSuccessVideoId(null)
    setGalleryVideoData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ✅ Iniciar upload (100% REAL - SUPABASE)
  const startUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setUploadProgress(10)
      setError(null)
      
      console.log('🚀 Iniciando upload compacto:', selectedFile.name)
      console.log('📤 Enviando para Cloudinary...')
      
      const cloudinaryResponse = await uploadVideoToCloudinary(selectedFile)
      
      setUploadProgress(90)
      console.log('✅ Upload concluído no Cloudinary:', cloudinaryResponse.secure_url)

      // Aguardar um pouco para finalizar
      await new Promise(resolve => setTimeout(resolve, 500))
      setUploadProgress(100)

      // ✅ SALVAR NO SUPABASE (100% REAL)
      console.log('💾 Salvando no Supabase (100% REAL)...')
      const galleryVideo = await saveVideoToGallery({
        file: selectedFile,
        url: cloudinaryResponse.secure_url,
        duration: cloudinaryResponse.duration || 0,
        cloudinaryPublicId: cloudinaryResponse.public_id,
        cloudinaryUrl: cloudinaryResponse.secure_url
      })
      
      // ✨ CORREÇÃO: Salvar dados para navegação
      const videoDataForNavigation = {
        id: galleryVideo.id,
        name: galleryVideo.name,
        size: selectedFile.size, // Usar tamanho real em bytes
        duration: cloudinaryResponse.duration || 0,
        url: cloudinaryResponse.secure_url,
        cloudinaryPublicId: cloudinaryResponse.public_id,
        cloudinaryUrl: cloudinaryResponse.secure_url
      }
      
      setGalleryVideoData(videoDataForNavigation)
      
      // Sucesso
      setUploadSuccess(true)
      setSuccessVideoId(galleryVideo.id)
      setUploadProgress(0)
      
      console.log('🎉 Vídeo salvo com sucesso no Supabase (100% REAL)!')
      
      // Notificar componente pai
      onUploadComplete?.(galleryVideo.id)
      
      // ✨ CORREÇÃO: Auto-navegação imediata com dados garantidos
      setTimeout(() => {
        console.log('🎬 Auto-navegando para o editor...')
        // Usar dados diretos em vez de state (evita race condition)
        navigate('/editor', {
          state: {
            url: videoDataForNavigation.cloudinaryUrl || videoDataForNavigation.url,
            name: videoDataForNavigation.name,
            size: videoDataForNavigation.size,
            duration: videoDataForNavigation.duration,
            id: videoDataForNavigation.id,
            cloudinaryPublicId: videoDataForNavigation.cloudinaryPublicId,
            cloudinaryUrl: videoDataForNavigation.cloudinaryUrl,
          }
        })
      }, 2000)
      
    } catch (err) {
      console.error('❌ Erro no upload compacto:', err)
      setError(err instanceof Error ? err.message : 'Erro no upload. Tente novamente.')
      setUploadProgress(0)
      setUploadSuccess(false)
    } finally {
      setUploading(false)
    }
  }

  // ✨ MELHORADO: Estado de sucesso com botão para editar
  if (uploadSuccess) {
    return (
      <Card className={`p-4 bg-green-50 border-green-200 ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">
                🎉 Upload concluído no Supabase!
              </h3>
              <p className="text-xs text-green-600 mt-1">
                {selectedFile?.name} foi salvo na galeria (100% REAL)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ⏱️ Redirecionando para o editor...
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => {
                console.log('🔍 DEBUG - Estado atual do botão Editar Manual:', {
                  galleryVideoData,
                  hasGalleryVideoData: !!galleryVideoData,
                  uploadSuccess,
                  selectedFile: selectedFile?.name
                })
                
                if (galleryVideoData) {
                  console.log('✅ Navegando para editor com dados do Supabase:', galleryVideoData)
                  navigate('/editor', {
                    state: {
                      url: galleryVideoData.cloudinaryUrl || galleryVideoData.url,
                      name: galleryVideoData.name,
                      size: galleryVideoData.size,
                      duration: galleryVideoData.duration,
                      id: galleryVideoData.id,
                      cloudinaryPublicId: galleryVideoData.cloudinaryPublicId,
                      cloudinaryUrl: galleryVideoData.cloudinaryUrl,
                    }
                  })
                } else {
                  console.error('❌ Dados do vídeo não disponíveis para navegação manual')
                  console.log('🔍 DEBUG - Tentando aguardar dados...')
                  
                  // Aguardar um pouco e tentar novamente
                  setTimeout(() => {
                    if (galleryVideoData) {
                      console.log('✅ Dados encontrados após aguardar:', galleryVideoData)
                      navigate('/editor', {
                        state: {
                          url: galleryVideoData.cloudinaryUrl || galleryVideoData.url,
                          name: galleryVideoData.name,
                          size: galleryVideoData.size,
                          duration: galleryVideoData.duration,
                          id: galleryVideoData.id,
                          cloudinaryPublicId: galleryVideoData.cloudinaryPublicId,
                          cloudinaryUrl: galleryVideoData.cloudinaryUrl,
                        }
                      })
                    } else {
                      console.error('❌ Dados ainda não disponíveis após aguardar')
                    }
                  }, 1000)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              🎬 Editar Manual
            </Button>
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
                Enviando {selectedFile?.name} para Supabase
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
      <Card className={`p-4 border-blue-200 bg-blue-50 ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Check className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Arquivo selecionado
              </h3>
              <p className="text-xs text-blue-600 mt-1">
                📁 {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={startUpload}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              disabled={!user}
            >
              {!user ? '🔒 Login necessário' : '🚀 Enviar para Supabase'}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Estado inicial - área de upload
  return (
    <Card className={`p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
        className="hidden"
      />
      
      <div 
        className="text-center"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          📤 Upload Rápido (Supabase)
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          Arraste e solte ou clique para selecionar um vídeo
        </p>
        <Button 
          variant="outline" 
          size="sm"
          disabled={!user}
        >
          {!user ? '🔒 Faça login' : 'Clique ou arraste um vídeo'}
        </Button>
        
        {!user && (
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Você precisa estar logado para fazer upload
          </p>
        )}
      </div>
    </Card>
  )
} 