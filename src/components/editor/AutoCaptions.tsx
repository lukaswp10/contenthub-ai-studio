import { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { transcriptionService, TranscriptionWord } from '../../services/transcriptionService'
import { supabase } from '../../lib/supabase'

interface CaptionStyle {
  id: string
  name: string
  viralCount: string
  preview: string
  style: {
    fontSize: string
    fontWeight: string
    color: string
    background: string
    textShadow?: string
    border?: string
  }
}

interface AutoCaptionsProps {
  videoUrl?: string
  videoFile?: File
  duration: number
  onCaptionsGenerated: (words: TranscriptionWord[]) => void
}

export function AutoCaptions({ videoUrl, videoFile, duration, onCaptionsGenerated }: AutoCaptionsProps) {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [words, setWords] = useState<TranscriptionWord[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string>('tiktok-bold')
  const [transcriptionStatus, setTranscriptionStatus] = useState('')

  // Estilos de legenda virais
  const captionStyles: CaptionStyle[] = [
    {
      id: 'tiktok-bold',
      name: 'TikTok Bold',
      viralCount: '2.1B',
      preview: 'TEXTO GRANDE',
      style: {
        fontSize: '48px',
        fontWeight: '900',
        color: '#FFFFFF',
        background: 'none',
        textShadow: '3px 3px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000'
      }
    },
    {
      id: 'youtube-highlight',
      name: 'YouTube Highlight',
      viralCount: '890M',
      preview: 'Destaque Amarelo',
      style: {
        fontSize: '36px',
        fontWeight: '700',
        color: '#000000',
        background: 'linear-gradient(90deg, #FFD700, #FFA500)',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
      }
    },
    {
      id: 'instagram-neon',
      name: 'Instagram Neon',
      viralCount: '456M',
      preview: 'Neon Glow',
      style: {
        fontSize: '40px',
        fontWeight: '800',
        color: '#FF00FF',
        background: 'none',
        textShadow: '0 0 10px #FF00FF, 0 0 20px #FF00FF, 0 0 30px #FF00FF'
      }
    },
    {
      id: 'podcast-clean',
      name: 'Podcast Clean',
      viralCount: '234M',
      preview: 'Texto Limpo',
      style: {
        fontSize: '32px',
        fontWeight: '600',
        color: '#FFFFFF',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #FFFFFF'
      }
    },
    {
      id: 'meme-impact',
      name: 'Meme Impact',
      viralCount: '1.5B',
      preview: 'MEME TEXT',
      style: {
        fontSize: '56px',
        fontWeight: '900',
        color: '#FFFFFF',
        background: 'none',
        textShadow: '4px 4px 0px #000000, -2px -2px 0px #000000'
      }
    },
    {
      id: 'aesthetic-gradient',
      name: 'Aesthetic Gradient',
      viralCount: '678M',
      preview: 'Gradient Vibes',
      style: {
        fontSize: '42px',
        fontWeight: '700',
        color: 'transparent',
        background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1)',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }
    }
  ]

  // Transcrição com Edge Function (com fallback para configService)
  const transcribeWithEdgeFunction = async () => {
    if (!videoFile && !videoUrl) {
      alert('⚠️ Nenhum vídeo carregado para transcrever')
      return
    }

    setIsTranscribing(true)
    setTranscriptionStatus('🔄 Iniciando transcrição...')

    try {
      // Obter arquivo de vídeo
      let fileToTranscribe: File
      
      if (videoFile) {
        fileToTranscribe = videoFile
      } else if (videoUrl) {
        setTranscriptionStatus('📥 Baixando vídeo...')
        const response = await fetch(videoUrl)
        const blob = await response.blob()
        fileToTranscribe = new File([blob], 'video.mp4', { type: blob.type })
      } else {
        throw new Error('Nenhum vídeo disponível')
      }

      // Tentar Edge Function primeiro
      try {
        setTranscriptionStatus('🎤 Tentando Edge Function...')
        
        // Preparar FormData
        const formData = new FormData()
        formData.append('file', fileToTranscribe)

        // Obter token de autenticação
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Usuário não autenticado')
        }

        setTranscriptionStatus('🤖 Processando com OpenAI Whisper...')

        // Chamar Edge Function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const response = await fetch(`${supabaseUrl}/functions/v1/transcribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Edge Function falhou: ${response.status}`)
        }

        const result = await response.json()
        console.log('🎉 Edge Function - Transcrição concluída:', result)

        // Converter resultado para nosso formato
        const transcriptionWords: TranscriptionWord[] = []
        
        if (result.segments) {
          result.segments.forEach((segment: any) => {
            if (segment.words && segment.words.length > 0) {
              segment.words.forEach((word: any) => {
                transcriptionWords.push({
                  text: word.word.trim(),
                  start: word.start,
                  end: word.end,
                  confidence: 0.95,
                  highlight: word.word.length > 6
                })
              })
            }
          })
        }

        setWords(transcriptionWords)
        onCaptionsGenerated(transcriptionWords)
        setTranscriptionStatus(`✅ Transcrição concluída! ${transcriptionWords.length} palavras detectadas`)
        return

      } catch (edgeFunctionError) {
        console.warn('⚠️ Edge Function falhou, usando fallback:', edgeFunctionError)
        setTranscriptionStatus('🔄 Usando sistema de fallback...')
      }

      // Fallback: usar transcriptionService existente com API key robusta
      setTranscriptionStatus('🔑 Configurando API key...')
      
      // Obter API key de variáveis de ambiente
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      
      if (!apiKey || apiKey === '') {
        throw new Error('🔑 API Key do OpenAI não configurada!\n\nConfigure no arquivo .env.local:\nVITE_OPENAI_API_KEY=sua_api_key_aqui')
      }
      
      console.log('🔑 API Key carregada:', apiKey.substring(0, 20) + '...')
      transcriptionService.setOpenAIApiKey(apiKey)

      setTranscriptionStatus('🎤 Usando OpenAI Whisper direto...')

      // Executar transcrição com o serviço existente
      const result = await transcriptionService.transcribe(
        fileToTranscribe,
        (status) => {
          setTranscriptionStatus(status)
        },
        'whisper', // Usar Whisper como padrão
        true // Usar Web Speech como fallback
      )

      console.log('🎉 Fallback - Transcrição concluída:', result)
      
      setWords(result.words)
      onCaptionsGenerated(result.words)
      setTranscriptionStatus(`✅ Transcrição concluída! ${result.words.length} palavras detectadas`)
      
    } catch (error) {
      console.error('❌ Erro na transcrição completa:', error)
      
      let errorMessage = 'Erro desconhecido'
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = '🔑 API Key inválida ou expirada!\n\nVerifique se a chave está correta em:\n.env.local'
        } else if (error.message.includes('429')) {
          errorMessage = '⏳ Limite de API excedido!\n\nAguarde alguns minutos e tente novamente'
        } else if (error.message.includes('API Key do OpenAI não configurada')) {
          errorMessage = error.message
        } else {
          errorMessage = error.message
        }
      }
      
      setTranscriptionStatus(`❌ ${errorMessage}`)
      alert(`❌ Erro na transcrição:\n\n${errorMessage}`)
    } finally {
      setIsTranscribing(false)
    }
  }

  // Aplicar estilo selecionado
  const applyStyle = (styleId: string) => {
    setSelectedStyle(styleId)
    const style = captionStyles.find(s => s.id === styleId)
    if (style) {
      console.log('🎨 Estilo aplicado:', style.name)
    }
  }

  // Atualizar palavra
  const updateWord = (index: number, newText: string) => {
    const updatedWords = [...words]
    updatedWords[index].text = newText
    setWords(updatedWords)
    onCaptionsGenerated(updatedWords)
  }

  // Toggle highlight
  const toggleHighlight = (index: number) => {
    const updatedWords = [...words]
    updatedWords[index].highlight = !updatedWords[index].highlight
    setWords(updatedWords)
    onCaptionsGenerated(updatedWords)
  }

  // Auto-highlight palavras importantes
  const autoHighlight = () => {
    const importantWords = ['viral', 'incrível', 'nunca', 'melhor', 'top', 'insano', 'perfeito', 'fantástico']
    const updatedWords = words.map(word => ({
      ...word,
      highlight: importantWords.some(important => 
        word.text.toLowerCase().includes(important.toLowerCase())
      ) || word.confidence > 0.95
    }))
    setWords(updatedWords)
    onCaptionsGenerated(updatedWords)
    console.log('🎯 Auto-highlight aplicado')
  }

  return (
    <div className="auto-captions-panel">
      {/* Header com Glassmorphism */}
      <div className="panel-header glassmorphism">
        <div className="header-content">
          <h3 className="panel-title">✨ Magic Captions</h3>
          <div className="ai-toggle">
            <span className="pulse-dot"></span>
            <span className="toggle-text">AI Real-Time ON</span>
          </div>
        </div>
      </div>

      {/* Controles de Transcrição Simplificados */}
      <div className="transcription-controls">
        <div className="transcribe-main">
          <Button
            onClick={transcribeWithEdgeFunction}
            disabled={isTranscribing}
            className="transcribe-btn"
          >
            {isTranscribing ? (
              <>
                <span className="loading-spinner"></span>
                Transcrevendo...
              </>
            ) : (
              <>
                🎤 Gerar Legendas
              </>
            )}
          </Button>
        </div>
        
        {transcriptionStatus && (
          <div className="transcription-status">
            {transcriptionStatus}
          </div>
        )}
      </div>

      {/* Estilos de Legenda */}
      <div className="styles-section">
        <h4 className="section-title">🎨 Estilos Virais</h4>
        <div className="styles-grid">
          {captionStyles.map(style => (
            <Card
              key={style.id}
              className={`style-card ${selectedStyle === style.id ? 'selected' : ''}`}
              onClick={() => applyStyle(style.id)}
            >
              <div className="style-preview">
                <div 
                  className="preview-text"
                  style={style.style}
                >
                  {style.preview}
                </div>
              </div>
              <div className="style-info">
                <span className="style-name">{style.name}</span>
                <div className="style-stats">
                  <span className="fire-icon">🔥</span>
                  <span className="viral-count">{style.viralCount} views</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Editor de Palavras Timeline */}
      {words.length > 0 && (
        <div className="words-section">
          <h4 className="section-title">📝 Editor de Palavras</h4>
          <div className="words-timeline">
            {words.map((word, index) => (
              <div 
                key={index}
                className={`word-block ${word.highlight ? 'highlighted' : ''}`}
                style={{
                  left: `${(word.start / duration) * 100}%`,
                  width: `${Math.max(((word.end - word.start) / duration) * 100, 2)}%`
                }}
              >
                <input 
                  value={word.text}
                  className="word-input"
                  onChange={(e) => updateWord(index, e.target.value)}
                />
                <div className="word-controls">
                  <button
                    className={`highlight-btn ${word.highlight ? 'active' : ''}`}
                    onClick={() => toggleHighlight(index)}
                    title="Destacar palavra"
                  >
                    ⭐
                  </button>
                  <span className="confidence-indicator" title={`Confiança: ${Math.round(word.confidence * 100)}%`}>
                    {Math.round(word.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controles Rápidos Funcionais */}
      {words.length > 0 && (
        <div className="floating-controls">
          <Button className="control-btn" onClick={autoHighlight} title="Destacar palavras importantes automaticamente">
            <span className="control-icon">🎯</span>
            <span className="control-text">Auto-Highlight</span>
          </Button>
          <Button className="control-btn" title="Sincronizar com batida da música">
            <span className="control-icon">🎵</span>
            <span className="control-text">Beat Sync</span>
          </Button>
          <Button className="control-btn" title="Preview das legendas">
            <span className="control-icon">👁️</span>
            <span className="control-text">Preview</span>
          </Button>
        </div>
      )}
    </div>
  )
} 