/**
 * 🚀 FOUNDATION MODELS - EXPORTS
 * 
 * Sistema de predição moderno baseado em pesquisas 2025
 * Substitui sistemas complexos antigos por arquitetura simples e eficiente
 */

export { TimeSeriesFoundationModel, foundationModel } from './TimeSeriesFoundationModel'
export type { 
  FoundationFeatures,
  ProbabilisticPrediction, 
  TemporalPatch,
  FoundationModelConfig 
} from './TimeSeriesFoundationModel'

// Versão do Foundation Model
export const FOUNDATION_MODEL_VERSION = '1.0.0'

// Configuração padrão
export const DEFAULT_FOUNDATION_CONFIG = {
  contextWindow: 1000,
  patchSizes: [1, 5, 20, 240, 1000, 2000, 2500], // 13s, 1min, 5min, 1h, 4h, 8h, 10h
  learningRate: 0.01,
  driftThreshold: 0.1,
  ensembleWeights: {
    transformer: 0.70,
    pattern: 0.20,
    statistical: 0.10
  }
} 