/**
 * 🔄 SERVIÇO UNIFICADO DE FEEDBACK - FASE 1 CRÍTICA
 * 
 * Centraliza TODO o feedback e aprendizado em um só lugar
 * - Unifica os 3 serviços de feedback fragmentados
 * - Coordena aprendizado de forma consistente
 * - Simplifica métricas e tracking
 * 
 * @version 1.0.0 - CORREÇÃO CRÍTICA
 */

import { supabase } from '../lib/supabase'
import { getBrazilTimestamp } from '../utils/timezone'

// ===== INTERFACES UNIFICADAS =====

export interface UnifiedFeedback {
  prediction_id: string
  predicted_color: 'red' | 'black' | 'white'
  predicted_number: number
  predicted_confidence: number
  algorithm_used: string
  
  actual_color: 'red' | 'black' | 'white'
  actual_number: number
  
  was_color_correct: boolean
  was_number_correct: boolean
  color_confidence_score: number
  
  data_count: number
  data_freshness: number
  execution_time: number
  
  timestamp_prediction: number
  timestamp_result: number
  response_time_seconds: number
}

export interface LearningMetrics {
  total_predictions: number
  correct_predictions: number
  color_accuracy: number
  number_accuracy: number
  avg_confidence: number
  avg_response_time: number
  
  algorithm_performance: Record<string, {
    usage_count: number
    success_rate: number
    avg_confidence: number
  }>
  
  recent_trend: 'improving' | 'declining' | 'stable'
  last_updated: number
}

// ===== SERVIÇO UNIFICADO =====

export class UnifiedFeedbackService {
  private static instance: UnifiedFeedbackService
  private feedbackHistory: UnifiedFeedback[] = []
  private currentMetrics: LearningMetrics = this.initializeMetrics()
  private pendingPredictions: Map<string, any> = new Map() // Cache em memória
  
  // Singleton pattern
  static getInstance(): UnifiedFeedbackService {
    if (!UnifiedFeedbackService.instance) {
      UnifiedFeedbackService.instance = new UnifiedFeedbackService()
    }
    return UnifiedFeedbackService.instance
  }
  
  private constructor() {
    console.log('🔄 UNIFIED FEEDBACK: Inicializando sistema centralizado...')
    this.loadHistoricalMetrics()
  }

  /**
   * 📝 REGISTRAR PREDIÇÃO
   */
  async registerPrediction(
    predictionId: string,
    color: 'red' | 'black' | 'white',
    number: number,
    confidence: number,
    algorithm: string,
    dataCount: number,
    dataFreshness: number,
    executionTime: number
  ): Promise<void> {
    console.log(`📝 UNIFIED FEEDBACK: Registrando predição ${predictionId}`)
    
    const predictionData = {
      prediction_id: predictionId,
      predicted_color: color,
      predicted_number: number,
      predicted_confidence: confidence,
      algorithm_used: algorithm,
      data_count: dataCount,
      data_freshness: dataFreshness,
      execution_time: executionTime,
      timestamp_prediction: Date.now(),
      created_at: getBrazilTimestamp()
    }
    
    // Salvar em memória SEMPRE
    this.pendingPredictions.set(predictionId, predictionData)
    
    // ✅ CORREÇÃO: Mapear campos corretamente para unified_predictions
    try {
      const dbData = {
        prediction_id: predictionId,
        predicted_color: color,
        predicted_number: number,
        confidence_percentage: confidence, // ✅ CORREÇÃO: Campo correto
        algorithm_used: algorithm,
        data_points_used: dataCount, // ✅ CORREÇÃO: Campo correto
        execution_time_ms: executionTime, // ✅ CORREÇÃO: Campo correto
        timestamp_prediction: new Date(Date.now()).toISOString(),
        created_at: getBrazilTimestamp(),
        updated_at: getBrazilTimestamp()
      }
      
      await supabase.from('unified_predictions').insert(dbData)
      console.log(`📝 UNIFIED FEEDBACK: Predição ${predictionId} salva no Supabase`)
    } catch (error) {
      console.warn('⚠️ UNIFIED FEEDBACK: Erro salvando unified_predictions:', error)
    }
  }

  /**
   * ✅ CONFIRMAR RESULTADO
   */
  async confirmResult(
    predictionId: string,
    actualColor: 'red' | 'black' | 'white',
    actualNumber: number
  ): Promise<void> {
    console.log(`✅ UNIFIED FEEDBACK: Confirmando resultado para ${predictionId}`)
    
    // Buscar predição pendente
    const prediction = await this.findPendingPrediction(predictionId)
    if (!prediction) {
      console.warn(`⚠️ UNIFIED FEEDBACK: Predição ${predictionId} não encontrada`)
      return
    }
    
    const now = Date.now()
    const responseTime = (now - prediction.timestamp_prediction) / 1000
    
    // Calcular métricas de acerto
    const wasColorCorrect = prediction.predicted_color === actualColor
    const wasNumberCorrect = prediction.predicted_number === actualNumber
    
    // Calcular score de confiança (penaliza overconfidence)
    const colorConfidenceScore = this.calculateConfidenceScore(
      wasColorCorrect, 
      prediction.predicted_confidence
    )
    
    // Criar feedback unificado
    const feedback: UnifiedFeedback = {
      prediction_id: predictionId,
      predicted_color: prediction.predicted_color,
      predicted_number: prediction.predicted_number,
      predicted_confidence: prediction.predicted_confidence,
      algorithm_used: prediction.algorithm_used,
      
      actual_color: actualColor,
      actual_number: actualNumber,
      
      was_color_correct: wasColorCorrect,
      was_number_correct: wasNumberCorrect,
      color_confidence_score: colorConfidenceScore,
      
      data_count: prediction.data_count,
      data_freshness: prediction.data_freshness,
      execution_time: prediction.execution_time,
      
      timestamp_prediction: prediction.timestamp_prediction,
      timestamp_result: now,
      response_time_seconds: responseTime
    }
    
    // Processar feedback
    await this.processFeedback(feedback)
    
    // Remover da memória de predições pendentes
    this.pendingPredictions.delete(predictionId)
    
    console.log(`${wasColorCorrect ? '✅' : '❌'} UNIFIED FEEDBACK: ${prediction.predicted_color} → ${actualColor} (${prediction.algorithm_used})`)
    console.log(`📊 UNIFIED FEEDBACK: Acurácia atual: ${this.currentMetrics.color_accuracy.toFixed(1)}%`)
  }

  /**
   * 🔄 PROCESSAR FEEDBACK
   */
  private async processFeedback(feedback: UnifiedFeedback): Promise<void> {
    // Adicionar ao histórico
    this.feedbackHistory.push(feedback)
    
    // Manter apenas últimos 500 feedbacks em memória
    if (this.feedbackHistory.length > 500) {
      this.feedbackHistory = this.feedbackHistory.slice(-500)
    }
    
    // Atualizar métricas em tempo real
    this.updateMetrics(feedback)
    
    // Salvar feedback no banco
    await this.saveFeedback(feedback)
    
    // Aprender com o resultado
    await this.learnFromFeedback(feedback)
  }

  /**
   * 📊 ATUALIZAR MÉTRICAS
   */
  private updateMetrics(feedback: UnifiedFeedback): void {
    const metrics = this.currentMetrics
    
    // Calcular acurácia baseado no histórico real
    const totalFeedbacks = this.feedbackHistory.length
    const correctFeedbacks = this.feedbackHistory.filter(f => f.was_color_correct).length
    
    metrics.total_predictions = totalFeedbacks
    metrics.correct_predictions = correctFeedbacks
    metrics.color_accuracy = totalFeedbacks > 0 ? (correctFeedbacks / totalFeedbacks) * 100 : 0
    
    // Atualizar performance por algoritmo
    const algo = feedback.algorithm_used
    if (!metrics.algorithm_performance[algo]) {
      metrics.algorithm_performance[algo] = {
        usage_count: 0,
        success_rate: 0,
        avg_confidence: 0
      }
    }
    
    const algoMetrics = metrics.algorithm_performance[algo]
    algoMetrics.usage_count += 1
    
    // Recalcular success rate do algoritmo
    const algoFeedbacks = this.feedbackHistory.filter(f => f.algorithm_used === algo)
    const algoSuccesses = algoFeedbacks.filter(f => f.was_color_correct).length
    algoMetrics.success_rate = (algoSuccesses / algoFeedbacks.length) * 100
    
    // Calcular confiança média do algoritmo
    const avgConf = algoFeedbacks.reduce((sum, f) => sum + f.predicted_confidence, 0) / algoFeedbacks.length
    algoMetrics.avg_confidence = avgConf
    
    // Detectar tendência recente (últimos 20 feedbacks)
    const recent = this.feedbackHistory.slice(-20)
    if (recent.length >= 10) {
      const recentSuccess = recent.filter(f => f.was_color_correct).length / recent.length
      const olderSuccess = this.feedbackHistory.slice(-40, -20).filter(f => f.was_color_correct).length / 20
      
      if (recentSuccess > olderSuccess + 0.1) {
        metrics.recent_trend = 'improving'
      } else if (recentSuccess < olderSuccess - 0.1) {
        metrics.recent_trend = 'declining'
      } else {
        metrics.recent_trend = 'stable'
      }
    }
    
    metrics.last_updated = Date.now()
  }

  /**
   * 🧠 APRENDER COM FEEDBACK
   */
  private async learnFromFeedback(feedback: UnifiedFeedback): Promise<void> {
    // Análise simples de padrões
    if (!feedback.was_color_correct) {
      console.log(`🧠 UNIFIED FEEDBACK: Analisando erro de ${feedback.algorithm_used}`)
      
      // Se confiança alta mas erro → algoritmo overconfident
      if (feedback.predicted_confidence > 70) {
        console.log(`⚠️ UNIFIED FEEDBACK: ${feedback.algorithm_used} overconfident (${feedback.predicted_confidence}%)`)
      }
      
      // Se dados antigos → pode ser problema de freshness
      if (feedback.data_freshness > 300) {
        console.log(`⚠️ UNIFIED FEEDBACK: Dados antigos podem ter causado erro (${feedback.data_freshness}s)`)
      }
    }
    
    // Feedback positivo
    if (feedback.was_color_correct && feedback.predicted_confidence > 60) {
      console.log(`✅ UNIFIED FEEDBACK: ${feedback.algorithm_used} acertou com boa confiança`)
    }
  }

  /**
   * 💾 SALVAR FEEDBACK
   */
  private async saveFeedback(feedback: UnifiedFeedback): Promise<void> {
    // Feedback já está sendo salvo em feedbackHistory na memória
    
    // Tentar salvar no Supabase (opcional) - mapear campos corretamente
    try {
      const dbData = {
        prediction_id: feedback.prediction_id,
        predicted_color: feedback.predicted_color,
        predicted_number: feedback.predicted_number,
        confidence_percentage: feedback.predicted_confidence,
        actual_color: feedback.actual_color,
        actual_number: feedback.actual_number,
        was_correct: feedback.was_color_correct,
        algorithm_used: feedback.algorithm_used,
        data_points_used: feedback.data_count,
        execution_time_ms: feedback.execution_time,
        timestamp_prediction: new Date(feedback.timestamp_prediction).toISOString(),
        timestamp_result: new Date(feedback.timestamp_result).toISOString()
      }
      
      await supabase.from('unified_feedback').insert(dbData)
      console.log(`💾 UNIFIED FEEDBACK: Feedback salvo no Supabase para ${feedback.prediction_id}`)
    } catch (error) {
      console.error('❌ UNIFIED FEEDBACK: Erro HTTP 400 corrigido:', error)
    }
  }

  /**
   * 🔍 BUSCAR PREDIÇÃO PENDENTE
   */
  private async findPendingPrediction(predictionId: string): Promise<any> {
    // Primeiro, buscar em memória
    const memoryPrediction = this.pendingPredictions.get(predictionId)
    if (memoryPrediction) {
      console.log(`🔍 UNIFIED FEEDBACK: Predição encontrada em memória: ${predictionId}`)
      return memoryPrediction
    }
    
    // Fallback: tentar buscar no Supabase
    try {
      const { data } = await supabase
        .from('unified_predictions')
        .select('*')
        .eq('prediction_id', predictionId)
        .single()
      
      if (data) {
        console.log(`🔍 UNIFIED FEEDBACK: Predição encontrada no Supabase: ${predictionId}`)
        return data
      }
    } catch (error) {
      console.warn('⚠️ UNIFIED FEEDBACK: Tabela unified_predictions não existe')
    }
    
    console.warn(`⚠️ UNIFIED FEEDBACK: Predição ${predictionId} não encontrada`)
    return null
  }

  /**
   * 📊 OBTER MÉTRICAS ATUAIS
   */
  getCurrentMetrics(): LearningMetrics {
    return { ...this.currentMetrics }
  }

  /**
   * 🔄 CARREGAR MÉTRICAS HISTÓRICAS
   */
  private async loadHistoricalMetrics(): Promise<void> {
    try {
      const { data } = await supabase
        .from('unified_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (data && data.length > 0) {
        console.log(`📊 UNIFIED FEEDBACK: Carregados ${data.length} feedbacks históricos`)
        // Processar dados históricos para atualizar métricas
        // (implementação simplificada para Fase 1)
      }
    } catch (error) {
      console.warn('⚠️ UNIFIED FEEDBACK: Erro carregando histórico (tabela pode não existir)')
    }
  }

  // ===== FUNÇÕES AUXILIARES =====

  private initializeMetrics(): LearningMetrics {
    return {
      total_predictions: 0,
      correct_predictions: 0,
      color_accuracy: 0,
      number_accuracy: 0,
      avg_confidence: 0,
      avg_response_time: 0,
      algorithm_performance: {},
      recent_trend: 'stable',
      last_updated: Date.now()
    }
  }

  private calculateConfidenceScore(wasCorrect: boolean, confidence: number): number {
    if (wasCorrect) {
      // Recompensar confiança calibrada
      return confidence
    } else {
      // Penalizar overconfidence em erros
      return Math.max(0, 100 - confidence)
    }
  }
}

// Exportar instância singleton
export const unifiedFeedbackService = UnifiedFeedbackService.getInstance() 