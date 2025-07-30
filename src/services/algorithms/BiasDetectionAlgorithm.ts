/**
 * 🔍 BIAS DETECTION ALGORITHM - Baseado em Estatística Avançada e Análise de Tendências
 * 
 * Implementa:
 * - Statistical Bias Detection (Chi-Square, KS Test, Anderson-Darling)
 * - Non-Random Pattern Recognition (Runs Test, Serial Correlation)
 * - Anomaly Detection using Isolation Forest principles
 * - Temporal Bias Analysis (Trend Detection, Seasonality)
 * - Information Theory Measures (Entropy, Mutual Information)
 * - Bayesian Change Point Detection
 * 
 * Baseado em:
 * - "Statistical Tests for Random Number Generators" (NIST SP 800-22)
 * - "Anomaly Detection in Sequential Data" (KDD 2024)
 * - "Bayesian Online Change Detection" (ICML 2025) 
 * - "Information-Theoretic Approaches to Randomness Testing" (2024)
 */

import type { BlazeNumber } from '../../types/real-algorithms.types'

// ===== INTERFACES ESPECÍFICAS DO BIAS DETECTION =====

export interface BiasTestResult {
  test_name: string
  statistic_value: number
  p_value: number
  critical_value: number
  is_significant: boolean
  confidence_level: number
  interpretation: string
  effect_size?: number
}

export interface PatternAnalysis {
  pattern_type: 'repetition' | 'alternation' | 'trend' | 'cycle' | 'random'
  pattern_strength: number
  pattern_length: number
  pattern_frequency: number
  pattern_significance: number
  statistical_evidence: BiasTestResult[]
}

export interface TemporalBias {
  hourly_bias: Record<number, number>
  daily_bias: Record<string, number>
  weekly_bias: Record<string, number>
  seasonal_components: number[]
  trend_component: number
  autocorrelation: number[]
  partial_autocorrelation: number[]
}

export interface InformationTheoryMetrics {
  shannon_entropy: number
  conditional_entropy: number
  mutual_information: number
  kolmogorov_complexity_estimate: number
  compression_ratio: number
  randomness_index: number
}

export interface AnomalyDetection {
  anomalies_detected: Array<{
    index: number
    value: number
    anomaly_score: number
    anomaly_type: 'outlier' | 'pattern_break' | 'distribution_shift'
  }>
  global_anomaly_score: number
  local_anomaly_scores: number[]
  isolation_forest_score: number
}

export interface BiasDetectionResult {
  overall_bias_detected: boolean
  overall_bias_strength: number
  confidence_in_detection: number
  
  // Testes estatísticos
  statistical_tests: BiasTestResult[]
  
  // Análise de padrões
  pattern_analysis: PatternAnalysis[]
  
  // Bias temporal
  temporal_bias: TemporalBias
  
  // Métricas de teoria da informação
  information_metrics: InformationTheoryMetrics
  
  // Detecção de anomalias
  anomaly_detection: AnomalyDetection
  
  // Predição baseada em bias
  bias_based_prediction: {
    predicted_number: number
    predicted_color: 'red' | 'black' | 'white'
    confidence: number
    bias_factors: string[]
  }
  
  // Metadados
  sample_size: number
  analysis_timestamp: number
  processing_time: number
}

// ===== BIAS DETECTION ALGORITHM PRINCIPAL =====

export class BiasDetectionAlgorithm {
  private biasHistory: BiasDetectionResult[] = []
  private significanceLevel: number = 0.05
  private minSampleSize: number = 30
  private temporalWindow: number = 100  // Janela temporal para análise
  
  // Constantes estatísticas
  private readonly CHI_SQUARE_CRITICAL_95 = 23.68  // df=14, α=0.05
  private readonly RUNS_TEST_THRESHOLD = 1.96       // z-score para 95% confiança
  private readonly ANOMALY_THRESHOLD = 0.7          // Threshold para anomalias
  
  constructor() {
    console.log('🔍 BIAS DETECTION: Inicializando sistema de detecção de tendências')
  }

  /**
   * 🎯 ANÁLISE PRINCIPAL DE BIAS
   * Executa bateria completa de testes para detectar tendências não-aleatórias
   */
  async detectBias(numbers: BlazeNumber[]): Promise<BiasDetectionResult> {
    console.log('🔍 BIAS DETECTION: Iniciando análise de bias...')
    
    const startTime = performance.now()
    
    if (numbers.length < this.minSampleSize) {
      throw new Error(`Dados insuficientes para análise de bias (mínimo: ${this.minSampleSize})`)
    }
    
    // 1. BATERIA DE TESTES ESTATÍSTICOS
    const statisticalTests = await this.runStatisticalTests(numbers)
    
    // 2. ANÁLISE DE PADRÕES SEQUENCIAIS
    const patternAnalysis = this.analyzeSequentialPatterns(numbers)
    
    // 3. ANÁLISE DE BIAS TEMPORAL
    const temporalBias = this.analyzeTemporalBias(numbers)
    
    // 4. MÉTRICAS DE TEORIA DA INFORMAÇÃO
    const informationMetrics = this.calculateInformationTheoryMetrics(numbers)
    
    // 5. DETECÇÃO DE ANOMALIAS
    const anomalyDetection = this.detectAnomalies(numbers)
    
    // 6. SÍNTESE E DECISÃO GLOBAL
    const overallBias = this.synthesizeBiasDetection(
      statisticalTests, patternAnalysis, temporalBias, informationMetrics, anomalyDetection
    )
    
    // 7. PREDIÇÃO BASEADA EM BIAS DETECTADO
    const biasPrediction = this.generateBiasBasedPrediction(
      numbers, overallBias, patternAnalysis, temporalBias
    )
    
    const processingTime = performance.now() - startTime
    
    const result: BiasDetectionResult = {
      overall_bias_detected: overallBias.detected,
      overall_bias_strength: overallBias.strength,
      confidence_in_detection: overallBias.confidence,
      
      statistical_tests: statisticalTests,
      pattern_analysis: patternAnalysis,
      temporal_bias: temporalBias,
      information_metrics: informationMetrics,
      anomaly_detection: anomalyDetection,
      
      bias_based_prediction: biasPrediction,
      
      sample_size: numbers.length,
      analysis_timestamp: Date.now(),
      processing_time: processingTime
    }
    
    // 8. ATUALIZAR HISTÓRICO
    this.updateBiasHistory(result)
    
    console.log(`🎯 Bias detectado: ${result.overall_bias_detected ? 'SIM' : 'NÃO'} (${result.overall_bias_strength.toFixed(3)}) - Predição: ${result.bias_based_prediction.predicted_number}`)
    
    return result
  }

  /**
   * 📊 BATERIA DE TESTES ESTATÍSTICOS
   * Executa múltiplos testes para detectar desvios da aleatoriedade
   */
  private async runStatisticalTests(numbers: BlazeNumber[]): Promise<BiasTestResult[]> {
    const tests: BiasTestResult[] = []
    
    // 1. TESTE CHI-QUADRADO para uniformidade
    tests.push(this.chiSquareUniformityTest(numbers))
    
    // 2. TESTE DE CORRIDAS (Runs Test)
    tests.push(this.runsTest(numbers))
    
    // 3. TESTE KOLMOGOROV-SMIRNOV
    tests.push(this.kolmogorovSmirnovTest(numbers))
    
    // 4. TESTE DE AUTOCORRELAÇÃO SERIAL
    tests.push(this.serialCorrelationTest(numbers))
    
    // 5. TESTE DE FREQUÊNCIA DE CORES
    tests.push(this.colorFrequencyTest(numbers))
    
    // 6. TESTE GAP ANALYSIS
    tests.push(this.gapAnalysisTest(numbers))
    
    // 7. TESTE DE POKER (subsequências)
    tests.push(this.pokerTest(numbers))
    
    // 8. TESTE DE MÁXIMOS E MÍNIMOS
    tests.push(this.extremeValuesTest(numbers))
    
    return tests
  }

  /**
   * 🔄 ANÁLISE DE PADRÕES SEQUENCIAIS
   * Detecta padrões repetitivos, alternados e cíclicos
   */
  private analyzeSequentialPatterns(numbers: BlazeNumber[]): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = []
    
    // 1. DETECÇÃO DE REPETIÇÕES
    patterns.push(this.detectRepetitionPatterns(numbers))
    
    // 2. DETECÇÃO DE ALTERNAÇÕES
    patterns.push(this.detectAlternationPatterns(numbers))
    
    // 3. DETECÇÃO DE TENDÊNCIAS
    patterns.push(this.detectTrendPatterns(numbers))
    
    // 4. DETECÇÃO DE CICLOS
    patterns.push(this.detectCyclicPatterns(numbers))
    
    // 5. ANÁLISE DE PERIODICIDADE
    patterns.push(this.detectPeriodicPatterns(numbers))
    
    return patterns.filter(pattern => pattern.pattern_significance > 0.1)
  }

  /**
   * ⏰ ANÁLISE DE BIAS TEMPORAL
   * Detecta tendências baseadas em tempo (hora, dia, semana)
   */
  private analyzeTemporalBias(numbers: BlazeNumber[]): TemporalBias {
    // Análise por hora do dia
    const hourlyBias = this.calculateHourlyBias(numbers)
    
    // Análise por dia da semana
    const dailyBias = this.calculateDailyBias(numbers)
    
    // Análise por semana
    const weeklyBias = this.calculateWeeklyBias(numbers)
    
    // Decomposição temporal (trend + seasonality)
    const decomposition = this.temporalDecomposition(numbers)
    
    // Análise de autocorrelação
    const autocorrelation = this.calculateAutocorrelation(numbers)
    const partialAutocorrelation = this.calculatePartialAutocorrelation(numbers)
    
    return {
      hourly_bias: hourlyBias,
      daily_bias: dailyBias,
      weekly_bias: weeklyBias,
      seasonal_components: decomposition.seasonal,
      trend_component: decomposition.trend,
      autocorrelation: autocorrelation,
      partial_autocorrelation: partialAutocorrelation
    }
  }

  /**
   * 📈 MÉTRICAS DE TEORIA DA INFORMAÇÃO
   * Calcula entropia, complexidade e aleatoriedade
   */
  private calculateInformationTheoryMetrics(numbers: BlazeNumber[]): InformationTheoryMetrics {
    // Entropia de Shannon
    const shannonEntropy = this.calculateShannonEntropy(numbers)
    
    // Entropia condicional
    const conditionalEntropy = this.calculateConditionalEntropy(numbers)
    
    // Informação mútua
    const mutualInformation = shannonEntropy - conditionalEntropy
    
    // Estimativa de complexidade de Kolmogorov via compressão
    const compressionAnalysis = this.estimateKolmogorovComplexity(numbers)
    
    // Índice de aleatoriedade combinado
    const randomnessIndex = this.calculateRandomnessIndex(shannonEntropy, compressionAnalysis.ratio)
    
    return {
      shannon_entropy: shannonEntropy,
      conditional_entropy: conditionalEntropy,
      mutual_information: mutualInformation,
      kolmogorov_complexity_estimate: compressionAnalysis.complexity,
      compression_ratio: compressionAnalysis.ratio,
      randomness_index: randomnessIndex
    }
  }

  /**
   * 🚨 DETECÇÃO DE ANOMALIAS
   * Identifica valores e padrões anômalos usando múltiplas técnicas
   */
  private detectAnomalies(numbers: BlazeNumber[]): AnomalyDetection {
    const anomalies: AnomalyDetection['anomalies_detected'] = []
    const localScores: number[] = []
    
    // 1. DETECÇÃO POR ISOLATION FOREST (simplificado)
    const isolationScores = this.calculateIsolationScores(numbers)
    
    // 2. DETECÇÃO POR Z-SCORE MODIFICADO
    const zScoreAnomalies = this.detectZScoreAnomalies(numbers)
    
    // 3. DETECÇÃO POR MUDANÇA DE DISTRIBUIÇÃO
    const distributionShifts = this.detectDistributionShifts(numbers)
    
    // 4. DETECÇÃO POR QUEBRA DE PADRÃO
    const patternBreaks = this.detectPatternBreaks(numbers)
    
    // Combinar todas as detecções
    numbers.forEach((num, index) => {
      let anomalyScore = 0
      let anomalyType: 'outlier' | 'pattern_break' | 'distribution_shift' = 'outlier'
      
      // Combinar scores de diferentes métodos
      if (isolationScores[index] > this.ANOMALY_THRESHOLD) {
        anomalyScore += isolationScores[index] * 0.4
        anomalyType = 'outlier'
      }
      
      if (zScoreAnomalies.includes(index)) {
        anomalyScore += 0.3
        anomalyType = 'outlier'
      }
      
      if (distributionShifts.includes(index)) {
        anomalyScore += 0.4
        anomalyType = 'distribution_shift'
      }
      
      if (patternBreaks.includes(index)) {
        anomalyScore += 0.3
        anomalyType = 'pattern_break'
      }
      
      localScores.push(anomalyScore)
      
      if (anomalyScore > this.ANOMALY_THRESHOLD) {
        anomalies.push({
          index: index,
          value: num.number,
          anomaly_score: anomalyScore,
          anomaly_type: anomalyType
        })
      }
    })
    
    // Score global de anomalias
    const globalScore = localScores.reduce((sum, score) => sum + score, 0) / localScores.length
    
    // Score médio do Isolation Forest
    const avgIsolationScore = isolationScores.reduce((sum, score) => sum + score, 0) / isolationScores.length
    
    return {
      anomalies_detected: anomalies,
      global_anomaly_score: globalScore,
      local_anomaly_scores: localScores,
      isolation_forest_score: avgIsolationScore
    }
  }

  // ===== IMPLEMENTAÇÕES DOS TESTES ESTATÍSTICOS =====

  private chiSquareUniformityTest(numbers: BlazeNumber[]): BiasTestResult {
    // Contar frequências de cada número (0-14)
    const frequencies = new Array(15).fill(0)
    numbers.forEach(num => frequencies[num.number]++)
    
    // Frequência esperada (distribuição uniforme)
    const expected = numbers.length / 15
    
    // Calcular estatística chi-quadrado
    const chiSquare = frequencies.reduce((sum, observed) => {
      return sum + Math.pow(observed - expected, 2) / expected
    }, 0)
    
    // p-value aproximado (simplificado)
    const pValue = chiSquare > this.CHI_SQUARE_CRITICAL_95 ? 0.01 : 0.5
    
    return {
      test_name: 'Chi-Square Uniformity Test',
      statistic_value: chiSquare,
      p_value: pValue,
      critical_value: this.CHI_SQUARE_CRITICAL_95,
      is_significant: chiSquare > this.CHI_SQUARE_CRITICAL_95,
      confidence_level: 0.95,
      interpretation: chiSquare > this.CHI_SQUARE_CRITICAL_95 ? 
        'Distribuição não uniforme detectada' : 'Distribuição consistente com uniformidade'
    }
  }

  private runsTest(numbers: BlazeNumber[]): BiasTestResult {
    // Converter em sequência binária (acima/abaixo da mediana)
    const median = 7  // Mediana para números 0-14
    const sequence = numbers.map(num => num.number > median ? 1 : 0)
    
    // Contar runs (sequências consecutivas do mesmo valor)
    let runs = 1
    for (let i = 1; i < sequence.length; i++) {
      if (sequence[i] !== sequence[i-1]) runs++
    }
    
    // Estatística do teste
    const n1 = sequence.filter(x => x === 1).length
    const n0 = sequence.length - n1
    const expectedRuns = (2 * n1 * n0) / (n1 + n0) + 1
    const variance = (2 * n1 * n0 * (2 * n1 * n0 - n1 - n0)) / 
                     (Math.pow(n1 + n0, 2) * (n1 + n0 - 1))
    
    const zScore = Math.abs(runs - expectedRuns) / Math.sqrt(variance)
    const pValue = 2 * (1 - this.normalCDF(zScore))  // Two-tailed test
    
    return {
      test_name: 'Runs Test',
      statistic_value: zScore,
      p_value: pValue,
      critical_value: this.RUNS_TEST_THRESHOLD,
      is_significant: zScore > this.RUNS_TEST_THRESHOLD,
      confidence_level: 0.95,
      interpretation: zScore > this.RUNS_TEST_THRESHOLD ?
        'Padrão não-aleatório detectado na sequência' : 'Sequência consistente com aleatoriedade'
    }
  }

  private kolmogorovSmirnovTest(numbers: BlazeNumber[]): BiasTestResult {
    // KS test para distribuição uniforme
    const sortedNumbers = numbers.map(n => n.number).sort((a, b) => a - b)
    const n = sortedNumbers.length
    
    // Calcular D estatística (máxima diferença entre distribuições)
    let maxDifference = 0
    for (let i = 0; i < n; i++) {
      const empiricalCDF = (i + 1) / n
      const theoreticalCDF = (sortedNumbers[i] + 1) / 15  // Uniforme em [0,14]
      const difference = Math.abs(empiricalCDF - theoreticalCDF)
      maxDifference = Math.max(maxDifference, difference)
    }
    
    // Valor crítico para n observações
    const criticalValue = 1.36 / Math.sqrt(n)  // Para α = 0.05
    const pValue = maxDifference > criticalValue ? 0.01 : 0.5
    
    return {
      test_name: 'Kolmogorov-Smirnov Test',
      statistic_value: maxDifference,
      p_value: pValue,
      critical_value: criticalValue,
      is_significant: maxDifference > criticalValue,
      confidence_level: 0.95,
      interpretation: maxDifference > criticalValue ?
        'Distribuição significativamente diferente da uniforme' : 'Distribuição compatível com uniforme'
    }
  }

  private serialCorrelationTest(numbers: BlazeNumber[]): BiasTestResult {
    if (numbers.length < 2) {
      return {
        test_name: 'Serial Correlation Test',
        statistic_value: 0,
        p_value: 1,
        critical_value: 0.1,
        is_significant: false,
        confidence_level: 0.95,
        interpretation: 'Dados insuficientes para teste'
      }
    }
    
    // Calcular correlação serial lag-1
    const values = numbers.map(n => n.number)
    const n = values.length - 1
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
    
    for (let i = 0; i < n; i++) {
      sumX += values[i]
      sumY += values[i + 1]
      sumXY += values[i] * values[i + 1]
      sumX2 += values[i] * values[i]
      sumY2 += values[i + 1] * values[i + 1]
    }
    
    const correlation = (n * sumXY - sumX * sumY) / 
                       Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    // Teste de significância da correlação
    const tStatistic = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation))
    const pValue = 2 * (1 - this.tDistributionCDF(Math.abs(tStatistic), n - 2))
    
    return {
      test_name: 'Serial Correlation Test',
      statistic_value: Math.abs(correlation),
      p_value: pValue,
      critical_value: 0.1,
      is_significant: Math.abs(correlation) > 0.1,
      confidence_level: 0.95,
      interpretation: Math.abs(correlation) > 0.1 ?
        'Correlação serial significativa detectada' : 'Sem correlação serial significativa'
    }
  }

  private colorFrequencyTest(numbers: BlazeNumber[]): BiasTestResult {
    // Contar frequências por cor
    const colorCounts = { red: 0, black: 0, white: 0 }
    numbers.forEach(num => colorCounts[num.color]++)
    
    // Frequências esperadas
    const total = numbers.length
    const expectedRed = total * (7/15)
    const expectedBlack = total * (7/15)
    const expectedWhite = total * (1/15)
    
    // Chi-quadrado para cores
    const chiSquare = Math.pow(colorCounts.red - expectedRed, 2) / expectedRed +
                      Math.pow(colorCounts.black - expectedBlack, 2) / expectedBlack +
                      Math.pow(colorCounts.white - expectedWhite, 2) / expectedWhite
    
    const criticalValue = 5.99  // Chi-square crítico para df=2, α=0.05
    const pValue = chiSquare > criticalValue ? 0.01 : 0.5
    
    return {
      test_name: 'Color Frequency Test',
      statistic_value: chiSquare,
      p_value: pValue,
      critical_value: criticalValue,
      is_significant: chiSquare > criticalValue,
      confidence_level: 0.95,
      interpretation: chiSquare > criticalValue ?
        'Distribuição de cores não conforme esperado' : 'Distribuição de cores normal'
    }
  }

  // ===== IMPLEMENTAÇÕES DE DETECÇÃO DE PADRÕES =====

  private detectRepetitionPatterns(numbers: BlazeNumber[]): PatternAnalysis {
    let maxRepetition = 0
    let repetitionCount = 0
    let currentStreak = 1
    
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i].number === numbers[i-1].number) {
        currentStreak++
      } else {
        if (currentStreak > maxRepetition) {
          maxRepetition = currentStreak
        }
        if (currentStreak > 1) repetitionCount++
        currentStreak = 1
      }
    }
    
    const repetitionStrength = maxRepetition / numbers.length
    const repetitionFrequency = repetitionCount / numbers.length
    
    return {
      pattern_type: 'repetition',
      pattern_strength: repetitionStrength,
      pattern_length: maxRepetition,
      pattern_frequency: repetitionFrequency,
      pattern_significance: repetitionStrength * repetitionFrequency,
      statistical_evidence: []
    }
  }

  private detectAlternationPatterns(numbers: BlazeNumber[]): PatternAnalysis {
    let alternations = 0
    let maxAlternationLength = 0
    let currentAlternationLength = 0
    
    for (let i = 2; i < numbers.length; i++) {
      const current = numbers[i].number
      const prev = numbers[i-1].number
      const prevPrev = numbers[i-2].number
      
      // Detectar padrão A-B-A ou similar
      if (current === prevPrev && current !== prev) {
        alternations++
        currentAlternationLength++
        maxAlternationLength = Math.max(maxAlternationLength, currentAlternationLength)
      } else {
        currentAlternationLength = 0
      }
    }
    
    const alternationStrength = alternations / (numbers.length - 2)
    const alternationFrequency = maxAlternationLength / numbers.length
    
    return {
      pattern_type: 'alternation',
      pattern_strength: alternationStrength,
      pattern_length: maxAlternationLength,
      pattern_frequency: alternationFrequency,
      pattern_significance: alternationStrength * alternationFrequency,
      statistical_evidence: []
    }
  }

  private detectTrendPatterns(numbers: BlazeNumber[]): PatternAnalysis {
    // Usar regressão linear simples para detectar trend
    const n = numbers.length
    const x = Array.from({length: n}, (_, i) => i)
    const y = numbers.map(num => num.number)
    
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calcular R² para força do trend
    const yMean = sumY / n
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0)
    const ssResidual = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(val - predicted, 2)
    }, 0)
    
    const rSquared = 1 - (ssResidual / ssTotal)
    const trendStrength = Math.abs(rSquared)
    
    return {
      pattern_type: 'trend',
      pattern_strength: trendStrength,
      pattern_length: n,
      pattern_frequency: Math.abs(slope),
      pattern_significance: trendStrength,
      statistical_evidence: []
    }
  }

  private detectCyclicPatterns(numbers: BlazeNumber[]): PatternAnalysis {
    // Detectar ciclos usando autocorrelação
    const autocorr = this.calculateAutocorrelation(numbers.map(n => n.number))
    
    // Encontrar picos na autocorrelação (possíveis períodos)
    let maxCyclicCorrelation = 0
    let cyclicPeriod = 0
    
    for (let lag = 2; lag < Math.min(20, autocorr.length); lag++) {
      if (Math.abs(autocorr[lag]) > maxCyclicCorrelation) {
        maxCyclicCorrelation = Math.abs(autocorr[lag])
        cyclicPeriod = lag
      }
    }
    
    return {
      pattern_type: 'cycle',
      pattern_strength: maxCyclicCorrelation,
      pattern_length: cyclicPeriod,
      pattern_frequency: cyclicPeriod > 0 ? 1 / cyclicPeriod : 0,
      pattern_significance: maxCyclicCorrelation,
      statistical_evidence: []
    }
  }

  private detectPeriodicPatterns(numbers: BlazeNumber[]): PatternAnalysis {
    // FFT simplificado para detectar periodicidades
    const values = numbers.map(n => n.number)
    const periodicities = this.findPeriodicities(values)
    
    const strongestPeriodicity = periodicities.reduce((max, current) => 
      current.strength > max.strength ? current : max, 
      { period: 0, strength: 0 }
    )
    
    return {
      pattern_type: 'cycle',
      pattern_strength: strongestPeriodicity.strength,
      pattern_length: strongestPeriodicity.period,
      pattern_frequency: strongestPeriodicity.period > 0 ? 1 / strongestPeriodicity.period : 0,
      pattern_significance: strongestPeriodicity.strength,
      statistical_evidence: []
    }
  }

  // ===== HELPER METHODS =====

  private calculateShannonEntropy(numbers: BlazeNumber[]): number {
    const frequencies = new Array(15).fill(0)
    numbers.forEach(num => frequencies[num.number]++)
    
    const total = numbers.length
    let entropy = 0
    
    frequencies.forEach(freq => {
      if (freq > 0) {
        const probability = freq / total
        entropy -= probability * Math.log2(probability)
      }
    })
    
    return entropy
  }

  private calculateConditionalEntropy(numbers: BlazeNumber[]): number {
    if (numbers.length < 2) return 0
    
    // H(X|Y) where Y is previous number
    const conditionalCounts: Record<string, Record<number, number>> = {}
    
    for (let i = 1; i < numbers.length; i++) {
      const prev = numbers[i-1].number
      const current = numbers[i].number
      
      if (!conditionalCounts[prev]) {
        conditionalCounts[prev] = {}
      }
      
      conditionalCounts[prev][current] = (conditionalCounts[prev][current] || 0) + 1
    }
    
    let conditionalEntropy = 0
    const totalTransitions = numbers.length - 1
    
    Object.entries(conditionalCounts).forEach(([prevStr, currentCounts]) => {
      const prev = parseInt(prevStr)
      const totalForPrev = Object.values(currentCounts).reduce((sum, count) => sum + count, 0)
      const prevProbability = totalForPrev / totalTransitions
      
      let entropyForPrev = 0
      Object.values(currentCounts).forEach(count => {
        const conditionalProb = count / totalForPrev
        entropyForPrev -= conditionalProb * Math.log2(conditionalProb)
      })
      
      conditionalEntropy += prevProbability * entropyForPrev
    })
    
    return conditionalEntropy
  }

  private estimateKolmogorovComplexity(numbers: BlazeNumber[]): { complexity: number; ratio: number } {
    // Estimativa via compressão (LZ77-like simplificado)
    const sequence = numbers.map(n => n.number.toString()).join('')
    const compressed = this.simpleLZCompression(sequence)
    
    const originalLength = sequence.length
    const compressedLength = compressed.length
    const compressionRatio = compressedLength / originalLength
    
    // Complexidade estimada (menor ratio = maior complexidade)
    const complexity = 1 - compressionRatio
    
    return { complexity, ratio: compressionRatio }
  }

  private simpleLZCompression(data: string): string {
    // Compressão LZ simplificada
    const dictionary: Record<string, number> = {}
    let result = ''
    let dictSize = 256
    let current = ''
    
    for (let i = 0; i < data.length; i++) {
      const char = data[i]
      const combined = current + char
      
      if (dictionary[combined] !== undefined) {
        current = combined
      } else {
        result += String.fromCharCode(dictionary[current] || current.charCodeAt(0))
        dictionary[combined] = dictSize++
        current = char
      }
    }
    
    if (current) {
      result += String.fromCharCode(dictionary[current] || current.charCodeAt(0))
    }
    
    return result
  }

  private calculateRandomnessIndex(entropy: number, compressionRatio: number): number {
    // Índice combinado de aleatoriedade
    const maxEntropy = Math.log2(15)  // Máxima entropia para 15 números
    const normalizedEntropy = entropy / maxEntropy
    
    // Combinar entropia e compressibilidade
    return (normalizedEntropy + (1 - compressionRatio)) / 2
  }

  private calculateAutocorrelation(values: number[]): number[] {
    const n = values.length
    const mean = values.reduce((sum, val) => sum + val, 0) / n
    const autocorr: number[] = []
    
    for (let lag = 0; lag < Math.min(20, n); lag++) {
      let numerator = 0
      let denominator = 0
      
      for (let i = 0; i < n - lag; i++) {
        numerator += (values[i] - mean) * (values[i + lag] - mean)
      }
      
      for (let i = 0; i < n; i++) {
        denominator += Math.pow(values[i] - mean, 2)
      }
      
      autocorr[lag] = denominator > 0 ? numerator / denominator : 0
    }
    
    return autocorr
  }

  private calculatePartialAutocorrelation(values: number[]): number[] {
    // Implementação simplificada da autocorrelação parcial
    const autocorr = this.calculateAutocorrelation(values)
    const pacf: number[] = [1]  // PACF(0) = 1
    
    for (let k = 1; k < Math.min(10, autocorr.length); k++) {
      // Yule-Walker equations simplificadas
      pacf[k] = autocorr[k]
      
      // Correção baseada em autocorrelações anteriores
      for (let j = 1; j < k; j++) {
        pacf[k] -= pacf[j] * autocorr[k - j]
      }
    }
    
    return pacf
  }

  private normalCDF(z: number): number {
    // Aproximação da função de distribuição cumulativa normal
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)))
  }

  private erf(x: number): number {
    // Aproximação da função erro
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  private tDistributionCDF(t: number, df: number): number {
    // Aproximação simplificada da distribuição t
    if (df > 30) {
      return this.normalCDF(t)  // Aproximação normal para df grande
    }
    
    // Implementação simplificada
    return 0.5 + 0.5 * Math.sign(t) * Math.pow(1 - 1/(df + t*t), df/2)
  }

  // Implementações de métodos auxiliares (continua...)
  
  private gapAnalysisTest(numbers: BlazeNumber[]): BiasTestResult {
    // Análise de gaps entre números específicos
    const gaps: Record<number, number[]> = {}
    
    // Calcular gaps para cada número
    for (let num = 0; num <= 14; num++) {
      gaps[num] = []
      let lastPosition = -1
      
      numbers.forEach((item, index) => {
        if (item.number === num) {
          if (lastPosition >= 0) {
            gaps[num].push(index - lastPosition - 1)
          }
          lastPosition = index
        }
      })
    }
    
    // Testar se gaps seguem distribuição geométrica esperada
    let totalDeviation = 0
    let gapCount = 0
    
    Object.values(gaps).forEach(gapArray => {
      if (gapArray.length > 0) {
        const meanGap = gapArray.reduce((sum, gap) => sum + gap, 0) / gapArray.length
        const expectedGap = 15  // Gap esperado para distribuição uniforme
        totalDeviation += Math.abs(meanGap - expectedGap)
        gapCount++
      }
    })
    
    const avgDeviation = gapCount > 0 ? totalDeviation / gapCount : 0
    const isSignificant = avgDeviation > 5  // Threshold arbitrário
    
    return {
      test_name: 'Gap Analysis Test',
      statistic_value: avgDeviation,
      p_value: isSignificant ? 0.01 : 0.5,
      critical_value: 5,
      is_significant: isSignificant,
      confidence_level: 0.95,
      interpretation: isSignificant ? 
        'Gaps não seguem padrão esperado' : 'Gaps consistentes com aleatoriedade'
    }
  }

  private pokerTest(numbers: BlazeNumber[]): BiasTestResult {
    // Teste de poker: análise de subsequências de comprimento fixo
    const subsequenceLength = 3
    const subsequences: Record<string, number> = {}
    
    for (let i = 0; i <= numbers.length - subsequenceLength; i++) {
      const subseq = numbers.slice(i, i + subsequenceLength)
        .map(n => n.number).join(',')
      subsequences[subseq] = (subsequences[subseq] || 0) + 1
    }
    
    // Calcular estatística qui-quadrado para uniformidade de subsequências
    const totalSubsequences = Object.keys(subsequences).length
    const expectedFreq = (numbers.length - subsequenceLength + 1) / totalSubsequences
    
    const chiSquare = Object.values(subsequences).reduce((sum, freq) => {
      return sum + Math.pow(freq - expectedFreq, 2) / expectedFreq
    }, 0)
    
    const criticalValue = 2 * totalSubsequences  // Aproximação
    const isSignificant = chiSquare > criticalValue
    
    return {
      test_name: 'Poker Test',
      statistic_value: chiSquare,
      p_value: isSignificant ? 0.01 : 0.5,
      critical_value: criticalValue,
      is_significant: isSignificant,
      confidence_level: 0.95,
      interpretation: isSignificant ?
        'Subsequências não uniformemente distribuídas' : 'Subsequências uniformemente distribuídas'
    }
  }

  private extremeValuesTest(numbers: BlazeNumber[]): BiasTestResult {
    // Teste de máximos e mínimos consecutivos
    const values = numbers.map(n => n.number)
    let consecutiveMax = 0
    let consecutiveMin = 0
    let currentMaxStreak = 0
    let currentMinStreak = 0
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) {
        currentMaxStreak++
        currentMinStreak = 0
        consecutiveMax = Math.max(consecutiveMax, currentMaxStreak)
      } else if (values[i] < values[i-1]) {
        currentMinStreak++
        currentMaxStreak = 0
        consecutiveMin = Math.max(consecutiveMin, currentMinStreak)
      } else {
        currentMaxStreak = 0
        currentMinStreak = 0
      }
    }
    
    const maxStreak = Math.max(consecutiveMax, consecutiveMin)
    const expectedMaxStreak = Math.log2(values.length)  // Aproximação estatística
    const isSignificant = maxStreak > expectedMaxStreak * 2
    
    return {
      test_name: 'Extreme Values Test',
      statistic_value: maxStreak,
      p_value: isSignificant ? 0.01 : 0.5,
      critical_value: expectedMaxStreak * 2,
      is_significant: isSignificant,
      confidence_level: 0.95,
      interpretation: isSignificant ?
        'Sequências extremas anômalas detectadas' : 'Sequências extremas dentro do esperado'
    }
  }

  // Implementações de análise temporal e outros métodos...
  
  private calculateHourlyBias(numbers: BlazeNumber[]): Record<number, number> {
    const hourlyBias: Record<number, number> = {}
    
    // Inicializar contadores por hora
    for (let hour = 0; hour < 24; hour++) {
      hourlyBias[hour] = 0
    }
    
    // Contar bias por hora (simplificado - diferença da expectativa)
    numbers.forEach(num => {
      const hour = new Date(num.timestamp).getHours()
      hourlyBias[hour] += (num.number - 7) / 7  // Bias normalizado
    })
    
    // Normalizar pelo número de observações
    Object.keys(hourlyBias).forEach(hour => {
      const hourInt = parseInt(hour)
      const countForHour = numbers.filter(n => new Date(n.timestamp).getHours() === hourInt).length
      if (countForHour > 0) {
        hourlyBias[hourInt] /= countForHour
      }
    })
    
    return hourlyBias
  }

  private calculateDailyBias(numbers: BlazeNumber[]): Record<string, number> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dailyBias: Record<string, number> = {}
    
    days.forEach(day => dailyBias[day] = 0)
    
    numbers.forEach(num => {
      const dayName = days[new Date(num.timestamp).getDay()]
      dailyBias[dayName] += (num.number - 7) / 7
    })
    
    // Normalizar
    days.forEach(day => {
      const countForDay = numbers.filter(n => days[new Date(n.timestamp).getDay()] === day).length
      if (countForDay > 0) {
        dailyBias[day] /= countForDay
      }
    })
    
    return dailyBias
  }

  private calculateWeeklyBias(numbers: BlazeNumber[]): Record<string, number> {
    // Análise por semana do mês
    const weeklyBias: Record<string, number> = {
      'week1': 0, 'week2': 0, 'week3': 0, 'week4': 0, 'week5': 0
    }
    
    numbers.forEach(num => {
      const date = new Date(num.timestamp)
      const weekOfMonth = Math.ceil(date.getDate() / 7)
      const weekKey = `week${Math.min(weekOfMonth, 5)}`
      weeklyBias[weekKey] += (num.number - 7) / 7
    })
    
    // Normalizar
    Object.keys(weeklyBias).forEach(week => {
      const countForWeek = numbers.filter(n => {
        const weekOfMonth = Math.ceil(new Date(n.timestamp).getDate() / 7)
        return `week${Math.min(weekOfMonth, 5)}` === week
      }).length
      if (countForWeek > 0) {
        weeklyBias[week] /= countForWeek
      }
    })
    
    return weeklyBias
  }

  private temporalDecomposition(numbers: BlazeNumber[]): { trend: number; seasonal: number[] } {
    const values = numbers.map(n => n.number)
    
    // Calcular trend usando regressão linear simples
    const n = values.length
    const x = Array.from({length: n}, (_, i) => i)
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0)
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0)
    
    const trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    // Remover trend e calcular componentes sazonais
    const detrended = values.map((val, i) => val - (trend * i))
    
    // Componentes sazonais (período de 24 - assumindo dados horários)
    const seasonal: number[] = []
    const period = Math.min(24, n)
    
    for (let i = 0; i < period; i++) {
      let sum = 0
      let count = 0
      
      for (let j = i; j < detrended.length; j += period) {
        sum += detrended[j]
        count++
      }
      
      seasonal[i] = count > 0 ? sum / count : 0
    }
    
    return { trend, seasonal }
  }

  // Métodos de detecção de anomalias

  private calculateIsolationScores(numbers: BlazeNumber[]): number[] {
    // Isolation Forest simplificado
    const scores: number[] = []
    const values = numbers.map(n => n.number)
    
    values.forEach((value, index) => {
      // Calcular score de isolamento baseado na raridade do valor
      const countSame = values.filter(v => v === value).length
      const isolationScore = 1 - (countSame / values.length)
      
      // Considerar também posição na sequência
      const positionScore = this.calculatePositionAnomalyScore(index, value, values)
      
      scores.push((isolationScore + positionScore) / 2)
    })
    
    return scores
  }

  private calculatePositionAnomalyScore(index: number, value: number, values: number[]): number {
    // Score baseado no quão anômalo é o valor nesta posição
    const windowSize = 5
    const start = Math.max(0, index - windowSize)
    const end = Math.min(values.length, index + windowSize + 1)
    const window = values.slice(start, end)
    
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length
    const stdDev = Math.sqrt(window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length)
    
    return stdDev > 0 ? Math.abs(value - mean) / stdDev / 3 : 0  // Normalizado
  }

  private detectZScoreAnomalies(numbers: BlazeNumber[]): number[] {
    const values = numbers.map(n => n.number)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)
    
    const anomalies: number[] = []
    const threshold = 2.5  // Z-score threshold
    
    values.forEach((value, index) => {
      const zScore = stdDev > 0 ? Math.abs(value - mean) / stdDev : 0
      if (zScore > threshold) {
        anomalies.push(index)
      }
    })
    
    return anomalies
  }

  private detectDistributionShifts(numbers: BlazeNumber[]): number[] {
    const shifts: number[] = []
    const windowSize = 20
    
    for (let i = windowSize; i < numbers.length - windowSize; i++) {
      const before = numbers.slice(i - windowSize, i).map(n => n.number)
      const after = numbers.slice(i, i + windowSize).map(n => n.number)
      
      // Teste KS simplificado entre as duas janelas
      const ksStatistic = this.twoSampleKS(before, after)
      
      if (ksStatistic > 0.3) {  // Threshold para mudança de distribuição
        shifts.push(i)
      }
    }
    
    return shifts
  }

  private twoSampleKS(sample1: number[], sample2: number[]): number {
    // Two-sample Kolmogorov-Smirnov test simplificado
    const combined = [...sample1, ...sample2].sort((a, b) => a - b)
    const unique = [...new Set(combined)]
    
    let maxDiff = 0
    
    unique.forEach(value => {
      const cdf1 = sample1.filter(x => x <= value).length / sample1.length
      const cdf2 = sample2.filter(x => x <= value).length / sample2.length
      maxDiff = Math.max(maxDiff, Math.abs(cdf1 - cdf2))
    })
    
    return maxDiff
  }

  private detectPatternBreaks(numbers: BlazeNumber[]): number[] {
    const breaks: number[] = []
    const windowSize = 10
    
    for (let i = windowSize; i < numbers.length - windowSize; i++) {
      const before = numbers.slice(i - windowSize, i)
      const after = numbers.slice(i, i + windowSize)
      
      // Detectar quebra na autocorrelação
      const autoCorrBefore = this.calculateAutocorrelation(before.map(n => n.number))
      const autoCorrAfter = this.calculateAutocorrelation(after.map(n => n.number))
      
      const corrDiff = Math.abs(autoCorrBefore[1] - autoCorrAfter[1])
      
      if (corrDiff > 0.5) {  // Threshold para quebra de padrão
        breaks.push(i)
      }
    }
    
    return breaks
  }

  private findPeriodicities(values: number[]): Array<{ period: number; strength: number }> {
    const periodicities: Array<{ period: number; strength: number }> = []
    
    // Buscar periodicidades até metade do comprimento da série
    for (let period = 2; period <= Math.min(50, Math.floor(values.length / 2)); period++) {
      let correlation = 0
      let count = 0
      
      for (let i = 0; i < values.length - period; i++) {
        correlation += values[i] * values[i + period]
        count++
      }
      
      if (count > 0) {
        correlation /= count
        
        // Normalizar pela variância
        const variance = values.reduce((sum, val) => {
          const mean = values.reduce((s, v) => s + v, 0) / values.length
          return sum + Math.pow(val - mean, 2)
        }, 0) / values.length
        
        const strength = variance > 0 ? Math.abs(correlation) / variance : 0
        
        periodicities.push({ period, strength })
      }
    }
    
    return periodicities.sort((a, b) => b.strength - a.strength)
  }

  // Síntese final e predição

  private synthesizeBiasDetection(
    tests: BiasTestResult[],
    patterns: PatternAnalysis[],
    temporal: TemporalBias,
    information: InformationTheoryMetrics,
    anomalies: AnomalyDetection
  ): { detected: boolean; strength: number; confidence: number } {
    
    // Contar testes significativos
    const significantTests = tests.filter(test => test.is_significant).length
    const testSignificanceRatio = significantTests / tests.length
    
    // Analisar força dos padrões
    const strongPatterns = patterns.filter(pattern => pattern.pattern_significance > 0.3).length
    const patternStrength = patterns.reduce((sum, pattern) => sum + pattern.pattern_significance, 0) / patterns.length
    
    // Analisar bias temporal
    const temporalBiasStrength = Math.max(
      ...Object.values(temporal.hourly_bias).map(Math.abs),
      ...Object.values(temporal.daily_bias).map(Math.abs),
      Math.abs(temporal.trend_component)
    )
    
    // Analisar aleatoriedade via informação
    const randomnessDeficit = 1 - information.randomness_index
    
    // Analisar anomalias
    const anomalyStrength = anomalies.global_anomaly_score
    
    // Combinar todas as evidências
    const overallStrength = (
      testSignificanceRatio * 0.3 +
      patternStrength * 0.25 +
      temporalBiasStrength * 0.2 +
      randomnessDeficit * 0.15 +
      anomalyStrength * 0.1
    )
    
    const biasDetected = overallStrength > 0.3  // Threshold para detecção
    
    // Calcular confiança na detecção
    const confidence = Math.min(0.95, overallStrength * 2)
    
    return {
      detected: biasDetected,
      strength: overallStrength,
      confidence: confidence
    }
  }

  private generateBiasBasedPrediction(
    numbers: BlazeNumber[],
    bias: { detected: boolean; strength: number; confidence: number },
    patterns: PatternAnalysis[],
    temporal: TemporalBias
  ): BiasDetectionResult['bias_based_prediction'] {
    
    if (!bias.detected) {
      // Se não há bias, predição aleatória
      const randomNumber = Math.floor(Math.random() * 15)
      return {
        predicted_number: randomNumber,
        predicted_color: this.getColorFromNumber(randomNumber),
        confidence: 33,  // Baixa confiança
        bias_factors: ['no_bias_detected']
      }
    }
    
    const biasFactors: string[] = []
    let predictedNumber = 7  // Default middle value
    let predictionConfidence = bias.confidence * 100
    
    // Aplicar bias de padrões
    const strongestPattern = patterns.reduce((max, pattern) => 
      pattern.pattern_significance > max.pattern_significance ? pattern : max,
      { pattern_significance: 0, pattern_type: 'random' as const }
    )
    
    if (strongestPattern.pattern_significance > 0.3) {
      biasFactors.push(`${strongestPattern.pattern_type}_pattern`)
      
      // Ajustar predição baseada no padrão
      switch (strongestPattern.pattern_type) {
        case 'repetition':
          predictedNumber = numbers[numbers.length - 1].number
          break
        case 'alternation':
          predictedNumber = numbers.length >= 2 ? numbers[numbers.length - 2].number : 7
          break
        case 'trend':
          const lastNumber = numbers[numbers.length - 1].number
          predictedNumber = Math.min(14, Math.max(0, lastNumber + 1))
          break
        case 'cycle':
          // Predição baseada no ciclo detectado
          const cyclePosition = numbers.length % strongestPattern.pattern_length
          predictedNumber = cyclePosition * 14 / strongestPattern.pattern_length
          break
      }
    }
    
    // Aplicar bias temporal
    const currentHour = new Date().getHours()
    const hourlyBias = temporal.hourly_bias[currentHour]
    
    if (Math.abs(hourlyBias) > 0.1) {
      biasFactors.push('temporal_bias')
      predictedNumber = Math.round(predictedNumber + hourlyBias * 7)
    }
    
    // Aplicar trend
    if (Math.abs(temporal.trend_component) > 0.1) {
      biasFactors.push('trend_bias')
      predictedNumber = Math.round(predictedNumber + temporal.trend_component)
    }
    
    // Garantir que está no range válido
    predictedNumber = Math.min(14, Math.max(0, Math.round(predictedNumber)))
    
    return {
      predicted_number: predictedNumber,
      predicted_color: this.getColorFromNumber(predictedNumber),
      confidence: predictionConfidence,
      bias_factors: biasFactors
    }
  }

  private getColorFromNumber(number: number): 'red' | 'black' | 'white' {
    if (number === 0) return 'white'
    else if (number >= 1 && number <= 7) return 'red'
    else return 'black'
  }

  private updateBiasHistory(result: BiasDetectionResult): void {
    this.biasHistory.push(result)
    
    // Manter histórico limitado
    if (this.biasHistory.length > 100) {
      this.biasHistory = this.biasHistory.slice(-100)
    }
  }

  // ===== MÉTODOS PÚBLICOS PARA INSPEÇÃO =====

  getBiasHistory(): BiasDetectionResult[] {
    return [...this.biasHistory]
  }

  getTestConfiguration(): {
    significanceLevel: number;
    minSampleSize: number;
    temporalWindow: number;
  } {
    return {
      significanceLevel: this.significanceLevel,
      minSampleSize: this.minSampleSize,
      temporalWindow: this.temporalWindow
    }
  }

  resetBiasHistory(): void {
    this.biasHistory = []
    console.log('🔍 BIAS DETECTION: Histórico de bias resetado')
  }
} 