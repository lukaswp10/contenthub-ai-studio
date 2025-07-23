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
  
  // URL do nosso proxy local
  private readonly PROXY_URL = '/api/blaze-proxy'

  constructor() {
    // Verificar se Chromium está disponível
    this.checkChromiumAvailability()
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
   * ESTRATÉGIA: PROXY LOCAL PRIORITÁRIO (FUNCIONA PERFEITAMENTE)
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
      logThrottled('dev-proxy-init', '🚀 DESENVOLVIMENTO: Usando proxy local (DADOS REAIS)...')
      await this.tryDevelopmentStrategies()
    } else {
      console.log('🚀 PRODUÇÃO: Usando proxy serverless...')
      await this.testProxyConnection()
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
        data = {
          id: game.id,
          number: game.roll,
          color: this.mapColor(game.roll, game.color),
          round_id: game.id,
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
      this.lastKnownRound = data.id || data.round_id
      
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
      this.lastKnownRound = data.round_id
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
            timestamp: new Date().toISOString()
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
    console.log('🚀 Iniciando polling via proxy a cada 2 segundos (TEMPO REAL)...')
    
    // Polling a cada 2 segundos para captura mais rápida
    this.pollingInterval = setInterval(() => {
      this.checkViaProxy()
    }, 2000) // Reduzido para captura mais frequente
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
            round_id: game.id,
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
      
      // Verificar se dados são válidos (aceita id ou round_id)
      const gameId = data.round_id || data.id
      if (!data || !gameId) {
        console.log('⚠️ Dados processados são inválidos')
        return
      }

      // Verificar se é um jogo novo (considerar ID e timestamp)
      const dataTimestamp = new Date(data.timestamp_blaze || data.created_at).getTime()
      const isOldData = dataTimestamp < (Date.now() - (24 * 60 * 60 * 1000)) // Dados de mais de 24h são considerados antigos
      const timeDiff = Math.abs(Date.now() - dataTimestamp) / 1000 // Diferença em segundos
      
      // Se é o mesmo ID E é muito recente (menos de 5 minutos), aguardar
      if (this.lastKnownRound && this.lastKnownRound === gameId && timeDiff < 300 && !isOldData) {
        // Log throttling: apenas a cada 30 segundos para reduzir poluição
        const now = Date.now()
        if (now - this.lastWaitingLogTime > this.LOG_THROTTLE_INTERVAL) {
          this.waitingLogCount++
          console.log(`🔄 Aguardando novo jogo... (atual: ${data.number}, ${Math.round(timeDiff)}s atrás) [${this.waitingLogCount}x]`)
          this.lastWaitingLogTime = now
        }
        return
      }
      
      // Se é o mesmo ID mas é antigo (mais de 5 minutos), processar mesmo assim
      if (this.lastKnownRound && this.lastKnownRound === gameId && timeDiff >= 300) {
        console.log(`🔄 Mesmo ID mas dados antigos, forçando processamento (${Math.round(timeDiff)}s atrás)`)
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

      await this.processRealData(data)
      this.lastKnownRound = gameId
      
      // Emitir evento para interface
      if (typeof window !== 'undefined') {
        const realDataEvent = new CustomEvent('blazeRealData', { 
          detail: data
        });
        window.dispatchEvent(realDataEvent);
        console.log('📡 Evento blazeRealData emitido:', data);
      }

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
            timestamp: new Date().toISOString()
          }
        })
        window.dispatchEvent(errorEvent)
      }
    }
  }

  /**
   * Gerar UUID válido a partir de string
   */
  private generateUuidFromString(str: string): string {
    // Se já parece um UUID, usar como está
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      return str
    }
    
    // Criar hash mais robusto
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    
    // Gerar UUID v4 válido baseado no hash
    const hex = Math.abs(hash).toString(16).padStart(8, '0').repeat(4).substr(0, 32)
    
    return [
      hex.substr(0, 8),
      hex.substr(8, 4),
      '4' + hex.substr(12, 3), // Version 4
      '8' + hex.substr(16, 3), // Variant bits
      hex.substr(20, 12)
    ].join('-')
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

      // Verificar duplicata local (não bloquear por Supabase)
      logThrottled('processing-round', `🔄 Processando round: ${roundId}`)
      
      const uuidRoundId = this.generateUuidFromString(roundId)

      // Tentar verificar no Supabase (opcional)
      try {
        const { data: existing } = await supabase
          .from('blaze_real_data')
          .select('id')
          .eq('round_id', uuidRoundId)
          .single()

        if (existing) {
          console.log(`⚠️ Round ${roundId} já existe no Supabase (mas processando mesmo assim)`)
        }
      } catch (error) {
        console.log(`⚠️ Não foi possível verificar duplicata no Supabase (continuando)`)
      }

      // Normalizar dados para salvar (sem campo id para evitar conflitos UUID)
      const normalizedData = {
        number: data.number,
        color: data.color,
        timestamp_blaze: data.timestamp_blaze,
        round_id: this.generateUuidFromString(roundId)
      }

      // Debug: ver exatamente o que será enviado
      console.log('🔍 DADOS PARA SUPABASE:', JSON.stringify(normalizedData, null, 2))

      // Emitir evento para a interface SEMPRE (independente do Supabase)
      this.emitRealData(data)
      logThrottled('data-emitted', `📡 DADOS EMITIDOS PARA INTERFACE: ${normalizedData.number} (${normalizedData.color})`)

      // Tentar salvar no Supabase (opcional - não bloquear se falhar)
      try {
        const { error } = await supabase
          .from('blaze_real_data')
          .insert(normalizedData)

        if (error) {
          console.log('⚠️ Supabase falhou (não crítico):', error.message || error)
          console.log('✅ Dados ainda assim enviados para interface')
        } else {
          console.log(`💾 DADOS SALVOS NO SUPABASE: ${normalizedData.number} (${normalizedData.color})`)
        }
      } catch (supabaseError) {
        console.log('⚠️ Supabase indisponível (continuando sem ele):', supabaseError)
      }

      // Gerar predição automática
      await this.makePredictionBasedOnRealData()

    } catch (error) {
      console.log('❌ Erro processando dados reais:', error)
    }
  }

  /**
   * EMITIR APENAS DADOS REAIS PARA INTERFACE
   */
  private emitRealData(data: BlazeRealData): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('blazeRealData', { detail: data })
      window.dispatchEvent(event)
      logThrottled('data-emitted-to-interface', '📡 Dados reais emitidos para interface')
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
   * FORÇAR RESET PARA DADOS ATUAIS
   */
  forceReset(): void {
    console.log('🔄 FORÇANDO RESET: Limpando cache de dados antigos...')
    this.lastKnownRound = null
    this.currentStrategy = 'DESCONECTADO'
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    console.log('✅ Reset concluído - próximo polling buscará dados atuais')
  }

  /**
   * GERAR PREDIÇÃO BASEADA EM DADOS REAIS - SISTEMA ML AVANÇADO
   */
  private async makePredictionBasedOnRealData(): Promise<void> {
    try {
      // ✅ ETAPA 2: BUSCAR TODOS OS DADOS HISTÓRICOS DISPONÍVEIS
      const { data: historicalData } = await supabase
        .from('blaze_real_data')
        .select('*')
        .order('timestamp_blaze', { ascending: false })
        .limit(10000) // EXPANSÃO MASSIVA: 100x mais dados!

      if (!historicalData || historicalData.length < 50) {
        console.log('⚠️ Dados insuficientes para predição ML avançada (mínimo 50 números)')
        await this.fallbackToSimplePrediction(historicalData || [])
        return
      }

      console.log(`🚀 ETAPA 2: ANÁLISE MASSIVA com ${historicalData.length} dados históricos!`)

      console.log('🚀 Iniciando predição com ML avançado...')

      // Tentar usar sistema ML avançado
      try {
        const { advancedMLService } = await import('./advancedMLPredictionService')
        
        // Converter dados para formato ML
        const blazeDataPoints = historicalData.map(item => ({
          number: item.number,
          color: item.color as 'red' | 'black' | 'white',
          timestamp: new Date(item.timestamp_blaze || item.created_at).getTime(),
          round_id: item.round_id
        })).reverse() // Ordem cronológica

        // Executar predição avançada
        const advancedPrediction = await advancedMLService.makePrediction(blazeDataPoints)

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

        // Salvar predição avançada
        const { error } = await supabase
          .from('system_predictions')
          .insert(prediction)

        if (!error) {
          console.log(`🤖 PREDIÇÃO ML AVANÇADA: ${prediction.predicted_color} (${prediction.confidence_percentage}%)`)
          console.log(`📊 Consensus: ${advancedPrediction.model_consensus}% | Modelos: ${advancedPrediction.individual_predictions.length}`)
          console.log(`🎯 Números: [${prediction.predicted_numbers.join(', ')}]`)
          console.log(`⚠️ Risco: ${advancedPrediction.risk_assessment.volatility_level} | Estabilidade: ${(advancedPrediction.risk_assessment.prediction_stability * 100).toFixed(1)}%`)
        }

        // Salvar predição detalhada para análise
        await this.saveAdvancedPredictionDetails(advancedPrediction)

              } catch (mlError) {
          console.warn('⚠️ Sistema ML avançado falhou, usando fallback:', mlError)
          await this.fallbackToSimplePrediction(historicalData || [])
        }

    } catch (error) {
      console.log('❌ Erro gerando predição:', error)
    }
  }

  /**
   * FALLBACK: PREDIÇÃO SIMPLES QUANDO ML AVANÇADO FALHA
   */
  private async fallbackToSimplePrediction(data: any[]): Promise<void> {
    try {
      // ✅ ETAPA 2: FALLBACK MELHORADO - USAR MAIS DADOS
      const recentData = data?.slice(0, 200) || [] // 10x mais dados no fallback

      if (recentData.length < 10) {
        console.log('⚠️ Dados insuficientes para qualquer predição')
        return
      }

      console.log(`🔧 FALLBACK MELHORADO: Analisando ${recentData.length} números`)

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

      if (!error) {
        console.log(`🤖 Predição simples (fallback): ${prediction.predicted_color} (${prediction.confidence_percentage}%)`)
      }

    } catch (error) {
      console.log('❌ Erro na predição fallback:', error)
    }
  }

  /**
   * SALVAR DETALHES DA PREDIÇÃO AVANÇADA
   */
  private async saveAdvancedPredictionDetails(prediction: any): Promise<void> {
    try {
      // Salvar métricas detalhadas para análise
      const detailedRecord = {
        timestamp: new Date().toISOString(),
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

      // Mapear dados
      const blazeData: BlazeRealData = {
        id: gameData.id,
        number: gameData.roll,
        color: this.mapColor(gameData.roll, gameData.color),
        round_id: gameData.id,
        timestamp_blaze: gameData.created_at,
        source: 'blaze_real_api'
      }

      console.log(`🆕 NOVO JOGO REAL DETECTADO!`)
      console.log(`📊 ID: ${blazeData.round_id}`)
      console.log(`🎯 Número: ${blazeData.number}`)
      console.log(`🎨 Cor: ${blazeData.color}`)

             // Salvar no Supabase
       await this.saveBlazeDataToSupabase(blazeData)
      
      // Atualizar controle
      this.lastKnownRound = blazeData.round_id || null
      
    } catch (error) {
      console.error('❌ Erro processando dados:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * SALVAR DADOS NO SUPABASE (APENAS DADOS REAIS)
   */
  private async saveBlazeDataToSupabase(data: BlazeRealData): Promise<void> {
    try {
      const { error } = await supabase
        .from('blaze_real_data')
        .insert({
          number: data.number,
          color: data.color,
          round_id: data.round_id,
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
      
      // Converter para formato padrão
      const data: BlazeRealData = {
        id: result.id,
        round_id: result.id,
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
       this.lastKnownRound = data.id || null
      
      // Processar primeiro dado
      await this.processRealData(data)
      
      // Iniciar polling via Chromium
      this.startChromiumPolling()
      
    } catch (error) {
      console.error('❌ CHROMIUM FALHOU:', error instanceof Error ? error.message : String(error))
      console.log('🔄 FALLBACK: Tentando estratégias alternativas...')
      
      // Fallback para estratégias tradicionais
      this.chromiumAvailable = false
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      if (isDevelopment) {
        await this.tryDevelopmentStrategies()
      } else {
        await this.testProxyConnection()
      }
    }
  }

  /**
   * POLLING VIA CHROMIUM
   */
  private startChromiumPolling(): void {
    console.log('🚀 Iniciando polling via Chromium a cada 15 segundos...')
    
    // Polling a cada 15 segundos (Chromium é mais pesado)
    this.pollingInterval = setInterval(() => {
      this.checkViaChromium()
    }, 15000)
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

      // Converter para formato padrão
      const data: BlazeRealData = {
        id: result.id,
        round_id: result.id,
        number: result.numero,
        color: result.corNome.toLowerCase() as 'red' | 'black' | 'white',
        timestamp_blaze: result.timestamp,
        source: 'chromium_polling'
      }

      await this.processRealData(data)
      this.lastKnownRound = result.id || null
      
      // Emitir evento para interface
      if (typeof window !== 'undefined') {
        const realDataEvent = new CustomEvent('blazeRealData', { 
          detail: data
        });
        window.dispatchEvent(realDataEvent);
        console.log('📡 Evento blazeRealData emitido (Chromium):', data);
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
      timestamp: new Date().toISOString()
    }))
  }
}

// Exportar instância singleton
const blazeRealDataService = new BlazeRealDataService()
export default blazeRealDataService