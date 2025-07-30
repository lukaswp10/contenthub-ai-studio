/**
 * 🧠 HOOK PREDICTION ENGINE - Algoritmos de Predição com Fusion Científico
 * 
 * Responsável por:
 * - Executar algoritmos reais e ML
 * - Aplicar AdaptiveFusionEngine (6 técnicas científicas 2024-2025)
 * - Gerar predições avançadas
 * - Aprendizado contínuo
 */
import { useState, useCallback, useEffect } from 'react'
import { RealAlgorithmsService } from '@/services/realAlgorithmsService'
import { advancedMLService } from '@/services/advancedMLPredictionService'
import { AdaptiveFusionEngine } from '@/services/fusion/AdaptiveFusionEngine'
import type { BlazeNumberWithSource, Prediction } from '../components/BlazeDataProvider'
import type { EnhancedPrediction, PredictionContext } from '@/types/enhanced-prediction.types'
import { BLAZE_CONFIG, logAlgorithm, logDebug } from '../config/BlazeConfig'

export function usePredictionEngine(numbers: BlazeNumberWithSource[]) {
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // ✅ NOVO: Instância do Fusion Engine
  const [fusionEngine] = useState(() => new AdaptiveFusionEngine())

  // ✅ MELHORIA 2: Gerar predição automaticamente quando tiver mais de 10 números
  useEffect(() => {
    const autoGeneratePrediction = async () => {
      // Só gerar se:
      // 1. Tiver mais de 10 números
      // 2. Não estiver gerando
      // 3. Não tiver predição atual OU último número for diferente da base da predição atual
      if (numbers.length > 10 && !isGenerating) {
        const shouldGenerate = !currentPrediction || 
          (numbers.length > 0 && currentPrediction.timestamp < numbers[numbers.length - 1].timestamp)
        
        if (shouldGenerate) {
          try {
            await generatePrediction()
            console.log('🤖 AUTO-PREDIÇÃO: Predição gerada automaticamente')
          } catch (error) {
            console.error('❌ Erro na predição automática:', error)
          }
        }
      }
    }

    // Debounce para evitar múltiplas execuções
    const timeoutId = setTimeout(autoGeneratePrediction, 1000)
    return () => clearTimeout(timeoutId)
  }, [numbers.length, isGenerating, currentPrediction]) // Re-executar quando números mudarem

  const generatePrediction = useCallback(async () => {
    if (isGenerating) return
    if (numbers.length < BLAZE_CONFIG.MIN_NUMBERS_FOR_PREDICTION) {
      throw new Error(`Dados insuficientes (mínimo ${BLAZE_CONFIG.MIN_NUMBERS_FOR_PREDICTION} números)`)
    }

    setIsGenerating(true)
    
    // Converter para formato dos algoritmos (remover propriedade source)  
    const blazeNumbers = numbers.map(num => ({
      number: num.number,
      color: num.color,
      timestamp: num.timestamp,
      id: num.id
    }))

    try {
      logAlgorithm(`🧠 GERANDO PREDIÇÃO AVANÇADA: ${numbers.length} números`)

      // ===== NOVA ABORDAGEM: FUSION CIENTÍFICO =====
      
      // 1. Executar algoritmos em paralelo (não mais fallback)
      const [realResult, mlResult] = await Promise.allSettled([
        // Algoritmos Reais (matemáticos)
        numbers.length >= BLAZE_CONFIG.MIN_NUMBERS_FOR_REAL_ALGORITHMS 
          ? RealAlgorithmsService.makeFinalPrediction(blazeNumbers)
          : Promise.reject(new Error('Dados insuficientes para algoritmos reais')),
        
        // ML Avançado  
        numbers.length >= BLAZE_CONFIG.MIN_NUMBERS_FOR_ML_ADVANCED
          ? (async () => {
              const blazeDataPoints = blazeNumbers.map(n => ({
                number: n.number,
                color: n.color as 'red' | 'black' | 'white',
                timestamp: n.timestamp,
                round_id: n.id
              }))
              return await advancedMLService.makePrediction(blazeDataPoints)
            })()
          : Promise.reject(new Error('Dados insuficientes para ML avançado'))
      ])

      // 2. Extrair resultados (mesmo se um falhou)
      const realPrediction = realResult.status === 'fulfilled' ? realResult.value : null
      const mlPrediction = mlResult.status === 'fulfilled' ? mlResult.value : null

      // 3. Criar contexto para o fusion engine
      const currentContext: PredictionContext = {
        current_numbers: blazeNumbers,
        sample_size: blazeNumbers.length,
        temporal_features: {
          hour_of_day: new Date().getHours(),
          day_of_week: new Date().getDay(),
          time_since_last_white: calculateTimeSinceLastWhite(blazeNumbers),
          sequence_length: blazeNumbers.length,
          moving_averages: calculateMovingAverages(blazeNumbers)
        },
        volatility_features: {
          current_volatility: calculateVolatility(blazeNumbers),
          volatility_regime: 'medium', // Simplificado
          volatility_trend: 'stable',
          volatility_percentile: 0.5
        },
        pattern_features: {
          streak_length: calculateStreakLength(blazeNumbers),
          color_distribution: calculateColorDistribution(blazeNumbers),
          gap_analysis: calculateGapAnalysis(blazeNumbers),
          periodicity_detected: false,
          dominant_frequency: 0.5
        },
        meta_features: {
          data_quality_score: calculateDataQuality(blazeNumbers),
          prediction_complexity: blazeNumbers.length / 1000,
          context_stability: 0.7,
          algorithm_agreement: realPrediction && mlPrediction ? 0.8 : 0.5,
          historical_context_match: 0.6
        }
      }

      // 4. ✨ APLICAR FUSION ENGINE CIENTÍFICO ✨
      logAlgorithm('🚀 Aplicando Fusion Engine com 6 técnicas científicas...')
      
      const fusionResult = await fusionEngine.fusePredictions(
        realPrediction,
        mlPrediction, 
        currentContext
      )

      const enhancedPrediction = fusionResult.final_prediction

      // 5. Converter para formato compatível (mantém interface atual)
      const compatiblePrediction: Prediction = {
        color: enhancedPrediction.color,
        number: enhancedPrediction.number,
        confidence: enhancedPrediction.confidence,
        algorithms: enhancedPrediction.algorithms,
        timestamp: enhancedPrediction.timestamp
      }

      // 6. Adicionar dados científicos como propriedades extras (compatibilidade)
      const enhancedCompatiblePrediction = {
        ...compatiblePrediction,
        // Dados científicos adicionais (opcional para interface)
        enhanced_data: {
          uncertainty_metrics: enhancedPrediction.uncertainty_metrics,
          algorithm_contributions: enhancedPrediction.algorithm_contributions,
          context_analysis: enhancedPrediction.context_analysis,
          fusion_explanation: enhancedPrediction.fusion_explanation,
          scientific_reasoning: enhancedPrediction.scientific_reasoning,
          expected_value: enhancedPrediction.expected_value,
          kelly_criterion: enhancedPrediction.kelly_criterion_percentage,
          risk_assessment: enhancedPrediction.risk_assessment
        }
      } as Prediction

      setCurrentPrediction(enhancedCompatiblePrediction)
      
      console.log(`✅ PREDIÇÃO FUSION CIENTÍFICA: ${enhancedPrediction.color} - ${enhancedPrediction.number}`)
      console.log(`📊 Confiança: ${enhancedPrediction.confidence.toFixed(1)}% | Incerteza: ${enhancedPrediction.uncertainty_metrics.epistemic_uncertainty.toFixed(1)}%`)
      console.log(`🧠 Algoritmos: ${enhancedPrediction.algorithm_contributions.map(a => `${a.algorithm}(${a.weight.toFixed(1)}%)`).join(', ')}`)
      
      return

    } catch (error) {
      console.warn('⚠️ Fusion Engine falhou, tentando fallback simples...', error)
      
      // ===== FALLBACK: Sistema anterior (manter compatibilidade) =====
      
      // Fallback 1: Tentar algoritmos reais apenas
      if (numbers.length >= BLAZE_CONFIG.MIN_NUMBERS_FOR_REAL_ALGORITHMS) {
        try {
          logAlgorithm('🎯 Fallback: Executando Algoritmos Reais...')
          const realResult = await RealAlgorithmsService.makeFinalPrediction(blazeNumbers)
          
          const prediction: Prediction = {
            color: realResult.consensus_color,
            number: realResult.consensus_number,
            confidence: realResult.mathematical_confidence,
            algorithms: realResult.algorithms_used.map(alg => alg.algorithm),
            timestamp: Date.now()
          }
          
          setCurrentPrediction(prediction)
          console.log(`✅ PREDIÇÃO REAL (FALLBACK): ${prediction.color} - ${prediction.number} (${prediction.confidence.toFixed(1)}%)`)
          return
          
        } catch (realError) {
          console.warn('⚠️ Algoritmos reais falharam:', realError)
        }
      }

      // Fallback 2: Tentar ML apenas
      if (numbers.length >= BLAZE_CONFIG.MIN_NUMBERS_FOR_ML_ADVANCED) {
        try {
          logAlgorithm('🧠 Fallback: Executando ML Avançado...')
          const blazeDataPoints = blazeNumbers.map(n => ({
            number: n.number,
            color: n.color as 'red' | 'black' | 'white',
            timestamp: n.timestamp,
            round_id: n.id
          }))

          const mlResult = await advancedMLService.makePrediction(blazeDataPoints)
          
          const prediction: Prediction = {
            color: mlResult.predicted_color,
            number: mlResult.predicted_numbers?.[0] || 0,
            confidence: mlResult.confidence_percentage,
            algorithms: ['ML_Ensemble'],
            timestamp: Date.now()
          }
          
          setCurrentPrediction(prediction)
          console.log(`✅ PREDIÇÃO ML (FALLBACK): ${prediction.color} - ${prediction.number} (${prediction.confidence.toFixed(1)}%)`)
          return
          
        } catch (mlError) {
          console.warn('⚠️ ML avançado falhou:', mlError)
        }
      }

      // Fallback 3: Predição simples
      logAlgorithm('📊 Fallback Final: Executando Predição Simples...')
      const lastNumbers = numbers.slice(-10)
      const colorCounts = {
        red: lastNumbers.filter(n => n.color === 'red').length,
        black: lastNumbers.filter(n => n.color === 'black').length,
        white: lastNumbers.filter(n => n.color === 'white').length
      }

      // Predizer cor menos frequente
      let predictedColor: 'red' | 'black' | 'white' = 'red'
      if (colorCounts.black < colorCounts.red && colorCounts.black < colorCounts.white) {
        predictedColor = 'black'
      } else if (colorCounts.white < colorCounts.red && colorCounts.white < colorCounts.black) {
        predictedColor = 'white'
      }

      const predictedNumber = predictedColor === 'white' ? 0 : 
                            predictedColor === 'red' ? Math.floor(Math.random() * 7) + 1 :
                            Math.floor(Math.random() * 7) + 8

      const prediction: Prediction = {
        color: predictedColor,
        number: predictedNumber,
        confidence: BLAZE_CONFIG.DEFAULT_CONFIDENCE_THRESHOLD,
        algorithms: ['Simple_Pattern'],
        timestamp: Date.now()
      }
      
      setCurrentPrediction(prediction)
      console.log(`✅ PREDIÇÃO SIMPLES (FALLBACK): ${prediction.color} - ${prediction.number} (${prediction.confidence}%)`)

    } finally {
      setIsGenerating(false)
    }
  }, [numbers, isGenerating, fusionEngine])

  return {
    currentPrediction,
    isGenerating,
    generatePrediction
  }
}

// ===== HELPER FUNCTIONS PARA CONTEXTO =====

function calculateTimeSinceLastWhite(numbers: any[]): number {
  let lastWhiteIndex = -1
  for (let i = numbers.length - 1; i >= 0; i--) {
    if (numbers[i].color === 'white') {
      lastWhiteIndex = i
      break
    }
  }
  return lastWhiteIndex >= 0 ? numbers.length - lastWhiteIndex - 1 : numbers.length
}

function calculateMovingAverages(numbers: any[]): number[] {
  if (numbers.length < 10) return [0, 0, 0]
  
  const last10 = numbers.slice(-10)
  const colorValues = last10.map(n => n.color === 'red' ? 1 : n.color === 'black' ? 2 : 3)
  
  return [
    colorValues.slice(-5).reduce((sum, val) => sum + val, 0) / 5,  // MA5
    colorValues.slice(-10).reduce((sum, val) => sum + val, 0) / 10, // MA10
    colorValues.reduce((sum, val) => sum + val, 0) / colorValues.length // MATodo
  ]
}

function calculateVolatility(numbers: any[]): number {
  if (numbers.length < 10) return 0.5
  
  const last20 = numbers.slice(-20)
  const colorChanges = last20.slice(1).filter((n, i) => n.color !== last20[i].color).length
  
  return Math.min(1.0, colorChanges / (last20.length - 1))
}

function calculateStreakLength(numbers: any[]): number {
  if (numbers.length === 0) return 0
  
  let streak = 1
  const lastColor = numbers[numbers.length - 1].color
  
  for (let i = numbers.length - 2; i >= 0; i--) {
    if (numbers[i].color === lastColor) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

function calculateColorDistribution(numbers: any[]): Record<string, number> {
  const last50 = numbers.slice(-50)
  const total = last50.length
  
  return {
    red: last50.filter(n => n.color === 'red').length / total,
    black: last50.filter(n => n.color === 'black').length / total,
    white: last50.filter(n => n.color === 'white').length / total
  }
}

function calculateGapAnalysis(numbers: any[]): Record<string, number> {
  const redNumbers = [1, 2, 3, 4, 5, 6, 7]
  const blackNumbers = [8, 9, 10, 11, 12, 13, 14]
  
  const gaps: Record<string, number> = {}
  
  // Helper function para encontrar último índice
  const findLastIndex = (arr: any[], predicate: (item: any) => boolean): number => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (predicate(arr[i])) return i
    }
    return -1
  }
  
  // Calcular gaps para cada número
  redNumbers.forEach(num => {
    const lastIndex = findLastIndex(numbers, (n: any) => n.number === num)
    gaps[`red_${num}`] = lastIndex >= 0 ? numbers.length - lastIndex - 1 : numbers.length
  })
  
  blackNumbers.forEach(num => {
    const lastIndex = findLastIndex(numbers, (n: any) => n.number === num)
    gaps[`black_${num}`] = lastIndex >= 0 ? numbers.length - lastIndex - 1 : numbers.length
  })
  
  const whiteLastIndex = findLastIndex(numbers, (n: any) => n.number === 0)
  gaps['white_0'] = whiteLastIndex >= 0 ? numbers.length - whiteLastIndex - 1 : numbers.length
  
  return gaps
}

function calculateDataQuality(numbers: any[]): number {
  // Qualidade baseada em tamanho da amostra e distribuição
  const sampleSizeScore = Math.min(1.0, numbers.length / 1000)
  const distribution = calculateColorDistribution(numbers)
  
  // Penalizar distribuições muito desbalanceadas
  const distributionScore = 1 - Math.abs(distribution.red - 7/15) - Math.abs(distribution.black - 7/15) - Math.abs(distribution.white - 1/15)
  
  return (sampleSizeScore + Math.max(0, distributionScore)) / 2
} 