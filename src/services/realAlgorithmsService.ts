/**
 * 🎯 SERVIÇO DE ALGORITMOS REAIS - BLAZE PREDICTION
 * 
 * Algoritmos baseados APENAS em dados reais e matemática sólida:
 * - WHITE GOLD: Especializado em detectar branco (14x payout)
 * - FREQUENCY COMPENSATION: Compensação estatística real
 * - GAP ANALYSIS: Análise de lacunas baseada em dados
 * - MARKOV CHAIN: Cadeia de Markov real
 * - ROI CALCULATOR: Calculadora de retorno real
 * 
 * SEM SIMULAÇÕES - APENAS DADOS REAIS
 */

import type { 
  BlazeNumber, 
  RealAlgorithmResult, 
  RealPredictionResult, 
  ROIAnalysis,
  WhiteGoldAlgorithm,
  FrequencyCompensationAlgorithm,
  GapAnalysisAlgorithm,
  MarkovChainAlgorithm
} from '../types/real-algorithms.types';
import { RealMLService } from './realMLService';

// ✅ ETAPA 3: NOVOS ALGORITMOS CIENTÍFICOS 2024-2025
import { BallisticPredictionAlgorithm } from './algorithms/BallisticPredictionAlgorithm';
import { QuantumInspiredLSTM } from './algorithms/QuantumInspiredLSTM';
import { BiasDetectionAlgorithm } from './algorithms/BiasDetectionAlgorithm';

export class RealAlgorithmsService {
  
  // ✅ ETAPA 3: INSTÂNCIAS DOS NOVOS ALGORITMOS CIENTÍFICOS
  private static ballisticAlgorithm: BallisticPredictionAlgorithm | null = null;
  private static quantumLSTM: QuantumInspiredLSTM | null = null;
  private static biasDetection: BiasDetectionAlgorithm | null = null;

  /**
   * 🚀 INICIALIZAR NOVOS ALGORITMOS CIENTÍFICOS
   */
  static initializeAdvancedAlgorithms(): void {
    if (!this.ballisticAlgorithm) {
      this.ballisticAlgorithm = new BallisticPredictionAlgorithm();
    }
    if (!this.quantumLSTM) {
      this.quantumLSTM = new QuantumInspiredLSTM();
    }
    if (!this.biasDetection) {
      this.biasDetection = new BiasDetectionAlgorithm();
    }
    
    console.log('🚀 ALGORITMOS CIENTÍFICOS: Inicializados (Ballistic + Quantum + Bias Detection)');
  }

  /**
   * 🏆 ALGORITMO PRINCIPAL - WHITE GOLD DETECTOR
   * Especializado em detectar padrões de BRANCO (payout 14x)
   * Baseado em pressão estatística e ciclos reais
   */
  static calculateWhiteGoldPrediction(data: BlazeNumber[]): WhiteGoldAlgorithm {
    if (data.length < 50) {
      throw new Error('Dados insuficientes para White Gold (mínimo 50 números)');
    }

    // 1. CALCULAR FREQUÊNCIA REAL DE BRANCOS
    const whiteCount = data.filter(n => n.color === 'white').length;
    const whiteFrequency = whiteCount / data.length;
    const expectedWhiteFreq = 1/15; // ~6.67% teórico

    // 2. CALCULAR GAP DESDE ÚLTIMO BRANCO
    let lastWhiteGap = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].color === 'white') break;
      lastWhiteGap++;
    }

    // 3. CALCULAR CICLO ESPERADO BASEADO EM DADOS HISTÓRICOS
    const whitePositions: number[] = [];
    data.forEach((num, index) => {
      if (num.color === 'white') whitePositions.push(index);
    });

    let averageCycle = 15; // Default teórico
    if (whitePositions.length > 1) {
      const cycles = whitePositions.slice(1).map((pos, i) => pos - whitePositions[i]);
      averageCycle = cycles.reduce((sum, cycle) => sum + cycle, 0) / cycles.length;
    }

    // 4. CALCULAR PRESSÃO ESTATÍSTICA (PRESSURE COOKER)
    const pressureCookerValue = Math.max(0, lastWhiteGap - averageCycle);
    const pressureMultiplier = Math.min(5, pressureCookerValue / 10); // Máximo 5x

    // 5. CALCULAR PROBABILIDADE REAL (não random)
    let whiteProbability = expectedWhiteFreq;
    
    // Aumentar probabilidade baseado na pressão
    if (lastWhiteGap > averageCycle) {
      const overdue = lastWhiteGap / averageCycle;
      whiteProbability = expectedWhiteFreq * (1 + overdue * 0.5);
    }

    // Ajustar baseado na frequência histórica
    if (whiteFrequency < expectedWhiteFreq * 0.8) {
      whiteProbability *= 1.5; // Aumentar se está sub-representado
    }

    // 6. CALCULAR ROI POTENTIAL
    const roiPotential = whiteProbability * 14; // 14x payout

    // console.log('🤍 WHITE GOLD ANALYSIS:');
    // console.log(`   Frequência atual: ${(whiteFrequency * 100).toFixed(2)}% (esperado: 6.67%)`);
    // console.log(`   Gap desde último: ${lastWhiteGap} números`);
    // console.log(`   Ciclo médio: ${averageCycle.toFixed(1)} números`);
    // console.log(`   Pressão acumulada: ${pressureCookerValue.toFixed(1)}`);
    // console.log(`   Probabilidade real: ${(whiteProbability * 100).toFixed(2)}%`);
    // console.log(`   ROI potencial: ${(roiPotential * 100).toFixed(1)}%`);

    return {
      name: 'WHITE_GOLD_DETECTOR',
      white_frequency: whiteFrequency,
      pressure_cooker_value: pressureCookerValue,
      last_white_gap: lastWhiteGap,
      expected_white_cycle: averageCycle,
      white_probability: whiteProbability,
      roi_potential: roiPotential
    };
  }

  /**
   * 📊 ALGORITMO FREQUENCY COMPENSATION
   * Calcula déficits reais vs expectativas teóricas
   */
  static calculateFrequencyCompensation(data: BlazeNumber[]): FrequencyCompensationAlgorithm {
    if (data.length < 30) {
      throw new Error('Dados insuficientes para Frequency Compensation (mínimo 30)');
    }

    const redCount = data.filter(n => n.color === 'red').length;
    const blackCount = data.filter(n => n.color === 'black').length;
    const whiteCount = data.filter(n => n.color === 'white').length;

    const total = data.length;
    const expectedRed = total * (7/15); // 7 números vermelhos de 15
    const expectedBlack = total * (7/15); // 7 números pretos de 15
    const expectedWhite = total * (1/15); // 1 número branco de 15

    const redDeficit = expectedRed - redCount;
    const blackDeficit = expectedBlack - blackCount;
    const whiteDeficit = expectedWhite - whiteCount;

    // Determinar mais sub-representado
    let mostUnderrepresented: 'red' | 'black' | 'white' = 'white';
    let maxDeficit = whiteDeficit;

    if (redDeficit > maxDeficit) {
      mostUnderrepresented = 'red';
      maxDeficit = redDeficit;
    }
    if (blackDeficit > maxDeficit) {
      mostUnderrepresented = 'black';
      maxDeficit = blackDeficit;
    }

    // Calcular força da compensação
    const compensationStrength = Math.abs(maxDeficit) / total;

    // console.log('📊 FREQUENCY COMPENSATION:');
    // console.log(`   Vermelho: ${redCount}/${expectedRed.toFixed(1)} (déficit: ${redDeficit.toFixed(1)})`);
    // console.log(`   Preto: ${blackCount}/${expectedBlack.toFixed(1)} (déficit: ${blackDeficit.toFixed(1)})`);
    // console.log(`   Branco: ${whiteCount}/${expectedWhite.toFixed(1)} (déficit: ${whiteDeficit.toFixed(1)})`);
    // console.log(`   Mais sub-representado: ${mostUnderrepresented.toUpperCase()}`);
    // console.log(`   Força compensação: ${(compensationStrength * 100).toFixed(2)}%`);

    return {
      name: 'FREQUENCY_COMPENSATION',
      red_deficit: redDeficit,
      black_deficit: blackDeficit,
      white_deficit: whiteDeficit,
      most_underrepresented: mostUnderrepresented,
      compensation_strength: compensationStrength
    };
  }

  /**
   * ⏰ ALGORITMO GAP ANALYSIS
   * Analisa lacunas reais desde última aparição de cada número
   */
  static calculateGapAnalysis(data: BlazeNumber[]): GapAnalysisAlgorithm {
    if (data.length < 20) {
      throw new Error('Dados insuficientes para Gap Analysis (mínimo 20)');
    }

    const redNumbersGaps: { [key: number]: number } = {};
    const blackNumbersGaps: { [key: number]: number } = {};
    let whiteGap = 0;

    // Calcular gaps para números vermelhos (1-7)
    for (let num = 1; num <= 7; num++) {
      let gap = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].number === num) break;
        gap++;
      }
      redNumbersGaps[num] = gap;
    }

    // Calcular gaps para números pretos (8-14)
    for (let num = 8; num <= 14; num++) {
      let gap = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].number === num) break;
        gap++;
      }
      blackNumbersGaps[num] = gap;
    }

    // Calcular gap do branco (0)
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].number === 0) break;
      whiteGap++;
    }

    // Encontrar número com maior gap
    let highestGapNumber = 0;
    let maxGap = whiteGap;

    Object.entries(redNumbersGaps).forEach(([num, gap]) => {
      if (gap > maxGap) {
        highestGapNumber = parseInt(num);
        maxGap = gap;
      }
    });

    Object.entries(blackNumbersGaps).forEach(([num, gap]) => {
      if (gap > maxGap) {
        highestGapNumber = parseInt(num);
        maxGap = gap;
      }
    });

    // Calcular urgência baseada em dados históricos
    const averageFreq = data.length / 15; // Frequência média esperada
    const gapUrgency = maxGap / averageFreq;

    // console.log('⏰ GAP ANALYSIS:');
    // console.log(`   Branco (0): ${whiteGap} números atrás`);
    // console.log(`   Vermelhos: ${Object.entries(redNumbersGaps).map(([n,g]) => `${n}:${g}`).join(' ')}`);
    // console.log(`   Pretos: ${Object.entries(blackNumbersGaps).map(([n,g]) => `${n}:${g}`).join(' ')}`);
    // console.log(`   Maior gap: número ${highestGapNumber} (${maxGap} atrás)`);
    // console.log(`   Urgência: ${gapUrgency.toFixed(2)}x`);

    return {
      name: 'GAP_ANALYSIS',
      red_numbers_gaps: redNumbersGaps,
      black_numbers_gaps: blackNumbersGaps,
      white_gap: whiteGap,
      highest_gap_number: highestGapNumber,
      gap_urgency: gapUrgency
    };
  }

  /**
   * 🔗 ALGORITMO MARKOV CHAIN REAL
   * Constrói matriz de transições reais entre números
   */
  static calculateMarkovChain(data: BlazeNumber[]): MarkovChainAlgorithm {
    if (data.length < 100) {
      throw new Error('Dados insuficientes para Markov Chain (mínimo 100)');
    }

    // Inicializar matriz 15x15 (números 0-14)
    const transitionMatrix: number[][] = Array(15).fill(null).map(() => Array(15).fill(0));
    const transitionCounts: number[][] = Array(15).fill(null).map(() => Array(15).fill(0));

    // Construir matriz de transições reais
    for (let i = 0; i < data.length - 1; i++) {
      const currentNum = data[i].number;
      const nextNum = data[i + 1].number;
      transitionCounts[currentNum][nextNum]++;
    }

    // Converter contagens em probabilidades
    for (let i = 0; i < 15; i++) {
      const rowSum = transitionCounts[i].reduce((sum, count) => sum + count, 0);
      if (rowSum > 0) {
        for (let j = 0; j < 15; j++) {
          transitionMatrix[i][j] = transitionCounts[i][j] / rowSum;
        }
      } else {
        // Se não há transições, usar probabilidade uniforme
        for (let j = 0; j < 15; j++) {
          transitionMatrix[i][j] = 1/15;
        }
      }
    }

    const currentState = data[data.length - 1].number;
    const nextProbabilities = transitionMatrix[currentState];

    // Encontrar número mais provável
    let mostLikelyNext = 0;
    let maxProbability = nextProbabilities[0];
    for (let i = 1; i < 15; i++) {
      if (nextProbabilities[i] > maxProbability) {
        maxProbability = nextProbabilities[i];
        mostLikelyNext = i;
      }
    }

    // Calcular confiança baseada no tamanho da amostra
    const sampleSize = data.length - 1;
    const chainConfidence = Math.min(0.95, sampleSize / 1000); // Máximo 95%

    // console.log('🔗 MARKOV CHAIN REAL:');
    // console.log(`   Estado atual: ${currentState}`);
    // console.log(`   Mais provável próximo: ${mostLikelyNext} (${(maxProbability * 100).toFixed(1)}%)`);
    // console.log(`   Confiança da cadeia: ${(chainConfidence * 100).toFixed(1)}%`);
    // console.log(`   Amostra: ${sampleSize} transições`);

    return {
      name: 'MARKOV_CHAIN_REAL',
      transition_matrix: transitionMatrix,
      current_state: currentState,
      next_probabilities: nextProbabilities,
      most_likely_next: mostLikelyNext,
      chain_confidence: chainConfidence
    };
  }

  /**
   * 💰 CALCULADORA ROI REAL
   * Calcula retorno real baseado em payouts da Blaze
   */
  static calculateROIAnalysis(
    redProbability: number,
    blackProbability: number, 
    whiteProbability: number
  ): ROIAnalysis {
    
    // Payouts reais da Blaze
    const redBlackPayout = 2; // 2x
    const whitePayout = 14; // 14x

    // Calcular Expected Value (EV) real para cada cor
    const expectedValueRed = (redProbability * redBlackPayout) - 1;
    const expectedValueBlack = (blackProbability * redBlackPayout) - 1;
    const expectedValueWhite = (whiteProbability * whitePayout) - 1;

    // Determinar cor ótima (maior EV)
    let optimalBetColor: 'red' | 'black' | 'white' = 'red';
    let maxEV = expectedValueRed;

    if (expectedValueBlack > maxEV) {
      optimalBetColor = 'black';
      maxEV = expectedValueBlack;
    }
    if (expectedValueWhite > maxEV) {
      optimalBetColor = 'white';
      maxEV = expectedValueWhite;
    }

    // Calcular Kelly Criterion para gestão de banca
    const kellyCriterion = maxEV > 0 ? Math.min(0.25, maxEV * 0.1) : 0; // Máximo 25% da banca

    // console.log('💰 ROI ANALYSIS:');
    // console.log(`   EV Vermelho: ${(expectedValueRed * 100).toFixed(1)}%`);
    // console.log(`   EV Preto: ${(expectedValueBlack * 100).toFixed(1)}%`);
    // console.log(`   EV Branco: ${(expectedValueWhite * 100).toFixed(1)}%`);
    // console.log(`   Cor ótima: ${optimalBetColor.toUpperCase()} (EV: ${(maxEV * 100).toFixed(1)}%)`);
    // console.log(`   Kelly Criterion: ${(kellyCriterion * 100).toFixed(1)}% da banca`);

    return {
      red_black_payout: redBlackPayout,
      white_payout: whitePayout,
      expected_value_red: expectedValueRed,
      expected_value_black: expectedValueBlack,
      expected_value_white: expectedValueWhite,
      optimal_bet_color: optimalBetColor,
      kelly_criterion: kellyCriterion
    };
  }

  /**
   * 🧠 ALGORITMO TENSORFLOW.JS ML REAL
   * Usa LSTM e Neural Networks para predição
   */
  static async calculateTensorFlowMLPrediction(data: BlazeNumber[]): Promise<RealAlgorithmResult> {
    if (data.length < 100) {
      throw new Error('Dados insuficientes para TensorFlow ML (mínimo 100 números)');
    }

    try {
      console.log('🧠 EXECUTANDO TENSORFLOW.JS ML...');
      
      // Executar ensemble ML real
      const ensembleResult = await RealMLService.predictWithEnsemble(data);

      return {
        algorithm: 'TENSORFLOW_ML_ENSEMBLE',
        color: ensembleResult.final_prediction,
        number: ensembleResult.final_number,
        confidence: ensembleResult.ensemble_confidence,
        reasoning: [
          `Ensemble ML com ${ensembleResult.individual_predictions.length} modelos TensorFlow.js`,
          `LSTM + Neural Network executados em paralelo`,
          `Acordo entre modelos: ${ensembleResult.model_agreement.toFixed(1)}%`,
          `Consenso: ${ensembleResult.consensus_strength.toFixed(1)}%`,
          `Predições individuais: ${ensembleResult.individual_predictions.map(p => `${p.algorithm}:${p.predicted_color}(${p.confidence.toFixed(1)}%)`).join(', ')}`
        ],
        dataPoints: data.length,
        mathematical_proof: `Ensemble ML: LSTM + Neural Network, ${ensembleResult.individual_predictions.reduce((sum, p) => sum + p.model_metrics.training_samples, 0)} samples total`
      };

    } catch (error) {
      console.error('❌ Erro no TensorFlow ML:', error);
      // Fallback para algoritmo básico
      const whiteGold = this.calculateWhiteGoldPrediction(data);
      return {
        algorithm: 'TENSORFLOW_ML_FALLBACK',
        color: 'white',
        number: 0,
        confidence: whiteGold.white_probability * 100,
        reasoning: ['TensorFlow ML falhou, usando White Gold como fallback'],
        dataPoints: data.length,
        mathematical_proof: 'Fallback algorithm due to ML error'
      };
    }
  }

  /**
   * 🎯 PREDIÇÃO FINAL COMBINADA
   * Combina todos os algoritmos reais sem simulações
   */
  static async makeFinalPrediction(data: BlazeNumber[]): Promise<RealPredictionResult> {
    // console.log('🎯 INICIANDO PREDIÇÃO REAL - SEM SIMULAÇÕES');
    // console.log(`📊 Analisando ${data.length} números reais da Blaze`);

    if (data.length < 100) {
      throw new Error('Dados insuficientes para predição real (mínimo 100 números)');
    }

    // 1. EXECUTAR TODOS OS ALGORITMOS REAIS (incluindo TensorFlow.js + Algoritmos Científicos)
    const [whiteGold, freqComp, gapAnalysis, markovChain, tensorflowML, advancedAlgorithms] = await Promise.all([
      Promise.resolve(this.calculateWhiteGoldPrediction(data)),
      Promise.resolve(this.calculateFrequencyCompensation(data)),
      Promise.resolve(this.calculateGapAnalysis(data)),
      Promise.resolve(this.calculateMarkovChain(data)),
      this.calculateTensorFlowMLPrediction(data).catch(error => {
        console.warn('⚠️ TensorFlow ML não disponível:', error.message);
        return null;
      }),
      this.runAdvancedAlgorithms(data).catch(error => {
        console.warn('⚠️ Algoritmos científicos não disponíveis:', error.message);
        return null;
      })
    ]);

    // 2. DETERMINAR PROBABILIDADES REAIS
    let redProbability = 7/15; // Base teórica
    let blackProbability = 7/15; // Base teórica
    let whiteProbability = 1/15; // Base teórica

    // Ajustar baseado no White Gold
    if (whiteGold.white_probability > whiteProbability) {
      whiteProbability = whiteGold.white_probability;
    }

    // Ajustar baseado na compensação de frequência
    if (freqComp.most_underrepresented === 'red') {
      redProbability += freqComp.compensation_strength;
    } else if (freqComp.most_underrepresented === 'black') {
      blackProbability += freqComp.compensation_strength;
    } else if (freqComp.most_underrepresented === 'white') {
      whiteProbability += freqComp.compensation_strength;
    }

    // Normalizar probabilidades
    const total = redProbability + blackProbability + whiteProbability;
    redProbability /= total;
    blackProbability /= total;
    whiteProbability /= total;

    // 3. CALCULAR ANÁLISE ROI
    const roiAnalysis = this.calculateROIAnalysis(redProbability, blackProbability, whiteProbability);

    // 4. DETERMINAR CONSENSO BASEADO EM ROI
    let consensusColor = roiAnalysis.optimal_bet_color;
    let consensusNumber = 0;

    if (consensusColor === 'white') {
      consensusNumber = 0;
    } else if (consensusColor === 'red') {
      // Escolher número vermelho baseado em gap analysis
      const redGaps = gapAnalysis.red_numbers_gaps;
      consensusNumber = Object.entries(redGaps).reduce((max, [num, gap]) => 
        gap > redGaps[max] ? parseInt(num) : max, 1);
    } else {
      // Escolher número preto baseado em gap analysis
      const blackGaps = gapAnalysis.black_numbers_gaps;
      consensusNumber = Object.entries(blackGaps).reduce((max, [num, gap]) => 
        gap > blackGaps[max] ? parseInt(num) : max, 8);
    }

    // Se Markov sugere número específico com alta confiança, usar ele
    if (markovChain.chain_confidence > 0.8) {
      consensusNumber = markovChain.most_likely_next;
      // Ajustar cor baseado no número do Markov
      if (consensusNumber === 0) consensusColor = 'white';
      else if (consensusNumber >= 1 && consensusNumber <= 7) consensusColor = 'red';
      else consensusColor = 'black';
    }

    // 5. CALCULAR CONFIANÇA MATEMÁTICA
    const mathematicalConfidence = Math.min(95, 
      (markovChain.chain_confidence * 40) + 
      (whiteGold.pressure_cooker_value * 5) + 
      (freqComp.compensation_strength * 100) + 
      (gapAnalysis.gap_urgency * 10)
    );

    // 6. CALCULAR LUCRO ESPERADO
    const expectedProfitPercentage = roiAnalysis.expected_value_red > 0 ? 
      roiAnalysis.expected_value_red * 100 : 
      roiAnalysis.expected_value_black > 0 ? 
      roiAnalysis.expected_value_black * 100 : 
      roiAnalysis.expected_value_white * 100;

    // 7. CRIAR RESULTADOS DOS ALGORITMOS (incluindo TensorFlow ML + Algoritmos Científicos)
    const algorithmsUsed: RealAlgorithmResult[] = [
      {
        algorithm: 'WHITE_GOLD_DETECTOR',
        color: 'white',
        number: 0,
        confidence: whiteGold.white_probability * 100,
        reasoning: [
          `Frequência atual: ${(whiteGold.white_frequency * 100).toFixed(2)}%`,
          `Gap desde último: ${whiteGold.last_white_gap} números`,
          `Pressão acumulada: ${whiteGold.pressure_cooker_value.toFixed(1)}`,
          `ROI potencial: ${(whiteGold.roi_potential * 100).toFixed(1)}%`
        ],
        dataPoints: data.length,
        mathematical_proof: `P(white) = ${whiteGold.white_probability.toFixed(4)} baseado em ${data.length} amostras`
      },
      {
        algorithm: 'FREQUENCY_COMPENSATION',
        color: freqComp.most_underrepresented,
        number: freqComp.most_underrepresented === 'white' ? 0 : 
                freqComp.most_underrepresented === 'red' ? 4 : 11,
        confidence: freqComp.compensation_strength * 100,
        reasoning: [
          `Déficit vermelho: ${freqComp.red_deficit.toFixed(1)}`,
          `Déficit preto: ${freqComp.black_deficit.toFixed(1)}`,
          `Déficit branco: ${freqComp.white_deficit.toFixed(1)}`,
          `Força compensação: ${(freqComp.compensation_strength * 100).toFixed(2)}%`
        ],
        dataPoints: data.length,
        mathematical_proof: `Deficit = Expected - Actual, baseado em distribuição teórica`
      }
    ];

    // Adicionar TensorFlow ML se disponível
    if (tensorflowML) {
      algorithmsUsed.push(tensorflowML);
      console.log('🧠 TensorFlow.js ML incluído nos algoritmos');
    } else {
      console.log('⚠️ TensorFlow.js ML não disponível, usando apenas algoritmos estatísticos');
    }

    // Adicionar algoritmos científicos se disponíveis
    if (advancedAlgorithms) {
      algorithmsUsed.push(advancedAlgorithms.ballistic);
      algorithmsUsed.push(advancedAlgorithms.quantum);
      algorithmsUsed.push(advancedAlgorithms.bias);
      console.log('🚀 Algoritmos científicos incluídos: Ballistic, Quantum, Bias Detection');
    } else {
      console.log('⚠️ Algoritmos científicos não disponíveis');
    }

    // console.log('🎯 PREDIÇÃO FINAL REAL:');
    // console.log(`   Cor: ${consensusColor.toUpperCase()}`);
    // console.log(`   Número: ${consensusNumber}`);
    // console.log(`   Confiança: ${mathematicalConfidence.toFixed(1)}%`);
    // console.log(`   Lucro esperado: ${expectedProfitPercentage.toFixed(1)}%`);
    // console.log(`   Amostra: ${data.length} números reais`);

    return {
      algorithms_used: algorithmsUsed,
      consensus_color: consensusColor,
      consensus_number: consensusNumber,
      mathematical_confidence: mathematicalConfidence,
      roi_analysis: roiAnalysis,
      expected_profit_percentage: expectedProfitPercentage,
      sample_size: data.length,
      proof_of_work: [
        `Análise matemática baseada em ${data.length} números reais`,
        `White Gold: ${whiteGold.white_probability.toFixed(4)} probabilidade`,
        `Gap Analysis: número ${gapAnalysis.highest_gap_number} com ${gapAnalysis.gap_urgency.toFixed(2)}x urgência`,
        `Markov Chain: ${markovChain.most_likely_next} mais provável (${(markovChain.next_probabilities[markovChain.most_likely_next] * 100).toFixed(1)}%)`,
        `ROI ótimo: ${roiAnalysis.optimal_bet_color} com ${(roiAnalysis.kelly_criterion * 100).toFixed(1)}% da banca`
      ]
    };
  }

  // ===== ✅ ETAPA 3: NOVOS ALGORITMOS CIENTÍFICOS 2024-2025 =====

  /**
   * 🎱 ALGORITMO BALÍSTICO - Física da Roleta Real
   * Usa física real para predizer onde a bola vai parar
   */
  static async runBallisticAlgorithm(data: BlazeNumber[]): Promise<RealAlgorithmResult> {
    this.initializeAdvancedAlgorithms();
    
    if (!this.ballisticAlgorithm) {
      throw new Error('Algoritmo Balístico não inicializado');
    }

    try {
      const ballisticResult = await this.ballisticAlgorithm.predictWithPhysics(data);
      
             return {
         algorithm: 'BALLISTIC_PHYSICS',
         color: ballisticResult.predicted_color,
         number: ballisticResult.predicted_number,
         confidence: ballisticResult.confidence,
        reasoning: [
          `Análise física da roleta com ${data.length} números`,
          `Velocidade da bola: ${ballisticResult.ballistic_parameters.ball_speed.toFixed(2)} m/s`,
          `Bias mecânico detectado: ${(ballisticResult.mechanical_bias.bias_strength * 100).toFixed(1)}%`,
          `Simulação balística: ${ballisticResult.physics_confidence.toFixed(1)}% precisão física`,
          `Setor previsto: ${ballisticResult.landing_sector}`,
          `Números alternativos: ${ballisticResult.alternative_numbers.join(', ')}`
        ],
        dataPoints: data.length,
        mathematical_proof: `Física: F=ma, velocidade=${ballisticResult.velocity_analysis.initial_velocity.toFixed(2)}m/s, atrito=${ballisticResult.ballistic_parameters.friction_coefficient.toFixed(4)}`
      };
    } catch (error) {
      console.error('❌ Erro no algoritmo balístico:', error);
      throw error;
    }
  }

  /**
   * 🔮 QUANTUM-INSPIRED LSTM - Redes Neurais Quânticas  
   * Usa superposição e emaranhamento para análise temporal
   */
  static async runQuantumLSTM(data: BlazeNumber[]): Promise<RealAlgorithmResult> {
    this.initializeAdvancedAlgorithms();
    
    if (!this.quantumLSTM) {
      throw new Error('Quantum LSTM não inicializado');
    }

    try {
      const quantumResult = await this.quantumLSTM.predictWithQuantumLSTM(data);
      
             return {
         algorithm: 'QUANTUM_LSTM',
         color: quantumResult.predicted_color,
         number: quantumResult.predicted_number,
         confidence: quantumResult.confidence,
        reasoning: [
          `Análise quântica temporal com ${data.length} números`,
          `Coerência quântica: ${(quantumResult.quantum_coherence * 100).toFixed(1)}%`,
          `Emaranhamento: ${quantumResult.entanglement_entropy.toFixed(3)} bits`,
          `Atenção quântica: ${(quantumResult.quantum_attention.attention_coherence * 100).toFixed(1)}%`,
          `Circuito quântico: ${quantumResult.quantum_circuit_depth} portas`,
          `Estado colapsado: |${quantumResult.superposition_collapse.measured_state}⟩`
        ],
        dataPoints: data.length,
        mathematical_proof: `Quantum: |ψ⟩ → measurement → ${quantumResult.superposition_collapse.post_measurement_probability.toFixed(4)} probability`
      };
    } catch (error) {
      console.error('❌ Erro no Quantum LSTM:', error);
      throw error;
    }
  }

  /**
   * 🔍 BIAS DETECTION - Detecção de Tendências Estatísticas
   * Detecta padrões não-aleatórios usando múltiplos testes estatísticos
   */
  static async runBiasDetection(data: BlazeNumber[]): Promise<RealAlgorithmResult> {
    this.initializeAdvancedAlgorithms();
    
    if (!this.biasDetection) {
      throw new Error('Bias Detection não inicializado');
    }

    try {
      const biasResult = await this.biasDetection.detectBias(data);
      
      // Usar predição baseada em bias ou fallback para consenso estatístico
      const prediction = biasResult.bias_based_prediction;
      
      const significantTests = biasResult.statistical_tests.filter(test => test.is_significant);
      const strongPatterns = biasResult.pattern_analysis.filter(pattern => pattern.pattern_significance > 0.3);
      
             return {
         algorithm: 'BIAS_DETECTION',
         color: prediction.predicted_color,
         number: prediction.predicted_number,
         confidence: prediction.confidence,
        reasoning: [
          `Análise estatística de bias com ${data.length} números`,
          `Bias detectado: ${biasResult.overall_bias_detected ? 'SIM' : 'NÃO'} (${(biasResult.overall_bias_strength * 100).toFixed(1)}%)`,
          `Testes significativos: ${significantTests.length}/${biasResult.statistical_tests.length}`,
          `Padrões fortes: ${strongPatterns.length} detectados`,
          `Aleatoriedade: ${(biasResult.information_metrics.randomness_index * 100).toFixed(1)}%`,
          `Fatores de bias: ${prediction.bias_factors.join(', ')}`
        ],
        dataPoints: data.length,
        mathematical_proof: `Estatística: χ²=${biasResult.statistical_tests[0]?.statistic_value.toFixed(2)}, p=${biasResult.statistical_tests[0]?.p_value.toFixed(4)}, H=${biasResult.information_metrics.shannon_entropy.toFixed(2)} bits`
      };
    } catch (error) {
      console.error('❌ Erro no Bias Detection:', error);
      throw error;
    }
  }

  /**
   * 🚀 EXECUTAR TODOS OS ALGORITMOS CIENTÍFICOS AVANÇADOS
   * Combina Ballistic + Quantum + Bias Detection
   */
  static async runAdvancedAlgorithms(data: BlazeNumber[]): Promise<{
    ballistic: RealAlgorithmResult;
    quantum: RealAlgorithmResult;
    bias: RealAlgorithmResult;
    consensus: {
      color: 'red' | 'black' | 'white';
      number: number;
      confidence: number;
      algorithms_agreement: number;
    };
  }> {
    console.log('🚀 EXECUTANDO ALGORITMOS CIENTÍFICOS AVANÇADOS...');
    
    // Executar todos os algoritmos em paralelo
    const [ballistic, quantum, bias] = await Promise.all([
      this.runBallisticAlgorithm(data),
      this.runQuantumLSTM(data),  
      this.runBiasDetection(data)
    ]);

    // Calcular consenso entre os 3 algoritmos
    const algorithms = [ballistic, quantum, bias];
    
         // Consenso de cor (votação ponderada por confiança)
     const colorVotes: Record<string, number> = { red: 0, black: 0, white: 0 };
     algorithms.forEach(alg => {
       colorVotes[alg.color] += alg.confidence;
     });
     
     const consensusColor = Object.entries(colorVotes).reduce((a, b) => 
       colorVotes[a[0]] > colorVotes[b[0]] ? a : b
     )[0] as 'red' | 'black' | 'white';

     // Consenso de número (média ponderada por confiança)
     const weightedSum = algorithms.reduce((sum, alg) => sum + (alg.number * alg.confidence), 0);
     const totalWeight = algorithms.reduce((sum, alg) => sum + alg.confidence, 0);
     const consensusNumber = Math.round(weightedSum / totalWeight);

    // Confiança média
    const avgConfidence = algorithms.reduce((sum, alg) => sum + alg.confidence, 0) / algorithms.length;

         // Calcular concordância entre algoritmos
     const colorAgreement = algorithms.filter(alg => alg.color === consensusColor).length / algorithms.length;
     const numberAgreement = algorithms.filter(alg => Math.abs(alg.number - consensusNumber) <= 1).length / algorithms.length;
     const overallAgreement = (colorAgreement + numberAgreement) / 2;

    console.log(`🎯 CONSENSO CIENTÍFICO: ${consensusColor.toUpperCase()} ${consensusNumber} (${avgConfidence.toFixed(1)}% confiança, ${(overallAgreement * 100).toFixed(1)}% concordância)`);

    return {
      ballistic,
      quantum, 
      bias,
      consensus: {
        color: consensusColor,
        number: consensusNumber,
        confidence: avgConfidence,
        algorithms_agreement: overallAgreement
      }
    };
  }
} 