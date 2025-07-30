/**
 * 🏗️ BLAZE DATA PROVIDER - Estado Central
 * 
 * Gerencia todos os dados da Blaze e algoritmos
 * Fonte única de verdade para o sistema
 */
import React, { createContext, useContext, useEffect } from 'react'
import { useBlazeData } from '../hooks/useBlazeData'
import { useSmartEnsemblePrediction, type ExtendedPrediction } from '../hooks/useSmartEnsemblePrediction'
import { useAccuracyTracker } from '../hooks/useAccuracyTracker'
import type { BlazeNumber } from '@/types/real-algorithms.types'

// ===== TIPOS =====
export interface BlazeNumberWithSource extends BlazeNumber {
  source: 'blaze' | 'csv'
}

export interface Prediction {
  color: 'red' | 'black' | 'white'
  number: number
  confidence: number
  algorithms: string[]
  timestamp: number
}

export interface AccuracyStats {
  total: number
  correct: number
  incorrect: number
  accuracy: number
  lastResult: boolean | null
}

// ===== CONTEXTO =====
interface BlazeContextType {
  // Dados
  numbers: BlazeNumberWithSource[]
  lastNumber: BlazeNumberWithSource | null
  
  // Predição
  currentPrediction: ExtendedPrediction | null
  isGeneratingPrediction: boolean
  
  // Acurácia
  accuracyStats: AccuracyStats
  waitingForResult: boolean
  
  // Ações
  generatePrediction: () => Promise<any>
  addCSVData: (csvNumbers: BlazeNumberWithSource[]) => void
  
  // Estado Blaze
  isConnected: boolean
  connectionStatus: string
  connect: () => Promise<void>
  disconnect: () => void
}

const BlazeContext = createContext<BlazeContextType | null>(null)

// ===== PROVIDER =====
export function BlazeDataProvider({ children }: { children: React.ReactNode }) {
  // Hooks customizados para cada responsabilidade
  const blazeData = useBlazeData()
  const predictionEngine = useSmartEnsemblePrediction(blazeData.numbers)
  const accuracyTracker = useAccuracyTracker()

  // Integração automática: quando novo número da Blaze chegar, verificar acurácia
  useEffect(() => {
    if (blazeData.lastNumber && accuracyTracker.waitingForResult) {
      accuracyTracker.checkAccuracy(blazeData.lastNumber)
    }
  }, [blazeData.lastNumber, accuracyTracker.waitingForResult])

  // Integração automática: quando nova predição for gerada, registrar para verificação
  useEffect(() => {
    if (predictionEngine.currentPrediction) {
      accuracyTracker.registerPrediction(predictionEngine.currentPrediction)
    }
  }, [predictionEngine.currentPrediction])

  const value: BlazeContextType = {
    // Dados
    numbers: blazeData.numbers,
    lastNumber: blazeData.lastNumber,
    
    // Predição
    currentPrediction: predictionEngine.currentPrediction,
    isGeneratingPrediction: predictionEngine.isGenerating,
    
    // Acurácia
    accuracyStats: accuracyTracker.stats,
    waitingForResult: accuracyTracker.waitingForResult,
    
    // Ações
    generatePrediction: predictionEngine.generatePrediction,
    addCSVData: blazeData.addCSVData,
    
    // Estado Blaze
    isConnected: blazeData.isConnected,
    connectionStatus: blazeData.connectionStatus,
    connect: blazeData.connect,
    disconnect: blazeData.disconnect
  }

  return (
    <BlazeContext.Provider value={value}>
      {children}
    </BlazeContext.Provider>
  )
}

// ===== HOOK =====
export function useBlazeContext() {
  const context = useContext(BlazeContext)
  if (!context) {
    throw new Error('useBlazeContext deve ser usado dentro de BlazeDataProvider')
  }
  return context
} 