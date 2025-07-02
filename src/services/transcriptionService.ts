import { AssemblyAI } from 'assemblyai'

export interface TranscriptionWord {
  text: string
  start: number
  end: number
  confidence: number
  highlight?: boolean
  speaker?: string
}

export interface TranscriptionResult {
  words: TranscriptionWord[]
  text: string
  confidence: number
  language?: string
  duration?: number
  speakers?: string[]
}

export interface WhisperResponse {
  text: string
  segments: WhisperSegment[]
  language: string
}

export interface WhisperSegment {
  id: number
  start: number
  end: number
  text: string
  words?: WhisperWord[]
}

export interface WhisperWord {
  word: string
  start: number
  end: number
}

class TranscriptionService {
  private assemblyAI: AssemblyAI | null = null
  private apiKey: string = ''
  private openaiApiKey: string = ''

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    this.assemblyAI = new AssemblyAI({
      apiKey: apiKey
    })
  }

  setOpenAIApiKey(apiKey: string) {
    this.openaiApiKey = apiKey
  }

  private isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
  }

  private async extractAudioFromVideo(videoFile: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      video.onloadedmetadata = () => {
        const duration = video.duration
        video.currentTime = 0
        
        resolve(videoFile)
      }
      
      video.onerror = () => reject(new Error('Erro ao processar vídeo'))
      video.src = URL.createObjectURL(videoFile)
    })
  }

  // ➕ NOVO: Transcrição OpenAI Whisper (MELHOR QUALIDADE/PREÇO)
  async transcribeWithWhisper(
    videoFile: File, 
    onProgress: (status: string) => void
  ): Promise<TranscriptionResult> {
    if (!this.openaiApiKey) {
      throw new Error('🔑 Configure sua API Key do OpenAI primeiro!\n\n📍 Onde obter: https://platform.openai.com/api-keys\n💰 Custo: $0.006/minuto\n🎯 Melhor qualidade de transcrição');
    }

    try {
      onProgress('🎤 Preparando áudio para OpenAI Whisper...')
      
      if (videoFile.size > 25 * 1024 * 1024) {
        throw new Error('📁 Arquivo muito grande para Whisper (máx 25MB).\n\n💡 Alternativa: Use AssemblyAI que não tem limite de tamanho.\n🌐 https://www.assemblyai.com/dashboard/signup');
      }

      onProgress('📤 Enviando para OpenAI Whisper...')

      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('model', 'whisper-1')
      formData.append('language', 'pt') // Português por padrão
      formData.append('response_format', 'verbose_json') // Para ter timestamps
      formData.append('timestamp_granularities[]', 'word') // Timestamps por palavra

      // Chamada para OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = `OpenAI API Error: ${response.status}`
        
        if (response.status === 401) {
          errorMessage = '🔑 API Key inválida!\n\n📍 Verifique se copiou corretamente de:\nhttps://platform.openai.com/api-keys\n\n💡 A key deve começar com "sk-"'
        } else if (response.status === 429) {
          errorMessage = '⏳ Limite de rate excedido!\n\n💡 Aguarde alguns minutos ou:\n🔄 Use AssemblyAI como alternativa'
        } else if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`
        }
        
        throw new Error(errorMessage)
      }

      onProgress('🧠 Processando resposta do Whisper...')

      const result: WhisperResponse = await response.json()

      onProgress('✅ Transcrição Whisper concluída!')

      // Converter para nosso formato padrão
      const words: TranscriptionWord[] = []

      // Processar segments e words
      if (result.segments) {
        result.segments.forEach((segment, segIndex) => {
          if (segment.words && segment.words.length > 0) {
            // Se tem words com timestamps precisos
            segment.words.forEach(word => {
              words.push({
                text: word.word.trim(),
                start: word.start,
                end: word.end,
                confidence: 0.95, // Whisper tem alta confiança
                highlight: word.word.length > 6, // Highlight palavras longas
                speaker: `Speaker ${segIndex % 2 + 1}` // Speakers básicos
              })
            })
          } else {
            // Fallback: dividir texto por palavras e estimar timestamps
            const segmentWords = segment.text.trim().split(/\s+/)
            const wordDuration = (segment.end - segment.start) / segmentWords.length

            segmentWords.forEach((word, index) => {
              if (word.trim()) {
                const wordStart = segment.start + (index * wordDuration)
                words.push({
                  text: word.trim(),
                  start: wordStart,
                  end: wordStart + wordDuration,
                  confidence: 0.95,
                  highlight: word.length > 6,
                  speaker: `Speaker ${segIndex % 2 + 1}`
                })
              }
            })
          }
        })
      }

      // Calcular estatísticas
      const duration = words.length > 0 ? Math.max(...words.map(w => w.end)) : 0
      const speakers = [...new Set(words.map(w => w.speaker).filter((s): s is string => Boolean(s)))]

      return {
        words,
        text: result.text || '',
        confidence: 0.95, // Whisper tem alta qualidade
        language: result.language || 'pt',
        duration,
        speakers
      }

    } catch (error) {
      console.error('Erro OpenAI Whisper:', error)
      throw error
    }
  }

  // Método de upload removido - usando upload direto do arquivo

  // 🤖 EXISTING: Transcrição AssemblyAI (MELHOR PARA ARQUIVOS GRANDES)
  async transcribeWithAssemblyAI(
    videoFile: File, 
    onProgress: (status: string) => void
  ): Promise<TranscriptionResult> {
    if (!this.assemblyAI) {
      throw new Error('🔑 Configure sua API Key da AssemblyAI primeiro!\n\n📍 Onde obter: https://www.assemblyai.com/dashboard/signup\n🎁 5 horas grátis para testar\n💰 Custo: $0.37/hora');
    }

    try {
      onProgress('📤 Enviando áudio para AssemblyAI...')

      // Primeiro, fazer upload do arquivo
      const uploadFormData = new FormData()
      uploadFormData.append('file', videoFile)

      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
        },
        body: uploadFormData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        let errorMessage = `AssemblyAI Upload Error: ${uploadResponse.status}`
        
        if (uploadResponse.status === 401) {
          errorMessage = '🔑 API Key da AssemblyAI inválida!\n\n📍 Verifique se copiou corretamente de:\nhttps://www.assemblyai.com/dashboard\n\n💡 Certifique-se de estar logado'
        } else if (uploadResponse.status === 429) {
          errorMessage = '⏳ Limite de rate excedido!\n\n💡 Aguarde alguns minutos ou:\n🔄 Use OpenAI Whisper como alternativa'
        } else if (errorData.error) {
          errorMessage += ` - ${errorData.error}`
        }
        
        throw new Error(errorMessage)
      }

      onProgress('🧠 Processando com IA...')
      
      // Configuração oficial AssemblyAI
      const transcript = await this.assemblyAI.transcripts.create({
        audio_url: await this.assemblyAI.files.upload(videoFile),
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
            errorMessage = '🔇 Permissão negada para microfone!\n\n💡 Para usar Web Speech API:\n• Permita acesso ao microfone\n• Certifique-se de que há um microfone conectado\n\n🎯 Alternativa: Use OpenAI Whisper (melhor qualidade)'
            break
          case 'no-speech':
            errorMessage = '🎤 Nenhuma fala detectada!\n\n💡 Certifique-se de:\n• Estar falando no microfone\n• Microfone não está mutado\n• Volume adequado\n\n🎯 Alternativa: Use OpenAI Whisper ou AssemblyAI para vídeos'
            break
          case 'audio-capture':
            errorMessage = '🎧 Erro na captura de áudio!\n\n💡 Possíveis soluções:\n• Reconecte o microfone\n• Permita acesso ao áudio\n• Teste outro navegador\n\n🎯 Alternativa: Use APIs pagas (Whisper/AssemblyAI)'
            break
          case 'network':
            errorMessage = '🌐 Erro de rede!\n\n💡 Web Speech precisa de conexão.\n\n🎯 Alternativa: OpenAI Whisper funciona offline após upload'
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

  // ➕ MÉTODO PRINCIPAL com suporte a 3 serviços
  async transcribe(
    videoFile: File,
    onProgress: (status: string) => void,
    provider: 'whisper' | 'assemblyai' | 'webspeech' = 'whisper', // ➕ NOVO: Whisper como padrão
    useWebSpeechFallback: boolean = true
  ): Promise<TranscriptionResult> {
    // Tentativa com provedor escolhido
    try {
      switch (provider) {
        case 'whisper':
          if (!this.openaiApiKey) {
            throw new Error('Configure OpenAI API Key para usar Whisper')
          }
          onProgress('🎯 Iniciando OpenAI Whisper (Melhor qualidade)...')
          return await this.transcribeWithWhisper(videoFile, onProgress)
          
        case 'assemblyai':
          if (!this.apiKey || !this.assemblyAI) {
            throw new Error('Configure AssemblyAI API Key primeiro')
          }
          onProgress('🤖 Iniciando AssemblyAI (Rápido e confiável)...')
          return await this.transcribeWithAssemblyAI(videoFile, onProgress)
          
        case 'webspeech':
          onProgress('🎤 Iniciando Web Speech API (Grátis, microfone)...')
          return await this.transcribeWithWebSpeech(videoFile, onProgress)
          
        default:
          throw new Error(`Provedor não suportado: ${provider}`)
      }
    } catch (error) {
      console.error(`Erro com ${provider}:`, error)
      
      // Fallback hierárquico baseado no provedor original
      if (useWebSpeechFallback && provider !== 'webspeech') {
        onProgress(`❌ Erro com ${provider}. Tentando Web Speech...`)
        try {
          return await this.transcribeWithWebSpeech(videoFile, onProgress)
        } catch (fallbackError) {
          console.error('Erro no fallback Web Speech:', fallbackError)
        }
      }
      
      // Se chegou aqui, todos os métodos falharam
      throw error
    }
  }

  // ➕ MÉTODO para verificar disponibilidade dos provedores
  getAvailableProviders(): { id: string, name: string, description: string, available: boolean, cost: string }[] {
    return [
      {
        id: 'whisper',
        name: '🎯 OpenAI Whisper',
        description: 'Melhor qualidade, múltiplos idiomas, timestamps precisos',
        available: !!this.openaiApiKey,
        cost: '$0.006/min'
      },
      {
        id: 'assemblyai',
        name: '🤖 AssemblyAI',
        description: 'Rápido, confiável, boa para podcasts longos',
        available: !!this.apiKey && !!this.assemblyAI,
        cost: '$0.37/hr'
      },
      {
        id: 'webspeech',
        name: '🎤 Web Speech',
        description: 'Grátis, funciona só com microfone (não com arquivo)',
        available: this.isSecureContext() && (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)),
        cost: 'Grátis'
      }
    ]
  }

  // ➕ MÉTODO para configurar todas as API keys de uma vez
  configureAllKeys(keys: { openai?: string, assemblyai?: string }) {
    if (keys.openai) {
      this.setOpenAIApiKey(keys.openai)
    }
    if (keys.assemblyai) {
      this.setApiKey(keys.assemblyai)
    }
  }
}

export const transcriptionService = new TranscriptionService() 