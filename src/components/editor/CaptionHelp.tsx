import React, { useState } from 'react'
import { Button } from '../ui/button'

interface CaptionHelpProps {
  isVisible: boolean
  onClose: () => void
}

export const CaptionHelp: React.FC<CaptionHelpProps> = ({ isVisible, onClose }) => {
  const [currentTip, setCurrentTip] = useState(0)

  const tips = [
    {
      icon: '🔒',
      title: 'Ativar Modo de Edição',
      description: 'Clique no botão "🔒 Editar" para ativar o modo de edição de legendas.',
      detail: 'Quando ativo, as legendas ficarão clicáveis e você verá um pequeno indicador azul.'
    },
    {
      icon: '👆',
      title: 'Clique Simples',
      description: 'Clique em qualquer legenda para editá-la rapidamente.',
      detail: 'Um editor inline aparecerá permitindo edição rápida do texto.'
    },
    {
      icon: '👆👆',
      title: 'Duplo Clique',
      description: 'Duplo clique em uma legenda para abrir o editor avançado.',
      detail: 'O editor avançado permite editar múltiplas legendas, ajustar tempos e buscar texto.'
    },
    {
      icon: '📝',
      title: 'Editor Avançado',
      description: 'Use o botão "📝 Editor" para abrir o editor completo.',
      detail: 'No editor avançado você pode: arrastar para reordenar, editar tempos, buscar texto e adicionar novas legendas.'
    },
    {
      icon: '🔍',
      title: 'Buscar e Filtrar',
      description: 'Use a barra de busca para encontrar legendas específicas.',
      detail: 'Digite qualquer palavra para filtrar as legendas que contêm esse termo.'
    },
    {
      icon: '⌨️',
      title: 'Atalhos do Teclado',
      description: 'Use atalhos para editar mais rapidamente.',
      detail: 'Enter para salvar, Esc para cancelar, Ctrl+Enter para salvar no editor avançado.'
    }
  ]

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length)
  }

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length)
  }

  if (!isVisible) return null

  const tip = tips[currentTip]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">💡</span>
            </div>
            <h2 className="text-xl font-bold text-white">Dicas de Uso</h2>
          </div>
          <Button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white"
          >
            ✕
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{tip.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{tip.title}</h3>
            <p className="text-gray-300 mb-4">{tip.description}</p>
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
              {tip.detail}
            </div>
          </div>

          {/* Navegação */}
          <div className="flex items-center justify-between">
            <Button
              onClick={prevTip}
              disabled={currentTip === 0}
              className="bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
            >
              ← Anterior
            </Button>
            
            <div className="flex space-x-2">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTip(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTip ? 'bg-purple-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <Button
              onClick={nextTip}
              disabled={currentTip === tips.length - 1}
              className="bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
            >
              Próximo →
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {currentTip + 1} de {tips.length} dicas
            </span>
            <Button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              Entendi! 🚀
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 