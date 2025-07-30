/**
 * 💰 PAINEL DE ANÁLISE ROI REAL-TIME - FOCO NO BRANCO (14x)
 * 
 * Componente que mostra:
 * - ROI calculado dinamicamente com dados reais em tempo real
 * - Destaque especial para BRANCO (14x vs 2x)
 * - Calculadora de lucro baseada em frequências observadas
 * - Estratégias de maximização de lucro
 * - Pressão do branco calculada em tempo real
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { ROIAnalysis } from '../types/real-algorithms.types';

interface ROIAnalysisPanelProps {
  roiAnalysis: ROIAnalysis | null;
  currentBankroll: number;
  whiteFrequency: number;
  whitePressure: number;
  lastWhiteGap: number;
  expectedWhiteCycle: number;
  realTimeData?: any[]; // Dados reais em tempo real para cálculo dinâmico
}

export const ROIAnalysisPanel: React.FC<ROIAnalysisPanelProps> = ({
  roiAnalysis,
  currentBankroll,
  whiteFrequency,
  whitePressure,
  lastWhiteGap,
  expectedWhiteCycle,
  realTimeData = []
}) => {
  // 🔄 CALCULAR ROI DINÂMICO EM TEMPO REAL
  const dynamicROI = useMemo(() => {
    if (!realTimeData || realTimeData.length < 50) {
      console.log('⚠️ Dados insuficientes para ROI dinâmico, usando estático');
      return null;
    }

    // console.log('🔄 CALCULANDO ROI DINÂMICO EM TEMPO REAL...');
    // console.log(`📊 Analisando ${realTimeData.length} números reais da Blaze`);

    // Últimos 100 números para análise mais precisa
    const recent = realTimeData.slice(-100);
    
    // Contar frequências reais observadas
    const redCount = recent.filter((r: any) => r.color === 'red').length;
    const blackCount = recent.filter((r: any) => r.color === 'black').length;
    const whiteCount = recent.filter((r: any) => r.color === 'white').length;
    
    // Probabilidades observadas nos dados reais
    const redProb = redCount / recent.length;
    const blackProb = blackCount / recent.length;
    const whiteProb = whiteCount / recent.length;
    
    // Expected Value com probabilidades reais observadas
    const redEV = (redProb * 2) - 1; // Payout 2x
    const blackEV = (blackProb * 2) - 1; // Payout 2x
    const whiteEV = (whiteProb * 14) - 1; // Payout 14x
    
    // ROI percentual baseado em dados reais
    const redROI = redEV * 100;
    const blackROI = blackEV * 100;
    const whiteROI = whiteEV * 100;
    
    // Análise de pressão do branco em tempo real
    let lastWhiteIndex = -1;
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i]?.color === 'white') {
        lastWhiteIndex = i;
        break;
      }
    }
    const gapSinceLastWhite = lastWhiteIndex === -1 ? recent.length : (recent.length - 1 - lastWhiteIndex);
    
    // Pressão acumulada (0-100%)
    const pressureScore = Math.min(100, (gapSinceLastWhite / 15) * 100); // 15 é ciclo teórico do branco
    
    // Valores de aposta sugeridos (Kelly Criterion adaptado)
    const basePercentage = 0.02; // 2% base da banca
    const kellyRed = Math.max(0, redEV > 0 ? currentBankroll * basePercentage * (1 + redEV) : currentBankroll * basePercentage * 0.5);
    const kellyBlack = Math.max(0, blackEV > 0 ? currentBankroll * basePercentage * (1 + blackEV) : currentBankroll * basePercentage * 0.5);
    const kellyWhite = Math.max(0, whiteEV > 0 ? currentBankroll * basePercentage * 0.5 * (1 + whiteEV) : currentBankroll * basePercentage * 0.3);
    
    // Se pressão do branco > 70%, aumentar aposta sugerida
    const adjustedKellyWhite = pressureScore > 70 ? kellyWhite * 1.5 : kellyWhite;
    
    // Melhor estratégia baseada em ROI + pressão
    let bestStrategy = 'red';
    let bestROI = redROI;
    
    if (blackROI > bestROI) {
      bestStrategy = 'black';
      bestROI = blackROI;
    }
    
    // Priorizar branco se pressão alta E ROI não muito negativo
    if (pressureScore > 60 && whiteROI > -30) {
      bestStrategy = 'white';
      bestROI = whiteROI;
    }
    
    // console.log('✅ ROI DINÂMICO CALCULADO:');
    // console.log(`   🔴 Vermelho: ${redROI.toFixed(1)}% | EV: R$ ${(kellyRed * redEV / 100).toFixed(2)} | Freq: ${(redProb * 100).toFixed(1)}%`);
    // console.log(`   ⚫ Preto: ${blackROI.toFixed(1)}% | EV: R$ ${(kellyBlack * blackEV / 100).toFixed(2)} | Freq: ${(blackProb * 100).toFixed(1)}%`);
    // console.log(`   ⚪ Branco: ${whiteROI.toFixed(1)}% | EV: R$ ${(adjustedKellyWhite * whiteEV / 100).toFixed(2)} | Freq: ${(whiteProb * 100).toFixed(1)}%`);
    // console.log(`   🎯 Melhor estratégia: ${bestStrategy.toUpperCase()} | Pressão: ${pressureScore.toFixed(1)}%`);
    
    return {
      red: { roi: redROI, ev: (kellyRed * redEV / 100), suggestedBet: kellyRed, prob: redProb, count: redCount },
      black: { roi: blackROI, ev: (kellyBlack * blackEV / 100), suggestedBet: kellyBlack, prob: blackProb, count: blackCount },
      white: { roi: whiteROI, ev: (adjustedKellyWhite * whiteEV / 100), suggestedBet: adjustedKellyWhite, prob: whiteProb, count: whiteCount },
      bestStrategy,
      bestROI,
      pressureScore,
      gapSinceLastWhite,
      sampleSize: recent.length,
      lastUpdate: new Date().toLocaleTimeString()
    };
  }, [realTimeData, currentBankroll, lastWhiteGap]);

  // Usar ROI dinâmico se disponível, senão ROI estático
  const activeROI = dynamicROI || (roiAnalysis ? {
    red: { roi: roiAnalysis.expected_value_red * 100, ev: 0, suggestedBet: currentBankroll * 0.02, prob: 0.467, count: 0 },
    black: { roi: roiAnalysis.expected_value_black * 100, ev: 0, suggestedBet: currentBankroll * 0.02, prob: 0.467, count: 0 },
    white: { roi: roiAnalysis.expected_value_white * 100, ev: 0, suggestedBet: currentBankroll * 0.01, prob: 0.067, count: 0 },
    bestStrategy: roiAnalysis.optimal_bet_color,
    bestROI: 0,
    pressureScore: whitePressure,
    gapSinceLastWhite: lastWhiteGap,
    sampleSize: 0,
    lastUpdate: 'Estático'
  } : null);

  if (!activeROI) {
    return (
      <Card className="border-yellow-500/20 bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-yellow-400">💰 ROI REAL-TIME</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Aguardando dados da Blaze... (mínimo 50 números)</p>
        </CardContent>
      </Card>
    );
  }

  // Status do branco baseado na pressão
  const getWhiteStatus = () => {
    if (activeROI.pressureScore > 80) return { status: 'PRESSÃO EXTREMA', color: 'text-red-400', bg: 'bg-red-950/30' };
    if (activeROI.pressureScore > 60) return { status: 'ALTA PRESSÃO', color: 'text-orange-400', bg: 'bg-orange-950/30' };
    if (activeROI.pressureScore > 40) return { status: 'PRESSÃO MÉDIA', color: 'text-yellow-400', bg: 'bg-yellow-950/30' };
    return { status: 'PRESSÃO BAIXA', color: 'text-green-400', bg: 'bg-green-950/30' };
  };

  const whiteStatus = getWhiteStatus();

  return (
    <div className="space-y-4">
      {/* Header com destaque para o ROI DINÂMICO */}
      <Card className="border-green-500/30 bg-green-950/10">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            💰 ANÁLISE ROI REAL-TIME - DADOS DINÂMICOS
            <Badge variant="outline" className="text-green-300 border-green-500">
              {dynamicROI ? '🔄 LIVE' : '📊 ESTÁTICO'}
            </Badge>
            {dynamicROI && (
              <Badge variant="outline" className="text-blue-300 border-blue-500 text-xs">
                {activeROI.sampleSize} números
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Vermelho ROI */}
            <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20">
              <div className="text-red-400 font-bold text-lg">🔴 VERMELHO</div>
              <div className="text-sm text-gray-400">Payout: 2x | Freq: {(activeROI.red.prob * 100).toFixed(1)}%</div>
              <div className="text-2xl font-bold text-red-300">
                {activeROI.red.roi > 0 ? '+' : ''}{activeROI.red.roi.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-300">
                EV: R$ {activeROI.red.ev.toFixed(2)} | Count: {activeROI.red.count}
              </div>
            </div>

            {/* Preto ROI */}
            <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-500/20">
              <div className="text-gray-300 font-bold text-lg">⚫ PRETO</div>
              <div className="text-sm text-gray-400">Payout: 2x | Freq: {(activeROI.black.prob * 100).toFixed(1)}%</div>
              <div className="text-2xl font-bold text-gray-200">
                {activeROI.black.roi > 0 ? '+' : ''}{activeROI.black.roi.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-300">
                EV: R$ {activeROI.black.ev.toFixed(2)} | Count: {activeROI.black.count}
              </div>
            </div>

            {/* Branco ROI - DESTAQUE ESPECIAL */}
            <div className="p-4 rounded-lg bg-yellow-950/30 border-2 border-yellow-400/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1">
                <Badge className="bg-yellow-500 text-black text-xs font-bold">
                  14x PAYOUT
                </Badge>
              </div>
              <div className="text-yellow-400 font-bold text-lg">⚪ BRANCO</div>
              <div className="text-sm text-yellow-300">Payout: 14x 🚀 | Freq: {(activeROI.white.prob * 100).toFixed(1)}%</div>
              <div className="text-3xl font-bold text-yellow-200">
                {activeROI.white.roi > 0 ? '+' : ''}{activeROI.white.roi.toFixed(1)}%
              </div>
              <div className="text-sm text-yellow-100 font-semibold">
                EV: R$ {activeROI.white.ev.toFixed(2)} | Count: {activeROI.white.count}
              </div>
              {activeROI.white.roi > 0 && (
                <div className="text-xs text-yellow-200 mt-1 animate-pulse">
                  💎 OPORTUNIDADE DE LUCRO
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise do Branco - Pressure Cooker */}
      <Card className={`border-white/20 ${whiteStatus.bg}`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🤍 ANÁLISE ESPECIAL - BRANCO (14x)
            <Badge className={`${whiteStatus.color} bg-transparent border-current`}>
              {whiteStatus.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {(activeROI.white.prob * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-400">Frequência Real</div>
              <div className="text-xs text-gray-500">
                (Esperado: 6.67%)
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {activeROI.gapSinceLastWhite}
              </div>
              <div className="text-sm text-gray-400">Números Atrás</div>
              <div className="text-xs text-gray-500">
                Último branco
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {activeROI.pressureScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">Pressão Real</div>
              <div className="text-xs text-gray-500">
                Pressure Score
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                15.0
              </div>
              <div className="text-sm text-gray-400">Ciclo Esperado</div>
              <div className="text-xs text-gray-500">
                Baseado em teoria
              </div>
            </div>
          </div>

          {/* Estratégia Recomendada DINÂMICA */}
          <div className="mt-6 p-4 rounded-lg bg-blue-950/20 border border-blue-500/20">
            <div className="text-blue-400 font-bold mb-2 flex items-center gap-2">
              🎯 ESTRATÉGIA DINÂMICA EM TEMPO REAL:
              <Badge variant="outline" className="text-green-400 border-green-500 text-xs">
                {activeROI.lastUpdate}
              </Badge>
            </div>
            
            {activeROI.bestStrategy === 'white' ? (
              <div className="space-y-2">
                <div className="text-green-400 font-semibold">
                  ✅ APOSTAR NO BRANCO - ALTA PRESSÃO + ROI
                </div>
                <div className="text-sm text-gray-300">
                  • Valor sugerido: R$ {activeROI.white.suggestedBet.toFixed(2)} ({((activeROI.white.suggestedBet / currentBankroll) * 100).toFixed(1)}% da banca)
                </div>
                <div className="text-sm text-gray-300">
                  • Pressão atual: {activeROI.pressureScore.toFixed(1)}% | Gap: {activeROI.gapSinceLastWhite} números
                </div>
                <div className="text-sm text-yellow-300">
                  💎 Branco com {activeROI.white.count} aparições em {activeROI.sampleSize} números
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-yellow-400 font-semibold">
                  ⚠️ APOSTAR EM {activeROI.bestStrategy.toUpperCase()}
                </div>
                <div className="text-sm text-gray-300">
                  • Valor sugerido: R$ {activeROI.bestStrategy === 'red' ? activeROI.red.suggestedBet.toFixed(2) : activeROI.black.suggestedBet.toFixed(2)}
                </div>
                <div className="text-sm text-gray-300">
                  • Pressão branco: {activeROI.pressureScore.toFixed(1)}% (aguardar &gt;60%)
                </div>
                <div className="text-sm text-blue-300">
                  🔍 Baseado em {activeROI.sampleSize} números reais analisados
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulação de Lucro DINÂMICA */}
      <Card className="border-purple-500/20 bg-purple-950/10">
        <CardHeader>
          <CardTitle className="text-purple-400">🚀 SIMULAÇÃO DE LUCRO REAL-TIME</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            <div className="text-center p-4 rounded-lg bg-gray-800/20">
              <div className="text-gray-400 text-sm mb-1">Banca Atual</div>
              <div className="text-3xl font-bold text-green-400">
                R$ {currentBankroll.toFixed(2)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Se apostar vermelho/preto */}
              <div className="p-3 rounded-lg bg-gray-900/40 text-center">
                <div className="text-gray-400 text-sm">Apostar Vermelho/Preto</div>
                <div className="text-lg font-bold text-gray-300">
                  R$ {activeROI.red.suggestedBet.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  Lucro: +R$ {activeROI.red.suggestedBet.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">
                  (100% de lucro se acertar)
                </div>
              </div>

              {/* Se apostar branco */}
              <div className="p-3 rounded-lg bg-yellow-950/30 border border-yellow-500/30 text-center">
                <div className="text-yellow-400 text-sm font-semibold">Apostar Branco</div>
                <div className="text-lg font-bold text-yellow-300">
                  R$ {activeROI.white.suggestedBet.toFixed(2)}
                </div>
                <div className="text-sm text-yellow-200 font-semibold">
                  Lucro: +R$ {(activeROI.white.suggestedBet * 13).toFixed(2)}
                </div>
                <div className="text-xs text-yellow-300">
                  (1300% de lucro se acertar!)
                </div>
              </div>

              {/* Meta R$ 10 → R$ 50 */}
              <div className="p-3 rounded-lg bg-green-950/30 border border-green-500/30 text-center">
                <div className="text-green-400 text-sm font-semibold">Meta 5x Banca</div>
                <div className="text-lg font-bold text-green-300">
                  {Math.ceil((currentBankroll * 4) / (activeROI.white.suggestedBet * 13 || 1))} acertos
                </div>
                <div className="text-sm text-green-200">
                  no branco necessários
                </div>
                <div className="text-xs text-green-300">
                  (Para 5x a banca)
                </div>
              </div>
            </div>

            {/* Aviso importante */}
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20">
              <div className="text-red-400 text-sm font-bold mb-1">⚠️ GESTÃO DE RISCO DINÂMICA:</div>
              <div className="text-xs text-gray-300 space-y-1">
                <div>• Sistema calcula apostas baseado em {activeROI.sampleSize} números reais</div>
                <div>• ROI e Expected Value atualizados em tempo real</div>
                <div>• Pressão do branco: {activeROI.pressureScore.toFixed(1)}% (0-100%)</div>
                <div>• Use stop loss de 30% da banca total sempre</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 