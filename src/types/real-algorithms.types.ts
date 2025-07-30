/**
 * 🎯 TIPOS PARA ALGORITMOS REAIS - DADOS APENAS
 * Sem simulações, apenas matemática real baseada em dados históricos da Blaze
 */

export interface BlazeNumber {
  number: number;
  color: 'red' | 'black' | 'white';
  timestamp: number;
  id: string;
}

export interface RealAlgorithmResult {
  algorithm: string;
  color: 'red' | 'black' | 'white';
  number: number;
  confidence: number; // Baseado em dados reais, não random
  reasoning: string[];
  dataPoints: number; // Quantidade de dados usados
  mathematical_proof: string; // Prova matemática da predição
}

export interface ROIAnalysis {
  red_black_payout: 2; // 2x
  white_payout: 14; // 14x
  expected_value_red: number; // EV real
  expected_value_black: number; // EV real
  expected_value_white: number; // EV real
  optimal_bet_color: 'red' | 'black' | 'white';
  kelly_criterion: number; // % da banca para apostar
}

export interface WhiteGoldAlgorithm {
  name: 'WHITE_GOLD_DETECTOR';
  white_frequency: number; // Frequência real de brancos
  pressure_cooker_value: number; // Pressão acumulada
  last_white_gap: number; // Números desde último branco
  expected_white_cycle: number; // Ciclo esperado baseado em dados
  white_probability: number; // Probabilidade real (não random)
  roi_potential: number; // Potencial de lucro (14x)
}

export interface FrequencyCompensationAlgorithm {
  name: 'FREQUENCY_COMPENSATION';
  red_deficit: number; // Déficit real vs expectativa teórica
  black_deficit: number; // Déficit real vs expectativa teórica  
  white_deficit: number; // Déficit real vs expectativa teórica
  most_underrepresented: 'red' | 'black' | 'white';
  compensation_strength: number; // Força da compensação baseada em dados
}

export interface GapAnalysisAlgorithm {
  name: 'GAP_ANALYSIS';
  red_numbers_gaps: { [key: number]: number }; // Gap real para cada número vermelho
  black_numbers_gaps: { [key: number]: number }; // Gap real para cada número preto
  white_gap: number; // Gap real do branco
  highest_gap_number: number; // Número com maior gap real
  gap_urgency: number; // Urgência baseada em dados históricos
}

export interface MarkovChainAlgorithm {
  name: 'MARKOV_CHAIN_REAL';
  transition_matrix: number[][]; // Matriz real de transições (15x15)
  current_state: number; // Estado atual (último número)
  next_probabilities: number[]; // Probabilidades reais para próximo número
  most_likely_next: number; // Número mais provável matematicamente
  chain_confidence: number; // Confiança baseada em tamanho da amostra
}

export interface RealPredictionResult {
  algorithms_used: RealAlgorithmResult[];
  consensus_color: 'red' | 'black' | 'white';
  consensus_number: number;
  mathematical_confidence: number; // Confiança matemática real
  roi_analysis: ROIAnalysis;
  expected_profit_percentage: number; // % de lucro esperado real
  sample_size: number; // Quantidade de dados analisados
  proof_of_work: string[]; // Provas matemáticas das predições
} 