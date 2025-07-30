/**
 * 🤍 WHITE TIMING ANALYZER - Types & Interfaces
 * 
 * Sistema dedicado para análise de timing ideal para apostar no branco
 * Baseado em análise multi-dimensional de padrões históricos
 */

export type WhiteTimingRecommendation = 'AVOID' | 'MODERATE' | 'BET'
export type WhiteTimingStatus = 'red' | 'yellow' | 'green'

export interface WhiteTimingResult {
  // Recomendação principal
  recommendation: WhiteTimingRecommendation
  status: WhiteTimingStatus
  probability: number
  confidence: number
  
  // Análise de gaps
  gapAnalysis: {
    currentGap: number
    historicalAverage: number
    isOverdue: boolean
    pressureLevel: number
  }
  
  // Análise temporal
  temporalAnalysis: {
    currentHour: number
    isOptimalTime: boolean
    hourlyBias: number
    timeRecommendation: string
  }
  
  // Análise de sequências
  sequenceAnalysis: {
    consecutiveNonWhite: number
    isCriticalSequence: boolean
    sequencePressure: number
  }
  
  // ROI vs Risco
  riskAnalysis: {
    roiPotential: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    expectedValue: number
  }
  
  // Mensagem final
  message: string
  details: string[]
  
  // Meta-dados
  timestamp: number
  dataPointsUsed: number
}

export interface WhiteTimingConfig {
  enabled: boolean
  gapThresholds: {
    normal: number
    overdue: number
    critical: number
  }
  timeWeights: {
    gapWeight: number
    temporalWeight: number
    sequenceWeight: number
    riskWeight: number
  }
  probabilityThresholds: {
    avoid: number
    moderate: number
    bet: number
  }
} 