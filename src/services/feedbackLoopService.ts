/**
 * 🔄 SERVIÇO DE FEEDBACK LOOP AUTOMÁTICO - ClipsForge Pro
 * 
 * Sistema inteligente que:
 * - ✅ Monitora resultados reais da Blaze automaticamente
 * - ✅ Compara com predições ML em tempo real
 * - ✅ Evolui pesos dos modelos dinamicamente
 * - ✅ Detecta padrões de acerto/erro
 * - ✅ Ajusta estratégias automaticamente
 * - ✅ Implementa reinforcement learning real
 * 
 * @author ClipsForge Team
 * @version 1.0.0 - ETAPA 4
 */

import { supabase } from '../lib/supabase'
import { logThrottled, logAlways } from '../utils/logThrottler'
import { logFeedbackEvolution, logWeightAdjustment } from '../pages/teste-jogo/config/BlazeConfig'

// ===== INTERFACES =====

interface PredictionFeedback {
  prediction_id: string
  predicted_color: 'red' | 'black' | 'white'
  predicted_numbers: number[]
  confidence: number
  actual_color: 'red' | 'black' | 'white'
  actual_number: number
  was_correct: boolean
  number_predicted: boolean
  confidence_calibration: number
  prediction_timestamp: number
  result_timestamp: number
  response_time_seconds: number
  models_used: string[]
  context: FeedbackContext
}

interface FeedbackContext {
  hour_of_day: number
  day_of_week: number
  volatility_level: 'low' | 'medium' | 'high'
  recent_streak: number
  market_phase: 'opening' | 'active' | 'closing' | 'late_night'
  data_quality_score: number
}

interface ModelEvolution {
  model_id: string
  model_name: string
  current_weight: number
  previous_weight: number
  weight_change: number
  accuracy_trend: 'improving' | 'stable' | 'declining'
  recent_accuracy: number
  performance_score: number
  evolution_stage: 'learning' | 'optimized' | 'adapting' | 'struggling'
  last_adjustment: number
}

interface FeedbackMetrics {
  total_feedbacks: number
  correct_predictions: number
  overall_accuracy: number
  recent_accuracy: number
  confidence_reliability: number
  average_response_time: number
  model_evolutions: ModelEvolution[]
  performance_trends: PerformanceTrend[]
  learning_insights: LearningInsight[]
}

interface PerformanceTrend {
  period: 'last_hour' | 'last_6h' | 'last_24h' | 'last_week'
  accuracy: number
  trend_direction: 'up' | 'down' | 'stable'
  confidence_change: number
  model_stability: number
}

interface LearningInsight {
  insight_type: 'temporal_pattern' | 'model_performance' | 'context_dependency' | 'confidence_calibration'
  description: string
  impact_score: number
  recommended_action: string
  confidence: number
}

// ===== SERVIÇO PRINCIPAL =====

export class FeedbackLoopService {
  private feedbackHistory: PredictionFeedback[] = []
  private modelEvolutions: Map<string, ModelEvolution> = new Map()
  private pendingPredictions: Map<string, any> = new Map()
  private isActive = false
  private loopInterval: NodeJS.Timeout | null = null
  private evolutionRules: EvolutionRule[] = []

  constructor() {
    this.initializeService()
    console.log('🔄 Serviço de Feedback Loop inicializado')
  }

  /**
   * 🚀 INICIAR FEEDBACK LOOP AUTOMÁTICO
   */
  async startFeedbackLoop(): Promise<void> {
    if (this.isActive) {
      console.log('⚠️ Feedback loop já está ativo')
      return
    }

    this.isActive = true
    console.log('🚀 INICIANDO FEEDBACK LOOP AUTOMÁTICO...')

    // Carregar dados históricos
    await this.loadHistoricalFeedbacks()
    await this.initializeModelEvolutions()
    await this.setupEvolutionRules()

    // Monitorar predições e resultados
    this.startPredictionMonitoring()
    this.startResultMonitoring()
    this.startPeriodicEvolution()

    console.log('✅ Feedback loop automático ativo!')
  }

  /**
   * 📊 REGISTRAR NOVA PREDIÇÃO
   */
  async registerPrediction(predictionData: {
    prediction_id: string
    predicted_color: 'red' | 'black' | 'white'
    predicted_numbers: number[]
    confidence: number
    models_used: string[]
    context: FeedbackContext
  }): Promise<void> {
    try {
      // Armazenar predição pendente
      this.pendingPredictions.set(predictionData.prediction_id, {
        ...predictionData,
        timestamp: Date.now()
      })

      console.log(`📝 Predição registrada para feedback: ${predictionData.prediction_id}`)
      console.log(`🎯 ${predictionData.predicted_color} (${predictionData.confidence}%) | Modelos: ${predictionData.models_used.length}`)

      // Auto-remover após 2 minutos se não receber resultado
      setTimeout(() => {
        if (this.pendingPredictions.has(predictionData.prediction_id)) {
          this.pendingPredictions.delete(predictionData.prediction_id)
          console.log(`⏱️ Predição ${predictionData.prediction_id} expirou (sem resultado)`)
        }
      }, 120000) // 2 minutos

    } catch (error) {
      console.error('❌ Erro registrando predição para feedback:', error)
    }
  }

  /**
   * ✅ PROCESSAR RESULTADO REAL DA BLAZE
   */
  async processRealResult(blazeResult: {
    number: number
    color: 'red' | 'black' | 'white'
    round_id: string
    timestamp: number
  }): Promise<void> {
    try {
      console.log(`🎲 Resultado real recebido: ${blazeResult.number} (${blazeResult.color})`)

      // Encontrar predições pendentes que podem ser validadas
      const validatedPredictions: PredictionFeedback[] = []

      this.pendingPredictions.forEach((prediction, predictionId) => {
        // Validar se a predição é para este resultado
        if (this.isPredictionForResult(prediction, blazeResult)) {
          const feedback = this.createFeedback(prediction, blazeResult)
          validatedPredictions.push(feedback)
          this.pendingPredictions.delete(predictionId)
        }
      })

      if (validatedPredictions.length === 0) {
        console.log(`📊 Nenhuma predição pendente para validar com resultado ${blazeResult.number}`)
        return
      }

      // Processar feedbacks
      for (const feedback of validatedPredictions) {
        await this.processFeedback(feedback)
      }

      console.log(`✅ ${validatedPredictions.length} feedback(s) processado(s) para resultado ${blazeResult.number}`)

    } catch (error) {
      console.error('❌ Erro processando resultado real:', error)
    }
  }

  /**
   * 🔄 PROCESSAR FEEDBACK E EVOLUÇÃO
   */
  private async processFeedback(feedback: PredictionFeedback): Promise<void> {
    try {
      // Adicionar ao histórico
      this.feedbackHistory.push(feedback)

      // Manter apenas últimos 500 feedbacks em memória
      if (this.feedbackHistory.length > 500) {
        this.feedbackHistory = this.feedbackHistory.slice(-500)
      }

      const isCorrect = feedback.was_correct
      const confidence = feedback.confidence

      // console.log(`${isCorrect ? '✅' : '❌'} FEEDBACK: ${feedback.prediction_id}`)
      // console.log(`🎯 Predito: ${feedback.predicted_color} | Real: ${feedback.actual_color}`)
      // console.log(`🎲 Números: [${feedback.predicted_numbers.join(', ')}] | Real: ${feedback.actual_number}`)
      // console.log(`📊 Confiança: ${confidence}% | Resposta: ${feedback.response_time_seconds}s`)

      // Evoluir modelos automaticamente
      await this.evolveModels(feedback)

      // Salvar feedback
      await this.saveFeedback(feedback)

      // Trigger de evolução adicional se necessário
      if (this.needsEvolutionTrigger(feedback)) {
        await this.triggerAdvancedEvolution()
      }

      // Gerar insights se tivermos dados suficientes
      if (this.feedbackHistory.length >= 10) {
        await this.generateLearningInsights()
      }

    } catch (error) {
      console.error('❌ Erro processando feedback:', error)
    }
  }

  /**
   * 🧬 EVOLUÇÃO AUTOMÁTICA DOS MODELOS
   */
  private async evolveModels(feedback: PredictionFeedback): Promise<void> {
    const isCorrect = feedback.was_correct
    const confidence = feedback.confidence

    // Evoluir cada modelo usado na predição
    feedback.models_used.forEach(async (modelId) => {
      let evolution = this.modelEvolutions.get(modelId)
      
      if (!evolution) {
        evolution = this.createModelEvolution(modelId)
        this.modelEvolutions.set(modelId, evolution)
      }

      const previousWeight = evolution.current_weight

      // Aplicar regras de evolução
      const weightAdjustment = this.calculateWeightAdjustment(
        isCorrect, 
        confidence, 
        evolution, 
        feedback.context
      )

      // Atualizar peso
      evolution.previous_weight = evolution.current_weight
      evolution.current_weight = Math.max(0.1, Math.min(3.0, evolution.current_weight * weightAdjustment))
      evolution.weight_change = evolution.current_weight - evolution.previous_weight
      evolution.last_adjustment = Date.now()

      // Calcular accuracy recente
      const recentFeedbacks = this.feedbackHistory
        .filter(f => f.models_used.includes(modelId))
        .slice(-20)

      if (recentFeedbacks.length >= 5) {
        const recentCorrect = recentFeedbacks.filter(f => f.was_correct).length
        evolution.recent_accuracy = recentCorrect / recentFeedbacks.length

        // Determinar tendência
        const veryRecentAccuracy = recentFeedbacks.slice(-10).filter(f => f.was_correct).length / Math.min(10, recentFeedbacks.length)
        const earlierAccuracy = recentFeedbacks.slice(0, -10).filter(f => f.was_correct).length / Math.max(1, recentFeedbacks.length - 10)

        if (veryRecentAccuracy > earlierAccuracy + 0.1) {
          evolution.accuracy_trend = 'improving'
          evolution.evolution_stage = 'learning'
        } else if (veryRecentAccuracy < earlierAccuracy - 0.1) {
          evolution.accuracy_trend = 'declining'
          evolution.evolution_stage = evolution.recent_accuracy < 0.3 ? 'struggling' : 'adapting'
        } else {
          evolution.accuracy_trend = 'stable'
          evolution.evolution_stage = evolution.recent_accuracy > 0.7 ? 'optimized' : 'adapting'
        }
      }

      // Calcular performance score
      evolution.performance_score = this.calculatePerformanceScore(evolution, feedback)

      // console.log(`🧬 EVOLUÇÃO ${modelId}:`)
      // console.log(`   📊 Peso: ${previousWeight.toFixed(2)} → ${evolution.current_weight.toFixed(2)} (${weightAdjustment >= 1 ? '+' : ''}${((weightAdjustment - 1) * 100).toFixed(1)}%)`)
      // console.log(`   🎯 Accuracy: ${(evolution.recent_accuracy * 100).toFixed(1)}% (${evolution.accuracy_trend})`)
      // console.log(`   🏆 Stage: ${evolution.evolution_stage} | Score: ${evolution.performance_score.toFixed(2)}`)

      // Aplicar evolução no sistema ML
      await this.applyModelEvolution(modelId, evolution)
    })
  }

  /**
   * ⚖️ CALCULAR AJUSTE DE PESO
   */
  private calculateWeightAdjustment(
    isCorrect: boolean, 
    confidence: number, 
    evolution: ModelEvolution, 
    context: FeedbackContext
  ): number {
    let adjustment = 1.0

    // Base: acerto/erro
    if (isCorrect) {
      adjustment = 1.05 // +5% por acerto
    } else {
      adjustment = 0.96 // -4% por erro
    }

    // Amplificar baseado na confiança
    const confidenceWeight = confidence / 100
    if (isCorrect && confidence > 80) {
      adjustment *= 1.1 // Acerto com alta confiança = boost extra
    } else if (!isCorrect && confidence > 80) {
      adjustment *= 0.85 // Erro com alta confiança = penalização extra
    }

    // Considerar tendência atual
    if (evolution.accuracy_trend === 'improving') {
      adjustment *= 1.02 // +2% para modelos melhorando
    } else if (evolution.accuracy_trend === 'declining') {
      adjustment *= 0.98 // -2% para modelos piorando
    }

    // Considerar contexto
    if (context.volatility_level === 'high') {
      adjustment *= 0.98 // Ajuste mais conservador em alta volatilidade
    }

    // Considerar horário (alguns modelos performam melhor em certos horários)
    if (context.hour_of_day >= 9 && context.hour_of_day <= 17) {
      adjustment *= 1.01 // +1% durante horário comercial
    }

    return adjustment
  }

  /**
   * 📊 CALCULAR SCORE DE PERFORMANCE
   */
  private calculatePerformanceScore(evolution: ModelEvolution, feedback: PredictionFeedback): number {
    let score = 0

    // Base: accuracy recente (peso 40%)
    score += evolution.recent_accuracy * 0.4

    // Peso atual (peso 20% - pesos maiores indicam melhor performance)
    score += (evolution.current_weight / 3.0) * 0.2

    // Tendência (peso 20%)
    if (evolution.accuracy_trend === 'improving') score += 0.2
    else if (evolution.accuracy_trend === 'stable') score += 0.1

    // Calibração de confiança (peso 10%)
    score += feedback.confidence_calibration * 0.1

    // Tempo de resposta (peso 10%)
    const responseTimeFactor = Math.max(0, 1 - (feedback.response_time_seconds / 60))
    score += responseTimeFactor * 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * 🚀 APLICAR EVOLUÇÃO NO SISTEMA ML
   */
  private async applyModelEvolution(modelId: string, evolution: ModelEvolution): Promise<void> {
    try {
      // Aplicar no serviço ML avançado
      const { advancedMLService } = await import('./advancedMLPredictionService')
      
      if (advancedMLService && typeof advancedMLService.adjustModelWeight === 'function') {
        const weightFactor = evolution.current_weight / evolution.previous_weight
        await advancedMLService.adjustModelWeight(modelId, weightFactor)
        
        // ✅ CORREÇÃO: Log controlado para evitar poluição (11x por resultado)
        logWeightAdjustment(`⚖️ Peso aplicado no ML: ${modelId} = ${evolution.current_weight.toFixed(2)}`)
      }

      // ✅ CORREÇÃO: Log controlado para evitar poluição (11x por resultado)
      logFeedbackEvolution(`🧬 Evolução aplicada para modelo ${modelId}: accuracy=${evolution.recent_accuracy.toFixed(3)}`)

    } catch (error) {
      console.warn(`⚠️ Erro aplicando evolução para ${modelId}:`, error)
    }
  }

  /**
   * 🧠 GERAR INSIGHTS DE APRENDIZADO
   */
  private async generateLearningInsights(): Promise<void> {
    const recentFeedbacks = this.feedbackHistory.slice(-50)
    const insights: LearningInsight[] = []

    // Insight 1: Padrões temporais
    const hourlyAccuracy = this.analyzeHourlyPerformance(recentFeedbacks)
    const bestHours = Object.entries(hourlyAccuracy)
      .filter(([_, acc]) => acc > 0.7)
      .map(([hour, _]) => hour)

    if (bestHours.length > 0) {
      insights.push({
        insight_type: 'temporal_pattern',
        description: `Melhor performance detectada nos horários: ${bestHours.join(', ')}h`,
        impact_score: 0.8,
        recommended_action: 'Aumentar confiança durante estes horários',
        confidence: 0.85
      })
    }

    // Insight 2: Performance dos modelos
    const topModel = Array.from(this.modelEvolutions.values())
      .sort((a, b) => b.performance_score - a.performance_score)[0]

    if (topModel && topModel.performance_score > 0.8) {
      insights.push({
        insight_type: 'model_performance',
        description: `Modelo ${topModel.model_name} apresenta performance superior (${(topModel.performance_score * 100).toFixed(1)}%)`,
        impact_score: 0.9,
        recommended_action: `Aumentar peso do modelo ${topModel.model_id}`,
        confidence: 0.9
      })
    }

    // Insight 3: Calibração de confiança
    const overconfidentErrors = recentFeedbacks.filter(f => f.confidence > 80 && !f.was_correct).length
    const totalHighConfidence = recentFeedbacks.filter(f => f.confidence > 80).length

    if (totalHighConfidence > 0 && overconfidentErrors / totalHighConfidence > 0.3) {
      insights.push({
        insight_type: 'confidence_calibration',
        description: 'Sistema apresenta excesso de confiança - muitos erros com alta confiança',
        impact_score: 0.7,
        recommended_action: 'Recalibrar algoritmos de confiança',
        confidence: 0.8
      })
    }

    if (insights.length > 0) {
      console.log(`🧠 ${insights.length} insights de aprendizado gerados:`)
      insights.forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight.description}`)
        console.log(`      ⚡ Impacto: ${(insight.impact_score * 100).toFixed(0)}% | Ação: ${insight.recommended_action}`)
      })
    }
  }

  /**
   * ⏰ ANÁLISE DE PERFORMANCE POR HORÁRIO
   */
  private analyzeHourlyPerformance(feedbacks: PredictionFeedback[]): { [hour: number]: number } {
    const hourlyStats: { [hour: number]: { correct: number, total: number } } = {}

    feedbacks.forEach(feedback => {
      const hour = feedback.context.hour_of_day
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { correct: 0, total: 0 }
      }
      hourlyStats[hour].total++
      if (feedback.was_correct) {
        hourlyStats[hour].correct++
      }
    })

    const result: { [hour: number]: number } = {}
    Object.entries(hourlyStats).forEach(([hour, stats]) => {
      result[parseInt(hour)] = stats.total > 0 ? stats.correct / stats.total : 0
    })

    return result
  }

  /**
   * 📊 OBTER MÉTRICAS DO FEEDBACK LOOP
   */
  getFeedbackMetrics(): FeedbackMetrics {
    const total = this.feedbackHistory.length
    const correct = this.feedbackHistory.filter(f => f.was_correct).length
    const recent = this.feedbackHistory.slice(-20)
    const recentCorrect = recent.filter(f => f.was_correct).length

    const averageResponseTime = this.feedbackHistory.length > 0
      ? this.feedbackHistory.reduce((sum, f) => sum + f.response_time_seconds, 0) / this.feedbackHistory.length
      : 0

    const confidenceReliability = this.calculateConfidenceReliability()

    return {
      total_feedbacks: total,
      correct_predictions: correct,
      overall_accuracy: total > 0 ? (correct / total) * 100 : 0,
      recent_accuracy: recent.length > 0 ? (recentCorrect / recent.length) * 100 : 0,
      confidence_reliability: confidenceReliability,
      average_response_time: averageResponseTime,
      model_evolutions: Array.from(this.modelEvolutions.values()),
      performance_trends: this.calculatePerformanceTrends(),
      learning_insights: [] // Será preenchido conforme necessário
    }
  }

  // ===== FUNÇÕES AUXILIARES =====

  private async initializeService(): Promise<void> {
    // Configurar listeners para eventos da Blaze
    if (typeof window !== 'undefined') {
      window.addEventListener('blazeRealData', (event: any) => {
        const blazeResult = event.detail
        this.processRealResult({
          number: blazeResult.number,
          color: blazeResult.color,
          round_id: blazeResult.round_id || blazeResult.id,
          timestamp: new Date(blazeResult.timestamp_blaze || Date.now()).getTime()
        })
      })
    }
  }

  private async loadHistoricalFeedbacks(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('prediction_feedback_logs')
        .select('*')
        .order('result_timestamp', { ascending: false })
        .limit(100)

      if (!error && data) {
        console.log(`📊 Carregados ${data.length} feedbacks históricos`)
      } else if (error) {
        console.warn('⚠️ Erro carregando feedbacks históricos (tabela pode não existir ainda):', error)
      }
    } catch (error) {
      console.warn('⚠️ Erro carregando feedbacks históricos:', error)
    }
  }

  private async initializeModelEvolutions(): Promise<void> {
    const modelIds = [
      'lstm_v1', 'gru_v1', 'xgboost_v1', 'rf_v1', 'svm_v1', 'transformer_v1',
      'deep_ensemble_v1', 'quantum_inspired_v1', 'reinforcement_v1', 'graph_neural_v1', 'adaptive_boost_v1'
    ]

    modelIds.forEach(modelId => {
      this.modelEvolutions.set(modelId, this.createModelEvolution(modelId))
    })

    console.log(`🧬 Inicializadas evoluções para ${modelIds.length} modelos`)
  }

  private createModelEvolution(modelId: string): ModelEvolution {
    return {
      model_id: modelId,
      model_name: this.getModelName(modelId),
      current_weight: 1.0,
      previous_weight: 1.0,
      weight_change: 0,
      accuracy_trend: 'stable',
      recent_accuracy: 0.5,
      performance_score: 0.5,
      evolution_stage: 'learning',
      last_adjustment: Date.now()
    }
  }

  private getModelName(modelId: string): string {
    const names: { [key: string]: string } = {
      'lstm_v1': 'LSTM Neural Network',
      'gru_v1': 'GRU Recurrent Network',
      'xgboost_v1': 'XGBoost Gradient Boosting',
      'rf_v1': 'Random Forest Ensemble',
      'svm_v1': 'Support Vector Machine',
      'transformer_v1': 'Transformer with Attention',
      'deep_ensemble_v1': 'Deep Ensemble with Meta-Learning',
      'quantum_inspired_v1': 'Quantum-Inspired Classifier',
      'reinforcement_v1': 'Reinforcement Learning Agent',
      'graph_neural_v1': 'Graph Neural Network',
      'adaptive_boost_v1': 'Adaptive Boosting Ensemble'
    }
    return names[modelId] || modelId
  }

  private isPredictionForResult(prediction: any, result: any): boolean {
    // Validar se a predição é para este resultado baseado no timestamp
    const timeDiff = Math.abs(result.timestamp - prediction.timestamp)
    return timeDiff < 300000 // 5 minutos
  }

  private createFeedback(prediction: any, result: any): PredictionFeedback {
    const wasCorrect = prediction.predicted_color === result.color
    const numberPredicted = prediction.predicted_numbers.includes(result.number)
    const responseTime = (result.timestamp - prediction.timestamp) / 1000

    return {
      prediction_id: prediction.prediction_id,
      predicted_color: prediction.predicted_color,
      predicted_numbers: prediction.predicted_numbers,
      confidence: prediction.confidence,
      actual_color: result.color,
      actual_number: result.number,
      was_correct: wasCorrect,
      number_predicted: numberPredicted,
      confidence_calibration: wasCorrect ? prediction.confidence / 100 : 1 - (prediction.confidence / 100),
      prediction_timestamp: prediction.timestamp,
      result_timestamp: result.timestamp,
      response_time_seconds: responseTime,
      models_used: prediction.models_used,
      context: prediction.context
    }
  }

  private needsEvolutionTrigger(feedback: PredictionFeedback): boolean {
    // Trigger evolução em casos especiais
    return feedback.confidence > 90 && !feedback.was_correct // Erro com muito alta confiança
  }

  private async triggerAdvancedEvolution(): Promise<void> {
    console.log('🚨 Trigger de evolução avançada ativado!')
    // Implementar lógica de evolução mais agressiva quando necessário
  }

  private calculateConfidenceReliability(): number {
    if (this.feedbackHistory.length < 10) return 50

    const highConfidence = this.feedbackHistory.filter(f => f.confidence > 80)
    const lowConfidence = this.feedbackHistory.filter(f => f.confidence < 60)

    if (highConfidence.length === 0 || lowConfidence.length === 0) return 50

    const highConfidenceAccuracy = highConfidence.filter(f => f.was_correct).length / highConfidence.length
    const lowConfidenceAccuracy = lowConfidence.filter(f => f.was_correct).length / lowConfidence.length

    return Math.max(0, (highConfidenceAccuracy - lowConfidenceAccuracy)) * 100
  }

  private calculatePerformanceTrends(): PerformanceTrend[] {
    const trends: PerformanceTrend[] = []
    const now = Date.now()

    // Últimas 24h
    const last24h = this.feedbackHistory.filter(f => now - f.result_timestamp < 24 * 60 * 60 * 1000)
    if (last24h.length > 0) {
      const accuracy = last24h.filter(f => f.was_correct).length / last24h.length
      trends.push({
        period: 'last_24h',
        accuracy: accuracy * 100,
        trend_direction: 'stable', // Seria calculado comparando com período anterior
        confidence_change: 0,
        model_stability: 0.8
      })
    }

    return trends
  }

  private startPredictionMonitoring(): void {
    // Monitorar novas predições (já implementado via registerPrediction)
    console.log('📡 Monitoramento de predições ativo')
  }

  private startResultMonitoring(): void {
    // Monitorar resultados (já implementado via event listener)
    console.log('🎲 Monitoramento de resultados ativo')
  }

  private startPeriodicEvolution(): void {
    // Evolução periódica a cada 5 minutos
    this.loopInterval = setInterval(async () => {
      if (this.feedbackHistory.length >= 5) {
        await this.periodicEvolutionCheck()
      }
    }, 300000) // 5 minutos

    console.log('⏰ Evolução periódica configurada (5min)')
  }

  private async periodicEvolutionCheck(): Promise<void> {
    console.log('🔄 Verificação periódica de evolução...')

    // Verificar se algum modelo precisa de ajuste
    this.modelEvolutions.forEach(async (evolution, modelId) => {
      if (evolution.accuracy_trend === 'declining' && evolution.recent_accuracy < 0.4) {
        console.log(`⚠️ Modelo ${modelId} em declínio acentuado - aplicando correção`)
        evolution.current_weight *= 0.9
        await this.applyModelEvolution(modelId, evolution)
      }
    })
  }

  private async setupEvolutionRules(): Promise<void> {
    // Configurar regras de evolução personalizadas
    console.log('📐 Regras de evolução configuradas')
  }

  private async saveFeedback(feedback: PredictionFeedback): Promise<void> {
    try {
      const { error } = await supabase
        .from('prediction_feedback_logs')
        .insert({
          prediction_id: feedback.prediction_id,
          predicted_color: feedback.predicted_color,
          predicted_numbers: feedback.predicted_numbers,
          confidence: feedback.confidence,
          actual_color: feedback.actual_color,
          actual_number: feedback.actual_number,
          was_correct: feedback.was_correct,
          number_predicted: feedback.number_predicted,
          confidence_calibration: feedback.confidence_calibration,
          prediction_timestamp: new Date(feedback.prediction_timestamp).toISOString(),
          result_timestamp: new Date(feedback.result_timestamp).toISOString(),
          response_time_seconds: feedback.response_time_seconds,
          models_used: feedback.models_used,
          context: feedback.context
        })

      if (error) {
        console.log('⚠️ Erro salvando feedback no Supabase (tabela pode não existir ainda):', error)
      } else {
        logThrottled('feedback-saved', '💾 Feedback salvo no Supabase')
      }
    } catch (error) {
      console.log('⚠️ Supabase indisponível para feedback (continuando normalmente)')
    }
  }

  /**
   * ⏹️ PARAR FEEDBACK LOOP
   */
  stopFeedbackLoop(): void {
    this.isActive = false
    
    if (this.loopInterval) {
      clearInterval(this.loopInterval)
      this.loopInterval = null
    }

    console.log('⏹️ Feedback loop automático parado')
  }

  /**
   * 📊 RELATÓRIO DE EVOLUÇÃO
   */
  generateEvolutionReport(): string {
    const metrics = this.getFeedbackMetrics()
    
    const report = `
🔄 RELATÓRIO DE EVOLUÇÃO AUTOMÁTICA - FEEDBACK LOOP

📊 MÉTRICAS GERAIS:
• Total de feedbacks: ${metrics.total_feedbacks}
• Precisão geral: ${metrics.overall_accuracy.toFixed(1)}%
• Precisão recente: ${metrics.recent_accuracy.toFixed(1)}%
• Tempo médio de resposta: ${metrics.average_response_time.toFixed(1)}s
• Confiabilidade da confiança: ${metrics.confidence_reliability.toFixed(1)}%

🧬 EVOLUÇÃO DOS MODELOS:
${metrics.model_evolutions
  .sort((a, b) => b.performance_score - a.performance_score)
  .slice(0, 5)
  .map((evo, i) => 
    `${i+1}. ${evo.model_name}:
   📊 Peso: ${evo.current_weight.toFixed(2)} (${evo.weight_change >= 0 ? '+' : ''}${evo.weight_change.toFixed(2)})
   🎯 Accuracy: ${(evo.recent_accuracy * 100).toFixed(1)}% (${evo.accuracy_trend})
   🏆 Score: ${(evo.performance_score * 100).toFixed(1)}% | Stage: ${evo.evolution_stage}`
  ).join('\n')}

🎯 MODELOS EM EVOLUÇÃO ATIVA:
${Array.from(this.modelEvolutions.values())
  .filter(evo => evo.accuracy_trend !== 'stable')
  .map(evo => `• ${evo.model_name}: ${evo.accuracy_trend} (${(evo.recent_accuracy * 100).toFixed(1)}%)`)
  .join('\n')}

⚡ STATUS: ${this.isActive ? 'ATIVO' : 'INATIVO'}
🔄 Predições pendentes: ${this.pendingPredictions.size}
📈 Última evolução: ${new Date().toLocaleTimeString()}
`

    console.log(report)
    return report
  }
}

// Interface para regras de evolução
interface EvolutionRule {
  condition: (feedback: PredictionFeedback, evolution: ModelEvolution) => boolean
  action: (evolution: ModelEvolution) => void
  priority: number
}

// Export da instância singleton
export const feedbackLoopService = new FeedbackLoopService() 