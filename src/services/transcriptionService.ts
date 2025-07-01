import { AssemblyAI } from 'assemblyai'

export interface TranscriptionWord {
  text: string
  start: number
  end: number
  confidence: number
  highlight?: boolean
}

export interface TranscriptionResult {
  words: TranscriptionWord[]
  text: string
  confidence: number
}

class TranscriptionService {
  private assemblyAI: AssemblyAI | null = null
  private apiKey: string = ''

  // Configurar API Key (seguindo docs oficiais)
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    this.assemblyAI = new AssemblyAI({
      apiKey: apiKey
    })
  }

  // Verificar se está em contexto seguro (requisito W3C)
  private isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
  }

  // Método de upload removido - usando upload direto do arquivo

  // Transcrição AssemblyAI com configurações oficiais (seguindo docs)
  async transcribeWithAssemblyAI(
    videoFile: File, 
    onProgress: (status: string) => void
  ): Promise<TranscriptionResult> {
    if (!this.assemblyAI) {
      throw new Error('Configure sua API Key do AssemblyAI primeiro')
    }

    try {
      onProgress('📤 Enviando vídeo para AssemblyAI...')
      
      // Upload direto do arquivo de vídeo (AssemblyAI suporta vídeo)
      // Seguindo documentação oficial: https://www.assemblyai.com/docs
      const audioUrl = await this.assemblyAI.files.upload(videoFile)
      
      onProgress('🧠 Processando com IA...')
      
      // Configuração oficial AssemblyAI
      const transcript = await this.assemblyAI.transcripts.create({
        audio_url: audioUrl,
        language_detection: true,
        speaker_labels: true,
        auto_highlights: true,
        word_boost: ['viral', 'incrível', 'nunca', 'melhor', 'top', 'insano', 'perfeito'],
        punctuate: true,
        format_text: true,
        dual_channel: false,
        webhook_url: undefined, // Não usar webhook para simplicidade
        boost_param: 'high', // Melhor qualidade
        redact_pii: false,
        redact_pii_audio: false,
        redact_pii_policies: undefined,
        redact_pii_sub: undefined
      })

      onProgress('⏳ Aguardando processamento...')
      
      // Polling oficial (seguindo docs)
      let result = transcript
      let attempts = 0
      const maxAttempts = 150 // 5 minutos máximo
      
      while ((result.status === 'processing' || result.status === 'queued') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        result = await this.assemblyAI.transcripts.get(transcript.id)
        onProgress(`🔄 Processando... (${result.status}) - ${attempts + 1}/${maxAttempts}`)
        attempts++
      }

      if (result.status === 'error') {
        throw new Error(`Erro AssemblyAI: ${result.error}`)
      }

      if (result.status !== 'completed') {
        throw new Error('Timeout no processamento AssemblyAI')
      }

      onProgress('✅ Transcrição AssemblyAI concluída!')

      // Converter para nosso formato
      const words: TranscriptionWord[] = result.words?.map(word => ({
        text: word.text,
        start: word.start / 1000, // AssemblyAI usa millisegundos
        end: word.end / 1000,
        confidence: word.confidence,
        highlight: word.confidence > 0.95 // Auto-highlight alta confiança
      })) || []

      return {
        words,
        text: result.text || '',
        confidence: result.confidence || 0
      }

    } catch (error) {
      console.error('Erro AssemblyAI:', error)
      throw error
    }
  }

  // Web Speech API simplificada (sem problemas de CSP)
  async transcribeWithWebSpeech(
    _videoFile: File, // Não usado nesta implementação
    onProgress: (status: string) => void
  ): Promise<TranscriptionResult> {
    // Verificar contexto seguro (requisito W3C)
    if (!this.isSecureContext()) {
      throw new Error('Web Speech API requer HTTPS ou localhost')
    }

    // Verificar suporte (especificação W3C)
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Web Speech API não suportada neste navegador. Use Chrome ou Edge.')
    }

    return new Promise((resolve, reject) => {
      onProgress('🎤 Iniciando Web Speech API...')

      // Configuração oficial W3C
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      // Configurações seguindo especificação W3C
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'pt-BR'
      recognition.maxAlternatives = 3

      let finalTranscript = ''
      let words: TranscriptionWord[] = []
      let startTime = 0

      recognition.onstart = () => {
        onProgress('🎤 Web Speech ativo - fale no microfone...')
        startTime = Date.now()
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript
          const confidence = result[0].confidence || 0.8
          
          if (result.isFinal) {
            finalTranscript += transcript + ' '
            
            // Calcular timestamps baseados no tempo decorrido
            const currentTime = (Date.now() - startTime) / 1000
            const wordsArray = transcript.trim().split(' ')
            const wordDuration = 0.6 // Duração média por palavra
            
            wordsArray.forEach((word: string, index: number) => {
              if (word.trim()) {
                const wordStart = Math.max(0, currentTime - (wordsArray.length * wordDuration) + (index * wordDuration))
                words.push({
                  text: word.trim(),
                  start: wordStart,
                  end: wordStart + wordDuration,
                  confidence: confidence,
                  highlight: confidence > 0.9 || word.length > 6 // Highlight palavras longas ou alta confiança
                })
              }
            })
          } else {
            interimTranscript += transcript
          }
        }
        
        const displayText = interimTranscript || finalTranscript.slice(-50)
        onProgress(`🎤 Transcrevendo: "${displayText}..."`)
      }

      recognition.onerror = (event: any) => {
        let errorMessage = 'Erro no reconhecimento de voz'
        
        // Mensagens de erro específicas (seguindo spec W3C)
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Permissão negada para microfone'
            break
          case 'no-speech':
            errorMessage = 'Nenhuma fala detectada'
            break
          case 'audio-capture':
            errorMessage = 'Erro na captura de áudio'
            break
          case 'network':
            errorMessage = 'Erro de rede'
            break
          case 'service-not-allowed':
            errorMessage = 'Serviço não permitido'
            break
          default:
            errorMessage = `Erro Web Speech: ${event.error}`
        }
        
        reject(new Error(errorMessage))
      }

      recognition.onend = () => {
        onProgress('✅ Web Speech API concluída!')
        resolve({
          words,
          text: finalTranscript.trim(),
          confidence: 0.8
        })
      }

      // Iniciar reconhecimento direto do microfone
      recognition.start()
      
      // Auto-parar após 30 segundos
      setTimeout(() => {
        recognition.stop()
      }, 30000)
    })
  }

  // Método principal com fallback inteligente
  async transcribe(
    videoFile: File,
    onProgress: (status: string) => void,
    useWebSpeechFallback: boolean = true
  ): Promise<TranscriptionResult> {
    try {
      // Priorizar AssemblyAI se tiver API key
      if (this.apiKey && this.assemblyAI) {
        onProgress('🚀 Usando AssemblyAI (Qualidade Profissional)')
        return await this.transcribeWithAssemblyAI(videoFile, onProgress)
      }
      
      // Fallback para Web Speech se permitido
      if (useWebSpeechFallback) {
        onProgress('🆓 Usando Web Speech API (Gratuito)')
        return await this.transcribeWithWebSpeech(videoFile, onProgress)
      }
      
      throw new Error('Nenhum método de transcrição configurado')
      
    } catch (error) {
      // Fallback inteligente se AssemblyAI falhar
      if (useWebSpeechFallback && this.apiKey) {
        onProgress('⚠️ AssemblyAI falhou, tentando Web Speech...')
        return await this.transcribeWithWebSpeech(videoFile, onProgress)
      }
      throw error
    }
  }
}

export const transcriptionService = new TranscriptionService() 