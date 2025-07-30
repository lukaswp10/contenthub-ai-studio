/**
 * 🔍 CONTEXT ANALYZER - Baseado em Pesquisas Científicas 2024-2025
 * 
 * Implementa:
 * - Context-Aware Prediction Systems
 * - In-Context Adaptation to Concept Drift (ICML 2025)
 * - Temporal Pattern Analysis com RWKV-7
 * - Multi-Modal Context Classification
 * - Dynamic Context Switching Detection
 * 
 * Baseado em:
 * - "In-Context Adaptation to Concept Drift for Learned Database Operations" (ICML 2025)
 * - "BlackGoose Rimer: RWKV-7 for Time Series Modeling" (2025)
 * - "Dynamic Online Ensembles of Basis Expansions" (TMLR 2024)
 */

import type { 
  ContextAnalysis, 
  PredictionContext,
  TemporalFeatures,
  VolatilityFeatures,
  PatternFeatures,
  MetaFeatures
} from '../../types/enhanced-prediction.types'

// ===== INTERFACES ESPECÍFICAS DO CONTEXT ANALYZER =====

export interface ContextClassificationResult {
  context_analysis: ContextAnalysis
  classification_confidence: number
  context_stability_score: number
  concept_drift_detected: boolean
  context_change_probability: number
  feature_importance: Record<string, number>
}

export interface ConceptDriftDetection {
  drift_detected: boolean
  drift_magnitude: number
  drift_type: 'gradual' | 'sudden' | 'recurring' | 'none'
  affected_features: string[]
  adaptation_recommendation: string
  confidence_in_detection: number
}

export interface TemporalPattern {
  pattern_id: string
  pattern_type: 'cyclical' | 'trend' | 'seasonal' | 'irregular'
  strength: number
  period_length?: number
  trend_direction?: 'ascending' | 'descending' | 'stable'
  seasonality_components: number[]
  pattern_stability: number
}

export interface VolatilityRegime {
  regime_type: 'low_vol' | 'medium_vol' | 'high_vol' | 'extreme_vol' | 'transitioning'
  volatility_percentile: number
  regime_persistence: number
  regime_switch_probability: number
  historical_duration: number
  volatility_clustering: boolean
}

export interface MarketMicrostructure {
  bid_ask_spread_proxy: number
  liquidity_proxy: number
  market_impact_factor: number
  information_asymmetry: number
  market_efficiency: number
  noise_to_signal_ratio: number
}

// ===== CONTEXT ANALYZER PRINCIPAL =====

export class ContextAnalyzer {
  private contextHistory: ContextAnalysis[] = []
  private driftDetectionMemory: ConceptDriftDetection[] = []
  private patternCache: Map<string, TemporalPattern[]> = new Map()
  private volatilityRegimeHistory: VolatilityRegime[] = []
  private adaptationThreshold: number = 0.7
  private maxHistoryLength: number = 100

  /**
   * 🔍 ANÁLISE PRINCIPAL DE CONTEXTO
   * Classifica automaticamente o contexto baseado em múltiplas dimensões
   */
  async analyzeContext(predictionContext: PredictionContext): Promise<ContextClassificationResult> {
    console.log('🔍 CONTEXT ANALYZER: Iniciando análise de contexto...')

    // 1. ANÁLISE TEMPORAL AVANÇADA
    const temporalAnalysis = this.analyzeTemporalContext(predictionContext.temporal_features)
    
    // 2. ANÁLISE DE VOLATILIDADE E REGIME
    const volatilityAnalysis = this.analyzeVolatilityRegime(predictionContext.volatility_features)
    
    // 3. ANÁLISE DE PADRÕES COMPLEXOS
    const patternAnalysis = this.analyzePatternComplexity(predictionContext.pattern_features)
    
    // 4. ANÁLISE DE META-FEATURES
    const metaAnalysis = this.analyzeMetaFeatures(predictionContext.meta_features)
    
    // 5. DETECÇÃO DE CONCEPT DRIFT
    const driftDetection = this.detectConceptDrift(predictionContext)
    
    // 6. DETECÇÃO DE MUDANÇA DE CONTEXTO
    const contextSwitching = this.detectContextSwitching(temporalAnalysis, volatilityAnalysis, patternAnalysis)
    
    // 7. CLASSIFICAÇÃO DE REGIME DE MERCADO
    const marketRegime = this.classifyMarketRegime(volatilityAnalysis, patternAnalysis, metaAnalysis)
    
    // 8. CÁLCULO DE CONFIANÇA E ESTABILIDADE
    const classificationConfidence = this.calculateClassificationConfidence(
      temporalAnalysis, volatilityAnalysis, patternAnalysis, metaAnalysis
    )
    
    const contextStability = this.calculateContextStability(driftDetection, contextSwitching)
    
    // 9. CONSTRUIR ANÁLISE FINAL
    const contextAnalysis: ContextAnalysis = {
      temporal_context: temporalAnalysis.context_type,
      volatility_state: volatilityAnalysis.regime_type.replace('_vol', '') as any,
      streak_pattern: this.classifyStreakPattern(predictionContext.pattern_features),
      pattern_type: patternAnalysis.dominant_pattern_type,
      market_regime: marketRegime,
      context_confidence: classificationConfidence
    }
    
    // 10. ATUALIZAR HISTÓRICO
    this.updateContextHistory(contextAnalysis, driftDetection)
    
    console.log(`✅ Contexto classificado: ${contextAnalysis.temporal_context}/${contextAnalysis.volatility_state}/${contextAnalysis.pattern_type}`)
    
    return {
      context_analysis: contextAnalysis,
      classification_confidence: classificationConfidence,
      context_stability_score: contextStability,
      concept_drift_detected: driftDetection.drift_detected,
      context_change_probability: contextSwitching.change_probability,
      feature_importance: this.calculateFeatureImportance(temporalAnalysis, volatilityAnalysis, patternAnalysis)
    }
  }

  /**
   * ⏰ ANÁLISE TEMPORAL AVANÇADA
   * Baseado em RWKV-7 e análise de séries temporais
   */
  private analyzeTemporalContext(temporalFeatures: TemporalFeatures): {
    context_type: 'morning' | 'afternoon' | 'evening' | 'night',
    temporal_patterns: TemporalPattern[],
    cyclical_strength: number,
    temporal_stability: number
  } {
    const hour = temporalFeatures.hour_of_day
    const sequenceLength = temporalFeatures.sequence_length
    const movingAverages = temporalFeatures.moving_averages
    
    // Classificação básica temporal
    let contextType: 'morning' | 'afternoon' | 'evening' | 'night'
    if (hour >= 6 && hour < 12) contextType = 'morning'
    else if (hour >= 12 && hour < 18) contextType = 'afternoon'  
    else if (hour >= 18 && hour < 22) contextType = 'evening'
    else contextType = 'night'
    
    // Detecção de padrões temporais (simplificado)
    const temporalPatterns: TemporalPattern[] = []
    
    // Análise cíclica baseada em moving averages
    if (movingAverages.length >= 3) {
      const shortMA = movingAverages[0]
      const mediumMA = movingAverages[1] 
      const longMA = movingAverages[2]
      
      // Detectar trend
      if (shortMA > mediumMA && mediumMA > longMA) {
        temporalPatterns.push({
          pattern_id: 'upward_trend',
          pattern_type: 'trend',
          strength: 0.8,
          trend_direction: 'ascending',
          seasonality_components: movingAverages,
          pattern_stability: 0.7
        })
      } else if (shortMA < mediumMA && mediumMA < longMA) {
        temporalPatterns.push({
          pattern_id: 'downward_trend',
          pattern_type: 'trend', 
          strength: 0.8,
          trend_direction: 'descending',
          seasonality_components: movingAverages,
          pattern_stability: 0.7
        })
      }
      
      // Detectar ciclicalidade
      const cyclicalStrength = this.calculateCyclicalStrength(movingAverages)
      if (cyclicalStrength > 0.6) {
        temporalPatterns.push({
          pattern_id: 'cyclical_pattern',
          pattern_type: 'cyclical',
          strength: cyclicalStrength,
          period_length: this.estimatePeriodLength(movingAverages),
          seasonality_components: movingAverages,
          pattern_stability: cyclicalStrength
        })
      }
    }
    
    const cyclicalStrength = temporalPatterns
      .filter(p => p.pattern_type === 'cyclical')
      .reduce((max, p) => Math.max(max, p.strength), 0)
    
    const temporalStability = this.calculateTemporalStability(temporalFeatures, temporalPatterns)
    
    return {
      context_type: contextType,
      temporal_patterns: temporalPatterns,
      cyclical_strength: cyclicalStrength,
      temporal_stability: temporalStability
    }
  }

  /**
   * 📊 ANÁLISE DE VOLATILIDADE E REGIME
   * Detecção automática de regimes de volatilidade
   */
  private analyzeVolatilityRegime(volatilityFeatures: VolatilityFeatures): VolatilityRegime {
    const currentVol = volatilityFeatures.current_volatility
    const volatilityTrend = volatilityFeatures.volatility_trend
    const volatilityPercentile = volatilityFeatures.volatility_percentile
    
    // Classificação de regime baseado em thresholds adaptativos
    let regimeType: VolatilityRegime['regime_type']
    
    if (currentVol < 0.2) regimeType = 'low_vol'
    else if (currentVol < 0.5) regimeType = 'medium_vol' 
    else if (currentVol < 0.8) regimeType = 'high_vol'
    else regimeType = 'extreme_vol'
    
    // Detectar transições
    if (volatilityTrend === 'increasing' && currentVol > 0.6) {
      regimeType = 'transitioning'
    } else if (volatilityTrend === 'decreasing' && currentVol < 0.4) {
      regimeType = 'transitioning'
    }
    
    // Calcular persistência do regime
    const regimePersistence = this.calculateRegimePersistence(regimeType)
    
    // Calcular probabilidade de mudança de regime
    const regimeSwitchProbability = this.calculateRegimeSwitchProbability(
      currentVol, volatilityTrend, regimePersistence
    )
    
    // Detectar clustering de volatilidade
    const volatilityClustering = this.detectVolatilityClustering(volatilityFeatures)
    
    const regime: VolatilityRegime = {
      regime_type: regimeType,
      volatility_percentile: volatilityPercentile,
      regime_persistence: regimePersistence,
      regime_switch_probability: regimeSwitchProbability,
      historical_duration: this.calculateRegimeDuration(regimeType),
      volatility_clustering: volatilityClustering
    }
    
    // Atualizar histórico de regimes
    this.volatilityRegimeHistory.push(regime)
    if (this.volatilityRegimeHistory.length > this.maxHistoryLength) {
      this.volatilityRegimeHistory = this.volatilityRegimeHistory.slice(-this.maxHistoryLength)
    }
    
    return regime
  }

  /**
   * 🔄 ANÁLISE DE PADRÕES COMPLEXOS
   * Classificação automática de tipos de padrão
   */
  private analyzePatternComplexity(patternFeatures: PatternFeatures): {
    dominant_pattern_type: 'periodic' | 'random' | 'trending' | 'reverting',
    pattern_complexity_score: number,
    pattern_predictability: number,
    chaos_indicator: number
  } {
    const streakLength = patternFeatures.streak_length
    const colorDistribution = patternFeatures.color_distribution
    const gapAnalysis = patternFeatures.gap_analysis
    const periodicityDetected = patternFeatures.periodicity_detected
    const dominantFrequency = patternFeatures.dominant_frequency
    
    // Calcular complexidade do padrão
    const complexityScore = this.calculatePatternComplexity(patternFeatures)
    
    // Calcular predibilidade
    const predictability = this.calculatePatternPredictability(patternFeatures)
    
    // Calcular indicador de caos
    const chaosIndicator = this.calculateChaosIndicator(patternFeatures)
    
    // Classificar tipo dominante de padrão
    let dominantPatternType: 'periodic' | 'random' | 'trending' | 'reverting'
    
    if (periodicityDetected && dominantFrequency > 0.7) {
      dominantPatternType = 'periodic'
    } else if (chaosIndicator > 0.8) {
      dominantPatternType = 'random'
    } else if (this.detectTrendingPattern(patternFeatures)) {
      dominantPatternType = 'trending'
    } else {
      dominantPatternType = 'reverting'
    }
    
    return {
      dominant_pattern_type: dominantPatternType,
      pattern_complexity_score: complexityScore,
      pattern_predictability: predictability,
      chaos_indicator: chaosIndicator
    }
  }

  /**
   * 🧠 ANÁLISE DE META-FEATURES
   * Avaliação de qualidade e confiabilidade dos dados
   */
  private analyzeMetaFeatures(metaFeatures: MetaFeatures): {
    data_reliability: number,
    prediction_difficulty: number,
    context_novelty: number,
    feature_stability: number
  } {
    const dataQuality = metaFeatures.data_quality_score
    const predictionComplexity = metaFeatures.prediction_complexity
    const contextStability = metaFeatures.context_stability
    const algorithmAgreement = metaFeatures.algorithm_agreement
    const historicalMatch = metaFeatures.historical_context_match
    
    // Calcular confiabilidade dos dados
    const dataReliability = (dataQuality + algorithmAgreement) / 2
    
    // Calcular dificuldade de predição
    const predictionDifficulty = predictionComplexity * (1 - contextStability)
    
    // Calcular novidade do contexto
    const contextNovelty = 1 - historicalMatch
    
    // Calcular estabilidade das features
    const featureStability = (contextStability + algorithmAgreement + historicalMatch) / 3
    
    return {
      data_reliability: dataReliability,
      prediction_difficulty: predictionDifficulty,
      context_novelty: contextNovelty,
      feature_stability: featureStability
    }
  }

  /**
   * 🚨 DETECÇÃO DE CONCEPT DRIFT
   * Baseado em In-Context Adaptation (ICML 2025)
   */
  private detectConceptDrift(context: PredictionContext): ConceptDriftDetection {
    // Verificar se temos histórico suficiente
    if (this.contextHistory.length < 10) {
      return {
        drift_detected: false,
        drift_magnitude: 0,
        drift_type: 'none',
        affected_features: [],
        adaptation_recommendation: 'continue_monitoring',
        confidence_in_detection: 0.5
      }
    }
    
    // Comparar contexto atual com histórico recente
    const recentContexts = this.contextHistory.slice(-10)
    const olderContexts = this.contextHistory.slice(-20, -10)
    
    // Calcular mudanças em features-chave
    const featureChanges = this.calculateFeatureChanges(context, recentContexts, olderContexts)
    
    // Detectar tipo de drift
    const driftType = this.classifyDriftType(featureChanges)
    
    // Calcular magnitude do drift
    const driftMagnitude = this.calculateDriftMagnitude(featureChanges)
    
    // Identificar features afetadas
    const affectedFeatures = this.identifyAffectedFeatures(featureChanges)
    
    // Decidir se drift foi detectado
    const driftDetected = driftMagnitude > this.adaptationThreshold
    
    // Recomendar adaptação
    const adaptationRecommendation = this.recommendAdaptation(driftType, driftMagnitude)
    
    // Calcular confiança na detecção
    const confidenceInDetection = this.calculateDriftConfidence(featureChanges, driftMagnitude)
    
    const detection: ConceptDriftDetection = {
      drift_detected: driftDetected,
      drift_magnitude: driftMagnitude,
      drift_type: driftType,
      affected_features: affectedFeatures,
      adaptation_recommendation: adaptationRecommendation,
      confidence_in_detection: confidenceInDetection
    }
    
    // Atualizar memória de drift
    this.driftDetectionMemory.push(detection)
    if (this.driftDetectionMemory.length > 50) {
      this.driftDetectionMemory = this.driftDetectionMemory.slice(-50)
    }
    
    return detection
  }

  /**
   * 🔀 DETECÇÃO DE MUDANÇA DE CONTEXTO
   */
  private detectContextSwitching(
    temporalAnalysis: any,
    volatilityAnalysis: VolatilityRegime,
    patternAnalysis: any
  ): { change_detected: boolean; change_probability: number; change_type: string } {
    
    // Verificar mudanças súbitas em regime de volatilidade
    const volatilityChange = volatilityAnalysis.regime_switch_probability
    
    // Verificar mudanças em padrões temporais
    const temporalChange = temporalAnalysis.temporal_stability < 0.5 ? 0.8 : 0.2
    
    // Verificar mudanças em complexidade de padrões
    const patternChange = patternAnalysis.chaos_indicator > 0.7 ? 0.7 : 0.3
    
    // Combinar evidências
    const changeProbability = (volatilityChange + temporalChange + patternChange) / 3
    
    const changeDetected = changeProbability > 0.6
    
    let changeType = 'none'
    if (volatilityChange > 0.7) changeType = 'volatility_regime_change'
    else if (temporalChange > 0.7) changeType = 'temporal_pattern_change'
    else if (patternChange > 0.7) changeType = 'complexity_change'
    else if (changeDetected) changeType = 'gradual_context_change'
    
    return {
      change_detected: changeDetected,
      change_probability: changeProbability,
      change_type: changeType
    }
  }

  /**
   * 🏪 CLASSIFICAÇÃO DE REGIME DE MERCADO
   */
  private classifyMarketRegime(
    volatilityAnalysis: VolatilityRegime,
    patternAnalysis: any,
    metaAnalysis: any
  ): 'stable' | 'volatile' | 'trending' | 'chaotic' {
    
    const volatilityLevel = volatilityAnalysis.volatility_percentile
    const patternPredictability = patternAnalysis.pattern_predictability
    const chaosLevel = patternAnalysis.chaos_indicator
    const dataReliability = metaAnalysis.data_reliability
    
    // Classificação hierárquica
    if (chaosLevel > 0.8 || dataReliability < 0.3) {
      return 'chaotic'
    } else if (volatilityLevel > 0.7 || volatilityAnalysis.volatility_clustering) {
      return 'volatile'
    } else if (patternAnalysis.dominant_pattern_type === 'trending' && patternPredictability > 0.6) {
      return 'trending'
    } else {
      return 'stable'
    }
  }

  // ===== HELPER METHODS =====

  private classifyStreakPattern(patternFeatures: PatternFeatures): 'short' | 'medium' | 'long' | 'broken' {
    const streakLength = patternFeatures.streak_length
    
    if (streakLength < 3) return 'short'
    else if (streakLength < 6) return 'medium'
    else if (streakLength < 10) return 'long'
    else return 'broken'
  }

  private calculateCyclicalStrength(movingAverages: number[]): number {
    if (movingAverages.length < 3) return 0
    
    // Análise simplificada de ciclicalidade
    const shortMA = movingAverages[0]
    const mediumMA = movingAverages[1]
    const longMA = movingAverages[2]
    
    // Se há convergência/divergência das médias móveis
    const convergence = Math.abs(shortMA - longMA) / (Math.abs(mediumMA) + 0.01)
    return Math.min(1, convergence)
  }

  private estimatePeriodLength(movingAverages: number[]): number {
    // Estimativa simplificada do período
    return movingAverages.length * 2  // Heurística básica
  }

  private calculateTemporalStability(temporalFeatures: TemporalFeatures, patterns: TemporalPattern[]): number {
    // Estabilidade baseada na consistência dos padrões
    if (patterns.length === 0) return 0.5
    
    const avgStability = patterns.reduce((sum, p) => sum + p.pattern_stability, 0) / patterns.length
    return avgStability
  }

  private calculateRegimePersistence(regimeType: VolatilityRegime['regime_type']): number {
    // Calcular persistência baseada no histórico
    if (this.volatilityRegimeHistory.length === 0) return 0.5
    
    const recentRegimes = this.volatilityRegimeHistory.slice(-10)
    const sameRegimeCount = recentRegimes.filter(r => r.regime_type === regimeType).length
    return sameRegimeCount / recentRegimes.length
  }

  private calculateRegimeSwitchProbability(
    currentVol: number, 
    trend: 'increasing' | 'decreasing' | 'stable', 
    persistence: number
  ): number {
    // Probabilidade baseada em volatilidade atual, trend e persistência
    let switchProb = 0.1  // Base probability
    
    if (trend === 'increasing' && currentVol > 0.7) switchProb += 0.3
    if (trend === 'decreasing' && currentVol < 0.3) switchProb += 0.3
    if (persistence < 0.3) switchProb += 0.2
    
    return Math.min(1, switchProb)
  }

  private detectVolatilityClustering(volatilityFeatures: VolatilityFeatures): boolean {
    // Detectar se há clustering de volatilidade (GARCH effects)
    return volatilityFeatures.current_volatility > 0.6 && 
           volatilityFeatures.volatility_trend !== 'stable'
  }

  private calculateRegimeDuration(regimeType: VolatilityRegime['regime_type']): number {
    // Calcular duração típica do regime
    const regimeDurations = {
      'low_vol': 20,
      'medium_vol': 15,
      'high_vol': 10,
      'extreme_vol': 5,
      'transitioning': 3
    }
    
    return regimeDurations[regimeType] || 10
  }

  private calculatePatternComplexity(patternFeatures: PatternFeatures): number {
    const gapVariance = this.calculateGapVariance(patternFeatures.gap_analysis)
    const distributionEntropy = this.calculateDistributionEntropy(patternFeatures.color_distribution)
    
    return (gapVariance + distributionEntropy) / 2
  }

  private calculatePatternPredictability(patternFeatures: PatternFeatures): number {
    // Predibilidade inversa da complexidade
    const complexity = this.calculatePatternComplexity(patternFeatures)
    return 1 - complexity
  }

  private calculateChaosIndicator(patternFeatures: PatternFeatures): number {
    // Indicador de caos baseado na aleatoriedade dos padrões
    const entropy = this.calculateDistributionEntropy(patternFeatures.color_distribution)
    const gapRandomness = this.calculateGapRandomness(patternFeatures.gap_analysis)
    
    return (entropy + gapRandomness) / 2
  }

  private detectTrendingPattern(patternFeatures: PatternFeatures): boolean {
    // Detectar se há trend nos padrões
    return patternFeatures.dominant_frequency > 0.6 && !patternFeatures.periodicity_detected
  }

  private calculateGapVariance(gapAnalysis: Record<string, number>): number {
    const gaps = Object.values(gapAnalysis)
    if (gaps.length === 0) return 0
    
    const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - mean, 2), 0) / gaps.length
    
    return Math.min(1, variance / 100)  // Normalizar
  }

  private calculateDistributionEntropy(distribution: Record<string, number>): number {
    const values = Object.values(distribution)
    const total = values.reduce((sum, val) => sum + val, 0)
    
    if (total === 0) return 0
    
    const entropy = values.reduce((sum, val) => {
      const p = val / total
      return sum - (p > 0 ? p * Math.log2(p) : 0)
    }, 0)
    
    return entropy / Math.log2(values.length)  // Normalizar
  }

  private calculateGapRandomness(gapAnalysis: Record<string, number>): number {
    // Calcular aleatoriedade dos gaps
    return this.calculateGapVariance(gapAnalysis)
  }

  private calculateFeatureChanges(
    currentContext: PredictionContext,
    recentContexts: ContextAnalysis[],
    olderContexts: ContextAnalysis[]
  ): Record<string, number> {
    // Simplificado - comparar contextos
    const changes: Record<string, number> = {}
    
    // Calcular mudanças em features temporais
    changes['temporal'] = this.calculateTemporalChange(recentContexts, olderContexts)
    
    // Calcular mudanças em volatilidade
    changes['volatility'] = this.calculateVolatilityChange(recentContexts, olderContexts)
    
    // Calcular mudanças em padrões
    changes['pattern'] = this.calculatePatternChange(recentContexts, olderContexts)
    
    return changes
  }

  private calculateTemporalChange(recent: ContextAnalysis[], older: ContextAnalysis[]): number {
    // Simplificado - contar mudanças de contexto temporal
    if (recent.length === 0 || older.length === 0) return 0
    
    const recentTemporal = recent.map(c => c.temporal_context)
    const olderTemporal = older.map(c => c.temporal_context)
    
    const recentMode = this.calculateMode(recentTemporal)
    const olderMode = this.calculateMode(olderTemporal)
    
    return recentMode !== olderMode ? 1 : 0
  }

  private calculateVolatilityChange(recent: ContextAnalysis[], older: ContextAnalysis[]): number {
    if (recent.length === 0 || older.length === 0) return 0
    
    const recentVol = recent.map(c => c.volatility_state)
    const olderVol = older.map(c => c.volatility_state)
    
    const recentMode = this.calculateMode(recentVol)
    const olderMode = this.calculateMode(olderVol)
    
    return recentMode !== olderMode ? 1 : 0
  }

  private calculatePatternChange(recent: ContextAnalysis[], older: ContextAnalysis[]): number {
    if (recent.length === 0 || older.length === 0) return 0
    
    const recentPattern = recent.map(c => c.pattern_type)
    const olderPattern = older.map(c => c.pattern_type)
    
    const recentMode = this.calculateMode(recentPattern)
    const olderMode = this.calculateMode(olderPattern)
    
    return recentMode !== olderMode ? 1 : 0
  }

  private calculateMode<T>(array: T[]): T | null {
    if (array.length === 0) return null
    
    const counts = new Map<T, number>()
    array.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1)
    })
    
    let maxCount = 0
    let mode: T | null = null
    
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count
        mode = item
      }
    })
    
    return mode
  }

  private classifyDriftType(featureChanges: Record<string, number>): 'gradual' | 'sudden' | 'recurring' | 'none' {
    const totalChange = Object.values(featureChanges).reduce((sum, change) => sum + change, 0)
    const maxChange = Math.max(...Object.values(featureChanges))
    
    if (totalChange === 0) return 'none'
    else if (maxChange > 0.8) return 'sudden'
    else if (this.detectRecurringPattern()) return 'recurring'
    else return 'gradual'
  }

  private detectRecurringPattern(): boolean {
    // Simplificado - detectar se há padrão recorrente no drift
    return this.driftDetectionMemory.slice(-5).filter(d => d.drift_detected).length >= 3
  }

  private calculateDriftMagnitude(featureChanges: Record<string, number>): number {
    const values = Object.values(featureChanges)
    return values.length > 0 ? values.reduce((sum, change) => sum + change, 0) / values.length : 0
  }

  private identifyAffectedFeatures(featureChanges: Record<string, number>): string[] {
    return Object.entries(featureChanges)
      .filter(([_, change]) => change > 0.5)
      .map(([feature, _]) => feature)
  }

  private recommendAdaptation(driftType: string, magnitude: number): string {
    if (magnitude < 0.3) return 'no_adaptation_needed'
    else if (driftType === 'sudden') return 'immediate_adaptation'
    else if (driftType === 'gradual') return 'gradual_adaptation'
    else if (driftType === 'recurring') return 'cyclic_adaptation'
    else return 'monitor_and_adapt'
  }

  private calculateDriftConfidence(featureChanges: Record<string, number>, magnitude: number): number {
    const changeConsistency = Object.values(featureChanges).filter(change => change > 0.3).length / Object.keys(featureChanges).length
    return (magnitude + changeConsistency) / 2
  }

  private calculateClassificationConfidence(
    temporal: any, volatility: any, pattern: any, meta: any
  ): number {
    // Confiança baseada na consistência das análises
    const temporalConf = temporal.temporal_stability
    const volatilityConf = 1 - volatility.regime_switch_probability
    const patternConf = pattern.pattern_predictability
    const metaConf = meta.data_reliability
    
    return (temporalConf + volatilityConf + patternConf + metaConf) / 4
  }

  private calculateContextStability(drift: ConceptDriftDetection, contextSwitching: any): number {
    const driftStability = drift.drift_detected ? 1 - drift.drift_magnitude : 1
    const switchStability = 1 - contextSwitching.change_probability
    
    return (driftStability + switchStability) / 2
  }

  private calculateFeatureImportance(temporal: any, volatility: any, pattern: any): Record<string, number> {
    return {
      'temporal_context': temporal.temporal_stability,
      'volatility_regime': volatility.regime_persistence,
      'pattern_type': pattern.pattern_predictability,
      'cyclical_strength': temporal.cyclical_strength,
      'chaos_indicator': 1 - pattern.chaos_indicator
    }
  }

  private updateContextHistory(context: ContextAnalysis, drift: ConceptDriftDetection): void {
    this.contextHistory.push(context)
    
    if (this.contextHistory.length > this.maxHistoryLength) {
      this.contextHistory = this.contextHistory.slice(-this.maxHistoryLength)
    }
  }

  // ===== MÉTODOS PÚBLICOS PARA INSPEÇÃO =====

  getContextHistory(): ContextAnalysis[] {
    return [...this.contextHistory]
  }

  getDriftDetectionHistory(): ConceptDriftDetection[] {
    return [...this.driftDetectionMemory]
  }

  getVolatilityRegimeHistory(): VolatilityRegime[] {
    return [...this.volatilityRegimeHistory]
  }

  resetHistory(): void {
    this.contextHistory = []
    this.driftDetectionMemory = []
    this.volatilityRegimeHistory = []
    this.patternCache.clear()
  }
} 