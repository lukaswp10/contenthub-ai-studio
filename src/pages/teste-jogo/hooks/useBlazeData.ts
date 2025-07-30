/**
 * 🎯 HOOK BLAZE DATA - Captura dados reais da Blaze
 * 
 * Responsável por:
 * - Conectar com Chromium
 * - Capturar números da Blaze
 * - Gerenciar histórico
 */
import { useState, useEffect, useRef } from 'react'
import blazeRealDataService from '@/services/blazeRealDataService'
import type { BlazeNumberWithSource } from '../components/BlazeDataProvider'
import { BLAZE_CONFIG, logDebug } from '../config/BlazeConfig'

export function useBlazeData() {
  const [numbers, setNumbers] = useState<BlazeNumberWithSource[]>([])
  const [lastNumber, setLastNumber] = useState<BlazeNumberWithSource | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Desconectado')
  
  // Controle de duplicação
  const processedIds = useRef(new Set<string>())

  // ✅ CORREÇÃO 2: Carregar dados históricos do Supabase quando componente monta
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const historicalData = await blazeRealDataService.getAllUnifiedData()
        if (historicalData.length > 0) {
          const blazeNumbers = historicalData.map(item => ({
            id: item.round_id || item.id || `fallback_${Date.now()}`,
            number: item.number,
            color: item.color,
            timestamp: new Date(item.timestamp_blaze || Date.now()).getTime(),
            source: (item.source === 'blaze_real_api' ? 'blaze' : 'csv') as 'blaze' | 'csv'
          }))
          
          // ✅ CORREÇÃO: Filtrar duplicatas para evitar keys duplicadas no React
          const uniqueNumbers = blazeNumbers.filter((num, index, self) => 
            index === self.findIndex(n => n.id === num.id)
          )
          
          setNumbers(uniqueNumbers)
          console.log(`📊 HISTÓRICO: ${uniqueNumbers.length} números únicos carregados (${blazeNumbers.length - uniqueNumbers.length} duplicatas removidas)`)
        }
      } catch (error) {
        console.error('❌ Erro carregando histórico:', error)
      }
      
      // ✅ MELHORIA 1: Auto-conectar após carregar histórico
      try {
        setConnectionStatus('Conectando automaticamente...')
        await blazeRealDataService.startCapturing()
        setIsConnected(true)
        setConnectionStatus('Conectado automaticamente')
        console.log('🚀 AUTO-CONECTADO: Sistema conectou automaticamente à Blaze')
      } catch (error) {
        setIsConnected(false)
        setConnectionStatus('Erro na conexão automática')
        console.error('❌ Erro na conexão automática:', error)
      }
    }
    
    loadHistoricalData()
  }, []) // Executar uma vez na montagem

  useEffect(() => {
    // Listener para dados da Blaze
    const handleBlazeData = (event: Event) => {
      const customEvent = event as CustomEvent
      const data = customEvent.detail
      
      // Evitar duplicação
      if (processedIds.current.has(data.round_id)) {
        logDebug('🚫 Duplicata detectada:', data.round_id)
        return
      }
      processedIds.current.add(data.round_id)
      
      const newNumber: BlazeNumberWithSource = {
        id: data.round_id,
        number: data.number,
        color: data.color,
        timestamp: Date.now(),
        source: 'blaze'
      }
      
      setNumbers(prev => {
        const updated = [...prev, newNumber]
        // ✅ CORREÇÃO: Filtrar duplicatas para evitar keys duplicadas
        const uniqueUpdated = updated.filter((num, index, self) => 
          index === self.findIndex(n => n.id === num.id)
        )
        return uniqueUpdated
      })
      setLastNumber(newNumber)
      
      // ETAPA 1: Log mínimo - só dados essenciais
      console.log(`🎯 BLAZE: ${newNumber.number} (${newNumber.color})`)
    }

    const handleConnectionError = () => {
      setIsConnected(false)
      setConnectionStatus('Erro de conexão')
      console.error('❌ Erro de conexão com a Blaze')
    }

    // Adicionar listeners
    window.addEventListener('blazeRealData', handleBlazeData)
    window.addEventListener('blazeConnectionError', handleConnectionError)

    return () => {
      window.removeEventListener('blazeRealData', handleBlazeData)
      window.removeEventListener('blazeConnectionError', handleConnectionError)
    }
  }, [])

  // Função para conectar
  const connect = async () => {
    try {
      setConnectionStatus('Conectando...')
      await blazeRealDataService.startCapturing()
      setIsConnected(true)
      setConnectionStatus('Conectado')
      console.log('✅ Conectado à Blaze')
    } catch (error) {
      setIsConnected(false)
      setConnectionStatus('Erro ao conectar')
      console.error('❌ Erro ao conectar:', error)
      throw error
    }
  }

  // Função para desconectar
  const disconnect = () => {
    blazeRealDataService.stopCapturing()
    setIsConnected(false)
    setConnectionStatus('Desconectado')
    console.log('⏹️ Desconectado da Blaze')
    
    // Limpar stats se configurado
    if (BLAZE_CONFIG.RESET_STATS_ON_DISCONNECT) {
      setNumbers([])
      setLastNumber(null)
      processedIds.current.clear()
    }
  }

  // Função para adicionar dados CSV
  const addCSVData = (csvNumbers: BlazeNumberWithSource[]) => {
    setNumbers(prev => {
      // Filtrar duplicatas baseado no ID
      const existingIds = new Set(prev.map(n => n.id))
      const newNumbers = csvNumbers.filter(n => !existingIds.has(n.id))
      
      if (newNumbers.length > 0) {
        console.log(`📄 CSV: ${newNumbers.length} números adicionados`)
        const updated = [...prev, ...newNumbers]
        // Ordenar por timestamp - histórico ilimitado
        return updated
          .sort((a, b) => a.timestamp - b.timestamp)
      }
      
      return prev
    })
  }

  return {
    numbers,
    lastNumber,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    addCSVData
  }
} 