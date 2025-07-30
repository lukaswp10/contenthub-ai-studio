/**
 * 🤍 WHITE TIMING PANEL
 * 
 * Componente dedicado para exibir análise de timing ideal para apostar no branco
 */
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { WhiteTimingResult } from '@/types/white-timing.types'

interface WhiteTimingPanelProps {
  timingResult: WhiteTimingResult | null
  isLoading?: boolean
}

export function WhiteTimingPanel({ timingResult, isLoading = false }: WhiteTimingPanelProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-cyan-300">
            🤍 ANALISADOR DE TIMING DO BRANCO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-pulse">🔄</div>
            <div className="text-gray-400">Analisando padrões do branco...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!timingResult) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-cyan-300">
            🤍 ANALISADOR DE TIMING DO BRANCO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <div className="text-gray-400">Aguardando dados para análise...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Definir cores baseadas no status
  const statusColors = {
    green: {
      bg: 'bg-green-600',
      border: 'border-green-400',
      text: 'text-green-300',
      icon: '🟢'
    },
    yellow: {
      bg: 'bg-yellow-600',
      border: 'border-yellow-400', 
      text: 'text-yellow-300',
      icon: '🟡'
    },
    red: {
      bg: 'bg-red-600',
      border: 'border-red-400',
      text: 'text-red-300',
      icon: '🔴'
    }
  }

  const colors = statusColors[timingResult.status]

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-cyan-300">
          🤍 ANALISADOR DE TIMING DO BRANCO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Status Principal */}
        <div className="text-center">
          <div className={`
            p-4 rounded-lg border-2 ${colors.bg} ${colors.border}
          `}>
            <div className="text-2xl font-bold text-white mb-2">
              {colors.icon} {timingResult.recommendation === 'BET' ? 'APOSTAR AGORA' :
                             timingResult.recommendation === 'MODERATE' ? 'MOMENTO NEUTRO' :
                             'AGUARDAR'}
            </div>
            <div className="text-lg text-white">
              Probabilidade: {timingResult.probability}%
            </div>
          </div>
        </div>

        {/* Mensagem Principal */}
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="text-white font-semibold mb-2">💡 RECOMENDAÇÃO:</div>
          <div className="text-gray-300">{timingResult.message}</div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400">Gap Atual:</div>
            <div className="text-lg font-bold text-orange-300">
              {timingResult.gapAnalysis.currentGap} números
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400">Pressão:</div>
            <div className="text-lg font-bold text-purple-300">
              {Math.round(timingResult.gapAnalysis.pressureLevel)}%
            </div>
          </div>
        </div>

        {/* Botão para Detalhes */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-cyan-300 border-cyan-300 hover:bg-cyan-300/10"
          >
            {showDetails ? '🙈 Ocultar Detalhes' : '👁️ Ver Detalhes'}
          </Button>
        </div>

        {/* Detalhes Expandidos */}
        {showDetails && (
          <div className="space-y-4 border-t border-gray-600 pt-4">
            
            {/* Análise Detalhada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              
              {/* Gap Analysis */}
              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="text-orange-300 font-semibold mb-2">📊 Análise de Gaps</div>
                <div className="space-y-1 text-gray-300">
                  <div>Atual: {timingResult.gapAnalysis.currentGap} números</div>
                  <div>Média: {timingResult.gapAnalysis.historicalAverage.toFixed(1)} números</div>
                  <div>Atrasado: {timingResult.gapAnalysis.isOverdue ? 'SIM' : 'NÃO'}</div>
                  <div>Pressão: {Math.round(timingResult.gapAnalysis.pressureLevel)}%</div>
                </div>
              </div>

              {/* Temporal Analysis */}
              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="text-blue-300 font-semibold mb-2">⏰ Análise Temporal</div>
                <div className="space-y-1 text-gray-300">
                  <div>Hora: {timingResult.temporalAnalysis.currentHour}h</div>
                  <div>Status: {timingResult.temporalAnalysis.timeRecommendation}</div>
                  <div>Bias: {timingResult.temporalAnalysis.hourlyBias}%</div>
                  <div>Ótimo: {timingResult.temporalAnalysis.isOptimalTime ? 'SIM' : 'NÃO'}</div>
                </div>
              </div>

              {/* Sequence Analysis */}
              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="text-purple-300 font-semibold mb-2">🔄 Análise de Sequência</div>
                <div className="space-y-1 text-gray-300">
                  <div>Sem branco: {timingResult.sequenceAnalysis.consecutiveNonWhite}</div>
                  <div>Crítica: {timingResult.sequenceAnalysis.isCriticalSequence ? 'SIM' : 'NÃO'}</div>
                  <div>Pressão: {Math.round(timingResult.sequenceAnalysis.sequencePressure)}%</div>
                </div>
              </div>

              {/* Risk Analysis */}
              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="text-green-300 font-semibold mb-2">💰 Análise de Risco</div>
                <div className="space-y-1 text-gray-300">
                  <div>ROI: {timingResult.riskAnalysis.roiPotential}%</div>
                  <div>Risco: {timingResult.riskAnalysis.riskLevel}</div>
                  <div>Valor Esperado: {timingResult.riskAnalysis.expectedValue.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Lista de Detalhes */}
            <div className="bg-gray-700/20 p-3 rounded-lg">
              <div className="text-gray-400 font-semibold mb-2">📋 Detalhes da Análise:</div>
              <div className="space-y-1">
                {timingResult.details.map((detail, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    {detail}
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Informações */}
            <div className="text-xs text-gray-500 text-center border-t border-gray-600 pt-2">
              Análise baseada em {timingResult.dataPointsUsed.toLocaleString()} números • 
              Confiança: {Math.round(timingResult.confidence)}% • 
              {new Date(timingResult.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 