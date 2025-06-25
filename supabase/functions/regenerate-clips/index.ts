import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegenerateClipsRequest {
  video_id: string
  edited_segments?: Array<{
    type: 'subtitle' | 'trim' | 'filter'
    text?: string
    start_time?: number
    end_time?: number
    filter_type?: string
    parameters?: any
  }>
  preferences?: {
    regenerate_all?: boolean
    keep_existing?: boolean
    focus_areas?: string[]
    target_platforms?: string[]
    clip_duration?: number
    clip_count?: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Iniciando regeneração de clips')

    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { 
      video_id, 
      edited_segments = [],
      preferences = {}
    }: RegenerateClipsRequest = await req.json()

    console.log(`📹 Regenerando clips para vídeo: ${video_id}`)

    // 1. Verificar se o vídeo existe
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', video_id)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) {
      throw new Error('Vídeo não encontrado')
    }

    // 2. Buscar clips existentes
    const { data: existingClips } = await supabase
      .from('clips')
      .select('*')
      .eq('video_id', video_id)

    // 3. Regenerar clips usando IA
    const processedClips = []
    
    // Simulação de regeneração - em produção usar IA real
    for (let i = 0; i < 3; i++) {
      const clipData = {
        video_id: video_id,
        user_id: user.id,
        title: `Clip Regenerado ${i + 1}`,
        description: `Clip regenerado com edições aplicadas`,
        clip_number: i + 1,
        start_time_seconds: i * 20,
        end_time_seconds: (i + 1) * 20,
        ai_viral_score: 8.0 + Math.random() * 2,
        ai_hook_strength: 7.5 + Math.random() * 2.5,
        ai_best_platform: ['tiktok', 'instagram'],
        ai_content_category: 'entretenimento',
        hashtags: ['#viral', '#regenerado'],
        cloudinary_secure_url: video.cloudinary_secure_url.replace(
          '/upload/',
          `/upload/so_${i * 20},eo_${(i + 1) * 20}/`
        ),
        cloudinary_public_id: `${video.cloudinary_public_id}_regenerated_${i + 1}`,
        status: 'ready',
        created_at: new Date().toISOString()
      }

      const { data: newClip, error } = await supabase
        .from('clips')
        .insert(clipData)
        .select()
        .single()

      if (!error) {
        processedClips.push(newClip)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      clips_regenerated: processedClips.length,
      clips: processedClips.map(clip => ({
        id: clip.id,
        title: clip.title,
        duration: clip.end_time_seconds - clip.start_time_seconds,
        viral_score: clip.ai_viral_score,
        url: clip.cloudinary_secure_url,
        is_regenerated: true
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Erro na regeneração:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 