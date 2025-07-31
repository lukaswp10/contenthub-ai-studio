/**
 * 🎯 INTERFACE UNIFICADA DE PREDIÇÃO - FASE 1 CRÍTICA
 * 
 * Interface limpa e focada para o sistema unificado
 * - Integra dados sempre frescos
 * - Sistema único de predição
 * - Feedback unificado
 * ✅ SISTEMA 100% AUTOMÁTICO EM TEMPO REAL
 * 
 * @version 2.0.0 - AUTOMAÇÃO COMPLETA
 */

import React, { useEffect, useRef } from 'react'
import { usePredictionSystem } from '../hooks/usePredictionSystem'
import { unifiedFeedbackService } from '../../../services/unifiedFeedbackService'

interface Props {
  latestNumber?: {
    number: number
    color: 'red' | 'black' | 'white'
  }
}

export function UnifiedPredictionInterface({ latestNumber }: Props) {
  const {
    currentPrediction,
    isGenerating,
    metrics,
    generatePrediction,
    registerResult,
    invalidateCache // ✅ NOVA: Para invalidar cache quando chegam dados novos
  } = usePredictionSystem()
  
  // ✅ AUTOMAÇÃO: Controle de round_id para evitar múltiplos registros
  const lastProcessedRoundRef = useRef<string | null>(null)
  const lastNumberRef = useRef<{number: number; color: 'red' | 'black' | 'white'} | null>(null)
  const isInitializedRef = useRef<boolean>(false)
  
  // 🎯 PREDIÇÃO AUTOMÁTICA NA INICIALIZAÇÃO (com proteção dupla inicialização)
  useEffect(() => {
    if (isInitializedRef.current) return
    
    isInitializedRef.current = true
    console.log('🎯 SISTEMA AUTOMÁTICO: Iniciando predição inicial com todos os dados do banco...')
    generatePrediction().catch(error => {
      console.error('❌ SISTEMA AUTOMÁTICO: Erro na predição inicial:', error)
    })
  }, [generatePrediction]) // Dependência generatePrediction para evitar stale closure
  
  // ✅ AUTOMAÇÃO COMPLETA: Quando novo número chega → registrar resultado + gerar nova predição
  useEffect(() => {
    if (latestNumber && currentPrediction) {
      // Usar number+color+timestamp como identificador único
      const currentRoundId = `${latestNumber.color}_${latestNumber.number}_${Date.now()}`
      
      // Verificar se já processamos este número
      if (lastProcessedRoundRef.current === currentRoundId || 
          (lastNumberRef.current?.number === latestNumber.number && 
           lastNumberRef.current?.color === latestNumber.color)) {
        return
      }
      
      console.log('🎯 AUTOMAÇÃO: Novo número da Blaze detectado, processando automaticamente...')
      console.log(`📊 RESULTADO REAL: ${latestNumber.number} (${latestNumber.color.toUpperCase()})`)
      
      // 0️⃣ ✅ INVALIDAR CACHE: Novo dado chegou, próxima predição deve pegar dados atualizados
      invalidateCache()
      
      // 1️⃣ REGISTRAR RESULTADO DA PREDIÇÃO ANTERIOR
      registerResult(latestNumber.color, latestNumber.number)
      
      // 2️⃣ GERAR NOVA PREDIÇÃO AUTOMATICAMENTE (COM DEBOUNCE)
      console.log('🔄 AUTOMAÇÃO: Gerando nova predição automaticamente em 5s...')
      setTimeout(() => {
        generatePrediction().catch(error => {
          console.error('❌ AUTOMAÇÃO: Erro na predição automática:', error)
        })
      }, 5000) // ✅ DEBOUNCE: Aguarda 5s para evitar conflitos
      
      // Atualizar controles
      lastProcessedRoundRef.current = currentRoundId
      lastNumberRef.current = latestNumber
      
      console.log(`✅ AUTOMAÇÃO: Ciclo completo processado para ${latestNumber.number} (${latestNumber.color})`)
    }
  }, [latestNumber, currentPrediction, registerResult, generatePrediction])

  const handleGeneratePrediction = async () => {
    try {
      await generatePrediction()
    } catch (error) {
      console.error('❌ MANUAL: Erro gerando predição:', error)
    }
  }

  const getUnifiedMetrics = () => {
    try {
      return unifiedFeedbackService.getCurrentMetrics()
    } catch (error) {
      return null
    }
  }

  const unifiedMetrics = getUnifiedMetrics()

  return (
    <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🎯 Sistema Unificado de Predição
          <span className="text-sm font-normal opacity-75">(AUTOMÁTICO)</span>
        </h2>
        
        <div className="flex gap-3 items-center">
          <button
            onClick={handleGeneratePrediction}
            disabled={isGenerating}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              isGenerating
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transform hover:scale-105'
            }`}
          >
            {isGenerating ? '⏳ Gerando...' : '🔄 Forçar Nova Predição'}
          </button>
          
          <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-400 animate-pulse">
            <span className="text-green-200 text-sm font-semibold">
              🤖 AUTOMÁTICO
            </span>
          </div>
        </div>
      </div>

      {/* PREDIÇÃO ATUAL */}
      {currentPrediction && (
        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Próxima Predição:
              </h3>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  currentPrediction.color === 'red' ? 'bg-red-500 text-white' :
                  currentPrediction.color === 'black' ? 'bg-gray-800 text-white' :
                  'bg-white text-black'
                }`}>
                  {currentPrediction.number}
                </div>
                <div className="text-white">
                  <div className="font-semibold capitalize">
                    {currentPrediction.color === 'red' ? 'Vermelho' :
                     currentPrediction.color === 'black' ? 'Preto' : 'Branco'}
                  </div>
                  <div className="text-sm opacity-75">
                    {currentPrediction.confidence.toFixed(1)}% confiança
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right text-white">
              <div className="text-sm opacity-75">Algoritmo:</div>
              <div className="font-semibold">{currentPrediction.algorithm_used}</div>
              <div className="text-sm opacity-75">
                {currentPrediction.data_count} dados • {currentPrediction.data_freshness}s atrás
              </div>
              <div className="text-sm opacity-75">
                {currentPrediction.execution_time}ms execução
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MÉTRICAS UNIFICADAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Métricas Locais */}
        <div className="bg-black/20 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">📊 Métricas Locais</h4>
          <div className="text-white text-sm space-y-1">
            <div>Total: {metrics.total_predictions}</div>
            <div>Acertos: {metrics.correct_predictions}</div>
            <div className="font-semibold">
              Acurácia: {metrics.accuracy_percentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Métricas Unificadas */}
        <div className="bg-black/20 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">🔄 Sistema Unificado</h4>
          {unifiedMetrics ? (
            <div className="text-white text-sm space-y-1">
              <div>Total: {unifiedMetrics.total_predictions}</div>
              <div>Acertos: {unifiedMetrics.correct_predictions}</div>
              <div className="font-semibold">
                Acurácia: {unifiedMetrics.color_accuracy.toFixed(1)}%
              </div>
              <div className="text-xs opacity-75">
                Tendência: {unifiedMetrics.recent_trend === 'improving' ? '📈 Melhorando' :
                           unifiedMetrics.recent_trend === 'declining' ? '📉 Piorando' : '➡️ Estável'}
              </div>
            </div>
          ) : (
            <div className="text-white text-sm opacity-75">
              Carregando métricas...
            </div>
          )}
        </div>

        {/* Performance por Algoritmo */}
        <div className="bg-black/20 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">🧠 Algoritmos</h4>
          {unifiedMetrics?.algorithm_performance ? (
            <div className="text-white text-xs space-y-1">
              {Object.entries(unifiedMetrics.algorithm_performance)
                .slice(0, 3) // Mostrar apenas top 3
                .map(([algo, perf]) => (
                  <div key={algo} className="flex justify-between">
                    <span className="truncate">{algo.slice(0, 12)}...</span>
                    <span>{perf.success_rate.toFixed(0)}%</span>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="text-white text-sm opacity-75">
              Sem dados ainda
            </div>
          )}
        </div>
      </div>

      {/* STATUS AUTOMÁTICO */}
      <div className="mt-4 text-center">
        <div className="text-white text-sm opacity-75">
          ✅ Sistema Único • 📊 Dados Frescos • 🔄 Feedback Unificado • 🤖 100% Automático
        </div>
        {isGenerating && (
          <div className="text-yellow-300 text-sm mt-1 animate-pulse">
            ⏳ Processando dados do banco e executando algoritmos automaticamente...
          </div>
        )}
        {currentPrediction && !isGenerating && (
          <div className="text-green-300 text-sm mt-1">
            ✅ Predição automática gerada com {currentPrediction.data_count} dados do banco • Aguardando próximo número da Blaze...
          </div>
        )}
        {latestNumber && (
          <div className="text-blue-300 text-sm mt-1">
            📊 Último resultado: {latestNumber.number} ({latestNumber.color.toUpperCase()}) • Sistema processando automaticamente...
          </div>
        )}
      </div>
    </div>
  )
} 