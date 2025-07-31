/**
 * 🎚️ CONFIDENCE CALIBRATOR - SISTEMA DE CALIBRAÇÃO 2025
 * 
 * Baseado em pesquisas científicas:
 * - Temperature Scaling (Guo et al., 2017)
 * - Platt Scaling (Platt, 1999) 
 * - Isotonic Regression (Zadrozny & Elkan, 2002)
 * - Expected Calibration Error (Naeini et al., 2015)
 */

export interface PlattParameters {
  A: number
  B: number
}

export interface CalibrationMetrics {
  expectedCalibrationError: number
  maximumCalibrationError: number
  averageConfidence: number
  averageAccuracy: number
}

export class ConfidenceCalibrator {
  private plattParameters: Map<string, PlattParameters> = new Map()
  private isotonicMappings: Map<string, Map<number, number>> = new Map()
  
  /**
   * 🎯 CALIBRAR CONFIANÇA PRINCIPAL
   * Multi-stage calibration: Temperature → Platt → Isotonic
   */
  calibrateConfidence(
    rawConfidence: number, 
    algorithmId: string,
    recentPerformance: number[]
  ): number {
    // 🌡️ TEMPERATURE SCALING
    const temperature = this.calculateOptimalTemperature(algorithmId, recentPerformance)
    const tempScaled = rawConfidence / temperature
    
    // 📈 PLATT SCALING (Sigmoid)
    const plattParams = this.getPlattParameters(algorithmId)
    const plattScaled = 1 / (1 + Math.exp(plattParams.A * tempScaled + plattParams.B))
    
    // 🎯 ISOTONIC REGRESSION for final calibration
    return this.isotonicRegression(plattScaled, algorithmId)
  }
  
  /**
   * 🌡️ TEMPERATURA ÓTIMA baseada em ECE
   */
  private calculateOptimalTemperature(algorithmId: string, performance: number[]): number {
    const expectedCalibrationError = this.calculateECE(performance)
    
    // Adaptive temperature based on calibration error
    if (expectedCalibrationError > 0.1) {
      return 1.5 // Higher temperature for overconfident models
    } else if (expectedCalibrationError < 0.02) {
      return 0.8 // Lower temperature for underconfident models  
    }
    
    return 1.0 // Default temperature
  }
  
  /**
   * 📊 EXPECTED CALIBRATION ERROR
   */
  private calculateECE(performance: number[], numBins: number = 10): number {
    if (performance.length < 10) return 0.05 // Default for insufficient data
    
    const binSize = 1.0 / numBins
    let totalECE = 0
    let totalSamples = 0
    
    for (let i = 0; i < numBins; i++) {
      const binLower = i * binSize
      const binUpper = (i + 1) * binSize
      
      // Count samples in this confidence bin
      let binSamples = 0
      let binCorrect = 0
      
      performance.forEach((correct, idx) => {
        const confidence = (idx + 1) / performance.length // Simulated confidence
        if (confidence > binLower && confidence <= binUpper) {
          binSamples++
          if (correct) binCorrect++
        }
      })
      
      if (binSamples > 0) {
        const binAccuracy = binCorrect / binSamples
        const binConfidence = (binLower + binUpper) / 2
        totalECE += binSamples * Math.abs(binAccuracy - binConfidence)
        totalSamples += binSamples
      }
    }
    
    return totalSamples > 0 ? totalECE / totalSamples : 0
  }
  
  /**
   * 📈 PLATT PARAMETERS
   */
  private getPlattParameters(algorithmId: string): PlattParameters {
    if (!this.plattParameters.has(algorithmId)) {
      // Default Platt parameters (can be learned from data)
      this.plattParameters.set(algorithmId, { A: -1.0, B: 0.0 })
    }
    return this.plattParameters.get(algorithmId)!
  }
  
  /**
   * 📐 ISOTONIC REGRESSION
   */
  private isotonicRegression(confidence: number, algorithmId: string): number {
    const mapping = this.isotonicMappings.get(algorithmId)
    if (!mapping || mapping.size === 0) {
      return confidence // No calibration available
    }
    
    // Find closest calibrated confidence
    let bestKey = 0.5
    let minDistance = Infinity
    
    for (const [key] of mapping) {
      const distance = Math.abs(key - confidence)
      if (distance < minDistance) {
        minDistance = distance
        bestKey = key
      }
    }
    
    return mapping.get(bestKey) || confidence
  }
  
  /**
   * 🎓 TREINAR CALIBRADOR com dados históricos
   */
  trainCalibrator(
    algorithmId: string, 
    confidences: number[], 
    accuracies: number[]
  ): void {
    if (confidences.length !== accuracies.length || confidences.length < 10) {
      return // Insufficient data for training
    }
    
    // Train Platt Scaling parameters
    this.trainPlattScaling(algorithmId, confidences, accuracies)
    
    // Train Isotonic Regression mapping
    this.trainIsotonicRegression(algorithmId, confidences, accuracies)
  }
  
  /**
   * 📈 TREINAR PLATT SCALING
   */
  private trainPlattScaling(
    algorithmId: string, 
    confidences: number[], 
    accuracies: number[]
  ): void {
    // Simplified Platt scaling training (should use optimization in production)
    let sumLogOdds = 0
    let sumAccuracy = 0
    
    for (let i = 0; i < confidences.length; i++) {
      const logOdds = Math.log(confidences[i] / (1 - confidences[i] + 1e-8))
      sumLogOdds += logOdds
      sumAccuracy += accuracies[i]
    }
    
    const meanLogOdds = sumLogOdds / confidences.length
    const meanAccuracy = sumAccuracy / accuracies.length
    
    // Simple linear relationship (can be improved with proper optimization)
    const A = -1.0 // Slope
    const B = meanLogOdds - meanAccuracy // Intercept adjustment
    
    this.plattParameters.set(algorithmId, { A, B })
  }
  
  /**
   * 📐 TREINAR ISOTONIC REGRESSION
   */
  private trainIsotonicRegression(
    algorithmId: string, 
    confidences: number[], 
    accuracies: number[]
  ): void {
    // Create bins and calculate average accuracy per bin
    const numBins = Math.min(10, Math.floor(confidences.length / 3))
    const mapping = new Map<number, number>()
    
    // Sort by confidence
    const sortedPairs = confidences.map((conf, idx) => ({
      confidence: conf,
      accuracy: accuracies[idx]
    })).sort((a, b) => a.confidence - b.confidence)
    
    const binSize = Math.floor(sortedPairs.length / numBins)
    
    for (let i = 0; i < numBins; i++) {
      const startIdx = i * binSize
      const endIdx = i === numBins - 1 ? sortedPairs.length : (i + 1) * binSize
      
      let sumConf = 0
      let sumAcc = 0
      let count = 0
      
      for (let j = startIdx; j < endIdx; j++) {
        sumConf += sortedPairs[j].confidence
        sumAcc += sortedPairs[j].accuracy
        count++
      }
      
      if (count > 0) {
        const avgConf = sumConf / count
        const avgAcc = sumAcc / count
        mapping.set(avgConf, avgAcc)
      }
    }
    
    this.isotonicMappings.set(algorithmId, mapping)
  }
  
  /**
   * 📊 CALCULAR MÉTRICAS DE CALIBRAÇÃO
   */
  calculateCalibrationMetrics(
    confidences: number[], 
    accuracies: number[]
  ): CalibrationMetrics {
    if (confidences.length !== accuracies.length) {
      throw new Error('Confidences and accuracies arrays must have same length')
    }
    
    const expectedCalibrationError = this.calculateECE(accuracies)
    
    // Maximum Calibration Error
    const numBins = 10
    const binSize = 1.0 / numBins
    let maxCalibrationError = 0
    
    for (let i = 0; i < numBins; i++) {
      const binLower = i * binSize
      const binUpper = (i + 1) * binSize
      
      let binSamples = 0
      let binCorrect = 0
      
      confidences.forEach((conf, idx) => {
        if (conf > binLower && conf <= binUpper) {
          binSamples++
          if (accuracies[idx] === 1) binCorrect++
        }
      })
      
      if (binSamples > 0) {
        const binAccuracy = binCorrect / binSamples
        const binConfidence = (binLower + binUpper) / 2
        const calibrationError = Math.abs(binAccuracy - binConfidence)
        maxCalibrationError = Math.max(maxCalibrationError, calibrationError)
      }
    }
    
    const averageConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    const averageAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    
    return {
      expectedCalibrationError,
      maximumCalibrationError: maxCalibrationError,
      averageConfidence,
      averageAccuracy
    }
  }
} 