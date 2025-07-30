/**
 * 🎰 SIMULADOR DE APOSTAS REAL - BLAZE
 * 
 * Simula apostas reais usando os palpites do sistema:
 * - Banca virtual com valor real
 * - Apostas baseadas nas predições do sistema
 * - Cálculo real de lucros/prejuízos
 * - Histórico completo de apostas
 * - Estatísticas de performance
 * - Como se estivesse jogando no site real
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import type { RealPredictionResult, ROIAnalysis } from '../types/real-algorithms.types';

interface BettingRecord {
  id: string;
  timestamp: number;
  predicted_color: 'red' | 'black' | 'white';
  predicted_number: number;
  bet_amount: number;
  bet_color: 'red' | 'black' | 'white';
  actual_color?: 'red' | 'black' | 'white';
  actual_number?: number;
  payout_multiplier: number; // 2x ou 14x
  result?: 'win' | 'loss' | 'pending';
  profit_loss?: number;
  bankroll_after?: number;
}

interface SimulationStats {
  total_bets: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_wagered: number;
  total_profit_loss: number;
  roi_percentage: number;
  biggest_win: number;
  biggest_loss: number;
  current_streak: number;
  longest_win_streak: number;
  longest_loss_streak: number;
}

interface BettingSimulatorProps {
  realPrediction: RealPredictionResult | null;
  roiAnalysis: ROIAnalysis | null;
  initialBankroll: number;
  onBankrollChange: (newBankroll: number) => void;
}

export const BettingSimulator: React.FC<BettingSimulatorProps> = ({
  realPrediction,
  roiAnalysis,
  initialBankroll,
  onBankrollChange
}) => {
  // Estados principais
  const [currentBankroll, setCurrentBankroll] = useState(initialBankroll);
  const [betAmount, setBetAmount] = useState(5); // R$ 5 padrão
  const [bettingHistory, setBettingHistory] = useState<BettingRecord[]>([]);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [betStrategy, setBetStrategy] = useState<'fixed' | 'kelly' | 'progressive'>('kelly');
  
  // Estados de controle
  const [waitingForResult, setWaitingForResult] = useState(false);
  const [currentBet, setCurrentBet] = useState<BettingRecord | null>(null);
  const [lastRealResult, setLastRealResult] = useState<any>(null);
  const lastPredictionRef = useRef<string>('');
  const lastProcessedResultRef = useRef<string>('');

  // Calcular estatísticas
  const stats: SimulationStats = React.useMemo(() => {
    const confirmedBets = bettingHistory.filter(bet => bet.result !== 'pending');
    const wins = confirmedBets.filter(bet => bet.result === 'win').length;
    const losses = confirmedBets.filter(bet => bet.result === 'loss').length;
    
    return {
      total_bets: confirmedBets.length,
      wins,
      losses,
      win_rate: confirmedBets.length > 0 ? (wins / confirmedBets.length) * 100 : 0,
      total_wagered: confirmedBets.reduce((sum, bet) => sum + bet.bet_amount, 0),
      total_profit_loss: confirmedBets.reduce((sum, bet) => sum + (bet.profit_loss || 0), 0),
      roi_percentage: confirmedBets.length > 0 ? 
        (confirmedBets.reduce((sum, bet) => sum + (bet.profit_loss || 0), 0) / 
         confirmedBets.reduce((sum, bet) => sum + bet.bet_amount, 0)) * 100 : 0,
      biggest_win: Math.max(0, ...confirmedBets.map(bet => bet.profit_loss || 0)),
      biggest_loss: Math.min(0, ...confirmedBets.map(bet => bet.profit_loss || 0)),
      current_streak: calculateCurrentStreak(confirmedBets),
      longest_win_streak: calculateLongestStreak(confirmedBets, 'win'),
      longest_loss_streak: calculateLongestStreak(confirmedBets, 'loss')
    };
  }, [bettingHistory]);

  // Calcular streak atual
  function calculateCurrentStreak(bets: BettingRecord[]): number {
    if (bets.length === 0) return 0;
    
    const lastResult = bets[bets.length - 1].result;
    let streak = 0;
    
    for (let i = bets.length - 1; i >= 0; i--) {
      if (bets[i].result === lastResult) {
        streak++;
      } else {
        break;
      }
    }
    
    return lastResult === 'win' ? streak : -streak;
  }

  // Calcular maior streak
  function calculateLongestStreak(bets: BettingRecord[], type: 'win' | 'loss'): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    bets.forEach(bet => {
      if (bet.result === type) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  }

  // Calcular valor da aposta baseado na estratégia
  const calculateBetAmount = (): number => {
    if (betStrategy === 'fixed') {
      return Math.min(betAmount, currentBankroll);
    }
    
    if (betStrategy === 'kelly' && roiAnalysis) {
      const kellyAmount = currentBankroll * roiAnalysis.kelly_criterion;
      return Math.min(kellyAmount, currentBankroll * 0.1); // Máximo 10% da banca
    }
    
    if (betStrategy === 'progressive') {
      // Aumentar aposta após perdas, reduzir após vitórias
      const lastBet = bettingHistory[bettingHistory.length - 1];
      if (lastBet?.result === 'loss') {
        return Math.min(betAmount * 1.5, currentBankroll * 0.15);
      } else if (lastBet?.result === 'win') {
        return Math.min(betAmount * 0.8, currentBankroll * 0.05);
      }
    }
    
    return Math.min(betAmount, currentBankroll);
  };

  // Fazer aposta baseada na predição
  const placeBet = () => {
    if (!realPrediction || !isSimulationActive || waitingForResult || currentBankroll <= 0) {
      return;
    }

    // Verificar se é uma nova predição
    const predictionKey = `${realPrediction.consensus_color}_${realPrediction.consensus_number}_${realPrediction.mathematical_confidence}`;
    if (predictionKey === lastPredictionRef.current) {
      console.log('⚠️ Predição já processada, aguardando nova');
      return;
    }
    lastPredictionRef.current = predictionKey;

    const calculatedBetAmount = calculateBetAmount();
    
    if (calculatedBetAmount <= 0) {
      console.log('❌ Banca insuficiente para apostar');
      setIsSimulationActive(false);
      return;
    }

    // Escolher cor da aposta baseada na análise ROI
    let betColor = realPrediction.consensus_color;
    if (roiAnalysis && roiAnalysis.optimal_bet_color !== realPrediction.consensus_color) {
      betColor = roiAnalysis.optimal_bet_color;
      console.log(`🎯 ROI sugere apostar em ${betColor.toUpperCase()} em vez de ${realPrediction.consensus_color.toUpperCase()}`);
    }

    const newBet: BettingRecord = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      predicted_color: realPrediction.consensus_color,
      predicted_number: realPrediction.consensus_number,
      bet_amount: calculatedBetAmount,
      bet_color: betColor,
      payout_multiplier: betColor === 'white' ? 14 : 2,
      result: 'pending'
    };

    // Debitar da banca
    const newBankroll = currentBankroll - calculatedBetAmount;
    setCurrentBankroll(newBankroll);
    onBankrollChange(newBankroll);

    // Adicionar ao histórico
    setBettingHistory(prev => [...prev, newBet]);
    setCurrentBet(newBet);
    setWaitingForResult(true);

    console.log('🎰 APOSTA SIMULADA:');
    console.log(`   💰 Valor: R$ ${calculatedBetAmount.toFixed(2)}`);
    console.log(`   🎨 Cor: ${betColor.toUpperCase()}`);
    console.log(`   🔢 Payout: ${newBet.payout_multiplier}x`);
    console.log(`   💳 Banca após aposta: R$ ${newBankroll.toFixed(2)}`);
  };

  // Simular resultado (para demonstração - substituir por dados reais da Blaze)
  const simulateResult = (resultColor: 'red' | 'black' | 'white', resultNumber: number) => {
    if (!currentBet) return;

    const isWin = currentBet.bet_color === resultColor;
    const profit = isWin ? 
      (currentBet.bet_amount * currentBet.payout_multiplier) - currentBet.bet_amount : 
      -currentBet.bet_amount;

    const newBankroll = currentBankroll + (isWin ? currentBet.bet_amount * currentBet.payout_multiplier : 0);

    // Atualizar aposta no histórico
    setBettingHistory(prev => prev.map(bet => 
      bet.id === currentBet.id ? {
        ...bet,
        actual_color: resultColor,
        actual_number: resultNumber,
        result: isWin ? 'win' : 'loss',
        profit_loss: profit,
        bankroll_after: newBankroll
      } : bet
    ));

    setCurrentBankroll(newBankroll);
    onBankrollChange(newBankroll);
    setWaitingForResult(false);
    setCurrentBet(null);

    console.log(`${isWin ? '✅ VITÓRIA' : '❌ DERROTA'} SIMULADA:`);
    console.log(`   🎯 Resultado: ${resultColor.toUpperCase()} - ${resultNumber}`);
    console.log(`   💰 P&L: R$ ${profit.toFixed(2)}`);
    console.log(`   💳 Nova banca: R$ ${newBankroll.toFixed(2)}`);

    // Auto-play: fazer próxima aposta automaticamente
    if (autoPlay && newBankroll > 0) {
      setTimeout(() => placeBet(), 2000);
    }
  };

  // Reset da simulação
  const resetSimulation = () => {
    setCurrentBankroll(initialBankroll);
    setBettingHistory([]);
    setWaitingForResult(false);
    setCurrentBet(null);
    setIsSimulationActive(false);
    setAutoPlay(false);
    lastPredictionRef.current = '';
    onBankrollChange(initialBankroll);
    console.log('🔄 Simulação resetada');
  };

  // Cores para status
  const getStatusColor = (profit: number) => {
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getBankrollColor = (current: number, initial: number) => {
    if (current > initial) return 'text-green-400';
    if (current < initial) return 'text-red-400';
    return 'text-gray-300';
  };

  // Escutar dados reais da Blaze e processar automaticamente
  useEffect(() => {
    const handleBlazeRealData = (event: CustomEvent) => {
      const realData = event.detail;
      
      if (!realData || !realData.number || !realData.color) return;
      
      // Evitar processar o mesmo resultado múltiplas vezes
      const resultKey = `${realData.round_id || realData.number}_${realData.color}_${realData.timestamp || Date.now()}`;
      if (resultKey === lastProcessedResultRef.current) return;
      lastProcessedResultRef.current = resultKey;

      setLastRealResult(realData);
      
      console.log('🎰 RESULTADO REAL DA BLAZE RECEBIDO:', realData);
      
      // Se há uma aposta pendente, processar automaticamente
      if (currentBet && waitingForResult) {
        processRealResult(realData.color, realData.number);
      }
    };

    // Adicionar listener para dados reais da Blaze
    window.addEventListener('blazeRealData', handleBlazeRealData as EventListener);
    
    return () => {
      window.removeEventListener('blazeRealData', handleBlazeRealData as EventListener);
    };
  }, [currentBet, waitingForResult]);

  // Processar resultado real da Blaze
  const processRealResult = (resultColor: 'red' | 'black' | 'white', resultNumber: number) => {
    if (!currentBet || !waitingForResult) return;

    const isWin = currentBet.bet_color === resultColor;
    const profit = isWin ? 
      (currentBet.bet_amount * currentBet.payout_multiplier) - currentBet.bet_amount : 
      -currentBet.bet_amount;

    const newBankroll = currentBankroll + (isWin ? currentBet.bet_amount * currentBet.payout_multiplier : 0);

    // Atualizar aposta no histórico
    setBettingHistory(prev => prev.map(bet => 
      bet.id === currentBet.id ? {
        ...bet,
        actual_color: resultColor,
        actual_number: resultNumber,
        result: isWin ? 'win' : 'loss',
        profit_loss: profit,
        bankroll_after: newBankroll
      } : bet
    ));

    setCurrentBankroll(newBankroll);
    onBankrollChange(newBankroll);
    setWaitingForResult(false);
    setCurrentBet(null);

    console.log(`${isWin ? '✅ VITÓRIA' : '❌ DERROTA'} REAL:`);
    console.log(`   🎯 Resultado: ${resultColor.toUpperCase()} - ${resultNumber}`);
    console.log(`   💰 P&L: R$ ${profit.toFixed(2)}`);
    console.log(`   💳 Nova banca: R$ ${newBankroll.toFixed(2)}`);

    // Auto-play: fazer próxima aposta automaticamente após resultado real
    if (autoPlay && newBankroll > 0 && isSimulationActive) {
      setTimeout(() => {
        if (realPrediction) {
          placeBet();
        }
      }, 3000); // Aguardar 3 segundos antes da próxima aposta
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles da Simulação */}
      <Card className="border-blue-500/30 bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center gap-2">
            🎰 SIMULADOR DE APOSTAS REAL
            <Badge 
              variant="outline" 
              className={`${isSimulationActive ? 'text-green-300 border-green-500' : 'text-gray-400 border-gray-500'}`}
            >
              {isSimulationActive ? 'ATIVO' : 'PARADO'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Banca Atual */}
            <div className="bg-gray-800/50 p-4 rounded-lg text-center">
              <div className="text-gray-400 text-sm mb-1">💳 Banca Virtual</div>
              <div className={`text-2xl font-bold ${getBankrollColor(currentBankroll, initialBankroll)}`}>
                R$ {currentBankroll.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                Inicial: R$ {initialBankroll.toFixed(2)}
              </div>
            </div>

            {/* Valor da Aposta */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-2">💰 Valor da Aposta</div>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                className="mb-2 bg-gray-700 border-gray-600"
                min="1"
                max={currentBankroll}
                step="0.5"
              />
              <select 
                value={betStrategy}
                onChange={(e) => setBetStrategy(e.target.value as any)}
                className="w-full p-1 bg-gray-700 border-gray-600 rounded text-sm"
              >
                <option value="fixed">Valor Fixo</option>
                <option value="kelly">Kelly Criterion</option>
                <option value="progressive">Progressivo</option>
              </select>
            </div>

            {/* Controles */}
            <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
              <Button
                onClick={() => setIsSimulationActive(!isSimulationActive)}
                className={`w-full ${isSimulationActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isSimulationActive ? '⏸️ PARAR' : '▶️ INICIAR'}
              </Button>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-gray-300">Auto-Play</span>
              </div>
            </div>

            {/* Ações */}
            <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
              <Button
                onClick={placeBet}
                disabled={!realPrediction || !isSimulationActive || waitingForResult || currentBankroll <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                🎯 APOSTAR AGORA
              </Button>
              
              <Button
                onClick={resetSimulation}
                className="w-full bg-gray-600 hover:bg-gray-700 text-xs"
              >
                🔄 RESET
              </Button>
            </div>
          </div>

          {/* Status da Conexão e Último Resultado */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Último Resultado da Blaze */}
            <div className="p-3 bg-blue-950/30 border border-blue-500/50 rounded-lg">
              <div className="text-blue-400 font-semibold mb-2">🎯 Último Resultado Blaze:</div>
              {lastRealResult ? (
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    lastRealResult.color === 'red' ? 'bg-red-600 text-white' :
                    lastRealResult.color === 'black' ? 'bg-gray-800 text-white' : 'bg-white text-black'
                  }`}>
                    {lastRealResult.number}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{lastRealResult.color?.toUpperCase()}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(lastRealResult.timestamp || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Aguardando dados da Blaze...</div>
              )}
            </div>

            {/* Aposta Atual */}
            {currentBet && (
              <div className="p-3 bg-yellow-950/30 border border-yellow-500/50 rounded-lg">
                <div className="text-yellow-400 font-semibold mb-2">🎲 Aposta Ativa:</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cor Apostada:</span>
                    <span className={`font-bold ${
                      currentBet.bet_color === 'red' ? 'text-red-400' :
                      currentBet.bet_color === 'black' ? 'text-gray-300' : 'text-white'
                    }`}>
                      {currentBet.bet_color.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor:</span>
                    <span className="font-bold text-yellow-300">R$ {currentBet.bet_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payout:</span>
                    <span className="font-bold text-green-300">{currentBet.payout_multiplier}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ganho Potencial:</span>
                    <span className="font-bold text-green-400">
                      +R$ {((currentBet.bet_amount * currentBet.payout_multiplier) - currentBet.bet_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center pt-2">
                    <span className="text-yellow-400 animate-pulse">⏳ Aguardando resultado da Blaze...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Detalhadas */}
      <Card className="border-purple-500/30 bg-purple-950/20">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center gap-2">
            📊 PERFORMANCE REAL DA SIMULAÇÃO
            {stats.total_bets > 0 && (
              <Badge 
                variant="outline" 
                className={`${stats.total_profit_loss > 0 ? 'text-green-400 border-green-500' : 'text-red-400 border-red-500'}`}
              >
                {stats.total_profit_loss > 0 ? '📈 LUCRANDO' : '📉 PERDENDO'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-white">{stats.total_bets}</div>
              <div className="text-xs text-gray-400">Total Apostas</div>
            </div>

            <div className="text-center p-3 bg-green-950/30 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
              <div className="text-xs text-gray-400">Vitórias</div>
              {stats.current_streak > 0 && (
                <div className="text-xs text-green-300">🔥 {stats.current_streak} sequência</div>
              )}
            </div>

            <div className="text-center p-3 bg-red-950/30 rounded-lg border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
              <div className="text-xs text-gray-400">Derrotas</div>
              {stats.current_streak < 0 && (
                <div className="text-xs text-red-300">❄️ {Math.abs(stats.current_streak)} sequência</div>
              )}
            </div>

            <div className="text-center p-3 bg-blue-950/30 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">{stats.win_rate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Taxa Vitória</div>
              <div className="text-xs text-blue-300">
                {stats.win_rate >= 60 ? '🎯 Excelente' : stats.win_rate >= 50 ? '👍 Boa' : '⚠️ Baixa'}
              </div>
            </div>

            <div className="text-center p-3 bg-gray-800/30 rounded-lg border-2 border-yellow-500/30">
              <div className={`text-2xl font-bold ${getStatusColor(stats.total_profit_loss)}`}>
                R$ {stats.total_profit_loss.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">Lucro Total</div>
              <div className="text-xs text-yellow-300">
                {stats.total_profit_loss > 0 ? '💰 No lucro' : '⚠️ No prejuízo'}
              </div>
            </div>

            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className={`text-2xl font-bold ${getStatusColor(stats.roi_percentage)}`}>
                {stats.roi_percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">ROI Total</div>
              <div className="text-xs text-purple-300">
                {stats.roi_percentage > 20 ? '🚀 Ótimo' : stats.roi_percentage > 0 ? '📈 Positivo' : '📉 Negativo'}
              </div>
            </div>
          </div>

          {/* Análise de Performance */}
          {stats.total_bets > 0 && (
            <div className="space-y-4">
              
              {/* Resumo Executivo */}
              <div className={`p-4 rounded-lg border-2 ${
                stats.total_profit_loss > 0 ? 'bg-green-950/20 border-green-500/30' : 'bg-red-950/20 border-red-500/30'
              }`}>
                <div className={`font-bold text-lg ${stats.total_profit_loss > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.total_profit_loss > 0 ? '🎉 RESULTADO POSITIVO!' : '⚠️ RESULTADO NEGATIVO'}
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  {stats.total_profit_loss > 0 ? (
                    <>
                      • Você teria <span className="font-bold text-green-400">LUCRADO R$ {Math.abs(stats.total_profit_loss).toFixed(2)}</span> se estivesse apostando de verdade
                      <br />
                      • Sua banca teria crescido <span className="font-bold text-green-400">{((currentBankroll / initialBankroll - 1) * 100).toFixed(1)}%</span>
                      <br />
                      • Performance: <span className="font-bold text-blue-400">{stats.wins} vitórias</span> em {stats.total_bets} apostas
                    </>
                  ) : (
                    <>
                      • Você teria <span className="font-bold text-red-400">PERDIDO R$ {Math.abs(stats.total_profit_loss).toFixed(2)}</span> se estivesse apostando de verdade
                      <br />
                      • Sua banca teria diminuído <span className="font-bold text-red-400">{((1 - currentBankroll / initialBankroll) * 100).toFixed(1)}%</span>
                      <br />
                      • Recomendação: <span className="font-bold text-yellow-400">Revisar estratégia ou aguardar mais dados</span>
                    </>
                  )}
                </div>
              </div>

              {/* Estatísticas Adicionais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-800/30 p-3 rounded text-center">
                  <div className="text-green-400 font-bold">R$ {stats.biggest_win.toFixed(2)}</div>
                  <div className="text-gray-400">Maior Vitória</div>
                </div>
                <div className="bg-gray-800/30 p-3 rounded text-center">
                  <div className="text-red-400 font-bold">R$ {Math.abs(stats.biggest_loss).toFixed(2)}</div>
                  <div className="text-gray-400">Maior Perda</div>
                </div>
                <div className="bg-gray-800/30 p-3 rounded text-center">
                  <div className="text-blue-400 font-bold">{stats.longest_win_streak}</div>
                  <div className="text-gray-400">Maior Sequência +</div>
                </div>
                <div className="bg-gray-800/30 p-3 rounded text-center">
                  <div className="text-orange-400 font-bold">{stats.longest_loss_streak}</div>
                  <div className="text-gray-400">Maior Sequência -</div>
                </div>
              </div>

              {/* Meta de Lucro */}
              {initialBankroll >= 10 && (
                <div className="bg-blue-950/20 border border-blue-500/30 p-3 rounded-lg">
                  <div className="text-blue-400 font-semibold">🎯 META: R$ {initialBankroll.toFixed(0)} → R$ {(initialBankroll * 5).toFixed(0)} (5x)</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        currentBankroll > initialBankroll ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, (currentBankroll / (initialBankroll * 5)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Progresso: {((currentBankroll / (initialBankroll * 5)) * 100).toFixed(1)}% da meta
                    {currentBankroll >= initialBankroll * 5 && <span className="text-green-400 ml-2">🎉 META ALCANÇADA!</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico Resumido */}
      {bettingHistory.length > 0 && (
        <Card className="border-gray-500/30 bg-gray-950/20">
          <CardHeader>
            <CardTitle className="text-gray-400">📜 ÚLTIMAS APOSTAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bettingHistory.slice(-10).reverse().map((bet) => (
                <div 
                  key={bet.id} 
                  className={`p-3 rounded-lg border ${
                    bet.result === 'win' ? 'bg-green-950/30 border-green-500/30' :
                    bet.result === 'loss' ? 'bg-red-950/30 border-red-500/30' :
                    'bg-yellow-950/30 border-yellow-500/30'
                  }`}
                >
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        bet.bet_color === 'red' ? 'text-red-400' :
                        bet.bet_color === 'black' ? 'text-gray-300' : 'text-white'
                      }`}>
                        {bet.bet_color.toUpperCase()}
                      </span>
                      <span className="text-gray-400">R$ {bet.bet_amount.toFixed(2)}</span>
                      <span className="text-blue-300">{bet.payout_multiplier}x</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {bet.result !== 'pending' && (
                        <>
                          <span className={`font-bold ${
                            bet.actual_color === 'red' ? 'text-red-400' :
                            bet.actual_color === 'black' ? 'text-gray-300' : 'text-white'
                          }`}>
                            {bet.actual_color?.toUpperCase()} - {bet.actual_number}
                          </span>
                          <span className={`font-bold ${getStatusColor(bet.profit_loss || 0)}`}>
                            {bet.result === 'win' ? '✅' : '❌'} R$ {(bet.profit_loss || 0).toFixed(2)}
                          </span>
                        </>
                      )}
                      {bet.result === 'pending' && (
                        <span className="text-yellow-400 animate-pulse">⏳ Aguardando...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Teste (para demonstração) */}
      {waitingForResult && currentBet && (
        <Card className="border-orange-500/30 bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-orange-400">🎲 SIMULAR RESULTADO (DEMO)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-300 mb-3">
              Simule o resultado da Blaze para testar:
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { color: 'red', numbers: [1,2,3,4,5,6,7] },
                { color: 'black', numbers: [8,9,10,11,12,13,14] },
                { color: 'white', numbers: [0] }
              ].map(({ color, numbers }) => (
                <div key={color} className="space-y-1">
                  <div className="text-xs text-gray-400 uppercase">{color}:</div>
                  <div className="flex gap-1 flex-wrap">
                    {numbers.map(num => (
                      <Button
                        key={num}
                        onClick={() => simulateResult(color as any, num)}
                        className={`text-xs p-1 h-8 w-8 ${
                          color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                          color === 'black' ? 'bg-gray-600 hover:bg-gray-700' :
                          'bg-white hover:bg-gray-200 text-black'
                        }`}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 