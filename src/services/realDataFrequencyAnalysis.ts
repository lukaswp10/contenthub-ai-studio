// =============================================================================
// 📊 ANÁLISE DE FREQUÊNCIA AVANÇADA - APENAS DADOS REAIS DA BLAZE
// =============================================================================
// Sistema avançado de análise de frequência, padrões e desvios estatísticos
// usando EXCLUSIVAMENTE dados reais coletados da Blaze
// =============================================================================

interface RealGameResult {
  number: number;
  color: 'red' | 'black' | 'white';
  timestamp: number;
  source: 'csv' | 'chromium' | 'manual';
}

interface FrequencyWindow {
  red: { count: number; percentage: number; };
  black: { count: number; percentage: number; };
  white: { count: number; percentage: number; };
  total: number;
  expectedRed: number;    // 46.67% (7/15)
  expectedBlack: number;  // 46.67% (7/15) 
  expectedWhite: number;  // 6.67% (1/15)
}

interface BiasDetection {
  isRedBiased: boolean;
  isBlackBiased: boolean;
  isWhiteBiased: boolean;
  redDeviation: number;    // % de desvio da frequência esperada
  blackDeviation: number;
  whiteDeviation: number;
  overallBias: 'red' | 'black' | 'white' | 'balanced';
  confidence: number;      // 0-100% de confiança na detecção de viés
}

interface StatisticalPressure {
  redPressure: number;     // Pressão estatística para vermelho sair
  blackPressure: number;   // Pressão estatística para preto sair  
  whitePressure: number;   // Pressão estatística para branco sair
  overallTension: number;  // Tensão geral do sistema (0-100)
  lastOccurrence: {
    red: number;    // Há quantas rodadas não sai vermelho
    black: number;  // Há quantas rodadas não sai preto
    white: number;  // Há quantas rodadas não sai branco
  };
}

interface AdvancedFrequencyAnalysis {
  // Janelas de análise com dados reais
  windows: {
    last10: FrequencyWindow;
    last20: FrequencyWindow;
    last50: FrequencyWindow;
    last100: FrequencyWindow;
    last500: FrequencyWindow;
    overall: FrequencyWindow;
  };
  
  // Detecção de viés estatístico
  biasDetection: BiasDetection;
  
  // Pressão estatística (conceito "overdue")
  statisticalPressure: StatisticalPressure;
  
  // Padrões condicionais avançados
  conditionalPatterns: {
    afterRed: { red: number; black: number; white: number; };
    afterBlack: { red: number; black: number; white: number; };
    afterWhite: { red: number; black: number; white: number; };
    afterDoubleRed: { red: number; black: number; white: number; };
    afterDoubleBlack: { red: number; black: number; white: number; };
    afterRedBlack: { red: number; black: number; white: number; };
    afterBlackRed: { red: number; black: number; white: number; };
  };
  
  // Análise de streaks com dados reais
  streakAnalysis: {
    currentRedStreak: number;
    currentBlackStreak: number;
    maxRedStreak: number;
    maxBlackStreak: number;
    averageRedStreak: number;
    averageBlackStreak: number;
    streakBreakProbability: number;
  };
  
  // Predição ajustada por frequência
  adjustedPrediction: {
    red: number;
    black: number;
    white: number;
    confidence: number;
    reasoning: string[];
  };
}

class RealDataFrequencyAnalyzer {
  private static instance: RealDataFrequencyAnalyzer;
  
  public static getInstance(): RealDataFrequencyAnalyzer {
    if (!RealDataFrequencyAnalyzer.instance) {
      RealDataFrequencyAnalyzer.instance = new RealDataFrequencyAnalyzer();
    }
    return RealDataFrequencyAnalyzer.instance;
  }

  /**
   * 🔥 ANÁLISE PRINCIPAL - APENAS DADOS REAIS
   */
  public analyzeRealData(realResults: RealGameResult[]): AdvancedFrequencyAnalysis {
    console.log(`🔥 ANÁLISE DE FREQUÊNCIA: Processando ${realResults.length} resultados REAIS`);
    
    // Garantir que temos dados suficientes
    if (realResults.length < 10) {
      console.warn('⚠️ Dados insuficientes para análise de frequência avançada');
      return this.getDefaultAnalysis();
    }

    // Analisar janelas de frequência
    const windows = this.analyzeFrequencyWindows(realResults);
    
    // Detectar viés estatístico
    const biasDetection = this.detectBias(windows);
    
    // Calcular pressão estatística
    const statisticalPressure = this.calculateStatisticalPressure(realResults);
    
    // Analisar padrões condicionais
    const conditionalPatterns = this.analyzeConditionalPatterns(realResults);
    
    // Analisar streaks
    const streakAnalysis = this.analyzeStreaks(realResults);
    
    // Gerar predição ajustada
    const adjustedPrediction = this.generateAdjustedPrediction(
      windows, biasDetection, statisticalPressure, conditionalPatterns, streakAnalysis
    );

    const analysis: AdvancedFrequencyAnalysis = {
      windows,
      biasDetection,
      statisticalPressure,
      conditionalPatterns,
      streakAnalysis,
      adjustedPrediction
    };

    console.log(`✅ ANÁLISE CONCLUÍDA: Viés ${biasDetection.overallBias}, Pressão ${statisticalPressure.overallTension.toFixed(1)}`);
    return analysis;
  }

  /**
   * 📊 ANALISAR JANELAS DE FREQUÊNCIA
   */
  private analyzeFrequencyWindows(results: RealGameResult[]): any {
    const windows = {
      last10: this.analyzeWindow(results.slice(-10)),
      last20: this.analyzeWindow(results.slice(-20)),
      last50: this.analyzeWindow(results.slice(-50)),
      last100: this.analyzeWindow(results.slice(-100)),
      last500: this.analyzeWindow(results.slice(-500)),
      overall: this.analyzeWindow(results)
    };

    console.log(`📊 JANELAS ANALISADAS: ${Object.keys(windows).length} períodos diferentes`);
    return windows;
  }

  /**
   * 🔍 ANALISAR JANELA ESPECÍFICA
   */
  private analyzeWindow(results: RealGameResult[]): FrequencyWindow {
    if (results.length === 0) {
      return {
        red: { count: 0, percentage: 0 },
        black: { count: 0, percentage: 0 },
        white: { count: 0, percentage: 0 },
        total: 0,
        expectedRed: 46.67,
        expectedBlack: 46.67,
        expectedWhite: 6.67
      };
    }

    const redCount = results.filter(r => r.color === 'red').length;
    const blackCount = results.filter(r => r.color === 'black').length;
    const whiteCount = results.filter(r => r.color === 'white').length;
    const total = results.length;

    return {
      red: { 
        count: redCount, 
        percentage: (redCount / total) * 100 
      },
      black: { 
        count: blackCount, 
        percentage: (blackCount / total) * 100 
      },
      white: { 
        count: whiteCount, 
        percentage: (whiteCount / total) * 100 
      },
      total,
      expectedRed: 46.67,
      expectedBlack: 46.67,
      expectedWhite: 6.67
    };
  }

  /**
   * 🚨 DETECTAR VIÉS ESTATÍSTICO
   */
  private detectBias(windows: any): BiasDetection {
    // Usar janela de 100 jogadas para detecção de viés mais confiável
    const window = windows.last100;
    
    const redDeviation = window.red.percentage - window.expectedRed;
    const blackDeviation = window.black.percentage - window.expectedBlack;
    const whiteDeviation = window.white.percentage - window.expectedWhite;
    
    // Limite de 5% para considerar viés significativo
    const biasThreshold = 5.0;
    
    const isRedBiased = Math.abs(redDeviation) > biasThreshold;
    const isBlackBiased = Math.abs(blackDeviation) > biasThreshold;
    const isWhiteBiased = Math.abs(whiteDeviation) > biasThreshold;
    
    // Determinar viés dominante
    let overallBias: 'red' | 'black' | 'white' | 'balanced' = 'balanced';
    let maxDeviation = 0;
    
    if (Math.abs(redDeviation) > maxDeviation) {
      maxDeviation = Math.abs(redDeviation);
      overallBias = redDeviation > 0 ? 'red' : 'balanced';
    }
    
    if (Math.abs(blackDeviation) > maxDeviation) {
      maxDeviation = Math.abs(blackDeviation);
      overallBias = blackDeviation > 0 ? 'black' : 'balanced';
    }
    
    if (Math.abs(whiteDeviation) > maxDeviation) {
      maxDeviation = Math.abs(whiteDeviation);
      overallBias = whiteDeviation > 0 ? 'white' : 'balanced';
    }
    
    // Calcular confiança baseada na magnitude do desvio
    const confidence = Math.min(100, maxDeviation * 10);
    
    console.log(`🚨 VIÉS DETECTADO: ${overallBias.toUpperCase()} (${confidence.toFixed(1)}% confiança)`);
    
    return {
      isRedBiased,
      isBlackBiased,
      isWhiteBiased,
      redDeviation,
      blackDeviation,
      whiteDeviation,
      overallBias,
      confidence
    };
  }

  /**
   * ⏰ CALCULAR PRESSÃO ESTATÍSTICA
   */
  private calculateStatisticalPressure(results: RealGameResult[]): StatisticalPressure {
    if (results.length === 0) {
      return {
        redPressure: 0,
        blackPressure: 0,
        whitePressure: 0,
        overallTension: 0,
        lastOccurrence: { red: 0, black: 0, white: 0 }
      };
    }

    // Encontrar última ocorrência de cada cor
    let lastRed = -1, lastBlack = -1, lastWhite = -1;
    
    for (let i = results.length - 1; i >= 0; i--) {
      if (lastRed === -1 && results[i].color === 'red') lastRed = results.length - 1 - i;
      if (lastBlack === -1 && results[i].color === 'black') lastBlack = results.length - 1 - i;
      if (lastWhite === -1 && results[i].color === 'white') lastWhite = results.length - 1 - i;
      
      if (lastRed !== -1 && lastBlack !== -1 && lastWhite !== -1) break;
    }

    // Calcular pressão (quanto mais tempo sem aparecer, maior a pressão)
    const maxPressure = 100;
    const redPressure = Math.min(maxPressure, (lastRed / 20) * 100); // Pressão máxima após 20 rodadas
    const blackPressure = Math.min(maxPressure, (lastBlack / 20) * 100);
    const whitePressure = Math.min(maxPressure, (lastWhite / 50) * 100); // Branco tem período maior

    const overallTension = (redPressure + blackPressure + whitePressure) / 3;

    console.log(`⏰ PRESSÃO: R:${redPressure.toFixed(1)} B:${blackPressure.toFixed(1)} W:${whitePressure.toFixed(1)} | Tensão: ${overallTension.toFixed(1)}`);

    return {
      redPressure,
      blackPressure,
      whitePressure,
      overallTension,
      lastOccurrence: {
        red: lastRed,
        black: lastBlack,
        white: lastWhite
      }
    };
  }

  /**
   * 🔗 ANALISAR PADRÕES CONDICIONAIS
   */
  private analyzeConditionalPatterns(results: RealGameResult[]): any {
    if (results.length < 3) {
      return this.getDefaultConditionalPatterns();
    }

    const patterns = {
      afterRed: { red: 0, black: 0, white: 0 },
      afterBlack: { red: 0, black: 0, white: 0 },
      afterWhite: { red: 0, black: 0, white: 0 },
      afterDoubleRed: { red: 0, black: 0, white: 0 },
      afterDoubleBlack: { red: 0, black: 0, white: 0 },
      afterRedBlack: { red: 0, black: 0, white: 0 },
      afterBlackRed: { red: 0, black: 0, white: 0 }
    };

    // Analisar sequências
    for (let i = 1; i < results.length; i++) {
      const prev = results[i-1];
      const curr = results[i];

      // Padrões simples
      if (prev.color === 'red') {
        patterns.afterRed[curr.color]++;
      } else if (prev.color === 'black') {
        patterns.afterBlack[curr.color]++;
      } else if (prev.color === 'white') {
        patterns.afterWhite[curr.color]++;
      }

      // Padrões duplos
      if (i >= 2) {
        const prev2 = results[i-2];
        
        if (prev2.color === 'red' && prev.color === 'red') {
          patterns.afterDoubleRed[curr.color]++;
        } else if (prev2.color === 'black' && prev.color === 'black') {
          patterns.afterDoubleBlack[curr.color]++;
        } else if (prev2.color === 'red' && prev.color === 'black') {
          patterns.afterRedBlack[curr.color]++;
        } else if (prev2.color === 'black' && prev.color === 'red') {
          patterns.afterBlackRed[curr.color]++;
        }
      }
    }

    // Converter para percentuais
    Object.keys(patterns).forEach(pattern => {
      const total = patterns[pattern].red + patterns[pattern].black + patterns[pattern].white;
      if (total > 0) {
        patterns[pattern].red = (patterns[pattern].red / total) * 100;
        patterns[pattern].black = (patterns[pattern].black / total) * 100;
        patterns[pattern].white = (patterns[pattern].white / total) * 100;
      }
    });

    console.log(`🔗 PADRÕES CONDICIONAIS: ${Object.keys(patterns).length} padrões analisados`);
    return patterns;
  }

  /**
   * 📈 ANALISAR STREAKS
   */
  private analyzeStreaks(results: RealGameResult[]): any {
    if (results.length === 0) {
      return {
        currentRedStreak: 0,
        currentBlackStreak: 0,
        maxRedStreak: 0,
        maxBlackStreak: 0,
        averageRedStreak: 0,
        averageBlackStreak: 0,
        streakBreakProbability: 50
      };
    }

    let currentRedStreak = 0;
    let currentBlackStreak = 0;
    let maxRedStreak = 0;
    let maxBlackStreak = 0;
    let redStreaks: number[] = [];
    let blackStreaks: number[] = [];
    let tempRedStreak = 0;
    let tempBlackStreak = 0;

    // Analisar de trás para frente para streak atual
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i].color === 'red' && currentRedStreak === 0) {
        currentRedStreak++;
      } else if (results[i].color === 'red' && currentRedStreak > 0 && results[i+1]?.color === 'red') {
        currentRedStreak++;
      } else if (results[i].color === 'black' && currentBlackStreak === 0) {
        currentBlackStreak++;
      } else if (results[i].color === 'black' && currentBlackStreak > 0 && results[i+1]?.color === 'black') {
        currentBlackStreak++;
      } else {
        break;
      }
    }

    // Analisar streaks históricos
    for (let i = 0; i < results.length; i++) {
      if (results[i].color === 'red') {
        tempRedStreak++;
        tempBlackStreak = 0;
      } else if (results[i].color === 'black') {
        tempBlackStreak++;
        tempRedStreak = 0;
      } else {
        if (tempRedStreak > 0) {
          redStreaks.push(tempRedStreak);
          maxRedStreak = Math.max(maxRedStreak, tempRedStreak);
          tempRedStreak = 0;
        }
        if (tempBlackStreak > 0) {
          blackStreaks.push(tempBlackStreak);
          maxBlackStreak = Math.max(maxBlackStreak, tempBlackStreak);
          tempBlackStreak = 0;
        }
      }
    }

    // Finalizar streaks
    if (tempRedStreak > 0) {
      redStreaks.push(tempRedStreak);
      maxRedStreak = Math.max(maxRedStreak, tempRedStreak);
    }
    if (tempBlackStreak > 0) {
      blackStreaks.push(tempBlackStreak);
      maxBlackStreak = Math.max(maxBlackStreak, tempBlackStreak);
    }

    const averageRedStreak = redStreaks.length > 0 ? redStreaks.reduce((a, b) => a + b, 0) / redStreaks.length : 0;
    const averageBlackStreak = blackStreaks.length > 0 ? blackStreaks.reduce((a, b) => a + b, 0) / blackStreaks.length : 0;

    // Calcular probabilidade de quebra de streak
    const currentStreak = Math.max(currentRedStreak, currentBlackStreak);
    const averageStreak = (averageRedStreak + averageBlackStreak) / 2;
    const streakBreakProbability = currentStreak > averageStreak ? 70 : 30;

    console.log(`📈 STREAKS: Red atual:${currentRedStreak} max:${maxRedStreak} | Black atual:${currentBlackStreak} max:${maxBlackStreak}`);

    return {
      currentRedStreak,
      currentBlackStreak,
      maxRedStreak,
      maxBlackStreak,
      averageRedStreak,
      averageBlackStreak,
      streakBreakProbability
    };
  }

  /**
   * 🎯 GERAR PREDIÇÃO AJUSTADA
   */
  private generateAdjustedPrediction(
    windows: any, 
    bias: BiasDetection, 
    pressure: StatisticalPressure, 
    patterns: any, 
    streaks: any
  ): any {
    let redScore = 46.67; // Base esperada
    let blackScore = 46.67;
    let whiteScore = 6.67;
    
    const reasoning: string[] = [];

    // Ajustar por viés detectado
    if (bias.confidence > 50) {
      if (bias.overallBias === 'red' && bias.redDeviation < 0) {
        redScore += 10;
        reasoning.push(`Vermelho sub-representado (${bias.redDeviation.toFixed(1)}%)`);
      } else if (bias.overallBias === 'black' && bias.blackDeviation < 0) {
        blackScore += 10;
        reasoning.push(`Preto sub-representado (${bias.blackDeviation.toFixed(1)}%)`);
      } else if (bias.overallBias === 'white' && bias.whiteDeviation < 0) {
        whiteScore += 15;
        reasoning.push(`Branco sub-representado (${bias.whiteDeviation.toFixed(1)}%)`);
      }
    }

    // Ajustar por pressão estatística
    if (pressure.whitePressure > 70) {
      whiteScore += 20;
      reasoning.push(`Alta pressão branco (${pressure.lastOccurrence.white} rodadas)`);
    }
    if (pressure.redPressure > 60) {
      redScore += 8;
      reasoning.push(`Pressão vermelho (${pressure.lastOccurrence.red} rodadas)`);
    }
    if (pressure.blackPressure > 60) {
      blackScore += 8;
      reasoning.push(`Pressão preto (${pressure.lastOccurrence.black} rodadas)`);
    }

    // Ajustar por streak
    if (streaks.currentRedStreak > streaks.averageRedStreak) {
      blackScore += 5;
      whiteScore += 3;
      reasoning.push(`Streak vermelho longo (${streaks.currentRedStreak})`);
    }
    if (streaks.currentBlackStreak > streaks.averageBlackStreak) {
      redScore += 5;
      whiteScore += 3;
      reasoning.push(`Streak preto longo (${streaks.currentBlackStreak})`);
    }

    // Normalizar scores
    const total = redScore + blackScore + whiteScore;
    redScore = (redScore / total) * 100;
    blackScore = (blackScore / total) * 100;
    whiteScore = (whiteScore / total) * 100;

    // Calcular confiança
    const confidence = Math.min(90, 50 + bias.confidence * 0.3 + pressure.overallTension * 0.2);

    console.log(`🎯 PREDIÇÃO AJUSTADA: R:${redScore.toFixed(1)}% B:${blackScore.toFixed(1)}% W:${whiteScore.toFixed(1)}%`);

    return {
      red: redScore,
      black: blackScore,
      white: whiteScore,
      confidence,
      reasoning
    };
  }

  /**
   * 🔧 VALORES PADRÃO
   */
  private getDefaultAnalysis(): AdvancedFrequencyAnalysis {
    return {
      windows: {
        last10: this.analyzeWindow([]),
        last20: this.analyzeWindow([]),
        last50: this.analyzeWindow([]),
        last100: this.analyzeWindow([]),
        last500: this.analyzeWindow([]),
        overall: this.analyzeWindow([])
      },
      biasDetection: {
        isRedBiased: false,
        isBlackBiased: false,
        isWhiteBiased: false,
        redDeviation: 0,
        blackDeviation: 0,
        whiteDeviation: 0,
        overallBias: 'balanced',
        confidence: 0
      },
      statisticalPressure: {
        redPressure: 0,
        blackPressure: 0,
        whitePressure: 0,
        overallTension: 0,
        lastOccurrence: { red: 0, black: 0, white: 0 }
      },
      conditionalPatterns: this.getDefaultConditionalPatterns(),
      streakAnalysis: {
        currentRedStreak: 0,
        currentBlackStreak: 0,
        maxRedStreak: 0,
        maxBlackStreak: 0,
        averageRedStreak: 0,
        averageBlackStreak: 0,
        streakBreakProbability: 50
      },
      adjustedPrediction: {
        red: 46.67,
        black: 46.67,
        white: 6.67,
        confidence: 20,
        reasoning: ['Dados insuficientes para análise avançada']
      }
    };
  }

  private getDefaultConditionalPatterns(): any {
    return {
      afterRed: { red: 33.33, black: 33.33, white: 33.33 },
      afterBlack: { red: 33.33, black: 33.33, white: 33.33 },
      afterWhite: { red: 33.33, black: 33.33, white: 33.33 },
      afterDoubleRed: { red: 33.33, black: 33.33, white: 33.33 },
      afterDoubleBlack: { red: 33.33, black: 33.33, white: 33.33 },
      afterRedBlack: { red: 33.33, black: 33.33, white: 33.33 },
      afterBlackRed: { red: 33.33, black: 33.33, white: 33.33 }
    };
  }

  /**
   * 🔄 CONVERTER DADOS PARA FORMATO INTERNO
   */
  public convertToRealGameResults(results: any[]): RealGameResult[] {
    return results.map(result => ({
      number: Number(result.number || result.Number || result.resultado || 0),
      color: this.getColorFromNumber(Number(result.number || result.Number || result.resultado || 0)),
      timestamp: result.timestamp || result.created_at || Date.now(),
      source: result.source || 'csv'
    }));
  }

  private getColorFromNumber(number: number): 'red' | 'black' | 'white' {
    if (number === 0) return 'white';
    if (number >= 1 && number <= 7) return 'red';
    if (number >= 8 && number <= 14) return 'black';
    return 'white'; // fallback
  }
}

// Singleton export
export const realDataFrequencyAnalyzer = RealDataFrequencyAnalyzer.getInstance();
export type { AdvancedFrequencyAnalysis, RealGameResult, BiasDetection, StatisticalPressure }; 