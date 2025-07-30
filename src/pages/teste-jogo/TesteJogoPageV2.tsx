/**
 * 🚀 BLAZE ANALYZER V2 - ARQUITETURA MODULAR
 * 
 * FLUXO CORRETO: Blaze → Algoritmos → Predição → Aprendizado
 * Arquitetura organizada em componentes separados
 */
import React from 'react'
import { BlazeDataProvider } from './components/BlazeDataProvider'
import { BlazeInterface } from './components/BlazeInterface'

export default function TesteJogoPageV2() {
  return (
    <BlazeDataProvider>
      <BlazeInterface />
    </BlazeDataProvider>
  )
} 