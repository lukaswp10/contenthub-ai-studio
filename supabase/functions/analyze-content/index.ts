import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  video_id: string
  transcription?: any
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
    if (!user) throw new Error('Não autenticado')

    const { video_id, transcription }: AnalyzeRequest = await req.json()

    console.log(`Starting content analysis for video ${video_id}`)

    // Get video and transcription if not provided
    let videoData
    let transcriptionData = transcription

    if (!transcriptionData) {
      const { data: video, errorr } = await supabase
        .from('videos')
        .select('*')
        .eq('id', video_id)
        .eq('user_id', user.id)
        .single()

      if (errorr || !video) throw new Error('Vídeo não encontrado')
      
      videoData = video
      transcriptionData = video.transcription
    } else {
      const { data: video } = await supabase
        .from('videos')
        .select('*')
        .eq('id', video_id)
        .eq('user_id', user.id)
        .single()
      
      videoData = video
    }

    if (!transcriptionData) throw new Error('Transcrição não disponível')

    // Update status
    await supabase
      .from('videos')
      .update({ processing_status: 'analyzing' })
      .eq('id', video_id)

    // Get user processing preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('processing_preferences')
      .eq('id', user.id)
      .single()

    const preferences = {
      ...profile?.processing_preferences,
      ...videoData?.processing_preferences
    }

    // Prepare Groq prompt for viral content analysis
    const transcriptionText = transcriptionData.text
    const segments = transcriptionData.segments || []
    
    // Create a detailed prompt for Groq
    const analysisPrompt = createAnalysisPrompt(
      transcriptionText,
      segments,
      preferences,
      transcriptionData.language
    )

    console.log(`Sending ${transcriptionText.length} characters to Groq for analysis`)

    // Call Groq API (REAL)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert viral content analyst specializing in social media trends. 
            Your task is to identify the most engaging moments from video transcripts that would work well as short clips.
            Always respond with valid JSON only, no additional text.`
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
      const errorrText = await groqResponse.text()
      console.errorr('Groq API errorr:', errorrText)
      throw new Error(`Groq API errorr: ${errorrText}`)
    }

    const groqResult = await groqResponse.json()
    console.log('Groq analysis completed')

    // Parse AI response
    let clipSuggestions: ClipSuggestion[]
    let contentAnalysis: any

    try {
      const aiResponse = JSON.parse(groqResult.choices[0].message.content)
      clipSuggestions = aiResponse.clips || []
      contentAnalysis = aiResponse.analysis || {}
      
      if (!Array.isArray(clipSuggestions)) {
        throw new Error('Invalid AI response format')
      }
    } catch (parseError) {
      console.errorr('Error parsing AI response:', parseError)
      // Fallback to automatic clip generation
      clipSuggestions = generateFallbackClips(videoData.duration_seconds || 300, preferences)
      contentAnalysis = { type: 'auto-generated', errorr: 'AI parse errorr' }
    }

    // Validate and enhance clip suggestions
    const validatedClips = validateAndEnhanceClips(
      clipSuggestions,
      videoData.duration_seconds || 3600,
      segments,
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
    const { errorr: analysisError } = await supabase
      .from('content_analysis')
      .upsert({
        video_id,
        user_id: user.id,
        clips_suggestions: validatedClips,
        main_topics: mainTopics,
        key_moments: keyMoments,
        content_type: contentAnalysis.content_type || detectContentType(transcriptionText),
        analysis_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (analysisError) {
      console.errorr('Error saving analysis:', analysisError)
      throw analysisError
    }

    // Update video with analysis
    const { errorr: updateError } = await supabase
      .from('videos')
      .update({
        status: 'analyzed',
        ai_content_type: contentAnalysis.content_type || detectContentType(transcriptionText),
        ai_main_topics: mainTopics,
        ai_key_moments: keyMoments,
        ai_suggested_clips: validatedClips.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', video_id)

    if (updateError) throw updateError

    // Trigger clip generation with new function
    const generateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-clips`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        video_id
      })
    })

    if (!generateResponse.ok) {
      console.errorr('Failed to trigger clip generation')
    }

    return new Response(JSON.stringify({
      success: true,
      video_id,
      clips_found: validatedClips.length,
      main_topics: mainTopics,
      content_type: contentAnalysis.content_type,
      suggestions: validatedClips.slice(0, 3) // Return top 3 for preview
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (errorr: any) {
    console.errorr('Analysis errorr:', errorr)
    
    const { video_id } = await req.json().catch(() => ({}))
    if (video_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )
      
      await supabase
        .from('videos')
        .update({ 
          processing_status: 'failed',
          errorr_message: errorr.message,
          errorr_details: { 
            step: 'analysis',
            errorr: errorr.message,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', video_id)
    }

    return new Response(JSON.stringify({ 
      success: false,
      errorr: errorr.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function createAnalysisPrompt(
  text: string,
  segments: any[],
  preferences: any,
  language: string
): string {
  const clipDuration = preferences.clip_duration || 30
  const clipCount = preferences.clip_count === 'auto' ? 15 : (preferences.clip_count || 8)
  
  return `
You are a TikTok viral content expert. Analyze this ${language} video transcript and identify the ${clipCount} most viral-worthy moments for TikTok/Reels clips.

TRANSCRIPT: """
${text.slice(0, 15000)} ${text.length > 15000 ? '... (truncated)' : ''}
"""

SEGMENTS WITH TIMING (first 100):
${JSON.stringify(segments.slice(0, 100).map(s => ({
  start: s.start,
  end: s.end,
  text: s.text
})))}

TIKTOK VIRAL REQUIREMENTS:
- Each clip should be 15-60 seconds (TikTok's sweet spot)
- Focus on COMPLETE thoughts, shocking facts, or emotional moments
- Prioritize moments with:
  * Strong opening hooks (first 3 seconds must grab attention)
  * Emotional impact (surprise, anger, joy, curiosity)
  * Relatable content or universal truths
  * Controversial or debatable statements
  * Actionable advice or tips
  * Storytelling elements with clear beginning/middle/end

TIKTOK-SPECIFIC ANALYSIS:
1. Viral potential (1-10 score based on TikTok trends)
2. Hook strength (how compelling the first 3 seconds are)
3. Best platforms (prioritize tiktok, instagram, youtube)
4. Trending hashtags (5-10 viral and niche tags)
5. Content category (educational, entertainment, news, lifestyle, etc.)
6. Detected emotions (shock, curiosity, anger, joy, etc.)

Return ONLY a valid JSON object in this exact format:
{
  "analysis": {
    "content_type": "news|educational|entertainment|lifestyle|business|other",
    "overall_theme": "brief description of main theme",
    "target_audience": "description of ideal TikTok viewer"
  },
  "clips": [
    {
      "start_time": 45.5,
      "end_time": 75.5,
      "title": "Shocking Truth About [Topic]",
      "viral_score": 9.5,
      "hook_strength": 9.0,
      "hashtags": ["#viral", "#shocking", "#truth", "#trending", "#fyp"],
      "reason": "Strong opening with shocking revelation followed by emotional impact",
      "topic": "main topic",
      "emotions": ["shock", "curiosity", "anger"],
      "best_platforms": ["tiktok", "instagram"],
      "content_category": "news"
    }
  ]
}

IMPORTANT TIKTOK RULES:
- start_time and end_time must be numbers (seconds with decimals)
- viral_score and hook_strength between 1.0 and 10.0
- Ensure times are within video duration
- Focus on authentic, engaging moments that work on TikTok
- Consider cultural context for ${language} content
- Prioritize clips that can go viral with proper hashtags
`
}

function validateAndEnhanceClips(
  suggestions: any[],
  videoDuration: number,
  segments: any[],
  preferences: any
): ClipSuggestion[] {
  const minDuration = 15
  const maxDuration = 60
  const defaultDuration = preferences.clip_duration || 45
  
  return suggestions
    .filter(clip => {
      // Validate required fields
      if (!clip.start_time || !clip.end_time || !clip.title) return false
      
      // Validate times
      if (clip.start_time < 0 || clip.end_time > videoDuration) return false
      if (clip.start_time >= clip.end_time) return false
      
      const duration = clip.end_time - clip.start_time
      if (duration < minDuration || duration > maxDuration) {
        // Try to adjust duration
        if (duration < minDuration) {
          clip.end_time = Math.min(clip.start_time + defaultDuration, videoDuration)
        } else {
          clip.end_time = clip.start_time + defaultDuration
        }
      }
      
      return true
    })
    .map(clip => ({
      start_time: Number(clip.start_time.toFixed(3)),
      end_time: Number(clip.end_time.toFixed(3)),
      title: clip.title.slice(0, 100),
      viral_score: Math.min(10, Math.max(1, clip.viral_score || 5)),
      hook_strength: Math.min(10, Math.max(1, clip.hook_strength || 5)),
      hashtags: Array.isArray(clip.hashtags) ? clip.hashtags.slice(0, 10) : [],
      reason: clip.reason || 'Momento interessante identificado',
      topic: clip.topic || 'geral',
      emotions: Array.isArray(clip.emotions) ? clip.emotions : ['interest'],
      best_platforms: Array.isArray(clip.best_platforms) ? clip.best_platforms : ['tiktok', 'instagram'],
      content_category: clip.content_category || 'general'
    }))
    .sort((a, b) => b.viral_score - a.viral_score)
    .slice(0, preferences.clip_count === 'auto' ? 15 : (preferences.clip_count || 10))
}

function generateFallbackClips(duration: number, preferences: any): ClipSuggestion[] {
  const clips: ClipSuggestion[] = []
  const clipDuration = preferences.clip_duration || 30
  const numClips = Math.min(10, Math.floor(duration / (clipDuration + 30)))
  
  for (let i = 0; i < numClips; i++) {
    const startTime = i * (duration / numClips)
    clips.push({
      start_time: Number(startTime.toFixed(3)),
      end_time: Number((startTime + clipDuration).toFixed(3)),
      title: `Momento interessante ${i + 1}`,
      viral_score: 5.0 + Math.random() * 3,
      hook_strength: 5.0 + Math.random() * 3,
      hashtags: ['#conteudo', '#viral', '#video', '#clips'],
      reason: 'Selecionado automaticamente com base na duração',
      topic: 'geral',
      emotions: ['interest'],
      best_platforms: ['tiktok', 'instagram'],
      content_category: 'general'
    })
  }
  
  return clips
}

function detectContentType(text: string): string {
  const patterns = {
    podcast: /podcast|episódio|conversa|entrevista|convidado/i,
    tutorial: /como fazer|passo a passo|tutorial|aprenda|ensinar/i,
    presentation: /apresentação|slides|palestra|conferência/i,
    vlog: /vlog|dia a dia|rotina|lifestyle/i,
    educational: /aula|curso|explicação|conceito|teoria/i
  }
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return type
  }
  
  return 'general'
} 