import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para criar clip com Shotstack API (profissional)
async function createClipWithShotstack(
  videoUrl: string,
  startTime: number,
  endTime: number,
  title: string,
  subtitles: string,
  platform: string = 'tiktok'
) {
  // Usar a chave de produção por padrão, fallback para sandbox
  const SHOTSTACK_PRODUCTION_KEY = Deno.env.get('SHOTSTACK_PRODUCTION_API_KEY')
  const SHOTSTACK_SANDBOX_KEY = Deno.env.get('SHOTSTACK_SANDBOX_API_KEY')
  
  const API_KEY = SHOTSTACK_PRODUCTION_KEY || SHOTSTACK_SANDBOX_KEY
  const BASE_URL = SHOTSTACK_PRODUCTION_KEY 
    ? 'https://api.shotstack.io/edit/render' 
    : 'https://api.shotstack.io/edit/stage/render'
  
  if (!API_KEY) {
    console.log('⚠️ Shotstack não configurado, usando Cloudinary simples')
    return null
  }

  // Configurações por plataforma
  const platformConfigs = {
    tiktok: { width: 1080, height: 1920, format: 'mp4' }, // 9:16
    instagram: { width: 1080, height: 1080, format: 'mp4' }, // 1:1  
    youtube: { width: 1920, height: 1080, format: 'mp4' } // 16:9
  }

  const config = platformConfigs[platform] || platformConfigs.tiktok
  const duration = endTime - startTime

  // Timeline profissional com legendas customizadas
  const timeline = {
    soundtrack: {
      src: videoUrl,
      effect: 'fadeInFadeOut'
    },
    tracks: [
      {
        clips: [{
          asset: {
            type: 'video',
            src: videoUrl,
            trim: startTime,
            volume: 0.8
          },
          start: 0,
          length: duration,
          fit: 'crop',
          scale: 1.1
        }]
      },
      {
        clips: [{
          asset: {
            type: 'title',
            text: title,
            style: 'future',
            color: '#ffffff',
            size: 'x-large',
            background: 'rgba(0,0,0,0.7)',
            position: 'top'
          },
          start: 0,
          length: 3,
          transition: { in: 'fade', out: 'fade' }
        }]
      }
    ]
  }

  // Adicionar legendas se fornecidas
  if (subtitles && subtitles.trim()) {
    timeline.tracks.push({
      clips: [{
        asset: {
          type: 'title',
          text: subtitles,
          style: 'subtitle',
          color: '#ffffff',
          size: 'large',
          background: 'rgba(0,0,0,0.8)',
          position: 'bottom'
        },
        start: 0,
        length: duration
      }]
    })
  }

  const requestBody = {
    timeline,
    output: {
      format: config.format,
      resolution: `${config.width}x${config.height}`,
      aspectRatio: platform === 'tiktok' ? '9:16' : platform === 'instagram' ? '1:1' : '16:9',
      fps: 30,
      scaleTo: 'preview'
    },
    merge: [
      {
        find: 'title',
        replace: title
      }
    ]
  }

  try {
    console.log(`🎬 Criando clip manual com Shotstack: ${title}`)
    
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro Shotstack:', response.status, errorText)
      return null
    }

    const result = await response.json()
    console.log(`✅ Shotstack render iniciado: ${result.response.id}`)
    
    return {
      render_id: result.response.id,
      status: 'queued',
      shotstack_url: null
    }

  } catch (error) {
    console.error('❌ Erro ao chamar Shotstack:', error)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('✂️ Iniciando criação de clip manual')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      video_id, 
      title, 
      description, 
      start_time_seconds, 
      end_time_seconds,
      subtitles,
      platform = 'tiktok'
    } = await req.json()

    // Validações
    if (!video_id || !title || start_time_seconds === undefined || end_time_seconds === undefined) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: video_id, title, start_time_seconds, end_time_seconds' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const duration = end_time_seconds - start_time_seconds
    if (duration <= 0 || duration > 120) {
      return new Response(
        JSON.stringify({ error: 'Duração deve ser entre 0.1 e 120 segundos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar dados do vídeo
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .select('*')
      .eq('id', video_id)
      .single()

    if (videoError || !video) {
      console.error('❌ Erro ao buscar vídeo:', videoError)
      return new Response(
        JSON.stringify({ error: 'Vídeo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🎬 Criando clip manual para: ${video.title}`)

    // Tentar criar com Shotstack primeiro
    let clipUrl = ''
    let shotstackResult = null
    let status = 'ready'

    if (video.cloudinary_secure_url) {
      shotstackResult = await createClipWithShotstack(
        video.cloudinary_secure_url,
        start_time_seconds,
        end_time_seconds,
        title,
        subtitles || '',
        platform
      )

      if (shotstackResult) {
        clipUrl = 'pending_shotstack_render'
        status = 'processing'
        console.log('✅ Clip será processado pelo Shotstack')
      } else {
        // Fallback para Cloudinary simples
        clipUrl = video.cloudinary_secure_url.replace(
          '/upload/',
          `/upload/so_${start_time_seconds},eo_${end_time_seconds}/`
        )
        console.log('⚠️ Usando fallback Cloudinary')
      }
    }

    // Calcular próximo número do clip
    const { data: existingClips } = await supabaseClient
      .from('clips')
      .select('clip_number')
      .eq('video_id', video_id)
      .order('clip_number', { ascending: false })
      .limit(1)

    const clipNumber = (existingClips?.[0]?.clip_number || 0) + 1

    // Dados do clip (sem duration_seconds)
    const clipData = {
      video_id: video_id,
      user_id: video.user_id,
      title: title,
      description: description || `Clip manual criado no editor`,
      clip_number: clipNumber,
      start_time_seconds: start_time_seconds,
      end_time_seconds: end_time_seconds,
      cloudinary_secure_url: clipUrl || video.cloudinary_secure_url,
      status: status,
      ai_viral_score: 7.5
    }

    console.log('💾 Salvando clip no banco de dados')

    const { data: newClip, error: clipError } = await supabaseClient
      .from('clips')
      .insert([clipData])
      .select()
      .single()

    if (clipError) {
      console.error('❌ Erro ao inserir clip:', clipError)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar clip no banco de dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Clip manual criado com sucesso: ${newClip.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        clip: {
          id: newClip.id,
          title: newClip.title,
          duration: newClip.duration_seconds,
          url: newClip.cloudinary_secure_url,
          status: newClip.status,
          shotstack_render_id: newClip.shotstack_render_id,
          platform: platform,
          created_manually: true
        },
        using_shotstack: !!shotstackResult,
        message: shotstackResult 
          ? 'Clip criado e será processado pelo Shotstack' 
          : 'Clip criado com Cloudinary básico'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro geral na função:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: {
          stack: error.stack,
          name: error.name
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 