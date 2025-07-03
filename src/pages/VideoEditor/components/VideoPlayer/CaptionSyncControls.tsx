import React, { memo, useCallback, useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { useCaptionSync, useCaptionSyncActions, useCaptions } from '../../../../stores/videoEditorStore'
import { formatTime } from '../../../../utils/timeUtils'

interface CaptionSyncControlsProps {
  isVisible: boolean
  onToggle: () => void
}

export const CaptionSyncControls = memo(({ isVisible, onToggle }: CaptionSyncControlsProps) => {
  
  // 🏪 Store states
  const {
    captionSyncAccuracy,
    adaptiveSync,
    audioAnalysisEnabled,
    captionSmoothTransitions,
    captionWordThreshold,
    captionAutoAdjust,
    realTimePreview,
    syncOffsetHistory,
    lastSyncTimestamp,
    captionPlaybackSpeed,
    captionSyncMode,
    captionDelayOffset
  } = useCaptionSync()

  // 🏪 Store actions
  const {
    setCaptionSyncAccuracy,
    setAdaptiveSync,
    setAudioAnalysisEnabled,
    setCaptionSmoothTransitions,
    setCaptionWordThreshold,
    setCaptionAutoAdjust,
    setRealTimePreview,
    addSyncOffset,
    analyzeCaptionTiming,
    autoSyncCaptions,
    resetCaptionSync,
    calculateOptimalSpeed,
    setCaptionPlaybackSpeed,
    setCaptionSyncMode,
    setCaptionDelayOffset
  } = useCaptionSyncActions()

  const { generatedCaptions } = useCaptions()

  // 🔄 Local states
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<string | null>(null)

  // 🎯 Handler: Analisar timing
  const handleAnalyzeTiming = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      await analyzeCaptionTiming()
      setSyncResults(`✅ Análise concluída. ${syncOffsetHistory.length} pontos de sincronização registrados.`)
    } catch (error) {
      console.error('❌ Erro na análise:', error)
      setSyncResults('❌ Erro durante análise. Tente novamente.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [analyzeCaptionTiming, syncOffsetHistory.length])

  // 🎯 Handler: Sincronização automática
  const handleAutoSync = useCallback(async () => {
    setIsSyncing(true)
    try {
      await autoSyncCaptions()
      setSyncResults(`🎯 Sincronização automática concluída. ${generatedCaptions.length} legendas otimizadas.`)
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
      setSyncResults('❌ Erro durante sincronização. Tente novamente.')
    } finally {
      setIsSyncing(false)
    }
  }, [autoSyncCaptions, generatedCaptions.length])

  // 🎯 Handler: Reset
  const handleReset = useCallback(() => {
    resetCaptionSync()
    setSyncResults('🔄 Configurações de sincronização resetadas.')
  }, [resetCaptionSync])

  // 🎯 Handler: Ajuste de offset
  const handleOffsetChange = useCallback((value: number) => {
    setCaptionDelayOffset(value)
    addSyncOffset(Date.now(), value, 85) // 85% accuracy for manual adjustments
  }, [setCaptionDelayOffset, addSyncOffset])

  if (!isVisible) return null

  return (
    <div className="caption-sync-controls absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
      
      {/* 🎯 HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🎯 Sincronização de Legendas
        </h3>
        <Button
          onClick={onToggle}
          className="text-gray-400 hover:text-white p-1"
          variant="ghost"
        >
          ✕
        </Button>
      </div>

      {/* 📊 STATUS ATUAL */}
      <div className="status-panel mb-4 p-3 bg-black/40 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{generatedCaptions.length}</div>
            <div className="text-gray-400">Legendas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{captionPlaybackSpeed.toFixed(1)}x</div>
            <div className="text-gray-400">Velocidade</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">{captionDelayOffset}ms</div>
            <div className="text-gray-400">Offset</div>
          </div>
        </div>
      </div>

      {/* 🎮 CONTROLES PRINCIPAIS */}
      <div className="main-controls grid grid-cols-2 gap-4 mb-4">
        
        {/* Modo de Sincronização */}
        <div className="control-group">
          <label className="block text-sm text-gray-300 mb-2">Modo de Sincronização:</label>
          <div className="flex gap-2">
            <Button
              onClick={() => setCaptionSyncMode('auto')}
              className={`px-3 py-1 text-sm transition-all ${
                captionSyncMode === 'auto' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🤖 Auto
            </Button>
            <Button
              onClick={() => setCaptionSyncMode('manual')}
              className={`px-3 py-1 text-sm transition-all ${
                captionSyncMode === 'manual' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              ✋ Manual
            </Button>
          </div>
        </div>

        {/* Precisão */}
        <div className="control-group">
          <label className="block text-sm text-gray-300 mb-2">Precisão:</label>
          <select
            value={captionSyncAccuracy}
            onChange={(e) => setCaptionSyncAccuracy(e.target.value as any)}
            className="w-full bg-black/20 border border-white/20 rounded-lg p-2 text-white text-sm"
          >
            <option value="low">🟢 Baixa (Rápida)</option>
            <option value="medium">🟡 Média (Equilibrada)</option>
            <option value="high">🟠 Alta (Precisa)</option>
            <option value="ultra">🔴 Ultra (Máxima)</option>
          </select>
        </div>
      </div>

      {/* 🎛️ CONTROLES DE AJUSTE FINO */}
      <div className="fine-controls grid grid-cols-2 gap-4 mb-4">
        
        {/* Velocidade de Reprodução */}
        <div className="control-group">
          <label className="block text-sm text-gray-300 mb-2">
            Velocidade: {captionPlaybackSpeed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={captionPlaybackSpeed}
            onChange={(e) => setCaptionPlaybackSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg slider"
          />
        </div>

        {/* Offset de Delay */}
        <div className="control-group">
          <label className="block text-sm text-gray-300 mb-2">
            Offset: {captionDelayOffset}ms
          </label>
          <input
            type="range"
            min="-2000"
            max="2000"
            step="50"
            value={captionDelayOffset}
            onChange={(e) => handleOffsetChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg slider"
          />
        </div>
      </div>

      {/* 🎯 AÇÕES AUTOMÁTICAS */}
      <div className="auto-actions flex gap-2 mb-4">
        <Button
          onClick={handleAnalyzeTiming}
          disabled={isAnalyzing || generatedCaptions.length === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm"
        >
          {isAnalyzing ? '🔍 Analisando...' : '🔍 Analisar Timing'}
        </Button>
        
        <Button
          onClick={handleAutoSync}
          disabled={isSyncing || generatedCaptions.length === 0}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 text-sm"
        >
          {isSyncing ? '🎯 Sincronizando...' : '🎯 Auto-Sync'}
        </Button>
        
        <Button
          onClick={handleReset}
          className="px-4 bg-red-600 hover:bg-red-700 text-white py-2 text-sm"
        >
          🔄 Reset
        </Button>
      </div>

      {/* 🏷️ CONFIGURAÇÕES AVANÇADAS */}
      <div className="advanced-settings p-3 bg-black/20 rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={adaptiveSync}
              onChange={(e) => setAdaptiveSync(e.target.checked)}
              className="rounded"
            />
            🧠 Sync Adaptativo
          </label>
          
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={captionSmoothTransitions}
              onChange={(e) => setCaptionSmoothTransitions(e.target.checked)}
              className="rounded"
            />
            ✨ Transições Suaves
          </label>
          
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={captionAutoAdjust}
              onChange={(e) => setCaptionAutoAdjust(e.target.checked)}
              className="rounded"
            />
            ⚙️ Auto-Ajuste
          </label>
          
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={realTimePreview}
              onChange={(e) => setRealTimePreview(e.target.checked)}
              className="rounded"
            />
            👁️ Preview em Tempo Real
          </label>
        </div>
      </div>

      {/* 📋 RESULTADOS */}
      {syncResults && (
        <div className="results mt-4 p-3 bg-black/40 rounded-lg">
          <div className="text-sm text-gray-300">
            {syncResults}
          </div>
          {lastSyncTimestamp > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Última sincronização: {new Date(lastSyncTimestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

CaptionSyncControls.displayName = 'CaptionSyncControls' 