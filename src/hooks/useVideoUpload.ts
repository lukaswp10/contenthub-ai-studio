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
      
      let uploadedUrl: string
      try {
        uploadedUrl = await uploadToCloudinary(
          file,
          uploadData.upload_url,
          uploadData.upload_params,
          (progress) => {
            setUploadProgress(30 + (progress * 50)) // 30-80%
          }
        )
        console.log('✅ Upload para Cloudinary concluído:', uploadedUrl)
      } catch (uploadError) {
        console.error('❌ Erro no upload para Cloudinary:', uploadError)
        throw new Error('Falha no upload do vídeo')
      }

      // Update video record with Cloudinary URL
      setUploadProgress(80)
      
      // Use the original public_id from upload params (not generating a new one)
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          cloudinary_public_id: uploadData.upload_params.public_id,
          cloudinary_secure_url: uploadedUrl,
          processing_status: 'queued'
        })
        .eq('id', videoData.id)
        
      if (updateError) {
        console.error('Erro ao atualizar vídeo:', updateError)
        throw updateError
      }

      // Trigger transcription only after successful upload
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
    console.log('Upload URL:', uploadUrl)
    
    const xhr = new XMLHttpRequest()
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = e.loaded / e.total
        onProgress(progress)
      }
    })
    
    xhr.addEventListener('load', () => {
      console.log('Cloudinary response status:', xhr.status)
      console.log('Cloudinary response text:', xhr.responseText)
      
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          console.log('Cloudinary response parsed:', response)
          
          if (response.secure_url) {
            resolve(response.secure_url)
          } else {
            console.error('No secure_url in response:', response)
            reject(new Error('Resposta do Cloudinary inválida: secure_url não encontrada'))
          }
        } catch (error) {
          console.error('Error parsing Cloudinary response:', error)
          console.error('Raw response:', xhr.responseText)
          reject(new Error('Resposta inválida do Cloudinary'))
        }
      } else {
        console.error('Cloudinary upload failed with status:', xhr.status)
        console.error('Response text:', xhr.responseText)
        
        // Try to parse error response
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          console.error('Cloudinary error details:', errorResponse)
          
          if (errorResponse.error && errorResponse.error.message) {
            reject(new Error(`Erro do Cloudinary: ${errorResponse.error.message}`))
          } else {
            reject(new Error(`Upload falhou: ${xhr.status} ${xhr.statusText}`))
          }
        } catch (parseError) {
          reject(new Error(`Upload falhou: ${xhr.status} ${xhr.statusText} - ${xhr.responseText}`))
        }
      }
    })
    
    xhr.addEventListener('error', (e) => {
      console.error('Network error during upload:', e)
      reject(new Error('Erro de rede durante o upload'))
    })
    
    xhr.addEventListener('timeout', () => {
      console.error('Upload timeout')
      reject(new Error('Timeout no upload'))
    })
    
    xhr.open('POST', uploadUrl)
    xhr.timeout = 300000 // 5 minutes timeout
    xhr.send(formData)
  })
} 