/**
 * 🚀 SMART ENSEMBLE PREDICTION HOOK
 * 
 * Versão simplificada que usa o SmartEnsembleEngine
 * Mantém compatibilidade com interface existente
 * Implementa a ideia original do usuário com melhorias científicas
 */

import { useState, useCallback, useEffect } from 'react'
import { SmartEnsembleEngine } from '@/services/ensemble/SmartEnsembleEngine'
import { RealAlgorithmsService } from '@/services/realAlgorithmsService'
import { advancedMLService } from '@/services/advancedMLPredictionService'
import type { BlazeNumberWithSource, Prediction } from '../components/BlazeDataProvider'
import type { PredictionContext } from '@/types/ensemble.types'
import type { RealAlgorithmResult } from '@/types/real-algorithms.types'
import { BLAZE_CONFIG } from '../config/BlazeConfig'

// Estender interface Prediction para incluir informações extras
export interface ExtendedPrediction extends Prediction {
  extra?: {
    consensus_strength?: number
    prediction_stability?: number
    uncertainty_level?: number
    tier1_consensus?: any
    algorithm_contributions?: any
    processing_time?: number
    drift_detected?: boolean
    warnings?: string[]
    mode?: string
    algorithms_used?: number
    simple_weights?: boolean
  }
}

export function useSmartEnsemblePrediction(numbers: BlazeNumberWithSource[]) {
  const [currentPrediction, setCurrentPrediction] = useState<ExtendedPrediction | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  
  // 🚀 INSTÂNCIA DO SMART ENSEMBLE ENGINE
  const [smartEngine] = useState(() => new SmartEnsembleEngine({
    mode: 'simple', // Modo simples como pedido pelo usuário
    enabled: true,
    voting_strategy: 'hierarchical',
    log_predictions: true
  }))

  // AUTO-PREDIÇÃO quando há dados suficientes
  useEffect(() => {
    const autoGeneratePrediction = async () => {
      if (numbers.length > 10 && !isGenerating) {
        const shouldGenerate = !currentPrediction || 
          (numbers.length > 0 && currentPrediction.timestamp < numbers[numbers.length - 1].timestamp)
        
        if (shouldGenerate) {
          try {
            await generatePrediction()
            console.log('🤖 SMART ENSEMBLE: Predição automática gerada')
          } catch (error) {
            console.error('❌ Erro na predição automática:', error)
          }
        }
      }
    }

    const timeoutId = setTimeout(autoGeneratePrediction, 1000)
    return () => clearTimeout(timeoutId)
  }, [numbers.length, isGenerating, currentPrediction])

  const generatePrediction = useCallback(async () => {
    if (isGenerating) return
    if (numbers.length < BLAZE_CONFIG.MIN_NUMBERS_FOR_PREDICTION) {
      throw new Error(`Dados insuficientes (mínimo ${BLAZE_CONFIG.MIN_NUMBERS_FOR_PREDICTION} números)`)
    }

    setIsGenerating(true)
    console.log(`🚀 SMART ENSEMBLE: Gerando predição com ${numbers.length} números`)

    try {
      // 1. CONVERTER DADOS PARA FORMATO PADRÃO
      const blazeNumbers = numbers.map(num => ({
        number: num.number,
        color: num.color,
        timestamp: num.timestamp,
        id: num.id
      }))

      // 2. EXECUTAR ALGORITMOS EM PARALELO
      const [realResults, mlResults] = await Promise.allSettled([
        // Algoritmos Reais/Matemáticos
        RealAlgorithmsService.makeFinalPrediction(blazeNumbers).catch(() => null),
        
        // Algoritmos de ML
        (async () => {
          if (numbers.length >= BLAZE_CONFIG.MIN_NUMBERS_FOR_ML_ADVANCED) {
            const blazeDataPoints = blazeNumbers.map(n => ({
              number: n.number,
              color: n.color as 'red' | 'black' | 'white',
              timestamp: n.timestamp,
              round_id: n.id
            }))
            return await advancedMLService.makePrediction(blazeDataPoints)
          }
          return null
        })().catch(() => null)
      ])

      // 3. EXTRAIR RESULTADOS
      const algorithmResults = realResults.status === 'fulfilled' && realResults.value ? realResults.value.algorithms_used : []
      const mlPredictions = mlResults.status === 'fulfilled' && mlResults.value ? [mlResults.value] : []

      console.log(`📊 Algoritmos executados: ${Array.isArray(algorithmResults) ? algorithmResults.length : 0} reais, ${Array.isArray(mlPredictions) ? mlPredictions.length : 0} ML`)
      console.log(`🔍 Debug realResults:`, realResults)
      console.log(`🔍 Debug algorithmResults:`, algorithmResults)

      // 4. CRIAR CONTEXTO PARA O ENSEMBLE
      const context: PredictionContext = {
        current_time: Date.now(),
        historical_data_length: blazeNumbers.length,
        recent_trend: calculateRecentTrend(blazeNumbers),
        volatility_level: calculateVolatilityLevel(blazeNumbers),
        gap_analysis: calculateGapAnalysis(blazeNumbers),
        time_since_last_white: calculateTimeSinceLastWhite(blazeNumbers),
        
        // Contexto temporal
        hour_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        time_session: getTimeSession(new Date().getHours()),
        
        // Contexto de padrões
        pattern_strength: calculatePatternStrength(blazeNumbers),
        pattern_consistency: calculatePatternConsistency(blazeNumbers),
        anomaly_score: calculateAnomalyScore(blazeNumbers)
      }

      // 5. 🚀 GERAR PREDIÇÃO COM SMART ENSEMBLE
      const ensembleResult = await smartEngine.generateEnsemblePrediction(
        Array.isArray(algorithmResults) ? algorithmResults as RealAlgorithmResult[] : [],
        Array.isArray(mlPredictions) ? mlPredictions : [],
        context
      )

      if (!ensembleResult.success || !ensembleResult.prediction) {
        throw new Error(ensembleResult.error || 'Falha na geração do ensemble')
      }

      const ensemblePrediction = ensembleResult.prediction

      // 6. CONVERTER PARA FORMATO COMPATÍVEL
      const compatiblePrediction: ExtendedPrediction = {
        color: ensemblePrediction.final_color,
        number: ensemblePrediction.final_number,
        confidence: ensemblePrediction.final_confidence,
        algorithms: ensemblePrediction.algorithms_used,
        timestamp: ensemblePrediction.prediction_timestamp,
        
        // Informações extras do ensemble
        extra: {
          consensus_strength: ensemblePrediction.consensus_strength,
          prediction_stability: ensemblePrediction.prediction_stability,
          uncertainty_level: ensemblePrediction.uncertainty_level,
          tier1_consensus: ensemblePrediction.tier1_consensus,
          algorithm_contributions: ensemblePrediction.algorithm_contributions,
          processing_time: ensembleResult.diagnostics.total_processing_time,
          drift_detected: ensembleResult.diagnostics.drift_detected,
          warnings: ensembleResult.diagnostics.warnings
        }
      }

      setCurrentPrediction(compatiblePrediction)
      
      // Atualizar métricas
      setPerformanceMetrics(smartEngine.getPerformanceReport())

      console.log(`✅ SMART ENSEMBLE: ${ensemblePrediction.final_color} ${ensemblePrediction.final_number} (${(ensemblePrediction.final_confidence * 100).toFixed(1)}%)`)
      
      return compatiblePrediction

    } catch (error) {
      console.error('❌ SMART ENSEMBLE: Erro na predição:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [numbers, smartEngine])

  /**
   * 🎯 MODO SIMPLES (Como pedido pelo usuário)
   * Usa apenas os algoritmos reais com pesos simples
   */
  const generateSimplePrediction = useCallback(async () => {
    if (isGenerating) return
    if (numbers.length < 10) {
      throw new Error('Dados insuficientes para predição simples')
    }

    setIsGenerating(true)
    console.log('🎯 MODO SIMPLES: Gerando predição básica...')

    try {
      const blazeNumbers = numbers.map(num => ({
        number: num.number,
        color: num.color,
        timestamp: num.timestamp,
        id: num.id
      }))

      // Executar apenas algoritmos reais
      const algorithmResults = await RealAlgorithmsService.makeFinalPrediction(blazeNumbers)

      // Usar método simples do SmartEngine
      const simplePrediction = await smartEngine.generateSimplePrediction(
        Array.isArray(algorithmResults) ? algorithmResults as RealAlgorithmResult[] : []
      )

      const compatiblePrediction: ExtendedPrediction = {
        color: simplePrediction.color,
        number: simplePrediction.number,
        confidence: simplePrediction.confidence,
        algorithms: Array.isArray(algorithmResults) ? algorithmResults.map(r => r.algorithm) : [],
        timestamp: Date.now(),
        extra: {
          mode: 'simple',
          algorithms_used: Array.isArray(algorithmResults) ? algorithmResults.length : 0,
          simple_weights: true
        }
      }

      setCurrentPrediction(compatiblePrediction)
      
      console.log(`✅ MODO SIMPLES: ${simplePrediction.color} ${simplePrediction.number} (${(simplePrediction.confidence * 100).toFixed(1)}%)`)
      
      return compatiblePrediction

    } catch (error) {
      console.error('❌ MODO SIMPLES: Erro na predição:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [numbers, smartEngine])

  /**
   * ✅ ATUALIZAR COM RESULTADO REAL
   * Chama quando soubermos o resultado da rodada
   */
  const updateWithActualResult = useCallback(async (
    actualColor: 'red' | 'black' | 'white',
    actualNumber: number
  ) => {
    if (!currentPrediction) return

    try {
      await smartEngine.updateWithActualResult(
        currentPrediction.timestamp,
        actualColor,
        actualNumber
      )
      
      // Atualizar métricas
      setPerformanceMetrics(smartEngine.getPerformanceReport())
      
      console.log(`✅ Resultado atualizado: ${actualColor} ${actualNumber}`)
      
    } catch (error) {
      console.error('❌ Erro atualizando resultado:', error)
    }
  }, [currentPrediction, smartEngine])

  /**
   * 📊 OBTER RELATÓRIOS
   */
  const getReports = useCallback(() => {
    return {
      performance: smartEngine.getPerformanceReport(),
      weights: smartEngine.getWeightsReport(),
      drift: smartEngine.getDriftReport(),
      voting: smartEngine.getVotingReport()
    }
  }, [smartEngine])

  return {
    currentPrediction,
    isGenerating,
    performanceMetrics,
    generatePrediction, // Modo avançado (default)
    generateSimplePrediction, // Modo simples
    updateWithActualResult,
    getReports,
    
    // Estatísticas úteis
    stats: {
      totalNumbers: numbers.length,
      lastUpdate: numbers.length > 0 ? numbers[numbers.length - 1].timestamp : 0,
      canPredict: numbers.length >= BLAZE_CONFIG.MIN_NUMBERS_FOR_PREDICTION
    }
  }
}

// ===== FUNÇÕES AUXILIARES =====

function calculateRecentTrend(numbers: any[]): 'bullish' | 'bearish' | 'neutral' {
  if (numbers.length < 10) return 'neutral'
  
  const recent = numbers.slice(-10)
  const redCount = recent.filter(n => n.color === 'red').length
  const blackCount = recent.filter(n => n.color === 'black').length
  
  if (redCount > blackCount + 2) return 'bullish'
  if (blackCount > redCount + 2) return 'bearish'
  return 'neutral'
}

function calculateVolatilityLevel(numbers: any[]): 'low' | 'medium' | 'high' {
  if (numbers.length < 20) return 'medium'
  
  const recent = numbers.slice(-20)
  const colorChanges = recent.reduce((changes, num, index) => {
    if (index > 0 && num.color !== recent[index - 1].color) {
      changes++
    }
    return changes
  }, 0)
  
  const changeRate = colorChanges / (recent.length - 1)
  
  if (changeRate > 0.7) return 'high'
  if (changeRate < 0.3) return 'low'
  return 'medium'
}

function calculateGapAnalysis(numbers: any[]): any {
  const whitePositions = numbers
    .map((num, index) => num.color === 'white' ? index : -1)
    .filter(pos => pos !== -1)
  
  const gaps = []
  for (let i = 1; i < whitePositions.length; i++) {
    gaps.push(whitePositions[i] - whitePositions[i - 1])
  }
  
  return {
    white_gaps: gaps,
    average_gap: gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 15,
    min_gap: gaps.length > 0 ? Math.min(...gaps) : 1,
    max_gap: gaps.length > 0 ? Math.max(...gaps) : 30
  }
}

function calculateTimeSinceLastWhite(numbers: any[]): number {
  for (let i = numbers.length - 1; i >= 0; i--) {
    if (numbers[i].color === 'white') {
      return numbers.length - 1 - i
    }
  }
  return numbers.length // Se não encontrou white
}

function getTimeSession(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

function calculatePatternStrength(numbers: any[]): number {
  if (numbers.length < 10) return 0.5
  
  const recent = numbers.slice(-10)
  const patterns = {
    alternating: 0,
    streaks: 0,
    cycles: 0
  }
  
  // Detectar padrões simples
  let alternatingCount = 0
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].color !== recent[i - 1].color) {
      alternatingCount++
    }
  }
  patterns.alternating = alternatingCount / (recent.length - 1)
  
  // Força do padrão é a média dos padrões detectados
  return Object.values(patterns).reduce((sum, val) => sum + val, 0) / Object.keys(patterns).length
}

function calculatePatternConsistency(numbers: any[]): number {
  if (numbers.length < 20) return 0.5
  
  // Consistência baseada na variabilidade das cores
  const colorCounts: Record<string, number> = { red: 0, black: 0, white: 0 }
  numbers.forEach(num => {
    if (colorCounts[num.color] !== undefined) {
      colorCounts[num.color]++
    }
  })
  
  const total = numbers.length
  const expectedEach = total / 3
  
  const deviation = Object.values(colorCounts).reduce((sum, count) => {
    return sum + Math.abs(count - expectedEach)
  }, 0)
  
  // Normalizar - menor desvio = maior consistência
  return Math.max(0, 1 - (deviation / total))
}

function calculateAnomalyScore(numbers: any[]): number {
  if (numbers.length < 10) return 0
  
  const recent = numbers.slice(-10)
  const whiteCount = recent.filter(n => n.color === 'white').length
  
  // Anomalia se muitos whites recentes (probabilidade baixa)
  const whiteRate = whiteCount / recent.length
  const expectedWhiteRate = 1 / 15 // ~6.7%
  
  // Anomalia se rate muito diferente do esperado
  return Math.min(1, Math.abs(whiteRate - expectedWhiteRate) / expectedWhiteRate)
} 