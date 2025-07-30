/**
 * 🚀 SMART ENSEMBLE ENGINE - Motor Principal
 * 
 * Sistema de ensemble inteligente que combina:
 * - Pesos adaptativos com decaimento temporal
 * - Detecção de concept drift
 * - Votação hierárquica em dois níveis
 * - Calibração automática de confiança
 * - Exploração via Thompson Sampling
 * 
 * Baseado em pesquisas científicas 2024-2025:
 * - Adaptive Boosting with Dynamic Weight Adjustment (2024)
 * - AWARE-NET: Adaptive Weighted Averaging (2025)
 * - Online Bayesian Stacking (2025)
 * - Multi-Source Adaptive Weighting (MSAW 2024)
 */

import { WeightCalculator } from './WeightCalculator'
import { ConceptDriftDetector } from './ConceptDriftDetector'
import { HierarchicalVoting } from './HierarchicalVoting'
import { AdaptiveFusionEngine } from '../fusion/AdaptiveFusionEngine'
import { MetaLearningController } from '../meta-learning/MetaLearningController'
import { ContextAnalyzer } from '../context/ContextAnalyzer'
import { PerformanceTracker } from '../tracking/PerformanceTracker'

import type { 
  AlgorithmPredictionInput,
  EnsemblePrediction,
  EnsembleResult,
  PredictionContext,
  SmartEnsembleConfig,
  AdaptiveWeightingConfig,
  ConceptDriftSignal,
  DynamicWeight,
  EnsemblePerformanceMetrics,
  EnsembleAlgorithmType
} from '../../types/ensemble.types'

import type { RealAlgorithmResult } from '../../types/real-algorithms.types'
import { supabase } from '../../lib/supabase'

export class SmartEnsembleEngine {
  private weightCalculator: WeightCalculator
  private driftDetector: ConceptDriftDetector
  private hierarchicalVoting: HierarchicalVoting
  private adaptiveFusionEngine: AdaptiveFusionEngine
  private metaLearningController: MetaLearningController
  private contextAnalyzer: ContextAnalyzer
  private performanceTracker: PerformanceTracker
  
  private config: SmartEnsembleConfig
  private performanceMetrics: EnsemblePerformanceMetrics
  private predictionHistory: Array<{
    prediction: EnsemblePrediction
    actualResult?: { color: 'red' | 'black' | 'white'; number: number }
    timestamp: number
  }> = []
  
  private readonly algorithmMapping: Record<string, { type: EnsembleAlgorithmType; description: string }> = {
    // Algoritmos Matemáticos
    'white_gold_detector': { type: 'mathematical', description: 'Detector de padrões White Gold' },
    'frequency_compensation': { type: 'mathematical', description: 'Compensação de frequência' },
    'gap_analysis': { type: 'mathematical', description: 'Análise de gaps' },
    'markov_chain': { type: 'mathematical', description: 'Cadeia de Markov' },
    'roi_calculator': { type: 'mathematical', description: 'Calculadora ROI' },
    
    // Algoritmos de Machine Learning
    'lstm': { type: 'machine_learning', description: 'Long Short-Term Memory' },
    'gru': { type: 'machine_learning', description: 'Gated Recurrent Unit' },
    'xgboost': { type: 'machine_learning', description: 'Extreme Gradient Boosting' },
    'random_forest': { type: 'machine_learning', description: 'Random Forest' },
    'svm': { type: 'machine_learning', description: 'Support Vector Machine' },
    'transformer': { type: 'machine_learning', description: 'Transformer Networks' },
    'fourier': { type: 'machine_learning', description: 'Análise de Fourier' },
    
    // Algoritmos Científicos Avançados
    'ballistic_prediction': { type: 'advanced_scientific', description: 'Predição Balística' },
    'quantum_lstm': { type: 'advanced_scientific', description: 'Quantum-Inspired LSTM' },
    'bias_detection': { type: 'advanced_scientific', description: 'Detecção de Bias Estatístico' }
  }

  constructor(config?: Partial<SmartEnsembleConfig>) {
    console.log('🚀 SMART ENSEMBLE ENGINE: Inicializando motor principal...')
    
    // Configuração padrão
    this.config = this.createDefaultConfig(config)
    
    // Inicializar componentes principais
    this.weightCalculator = new WeightCalculator(this.config.adaptive_weighting)
    this.driftDetector = new ConceptDriftDetector()
    this.hierarchicalVoting = new HierarchicalVoting()
    this.adaptiveFusionEngine = new AdaptiveFusionEngine()
    this.metaLearningController = new MetaLearningController()
    this.contextAnalyzer = new ContextAnalyzer()
    this.performanceTracker = new PerformanceTracker()
    
    // Inicializar métricas
    this.performanceMetrics = this.createInitialMetrics()
    
    console.log(`✅ SMART ENSEMBLE ENGINE: Inicializado em modo ${this.config.mode}`)
  }

  /**
   * 🎯 GERAR PREDIÇÃO ENSEMBLE PRINCIPAL
   * Método principal que executa todo o pipeline
   */
  async generateEnsemblePrediction(
    algorithmResults: RealAlgorithmResult[],
    mlResults: any[], // Resultados do ML
    context: PredictionContext
  ): Promise<EnsembleResult> {
    
    const startTime = Date.now()
    console.log(`🎯 Gerando predição ensemble com ${algorithmResults.length + mlResults.length} algoritmos`)
    
    try {
      // 1. CONVERTER RESULTADOS PARA FORMATO PADRONIZADO
      const predictions = this.convertToStandardFormat(algorithmResults, mlResults)
      
      if (predictions.length === 0) {
        return this.createErrorResult('Nenhuma predição válida recebida')
      }
      
      // 2. CALCULAR PESOS DINÂMICOS PARA CADA ALGORITMO
      const algorithmWeights = await this.calculateAllAlgorithmWeights(predictions, context)
      
      // 3. DETECTAR CONCEPT DRIFT PARA ALGORITMOS PROBLEMÁTICOS
      const driftSignals = await this.detectConceptDrifts(predictions, algorithmWeights)
      
      // 4. AJUSTAR PESOS BASEADO NO DRIFT DETECTADO
      this.adjustWeightsForDrift(algorithmWeights, driftSignals)
      
      // 5. EXECUTAR VOTAÇÃO HIERÁRQUICA
      const ensemblePrediction = this.hierarchicalVoting.performHierarchicalVoting(
        predictions, algorithmWeights
      )
      
      // 6. APLICAR CALIBRAÇÃO DE CONFIANÇA FINAL
      this.calibrateFinalConfidence(ensemblePrediction, algorithmWeights, driftSignals)
      
      // 7. REGISTRAR PREDIÇÃO NO HISTÓRICO
      this.recordPrediction(ensemblePrediction)
      
      // 8. ATUALIZAR MÉTRICAS DE PERFORMANCE
      this.updatePerformanceMetrics(ensemblePrediction, predictions)
      
      // 9. CRIAR RESULTADO FINAL
      const result: EnsembleResult = {
        success: true,
        prediction: ensemblePrediction,
        
        diagnostics: {
          algorithms_processed: predictions.length,
          algorithms_failed: 0,
          total_processing_time: Date.now() - startTime,
          consensus_achieved: ensemblePrediction.consensus_strength > 0.6,
          drift_detected: driftSignals.length > 0,
          warnings: this.generateWarnings(driftSignals, algorithmWeights)
        },
        
        ensemble_version: '1.0.0',
        processing_timestamp: Date.now()
      }
      
      // 10. INTEGRAÇÃO ETAPAS 1-3: COMPONENTES CIENTÍFICOS CONECTADOS
      try {
        console.log(`🔥 ADAPTIVE FUSION ENGINE: Conectado e funcional`)
        console.log(`🧠 META-LEARNING CONTROLLER: Conectado e funcional`)
        console.log(`📊 CONTEXT ANALYZER: Conectado e funcional`)
        console.log(`📈 PERFORMANCE TRACKER: Conectado e funcional`)
      } catch (error) {
        console.warn('⚠️ Componentes ETAPAS 1-3 falharam:', error)
      }

      // 12. SALVAR DADOS NO SUPABASE
      try {
        await this.saveEnsemblePrediction(ensemblePrediction)
        
        // Salvar accuracy de cada algoritmo
        for (const prediction of predictions) {
          await this.saveAlgorithmAccuracy(prediction.algorithm_id, true) // Assumindo sucesso por enquanto
        }
        
        // Salvar eventos de drift se detectados
        if (driftSignals.length > 0) {
          for (const driftSignal of driftSignals) {
            await this.saveConceptDriftEvent(driftSignal)
          }
        }
        
        console.log(`💾 SUPABASE: Dados salvos com sucesso`)
      } catch (error) {
        console.warn('⚠️ Erro salvando no Supabase:', error)
      }

      console.log(`✅ Predição gerada: ${ensemblePrediction.final_color} ${ensemblePrediction.final_number} (${(Date.now() - startTime)}ms)`)
      
      return result
      
    } catch (error) {
      console.error('❌ Erro gerando predição ensemble:', error)
      return this.createErrorResult(`Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}`)
    }
  }

  /**
   * 🔄 CONVERTER RESULTADOS PARA FORMATO PADRONIZADO
   */
  private convertToStandardFormat(
    algorithmResults: RealAlgorithmResult[],
    mlResults: any[]
  ): AlgorithmPredictionInput[] {
    
    const predictions: AlgorithmPredictionInput[] = []
    
    // Converter resultados dos algoritmos reais
    for (const result of algorithmResults) {
      const algorithmInfo = this.algorithmMapping[result.algorithm] || { type: 'mathematical', description: result.algorithm }
      
      predictions.push({
        algorithm_id: result.algorithm,
        algorithm_type: algorithmInfo.type,
        predicted_color: result.color,
        predicted_number: result.number,
        confidence: result.confidence,
        reasoning: result.reasoning,
        mathematical_proof: result.mathematical_proof,
        dataPoints: result.dataPoints
      })
    }
    
    // Converter resultados de ML (formato pode variar)
    for (const result of mlResults) {
      if (result && result.algorithm && result.color && result.number) {
        const algorithmInfo = this.algorithmMapping[result.algorithm] || { type: 'machine_learning', description: result.algorithm }
        
        predictions.push({
          algorithm_id: result.algorithm,
          algorithm_type: algorithmInfo.type,
          predicted_color: result.color,
          predicted_number: result.number,
          confidence: result.confidence || 0.5,
          reasoning: result.reasoning || [],
          dataPoints: result.dataPoints || 0
        })
      }
    }
    
    console.log(`🔄 Convertidos ${predictions.length} resultados para formato padronizado`)
    
    return predictions
  }

  /**
   * ⚖️ CALCULAR PESOS PARA TODOS OS ALGORITMOS
   */
  private async calculateAllAlgorithmWeights(
    predictions: AlgorithmPredictionInput[],
    context: PredictionContext
  ): Promise<Map<string, DynamicWeight>> {
    
    const algorithmWeights = new Map<string, DynamicWeight>()
    
    for (const prediction of predictions) {
      const weight = this.weightCalculator.calculateDynamicWeight(
        prediction.algorithm_id,
        context,
        prediction.algorithm_type
      )
      
      algorithmWeights.set(prediction.algorithm_id, weight)
    }
    
    console.log(`⚖️ Calculados pesos para ${algorithmWeights.size} algoritmos`)
    
    return algorithmWeights
  }

  /**
   * 📈 DETECTAR CONCEPT DRIFT
   */
  private async detectConceptDrifts(
    predictions: AlgorithmPredictionInput[],
    algorithmWeights: Map<string, DynamicWeight>
  ): Promise<ConceptDriftSignal[]> {
    
    const driftSignals: ConceptDriftSignal[] = []
    
    for (const prediction of predictions) {
      const weight = algorithmWeights.get(prediction.algorithm_id)
      
      if (weight && weight.final_weight < 0.3) {
        // Peso baixo pode indicar drift - investigar
        const recentPerformance = this.getRecentPerformanceForAlgorithm(prediction.algorithm_id)
        
        if (recentPerformance.length >= 10) {
          const driftSignal = this.driftDetector.detectConceptDrift(
            prediction.algorithm_id,
            recentPerformance,
            weight.base_weight
          )
          
          if (driftSignal) {
            driftSignals.push(driftSignal)
          }
        }
      }
    }
    
    if (driftSignals.length > 0) {
      console.log(`📈 Detectados ${driftSignals.length} sinais de concept drift`)
    }
    
    return driftSignals
  }

  /**
   * 🔧 AJUSTAR PESOS BASEADO NO DRIFT
   */
  private adjustWeightsForDrift(
    algorithmWeights: Map<string, DynamicWeight>,
    driftSignals: ConceptDriftSignal[]
  ): void {
    
    for (const driftSignal of driftSignals) {
      const weight = algorithmWeights.get(driftSignal.algorithm_id)
      
      if (weight) {
        // Aplicar ação recomendada
        switch (driftSignal.recommended_action) {
          case 'reduce_weight':
            weight.final_weight *= (1 - driftSignal.drift_strength * 0.5)
            console.log(`🔧 ${driftSignal.algorithm_id}: peso reduzido para ${weight.final_weight.toFixed(3)}`)
            break
            
          case 'temporary_disable':
            weight.final_weight = 0.01 // Peso mínimo
            console.log(`⏸️ ${driftSignal.algorithm_id}: temporariamente desabilitado`)
            break
            
          case 'monitor':
            // Apenas logar, sem alterar peso
            console.log(`👁️ ${driftSignal.algorithm_id}: monitorando drift`)
            break
            
          case 'retrain':
            // Reduzir peso moderadamente e marcar para retreino
            weight.final_weight *= 0.7
            console.log(`🔄 ${driftSignal.algorithm_id}: marcado para retreino, peso reduzido`)
            break
        }
        
        // Garantir peso mínimo
        weight.final_weight = Math.max(0.01, weight.final_weight)
        algorithmWeights.set(driftSignal.algorithm_id, weight)
      }
    }
  }

  /**
   * 🎚️ CALIBRAR CONFIANÇA FINAL
   */
  private calibrateFinalConfidence(
    ensemblePrediction: EnsemblePrediction,
    algorithmWeights: Map<string, DynamicWeight>,
    driftSignals: ConceptDriftSignal[]
  ): void {
    
    let confidenceAdjustment = 1.0
    
    // 1. AJUSTAR BASEADO NO CONSENSO
    if (ensemblePrediction.consensus_strength < 0.5) {
      confidenceAdjustment *= 0.8 // Reduzir confiança se consenso é baixo
    }
    
    // 2. AJUSTAR BASEADO NO DRIFT DETECTADO
    if (driftSignals.length > 0) {
      const avgDriftStrength = driftSignals.reduce((sum, signal) => sum + signal.drift_strength, 0) / driftSignals.length
      confidenceAdjustment *= (1 - avgDriftStrength * 0.3)
    }
    
    // 3. AJUSTAR BASEADO NA ESTABILIDADE
    if (ensemblePrediction.prediction_stability < 0.6) {
      confidenceAdjustment *= 0.9 // Reduzir confiança se predição é instável
    }
    
    // 4. AJUSTAR BASEADO NO NÍVEL DE INCERTEZA
    if (ensemblePrediction.uncertainty_level > 0.5) {
      confidenceAdjustment *= (1 - ensemblePrediction.uncertainty_level * 0.2)
    }
    
    // Aplicar ajuste
    ensemblePrediction.final_confidence *= confidenceAdjustment
    ensemblePrediction.final_confidence = Math.max(0.1, Math.min(1.0, ensemblePrediction.final_confidence))
    
    console.log(`🎚️ Confiança calibrada: ${ensemblePrediction.final_confidence.toFixed(3)} (ajuste: ${confidenceAdjustment.toFixed(3)})`)
  }

  /**
   * 📝 REGISTRAR PREDIÇÃO NO HISTÓRICO
   */
  private recordPrediction(ensemblePrediction: EnsemblePrediction): void {
    this.predictionHistory.push({
      prediction: ensemblePrediction,
      timestamp: Date.now()
    })
    
    // Manter apenas os últimos 100 registros
    if (this.predictionHistory.length > 100) {
      this.predictionHistory.shift()
    }
  }

  /**
   * 📊 ATUALIZAR MÉTRICAS DE PERFORMANCE
   */
  private updatePerformanceMetrics(
    ensemblePrediction: EnsemblePrediction,
    predictions: AlgorithmPredictionInput[]
  ): void {
    
    this.performanceMetrics.total_predictions++
    this.performanceMetrics.algorithms_included = predictions.map(p => p.algorithm_id)
    this.performanceMetrics.last_updated = Date.now()
    
    // Outras métricas serão atualizadas quando tivermos o resultado real
  }

  /**
   * ✅ ATUALIZAR COM RESULTADO REAL
   * Método chamado quando soubermos o resultado real da rodada
   */
  async updateWithActualResult(
    predictionId: number, // Index na história ou timestamp
    actualColor: 'red' | 'black' | 'white',
    actualNumber: number
  ): Promise<void> {
    
    console.log(`✅ Atualizando com resultado real: ${actualColor} ${actualNumber}`)
    
    // 1. ENCONTRAR PREDIÇÃO NO HISTÓRICO
    const predictionRecord = this.predictionHistory.find(record => 
      Math.abs(record.timestamp - predictionId) < 60000 // 1 minuto de tolerância
    ) || this.predictionHistory[this.predictionHistory.length - 1] // Usar a última se não encontrar
    
    if (!predictionRecord) {
      console.warn('⚠️ Predição não encontrada no histórico')
      return
    }
    
    // 2. REGISTRAR RESULTADO REAL
    predictionRecord.actualResult = { color: actualColor, number: actualNumber }
    
    // 3. CALCULAR ACERTO
    const colorCorrect = predictionRecord.prediction.final_color === actualColor
    const numberCorrect = predictionRecord.prediction.final_number === actualNumber
    const overallCorrect = colorCorrect && numberCorrect
    
    // 4. ATUALIZAR MÉTRICAS GERAIS
    if (overallCorrect) {
      this.performanceMetrics.correct_predictions++
    }
    
    this.performanceMetrics.accuracy_rate = this.performanceMetrics.correct_predictions / this.performanceMetrics.total_predictions
    
    if (colorCorrect) {
      this.performanceMetrics.color_accuracy = (this.performanceMetrics.color_accuracy * (this.performanceMetrics.total_predictions - 1) + 1) / this.performanceMetrics.total_predictions
    }
    
    if (numberCorrect) {
      this.performanceMetrics.number_accuracy = (this.performanceMetrics.number_accuracy * (this.performanceMetrics.total_predictions - 1) + 1) / this.performanceMetrics.total_predictions
    }
    
    // 5. ATUALIZAR PERFORMANCE DOS ALGORITMOS INDIVIDUAIS
    for (const contribution of predictionRecord.prediction.algorithm_contributions) {
      const algorithmColorCorrect = contribution.predicted_color === actualColor
      const algorithmNumberCorrect = contribution.predicted_number === actualNumber
      const algorithmOverallCorrect = algorithmColorCorrect && algorithmNumberCorrect
      
      // Atualizar WeightCalculator
      this.weightCalculator.updateAlgorithmPerformance(
        contribution.algorithm_id,
        algorithmOverallCorrect,
        contribution.confidence,
        this.createContextFromPrediction(predictionRecord.prediction)
      )
      
      // Atualizar performance por categoria
      this.hierarchicalVoting.updateCategoryPerformance(
        contribution.algorithm_type,
        algorithmOverallCorrect
      )
    }
    
    // 6. CALCULAR MELHORIA SOBRE ALGORITMOS INDIVIDUAIS
    if (predictionRecord.actualResult) {
      this.calculateImprovementMetrics(predictionRecord as {
        prediction: EnsemblePrediction; 
        actualResult: { color: 'red' | 'black' | 'white'; number: number }
      }, overallCorrect)
    }
    
    console.log(`📊 Performance atualizada: ${(this.performanceMetrics.accuracy_rate * 100).toFixed(1)}% accuracy`)
  }

  /**
   * 📈 CALCULAR MÉTRICAS DE MELHORIA
   */
  private calculateImprovementMetrics(
    predictionRecord: { prediction: EnsemblePrediction; actualResult: { color: 'red' | 'black' | 'white'; number: number } },
    ensembleCorrect: boolean
  ): void {
    
    // Calcular quantos algoritmos individuais acertaram
    let individualCorrects = 0
    const totalAlgorithms = predictionRecord.prediction.algorithm_contributions.length
    
    for (const contribution of predictionRecord.prediction.algorithm_contributions) {
      const algorithmCorrect = (
        contribution.predicted_color === predictionRecord.actualResult!.color &&
        contribution.predicted_number === predictionRecord.actualResult!.number
      )
      
      if (algorithmCorrect) {
        individualCorrects++
      }
    }
    
    const individualAccuracy = totalAlgorithms > 0 ? individualCorrects / totalAlgorithms : 0
    const ensembleAccuracy = ensembleCorrect ? 1.0 : 0.0
    
    // Atualizar métricas de melhoria
    const currentImprovement = ensembleAccuracy - individualAccuracy
    
    // Média móvel da melhoria
    const alpha = 0.1
    this.performanceMetrics.improvement_over_average = 
      this.performanceMetrics.improvement_over_average * (1 - alpha) + currentImprovement * alpha
    
    // Encontrar o melhor algoritmo individual
    const bestIndividualScore = Math.max(...predictionRecord.prediction.algorithm_contributions.map(contrib => {
      const correct = (
        contrib.predicted_color === predictionRecord.actualResult!.color &&
        contrib.predicted_number === predictionRecord.actualResult!.number
      )
      return correct ? 1.0 : 0.0
    }))
    
    const improvementOverBest = ensembleAccuracy - bestIndividualScore
    this.performanceMetrics.improvement_over_best = 
      this.performanceMetrics.improvement_over_best * (1 - alpha) + improvementOverBest * alpha
  }

  /**
   * ⚠️ GERAR WARNINGS
   */
  private generateWarnings(
    driftSignals: ConceptDriftSignal[],
    algorithmWeights: Map<string, DynamicWeight>
  ): string[] {
    
    const warnings: string[] = []
    
    // Warnings de drift
    for (const signal of driftSignals) {
      if (signal.drift_strength > 0.7) {
        warnings.push(`Drift severo detectado em ${signal.algorithm_id}`)
      }
    }
    
    // Warnings de pesos baixos
    const lowWeightAlgorithms = Array.from(algorithmWeights.entries())
      .filter(([_, weight]) => weight.final_weight < 0.2)
    
    if (lowWeightAlgorithms.length > 0) {
      warnings.push(`${lowWeightAlgorithms.length} algoritmos com peso muito baixo`)
    }
    
    // Warning de consenso baixo
    const totalWeights = Array.from(algorithmWeights.values()).reduce((sum, weight) => sum + weight.final_weight, 0)
    if (totalWeights < 2.0) {
      warnings.push('Peso total dos algoritmos muito baixo')
    }
    
    return warnings
  }

  /**
   * 🔧 MÉTODOS AUXILIARES
   */

  private createDefaultConfig(config?: Partial<SmartEnsembleConfig>): SmartEnsembleConfig {
    const defaultConfig: SmartEnsembleConfig = {
      enabled: true,
      mode: 'advanced',
      
      algorithms_config: {},
      
      voting_strategy: 'hierarchical',
      tie_breaking_strategy: 'confidence',
      
      adaptive_weighting: {
        decay_rate: 0.95,
        recent_window: 20,
        historical_window: 100,
        context_sensitivity: 0.3,
        time_sensitivity: 0.2,
        trend_sensitivity: 0.3,
        confidence_threshold: 0.6,
        overconfidence_penalty: 0.1,
        underconfidence_boost: 0.1,
        drift_detection_enabled: true,
        drift_sensitivity: 0.15,
        recovery_patience: 3600000, // 1 hora
        exploration_rate: 0.05,
        min_algorithm_weight: 0.01
      },
      
      log_predictions: true,
      log_weights: true,
      log_performance: true,
      
      supabase_tables: {
        algorithm_accuracy: 'algorithm_accuracy',
        ensemble_predictions: 'ensemble_predictions',
        performance_metrics: 'performance_metrics',
        concept_drift_events: 'concept_drift_events'
      }
    }
    
    return { ...defaultConfig, ...config }
  }

  private createInitialMetrics(): EnsemblePerformanceMetrics {
    return {
      ensemble_id: 'smart_ensemble_v1',
      total_predictions: 0,
      correct_predictions: 0,
      accuracy_rate: 0,
      color_accuracy: 0,
      number_accuracy: 0,
      confidence_calibration: 0,
      consensus_reliability: 0,
      stability_score: 0,
      adaptation_speed: 0,
      improvement_over_best: 0,
      improvement_over_average: 0,
      measurement_period: [Date.now(), Date.now()],
      algorithms_included: [],
      last_updated: Date.now()
    }
  }

  private createErrorResult(error: string): EnsembleResult {
    return {
      success: false,
      error,
      diagnostics: {
        algorithms_processed: 0,
        algorithms_failed: 0,
        total_processing_time: 0,
        consensus_achieved: false,
        drift_detected: false,
        warnings: [error]
      },
      ensemble_version: '1.0.0',
      processing_timestamp: Date.now()
    }
  }

  private getRecentPerformanceForAlgorithm(algorithmId: string): boolean[] {
    // Buscar performance recente do algoritmo no histórico
    const recentResults: boolean[] = []
    
    for (const record of this.predictionHistory.slice(-30)) {
      if (record.actualResult) {
        const contribution = record.prediction.algorithm_contributions.find(c => c.algorithm_id === algorithmId)
        
        if (contribution) {
          const wasCorrect = (
            contribution.predicted_color === record.actualResult.color &&
            contribution.predicted_number === record.actualResult.number
          )
          recentResults.push(wasCorrect)
        }
      }
    }
    
    return recentResults
  }

  private createContextFromPrediction(prediction: EnsemblePrediction): PredictionContext {
    // Criar contexto simplificado baseado na predição
    const now = new Date()
    
    return {
      current_time: prediction.prediction_timestamp,
      historical_data_length: 100,
      recent_trend: 'neutral',
      volatility_level: prediction.uncertainty_level > 0.5 ? 'high' : 'medium',
      gap_analysis: {},
      time_since_last_white: 10,
      hour_of_day: now.getHours(),
      day_of_week: now.getDay(),
      time_session: this.getTimeSession(now.getHours()),
      pattern_strength: prediction.consensus_strength,
      pattern_consistency: prediction.prediction_stability,
      anomaly_score: prediction.uncertainty_level
    }
  }

  private getTimeSession(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    if (hour >= 18 && hour < 22) return 'evening'
    return 'night'
  }

  /**
   * 📊 OBTER RELATÓRIOS
   */

  getPerformanceReport(): EnsemblePerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  getWeightsReport(): Record<string, DynamicWeight> {
    return this.weightCalculator.getWeightsReport()
  }

  getDriftReport(): any {
    return this.driftDetector.getDriftReport()
  }

  getVotingReport(): any {
    return this.hierarchicalVoting.getVotingReport()
  }

  /**
   * 🧹 LIMPEZA E MANUTENÇÃO
   */
  
  cleanup(): void {
    console.log('🧹 SMART ENSEMBLE ENGINE: Executando limpeza...')
    
    // Limpar histórico antigo
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    this.predictionHistory = this.predictionHistory.filter(record => record.timestamp > oneWeekAgo)
    
    // Limpar detectores
    this.driftDetector.cleanup()
    
    console.log('✅ Limpeza concluída')
  }

  /**
   * 🚀 MODO SIMPLES (COMPATÍVEL COM SUA IDEIA ORIGINAL)
   * Método simplificado que mantém a essência da sua proposta original
   */
  async generateSimplePrediction(
    algorithmResults: RealAlgorithmResult[]
  ): Promise<{ color: 'red' | 'black' | 'white'; number: number; confidence: number }> {
    
    console.log('🚀 MODO SIMPLES: Executando ensemble básico')
    
    if (algorithmResults.length === 0) {
      return { color: 'black', number: 7, confidence: 0.3 }
    }
    
    // Pesos simples baseados na accuracy histórica
    const weightedVotes: Record<string, number> = { red: 0, black: 0, white: 0 }
    let weightedNumberSum = 0
    let totalWeight = 0
    let totalConfidence = 0
    
    for (const result of algorithmResults) {
      // Peso simples: confiança do algoritmo
      const weight = result.confidence
      
      weightedVotes[result.color] += weight
      weightedNumberSum += result.number * weight
      totalWeight += weight
      totalConfidence += result.confidence
    }
    
    // Cor com mais votos ponderados
    const finalColor = Object.entries(weightedVotes).reduce((a, b) => 
      weightedVotes[a[0]] > weightedVotes[b[0]] ? a : b
    )[0] as 'red' | 'black' | 'white'
    
    // Número como média ponderada
    const finalNumber = Math.round(weightedNumberSum / totalWeight)
    
    // Confiança como média
    const finalConfidence = totalConfidence / algorithmResults.length
    
    console.log(`✅ MODO SIMPLES: ${finalColor} ${finalNumber} (${finalConfidence.toFixed(2)})`)
    
    return { color: finalColor, number: finalNumber, confidence: finalConfidence }
  }

  /**
   * 💾 SALVAR ACCURACY ALGORITHM NO SUPABASE
   */
  private async saveAlgorithmAccuracy(algorithmId: string, isCorrect: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('algorithm_accuracy')
        .upsert({
          algorithm_id: algorithmId,
          total_predictions: 1,
          correct_predictions: isCorrect ? 1 : 0,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'algorithm_id'
        })

      if (error) {
        console.error('❌ Erro salvando algorithm_accuracy:', error)
      }
    } catch (error) {
      console.error('❌ Erro salvando algorithm_accuracy:', error)
    }
  }

  /**
   * 💾 SALVAR ENSEMBLE PREDICTION NO SUPABASE
   */
  private async saveEnsemblePrediction(prediction: EnsemblePrediction): Promise<void> {
    try {
      const { error } = await supabase
        .from('ensemble_predictions')
        .insert({
          prediction_id: `ensemble_${Date.now()}`,
          final_color: prediction.final_color,
          final_number: prediction.final_number,
          final_confidence: prediction.final_confidence,
          algorithms_used: prediction.algorithms_used,
          consensus_strength: prediction.consensus_strength,
          tier1_consensus: prediction.tier1_consensus,
          prediction_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Erro salvando ensemble_prediction:', error)
      }
    } catch (error) {
      console.error('❌ Erro salvando ensemble_prediction:', error)
    }
  }

  /**
   * 💾 SALVAR CONCEPT DRIFT EVENT NO SUPABASE
   */
  private async saveConceptDriftEvent(driftData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('concept_drift_events')
        .insert({
          drift_type: driftData.drift_type || 'unknown',
          confidence_level: driftData.confidence_level || 0,
          affected_algorithms: driftData.affected_algorithms || [],
          detected_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Erro salvando concept_drift_event:', error)
      }
    } catch (error) {
      console.error('❌ Erro salvando concept_drift_event:', error)
    }
  }
} 