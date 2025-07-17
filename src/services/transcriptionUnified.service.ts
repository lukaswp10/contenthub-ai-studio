import { supabase } from '../lib/supabase'
import { TranscriptionWord } from './transcriptionService'

// ===== TYPES =====
interface TranscriptionResult {
  text: string
  words: TranscriptionWord[]
  confidence: number
  language: string
  duration: number
  segments?: any[]
}

interface TranscriptionConfig {
  environment: 'development' | 'production'
  primaryMethod: 'edge-function' | 'direct-openai' | 'local-env'
  fallbackMethod: 'edge-function' | 'direct-openai' | 'local-env'
  debug: boolean
}

// ===== UNIFIED TRANSCRIPTION SERVICE =====
export class TranscriptionUnifiedService {
  private config: TranscriptionConfig
  private openaiApiKey: string | null = null

  constructor() {
    this.config = this.detectEnvironment()
    this.logConfig()
  }

  /**
   * 🎯 DETECÇÃO AUTOMÁTICA DE AMBIENTE
   */
  private detectEnvironment(): TranscriptionConfig {
    const isProduction = import.meta.env.MODE === 'production'
    
    console.log('🔍 DETECÇÃO DE AMBIENTE:', {
      mode: import.meta.env.MODE,
      isProduction,
      strategy: 'Edge Function First'
    })

    // ESTRATÉGIA UNIVERSAL: Edge Function primeiro, sempre
    // Isso garante que outros developers só precisem fazer git pull
    return {
      environment: isProduction ? 'production' : 'development',
      primaryMethod: 'edge-function',
      fallbackMethod: 'direct-openai',
      debug: true
    }
  }

  /**
   * 🎯 MÉTODO PRINCIPAL DE TRANSCRIÇÃO
   */
  async transcribe(
    videoFile: File,
    onProgress?: (status: string) => void
  ): Promise<TranscriptionResult> {
    console.log('🚀 INICIANDO TRANSCRIÇÃO UNIFICADA')
    console.log('📋 Configuração:', this.config)

    try {
      // Tentar método principal
      onProgress?.(`🎯 Usando ${this.config.primaryMethod}...`)
      const result = await this.executeTranscription(this.config.primaryMethod, videoFile, onProgress)
      
      console.log('✅ Método principal funcionou:', this.config.primaryMethod)
      return result

    } catch (primaryError) {
      console.warn('⚠️ Método principal falhou:', primaryError)
      
      try {
        // Tentar método fallback
        onProgress?.(`🔄 Tentando fallback: ${this.config.fallbackMethod}...`)
        const result = await this.executeTranscription(this.config.fallbackMethod, videoFile, onProgress)
        
        console.log('✅ Método fallback funcionou:', this.config.fallbackMethod)
        return result

      } catch (fallbackError) {
        console.error('❌ Todos os métodos falharam:', { primaryError, fallbackError })
        
        // Criar erro detalhado
        const errorMessage = this.createDetailedError(primaryError, fallbackError)
        throw new Error(errorMessage)
      }
    }
  }

  /**
   * 🔧 EXECUTAR TRANSCRIÇÃO POR MÉTODO
   */
  private async executeTranscription(
    method: 'edge-function' | 'direct-openai' | 'local-env',
    videoFile: File,
    onProgress?: (status: string) => void
  ): Promise<TranscriptionResult> {
    
    switch (method) {
      case 'edge-function':
        return await this.transcribeWithEdgeFunction(videoFile, onProgress)
      
      case 'direct-openai':
        return await this.transcribeWithDirectOpenAI(videoFile, onProgress)
      
      case 'local-env':
        return await this.transcribeWithLocalEnv(videoFile, onProgress)
      
      default:
        throw new Error(`Método não suportado: ${method}`)
    }
  }

  /**
   * 🌐 TRANSCRIÇÃO VIA EDGE FUNCTION
   */
  private async transcribeWithEdgeFunction(
    videoFile: File,
    onProgress?: (status: string) => void
  ): Promise<TranscriptionResult> {
    console.log('🌐 Usando Edge Function Supabase...')
    onProgress?.('🌐 Conectando com Edge Function...')

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Usuário não autenticado para Edge Function')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL não configurada')
    }

    // Preparar FormData
    const formData = new FormData()
    formData.append('video', videoFile)

    onProgress?.('📡 Enviando para Edge Function...')

    const response = await fetch(`${supabaseUrl}/functions/v1/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function falhou: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Edge Function - Transcrição concluída:', result)

    // Converter para formato padrão
    return this.convertToStandardFormat(result)
  }

  /**
   * 🔑 TRANSCRIÇÃO VIA OPENAI DIRETO
   */
  private async transcribeWithDirectOpenAI(
    videoFile: File,
    onProgress?: (status: string) => void
  ): Promise<TranscriptionResult> {
    console.log('🔑 Usando OpenAI Whisper direto...')
    onProgress?.('🔑 Conectando com OpenAI...')

    // Buscar API key de múltiplas fontes
    const apiKey = this.getOpenAIApiKey()
    if (!apiKey) {
      throw new Error('OpenAI API Key não disponível')
    }

    console.log('🔍 API Key encontrada:', {
      length: apiKey.length,
      starts: apiKey.substring(0, 10) + '...',
      ends: '...' + apiKey.substring(apiKey.length - 10)
    })

    // Preparar FormData
    const formData = new FormData()
    formData.append('file', videoFile)
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')

    onProgress?.('🎤 Processando com Whisper...')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      
      if (response.status === 401) {
        throw new Error('🔑 API Key inválida ou expirada!')
      } else if (response.status === 429) {
        throw new Error('⏳ Limite de API excedido! Aguarde alguns minutos.')
      } else {
        throw new Error(`OpenAI API falhou: ${response.status} - ${errorText}`)
      }
    }

    const result = await response.json()
    console.log('✅ OpenAI - Transcrição concluída:', result)

    return this.convertToStandardFormat(result)
  }

  /**
   * 📁 TRANSCRIÇÃO VIA ENV LOCAL
   */
  private async transcribeWithLocalEnv(
    videoFile: File,
    onProgress?: (status: string) => void
  ): Promise<TranscriptionResult> {
    console.log('📁 Usando .env.local...')
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('VITE_OPENAI_API_KEY não configurada no .env.local')
    }

    // Usar mesma lógica do OpenAI direto
    this.openaiApiKey = apiKey
    return await this.transcribeWithDirectOpenAI(videoFile, onProgress)
  }

  /**
   * 🔍 OBTER API KEY DE MÚLTIPLAS FONTES
   */
  private getOpenAIApiKey(): string | null {
    // Prioridade: service interno > env local > fallback
    return this.openaiApiKey || 
           import.meta.env.VITE_OPENAI_API_KEY || 
           null
  }

  /**
   * 🔄 CONVERTER PARA FORMATO PADRÃO
   */
  private convertToStandardFormat(result: any): TranscriptionResult {
    const words: TranscriptionWord[] = []
    
    if (result.words) {
      // Formato OpenAI Whisper
      result.words.forEach((word: any) => {
        words.push({
          text: word.word?.trim() || word.text?.trim() || '',
          start: word.start || 0,
          end: word.end || 0,
          confidence: 0.95,
          highlight: (word.word?.length || word.text?.length || 0) > 6
        })
      })
    } else if (result.segments) {
      // Formato Edge Function
      result.segments.forEach((segment: any) => {
        if (segment.words) {
          segment.words.forEach((word: any) => {
            words.push({
              text: word.word?.trim() || word.text?.trim() || '',
              start: word.start || 0,
              end: word.end || 0,
              confidence: 0.95,
              highlight: (word.word?.length || word.text?.length || 0) > 6
            })
          })
        }
      })
    }

    return {
      text: result.text || '',
      words,
      confidence: result.confidence || 0.95,
      language: result.language || 'pt',
      duration: words.length > 0 ? Math.max(...words.map(w => w.end)) : 0,
      segments: result.segments || []
    }
  }

  /**
   * 🚨 CRIAR ERRO DETALHADO
   */
  private createDetailedError(primaryError: any, fallbackError: any): string {
    const env = this.config.environment
    const primary = this.config.primaryMethod
    const fallback = this.config.fallbackMethod

    let message = `🚨 FALHA COMPLETA NA TRANSCRIÇÃO (${env})\n\n`
    
    message += `❌ Método Principal (${primary}):\n${primaryError.message}\n\n`
    message += `❌ Método Fallback (${fallback}):\n${fallbackError.message}\n\n`
    
    message += `💡 SOLUÇÕES:\n`
    
    if (env === 'production') {
      message += `• Configurar VITE_OPENAI_API_KEY no Vercel\n`
      message += `• Verificar Edge Function no Supabase\n`
      message += `• Verificar autenticação do usuário\n`
    } else {
      message += `• Verificar arquivo .env.local\n`
      message += `• Reiniciar servidor de desenvolvimento\n`
      message += `• Verificar conexão com internet\n`
    }

    return message
  }

  /**
   * 📊 LOG DE CONFIGURAÇÃO
   */
  private logConfig(): void {
    console.log('🎯 TRANSCRIPTION UNIFIED SERVICE INICIALIZADO')
    console.log('📋 Configuração:', this.config)
    console.log('🔧 Variáveis disponíveis:', {
      hasViteApiKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      environment: import.meta.env.MODE
    })
  }
}

// ===== EXPORT SINGLETON =====
export const transcriptionUnifiedService = new TranscriptionUnifiedService() 