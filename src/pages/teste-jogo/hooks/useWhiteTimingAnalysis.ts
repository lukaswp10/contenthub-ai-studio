/**
 * 🤍 USE WHITE TIMING ANALYSIS HOOK
 * 
 * Hook para integrar análise de timing do branco com dados da Blaze
 */
import { useState, useEffect, useCallback } from 'react'
import { WhiteTimingAnalyzer } from '@/services/algorithms/WhiteTimingAnalyzer'
import type { WhiteTimingResult } from '@/types/white-timing.types'
import type { BlazeNumberWithSource } from '../components/BlazeDataProvider'

export function useWhiteTimingAnalysis(numbers: BlazeNumberWithSource[]) {
  const [timingResult, setTimingResult] = useState<WhiteTimingResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzer] = useState(() => WhiteTimingAnalyzer.getInstance())

  /**
   * 🎯 EXECUTAR ANÁLISE DE TIMING
   */
  const analyzeWhiteTiming = useCallback(async () => {
    if (numbers.length < 10) {
      setTimingResult(null)
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
      
      console.log(`🤍 WHITE TIMING: ${result.recommendation} (${result.probability}%)`)
      
    } catch (error) {
      console.error('❌ Erro na análise de timing:', error)
      setTimingResult(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [numbers, analyzer])

  /**
   * 🔄 AUTO-ANÁLISE quando dados mudam
   */
  useEffect(() => {
    if (numbers.length >= 10) {
      // Debounce para evitar análises desnecessárias
      const timeoutId = setTimeout(() => {
        analyzeWhiteTiming()
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [numbers, analyzeWhiteTiming])

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