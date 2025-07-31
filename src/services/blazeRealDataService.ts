/**
 * 🎯 BLAZE REAL DATA SERVICE - ClipsForge Pro
 * 
 * Serviço para captura de dados reais da Blaze em tempo real
 * Múltiplas estratégias: Chromium > Proxy > Direct API
 * 
 * @version 3.0.0 - CHROMIUM INTEGRATION
 * @author ClipsForge Team
 */

import { supabase } from '../lib/supabase'
import { logThrottled, logAlways, logDebug } from '../utils/logThrottler'
import { getBrazilTimestamp, getBrazilDateOnly } from '../utils/timezone'

// ===== TYPES =====

interface BlazeRealData {
  id?: string
  round_id?: string
  number: number
  color: 'red' | 'black' | 'white'
  timestamp_blaze?: string
  source: string
}

interface ChromiumCaptureResult {
  numero: number
  cor: number
  corNome: 'WHITE' | 'RED' | 'BLACK'
  corEmoji: '⚪' | '🔴' | '⚫'
  id: string
  timestamp: string
  url: string
}

interface SystemPrediction {
  predicted_color: 'red' | 'black' | 'white'
  predicted_numbers: number[]
  confidence_percentage: number
  ml_algorithms_used: any
  data_size_used: number
  round_target?: string
}

interface PredictionResult {
  prediction_id: string
  blaze_result_id: string
  is_correct: boolean
  predicted_color: string
  actual_color: string
  predicted_numbers: number[]
  actual_number: number
  number_was_predicted: boolean
  confidence_percentage: number
  time_difference_seconds: number
}

interface SystemPerformance {
  total_predictions: number
  correct_predictions: number
  incorrect_predictions: number
  accuracy_percentage: number
  red_predictions: number
  red_correct: number
  black_predictions: number
  black_correct: number
  white_predictions: number
  white_correct: number
  average_confidence: number
  last_updated: string
}

// ✅ CORREÇÃO 2: Timezone do Brasil agora centralizado em src/utils/timezone.ts

// ===== SERVICE CLASS =====

class BlazeRealDataService {
  private isCapturing: boolean = false
  private currentStrategy: string = 'DESCONECTADO'
  private pollingInterval: NodeJS.Timeout | null = null
  private lastKnownRound: string | null = null
  private currentProxy: string | null = null
  private listeners: Array<(update: any) => void> = []
  private chromiumAvailable: boolean = false
  
  // Sistema de throttling de logs
  private lastWaitingLogTime: number = 0
  private waitingLogCount: number = 0
  private readonly LOG_THROTTLE_INTERVAL = 30000 // Log "waiting" apenas a cada 30 segundos
  
  // ✅ SISTEMA ANTI-LOOP: Controle de predições ML
  private lastMLPredictionTime: number = 0
  private lastMLPredictionData: string = ''
  private readonly ML_PREDICTION_COOLDOWN = 30000 // Predição ML apenas a cada 30 segundos
  private processedDataHashes = new Set<string>()
  private lastEmittedData: string = '' // ✅ OTIMIZAÇÃO: Prevenir eventos duplicados
  
  // URL do nosso proxy local
  private readonly PROXY_URL = '/api/blaze-proxy'

  constructor() {
    // Verificar se Chromium está disponível
    this.checkChromiumAvailability()
    
    // ✅ ETAPA 4: Inicializar feedback loop automático
    this.initializeFeedbackLoop()
  }

  /**
   * ✅ ETAPA 4: INICIALIZAR FEEDBACK LOOP AUTOMÁTICO
   */
  private async initializeFeedbackLoop(): Promise<void> {
    try {
      // Aguardar um pouco para sistema carregar
      setTimeout(async () => {
        const { feedbackLoopService } = await import('./feedbackLoopService')
        await feedbackLoopService.startFeedbackLoop()
        console.log('🔄 ETAPA 4: Feedback loop automático inicializado!')
      }, 2000)
    } catch (error) {
      console.warn('⚠️ Erro inicializando feedback loop:', error)
    }
  }

  /**
   * VERIFICAR DISPONIBILIDADE DO CHROMIUM
   */
  private async checkChromiumAvailability(): Promise<void> {
    try {
      // Verificar se o script Chromium existe
      const response = await fetch('/scripts/blaze-chrome-capture.cjs', { method: 'HEAD' })
      this.chromiumAvailable = response.ok
      
      if (this.chromiumAvailable) {
        console.log('✅ CHROMIUM: Estratégia de captura avançada disponível')
      } else {
        console.log('⚠️ CHROMIUM: Não disponível, usando estratégias alternativas')
      }
    } catch (error) {
      this.chromiumAvailable = false
      console.log('⚠️ CHROMIUM: Verificação falhou, usando estratégias alternativas')
    }
  }

  /**
   * MAPEAR COR DA BLAZE
   */
  private mapColor(roll: number, colorIndex: number): 'red' | 'black' | 'white' {
    if (colorIndex === 0) return 'white';  // Branco (0)
    if (roll >= 1 && roll <= 7) return 'red';    // Vermelho (1-7)
    if (roll >= 8 && roll <= 14) return 'black';  // Preto (8-14)
    return 'white'; // Fallback
  }

  /**
   * ESTRATÉGIA: DUAL - LOCAL (PROXY) + PRODUÇÃO (CHROMIUM)
   */
  async startCapturing(): Promise<void> {
    if (this.isCapturing) {
      console.log('⚠️ Captura já está ativa')
      return
    }

    this.isCapturing = true
    
    // Detectar ambiente
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (isDevelopment) {
      console.log('🔧 DESENVOLVIMENTO: Usando proxy local (DADOS REAIS) - estratégia que funcionava')
      await this.tryDevelopmentStrategies() // ✅ VOLTAR PARA O QUE FUNCIONAVA
    } else {
      console.log('🚀 PRODUÇÃO: Usando Chromium (DADOS REAIS) - resolver erro 500')
      await this.tryChromiumCapture()       // ✅ CHROMIUM SÓ EM PRODUÇÃO
    }
  }

  /**
   * ESTRATÉGIAS PARA DESENVOLVIMENTO LOCAL - USANDO API PROXY LOCAL
   */
  private async tryDevelopmentStrategies(): Promise<void> {
    try {
      console.log('🎯 DESENVOLVIMENTO: Usando API proxy local...')
      
      // Usar o proxy da API local criado especificamente para isso (sempre porta 8080)
      const LOCAL_PROXY_URL = `http://localhost:8080/api/blaze-proxy`
      
      console.log(`📡 Testando proxy local: ${LOCAL_PROXY_URL}`)
      
      const response = await Promise.race([
        fetch(LOCAL_PROXY_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout - Proxy local não respondeu')), 10000)
        )
      ])
      
      if (!response.ok) {
        throw new Error(`Proxy local retornou ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      let data;
      
      // Verificar formato da resposta (Vercel vs Vite proxy)
      if (result.success && result.data) {
        // Formato Vercel: {success: true, data: {...}}
        data = result.data;
      } else if (Array.isArray(result) && result.length > 0) {
        // Formato Vite proxy: Array direto da Blaze
        const game = result[0];
        // ✅ CORREÇÃO: Gerar ID apenas uma vez
        const optimizedId = this.generateOptimizedId(game.id);
        data = {
          id: game.id,
          number: game.roll,
          color: this.mapColor(game.roll, game.color),
          round_id: optimizedId, // ✅ USAR O MESMO ID
          timestamp_blaze: game.created_at,
          source: 'blaze_proxy_vite'
        };
      } else {
        throw new Error('Proxy local retornou dados inválidos')
      }
      
      logThrottled('proxy-functioning', '✅ PROXY LOCAL FUNCIONANDO! Dados reais da Blaze obtidos:')
      logThrottled('proxy-data-details', `🎯 Número: ${data.number} | 🎨 Cor: ${data.color} | 🆔 ID: ${data.id} | 📅 Data: ${data.timestamp_blaze}`)
      
      // Configurar para usar proxy local
      this.currentStrategy = 'PROXY_DADOS_REAIS_AUTOMATICO'
      // ✅ CORREÇÃO: Usar o round_id que já foi gerado ou o ID original
      this.lastKnownRound = data.round_id || this.generateOptimizedId(data.id)
      
      // Processar primeiro dado
      await this.processRealData(data)
      
      // Iniciar polling automático
      this.startProxyPolling()
      
      logThrottled('system-auto-started', '🎯 SISTEMA AUTOMÁTICO: Captura iniciada com sucesso!')
      
    } catch (error) {
      console.error('❌ PROXY LOCAL FALHOU:', error instanceof Error ? error.message : String(error))
      console.log('🛑 SISTEMA PARADO - Não é possível obter dados reais da Blaze')
      console.log('💡 SOLUÇÃO: Use upload de CSV ou entrada manual para adicionar números')
      
      this.handleFatalError('Não foi possível conectar com dados reais da Blaze - Use entrada manual ou CSV')
    }
  }

  /**
   * TENTAR FETCH DIRETO
   */
  private async tryDirectFetch(): Promise<void> {
    try {
      const response = await fetch('https://blaze.com/api/roulette_games/recent?limit=1', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          console.log('✅ Fetch direto funcionou! Iniciando polling...')
          this.currentProxy = 'direct'
          this.startPolling()
          return
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      throw new Error(`Fetch direto falhou: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * TESTAR CONEXÃO VIA PROXY
   */
  private async testProxyConnection(): Promise<void> {
    try {
      console.log('🎯 Testando conexão via proxy local...')
      
      const proxyUrl = `${window.location.origin}${this.PROXY_URL}`
      console.log(`📡 URL: ${proxyUrl}`)
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Proxy HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success || !result.data || !result.data.round_id) {
        throw new Error('Proxy retornou dados inválidos')
      }
      
      const data = result.data

      // Sucesso! Iniciar polling
      console.log('✅ CONEXÃO VIA PROXY ESTABELECIDA!')
      console.log(`📊 Primeiro jogo detectado: ${data.number} (ID: ${data.round_id})`)
      
      this.currentStrategy = 'PROXY_DADOS_REAIS'
      this.lastKnownRound = this.generateOptimizedId(data.round_id)
      this.startProxyPolling()
      
    } catch (error) {
      // FALHA TOTAL - PARAR TUDO
      console.log('❌ FALHA FATAL: Não foi possível conectar via proxy')
      console.log(`❌ Erro: ${error instanceof Error ? error.message : String(error)}`)
      console.log('🛑 SISTEMA PARADO - VERIFIQUE O PROXY')
      
      this.isCapturing = false
      this.currentStrategy = 'ERRO_FATAL'
      
      // Emitir erro para interface
      if (typeof window !== 'undefined') {
        const errorEvent = new CustomEvent('blazeConnectionError', { 
          detail: { 
            error: error instanceof Error ? error.message : String(error),
            timestamp: getBrazilTimestamp()
          }
        })
        window.dispatchEvent(errorEvent)
      }
    }
  }

  /**
   * POLLING VIA PROXY
   */
  private startProxyPolling(): void {
    console.log('🚀 Iniciando polling via proxy a cada 5 segundos (OTIMIZADO ANTI-LOOP)...')
    
    // ✅ POLLING OTIMIZADO: 5 segundos para reduzir sobrecarga
    this.pollingInterval = setInterval(() => {
      this.checkViaProxy()
    }, 5000) // Otimizado para reduzir loops
  }

  /**
   * VERIFICAR VIA PROXY
   */
  private async checkViaProxy(): Promise<void> {
    try {
      // Usar proxy local para desenvolvimento e produção (sempre porta 8080 em dev)
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const proxyUrl = isDevelopment ? `http://localhost:8080${this.PROXY_URL}` : `${window.location.origin}${this.PROXY_URL}`
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Proxy HTTP ${response.status}`)
      }

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        
        // Se é resposta estruturada do Vercel API
        if (result.success && result.data) {
          data = result.data;
        }
        // Se é resposta direta da API da Blaze (proxy Vite)
        else if (Array.isArray(result) && result.length > 0) {
          const game = result[0];
          data = {
            id: game.id,
            number: game.roll,
            color: this.mapColor(game.roll, game.color),
            round_id: game.id, // ✅ USAR ID ORIGINAL DA BLAZE
            timestamp_blaze: game.created_at,
            source: 'blaze_proxy_api'
          };
        }
        else {
          console.log('⚠️ Proxy retornou dados vazios ou inválidos')
          return
        }
      } else {
        throw new Error('Resposta não é JSON válido')
      }
      
      // ✅ CORREÇÃO CRÍTICA: Usar ID original da Blaze para verificação
      const gameId = data.id || data.round_id
      if (!data || !gameId) {
        console.log('⚠️ Dados processados são inválidos')
        return
      }

      // Verificar se é um jogo novo (considerar ID e timestamp)
      const dataTimestamp = new Date(data.timestamp_blaze || data.created_at).getTime()
      const isOldData = dataTimestamp < (Date.now() - (24 * 60 * 60 * 1000)) // Dados de mais de 24h são considerados antigos
      const timeDiff = Math.abs(Date.now() - dataTimestamp) / 1000 // Diferença em segundos
      
      // ✅ CORREÇÃO CRÍTICA: Usar ID original da Blaze para comparação
      if (this.lastKnownRound && this.lastKnownRound === gameId && timeDiff < 300 && !isOldData) {
        // Log throttling: apenas a cada 30 segundos para reduzir poluição
        const now = Date.now()
        if (now - this.lastWaitingLogTime > this.LOG_THROTTLE_INTERVAL) {
          this.waitingLogCount++
          console.log(`🔄 Aguardando novo jogo... (atual: ${data.number}, ${Math.round(timeDiff)}s atrás) [${this.waitingLogCount}x]`)
          console.log(`🔍 DEBUG: lastKnownRound=${this.lastKnownRound}, gameId=${gameId}, timeDiff=${timeDiff}s`)
          console.log(`🔍 DEBUG: dataTimestamp=${new Date(dataTimestamp).toLocaleString()}, isOldData=${isOldData}`)
          this.lastWaitingLogTime = now
          
          // ✅ CORREÇÃO: Forçar reset se aguardando por mais de 5 ciclos (5 * 30s = 2.5 minutos)
          if (this.waitingLogCount > 5) { 
            console.log(`🚨 SISTEMA TRAVADO: Aguardando há mais de 2.5 minutos. Forçando reset...`)
            this.lastKnownRound = null
            this.waitingLogCount = 0
            console.log(`🔄 RESET FORÇADO: Sistema liberado para processar próximo jogo`)
            return // Sair para reprocessar imediatamente
          }
        }
        return
      }
      
      // Se é o mesmo ID mas é antigo (mais de 5 minutos), processar mesmo assim
      if (this.lastKnownRound && this.lastKnownRound === gameId && timeDiff >= 300) {
        console.log(`🔄 Mesmo ID mas dados antigos, forçando processamento (${Math.round(timeDiff)}s atrás)`)
      }
      
      // ✅ CORREÇÃO ADICIONAL: Se aguardando há muito tempo, forçar processamento mesmo com ID igual
      if (this.lastKnownRound && this.lastKnownRound === gameId && this.waitingLogCount > 10) {
        console.log(`🚨 FORÇANDO PROCESSAMENTO: Sistema aguardando há muito tempo (${this.waitingLogCount} ciclos)`)
        console.log(`🔄 Processando número ${data.number} mesmo com ID igual para destravar sistema`)
        this.lastKnownRound = null // Reset para permitir processamento
      }
      
      // Se são dados antigos, forçar reset e tentar novamente
      if (isOldData) {
        console.log(`⚠️ DADOS ANTIGOS DETECTADOS: ${new Date(dataTimestamp).toLocaleDateString()}`)
        console.log(`🔄 Forçando reset do sistema para buscar dados atuais...`)
        
        // Forçar reset completo
        this.forceReset()
        
        // Tentar reiniciar captura após delay
        setTimeout(() => {
          console.log('🔄 Reiniciando captura após reset...')
          this.startCapturing()
        }, 2000)
        
        return
      }

      // NOVO JOGO REAL DETECTADO VIA PROXY!
      console.log(`🆕 NOVO JOGO REAL VIA PROXY!`)
      console.log(`📊 ID: ${gameId}`)
      console.log(`🎯 Número: ${data.number}`)
      console.log(`🎨 Cor: ${data.color}`)
      console.log(`⏰ Horário: ${data.timestamp_blaze || data.created_at || 'agora'}`)
      console.log(`📅 Data completa: ${new Date(dataTimestamp).toLocaleString()}`)
      console.log(`🔄 Último conhecido: ${this.lastKnownRound}`)
      console.log(`⏱️ Diferença temporal: ${timeDiff}s`)
      
      // Reset contador de waiting para novos jogos
      this.waitingLogCount = 0

      // ✅ CORREÇÃO CRÍTICA: Gerar ID determinístico apenas uma vez
      if (!data.round_id || data.round_id === data.id) {
        data.round_id = this.generateOptimizedId(gameId)
      }

      await this.processRealData(data)
      // ✅ CORREÇÃO CRÍTICA: Usar ID original da Blaze para controle
      this.lastKnownRound = gameId
      
      // Emitir evento para interface (sem duplicação)
      this.emitRealData(data)

    } catch (error) {
      // ERRO CRÍTICO - PARAR TUDO
      console.log('❌ ERRO CRÍTICO: Perdeu conexão com proxy')
      console.log(`❌ Erro: ${error instanceof Error ? error.message : String(error)}`)
      console.log('🛑 PARANDO SISTEMA - PROXY INDISPONÍVEL')
      
      this.stopCapturing()
      this.currentStrategy = 'ERRO_FATAL'
      
      // Emitir erro para interface
      if (typeof window !== 'undefined') {
        const errorEvent = new CustomEvent('blazeConnectionError', { 
          detail: { 
            error: 'Perdeu conexão com proxy local',
            timestamp: getBrazilTimestamp()
          }
        })
        window.dispatchEvent(errorEvent)
      }
    }
  }

  /**
   * Gerar ID cronológico otimizado para algoritmos - RESOLVE ERRO 406
   */
  private static idCounter = 0

  private generateOptimizedId(str: string): string {
    // ✅ CORREÇÃO CRÍTICA: FUNÇÃO DETERMINÍSTICA - MESMO INPUT = MESMO OUTPUT
    // Usar hash simples do input + data do dia para garantir consistência
    
    // Extrair apenas a data (sem hora) para consistência durante o dia
    const today = getBrazilDateOnly() // YYYYMMDD Brasil
    
    // Criar hash simples e determinístico do input
    let hash = 0
    const inputString = str || 'default'
    for (let i = 0; i < inputString.length; i++) {
      const char = inputString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Converter para 32bit
    }
    
    // Garantir que hash seja sempre positivo e limitado
    const positiveHash = Math.abs(hash) % 999999
    const hashString = positiveHash.toString().padStart(6, '0')
    
    // ID final: determinístico para o mesmo input no mesmo dia
    const optimizedId = `${today}_${hashString}_${inputString.slice(-4).padStart(4, '0')}`
    
    // console.log(`🔢 ID determinístico gerado: ${optimizedId} (de: ${str})`)
    return optimizedId
  }

  /**
   * PROCESSAR APENAS DADOS REAIS
   */
  private async processRealData(data: BlazeRealData): Promise<void> {
    try {
      // Garantir que round_id esteja definido
      const roundId = data.round_id || data.id
      if (!roundId) {
        console.log('❌ Dados inválidos: ID não encontrado')
        return
      }

      // ✅ SISTEMA ANTI-LOOP: Verificar hash dos dados para evitar processamento duplicado
      const dataHash = `${data.number}_${data.color}_${data.timestamp_blaze}`
      if (this.processedDataHashes.has(dataHash)) {
        // console.log(`🚫 ANTI-LOOP: Dados já processados - ${dataHash}`)
        return
      }
      
      // Adicionar hash à lista de processados
      this.processedDataHashes.add(dataHash)
      
      // Limpar hashes antigos (manter apenas últimos 100)
      if (this.processedDataHashes.size > 100) {
        const hashArray = Array.from(this.processedDataHashes)
        this.processedDataHashes.clear()
        hashArray.slice(-50).forEach(hash => this.processedDataHashes.add(hash))
      }

      // ✅ ETAPA 1: VERIFICAÇÃO RIGOROSA DE DUPLICATAS
      logThrottled('processing-round', `🔄 Processando round: ${roundId}`)
      
      // ✅ CORREÇÃO CRÍTICA: Usar ID existente ou gerar apenas se necessário
      let uuidRoundId = data.round_id
      
      // Só gerar novo ID se não existir ou se for igual ao ID original (não foi processado)
      if (!uuidRoundId || uuidRoundId === data.id) {
        uuidRoundId = this.generateOptimizedId(roundId)
        data.round_id = uuidRoundId // Atualizar dados com ID gerado
      }

      // ✅ PROBLEMA 2: Validar ID antes da query para evitar erro 406
      if (!uuidRoundId || uuidRoundId.length < 10) {
        console.error(`❌ ID INVÁLIDO GERADO: "${uuidRoundId}" de roundId: "${roundId}"`)
        return // Pular se ID inválido
      }

      // console.log(`🔢 ID determinístico usado: ${uuidRoundId} de roundId: ${roundId}`)

      // ✅ CORREÇÃO CRÍTICA: Usar UPSERT para eliminar race conditions completamente
      // Normalizar dados para salvar (sem campo id para evitar conflitos UUID)
      const normalizedData = {
        number: data.number,
        color: data.color,
        timestamp_blaze: data.timestamp_blaze,
        round_id: uuidRoundId // ✅ USAR O MESMO ID VALIDADO!
      }

      // Debug: ver exatamente o que será enviado
      console.log('🔍 DADOS PARA SUPABASE:', JSON.stringify(normalizedData, null, 2))

      // ✅ ETAPA 1: SALVAMENTO OBRIGATÓRIO NO SUPABASE (UPSERT - ATOMIC OPERATION)
      console.log(`🔒 SALVAMENTO OBRIGATÓRIO: Iniciando salvamento crítico para ${normalizedData.number} (${normalizedData.color})`)
      
      const { error } = await supabase
        .from('blaze_real_data')
        .upsert(normalizedData, { 
          onConflict: 'round_id',
          ignoreDuplicates: true 
        })

      if (error) {
        console.error(`❌ FALHA CRÍTICA NO SUPABASE: ${error.message || error}`)
        console.error(`🚨 DADOS NÃO SALVOS: ${JSON.stringify(normalizedData)}`)
        throw new Error(`Falha crítica ao salvar dados: ${error.message}`)
      }

      console.log(`✅ DADOS SALVOS COM SUCESSO NO SUPABASE: ${normalizedData.number} (${normalizedData.color})`)
      
      // Emitir evento para a interface APENAS APÓS SUCESSO NO BANCO
      this.emitRealData(data)
      logThrottled('data-emitted', `📡 DADOS EMITIDOS PARA INTERFACE: ${normalizedData.number} (${normalizedData.color})`)

      // ✅ FOUNDATION MODEL 2025: Sistema antigo desabilitado
      console.log('🎯 FOUNDATION MODEL: Dados processados - UnifiedPredictionInterface ativo automaticamente')
      
      // Sistema ML antigo desabilitado - Foundation Model 2025 via UnifiedPredictionInterface
      // const now = Date.now()
      // const dataSignature = `${normalizedData.number}_${normalizedData.color}`
      // 
      // if (now - this.lastMLPredictionTime >= this.ML_PREDICTION_COOLDOWN && 
      //     this.lastMLPredictionData !== dataSignature) {
      //   this.lastMLPredictionTime = now
      //   this.lastMLPredictionData = dataSignature
      //   console.log(`🎯 PREDIÇÃO ML AUTORIZADA: Cooldown de 30s respeitado`)
      //   await this.makePredictionBasedOnRealData()
      // }

    } catch (error) {
      console.log('❌ Erro processando dados reais:', error)
    }
  }

  /**
   * EMITIR APENAS DADOS REAIS PARA INTERFACE (com proteção anti-duplicação)
   */
  private emitRealData(data: BlazeRealData): void {
    if (typeof window !== 'undefined') {
      // ✅ OTIMIZAÇÃO: Verificar se já foi emitido recentemente
      const dataKey = `${data.number}_${data.color}_${data.round_id}`
      if (this.lastEmittedData === dataKey) {
        console.log('🚫 DUPLICAÇÃO: Evento já emitido, ignorando...')
        return
      }
      
      this.lastEmittedData = dataKey
      const event = new CustomEvent('blazeRealData', { detail: data })
      window.dispatchEvent(event)
      
      // ✅ OTIMIZAÇÃO: Log reduzido para performance
      console.log(`📡 Evento blazeRealData emitido: ${data.number} (${data.color}) - ${data.round_id}`)
    }
  }

  /**
   * PARAR CAPTURA
   */
  stopCapturing(): void {
    console.log('⏹️ Parando captura via proxy...')
    
    this.isCapturing = false
    this.currentStrategy = 'DESCONECTADO'
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  /**
   * FORÇAR RESET COMPLETO DO SISTEMA - CORREÇÃO CRÍTICA
   */
  forceReset(): void {
    console.log('🔄 FORÇANDO RESET COMPLETO: Limpando todo o estado...')
    this.lastKnownRound = null
    this.currentStrategy = 'DESCONECTADO'
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    // ✅ CORREÇÃO 4: Reset completo de estado
    BlazeRealDataService.idCounter = 0
    
    // Limpar localStorage e cache
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('blaze_analyzer_backup')
        ;(window as any).realDataHistory = []
        console.log('🧹 Cache local limpo')
      } catch (error) {
        console.log('⚠️ Erro limpando cache local:', error)
      }
    }
    
    console.log('✅ Reset COMPLETO concluído - sistema limpo')
  }

  /**
   * GERAR PREDIÇÃO BASEADA EM DADOS REAIS - SISTEMA ML AVANÇADO
   */
  private async makePredictionBasedOnRealData(): Promise<void> {
    try {
      // ✅ ETAPA 3: USAR FUNÇÃO UNIFICADORA PARA BUSCAR **TODOS** OS DADOS
      // ✅ PROBLEMA 4: Buscar dados sem logs excessivos
      const historicalData = await this.getAllUnifiedData()

      if (!historicalData || historicalData.length < 50) {
        await this.lastResortSimplePrediction(historicalData || [])
        return
      }

      // ✅ PROBLEMA 4: Logs removidos - sistema funcionando silenciosamente

      // Tentar usar sistema ML avançado
      try {
        // const { advancedMLService } = await import('./advancedMLPredictionService') // REMOVIDO: Foundation Model 2025
        
        // ✅ PROBLEMA 4: Apenas log essencial de dados
        // Análise detalhada por fonte (apenas contadores para debug se necessário)
        const realSourceCount = historicalData.filter(d => d.source === 'blaze_real_api').length
        const csvSourceCount = historicalData.filter(d => d.source === 'csv_import').length
        
        // Converter dados para formato ML
        const blazeDataPoints = historicalData.map(item => ({
          number: item.number,
          color: item.color as 'red' | 'black' | 'white',
          timestamp: new Date(item.timestamp_blaze || Date.now()).getTime(),
          round_id: item.round_id || item.id || `round_${Date.now()}_${Math.random()}`
        })).reverse() // Ordem cronológica

        // Executar predição avançada
        // const advancedPrediction = await advancedMLService.makePrediction(blazeDataPoints) // REMOVIDO: Foundation Model 2025

        // REMOVIDO: Sistema antigo ML substituído pelo Foundation Model 2025
        /*
        // Converter para formato sistema
        const prediction: SystemPrediction = {
          predicted_color: advancedPrediction.predicted_color,
          predicted_numbers: advancedPrediction.predicted_numbers,
          confidence_percentage: Math.round(advancedPrediction.confidence_percentage),
          ml_algorithms_used: {
            ensemble_learning: true,
            lstm: true,
            xgboost: true,
            random_forest: true,
            svm: true,
            transformer: true,
            gru: true,
            model_consensus: advancedPrediction.model_consensus,
            individual_models: advancedPrediction.individual_predictions.length,
            feature_engineering: true,
            fourier_analysis: true,
            technical_indicators: true,
            risk_assessment: advancedPrediction.risk_assessment,
            meta_analysis: advancedPrediction.meta_analysis
          },
          data_size_used: blazeDataPoints.length,
          round_target: 'next'
        }

        // ✅ ETAPA 4: REGISTRAR PREDIÇÃO NO FEEDBACK LOOP
        await this.registerPredictionForFeedback(prediction, advancedPrediction)

        // ✅ ETAPA 5: ANÁLISE TEMPORAL AVANÇADA
        await this.performTemporalAnalysisAndOptimization(blazeDataPoints, prediction)

        // Salvar predição avançada
        const { error } = await supabase
          .from('system_predictions')
          .insert(prediction)

        // ✅ PROBLEMA 4: Logs removidos - apenas erros importantes

        // Salvar predição detalhada para análise
        await this.saveAdvancedPredictionDetails(advancedPrediction)
        */

                    } catch (mlError) {
        console.warn('⚠️ Sistema ML antigo desabilitado - Foundation Model 2025 ativo:', mlError)
        // await this.useRealAlgorithmsInstead(historicalData || []) // REMOVIDO: Foundation Model 2025
      }

    } catch (error) {
      console.log('❌ Erro gerando predição:', error)
    }
  }

  /**
   * ✅ ETAPA 4: USAR ALGORITMOS REAIS EM VEZ DE FALLBACK SIMPLES
   */
  private async useRealAlgorithmsInstead(data: BlazeRealData[]): Promise<void> {
    try {
      if (data.length < 100) {
        console.log('⚠️ Dados insuficientes para algoritmos reais (mínimo 100)')
        return
      }

      // ✅ PROBLEMA 4: Logs mínimos para algoritmos reais
      // Análise básica apenas para debug crítico
      const realSourceCount = data.filter(d => d.source === 'blaze_real_api').length
      const csvSourceCount = data.filter(d => d.source === 'csv_import').length
      
      // Converter para formato dos algoritmos reais
      const blazeNumbers = data.map(item => ({
        number: item.number,
        color: item.color as 'red' | 'black' | 'white',
        timestamp: new Date(item.timestamp_blaze || Date.now()).getTime(),
        id: item.round_id || item.id || `real_${Date.now()}`
      }))

      // Importar e usar algoritmos reais
      const { RealAlgorithmsService } = await import('./realAlgorithmsService')
      const realPrediction = await RealAlgorithmsService.makeFinalPrediction(blazeNumbers)

      // Converter para formato do sistema
      const prediction: SystemPrediction = {
        predicted_color: realPrediction.consensus_color,
        predicted_numbers: [realPrediction.consensus_number],
        confidence_percentage: Math.round(realPrediction.mathematical_confidence),
        ml_algorithms_used: {
          real_algorithms: true,
          white_gold_detector: true,
          frequency_compensation: true,
          gap_analysis: true,
          markov_chain: true,
          mathematical_proof: realPrediction.algorithms_used.length > 0,
          data_source: 'unified_all_sources',
          total_algorithms: realPrediction.algorithms_used.length
        },
        data_size_used: blazeNumbers.length,
        round_target: 'next'
      }

      // Salvar predição real
      const { error } = await supabase
        .from('system_predictions')
        .insert(prediction)

      // ✅ PROBLEMA 4: Logs removidos - apenas erros importantes

    } catch (error) {
      console.log('❌ Erro nos algoritmos reais, usando último recurso simples:', error)
      await this.lastResortSimplePrediction(data)
    }
  }

  /**
   * ÚLTIMO RECURSO: PREDIÇÃO SIMPLES (APENAS SE ALGORITMOS REAIS FALHAREM)
   */
  private async lastResortSimplePrediction(data: any[]): Promise<void> {
    try {
      // ✅ ETAPA 2: FALLBACK USANDO **TODOS** OS DADOS (SEM LIMITAÇÃO)
      const recentData = data || [] // ✅ PROBLEMA 2: USAR TODOS OS DADOS, NÃO APENAS 200

      if (recentData.length < 10) {
        console.log('⚠️ Dados insuficientes para qualquer predição')
        return
      }

      console.log(`🔧 FALLBACK COM TODOS OS DADOS: Analisando ${recentData.length} números SEM LIMITAÇÃO`)

      // Análise simples de frequência (sistema original)
      const colorCounts = { red: 0, black: 0, white: 0 }
      
      recentData.forEach(item => {
        if (item.color in colorCounts) {
          colorCounts[item.color as keyof typeof colorCounts]++
        }
      })

      const totalGames = recentData.length
      const colorPercentages = {
        red: (colorCounts.red / totalGames) * 100,
        black: (colorCounts.black / totalGames) * 100,
        white: (colorCounts.white / totalGames) * 100
      }

      const leastFrequentColor = (Object.keys(colorPercentages) as Array<keyof typeof colorPercentages>).reduce((a, b) => 
        colorPercentages[a] < colorPercentages[b] ? a : b
      )

      const numbersForColor = recentData
        .filter(item => item.color === leastFrequentColor)
        .map(item => item.number)
        .slice(0, 3)

      const prediction: SystemPrediction = {
        predicted_color: leastFrequentColor,
        predicted_numbers: numbersForColor.length > 0 ? numbersForColor : [0],
        confidence_percentage: Math.round(100 - colorPercentages[leastFrequentColor]),
        ml_algorithms_used: { 
          frequency_analysis: true, 
          real_data: recentData.length,
          fallback_mode: true,
          advanced_ml_failed: true
        },
        data_size_used: recentData.length,
        round_target: 'next'
      }

      const { error } = await supabase
        .from('system_predictions')
        .insert(prediction)

      // ✅ PROBLEMA 4: Logs removidos - apenas erros importantes

    } catch (error) {
      console.log('❌ Erro na predição fallback:', error)
    }
  }

  /**
   * ✅ ETAPA 4: REGISTRAR PREDIÇÃO NO FEEDBACK LOOP
   */
  private async registerPredictionForFeedback(prediction: SystemPrediction, advancedPrediction: any): Promise<void> {
    try {
      const { feedbackLoopService } = await import('./feedbackLoopService')
      
      const predictionId = `ml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Extrair modelos utilizados
      const modelsUsed = advancedPrediction.individual_predictions?.map((p: any) => p.model_id) || ['ensemble']
      
      // Criar contexto
      const context = {
        hour_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        volatility_level: advancedPrediction.risk_assessment?.volatility_level || 'medium',
        recent_streak: 0, // Será calculado baseado nos dados recentes
        market_phase: this.getMarketPhase(),
        data_quality_score: advancedPrediction.meta_analysis?.ensemble_agreement || 0.8
      }
      
      await feedbackLoopService.registerPrediction({
        prediction_id: predictionId,
        predicted_color: prediction.predicted_color,
        predicted_numbers: prediction.predicted_numbers,
        confidence: prediction.confidence_percentage,
        models_used: modelsUsed,
        context: context
      })
      
      console.log(`🔄 Predição ${predictionId} registrada no feedback loop`)
      
    } catch (error) {
      console.warn('⚠️ Erro registrando predição no feedback loop:', error)
    }
  }

  /**
   * DETERMINAR FASE DO MERCADO
   */
  private getMarketPhase(): 'opening' | 'active' | 'closing' | 'late_night' {
    const hour = new Date().getHours()
    
    if (hour >= 6 && hour < 9) return 'opening'
    if (hour >= 9 && hour < 18) return 'active'
    if (hour >= 18 && hour < 22) return 'closing'
    return 'late_night'
  }

  /**
   * ✅ ETAPA 5: ANÁLISE TEMPORAL AVANÇADA E OTIMIZAÇÃO
   */
  private async performTemporalAnalysisAndOptimization(blazeDataPoints: any[], prediction: SystemPrediction): Promise<void> {
    try {
      const { temporalAnalysisService } = await import('./temporalAnalysisService')
      
      // Executar análise temporal se temos dados suficientes
      if (blazeDataPoints.length >= 100) {
        console.log('⏰ ETAPA 5: Executando análise temporal avançada...')
        
        const temporalAnalysis = await temporalAnalysisService.performTemporalAnalysis(blazeDataPoints)
        
        // Obter contexto temporal atual
        const currentPhase = temporalAnalysisService.getCurrentMarketPhase()
        const currentRegime = temporalAnalysisService.getCurrentRegime()
        const recommendations = temporalAnalysisService.getCurrentRecommendations()
        
        // Log das descobertas temporais
        if (currentPhase) {
          console.log(`📊 FASE ATUAL: ${currentPhase.phase_name} (${currentPhase.characteristics.activity_level} atividade)`)
          console.log(`🎯 Previsibilidade: ${(currentPhase.characteristics.predictability * 100).toFixed(1)}%`)
        }
        
        if (currentRegime) {
          console.log(`🌊 REGIME: ${currentRegime.regime_type} (gap médio: ${currentRegime.characteristics.average_gap.toFixed(2)})`)
        }
        
        if (recommendations.length > 0) {
          console.log(`💡 ${recommendations.length} recomendações temporais disponíveis`)
          recommendations.slice(0, 2).forEach(rec => {
            console.log(`   • [${rec.priority}] ${rec.description}`)
          })
        }
        
        // Aplicar otimizações temporais na predição
        await this.applyTemporalOptimizations(prediction, temporalAnalysis, currentPhase, currentRegime)
        
        console.log('✅ ETAPA 5: Análise temporal aplicada com sucesso!')
      } else {
        console.log('⚠️ ETAPA 5: Dados insuficientes para análise temporal (mínimo 100 pontos)')
      }
      
    } catch (error) {
      console.warn('⚠️ ETAPA 5: Erro na análise temporal:', error)
    }
  }

  /**
   * 🎯 APLICAR OTIMIZAÇÕES TEMPORAIS
   */
  private async applyTemporalOptimizations(
    prediction: SystemPrediction, 
    analysis: any, 
    currentPhase: any, 
    currentRegime: any
  ): Promise<void> {
    try {
      // Ajustar confiança baseado na fase do mercado
      if (currentPhase) {
        const phaseMultiplier = currentPhase.characteristics.predictability
        prediction.confidence_percentage = Math.round(prediction.confidence_percentage * phaseMultiplier)
        console.log(`🎯 Confiança ajustada pela fase: ${prediction.confidence_percentage}% (×${phaseMultiplier.toFixed(2)})`)
      }
      
      // Ajustar estratégia baseado no regime de volatilidade
      if (currentRegime) {
        const regimeAdjustment = this.getRegimeConfidenceAdjustment(currentRegime.regime_type)
        prediction.confidence_percentage = Math.round(prediction.confidence_percentage * regimeAdjustment)
        console.log(`🌊 Confiança ajustada pelo regime: ${prediction.confidence_percentage}% (×${regimeAdjustment})`)
        
        // Adicionar informação do regime aos algoritmos usados
        prediction.ml_algorithms_used.temporal_analysis = true
        prediction.ml_algorithms_used.current_regime = currentRegime.regime_type
        prediction.ml_algorithms_used.regime_characteristics = currentRegime.characteristics
      }
      
      // Aplicar insights de padrões horários
      const currentHour = new Date().getHours()
      const hourlyPattern = analysis.hourly_patterns?.find((p: any) => p.hour === currentHour)
      
      if (hourlyPattern && hourlyPattern.confidence_score > 0.7) {
        const hourlyMultiplier = 1 + (hourlyPattern.confidence_score - 0.5)
        prediction.confidence_percentage = Math.round(prediction.confidence_percentage * hourlyMultiplier)
        console.log(`🕐 Confiança ajustada pelo padrão horário: ${prediction.confidence_percentage}% (×${hourlyMultiplier.toFixed(2)})`)
        
        // Sugerir números baseado no padrão horário
        if (hourlyPattern.dominant_color === prediction.predicted_color) {
          console.log(`✅ Predição alinhada com padrão horário dominante: ${hourlyPattern.dominant_color}`)
        }
      }
      
      // Garantir que a confiança esteja dentro dos limites
      prediction.confidence_percentage = Math.max(10, Math.min(95, prediction.confidence_percentage))
      
    } catch (error) {
      console.warn('⚠️ Erro aplicando otimizações temporais:', error)
    }
  }

  /**
   * 📊 OBTER AJUSTE DE CONFIANÇA POR REGIME
   */
  private getRegimeConfidenceAdjustment(regimeType: string): number {
    const adjustments: { [key: string]: number } = {
      'low_volatility': 1.2,      // +20% confiança em baixa volatilidade
      'medium_volatility': 1.0,    // Neutro
      'high_volatility': 0.8,     // -20% confiança em alta volatilidade  
      'extreme_volatility': 0.6   // -40% confiança em volatilidade extrema
    }
    
    return adjustments[regimeType] || 1.0
  }

  /**
   * SALVAR DETALHES DA PREDIÇÃO AVANÇADA
   */
  private async saveAdvancedPredictionDetails(prediction: any): Promise<void> {
    try {
      // Salvar métricas detalhadas para análise
      const detailedRecord = {
        timestamp: getBrazilTimestamp(),
        prediction_id: `adv_${Date.now()}`,
        predicted_color: prediction.predicted_color,
        confidence: prediction.confidence_percentage,
        model_consensus: prediction.model_consensus,
        individual_predictions: prediction.individual_predictions,
        feature_importance: prediction.feature_importance,
        risk_assessment: prediction.risk_assessment,
        meta_analysis: prediction.meta_analysis,
        volatility_level: prediction.risk_assessment.volatility_level,
        pattern_strength: prediction.risk_assessment.pattern_strength,
        prediction_stability: prediction.risk_assessment.prediction_stability,
        ensemble_agreement: prediction.meta_analysis.ensemble_agreement,
        model_diversity: prediction.meta_analysis.model_diversity
      }

      const { error } = await supabase
        .from('ml_prediction_analytics')
        .insert(detailedRecord)

      if (error) {
        console.warn('⚠️ Não foi possível salvar analytics ML:', error.message)
      } else {
        console.log('📊 Analytics ML salvos com sucesso')
      }

    } catch (error) {
      console.warn('⚠️ Erro salvando analytics ML:', error)
    }
  }

  /**
   * MÉTODOS PÚBLICOS PARA INTERFACE
   */
  getConnectionStatus(): string {
    switch (this.currentStrategy) {
      case 'PROXY_DADOS_REAIS_AUTOMATICO':
        return 'CONECTADO - SISTEMA AUTOMÁTICO ATIVO'
      case 'PROXY_DADOS_REAIS':
        return 'CONECTADO - PROXY DADOS REAIS'
      case 'ERRO_FATAL':
        return 'ERRO FATAL - PROXY INDISPONÍVEL'
      default:
        return 'CONECTANDO...'
    }
  }

  isUsingRealData(): boolean {
    return this.currentStrategy === 'PROXY_DADOS_REAIS_AUTOMATICO' || 
           this.currentStrategy === 'PROXY_DADOS_REAIS'
  }

  getCurrentStrategy(): string {
    return this.currentStrategy
  }

  async getRecentBlazeData(limit: number = 20): Promise<BlazeRealData[]> {
    try {
      const { data } = await supabase
        .from('blaze_real_data')
        .select('*')
        .order('timestamp_blaze', { ascending: false })
        .limit(limit)

      return data || []
    } catch (error) {
      console.log('❌ Erro buscando dados recentes:', error)
      return []
    }
  }

  async getPerformanceStats(): Promise<SystemPerformance | null> {
    try {
      const { data } = await supabase
        .from('system_performance')
        .select('*')
        .single()

      return data
    } catch (error) {
      console.log('❌ Erro buscando performance:', error)
      return null
    }
  }

  /**
   * LIMPAR DADOS FALSOS DO SUPABASE
   */
  async clearFakeDataFromSupabase(): Promise<void> {
    try {
      console.log('🧹 Removendo dados falsos do Supabase...');
      
      // Deletar dados com IDs falsos ou timestamps antigos
      await supabase
        .from('blaze_real_data')
        .delete()
        .or('round_id.like.dev_round_%,source.eq.blaze_fallback');
      
      console.log('✅ Dados falsos removidos do Supabase');
    } catch (error) {
      console.error('❌ Erro limpando Supabase:', error);
      throw error;
    }
  }

  /**
   * INICIAR POLLING INTELIGENTE
   */
  private startPolling(): void {
    console.log('🎯 Iniciando polling inteligente...')
    console.log(`📡 Estratégia: ${this.currentProxy}`)
    
    // Limpar qualquer polling anterior
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
    
    // Polling a cada 4 segundos
    this.pollingInterval = setInterval(() => {
      if (this.currentProxy === 'direct') {
        this.checkDirectly()
      } else if (this.currentProxy) {
        this.checkViaPublicProxy()
      }
    }, 4000)
  }

  /**
   * VERIFICAR DADOS DIRETAMENTE
   */
  private async checkDirectly(): Promise<void> {
    try {
      const response = await fetch('https://blaze.com/api/roulette_games/recent?limit=1', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          await this.processGameData(data[0])
        }
      }
    } catch (error) {
      console.log('❌ Erro no polling direto:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * VERIFICAR VIA PROXY PÚBLICO
   */
  private async checkViaPublicProxy(): Promise<void> {
    try {
      if (!this.currentProxy) return
      
      const TARGET_URL = 'https://blaze.com/api/roulette_games/recent?limit=1'
      let url = this.currentProxy + encodeURIComponent(TARGET_URL)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        let data = await response.json()
        
        // Handle allorigins wrapper
        if (this.currentProxy.includes('allorigins') && data.contents) {
          data = JSON.parse(data.contents)
        }
        
        if (Array.isArray(data) && data.length > 0) {
          await this.processGameData(data[0])
        }
      }
    } catch (error) {
      console.log('❌ Erro no polling via proxy:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * PROCESSAR DADOS DO JOGO
   */
  private async processGameData(gameData: any): Promise<void> {
    try {
      // Verificar se é um jogo novo
      if (this.lastKnownRound && this.lastKnownRound === gameData.id) {
        return // Mesmo jogo, não processar
      }

      // ✅ CORREÇÃO: Gerar ID apenas uma vez
      const optimizedId = this.generateOptimizedId(gameData.id)

      // Mapear dados
      const blazeData: BlazeRealData = {
        id: gameData.id,
        number: gameData.roll,
        color: this.mapColor(gameData.roll, gameData.color),
        round_id: optimizedId, // ✅ USAR O MESMO ID
        timestamp_blaze: gameData.created_at,
        source: 'blaze_real_api'
      }

      console.log(`🆕 NOVO JOGO REAL DETECTADO!`)
      console.log(`📊 ID: ${blazeData.round_id}`)
      console.log(`🎯 Número: ${blazeData.number}`)
      console.log(`🎨 Cor: ${blazeData.color}`)

             // Salvar no Supabase
       await this.saveBlazeDataToSupabase(blazeData)
      
      // ✅ CORREÇÃO: Usar o mesmo ID gerado
      this.lastKnownRound = optimizedId
      
    } catch (error) {
      console.error('❌ Erro processando dados:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * SALVAR DADOS NO SUPABASE (APENAS DADOS REAIS)
   */
  private async saveBlazeDataToSupabase(data: BlazeRealData): Promise<void> {
    try {
      // ✅ CORREÇÃO CRÍTICA: NÃO gerar novo ID! Usar o que já foi passado
      const finalRoundId = data.round_id || this.generateOptimizedId(data.id || `fallback_${Date.now()}`)
      
      const { error } = await supabase
        .from('blaze_real_data')
        .insert({
          number: data.number,
          color: data.color,
          round_id: finalRoundId, // ✅ USAR ID EXISTENTE OU GERAR APENAS SE NECESSÁRIO
          timestamp_blaze: data.timestamp_blaze,
          source: data.source
        })

      if (error) {
        console.log('⚠️ Erro salvando dados reais no Supabase:', error.message)
      } else {
        console.log('💾 Dados REAIS salvos no Supabase com sucesso')
      }
    } catch (error) {
      console.log('⚠️ Supabase indisponível:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * EXECUTAR SCRIPT CHROMIUM LOCALMENTE (DESENVOLVIMENTO)
   */
  private async executeChromiumScriptLocally(): Promise<ChromiumCaptureResult> {
    try {
      console.log('🎯 EXECUTANDO: Script Chromium real em desenvolvimento...')
      
      // Executar script Node.js real do Chromium via endpoint interno
      const response = await fetch('/api/chromium-execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'capture_blaze_local',
          timeout: 30000 
        })
      })
      
      if (!response.ok) {
        throw new Error(`Chromium script execution failed: ${response.status}`)
      }
      
      const apiResponse = await response.json()
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Chromium execution failed')
      }
      
      const result = apiResponse.data
      
      if (!result || !result.numero) {
        throw new Error('Invalid data format from Chromium script')
      }
      
      console.log(`✅ DESENVOLVIMENTO: Script Chromium executado - ${result.corEmoji} ${result.corNome} (${result.numero})`)
      return result
      
    } catch (error) {
      console.error('❌ DESENVOLVIMENTO: Erro ao executar script Chromium:', error)
      
      // Fallback: usar proxy local diretamente
      console.log('🔄 FALLBACK: Usando proxy local como alternativa...')
      throw error
    }
  }

  /**
   * NOVA ESTRATÉGIA: CAPTURA VIA CHROMIUM
   */
  private async tryChromiumCapture(): Promise<void> {
    try {
      console.log('🎯 CHROMIUM: Iniciando captura via navegador...')
      
      // Detectar ambiente
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      let result: ChromiumCaptureResult;
      
      if (isDevelopment) {
        // EM DESENVOLVIMENTO: Executar script diretamente
        console.log('🔧 DESENVOLVIMENTO: Executando script Chromium local...')
        result = await this.executeChromiumScriptLocally()
      } else {
        // EM PRODUÇÃO: Usar endpoint API
        console.log('🚀 PRODUÇÃO: Usando endpoint /api/chromium-capture...')
        const response = await fetch('/api/chromium-capture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'capture_blaze' })
        })
        
        if (!response.ok) {
          throw new Error(`Chromium capture failed: ${response.status}`)
        }
        
        result = await response.json()
      }
      
      // ✅ CORREÇÃO: Gerar ID apenas uma vez
      const optimizedId = this.generateOptimizedId(result.id)

      // Converter para formato padrão
      const data: BlazeRealData = {
        id: result.id,
        round_id: optimizedId, // ✅ USAR O MESMO ID
        number: result.numero,
        color: result.corNome.toLowerCase() as 'red' | 'black' | 'white',
        timestamp_blaze: result.timestamp,
        source: 'chromium_capture'
      }
      
      console.log('✅ CHROMIUM: Dados capturados com sucesso!')
      console.log(`🎯 Número: ${data.number}`)
      console.log(`🎨 Cor: ${data.color}`)
      console.log(`🆔 ID: ${data.id}`)
      console.log(`⏰ Timestamp: ${data.timestamp_blaze}`)
      
             // Configurar estratégia e processar dados
       this.currentStrategy = 'CHROMIUM_REAL_TIME'
       // ✅ CORREÇÃO: Usar o mesmo ID gerado
       this.lastKnownRound = optimizedId
      
      // Processar primeiro dado
      await this.processRealData(data)
      
      // Iniciar polling via Chromium
      this.startChromiumPolling()
      
    } catch (error) {
      console.error('❌ CHROMIUM FALHOU:', error instanceof Error ? error.message : String(error))
      console.log('🛑 SISTEMA PARADO: Chromium é o único método para dados REAIS')
      console.log('💡 DICA: Verifique se o Chromium está funcionando corretamente')
      
      // Marcar como não disponível e parar captura
      this.chromiumAvailable = false
      this.isCapturing = false
      this.currentStrategy = 'CHROMIUM_ERRO_FATAL'
      
      // Emitir erro para interface
      if (typeof window !== 'undefined') {
        const errorEvent = new CustomEvent('blazeConnectionError', { 
          detail: { 
            error: `Chromium falhou: ${error instanceof Error ? error.message : String(error)}`,
            strategy: 'CHROMIUM_PRIMARIO',
            timestamp: getBrazilTimestamp()
          }
        })
        window.dispatchEvent(errorEvent)
      }
    }
  }

  /**
   * POLLING VIA CHROMIUM
   */
  private startChromiumPolling(): void {
    console.log('🚀 Iniciando polling via Chromium a cada 10 segundos (DADOS REAIS)...')
    
    // Polling a cada 10 segundos (otimizado para captura primária)
    this.pollingInterval = setInterval(() => {
      this.checkViaChromium()
    }, 10000)
  }

  /**
   * VERIFICAR VIA CHROMIUM
   */
  private async checkViaChromium(): Promise<void> {
    try {
      // Detectar ambiente
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      let result: ChromiumCaptureResult;
      
      if (isDevelopment) {
        // EM DESENVOLVIMENTO: Executar script diretamente
        result = await this.executeChromiumScriptLocally()
      } else {
        // EM PRODUÇÃO: Usar endpoint API
        const response = await fetch('/api/chromium-capture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'capture_blaze' })
        })

        if (!response.ok) {
          throw new Error(`Chromium polling failed: ${response.status}`)
        }

        result = await response.json()
      }
      
      // Verificar se é um jogo novo
      if (this.lastKnownRound && this.lastKnownRound === result.id) {
        // Log throttling: apenas a cada 30 segundos para reduzir poluição
        const now = Date.now()
        if (now - this.lastWaitingLogTime > this.LOG_THROTTLE_INTERVAL) {
          this.waitingLogCount++
          console.log(`🔄 Aguardando novo jogo... (atual: ${result.numero}) [${this.waitingLogCount}x]`)
          this.lastWaitingLogTime = now
        }
        return
      }

      // NOVO JOGO REAL DETECTADO VIA CHROMIUM!
      console.log(`🆕 NOVO JOGO REAL VIA CHROMIUM!`)
      console.log(`📊 ID: ${result.id}`)
      console.log(`🎯 Número: ${result.numero}`)
      console.log(`🎨 Cor: ${result.corNome}`)
      console.log(`⏰ Horário: ${result.timestamp}`)

      // ✅ CORREÇÃO: Gerar ID apenas uma vez
      const optimizedId = this.generateOptimizedId(result.id)

      // Converter para formato padrão
      const data: BlazeRealData = {
        id: result.id,
        round_id: optimizedId, // ✅ USAR O MESMO ID
        number: result.numero,
        color: result.corNome.toLowerCase() as 'red' | 'black' | 'white',
        timestamp_blaze: result.timestamp,
        source: 'chromium_polling'
      }

      await this.processRealData(data)
      // ✅ CORREÇÃO: Usar o mesmo ID gerado
      this.lastKnownRound = optimizedId
      
      // Emitir evento para interface
      if (typeof window !== 'undefined') {
        const realDataEvent = new CustomEvent('blazeRealData', { 
          detail: data
        });
        window.dispatchEvent(realDataEvent);
        console.log(`📡 Evento blazeRealData emitido (Chromium): ${data.number} (${data.color}) - ${data.round_id}`);
      }

    } catch (error) {
      console.log('❌ ERRO CHROMIUM POLLING:', error instanceof Error ? error.message : String(error))
      console.log('🔄 FALLBACK: Voltando para estratégias tradicionais...')
      
      // Fallback para proxy tradicional
      this.stopCapturing()
      this.chromiumAvailable = false
      
      // Reiniciar com estratégias tradicionais
      setTimeout(() => {
        this.startCapturing()
      }, 5000)
    }
  }

  /**
   * LIDAR COM ERRO FATAL
   */
  private handleFatalError(message: string): void {
    console.error(`💀 ERRO FATAL: ${message}`)
    this.currentStrategy = 'ERRO_FATAL'
    this.isCapturing = false
    
    // Limpar polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    // Notificar erro
    this.listeners.forEach(callback => callback({
      status: 'ERRO_FATAL',
      error: message,
      timestamp: getBrazilTimestamp()
    }))
  }

  /**
   * ✅ ETAPA 3: FUNÇÃO CENTRAL PARA UNIFICAR TODAS AS FONTES DE DADOS
   * 
   * Combina dados de:
   * - Supabase blaze_real_data (dados reais capturados)
   * - Supabase user_csv_data (dados históricos CSV)
   * - IndexedDB local (backup local)
   * - localStorage (backup emergência)
   * - realDataHistory (dados em memória)
   */
  async getAllUnifiedData(): Promise<BlazeRealData[]> {
    // ✅ PROBLEMA 4: Função unificadora silenciosa
    const allData: BlazeRealData[] = []
    const seenRoundIds = new Set<string>()
    
    try {
      // 1️⃣ BUSCAR DADOS REAIS DO SUPABASE COM PAGINAÇÃO (ULTRAPASSAR LIMITE 1000)
      let allRealData: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const startRange = page * pageSize
        const endRange = startRange + pageSize - 1
        
        const { data: pageData, error: pageError } = await supabase
          .from('blaze_real_data')
          .select('*')
          .order('timestamp_blaze', { ascending: false })
          .range(startRange, endRange)
        
        if (pageError) {
          console.error(`❌ Erro na página ${page + 1}: ${pageError.message}`)
          break
        }
        
        if (pageData && pageData.length > 0) {
          allRealData = [...allRealData, ...pageData]
          
          // Se retornou menos que o pageSize, chegamos ao fim
          if (pageData.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }
      
      const realData = allRealData
      const realError = null

      if (realError) {
        console.error(`❌ Erro buscando dados reais: ${realError}`)
      } else if (realData && realData.length > 0) {
        realData.forEach(item => {
          const roundId = item.round_id || item.id
          if (roundId && !seenRoundIds.has(roundId)) {
            seenRoundIds.add(roundId)
            allData.push({
              id: item.id,
              round_id: roundId,
              number: item.number,
              color: item.color as 'red' | 'black' | 'white',
              timestamp_blaze: item.timestamp_blaze || item.created_at,
              source: 'blaze_real_api'
            })
          }
        })
      }

      // 2️⃣ BUSCAR DADOS CSV DO SUPABASE (HISTÓRICOS)
      const { data: csvData, error: csvError } = await supabase
        .from('user_csv_data')
        .select('*')
        .eq('data_type', 'csv_import')
        .order('timestamp_data', { ascending: false })
        .limit(10000) // ✅ BUSCAR ATÉ 10K REGISTROS CSV

      if (csvError) {
        console.error(`❌ Erro buscando dados CSV: ${csvError.message}`)
      } else if (csvData && csvData.length > 0) {
        csvData.forEach(item => {
          const roundId = `csv_${item.id}_${item.timestamp_data}`
          if (!seenRoundIds.has(roundId)) {
            seenRoundIds.add(roundId)
            allData.push({
              id: `csv_${item.id}`,
              round_id: roundId,
              number: item.number,
              color: item.color as 'red' | 'black' | 'white',
              timestamp_blaze: item.timestamp_data,
              source: 'csv_import'
            })
          }
        })
      }

      // 3️⃣ VERIFICAR DADOS EM MEMÓRIA (REAL DATA HISTORY)
      if (typeof window !== 'undefined') {
        try {
          // Tentar acessar dados da interface (se disponível)
          const memoryData = (window as any).realDataHistory || []
          if (memoryData.length > 0) {
            memoryData.forEach((item: any, index: number) => {
              const roundId = item.round_id || item.id || `memory_${index}_${item.timestamp}`
              if (!seenRoundIds.has(roundId)) {
                seenRoundIds.add(roundId)
                allData.push({
                  id: item.id || `memory_${index}`,
                  round_id: roundId,
                  number: item.number,
                  color: item.color as 'red' | 'black' | 'white',
                  timestamp_blaze: item.timestamp_blaze || item.timestamp || Date.now(),
                  source: 'memory_cache'
                })
              }
            })
          }
        } catch (memoryError) {
          console.error('❌ Erro acessando dados em memória:', memoryError)
        }
      }

      // 4️⃣ VERIFICAR LOCALSTORAGE BACKUP
      if (typeof window !== 'undefined') {
        try {
          const backupData = localStorage.getItem('blaze_analyzer_backup')
          if (backupData) {
            const parsed = JSON.parse(backupData)
            if (parsed.results && Array.isArray(parsed.results)) {
              parsed.results.forEach((item: any, index: number) => {
                const roundId = item.id || `backup_${index}_${item.timestamp}`
                if (!seenRoundIds.has(roundId)) {
                  seenRoundIds.add(roundId)
                  allData.push({
                    id: item.id || `backup_${index}`,
                    round_id: roundId,
                    number: item.number,
                    color: item.color as 'red' | 'black' | 'white',
                    timestamp_blaze: item.timestamp || Date.now(),
                    source: 'localStorage_backup'
                  })
                }
              })
            }
          }
        } catch (backupError) {
          console.error('❌ Erro acessando localStorage backup:', backupError)
        }
      }

      // 5️⃣ ORDENAR DADOS POR TIMESTAMP (MAIS ANTIGOS PRIMEIRO)
      allData.sort((a, b) => {
        const timestampA = new Date(a.timestamp_blaze || 0).getTime()
        const timestampB = new Date(b.timestamp_blaze || 0).getTime()
        return timestampA - timestampB
      })

      // ✅ DADOS UNIFICADOS - RETORNO LIMPO
      return allData

    } catch (error) {
      console.error('❌ ERRO NA UNIFICAÇÃO DE DADOS:', error)
      return []
    }
  }

  /**
   * 🚨 MÉTODO PÚBLICO: FORÇAR RESET DO SISTEMA DE CAPTURA
   * Use quando o sistema estiver travado
   */
  public forceSystemReset(): void {
    console.log('🚨 FORÇANDO RESET COMPLETO DO SISTEMA DE CAPTURA...')
    
    // Reset de estado
    this.lastKnownRound = null
    this.waitingLogCount = 0
    this.lastWaitingLogTime = 0
    
    // Reset do anti-loop
    this.processedDataHashes.clear()
    
    // Limpar polling existente
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    console.log('✅ RESET COMPLETO REALIZADO!')
    console.log('🔄 Reiniciando captura em 2 segundos...')
    
    // Reiniciar captura
    setTimeout(() => {
      this.startCapturing()
    }, 2000)
  }

  /**
   * 🔍 MÉTODO PÚBLICO: OBTER STATUS DO SISTEMA
   */
  public getSystemStatus() {
    return {
      isCapturing: this.isCapturing,
      currentStrategy: this.currentStrategy,
      lastKnownRound: this.lastKnownRound,
      waitingLogCount: this.waitingLogCount
    }
  }
}

// Exportar instância singleton
const blazeRealDataService = new BlazeRealDataService()

// 🚨 FUNÇÃO GLOBAL PARA RESET MANUAL VIA CONSOLE
if (typeof window !== 'undefined') {
  (window as any).forceResetBlazeCapture = () => {
    console.log('🚨 EXECUTANDO RESET MANUAL VIA CONSOLE...')
    blazeRealDataService.forceSystemReset()
  }
  
  (window as any).debugBlazeStatus = () => {
    const status = blazeRealDataService.getSystemStatus()
    console.log('🔍 STATUS ATUAL DO SISTEMA BLAZE:')
    console.log(`  - isCapturing: ${status.isCapturing}`)
    console.log(`  - currentStrategy: ${status.currentStrategy}`)
    console.log(`  - lastKnownRound: ${status.lastKnownRound}`)
    console.log(`  - waitingLogCount: ${status.waitingLogCount}`)
  }
  
  console.log('💡 DICAS:')
  console.log('  - Para forçar reset: forceResetBlazeCapture()')
  console.log('  - Para ver status: debugBlazeStatus()')
}

export default blazeRealDataService