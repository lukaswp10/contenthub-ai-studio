import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ProcessingConfig {
  clipDuration?: number
  clipCount?: number | 'auto'
  language?: string
  contentType?: string
  generateSubtitles?: boolean
  optimizeForMobile?: boolean
  removesilence?: boolean
  enhanceAudio?: boolean
}

export function useVideoUpload() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)

  const validateFile = useCallback((file: File) => {
    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
    if (!validTypes.includes(file.type)) {
      throw new Error('Formato de arquivo inválido. Use MP4, MOV, AVI, WebM ou MKV.')
    }

    // Check file size (max 500MB for now)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo permitido: 500MB')
    }

    return true
  }, [])

  const uploadVideo = useCallback(async () => {
    if (!file || !title.trim()) {
      throw new Error('Arquivo e título são obrigatórios')
    }

    try {
      setIsUploading(true)
      setUploadError(null)
      setUploadProgress(0)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Validate file
      validateFile(file)

      // Get video duration
      const duration = await getVideoDuration(file)
      console.log(`Video duration: ${duration}s`)

      // Create video record
      setUploadProgress(10)
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          original_filename: file.name,
          file_size_bytes: file.size,
          duration_seconds: duration,
          processing_status: 'uploading'
        })
        .select()
        .single()

      if (videoError) throw videoError
      setCurrentVideoId(videoData.id)

      // Request upload URL from edge function
      setUploadProgress(20)
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-video', {
        body: {
          video_id: videoData.id,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
          duration
        }
      })

      if (uploadError) throw uploadError
      if (!uploadData.success) throw new Error(uploadData.error)

      console.log('Upload authorized:', uploadData)

      // Upload to Cloudinary with progress tracking
      setUploadProgress(30)
      console.log('Upload params:', uploadData.upload_url, uploadData.upload_params)
      console.log('uploadData.upload_params:', JSON.stringify(uploadData.upload_params, null, 2))
      const uploadedUrl = await uploadToCloudinary(
        file,
        uploadData.upload_url,
        uploadData.upload_params,
        (progress) => {
          setUploadProgress(30 + (progress * 50)) // 30-80%
        }
      )

      // Update video record with Cloudinary URL
      setUploadProgress(80)
      // Checar existência do vídeo antes do update
      const { data: videoExists, error: getError } = await supabase
        .from('videos')
        .select('id')
        .eq('id', videoData.id)
        .single();
      if (!videoExists) {
        toast({
          title: "Vídeo não encontrado",
          description: "O vídeo pode ter sido removido ou processado.",
          variant: "destructive",
        });
        return null;
      }
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          cloudinary_public_id: uploadData.upload_params.public_id,
          cloudinary_secure_url: uploadedUrl,
          processing_status: 'queued'
        })
        .eq('id', videoData.id)
      if (updateError) {
        if (updateError.code === '409' || updateError.message?.includes('duplicate key value violates unique constraint "videos_cloudinary_public_id_key"')) {
          console.error('Erro de duplicata detectado:', updateError);
          toast({
            title: "Erro de duplicata",
            description: "Este vídeo já foi processado anteriormente. Tente com um arquivo diferente.",
            variant: "destructive",
          });
          
          // Limpar o registro duplicado se possível
          try {
            await supabase
              .from('videos')
              .delete()
              .eq('id', videoData.id);
          } catch (deleteError) {
            console.error('Erro ao limpar registro duplicado:', deleteError);
          }
          
          // Resetar upload
          setFile(null)
          setTitle('')
          setDescription('')
          setUploadProgress(0)
          setCurrentVideoId(null)
          
          return null;
        }
        throw updateError;
      }

      // Trigger transcription
      setUploadProgress(85)
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-video', {
        body: {
          video_id: videoData.id,
          cloudinary_url: uploadedUrl,
          cloudinary_public_id: uploadData.upload_params.public_id
        }
      })

      if (transcribeError) {
        console.error('Transcription trigger error:', transcribeError)
        
        // Capturar mensagem de erro detalhada
        let errorMessage = 'Erro na transcrição do vídeo'
        let errorDetails = ''
        let errorCode = 'UNKNOWN_ERROR'
        
        if (transcribeError.message) {
          errorMessage = transcribeError.message
        }
        
        // Verificar se há dados de erro detalhados na resposta
        if (transcribeData?.error) {
          errorMessage = transcribeData.error
        }
        
        if (transcribeData?.details) {
          errorDetails = transcribeData.details
        }
        
        if (transcribeData?.code) {
          errorCode = transcribeData.code
        }
        
        // Log detalhado do erro
        console.error('Erro detalhado na transcrição:', {
          error: transcribeError,
          errorCode,
          message: errorMessage,
          details: errorDetails,
          videoId: videoData.id,
          cloudinaryUrl: uploadedUrl,
          timestamp: new Date().toISOString()
        })
        
        // Atualizar status do vídeo para failed com mensagem de erro
        await supabase
          .from('videos')
          .update({ 
            processing_status: 'failed',
            error_message: `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`
          })
          .eq('id', videoData.id)
        
        // Resetar upload e mostrar erro
        setUploadError(`${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`)
        toast({
          title: "Erro na transcrição",
          description: `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`,
          variant: "destructive",
        })
        
        // Resetar estado do upload
        setFile(null)
        setTitle('')
        setDescription('')
        setUploadProgress(0)
        setCurrentVideoId(null)
        
        return null
      }

      setUploadProgress(100)
      toast({
        title: "Upload concluído!",
        description: "Seu vídeo está sendo processado.",
      })
      
      return videoData.id

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadError(error.message || 'Erro no upload')
      toast({
        title: "Erro no upload",
        description: error.message || 'Erro ao fazer upload',
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }, [file, title, description, validateFile, toast])

  const resetUpload = useCallback(() => {
    setFile(null)
    setTitle('')
    setDescription('')
    setUploadProgress(0)
    setUploadError(null)
    setCurrentVideoId(null)
  }, [])

  const cancelUpload = useCallback(async () => {
    if (currentVideoId) {
      try {
        await supabase
          .from('videos')
          .update({ 
            processing_status: 'cancelled',
            error_message: 'Cancelado pelo usuário'
          })
          .eq('id', currentVideoId)
        
        toast({
          title: "Upload cancelado",
          description: "O upload foi cancelado com sucesso.",
        })
      } catch (error) {
        console.error('Error cancelling upload:', error)
      }
    }
    
    resetUpload()
  }, [currentVideoId, resetUpload, toast])

  return {
    file,
    setFile,
    title,
    setTitle,
    description,
    setDescription,
    uploadVideo,
    cancelUpload,
    resetUpload,
    isUploading,
    uploadProgress,
    uploadError,
    currentVideoId
  }
}

// Helper function to get video duration
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(Math.round(video.duration))
    }
    
    video.onerror = () => {
      reject(new Error('Erro ao ler metadados do vídeo'))
    }
    
    video.src = URL.createObjectURL(file)
  })
}

// Helper function to upload to Cloudinary with progress
async function uploadToCloudinary(
  file: File,
  uploadUrl: string,
  uploadParams: any,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    
    // Add all upload params with proper type conversion
    Object.entries(uploadParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Preserve numbers as numbers, convert others to string
        if (typeof value === 'number') {
          formData.append(key, value as any)
        } else {
          formData.append(key, String(value))
        }
      }
    })
    
    // Add file last
    formData.append('file', file)
    
    // Log FormData enviado
    console.log('FormData enviado para Cloudinary:', Object.fromEntries(formData.entries()))
    
    const xhr = new XMLHttpRequest()
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = e.loaded / e.total
        onProgress(progress)
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response.secure_url)
        } catch (error) {
          reject(new Error('Invalid response from Cloudinary'))
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    })
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })
    
    xhr.open('POST', uploadUrl)
    xhr.send(formData)
  })
} 