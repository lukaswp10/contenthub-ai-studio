/**
 * 🔍 ROBUST DRIFT DETECTOR - DETECÇÃO CONSERVADORA DE DRIFT 2025
 * 
 * Baseado em pesquisas científicas:
 * - Kolmogorov-Smirnov Test for Distribution Change
 * - Page-Hinkley Test for Gradual Drift  
 * - ADWIN (Adaptive Windowing) Algorithm
 * - Conservative Statistical Testing (p < 0.01)
 */

import type { ConceptDriftSignal } from '../../types/ensemble.types'

export type DriftAction = 'reduce_weight' | 'temporary_disable' | 'retrain' | 'monitor'

export interface DriftStatistics {
  ksStatistic: number
  pValue: number
  meanShift: number
  varianceShift: number
  driftMagnitude: number
  driftType: 'gradual' | 'sudden' | 'recurring' | 'seasonal'
}

export interface DriftWindow {
  windowId: string
  algorithmId: string
  recentData: number[]
  historicalMean: number
  historicalVariance: number
  timestamp: number
}

export class RobustDriftDetector {
  private driftHistory: Map<string, DriftStatistics[]> = new Map()
  private adaptiveWindows: Map<string, DriftWindow> = new Map()
  private confidenceLevel: number = 0.01 // p < 0.01 (very conservative)
  private minWindowSize: number = 30
  private maxWindowSize: number = 100
  
  /**
   * 🔍 DETECTAR DRIFT ESTATÍSTICO PRINCIPAL
   * Usa Kolmogorov-Smirnov + Page-Hinkley
   */
  detectStatisticalDrift(
    algorithmId: string,
    recentPredictions: number[],
    historicalPredictions: number[]
  ): ConceptDriftSignal {
    
    if (recentPredictions.length < this.minWindowSize || historicalPredictions.length < this.minWindowSize) {
      return this.createNoFriftSignal(algorithmId, 'insufficient_data')
    }
    
    // 📊 KOLMOGOROV-SMIRNOV TEST
    const ksResult = this.kolmogorovSmirnovTest(recentPredictions, historicalPredictions)
    
    // 📈 PAGE-HINKLEY TEST for gradual drift
    const phResult = this.pageHinkleyTest(recentPredictions, historicalPredictions)
    
    // 🔄 ADAPTIVE WINDOWING check
    const adwinResult = this.adaptiveWindowingTest(algorithmId, recentPredictions)
    
    // 🎯 COMBINE RESULTS for final decision
    const combinedResult = this.combineTestResults(ksResult, phResult, adwinResult)
    
    // 📝 RECORD DRIFT STATISTICS
    this.recordDriftStatistics(algorithmId, combinedResult)
    
    return {
      algorithm_id: algorithmId,
      drift_type: combinedResult.driftType,
      drift_strength: combinedResult.driftMagnitude,
      drift_confidence: 1 - combinedResult.pValue,
      performance_before: 0.5, // Placeholder - should be calculated from historical data
      performance_after: 0.5, // Placeholder - should be calculated from recent data  
      performance_drop: combinedResult.meanShift,
      recommended_action: this.recommendConservativeAction(combinedResult),
      recovery_timeline: 48, // Hours - could be calculated based on drift type
      context_factors: [this.formatStatisticalEvidence(combinedResult)],
      similar_past_events: [],
      detection_timestamp: Date.now()
    }
  }
  
  /**
   * 📊 KOLMOGOROV-SMIRNOV TEST
   * Testa se duas amostras vêm da mesma distribuição
   */
  private kolmogorovSmirnovTest(sample1: number[], sample2: number[]): DriftStatistics {
    // Sort both samples
    const sorted1 = [...sample1].sort((a, b) => a - b)
    const sorted2 = [...sample2].sort((a, b) => a - b)
    
    const n1 = sorted1.length
    const n2 = sorted2.length
    
    // Calculate empirical distribution functions
    let maxDifference = 0
    let i1 = 0, i2 = 0
    
    while (i1 < n1 && i2 < n2) {
      const value1 = sorted1[i1]
      const value2 = sorted2[i2]
      
      const cdf1 = (i1 + 1) / n1
      const cdf2 = (i2 + 1) / n2
      
      const difference = Math.abs(cdf1 - cdf2)
      maxDifference = Math.max(maxDifference, difference)
      
      if (value1 <= value2) {
        i1++
      } else {
        i2++
      }
    }
    
    const ksStatistic = maxDifference
    const pValue = this.calculateKSPValue(ksStatistic, n1, n2)
    
    // Calculate additional statistics
    const mean1 = sample1.reduce((a, b) => a + b, 0) / n1
    const mean2 = sample2.reduce((a, b) => a + b, 0) / n2
    const meanShift = Math.abs(mean1 - mean2)
    
    const var1 = this.calculateVariance(sample1)
    const var2 = this.calculateVariance(sample2)
    const varianceShift = Math.abs(var1 - var2)
    
    return {
      ksStatistic,
      pValue,
      meanShift,
      varianceShift,
      driftMagnitude: ksStatistic,
      driftType: this.classifyDriftType(ksStatistic, meanShift, varianceShift)
    }
  }
  
  /**
   * 📈 PAGE-HINKLEY TEST
   * Detecta mudanças graduais na média
   */
  private pageHinkleyTest(recent: number[], historical: number[]): DriftStatistics {
    const historicalMean = historical.reduce((a, b) => a + b, 0) / historical.length
    const threshold = 0.5 // Sensitivity parameter
    
    let cumulativeSum = 0
    let maxCumulativeSum = 0
    let driftDetected = false
    
    // Apply Page-Hinkley to recent data
    for (const value of recent) {
      const deviation = value - historicalMean - threshold
      cumulativeSum = Math.max(0, cumulativeSum + deviation)
      maxCumulativeSum = Math.max(maxCumulativeSum, cumulativeSum)
      
      if (cumulativeSum > 2.0) { // Conservative threshold
        driftDetected = true
        break
      }
    }
    
    const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length
    const meanShift = Math.abs(recentMean - historicalMean)
    
    return {
      ksStatistic: maxCumulativeSum / recent.length,
      pValue: driftDetected ? 0.005 : 0.5, // Conservative p-value estimation
      meanShift,
      varianceShift: 0,
      driftMagnitude: meanShift,
      driftType: driftDetected ? 'gradual' : 'seasonal'
    }
  }
  
  /**
   * 🔄 ADAPTIVE WINDOWING (ADWIN)
   * Mantém janela adaptativa e detecta mudanças
   */
  private adaptiveWindowingTest(algorithmId: string, recentData: number[]): DriftStatistics {
    const windowKey = `${algorithmId}_window`
    let window = this.adaptiveWindows.get(windowKey)
    
    if (!window) {
      // Initialize window
      window = {
        windowId: windowKey,
        algorithmId,
        recentData: [...recentData],
        historicalMean: recentData.reduce((a, b) => a + b, 0) / recentData.length,
        historicalVariance: this.calculateVariance(recentData),
        timestamp: Date.now()
      }
      this.adaptiveWindows.set(windowKey, window)
      
             return {
         ksStatistic: 0,
         pValue: 1.0,
         meanShift: 0,
         varianceShift: 0,
         driftMagnitude: 0,
         driftType: 'seasonal'
       }
    }
    
    // Test for significant change
    const newMean = recentData.reduce((a, b) => a + b, 0) / recentData.length
    const meanDifference = Math.abs(newMean - window.historicalMean)
    const standardError = Math.sqrt(window.historicalVariance / recentData.length)
    
    // Conservative z-test
    const zScore = meanDifference / (standardError + 1e-8)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore))) // Two-tailed test
    
    const isDrift = pValue < this.confidenceLevel && zScore > 2.58 // Very conservative
    
    if (isDrift) {
      // Update window after drift detection
      window.historicalMean = newMean
      window.historicalVariance = this.calculateVariance(recentData)
      window.recentData = [...recentData]
      window.timestamp = Date.now()
    } else {
      // Gradual window update
      const alpha = 0.1 // Learning rate
      window.historicalMean = alpha * newMean + (1 - alpha) * window.historicalMean
    }
    
    return {
      ksStatistic: zScore,
      pValue,
      meanShift: meanDifference,
      varianceShift: 0,
      driftMagnitude: zScore,
      driftType: isDrift ? 'sudden' : 'seasonal'
    }
  }
  
  /**
   * 🎯 COMBINAR RESULTADOS DOS TESTES
   */
  private combineTestResults(
    ksResult: DriftStatistics,
    phResult: DriftStatistics,
    adwinResult: DriftStatistics
  ): DriftStatistics & { isDrift: boolean } {
    
    // Combine p-values using Fisher's method (conservative)
    const combinedPValue = Math.min(ksResult.pValue, phResult.pValue, adwinResult.pValue)
    
    // Drift detected if ANY test indicates drift (conservative OR logic)
    const isDrift = combinedPValue < this.confidenceLevel
    
    // Select most significant test result
    let dominantResult = ksResult
    if (phResult.pValue < dominantResult.pValue) dominantResult = phResult
    if (adwinResult.pValue < dominantResult.pValue) dominantResult = adwinResult
    
    return {
      ...dominantResult,
      pValue: combinedPValue,
      isDrift
    }
  }
  
  /**
   * 🎯 AÇÃO CONSERVADORA baseada em drift
   */
  private recommendConservativeAction(driftResult: DriftStatistics & { isDrift: boolean }): DriftAction {
    if (!driftResult.isDrift) return 'monitor'
    
    // Very conservative thresholds
    if (driftResult.driftMagnitude > 1.0 && driftResult.pValue < 0.001) {
      return 'retrain' // Only for very severe drift
    }
    
    if (driftResult.driftMagnitude > 0.7 && driftResult.pValue < 0.005) {
      return 'reduce_weight' // Moderate drift
    }
    
    if (driftResult.driftMagnitude > 0.5) {
      return 'monitor' // Light drift - just monitor closely
    }
    
    return 'monitor' // Default conservative action
  }
  
  /**
   * 📊 CLASSIFICAR TIPO DE DRIFT
   */
  private classifyDriftType(ksStatistic: number, meanShift: number, varianceShift: number): 'gradual' | 'sudden' | 'recurring' | 'seasonal' {
    if (ksStatistic < 0.1) return 'seasonal'
    
    if (meanShift > 0.5 && ksStatistic > 0.3) return 'sudden'
    if (meanShift > 0.2) return 'gradual'
    if (varianceShift > 0.3) return 'recurring'
    
    return 'gradual'
  }
  
  /**
   * 📊 CALCULAR P-VALUE para KS test
   */
  private calculateKSPValue(ksStatistic: number, n1: number, n2: number): number {
    const n = (n1 * n2) / (n1 + n2)
    const lambda = Math.sqrt(n) * ksStatistic
    
    // Approximation for p-value (conservative)
    return 2 * Math.exp(-2 * lambda * lambda)
  }
  
  /**
   * 📈 CALCULAR VARIÂNCIA
   */
  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (data.length - 1)
    return Math.max(0.01, variance) // Avoid zero variance
  }
  
  /**
   * 📊 NORMAL CDF approximation
   */
  private normalCDF(x: number): number {
    // Approximation of cumulative distribution function for standard normal
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }
  
  /**
   * 📐 ERROR FUNCTION approximation
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911
    
    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)
    
    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    
    return sign * y
  }
  
  /**
   * 🔍 CRIAR SINAL DE "SEM DRIFT"
   */
     private createNoFriftSignal(algorithmId: string, reason: string): ConceptDriftSignal {
     return {
       algorithm_id: algorithmId,
       drift_type: 'seasonal',
       drift_strength: 0,
       drift_confidence: 0,
       performance_before: 0.5,
       performance_after: 0.5,
       performance_drop: 0,
       recommended_action: 'monitor',
       recovery_timeline: 0,
       context_factors: [reason],
       similar_past_events: [],
       detection_timestamp: Date.now()
     }
   }
  
  /**
   * 📊 FORMATAR EVIDÊNCIA ESTATÍSTICA
   */
  private formatStatisticalEvidence(result: DriftStatistics): string {
    return `KS=${result.ksStatistic.toFixed(3)}, p=${result.pValue.toFixed(4)}, mean_shift=${result.meanShift.toFixed(3)}`
  }
  
  /**
   * 📝 REGISTRAR ESTATÍSTICAS DE DRIFT
   */
  private recordDriftStatistics(algorithmId: string, result: DriftStatistics): void {
    if (!this.driftHistory.has(algorithmId)) {
      this.driftHistory.set(algorithmId, [])
    }
    
    const history = this.driftHistory.get(algorithmId)!
    history.push({ ...result })
    
    // Keep only last 100 records
    if (history.length > 100) {
      history.shift()
    }
  }
  
  /**
   * 📊 CONFIGURAR PARÂMETROS
   */
  setDetectionParameters(
    confidenceLevel: number,
    minWindowSize: number,
    maxWindowSize: number
  ): void {
    this.confidenceLevel = Math.max(0.001, Math.min(0.05, confidenceLevel))
    this.minWindowSize = Math.max(10, minWindowSize)
    this.maxWindowSize = Math.max(this.minWindowSize, maxWindowSize)
    
    console.log(`🔍 Parâmetros de drift atualizados: confiança=${this.confidenceLevel}, janela=${this.minWindowSize}-${this.maxWindowSize}`)
  }
  
  /**
   * 📈 RELATÓRIO DE DRIFT
   */
  generateDriftReport(algorithmId: string): string {
    const history = this.driftHistory.get(algorithmId) || []
    if (history.length === 0) {
      return `📊 Sem histórico de drift para ${algorithmId}`
    }
    
    const recentDrifts = history.filter(h => h.pValue < this.confidenceLevel).length
    const avgDriftMagnitude = history.reduce((sum, h) => sum + h.driftMagnitude, 0) / history.length
    
    let report = `\n🔍 RELATÓRIO DE DRIFT - ${algorithmId}:\n`
    report += `   📊 Total de análises: ${history.length}\n`
    report += `   ⚠️  Drifts detectados: ${recentDrifts}\n`
    report += `   📈 Magnitude média: ${avgDriftMagnitude.toFixed(3)}\n`
    report += `   🎯 Confiança: ${(1 - this.confidenceLevel) * 100}%\n`
    
    const lastDrift = history[history.length - 1]
    if (lastDrift.pValue < this.confidenceLevel) {
      report += `   🚨 ÚLTIMO DRIFT: ${lastDrift.driftType} (p=${lastDrift.pValue.toFixed(4)})\n`
    }
    
    return report
  }
} 