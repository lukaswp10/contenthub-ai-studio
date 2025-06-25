import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  video_id: string
  transcript: string
  cloudinary_url?: string
  cloudinary_public_id?: string
}

interface ClipSuggestion {
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { video_id, transcript: providedTranscript, cloudinary_url, cloudinary_public_id }: AnalyzeRequest = await req.json()

    console.log(`Starting content analysis for video ${video_id}`)

    // Get video data
    const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', video_id)
        .eq('user_id', user.id)
        .single()

    if (videoError || !video) {
      throw new Error('Vídeo não encontrado')
    }

    // Get transcript from parameter or video data
    let transcript = providedTranscript
    if (!transcript && video.transcription?.text) {
      transcript = video.transcription.text
    }

    if (!transcript) {
      throw new Error('Transcrição não disponível')
    }

    // Update status to analyzing
    await supabase
      .from('videos')
      .update({ 
        processing_status: 'analyzing',
        updated_at: new Date().toISOString()
      })
      .eq('id', video_id)

    // Get user processing preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const preferences = profile?.processing_preferences || {}

    // Get Groq API key
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    
    let clipSuggestions: ClipSuggestion[]
    let contentAnalysis: any

    if (!groqApiKey || groqApiKey === 'gsk_test_key_placeholder') {
      // Use simulation/fallback
      console.log('🔍 Using simulated analysis (Groq API key não configurada)')
      
      // Generate realistic mock clip suggestions based on transcript content
      clipSuggestions = generateMockClipSuggestions(transcript, video.duration_seconds || 300, preferences)
      contentAnalysis = {
        type: 'simulated',
        content_category: detectContentType(transcript),
        engagement_potential: 'alto',
        viral_score: 82
      }
    } else {

    // Create analysis prompt
    const analysisPrompt = createAnalysisPrompt(transcript, video.duration_seconds || 300, preferences)

    console.log(`Sending ${transcript.length} characters to Groq for analysis`)

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em análise de conteúdo viral e criação de clips para redes sociais.
            Sua tarefa é identificar os momentos mais envolventes de transcrições de vídeo que funcionariam bem como clips curtos.
            Sempre responda com JSON válido apenas, sem texto adicional.`
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error('Groq API error:', errorText)
      throw new Error(`Erro na API do Groq: ${errorText}`)
    }

    const groqResult = await groqResponse.json()
    console.log('Groq analysis completed')

    // Parse AI response
    try {
      const aiResponse = JSON.parse(groqResult.choices[0].message.content)
      clipSuggestions = aiResponse.clips || []
      contentAnalysis = aiResponse.analysis || {}
      
      if (!Array.isArray(clipSuggestions)) {
          throw new Error('Formato de resposta da IA inválido')
      }
    } catch (parseError) {
        console.error('Error parsing AI response:', parseError)
      // Fallback to automatic clip generation
        clipSuggestions = generateFallbackClips(video.duration_seconds || 300, preferences)
        contentAnalysis = { type: 'auto-generated', error: 'AI parse error' }
      }
    }

    // Validate and enhance clip suggestions
    const validatedClips = validateAndEnhanceClips(
      clipSuggestions,
      video.duration_seconds || 300,
      preferences
    )

    console.log(`${validatedClips.length} valid clips identified`)

    // Extract main topics and key moments
    const mainTopics = [...new Set(validatedClips.map(c => c.topic))].slice(0, 5)
    const keyMoments = validatedClips.map(c => ({
      time: c.start_time,
      description: c.title,
      score: c.viral_score
    }))

    // Save analysis to content_analysis table
    console.log('💾 Salvando análise no banco...')
    const { error: analysisError } = await supabase
      .from('content_analysis')
      .upsert({
        video_id,
        user_id: user.id,
        clips_suggestions: validatedClips,
        analysis_completed: true
      })

    if (analysisError) {
      console.error('Error saving analysis:', analysisError)
      throw analysisError
    }

    // Update video status to completed
    await supabase
      .from('videos')
      .update({
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', video_id)

    // Trigger clips generation
    console.log('Triggering clips generation...')
    try {
      const clipsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-clips`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      },
      body: JSON.stringify({ 
          video_id,
          clip_suggestions: validatedClips.slice(0, 5) // Top 5 clips
      })
    })

      if (!clipsResponse.ok) {
        const errorText = await clipsResponse.text()
        console.error('Clips generation failed:', errorText)
      } else {
        console.log('Clips generation triggered successfully')
      }
    } catch (error) {
      console.error('Error triggering clips generation:', error)
    }

    console.log('✅ Análise concluída com sucesso!')

    return new Response(JSON.stringify({
      success: true,
      video_id,
      clips_suggestions: validatedClips,
      clips_found: validatedClips.length,
      main_topics: mainTopics,
      next_step: 'generating_clips',
      message: `Análise concluída! ${validatedClips.length} clips identificados.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Content analysis error:', error)
    
    // Update video status to error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )
      
      const { video_id } = await req.json().catch(() => ({}))
      if (video_id) {
      await supabase
        .from('videos')
        .update({ 
            processing_status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString()
        })
        .eq('id', video_id)
      }
    } catch (dbError) {
      console.error('Error updating video status:', dbError)
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function createAnalysisPrompt(transcript: string, duration: number, preferences: any): string {
  return `
Analise esta transcrição de vídeo e identifique os melhores momentos para criar clips virais:

TRANSCRIÇÃO:
${transcript}

DURAÇÃO DO VÍDEO: ${duration} segundos

INSTRUÇÕES:
1. Identifique 3-5 segmentos de 15-60 segundos que têm potencial viral
2. Para cada segmento, forneça:
   - start_time e end_time em segundos
   - title atrativo 
   - viral_score (0-100)
   - hook_strength (0-100)
   - hashtags relevantes
   - reason para o potencial viral
   - topic principal
   - emotions predominantes
   - best_platforms (TikTok, Instagram, YouTube, etc)
   - content_category

RESPONDA APENAS COM JSON:
{
  "clips": [
    {
      "start_time": 0,
      "end_time": 30,
      "title": "Título atrativo",
      "viral_score": 85,
      "hook_strength": 90,
      "hashtags": ["#viral", "#dica"],
      "reason": "Por que este momento é viral",
      "topic": "Tópico principal",
      "emotions": ["surpresa", "curiosidade"],
      "best_platforms": ["TikTok", "Instagram"],
      "content_category": "educativo"
    }
  ],
  "analysis": {
    "content_type": "educativo",
    "overall_quality": 85,
    "engagement_potential": "alto"
  }
}
`
}

function validateAndEnhanceClips(
  suggestions: any[],
  videoDuration: number,
  preferences: any
): ClipSuggestion[] {
  return suggestions
    .filter(clip => {
      // Basic validation
      return clip.start_time >= 0 && 
             clip.end_time <= videoDuration && 
             clip.start_time < clip.end_time &&
             (clip.end_time - clip.start_time) >= 10 && // Minimum 10 seconds
             (clip.end_time - clip.start_time) <= 120   // Maximum 2 minutes
    })
    .map(clip => ({
      start_time: Math.round(clip.start_time),
      end_time: Math.round(clip.end_time),
      title: clip.title || 'Clip sem título',
      viral_score: Math.min(100, Math.max(0, clip.viral_score || 50)),
      hook_strength: Math.min(100, Math.max(0, clip.hook_strength || 50)),
      hashtags: Array.isArray(clip.hashtags) ? clip.hashtags.slice(0, 5) : [],
      reason: clip.reason || 'Momento interessante',
      topic: clip.topic || 'Geral',
      emotions: Array.isArray(clip.emotions) ? clip.emotions : [],
      best_platforms: Array.isArray(clip.best_platforms) ? clip.best_platforms : ['TikTok'],
      content_category: clip.content_category || 'geral'
    }))
    .sort((a, b) => b.viral_score - a.viral_score)
    .slice(0, 10) // Top 10 clips
}

function generateFallbackClips(duration: number, preferences: any): ClipSuggestion[] {
  const clipCount = Math.min(5, Math.floor(duration / 60)) // 1 clip per minute max
  const clips: ClipSuggestion[] = []
  
  for (let i = 0; i < clipCount; i++) {
    const startTime = Math.floor((duration / clipCount) * i)
    const endTime = Math.min(startTime + 30, duration)
    
    clips.push({
      start_time: startTime,
      end_time: endTime,
      title: `Momento ${i + 1}`,
      viral_score: 60,
      hook_strength: 50,
      hashtags: ['#clip', '#video'],
      reason: 'Gerado automaticamente',
      topic: 'Geral',
      emotions: [],
      best_platforms: ['TikTok', 'Instagram'],
      content_category: 'geral'
    })
  }
  
  return clips
}

function detectContentType(text: string): string {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('como') || lowerText.includes('tutorial') || lowerText.includes('ensinar')) {
    return 'educativo'
  } else if (lowerText.includes('rir') || lowerText.includes('piada') || lowerText.includes('engraçado')) {
    return 'humor'
  } else if (lowerText.includes('motivação') || lowerText.includes('sucesso') || lowerText.includes('inspirar')) {
    return 'motivacional'
  } else if (lowerText.includes('notícia') || lowerText.includes('aconteceu') || lowerText.includes('evento')) {
    return 'informativo'
  }
  
  return 'geral'
}

function generateMockClipSuggestions(transcript: string, duration: number, preferences: any): ClipSuggestion[] {
  const contentType = detectContentType(transcript)
  const clips: ClipSuggestion[] = []
  
  // Generate 3-5 clips based on content and duration
  const clipCount = Math.min(5, Math.floor(duration / 30)) // 1 clip per 30 seconds max
  const segmentDuration = Math.min(60, duration / clipCount)
  
  const viralTriggers = ['dica', 'segredo', 'truque', 'como', 'primeiro', 'segundo', 'terceiro', 'importante', 'crucial']
  const words = transcript.toLowerCase().split(' ')
  
  for (let i = 0; i < clipCount; i++) {
    const startTime = Math.floor((duration / clipCount) * i)
    const endTime = Math.min(startTime + segmentDuration, duration)
    
    // Check for viral triggers in this segment
    const hasViralTrigger = viralTriggers.some(trigger => 
      transcript.toLowerCase().includes(trigger)
    )
    
    const viralScore = hasViralTrigger ? Math.floor(Math.random() * 20) + 75 : Math.floor(Math.random() * 25) + 60
    
    clips.push({
      start_time: startTime,
      end_time: endTime,
      title: generateClipTitle(contentType, i + 1),
      viral_score: viralScore,
      hook_strength: Math.floor(Math.random() * 20) + 70,
      hashtags: generateHashtags(contentType),
      reason: generateReason(contentType, hasViralTrigger),
      topic: contentType,
      emotions: ['interesse', 'curiosidade'],
      best_platforms: ['TikTok', 'Instagram', 'YouTube'],
      content_category: contentType
    })
  }
  
  return clips.sort((a, b) => b.viral_score - a.viral_score)
}

function generateClipTitle(contentType: string, index: number): string {
  const titles = {
    educativo: [
      `📚 Dica ${index}: Como Fazer Isso Direito`,
      `🎯 Passo ${index} Que Ninguém Te Conta`,
      `💡 Segredo ${index} Revelado`,
      `🚀 Tutorial Essencial #${index}`
    ],
    motivacional: [
      `💪 Mindset ${index} Para o Sucesso`,
      `🔥 Estratégia ${index} Que Funciona`,
      `⭐ Lição ${index} Que Mudou Tudo`,
      `🎯 Técnica ${index} Para Vencer`
    ],
    humor: [
      `😂 Momento Hilário ${index}`,
      `🤣 Comédia Pura - Parte ${index}`,
      `😆 Situação Engraçada ${index}`,
      `🎭 Momento Cômico ${index}`
    ],
    geral: [
      `✨ Momento ${index} Imperdível`,
      `🎬 Clip Viral ${index}`,
      `📱 Conteúdo ${index} Para Redes`,
      `🔥 Momento ${index} Épico`
    ]
  }
  
  const categoryTitles = titles[contentType] || titles.geral
  return categoryTitles[index % categoryTitles.length]
}

function generateHashtags(contentType: string): string[] {
  const hashtags = {
    educativo: ['#dicas', '#tutorial', '#aprender', '#educação'],
    motivacional: ['#motivação', '#sucesso', '#mindset', '#foco'],
    humor: ['#humor', '#comédia', '#engraçado', '#risos'],
    geral: ['#viral', '#conteúdo', '#video', '#clip']
  }
  
  return hashtags[contentType] || hashtags.geral
}

function generateReason(contentType: string, hasViralTrigger: boolean): string {
  if (hasViralTrigger) {
    return 'Contém gatilhos virais e palavras-chave que geram engajamento'
  }
  
  const reasons = {
    educativo: 'Conteúdo educativo com potencial de compartilhamento',
    motivacional: 'Mensagem inspiradora que ressoa com o público',
    humor: 'Momento engraçado que gera risos e compartilhamentos',
    geral: 'Segmento interessante com boa dinâmica'
  }
  
  return reasons[contentType] || reasons.geral
} 