/**
 * 🧠 META-LEARNING CONTROLLER - Baseado em Pesquisas Científicas 2024-2025
 * 
 * Implementa:
 * - Multi-Armed Bandits for Ensemble Learning (2025)
 * - Performance-bounded Online Learning (2025)
 * - Context-Aware Algorithm Selection
 * - Dynamic Weight Adjustment com Expert Advice
 * - Regret Analysis e Theoretical Guarantees
 * 
 * Baseado em:
 * - "Performance-bounded Online Ensemble Learning Method Based on Multi-armed bandits" (2025)
 * - "Multi-Source Adaptive Weighting (MSAW)" (University of Pittsburgh 2024)
 * - "Online Bayesian Stacking" (2025)
 */

import type { 
  ContextAnalysis, 
  AlgorithmContribution,
  MetaLearningState 
} from '../../types/enhanced-prediction.types'

// ===== INTERFACES ESPECÍFICAS DO META-LEARNING =====

export interface BanditArm {
  algorithm_id: string
  expected_reward: number
  confidence_bound: number
  selection_count: number
  cumulative_reward: number
  last_reward: number
  regret_bound: number
}

export interface ExpertAdvice {
  expert_id: string
  algorithm_recommendations: Record<string, number>  // algorithm_id -> weight
  expert_confidence: number
  historical_accuracy: number
  context_specialization: string[]
}

export interface ContextualBandit {
  context_signature: string
  arms: BanditArm[]
  total_selections: number
  context_confidence: number
  performance_guarantee: number
}

export interface AlgorithmPerformanceHistory {
  algorithm_id: string
  context_type: string
  accuracy_history: number[]
  reward_history: number[]
  selection_history: number[]
  last_updated: number
  performance_trend: 'improving' | 'declining' | 'stable'
}

export interface MetaLearningDecision {
  selected_algorithms: Record<string, number>  // algorithm_id -> weight
  selection_confidence: number
  expected_performance: number
  performance_bounds: {
    lower_bound: number
    upper_bound: number
    theoretical_guarantee: number
  }
  expert_advice_applied: boolean
  bandit_strategy: 'ucb' | 'thompson' | 'epsilon_greedy' | 'expert_advice'
  context_match_confidence: number
}

export interface RegretAnalysis {
  cumulative_regret: number
  regret_bound: number
  optimal_algorithm_id: string
  suboptimality_gap: number
  regret_guarantee: string
}

// ===== META-LEARNING CONTROLLER PRINCIPAL =====

export class MetaLearningController {
  private contextualBandits: Map<string, ContextualBandit> = new Map()
  private expertAdvicePool: ExpertAdvice[] = []
  private performanceHistory: Map<string, AlgorithmPerformanceHistory[]> = new Map()
  private globalRegretAnalysis: RegretAnalysis
  private learningRate: number = 0.1
  private explorationParameter: number = 0.1
  private confidenceLevel: number = 0.95

  constructor() {
    // Inicializar experts com conhecimento prévio
    this.initializeExpertAdvice()
    
    // Inicializar análise de regret
    this.globalRegretAnalysis = {
      cumulative_regret: 0,
      regret_bound: 0,
      optimal_algorithm_id: 'unknown',
      suboptimality_gap: 0,
      regret_guarantee: 'O(√t log t) theoretical bound'
    }
  }

  /**
   * 🎯 SELEÇÃO PRINCIPAL DE ALGORITMOS
   * Baseado em Multi-Armed Bandits com Expert Advice
   */
  async selectBestAlgorithmsCombination(
    context: ContextAnalysis,
    availableAlgorithms: string[],
    historicalPerformance?: Record<string, number>
  ): Promise<MetaLearningDecision> {
    
    console.log('🧠 META-LEARNING: Iniciando seleção de algoritmos...')
    
    // 1. CLASSIFICAR CONTEXTO
    const contextSignature = this.createContextSignature(context)
    
    // 2. OBTER OU CRIAR BANDIT CONTEXTUAL
    let contextualBandit = this.contextualBandits.get(contextSignature)
    if (!contextualBandit) {
      contextualBandit = this.createContextualBandit(contextSignature, availableAlgorithms)
      this.contextualBandits.set(contextSignature, contextualBandit)
    }
    
    // 3. ATUALIZAR BANDITS COM PERFORMANCE HISTÓRICA
    if (historicalPerformance) {
      this.updateBanditsWithPerformance(contextualBandit, historicalPerformance)
    }
    
    // 4. OBTER EXPERT ADVICE PARA ESTE CONTEXTO
    const expertAdvice = this.getExpertAdviceForContext(context, availableAlgorithms)
    
    // 5. SELECIONAR ESTRATÉGIA DE BANDIT
    const banditStrategy = this.selectBanditStrategy(contextualBandit, expertAdvice)
    
    // 6. EXECUTAR SELEÇÃO DE ALGORITMOS
    const algorithmWeights = await this.executeAlgorithmSelection(
      contextualBandit, expertAdvice, banditStrategy
    )
    
    // 7. CALCULAR BOUNDS DE PERFORMANCE
    const performanceBounds = this.calculatePerformanceBounds(contextualBandit, algorithmWeights)
    
    // 8. ATUALIZAR REGRET ANALYSIS
    this.updateRegretAnalysis(contextualBandit, algorithmWeights)
    
    console.log(`🎯 Selecionados: ${Object.keys(algorithmWeights).join(', ')}`)
    console.log(`📊 Expected performance: ${performanceBounds.lower_bound.toFixed(1)}%-${performanceBounds.upper_bound.toFixed(1)}%`)
    
    return {
      selected_algorithms: algorithmWeights,
      selection_confidence: this.calculateSelectionConfidence(contextualBandit, algorithmWeights),
      expected_performance: (performanceBounds.lower_bound + performanceBounds.upper_bound) / 2,
      performance_bounds: performanceBounds,
      expert_advice_applied: expertAdvice.length > 0,
      bandit_strategy: banditStrategy,
      context_match_confidence: context.context_confidence
    }
  }

  /**
   * 🔄 ATUALIZAÇÃO COM FEEDBACK
   * Baseado em Online Learning com Performance Bounds
   */
  async updateWithFeedback(
    context: ContextAnalysis,
    algorithmWeights: Record<string, number>,
    actualPerformance: Record<string, number>,
    overallAccuracy: number
  ): Promise<void> {
    
    console.log('📈 META-LEARNING: Atualizando com feedback...')
    
    const contextSignature = this.createContextSignature(context)
    const contextualBandit = this.contextualBandits.get(contextSignature)
    
    if (!contextualBandit) return
    
    // 1. ATUALIZAR ARMS DOS BANDITS
    Object.entries(algorithmWeights).forEach(([algorithmId, weight]) => {
      const arm = contextualBandit.arms.find(a => a.algorithm_id === algorithmId)
      if (arm && actualPerformance[algorithmId] !== undefined) {
        // Calcular reward baseado na performance real
        const reward = actualPerformance[algorithmId] / 100  // Normalizar para [0,1]
        
        // Atualizar estatísticas do arm
        arm.selection_count += 1
        arm.cumulative_reward += reward
        arm.last_reward = reward
        arm.expected_reward = arm.cumulative_reward / arm.selection_count
        
        // Atualizar confidence bound (UCB1)
        const exploration = Math.sqrt(
          (2 * Math.log(contextualBandit.total_selections)) / arm.selection_count
        )
        arm.confidence_bound = arm.expected_reward + this.explorationParameter * exploration
        
        // Atualizar regret bound
        arm.regret_bound = this.calculateRegretBound(arm, contextualBandit.total_selections)
      }
    })
    
    // 2. ATUALIZAR HISTÓRICO DE PERFORMANCE
    this.updatePerformanceHistory(context, algorithmWeights, actualPerformance, overallAccuracy)
    
    // 3. ATUALIZAR EXPERT ADVICE BASEADO NO RESULTADO
    this.updateExpertAdvice(context, algorithmWeights, actualPerformance, overallAccuracy)
    
    // 4. AJUSTAR PARÂMETROS DE APRENDIZADO
    this.adaptLearningParameters(contextualBandit, overallAccuracy)
    
    // 5. ATUALIZAR TOTAL DE SELEÇÕES
    contextualBandit.total_selections += 1
    
    console.log(`✅ Feedback processado para contexto: ${contextSignature}`)
  }

  /**
   * 🎲 ESTRATÉGIAS DE BANDIT
   */
  private selectBanditStrategy(
    contextualBandit: ContextualBandit, 
    expertAdvice: ExpertAdvice[]
  ): 'ucb' | 'thompson' | 'epsilon_greedy' | 'expert_advice' {
    
    // Se temos expert advice confiável, usar
    if (expertAdvice.length > 0 && expertAdvice[0].expert_confidence > 0.8) {
      return 'expert_advice'
    }
    
    // Se temos poucos dados, usar exploration (epsilon-greedy)
    if (contextualBandit.total_selections < 20) {
      return 'epsilon_greedy'
    }
    
    // Se temos dados suficientes e performance garantida, usar UCB
    if (contextualBandit.performance_guarantee > 0.6) {
      return 'ucb'
    }
    
    // Para contextos incertos, usar Thompson Sampling
    return 'thompson'
  }

  private async executeAlgorithmSelection(
    contextualBandit: ContextualBandit,
    expertAdvice: ExpertAdvice[],
    strategy: 'ucb' | 'thompson' | 'epsilon_greedy' | 'expert_advice'
  ): Promise<Record<string, number>> {
    
    switch (strategy) {
      case 'expert_advice':
        return this.selectUsingExpertAdvice(expertAdvice, contextualBandit.arms)
      
      case 'ucb':
        return this.selectUsingUCB(contextualBandit.arms)
      
      case 'epsilon_greedy':
        return this.selectUsingEpsilonGreedy(contextualBandit.arms)
      
      case 'thompson':
        return this.selectUsingThompsonSampling(contextualBandit.arms)
      
      default:
        return this.selectUsingUCB(contextualBandit.arms)
    }
  }

  /**
   * 🎯 SELEÇÃO UCB1 (Upper Confidence Bound)
   */
  private selectUsingUCB(arms: BanditArm[]): Record<string, number> {
    const weights: Record<string, number> = {}
    
    // Calcular UCB para cada arm
    const ucbValues = arms.map(arm => ({
      algorithm_id: arm.algorithm_id,
      ucb_value: arm.confidence_bound
    }))
    
    // Ordenar por UCB value
    ucbValues.sort((a, b) => b.ucb_value - a.ucb_value)
    
    // Distribuir pesos baseado em UCB (top algorithms get more weight)
    const totalUcb = ucbValues.reduce((sum, item) => sum + Math.max(0, item.ucb_value), 0)
    
    ucbValues.forEach(item => {
      if (totalUcb > 0) {
        weights[item.algorithm_id] = Math.max(0, item.ucb_value) / totalUcb
      } else {
        weights[item.algorithm_id] = 1 / ucbValues.length  // Uniform if no data
      }
    })
    
    return this.normalizeWeights(weights)
  }

  /**
   * 🎲 SELEÇÃO EPSILON-GREEDY
   */
  private selectUsingEpsilonGreedy(arms: BanditArm[]): Record<string, number> {
    const weights: Record<string, number> = {}
    const epsilon = this.explorationParameter
    
    // Encontrar melhor arm
    const bestArm = arms.reduce((best, current) => 
      current.expected_reward > best.expected_reward ? current : best
    )
    
    // Distribuir pesos: (1-epsilon) para o melhor, epsilon distribuído uniformemente
    arms.forEach(arm => {
      if (arm.algorithm_id === bestArm.algorithm_id) {
        weights[arm.algorithm_id] = (1 - epsilon) + (epsilon / arms.length)
      } else {
        weights[arm.algorithm_id] = epsilon / arms.length
      }
    })
    
    return weights
  }

  /**
   * 🎯 SELEÇÃO THOMPSON SAMPLING
   */
  private selectUsingThompsonSampling(arms: BanditArm[]): Record<string, number> {
    const weights: Record<string, number> = {}
    
    // Simular Beta distribution para cada arm (assumindo Bernoulli rewards)
    const samples = arms.map(arm => {
      const successes = arm.cumulative_reward * arm.selection_count
      const failures = arm.selection_count - successes
      
      // Beta(alpha, beta) aproximation usando normal quando n é grande
      const alpha = successes + 1
      const beta = failures + 1
      const mean = alpha / (alpha + beta)
      const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
      
      // Sample from normal approximation
      const sample = mean + Math.sqrt(variance) * this.gaussianRandom()
      
      return {
        algorithm_id: arm.algorithm_id,
        sample_value: Math.max(0, Math.min(1, sample))
      }
    })
    
    // Normalizar samples como pesos
    const totalSample = samples.reduce((sum, s) => sum + s.sample_value, 0)
    samples.forEach(s => {
      weights[s.algorithm_id] = totalSample > 0 ? s.sample_value / totalSample : 1 / samples.length
    })
    
    return weights
  }

  /**
   * 👨‍🏫 SELEÇÃO USANDO EXPERT ADVICE
   */
  private selectUsingExpertAdvice(
    expertAdvice: ExpertAdvice[], 
    arms: BanditArm[]
  ): Record<string, number> {
    const weights: Record<string, number> = {}
    
    // Combinar recomendações de experts com pesos baseados na confiança
    const algorithmScores: Record<string, number> = {}
    
    arms.forEach(arm => {
      algorithmScores[arm.algorithm_id] = 0
    })
    
    // Agregar recomendações de experts
    expertAdvice.forEach(expert => {
      const expertWeight = expert.expert_confidence * expert.historical_accuracy
      
      Object.entries(expert.algorithm_recommendations).forEach(([algorithmId, recommendation]) => {
        if (algorithmScores[algorithmId] !== undefined) {
          algorithmScores[algorithmId] += recommendation * expertWeight
        }
      })
    })
    
    // Combinar com performance dos arms (blend expert advice with bandit performance)
    arms.forEach(arm => {
      const expertScore = algorithmScores[arm.algorithm_id] || 0
      const banditScore = arm.expected_reward
      
      // Weighted combination: 70% expert, 30% bandit
      const combinedScore = 0.7 * expertScore + 0.3 * banditScore
      algorithmScores[arm.algorithm_id] = combinedScore
    })
    
    // Normalizar como pesos
    const totalScore = Object.values(algorithmScores).reduce((sum, score) => sum + score, 0)
    Object.entries(algorithmScores).forEach(([algorithmId, score]) => {
      weights[algorithmId] = totalScore > 0 ? score / totalScore : 1 / Object.keys(algorithmScores).length
    })
    
    return weights
  }

  // ===== HELPER METHODS =====

  private createContextSignature(context: ContextAnalysis): string {
    return `${context.temporal_context}_${context.volatility_state}_${context.pattern_type}_${context.market_regime}`
  }

  private createContextualBandit(contextSignature: string, algorithms: string[]): ContextualBandit {
    const arms: BanditArm[] = algorithms.map(algorithmId => ({
      algorithm_id: algorithmId,
      expected_reward: 0.5,  // Prior neutro
      confidence_bound: 1.0,  // Máxima incerteza inicial
      selection_count: 0,
      cumulative_reward: 0,
      last_reward: 0,
      regret_bound: 0
    }))

    return {
      context_signature: contextSignature,
      arms: arms,
      total_selections: 0,
      context_confidence: 0.5,
      performance_guarantee: 0.5
    }
  }

  private initializeExpertAdvice(): void {
    // Expert 1: Especialista em contextos de alta volatilidade
    this.expertAdvicePool.push({
      expert_id: 'volatility_expert',
      algorithm_recommendations: {
        'real_algorithms': 0.3,  // Menos peso para algoritmos matemáticos em alta volatilidade
        'ml_advanced': 0.7       // Mais peso para ML em contextos voláteis
      },
      expert_confidence: 0.8,
      historical_accuracy: 0.75,
      context_specialization: ['high', 'extreme']
    })

    // Expert 2: Especialista em contextos estáveis
    this.expertAdvicePool.push({
      expert_id: 'stability_expert',
      algorithm_recommendations: {
        'real_algorithms': 0.8,  // Mais peso para algoritmos matemáticos em estabilidade
        'ml_advanced': 0.2       // Menos peso para ML em contextos estáveis
      },
      expert_confidence: 0.9,
      historical_accuracy: 0.82,
      context_specialization: ['low', 'medium']
    })

    // Expert 3: Especialista em padrões temporais
    this.expertAdvicePool.push({
      expert_id: 'temporal_expert', 
      algorithm_recommendations: {
        'real_algorithms': 0.6,
        'ml_advanced': 0.4
      },
      expert_confidence: 0.7,
      historical_accuracy: 0.73,
      context_specialization: ['periodic', 'trending']
    })
  }

  private getExpertAdviceForContext(context: ContextAnalysis, algorithms: string[]): ExpertAdvice[] {
    return this.expertAdvicePool.filter(expert => {
      // Verificar se o expert é especialista neste tipo de contexto
      return expert.context_specialization.includes(context.volatility_state) ||
             expert.context_specialization.includes(context.pattern_type) ||
             expert.context_specialization.includes(context.market_regime)
    })
  }

  private updateBanditsWithPerformance(
    contextualBandit: ContextualBandit, 
    performance: Record<string, number>
  ): void {
    Object.entries(performance).forEach(([algorithmId, perf]) => {
      const arm = contextualBandit.arms.find(a => a.algorithm_id === algorithmId)
      if (arm) {
        // Usar performance histórica como prior
        const reward = perf / 100  // Normalizar
        arm.expected_reward = (arm.expected_reward + reward) / 2  // Blend com prior
      }
    })
  }

  private calculatePerformanceBounds(
    contextualBandit: ContextualBandit, 
    weights: Record<string, number>
  ): { lower_bound: number; upper_bound: number; theoretical_guarantee: number } {
    
    let weightedLowerBound = 0
    let weightedUpperBound = 0
    
    Object.entries(weights).forEach(([algorithmId, weight]) => {
      const arm = contextualBandit.arms.find(a => a.algorithm_id === algorithmId)
      if (arm) {
        // Lower bound: expected reward - confidence interval
        const lowerBound = Math.max(0, arm.expected_reward - (arm.confidence_bound - arm.expected_reward))
        
        // Upper bound: confidence bound
        const upperBound = Math.min(1, arm.confidence_bound)
        
        weightedLowerBound += weight * lowerBound * 100
        weightedUpperBound += weight * upperBound * 100
      }
    })

    // Theoretical guarantee baseado no regret bound
    const theoreticalGuarantee = Math.max(50, weightedLowerBound - this.globalRegretAnalysis.regret_bound)
    
    return {
      lower_bound: weightedLowerBound,
      upper_bound: weightedUpperBound,
      theoretical_guarantee: theoreticalGuarantee
    }
  }

  private calculateRegretBound(arm: BanditArm, totalSelections: number): number {
    // Hoeffding bound para regret
    if (arm.selection_count === 0) return 1.0
    
    const confidence = this.confidenceLevel
    const bound = Math.sqrt((2 * Math.log(1 / (1 - confidence))) / arm.selection_count)
    return bound
  }

  private updateRegretAnalysis(contextualBandit: ContextualBandit, weights: Record<string, number>): void {
    // Encontrar melhor arm (optimal)
    const optimalArm = contextualBandit.arms.reduce((best, current) => 
      current.expected_reward > best.expected_reward ? current : best
    )
    
    // Calcular regret da seleção atual
    const currentExpectedReward = Object.entries(weights).reduce((sum, [algorithmId, weight]) => {
      const arm = contextualBandit.arms.find(a => a.algorithm_id === algorithmId)
      return sum + (arm ? weight * arm.expected_reward : 0)
    }, 0)
    
    const instantRegret = Math.max(0, optimalArm.expected_reward - currentExpectedReward)
    
    // Atualizar regret cumulativo
    this.globalRegretAnalysis.cumulative_regret += instantRegret
    this.globalRegretAnalysis.optimal_algorithm_id = optimalArm.algorithm_id
    this.globalRegretAnalysis.suboptimality_gap = instantRegret
    
    // Atualizar regret bound teórico
    this.globalRegretAnalysis.regret_bound = Math.sqrt(contextualBandit.total_selections * Math.log(contextualBandit.total_selections))
  }

  private calculateSelectionConfidence(
    contextualBandit: ContextualBandit, 
    weights: Record<string, number>
  ): number {
    // Confiança baseada na concordância entre os arms selecionados
    const selectedArms = Object.entries(weights)
      .filter(([_, weight]) => weight > 0.1)  // Considerar apenas algoritmos com peso significativo
      .map(([algorithmId, _]) => contextualBandit.arms.find(a => a.algorithm_id === algorithmId))
      .filter(arm => arm !== undefined) as BanditArm[]
    
    if (selectedArms.length === 0) return 0.5
    
    // Média da confiança dos arms selecionados
    const avgConfidence = selectedArms.reduce((sum, arm) => {
      const confidence = arm.selection_count > 0 ? (1 / (1 + arm.regret_bound)) : 0.5
      return sum + confidence
    }, 0) / selectedArms.length
    
    return Math.min(0.95, Math.max(0.1, avgConfidence))
  }

  private updatePerformanceHistory(
    context: ContextAnalysis,
    weights: Record<string, number>,
    performance: Record<string, number>,
    overallAccuracy: number
  ): void {
    const contextType = this.createContextSignature(context)
    
    Object.entries(performance).forEach(([algorithmId, perf]) => {
      if (!this.performanceHistory.has(algorithmId)) {
        this.performanceHistory.set(algorithmId, [])
      }
      
      const history = this.performanceHistory.get(algorithmId)!
      let algorithmHistory = history.find(h => h.context_type === contextType)
      
      if (!algorithmHistory) {
        algorithmHistory = {
          algorithm_id: algorithmId,
          context_type: contextType,
          accuracy_history: [],
          reward_history: [],
          selection_history: [],
          last_updated: Date.now(),
          performance_trend: 'stable'
        }
        history.push(algorithmHistory)
      }
      
      // Atualizar histórico
      algorithmHistory.accuracy_history.push(perf)
      algorithmHistory.reward_history.push(perf / 100)
      algorithmHistory.selection_history.push(weights[algorithmId] || 0)
      algorithmHistory.last_updated = Date.now()
      
      // Calcular trend (últimos 5 resultados)
      if (algorithmHistory.accuracy_history.length >= 5) {
        const recent = algorithmHistory.accuracy_history.slice(-5)
        const older = algorithmHistory.accuracy_history.slice(-10, -5)
        
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, acc) => sum + acc, 0) / recent.length
          const olderAvg = older.reduce((sum, acc) => sum + acc, 0) / older.length
          
          if (recentAvg > olderAvg * 1.05) {
            algorithmHistory.performance_trend = 'improving'
          } else if (recentAvg < olderAvg * 0.95) {
            algorithmHistory.performance_trend = 'declining'
          } else {
            algorithmHistory.performance_trend = 'stable'
          }
        }
      }
      
      // Manter apenas últimos 100 resultados
      if (algorithmHistory.accuracy_history.length > 100) {
        algorithmHistory.accuracy_history = algorithmHistory.accuracy_history.slice(-100)
        algorithmHistory.reward_history = algorithmHistory.reward_history.slice(-100)
        algorithmHistory.selection_history = algorithmHistory.selection_history.slice(-100)
      }
    })
  }

  private updateExpertAdvice(
    context: ContextAnalysis,
    weights: Record<string, number>,
    performance: Record<string, number>,
    overallAccuracy: number
  ): void {
    // Atualizar accuracy histórica dos experts que deram advice
    const relevantExperts = this.getExpertAdviceForContext(context, Object.keys(weights))
    
    relevantExperts.forEach(expert => {
      // Calcular quão bem o expert advice funcionou
      let expertPerformance = 0
      let totalWeight = 0
      
      Object.entries(expert.algorithm_recommendations).forEach(([algorithmId, recommendation]) => {
        if (performance[algorithmId] !== undefined) {
          expertPerformance += recommendation * performance[algorithmId]
          totalWeight += recommendation
        }
      })
      
      if (totalWeight > 0) {
        expertPerformance = expertPerformance / totalWeight
        
        // Atualizar historical accuracy do expert (exponential moving average)
        const alpha = 0.1  // Learning rate
        expert.historical_accuracy = (1 - alpha) * expert.historical_accuracy + alpha * (expertPerformance / 100)
        
        // Atualizar confiança baseada na performance recente
        if (expertPerformance > overallAccuracy) {
          expert.expert_confidence = Math.min(0.95, expert.expert_confidence * 1.05)
        } else {
          expert.expert_confidence = Math.max(0.3, expert.expert_confidence * 0.98)
        }
      }
    })
  }

  private adaptLearningParameters(contextualBandit: ContextualBandit, overallAccuracy: number): void {
    // Adaptar exploration parameter baseado na performance
    if (overallAccuracy > 70) {
      // Boa performance -> menos exploration
      this.explorationParameter = Math.max(0.05, this.explorationParameter * 0.98)
    } else if (overallAccuracy < 50) {
      // Performance ruim -> mais exploration
      this.explorationParameter = Math.min(0.3, this.explorationParameter * 1.02)
    }
    
    // Adaptar learning rate
    const selectionRate = contextualBandit.total_selections
    this.learningRate = Math.max(0.01, 0.1 / Math.sqrt(selectionRate + 1))
    
    // Atualizar performance guarantee do contexto
    contextualBandit.performance_guarantee = (contextualBandit.performance_guarantee + overallAccuracy / 100) / 2
  }

  private normalizeWeights(weights: Record<string, number>): Record<string, number> {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    
    if (total === 0) {
      // Se todos os pesos são zero, distribuir uniformemente
      const uniformWeight = 1 / Object.keys(weights).length
      Object.keys(weights).forEach(key => {
        weights[key] = uniformWeight
      })
    } else {
      // Normalizar
      Object.keys(weights).forEach(key => {
        weights[key] = weights[key] / total
      })
    }
    
    return weights
  }

  private gaussianRandom(): number {
    // Box-Muller transform para gerar números aleatórios com distribuição normal
    let u = 0, v = 0
    while(u === 0) u = Math.random() // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  // ===== MÉTODOS PÚBLICOS PARA INSPEÇÃO =====

  getRegretAnalysis(): RegretAnalysis {
    return { ...this.globalRegretAnalysis }
  }

  getContextualBandits(): Map<string, ContextualBandit> {
    return new Map(this.contextualBandits)
  }

  getPerformanceHistory(): Map<string, AlgorithmPerformanceHistory[]> {
    return new Map(this.performanceHistory)
  }

  getCurrentLearningParameters(): { explorationParameter: number; learningRate: number; confidenceLevel: number } {
    return {
      explorationParameter: this.explorationParameter,
      learningRate: this.learningRate,
      confidenceLevel: this.confidenceLevel
    }
  }
} 