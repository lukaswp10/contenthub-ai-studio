/**
 * 🎉 DEMONSTRAÇÃO DO SISTEMA DE SINCRONIZAÇÃO MELHORADO - ClipsForge Pro
 * 
 * Componente que demonstra as melhorias implementadas no sistema de legendas
 */

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'

interface SyncSuccessDemoProps {
  isVisible: boolean
  onClose: () => void
}

export const SyncSuccessDemo: React.FC<SyncSuccessDemoProps> = ({
  isVisible,
  onClose
}) => {
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const demoSteps = [
    {
      title: "❌ Problema Anterior",
      description: "Legendas muito rápidas e desalinhadas",
      example: "Esta legenda passava muito rápido e não acompanhava",
      color: "from-red-600 to-red-700",
      speed: "muito rápida"
    },
    {
      title: "⚡ Sistema Inteligente Ativado",
      description: "Análise automática da velocidade de fala",
      example: "Agora detectamos automaticamente o ritmo",
      color: "from-blue-600 to-blue-700",
      speed: "analisando..."
    },
    {
      title: "🎯 Sincronização Perfeita",
      description: "Legendas adaptadas ao ritmo da fala",
      example: "Resultado: legendas perfeitamente sincronizadas",
      color: "from-green-600 to-green-700",
      speed: "otimizada"
    }
  ]

  useEffect(() => {
    if (isVisible && isPlaying) {
      const interval = setInterval(() => {
        setStep(prev => (prev + 1) % demoSteps.length)
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isVisible, isPlaying])

  if (!isVisible) return null

  const currentStep = demoSteps[step]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold text-white">
                🎯 Sistema de Legendas Melhorado!
              </h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Demo Area */}
        <div className="p-8">
          {/* Video Preview Mock */}
          <div className="bg-black rounded-xl mb-6 h-48 flex items-center justify-center relative overflow-hidden">
            <div className="text-gray-500 text-6xl">🎬</div>
            
            {/* Caption Demo */}
            <div className="absolute bottom-4 left-4 right-4">
              <div 
                className={`bg-gradient-to-r ${currentStep.color} text-white px-6 py-3 rounded-xl text-center font-bold shadow-lg transform transition-all duration-500 ${
                  step === 0 ? 'animate-bounce scale-90' : 
                  step === 1 ? 'animate-pulse scale-95' : 
                  'scale-100'
                }`}
              >
                {currentStep.example}
              </div>
            </div>
            
            {/* Speed Indicator */}
            <div className="absolute top-4 right-4">
              <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                📊 {currentStep.speed}
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-2">
              {demoSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === step 
                      ? 'bg-blue-500 scale-125' 
                      : index < step 
                        ? 'bg-green-500' 
                        : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Step Info */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">
              {currentStep.title}
            </h3>
            <p className="text-gray-400">
              {currentStep.description}
            </p>
          </div>

          {/* Features List */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-300 font-semibold mb-2">🧠 Análise Inteligente</div>
              <div className="text-gray-300 text-sm">
                Detecta automaticamente a velocidade de fala e adapta as legendas
              </div>
            </div>
            
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
              <div className="text-green-300 font-semibold mb-2">⚡ Sincronização Perfeita</div>
              <div className="text-gray-300 text-sm">
                Legendas agrupadas no ritmo ideal para leitura
              </div>
            </div>
            
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
              <div className="text-purple-300 font-semibold mb-2">🎛️ Controles Avançados</div>
              <div className="text-gray-300 text-sm">
                Ajuste fino manual para situações específicas
              </div>
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
              <div className="text-yellow-300 font-semibold mb-2">📊 Métricas em Tempo Real</div>
              <div className="text-gray-300 text-sm">
                Visualização da qualidade da sincronização
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isPlaying ? '⏸️ Pausar Demo' : '▶️ Iniciar Demo'}
            </Button>
            
            <Button
              onClick={() => setStep((step + 1) % demoSteps.length)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              ⏭️ Próximo Passo
            </Button>
          </div>

          {/* Success Message */}
          <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-center">
            <p className="text-green-300 font-semibold">
              ✅ Sistema implementado com sucesso!
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Suas legendas agora estão sincronizadas perfeitamente com o áudio
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              🚀 ClipsForge Pro - Sistema de Legendas Inteligente
            </div>
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700"
            >
              🎉 Começar a Usar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyncSuccessDemo 