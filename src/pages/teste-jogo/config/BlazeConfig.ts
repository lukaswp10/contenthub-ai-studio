/**
 * ⚙️ BLAZE CONFIG - Configurações Centralizadas
 * 
 * Todas as variáveis configuráveis em UM lugar só
 * Para alterar comportamento, modifique apenas aqui
 */

export const BLAZE_CONFIG = {
  // Dados e Captura
  MIN_NUMBERS_FOR_PREDICTION: 10,
  MIN_NUMBERS_FOR_REAL_ALGORITHMS: 100,
  MIN_NUMBERS_FOR_ML_ADVANCED: 50,
  
  // Conectividade
  CHROMIUM_RETRY_ATTEMPTS: 3,
  CONNECTION_TIMEOUT_MS: 30000,
  POLLING_INTERVAL_MS: 15000,
  
  // Predições
  DEFAULT_CONFIDENCE_THRESHOLD: 45,
  WHITE_MULTIPLIER: 14, // Payout para branco
  RED_BLACK_MULTIPLIER: 2, // Payout para vermelho/preto
  
  // Performance
  MAX_HISTORY_DISPLAY: Infinity, // Histórico ilimitado
  DUPLICATE_CHECK_WINDOW_MS: 5000, // Janela para detectar duplicatas
  
  // Logs (CONTROLE GRANULAR PARA REDUÇÃO INTELIGENTE)
  ENABLE_DEBUG_LOGS: false, // false = apenas essenciais
  ENABLE_PERFORMANCE_LOGS: false, // false = sem logs de performance
  ENABLE_ALGORITHM_LOGS: false, // false = sem logs detalhados dos algoritmos
  
  // ✅ NOVOS CONTROLES GRANULARES DE LOGS
  ENABLE_ML_DETAILED_LOGS: false, // Logs detalhados de ML (Markov, Fourier, etc.)
  ENABLE_FEEDBACK_EVOLUTION_LOGS: false, // Logs de evolução de modelos (11x por resultado)
  ENABLE_WEIGHT_ADJUSTMENT_LOGS: false, // Logs de ajuste de pesos dos modelos
  ENABLE_TEMPORAL_ANALYSIS_LOGS: false, // Logs detalhados de análise temporal
  ENABLE_PREDICTION_DETAILS_LOGS: false, // Logs de scores e análises detalhadas
  
  // Interface
  LAST_NUMBER_HIGHLIGHT_DURATION_MS: 10000, // Tempo destaque último número
  PREDICTION_AUTO_REFRESH: false, // Auto-gerar predição a cada número novo
  
  // Algoritmos
  ALGORITHM_PRIORITIES: [
    'RealAlgorithms', // Prioridade 1: Algoritmos matemáticos
    'MLAdvanced',     // Prioridade 2: ML avançado
    'SimplePattern'   // Prioridade 3: Padrão simples
  ],
  
  // Accuracy Tracking
  ACCURACY_DECIMAL_PLACES: 1, // Casas decimais na acurácia
  RESET_STATS_ON_DISCONNECT: false, // Manter stats ao desconectar
  
  // Experimental
  ENABLE_LEARNING_MODE: true, // Sistema aprende com acertos/erros
  ENABLE_WHITE_SPECIAL_ALERT: true, // Alerta especial para branco
  ENABLE_CONFIDENCE_BOOST: true // Boost confiança baseado em histórico
} as const

// Função para logs condicionais - APENAS ERROS + ESSENCIAIS
export function logDebug(message: string, data?: any) {
  if (BLAZE_CONFIG.ENABLE_DEBUG_LOGS) {
    console.log(message, data)
  }
}

export function logPerformance(message: string, data?: any) {
  if (BLAZE_CONFIG.ENABLE_PERFORMANCE_LOGS) {
    console.log(message, data)
  }
}

export function logAlgorithm(message: string, data?: any) {
  if (BLAZE_CONFIG.ENABLE_ALGORITHM_LOGS) {
    console.log(message, data)
  }
}

// ✅ NOVAS FUNÇÕES PARA CONTROLE GRANULAR
export function logMLDetails(message: string, data?: any) {
  if (BLAZE_CONFIG.ENABLE_ML_DETAILED_LOGS) {
    console.log(message, data)
  }
}

export function logFeedbackEvolution(message: string, data?: any) {
  if (BLAZE_CONFIG.ENABLE_FEEDBACK_EVOLUTION_LOGS) {
    console.log(message, data)
  }
}

export function logWeightAdjustment(message: string, data?: any) {
  if (BLAZE_CONFIG.ENABLE_WEIGHT_ADJUSTMENT_LOGS) {
    console.log(message, data)
  }
}

export function logTemporalAnalysis(message: string, data?: any) {
  if (BLAZE_CONFIG.ENABLE_TEMPORAL_ANALYSIS_LOGS) {
    console.log(message, data)
  }
}

export function logPredictionDetails(message: string, data?: any) {
  if (BLAZE_CONFIG.ENABLE_PREDICTION_DETAILS_LOGS) {
    console.log(message, data)
  }
} 