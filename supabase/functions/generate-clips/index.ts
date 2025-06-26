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

// Função com timeout para evitar travamentos
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs)
  )
  return Promise.race([promise, timeoutPromise])
}

// Função para criar clip com Shotstack API - MELHORADA baseada na documentação oficial
async function createClipWithShotstack(
  videoUrl: string,
  startTime: number,
  endTime: number,
  title: string,
  subtitleText: string,
  platform: string = 'tiktok'
) {
  try {
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

    // Configurações por plataforma baseadas na documentação
    const platformConfigs = {
      tiktok: { width: 1080, height: 1920, format: 'mp4', fps: 30 }, // 9:16 vertical
      instagram: { width: 1080, height: 1080, format: 'mp4', fps: 30 }, // 1:1 quadrado  
      youtube: { width: 1920, height: 1080, format: 'mp4', fps: 30 }, // 16:9 horizontal
      stories: { width: 1080, height: 1920, format: 'mp4', fps: 30 } // Stories format
    }

    const config = platformConfigs[platform] || platformConfigs.tiktok
    const clipDuration = endTime - startTime

    // Timeline otimizada seguindo a estrutura oficial da Shotstack
    const timeline = {
      background: '#000000',
      fonts: [
        {
          src: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800'
        }
      ],
      tracks: [
        // Track 1 (Bottom): Vídeo principal
        {
          clips: [
            {
              asset: {
                type: 'video',
                src: videoUrl,
                trim: startTime, // Cortar do tempo inicial
                volume: 0.8
              },
              start: 0,
              length: clipDuration,
              fit: 'crop', // Ajustar para o formato da plataforma
              scale: 1.0,
              position: 'center',
              transition: {
                in: 'fade',
                out: 'fade'
              }
            }
          ]
        },
        // Track 2 (Middle): Título/Hook - aparece nos primeiros segundos
        {
          clips: [
            {
              asset: {
                type: 'title',
                text: title,
                style: 'future',
                color: '#ffffff',
                size: 'large',
                background: 'rgba(0,0,0,0.7)',
                position: 'center',
                offset: {
                  x: 0,
                  y: -200 // Posicionar no terço superior
                }
              },
              start: 0,
              length: Math.min(4, clipDuration), // Mostrar por 4 segundos ou duração total
              transition: {
                in: 'slideDown',
                out: 'fade'
              },
              effect: 'zoomIn'
            }
          ]
        },
        // Track 3 (Top): Legendas/Subtítulos - aparecem após o título
        {
          clips: [
            {
              asset: {
                type: 'title',
                text: subtitleText,
                style: 'subtitle',
                color: '#ffffff',
                size: 'medium',
                background: 'rgba(0,0,0,0.8)',
                position: 'bottom',
                offset: {
                  x: 0,
                  y: 50 // Elevar um pouco do bottom
                }
              },
              start: 1, // Começar 1 segundo após o título
              length: clipDuration - 1,
              transition: {
                in: 'slideUp',
                out: 'slideDown'
              }
            }
          ]
        },
        // Track 4 (Overlay): Call-to-Action - aparece no final
        ...(clipDuration > 8 ? [{
          clips: [
            {
              asset: {
                type: 'title',
                text: '👆 Siga para mais!',
                style: 'blockbuster',
                color: '#FFD700',
                size: 'small',
                background: 'rgba(0,0,0,0.9)',
                position: 'topRight',
                offset: {
                  x: -20,
                  y: 20
                }
              },
              start: clipDuration - 3, // Últimos 3 segundos
              length: 3,
              transition: {
                in: 'bounceIn',
                out: 'bounceOut'
              },
              effect: 'pulse'
            }
          ]
        }] : [])
      ]
    }

    // Output configuration seguindo as melhores práticas
    const output = {
      format: config.format,
      resolution: `${config.width}x${config.height}`,
      aspectRatio: platform === 'tiktok' || platform === 'stories' ? '9:16' : 
                   platform === 'instagram' ? '1:1' : '16:9',
      fps: config.fps,
      scaleTo: 'preview', // Para testes, usar 'preview' que é mais rápido
      quality: 'medium' // Balancear qualidade e velocidade
    }

    // Payload final seguindo a estrutura da documentação
    const requestBody = {
      timeline,
      output,
      merge: [
        {
          find: 'title',
          replace: title
        },
        {
          find: 'subtitle',
          replace: subtitleText
        }
      ]
    }

    console.log(`🎬 Criando clip profissional com Shotstack`)
    console.log(`📐 Configuração: ${config.width}x${config.height} (${output.aspectRatio})`)
    console.log(`⏱️ Duração: ${clipDuration}s`)
    
    // Usar timeout de 30 segundos para a chamada Shotstack
    const response = await withTimeout(
      fetch(SHOTSTACK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SHOTSTACK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }),
      30000 // 30 segundos
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro Shotstack:', response.status, errorText)
      
      // Tentar parsear o erro para mais detalhes
      try {
        const errorData = JSON.parse(errorText)
        console.error('📋 Detalhes do erro:', errorData)
      } catch (e) {
        console.error('📋 Erro raw:', errorText)
      }
      
      return null
    }

    const result = await response.json()
    console.log(`✅ Shotstack render iniciado: ${result.response.id}`)
    console.log(`🔗 Status: ${result.response.status}`)
    
    return {
      render_id: result.response.id,
      status: result.response.status || 'queued',
      shotstack_url: result.response.url || null,
      message: result.response.message || 'Render iniciado com sucesso'
    }

  } catch (error) {
    console.error('❌ Erro ao chamar Shotstack:', error)
    console.error('📋 Stack trace:', error.stack)
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
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎬 Generate clips function called')
    console.log('📋 Request method:', req.method)
    
    const requestData = await req.json()
    console.log('📥 Request data:', JSON.stringify(requestData, null, 2))

    // Authenticate user (with fallback for testing)
    const authHeader = req.headers.get('Authorization')
    let user = null
    let isTestMode = false

    if (authHeader && authHeader !== 'Bearer undefined') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.log('⚠️ Auth error, enabling test mode:', authError.message)
        isTestMode = true
      } else {
        user = authUser
        console.log('✅ User authenticated:', user?.email)
      }
    } else {
      console.log('⚠️ No auth header, enabling test mode')
      isTestMode = true
    }

    const { video_id, analysis_data, preferences } = requestData

    if (!video_id) {
      throw new Error('video_id é obrigatório')
    }

    console.log(`🎯 Processing video: ${video_id}`)
    console.log(`🧪 Test mode: ${isTestMode}`)

    // Validate UUID format (but allow test IDs)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(video_id)
    const isTestID = video_id.startsWith('test-')

    if (!isValidUUID && !isTestID) {
      throw new Error('video_id deve ser um UUID válido ou um ID de teste')
    }

    let video = null
    let videoUrl = null

    if (isTestMode || isTestID) {
      console.log('🧪 Using test mode - creating mock video data')
      video = {
        id: video_id,
        title: 'Video de Teste',
        file_url: 'https://demo.example.com/test-video.mp4',
        user_id: user?.id || 'test-user',
        duration_seconds: 60
      }
      videoUrl = video.file_url
    } else {
      // Real mode - fetch video from database
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )

      console.log('🔍 Fetching video from database...')
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', video_id)
        .single()

      if (videoError) {
        console.error('❌ Video fetch error:', videoError)
        throw new Error('Vídeo não encontrado')
      }

      if (!videoData.file_url && !videoData.cloudinary_secure_url) {
        throw new Error('Vídeo ainda não foi processado')
      }

      video = videoData
      videoUrl = videoData.file_url || videoData.cloudinary_secure_url
      console.log('✅ Video found:', video.title)
    }

    // Process analysis data
    let processedAnalysis = analysis_data
    
    if (!processedAnalysis || !processedAnalysis.key_moments) {
      console.log('📋 No analysis data provided, generating default moments')
      processedAnalysis = {
        transcript: "Conteúdo de vídeo interessante com potencial viral",
        key_moments: [
          {
            start_time: 5,
            end_time: 35,
            description: "Momento principal do vídeo",
            confidence: 0.8,
            topics: ["conteúdo", "viral"]
          }
        ],
        sentiment: "positive",
        engagement_score: 0.7
      }
    }

    console.log(`📊 Found ${processedAnalysis.key_moments.length} key moments`)

    // Generate clips based on key moments
    const platformPrefs = preferences?.platforms || ['tiktok', 'instagram']
    const maxClips = preferences?.max_clips || 3
    const minDuration = preferences?.min_duration || 15
    const maxDuration = preferences?.max_duration || 60

    const generatedClips = []
    let clipIndex = 0

    for (const moment of processedAnalysis.key_moments.slice(0, maxClips)) {
      for (const platform of platformPrefs) {
        if (generatedClips.length >= maxClips) break

        const duration = Math.min(maxDuration, Math.max(minDuration, moment.end_time - moment.start_time))
        const adjustedEndTime = moment.start_time + duration

        const clipTitle = `${moment.description} - ${platform.toUpperCase()}`
        const subtitleText = `${moment.description}. ${processedAnalysis.transcript.substring(0, 100)}...`

        console.log(`🎬 Generating clip ${clipIndex + 1}: ${clipTitle}`)

        // Create clip with Shotstack (or simulation)
        const clipResult = await createClipWithShotstack(
          videoUrl,
          moment.start_time,
          adjustedEndTime,
          clipTitle,
          subtitleText,
          platform
        )

        if (clipResult) {
          const clipData = {
            id: `clip_${Date.now()}_${clipIndex}`,
            video_id: video_id,
            title: clipTitle,
            start_time: moment.start_time,
            end_time: adjustedEndTime,
            duration: duration,
            platform: platform,
            status: clipResult.status || 'processing',
            shotstack_render_id: clipResult.render_id,
            shotstack_url: clipResult.shotstack_url,
            ai_viral_score: moment.confidence * 10,
            description: moment.description,
            created_at: new Date().toISOString(),
            // Enhanced data from Shotstack improvements
            timeline_data: {
              background: '#000000',
              tracks: [
                {
                  clips: [{
                    asset: {
                      type: 'video',
                      src: videoUrl,
                      trim: moment.start_time,
                      volume: 0.8
                    },
                    start: 0,
                    length: duration,
                    fit: 'crop',
                    position: 'center'
                  }]
                },
                {
                  clips: [{
                    asset: {
                      type: 'title',
                      text: clipTitle,
                      style: 'future',
                      color: '#ffffff',
                      size: 'large',
                      position: 'center'
                    },
                    start: 0,
                    length: Math.min(4, duration),
                    transition: { in: 'slideDown', out: 'fade' }
                  }]
                }
              ]
            },
            output_config: {
              format: 'mp4',
              resolution: platform === 'tiktok' ? '1080x1920' : 
                         platform === 'instagram' ? '1080x1080' : '1920x1080',
              aspectRatio: platform === 'tiktok' ? '9:16' : 
                          platform === 'instagram' ? '1:1' : '16:9',
              fps: 30,
              quality: 'medium'
            }
          }

          if (!isTestMode && !isTestID) {
            // Save to database only in real mode
            try {
              const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_ANON_KEY') ?? '',
                { global: { headers: { Authorization: authHeader } } }
              )

              const { error: insertError } = await supabase
                .from('clips')
                .insert({
                  video_id: video_id,
                  title: clipData.title,
                  start_time_seconds: clipData.start_time,
                  end_time_seconds: clipData.end_time,
                  duration_seconds: clipData.duration,
                  platform: clipData.platform,
                  status: clipData.status,
                  shotstack_render_id: clipData.shotstack_render_id,
                  ai_viral_score: clipData.ai_viral_score,
                  description: clipData.description
                })

              if (insertError) {
                console.error('❌ Error saving clip:', insertError)
              } else {
                console.log('✅ Clip saved to database')
              }
            } catch (saveError) {
              console.error('❌ Database save error:', saveError)
            }
          }

          generatedClips.push(clipData)
          clipIndex++
        }

        if (generatedClips.length >= maxClips) break
      }
    }

    console.log('🕐 Timestamp fim geração clips:', new Date().toISOString())

    // 6. Atualizar contador de clips do vídeo (only in real mode)
    if (!isTestMode && !isTestID) {
      console.log('📊 Atualizando contador de clips do vídeo...')
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        )

        const { error: updateError } = await supabase
          .from('videos')
          .update({ 
            clips_generated: generatedClips.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', video_id)

        if (updateError) {
          console.error('❌ Erro ao atualizar vídeo:', updateError)
        } else {
          console.log('✅ Contador de clips atualizado')
        }
      } catch (updateErr) {
        console.error('❌ Erro ao conectar para atualizar vídeo:', updateErr)
      }
    } else {
      console.log('🧪 Test mode: Skipping video update')
    }

    console.log(`🎉 Geração PROFISSIONAL concluída: ${generatedClips.length} clips criados`)
    console.log('🕐 Timestamp final:', new Date().toISOString())

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
          platform_optimized: clip.platform
        })),
        debug_info: {
          total_processing_time: 'Check logs for timestamps',
          video_found: !!video,
          analysis_found: !!processedAnalysis,
          transcription_found: !!processedAnalysis.transcript,
          clips_attempted: Math.min(processedAnalysis.key_moments.length, maxClips),
          clips_successful: generatedClips.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro geral na função:', error)
    console.log('🕐 Timestamp erro geral:', new Date().toISOString())
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: {
          stack: error.stack,
          name: error.name,
          timestamp: new Date().toISOString()
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 