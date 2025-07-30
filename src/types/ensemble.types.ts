/**
 * 🤖 SMART ENSEMBLE ENGINE - Types & Interfaces
 * 
 * Baseado em pesquisas científicas 2024-2025:
 * - Adaptive Boosting with Dynamic Weight Adjustment (2024)
 * - AWARE-NET Two-Tier Ensemble (2025) 
 * - Online Bayesian Stacking (2025)
 * - Multi-Source Adaptive Weighting (MSAW 2024)
 */

// ===== TIPOS BÁSICOS =====

export type EnsembleAlgorithmType = 'mathematical' | 'machine_learning' | 'advanced_scientific';

export interface AlgorithmInfo {
  id: string;
  name: string;
  type: EnsembleAlgorithmType;
  description: string;
}

// ===== INTERFACES PRINCIPAIS =====

export interface AlgorithmAccuracy {
  algorithm_id: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  last_accuracy: number; // Últimas N predições
  last_updated: number;
  
  // Métricas de contexto
  context_performance: Record<string, number>; // performance por contexto
  time_performance: Record<string, number>; // performance por hora do dia
  trend_performance: Record<string, number>; // performance por tendência
}

export interface DynamicWeight {
  algorithm_id: string;
  base_weight: number; // Peso histórico
  recent_weight: number; // Peso recente (últimas 20)
  context_weight: number; // Peso ajustado por contexto
  confidence_weight: number; // Peso ajustado por confiança
  final_weight: number; // Peso final combinado
  decay_factor: number; // Fator de decaimento temporal
  
  // Meta-informações
  weight_source: 'historical' | 'recent' | 'context' | 'hybrid';
  confidence_level: number;
  last_updated: number;
}

export interface EnsemblePrediction {
  // Predição final
  final_color: 'red' | 'black' | 'white';
  final_number: number;
  final_confidence: number;
  
  // Consenso hierárquico
  tier1_consensus: {
    mathematical: TierConsensus;
    machine_learning: TierConsensus;
    advanced_scientific: TierConsensus;
  };
  
  tier2_consensus: {
    color_votes: Record<string, number>;
    number_weighted_avg: number;
    confidence_avg: number;
  };
  
  // Contribuições individuais
  algorithm_contributions: AlgorithmContribution[];
  
  // Métricas do ensemble
  consensus_strength: number; // Quão forte é o consenso (0-1)
  prediction_stability: number; // Estabilidade da predição
  uncertainty_level: number; // Nível de incerteza
  
  // Meta-dados
  algorithms_used: string[];
  total_weight_sum: number;
  prediction_timestamp: number;
}

export interface TierConsensus {
  color: 'red' | 'black' | 'white';
  number: number;
  confidence: number;
  algorithms_count: number;
  weight_sum: number;
  agreement_score: number; // Nível de concordância (0-1)
}

export interface AlgorithmContribution {
  algorithm_id: string;
  algorithm_type: EnsembleAlgorithmType;
  predicted_color: 'red' | 'black' | 'white';
  predicted_number: number;
  confidence: number;
  weight_used: number;
  contribution_score: number; // Impacto na decisão final
  
  // Análise da contribuição
  alignment_with_consensus: number; // Alinhamento com consenso
  historical_reliability: number; // Confiabilidade histórica
  context_relevance: number; // Relevância para contexto atual
}

// ===== CONCEPT DRIFT =====

export interface ConceptDriftSignal {
  algorithm_id: string;
  drift_type: 'gradual' | 'sudden' | 'recurring' | 'seasonal';
  drift_strength: number; // 0-1 (força da mudança)
  drift_confidence: number; // Confiança na detecção
  
  // Detalhes do drift
  performance_before: number;
  performance_after: number;
  performance_drop: number;
  detection_timestamp: number;
  
  // Ações recomendadas
  recommended_action: 'reduce_weight' | 'temporary_disable' | 'retrain' | 'monitor';
  recovery_timeline: number; // Tempo estimado para recuperação
  
  // Contexto da mudança
  context_factors: string[]; // Fatores que podem ter causado
  similar_past_events: ConceptDriftEvent[];
}

export interface ConceptDriftEvent {
  event_id: string;
  algorithm_id: string;
  event_type: string;
  timestamp: number;
  recovery_time: number;
  impact_severity: number;
}

// ===== ADAPTIVE WEIGHTING =====

export interface AdaptiveWeightingConfig {
  // Configurações de decaimento temporal
  decay_rate: number; // Taxa de decaimento (ex: 0.95)
  recent_window: number; // Janela para performance recente (ex: 20)
  historical_window: number; // Janela histórica (ex: 100)
  
  // Configurações de contexto
  context_sensitivity: number; // Sensibilidade ao contexto (0-1)
  time_sensitivity: number; // Sensibilidade ao horário (0-1)
  trend_sensitivity: number; // Sensibilidade à tendência (0-1)
  
  // Configurações de confiança
  confidence_threshold: number; // Threshold mínimo de confiança
  overconfidence_penalty: number; // Penalidade por overconfidence
  underconfidence_boost: number; // Boost por underconfidence
  
  // Configurações de drift
  drift_detection_enabled: boolean;
  drift_sensitivity: number; // Sensibilidade à detecção de drift
  recovery_patience: number; // Tempo para recuperação automática
  
  // Thompson Sampling para exploração
  exploration_rate: number; // Taxa de exploração (0-1)
  min_algorithm_weight: number; // Peso mínimo para qualquer algoritmo
}

// ===== PERFORMANCE TRACKING =====

export interface EnsemblePerformanceMetrics {
  ensemble_id: string;
  
  // Métricas básicas
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  
  // Métricas por categoria
  color_accuracy: number;
  number_accuracy: number;
  confidence_calibration: number;
  
  // Métricas avançadas
  consensus_reliability: number; // Confiabilidade do consenso
  stability_score: number; // Estabilidade das predições
  adaptation_speed: number; // Velocidade de adaptação
  
  // Comparação com algoritmos individuais
  improvement_over_best: number; // Melhoria sobre o melhor individual
  improvement_over_average: number; // Melhoria sobre média individual
  
  // Meta-dados
  measurement_period: [number, number]; // [início, fim]
  algorithms_included: string[];
  last_updated: number;
}

// ===== CONFIGURAÇÕES DO SISTEMA =====

export interface SmartEnsembleConfig {
  // Configurações gerais
  enabled: boolean;
  mode: 'simple' | 'advanced' | 'scientific'; // Modos de operação
  
  // Configurações de algoritmos
  algorithms_config: Record<string, AlgorithmConfig>;
  
  // Configurações de voting
  voting_strategy: 'weighted_majority' | 'hierarchical' | 'adaptive_bayesian';
  tie_breaking_strategy: 'confidence' | 'historical' | 'random';
  
  // Configurações adaptativas
  adaptive_weighting: AdaptiveWeightingConfig;
  
  // Configurações de logging
  log_predictions: boolean;
  log_weights: boolean;
  log_performance: boolean;
  
  // Configurações de Supabase
  supabase_tables: {
    algorithm_accuracy: string;
    ensemble_predictions: string;
    performance_metrics: string;
    concept_drift_events: string;
  };
}

export interface AlgorithmConfig {
  algorithm_id: string;
  enabled: boolean;
  type: EnsembleAlgorithmType;
  base_weight: number;
  min_weight: number;
  max_weight: number;
  
  // Configurações específicas
  drift_detection_enabled: boolean;
  context_adaptation_enabled: boolean;
  confidence_calibration_enabled: boolean;
  
  // Configurações de performance
  required_min_predictions: number; // Mínimo de predições para usar
  performance_threshold: number; // Threshold mínimo de performance
  
  // Meta-dados
  description: string;
  last_updated: number;
}

// ===== INTERFACES DE ENTRADA =====

export interface AlgorithmPredictionInput {
  algorithm_id: string;
  algorithm_type: EnsembleAlgorithmType;
  predicted_color: 'red' | 'black' | 'white';
  predicted_number: number;
  confidence: number;
  reasoning?: string[];
  mathematical_proof?: string;
  dataPoints?: number;
}

export interface PredictionContext {
  current_time: number;
  historical_data_length: number;
  recent_trend: 'bullish' | 'bearish' | 'neutral';
  volatility_level: 'low' | 'medium' | 'high';
  gap_analysis: any;
  time_since_last_white: number;
  
  // Contexto temporal
  hour_of_day: number;
  day_of_week: number;
  time_session: 'morning' | 'afternoon' | 'evening' | 'night';
  
  // Contexto de padrões
  pattern_strength: number;
  pattern_consistency: number;
  anomaly_score: number;
}

// ===== INTERFACES DE RESULTADO =====

export interface EnsembleResult {
  success: boolean;
  prediction?: EnsemblePrediction;
  error?: string;
  
  // Diagnósticos
  diagnostics: {
    algorithms_processed: number;
    algorithms_failed: number;
    total_processing_time: number;
    consensus_achieved: boolean;
    drift_detected: boolean;
    warnings: string[];
  };
  
  // Meta-dados
  ensemble_version: string;
  processing_timestamp: number;
} 