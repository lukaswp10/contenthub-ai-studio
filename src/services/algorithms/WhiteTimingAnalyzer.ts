/**
 * 🤍 WHITE TIMING ANALYZER
 * 
 * Algoritmo dedicado para determinar o momento ideal para apostar no branco
 * Combina análise de gaps, padrões temporais, sequências e ROI vs Risco
 */

import type { BlazeNumber } from '@/types/real-algorithms.types'
import type { 
  WhiteTimingResult, 
  WhiteTimingConfig,
  WhiteTimingRecommendation,
  WhiteTimingStatus
} from '@/types/white-timing.types'

export class WhiteTimingAnalyzer {
  private static instance: WhiteTimingAnalyzer
  private config: WhiteTimingConfig

  constructor() {
    this.config = {
      enabled: true,
      gapThresholds: {
        normal: 12,
        overdue: 18,
        critical: 25
      },
      timeWeights: {
        gapWeight: 0.4,
        temporalWeight: 0.2,
        sequenceWeight: 0.3,
        riskWeight: 0.1
      },
      probabilityThresholds: {
        avoid: 30,
        moderate: 70,
        bet: 85
      }
    }
  }

  static getInstance(): WhiteTimingAnalyzer {
    if (!WhiteTimingAnalyzer.instance) {
      WhiteTimingAnalyzer.instance = new WhiteTimingAnalyzer()
    }
    return WhiteTimingAnalyzer.instance
  }

  /**
   * 🎯 ANÁLISE PRINCIPAL - TIMING DO BRANCO
   */
  analyzeWhiteTiming(numbers: BlazeNumber[]): WhiteTimingResult {
    if (numbers.length < 50) {
      return this.createInsufficientDataResult()
    }

    console.log(`🤍 WHITE TIMING: Analisando ${numbers.length} números para timing ideal`)

    // 1. ANÁLISE DE GAPS
    const gapAnalysis = this.analyzeGaps(numbers)
    
    // 2. ANÁLISE TEMPORAL
    const temporalAnalysis = this.analyzeTemporalPatterns(numbers)
    
    // 3. ANÁLISE DE SEQUÊNCIAS
    const sequenceAnalysis = this.analyzeSequences(numbers)
    
    // 4. ANÁLISE DE RISCO vs ROI
    const riskAnalysis = this.analyzeRiskROI(numbers, gapAnalysis)
    
    // 5. COMBINAR TODAS AS ANÁLISES
    const probability = this.calculateCombinedProbability(
      gapAnalysis, temporalAnalysis, sequenceAnalysis, riskAnalysis
    )
    
    // 6. DETERMINAR RECOMENDAÇÃO
    const { recommendation, status } = this.determineRecommendation(probability)
    
    // 7. GERAR MENSAGEM E DETALHES
    const { message, details } = this.generateRecommendationMessage(
      recommendation, gapAnalysis, temporalAnalysis, sequenceAnalysis, riskAnalysis
    )

    return {
      recommendation,
      status,
      probability,
      confidence: Math.min(95, 60 + (probability * 0.4)),
      gapAnalysis,
      temporalAnalysis,
      sequenceAnalysis,
      riskAnalysis,
      message,
      details,
      timestamp: Date.now(),
      dataPointsUsed: numbers.length
    }
  }

  /**
   * 📊 ANÁLISE DE GAPS
   */
  private analyzeGaps(numbers: BlazeNumber[]): WhiteTimingResult['gapAnalysis'] {
    // Calcular gap atual
    let currentGap = 0
    for (let i = numbers.length - 1; i >= 0; i--) {
      if (numbers[i].number === 0) break
      currentGap++
    }

    // Calcular gaps históricos
    const whitePositions: number[] = []
    numbers.forEach((num, index) => {
      if (num.number === 0) whitePositions.push(index)
    })

    let historicalAverage = 15 // Default teórico
    if (whitePositions.length > 1) {
      const gaps = whitePositions.slice(1).map((pos, i) => pos - whitePositions[i])
      historicalAverage = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    }

    const isOverdue = currentGap > this.config.gapThresholds.overdue
    const pressureLevel = Math.min(100, (currentGap / this.config.gapThresholds.critical) * 100)

    return {
      currentGap,
      historicalAverage,
      isOverdue,
      pressureLevel
    }
  }

  /**
   * ⏰ ANÁLISE TEMPORAL
   */
  private analyzeTemporalPatterns(numbers: BlazeNumber[]): WhiteTimingResult['temporalAnalysis'] {
    const currentHour = new Date().getHours()
    
    // Analisar padrões por hora
    const hourlyWhites: Record<number, number> = {}
    const hourlyTotal: Record<number, number> = {}
    
    numbers.forEach(num => {
      const hour = new Date(num.timestamp).getHours()
      hourlyTotal[hour] = (hourlyTotal[hour] || 0) + 1
      if (num.number === 0) {
        hourlyWhites[hour] = (hourlyWhites[hour] || 0) + 1
      }
    })

    // Calcular bias da hora atual
    const currentHourWhites = hourlyWhites[currentHour] || 0
    const currentHourTotal = hourlyTotal[currentHour] || 1
    const currentHourRate = currentHourWhites / currentHourTotal
    const averageRate = 1/15 // Taxa teórica do branco

    const hourlyBias = Math.round(((currentHourRate / averageRate) - 1) * 100)
    const isOptimalTime = hourlyBias > 10 || currentHourRate > averageRate * 1.2

    const timeRecommendation = isOptimalTime ? 
      'FAVORÁVEL' : hourlyBias < -20 ? 'DESFAVORÁVEL' : 'NEUTRO'

    return {
      currentHour,
      isOptimalTime,
      hourlyBias,
      timeRecommendation
    }
  }

  /**
   * 🔄 ANÁLISE DE SEQUÊNCIAS
   */
  private analyzeSequences(numbers: BlazeNumber[]): WhiteTimingResult['sequenceAnalysis'] {
    let consecutiveNonWhite = 0
    for (let i = numbers.length - 1; i >= 0; i--) {
      if (numbers[i].number === 0) break
      consecutiveNonWhite++
    }

    const isCriticalSequence = consecutiveNonWhite >= this.config.gapThresholds.critical
    const sequencePressure = Math.min(100, (consecutiveNonWhite / 30) * 100)

    return {
      consecutiveNonWhite,
      isCriticalSequence,
      sequencePressure
    }
  }

  /**
   * 💰 ANÁLISE DE RISCO vs ROI
   */
  private analyzeRiskROI(numbers: BlazeNumber[], gapAnalysis: any): WhiteTimingResult['riskAnalysis'] {
    const whiteFrequency = numbers.filter(n => n.number === 0).length / numbers.length
    const expectedFreq = 1/15

    // Calcular probabilidade baseada na pressão
    let adjustedProbability = expectedFreq
    if (gapAnalysis.isOverdue) {
      const overdueFactor = gapAnalysis.currentGap / gapAnalysis.historicalAverage
      adjustedProbability = expectedFreq * (1 + overdueFactor * 0.3)
    }

    const roiPotential = Math.round((adjustedProbability * 14 - 1) * 100) // ROI em %
    const expectedValue = adjustedProbability * 14 - 1

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
    if (gapAnalysis.pressureLevel > 80) riskLevel = 'LOW'
    else if (gapAnalysis.pressureLevel < 30) riskLevel = 'HIGH'

    return {
      roiPotential,
      riskLevel,
      expectedValue
    }
  }

  /**
   * 🧮 CALCULAR PROBABILIDADE COMBINADA
   */
  private calculateCombinedProbability(
    gap: any, temporal: any, sequence: any, risk: any
  ): number {
    const weights = this.config.timeWeights

    // Score de gap (0-100)
    const gapScore = Math.min(100, gap.pressureLevel)
    
    // Score temporal (0-100)
    const temporalScore = temporal.isOptimalTime ? 
      Math.min(100, 50 + Math.abs(temporal.hourlyBias)) : 
      Math.max(0, 50 - Math.abs(temporal.hourlyBias))
    
    // Score de sequência (0-100)
    const sequenceScore = Math.min(100, sequence.sequencePressure)
    
    // Score de risco (0-100)
    const riskScore = risk.riskLevel === 'LOW' ? 80 : 
                      risk.riskLevel === 'MEDIUM' ? 50 : 20

    const combinedScore = 
      (gapScore * weights.gapWeight) +
      (temporalScore * weights.temporalWeight) +
      (sequenceScore * weights.sequenceWeight) +
      (riskScore * weights.riskWeight)

    return Math.round(combinedScore)
  }

  /**
   * 🎯 DETERMINAR RECOMENDAÇÃO
   */
  private determineRecommendation(probability: number): {
    recommendation: WhiteTimingRecommendation
    status: WhiteTimingStatus
  } {
    const thresholds = this.config.probabilityThresholds

    if (probability >= thresholds.bet) {
      return { recommendation: 'BET', status: 'green' }
    } else if (probability >= thresholds.moderate) {
      return { recommendation: 'MODERATE', status: 'yellow' }
    } else {
      return { recommendation: 'AVOID', status: 'red' }
    }
  }

  /**
   * 📝 GERAR MENSAGEM E DETALHES
   */
  private generateRecommendationMessage(
    recommendation: WhiteTimingRecommendation,
    gap: any, temporal: any, sequence: any, risk: any
  ): { message: string, details: string[] } {
    let message = ''
    const details: string[] = []

    switch (recommendation) {
      case 'BET':
        message = '🟢 MOMENTO CRÍTICO! Todas condições alinhadas para apostar no branco.'
        details.push(`• Gap crítico: ${gap.currentGap} números (pressão ${gap.pressureLevel.toFixed(0)}%)`)
        break
      case 'MODERATE':
        message = '🟡 Momento neutro. Condições moderadamente favoráveis.'
        details.push(`• Gap moderado: ${gap.currentGap} números`)
        break
      case 'AVOID':
        message = '🔴 Não é o momento ideal. Aguarde condições mais favoráveis.'
        details.push(`• Gap baixo: ${gap.currentGap} números`)
        break
    }

    // Adicionar detalhes comuns
    details.push(`• Média histórica: ${gap.historicalAverage.toFixed(1)} números`)
    details.push(`• Horário ${temporal.timeRecommendation.toLowerCase()}: ${temporal.currentHour}h (bias: ${temporal.hourlyBias}%)`)
    details.push(`• ROI potencial: ${risk.roiPotential}% (risco ${risk.riskLevel.toLowerCase()})`)

    if (sequence.isCriticalSequence) {
      details.push(`• SEQUÊNCIA CRÍTICA: ${sequence.consecutiveNonWhite} sem branco!`)
    }

    return { message, details }
  }

  /**
   * ⚠️ RESULTADO PARA DADOS INSUFICIENTES
   */
  private createInsufficientDataResult(): WhiteTimingResult {
    return {
      recommendation: 'AVOID',
      status: 'red',
      probability: 0,
      confidence: 0,
      gapAnalysis: {
        currentGap: 0,
        historicalAverage: 15,
        isOverdue: false,
        pressureLevel: 0
      },
      temporalAnalysis: {
        currentHour: new Date().getHours(),
        isOptimalTime: false,
        hourlyBias: 0,
        timeRecommendation: 'INDEFINIDO'
      },
      sequenceAnalysis: {
        consecutiveNonWhite: 0,
        isCriticalSequence: false,
        sequencePressure: 0
      },
      riskAnalysis: {
        roiPotential: 0,
        riskLevel: 'HIGH',
        expectedValue: -1
      },
      message: '📊 Dados insuficientes para análise (mínimo 50 números)',
      details: ['• Aguarde mais dados históricos para análise precisa'],
      timestamp: Date.now(),
      dataPointsUsed: 0
    }
  }
} 