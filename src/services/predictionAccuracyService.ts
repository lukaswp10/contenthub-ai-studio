/**
 * 📊 SERVIÇO DE MONITORAMENTO DE PRECISÃO - ClipsForge Pro
 * 
 * Sistema inteligente que:
 * - ✅ Monitora precisão das predições em tempo real
 * - ✅ Aprende com erros e acertos
 * - ✅ Ajusta pesos dos modelos dinamicamente
 * - ✅ Detecta padrões de performance
 * - ✅ Otimização contínua baseada em feedback
 * - ✅ Análise de contexto temporal
 * 
 * @author ClipsForge Team
 * @version 2.0.0
 */

import { supabase } from '../lib/supabase'

// ===== INTERFACES =====

interface PredictionRecord {
  id: string
  timestamp: number
  predicted_color: 'red' | 'black' | 'white'
  predicted_numbers: number[]
  confidence: number
  actual_color?: 'red' | 'black' | 'white'
  actual_number?: number
  was_correct?: boolean
  models_used: string[]
  feature_scores: { [key: string]: number }
  context: PredictionContext
}

interface PredictionContext {
  hour_of_day: number
  day_of_week: number
  volatility_level: 'low' | 'medium' | 'high'
  recent_streak: number
  data_quality: number
  market_conditions: string
}

interface ModelPerformanceMetrics {
  model_id: string
  model_name: string
  total_predictions: number
  correct_predictions: number
  accuracy_rate: number
  confidence_calibration: number
  best_contexts: string[]
  worst_contexts: string[]
  trend_direction: 'improving' | 'stable' | 'declining'
  last_updated: number
}

interface AccuracyInsights {
  overall_accuracy: number
  recent_accuracy: number
  accuracy_by_hour: { [hour: number]: number }
  accuracy_by_day: { [day: number]: number }
  accuracy_by_volatility: { [level: string]: number }
  best_performing_models: ModelPerformanceMetrics[]
  improvement_suggestions: string[]
  confidence_reliability: number
  pattern_discoveries: PatternDiscovery[]
}

interface PatternDiscovery {
  pattern_type: 'temporal' | 'volatility' | 'streak' | 'cyclical'
  description: string
  confidence: number
  impact_on_accuracy: number
  recommended_action: string
}

// ===== SERVIÇO PRINCIPAL =====

export class PredictionAccuracyService {
  private predictionHistory: PredictionRecord[] = []
  private modelMetrics: Map<string, ModelPerformanceMetrics> = new Map()
  private learningRate = 0.1
  private isLearning = false

  constructor() {
    this.initializeService()
    console.log('📊 Serviço de Monitoramento de Precisão inicializado')
  }

  /**
   * 📝 REGISTRAR NOVA PREDIÇÃO
   */
  async registerPrediction(
    predicted_color: 'red' | 'black' | 'white',
    predicted_numbers: number[],
    confidence: number,
    models_used: string[],
    feature_scores: { [key: string]: number },
    context: PredictionContext
  ): Promise<string> {
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const record: PredictionRecord = {
      id: predictionId,
      timestamp: Date.now(),
      predicted_color,
      predicted_numbers,
      confidence,
      models_used,
      feature_scores,
      context
    }

    // Armazenar em memória
    this.predictionHistory.push(record)

    // Manter apenas últimas 1000 predições em memória
    if (this.predictionHistory.length > 1000) {
      this.predictionHistory = this.predictionHistory.slice(-1000)
    }

    // Salvar no banco
    try {
      await this.savePredictionRecord(record)
      console.log(`📝 Predição registrada: ${predictionId} - ${predicted_color} (${confidence}%)`)
    } catch (error) {
      console.warn('⚠️ Erro salvando predição:', error)
    }

    return predictionId
  }

  /**
   * ✅ CONFIRMAR RESULTADO REAL
   */
  async confirmResult(
    predictionId: string,
    actual_color: 'red' | 'black' | 'white',
    actual_number: number
  ): Promise<void> {
    try {
      // Encontrar predição
      const prediction = this.predictionHistory.find(p => p.id === predictionId)
      
      if (!prediction) {
        console.warn(`⚠️ Predição ${predictionId} não encontrada`)
        return
      }

      // Atualizar resultado
      prediction.actual_color = actual_color
      prediction.actual_number = actual_number
      prediction.was_correct = prediction.predicted_color === actual_color

      const isCorrect = prediction.was_correct
      const colorMatch = prediction.predicted_color === actual_color
      const numberMatch = prediction.predicted_numbers.includes(actual_number)

      console.log(`${isCorrect ? '✅' : '❌'} Resultado confirmado: ${predictionId}`)
      console.log(`🎯 Predito: ${prediction.predicted_color} | Real: ${actual_color}`)
      console.log(`🔢 Números preditos: [${prediction.predicted_numbers.join(', ')}] | Real: ${actual_number}`)
      console.log(`📊 Confiança: ${prediction.confidence}% | Acerto: ${isCorrect ? 'SIM' : 'NÃO'}`)

      // Atualizar métricas dos modelos
      await this.updateModelMetrics(prediction)

      // Aprender com o resultado
      await this.learnFromResult(prediction)

      // Salvar atualização
      await this.updatePredictionRecord(prediction)

      // Gerar insights se temos dados suficientes
      if (this.predictionHistory.length >= 20) {
        await this.generateInsights()
      }

    } catch (error) {
      console.error('❌ Erro confirmando resultado:', error)
    }
  }

  /**
   * 📈 OBTER MÉTRICAS ATUAIS
   */
  getCurrentMetrics(): {
    total_predictions: number
    correct_predictions: number
    overall_accuracy: number
    recent_accuracy: number
    confidence_avg: number
    top_models: ModelPerformanceMetrics[]
  } {
    const total = this.predictionHistory.length
    const withResults = this.predictionHistory.filter(p => p.was_correct !== undefined)
    const correct = withResults.filter(p => p.was_correct).length
    
    // Últimas 20 predições
    const recent = withResults.slice(-20)
    const recentCorrect = recent.filter(p => p.was_correct).length

    const overall_accuracy = withResults.length > 0 ? (correct / withResults.length) * 100 : 0
    const recent_accuracy = recent.length > 0 ? (recentCorrect / recent.length) * 100 : 0
    const confidence_avg = total > 0 ? this.predictionHistory.reduce((sum, p) => sum + p.confidence, 0) / total : 0

    // Top 3 modelos
    const top_models = Array.from(this.modelMetrics.values())
      .sort((a, b) => b.accuracy_rate - a.accuracy_rate)
      .slice(0, 3)

    return {
      total_predictions: total,
      correct_predictions: correct,
      overall_accuracy: Math.round(overall_accuracy * 100) / 100,
      recent_accuracy: Math.round(recent_accuracy * 100) / 100,
      confidence_avg: Math.round(confidence_avg * 100) / 100,
      top_models
    }
  }

  /**
   * 🧠 APRENDER COM RESULTADO
   */
  private async learnFromResult(prediction: PredictionRecord): Promise<void> {
    if (this.isLearning) return
    
    this.isLearning = true

    try {
      // Analisar erro se predição incorreta
      if (!prediction.was_correct) {
        await this.analyzeError(prediction)
      }

      // Analisar contexto de sucesso
      if (prediction.was_correct) {
        await this.analyzeSuccess(prediction)
      }

      // Detectar padrões temporais
      await this.detectTemporalPatterns()

      // Ajustar pesos baseado no feedback
      await this.adjustModelWeights(prediction)

    } catch (error) {
      console.error('❌ Erro no aprendizado:', error)
    } finally {
      this.isLearning = false
    }
  }

  /**
   * 🔍 ANALISAR ERRO
   */
  private async analyzeError(prediction: PredictionRecord): Promise<void> {
    console.log('🔍 Analisando erro para aprendizado...')

    // Identificar contexto do erro
    const context = prediction.context
    const errorFactors: string[] = []

    // Verificar se foi erro de alta confiança (mais grave)
    if (prediction.confidence > 80) {
      errorFactors.push('high_confidence_error')
      console.log('⚠️ Erro com alta confiança detectado - ajuste necessário')
    }

    // Analisar contexto temporal
    if (context.hour_of_day >= 0 && context.hour_of_day <= 6) {
      errorFactors.push('late_night_error')
    }

    // Analisar volatilidade
    if (context.volatility_level === 'high') {
      errorFactors.push('high_volatility_error')
    }

    // Analisar streak
    if (context.recent_streak > 5) {
      errorFactors.push('long_streak_error')
    }

    // Salvar análise do erro
    await this.saveErrorAnalysis(prediction.id, errorFactors)
  }

  /**
   * ✅ ANALISAR SUCESSO
   */
  private async analyzeSuccess(prediction: PredictionRecord): Promise<void> {
    console.log('✅ Analisando sucesso para reforço...')

    const context = prediction.context
    const successFactors: string[] = []

    // Identificar fatores de sucesso
    if (prediction.confidence > 75) {
      successFactors.push('high_confidence_success')
    }

    if (context.volatility_level === 'low') {
      successFactors.push('low_volatility_success')
    }

    if (context.data_quality > 0.8) {
      successFactors.push('high_quality_data_success')
    }

    // Reforçar padrões bem-sucedidos
    prediction.models_used.forEach(modelId => {
      const metrics = this.modelMetrics.get(modelId)
      if (metrics) {
        metrics.best_contexts = [...new Set([...metrics.best_contexts, ...successFactors])]
      }
    })

    await this.saveSuccessAnalysis(prediction.id, successFactors)
  }

  /**
   * 📊 DETECTAR PADRÕES TEMPORAIS
   */
  private async detectTemporalPatterns(): Promise<void> {
    const withResults = this.predictionHistory.filter(p => p.was_correct !== undefined)
    if (withResults.length < 10) return

    // Analisar padrões por hora
    const hourlyAccuracy: { [hour: number]: { correct: number; total: number } } = {}
    
    withResults.forEach(p => {
      const hour = p.context.hour_of_day
      if (!hourlyAccuracy[hour]) {
        hourlyAccuracy[hour] = { correct: 0, total: 0 }
      }
      hourlyAccuracy[hour].total++
      if (p.was_correct) hourlyAccuracy[hour].correct++
    })

    // Identificar melhores/piores horários
    const hourlyRates = Object.entries(hourlyAccuracy).map(([hour, stats]) => ({
      hour: parseInt(hour),
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
      sample_size: stats.total
    })).filter(h => h.sample_size >= 3) // Apenas horas com dados suficientes

    const bestHours = hourlyRates
      .filter(h => h.accuracy > 0.6)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3)

    const worstHours = hourlyRates
      .filter(h => h.accuracy < 0.4)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3)

    if (bestHours.length > 0) {
      console.log('🎯 Melhores horários detectados:', bestHours.map(h => `${h.hour}h (${(h.accuracy * 100).toFixed(1)}%)`))
    }

    if (worstHours.length > 0) {
      console.log('⚠️ Horários problemáticos detectados:', worstHours.map(h => `${h.hour}h (${(h.accuracy * 100).toFixed(1)}%)`))
    }
  }

  /**
   * ⚖️ AJUSTAR PESOS DOS MODELOS
   */
  private async adjustModelWeights(prediction: PredictionRecord): Promise<void> {
    const isCorrect = prediction.was_correct
    const confidenceWeight = prediction.confidence / 100

    prediction.models_used.forEach(modelId => {
      const metrics = this.modelMetrics.get(modelId)
      if (!metrics) return

      // Ajustar taxa de precisão com média móvel
      const oldAccuracy = metrics.accuracy_rate
      const newResult = isCorrect ? 1 : 0
      const newAccuracy = (1 - this.learningRate) * oldAccuracy + this.learningRate * newResult

      metrics.accuracy_rate = newAccuracy
      metrics.total_predictions++
      if (isCorrect) metrics.correct_predictions++

      // Calcular tendência
      const recentPredictions = this.predictionHistory
        .filter(p => p.models_used.includes(modelId) && p.was_correct !== undefined)
        .slice(-10)

      if (recentPredictions.length >= 5) {
        const recentAccuracy = recentPredictions.filter(p => p.was_correct).length / recentPredictions.length
        
        if (recentAccuracy > oldAccuracy + 0.1) {
          metrics.trend_direction = 'improving'
        } else if (recentAccuracy < oldAccuracy - 0.1) {
          metrics.trend_direction = 'declining'
        } else {
          metrics.trend_direction = 'stable'
        }
      }

      metrics.last_updated = Date.now()

      console.log(`📊 Modelo ${metrics.model_name}: accuracy=${(newAccuracy * 100).toFixed(1)}% (${metrics.trend_direction})`)
    })
  }

  /**
   * 🔮 GERAR INSIGHTS
   */
  private async generateInsights(): Promise<AccuracyInsights> {
    const withResults = this.predictionHistory.filter(p => p.was_correct !== undefined)
    
    if (withResults.length < 10) {
      return this.getDefaultInsights()
    }

    // Calcular métricas gerais
    const overall_accuracy = withResults.filter(p => p.was_correct).length / withResults.length
    const recent_accuracy = withResults.slice(-20).filter(p => p.was_correct).length / Math.min(withResults.length, 20)

    // Análise por contexto
    const accuracy_by_hour = this.calculateAccuracyByHour(withResults)
    const accuracy_by_day = this.calculateAccuracyByDay(withResults)
    const accuracy_by_volatility = this.calculateAccuracyByVolatility(withResults)

    // Modelos de melhor performance
    const best_performing_models = Array.from(this.modelMetrics.values())
      .sort((a, b) => b.accuracy_rate - a.accuracy_rate)
      .slice(0, 5)

    // Sugestões de melhoria
    const improvement_suggestions = this.generateImprovementSuggestions(withResults)

    // Descobertas de padrões
    const pattern_discoveries = this.discoverPatterns(withResults)

    // Confiabilidade da confiança
    const confidence_reliability = this.calculateConfidenceReliability(withResults)

    const insights: AccuracyInsights = {
      overall_accuracy: overall_accuracy * 100,
      recent_accuracy: recent_accuracy * 100,
      accuracy_by_hour,
      accuracy_by_day,
      accuracy_by_volatility,
      best_performing_models,
      improvement_suggestions,
      confidence_reliability,
      pattern_discoveries
    }

    console.log('🧠 Insights gerados:', {
      overall: `${(overall_accuracy * 100).toFixed(1)}%`,
      recent: `${(recent_accuracy * 100).toFixed(1)}%`,
      patterns: pattern_discoveries.length,
      suggestions: improvement_suggestions.length
    })

    return insights
  }

  // ===== FUNÇÕES AUXILIARES =====

  private async initializeService(): Promise<void> {
    // Carregar histórico do banco se disponível
    try {
      await this.loadHistoricalData()
      await this.initializeModelMetrics()
    } catch (error) {
      console.warn('⚠️ Erro inicializando serviço de precisão:', error)
    }
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('prediction_accuracy_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (!error && data) {
        console.log(`📊 Carregados ${data.length} registros históricos de precisão`)
      }
    } catch (error) {
      console.warn('⚠️ Erro carregando dados históricos:', error)
    }
  }

  private async initializeModelMetrics(): Promise<void> {
    const modelIds = ['lstm_v1', 'gru_v1', 'xgboost_v1', 'rf_v1', 'svm_v1', 'transformer_v1']
    
    modelIds.forEach(id => {
      this.modelMetrics.set(id, {
        model_id: id,
        model_name: this.getModelName(id),
        total_predictions: 0,
        correct_predictions: 0,
        accuracy_rate: 0.5, // Começar neutro
        confidence_calibration: 0.5,
        best_contexts: [],
        worst_contexts: [],
        trend_direction: 'stable',
        last_updated: Date.now()
      })
    })
  }

  private getModelName(id: string): string {
    const names: { [key: string]: string } = {
      'lstm_v1': 'LSTM Neural Network',
      'gru_v1': 'GRU Recurrent Network',
      'xgboost_v1': 'XGBoost Gradient Boosting',
      'rf_v1': 'Random Forest Ensemble',
      'svm_v1': 'Support Vector Machine',
      'transformer_v1': 'Transformer with Attention'
    }
    return names[id] || id
  }

  private calculateAccuracyByHour(predictions: PredictionRecord[]): { [hour: number]: number } {
    const hourlyStats: { [hour: number]: { correct: number; total: number } } = {}
    
    predictions.forEach(p => {
      const hour = p.context.hour_of_day
      if (!hourlyStats[hour]) hourlyStats[hour] = { correct: 0, total: 0 }
      hourlyStats[hour].total++
      if (p.was_correct) hourlyStats[hour].correct++
    })

    const result: { [hour: number]: number } = {}
    Object.entries(hourlyStats).forEach(([hour, stats]) => {
      result[parseInt(hour)] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })

    return result
  }

  private calculateAccuracyByDay(predictions: PredictionRecord[]): { [day: number]: number } {
    const dailyStats: { [day: number]: { correct: number; total: number } } = {}
    
    predictions.forEach(p => {
      const day = p.context.day_of_week
      if (!dailyStats[day]) dailyStats[day] = { correct: 0, total: 0 }
      dailyStats[day].total++
      if (p.was_correct) dailyStats[day].correct++
    })

    const result: { [day: number]: number } = {}
    Object.entries(dailyStats).forEach(([day, stats]) => {
      result[parseInt(day)] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })

    return result
  }

  private calculateAccuracyByVolatility(predictions: PredictionRecord[]): { [level: string]: number } {
    const volatilityStats: { [level: string]: { correct: number; total: number } } = {}
    
    predictions.forEach(p => {
      const level = p.context.volatility_level
      if (!volatilityStats[level]) volatilityStats[level] = { correct: 0, total: 0 }
      volatilityStats[level].total++
      if (p.was_correct) volatilityStats[level].correct++
    })

    const result: { [level: string]: number } = {}
    Object.entries(volatilityStats).forEach(([level, stats]) => {
      result[level] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })

    return result
  }

  private generateImprovementSuggestions(predictions: PredictionRecord[]): string[] {
    const suggestions: string[] = []
    
    // Analisar horários problemáticos
    const hourlyAccuracy = this.calculateAccuracyByHour(predictions)
    const worstHours = Object.entries(hourlyAccuracy)
      .filter(([_, acc]) => acc < 40)
      .map(([hour, _]) => parseInt(hour))

    if (worstHours.length > 0) {
      suggestions.push(`Evitar predições nos horários: ${worstHours.join(', ')}h (baixa precisão)`)
    }

    // Analisar volatilidade
    const volatilityAccuracy = this.calculateAccuracyByVolatility(predictions)
    if (volatilityAccuracy.high < 30) {
      suggestions.push('Reduzir confiança durante alta volatilidade')
    }

    // Analisar confiança vs precisão
    const highConfidenceErrors = predictions.filter(p => 
      p.confidence > 80 && p.was_correct === false
    ).length

    if (highConfidenceErrors > predictions.length * 0.1) {
      suggestions.push('Calibrar melhor a confiança dos modelos')
    }

    return suggestions
  }

  private discoverPatterns(predictions: PredictionRecord[]): PatternDiscovery[] {
    const patterns: PatternDiscovery[] = []

    // Padrão temporal
    const hourlyAccuracy = this.calculateAccuracyByHour(predictions)
    const bestHour = Object.entries(hourlyAccuracy).reduce((a, b) => 
      hourlyAccuracy[parseInt(a[0])] > hourlyAccuracy[parseInt(b[0])] ? a : b
    )

    if (parseFloat(bestHour[1]) > 60) {
      patterns.push({
        pattern_type: 'temporal',
        description: `Melhor performance às ${bestHour[0]}h (${bestHour[1].toFixed(1)}% precisão)`,
        confidence: 0.8,
        impact_on_accuracy: parseFloat(bestHour[1]) - 50,
        recommended_action: `Priorizar predições às ${bestHour[0]}h`
      })
    }

    // Padrão de volatilidade
    const volatilityAccuracy = this.calculateAccuracyByVolatility(predictions)
    if (volatilityAccuracy.low > volatilityAccuracy.high + 20) {
      patterns.push({
        pattern_type: 'volatility',
        description: `Baixa volatilidade melhora precisão em ${(volatilityAccuracy.low - volatilityAccuracy.high).toFixed(1)}%`,
        confidence: 0.9,
        impact_on_accuracy: volatilityAccuracy.low - volatilityAccuracy.high,
        recommended_action: 'Aguardar períodos de baixa volatilidade'
      })
    }

    return patterns
  }

  private calculateConfidenceReliability(predictions: PredictionRecord[]): number {
    // Calcular se predições com alta confiança são realmente mais precisas
    const highConfidence = predictions.filter(p => p.confidence > 80)
    const lowConfidence = predictions.filter(p => p.confidence < 60)

    if (highConfidence.length === 0 || lowConfidence.length === 0) return 0.5

    const highConfidenceAccuracy = highConfidence.filter(p => p.was_correct).length / highConfidence.length
    const lowConfidenceAccuracy = lowConfidence.filter(p => p.was_correct).length / lowConfidence.length

    // Confiabilidade = quão bem a confiança prediz a precisão
    const reliability = Math.max(0, highConfidenceAccuracy - lowConfidenceAccuracy)
    return Math.min(reliability * 100, 100)
  }

  private getDefaultInsights(): AccuracyInsights {
    return {
      overall_accuracy: 0,
      recent_accuracy: 0,
      accuracy_by_hour: {},
      accuracy_by_day: {},
      accuracy_by_volatility: {},
      best_performing_models: [],
      improvement_suggestions: ['Coletar mais dados para análise'],
      confidence_reliability: 0,
      pattern_discoveries: []
    }
  }

  private async savePredictionRecord(record: PredictionRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('prediction_accuracy_logs')
        .insert({
          prediction_id: record.id,
          timestamp: new Date(record.timestamp).toISOString(),
          predicted_color: record.predicted_color,
          predicted_numbers: record.predicted_numbers,
          confidence: record.confidence,
          models_used: record.models_used,
          feature_scores: record.feature_scores,
          context: record.context
        })

      if (error) throw error
    } catch (error) {
      console.warn('⚠️ Erro salvando registro:', error)
    }
  }

  private async updatePredictionRecord(record: PredictionRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('prediction_accuracy_logs')
        .update({
          actual_color: record.actual_color,
          actual_number: record.actual_number,
          was_correct: record.was_correct
        })
        .eq('prediction_id', record.id)

      if (error) throw error
    } catch (error) {
      console.warn('⚠️ Erro atualizando registro:', error)
    }
  }

  private async saveErrorAnalysis(predictionId: string, factors: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_analysis_logs')
        .insert({
          prediction_id: predictionId,
          error_factors: factors,
          timestamp: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.warn('⚠️ Erro salvando análise de erro:', error)
    }
  }

  private async saveSuccessAnalysis(predictionId: string, factors: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('success_analysis_logs')
        .insert({
          prediction_id: predictionId,
          success_factors: factors,
          timestamp: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.warn('⚠️ Erro salvando análise de sucesso:', error)
    }
  }

  /**
   * 📈 RELATÓRIO COMPLETO DE PERFORMANCE
   */
  async generatePerformanceReport(): Promise<string> {
    const metrics = this.getCurrentMetrics()
    const insights = await this.generateInsights()

    const report = `
📊 RELATÓRIO DE PERFORMANCE - SISTEMA ML AVANÇADO

🎯 MÉTRICAS GERAIS:
• Total de predições: ${metrics.total_predictions}
• Predições corretas: ${metrics.correct_predictions}
• Precisão geral: ${metrics.overall_accuracy}%
• Precisão recente (20): ${metrics.recent_accuracy}%
• Confiança média: ${metrics.confidence_avg}%

🤖 TOP MODELOS:
${metrics.top_models.map((model, i) => 
  `${i+1}. ${model.model_name}: ${(model.accuracy_rate * 100).toFixed(1)}% (${model.trend_direction})`
).join('\n')}

⏰ PADRÕES TEMPORAIS:
${Object.entries(insights.accuracy_by_hour)
  .filter(([_, acc]) => acc > 0)
  .sort(([_, a], [__, b]) => b - a)
  .slice(0, 3)
  .map(([hour, acc]) => `• ${hour}h: ${acc.toFixed(1)}%`)
  .join('\n')}

🔮 DESCOBERTAS:
${insights.pattern_discoveries.map(p => 
  `• ${p.description} (impacto: +${p.impact_on_accuracy.toFixed(1)}%)`
).join('\n')}

💡 SUGESTÕES:
${insights.improvement_suggestions.map(s => `• ${s}`).join('\n')}

🎚️ CONFIABILIDADE: ${insights.confidence_reliability.toFixed(1)}%
`

    console.log(report)
    return report
  }
}

// Export da instância singleton
export const predictionAccuracyService = new PredictionAccuracyService() 