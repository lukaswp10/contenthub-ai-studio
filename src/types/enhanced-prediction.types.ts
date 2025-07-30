/**
 * 🧠 ENHANCED PREDICTION TYPES - Baseado em Pesquisas Científicas 2024-2025
 * 
 * Implementa:
 * - TimeFuse Framework (ICML 2025)
 * - Online Bayesian Stacking (2025) 
 * - Meta-Learning for Temporal Sequences (2025)
 * - Uncertainty Quantification (Bayesian Intervals)
 * - Context-Aware Prediction Systems
 */

import type { Prediction } from '../pages/teste-jogo/components/BlazeDataProvider'

// ===== UNCERTAINTY QUANTIFICATION =====
export interface UncertaintyMetrics {
  epistemic_uncertainty: number      // Incerteza do modelo (0-100%)
  aleatoric_uncertainty: number      // Incerteza dos dados (0-100%)
  bayesian_intervals: BayesianIntervals
  confidence_calibration: number     // Quão bem calibrada está a confiança (0-100%)
  meta_uncertainty: number          // Incerteza da meta-predição (0-100%)
}

export interface BayesianIntervals {
  lower_bound: number               // Limite inferior (95% credible interval)
  upper_bound: number               // Limite superior (95% credible interval)
  mean_estimate: number             // Estimativa média
  standard_deviation: number        // Desvio padrão
}

// ===== ALGORITHM CONTRIBUTIONS =====
export interface AlgorithmContribution {
  algorithm: string                 // Nome do algoritmo
  weight: number                   // Peso adaptativo (0-100%)
  confidence: number               // Confiança específica (0-100%)
  local_accuracy: number           // Accuracy no contexto atual (0-100%)
  portfolio_allocation: number     // Alocação no portfolio (0-100%)
}

// ===== CONTEXT ANALYSIS =====
export interface ContextAnalysis {
  temporal_context: 'morning' | 'afternoon' | 'evening' | 'night'
  volatility_state: 'low' | 'medium' | 'high' | 'extreme'
  streak_pattern: 'short' | 'medium' | 'long' | 'broken'
  pattern_type: 'periodic' | 'random' | 'trending' | 'reverting'
  market_regime: 'stable' | 'volatile' | 'trending' | 'chaotic'
  context_confidence: number       // Confiança na classificação do contexto
}

// ===== META-LEARNING STATE =====
export interface MetaLearningState {
  learning_phase: 'exploration' | 'exploitation' | 'adaptation'
  algorithm_selection_confidence: number
  adaptation_rate: number          // Taxa de adaptação atual
  context_switching_detected: boolean
  meta_model_version: string
  last_update_timestamp: number
}

// ===== FUSION WEIGHTS =====
export interface FusionWeights {
  sample_level_weights: Record<string, number>  // Pesos específicos desta amostra
  adaptive_fusion_factor: number               // Fator de fusão adaptativa
  portfolio_weights: Record<string, number>    // Pesos tipo portfolio
  temporal_decay_factor: number               // Fator de decaimento temporal
  meta_learning_boost: number                 // Boost do meta-learning
}

// ===== QUANTUM-INSPIRED SUPERPOSITION =====
export interface QuantumSuperposition {
  superposition_states: SuperpositionState[]
  entanglement_patterns: EntanglementPattern[]
  measurement_collapse_probability: number
  quantum_coherence: number
}

export interface SuperpositionState {
  state_id: string
  probability_amplitude: number
  phase: number
  measurement_outcome: 'red' | 'black' | 'white'
}

export interface EntanglementPattern {
  pattern_id: string
  correlated_algorithms: string[]
  entanglement_strength: number
  decoherence_time: number
}

// ===== META-PATTERN ECHO =====
export interface MetaPatternEcho {
  detected_meta_patterns: MetaPattern[]
  echo_reconstruction: EchoReconstruction[]
  pattern_pool_size: number
  echo_mechanism_confidence: number
}

export interface MetaPattern {
  pattern_id: string
  pattern_type: 'cyclical' | 'momentum' | 'reversal' | 'breakout'
  strength: number
  temporal_signature: number[]
  occurrence_probability: number
}

export interface EchoReconstruction {
  reconstruction_id: string
  original_pattern: string
  reconstructed_sequence: number[]
  reconstruction_fidelity: number
  adaptive_boost_factor: number
}

// ===== ENHANCED PREDICTION PRINCIPAL =====
export interface EnhancedPrediction extends Prediction {
  // Campos originais mantidos para compatibilidade
  color: 'red' | 'black' | 'white'
  number: number
  confidence: number
  algorithms: string[]
  timestamp: number
  
  // ===== TÉCNICAS CIENTÍFICAS 2024-2025 =====
  
  // 1. Uncertainty Quantification com Intervalos Bayesianos
  uncertainty_metrics: UncertaintyMetrics
  
  // 2. Sample-level Adaptive Fusion 
  algorithm_contributions: AlgorithmContribution[]
  
  // 3. Context-aware Meta-learning
  context_analysis: ContextAnalysis
  
  // 4. Portfolio Optimization para Algoritmos
  fusion_weights: FusionWeights
  
  // 5. Meta-learning State
  meta_learning_state: MetaLearningState
  
  // 6. Quantum-inspired Superposition (opcional)
  quantum_superposition?: QuantumSuperposition
  
  // 7. Meta-pattern Echo Mechanism
  meta_pattern_echo?: MetaPatternEcho
  
  // ===== EXPLICABILIDADE =====
  fusion_explanation: string[]      // Como a fusão foi realizada
  scientific_reasoning: string[]    // Raciocínio científico
  confidence_breakdown: Record<string, number>  // Breakdown da confiança
  risk_assessment: 'low' | 'medium' | 'high'
  
  // ===== BETTING OPTIMIZATION =====
  expected_value: number           // Valor esperado da aposta
  kelly_criterion_percentage: number  // % da banca (Kelly Criterion)
  recommended_bet_type: string     // Tipo de aposta recomendada
  roi_potential: number           // Potencial de retorno
}

// ===== PREDICTION CONTEXT =====
export interface PredictionContext {
  current_numbers: any[]          // Números atuais
  sample_size: number            // Tamanho da amostra
  temporal_features: TemporalFeatures
  volatility_features: VolatilityFeatures
  pattern_features: PatternFeatures
  meta_features: MetaFeatures
}

export interface TemporalFeatures {
  hour_of_day: number
  day_of_week: number
  time_since_last_white: number
  sequence_length: number
  moving_averages: number[]
}

export interface VolatilityFeatures {
  current_volatility: number
  volatility_regime: string
  volatility_trend: 'increasing' | 'decreasing' | 'stable'
  volatility_percentile: number
}

export interface PatternFeatures {
  streak_length: number
  color_distribution: Record<string, number>
  gap_analysis: Record<string, number>
  periodicity_detected: boolean
  dominant_frequency: number
}

export interface MetaFeatures {
  data_quality_score: number
  prediction_complexity: number
  context_stability: number
  algorithm_agreement: number
  historical_context_match: number
}

// ===== FUSION RESULT =====
export interface FusionResult {
  final_prediction: EnhancedPrediction
  fusion_confidence: number
  algorithm_consensus: number
  uncertainty_resolved: number
  meta_learning_applied: boolean
  quantum_effects_detected: boolean
} 