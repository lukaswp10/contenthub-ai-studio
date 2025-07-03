/**
 * 🎯 SERVIÇO DE SINCRONIZAÇÃO INTELIGENTE DE LEGENDAS - ClipsForge Pro
 * 
 * Sistema avançado que:
 * - ✅ Detecta velocidade de fala automaticamente
 * - ✅ Adapta timing às pausas naturais
 * - ✅ Buffer de sincronização inteligente
 * - ✅ Controles manuais de ajuste
 * - ✅ Smooth scrolling para legendas fluidas
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

export interface SyncConfig {
  // Configurações de timing
  bufferTime: number // Tempo de buffer em segundos (padrão: 0.2s)
  minDisplayTime: number // Tempo mínimo de exibição por palavra (padrão: 0.3s)
  maxDisplayTime: number // Tempo máximo de exibição por palavra (padrão: 2.0s)
  
  // Configurações de agrupamento
  wordsPerCaption: number // Palavras por legenda (padrão: 3-4)
  adaptToSpeechRate: boolean // Adaptar ao ritmo de fala (padrão: true)
  
  // Configurações de detecção
  pauseThreshold: number // Tempo para detectar pausas (padrão: 0.5s)
  speedThreshold: number // Velocidade para detectar fala rápida (padrão: 4 palavras/segundo)
  
  // Configurações de offset
  globalOffset: number // Offset global em ms (padrão: 0)
  adaptiveOffset: boolean // Offset adaptativo (padrão: true)
}

export interface TranscriptionWord {
  text: string
  start: number
  end: number
  confidence: number
  highlight?: boolean
  speaker?: string
}

export interface SyncedCaption {
  id: string
  text: string
  words: TranscriptionWord[]
  start: number
  end: number
  confidence: number
  displayDuration: number
  adaptedTiming: boolean
  speechRate: number // palavras por segundo
}

export interface SpeechAnalysis {
  averageWordDuration: number
  speechRate: number // palavras por segundo
  pauseCount: number
  totalDuration: number
  fastSpeechSegments: number
  slowSpeechSegments: number
  recommendedWordsPerCaption: number
}

export class CaptionSyncService {
  private config: SyncConfig
  private speechAnalysis: SpeechAnalysis | null = null
  
  constructor(config?: Partial<SyncConfig>) {
    this.config = {
      bufferTime: 0.5,
      minDisplayTime: 1.0,
      maxDisplayTime: 3.5,
      wordsPerCaption: 2,
      adaptToSpeechRate: true,
      pauseThreshold: 0.8,
      speedThreshold: 4.0,
      globalOffset: 0,
      adaptiveOffset: true,
      ...config
    }
    
    console.log('🎯 CaptionSyncService inicializado:', this.config)
  }
  
  /**
   * 🧠 Analisar padrões de fala para otimizar sincronização
   */
  analyzeSpeechPatterns(words: TranscriptionWord[]): SpeechAnalysis {
    if (!words.length) {
      return {
        averageWordDuration: 0.5,
        speechRate: 2.0,
        pauseCount: 0,
        totalDuration: 0,
        fastSpeechSegments: 0,
        slowSpeechSegments: 0,
        recommendedWordsPerCaption: 4
      }
    }
    
    const totalDuration = words[words.length - 1].end - words[0].start
    const wordDurations = words.map(w => w.end - w.start)
    const averageWordDuration = wordDurations.reduce((sum, d) => sum + d, 0) / words.length
    const speechRate = words.length / totalDuration
    
    // Detectar pausas
    let pauseCount = 0
    let fastSpeechSegments = 0
    let slowSpeechSegments = 0
    
    for (let i = 1; i < words.length; i++) {
      const gap = words[i].start - words[i - 1].end
      if (gap > this.config.pauseThreshold) {
        pauseCount++
      }
      
      // Analisar velocidade de segmentos de 3 palavras
      if (i >= 2) {
        const segmentStart = words[i - 2].start
        const segmentEnd = words[i].end
        const segmentDuration = segmentEnd - segmentStart
        const segmentRate = 3 / segmentDuration
        
        if (segmentRate > this.config.speedThreshold) {
          fastSpeechSegments++
        } else if (segmentRate < 1.5) {
          slowSpeechSegments++
        }
      }
    }
    
    // Calcular palavras recomendadas por legenda baseado no ritmo
    let recommendedWordsPerCaption = this.config.wordsPerCaption
    
    if (speechRate > 3.5) {
      // Fala rápida - menos palavras por legenda
      recommendedWordsPerCaption = Math.max(1, this.config.wordsPerCaption - 1)
    } else if (speechRate < 1.5) {
      // Fala lenta - manter poucas palavras para melhor legibilidade
      recommendedWordsPerCaption = Math.max(2, this.config.wordsPerCaption)
    } else {
      // Fala normal - usar padrão conservador
      recommendedWordsPerCaption = Math.max(2, this.config.wordsPerCaption)
    }
    
    const analysis: SpeechAnalysis = {
      averageWordDuration,
      speechRate,
      pauseCount,
      totalDuration,
      fastSpeechSegments,
      slowSpeechSegments,
      recommendedWordsPerCaption
    }
    
    this.speechAnalysis = analysis
    
    console.log('🧠 Análise de fala concluída:', {
      speechRate: `${speechRate.toFixed(2)} palavras/segundo`,
      averageWordDuration: `${averageWordDuration.toFixed(2)}s`,
      pauseCount,
      fastSegments: fastSpeechSegments,
      slowSegments: slowSpeechSegments,
      recommendedWords: recommendedWordsPerCaption
    })
    
    return analysis
  }
  
  /**
   * ⚡ Sincronizar legendas com timing inteligente
   */
  syncCaptions(words: TranscriptionWord[], currentTime: number): SyncedCaption | null {
    if (!words.length) return null
    
    // Analisar padrões se ainda não foi feito
    if (!this.speechAnalysis) {
      this.analyzeSpeechPatterns(words)
    }
    
    const analysis = this.speechAnalysis!
    const adjustedTime = currentTime + (this.config.globalOffset / 1000)
    
    // Encontrar palavra atual com buffer inteligente
    const bufferTime = this.config.adaptiveOffset ? 
      this.calculateAdaptiveBuffer(analysis) : 
      this.config.bufferTime
    
    // Buscar palavra atual ou próxima dentro do buffer
    const wordIndex = this.findOptimalWordIndex(words, adjustedTime, bufferTime)
    
    if (wordIndex === -1) return null
    
    // Determinar quantas palavras incluir baseado na análise
    const wordsPerCaption = this.config.adaptToSpeechRate ? 
      analysis.recommendedWordsPerCaption : 
      this.config.wordsPerCaption
    
    // Encontrar limites ótimos para a legenda
    const captionBounds = this.calculateOptimalCaptionBounds(
      words, 
      wordIndex, 
      wordsPerCaption, 
      analysis
    )
    
    const captionWords = words.slice(captionBounds.startIndex, captionBounds.endIndex + 1)
    const text = captionWords.map(w => w.text).join(' ')
    const start = captionWords[0].start
    const end = captionWords[captionWords.length - 1].end
    const confidence = captionWords.reduce((sum, w) => sum + (w.confidence || 0.9), 0) / captionWords.length
    
    // Calcular duração otimizada
    const displayDuration = this.calculateOptimalDisplayDuration(captionWords, analysis)
    
    const syncedCaption: SyncedCaption = {
      id: `caption_${start}_${end}`,
      text,
      words: captionWords,
      start,
      end: Math.max(end, start + displayDuration),
      confidence,
      displayDuration,
      adaptedTiming: this.config.adaptToSpeechRate,
      speechRate: analysis.speechRate
    }
    
    console.log('🎯 Legenda sincronizada:', {
      text: text.substring(0, 30) + '...',
      timing: `${start.toFixed(2)}s - ${syncedCaption.end.toFixed(2)}s`,
      wordsCount: captionWords.length,
      speechRate: `${analysis.speechRate.toFixed(2)} w/s`,
      adaptedTiming: this.config.adaptToSpeechRate
    })
    
    return syncedCaption
  }
  
  /**
   * 🎛️ Ajustar offset global
   */
  adjustGlobalOffset(offsetMs: number): void {
    this.config.globalOffset = offsetMs
    console.log(`🎛️ Offset global ajustado para: ${offsetMs}ms`)
  }
  
  /**
   * ⚙️ Atualizar configuração
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ Configuração atualizada:', newConfig)
  }
  
  /**
   * 📊 Obter estatísticas de sincronização
   */
  getSyncStats(): { analysis: SpeechAnalysis | null, config: SyncConfig } {
    return {
      analysis: this.speechAnalysis,
      config: this.config
    }
  }
  
  // ===== MÉTODOS PRIVADOS =====
  
  private calculateAdaptiveBuffer(analysis: SpeechAnalysis): number {
    // Buffer baseado na velocidade de fala
    if (analysis.speechRate > 3.5) {
      // Fala rápida - buffer menor
      return Math.max(0.1, this.config.bufferTime * 0.7)
    } else if (analysis.speechRate < 1.5) {
      // Fala lenta - buffer maior
      return Math.min(0.5, this.config.bufferTime * 1.5)
    }
    
    return this.config.bufferTime
  }
  
  private findOptimalWordIndex(words: TranscriptionWord[], currentTime: number, bufferTime: number): number {
    // Primeira tentativa: palavra exata
    const exactIndex = words.findIndex(word => 
      currentTime >= word.start && currentTime <= word.end
    )
    
    if (exactIndex !== -1) return exactIndex
    
    // Segunda tentativa: palavra mais próxima dentro do buffer
    let bestIndex = -1
    let bestDistance = Infinity
    
    words.forEach((word, index) => {
      const wordCenter = (word.start + word.end) / 2
      const distance = Math.abs(currentTime - wordCenter)
      
      if (distance <= bufferTime && distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    
    // Terceira tentativa: próxima palavra se estamos entre palavras
    if (bestIndex === -1) {
      const nextWordIndex = words.findIndex(word => word.start > currentTime)
      if (nextWordIndex !== -1 && (words[nextWordIndex].start - currentTime) <= bufferTime) {
        bestIndex = nextWordIndex
      }
    }
    
    return bestIndex
  }
  
  private calculateOptimalCaptionBounds(
    words: TranscriptionWord[], 
    centerIndex: number, 
    targetWordsPerCaption: number,
    analysis: SpeechAnalysis
  ): { startIndex: number, endIndex: number } {
    const totalWords = words.length
    const halfCaption = Math.floor(targetWordsPerCaption / 2)
    
    let startIndex = Math.max(0, centerIndex - halfCaption)
    let endIndex = Math.min(totalWords - 1, startIndex + targetWordsPerCaption - 1)
    
    // Ajustar para evitar quebras no meio de frases
    // Procurar por pausas naturais
    if (analysis.pauseCount > 0) {
      // Tentar expandir até uma pausa natural
      for (let i = endIndex + 1; i < Math.min(totalWords - 1, endIndex + 3); i++) {
        const gap = words[i].start - words[i - 1].end
        if (gap > this.config.pauseThreshold * 0.5) {
          endIndex = i - 1
          break
        }
      }
      
      // Tentar começar depois de uma pausa natural
      for (let i = startIndex - 1; i >= Math.max(0, startIndex - 3); i--) {
        if (i < totalWords - 1) {
          const gap = words[i + 1].start - words[i].end
          if (gap > this.config.pauseThreshold * 0.5) {
            startIndex = i + 1
            break
          }
        }
      }
    }
    
    // Garantir que não ultrapassamos limites
    if (endIndex - startIndex + 1 > targetWordsPerCaption + 2) {
      endIndex = startIndex + targetWordsPerCaption - 1
    }
    
    return { startIndex, endIndex }
  }
  
  private calculateOptimalDisplayDuration(captionWords: TranscriptionWord[], analysis: SpeechAnalysis): number {
    const naturalDuration = captionWords[captionWords.length - 1].end - captionWords[0].start
    const readingTime = captionWords.length * 0.8 // 800ms por palavra para leitura confortável
    
    // Usar o maior entre duração natural e tempo de leitura, com fator de segurança
    const optimalDuration = Math.max(naturalDuration * 1.5, readingTime * 1.2)
    
    // Aplicar limites mínimos e máximos
    return Math.max(
      this.config.minDisplayTime,
      Math.min(this.config.maxDisplayTime, optimalDuration)
    )
  }
}

// ✅ EXPORTAR INSTÂNCIA SINGLETON
export const captionSyncService = new CaptionSyncService() 