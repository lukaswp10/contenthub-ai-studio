import { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { transcriptionService, TranscriptionWord } from '../../services/transcriptionService'

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
  const [apiKey, setApiKey] = useState(() => {
    // Carregar API key salva do localStorage
    return localStorage.getItem('assemblyai_api_key') || ''
  })
  const [showApiKeyInput, setShowApiKeyInput] = useState(() => {
    // Mostrar input apenas se não tiver API key salva
    return !localStorage.getItem('assemblyai_api_key')
  })
  const [transcriptionStatus, setTranscriptionStatus] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(() => {
    return !!localStorage.getItem('assemblyai_api_key')
  })

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

  // Função para salvar API key
  const handleApiKeySave = (key: string) => {
    if (key.trim()) {
      localStorage.setItem('assemblyai_api_key', key.trim())
      setApiKey(key.trim())
      setApiKeySaved(true)
      setShowApiKeyInput(false)
      console.log('🔑 API Key salva com sucesso!')
    }
  }

  // Função para remover API key
  const handleApiKeyRemove = () => {
    localStorage.removeItem('assemblyai_api_key')
    setApiKey('')
    setApiKeySaved(false)
    setShowApiKeyInput(true)
    console.log('🗑️ API Key removida')
  }

  // Auto-salvar quando API key é inserida
  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey)
    if (newKey.length > 10) { // Assumindo que API keys têm pelo menos 10 caracteres
      handleApiKeySave(newKey)
    }
  }

  // Transcrição REAL com APIs
  const transcribeWithRealAPI = async () => {
    if (!videoFile && !videoUrl) {
      alert('⚠️ Nenhum vídeo carregado para transcrever')
      return
    }

    setIsTranscribing(true)
    setTranscriptionStatus('🔄 Iniciando transcrição...')

    try {
      // Configurar API Key se fornecida
      if (apiKey) {
        transcriptionService.setApiKey(apiKey)
      }

      // Obter arquivo de vídeo
      let fileToTranscribe: File
      
      if (videoFile) {
        fileToTranscribe = videoFile
      } else if (videoUrl) {
        // Converter URL em File
        const response = await fetch(videoUrl)
        const blob = await response.blob()
        fileToTranscribe = new File([blob], 'video.mp4', { type: blob.type })
      } else {
        throw new Error('Nenhum vídeo disponível')
      }

      // Executar transcrição real
      const result = await transcriptionService.transcribe(
        fileToTranscribe,
        (status) => {
          setTranscriptionStatus(status)
        },
        'whisper', // Usar Whisper como padrão
        true // Usar Web Speech como fallback
      )

      console.log('🎉 Transcrição real concluída:', result)
      
      setWords(result.words)
      onCaptionsGenerated(result.words)
      setTranscriptionStatus(`✅ Transcrição concluída! ${result.words.length} palavras detectadas`)
      
    } catch (error) {
      console.error('Erro na transcrição:', error)
      setTranscriptionStatus(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
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

      {/* Configuração da API Key */}
      {showApiKeyInput && (
        <div className="api-config">
          <div className="config-header">
            <span className="config-icon">🔑</span>
            <span className="config-title">AssemblyAI API Key (Opcional)</span>
          </div>
          <div className="config-content">
            <input
              type="password"
              placeholder="Cole sua AssemblyAI API Key aqui..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="api-input"
            />
            <div className="config-help">
              <span className="help-text">
                📝 Com API Key: Transcrição profissional AssemblyAI (5h grátis/mês)<br/>
                🆓 Sem API Key: Web Speech API gratuita (funciona no Chrome/Edge)
              </span>
              <a href="https://assemblyai.com" target="_blank" rel="noopener noreferrer" className="help-link">
                → Criar conta grátis AssemblyAI
              </a>
            </div>
            <div className="config-actions">
              <Button
                onClick={() => setShowApiKeyInput(false)}
                className="config-btn secondary"
              >
                Usar Web Speech (Grátis)
              </Button>
              <Button
                onClick={() => {
                  if (apiKey) {
                    // Salvar API key no localStorage
                    handleApiKeySave(apiKey)
                  }
                }}
                disabled={!apiKey}
                className="config-btn primary"
              >
                💾 Salvar & Usar AssemblyAI
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controles de Transcrição */}
      <div className="transcription-controls">
        <div className="transcribe-main">
          <Button
            onClick={transcribeWithRealAPI}
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
                🎤 Gerar Legendas (API Real)
              </>
            )}
          </Button>
          
          {!showApiKeyInput && apiKeySaved && (
            <Button
              onClick={handleApiKeyRemove}
              className="config-btn secondary small"
              title="Editar/Remover API Key"
            >
              🔑 Editar API Key
            </Button>
          )}
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