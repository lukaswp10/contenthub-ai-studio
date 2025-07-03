import React, { useState, useRef, useEffect } from 'react'
import { Caption, CaptionSegment } from '../../types/caption.types'
import { Button } from '../ui/button'
import { formatTime } from '../../utils/timeUtils'

interface CaptionEditorProps {
  isOpen: boolean
  onClose: () => void
  captions: CaptionSegment[]
  currentTime: number
  onCaptionUpdate: (captionId: string, newText: string) => void
  onCaptionTimeUpdate: (captionId: string, start: number, end: number) => void
  onCaptionDelete: (captionId: string) => void
  onCaptionAdd: (start: number, end: number, text: string) => void
  onSeekTo: (time: number) => void
  selectedCaptionId?: string
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  isOpen,
  onClose,
  captions,
  currentTime,
  onCaptionUpdate,
  onCaptionTimeUpdate,
  onCaptionDelete,
  onCaptionAdd,
  onSeekTo,
  selectedCaptionId
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Focar no textarea quando iniciar edição
  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editingId])

  // Filtrar legendas com base na pesquisa
  const filteredCaptions = captions.filter(caption =>
    caption.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Iniciar edição
  const startEditing = (caption: CaptionSegment) => {
    setEditingId(caption.id)
    setEditText(caption.text)
  }

  // Salvar edição
  const saveEditing = () => {
    if (editingId && editText.trim()) {
      onCaptionUpdate(editingId, editText.trim())
    }
    setEditingId(null)
    setEditText('')
  }

  // Cancelar edição
  const cancelEditing = () => {
    setEditingId(null)
    setEditText('')
  }

  // Lidar com teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveEditing()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, captionId: string) => {
    setDraggedItem(captionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedItem && draggedItem !== targetId) {
      console.log('Reordenando legendas:', draggedItem, 'para posição de', targetId)
    }
    setDraggedItem(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">📝</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Editor de Legendas</h2>
            <span className="text-gray-400">({filteredCaptions.length} legendas)</span>
          </div>
          <Button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white"
          >
            ✕ Fechar
          </Button>
        </div>

        {/* Barra de busca */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar nas legendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-2 pl-10 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
          </div>
        </div>

        {/* Lista de legendas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
          {filteredCaptions.map((caption, index) => (
            <div
              key={caption.id}
              draggable
              onDragStart={(e) => handleDragStart(e, caption.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, caption.id)}
              className={`
                group relative bg-gray-800 rounded-xl p-4 border-2 transition-all duration-200 cursor-move
                ${selectedCaptionId === caption.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600'}
                ${draggedItem === caption.id ? 'opacity-50' : ''}
                ${currentTime >= caption.start && currentTime <= caption.end ? 'ring-2 ring-yellow-400' : ''}
                hover:border-gray-500 hover:bg-gray-750
              `}
            >
              {/* Cabeçalho da legenda */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  <button
                    onClick={() => onSeekTo(caption.start)}
                    className="text-sm text-blue-400 hover:text-blue-300 bg-blue-900/20 px-2 py-1 rounded"
                  >
                    {formatTime(caption.start)} → {formatTime(caption.end)}
                  </button>
                  <span className="text-xs text-gray-500">
                    {(caption.end - caption.start).toFixed(1)}s
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(caption)}
                    className="text-blue-400 hover:text-blue-300 p-1 rounded"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onCaptionDelete(caption.id)}
                    className="text-red-400 hover:text-red-300 p-1 rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Texto da legenda */}
              {editingId === caption.id ? (
                <div className="space-y-2">
                  <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Digite o texto da legenda..."
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={cancelEditing}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 text-sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={saveEditing}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 text-sm"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => startEditing(caption)}
                  className="text-white cursor-pointer hover:text-gray-300 transition-colors"
                >
                  {caption.text}
                </div>
              )}

              {/* Indicador de tempo atual */}
              {currentTime >= caption.start && currentTime <= caption.end && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
            </div>
          ))}
        </div>

        {/* Footer com ações */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onCaptionAdd(currentTime, currentTime + 3, 'Nova legenda')}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                ➕ Adicionar Legenda
              </Button>
              <span className="text-sm text-gray-400">
                ⌨️ Ctrl+Enter para salvar, Esc para cancelar
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Arraste para reordenar • Clique no tempo para navegar
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 