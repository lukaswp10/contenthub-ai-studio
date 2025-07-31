/**
 * 🏗️ BLAZE DATA PROVIDER - Estado Central
 * 
 * Gerencia todos os dados da Blaze 
 * Fonte única de verdade para o sistema
 * ✅ FASE 1: Sistema antigo removido para evitar conflitos
 */
import React, { createContext, useContext } from 'react'
import { useBlazeData } from '../hooks/useBlazeData'
import type { BlazeNumber } from '@/types/real-algorithms.types'

// ===== TIPOS =====
export interface BlazeNumberWithSource extends BlazeNumber {
  source: 'blaze' | 'csv'
}

// ===== CONTEXTO SIMPLIFICADO =====
interface BlazeContextType {
  // Dados
  numbers: BlazeNumberWithSource[]
  lastNumber: BlazeNumberWithSource | null
  
  // Ações
  addCSVData: (csvNumbers: BlazeNumberWithSource[]) => void
  
  // Estado Blaze
  isConnected: boolean
  connectionStatus: string
  connect: () => Promise<void>
  disconnect: () => void
}

const BlazeContext = createContext<BlazeContextType | null>(null)

// ===== PROVIDER SIMPLIFICADO =====
export function BlazeDataProvider({ children }: { children: React.ReactNode }) {
  // Hook apenas para dados da Blaze (sem sistema de predição antigo)
  const blazeData = useBlazeData()

  const value: BlazeContextType = {
    // Dados
    numbers: blazeData.numbers,
    lastNumber: blazeData.lastNumber,
    
    // Ações
    addCSVData: blazeData.addCSVData,
    
    // Estado Blaze
    isConnected: blazeData.isConnected,
    connectionStatus: blazeData.connectionStatus,
    connect: blazeData.connect,
    disconnect: blazeData.disconnect
  }

  return (
    <BlazeContext.Provider value={value}>
      {children}
    </BlazeContext.Provider>
  )
}

// ===== HOOK =====
export function useBlazeContext() {
  const context = useContext(BlazeContext)
  if (!context) {
    throw new Error('useBlazeContext deve ser usado dentro de BlazeDataProvider')
  }
  return context
} 