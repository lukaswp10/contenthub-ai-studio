/**
 * 🎛️ CONTROLES DE SINCRONIZAÇÃO DE LEGENDAS - ClipsForge Pro
 * 
 * Interface avançada para:
 * - ✅ Ajuste de offset em tempo real
 * - ✅ Controle de velocidade de sincronização
 * - ✅ Configuração de agrupamento inteligente
 * - ✅ Análise visual de timing
 * - ✅ Presets de sincronização
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { captionSyncService, SyncConfig, SpeechAnalysis, TranscriptionWord } from '../services/captionSyncService'

interface CaptionSyncControlsProps {
  isVisible: boolean
  onClose: () => void
  words: TranscriptionWord[]
  currentTime: number
  onSyncUpdate: (config: SyncConfig) => void
}

export const CaptionSyncControls: React.FC<CaptionSyncControlsProps> = ({
  isVisible,
  onClose,
  words,
  currentTime,
  onSyncUpdate
}) => {
  const [config, setConfig] = useState<SyncConfig>(captionSyncService.getSyncStats().config)
  const [analysis, setAnalysis] = useState<SpeechAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Executar análise automática quando palavras mudarem
  useEffect(() => {
    if (words.length > 0 && !analysis) {
      analyzeCurrentSpeech()
    }
  }, [words])

  const analyzeCurrentSpeech = async () => {
    if (!words.length) return
    
    setIsAnalyzing(true)
    console.log('🧠 Iniciando análise de fala...')
    
    try {
      const speechAnalysis = captionSyncService.analyzeSpeechPatterns(words)
      setAnalysis(speechAnalysis)
      
      // Aplicar configuração otimizada automaticamente
      const optimizedConfig = getOptimizedConfig(speechAnalysis)
      setConfig(optimizedConfig)
      captionSyncService.updateConfig(optimizedConfig)
      onSyncUpdate(optimizedConfig)
      
      console.log('✅ Análise completa e configuração otimizada aplicada')
    } catch (error) {
      console.error('❌ Erro na análise:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getOptimizedConfig = (speechAnalysis: SpeechAnalysis): SyncConfig => {
    const currentConfig = { ...config }
    
    // Ajustar baseado na velocidade de fala - sempre conservador
    if (speechAnalysis.speechRate > 3.5) {
      // Fala rápida - frases muito pequenas e mais tempo
      currentConfig.wordsPerCaption = 1
      currentConfig.bufferTime = 0.4
      currentConfig.minDisplayTime = 0.8
    } else if (speechAnalysis.speechRate < 1.5) {
      // Fala lenta - frases pequenas com muito tempo
      currentConfig.wordsPerCaption = 2
      currentConfig.bufferTime = 0.7
      currentConfig.minDisplayTime = 1.2
    } else {
      // Fala normal - configuração conservadora
      currentConfig.wordsPerCaption = 2
      currentConfig.bufferTime = 0.5
      currentConfig.minDisplayTime = 1.0
    }
    
    // Ajustar para pausas frequentes
    if (speechAnalysis.pauseCount > speechAnalysis.totalDuration / 10) {
      currentConfig.pauseThreshold = 0.6 // Pausas mais sensíveis
    }
    
    return currentConfig
  }

  const updateConfigValue = (key: keyof SyncConfig, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    captionSyncService.updateConfig(newConfig)
    onSyncUpdate(newConfig)
  }

  const applyPreset = (presetName: string) => {
    let presetConfig: Partial<SyncConfig>
    
    switch (presetName) {
      case 'fast':
        presetConfig = {
          wordsPerCaption: 1,
          bufferTime: 0.3,
          minDisplayTime: 0.8,
          maxDisplayTime: 2.0,
          adaptToSpeechRate: true
        }
        break
      case 'normal':
        presetConfig = {
          wordsPerCaption: 2,
          bufferTime: 0.5,
          minDisplayTime: 1.0,
          maxDisplayTime: 3.0,
          adaptToSpeechRate: true
        }
        break
      case 'slow':
        presetConfig = {
          wordsPerCaption: 3,
          bufferTime: 0.7,
          minDisplayTime: 1.5,
          maxDisplayTime: 4.0,
          adaptToSpeechRate: true
        }
        break
      case 'precise':
        presetConfig = {
          wordsPerCaption: 2,
          bufferTime: 0.4,
          minDisplayTime: 1.2,
          maxDisplayTime: 3.5,
          adaptToSpeechRate: false
        }
        break
      default:
        return
    }
    
    const newConfig = { ...config, ...presetConfig }
    setConfig(newConfig)
    captionSyncService.updateConfig(newConfig)
    onSyncUpdate(newConfig)
    
    console.log(`🎛️ Preset "${presetName}" aplicado`)
  }

  const testSyncAccuracy = () => {
    setPreviewMode(!previewMode)
    console.log(`🔍 Modo preview: ${!previewMode ? 'ATIVADO' : 'DESATIVADO'}`)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold text-white">🎛️ Sincronização Avançada</h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          
          {/* Status da Análise */}
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 font-semibold">
                  {analysis ? '✅ Análise Concluída' : '⏳ Analisando padrões de fala...'}
                </p>
                {analysis && (
                  <p className="text-gray-400 text-sm">
                    {analysis.speechRate.toFixed(2)} palavras/segundo • {analysis.pauseCount} pausas • 
                    {analysis.recommendedWordsPerCaption} palavras/legenda recomendadas
                  </p>
                )}
              </div>
              <Button
                onClick={analyzeCurrentSpeech}
                disabled={isAnalyzing || !words.length}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? '🔄 Analisando...' : '🧠 Analisar Novamente'}
              </Button>
            </div>
          </div>
        </div>

        {/* Controles Principais */}
        <div className="p-6 space-y-8">
          
          {/* Seção 1: Presets Rápidos */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              ⚡ Presets de Sincronização
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                onClick={() => applyPreset('fast')}
                className="bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 text-red-300"
              >
                🚀 Fala Rápida
              </Button>
              <Button
                onClick={() => applyPreset('normal')}
                className="bg-green-600/20 border border-green-500/50 hover:bg-green-600/30 text-green-300"
              >
                ⚖️ Normal
              </Button>
              <Button
                onClick={() => applyPreset('slow')}
                className="bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 text-blue-300"
              >
                🐌 Fala Lenta
              </Button>
              <Button
                onClick={() => applyPreset('precise')}
                className="bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/30 text-purple-300"
              >
                🎯 Precisão
              </Button>
            </div>
          </div>

          {/* Seção 2: Offset Global */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🎛️ Ajuste de Timing
            </h3>
            
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">
                  Offset Global: <span className="text-blue-300 font-bold">{config.globalOffset}ms</span>
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateConfigValue('globalOffset', config.globalOffset - 100)}
                    className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1"
                  >
                    -100ms
                  </Button>
                  <Button
                    onClick={() => updateConfigValue('globalOffset', 0)}
                    className="bg-gray-600 hover:bg-gray-700 text-xs px-2 py-1"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => updateConfigValue('globalOffset', config.globalOffset + 100)}
                    className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                  >
                    +100ms
                  </Button>
                </div>
              </div>
              <input
                type="range"
                min="-2000"
                max="2000"
                step="50"
                value={config.globalOffset}
                onChange={(e) => updateConfigValue('globalOffset', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>-2s</span>
                <span>0s</span>
                <span>+2s</span>
              </div>
            </div>
          </div>

          {/* Seção 3: Configurações Avançadas */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Coluna 1: Agrupamento */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white">📝 Agrupamento</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Palavras por Legenda: <span className="text-blue-300">{config.wordsPerCaption}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={config.wordsPerCaption}
                    onChange={(e) => updateConfigValue('wordsPerCaption', Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.adaptToSpeechRate}
                    onChange={(e) => updateConfigValue('adaptToSpeechRate', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-300">
                    Adaptar ao ritmo de fala automaticamente
                  </label>
                </div>
              </div>
            </div>

            {/* Coluna 2: Timing */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white">⏱️ Timing</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Buffer de Sincronização: <span className="text-blue-300">{config.bufferTime.toFixed(2)}s</span>
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={config.bufferTime}
                    onChange={(e) => updateConfigValue('bufferTime', Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Tempo Mínimo: <span className="text-blue-300">{config.minDisplayTime.toFixed(1)}s</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={config.minDisplayTime}
                    onChange={(e) => updateConfigValue('minDisplayTime', Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Análise Visual */}
          {analysis && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📊 Análise de Fala
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-300">
                    {analysis.speechRate.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">palavras/segundo</div>
                  <div className="text-xs text-blue-400 mt-1">
                    {analysis.speechRate > 3.5 ? '🚀 Rápida' : 
                     analysis.speechRate < 1.5 ? '🐌 Lenta' : '⚖️ Normal'}
                  </div>
                </div>
                
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-300">
                    {analysis.pauseCount}
                  </div>
                  <div className="text-sm text-gray-400">pausas detectadas</div>
                  <div className="text-xs text-green-400 mt-1">
                    {analysis.pauseCount > 5 ? '🎭 Expressiva' : '💬 Fluente'}
                  </div>
                </div>
                
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-300">
                    {analysis.recommendedWordsPerCaption}
                  </div>
                  <div className="text-sm text-gray-400">palavras recomendadas</div>
                  <div className="text-xs text-purple-400 mt-1">
                    ✨ Otimizado
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seção 5: Teste de Precisão */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🔍 Teste de Precisão
            </h3>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={testSyncAccuracy}
                className={`${previewMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                {previewMode ? '✅ Preview Ativo' : '👁️ Ativar Preview'}
              </Button>
              
              <Button
                onClick={() => captionSyncService.adjustGlobalOffset(-200)}
                className="bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 text-red-300"
              >
                ⏪ Atrasar 200ms
              </Button>
              
              <Button
                onClick={() => captionSyncService.adjustGlobalOffset(200)}
                className="bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 text-blue-300"
              >
                ⏩ Adiantar 200ms
              </Button>
            </div>
            
            {previewMode && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-300 text-sm">
                  🔍 <strong>Modo Preview Ativo:</strong> As legendas mostrarão informações de timing em tempo real.
                  Use os controles acima para ajustar até que a sincronização fique perfeita.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              ⚡ Configurações aplicadas em tempo real
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  // Reset para padrões conservadores
                  const defaultConfig: SyncConfig = {
                    bufferTime: 0.5,
                    minDisplayTime: 1.0,
                    maxDisplayTime: 3.5,
                    wordsPerCaption: 2,
                    adaptToSpeechRate: true,
                    pauseThreshold: 0.8,
                    speedThreshold: 4.0,
                    globalOffset: 0,
                    adaptiveOffset: true
                  }
                  setConfig(defaultConfig)
                  captionSyncService.updateConfig(defaultConfig)
                  onSyncUpdate(defaultConfig)
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                🔄 Restaurar Padrões
              </Button>
              <Button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ✅ Aplicar e Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaptionSyncControls 