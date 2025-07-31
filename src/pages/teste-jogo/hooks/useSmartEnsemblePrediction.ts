// HOOK STUB - SMART ENSEMBLE REMOVIDO: Foundation Model 2025
// Este arquivo foi simplificado para evitar quebrar o código existente

import { useState, useCallback } from 'react'
import { RealAlgorithmsService } from '@/services/realAlgorithmsService'

// Tipos básicos para manter compatibilidade
interface ExtendedPrediction {
  color: 'red' | 'black' | 'white'
  confidence: number
  probability: number
  numbers: number[]
  reasoning: string
  timestamp?: number
  patterns?: any[]
  context?: string
}

interface BlazeNumberWithSource {
  number: number
  color: 'red' | 'black' | 'white'
  timestamp: number
  source?: string
}

// STUB: Hook simplificado que retorna valores padrão
export function useSmartEnsemblePrediction(numbers: BlazeNumberWithSource[]) {
  const [currentPrediction, setCurrentPrediction] = useState<ExtendedPrediction | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  
  const [realAlgorithmsService] = useState(() => new RealAlgorithmsService())

  const createFallbackPrediction = (): ExtendedPrediction => {
    const colors: ('red' | 'black' | 'white')[] = ['red', 'black', 'white']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    return {
      color: randomColor,
      confidence: 65,
      probability: 0.65,
      numbers: [Math.floor(Math.random() * 15)],
      reasoning: 'Smart Ensemble REMOVIDO - usando fallback básico',
      timestamp: Date.now(),
      patterns: [],
      context: 'Foundation Model 2025'
    }
  }

  const generatePrediction = useCallback(async (): Promise<ExtendedPrediction> => {
    if (isGenerating) {
      return currentPrediction || createFallbackPrediction()
    }

    setIsGenerating(true)
    
    try {
      // FALLBACK: Usar apenas Real Algorithms como backup
      if (numbers.length >= 10) {
        const result = await realAlgorithmsService.makePrediction(numbers.slice(-50))
        const prediction: ExtendedPrediction = {
          color: result.color,
          confidence: result.confidence || 60,
          probability: (result.confidence || 60) / 100,
          numbers: result.expectedNumbers || [result.number || 0],
          reasoning: 'Smart Ensemble REMOVIDO - usando Real Algorithms',
          timestamp: Date.now(),
          patterns: [],
          context: 'Fallback'
        }
        setCurrentPrediction(prediction)
        return prediction
      }
      
      return createFallbackPrediction()
      
    } catch (error) {
      console.error('❌ Erro na predição Smart Ensemble (stub):', error)
      return createFallbackPrediction()
    } finally {
      setIsGenerating(false)
    }
  }, [numbers, isGenerating, currentPrediction, realAlgorithmsService])

  const generateSimplePrediction = generatePrediction // Alias para compatibilidade

  const updateWithActualResult = useCallback(async (actualNumber: number, actualColor: string) => {
    console.log('Smart Ensemble REMOVIDO - updateWithActualResult ignorado')
    // STUB: Não faz nada
  }, [])

  const getReports = useCallback(() => {
    return {
      performance: { accuracy: 0.5 },
      weights: {},
      drift: { status: 'stable' },
      voting: { consensus: 0.5 }
    }
  }, [])

  return {
    currentPrediction,
    isGenerating,
    performanceMetrics,
    generatePrediction,
    generateSimplePrediction,
    updateWithActualResult,
    getReports,
    
    // Estatísticas básicas
    stats: {
      totalNumbers: numbers.length,
      lastUpdate: numbers.length > 0 ? numbers[numbers.length - 1].timestamp : 0,
      hasEnoughData: numbers.length >= 10
    }
  }
} 