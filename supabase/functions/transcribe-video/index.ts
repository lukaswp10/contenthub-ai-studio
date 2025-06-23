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

    console.log(`Audio URL for transcription: ${cloudinary_url}`)

    // Call Hugging Face Whisper API (MORE RELIABLE)
    const huggingFaceResponse = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('HUGGINGFACE_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: cloudinary_url,
        parameters: {
          return_timestamps: true
        }
      })
    })

    if (!huggingFaceResponse.ok) {
      const errorText = await huggingFaceResponse.text()
      console.error('Hugging Face API error:', errorText)
      throw new Error(`Hugging Face API error: ${errorText}`)
    }

    const whisperOutput = await huggingFaceResponse.json() as WhisperResponse
    console.log('Transcription completed successfully')

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
    
    // Capturar detalhes do erro para melhor diagnóstico
    let errorMessage = 'Erro na transcrição do vídeo'
    let errorDetails = ''
    let errorCode = 'UNKNOWN_ERROR'
    
    if (error.message) {
      errorMessage = error.message
    }
    
    // Identificar tipos específicos de erro
    if (error.message?.includes('Hugging Face API error')) {
      errorCode = 'HUGGINGFACE_API_ERROR'
      if (error.message.includes('402')) {
        errorMessage = 'Erro de cobrança na API de transcrição'
        errorDetails = 'É necessário configurar um método de pagamento na conta Hugging Face'
      } else if (error.message.includes('401')) {
        errorMessage = 'Erro de autenticação na API de transcrição'
        errorDetails = 'Token de API inválido ou expirado'
      } else if (error.message.includes('429')) {
        errorMessage = 'Limite de requisições excedido'
        errorDetails = 'Muitas requisições simultâneas. Tente novamente em alguns minutos'
      } else if (error.message.includes('500')) {
        errorMessage = 'Erro interno do servidor de transcrição'
        errorDetails = 'Problema temporário no serviço. Tente novamente'
      }
    } else if (error.message?.includes('Timeout')) {
      errorCode = 'TIMEOUT_ERROR'
      errorMessage = 'Transcrição demorou muito tempo'
      errorDetails = 'O processo de transcrição excedeu o tempo limite'
    } else if (error.message?.includes('Vídeo não encontrado')) {
      errorCode = 'VIDEO_NOT_FOUND'
      errorMessage = 'Vídeo não encontrado no banco de dados'
      errorDetails = 'O vídeo pode ter sido removido ou não existe'
    } else if (error.message?.includes('Não autenticado')) {
      errorCode = 'AUTH_ERROR'
      errorMessage = 'Usuário não autenticado'
      errorDetails = 'Sessão expirada. Faça login novamente'
    }
    
    // Log detalhado do erro
    console.error('Erro detalhado na transcrição:', {
      errorCode,
      errorMessage,
      errorDetails,
      originalError: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    // Update video status to failed with detailed error
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
          error_message: errorMessage,
          error_details: { 
            step: 'transcription',
            error_code: errorCode,
            error_message: errorMessage,
            error_details: errorDetails,
            original_error: error.message,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', video_id)
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      details: errorDetails,
      code: errorCode
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

  const maxScore = Math.max(scores.pt, scores.en, scores.es)
  if (maxScore === scores.pt) return 'pt'
  if (maxScore === scores.en) return 'en'
  return 'es'
}

function calculateAverageConfidence(segments: WhisperSegment[]): number {
  if (segments.length === 0) return 0
  
  const avgLogprob = segments.reduce((sum, seg) => sum + (seg.avg_logprob || -1), 0) / segments.length
  // Convert log probability to percentage (rough approximation)
  return Math.max(0, Math.min(100, (1 + avgLogprob) * 50))
} 