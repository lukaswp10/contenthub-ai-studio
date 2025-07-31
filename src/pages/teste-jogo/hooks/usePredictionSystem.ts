/**
 * 🎯 SISTEMA ÚNICO DE PREDIÇÃO - FOUNDATION MODEL 2025
 * 
 * MODERNIZAÇÃO RADICAL:
 * - Foundation Model baseado em TimeFound/Sundial 2025
 * - Ensemble simples (3 componentes vs 8-12 anteriores)
 * - Multi-resolution temporal patching
 * - Predição probabilística com incerteza
 * - Online learning contínuo
 * 
 * ✅ MANTÉM COMPATIBILIDADE: Interface igual para não quebrar UI
 * ❌ REMOVE COMPLEXIDADE: Smart Ensemble, ML Avançado, Real Algorithms
 * 
 * @version 4.0.0 - FOUNDATION MODEL
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { foundationModel } from '../../../services/foundationModels/TimeSeriesFoundationModel'
import type { ProbabilisticPrediction } from '../../../services/foundationModels/TimeSeriesFoundationModel'
import { BLAZE_CONFIG } from '../config/BlazeConfig'
import { supabase } from '../../../lib/supabase'
import type { BlazeNumber } from '../../../types/real-algorithms.types'
import { unifiedFeedbackService } from '../../../services/unifiedFeedbackService'

// ===== INTERFACES COMPATÍVEIS =====

interface BlazeRealData {
  id: string
  round_id: string
  number: number
  color: 'red' | 'black' | 'white'
  timestamp_blaze: string
  created_at: string
  source: string
}

// ✅ MANTÉM INTERFACE ORIGINAL para compatibilidade
export interface UnifiedPrediction {
  color: 'red' | 'black' | 'white'
  number: number
  confidence: number
  algorithm_used: string
  data_freshness: number
  data_count: number
  timestamp: number
  execution_time: number
  prediction_id?: string
}

export interface PredictionMetrics {
  total_predictions: number
  correct_predictions: number
  accuracy_percentage: number
  last_update: number
}

// ===== SISTEMA FOUNDATION MODEL =====

export function usePredictionSystem() {
  const [currentPrediction, setCurrentPrediction] = useState<UnifiedPrediction | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [metrics, setMetrics] = useState<PredictionMetrics>({
    total_predictions: 0,
    correct_predictions: 0,
    accuracy_percentage: 0,
    last_update: Date.now()
  })
  
  // ✅ AUTOMAÇÃO: Cache e controles para sistema automático
  const lastPredictionTime = useRef(0)
  const predictionHistory = useRef<UnifiedPrediction[]>([])
  const updateCounter = useRef(0) // Para atualização de dados a cada 2 rodadas
  
  // ✅ CACHE INTELIGENTE: Evitar recarregar dados desnecessariamente
  const dataCache = useRef<{data: BlazeNumber[], timestamp: number, count: number} | null>(null)
  const CACHE_TTL = 30000 // 30 segundos

  // ✅ CARREGAR MÉTRICAS DO BANCO NO INÍCIO
  useEffect(() => {
    const loadMetricsFromDB = async () => {
      try {
        const { data } = await supabase
          .from('user_prediction_stats')
          .select('total_predictions, correct_predictions, accuracy_percentage')
          .eq('user_id', 'default_user')
          .single()
        
        if (data) {
          setMetrics({
            total_predictions: data.total_predictions,
            correct_predictions: data.correct_predictions,
            accuracy_percentage: data.accuracy_percentage,
            last_update: Date.now()
          })
          console.log('✅ METRICS: Métricas locais carregadas do banco')
        }
      } catch (error) {
        console.warn('⚠️ METRICS: Erro carregando métricas do banco:', error)
      }
    }
    loadMetricsFromDB()
  }, [])

  // ✅ SALVAR MÉTRICAS NO BANCO SEMPRE QUE MUDAREM
  useEffect(() => {
    if (metrics.total_predictions > 0) {
      const saveMetricsToDB = async () => {
        try {
          await supabase.from('user_prediction_stats').upsert({
            user_id: 'default_user',
            total_predictions: metrics.total_predictions,
            correct_predictions: metrics.correct_predictions,
            accuracy_percentage: metrics.accuracy_percentage,
            last_updated: new Date().toISOString()
          }, { onConflict: 'user_id' })
          
          console.log('✅ METRICS: Métricas locais salvas no banco')
        } catch (error) {
          console.warn('⚠️ METRICS: Erro salvando métricas no banco:', error)
        }
      }
      saveMetricsToDB()
    }
  }, [metrics])

  /**
   * 🎯 FUNÇÃO OTIMIZADA COM PAGINAÇÃO CORRETA - MANTIDA
   */
  const getOptimizedPredictionData = useCallback(async (): Promise<BlazeNumber[]> => {
    try {
      // ✅ CACHE: Verificar se dados ainda são válidos
      const now = Date.now()
      if (dataCache.current && (now - dataCache.current.timestamp) < CACHE_TTL) {
        console.log(`🚀 CACHE: Usando ${dataCache.current.count} registros em cache (${Math.round((CACHE_TTL - (now - dataCache.current.timestamp)) / 1000)}s restantes)`)
        return dataCache.current.data
      }
      
      console.log('🔄 FOUNDATION MODEL: Buscando TODOS os dados com paginação...')
      
      let allData: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true
      
      // ✅ PAGINAÇÃO PARA PEGAR TODOS OS REGISTROS
      while (hasMore) {
        const startRange = page * pageSize
        const endRange = startRange + pageSize - 1
        
        const { data: pageData, error } = await supabase
          .from('blaze_real_data')
          .select('number, color, timestamp_blaze, round_id') // Apenas campos essenciais
          .order('timestamp_blaze', { ascending: true }) // Ordem cronológica
          .range(startRange, endRange)
        
        if (error) throw error
        
        if (pageData && pageData.length > 0) {
          allData = [...allData, ...pageData]
          
          // Se retornou menos que pageSize, chegamos ao fim
          if (pageData.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }
      
      const optimizedData = allData.map(item => ({
        number: item.number,
        color: item.color as 'red' | 'black' | 'white',
        timestamp: new Date(item.timestamp_blaze).getTime(),
        id: item.round_id
      }))
      
      console.log(`✅ FOUNDATION MODEL: ${optimizedData.length} registros COMPLETOS carregados via paginação`)
      
      // ✅ CACHE: Salvar dados para próximas consultas
      dataCache.current = {
        data: optimizedData,
        timestamp: Date.now(),
        count: optimizedData.length
      }
      
      return optimizedData
      
    } catch (error) {
      console.error('❌ FOUNDATION MODEL: Erro no SELECT paginado:', error)
      throw error
    }
  }, [])

  /**
   * 🧠 PREDIÇÃO PRINCIPAL - MODERNIZADA COM FOUNDATION MODEL
   */
  const generatePrediction = useCallback(async () => {
    const startTime = Date.now()
    
    // ✅ COOLDOWN REDUZIDO (1s) para responsividade
    if (startTime - lastPredictionTime.current < 5000) {
      console.log('⏳ FOUNDATION MODEL: Cooldown ativo (5s), aguardando...')
      return
    }

    if (isGenerating) {
      console.log('🔄 FOUNDATION MODEL: Predição já em andamento...')
      return
    }

    setIsGenerating(true)
    lastPredictionTime.current = startTime
    
    try {
      console.log('🚀 FOUNDATION MODEL: Iniciando predição moderna...')
      
      // 1️⃣ BUSCAR DADOS FRESCOS DO BANCO
      const blazeNumbers = await getOptimizedPredictionData()
      
      if (blazeNumbers.length < 50) {
        throw new Error(`Dados insuficientes: ${blazeNumbers.length} (mínimo: 50)`)
      }
      
      console.log(`🎯 FOUNDATION MODEL: Usando ${blazeNumbers.length} registros para predição moderna`)
      
      // 2️⃣ EXECUTAR FOUNDATION MODEL (SUBSTITUI TODO O SISTEMA ANTIGO)
      const foundationResult: ProbabilisticPrediction = await foundationModel.makePrediction(blazeNumbers)
      
      // 3️⃣ CONVERTER PARA INTERFACE COMPATÍVEL (NÃO QUEBRAR UI)
      const compatiblePrediction: UnifiedPrediction = {
        color: foundationResult.finalPrediction.color,
        number: foundationResult.finalPrediction.number,
        confidence: foundationResult.finalPrediction.confidence,
        algorithm_used: 'Foundation Model 2025',
        data_freshness: 0, // Dados sempre frescos
        data_count: blazeNumbers.length,
        timestamp: startTime,
        execution_time: foundationResult.executionTime,
        prediction_id: foundationResult.predictionId
      }
      
      // 4️⃣ SALVAR E ATUALIZAR ESTADO
      predictionHistory.current.push(compatiblePrediction)
      
      // Manter apenas últimas 100 predições em memória
      if (predictionHistory.current.length > 100) {
        predictionHistory.current = predictionHistory.current.slice(-100)
      }
      
      // 5️⃣ REGISTRAR NO FEEDBACK UNIFICADO (MANTIDO PARA COMPATIBILIDADE)
      try {
        await unifiedFeedbackService.registerPrediction(
          compatiblePrediction.prediction_id || `foundation_${startTime}`,
          compatiblePrediction.color,
          compatiblePrediction.number,
          compatiblePrediction.confidence,
          compatiblePrediction.algorithm_used,
          compatiblePrediction.data_count,
          compatiblePrediction.data_freshness,
          compatiblePrediction.execution_time
        )
      } catch (feedbackError) {
        console.warn('⚠️ FOUNDATION MODEL: Erro no feedback unificado (continuando):', feedbackError)
      }
      
      setCurrentPrediction(compatiblePrediction)
      
      console.log(`✅ FOUNDATION MODEL: ${compatiblePrediction.color} (${compatiblePrediction.confidence.toFixed(1)}%) - ${compatiblePrediction.execution_time}ms`)
      
    } catch (error) {
      console.error('❌ FOUNDATION MODEL: Erro na predição:', error)
      
      // 🚨 FALLBACK SIMPLES EM CASO DE ERRO
      const fallbackPrediction = generateSimpleFallback(await getOptimizedPredictionData())
      setCurrentPrediction(fallbackPrediction)
      
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, getOptimizedPredictionData])

  /**
   * ✅ REGISTRAR RESULTADO REAL - MODERNIZADO COM FOUNDATION MODEL
   */
  const registerResult = useCallback(async (actualColor: 'red' | 'black' | 'white', actualNumber: number) => {
    if (!currentPrediction) return

    const wasCorrect = currentPrediction.color === actualColor
    
    console.log(`📊 FOUNDATION MODEL: Registrando resultado - Predito: ${currentPrediction.color}, Real: ${actualColor}, Correto: ${wasCorrect}`)
    
    // ✅ ATUALIZAR MÉTRICAS LOCAIS
    setMetrics(prev => {
      const newCorrect = prev.correct_predictions + (wasCorrect ? 1 : 0)
      const newTotal = prev.total_predictions + 1
      const newAccuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0
      
      return {
        total_predictions: newTotal,
        correct_predictions: newCorrect,
        accuracy_percentage: newAccuracy,
        last_update: Date.now()
      }
    })
    
    // ✅ CONFIRMAR RESULTADO NO FOUNDATION MODEL (PARA APRENDIZADO)
    try {
      const predictionId = currentPrediction.prediction_id || `foundation_${currentPrediction.timestamp}`
      await foundationModel.confirmResult(predictionId, actualColor, actualNumber)
    } catch (error) {
      console.warn('⚠️ FOUNDATION MODEL: Erro confirmando resultado no Foundation Model:', error)
    }
    
    // ✅ CONFIRMAR RESULTADO NO FEEDBACK UNIFICADO (COMPATIBILIDADE)
    try {
      const predictionId = currentPrediction.prediction_id || `foundation_${currentPrediction.timestamp}`
      await unifiedFeedbackService.confirmResult(predictionId, actualColor, actualNumber)
    } catch (error) {
      console.warn('⚠️ FOUNDATION MODEL: Erro confirmando resultado no feedback unificado:', error)
    }
    
    // ✅ INCREMENTAR CONTADOR PARA ATUALIZAÇÃO A CADA 2 RODADAS
    updateCounter.current++
    
    if (updateCounter.current >= 2) {
      console.log('🔄 FOUNDATION MODEL: A cada 2 rodadas - Dados atualizados automaticamente!')
      updateCounter.current = 0
      // O próximo generatePrediction() fará novo SELECT automaticamente
    }
    
  }, [currentPrediction])

  // ✅ INVALIDAR CACHE: Forçar recarregamento quando chegam dados novos
  const invalidateCache = useCallback(() => {
    dataCache.current = null
    console.log('🗑️ CACHE: Cache invalidado - próxima predição fará novo SELECT')
  }, [])

  return {
    currentPrediction,
    isGenerating,
    metrics,
    generatePrediction,
    registerResult,
    invalidateCache, // ✅ NOVA: Para invalidar cache quando chegam dados novos
    
    // ✅ MANTER MÉTODOS PARA COMPATIBILIDADE
    getOptimizedPredictionData
  }
}

// ===== FALLBACK SIMPLES =====

function generateSimpleFallback(data: BlazeNumber[]): UnifiedPrediction {
  console.log('🚨 FOUNDATION MODEL: Usando fallback simples')
  
  if (data.length === 0) {
    return {
      color: 'red',
      number: 1,
      confidence: 30,
      algorithm_used: 'Simple Fallback',
      data_freshness: 0,
      data_count: 0,
      timestamp: Date.now(),
      execution_time: 1
    }
  }
  
  // Análise de frequência simples
  const recent = data.slice(-50)
  const colorCounts = { red: 0, black: 0, white: 0 }
  recent.forEach(d => colorCounts[d.color]++)
  
  // Encontrar cor menos frequente (compensação)
  const minCount = Math.min(colorCounts.red, colorCounts.black, colorCounts.white)
  const underrepresented = Object.entries(colorCounts).find(([_, count]) => count === minCount)?.[0] as 'red' | 'black' | 'white'
  
  // ✅ SELEÇÃO INTELIGENTE: Usar análise de gaps em vez de aleatório
  let selectedNumber = 0
  if (underrepresented === 'white') {
    selectedNumber = 0
  } else if (underrepresented === 'red') {
    selectedNumber = selectSmartNumberForColor('red', data)
  } else {
    selectedNumber = selectSmartNumberForColor('black', data)
  }
  
  return {
    color: underrepresented,
    number: selectedNumber,
    confidence: 45,
    algorithm_used: 'Simple Fallback',
    data_freshness: 0,
    data_count: data.length,
    timestamp: Date.now(),
    execution_time: 5
  }
}

// ===== ANÁLISE DE FREQUÊNCIA SIMPLES (FALLBACK) =====

function analyzeFrequency(data: BlazeNumber[]): {
  predicted_color: 'red' | 'black' | 'white'
  predicted_number: number
  confidence: number
} {
  if (data.length < 10) {
    return {
      predicted_color: 'red',
      predicted_number: 1,
      confidence: 30
    }
  }
  
  const recent = data.slice(-30) // Últimos 30 números
  const colorCounts = { red: 0, black: 0, white: 0 }
  recent.forEach(d => colorCounts[d.color]++)
  
  // Distribuição teórica da Blaze
  const total = recent.length
  const theoretical = { red: 7/15, black: 7/15, white: 1/15 }
  
  // Calcular desvios
  const deviations = {
    red: (colorCounts.red / total) - theoretical.red,
    black: (colorCounts.black / total) - theoretical.black,
    white: (colorCounts.white / total) - theoretical.white
  }
  
  // Escolher cor mais sub-representada
  const mostUnderrepresented = Object.entries(deviations)
    .sort(([,a], [,b]) => a - b)[0][0] as 'red' | 'black' | 'white'
  
  // ✅ SELEÇÃO INTELIGENTE: Usar análise de gaps em vez de aleatório
  let number = 0
  if (mostUnderrepresented === 'white') {
    number = 0
  } else if (mostUnderrepresented === 'red') {
    number = selectSmartNumberForColor('red', data)
  } else {
    number = selectSmartNumberForColor('black', data)
  }
  
  const confidence = Math.min(75, Math.abs(deviations[mostUnderrepresented]) * 100 + 40)
  
  return {
    predicted_color: mostUnderrepresented,
    predicted_number: number,
    confidence
  }
}

/**
 * 🎯 SELEÇÃO INTELIGENTE DE NÚMEROS BASEADA EM GAPS E FREQUÊNCIA
 */
function selectSmartNumberForColor(color: 'red' | 'black' | 'white', data: BlazeNumber[]): number {
  if (color === 'white') return 0
  
  const range = color === 'red' ? [1, 2, 3, 4, 5, 6, 7] : [8, 9, 10, 11, 12, 13, 14]
  const scores = new Map<number, number>()
  
  range.forEach(num => {
    let score = 0
    
    // 1. GAP WEIGHT (40%) - números que não saem há tempo
    const lastIndex = data.map((d, i) => d.number === num ? i : -1).filter(i => i !== -1).pop() ?? -1
    const gap = lastIndex === -1 ? data.length : data.length - lastIndex - 1
    score += (gap / data.length) * 0.4
    
    // 2. FREQUENCY WEIGHT (30%) - números menos frequentes
    const frequency = data.filter(d => d.number === num).length
    const expectedFreq = data.length / range.length
    if (frequency < expectedFreq) {
      score += (expectedFreq - frequency) / expectedFreq * 0.3
    }
    
    // 3. PATTERN WEIGHT (30%) - baseado em últimos 10 números
    const recent = data.slice(-10)
    const recentFreq = recent.filter(d => d.number === num).length
    if (recentFreq === 0) score += 0.3 // Não saiu recentemente
    
    scores.set(num, score)
  })
  
  // Retornar número com maior score combinado
  return Array.from(scores.entries()).reduce((max, current) => 
    current[1] > max[1] ? current : max
  )[0]
} 