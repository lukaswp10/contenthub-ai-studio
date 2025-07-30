// =============================================================================
// 🕐 ANÁLISE DE PADRÕES TEMPORAIS - APENAS DADOS REAIS
// =============================================================================
// Sistema avançado de análise temporal para detectar padrões por hora, dia e semana
// usando EXCLUSIVAMENTE dados reais coletados da Blaze
// =============================================================================

interface TemporalResult {
  number: number;
  color: 'red' | 'black' | 'white';
  timestamp: number;
  hour: number;
  dayOfWeek: number;
  dayOfMonth: number;
}

interface HourlyPattern {
  hour: number;
  red: { count: number; percentage: number; };
  black: { count: number; percentage: number; };
  white: { count: number; percentage: number; };
  total: number;
  bias: 'red' | 'black' | 'white' | 'balanced';
  strength: number; // 0-100
}

interface DailyPattern {
  dayOfWeek: number;
  dayName: string;
  red: { count: number; percentage: number; };
  black: { count: number; percentage: number; };
  white: { count: number; percentage: number; };
  total: number;
  bias: 'red' | 'black' | 'white' | 'balanced';
  strength: number;
}

interface TimeBasedTrends {
  currentHour: number;
  currentDay: number;
  
  // Padrões por hora (0-23)
  hourlyPatterns: HourlyPattern[];
  
  // Padrões por dia da semana (0-6, domingo-sábado)
  dailyPatterns: DailyPattern[];
  
  // Tendências detectadas
  strongestHourlyBias: {
    hour: number;
    color: 'red' | 'black' | 'white';
    strength: number;
    confidence: number;
  };
  
  strongestDailyBias: {
    day: number;
    dayName: string;
    color: 'red' | 'black' | 'white';
    strength: number;
    confidence: number;
  };
  
  // Predição temporal
  temporalPrediction: {
    red: number;
    black: number;
    white: number;
    confidence: number;
    reasoning: string[];
  };
  
  // Padrões de sessão
  sessionPatterns: {
    earlyMorning: { red: number; black: number; white: number; }; // 5-9h
    morning: { red: number; black: number; white: number; };      // 9-12h
    afternoon: { red: number; black: number; white: number; };    // 12-18h
    evening: { red: number; black: number; white: number; };      // 18-22h
    night: { red: number; black: number; white: number; };        // 22-2h
    lateNight: { red: number; black: number; white: number; };    // 2-5h
  };
}

interface AdvancedTemporalAnalysis {
  timeBasedTrends: TimeBasedTrends;
  
  // Análise de ciclos semanais
  weeklyAnalysis: {
    weekdays: { red: number; black: number; white: number; }; // Segunda-Sexta
    weekends: { red: number; black: number; white: number; }; // Sábado-Domingo
    weekdaysBias: 'red' | 'black' | 'white' | 'balanced';
    weekendsBias: 'red' | 'black' | 'white' | 'balanced';
  };
  
  // Análise de momentum temporal
  temporalMomentum: {
    last3Hours: { direction: 'red' | 'black' | 'white'; strength: number; };
    last6Hours: { direction: 'red' | 'black' | 'white'; strength: number; };
    last12Hours: { direction: 'red' | 'black' | 'white'; strength: number; };
    overallTrend: 'increasing_red' | 'increasing_black' | 'increasing_white' | 'stable';
  };
  
  // Alertas temporais
  temporalAlerts: {
    isOptimalTime: boolean;
    currentHourBias: string;
    timeRecommendation: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'AVOID';
    nextOptimalHour: number;
    reasoning: string[];
  };
}

class TemporalPatternAnalyzer {
  private static instance: TemporalPatternAnalyzer;
  
  public static getInstance(): TemporalPatternAnalyzer {
    if (!TemporalPatternAnalyzer.instance) {
      TemporalPatternAnalyzer.instance = new TemporalPatternAnalyzer();
    }
    return TemporalPatternAnalyzer.instance;
  }

  /**
   * 🕐 ANÁLISE TEMPORAL PRINCIPAL
   */
  public analyzeTemporalPatterns(realResults: any[]): AdvancedTemporalAnalysis {
    // console.log(`🕐 ANÁLISE TEMPORAL: Processando ${realResults.length} resultados com timestamp`);
    
    if (realResults.length < 24) {
      console.warn('⚠️ Dados insuficientes para análise temporal avançada');
      return this.getDefaultTemporalAnalysis();
    }

    // Converter dados para formato temporal
    const temporalResults = this.convertToTemporalResults(realResults);
    
    // Analisar padrões por hora
    const hourlyPatterns = this.analyzeHourlyPatterns(temporalResults);
    
    // Analisar padrões por dia da semana  
    const dailyPatterns = this.analyzeDailyPatterns(temporalResults);
    
    // Analisar padrões de sessão
    const sessionPatterns = this.analyzeSessionPatterns(temporalResults);
    
    // Detectar tendências mais fortes
    const strongestHourlyBias = this.findStrongestHourlyBias(hourlyPatterns);
    const strongestDailyBias = this.findStrongestDailyBias(dailyPatterns);
    
    // Gerar predição temporal
    const temporalPrediction = this.generateTemporalPrediction(
      hourlyPatterns, dailyPatterns, sessionPatterns
    );
    
    // Análise semanal
    const weeklyAnalysis = this.analyzeWeeklyPatterns(temporalResults);
    
    // Momentum temporal
    const temporalMomentum = this.analyzeTemporalMomentum(temporalResults);
    
    // Alertas temporais
    const temporalAlerts = this.generateTemporalAlerts(
      hourlyPatterns, dailyPatterns, strongestHourlyBias
    );

    const now = new Date();
    const timeBasedTrends: TimeBasedTrends = {
      currentHour: now.getHours(),
      currentDay: now.getDay(),
      hourlyPatterns,
      dailyPatterns,
      strongestHourlyBias,
      strongestDailyBias,
      temporalPrediction,
      sessionPatterns
    };

    const analysis: AdvancedTemporalAnalysis = {
      timeBasedTrends,
      weeklyAnalysis,
      temporalMomentum,
      temporalAlerts
    };

    console.log(`✅ ANÁLISE TEMPORAL CONCLUÍDA: Melhor hora ${strongestHourlyBias.hour}h (${strongestHourlyBias.color})`);
    return analysis;
  }

  /**
   * 🔄 CONVERTER PARA FORMATO TEMPORAL
   */
  private convertToTemporalResults(results: any[]): TemporalResult[] {
    return results
      .filter(r => r.timestamp && !isNaN(r.timestamp))
      .map(result => {
        const timestamp = typeof result.timestamp === 'string' ? 
          new Date(result.timestamp).getTime() : result.timestamp;
        const date = new Date(timestamp);
        
        return {
          number: Number(result.number || result.Number || result.resultado || 0),
          color: this.getColorFromNumber(Number(result.number || result.Number || result.resultado || 0)),
          timestamp,
          hour: date.getHours(),
          dayOfWeek: date.getDay(),
          dayOfMonth: date.getDate()
        };
      })
      .filter(r => r.hour >= 0 && r.hour <= 23 && r.dayOfWeek >= 0 && r.dayOfWeek <= 6);
  }

  /**
   * ⏰ ANALISAR PADRÕES POR HORA
   */
  private analyzeHourlyPatterns(results: TemporalResult[]): HourlyPattern[] {
    const hourlyData: { [hour: number]: TemporalResult[] } = {};
    
    // Agrupar por hora
    results.forEach(result => {
      if (!hourlyData[result.hour]) {
        hourlyData[result.hour] = [];
      }
      hourlyData[result.hour].push(result);
    });

    const patterns: HourlyPattern[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourResults = hourlyData[hour] || [];
      const total = hourResults.length;
      
      if (total === 0) {
        patterns.push({
          hour,
          red: { count: 0, percentage: 0 },
          black: { count: 0, percentage: 0 },
          white: { count: 0, percentage: 0 },
          total: 0,
          bias: 'balanced',
          strength: 0
        });
        continue;
      }

      const redCount = hourResults.filter(r => r.color === 'red').length;
      const blackCount = hourResults.filter(r => r.color === 'black').length;
      const whiteCount = hourResults.filter(r => r.color === 'white').length;

      const redPct = (redCount / total) * 100;
      const blackPct = (blackCount / total) * 100;
      const whitePct = (whiteCount / total) * 100;

      // Determinar viés (desvio > 5% da expectativa)
      let bias: 'red' | 'black' | 'white' | 'balanced' = 'balanced';
      let strength = 0;

      if (redPct > 51.67) { // 46.67 + 5
        bias = 'red';
        strength = redPct - 46.67;
      } else if (blackPct > 51.67) {
        bias = 'black';
        strength = blackPct - 46.67;
      } else if (whitePct > 11.67) { // 6.67 + 5
        bias = 'white';
        strength = whitePct - 6.67;
      }

      patterns.push({
        hour,
        red: { count: redCount, percentage: redPct },
        black: { count: blackCount, percentage: blackPct },
        white: { count: whiteCount, percentage: whitePct },
        total,
        bias,
        strength: Math.round(strength)
      });
    }

    console.log(`⏰ PADRÕES POR HORA: ${patterns.filter(p => p.total > 0).length} horas com dados`);
    return patterns;
  }

  /**
   * 📅 ANALISAR PADRÕES POR DIA DA SEMANA
   */
  private analyzeDailyPatterns(results: TemporalResult[]): DailyPattern[] {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dailyData: { [day: number]: TemporalResult[] } = {};
    
    // Agrupar por dia da semana
    results.forEach(result => {
      if (!dailyData[result.dayOfWeek]) {
        dailyData[result.dayOfWeek] = [];
      }
      dailyData[result.dayOfWeek].push(result);
    });

    const patterns: DailyPattern[] = [];
    
    for (let day = 0; day < 7; day++) {
      const dayResults = dailyData[day] || [];
      const total = dayResults.length;
      
      if (total === 0) {
        patterns.push({
          dayOfWeek: day,
          dayName: dayNames[day],
          red: { count: 0, percentage: 0 },
          black: { count: 0, percentage: 0 },
          white: { count: 0, percentage: 0 },
          total: 0,
          bias: 'balanced',
          strength: 0
        });
        continue;
      }

      const redCount = dayResults.filter(r => r.color === 'red').length;
      const blackCount = dayResults.filter(r => r.color === 'black').length;
      const whiteCount = dayResults.filter(r => r.color === 'white').length;

      const redPct = (redCount / total) * 100;
      const blackPct = (blackCount / total) * 100;
      const whitePct = (whiteCount / total) * 100;

      // Determinar viés
      let bias: 'red' | 'black' | 'white' | 'balanced' = 'balanced';
      let strength = 0;

      if (redPct > 51.67) {
        bias = 'red';
        strength = redPct - 46.67;
      } else if (blackPct > 51.67) {
        bias = 'black';
        strength = blackPct - 46.67;
      } else if (whitePct > 11.67) {
        bias = 'white';
        strength = whitePct - 6.67;
      }

      patterns.push({
        dayOfWeek: day,
        dayName: dayNames[day],
        red: { count: redCount, percentage: redPct },
        black: { count: blackCount, percentage: blackPct },
        white: { count: whiteCount, percentage: whitePct },
        total,
        bias,
        strength: Math.round(strength)
      });
    }

    console.log(`📅 PADRÕES POR DIA: ${patterns.filter(p => p.total > 0).length} dias com dados`);
    return patterns;
  }

  /**
   * 🏢 ANALISAR PADRÕES DE SESSÃO
   */
  private analyzeSessionPatterns(results: TemporalResult[]): any {
    const sessions = {
      earlyMorning: results.filter(r => r.hour >= 5 && r.hour < 9),
      morning: results.filter(r => r.hour >= 9 && r.hour < 12),
      afternoon: results.filter(r => r.hour >= 12 && r.hour < 18),
      evening: results.filter(r => r.hour >= 18 && r.hour < 22),
      night: results.filter(r => r.hour >= 22 || r.hour < 2),
      lateNight: results.filter(r => r.hour >= 2 && r.hour < 5)
    };

    const sessionPatterns: any = {};

    Object.keys(sessions).forEach(sessionName => {
      const sessionResults = sessions[sessionName];
      const total = sessionResults.length;

      if (total === 0) {
        sessionPatterns[sessionName] = { red: 0, black: 0, white: 0 };
        return;
      }

      const redCount = sessionResults.filter(r => r.color === 'red').length;
      const blackCount = sessionResults.filter(r => r.color === 'black').length;
      const whiteCount = sessionResults.filter(r => r.color === 'white').length;

      sessionPatterns[sessionName] = {
        red: (redCount / total) * 100,
        black: (blackCount / total) * 100,
        white: (whiteCount / total) * 100
      };
    });

    console.log(`🏢 PADRÕES DE SESSÃO: ${Object.keys(sessions).length} períodos analisados`);
    return sessionPatterns;
  }

  /**
   * 🏆 ENCONTRAR VIÉS MAIS FORTE POR HORA
   */
  private findStrongestHourlyBias(patterns: HourlyPattern[]): any {
    let strongest = { hour: 0, color: 'balanced' as const, strength: 0, confidence: 0 };

    patterns.forEach(pattern => {
      if (pattern.strength > strongest.strength && pattern.total >= 10) {
        strongest = {
          hour: pattern.hour,
          color: pattern.bias,
          strength: pattern.strength,
          confidence: Math.min(95, pattern.total * 2) // Mais dados = mais confiança
        };
      }
    });

    return strongest;
  }

  /**
   * 🏆 ENCONTRAR VIÉS MAIS FORTE POR DIA
   */
  private findStrongestDailyBias(patterns: DailyPattern[]): any {
    let strongest = { day: 0, dayName: 'Domingo', color: 'balanced' as const, strength: 0, confidence: 0 };

    patterns.forEach(pattern => {
      if (pattern.strength > strongest.strength && pattern.total >= 20) {
        strongest = {
          day: pattern.dayOfWeek,
          dayName: pattern.dayName,
          color: pattern.bias,
          strength: pattern.strength,
          confidence: Math.min(95, pattern.total * 1.5)
        };
      }
    });

    return strongest;
  }

  /**
   * 🎯 GERAR PREDIÇÃO TEMPORAL
   */
  private generateTemporalPrediction(
    hourlyPatterns: HourlyPattern[],
    dailyPatterns: DailyPattern[],
    sessionPatterns: any
  ): any {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Pegar padrão da hora atual
    const currentHourPattern = hourlyPatterns.find(p => p.hour === currentHour);
    const currentDayPattern = dailyPatterns.find(p => p.dayOfWeek === currentDay);

    let redScore = 46.67;
    let blackScore = 46.67;
    let whiteScore = 6.67;
    const reasoning: string[] = [];

    // Ajustar por padrão da hora
    if (currentHourPattern && currentHourPattern.total >= 5) {
      if (currentHourPattern.bias === 'red' && currentHourPattern.strength > 5) {
        redScore += currentHourPattern.strength * 0.3;
        reasoning.push(`Hora ${currentHour}h favorece vermelho (+${currentHourPattern.strength.toFixed(1)}%)`);
      } else if (currentHourPattern.bias === 'black' && currentHourPattern.strength > 5) {
        blackScore += currentHourPattern.strength * 0.3;
        reasoning.push(`Hora ${currentHour}h favorece preto (+${currentHourPattern.strength.toFixed(1)}%)`);
      } else if (currentHourPattern.bias === 'white' && currentHourPattern.strength > 5) {
        whiteScore += currentHourPattern.strength * 0.5;
        reasoning.push(`Hora ${currentHour}h favorece branco (+${currentHourPattern.strength.toFixed(1)}%)`);
      }
    }

    // Ajustar por padrão do dia
    if (currentDayPattern && currentDayPattern.total >= 10) {
      if (currentDayPattern.bias === 'red' && currentDayPattern.strength > 3) {
        redScore += currentDayPattern.strength * 0.2;
        reasoning.push(`${currentDayPattern.dayName} favorece vermelho (+${currentDayPattern.strength.toFixed(1)}%)`);
      } else if (currentDayPattern.bias === 'black' && currentDayPattern.strength > 3) {
        blackScore += currentDayPattern.strength * 0.2;
        reasoning.push(`${currentDayPattern.dayName} favorece preto (+${currentDayPattern.strength.toFixed(1)}%)`);
      } else if (currentDayPattern.bias === 'white' && currentDayPattern.strength > 3) {
        whiteScore += currentDayPattern.strength * 0.3;
        reasoning.push(`${currentDayPattern.dayName} favorece branco (+${currentDayPattern.strength.toFixed(1)}%)`);
      }
    }

    // Normalizar
    const total = redScore + blackScore + whiteScore;
    redScore = (redScore / total) * 100;
    blackScore = (blackScore / total) * 100;
    whiteScore = (whiteScore / total) * 100;

    // Calcular confiança
    const hasHourData = currentHourPattern && currentHourPattern.total >= 5;
    const hasDayData = currentDayPattern && currentDayPattern.total >= 10;
    const confidence = (hasHourData ? 40 : 20) + (hasDayData ? 40 : 20) + (reasoning.length * 10);

    if (reasoning.length === 0) {
      reasoning.push('Padrões temporais insuficientes para ajuste');
    }

    return {
      red: redScore,
      black: blackScore,
      white: whiteScore,
      confidence: Math.min(85, confidence),
      reasoning
    };
  }

  /**
   * 📊 ANALISAR PADRÕES SEMANAIS
   */
  private analyzeWeeklyPatterns(results: TemporalResult[]): any {
    const weekdays = results.filter(r => r.dayOfWeek >= 1 && r.dayOfWeek <= 5);
    const weekends = results.filter(r => r.dayOfWeek === 0 || r.dayOfWeek === 6);

    const getPercentages = (data: TemporalResult[]) => {
      if (data.length === 0) return { red: 0, black: 0, white: 0 };
      
      const red = data.filter(r => r.color === 'red').length;
      const black = data.filter(r => r.color === 'black').length;
      const white = data.filter(r => r.color === 'white').length;
      const total = data.length;

      return {
        red: (red / total) * 100,
        black: (black / total) * 100,
        white: (white / total) * 100
      };
    };

    const weekdaysData = getPercentages(weekdays);
    const weekendsData = getPercentages(weekends);

    const getBias = (data: { red: number; black: number; white: number }) => {
      if (data.red > 51.67) return 'red';
      if (data.black > 51.67) return 'black';
      if (data.white > 11.67) return 'white';
      return 'balanced';
    };

    return {
      weekdays: weekdaysData,
      weekends: weekendsData,
      weekdaysBias: getBias(weekdaysData),
      weekendsBias: getBias(weekendsData)
    };
  }

  /**
   * 📈 ANALISAR MOMENTUM TEMPORAL
   */
  private analyzeTemporalMomentum(results: TemporalResult[]): any {
    const now = Date.now();
    const hours3 = 3 * 60 * 60 * 1000;
    const hours6 = 6 * 60 * 60 * 1000;
    const hours12 = 12 * 60 * 60 * 1000;

    const recent3h = results.filter(r => (now - r.timestamp) <= hours3);
    const recent6h = results.filter(r => (now - r.timestamp) <= hours6);
    const recent12h = results.filter(r => (now - r.timestamp) <= hours12);

    const analyzePeriod = (data: TemporalResult[]) => {
      if (data.length === 0) return { direction: 'balanced' as const, strength: 0 };

      const red = data.filter(r => r.color === 'red').length;
      const black = data.filter(r => r.color === 'black').length;
      const white = data.filter(r => r.color === 'white').length;
      const total = data.length;

      const redPct = (red / total) * 100;
      const blackPct = (black / total) * 100;
      const whitePct = (white / total) * 100;

      let direction: 'red' | 'black' | 'white' = 'red';
      let strength = 0;

      if (redPct > blackPct && redPct > whitePct) {
        direction = 'red';
        strength = redPct - 46.67;
      } else if (blackPct > redPct && blackPct > whitePct) {
        direction = 'black';
        strength = blackPct - 46.67;
      } else {
        direction = 'white';
        strength = whitePct - 6.67;
      }

      return { direction, strength: Math.max(0, strength) };
    };

    const momentum3h = analyzePeriod(recent3h);
    const momentum6h = analyzePeriod(recent6h);
    const momentum12h = analyzePeriod(recent12h);

    // Determinar tendência geral
    let overallTrend: 'increasing_red' | 'increasing_black' | 'increasing_white' | 'stable' = 'stable';
    
    if (momentum3h.direction === momentum6h.direction && momentum6h.direction === momentum12h.direction) {
      if (momentum3h.direction === 'red') overallTrend = 'increasing_red';
      else if (momentum3h.direction === 'black') overallTrend = 'increasing_black';
      else overallTrend = 'increasing_white';
    }

    return {
      last3Hours: momentum3h,
      last6Hours: momentum6h,
      last12Hours: momentum12h,
      overallTrend
    };
  }

  /**
   * 🚨 GERAR ALERTAS TEMPORAIS
   */
  private generateTemporalAlerts(
    hourlyPatterns: HourlyPattern[],
    dailyPatterns: DailyPattern[],
    strongestBias: any
  ): any {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const currentHourPattern = hourlyPatterns.find(p => p.hour === currentHour);
    const currentDayPattern = dailyPatterns.find(p => p.dayOfWeek === currentDay);

    let isOptimalTime = false;
    let timeRecommendation: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'AVOID' = 'AVERAGE';
    const reasoning: string[] = [];

    // Verificar se é hora ótima
    if (currentHourPattern && currentHourPattern.strength > 10 && currentHourPattern.total >= 10) {
      isOptimalTime = true;
      timeRecommendation = 'EXCELLENT';
      reasoning.push(`Hora atual (${currentHour}h) tem forte viés ${currentHourPattern.bias}`);
    } else if (currentHourPattern && currentHourPattern.strength > 5 && currentHourPattern.total >= 5) {
      timeRecommendation = 'GOOD';
      reasoning.push(`Hora atual tem viés moderado ${currentHourPattern.bias}`);
    } else if (currentDayPattern && currentDayPattern.strength > 5) {
      timeRecommendation = 'GOOD';
      reasoning.push(`Dia atual (${currentDayPattern.dayName}) favorece ${currentDayPattern.bias}`);
    }

    // Encontrar próxima hora ótima
    let nextOptimalHour = currentHour;
    for (let i = 1; i <= 24; i++) {
      const nextHour = (currentHour + i) % 24;
      const nextPattern = hourlyPatterns.find(p => p.hour === nextHour);
      if (nextPattern && nextPattern.strength > 8 && nextPattern.total >= 8) {
        nextOptimalHour = nextHour;
        break;
      }
    }

    const currentHourBias = currentHourPattern ? 
      `${currentHourPattern.bias} (${currentHourPattern.strength.toFixed(1)}%)` : 
      'sem dados suficientes';

    if (reasoning.length === 0) {
      reasoning.push('Hora sem padrões temporais significativos');
    }

    return {
      isOptimalTime,
      currentHourBias,
      timeRecommendation,
      nextOptimalHour,
      reasoning
    };
  }

  /**
   * 🔧 HELPERS
   */
  private getColorFromNumber(number: number): 'red' | 'black' | 'white' {
    if (number === 0) return 'white';
    if (number >= 1 && number <= 7) return 'red';
    if (number >= 8 && number <= 14) return 'black';
    return 'white';
  }

  private getDefaultTemporalAnalysis(): AdvancedTemporalAnalysis {
    const now = new Date();
    
    return {
      timeBasedTrends: {
        currentHour: now.getHours(),
        currentDay: now.getDay(),
        hourlyPatterns: [],
        dailyPatterns: [],
        strongestHourlyBias: { hour: 0, color: 'balanced', strength: 0, confidence: 0 },
        strongestDailyBias: { day: 0, dayName: 'Domingo', color: 'balanced', strength: 0, confidence: 0 },
        temporalPrediction: { red: 46.67, black: 46.67, white: 6.67, confidence: 20, reasoning: ['Dados insuficientes'] },
        sessionPatterns: {
          earlyMorning: { red: 0, black: 0, white: 0 },
          morning: { red: 0, black: 0, white: 0 },
          afternoon: { red: 0, black: 0, white: 0 },
          evening: { red: 0, black: 0, white: 0 },
          night: { red: 0, black: 0, white: 0 },
          lateNight: { red: 0, black: 0, white: 0 }
        }
      },
      weeklyAnalysis: {
        weekdays: { red: 0, black: 0, white: 0 },
        weekends: { red: 0, black: 0, white: 0 },
        weekdaysBias: 'balanced',
        weekendsBias: 'balanced'
      },
      temporalMomentum: {
        last3Hours: { direction: 'red', strength: 0 },
        last6Hours: { direction: 'red', strength: 0 },
        last12Hours: { direction: 'red', strength: 0 },
        overallTrend: 'stable'
      },
      temporalAlerts: {
        isOptimalTime: false,
        currentHourBias: 'sem dados',
        timeRecommendation: 'AVERAGE',
        nextOptimalHour: now.getHours(),
        reasoning: ['Dados insuficientes para análise temporal']
      }
    };
  }
}

// Singleton export
export const temporalPatternAnalyzer = TemporalPatternAnalyzer.getInstance();
export type { AdvancedTemporalAnalysis, TimeBasedTrends, HourlyPattern, DailyPattern }; 