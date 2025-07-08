import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CustomModalProps {
  isOpen: boolean
  title: string
  placeholder?: string
  defaultValue?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  title,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel
}) => {
  const [inputValue, setInputValue] = useState(defaultValue)

  const handleConfirm = useCallback(() => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim())
      setInputValue('')
    }
  }, [inputValue, onConfirm])

  const handleCancel = useCallback(() => {
    onCancel()
    setInputValue('')
  }, [onCancel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleConfirm, handleCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] border border-gray-600">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-4 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          autoFocus
        />
        
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook para usar o modal
export const useCustomModal = () => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title: string
    placeholder?: string
    defaultValue?: string
    resolve?: (value: string | null) => void
  }>({
    isOpen: false,
    title: '',
    placeholder: '',
    defaultValue: ''
  })

  const showModal = useCallback((
    title: string,
    placeholder?: string,
    defaultValue?: string
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        placeholder,
        defaultValue,
        resolve
      })
    })
  }, [])

  const handleConfirm = useCallback((value: string) => {
    modalState.resolve?.(value)
    setModalState(prev => ({ ...prev, isOpen: false }))
  }, [modalState])

  const handleCancel = useCallback(() => {
    modalState.resolve?.(null)
    setModalState(prev => ({ ...prev, isOpen: false }))
  }, [modalState])

  const ModalComponent = useCallback(() => (
    <CustomModal
      isOpen={modalState.isOpen}
      title={modalState.title}
      placeholder={modalState.placeholder}
      defaultValue={modalState.defaultValue}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ), [modalState, handleConfirm, handleCancel])

  return { showModal, ModalComponent }
} 