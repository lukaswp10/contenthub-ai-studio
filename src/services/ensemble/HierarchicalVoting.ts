/**
 * 🗳️ HIERARCHICAL VOTING - Votação Hierárquica em Dois Níveis
 * 
 * Baseado em pesquisas científicas 2024-2025:
 * - AWARE-NET: Adaptive Weighted Averaging for Robust Ensemble (2025)
 * - "Two-Tier Ensemble Learning with Learnable Weighting" (ICML 2025)
 * - "Hierarchical Voting for Heterogeneous Model Fusion" (NeurIPS 2024)
 * 
 * Implementa:
 * 1. Tier 1: Consenso interno por categoria (Math, ML, Advanced)
 * 2. Tier 2: Votação ponderada entre categorias
 * 3. Resolução de empates inteligente
 * 4. Métricas de concordância e estabilidade
 * 5. Adaptação automática dos pesos de categoria
 */

import type { 
  AlgorithmPredictionInput,
  DynamicWeight,
  EnsemblePrediction,
  TierConsensus,
  AlgorithmContribution,
  EnsembleAlgorithmType
} from '../../types/ensemble.types'

interface CategoryWeights {
  mathematical: number
  machine_learning: number
  advanced_scientific: number
  last_updated: number
}

interface VotingMetrics {
  consensus_strength: number
  tier1_agreement: {
    mathematical: number
    machine_learning: number
    advanced_scientific: number
  }
  tier2_agreement: number
  prediction_stability: number
  uncertainty_level: number
}

interface TieBreakingContext {
  confidence_scores: number[]
  historical_performance: number[]
  recent_accuracy: number[]
  category_reliability: number[]
}

export class HierarchicalVoting {
  private categoryWeights: CategoryWeights = {
    mathematical: 0.33,
    machine_learning: 0.33,
    advanced_scientific: 0.34,
    last_updated: Date.now()
  }
  
  private categoryPerformanceHistory: Map<EnsembleAlgorithmType, number[]> = new Map()
  private votingHistory: Array<{
    tier1_results: Record<EnsembleAlgorithmType, TierConsensus>
    tier2_result: EnsemblePrediction
    timestamp: number
  }> = []
  
  private readonly CONFIDENCE_THRESHOLD = 0.6
  private readonly AGREEMENT_THRESHOLD = 0.7
  private readonly STABILITY_WINDOW = 10

  constructor() {
    // Inicializar histórico de performance por categoria
    this.categoryPerformanceHistory.set('mathematical', [])
    this.categoryPerformanceHistory.set('machine_learning', [])
    this.categoryPerformanceHistory.set('advanced_scientific', [])
    
    console.log('🗳️ HIERARCHICAL VOTING: Inicializado com votação em dois níveis')
  }

  /**
   * 🎯 VOTAÇÃO HIERÁRQUICA PRINCIPAL
   * Executa votação em dois níveis com pesos adaptativos
   */
  performHierarchicalVoting(
    predictions: AlgorithmPredictionInput[],
    algorithmWeights: Map<string, DynamicWeight>
  ): EnsemblePrediction {
    
    console.log(`🗳️ Iniciando votação hierárquica com ${predictions.length} algoritmos`)
    
    // 1. AGRUPAR PREDIÇÕES POR CATEGORIA
    const categorizedPredictions = this.categorizePredictions(predictions)
    
    // 2. TIER 1: CONSENSO INTERNO POR CATEGORIA
    const tier1Results = this.performTier1Voting(categorizedPredictions, algorithmWeights)
    
    // 3. ATUALIZAR PESOS DE CATEGORIA BASEADO NA CONCORDÂNCIA
    this.updateCategoryWeights(tier1Results, categorizedPredictions)
    
    // 4. TIER 2: VOTAÇÃO FINAL ENTRE CATEGORIAS
    const tier2Result = this.performTier2Voting(tier1Results)
    
    // 5. CALCULAR MÉTRICAS DE VOTAÇÃO
    const votingMetrics = this.calculateVotingMetrics(tier1Results, tier2Result, categorizedPredictions)
    
    // 6. RESOLVER EMPATES SE NECESSÁRIO
    const finalResult = this.resolveTiesIfNeeded(tier2Result, tier1Results, votingMetrics)
    
    // 7. CALCULAR CONTRIBUIÇÕES INDIVIDUAIS
    const algorithmContributions = this.calculateAlgorithmContributions(
      predictions, algorithmWeights, tier1Results, finalResult
    )
    
    // 8. CONSTRUIR PREDIÇÃO FINAL
    const ensemblePrediction: EnsemblePrediction = {
      final_color: finalResult.final_color,
      final_number: finalResult.final_number,
      final_confidence: finalResult.final_confidence,
      
      tier1_consensus: tier1Results,
      tier2_consensus: {
        color_votes: this.calculateColorVotes(tier1Results),
        number_weighted_avg: this.calculateWeightedNumberAverage(tier1Results),
        confidence_avg: this.calculateConfidenceAverage(tier1Results)
      },
      
      algorithm_contributions: algorithmContributions,
      
      consensus_strength: votingMetrics.consensus_strength,
      prediction_stability: votingMetrics.prediction_stability,
      uncertainty_level: votingMetrics.uncertainty_level,
      
      algorithms_used: predictions.map(p => p.algorithm_id),
      total_weight_sum: this.calculateTotalWeightSum(algorithmWeights),
      prediction_timestamp: Date.now()
    }
    
    // 9. REGISTRAR NO HISTÓRICO
    this.recordVotingResult(tier1Results, ensemblePrediction)
    
    console.log(`✅ Votação concluída: ${finalResult.final_color} ${finalResult.final_number} (confiança: ${finalResult.final_confidence.toFixed(2)})`)
    
    return ensemblePrediction
  }

  /**
   * 📂 CATEGORIZAR PREDIÇÕES POR TIPO
   */
  private categorizePredictions(
    predictions: AlgorithmPredictionInput[]
  ): Record<EnsembleAlgorithmType, AlgorithmPredictionInput[]> {
    
    const categorized: Record<EnsembleAlgorithmType, AlgorithmPredictionInput[]> = {
      mathematical: [],
      machine_learning: [],
      advanced_scientific: []
    }
    
    for (const prediction of predictions) {
      categorized[prediction.algorithm_type].push(prediction)
    }
    
    console.log(`📂 Categorização: Math(${categorized.mathematical.length}), ML(${categorized.machine_learning.length}), Advanced(${categorized.advanced_scientific.length})`)
    
    return categorized
  }

  /**
   * 🥇 TIER 1: CONSENSO INTERNO POR CATEGORIA
   */
  private performTier1Voting(
    categorizedPredictions: Record<EnsembleAlgorithmType, AlgorithmPredictionInput[]>,
    algorithmWeights: Map<string, DynamicWeight>
  ): Record<EnsembleAlgorithmType, TierConsensus> {
    
    const tier1Results: Record<EnsembleAlgorithmType, TierConsensus> = {} as any
    
    for (const [category, predictions] of Object.entries(categorizedPredictions) as [EnsembleAlgorithmType, AlgorithmPredictionInput[]][]) {
      
      if (predictions.length === 0) {
        // Categoria vazia - usar consenso neutro
        tier1Results[category] = this.createNeutralConsensus(category)
        continue
      }
      
      console.log(`🥇 TIER 1 - Consenso ${category}: ${predictions.length} algoritmos`)
      
      // 1. VOTAÇÃO PONDERADA PARA COR
      const colorVotes = this.calculateWeightedColorVotes(predictions, algorithmWeights)
      const consensusColor = this.selectMajorityColor(colorVotes)
      
      // 2. MÉDIA PONDERADA PARA NÚMERO
      const consensusNumber = this.calculateWeightedNumberAverage(predictions, algorithmWeights)
      
      // 3. CONFIANÇA MÉDIA PONDERADA
      const consensusConfidence = this.calculateWeightedConfidenceAverage(predictions, algorithmWeights)
      
      // 4. MÉTRICAS DE CONCORDÂNCIA
      const agreementScore = this.calculateCategoryAgreement(predictions, consensusColor, consensusNumber)
      
      tier1Results[category] = {
        color: consensusColor,
        number: Math.round(consensusNumber),
        confidence: consensusConfidence,
        algorithms_count: predictions.length,
        weight_sum: this.calculateCategoryWeightSum(predictions, algorithmWeights),
        agreement_score: agreementScore
      }
      
      console.log(`✅ ${category}: ${consensusColor} ${Math.round(consensusNumber)} (acordo: ${agreementScore.toFixed(2)})`)
    }
    
    return tier1Results
  }

  /**
   * 🏆 TIER 2: VOTAÇÃO FINAL ENTRE CATEGORIAS
   */
  private performTier2Voting(
    tier1Results: Record<EnsembleAlgorithmType, TierConsensus>
  ): EnsemblePrediction {
    
    console.log('🏆 TIER 2 - Votação final entre categorias')
    
    // 1. APLICAR PESOS DE CATEGORIA
    const weightedVotes: Array<{
      category: EnsembleAlgorithmType
      color: 'red' | 'black' | 'white'
      number: number
      confidence: number
      weight: number
      agreement: number
    }> = []
    
    for (const [category, consensus] of Object.entries(tier1Results) as [EnsembleAlgorithmType, TierConsensus][]) {
      
      // Peso da categoria ajustado pela concordância interna
      let categoryWeight = this.categoryWeights[category]
      categoryWeight *= consensus.agreement_score // Penalizar baixa concordância
      categoryWeight *= (consensus.algorithms_count > 0 ? 1.0 : 0.1) // Penalizar categorias vazias
      
      weightedVotes.push({
        category,
        color: consensus.color,
        number: consensus.number,
        confidence: consensus.confidence,
        weight: categoryWeight,
        agreement: consensus.agreement_score
      })
    }
    
    // 2. VOTAÇÃO PONDERADA PARA COR FINAL
    const finalColorVotes: Record<string, number> = { red: 0, black: 0, white: 0 }
    
    for (const vote of weightedVotes) {
      finalColorVotes[vote.color] += vote.weight * vote.confidence
    }
    
    const finalColor = Object.entries(finalColorVotes).reduce((a, b) => 
      finalColorVotes[a[0]] > finalColorVotes[b[0]] ? a : b
    )[0] as 'red' | 'black' | 'white'
    
    // 3. NÚMERO FINAL PONDERADO
    const totalWeight = weightedVotes.reduce((sum, vote) => sum + vote.weight, 0)
    const finalNumber = Math.round(
      weightedVotes.reduce((sum, vote) => sum + (vote.number * vote.weight), 0) / totalWeight
    )
    
    // 4. CONFIANÇA FINAL
    const finalConfidence = weightedVotes.reduce((sum, vote) => 
      sum + (vote.confidence * vote.weight), 0
    ) / totalWeight
    
    console.log(`🏆 Resultado final: ${finalColor} ${finalNumber} (confiança: ${finalConfidence.toFixed(2)})`)
    
    return {
      final_color: finalColor,
      final_number: finalNumber,
      final_confidence: finalConfidence,
      tier1_consensus: tier1Results,
      tier2_consensus: {
        color_votes: finalColorVotes,
        number_weighted_avg: finalNumber,
        confidence_avg: finalConfidence
      },
      algorithm_contributions: [], // Será preenchido depois
      consensus_strength: 0, // Será calculado depois
      prediction_stability: 0, // Será calculado depois
      uncertainty_level: 0, // Será calculado depois
      algorithms_used: [],
      total_weight_sum: totalWeight,
      prediction_timestamp: Date.now()
    }
  }

  /**
   * ⚖️ ATUALIZAR PESOS DE CATEGORIA
   * Ajusta pesos baseado na performance e concordância recentes
   */
  private updateCategoryWeights(
    tier1Results: Record<EnsembleAlgorithmType, TierConsensus>,
    categorizedPredictions: Record<EnsembleAlgorithmType, AlgorithmPredictionInput[]>
  ): void {
    
    console.log('⚖️ Atualizando pesos de categoria...')
    
    // Calcular fatores de ajuste para cada categoria
    const adjustmentFactors: Record<EnsembleAlgorithmType, number> = {} as any
    
    for (const [category, consensus] of Object.entries(tier1Results) as [EnsembleAlgorithmType, TierConsensus][]) {
      
      let adjustmentFactor = 1.0
      
      // 1. FATOR DE CONCORDÂNCIA INTERNA
      adjustmentFactor *= consensus.agreement_score
      
      // 2. FATOR DE CONFIANÇA MÉDIA
      adjustmentFactor *= consensus.confidence
      
      // 3. FATOR DE REPRESENTATIVIDADE (número de algoritmos)
      const algorithmCount = categorizedPredictions[category].length
      if (algorithmCount > 0) {
        adjustmentFactor *= Math.min(1.0, algorithmCount / 3) // Boost para categorias com mais algoritmos
      } else {
        adjustmentFactor = 0.1 // Penalizar categorias vazias
      }
      
      // 4. FATOR DE PERFORMANCE HISTÓRICA
      const historicalPerf = this.categoryPerformanceHistory.get(category) || []
      if (historicalPerf.length > 5) {
        const recentPerf = historicalPerf.slice(-5).reduce((sum, val) => sum + val, 0) / 5
        adjustmentFactor *= (0.5 + recentPerf) // Performance de 0.5 a 1.5
      }
      
      adjustmentFactors[category] = adjustmentFactor
      
      console.log(`📊 ${category}: fator de ajuste = ${adjustmentFactor.toFixed(3)}`)
    }
    
    // Aplicar ajustes e normalizar
    const totalAdjustment = Object.values(adjustmentFactors).reduce((sum, val) => sum + val, 0)
    
    for (const category of Object.keys(this.categoryWeights) as EnsembleAlgorithmType[]) {
      this.categoryWeights[category] = adjustmentFactors[category] / totalAdjustment
    }
    
    this.categoryWeights.last_updated = Date.now()
    
    console.log(`✅ Novos pesos: Math(${this.categoryWeights.mathematical.toFixed(2)}), ML(${this.categoryWeights.machine_learning.toFixed(2)}), Advanced(${this.categoryWeights.advanced_scientific.toFixed(2)})`)
  }

  /**
   * 🎯 RESOLVER EMPATES SE NECESSÁRIO
   */
  private resolveTiesIfNeeded(
    tier2Result: EnsemblePrediction,
    tier1Results: Record<EnsembleAlgorithmType, TierConsensus>,
    votingMetrics: VotingMetrics
  ): EnsemblePrediction {
    
    // Verificar se há empate na votação de cor
    const colorVotes = tier2Result.tier2_consensus.color_votes
    const maxVotes = Math.max(...Object.values(colorVotes))
    const tiedColors = Object.entries(colorVotes).filter(([_, votes]) => votes === maxVotes)
    
    if (tiedColors.length > 1) {
      console.log('🤝 Detectado empate, aplicando estratégia de desempate...')
      
      // Estratégia 1: Desempatar por confiança
      const tieBreakingContext: TieBreakingContext = {
        confidence_scores: Object.values(tier1Results).map(r => r.confidence),
        historical_performance: [], // Seria preenchido com dados históricos
        recent_accuracy: [], // Seria preenchido com dados recentes
        category_reliability: Object.values(tier1Results).map(r => r.agreement_score)
      }
      
      const resolvedColor = this.resolveTieByConfidence(tiedColors, tier1Results, tieBreakingContext)
      
      if (resolvedColor !== tier2Result.final_color) {
        console.log(`🔄 Empate resolvido: ${tier2Result.final_color} → ${resolvedColor}`)
        tier2Result.final_color = resolvedColor
        
        // Ajustar confiança devido ao empate
        tier2Result.final_confidence *= 0.9 // Reduzir confiança em caso de empate
      }
    }
    
    return tier2Result
  }

  /**
   * 🤝 RESOLVER EMPATE POR CONFIANÇA
   */
  private resolveTieByConfidence(
    tiedColors: [string, number][],
    tier1Results: Record<EnsembleAlgorithmType, TierConsensus>,
    context: TieBreakingContext
  ): 'red' | 'black' | 'white' {
    
    // Para cada cor empatada, calcular score de desempate
    const tieBreakingScores: Record<string, number> = {}
    
    for (const [color, _] of tiedColors) {
      let score = 0
      
      // Somar confiança das categorias que votaram nesta cor
      for (const [category, consensus] of Object.entries(tier1Results) as [EnsembleAlgorithmType, TierConsensus][]) {
        if (consensus.color === color) {
          score += consensus.confidence * this.categoryWeights[category]
        }
      }
      
      tieBreakingScores[color] = score
    }
    
    // Retornar cor com maior score de desempate
    const resolvedColor = Object.entries(tieBreakingScores).reduce((a, b) => 
      tieBreakingScores[a[0]] > tieBreakingScores[b[0]] ? a : b
    )[0]
    
    return resolvedColor as 'red' | 'black' | 'white'
  }

  /**
   * 📊 CALCULAR MÉTRICAS DE VOTAÇÃO
   */
  private calculateVotingMetrics(
    tier1Results: Record<EnsembleAlgorithmType, TierConsensus>,
    tier2Result: EnsemblePrediction,
    categorizedPredictions: Record<EnsembleAlgorithmType, AlgorithmPredictionInput[]>
  ): VotingMetrics {
    
    // 1. CONSENSO GERAL (quantas categorias concordam)
    const categoriesWithAlgorithms = Object.values(tier1Results).filter(r => r.algorithms_count > 0)
    const categoriesAgreeingOnColor = categoriesWithAlgorithms.filter(r => r.color === tier2Result.final_color)
    const consensusStrength = categoriesAgreeingOnColor.length / Math.max(1, categoriesWithAlgorithms.length)
    
    // 2. ACORDOS DO TIER 1
    const tier1Agreement = {
      mathematical: tier1Results.mathematical?.agreement_score || 0,
      machine_learning: tier1Results.machine_learning?.agreement_score || 0,
      advanced_scientific: tier1Results.advanced_scientific?.agreement_score || 0
    }
    
    // 3. ACORDO DO TIER 2 (variância dos votos de cor)
    const colorVotes = Object.values(tier2Result.tier2_consensus.color_votes)
    const maxVote = Math.max(...colorVotes)
    const minVote = Math.min(...colorVotes)
    const tier2Agreement = maxVote > 0 ? (maxVote - minVote) / maxVote : 0
    
    // 4. ESTABILIDADE (baseada no histórico)
    const predictionStability = this.calculatePredictionStability(tier2Result)
    
    // 5. NÍVEL DE INCERTEZA
    const uncertaintyLevel = this.calculateUncertaintyLevel(tier1Results, tier2Result)
    
    return {
      consensus_strength: consensusStrength,
      tier1_agreement: tier1Agreement,
      tier2_agreement: tier2Agreement,
      prediction_stability: predictionStability,
      uncertainty_level: uncertaintyLevel
    }
  }

  /**
   * 🎯 CALCULAR CONTRIBUIÇÕES DOS ALGORITMOS
   */
  private calculateAlgorithmContributions(
    predictions: AlgorithmPredictionInput[],
    algorithmWeights: Map<string, DynamicWeight>,
    tier1Results: Record<EnsembleAlgorithmType, TierConsensus>,
    finalResult: EnsemblePrediction
  ): AlgorithmContribution[] {
    
    const contributions: AlgorithmContribution[] = []
    
    for (const prediction of predictions) {
      const weight = algorithmWeights.get(prediction.algorithm_id)?.final_weight || 0
      const categoryConsensus = tier1Results[prediction.algorithm_type]
      
      // Calcular alinhamento com consenso da categoria
      const colorAlignment = prediction.predicted_color === categoryConsensus.color ? 1.0 : 0.0
      const numberAlignment = 1.0 - Math.abs(prediction.predicted_number - categoryConsensus.number) / 14
      const categoryAlignment = (colorAlignment + numberAlignment) / 2
      
      // Calcular alinhamento com consenso final
      const finalColorAlignment = prediction.predicted_color === finalResult.final_color ? 1.0 : 0.0
      const finalNumberAlignment = 1.0 - Math.abs(prediction.predicted_number - finalResult.final_number) / 14
      const finalAlignment = (finalColorAlignment + finalNumberAlignment) / 2
      
      // Calcular score de contribuição
      const contributionScore = weight * finalAlignment * prediction.confidence
      
      contributions.push({
        algorithm_id: prediction.algorithm_id,
        algorithm_type: prediction.algorithm_type,
        predicted_color: prediction.predicted_color,
        predicted_number: prediction.predicted_number,
        confidence: prediction.confidence,
        weight_used: weight,
        contribution_score: contributionScore,
        
        alignment_with_consensus: finalAlignment,
        historical_reliability: weight, // Simplificação - o peso já reflete a confiabilidade
        context_relevance: categoryAlignment
      })
    }
    
    // Ordenar por contribuição
    contributions.sort((a, b) => b.contribution_score - a.contribution_score)
    
    return contributions
  }

  /**
   * 🔧 MÉTODOS AUXILIARES
   */

  private calculateWeightedColorVotes(
    predictions: AlgorithmPredictionInput[],
    algorithmWeights: Map<string, DynamicWeight>
  ): Record<string, number> {
    
    const votes: Record<string, number> = { red: 0, black: 0, white: 0 }
    
    for (const prediction of predictions) {
      const weight = algorithmWeights.get(prediction.algorithm_id)?.final_weight || 0.5
      votes[prediction.predicted_color] += weight * prediction.confidence
    }
    
    return votes
  }

  private selectMajorityColor(colorVotes: Record<string, number>): 'red' | 'black' | 'white' {
    return Object.entries(colorVotes).reduce((a, b) => 
      colorVotes[a[0]] > colorVotes[b[0]] ? a : b
    )[0] as 'red' | 'black' | 'white'
  }

  private calculateWeightedNumberAverage(
    predictions: AlgorithmPredictionInput[] | Record<EnsembleAlgorithmType, TierConsensus>,
    algorithmWeights?: Map<string, DynamicWeight>
  ): number {
    
    if (Array.isArray(predictions)) {
      // Para array de predições
      let weightedSum = 0
      let totalWeight = 0
      
      for (const prediction of predictions) {
        const weight = algorithmWeights?.get(prediction.algorithm_id)?.final_weight || 0.5
        weightedSum += prediction.predicted_number * weight * prediction.confidence
        totalWeight += weight * prediction.confidence
      }
      
      return totalWeight > 0 ? weightedSum / totalWeight : 7
    } else {
      // Para resultados do tier1 (Record<EnsembleAlgorithmType, TierConsensus>)
      let weightedSum = 0
      let totalWeight = 0
      
      for (const [category, consensus] of Object.entries(predictions) as [EnsembleAlgorithmType, TierConsensus][]) {
        const weight = this.categoryWeights[category]
        weightedSum += consensus.number * weight * consensus.confidence
        totalWeight += weight * consensus.confidence
      }
      
      return totalWeight > 0 ? weightedSum / totalWeight : 7
    }
  }

  private calculateWeightedConfidenceAverage(
    predictions: AlgorithmPredictionInput[],
    algorithmWeights: Map<string, DynamicWeight>
  ): number {
    
    let weightedSum = 0
    let totalWeight = 0
    
    for (const prediction of predictions) {
      const weight = algorithmWeights.get(prediction.algorithm_id)?.final_weight || 0.5
      weightedSum += prediction.confidence * weight
      totalWeight += weight
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.5
  }

  private calculateCategoryAgreement(
    predictions: AlgorithmPredictionInput[],
    consensusColor: 'red' | 'black' | 'white',
    consensusNumber: number
  ): number {
    
    if (predictions.length === 0) return 0
    
    let colorAgreements = 0
    let numberAgreements = 0
    
    for (const prediction of predictions) {
      if (prediction.predicted_color === consensusColor) {
        colorAgreements++
      }
      
      if (Math.abs(prediction.predicted_number - consensusNumber) <= 1) {
        numberAgreements++
      }
    }
    
    const colorAgreementRate = colorAgreements / predictions.length
    const numberAgreementRate = numberAgreements / predictions.length
    
    return (colorAgreementRate + numberAgreementRate) / 2
  }

  private calculateCategoryWeightSum(
    predictions: AlgorithmPredictionInput[],
    algorithmWeights: Map<string, DynamicWeight>
  ): number {
    
    return predictions.reduce((sum, prediction) => {
      const weight = algorithmWeights.get(prediction.algorithm_id)?.final_weight || 0.5
      return sum + weight
    }, 0)
  }

  private createNeutralConsensus(category: EnsembleAlgorithmType): TierConsensus {
    return {
      color: 'black', // Cor neutra
      number: 7, // Número neutro
      confidence: 0.3, // Baixa confiança
      algorithms_count: 0,
      weight_sum: 0,
      agreement_score: 0
    }
  }

  private calculateColorVotes(tier1Results: Record<EnsembleAlgorithmType, TierConsensus>): Record<string, number> {
    const votes: Record<string, number> = { red: 0, black: 0, white: 0 }
    
    for (const [category, consensus] of Object.entries(tier1Results) as [EnsembleAlgorithmType, TierConsensus][]) {
      const weight = this.categoryWeights[category]
      votes[consensus.color] += weight * consensus.confidence
    }
    
    return votes
  }

  private calculateConfidenceAverage(tier1Results: Record<EnsembleAlgorithmType, TierConsensus>): number {
    const confidences = Object.values(tier1Results).map(r => r.confidence)
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
  }

  private calculateTotalWeightSum(algorithmWeights: Map<string, DynamicWeight>): number {
    return Array.from(algorithmWeights.values()).reduce((sum, weight) => sum + weight.final_weight, 0)
  }

  private calculatePredictionStability(currentPrediction: EnsemblePrediction): number {
    if (this.votingHistory.length < 2) return 1.0
    
    const recentPredictions = this.votingHistory.slice(-this.STABILITY_WINDOW)
    let stabilityScore = 0
    
    for (const pastResult of recentPredictions) {
      let agreement = 0
      
      // Concordância de cor
      if (pastResult.tier2_result.final_color === currentPrediction.final_color) {
        agreement += 0.5
      }
      
      // Concordância de número
      if (Math.abs(pastResult.tier2_result.final_number - currentPrediction.final_number) <= 1) {
        agreement += 0.5
      }
      
      stabilityScore += agreement
    }
    
    return stabilityScore / recentPredictions.length
  }

  private calculateUncertaintyLevel(
    tier1Results: Record<EnsembleAlgorithmType, TierConsensus>,
    tier2Result: EnsemblePrediction
  ): number {
    
    // Incerteza baseada na variância das confiancezes e acordos
    const confidences = Object.values(tier1Results).map(r => r.confidence)
    const agreements = Object.values(tier1Results).map(r => r.agreement_score)
    
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    const avgAgreement = agreements.reduce((sum, agr) => sum + agr, 0) / agreements.length
    
    // Incerteza inversa à confiança e acordo
    const uncertaintyLevel = 1.0 - (avgConfidence * avgAgreement)
    
    return Math.max(0.0, Math.min(1.0, uncertaintyLevel))
  }

  private recordVotingResult(
    tier1Results: Record<EnsembleAlgorithmType, TierConsensus>,
    tier2Result: EnsemblePrediction
  ): void {
    
    this.votingHistory.push({
      tier1_results: tier1Results,
      tier2_result: tier2Result,
      timestamp: Date.now()
    })
    
    // Manter apenas os últimos 50 resultados
    if (this.votingHistory.length > 50) {
      this.votingHistory.shift()
    }
  }

  /**
   * 📊 ATUALIZAR PERFORMANCE DE CATEGORIA
   */
  updateCategoryPerformance(category: EnsembleAlgorithmType, wasCorrect: boolean): void {
    const history = this.categoryPerformanceHistory.get(category) || []
    history.push(wasCorrect ? 1.0 : 0.0)
    
    // Manter apenas os últimos 100 resultados
    if (history.length > 100) {
      history.shift()
    }
    
    this.categoryPerformanceHistory.set(category, history)
  }

  /**
   * 📋 OBTER RELATÓRIO DE VOTAÇÃO
   */
  getVotingReport(): {
    categoryWeights: CategoryWeights
    categoryPerformance: Record<EnsembleAlgorithmType, number>
    recentStability: number
  } {
    
    const categoryPerformance: Record<EnsembleAlgorithmType, number> = {} as any
    
    for (const [category, history] of this.categoryPerformanceHistory.entries()) {
      if (history.length > 0) {
        categoryPerformance[category] = history.slice(-20).reduce((sum, val) => sum + val, 0) / Math.min(20, history.length)
      } else {
        categoryPerformance[category] = 0.5
      }
    }
    
    const recentStability = this.votingHistory.length > 0 ? 
      this.calculatePredictionStability(this.votingHistory[this.votingHistory.length - 1].tier2_result) : 1.0
    
    return {
      categoryWeights: { ...this.categoryWeights },
      categoryPerformance,
      recentStability
    }
  }
} 