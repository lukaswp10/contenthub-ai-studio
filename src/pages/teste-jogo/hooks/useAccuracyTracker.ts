/**
 * 📊 HOOK ACCURACY TRACKER - Controle de Acertos/Erros
 * 
 * Responsável por:
 * - Verificar acurácia das predições
 * - Manter estatísticas
 * - Sistema de aprendizado
 */
import { useState, useCallback } from 'react'
import type { BlazeNumberWithSource, Prediction, AccuracyStats } from '../components/BlazeDataProvider'

export function useAccuracyTracker() {
  const [stats, setStats] = useState<AccuracyStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
    accuracy: 0,
    lastResult: null
  })
  
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null)
  const [waitingForResult, setWaitingForResult] = useState(false)

  // Registrar predição para verificação futura
  const registerPrediction = useCallback((prediction: Prediction) => {
    setCurrentPrediction(prediction)
    setWaitingForResult(true)
    console.log(`📝 PREDIÇÃO REGISTRADA: ${prediction.color} - ${prediction.number}`)
  }, [])

  // Verificar acurácia quando resultado da Blaze chegar
  const checkAccuracy = useCallback((result: BlazeNumberWithSource) => {
    if (!waitingForResult || !currentPrediction) {
      return
    }

    const isCorrect = currentPrediction.color === result.color
    
    setStats(prev => {
      const newTotal = prev.total + 1
      const newCorrect = prev.correct + (isCorrect ? 1 : 0)
      const newIncorrect = prev.incorrect + (isCorrect ? 0 : 1)
      const newAccuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0

      return {
        total: newTotal,
        correct: newCorrect,
        incorrect: newIncorrect,
        accuracy: newAccuracy,
        lastResult: isCorrect
      }
    })

    // Log apenas resultado essencial
    console.log(`${isCorrect ? '✅' : '❌'} ${currentPrediction.color} vs ${result.color}`)
    
    // Reset estado
    setCurrentPrediction(null)
    setWaitingForResult(false)
    
  }, [waitingForResult, currentPrediction])

  // Reset estatísticas
  const resetStats = useCallback(() => {
    setStats({
      total: 0,
      correct: 0,
      incorrect: 0,
      accuracy: 0,
      lastResult: null
    })
    setCurrentPrediction(null)
    setWaitingForResult(false)
  }, [])

  return {
    stats,
    waitingForResult,
    currentPrediction,
    registerPrediction,
    checkAccuracy,
    resetStats
  }
} 