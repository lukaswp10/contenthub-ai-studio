/**
 * 🎭 DIVERSITY-AWARE ENSEMBLE - CONTROLE DE DIVERSIDADE 2025
 * 
 * Baseado em pesquisas científicas:
 * - "When are ensembles really effective?" (arXiv:2305.12313)
 * - "A Unified Theory of Diversity in Ensemble Learning" (JMLR 2023)
 * - Disagreement-Error Ratio Theory
 */

import type { AlgorithmPredictionInput, DynamicWeight } from '../../types/ensemble.types'

export interface DiversityMetrics {
  disagreementRate: number
  errorRate: number
  diversityScore: number
  correlationMatrix: number[][]
  ensembleImprovement: number
}

export interface AlgorithmCorrelation {
  algorithm1: string
  algorithm2: string
  correlation: number
  disagreementRate: number
}

export class DiversityAwareEnsemble {
  private correlationHistory: Map<string, Map<string, number[]>> = new Map()
  private diversityThreshold: number = 0.3
  private maxCorrelation: number = 0.8
  
  /**
   * 🎭 CALCULAR DIVERSIDADE DO ENSEMBLE
   * Implementa disagreement rate e erro médio
   */
  calculateEnsembleDiversity(predictions: AlgorithmPredictionInput[]): DiversityMetrics {
    if (predictions.length < 2) {
      return {
        disagreementRate: 0,
        errorRate: 0.5,
        diversityScore: 0,
        correlationMatrix: [],
        ensembleImprovement: 0
      }
    }
    
    // 🎯 DISAGREEMENT RATE calculation
    let totalDisagreement = 0
    let totalPairs = 0
    
    for (let i = 0; i < predictions.length; i++) {
      for (let j = i + 1; j < predictions.length; j++) {
        const disagreement = this.calculateDisagreement(predictions[i], predictions[j])
        totalDisagreement += disagreement
        totalPairs++
      }
    }
    
    const disagreementRate = totalPairs > 0 ? totalDisagreement / totalPairs : 0
    
    // 📊 ERROR RATE estimation (average individual error)
    const avgConfidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length
    const errorRate = Math.max(0.01, 1 - (avgConfidence / 100))
    
    // 🎭 DIVERSITY SCORE (higher = more diverse)
    const diversityScore = this.calculateDiversityScore(disagreementRate, errorRate)
    
    // 📈 CORRELATION MATRIX
    const correlationMatrix = this.buildCorrelationMatrix(predictions)
    
    // 🚀 ENSEMBLE IMPROVEMENT prediction
    const ensembleImprovement = this.predictEnsembleImprovement(disagreementRate, errorRate)
    
    return {
      disagreementRate,
      errorRate,
      diversityScore,
      correlationMatrix,
      ensembleImprovement
    }
  }
  
  /**
   * 🎯 CALCULAR DISAGREEMENT entre dois algoritmos
   */
  private calculateDisagreement(pred1: AlgorithmPredictionInput, pred2: AlgorithmPredictionInput): number {
    // Color disagreement (primary)
    const colorDisagreement = pred1.predicted_color !== pred2.predicted_color ? 1 : 0
    
    // Number disagreement (secondary)  
    const numberDisagreement = pred1.predicted_number !== pred2.predicted_number ? 0.5 : 0
    
    // Confidence disagreement (tertiary)
    const confidenceDiff = Math.abs(pred1.confidence - pred2.confidence) / 100
    const confidenceDisagreement = confidenceDiff > 0.2 ? 0.3 : 0
    
    return Math.min(1.0, colorDisagreement + numberDisagreement + confidenceDisagreement)
  }
  
  /**
   * 🎭 DIVERSITY SCORE baseado em teoria científica
   */
  private calculateDiversityScore(disagreementRate: number, errorRate: number): number {
    // Based on "When are ensembles really effective?" research
    // Ensembles work best when disagreement is high relative to error
    
    if (errorRate === 0) return 0 // Perfect individual classifiers don't need ensemble
    
    const diversityRatio = disagreementRate / errorRate
    
    // Sigmoid transformation for smooth score
    return 1 / (1 + Math.exp(-2 * (diversityRatio - 1)))
  }
  
  /**
   * 📊 MATRIZ DE CORRELAÇÃO entre algoritmos
   */
  private buildCorrelationMatrix(predictions: AlgorithmPredictionInput[]): number[][] {
    const n = predictions.length
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1.0 // Self-correlation
        } else {
          const correlation = this.calculateCorrelation(predictions[i], predictions[j])
          matrix[i][j] = correlation
        }
      }
    }
    
    return matrix
  }
  
  /**
   * 📈 CORRELAÇÃO entre dois algoritmos
   */
  private calculateCorrelation(pred1: AlgorithmPredictionInput, pred2: AlgorithmPredictionInput): number {
    // Simple correlation based on prediction similarity
    const colorSimilarity = pred1.predicted_color === pred2.predicted_color ? 1 : 0
    const numberSimilarity = pred1.predicted_number === pred2.predicted_number ? 1 : 0
    const confidenceSimilarity = 1 - Math.abs(pred1.confidence - pred2.confidence) / 100
    
    // Weighted correlation
    return (colorSimilarity * 0.6 + numberSimilarity * 0.3 + confidenceSimilarity * 0.1)
  }
  
  /**
   * 🚀 PREDIZER MELHORIA DO ENSEMBLE
   */
  private predictEnsembleImprovement(disagreementRate: number, errorRate: number): number {
    // Based on ensemble theory: improvement depends on diversity vs individual error
    
    if (errorRate === 0) return 0 // No room for improvement
    
    // Theoretical maximum improvement with perfect diversity
    const maxImprovement = errorRate * (1 - errorRate)
    
    // Actual improvement based on disagreement rate
    const diversityFactor = Math.min(1.0, disagreementRate / errorRate)
    
    return maxImprovement * diversityFactor
  }
  
  /**
   * ⚖️ OTIMIZAR SELEÇÃO DO ENSEMBLE
   * Remove algoritmos muito correlacionados
   */
  optimizeEnsembleSelection(
    algorithms: AlgorithmPredictionInput[], 
    weights: Map<string, DynamicWeight>
  ): AlgorithmPredictionInput[] {
    if (algorithms.length <= 2) return algorithms // Mínimo necessário
    
    const metrics = this.calculateEnsembleDiversity(algorithms)
    
    // Se diversidade é suficiente, manter todos
    if (metrics.diversityScore >= this.diversityThreshold) {
      return algorithms
    }
    
    // 🔄 SUBSTITUIR algoritmos muito correlacionados
    return this.replaceCorrelatedAlgorithms(algorithms, weights, metrics.correlationMatrix)
  }
  
  /**
   * 🔄 SUBSTITUIR ALGORITMOS CORRELACIONADOS
   */
  private replaceCorrelatedAlgorithms(
    algorithms: AlgorithmPredictionInput[],
    weights: Map<string, DynamicWeight>,
    correlationMatrix: number[][]
  ): AlgorithmPredictionInput[] {
    
    // Encontrar par mais correlacionado
    let maxCorrelation = 0
    let mostCorrelatedPair = [-1, -1]
    
    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix[i].length; j++) {
        if (correlationMatrix[i][j] > maxCorrelation) {
          maxCorrelation = correlationMatrix[i][j]
          mostCorrelatedPair = [i, j]
        }
      }
    }
    
    // Se correlação muito alta, remover o algoritmo com menor peso
    if (maxCorrelation > this.maxCorrelation && mostCorrelatedPair[0] !== -1) {
      const [idx1, idx2] = mostCorrelatedPair
      const weight1 = weights.get(algorithms[idx1].algorithm_id)?.final_weight || 0.5
      const weight2 = weights.get(algorithms[idx2].algorithm_id)?.final_weight || 0.5
      
      // Remover o com menor peso
      const removeIdx = weight1 < weight2 ? idx1 : idx2
      const filteredAlgorithms = algorithms.filter((_, idx) => idx !== removeIdx)
      
      console.log(`🔄 Removendo algoritmo correlacionado: ${algorithms[removeIdx].algorithm_id} (correlação: ${maxCorrelation.toFixed(3)})`)
      
      return filteredAlgorithms
    }
    
    return algorithms
  }
  
  /**
   * 📊 ANALISAR CORRELAÇÕES entre algoritmos
   */
  analyzeAlgorithmCorrelations(predictions: AlgorithmPredictionInput[]): AlgorithmCorrelation[] {
    const correlations: AlgorithmCorrelation[] = []
    
    for (let i = 0; i < predictions.length; i++) {
      for (let j = i + 1; j < predictions.length; j++) {
        const pred1 = predictions[i]
        const pred2 = predictions[j]
        
        const correlation = this.calculateCorrelation(pred1, pred2)
        const disagreement = this.calculateDisagreement(pred1, pred2)
        
        correlations.push({
          algorithm1: pred1.algorithm_id,
          algorithm2: pred2.algorithm_id,
          correlation,
          disagreementRate: disagreement
        })
      }
    }
    
    // Ordenar por correlação (maior primeiro)
    return correlations.sort((a, b) => b.correlation - a.correlation)
  }
  
  /**
   * 🎯 DEFINIR LIMITES DE DIVERSIDADE
   */
  setDiversityThresholds(diversityThreshold: number, maxCorrelation: number): void {
    this.diversityThreshold = Math.max(0.1, Math.min(1.0, diversityThreshold))
    this.maxCorrelation = Math.max(0.5, Math.min(1.0, maxCorrelation))
    
    console.log(`🎭 Limites de diversidade atualizados: diversidade mín: ${this.diversityThreshold}, correlação máx: ${this.maxCorrelation}`)
  }
  
  /**
   * 📈 HISTÓRICO DE CORRELAÇÕES
   */
  updateCorrelationHistory(predictions: AlgorithmPredictionInput[]): void {
    for (let i = 0; i < predictions.length; i++) {
      for (let j = i + 1; j < predictions.length; j++) {
        const alg1 = predictions[i].algorithm_id
        const alg2 = predictions[j].algorithm_id
        const correlation = this.calculateCorrelation(predictions[i], predictions[j])
        
        // Inicializar mapas se necessário
        if (!this.correlationHistory.has(alg1)) {
          this.correlationHistory.set(alg1, new Map())
        }
        if (!this.correlationHistory.has(alg2)) {
          this.correlationHistory.set(alg2, new Map())
        }
        
        // Adicionar ao histórico (manter últimas 50 medições)
        const history1 = this.correlationHistory.get(alg1)!.get(alg2) || []
        const history2 = this.correlationHistory.get(alg2)!.get(alg1) || []
        
        history1.push(correlation)
        history2.push(correlation)
        
        if (history1.length > 50) history1.shift()
        if (history2.length > 50) history2.shift()
        
        this.correlationHistory.get(alg1)!.set(alg2, history1)
        this.correlationHistory.get(alg2)!.set(alg1, history2)
      }
    }
  }
  
  /**
   * 📊 RELATÓRIO DE DIVERSIDADE
   */
  generateDiversityReport(predictions: AlgorithmPredictionInput[]): string {
    const metrics = this.calculateEnsembleDiversity(predictions)
    const correlations = this.analyzeAlgorithmCorrelations(predictions)
    
    let report = `\n🎭 RELATÓRIO DE DIVERSIDADE DO ENSEMBLE:\n`
    report += `   📊 Taxa de Disagreement: ${(metrics.disagreementRate * 100).toFixed(1)}%\n`
    report += `   ❌ Taxa de Erro Estimada: ${(metrics.errorRate * 100).toFixed(1)}%\n`
    report += `   🎭 Score de Diversidade: ${metrics.diversityScore.toFixed(3)}\n`
    report += `   🚀 Melhoria Estimada: ${(metrics.ensembleImprovement * 100).toFixed(1)}%\n\n`
    
    report += `📈 CORRELAÇÕES ENTRE ALGORITMOS:\n`
    correlations.slice(0, 5).forEach(corr => {
      report += `   ${corr.algorithm1} ↔ ${corr.algorithm2}: ${(corr.correlation * 100).toFixed(1)}% correlação\n`
    })
    
    if (metrics.diversityScore < this.diversityThreshold) {
      report += `\n⚠️  ATENÇÃO: Diversidade baixa detectada! Considere ajustar algoritmos.\n`
    }
    
    return report
  }
} 