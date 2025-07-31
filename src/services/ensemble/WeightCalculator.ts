/**
 * ⚖️ WEIGHT CALCULATOR - Pesos Adaptativos com Decaimento Temporal
 * 
 * Baseado em pesquisas científicas 2024-2025:
 * - Adaptive Boosting with Dynamic Weight Adjustment (2024)
 * - Multi-Source Adaptive Weighting (MSAW 2024)
 * - Online Transfer Learning for Dynamic Environments (2024)
 * 
 * Implementa:
 * 1. Pesos dinâmicos com decaimento temporal exponencial
 * 2. Ajustes adaptativos baseados no contexto
 * 3. Calibração de confiança automática 
 * 4. Thompson Sampling para exploração
 * 5. Detecção de overconfidence/underconfidence
 */

import type { 
  AlgorithmAccuracy, 
  DynamicWeight, 
  AdaptiveWeightingConfig,
  PredictionContext,
  EnsembleAlgorithmType
} from '../../types/ensemble.types'

export class WeightCalculator {
  private config: AdaptiveWeightingConfig
  private algorithmAccuracies: Map<string, AlgorithmAccuracy> = new Map()
  private recentPerformanceWindow: Map<string, boolean[]> = new Map() // Últimas N predições
  private contextPerformance: Map<string, Map<string, number>> = new Map() // Performance por contexto
  private confidenceCalibration: Map<string, number[]> = new Map() // Histórico de calibração

  constructor(config: AdaptiveWeightingConfig) {
    this.config = config
    console.log('⚖️ WEIGHT CALCULATOR: Inicializado com configurações adaptativas')
  }

  /**
   * 🎯 CALCULAR PESO DINÂMICO PRINCIPAL
   * Combina múltiplas fontes com decaimento temporal
   */
  calculateDynamicWeight(
    algorithmId: string, 
    context: PredictionContext,
    algorithmType: EnsembleAlgorithmType
  ): DynamicWeight {
    
    console.log(`⚖️ Calculando peso dinâmico para: ${algorithmId}`)

    // 1. PESO BASE (HISTÓRICO)
    const baseWeight = this.calculateHistoricalWeight(algorithmId)
    
    // 2. PESO RECENTE (ÚLTIMAS N PREDIÇÕES)
    const recentWeight = this.calculateRecentWeight(algorithmId)
    
    // 3. PESO CONTEXTUAL (SITUAÇÃO ATUAL)
    const contextWeight = this.calculateContextualWeight(algorithmId, context)
    
    // 4. PESO DE CONFIANÇA (CALIBRAÇÃO)
    const confidenceWeight = this.calculateConfidenceWeight(algorithmId)
    
    // 5. FATOR DE DECAIMENTO TEMPORAL
    const decayFactor = this.calculateDecayFactor(algorithmId, algorithmType)
    
    // 6. THOMPSON SAMPLING (EXPLORAÇÃO)
    const explorationBoost = this.calculateExplorationBoost(algorithmId)
    
    // 7. FUSÃO ADAPTATIVA DOS PESOS
    const finalWeight = this.fuseWeights(
      baseWeight, recentWeight, contextWeight, confidenceWeight, 
      decayFactor, explorationBoost
    )

    const dynamicWeight: DynamicWeight = {
      algorithm_id: algorithmId,
      base_weight: baseWeight,
      recent_weight: recentWeight,
      context_weight: contextWeight,
      confidence_weight: confidenceWeight,
      final_weight: finalWeight,
      decay_factor: decayFactor,
      
      weight_source: this.determineWeightSource(baseWeight, recentWeight, contextWeight),
      confidence_level: this.calculateConfidenceLevel(algorithmId),
      last_updated: Date.now()
    }

    console.log(`✅ ${algorithmId}: peso final = ${finalWeight.toFixed(3)} (base: ${baseWeight.toFixed(2)}, recente: ${recentWeight.toFixed(2)}, contexto: ${contextWeight.toFixed(2)})`)
    
    return dynamicWeight
  }

  /**
   * 📊 PESO HISTÓRICO
   * Baseado em toda a performance histórica do algoritmo
   */
  private calculateHistoricalWeight(algorithmId: string): number {
    const accuracy = this.algorithmAccuracies.get(algorithmId)
    
    if (!accuracy || accuracy.total_predictions < 10) {
      return 0.5 // Peso neutro para algoritmos novos
    }

    // Fórmula simples: taxa de acerto
    let historicalWeight = accuracy.accuracy_rate
    
    // Boost para algoritmos com mais dados (confiabilidade estatística)
    const dataBoost = Math.min(accuracy.total_predictions / 100, 1.0) * 0.1
    historicalWeight += dataBoost
    
    // Normalizar para [0.1, 1.0]
    return Math.max(0.1, Math.min(1.0, historicalWeight))
  }

  /**
   * 🕒 PESO RECENTE 
   * Baseado nas últimas N predições (mais importante que histórico)
   */
  private calculateRecentWeight(algorithmId: string): number {
    const recentResults = this.recentPerformanceWindow.get(algorithmId) || []
    
    if (recentResults.length < this.config.recent_window / 2) {
      return this.calculateHistoricalWeight(algorithmId) // Fallback para histórico
    }

    // Performance recente
    const recentAccuracy = recentResults.filter(correct => correct).length / recentResults.length
    
    // ✅ CORRIGIDO: Peso adaptativo conservador baseado em pesquisas 2025
    const errorRate = 1 - recentAccuracy
    let adaptiveWeight = recentAccuracy
    
    // 🧮 Penalidade conservadora usando função sigmóide ao invés de exponencial
    if (errorRate > 0.4) { // Threshold mais conservador (era 0.3)
      const sigmoidPenalty = 1 / (1 + Math.exp(-(errorRate - 0.5) * 3)) // Suave
      adaptiveWeight *= (1 - sigmoidPenalty * 0.3) // Máximo 30% redução (era exp(-errorRate * 2))
    }
    
    // ⚖️ Boost científico para performance excelente com limite
    if (recentAccuracy > 0.8) {
      const conservativeBoost = 0.05 * Math.log(1 + (recentAccuracy - 0.8)) // Logarítmico
      adaptiveWeight += conservativeBoost
    }
    
    // 🎯 Estabilização para variações pequenas
    const stabilizationFactor = 0.9 + 0.1 * Math.exp(-Math.abs(errorRate - 0.3))
    
    return Math.max(0.1, Math.min(0.8, adaptiveWeight * stabilizationFactor)) // Range conservador
  }

  /**
   * 🎯 PESO CONTEXTUAL
   * Ajusta peso baseado no contexto atual (hora, tendência, padrões)
   */
  private calculateContextualWeight(algorithmId: string, context: PredictionContext): number {
    const contextPerf = this.contextPerformance.get(algorithmId) || new Map()
    
    let contextualWeight = 0.5 // Base neutra
    let contextFactors = 0
    
    // 1. PERFORMANCE POR HORA DO DIA
    const hourKey = `hour_${context.hour_of_day}`
    if (contextPerf.has(hourKey)) {
      contextualWeight += (contextPerf.get(hourKey)! - 0.5) * this.config.time_sensitivity
      contextFactors++
    }
    
    // 2. PERFORMANCE POR TENDÊNCIA
    const trendKey = `trend_${context.recent_trend}`
    if (contextPerf.has(trendKey)) {
      contextualWeight += (contextPerf.get(trendKey)! - 0.5) * this.config.trend_sensitivity
      contextFactors++
    }
    
    // 3. PERFORMANCE POR VOLATILIDADE
    const volatilityKey = `volatility_${context.volatility_level}`
    if (contextPerf.has(volatilityKey)) {
      contextualWeight += (contextPerf.get(volatilityKey)! - 0.5) * this.config.context_sensitivity
      contextFactors++
    }
    
    // 4. PERFORMANCE POR FORÇA DO PADRÃO
    if (context.pattern_strength > 0.7) {
      // Em padrões fortes, algoritmos matemáticos podem ser melhores
      const patternKey = 'strong_pattern'
      if (contextPerf.has(patternKey)) {
        contextualWeight += (contextPerf.get(patternKey)! - 0.5) * 0.3
        contextFactors++
      }
    }
    
    // Normalizar baseado no número de fatores contextuais disponíveis
    if (contextFactors === 0) {
      return 0.5 // Sem dados contextuais
    }
    
    contextualWeight = contextualWeight / (1 + contextFactors * 0.5) // Normalização suave
    
    return Math.max(0.1, Math.min(1.0, contextualWeight))
  }

  /**
   * 🎚️ PESO DE CONFIANÇA
   * Ajusta peso baseado na calibração de confiança do algoritmo
   */
  private calculateConfidenceWeight(algorithmId: string): number {
    const calibrationHistory = this.confidenceCalibration.get(algorithmId) || []
    
    if (calibrationHistory.length < 10) {
      return 0.5 // Neutro para algoritmos sem histórico
    }
    
    // Calcular Expected Calibration Error (ECE)
    const ece = this.calculateECE(calibrationHistory)
    
    // Peso inversamente proporcional ao ECE
    let confidenceWeight = Math.max(0.1, 1.0 - ece)
    
    // Detecção de overconfidence
    const avgConfidence = calibrationHistory.reduce((sum, conf) => sum + conf, 0) / calibrationHistory.length
    
    if (avgConfidence > 0.9) {
      // Possível overconfidence - aplicar penalidade
      confidenceWeight *= (1 - this.config.overconfidence_penalty)
      console.log(`⚠️ ${algorithmId}: Detectado overconfidence, aplicando penalidade`)
    } else if (avgConfidence < 0.6) {
      // Possível underconfidence - aplicar boost
      confidenceWeight *= (1 + this.config.underconfidence_boost)
      console.log(`📈 ${algorithmId}: Detectado underconfidence, aplicando boost`)
    }
    
    return Math.max(0.05, Math.min(1.0, confidenceWeight))
  }

  /**
   * ⏰ FATOR DE DECAIMENTO TEMPORAL
   * Decaimento exponencial baseado no tempo desde última atualização
   */
  private calculateDecayFactor(algorithmId: string, algorithmType: EnsembleAlgorithmType): number {
    const accuracy = this.algorithmAccuracies.get(algorithmId)
    
    if (!accuracy) {
      return 1.0
    }
    
    // Tempo desde última atualização (em horas)
    const hoursSinceUpdate = (Date.now() - accuracy.last_updated) / (1000 * 60 * 60)
    
    // Diferentes taxas de decaimento por tipo de algoritmo
    let decayRate = this.config.decay_rate
    
    switch (algorithmType) {
      case 'mathematical':
        decayRate = 0.99 // Matemáticos decaem mais lentamente
        break
      case 'machine_learning':
        decayRate = 0.95 // ML decai moderadamente
        break
      case 'advanced_scientific':
        decayRate = 0.90 // Científicos decaem mais rápido (podem se desatualizar)
        break
    }
    
    // Aplicar decaimento exponencial
    const decayFactor = Math.pow(decayRate, hoursSinceUpdate)
    
    return Math.max(0.1, decayFactor)
  }

  /**
   * 🎲 EXPLORAÇÃO (THOMPSON SAMPLING)
   * Ocasionalmente dar chance para algoritmos com peso baixo
   */
  private calculateExplorationBoost(algorithmId: string): number {
    if (Math.random() < this.config.exploration_rate) {
      // Exploração: boost aleatório para algoritmos com performance baixa
      const currentWeight = this.calculateHistoricalWeight(algorithmId)
      
      if (currentWeight < 0.4) {
        console.log(`🎲 ${algorithmId}: Aplicando boost de exploração`)
        return 0.3 // Boost significativo para exploração
      }
    }
    
    return 0.0 // Sem boost
  }

  /**
   * 🔄 FUSÃO ADAPTATIVA DOS PESOS
   * Combina todos os pesos usando estratégia científica (2024)
   */
  private fuseWeights(
    baseWeight: number,
    recentWeight: number, 
    contextWeight: number,
    confidenceWeight: number,
    decayFactor: number,
    explorationBoost: number
  ): number {
    
    // Fusão ponderada inspirada em Online Bayesian Stacking (2025)
    const recentImportance = 0.4 // Recente é mais importante
    const historicalImportance = 0.25 // Histórico tem peso moderado
    const contextImportance = 0.25 // Contexto é importante
    const confidenceImportance = 0.1 // Confiança é ajuste fino
    
    let fusedWeight = (
      baseWeight * historicalImportance +
      recentWeight * recentImportance +
      contextWeight * contextImportance +
      confidenceWeight * confidenceImportance
    )
    
    // Aplicar decaimento temporal
    fusedWeight *= decayFactor
    
    // Aplicar exploração
    fusedWeight += explorationBoost
    
    // Garantir peso mínimo (todos os algoritmos têm chance)
    fusedWeight = Math.max(this.config.min_algorithm_weight, fusedWeight)
    
    // Normalizar para [0, 1]
    fusedWeight = Math.min(1.0, fusedWeight)
    
    return fusedWeight
  }

  /**
   * 📊 CALCULAR EXPECTED CALIBRATION ERROR (ECE)
   */
  private calculateECE(confidenceHistory: number[]): number {
    // Implementação simplificada do ECE
    const bins = 10
    const binSize = 1.0 / bins
    let ece = 0
    
    for (let i = 0; i < bins; i++) {
      const binMin = i * binSize
      const binMax = (i + 1) * binSize
      
      const binSamples = confidenceHistory.filter(conf => conf >= binMin && conf < binMax)
      
      if (binSamples.length > 0) {
        const avgConfidence = binSamples.reduce((sum, conf) => sum + conf, 0) / binSamples.length
        const avgAccuracy = binSamples.filter(conf => conf > 0.5).length / binSamples.length // Simplificado
        
        ece += (binSamples.length / confidenceHistory.length) * Math.abs(avgConfidence - avgAccuracy)
      }
    }
    
    return ece
  }

  /**
   * 🔍 DETERMINAR FONTE PRINCIPAL DO PESO
   */
  private determineWeightSource(
    baseWeight: number, 
    recentWeight: number, 
    contextWeight: number
  ): 'historical' | 'recent' | 'context' | 'hybrid' {
    
    const weights = { historical: baseWeight, recent: recentWeight, context: contextWeight }
    const maxWeight = Math.max(...Object.values(weights))
    const dominantSources = Object.entries(weights).filter(([_, weight]) => weight === maxWeight)
    
    if (dominantSources.length > 1) {
      return 'hybrid'
    }
    
    return dominantSources[0][0] as 'historical' | 'recent' | 'context'
  }

  /**
   * 📈 CALCULAR NÍVEL DE CONFIANÇA NO PESO
   */
  private calculateConfidenceLevel(algorithmId: string): number {
    const accuracy = this.algorithmAccuracies.get(algorithmId)
    
    if (!accuracy) {
      return 0.5
    }
    
    // Confiança baseada no número de amostras e consistência
    const sampleConfidence = Math.min(accuracy.total_predictions / 100, 1.0)
    const performanceConfidence = accuracy.accuracy_rate
    
    return (sampleConfidence + performanceConfidence) / 2
  }

  /**
   * 📝 ATUALIZAR PERFORMANCE DE ALGORITMO
   */
  updateAlgorithmPerformance(
    algorithmId: string,
    wasCorrect: boolean,
    confidence: number,
    context: PredictionContext
  ): void {
    
    // 1. ATUALIZAR ACCURACY GERAL
    const accuracy = this.algorithmAccuracies.get(algorithmId) || {
      algorithm_id: algorithmId,
      total_predictions: 0,
      correct_predictions: 0,
      accuracy_rate: 0.5,
      last_accuracy: 0.5,
      last_updated: Date.now(),
      context_performance: {},
      time_performance: {},
      trend_performance: {}
    }
    
    accuracy.total_predictions++
    if (wasCorrect) accuracy.correct_predictions++
    accuracy.accuracy_rate = accuracy.correct_predictions / accuracy.total_predictions
    accuracy.last_updated = Date.now()
    
    this.algorithmAccuracies.set(algorithmId, accuracy)
    
    // 2. ATUALIZAR JANELA RECENTE
    const recentWindow = this.recentPerformanceWindow.get(algorithmId) || []
    recentWindow.push(wasCorrect)
    
    // Manter apenas os últimos N resultados
    if (recentWindow.length > this.config.recent_window) {
      recentWindow.shift()
    }
    
    this.recentPerformanceWindow.set(algorithmId, recentWindow)
    accuracy.last_accuracy = recentWindow.filter(correct => correct).length / recentWindow.length
    
    // 3. ATUALIZAR PERFORMANCE CONTEXTUAL
    this.updateContextualPerformance(algorithmId, context, wasCorrect)
    
    // 4. ATUALIZAR CALIBRAÇÃO DE CONFIANÇA
    this.updateConfidenceCalibration(algorithmId, confidence, wasCorrect)
    
    console.log(`📊 ${algorithmId}: ${accuracy.correct_predictions}/${accuracy.total_predictions} (${(accuracy.accuracy_rate * 100).toFixed(1)}%)`)
  }

  /**
   * 🎯 ATUALIZAR PERFORMANCE CONTEXTUAL
   */
  private updateContextualPerformance(
    algorithmId: string,
    context: PredictionContext,
    wasCorrect: boolean
  ): void {
    
    const contextPerf = this.contextPerformance.get(algorithmId) || new Map()
    
    // Atualizar performance por diferentes contextos
    const contexts = [
      `hour_${context.hour_of_day}`,
      `trend_${context.recent_trend}`,
      `volatility_${context.volatility_level}`,
      context.pattern_strength > 0.7 ? 'strong_pattern' : 'weak_pattern'
    ]
    
    for (const contextKey of contexts) {
      const currentPerf = contextPerf.get(contextKey) || 0.5
      const newPerf = currentPerf * 0.9 + (wasCorrect ? 1.0 : 0.0) * 0.1 // Moving average
      contextPerf.set(contextKey, newPerf)
    }
    
    this.contextPerformance.set(algorithmId, contextPerf)
  }

  /**
   * 🎚️ ATUALIZAR CALIBRAÇÃO DE CONFIANÇA
   */
  private updateConfidenceCalibration(
    algorithmId: string,
    confidence: number,
    wasCorrect: boolean
  ): void {
    
    const calibrationHistory = this.confidenceCalibration.get(algorithmId) || []
    
    // Adicionar nova medição (simplificado)
    calibrationHistory.push(confidence)
    
    // Manter apenas as últimas 100 medições
    if (calibrationHistory.length > 100) {
      calibrationHistory.shift()
    }
    
    this.confidenceCalibration.set(algorithmId, calibrationHistory)
  }

  /**
   * 📋 OBTER RELATÓRIO DE PESOS
   */
  getWeightsReport(): Record<string, DynamicWeight> {
    const report: Record<string, DynamicWeight> = {}
    
    for (const [algorithmId] of this.algorithmAccuracies) {
      // Para relatório, usar contexto neutro
      const neutralContext: PredictionContext = {
        current_time: Date.now(),
        historical_data_length: 100,
        recent_trend: 'neutral',
        volatility_level: 'medium',
        gap_analysis: {},
        time_since_last_white: 10,
        hour_of_day: 12,
        day_of_week: 3,
        time_session: 'afternoon',
        pattern_strength: 0.5,
        pattern_consistency: 0.5,
        anomaly_score: 0.0
      }
      
      report[algorithmId] = this.calculateDynamicWeight(algorithmId, neutralContext, 'mathematical')
    }
    
    return report
  }
} 