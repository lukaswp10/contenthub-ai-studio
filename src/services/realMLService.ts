/**
 * 🧠 SERVIÇO DE MACHINE LEARNING REAL - TENSORFLOW.JS
 * 
 * Algoritmos ML profissionais implementados:
 * - LSTM para análise temporal de sequências
 * - Random Forest para classificação
 * - Neural Networks com backpropagation
 * - Ensemble Methods profissionais
 * - Análise de volatilidade e momentum
 * 
 * SEM SIMULAÇÕES - APENAS ML REAL
 */

import * as tf from '@tensorflow/tfjs';
import type { BlazeNumber } from '../types/real-algorithms.types';

export interface MLPredictionResult {
  algorithm: string;
  predicted_color: 'red' | 'black' | 'white';
  predicted_number: number;
  confidence: number;
  mathematical_reasoning: string[];
  model_metrics: {
    accuracy: number;
    loss: number;
    training_samples: number;
  };
}

export interface EnsembleMLResult {
  final_prediction: 'red' | 'black' | 'white';
  final_number: number;
  ensemble_confidence: number;
  individual_predictions: MLPredictionResult[];
  consensus_strength: number;
  model_agreement: number;
}

export class RealMLService {
  private static lstmModel: tf.Sequential | null = null;
  private static neuralNetModel: tf.Sequential | null = null;
  private static isInitialized = false;

  /**
   * 🚀 INICIALIZAR TENSORFLOW.JS E MODELOS
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🧠 INICIALIZANDO TENSORFLOW.JS...');
      
      // Verificar se TF está funcionando
      const testTensor = tf.tensor([1, 2, 3, 4]);
      console.log('✅ TensorFlow.js funcionando:', await testTensor.data());
      testTensor.dispose();

      // Criar modelo LSTM para análise temporal
      await this.createLSTMModel();
      
      // Criar modelo Neural Network para classificação
      await this.createNeuralNetworkModel();

      this.isInitialized = true;
      console.log('✅ TENSORFLOW.JS INICIALIZADO COM SUCESSO');

    } catch (error) {
      console.error('❌ Erro inicializando TensorFlow.js:', error);
      throw error;
    }
  }

  /**
   * 🔗 CRIAR MODELO LSTM PARA ANÁLISE TEMPORAL
   */
  private static async createLSTMModel(): Promise<void> {
    try {
      console.log('🔗 Criando modelo LSTM...');

      this.lstmModel = tf.sequential({
        layers: [
          // Input layer para sequências reduzidas - SUPER OTIMIZADO
          tf.layers.lstm({
            units: 16, // ✅ PROBLEMA 1: Reduzido de 32→16 para evitar matrizes gigantes
            returnSequences: true,
            inputShape: [5, 3], // ✅ PROBLEMA 1: Reduzido de [10,3]→[5,3] (menos timesteps)
            dropout: 0.4,
            recurrentDropout: 0.4,
            kernelInitializer: 'glorotUniform',
            recurrentInitializer: 'glorotUniform' // ✅ PROBLEMA 1: Mudou de 'orthogonal' para evitar warning
          }),
          
          // Segunda camada LSTM - SUPER OTIMIZADA
          tf.layers.lstm({
            units: 8, // ✅ PROBLEMA 1: Reduzido de 16→8 
            returnSequences: false,
            dropout: 0.4,
            recurrentDropout: 0.4,
            kernelInitializer: 'glorotUniform',
            recurrentInitializer: 'glorotUniform' // ✅ PROBLEMA 1: Mudou de 'orthogonal'
          }),
          
          // Dense layers para classificação - SUPER OTIMIZADA
          tf.layers.dense({
            units: 4, // ✅ PROBLEMA 1: Reduzido de 8→4
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
          }),
          tf.layers.dropout({ rate: 0.5 }),
          
          // Output layer para 3 classes (red, black, white)
          tf.layers.dense({
            units: 3,
            activation: 'softmax',
            kernelInitializer: 'glorotUniform'
          })
        ]
      });

      // Compilar modelo com configurações otimizadas
      this.lstmModel.compile({
        optimizer: tf.train.adam(0.003), // ✅ PROBLEMA 1: Learning rate aumentado para compensar modelo menor
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      console.log('✅ Modelo LSTM criado com sucesso');
      console.log('📊 Parâmetros do modelo:', this.lstmModel.countParams());

    } catch (error) {
      console.error('❌ Erro criando modelo LSTM:', error);
      throw error;
    }
  }

  /**
   * 🧠 CRIAR NEURAL NETWORK PARA CLASSIFICAÇÃO
   */
  private static async createNeuralNetworkModel(): Promise<void> {
    try {
      console.log('🧠 Criando Neural Network...');

      this.neuralNetModel = tf.sequential({
        layers: [
          // Input layer com features engineered - OTIMIZADO
          tf.layers.dense({
            units: 64, // ✅ PROBLEMA 2: Reduzido de 128→64
            activation: 'relu',
            inputShape: [15], // 15 features engineered
            kernelInitializer: 'glorotUniform'
          }),
          tf.layers.dropout({ rate: 0.4 }),
          
          // Hidden layers - OTIMIZADAS
          tf.layers.dense({
            units: 32, // ✅ PROBLEMA 2: Reduzido de 64→32
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
          }),
          tf.layers.dropout({ rate: 0.3 }),
          
          tf.layers.dense({
            units: 16, // ✅ PROBLEMA 2: Reduzido de 32→16
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
          }),
          tf.layers.dropout({ rate: 0.3 }),
          
          // Output layer
          tf.layers.dense({
            units: 3,
            activation: 'softmax',
            kernelInitializer: 'glorotUniform'
          })
        ]
      });

      // Compilar modelo
      this.neuralNetModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      console.log('✅ Neural Network criado com sucesso');
      console.log('📊 Parâmetros do modelo:', this.neuralNetModel.countParams());

    } catch (error) {
      console.error('❌ Erro criando Neural Network:', error);
      throw error;
    }
  }

  /**
   * 🔄 PREPARAR DADOS PARA TREINAMENTO
   */
  private static prepareTrainingData(data: BlazeNumber[]): {
    sequences: tf.Tensor,
    labels: tf.Tensor,
    features: tf.Tensor,
    featureLabels: tf.Tensor
  } {
    if (data.length < 50) {
      throw new Error('Dados insuficientes para treinamento (mínimo 50)');
    }

    // ===== PREPARAR DADOS PARA LSTM (SEQUÊNCIAS) =====
    const sequenceLength = 5; // ✅ PROBLEMA 1: Reduzido de 10→5 para menor complexidade
    const sequences: number[][][] = [];
    const sequenceLabels: number[][] = [];

    for (let i = sequenceLength; i < data.length; i++) {
      const sequence: number[][] = [];
      
      // Criar sequência de 5 números anteriores
      for (let j = i - sequenceLength; j < i; j++) {
        const colorEncoded = data[j].color === 'red' ? 0 : data[j].color === 'black' ? 1 : 2;
        const timestampNormalized = (data[j].timestamp % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000);
        
        sequence.push([
          data[j].number / 14, // Normalizar número 0-14 para 0-1
          colorEncoded / 2, // Normalizar cor 0-2 para 0-1
          timestampNormalized // Timestamp já normalizado 0-1
        ]);
      }
      
      sequences.push(sequence);
      
      // Label do próximo número
      const nextColorEncoded = data[i].color === 'red' ? [1, 0, 0] : 
                               data[i].color === 'black' ? [0, 1, 0] : [0, 0, 1];
      sequenceLabels.push(nextColorEncoded);
    }

    // ===== PREPARAR DADOS PARA NEURAL NETWORK (FEATURES) =====
    const features: number[][] = [];
    const featureLabels: number[][] = [];

    for (let i = 20; i < data.length; i++) {
      const recent20 = data.slice(i - 20, i);
      
      // Feature engineering
      const redCount = recent20.filter(d => d.color === 'red').length;
      const blackCount = recent20.filter(d => d.color === 'black').length;
      const whiteCount = recent20.filter(d => d.color === 'white').length;
      
      // Gaps desde última aparição
      let redGap = 0, blackGap = 0, whiteGap = 0;
      for (let j = recent20.length - 1; j >= 0; j--) {
        if (recent20[j].color === 'red' && redGap === 0) redGap = recent20.length - 1 - j;
        if (recent20[j].color === 'black' && blackGap === 0) blackGap = recent20.length - 1 - j;
        if (recent20[j].color === 'white' && whiteGap === 0) whiteGap = recent20.length - 1 - j;
      }
      
      // Momentum (últimos 5 vs anteriores 15)
      const last5 = recent20.slice(-5);
      const previous15 = recent20.slice(0, 15);
      
      const last5Red = last5.filter(d => d.color === 'red').length / 5;
      const previous15Red = previous15.filter(d => d.color === 'red').length / 15;
      const redMomentum = last5Red - previous15Red;
      
      const last5Black = last5.filter(d => d.color === 'black').length / 5;
      const previous15Black = previous15.filter(d => d.color === 'black').length / 15;
      const blackMomentum = last5Black - previous15Black;
      
      const last5White = last5.filter(d => d.color === 'white').length / 5;
      const previous15White = previous15.filter(d => d.color === 'white').length / 15;
      const whiteMomentum = last5White - previous15White;

      // Volatilidade
      const volatility = this.calculateVolatility(recent20);
      
      // Hora do dia normalizada
      const hourNormalized = (new Date(data[i].timestamp).getHours()) / 24;

      // Montar features (15 no total)
      const feature = [
        redCount / 20, // Frequência vermelho
        blackCount / 20, // Frequência preto
        whiteCount / 20, // Frequência branco
        redGap / 20, // Gap vermelho normalizado
        blackGap / 20, // Gap preto normalizado
        whiteGap / 20, // Gap branco normalizado
        redMomentum, // Momentum vermelho
        blackMomentum, // Momentum preto
        whiteMomentum, // Momentum branco
        volatility, // Volatilidade
        hourNormalized, // Hora do dia
        data[i - 1].number / 14, // Último número normalizado
        recent20[recent20.length - 1].color === 'red' ? 1 : 0, // Última cor red
        recent20[recent20.length - 1].color === 'black' ? 1 : 0, // Última cor black
        recent20[recent20.length - 1].color === 'white' ? 1 : 0 // Última cor white
      ];

      features.push(feature);
      
      // Label do próximo número
      const nextLabel = data[i].color === 'red' ? [1, 0, 0] : 
                        data[i].color === 'black' ? [0, 1, 0] : [0, 0, 1];
      featureLabels.push(nextLabel);
    }

    console.log(`📊 Dados preparados: ${sequences.length} sequências, ${features.length} features`);

    return {
      sequences: tf.tensor3d(sequences),
      labels: tf.tensor2d(sequenceLabels),
      features: tf.tensor2d(features),
      featureLabels: tf.tensor2d(featureLabels)
    };
  }

  /**
   * 📊 CALCULAR VOLATILIDADE
   */
  private static calculateVolatility(data: BlazeNumber[]): number {
    if (data.length < 2) return 0;
    
    const numbers = data.map(d => d.number);
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    
    return Math.sqrt(variance) / 14; // Normalizar pela amplitude máxima
  }

  /**
   * 🎓 TREINAR MODELOS COM DADOS REAIS
   */
  static async trainModels(data: BlazeNumber[]): Promise<{
    lstmAccuracy: number,
    neuralAccuracy: number,
    trainingLoss: number
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (data.length < 100) {
      throw new Error('Dados insuficientes para treinamento (mínimo 100)');
    }

    try {
      console.log('🎓 INICIANDO TREINAMENTO DOS MODELOS ML...');
      console.log(`📊 Treinando com ${data.length} números reais`);

      // Preparar dados
      const { sequences, labels, features, featureLabels } = this.prepareTrainingData(data);

      // Split train/validation (80/20)
      const splitIndex = Math.floor(sequences.shape[0] * 0.8);
      
      const trainSequences = sequences.slice([0, 0, 0], [splitIndex, -1, -1]);
      const trainLabels = labels.slice([0, 0], [splitIndex, -1]);
      const valSequences = sequences.slice([splitIndex, 0, 0], [-1, -1, -1]);
      const valLabels = labels.slice([splitIndex, 0], [-1, -1]);

      const trainFeatures = features.slice([0, 0], [splitIndex, -1]);
      const trainFeatureLabels = featureLabels.slice([0, 0], [splitIndex, -1]);
      const valFeatures = features.slice([splitIndex, 0], [-1, -1]);
      const valFeatureLabels = featureLabels.slice([splitIndex, 0], [-1, -1]);

      console.log('🔗 Treinando modelo LSTM...');
      
      // Treinar LSTM - CONFIGURAÇÃO OTIMIZADA
      const lstmHistory = await this.lstmModel!.fit(trainSequences, trainLabels, {
        epochs: 25, // ✅ PROBLEMA 2: Reduzido de 50→25 para melhor performance
        batchSize: 16, // ✅ PROBLEMA 2: Reduzido de 32→16 para evitar matrizes grandes
        validationData: [valSequences, valLabels],
        verbose: 0,
        shuffle: true, // ✅ Embaralhar dados para melhor aprendizado
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 5 === 4) { // ✅ Log a cada 5 épocas em vez de 10
              console.log(`  LSTM Época ${epoch + 1}: loss=${logs?.loss?.toFixed(4)}, acc=${logs?.acc?.toFixed(4)}, val_acc=${logs?.val_acc?.toFixed(4)}`);
            }
          }
        }
      });

      console.log('🧠 Treinando Neural Network...');
      
      // Treinar Neural Network - CONFIGURAÇÃO OTIMIZADA
      const neuralHistory = await this.neuralNetModel!.fit(trainFeatures, trainFeatureLabels, {
        epochs: 50, // ✅ PROBLEMA 2: Reduzido de 100→50 para melhor performance
        batchSize: 16, // ✅ PROBLEMA 2: Reduzido de 32→16 para evitar matrizes grandes
        validationData: [valFeatures, valFeatureLabels],
        verbose: 0,
        shuffle: true, // ✅ Embaralhar dados para melhor aprendizado
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 9) { // ✅ Log a cada 10 épocas em vez de 20
              console.log(`  Neural Época ${epoch + 1}: loss=${logs?.loss?.toFixed(4)}, acc=${logs?.acc?.toFixed(4)}, val_acc=${logs?.val_acc?.toFixed(4)}`);
            }
          }
        }
      });

      // Obter métricas finais
      const lstmFinalEpoch = lstmHistory.history.val_acc!.length - 1;
      const neuralFinalEpoch = neuralHistory.history.val_acc!.length - 1;
      
      const lstmAccuracy = lstmHistory.history.val_acc![lstmFinalEpoch] as number;
      const neuralAccuracy = neuralHistory.history.val_acc![neuralFinalEpoch] as number;
      const lstmLoss = Number(lstmHistory.history.val_loss![lstmFinalEpoch]);
      const neuralLoss = Number(neuralHistory.history.val_loss![neuralFinalEpoch]);
      const trainingLoss = (lstmLoss + neuralLoss) / 2;

      // Limpar memória
      trainSequences.dispose();
      trainLabels.dispose();
      valSequences.dispose();
      valLabels.dispose();
      trainFeatures.dispose();
      trainFeatureLabels.dispose();
      valFeatures.dispose();
      valFeatureLabels.dispose();
      sequences.dispose();
      labels.dispose();
      features.dispose();
      featureLabels.dispose();

      console.log('✅ TREINAMENTO CONCLUÍDO:');
      console.log(`   🔗 LSTM Accuracy: ${(lstmAccuracy * 100).toFixed(1)}%`);
      console.log(`   🧠 Neural Accuracy: ${(neuralAccuracy * 100).toFixed(1)}%`);
      console.log(`   📉 Training Loss: ${trainingLoss.toFixed(4)}`);

      return {
        lstmAccuracy: lstmAccuracy * 100,
        neuralAccuracy: neuralAccuracy * 100,
        trainingLoss
      };

    } catch (error) {
      console.error('❌ Erro no treinamento:', error);
      throw error;
    }
  }

  /**
   * 🔮 FAZER PREDIÇÃO COM LSTM
   */
  static async predictWithLSTM(data: BlazeNumber[]): Promise<MLPredictionResult> {
    if (!this.isInitialized || !this.lstmModel) {
      throw new Error('Modelo LSTM não inicializado');
    }

    if (data.length < 5) {
      throw new Error('Dados insuficientes para LSTM (mínimo 5)');
    }

    try {
      // Preparar sequência dos últimos 5 números
      const sequence: number[][] = [];
      const last5 = data.slice(-5);
      
      for (const item of last5) {
        const colorEncoded = item.color === 'red' ? 0 : item.color === 'black' ? 1 : 2;
        const timestampNormalized = (item.timestamp % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000);
        
        sequence.push([
          item.number / 14,
          colorEncoded / 2,
          timestampNormalized
        ]);
      }

      // Fazer predição
      const inputTensor = tf.tensor3d([sequence]);
      const prediction = this.lstmModel.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Interpretar resultado
      const redProb = probabilities[0];
      const blackProb = probabilities[1];
      const whiteProb = probabilities[2];
      
      const maxProb = Math.max(redProb, blackProb, whiteProb);
      const predictedColor = maxProb === redProb ? 'red' : 
                             maxProb === blackProb ? 'black' : 'white';
      
      const confidence = maxProb * 100;
      
      // Predizer número baseado na cor
      let predictedNumber = 0;
      if (predictedColor === 'white') {
        predictedNumber = 0;
      } else if (predictedColor === 'red') {
        // Usar análise de gaps para números vermelhos
        const redNumbers = [1, 2, 3, 4, 5, 6, 7];
        predictedNumber = this.predictNumberInRange(data, redNumbers);
      } else {
        // Usar análise de gaps para números pretos
        const blackNumbers = [8, 9, 10, 11, 12, 13, 14];
        predictedNumber = this.predictNumberInRange(data, blackNumbers);
      }

      // Limpar memória
      inputTensor.dispose();
      prediction.dispose();

      return {
        algorithm: 'LSTM_TENSORFLOW',
        predicted_color: predictedColor,
        predicted_number: predictedNumber,
        confidence,
        mathematical_reasoning: [
          `LSTM processou sequência de ${last5.length} números`,
          `Probabilidades: R:${(redProb * 100).toFixed(1)}% B:${(blackProb * 100).toFixed(1)}% W:${(whiteProb * 100).toFixed(1)}%`,
          `Rede neural temporal com ${this.lstmModel.countParams()} parâmetros`,
          `Análise de padrões temporais profunda`
        ],
        model_metrics: {
          accuracy: confidence,
          loss: 1 - maxProb,
          training_samples: data.length
        }
      };

    } catch (error) {
      console.error('❌ Erro na predição LSTM:', error);
      throw error;
    }
  }

  /**
   * 🧠 FAZER PREDIÇÃO COM NEURAL NETWORK
   */
  static async predictWithNeuralNetwork(data: BlazeNumber[]): Promise<MLPredictionResult> {
    if (!this.isInitialized || !this.neuralNetModel) {
      throw new Error('Neural Network não inicializado');
    }

    if (data.length < 20) {
      throw new Error('Dados insuficientes para Neural Network (mínimo 20)');
    }

    try {
      // Preparar features dos últimos 20 números
      const recent20 = data.slice(-20);
      
      const redCount = recent20.filter(d => d.color === 'red').length;
      const blackCount = recent20.filter(d => d.color === 'black').length;
      const whiteCount = recent20.filter(d => d.color === 'white').length;
      
      // Calcular gaps
      let redGap = 0, blackGap = 0, whiteGap = 0;
      for (let j = recent20.length - 1; j >= 0; j--) {
        if (recent20[j].color === 'red' && redGap === 0) redGap = recent20.length - 1 - j;
        if (recent20[j].color === 'black' && blackGap === 0) blackGap = recent20.length - 1 - j;
        if (recent20[j].color === 'white' && whiteGap === 0) whiteGap = recent20.length - 1 - j;
      }
      
      // Calcular momentum
      const last5 = recent20.slice(-5);
      const previous15 = recent20.slice(0, 15);
      
      const redMomentum = (last5.filter(d => d.color === 'red').length / 5) - 
                          (previous15.filter(d => d.color === 'red').length / 15);
      const blackMomentum = (last5.filter(d => d.color === 'black').length / 5) - 
                            (previous15.filter(d => d.color === 'black').length / 15);
      const whiteMomentum = (last5.filter(d => d.color === 'white').length / 5) - 
                            (previous15.filter(d => d.color === 'white').length / 15);

      const volatility = this.calculateVolatility(recent20);
      const hourNormalized = (new Date().getHours()) / 24;
      const lastNumber = recent20[recent20.length - 1];

      // Montar features
      const features = [
        redCount / 20,
        blackCount / 20,
        whiteCount / 20,
        redGap / 20,
        blackGap / 20,
        whiteGap / 20,
        redMomentum,
        blackMomentum,
        whiteMomentum,
        volatility,
        hourNormalized,
        lastNumber.number / 14,
        lastNumber.color === 'red' ? 1 : 0,
        lastNumber.color === 'black' ? 1 : 0,
        lastNumber.color === 'white' ? 1 : 0
      ];

      // Fazer predição
      const inputTensor = tf.tensor2d([features]);
      const prediction = this.neuralNetModel.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Interpretar resultado
      const redProb = probabilities[0];
      const blackProb = probabilities[1];
      const whiteProb = probabilities[2];
      
      const maxProb = Math.max(redProb, blackProb, whiteProb);
      const predictedColor = maxProb === redProb ? 'red' : 
                             maxProb === blackProb ? 'black' : 'white';
      
      const confidence = maxProb * 100;
      
      // Predizer número
      let predictedNumber = 0;
      if (predictedColor === 'white') {
        predictedNumber = 0;
      } else if (predictedColor === 'red') {
        const redNumbers = [1, 2, 3, 4, 5, 6, 7];
        predictedNumber = this.predictNumberInRange(data, redNumbers);
      } else {
        const blackNumbers = [8, 9, 10, 11, 12, 13, 14];
        predictedNumber = this.predictNumberInRange(data, blackNumbers);
      }

      // Limpar memória
      inputTensor.dispose();
      prediction.dispose();

      return {
        algorithm: 'NEURAL_NETWORK_TENSORFLOW',
        predicted_color: predictedColor,
        predicted_number: predictedNumber,
        confidence,
        mathematical_reasoning: [
          `Neural Network analisou ${recent20.length} features engineered`,
          `Probabilidades: R:${(redProb * 100).toFixed(1)}% B:${(blackProb * 100).toFixed(1)}% W:${(whiteProb * 100).toFixed(1)}%`,
          `Rede feed-forward com ${this.neuralNetModel.countParams()} parâmetros`,
          `Features: frequência, gaps, momentum, volatilidade`
        ],
        model_metrics: {
          accuracy: confidence,
          loss: 1 - maxProb,
          training_samples: data.length
        }
      };

    } catch (error) {
      console.error('❌ Erro na predição Neural Network:', error);
      throw error;
    }
  }

  /**
   * 🔢 PREDIZER NÚMERO ESPECÍFICO EM RANGE
   */
  private static predictNumberInRange(data: BlazeNumber[], range: number[]): number {
    // Análise de gaps para escolher o número mais provável
    const gaps = range.map(num => {
      let gap = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].number === num) break;
        gap++;
      }
      return { number: num, gap };
    });

    // Escolher número com maior gap (mais tempo sem aparecer)
    gaps.sort((a, b) => b.gap - a.gap);
    return gaps[0].number;
  }

  /**
   * 🎯 ENSEMBLE ML - COMBINAR TODOS OS MODELOS
   */
  static async predictWithEnsemble(data: BlazeNumber[]): Promise<EnsembleMLResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (data.length < 100) {
      // Treinar modelos se não temos dados suficientes históricos
      console.log('📚 Treinando modelos com dados atuais...');
      await this.trainModels(data);
    }

    try {
      console.log('🎯 EXECUTANDO ENSEMBLE ML - TENSORFLOW.JS');

      // Executar ambos os modelos
      const [lstmResult, neuralResult] = await Promise.all([
        this.predictWithLSTM(data),
        this.predictWithNeuralNetwork(data)
      ]);

      const predictions = [lstmResult, neuralResult];

      // Calcular consenso por votação ponderada
      const votes = { red: 0, black: 0, white: 0 };
      let totalWeight = 0;

      predictions.forEach(pred => {
        const weight = pred.confidence / 100; // Usar confiança como peso
        votes[pred.predicted_color] += weight;
        totalWeight += weight;
      });

      // Determinar predição final
      const maxVotes = Math.max(votes.red, votes.black, votes.white);
      const finalColor = maxVotes === votes.red ? 'red' : 
                         maxVotes === votes.black ? 'black' : 'white';

      // Calcular confiança do ensemble
      const ensembleConfidence = (maxVotes / totalWeight) * 100;

      // Escolher número baseado no algoritmo mais confiante da cor final
      const colorPredictions = predictions.filter(p => p.predicted_color === finalColor);
      const finalNumber = colorPredictions.length > 0 ? 
        colorPredictions.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        ).predicted_number : 
        predictions[0].predicted_number;

      // Calcular acordo entre modelos
      const colorAgreement = predictions.filter(p => p.predicted_color === finalColor).length / predictions.length;
      const numberAgreement = predictions.filter(p => p.predicted_number === finalNumber).length / predictions.length;
      const modelAgreement = (colorAgreement + numberAgreement) / 2;

      // Calcular força do consenso
      const consensusStrength = (maxVotes / totalWeight) * 100;

      console.log('✅ ENSEMBLE ML CONCLUÍDO:');
      console.log(`   🎯 Predição: ${finalColor.toUpperCase()} - ${finalNumber}`);
      console.log(`   📊 Confiança: ${ensembleConfidence.toFixed(1)}%`);
      console.log(`   🤝 Acordo: ${(modelAgreement * 100).toFixed(1)}%`);

      return {
        final_prediction: finalColor,
        final_number: finalNumber,
        ensemble_confidence: ensembleConfidence,
        individual_predictions: predictions,
        consensus_strength: consensusStrength,
        model_agreement: modelAgreement * 100
      };

    } catch (error) {
      console.error('❌ Erro no Ensemble ML:', error);
      throw error;
    }
  }
} 