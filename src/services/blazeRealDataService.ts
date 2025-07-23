import { supabase } from '../lib/supabase'

interface BlazeRealData {
  id?: string
  number: number
  color: 'red' | 'black' | 'white'
  round_id: string
  timestamp_blaze: string
  timestamp_captured?: string
  source: string
  created_at?: string
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

class BlazeRealDataService {
  private isCapturing: boolean = false
  private currentStrategy: string = 'DESCONECTADO'
  private pollingInterval: NodeJS.Timeout | null = null
  private lastKnownRound: string | null = null
  private currentProxy: string | null = null
  private listeners: Array<(update: any) => void> = []
  
  // URL do nosso proxy local
  private readonly PROXY_URL = '/api/blaze-proxy'

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
   * ESTRATÉGIA: DETECÇÃO INTELIGENTE DESENVOLVIMENTO VS PRODUÇÃO
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
      console.log('🔧 DESENVOLVIMENTO: Usando estratégias alternativas para CORS...')
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
      
      // Usar o proxy da API local criado especificamente para isso
      const LOCAL_PROXY_URL = `${window.location.origin}/api/blaze-proxy`
      
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
      
      console.log('✅ PROXY LOCAL FUNCIONANDO! Dados reais da Blaze obtidos:')
      console.log(`🎯 Número: ${data.number}`)
      console.log(`🎨 Cor: ${data.color}`)
      console.log(`🆔 ID: ${data.id}`)
      
             // Configurar para usar proxy local
       this.currentStrategy = 'PROXY_DADOS_REAIS'
      this.lastKnownRound = result.data.round_id
      
      // Processar primeiro dado
      await this.processRealData(result.data)
      
      // Iniciar polling
      this.startProxyPolling()
      
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
    console.log('🚀 Iniciando polling via proxy a cada 4 segundos...')
    
    // Polling a cada 4 segundos
    this.pollingInterval = setInterval(() => {
      this.checkViaProxy()
    }, 4000)
  }

  /**
   * VERIFICAR VIA PROXY
   */
  private async checkViaProxy(): Promise<void> {
    try {
      // Usar proxy local para desenvolvimento e produção
      const proxyUrl = `${window.location.origin}${this.PROXY_URL}`
      
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
      
      if (!data || !data.round_id) {
        console.log('⚠️ Dados processados são inválidos')
        return
      }

      // Verificar se é um jogo novo
      if (this.lastKnownRound && this.lastKnownRound === data.round_id) {
        console.log(`🔄 Aguardando novo jogo... (atual: ${data.number})`)
        return
      }

      // NOVO JOGO REAL DETECTADO VIA PROXY!
      console.log(`🆕 NOVO JOGO REAL VIA PROXY!`)
      console.log(`📊 ID: ${data.round_id}`)
      console.log(`🎯 Número: ${data.number}`)
      console.log(`🎨 Cor: ${data.color}`)
      console.log(`⏰ Horário: ${data.timestamp_blaze}`)

      await this.processRealData(data)
      this.lastKnownRound = data.round_id
      
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
   * PROCESSAR APENAS DADOS REAIS
   */
  private async processRealData(data: BlazeRealData): Promise<void> {
    try {
      // Verificar se já existe este round_id
      const { data: existing } = await supabase
        .from('blaze_real_data')
        .select('id')
        .eq('round_id', data.round_id)
        .single()

      if (existing) {
        console.log(`⚠️ Round ${data.round_id} já existe`)
        return
      }

      // Salvar no Supabase
      const { error } = await supabase
        .from('blaze_real_data')
        .insert(data)

      if (error) {
        console.log('❌ Erro salvando no Supabase:', error)
        return
      }

      console.log(`✅ DADOS REAIS SALVOS: ${data.number} (${data.color})`)

      // Emitir evento para a interface
      this.emitRealData(data)

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
      console.log('📡 Dados reais emitidos para interface')
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
   * GERAR PREDIÇÃO BASEADA EM DADOS REAIS
   */
  private async makePredictionBasedOnRealData(): Promise<void> {
    try {
      // Buscar últimos 20 dados reais
      const { data: recentData } = await supabase
        .from('blaze_real_data')
        .select('*')
        .order('timestamp_blaze', { ascending: false })
        .limit(20)

      if (!recentData || recentData.length < 5) {
        console.log('⚠️ Dados insuficientes para predição automática (mínimo 5 números)')
        return
      }

      // Análise simples de frequência
      const colorCounts = { red: 0, black: 0, white: 0 }
      const numberCounts: { [key: number]: number } = {}

      recentData.forEach(item => {
        if (item.color in colorCounts) {
          colorCounts[item.color as keyof typeof colorCounts]++
        }
        numberCounts[item.number] = (numberCounts[item.number] || 0) + 1
      })

      // Predição baseada na cor menos frequente
      const totalGames = recentData.length
      const colorPercentages = {
        red: (colorCounts.red / totalGames) * 100,
        black: (colorCounts.black / totalGames) * 100,
        white: (colorCounts.white / totalGames) * 100
      }

      const leastFrequentColor = (Object.keys(colorPercentages) as Array<keyof typeof colorPercentages>).reduce((a, b) => 
        colorPercentages[a] < colorPercentages[b] ? a : b
      )

      // Números mais prováveis para a cor predita
      const numbersForColor = recentData
        .filter(item => item.color === leastFrequentColor)
        .map(item => item.number)
        .slice(0, 3)

      const prediction: SystemPrediction = {
        predicted_color: leastFrequentColor,
        predicted_numbers: numbersForColor.length > 0 ? numbersForColor : [0],
        confidence_percentage: Math.round(100 - colorPercentages[leastFrequentColor]),
        ml_algorithms_used: { frequency_analysis: true, real_data: recentData.length },
        data_size_used: recentData.length,
        round_target: 'next'
      }

      // Salvar predição
      const { error } = await supabase
        .from('system_predictions')
        .insert(prediction)

      if (!error) {
        console.log(`🤖 Predição baseada em dados reais: ${prediction.predicted_color} (${prediction.confidence_percentage}%)`)
      }

    } catch (error) {
      console.log('❌ Erro gerando predição:', error)
    }
  }

  /**
   * MÉTODOS PÚBLICOS PARA INTERFACE
   */
  getConnectionStatus(): string {
    switch (this.currentStrategy) {
      case 'PROXY_DADOS_REAIS':
        return 'CONECTADO - PROXY DADOS REAIS'
      case 'ERRO_FATAL':
        return 'ERRO FATAL - PROXY INDISPONÍVEL'
      default:
        return 'DESCONECTADO'
    }
  }

  isUsingRealData(): boolean {
    return this.currentStrategy === 'PROXY_DADOS_REAIS'
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
      this.lastKnownRound = blazeData.round_id
      
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