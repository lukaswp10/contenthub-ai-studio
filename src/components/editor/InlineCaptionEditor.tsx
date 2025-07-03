import React, { useState, useRef, useEffect } from 'react'
import { Caption } from '../../types/caption.types'
import { Button } from '../ui/button'

interface InlineCaptionEditorProps {
  caption: Caption | null
  isVisible: boolean
  onSave: (newText: string) => void
  onCancel: () => void
  position?: { x: number; y: number }
}

export const InlineCaptionEditor: React.FC<InlineCaptionEditorProps> = ({
  caption,
  isVisible,
  onSave,
  onCancel,
  position = { x: 0, y: 0 }
}) => {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Atualizar texto quando a legenda muda
  useEffect(() => {
    if (caption) {
      setText(caption.text)
    }
  }, [caption])

  // Focar no input quando fica visível
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isVisible])

  // Lidar com teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim())
    }
  }

  if (!isVisible || !caption) return null

  return (
    <div
      className="fixed z-50 bg-gray-900 border-2 border-blue-500 rounded-lg shadow-xl p-3 min-w-[300px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-400">Editando legenda</span>
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
        placeholder="Digite o texto da legenda..."
      />
      
      <div className="flex justify-end space-x-2 mt-2">
        <Button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 text-xs"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 text-xs"
        >
          Salvar
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        Enter para salvar • Esc para cancelar
      </div>
    </div>
  )
} 