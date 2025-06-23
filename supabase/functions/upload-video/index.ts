import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v2 as cloudinary } from 'https://esm.sh/cloudinary@1.42.0'
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { fileName, fileSize, contentType, duration, processingConfig }: UploadRequest = await req.json()

    console.log(`Upload request from user ${user.id}: ${fileName} (${fileSize} bytes)`)

    // Validate file
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
    if (!validVideoTypes.includes(contentType)) {
      throw new Error('Tipo de arquivo inválido. Apenas vídeos são permitidos.')
    }

    // Get user profile and check limits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

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

    // Validate limits
    if (limits.videos_per_month !== -1 && 
        profile.usage_videos_current_month >= limits.videos_per_month) {
      throw new Error(`Limite mensal de ${limits.videos_per_month} vídeos atingido. Faça upgrade do seu plano.`)
    }

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

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME'),
      api_key: Deno.env.get('CLOUDINARY_API_KEY'),
      api_secret: Deno.env.get('CLOUDINARY_API_SECRET'),
    })

    // Generate unique public_id
    const timestamp = Math.round(Date.now() / 1000)
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const publicId = `videos/${user.id}/${timestamp}_${sanitizedFileName}`

    // Simplified Cloudinary upload parameters to avoid 400 errors
    const uploadParams = {
      public_id: publicId,
      folder: `videos/${user.id}`,
      resource_type: 'video' as const,
      type: 'upload' as const,
      timestamp: timestamp,
      
      // Basic video optimization
      video_codec: 'auto',
      audio_codec: 'auto',
      
      // Metadata
      context: {
        user_id: user.id,
        original_filename: fileName,
        upload_source: 'contenthub-ai'
      }
    }

    // Generate signature for secure upload
    const paramsToSign = Object.keys(uploadParams)
      .sort()
      .filter(key => key !== 'context' && uploadParams[key as keyof typeof uploadParams])
      .map(key => `${key}=${uploadParams[key as keyof typeof uploadParams]}`)
      .join('&')
    
    const signature = await generateCloudinarySignature(
      paramsToSign,
      Deno.env.get('CLOUDINARY_API_SECRET')!
    )

    // Create video record in database
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
        original_filename: fileName,
        file_size_bytes: fileSize,
        duration_seconds: duration,
        cloudinary_public_id: publicId,
        processing_status: 'uploading',
        // Store processing config
        processing_preferences: processingConfig || profile.processing_preferences
      })
      .select()
      .single()

    if (videoError) throw videoError

    console.log(`Created video record ${video.id} for upload`)

    // Update usage
    await supabase
      .from('profiles')
      .update({ 
        usage_videos_current_month: profile.usage_videos_current_month + 1,
        usage_storage_bytes: profile.usage_storage_bytes + fileSize
      })
      .eq('id', user.id)

    return new Response(JSON.stringify({
      success: true,
      video_id: video.id,
      upload_url: `https://api.cloudinary.com/v1_1/${Deno.env.get('CLOUDINARY_CLOUD_NAME')}/video/upload`,
      upload_params: {
        ...uploadParams,
        signature,
        api_key: Deno.env.get('CLOUDINARY_API_KEY'),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
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