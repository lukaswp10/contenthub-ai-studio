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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    console.log(`🎬 Iniciando geração de clips para video: ${video_id}`)

    // 1. Buscar dados do vídeo
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

    // 2. Buscar sugestões de clips da análise
    const { data: suggestions, error: suggestionsError } = await supabaseClient
      .from('content_analysis')
      .select('clips_suggestions')
      .eq('video_id', video_id)
      .single()

    if (suggestionsError || !suggestions?.clips_suggestions) {
      console.error('❌ Erro ao buscar sugestões:', suggestionsError)
      return new Response(
        JSON.stringify({ error: 'Sugestões de clips não encontradas' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const clipSuggestions = suggestions.clips_suggestions as ClipSuggestion[]
    console.log(`🎯 ${clipSuggestions.length} sugestões encontradas`)

    // 3. Gerar clips para cada sugestão
    const generatedClips = []
    
    for (let i = 0; i < clipSuggestions.length; i++) {
      const suggestion = clipSuggestions[i]
      
      try {
        console.log(`🎬 Gerando clip ${i + 1}/${clipSuggestions.length}`)
        console.log(`⏱️ Tempo: ${suggestion.start_time}s - ${suggestion.end_time}s`)
        
        // Gerar URL do clip com transformações do Cloudinary
        const startTime = Math.max(0, Math.floor(suggestion.start_time))
        const endTime = Math.min(video.duration_seconds || 0, Math.ceil(suggestion.end_time))
        const duration = endTime - startTime
        
        if (duration <= 0) {
          console.warn(`⚠️ Duração inválida para clip ${i + 1}: ${duration}s`)
          continue
        }

        // URL do clip com transformações do Cloudinary
        const baseUrl = video.cloudinary_secure_url.replace('/upload/', '/upload/')
        const clipUrl = baseUrl.replace(
          '/upload/',
          `/upload/t_${startTime},t_${endTime}/`
        )

        console.log(`🔗 URL do clip: ${clipUrl}`)

        // 4. Inserir clip no banco
        const clipData = {
          video_id: video_id,
          user_id: video.user_id,
          title: suggestion.title,
          description: suggestion.description,
          start_time_seconds: startTime,
          end_time_seconds: endTime,
          duration_seconds: duration,
          ai_viral_score: parseFloat(suggestion.viral_score.toFixed(1)),
          ai_hook_strength: parseFloat(suggestion.hook_strength.toFixed(1)),
          ai_best_platform: suggestion.best_platforms.join(','),
          hashtags: suggestion.hashtags,
          cloudinary_secure_url: clipUrl,
          cloudinary_public_id: `${video.cloudinary_public_id}_clip_${i + 1}`,
          content_category: suggestion.content_category,
          status: 'ready',
          created_at: new Date().toISOString(),
        }

        const { data: newClip, error: clipError } = await supabaseClient
          .from('clips')
          .insert([clipData])
          .select()
          .single()

        if (clipError) {
          console.error(`❌ Erro ao inserir clip ${i + 1}:`, clipError)
          continue
        }

        console.log(`✅ Clip ${i + 1} criado com sucesso: ${newClip.id}`)
        generatedClips.push(newClip)

      } catch (error) {
        console.error(`❌ Erro ao processar clip ${i + 1}:`, error)
        continue
      }
    }

    // 5. Atualizar status do vídeo
    const { error: updateError } = await supabaseClient
      .from('videos')
      .update({ 
        clips_generated: generatedClips.length,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', video_id)

    if (updateError) {
      console.error('❌ Erro ao atualizar vídeo:', updateError)
    }

    console.log(`🎉 Geração concluída: ${generatedClips.length} clips criados`)

    return new Response(
      JSON.stringify({
        success: true,
        clips_generated: generatedClips.length,
        clips: generatedClips.map(clip => ({
          id: clip.id,
          title: clip.title,
          duration: clip.duration_seconds,
          viral_score: clip.ai_viral_score,
          url: clip.cloudinary_secure_url
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 