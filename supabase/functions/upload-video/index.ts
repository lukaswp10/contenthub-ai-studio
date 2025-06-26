import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v2 as cloudinary } from 'https://esm.sh/cloudinary@1.41.0'
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UploadRequest {
  fileName: string
  fileSize: number
  contentType: string
  duration?: number
  processingConfig?: {
    clipDuration?: number
    clipCount?: number
    language?: string
    contentType?: string
    generateSubtitles?: boolean
    optimizeForMobile?: boolean
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    console.log('🚀 Upload video function called')
    console.log('📋 Request method:', req.method)
    console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()))

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      throw new Error('Usuário não autenticado')
    }

    console.log('✅ User authenticated:', user.email)

    // Check if it's a file upload (multipart/form-data) or JSON metadata
    const contentType = req.headers.get('content-type') || ''
    let fileName: string, fileSize: number, videoContentType: string, duration: number | undefined, processingConfig: any

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData()
      const file = formData.get('file') as File
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      
      if (!file) {
        throw new Error('Nenhum arquivo enviado')
      }

      fileName = file.name
      fileSize = file.size
      videoContentType = file.type
      duration = undefined // Will be detected later
      processingConfig = {}

      console.log(`📁 File upload: ${fileName} (${fileSize} bytes, ${videoContentType})`)
    } else {
      // Handle JSON metadata (original behavior)
      const requestData: UploadRequest = await req.json()
      fileName = requestData.fileName
      fileSize = requestData.fileSize
      videoContentType = requestData.contentType
      duration = requestData.duration
      processingConfig = requestData.processingConfig
      
      console.log(`📋 JSON upload: ${fileName} (${fileSize} bytes, ${videoContentType})`)
    }

    // Validate file
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska', 'application/octet-stream']
    const validExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
    
    const isValidType = validVideoTypes.includes(videoContentType)
    const isValidExtension = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
    
    if (!isValidType && !isValidExtension) {
      throw new Error(`Tipo de arquivo inválido. Recebido: ${videoContentType}. Apenas vídeos são permitidos.`)
    }

    // Get user profile and check limits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile error:', profileError)
      throw new Error('Erro ao carregar perfil do usuário')
    }

    console.log('👤 User profile loaded:', profile.email)

    // Check Cloudinary credentials
    const cloudinaryConfig = {
      cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME'),
      api_key: Deno.env.get('CLOUDINARY_API_KEY'),
      api_secret: Deno.env.get('CLOUDINARY_API_SECRET'),
    }
    
    const hasCloudinaryCredentials = cloudinaryConfig.cloud_name && 
                                   cloudinaryConfig.api_key && 
                                   cloudinaryConfig.api_secret

    console.log('☁️ Cloudinary credentials:', hasCloudinaryCredentials ? 'Available' : 'Missing')

    if (!hasCloudinaryCredentials) {
      console.log('⚠️ Cloudinary not configured, creating video record for demo')
      
      // Create video record without actual upload for demo purposes
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          original_filename: fileName,
          file_size_bytes: fileSize,
          duration_seconds: duration || 60, // Default duration for demo
          processing_status: 'demo_mode',
          file_url: `https://demo.example.com/video_${Date.now()}.mp4`, // Demo URL
          cloudinary_public_id: `demo_${Date.now()}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (videoError) {
        console.error('❌ Video insert error:', videoError)
        throw videoError
      }

      console.log('✅ Demo video record created:', video.id)

      return new Response(JSON.stringify({
        success: true,
        message: 'Modo demo: Vídeo registrado com sucesso',
        video: {
          id: video.id,
          title: video.title,
          status: 'demo_mode',
          file_url: video.file_url,
          demo_mode: true
        },
        upload_info: {
          demo_mode: true,
          message: 'Em produção, o vídeo seria enviado para Cloudinary'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Configure Cloudinary for real upload
    cloudinary.config(cloudinaryConfig)

    // Plan limits
    const planLimits = {
      free: { 
        videos_per_month: 1, 
        max_file_size: 500 * 1024 * 1024, // 500MB
        max_duration: 30 * 60, // 30 minutes
        max_storage: 1 * 1024 * 1024 * 1024 // 1GB
      },
      pro: { 
        videos_per_month: 10, 
        max_file_size: 2 * 1024 * 1024 * 1024, // 2GB
        max_duration: 120 * 60, // 2 hours
        max_storage: 50 * 1024 * 1024 * 1024 // 50GB
      },
      agency: { 
        videos_per_month: -1, // Unlimited
        max_file_size: 5 * 1024 * 1024 * 1024, // 5GB
        max_duration: 300 * 60, // 5 hours
        max_storage: 500 * 1024 * 1024 * 1024 // 500GB
      }
    }

    const limits = planLimits[profile.plan_type as keyof typeof planLimits]

    // Check monthly reset
    const now = new Date()
    const resetDate = new Date(profile.usage_reset_date)
    if (now > resetDate) {
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      await supabase
        .from('profiles')
        .update({ 
          usage_videos_current_month: 0,
          usage_reset_date: nextReset.toISOString()
        })
        .eq('id', user.id)
      
      profile.usage_videos_current_month = 0
    }

    // Validate limits (temporarily disabled for testing)
    // if (limits.videos_per_month !== -1 && 
    //     profile.usage_videos_current_month >= limits.videos_per_month) {
    //   throw new Error(`Limite mensal de ${limits.videos_per_month} vídeos atingido. Faça upgrade do seu plano.`)
    // }

    if (fileSize > limits.max_file_size) {
      const maxSizeMB = Math.round(limits.max_file_size / (1024 * 1024))
      throw new Error(`Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB`)
    }

    if (duration && duration > limits.max_duration) {
      const maxDurationMin = Math.round(limits.max_duration / 60)
      throw new Error(`Vídeo muito longo. Máximo permitido: ${maxDurationMin} minutos`)
    }

    const totalStorageAfterUpload = profile.usage_storage_bytes + fileSize
    if (totalStorageAfterUpload > limits.max_storage) {
      const maxStorageGB = Math.round(limits.max_storage / (1024 * 1024 * 1024))
      throw new Error(`Limite de armazenamento excedido. Máximo: ${maxStorageGB}GB`)
    }

    // Cria o registro do vídeo primeiro para obter o video_id único
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
        original_filename: fileName,
        file_size_bytes: fileSize,
        duration_seconds: duration,
        processing_status: 'uploading'
      })
      .select()
      .single()

    if (videoError) throw videoError

    // Agora gera o public_id usando o video_id + timestamp único + mais aleatoriedade para evitar duplicatas
    const timestamp = Date.now() // Usar timestamp completo em milissegundos
    const randomSuffix = Math.random().toString(36).substring(2, 12) // Mais caracteres aleatórios
    const microTime = performance.now().toString().replace('.', '') // Adicionar microtempo
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const publicId = `videos/${user.id}/${video.id}_${timestamp}_${microTime}_${randomSuffix}_${sanitizedFileName}`

    // Atualiza o registro com o public_id
    await supabase
      .from('videos')
      .update({ cloudinary_public_id: publicId })
      .eq('id', video.id)

    // Serializar context como string para Cloudinary
    const contextString = `user_id=${user.id}|original_filename=${fileName}|upload_source=clipsforge`

    // Simplified Cloudinary upload parameters
    const uploadParams = {
      public_id: publicId,
      folder: `videos/${user.id}`,
      resource_type: 'video' as const,
      type: 'upload' as const,
      timestamp: String(Math.round(timestamp / 1000)),
      video_codec: 'auto',
      audio_codec: 'auto',
      context: contextString,
      upload_preset: 'ml_default'
    }

    // Log todos os parâmetros antes de assinar
    console.log('Upload params before signing:', JSON.stringify(uploadParams, null, 2))

    // Generate signature for secure upload
    // IMPORTANTE: Incluir apenas os parâmetros que o Cloudinary espera na assinatura
    const signatureParams = {
      context: uploadParams.context,
      folder: uploadParams.folder,
      public_id: uploadParams.public_id,
      timestamp: uploadParams.timestamp,
      type: uploadParams.type,
      upload_preset: uploadParams.upload_preset
    };

    const paramsToSign = Object.keys(signatureParams)
      .sort()
      .filter(key => signatureParams[key as keyof typeof signatureParams] !== undefined && signatureParams[key as keyof typeof signatureParams] !== '')
      .map(key => `${key}=${signatureParams[key as keyof typeof signatureParams]}`)
      .join('&')
    
    console.log('Params to sign (only signature params):', paramsToSign)
    
    // Use the configured api_secret from cloudinaryConfig
    const apiSecret = cloudinaryConfig.api_secret
    console.log('Environment variables debug:')
    console.log('CLOUDINARY_CLOUD_NAME:', cloudinaryConfig.cloud_name)
    console.log('CLOUDINARY_API_KEY:', cloudinaryConfig.api_key)
    console.log('CLOUDINARY_API_SECRET exists:', !!apiSecret)
    
    if (!apiSecret) {
      throw new Error('CLOUDINARY_API_SECRET environment variable is not set')
    }
    
    console.log('API Secret being used (first 4 chars):', apiSecret.substring(0, 4) + '...')
    
    const signature = await generateCloudinarySignature(paramsToSign, apiSecret)
    
    console.log('Generated signature:', signature)

    // Update usage
    await supabase
      .from('profiles')
      .update({ 
        usage_videos_current_month: profile.usage_videos_current_month + 1,
        usage_storage_bytes: profile.usage_storage_bytes + fileSize
      })
      .eq('id', user.id)

    // Log final params enviados para o frontend
    const finalUploadParams = {
      ...uploadParams,
      signature,
      api_key: cloudinaryConfig.api_key,
    }
    console.log('Final upload params:', JSON.stringify(finalUploadParams, null, 2))

    return new Response(JSON.stringify({
      success: true,
      video_id: video.id,
      upload_url: `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/video/upload`,
      upload_params: finalUploadParams
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ Upload error:', error)
    console.error('❌ Error stack:', error.stack)
    
    // Diferentes tipos de erro com mensagens mais específicas
    let errorMessage = error.message || 'Erro desconhecido'
    let statusCode = 400
    
    if (error.message?.includes('Usuário não autenticado')) {
      statusCode = 401
      errorMessage = 'Usuário não autenticado. Faça login novamente.'
    } else if (error.message?.includes('Authorization header missing')) {
      statusCode = 401
      errorMessage = 'Token de autorização não encontrado.'
    } else if (error.message?.includes('Tipo de arquivo inválido')) {
      statusCode = 400
      errorMessage = 'Formato de arquivo não suportado. Use MP4, MOV, AVI, WEBM ou MKV.'
    } else if (error.message?.includes('muito grande')) {
      statusCode = 413
      errorMessage = error.message
    } else if (error.message?.includes('Limite')) {
      statusCode = 429
      errorMessage = error.message
    } else if (error.message?.includes('CLOUDINARY')) {
      statusCode = 500
      errorMessage = 'Erro no serviço de upload. Tente novamente em alguns minutos.'
    } else if (error.code === '23505') { // Duplicate key error
      statusCode = 409
      errorMessage = 'Erro de duplicação. Tente novamente.'
    } else if (error.code?.startsWith('23')) { // Database constraint errors
      statusCode = 400
      errorMessage = 'Erro de validação dos dados.'
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      debug_info: {
        original_error: error.message,
        error_code: error.code,
        timestamp: new Date().toISOString()
      }
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper function to generate Cloudinary signature
async function generateCloudinarySignature(paramsToSign: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(paramsToSign + apiSecret)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
} 