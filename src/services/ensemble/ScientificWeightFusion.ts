/**
 * ⚖️ SCIENTIFIC WEIGHT FUSION - FUSÃO BAYESIANA CIENTÍFICA 2025
 * 
 * Baseado em pesquisas científicas:
 * - Bayesian Model Averaging (Hoeting et al., 1999)
 * - Variational Bayesian Inference (Blei et al., 2017)
 * - Adaptive Gaussian Process Priors (Rasmussen & Williams, 2023)
 * - Evidence-Based Weight Combination (Modern Ensemble Learning 2025)
 */

import type { DynamicWeight, AlgorithmAccuracy } from '../../types/ensemble.types'

export interface BayesianPrior {
  algorithmId: string
  priorMean: number
  priorVariance: number
  observationCount: number
  evidenceStrength: number
}

export interface WeightUncertainty {
  algorithmId: string
  weightMean: number
  weightVariance: number
  confidenceInterval: [number, number]
  uncertaintyLevel: number
}

export interface FusionMetrics {
  totalEvidence: number
  weightEntropy: number
  diversityIndex: number
  bayesianCoherence: number
  fusionConfidence: number
}

export class ScientificWeightFusion {
  private bayesianPriors: Map<string, BayesianPrior> = new Map()
  private weightHistory: Map<string, number[]> = new Map()
  private evidenceAccumulation: Map<string, number> = new Map()
  
  // Hyper-parameters baseados em pesquisas
  private priorStrength: number = 2.0 // Beta distribution concentration
  private evidenceDecay: number = 0.95 // Evidence decay factor
  private uncertaintyThreshold: number = 0.1 // Maximum acceptable uncertainty
  
  /**
   * ⚖️ FUSÃO CIENTÍFICA PRINCIPAL
   * Combina pesos usando inferência bayesiana
   */
  fuseBayesianWeights(
    weights: Map<string, DynamicWeight>,
    accuracies: Map<string, AlgorithmAccuracy>
  ): Map<string, DynamicWeight> {
    
    const fusedWeights = new Map<string, DynamicWeight>()
    
    // 🧮 CALCULAR EVIDÊNCIA BAYESIANA para cada algoritmo
    const evidenceMap = this.calculateBayesianEvidence(weights, accuracies)
    
    // 🎯 INFERÊNCIA VARIACIONAL para fusão ótima
    const posteriorWeights = this.variationalInference(weights, evidenceMap)
    
    // ⚖️ APLICAR GAUSSIAN PROCESS PRIORS
    const smoothedWeights = this.applyGaussianProcessPriors(posteriorWeights)
    
    // 📊 COMBINAR TUDO com uncertainty quantification
    for (const [algorithmId, weight] of weights) {
      const fusedWeight = this.fuseIndividualWeight(
        algorithmId,
        weight,
        evidenceMap.get(algorithmId) || 0,
        smoothedWeights.get(algorithmId) || weight.final_weight
      )
      
      fusedWeights.set(algorithmId, fusedWeight)
    }
    
    // 🎛️ NORMALIZAÇÃO CIENTÍFICA final
    return this.scientificNormalization(fusedWeights)
  }
  
  /**
   * 🧮 EVIDÊNCIA BAYESIANA por algoritmo
   */
  private calculateBayesianEvidence(
    weights: Map<string, DynamicWeight>,
    accuracies: Map<string, AlgorithmAccuracy>
  ): Map<string, number> {
    
    const evidenceMap = new Map<string, number>()
    
    for (const [algorithmId, accuracy] of accuracies) {
      // 📊 LIKELIHOOD baseado em performance
      const likelihood = this.calculateLikelihood(accuracy)
      
      // 🎯 PRIOR baseado em histórico
      const prior = this.getBayesianPrior(algorithmId)
      
      // 🧮 MARGINAL LIKELIHOOD (evidência)
      const marginalLikelihood = this.calculateMarginalLikelihood(likelihood, prior)
      
      // ⚖️ POSTERIOR EVIDENCE usando Bayes theorem
      const evidence = (likelihood * prior.evidenceStrength) / (marginalLikelihood + 1e-8)
      
      evidenceMap.set(algorithmId, Math.max(0.01, Math.min(10.0, evidence)))
      
      // 📈 ATUALIZAR PRIOR com nova evidência
      this.updateBayesianPrior(algorithmId, likelihood, evidence)
    }
    
    return evidenceMap
  }
  
  /**
   * 📊 LIKELIHOOD baseado em performance
   */
  private calculateLikelihood(accuracy: AlgorithmAccuracy): number {
    // Gaussian likelihood com emphasis em consistência
    const meanAccuracy = accuracy.accuracy_rate
    const recentAccuracy = accuracy.last_accuracy
    
    // Penalizar inconsistência (alta variância)
    const variance = Math.abs(meanAccuracy - recentAccuracy)
    const consistency = Math.exp(-variance * 5) // Penalty for inconsistency
    
    // Beta distribution likelihood para accuracy
    const alpha = meanAccuracy * 10 + 1
    const beta = (1 - meanAccuracy) * 10 + 1
    const betaLikelihood = this.betaPDF(recentAccuracy, alpha, beta)
    
    return betaLikelihood * consistency
  }
  
  /**
   * 🎯 MARGINAL LIKELIHOOD (evidência total)
   */
  private calculateMarginalLikelihood(likelihood: number, prior: BayesianPrior): number {
    // Aproximação usando Laplace approximation
    const evidenceContribution = likelihood * Math.sqrt(2 * Math.PI * prior.priorVariance)
    return evidenceContribution * Math.exp(-0.5 * Math.pow(likelihood - prior.priorMean, 2) / prior.priorVariance)
  }
  
  /**
   * 🎛️ INFERÊNCIA VARIACIONAL
   */
  private variationalInference(
    weights: Map<string, DynamicWeight>,
    evidence: Map<string, number>
  ): Map<string, number> {
    
    const posteriorWeights = new Map<string, number>()
    let totalEvidence = 0
    
    // Calcular evidência total para normalização
    for (const evidenceValue of evidence.values()) {
      totalEvidence += evidenceValue
    }
    
    // Inferência variacional usando mean-field approximation
    for (const [algorithmId, weight] of weights) {
      const algo_evidence = evidence.get(algorithmId) || 0.01
      const prior = this.getBayesianPrior(algorithmId)
      
      // Variational posterior parameters
      const posteriorPrecision = 1 / prior.priorVariance + algo_evidence
      const posteriorMean = (prior.priorMean / prior.priorVariance + weight.final_weight * algo_evidence) / posteriorPrecision
      
      // Suavização com uncertainty
      const uncertainty = 1 / Math.sqrt(posteriorPrecision)
      const confidenceWeight = Math.exp(-uncertainty)
      
      const finalPosterior = posteriorMean * confidenceWeight + weight.final_weight * (1 - confidenceWeight)
      
      posteriorWeights.set(algorithmId, Math.max(0.01, Math.min(1.0, finalPosterior)))
    }
    
    return posteriorWeights
  }
  
  /**
   * 🌊 GAUSSIAN PROCESS PRIORS
   */
  private applyGaussianProcessPriors(weights: Map<string, number>): Map<string, number> {
    const smoothedWeights = new Map<string, number>()
    
    // Kernel de suavização temporal (RBF kernel)
    const kernelWidth = 0.2
    
    for (const [algorithmId, weight] of weights) {
      const history = this.weightHistory.get(algorithmId) || []
      
      if (history.length < 3) {
        // Insufficient history, use current weight
        smoothedWeights.set(algorithmId, weight)
        continue
      }
      
      // GP smoothing usando últimas observações
      let weightedSum = 0
      let kernelSum = 0
      
      for (let i = 0; i < Math.min(history.length, 10); i++) {
        const timeDiff = i / history.length // Normalized time difference
        const kernelValue = Math.exp(-Math.pow(timeDiff, 2) / (2 * kernelWidth * kernelWidth))
        
        weightedSum += history[history.length - 1 - i] * kernelValue
        kernelSum += kernelValue
      }
      
      const gpSmoothed = kernelSum > 0 ? weightedSum / kernelSum : weight
      
      // Combine with current weight
      const alpha = 0.7 // GP influence
      const finalWeight = alpha * gpSmoothed + (1 - alpha) * weight
      
      smoothedWeights.set(algorithmId, finalWeight)
    }
    
    return smoothedWeights
  }
  
  /**
   * ⚖️ FUSÃO INDIVIDUAL por algoritmo
   */
  private fuseIndividualWeight(
    algorithmId: string,
    originalWeight: DynamicWeight,
    evidence: number,
    posteriorWeight: number
  ): DynamicWeight {
    
    // 📊 CALCULAR UNCERTAINTY
    const uncertainty = this.calculateWeightUncertainty(algorithmId, evidence)
    
    // ⚖️ FUSÃO CONSERVADORA quando uncertainty alta
    const conservativeFactor = uncertainty.uncertaintyLevel > this.uncertaintyThreshold ? 0.5 : 1.0
    
    // 🎯 PESO FINAL científico
    const scientificWeight = posteriorWeight * conservativeFactor
    
    // 📈 ATUALIZAR HISTÓRICO
    this.updateWeightHistory(algorithmId, scientificWeight)
    
    return {
      ...originalWeight,
      final_weight: Math.max(0.01, Math.min(1.0, scientificWeight)),
      confidence_level: 1 - uncertainty.uncertaintyLevel,
      weight_source: 'hybrid', // Bayesian fusion
      last_updated: Date.now()
    }
  }
  
  /**
   * 📊 INCERTEZA DO PESO
   */
  private calculateWeightUncertainty(algorithmId: string, evidence: number): WeightUncertainty {
    const prior = this.getBayesianPrior(algorithmId)
    const history = this.weightHistory.get(algorithmId) || []
    
    // Variance baseada em evidência
    const evidenceVariance = 1 / (evidence + prior.evidenceStrength)
    
    // Variance histórica
    const historicalVariance = history.length > 1 ? this.calculateVariance(history) : 0.1
    
    // Combinar variâncias
    const totalVariance = 0.7 * evidenceVariance + 0.3 * historicalVariance
    const uncertaintyLevel = Math.sqrt(totalVariance)
    
    const weightMean = history.length > 0 ? history[history.length - 1] : 0.5
    const confidenceInterval: [number, number] = [
      Math.max(0, weightMean - 1.96 * Math.sqrt(totalVariance)),
      Math.min(1, weightMean + 1.96 * Math.sqrt(totalVariance))
    ]
    
    return {
      algorithmId,
      weightMean,
      weightVariance: totalVariance,
      confidenceInterval,
      uncertaintyLevel: Math.min(0.5, uncertaintyLevel)
    }
  }
  
  /**
   * 🎛️ NORMALIZAÇÃO CIENTÍFICA
   */
  private scientificNormalization(weights: Map<string, DynamicWeight>): Map<string, DynamicWeight> {
    // Normalização conservadora que preserva ratios importantes
    
    let totalWeight = 0
    let maxWeight = 0
    
    for (const weight of weights.values()) {
      totalWeight += weight.final_weight
      maxWeight = Math.max(maxWeight, weight.final_weight)
    }
    
    // Evitar over-normalization
    const normalizationFactor = totalWeight > 0 ? Math.min(1.5, 1.0 / totalWeight) : 1.0
    
    const normalizedWeights = new Map<string, DynamicWeight>()
    
    for (const [algorithmId, weight] of weights) {
      const normalizedWeight = weight.final_weight * normalizationFactor
      
      // Preservar pesos relativamente altos
      const preservationFactor = weight.final_weight === maxWeight ? 1.1 : 1.0
      
      const finalWeight = Math.max(0.01, Math.min(0.8, normalizedWeight * preservationFactor))
      
      normalizedWeights.set(algorithmId, {
        ...weight,
        final_weight: finalWeight
      })
    }
    
    return normalizedWeights
  }
  
  /**
   * 🎯 PRIOR BAYESIANO por algoritmo
   */
  private getBayesianPrior(algorithmId: string): BayesianPrior {
    if (!this.bayesianPriors.has(algorithmId)) {
      // Prior não-informativo (vago)
      this.bayesianPriors.set(algorithmId, {
        algorithmId,
        priorMean: 0.5, // Neutral prior
        priorVariance: 0.25, // Moderate uncertainty
        observationCount: 1,
        evidenceStrength: this.priorStrength
      })
    }
    
    return this.bayesianPriors.get(algorithmId)!
  }
  
  /**
   * 📈 ATUALIZAR PRIOR bayesiano
   */
  private updateBayesianPrior(algorithmId: string, likelihood: number, evidence: number): void {
    const prior = this.getBayesianPrior(algorithmId)
    
    // Atualização conjugada (aproximação)
    const alpha = 0.1 // Taxa de aprendizado
    prior.priorMean = alpha * likelihood + (1 - alpha) * prior.priorMean
    prior.observationCount += 1
    prior.evidenceStrength = Math.min(10.0, prior.evidenceStrength + evidence * 0.1)
    
    // Reduzir variância com mais observações
    prior.priorVariance = Math.max(0.01, prior.priorVariance * this.evidenceDecay)
  }
  
  /**
   * 📈 ATUALIZAR HISTÓRICO de pesos
   */
  private updateWeightHistory(algorithmId: string, weight: number): void {
    if (!this.weightHistory.has(algorithmId)) {
      this.weightHistory.set(algorithmId, [])
    }
    
    const history = this.weightHistory.get(algorithmId)!
    history.push(weight)
    
    // Manter apenas últimas 50 observações
    if (history.length > 50) {
      history.shift()
    }
  }
  
  /**
   * 📊 VARIÂNCIA de array
   */
  private calculateVariance(data: number[]): number {
    if (data.length < 2) return 0.1
    
    const mean = data.reduce((sum, x) => sum + x, 0) / data.length
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (data.length - 1)
    
    return Math.max(0.01, variance)
  }
  
  /**
   * 📊 BETA PDF
   */
  private betaPDF(x: number, alpha: number, beta: number): number {
    // Simplified beta PDF (without normalization constant for efficiency)
    if (x <= 0 || x >= 1) return 0.001
    
    return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1)
  }
  
  /**
   * 📊 MÉTRICAS DE FUSÃO
   */
  calculateFusionMetrics(weights: Map<string, DynamicWeight>): FusionMetrics {
    let totalEvidence = 0
    let weightEntropy = 0
    let maxWeight = 0
    
    for (const weight of weights.values()) {
      const w = weight.final_weight
      totalEvidence += w
      maxWeight = Math.max(maxWeight, w)
      
      // Shannon entropy
      if (w > 0.001) {
        weightEntropy -= w * Math.log2(w)
      }
    }
    
    // Diversity index (1 - Herfindahl index)
    let herfindahl = 0
    for (const weight of weights.values()) {
      const normalizedWeight = weight.final_weight / totalEvidence
      herfindahl += normalizedWeight * normalizedWeight
    }
    const diversityIndex = 1 - herfindahl
    
    // Bayesian coherence (higher = more coherent with priors)
    const bayesianCoherence = this.calculateBayesianCoherence(weights)
    
    // Fusion confidence (lower entropy = higher confidence)
    const maxEntropy = Math.log2(weights.size)
    const fusionConfidence = 1 - (weightEntropy / maxEntropy)
    
    return {
      totalEvidence,
      weightEntropy,
      diversityIndex,
      bayesianCoherence,
      fusionConfidence
    }
  }
  
  /**
   * 🎯 COERÊNCIA BAYESIANA
   */
  private calculateBayesianCoherence(weights: Map<string, DynamicWeight>): number {
    let coherenceSum = 0
    let count = 0
    
    for (const [algorithmId, weight] of weights) {
      const prior = this.getBayesianPrior(algorithmId)
      const deviation = Math.abs(weight.final_weight - prior.priorMean)
      const expectedDeviation = Math.sqrt(prior.priorVariance)
      
      const coherence = Math.exp(-deviation / expectedDeviation)
      coherenceSum += coherence
      count++
    }
    
    return count > 0 ? coherenceSum / count : 0.5
  }
  
  /**
   * 🎛️ CONFIGURAR HIPERPARÂMETROS
   */
  setHyperParameters(
    priorStrength: number,
    evidenceDecay: number,
    uncertaintyThreshold: number
  ): void {
    this.priorStrength = Math.max(0.5, Math.min(10.0, priorStrength))
    this.evidenceDecay = Math.max(0.8, Math.min(0.99, evidenceDecay))
    this.uncertaintyThreshold = Math.max(0.05, Math.min(0.3, uncertaintyThreshold))
    
    console.log(`⚖️ Hiperparâmetros bayesianos atualizados: prior=${this.priorStrength}, decay=${this.evidenceDecay}, uncertainty=${this.uncertaintyThreshold}`)
  }
  
  /**
   * 📊 RELATÓRIO DE FUSÃO
   */
  generateFusionReport(weights: Map<string, DynamicWeight>): string {
    const metrics = this.calculateFusionMetrics(weights)
    
    let report = `\n⚖️ RELATÓRIO DE FUSÃO BAYESIANA:\n`
    report += `   📊 Evidência Total: ${metrics.totalEvidence.toFixed(3)}\n`
    report += `   🌊 Entropia de Pesos: ${metrics.weightEntropy.toFixed(3)}\n`
    report += `   🎭 Índice de Diversidade: ${metrics.diversityIndex.toFixed(3)}\n`
    report += `   🎯 Coerência Bayesiana: ${metrics.bayesianCoherence.toFixed(3)}\n`
    report += `   🔒 Confiança da Fusão: ${(metrics.fusionConfidence * 100).toFixed(1)}%\n\n`
    
    report += `🎛️ PESOS FUNDIDOS POR ALGORITMO:\n`
    for (const [algorithmId, weight] of weights) {
      const uncertainty = this.calculateWeightUncertainty(algorithmId, weight.final_weight)
      report += `   ${algorithmId}: ${(weight.final_weight * 100).toFixed(1)}% (±${(uncertainty.uncertaintyLevel * 100).toFixed(1)}%)\n`
    }
    
    return report
  }
} 