// =============================================================================
// 🧠 CONFIDENCE ENGINE MULTI-DIMENSIONAL - APENAS DADOS REAIS
// =============================================================================
// Sistema avançado de cálculo de confiança baseado em múltiplos fatores
// usando EXCLUSIVAMENTE dados reais coletados da Blaze
// =============================================================================

import type { AdvancedFrequencyAnalysis } from './realDataFrequencyAnalysis';

interface ConfidenceFactor {
  name: string;
  value: number;        // 0-100
  weight: number;       // Peso do fator (0-1)
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

interface ConfidenceMetrics {
  // Fatores individuais
  frequencyDeviation: ConfidenceFactor;
  patternStrength: ConfidenceFactor;
  overduePressure: ConfidenceFactor;
  consensusStrength: ConfidenceFactor;
  historicalAccuracy: ConfidenceFactor;
  volatilityLevel: ConfidenceFactor;
  streakConsistency: ConfidenceFactor;
  dataQuality: ConfidenceFactor;
  
  // Score final
  finalConfidence: number;
  recommendation: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' | 'AVOID';
  reasoning: string[];
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

interface PredictionContext {
  mlPrediction?: any;
  frequencyAnalysis?: AdvancedFrequencyAnalysis;
  historicalResults: any[];
  currentAccuracy: number;
  recentPerformance: number[];
  dataVolume: number;
}

class ConfidenceEngineService {
  private static instance: ConfidenceEngineService;
  
  public static getInstance(): ConfidenceEngineService {
    if (!ConfidenceEngineService.instance) {
      ConfidenceEngineService.instance = new ConfidenceEngineService();
    }
    return ConfidenceEngineService.instance;
  }

  /**
   * 🎯 CALCULAR CONFIANÇA MULTI-DIMENSIONAL
   */
  public calculateConfidence(context: PredictionContext): ConfidenceMetrics {
    console.log(`🧠 CALCULANDO CONFIANÇA MULTI-DIMENSIONAL...`);
    
    // Calcular fatores individuais
    const frequencyDeviation = this.calculateFrequencyDeviationFactor(context);
    const patternStrength = this.calculatePatternStrengthFactor(context);
    const overduePressure = this.calculateOverduePressureFactor(context);
    const consensusStrength = this.calculateConsensusStrengthFactor(context);
    const historicalAccuracy = this.calculateHistoricalAccuracyFactor(context);
    const volatilityLevel = this.calculateVolatilityFactor(context);
    const streakConsistency = this.calculateStreakConsistencyFactor(context);
    const dataQuality = this.calculateDataQualityFactor(context);

    // Calcular score final ponderado
    const factors = [
      frequencyDeviation,
      patternStrength,
      overduePressure,
      consensusStrength,
      historicalAccuracy,
      volatilityLevel,
      streakConsistency,
      dataQuality
    ];

    const weightedSum = factors.reduce((sum, factor) => 
      sum + (factor.value * factor.weight), 0
    );
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const finalConfidence = Math.round(weightedSum / totalWeight);

    // Determinar recomendação e risco
    const { recommendation, riskLevel } = this.determineRecommendation(finalConfidence, factors);
    
    // Gerar raciocínio
    const reasoning = this.generateReasoning(factors, finalConfidence);

    const metrics: ConfidenceMetrics = {
      frequencyDeviation,
      patternStrength,
      overduePressure,
      consensusStrength,
      historicalAccuracy,
      volatilityLevel,
      streakConsistency,
      dataQuality,
      finalConfidence,
      recommendation,
      reasoning,
      riskLevel
    };

    console.log(`✅ CONFIANÇA CALCULADA: ${finalConfidence}% | ${recommendation} | Risco: ${riskLevel}`);
    return metrics;
  }

  /**
   * 📊 FATOR: DESVIO DE FREQUÊNCIA
   */
  private calculateFrequencyDeviationFactor(context: PredictionContext): ConfidenceFactor {
    if (!context.frequencyAnalysis) {
      return {
        name: 'Desvio de Frequência',
        value: 50,
        weight: 0.15,
        description: 'Dados de frequência não disponíveis',
        impact: 'neutral'
      };
    }

    const bias = context.frequencyAnalysis.biasDetection;
    let confidence = bias.confidence;
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = '';

    if (bias.confidence > 70) {
      impact = 'positive';
      description = `Forte viés ${bias.overallBias} detectado (${bias.confidence.toFixed(1)}%)`;
    } else if (bias.confidence > 40) {
      impact = 'neutral';
      description = `Viés moderado ${bias.overallBias} (${bias.confidence.toFixed(1)}%)`;
    } else {
      impact = 'negative';
      confidence = 100 - confidence; // Inverter - baixa detecção = baixa confiança
      description = `Viés fraco detectado (${bias.confidence.toFixed(1)}%)`;
    }

    return {
      name: 'Desvio de Frequência',
      value: Math.round(confidence),
      weight: 0.15,
      description,
      impact
    };
  }

  /**
   * 🔗 FATOR: FORÇA DOS PADRÕES
   */
  private calculatePatternStrengthFactor(context: PredictionContext): ConfidenceFactor {
    if (!context.mlPrediction) {
      return {
        name: 'Força dos Padrões',
        value: 50,
        weight: 0.20,
        description: 'Predição ML não disponível',
        impact: 'neutral'
      };
    }

    // Analisar consenso entre algoritmos ML
    const algorithms = context.mlPrediction.individual_predictions || [];
    if (algorithms.length === 0) {
      return {
        name: 'Força dos Padrões',
        value: 30,
        weight: 0.20,
        description: 'Nenhum algoritmo ML disponível',
        impact: 'negative'
      };
    }

    // Calcular consenso
    const predictions = algorithms.map(a => a.prediction || a.predicted_color);
    const uniquePredictions = [...new Set(predictions)];
    const consensusStrength = (predictions.length - uniquePredictions.length + 1) / predictions.length * 100;

    // Calcular confiança média
    const avgConfidence = algorithms.reduce((sum, a) => sum + (a.confidence || 0), 0) / algorithms.length;

    const patternStrength = (consensusStrength * 0.6) + (avgConfidence * 0.4);

    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (patternStrength > 70) impact = 'positive';
    else if (patternStrength < 40) impact = 'negative';

    return {
      name: 'Força dos Padrões',
      value: Math.round(patternStrength),
      weight: 0.20,
      description: `${algorithms.length} algoritmos, consenso ${consensusStrength.toFixed(1)}%`,
      impact
    };
  }

  /**
   * ⏰ FATOR: PRESSÃO ESTATÍSTICA
   */
  private calculateOverduePressureFactor(context: PredictionContext): ConfidenceFactor {
    if (!context.frequencyAnalysis) {
      return {
        name: 'Pressão Estatística',
        value: 50,
        weight: 0.18,
        description: 'Dados de pressão não disponíveis',
        impact: 'neutral'
      };
    }

    const pressure = context.frequencyAnalysis.statisticalPressure;
    const overallTension = pressure.overallTension;

    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = '';

    if (overallTension > 70) {
      impact = 'positive';
      description = `Alta tensão estatística (${overallTension.toFixed(1)})`;
    } else if (overallTension > 40) {
      impact = 'neutral';
      description = `Tensão moderada (${overallTension.toFixed(1)})`;
    } else {
      impact = 'negative';
      description = `Baixa tensão estatística (${overallTension.toFixed(1)})`;
    }

    return {
      name: 'Pressão Estatística',
      value: Math.round(overallTension),
      weight: 0.18,
      description,
      impact
    };
  }

  /**
   * 🤝 FATOR: FORÇA DO CONSENSO
   */
  private calculateConsensusStrengthFactor(context: PredictionContext): ConfidenceFactor {
    if (!context.mlPrediction || !context.frequencyAnalysis) {
      return {
        name: 'Força do Consenso',
        value: 50,
        weight: 0.15,
        description: 'Dados insuficientes para consenso',
        impact: 'neutral'
      };
    }

    // Comparar predição ML com predição de frequência
    const mlColor = context.mlPrediction.predicted_color;
    const freqAdjusted = context.frequencyAnalysis.adjustedPrediction;
    
    // Encontrar cor com maior probabilidade na análise de frequência
    let freqBestColor = 'red';
    let maxProb = freqAdjusted.red;
    if (freqAdjusted.black > maxProb) {
      freqBestColor = 'black';
      maxProb = freqAdjusted.black;
    }
    if (freqAdjusted.white > maxProb) {
      freqBestColor = 'white';
      maxProb = freqAdjusted.white;
    }

    const agreement = mlColor === freqBestColor;
    const consensusStrength = agreement ? 
      Math.min(95, 60 + (maxProb * 0.5) + (context.mlPrediction.confidence_percentage * 0.3)) : 
      Math.max(15, 50 - Math.abs(maxProb - context.mlPrediction.confidence_percentage) * 0.5);

    return {
      name: 'Força do Consenso',
      value: Math.round(consensusStrength),
      weight: 0.15,
      description: agreement ? 
        `ML e Frequência concordam (${mlColor})` : 
        `ML diz ${mlColor}, Frequência diz ${freqBestColor}`,
      impact: agreement ? 'positive' : 'negative'
    };
  }

  /**
   * 📈 FATOR: PRECISÃO HISTÓRICA
   */
  private calculateHistoricalAccuracyFactor(context: PredictionContext): ConfidenceFactor {
    const accuracy = context.currentAccuracy || 50;
    const recentPerf = context.recentPerformance || [];
    
    let adjustedAccuracy = accuracy;
    
    // Ajustar baseado na performance recente
    if (recentPerf.length > 0) {
      const recentAvg = recentPerf.reduce((a, b) => a + b, 0) / recentPerf.length;
      adjustedAccuracy = (accuracy * 0.7) + (recentAvg * 0.3);
    }

    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (adjustedAccuracy > 65) impact = 'positive';
    else if (adjustedAccuracy < 45) impact = 'negative';

    return {
      name: 'Precisão Histórica',
      value: Math.round(adjustedAccuracy),
      weight: 0.12,
      description: `${accuracy.toFixed(1)}% histórica, ${recentPerf.length} predições recentes`,
      impact
    };
  }

  /**
   * 📊 FATOR: NÍVEL DE VOLATILIDADE
   */
  private calculateVolatilityFactor(context: PredictionContext): ConfidenceFactor {
    if (!context.frequencyAnalysis) {
      return {
        name: 'Volatilidade',
        value: 50,
        weight: 0.10,
        description: 'Dados de volatilidade não disponíveis',
        impact: 'neutral'
      };
    }

    const streaks = context.frequencyAnalysis.streakAnalysis;
    
    // Calcular volatilidade baseada em streaks
    const currentMaxStreak = Math.max(streaks.currentRedStreak, streaks.currentBlackStreak);
    const historicalMaxStreak = Math.max(streaks.maxRedStreak, streaks.maxBlackStreak);
    const avgStreak = (streaks.averageRedStreak + streaks.averageBlackStreak) / 2;

    // Alta volatilidade = streaks muito longos = menos previsível
    const volatility = Math.min(100, (currentMaxStreak / avgStreak) * 25 + (historicalMaxStreak / 20) * 25);
    const stability = 100 - volatility; // Inverter para ter estabilidade

    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (stability > 70) impact = 'positive';
    else if (stability < 40) impact = 'negative';

    return {
      name: 'Volatilidade',
      value: Math.round(stability),
      weight: 0.10,
      description: `Streak atual: ${currentMaxStreak}, estabilidade: ${stability.toFixed(1)}%`,
      impact
    };
  }

  /**
   * 📈 FATOR: CONSISTÊNCIA DE SEQUÊNCIAS
   */
  private calculateStreakConsistencyFactor(context: PredictionContext): ConfidenceFactor {
    if (!context.frequencyAnalysis) {
      return {
        name: 'Consistência de Streaks',
        value: 50,
        weight: 0.08,
        description: 'Dados de streaks não disponíveis',
        impact: 'neutral'
      };
    }

    const streaks = context.frequencyAnalysis.streakAnalysis;
    const breakProbability = streaks.streakBreakProbability || 50;

    // Se há alta probabilidade de quebra de streak, é boa informação
    const consistency = breakProbability > 60 ? breakProbability : 100 - breakProbability;

    return {
      name: 'Consistência de Streaks',
      value: Math.round(consistency),
      weight: 0.08,
      description: `${breakProbability.toFixed(1)}% prob. quebra de streak`,
      impact: breakProbability > 60 ? 'positive' : 'neutral'
    };
  }

  /**
   * 🔍 FATOR: QUALIDADE DOS DADOS
   */
  private calculateDataQualityFactor(context: PredictionContext): ConfidenceFactor {
    const dataVolume = context.dataVolume || 0;
    const hasFrequencyData = !!context.frequencyAnalysis;
    const hasMLData = !!context.mlPrediction;

    let qualityScore = 0;
    let description = '';

    // Volume de dados (0-40 pontos)
    if (dataVolume > 1000) qualityScore += 40;
    else if (dataVolume > 500) qualityScore += 30;
    else if (dataVolume > 100) qualityScore += 20;
    else if (dataVolume > 50) qualityScore += 10;

    // Diversidade de análises (0-30 pontos)
    if (hasFrequencyData) qualityScore += 15;
    if (hasMLData) qualityScore += 15;

    // Recência dos dados (0-30 pontos)
    const recentData = context.historicalResults.filter(r => 
      (Date.now() - r.timestamp) < 24 * 60 * 60 * 1000 // Últimas 24h
    ).length;
    
    if (recentData > 100) qualityScore += 30;
    else if (recentData > 50) qualityScore += 20;
    else if (recentData > 20) qualityScore += 10;

    description = `${dataVolume} registros, ${recentData} recentes, ${hasFrequencyData ? 'freq+' : ''}${hasMLData ? 'ML+' : ''}`;

    return {
      name: 'Qualidade dos Dados',
      value: Math.round(qualityScore),
      weight: 0.12,
      description,
      impact: qualityScore > 70 ? 'positive' : qualityScore < 40 ? 'negative' : 'neutral'
    };
  }

  /**
   * 🎯 DETERMINAR RECOMENDAÇÃO E RISCO
   */
  private determineRecommendation(confidence: number, factors: ConfidenceFactor[]): { 
    recommendation: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' | 'AVOID', 
    riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' 
  } {
    // Contar fatores negativos
    const negativeFactors = factors.filter(f => f.impact === 'negative').length;
    const positiveFactors = factors.filter(f => f.impact === 'positive').length;

    let recommendation: any = 'MEDIUM';
    let riskLevel: any = 'MEDIUM';

    if (confidence >= 85 && positiveFactors >= 5) {
      recommendation = 'VERY_HIGH';
      riskLevel = 'VERY_LOW';
    } else if (confidence >= 75 && positiveFactors >= 3) {
      recommendation = 'HIGH';
      riskLevel = 'LOW';
    } else if (confidence >= 60) {
      recommendation = 'MEDIUM';
      riskLevel = 'MEDIUM';
    } else if (confidence >= 40) {
      recommendation = 'LOW';
      riskLevel = 'HIGH';
    } else if (confidence >= 25) {
      recommendation = 'VERY_LOW';
      riskLevel = 'VERY_HIGH';
    } else {
      recommendation = 'AVOID';
      riskLevel = 'VERY_HIGH';
    }

    // Ajustar por fatores negativos
    if (negativeFactors >= 4) {
      if (recommendation === 'VERY_HIGH') recommendation = 'HIGH';
      else if (recommendation === 'HIGH') recommendation = 'MEDIUM';
      else if (recommendation === 'MEDIUM') recommendation = 'LOW';
      
      if (riskLevel === 'VERY_LOW') riskLevel = 'LOW';
      else if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      else if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
    }

    return { recommendation, riskLevel };
  }

  /**
   * 🧠 GERAR RACIOCÍNIO
   */
  private generateReasoning(factors: ConfidenceFactor[], finalConfidence: number): string[] {
    const reasoning: string[] = [];

    // Fatores mais influentes (peso alto e valor extremo)
    const influentialFactors = factors
      .filter(f => f.weight > 0.15 && (f.value > 70 || f.value < 40))
      .sort((a, b) => (b.weight * Math.abs(b.value - 50)) - (a.weight * Math.abs(a.value - 50)));

    if (influentialFactors.length > 0) {
      const topFactor = influentialFactors[0];
      reasoning.push(`${topFactor.name}: ${topFactor.description}`);
    }

    // Consenso
    const consensusFactor = factors.find(f => f.name === 'Força do Consenso');
    if (consensusFactor && consensusFactor.value > 70) {
      reasoning.push('Múltiplas análises em consenso');
    } else if (consensusFactor && consensusFactor.value < 40) {
      reasoning.push('Análises conflitantes - cuidado');
    }

    // Qualidade dos dados
    const qualityFactor = factors.find(f => f.name === 'Qualidade dos Dados');
    if (qualityFactor && qualityFactor.value > 80) {
      reasoning.push('Alta qualidade de dados históricos');
    } else if (qualityFactor && qualityFactor.value < 40) {
      reasoning.push('Dados limitados - predição menos confiável');
    }

    // Resumo final
    if (finalConfidence > 75) {
      reasoning.push('Condições favoráveis para predição');
    } else if (finalConfidence < 45) {
      reasoning.push('Múltiplos fatores de incerteza detectados');
    }

    return reasoning;
  }
}

// Singleton export
export const confidenceEngine = ConfidenceEngineService.getInstance();
export type { ConfidenceMetrics, ConfidenceFactor, PredictionContext }; 