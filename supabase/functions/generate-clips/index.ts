import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

interface ClipSuggestion {
  start_time: number
  end_time: number
  duration: number
  title: string
  description: string
  viral_score: number
  hook_strength: number
  best_platforms: string[]
  content_category: string
  hashtags: string[]
  increment_value: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateClipsRequest {
  video_id: string
  clip_suggestions: Array<{
    start_time: number
    end_time: number
    title: string
    viral_score: number
    hook_strength: number
    hashtags: string[]
    reason: string
    topic: string
    emotions: string[]
    best_platforms: string[]
    content_category: string
  }>
  cloudinary_public_id: string
  preferences?: any
}

// Função para criar clip com Shotstack API
async function createClipWithShotstack(
  videoUrl: string,
  startTime: number,
  endTime: number,
  title: string,
  subtitleText: string,
  platform: string = 'tiktok'
) {
  // Determinar ambiente (sandbox ou production)
  const environment = Deno.env.get('SHOTSTACK_ENVIRONMENT') || 'sandbox'
  const SHOTSTACK_API_KEY = environment === 'production' 
    ? Deno.env.get('SHOTSTACK_API_KEY_PRODUCTION')
    : (Deno.env.get('SHOTSTACK_API_KEY_SANDBOX') || 'sk_test_key_placeholder')
  
  const SHOTSTACK_API_URL = `https://api.shotstack.io/edit/${environment}/render`
  
  if (!SHOTSTACK_API_KEY || SHOTSTACK_API_KEY === 'sk_test_key_placeholder') {
    console.log('⚠️ SHOTSTACK_API_KEY não configurada, usando simulação')
    // Simular resposta do Shotstack para testes
    return {
      render_id: `test_render_${Date.now()}`,
      status: 'done',
      shotstack_url: `https://cdn.shotstack.io/test/render_${Date.now()}.mp4`
    }
  }
  
  console.log(`🎬 Usando Shotstack ${environment.toUpperCase()} para: ${title}`)

  // Configurações por plataforma
  const platformConfigs = {
    tiktok: { width: 1080, height: 1920, format: 'mp4' }, // 9:16
    instagram: { width: 1080, height: 1080, format: 'mp4' }, // 1:1  
    youtube: { width: 1920, height: 1080, format: 'mp4' } // 16:9
  }

  const config = platformConfigs[platform] || platformConfigs.tiktok

  // Timeline profissional baseado na documentação Shotstack
  const timeline = {
    background: '#000000',
    tracks: [
      // Track 1: Vídeo principal
      {
        clips: [
          {
            asset: {
              type: 'video',
              src: videoUrl,
              trim: startTime,
              volume: 0.8
            },
            start: 0,
            length: endTime - startTime,
            fit: 'crop',
            scale: 1.1,
            position: 'center',
            transition: {
              in: 'fade',
              out: 'fade'
            }
          }
        ]
      },
      // Track 2: Título/Hook (primeiros 3 segundos)
      {
        clips: [
          {
            asset: {
              type: 'title',
              text: title,
              style: 'future',
              color: '#ffffff',
              size: 'large',
              background: 'rgba(0,0,0,0.8)',
              position: 'center'
            },
            start: 0,
            length: Math.min(3, endTime - startTime),
            transition: {
              in: 'slideDown',
              out: 'fade'
            }
          }
        ]
      },
      // Track 3: Legendas/Subtítulos
      {
        clips: [
          {
            asset: {
              type: 'title',
              text: subtitleText,
              style: 'subtitle',
              color: '#ffffff',
              size: 'medium',
              background: 'rgba(0,0,0,0.7)',
              position: 'bottom'
            },
            start: 0.5,
            length: endTime - startTime - 0.5,
            transition: {
              in: 'slideUp',
              out: 'slideDown'
            }
          }
        ]
      }
    ]
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
    console.log(`🎬 Criando clip com Shotstack: ${title}`)
    
    const response = await fetch(SHOTSTACK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SHOTSTACK_API_KEY}`,
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
      shotstack_url: null // Será preenchida quando o render estiver pronto
    }

  } catch (error) {
    console.error('❌ Erro ao chamar Shotstack:', error)
    return null
  }
}

// Função para verificar status do render Shotstack
async function checkShotstackRender(renderId: string) {
  const environment = Deno.env.get('SHOTSTACK_ENVIRONMENT') || 'sandbox'
  const SHOTSTACK_API_KEY = environment === 'production' 
    ? Deno.env.get('SHOTSTACK_API_KEY_PRODUCTION')
    : Deno.env.get('SHOTSTACK_API_KEY_SANDBOX')
  const SHOTSTACK_STATUS_URL = `https://api.shotstack.io/edit/${environment}/render/${renderId}`
  
  if (!SHOTSTACK_API_KEY) return null

  try {
    const response = await fetch(SHOTSTACK_STATUS_URL, {
      headers: {
        'Authorization': `Bearer ${SHOTSTACK_API_KEY}`
      }
    })

    if (!response.ok) return null

    const result = await response.json()
    return result.response

  } catch (error) {
    console.error('❌ Erro ao verificar status Shotstack:', error)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔧 DEBUG: Iniciando função generate-clips MELHORADA')
    console.log('🔧 DEBUG: SUPABASE_URL:', Deno.env.get('SUPABASE_URL'))
    console.log('🔧 DEBUG: SERVICE_ROLE_KEY presente:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    
    const environment = Deno.env.get('SHOTSTACK_ENVIRONMENT') || 'sandbox'
    const shotstackKey = environment === 'production' 
      ? Deno.env.get('SHOTSTACK_API_KEY_PRODUCTION')
      : Deno.env.get('SHOTSTACK_API_KEY_SANDBOX')
    
    console.log('🔧 DEBUG: SHOTSTACK_ENVIRONMENT:', environment)
    console.log('🔧 DEBUG: SHOTSTACK_API_KEY presente:', !!shotstackKey)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { video_id } = await req.json()
    
    if (!video_id) {
      return new Response(
        JSON.stringify({ error: 'video_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🎬 Iniciando geração de clips PROFISSIONAIS para video: ${video_id}`)

    // 1. Buscar dados do vídeo
    console.log('🔧 DEBUG: Buscando vídeo com ID:', video_id)
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

    console.log(`📹 Vídeo encontrado: ${video.original_filename}`)

    // 2. Buscar sugestões de clips da análise ou gerar automaticamente
    console.log('🔧 DEBUG: Buscando análise de conteúdo...')
    let clipSuggestions: ClipSuggestion[] = []
    
    // Tentar buscar da tabela content_analysis primeiro
    const { data: suggestions, error: suggestionsError } = await supabaseClient
      .from('content_analysis')
      .select('clips_suggestions')
      .eq('video_id', video_id)
      .single()

    if (!suggestionsError && suggestions?.clips_suggestions) {
              // Converter dados da análise para o formato esperado
        const rawSuggestions = suggestions.clips_suggestions as any[]
        clipSuggestions = rawSuggestions.map(s => ({
          start_time: s.start_time,
          end_time: s.end_time,
          duration: s.end_time - s.start_time,
          title: s.title,
          description: s.reason || `Clip: ${s.title}`,
          viral_score: s.viral_score,
          hook_strength: s.hook_strength,
          best_platforms: s.best_platforms || ['tiktok'],
          content_category: s.content_category || 'viral',
          hashtags: s.hashtags || ['#viral'],
          increment_value: 1,
          reason: s.reason || 'Clip gerado automaticamente',
          emotions: s.emotions || ['interesse']
        }))
      console.log(`🎯 ${clipSuggestions.length} sugestões encontradas na análise`)
    } else {
      console.log('⚠️ Análise não encontrada, gerando clips automáticos...')
      
      // Gerar clips automáticos baseados na duração do vídeo
      const duration = video.duration_seconds || 60
      const numClips = Math.min(3, Math.floor(duration / 20)) // 1 clip a cada 20s, máximo 3
      
      for (let i = 0; i < numClips; i++) {
        const startTime = i * Math.floor(duration / numClips)
        const endTime = Math.min(startTime + 30, duration) // Clips de 30s
        
        clipSuggestions.push({
          start_time: startTime,
          end_time: endTime,
          duration: endTime - startTime,
          title: `Momento Viral ${i + 1}`,
          description: `Clip automático ${i + 1} do vídeo`,
          viral_score: 7.5 + (i * 0.5), // Scores variados
          hook_strength: 8.0,
          best_platforms: ['tiktok', 'instagram'],
          content_category: 'viral',
          hashtags: ['#viral', '#clips', '#trending'],
          increment_value: 1
        })
    }

      console.log(`🤖 ${clipSuggestions.length} clips automáticos gerados`)
    }
    console.log(`🎯 ${clipSuggestions.length} sugestões encontradas`)
    console.log('🔧 DEBUG: Sugestões de clips:', JSON.stringify(clipSuggestions, null, 2))

    // 3. Buscar transcrição para legendas
    const { data: transcriptionData } = await supabaseClient
      .from('videos')
      .select('transcription')
      .eq('id', video_id)
      .single()

    const transcription = transcriptionData?.transcription || {}
    const transcriptText = transcription.text || 'Conteúdo viral'

    // 4. Gerar clips profissionais para cada sugestão (máximo 3 para teste gratuito)
    const generatedClips = []
    const maxClips = 3 // Limite para economizar créditos gratuitos
    
    for (let i = 0; i < Math.min(clipSuggestions.length, maxClips); i++) {
      const suggestion = clipSuggestions[i]
      
      try {
        console.log(`🎬 Gerando clip PROFISSIONAL ${i + 1}/${Math.min(clipSuggestions.length, maxClips)}`)
        console.log(`⏱️ Tempo: ${suggestion.start_time}s - ${suggestion.end_time}s`)
        
        const startTime = Math.max(0, Math.floor(suggestion.start_time))
        const endTime = Math.min(video.duration_seconds || 0, Math.ceil(suggestion.end_time))
        const duration = endTime - startTime
        
        if (duration <= 0 || duration > 60) {
          console.warn(`⚠️ Duração inválida para clip ${i + 1}: ${duration}s`)
          continue
        }

        // Determinar melhor plataforma
        const bestPlatform = suggestion.best_platforms?.[0]?.toLowerCase() || 'tiktok'
        
        // Gerar subtitle específico para este segmento
        let clipSubtitle = suggestion.title
        if (transcription.segments) {
          const relevantSegments = transcription.segments.filter(seg => 
            seg.start >= startTime && seg.end <= endTime
          )
          if (relevantSegments.length > 0) {
            clipSubtitle = relevantSegments.map(seg => seg.text).join(' ').substring(0, 100)
          }
        }

        // Tentar criar clip com Shotstack
        const shotstackResult = await createClipWithShotstack(
          video.cloudinary_secure_url,
          startTime,
          endTime,
          suggestion.title,
          clipSubtitle,
          bestPlatform
        )

        // Fallback: URL simples do Cloudinary se Shotstack falhar
        const fallbackUrl = video.cloudinary_secure_url.replace(
          '/upload/',
          `/upload/so_${startTime},eo_${endTime}/`
        )

        const clipUrl = shotstackResult ? 'pending_shotstack_render' : fallbackUrl

        console.log(`🔗 URL do clip: ${clipUrl}`)

        // 5. Inserir clip no banco
        const clipData = {
          video_id: video_id,
          user_id: video.user_id,
          title: suggestion.title,
          description: suggestion.description || `Clip viral ${i + 1} - ${suggestion.title}`,
          clip_number: i + 1,
          start_time_seconds: startTime,
          end_time_seconds: endTime,
          // duration_seconds é calculada automaticamente (coluna gerada)
          ai_viral_score: parseFloat((suggestion.viral_score / 10).toFixed(1)), // Converter de 0-100 para 0-10
          ai_hook_strength: parseFloat((suggestion.hook_strength / 10).toFixed(1)), // Converter de 0-100 para 0-10
          ai_best_platform: suggestion.best_platforms,
          ai_content_category: suggestion.content_category,
          ai_analysis_reason: suggestion.reason || `Clip gerado automaticamente`,
          ai_detected_emotions: suggestion.emotions || ['interesse'],
          hashtags: suggestion.hashtags,
          cloudinary_secure_url: clipUrl,
          cloudinary_public_id: `${video.cloudinary_public_id}_clip_${i + 1}`,
          shotstack_render_id: shotstackResult?.render_id || null,
          shotstack_status: shotstackResult ? 'queued' : null,
          status: shotstackResult ? 'draft' : 'ready' // 'processing' não é válido, usar 'draft' para clips em processamento
        }
        
        console.log(`📝 Tentando inserir clip ${i + 1}:`, JSON.stringify(clipData, null, 2))

        console.log(`📦 Inserindo clip PROFISSIONAL no banco`)
        console.log(`🔧 DEBUG: Usando supabaseClient:`, !!supabaseClient)
        console.log(`🔧 DEBUG: Tabela clips existe?`, 'Tentando inserir...')

        const { data: newClip, error: clipError } = await supabaseClient
          .from('clips')
          .insert([clipData])
          .select()
          .single()

        if (clipError) {
          console.error(`❌ Erro ao inserir clip ${i + 1}:`, clipError)
          console.error(`❌ Dados que causaram erro:`, JSON.stringify(clipData, null, 2))
          continue
        }

        console.log(`✅ Clip PROFISSIONAL ${i + 1} criado: ${newClip.id}`)
        console.log(`✅ Dados do clip inserido:`, JSON.stringify(newClip, null, 2))
        generatedClips.push(newClip)

      } catch (error) {
        console.error(`❌ Erro ao processar clip ${i + 1}:`, error)
        continue
      }
    }

    // 6. Atualizar contador de clips do vídeo
    const { error: updateError } = await supabaseClient
      .from('videos')
      .update({ 
        clips_generated: generatedClips.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', video_id)

    if (updateError) {
      console.error('❌ Erro ao atualizar vídeo:', updateError)
    }

    console.log(`🎉 Geração PROFISSIONAL concluída: ${generatedClips.length} clips criados`)

    return new Response(
      JSON.stringify({
        success: true,
        clips_generated: generatedClips.length,
        using_shotstack: !!Deno.env.get('SHOTSTACK_API_KEY'),
        clips: generatedClips.map(clip => ({
          id: clip.id,
          title: clip.title,
          duration: clip.duration_seconds,
          viral_score: clip.ai_viral_score,
          url: clip.cloudinary_secure_url,
          status: clip.status,
          shotstack_render_id: clip.shotstack_render_id,
          platform_optimized: clip.ai_best_platform?.[0] || 'tiktok'
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
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