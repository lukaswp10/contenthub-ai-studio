/**
 * 🤍 USE WHITE TIMING ANALYSIS HOOK
 * 
 * Hook para integrar análise de timing do branco com dados da Blaze
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { WhiteTimingAnalyzer } from '@/services/algorithms/WhiteTimingAnalyzer'
import type { WhiteTimingResult } from '@/types/white-timing.types'
import type { BlazeNumberWithSource } from '../components/BlazeDataProvider'

export function useWhiteTimingAnalysis(numbers: BlazeNumberWithSource[]) {
  const [timingResult, setTimingResult] = useState<WhiteTimingResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzer] = useState(() => WhiteTimingAnalyzer.getInstance())
  
  // ✅ CACHE: Evitar recálculo desnecessário
  const analysisCache = useRef<{result: WhiteTimingResult, count: number, timestamp: number} | null>(null)
  const CACHE_TTL = 300000 // 5 minutos

  /**
   * 🎯 EXECUTAR ANÁLISE DE TIMING
   */
  const analyzeWhiteTiming = useCallback(async () => {
    if (numbers.length < 10) {
      setTimingResult(null)
      return
    }

    // ✅ CACHE: Verificar se análise ainda é válida
    const now = Date.now()
    if (analysisCache.current && 
        analysisCache.current.count === numbers.length &&
        (now - analysisCache.current.timestamp) < CACHE_TTL) {
      console.log(`🤍 CACHE: Usando análise em cache (${Math.round((CACHE_TTL - (now - analysisCache.current.timestamp)) / 1000)}s restantes)`)
      setTimingResult(analysisCache.current.result)
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Converter para formato esperado pelo analyzer
      const blazeNumbers = numbers.map(num => ({
        id: num.id,
        number: num.number,
        color: num.color,
        timestamp: num.timestamp,
        round_id: `${num.id}_${num.timestamp}`,
        timestamp_blaze: new Date(num.timestamp).toISOString(),
        source: 'blaze_api'
      }))

      console.log(`🤍 WHITE TIMING: Executando análise com ${blazeNumbers.length} números`)
      
      const result = analyzer.analyzeWhiteTiming(blazeNumbers)
      setTimingResult(result)
      
      // ✅ CACHE: Salvar resultado para próximas consultas
      analysisCache.current = {
        result,
        count: numbers.length,
        timestamp: Date.now()
      }
      
      console.log(`🤍 WHITE TIMING: ${result.recommendation} (${result.probability}%)`)
      
    } catch (error) {
      console.error('❌ Erro na análise de timing:', error)
      setTimingResult(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [numbers, analyzer, CACHE_TTL])

  /**
   * 🔄 AUTO-ANÁLISE quando dados mudam
   */
  useEffect(() => {
    if (numbers.length >= 10) {
      // ✅ CACHE CHECK: Verificar antes do debounce
      const now = Date.now()
      if (analysisCache.current && 
          analysisCache.current.count === numbers.length &&
          (now - analysisCache.current.timestamp) < CACHE_TTL) {
        // Cache válido, não fazer nada
        return
      }
      
      // Debounce para evitar análises desnecessárias
      const timeoutId = setTimeout(() => {
        analyzeWhiteTiming()
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [numbers, analyzeWhiteTiming, CACHE_TTL])

  /**
   * 📊 ESTATÍSTICAS ÚTEIS
   */
  const getQuickStats = useCallback(() => {
    if (!timingResult) return null

    return {
      currentGap: timingResult.gapAnalysis.currentGap,
      pressure: Math.round(timingResult.gapAnalysis.pressureLevel),
      recommendation: timingResult.recommendation,
      probability: timingResult.probability,
      isOptimalTime: timingResult.temporalAnalysis.isOptimalTime,
      isCritical: timingResult.sequenceAnalysis.isCriticalSequence
    }
  }, [timingResult])

  return {
    timingResult,
    isAnalyzing,
    analyzeWhiteTiming,
    getQuickStats
  }
} 