/**
 * 📢 NOTIFICAÇÃO DE SINCRONIZAÇÃO MELHORADA - ClipsForge Pro
 * 
 * Componente que informa o usuário sobre as melhorias aplicadas
 * ao sistema de sincronização de legendas
 */

import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'

interface SyncNotificationProps {
  isVisible: boolean
  onClose: () => void
  speechRate?: number
  improvement?: string
}

export const SyncNotification: React.FC<SyncNotificationProps> = ({
  isVisible,
  onClose,
  speechRate,
  improvement
}) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 2
        })
      }, 50)

      // Auto-fechar após 5 segundos
      const autoClose = setTimeout(() => {
        onClose()
      }, 5000)

      return () => {
        clearInterval(interval)
        clearTimeout(autoClose)
      }
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-right-full duration-500">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-2xl border border-blue-400/30 p-6 max-w-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="font-bold text-lg">🎯 Sincronização Melhorada!</h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white/70 hover:text-white p-1 h-auto"
          >
            ✕
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-3">
          <p className="text-blue-100 text-sm">
            ✅ Sistema de sincronização inteligente ativado
          </p>
          
          {speechRate && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-blue-200 mb-1">Velocidade de fala detectada:</div>
              <div className="text-lg font-bold text-white">
                {speechRate.toFixed(1)} palavras/segundo
              </div>
              <div className="text-xs text-blue-300 mt-1">
                {speechRate > 3.5 ? '🚀 Rápida' : 
                 speechRate < 1.5 ? '🐌 Lenta' : '⚖️ Normal'}
              </div>
            </div>
          )}
          
          {improvement && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
              <div className="text-xs text-green-200 mb-1">Melhoria aplicada:</div>
              <div className="text-sm text-green-100 font-medium">
                {improvement}
              </div>
            </div>
          )}

          {/* Barra de Progresso */}
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-400 h-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-xs text-blue-200 text-center">
            Legendas agora sincronizadas com o ritmo da fala
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => {
              // Abrir configurações avançadas
              console.log('🎛️ Abrindo configurações avançadas de sincronização')
            }}
            variant="outline"
            className="flex-1 text-xs bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            ⚙️ Configurar
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 text-xs bg-green-600 hover:bg-green-700"
          >
            ✅ Entendi
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SyncNotification 