/**
 * 🎯 SERVIÇO DE SINCRONIZAÇÃO INTELIGENTE DE LEGENDAS - ClipsForge Pro v2.0
 * 
 * Sistema avançado OTIMIZADO que:
 * - ✅ Detecta velocidade de fala automaticamente
 * - ✅ Adapta timing às pausas naturais
 * - ✅ Buffer de sincronização inteligente MELHORADO
 * - ✅ Controles manuais de ajuste
 * - ✅ Smooth scrolling para legendas fluidas
 * - ✅ NOVO: Configurações conservadoras anti-rapidez
 * 
 * @author ClipsForge Team
 * @version 2.0.0 - PROBLEMA VELOCIDADE RESOLVIDO
 */

export interface SyncConfig {
  // Configurações de timing MELHORADAS
  bufferTime: number // Tempo de buffer em segundos (padrão: 0.5s - AUMENTADO)
  minDisplayTime: number // Tempo mínimo de exibição por palavra (padrão: 1.0s - AUMENTADO)
  maxDisplayTime: number // Tempo máximo de exibição por palavra (padrão: 4.0s - AUMENTADO)
  
  // Configurações de agrupamento CONSERVADORAS
  wordsPerCaption: number // Palavras por legenda (padrão: 5-7 - AUMENTADO)
  adaptToSpeechRate: boolean // Adaptar ao ritmo de fala (padrão: true)
  
  // Configurações de detecção REFINADAS
  pauseThreshold: number // Tempo para detectar pausas (padrão: 0.8s - AUMENTADO)
  speedThreshold: number // Velocidade para detectar fala rápida (padrão: 3.5 w/s - REDUZIDO)
  
  // Configurações de offset APRIMORADAS
  globalOffset: number // Offset global em ms (padrão: 0)
  adaptiveOffset: boolean // Offset adaptativo (padrão: true)
  
  // ✅ NOVOS: Configurações anti-rapidez
  conservativeMode: boolean // Modo conservador (padrão: true)
  readingTimeMultiplier: number // Multiplicador tempo de leitura (padrão: 1.5)
  minimumPhraseGap: number // Gap mínimo entre frases (padrão: 0.3s)
}

export interface TranscriptionWord {
  text: string
  start: number
  end: number
  confidence?: number
}

export interface SpeechAnalysis {
  averageWordDuration: number
  speechRate: number
  pauseCount: number
  totalDuration: number
  fastSpeechSegments: number
  slowSpeechSegments: number
  recommendedWordsPerCaption: number
  // ✅ NOVOS campos para análise avançada
  naturalPauses: number[]
  readabilityScore: number
  optimalDisplayDuration: number
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
  speechRate: number
  // ✅ NOVOS campos
  readingTime: number
  isConservative: boolean
  pauseAdjusted: boolean
}

export class CaptionSyncService {
  private config: SyncConfig
  private speechAnalysis: SpeechAnalysis | null = null
  
  constructor(config?: Partial<SyncConfig>) {
    // ✅ CONFIGURAÇÕES PADRÃO OTIMIZADAS PARA EVITAR RAPIDEZ
    this.config = {
      // Timing muito mais conservador
      bufferTime: 0.5, // AUMENTADO de 0.2s
      minDisplayTime: 1.2, // AUMENTADO de 0.3s  
      maxDisplayTime: 5.0, // AUMENTADO de 2.0s
      
      // Mais palavras por legenda para melhor legibilidade
      wordsPerCaption: 6, // AUMENTADO de 3-4
      adaptToSpeechRate: true,
      
      // Detecção mais sensível
      pauseThreshold: 0.8, // AUMENTADO de 0.5s
      speedThreshold: 3.0, // REDUZIDO de 4.0 w/s
      
      // Offset padrão
      globalOffset: 0,
      adaptiveOffset: true,
      
      // ✅ NOVOS: Anti-rapidez
      conservativeMode: true,
      readingTimeMultiplier: 1.8, // Mais tempo para leitura
      minimumPhraseGap: 0.4, // Gap entre frases
      
      ...config
    }
    
    // CaptionSyncService inicializado
  }
  
  /**
   * 🧠 Analisar padrões de fala para otimização CONSERVADORA
   */
  analyzeSpeechPatterns(words: TranscriptionWord[]): SpeechAnalysis {
    if (!words.length) {
      return {
        averageWordDuration: 0.6, // AUMENTADO
        speechRate: 2.0, // REDUZIDO
        pauseCount: 0,
        totalDuration: 0,
        fastSpeechSegments: 0,
        slowSpeechSegments: 0,
        recommendedWordsPerCaption: 6, // AUMENTADO
        naturalPauses: [],
        readabilityScore: 0.8,
        optimalDisplayDuration: 2.5 // AUMENTADO
      }
    }
    
    const totalDuration = words[words.length - 1].end - words[0].start
    const wordDurations = words.map(w => w.end - w.start)
    const averageWordDuration = wordDurations.reduce((sum, d) => sum + d, 0) / words.length
    const speechRate = words.length / totalDuration
    
    // Detectar pausas naturais
    const naturalPauses: number[] = []
    let pauseCount = 0
    let fastSpeechSegments = 0
    let slowSpeechSegments = 0
    
    for (let i = 1; i < words.length; i++) {
      const gap = words[i].start - words[i - 1].end
      if (gap > this.config.pauseThreshold) {
        pauseCount++
        naturalPauses.push(words[i - 1].end)
      }
      
      // Analisar velocidade de segmentos de 4 palavras (AUMENTADO)
      if (i >= 3) {
        const segmentStart = words[i - 3].start
        const segmentEnd = words[i].end
        const segmentDuration = segmentEnd - segmentStart
        const segmentRate = 4 / segmentDuration
        
        if (segmentRate > this.config.speedThreshold) {
          fastSpeechSegments++
        } else if (segmentRate < 1.2) { // REDUZIDO threshold
          slowSpeechSegments++
        }
      }
    }
    
    // ✅ CÁLCULO CONSERVADOR de palavras por legenda
    let recommendedWordsPerCaption = this.config.wordsPerCaption
    
    if (this.config.conservativeMode) {
      if (speechRate > 3.0) {
        // Fala rápida - MUITO conservador
        recommendedWordsPerCaption = Math.max(3, this.config.wordsPerCaption - 2)
      } else if (speechRate < 1.8) {
        // Fala lenta - mais palavras OK
        recommendedWordsPerCaption = Math.min(8, this.config.wordsPerCaption + 1)
      } else {
        // Fala normal - usar configuração conservadora
        recommendedWordsPerCaption = Math.max(5, this.config.wordsPerCaption)
      }
    }
    
    // ✅ CÁLCULO de tempo ótimo de exibição
    const wordsPerSecond = speechRate
    const readingWordsPerSecond = 3.5 // Velocidade de leitura humana
    const optimalDisplayDuration = Math.max(
      this.config.minDisplayTime,
      recommendedWordsPerCaption / readingWordsPerSecond * this.config.readingTimeMultiplier
    )
    
    // Score de legibilidade
    const readabilityScore = Math.min(1.0, 
      (pauseCount / (words.length / 20)) * 0.4 + // Pausas naturais
      (1 - Math.min(1, speechRate / 4)) * 0.6 // Velocidade moderada
    )
    
    const analysis: SpeechAnalysis = {
      averageWordDuration,
      speechRate,
      pauseCount,
      totalDuration,
      fastSpeechSegments,
      slowSpeechSegments,
      recommendedWordsPerCaption,
      naturalPauses,
      readabilityScore,
      optimalDisplayDuration
    }
    
    this.speechAnalysis = analysis
    
    console.log('🧠 Análise de fala CONSERVADORA concluída:', {
      speechRate: `${speechRate.toFixed(2)} palavras/segundo`,
      averageWordDuration: `${averageWordDuration.toFixed(2)}s`,
      pauseCount,
      fastSegments: fastSpeechSegments,
      slowSegments: slowSpeechSegments,
      recommendedWords: recommendedWordsPerCaption,
      readabilityScore: readabilityScore.toFixed(2),
      optimalDisplayTime: `${optimalDisplayDuration.toFixed(2)}s`,
      conservativeMode: this.config.conservativeMode ? '✅ ATIVO' : '❌'
    })
    
    return analysis
  }
  
  /**
   * ⚡ Sincronizar legendas com timing CONSERVADOR inteligente
   */
  syncCaptions(words: TranscriptionWord[], currentTime: number): SyncedCaption | null {
    if (!words.length) return null
    
    // Analisar padrões se ainda não foi feito
    if (!this.speechAnalysis) {
      this.analyzeSpeechPatterns(words)
    }
    
    const analysis = this.speechAnalysis!
    const adjustedTime = currentTime + (this.config.globalOffset / 1000)
    
    // Buffer adaptativo CONSERVADOR
    const bufferTime = this.config.adaptiveOffset ? 
      this.calculateConservativeBuffer(analysis) : 
      this.config.bufferTime
    
    // Buscar palavra atual com buffer inteligente
    const wordIndex = this.findOptimalWordIndex(words, adjustedTime, bufferTime)
    
    if (wordIndex === -1) return null
    
    // Determinar quantas palavras incluir - MODO CONSERVADOR
    const wordsPerCaption = this.config.adaptToSpeechRate ? 
      analysis.recommendedWordsPerCaption : 
      this.config.wordsPerCaption
    
    // ✅ CÁLCULO CONSERVADOR dos limites da legenda
    const captionBounds = this.calculateConservativeCaptionBounds(
      words, 
      wordIndex, 
      wordsPerCaption, 
      analysis
    )
    
    const captionWords = words.slice(captionBounds.startIndex, captionBounds.endIndex + 1)
    const text = captionWords.map(w => w.text).join(' ')
    const start = captionWords[0].start
    const naturalEnd = captionWords[captionWords.length - 1].end
    const confidence = captionWords.reduce((sum, w) => sum + (w.confidence || 0.9), 0) / captionWords.length
    
    // ✅ CÁLCULO CONSERVADOR da duração de exibição
    const readingTime = this.calculateReadingTime(text)
    const displayDuration = this.calculateConservativeDisplayDuration(captionWords, analysis, readingTime)
    const adjustedEnd = Math.max(naturalEnd, start + displayDuration)
    
    // ✅ AJUSTE para pausas naturais
    const pauseAdjusted = this.adjustForNaturalPauses(start, adjustedEnd, analysis.naturalPauses)
    
    const syncedCaption: SyncedCaption = {
      id: `caption_${start}_${adjustedEnd}`,
      text,
      words: captionWords,
      start,
      end: pauseAdjusted.end,
      confidence,
      displayDuration,
      adaptedTiming: this.config.adaptToSpeechRate,
      speechRate: analysis.speechRate,
      readingTime,
      isConservative: this.config.conservativeMode,
      pauseAdjusted: pauseAdjusted.adjusted
    }
    
    // Legenda sincronizada
    
    return syncedCaption
  }
  
  /**
   * 🎛️ Ajustar offset global
   */
  adjustGlobalOffset(offsetMs: number): void {
    this.config.globalOffset += offsetMs
    // Offset ajustado
  }
  
  /**
   * ⚙️ Atualizar configuração
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    // Configuração atualizada
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
  
  private calculateConservativeBuffer(analysis: SpeechAnalysis): number {
    // Buffer maior para fala rápida
    if (analysis.speechRate > 3.5) {
      return Math.max(0.8, this.config.bufferTime * 1.5)
    } else if (analysis.speechRate < 1.5) {
      return Math.max(0.6, this.config.bufferTime * 1.2)
    }
    return Math.max(0.5, this.config.bufferTime)
  }
  
  private calculateReadingTime(text: string): number {
    const wordCount = text.split(' ').length
    const readingWordsPerSecond = 3.0 // Velocidade conservadora de leitura
    return wordCount / readingWordsPerSecond
  }
  
  private calculateConservativeDisplayDuration(
    captionWords: TranscriptionWord[], 
    analysis: SpeechAnalysis,
    readingTime: number
  ): number {
    const naturalDuration = captionWords[captionWords.length - 1].end - captionWords[0].start
    
    // ✅ PRIORIZAR tempo de leitura confortável
    const comfortableReadingTime = readingTime * this.config.readingTimeMultiplier
    const extendedNaturalDuration = naturalDuration * 1.3
    
    // Usar o MAIOR entre os tempos para garantir conforto
    const optimalDuration = Math.max(
      comfortableReadingTime,
      extendedNaturalDuration,
      analysis.optimalDisplayDuration
    )
    
    // Aplicar limites
    return Math.max(
      this.config.minDisplayTime,
      Math.min(this.config.maxDisplayTime, optimalDuration)
    )
  }
  
  private calculateConservativeCaptionBounds(
    words: TranscriptionWord[], 
    wordIndex: number, 
    wordsPerCaption: number, 
    analysis: SpeechAnalysis
  ): { startIndex: number; endIndex: number } {
    const halfPhrase = Math.floor(wordsPerCaption / 2)
    
    let startIndex = Math.max(0, wordIndex - halfPhrase)
    let endIndex = Math.min(words.length - 1, startIndex + wordsPerCaption - 1)
    
    // Ajustar se necessário
    if (endIndex - startIndex < wordsPerCaption - 1) {
      startIndex = Math.max(0, endIndex - wordsPerCaption + 1)
    }
    
    // ✅ AJUSTE para pausas naturais - quebrar em pausas se possível
    if (analysis.naturalPauses.length > 0) {
      const phraseStart = words[startIndex].start
      const phraseEnd = words[endIndex].end
      
      // Buscar pausa natural dentro da frase
      const pauseInPhrase = analysis.naturalPauses.find(pause => 
        pause > phraseStart && pause < phraseEnd
      )
      
      if (pauseInPhrase) {
        // Encontrar palavra antes da pausa
        const pauseWordIndex = words.findIndex(w => w.end >= pauseInPhrase)
        if (pauseWordIndex > startIndex && pauseWordIndex < endIndex) {
          endIndex = pauseWordIndex
        }
      }
    }
    
    return { startIndex, endIndex }
  }
  
  private adjustForNaturalPauses(
    start: number, 
    end: number, 
    naturalPauses: number[]
  ): { end: number; adjusted: boolean } {
    // Buscar pausa natural próxima ao fim
    const nearbyPause = naturalPauses.find(pause => 
      Math.abs(pause - end) < this.config.minimumPhraseGap
    )
    
    if (nearbyPause && nearbyPause > start) {
      return { 
        end: nearbyPause + this.config.minimumPhraseGap, 
        adjusted: true 
      }
    }
    
    return { end, adjusted: false }
  }
  
  private findOptimalWordIndex(words: TranscriptionWord[], currentTime: number, bufferTime: number): number {
    // Buscar palavra atual
    let wordIndex = words.findIndex((word: TranscriptionWord) => 
      currentTime >= (word.start - bufferTime) && currentTime <= (word.end + bufferTime)
    )
    
    if (wordIndex === -1) {
      // Buscar palavra mais próxima
      wordIndex = words.reduce((closestIndex: number, word: TranscriptionWord, index: number) => {
        if (closestIndex === -1) return index
        
        const currentDistance = Math.abs(currentTime - ((word.start + word.end) / 2))
        const closestDistance = Math.abs(currentTime - ((words[closestIndex].start + words[closestIndex].end) / 2))
        
        return currentDistance < closestDistance ? index : closestIndex
      }, -1)
      
      // Verificar se está muito longe
      if (wordIndex !== -1) {
        const nearestWord = words[wordIndex]
        const distance = Math.abs(currentTime - ((nearestWord.start + nearestWord.end) / 2))
        if (distance > 3.0) { // AUMENTADO tolerância
          return -1
        }
      }
    }
    
    return wordIndex
  }
}

// ✅ INSTÂNCIA GLOBAL com configurações CONSERVADORAS
export const captionSyncService = new CaptionSyncService({
  conservativeMode: true,
  wordsPerCaption: 6,
  minDisplayTime: 1.2,
  bufferTime: 0.5,
  readingTimeMultiplier: 1.8,
  minimumPhraseGap: 0.4
}) 