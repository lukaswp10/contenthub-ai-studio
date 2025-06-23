import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscribeRequest {
  video_id: string
  cloudinary_url: string
  cloudinary_public_id: string
  language?: string
  webhook_url?: string
}

interface WhisperSegment {
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
  speaker?: string
}

interface WhisperResponse {
  text: string
  segments: WhisperSegment[]
  language: string
  duration: number
  words?: Array<{
    word: string
    start: number
    end: number
    probability: number
  }>
  speakers?: Array<{
    speaker: string
    segments: number[]
  }>
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

    const { video_id, cloudinary_url, language = 'auto' }: TranscribeRequest = await req.json()

    console.log(`Starting transcription for video ${video_id}`)

    // Verify video ownership
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', video_id)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) throw new Error('Vídeo não encontrado')

    // Update status
    await supabase
      .from('videos')
      .update({ 
        processing_status: 'transcribing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', video_id)

    // Get direct MP3 URL from Cloudinary for better Whisper compatibility
    const audioUrl = cloudinary_url.replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.mp3')
      .replace('/upload/', '/upload/f_mp3,ac_mono,ar_16000/')

    console.log(`Audio URL for transcription: ${audioUrl}`)

    // Call Replicate Whisper API (REAL)
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
        input: {
          audio: audioUrl,
          task: "transcribe",
          batch_size: 64,
          timestamp: "word", // Get word-level timestamps
          diarization: true, // Enable speaker diarization
          language: language === 'auto' ? null : language,
          // Advanced options for better quality
          condition_on_previous_text: true,
          temperature_increment_on_fallback: 0.2,
          compression_ratio_threshold: 2.4,
          logprob_threshold: -1.0,
          no_speech_threshold: 0.6
        },
        webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/transcription-webhook`,
        webhook_events_filter: ["completed", "failed"]
      })
    })

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text()
      console.error('Replicate API error:', errorText)
      throw new Error(`Replicate API error: ${errorText}`)
    }

    const prediction = await replicateResponse.json()
    console.log('Prediction created:', prediction.id)

    // Poll for completion (with exponential backoff)
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max
    let delay = 2000 // Start with 2 seconds
    let result = prediction

    while (result.status === 'starting' || result.status === 'processing') {
      if (attempts >= maxAttempts) {
        throw new Error('Timeout na transcrição - processo demorou mais de 5 minutos')
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Exponential backoff: increase delay up to 10 seconds
      delay = Math.min(delay * 1.2, 10000)
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`
        }
      })

      if (!statusResponse.ok) {
        console.error('Error checking prediction status')
        throw new Error('Erro ao verificar status da transcrição')
      }

      result = await statusResponse.json()
      attempts++
      
      console.log(`Attempt ${attempts}: Status = ${result.status}, Progress = ${result.logs || 'N/A'}`)
    }

    if (result.status === 'failed') {
      console.error('Transcription failed:', result.error)
      throw new Error(`Transcrição falhou: ${result.error}`)
    }

    if (result.status !== 'succeeded') {
      throw new Error(`Status inesperado: ${result.status}`)
    }

    // Parse Whisper output
    const whisperOutput = result.output as WhisperResponse
    
    // Process transcription data
    const transcriptionData = {
      text: whisperOutput.text,
      segments: whisperOutput.segments || [],
      language: whisperOutput.language || detectLanguage(whisperOutput.text),
      words: whisperOutput.words || [],
      speakers: whisperOutput.speakers || [],
      // Additional metadata
      duration: whisperOutput.duration || video.duration_seconds,
      confidence: calculateAverageConfidence(whisperOutput.segments),
      speakers_count: whisperOutput.speakers?.length || 1
    }

    console.log(`Transcription completed: ${transcriptionData.text.length} characters, ${transcriptionData.segments.length} segments`)

    // Save transcription
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        transcription: transcriptionData,
        transcription_language: transcriptionData.language,
        speakers_detected: transcriptionData.speakers_count,
        processing_status: 'analyzing',
        duration_seconds: transcriptionData.duration
      })
      .eq('id', video_id)

    if (updateError) throw updateError

    // Trigger next step: content analysis
    const analyzeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-content`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        video_id,
        transcription: transcriptionData
      })
    })

    if (!analyzeResponse.ok) {
      console.error('Failed to trigger content analysis')
    }

    return new Response(JSON.stringify({
      success: true,
      video_id,
      transcription: {
        text: transcriptionData.text,
        language: transcriptionData.language,
        segments_count: transcriptionData.segments.length,
        duration: transcriptionData.duration,
        confidence: transcriptionData.confidence
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Transcription error:', error)
    
    // Update video status to failed
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
          error_message: error.message,
          error_details: { 
            step: 'transcription',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', video_id)
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper functions
function detectLanguage(text: string): string {
  // Simple language detection based on common patterns
  const patterns = {
    pt: /\b(que|não|para|com|uma|por|mais|como|mas|foi|sua|são|tem|está|pode|fazer|sobre|depois|muito|também|quando|já|até|isso|ele|ela|você|nós|eles)\b/gi,
    en: /\b(the|be|to|of|and|a|in|that|have|I|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their)\b/gi,
    es: /\b(que|de|no|a|la|el|es|y|en|lo|un|por|qué|me|una|te|los|se|con|para|mi|está|si|bien|pero|yo|eso|las|sí|su|tu|aquí|del|al|como|más|esto|ya|todo|esta|vamos|muy|hay|ahora)\b/gi
  }

  const scores = {
    pt: (text.match(patterns.pt) || []).length,
    en: (text.match(patterns.en) || []).length,
    es: (text.match(patterns.es) || []).length
  }

  return Object.entries(scores).reduce((a, b) => scores[a as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b[0]) as string
}

function calculateAverageConfidence(segments: WhisperSegment[]): number {
  if (segments.length === 0) return 0
  
  const avgLogprob = segments.reduce((sum, seg) => sum + (seg.avg_logprob || -1), 0) / segments.length
  // Convert log probability to percentage (rough approximation)
  return Math.max(0, Math.min(100, (1 + avgLogprob) * 50))
} 