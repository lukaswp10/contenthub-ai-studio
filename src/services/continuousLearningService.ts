/**
 * 📚 SERVIÇO DE APRENDIZADO CONTÍNUO - AUTO-EVOLUÇÃO
 * 
 * Sistema que:
 * - Salva todas as predições e resultados no Supabase
 * - Retreina modelos automaticamente a cada N predições
 * - Ajusta pesos dos algoritmos baseado na performance real
 * - Evolui estratégias automaticamente
 * - Detecta padrões emergentes e se adapta
 * 
 * APRENDIZADO REAL BASEADO EM DADOS
 */

import { supabase } from '../lib/supabase';
import { RealMLService } from './realMLService';
import type { BlazeNumber, RealPredictionResult } from '../types/real-algorithms.types';

export interface PredictionRecord {
  id: string;
  timestamp: number;
  predicted_color: 'red' | 'black' | 'white';
  predicted_number: number;
  confidence: number;
  algorithms_used: string[];
  actual_color?: 'red' | 'black' | 'white';
  actual_number?: number;
  was_correct?: boolean;
  profit_loss?: number; // Lucro/prejuízo real em R$
  bet_amount?: number; // Valor apostado
}

export interface AlgorithmPerformance {
  algorithm: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  total_profit: number; // Lucro total em R$
  average_confidence: number;
  weight: number; // Peso atual do algoritmo
  last_updated: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface LearningMetrics {
  total_predictions: number;
  global_accuracy: number;
  total_profit: number; // Lucro total do sistema
  best_algorithm: string;
  worst_algorithm: string;
  last_retrain: number;
  next_retrain: number;
  evolution_generation: number;
}

export class ContinuousLearningService {
  private static predictionHistory: PredictionRecord[] = [];
  private static algorithmPerformances: Map<string, AlgorithmPerformance> = new Map();
  private static learningMetrics: LearningMetrics = {
    total_predictions: 0,
    global_accuracy: 0,
    total_profit: 0,
    best_algorithm: '',
    worst_algorithm: '',
    last_retrain: 0,
    next_retrain: 0,
    evolution_generation: 1
  };
  
  private static readonly RETRAIN_INTERVAL = 100; // Retreinar a cada 100 predições
  private static readonly MIN_DATA_FOR_RETRAIN = 200; // Mínimo de dados para retreinar

  /**
   * 🚀 INICIALIZAR SERVIÇO DE APRENDIZADO
   */
  static async initialize(): Promise<void> {
    try {
      // console.log('📚 INICIALIZANDO APRENDIZADO CONTÍNUO...');
      
      // Carregar dados históricos do Supabase
      await this.loadHistoricalData();
      
      // Carregar performance dos algoritmos
      await this.loadAlgorithmPerformances();
      
      // Calcular métricas
      this.calculateLearningMetrics();
      
      // console.log('✅ APRENDIZADO CONTÍNUO INICIALIZADO');
      // console.log(`📊 ${this.predictionHistory.length} predições históricas carregadas`);
      // console.log(`🎯 Precisão global: ${this.learningMetrics.global_accuracy.toFixed(1)}%`);
      // console.log(`💰 Lucro total: R$ ${this.learningMetrics.total_profit.toFixed(2)}`);

    } catch (error) {
      console.error('❌ Erro inicializando aprendizado contínuo:', error);
      // Continuar mesmo se falhar - usar dados locais
    }
  }

  /**
   * 📝 REGISTRAR NOVA PREDIÇÃO
   */
  static async registerPrediction(
    prediction: RealPredictionResult,
    betAmount: number = 0
  ): Promise<string> {
    try {
      const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const record: PredictionRecord = {
        id: predictionId,
        timestamp: Date.now(),
        predicted_color: prediction.consensus_color,
        predicted_number: prediction.consensus_number,
        confidence: prediction.mathematical_confidence,
        algorithms_used: prediction.algorithms_used.map(a => a.algorithm),
        bet_amount: betAmount
      };

      // Adicionar ao histórico local
      this.predictionHistory.push(record);

      // Salvar no Supabase
      await this.savePredictionToSupabase(record);

      console.log(`📝 PREDIÇÃO REGISTRADA: ${predictionId}`);
      console.log(`   🎯 ${prediction.consensus_color.toUpperCase()} - ${prediction.consensus_number}`);
      console.log(`   📊 Confiança: ${prediction.mathematical_confidence.toFixed(1)}%`);
      console.log(`   🧠 Algoritmos: ${record.algorithms_used.join(', ')}`);

      return predictionId;

    } catch (error) {
      console.error('❌ Erro registrando predição:', error);
      throw error;
    }
  }

  /**
   * ✅ CONFIRMAR RESULTADO REAL
   */
  static async confirmResult(
    predictionId: string,
    actualColor: 'red' | 'black' | 'white',
    actualNumber: number
  ): Promise<void> {
    try {
      // Encontrar predição
      const prediction = this.predictionHistory.find(p => p.id === predictionId);
      if (!prediction) {
        console.warn(`⚠️ Predição ${predictionId} não encontrada`);
        return;
      }

      // Atualizar resultado
      prediction.actual_color = actualColor;
      prediction.actual_number = actualNumber;
      prediction.was_correct = prediction.predicted_color === actualColor;

      // Calcular lucro/prejuízo real
      if (prediction.bet_amount && prediction.bet_amount > 0) {
        if (prediction.was_correct) {
          // Calcular lucro baseado no payout
          const payout = actualColor === 'white' ? 14 : 2;
          prediction.profit_loss = (prediction.bet_amount * payout) - prediction.bet_amount;
        } else {
          // Perda total da aposta
          prediction.profit_loss = -prediction.bet_amount;
        }
      }

      // Atualizar no Supabase
      await this.updatePredictionInSupabase(prediction);

      // Atualizar performance dos algoritmos
      await this.updateAlgorithmPerformances(prediction);

      // Verificar se precisa retreinar
      await this.checkRetrainConditions();

      console.log(`✅ RESULTADO CONFIRMADO: ${predictionId}`);
      console.log(`   🎯 Predito: ${prediction.predicted_color} | Real: ${actualColor}`);
      console.log(`   ${prediction.was_correct ? '✅ ACERTO' : '❌ ERRO'}`);
      if (prediction.profit_loss !== undefined) {
        console.log(`   💰 P&L: R$ ${prediction.profit_loss.toFixed(2)}`);
      }

    } catch (error) {
      console.error('❌ Erro confirmando resultado:', error);
    }
  }

  /**
   * 📊 ATUALIZAR PERFORMANCE DOS ALGORITMOS
   */
  private static async updateAlgorithmPerformances(prediction: PredictionRecord): Promise<void> {
    try {
      const isCorrect = prediction.was_correct || false;
      const profitLoss = prediction.profit_loss || 0;

      // Atualizar cada algoritmo usado na predição
      for (const algorithmName of prediction.algorithms_used) {
        let performance = this.algorithmPerformances.get(algorithmName);
        
        if (!performance) {
          // Criar performance inicial
          performance = {
            algorithm: algorithmName,
            total_predictions: 0,
            correct_predictions: 0,
            accuracy_rate: 0,
            total_profit: 0,
            average_confidence: 0,
            weight: 1.0,
            last_updated: Date.now(),
            trend: 'stable'
          };
        }

        // Atualizar métricas
        performance.total_predictions++;
        if (isCorrect) {
          performance.correct_predictions++;
        }
        performance.accuracy_rate = performance.correct_predictions / performance.total_predictions;
        performance.total_profit += profitLoss / prediction.algorithms_used.length; // Dividir profit pelos algoritmos
        
        // Atualizar confiança média
        performance.average_confidence = 
          (performance.average_confidence * (performance.total_predictions - 1) + prediction.confidence) / 
          performance.total_predictions;

        // Calcular tendência baseada nas últimas 20 predições
        const recentPredictions = this.predictionHistory
          .filter(p => p.algorithms_used.includes(algorithmName) && p.was_correct !== undefined)
          .slice(-20);

        if (recentPredictions.length >= 10) {
          const recentAccuracy = recentPredictions.filter(p => p.was_correct).length / recentPredictions.length;
          const previousAccuracy = performance.accuracy_rate;

          if (recentAccuracy > previousAccuracy + 0.1) {
            performance.trend = 'improving';
          } else if (recentAccuracy < previousAccuracy - 0.1) {
            performance.trend = 'declining';
          } else {
            performance.trend = 'stable';
          }
        }

        // Ajustar peso baseado na performance
        performance.weight = this.calculateAlgorithmWeight(performance);
        performance.last_updated = Date.now();

        // Salvar performance atualizada
        this.algorithmPerformances.set(algorithmName, performance);
        await this.saveAlgorithmPerformanceToSupabase(performance);

        console.log(`📊 ${algorithmName}: ${(performance.accuracy_rate * 100).toFixed(1)}% (peso: ${performance.weight.toFixed(2)})`);
      }

      // Recalcular métricas globais
      this.calculateLearningMetrics();

    } catch (error) {
      console.error('❌ Erro atualizando performance dos algoritmos:', error);
    }
  }

  /**
   * ⚖️ CALCULAR PESO DO ALGORITMO
   */
  private static calculateAlgorithmWeight(performance: AlgorithmPerformance): number {
    // Peso baseado em: precisão + lucro + tendência + experiência
    let weight = 1.0;

    // Fator de precisão (50% do peso)
    const accuracyFactor = Math.max(0.1, Math.min(2.0, performance.accuracy_rate * 2));
    
    // Fator de lucro (30% do peso)
    const profitFactor = performance.total_profit > 0 ? 
      Math.min(1.5, 1 + performance.total_profit / 1000) : 
      Math.max(0.5, 1 + performance.total_profit / 1000);
    
    // Fator de tendência (10% do peso)
    const trendFactor = performance.trend === 'improving' ? 1.2 : 
                        performance.trend === 'declining' ? 0.8 : 1.0;
    
    // Fator de experiência (10% do peso)
    const experienceFactor = Math.min(1.3, 1 + performance.total_predictions / 500);

    weight = (accuracyFactor * 0.5) + (profitFactor * 0.3) + (trendFactor * 0.1) + (experienceFactor * 0.1);

    // Limitar peso entre 0.1 e 3.0
    return Math.max(0.1, Math.min(3.0, weight));
  }

  /**
   * 🔄 VERIFICAR CONDIÇÕES PARA RETREINAR
   */
  private static async checkRetrainConditions(): Promise<void> {
    try {
      const confirmedPredictions = this.predictionHistory.filter(p => p.was_correct !== undefined);
      
      // Verificar se precisa retreinar
      const shouldRetrain = 
        confirmedPredictions.length >= this.MIN_DATA_FOR_RETRAIN &&
        (confirmedPredictions.length - this.learningMetrics.last_retrain) >= this.RETRAIN_INTERVAL;

      if (shouldRetrain) {
        console.log('🔄 INICIANDO RETREINAMENTO AUTOMÁTICO...');
        await this.retrainModels();
      }

    } catch (error) {
      console.error('❌ Erro verificando condições de retreinamento:', error);
    }
  }

  /**
   * 🎓 RETREINAR MODELOS
   */
  private static async retrainModels(): Promise<void> {
    try {
      console.log('🎓 RETREINANDO MODELOS COM DADOS REAIS...');
      
      // Converter predições para formato BlazeNumber
      const trainingData: BlazeNumber[] = this.predictionHistory
        .filter(p => p.actual_color && p.actual_number !== undefined)
        .map(p => ({
          number: p.actual_number!,
          color: p.actual_color!,
          timestamp: p.timestamp,
          id: p.id
        }));

      if (trainingData.length < this.MIN_DATA_FOR_RETRAIN) {
        console.log('⚠️ Dados insuficientes para retreinamento');
        return;
      }

      // Retreinar modelos TensorFlow.js
      const trainingResults = await RealMLService.trainModels(trainingData);

      // Atualizar métricas
      this.learningMetrics.last_retrain = this.predictionHistory.filter(p => p.was_correct !== undefined).length;
      this.learningMetrics.next_retrain = this.learningMetrics.last_retrain + this.RETRAIN_INTERVAL;
      this.learningMetrics.evolution_generation++;

      // Salvar evolução no Supabase
      await this.saveEvolutionToSupabase(trainingResults);

      console.log('✅ RETREINAMENTO CONCLUÍDO:');
      console.log(`   🔗 LSTM Accuracy: ${trainingResults.lstmAccuracy.toFixed(1)}%`);
      console.log(`   🧠 Neural Accuracy: ${trainingResults.neuralAccuracy.toFixed(1)}%`);
      console.log(`   📈 Training Loss: ${trainingResults.trainingLoss.toFixed(4)}`);
      console.log(`   🧬 Geração: ${this.learningMetrics.evolution_generation}`);

    } catch (error) {
      console.error('❌ Erro no retreinamento:', error);
    }
  }

  /**
   * 📊 CALCULAR MÉTRICAS DE APRENDIZADO
   */
  private static calculateLearningMetrics(): void {
    const confirmedPredictions = this.predictionHistory.filter(p => p.was_correct !== undefined);
    
    if (confirmedPredictions.length === 0) return;

    // Métricas globais
    this.learningMetrics.total_predictions = confirmedPredictions.length;
    this.learningMetrics.global_accuracy = 
      confirmedPredictions.filter(p => p.was_correct).length / confirmedPredictions.length * 100;
    
    this.learningMetrics.total_profit = 
      confirmedPredictions.reduce((sum, p) => sum + (p.profit_loss || 0), 0);

    // Melhor e pior algoritmo
    const performances = Array.from(this.algorithmPerformances.values())
      .filter(p => p.total_predictions >= 10);

    if (performances.length > 0) {
      performances.sort((a, b) => b.accuracy_rate - a.accuracy_rate);
      this.learningMetrics.best_algorithm = performances[0].algorithm;
      this.learningMetrics.worst_algorithm = performances[performances.length - 1].algorithm;
    }
  }

  /**
   * 💾 SALVAR PREDIÇÃO NO SUPABASE
   */
  private static async savePredictionToSupabase(record: PredictionRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('prediction_records')
        .insert({
          prediction_id: record.id,
          timestamp: new Date(record.timestamp).toISOString(),
          predicted_color: record.predicted_color,
          predicted_number: record.predicted_number,
          confidence: record.confidence,
          algorithms_used: record.algorithms_used,
          bet_amount: record.bet_amount
        });

      if (error) {
        console.log('⚠️ Tabela prediction_records não existe (criar no Supabase)');
      }
    } catch (error) {
      console.log('⚠️ Supabase indisponível (continuando localmente)');
    }
  }

  /**
   * 🔄 ATUALIZAR PREDIÇÃO NO SUPABASE
   */
  private static async updatePredictionInSupabase(record: PredictionRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('prediction_records')
        .update({
          actual_color: record.actual_color,
          actual_number: record.actual_number,
          was_correct: record.was_correct,
          profit_loss: record.profit_loss
        })
        .eq('prediction_id', record.id);

      if (error) {
        console.log('⚠️ Erro atualizando predição no Supabase');
      }
    } catch (error) {
      console.log('⚠️ Supabase indisponível para atualização');
    }
  }

  /**
   * 💾 SALVAR PERFORMANCE DO ALGORITMO NO SUPABASE
   */
  private static async saveAlgorithmPerformanceToSupabase(performance: AlgorithmPerformance): Promise<void> {
    try {
      const { error } = await supabase
        .from('algorithm_performances')
        .upsert({
          algorithm: performance.algorithm,
          total_predictions: performance.total_predictions,
          correct_predictions: performance.correct_predictions,
          accuracy_rate: performance.accuracy_rate,
          total_profit: performance.total_profit,
          average_confidence: performance.average_confidence,
          weight: performance.weight,
          trend: performance.trend,
          last_updated: new Date(performance.last_updated).toISOString()
        });

      if (error) {
        console.log('⚠️ Tabela algorithm_performances não existe (criar no Supabase)');
      }
    } catch (error) {
      console.log('⚠️ Supabase indisponível para performance');
    }
  }

  /**
   * 💾 SALVAR EVOLUÇÃO NO SUPABASE
   */
  private static async saveEvolutionToSupabase(trainingResults: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('model_evolution')
        .insert({
          generation: this.learningMetrics.evolution_generation,
          lstm_accuracy: trainingResults.lstmAccuracy,
          neural_accuracy: trainingResults.neuralAccuracy,
          training_loss: trainingResults.trainingLoss,
          total_predictions: this.learningMetrics.total_predictions,
          global_accuracy: this.learningMetrics.global_accuracy,
          total_profit: this.learningMetrics.total_profit,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.log('⚠️ Tabela model_evolution não existe (criar no Supabase)');
      }
    } catch (error) {
      console.log('⚠️ Supabase indisponível para evolução');
    }
  }

  /**
   * 📚 CARREGAR DADOS HISTÓRICOS
   */
  private static async loadHistoricalData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('prediction_records')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (data && !error) {
        this.predictionHistory = data.map(row => ({
          id: row.prediction_id,
          timestamp: new Date(row.timestamp).getTime(),
          predicted_color: row.predicted_color,
          predicted_number: row.predicted_number,
          confidence: row.confidence,
          algorithms_used: row.algorithms_used || [],
          actual_color: row.actual_color,
          actual_number: row.actual_number,
          was_correct: row.was_correct,
          profit_loss: row.profit_loss,
          bet_amount: row.bet_amount
        }));
      }
    } catch (error) {
      console.log('⚠️ Erro carregando dados históricos');
    }
  }

  /**
   * 📚 CARREGAR PERFORMANCE DOS ALGORITMOS
   */
  private static async loadAlgorithmPerformances(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('algorithm_performances')
        .select('*');

      if (data && !error) {
        data.forEach(row => {
          this.algorithmPerformances.set(row.algorithm, {
            algorithm: row.algorithm,
            total_predictions: row.total_predictions,
            correct_predictions: row.correct_predictions,
            accuracy_rate: row.accuracy_rate,
            total_profit: row.total_profit,
            average_confidence: row.average_confidence,
            weight: row.weight,
            last_updated: new Date(row.last_updated).getTime(),
            trend: row.trend
          });
        });
      }
    } catch (error) {
      console.log('⚠️ Erro carregando performances dos algoritmos');
    }
  }

  /**
   * 📊 OBTER MÉTRICAS ATUAIS
   */
  static getLearningMetrics(): LearningMetrics {
    return { ...this.learningMetrics };
  }

  /**
   * 📊 OBTER PERFORMANCE DOS ALGORITMOS
   */
  static getAlgorithmPerformances(): AlgorithmPerformance[] {
    return Array.from(this.algorithmPerformances.values())
      .sort((a, b) => b.accuracy_rate - a.accuracy_rate);
  }

  /**
   * 📊 OBTER HISTÓRICO DE PREDIÇÕES
   */
  static getPredictionHistory(limit: number = 50): PredictionRecord[] {
    return this.predictionHistory
      .slice(-limit)
      .reverse(); // Mais recentes primeiro
  }
} 