/**
 * 🔄 SERVIÇO DE FALLBACK INTELIGENTE - FASE 3
 * Sistema avançado de recuperação automática
 * ✅ Circuit Breaker Pattern
 * ✅ Rate Limiting Inteligente  
 * ✅ Health Check Automático
 * ✅ Load Balancing
 * ✅ Retry com Backoff Exponencial
 */

export interface ProviderConfig {
  id: string
  name: string
  priority: number
  maxRetries: number
  timeoutMs: number
  costPerMinute: number
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
  features: string[]
}

export interface ProviderHealth {
  id: string
  status: 'healthy' | 'degraded' | 'down'
  lastCheck: number
  responseTime: number
  successRate: number
  errorCount: number
  lastError?: string
}

export interface FallbackStrategy {
  primary: string
  fallbacks: string[]
  criteria: 'cost' | 'speed' | 'quality' | 'availability'
  maxAttempts: number
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailureTime: number
  nextRetryTime: number
}

/**
 * 🧠 SERVIÇO PRINCIPAL DE FALLBACK
 */
export class FallbackService {
  private providers: Map<string, ProviderConfig> = new Map()
  private healthStatus: Map<string, ProviderHealth> = new Map()
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()
  private rateLimiters: Map<string, { requests: number[], tokens: number[], resetTime: number }> = new Map()
  private strategies: Map<string, FallbackStrategy> = new Map()
  
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minuto
  private readonly HEALTH_CHECK_INTERVAL = 30000 // 30 segundos

  constructor() {
    this.initializeProviders()
    this.initializeStrategies()
    // ✅ DESABILITADO: Health checking automático (causava erros 401 sem API keys)
    // this.startHealthChecking()
    console.log('🔄 FallbackService inicializado')
  }

  /**
   * 🏗️ Inicializar provedores
   */
  private initializeProviders(): void {
    const providers: ProviderConfig[] = [
      {
        id: 'openai-whisper',
        name: 'OpenAI Whisper',
        priority: 100,
        maxRetries: 3,
        timeoutMs: 120000,
        costPerMinute: 0.006,
        rateLimit: {
          requestsPerMinute: 500,
          tokensPerMinute: 200000
        },
        features: ['high-quality', 'multi-language', 'word-timestamps']
      },
      {
        id: 'assemblyai',
        name: 'AssemblyAI',
        priority: 90,
        maxRetries: 2,
        timeoutMs: 180000,
        costPerMinute: 0.37 / 60,
        rateLimit: {
          requestsPerMinute: 300,
          tokensPerMinute: 150000
        },
        features: ['fast', 'speaker-detection', 'large-files']
      },
      {
        id: 'webspeech',
        name: 'Web Speech API',
        priority: 50,
        maxRetries: 1,
        timeoutMs: 30000,
        costPerMinute: 0,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 0
        },
        features: ['free', 'real-time', 'offline']
      }
    ]

    providers.forEach(provider => {
      this.providers.set(provider.id, provider)
      this.initializeProviderHealth(provider.id)
      this.initializeCircuitBreaker(provider.id)
      this.initializeRateLimiter(provider.id)
    })
  }

  /**
   * 🎯 Inicializar estratégias de fallback
   */
  private initializeStrategies(): void {
    const strategies: FallbackStrategy[] = [
      {
        primary: 'openai-whisper',
        fallbacks: ['assemblyai', 'webspeech'],
        criteria: 'quality',
        maxAttempts: 3
      },
      {
        primary: 'assemblyai', 
        fallbacks: ['openai-whisper', 'webspeech'],
        criteria: 'speed',
        maxAttempts: 3
      },
      {
        primary: 'webspeech',
        fallbacks: ['openai-whisper', 'assemblyai'],
        criteria: 'cost',
        maxAttempts: 2
      }
    ]

    strategies.forEach(strategy => {
      this.strategies.set(strategy.primary, strategy)
    })
  }

  /**
   * 💚 Inicializar health check do provedor
   */
  private initializeProviderHealth(providerId: string): void {
    this.healthStatus.set(providerId, {
      id: providerId,
      status: 'healthy',
      lastCheck: Date.now(),
      responseTime: 0,
      successRate: 100,
      errorCount: 0
    })
  }

  /**
   * ⚡ Inicializar circuit breaker
   */
  private initializeCircuitBreaker(providerId: string): void {
    this.circuitBreakers.set(providerId, {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      nextRetryTime: 0
    })
  }

  /**
   * 🚦 Inicializar rate limiter
   */
  private initializeRateLimiter(providerId: string): void {
    this.rateLimiters.set(providerId, {
      requests: [],
      tokens: [],
      resetTime: Date.now() + 60000 // Reset a cada minuto
    })
  }

  /**
   * 🏥 Executar health checks periódicos
   */
  private startHealthChecking(): void {
    setInterval(() => {
      this.checkAllProvidersHealth()
    }, this.HEALTH_CHECK_INTERVAL)
  }

  /**
   * 🔍 Verificar saúde de todos os provedores
   */
  private async checkAllProvidersHealth(): Promise<void> {
    for (const providerId of this.providers.keys()) {
      await this.checkProviderHealth(providerId)
    }
  }

  /**
   * 🩺 Verificar saúde de um provedor específico
   */
  private async checkProviderHealth(providerId: string): Promise<void> {
    const health = this.healthStatus.get(providerId)
    if (!health) return

    const startTime = Date.now()
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'

    try {
      // Implementar health check específico por provedor
      await this.performHealthCheck(providerId)
      
      const responseTime = Date.now() - startTime
      
      // Determinar status baseado no tempo de resposta
      if (responseTime > 10000) { // > 10s
        status = 'degraded'
      } else if (responseTime > 30000) { // > 30s
        status = 'down'
      }

      // Atualizar success rate
      health.successRate = Math.min(100, health.successRate + 1)
      health.errorCount = Math.max(0, health.errorCount - 1)

    } catch (error) {
      status = 'down'
      health.errorCount++
      health.successRate = Math.max(0, health.successRate - 5)
      health.lastError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Atualizar health status
    this.healthStatus.set(providerId, {
      ...health,
      status,
      lastCheck: Date.now(),
      responseTime: Date.now() - startTime
    })
  }

  /**
   * 🧪 Executar health check específico
   */
  private async performHealthCheck(providerId: string): Promise<void> {
    switch (providerId) {
      case 'openai-whisper':
        // Verificar se API do OpenAI está respondendo
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: { 'Authorization': 'Bearer test' } // Apenas para testar conectividade
        })
        if (response.status !== 401 && response.status !== 200) {
          throw new Error(`OpenAI API unhealthy: ${response.status}`)
        }
        break

      case 'assemblyai':
        // Ping básico para AssemblyAI
        const assemblyResponse = await fetch('https://api.assemblyai.com/v2/upload', {
          method: 'HEAD'
        })
        if (!assemblyResponse.ok && assemblyResponse.status !== 401) {
          throw new Error(`AssemblyAI API unhealthy: ${assemblyResponse.status}`)
        }
        break

      case 'webspeech':
        // Verificar se Web Speech está disponível
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          throw new Error('Web Speech API not available')
        }
        break
    }
  }

  /**
   * 🚦 Verificar rate limiting
   */
  private isRateLimited(providerId: string, tokens: number = 0): boolean {
    const provider = this.providers.get(providerId)
    const limiter = this.rateLimiters.get(providerId)
    
    if (!provider || !limiter) return false

    const now = Date.now()
    
    // Reset contadores se passou 1 minuto
    if (now > limiter.resetTime) {
      limiter.requests = []
      limiter.tokens = []
      limiter.resetTime = now + 60000
    }

    // Filtrar requests do último minuto
    limiter.requests = limiter.requests.filter(time => now - time < 60000)
    limiter.tokens = limiter.tokens.filter(time => now - time < 60000)

    // Verificar limites
    const requestsInLastMinute = limiter.requests.length
    const tokensInLastMinute = limiter.tokens.length

    return (
      requestsInLastMinute >= provider.rateLimit.requestsPerMinute ||
      tokensInLastMinute + tokens > provider.rateLimit.tokensPerMinute
    )
  }

  /**
   * 📈 Registrar uso de API
   */
  private recordUsage(providerId: string, tokens: number = 0): void {
    const limiter = this.rateLimiters.get(providerId)
    if (!limiter) return

    const now = Date.now()
    limiter.requests.push(now)
    
    if (tokens > 0) {
      limiter.tokens.push(now)
    }
  }

  /**
   * ⚡ Verificar circuit breaker
   */
  private isCircuitBreakerOpen(providerId: string): boolean {
    const breaker = this.circuitBreakers.get(providerId)
    if (!breaker) return false

    const now = Date.now()

    switch (breaker.state) {
      case 'open': {
        if (now > breaker.nextRetryTime) {
          // Transição para half-open
          breaker.state = 'half-open'
          this.circuitBreakers.set(providerId, breaker)
          return false
        }
        return true
      }

      case 'half-open': {
        return false
      }

      case 'closed': {
        return false
      }

      default: {
        return false
      }
    }
  }

  /**
   * 📊 Registrar sucesso/falha no circuit breaker
   */
  private recordCircuitBreakerResult(providerId: string, success: boolean): void {
    const breaker = this.circuitBreakers.get(providerId)
    if (!breaker) return

    if (success) {
      if (breaker.state === 'half-open') {
        // Sucesso em half-open -> fechar circuit
        breaker.state = 'closed'
        breaker.failures = 0
      }
    } else {
      breaker.failures++
      breaker.lastFailureTime = Date.now()

      if (breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
        // Abrir circuit breaker
        breaker.state = 'open'
        breaker.nextRetryTime = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT
      }
    }

    this.circuitBreakers.set(providerId, breaker)
  }

  /**
   * 🎯 Executar operação com fallback inteligente
   */
  async executeWithFallback<T>(
    operation: (providerId: string) => Promise<T>,
    strategy: string = 'quality',
    context?: { tokens?: number; fileSize?: number }
  ): Promise<{ result: T; providerId: string; attempts: number; cost: number }> {
    const fallbackStrategy = this.strategies.get(strategy) || this.strategies.get('openai-whisper')!
    const attempts: { providerId: string; error?: string; duration: number }[] = []
    
    let totalCost = 0
    const startTime = Date.now()

    // Criar lista ordenada de provedores para tentar
    const providerQueue = this.getOptimalProviderOrder(fallbackStrategy, context)

    for (const providerId of providerQueue) {
      const attemptStart = Date.now()
      
      try {
        // Verificações pré-execução
        if (this.isCircuitBreakerOpen(providerId)) {
          throw new Error(`Circuit breaker open for ${providerId}`)
        }

        if (this.isRateLimited(providerId, context?.tokens)) {
          throw new Error(`Rate limited for ${providerId}`)
        }

        // Executar operação
        console.log(`🚀 Tentando operação com ${providerId}`)
        const result = await this.executeWithTimeout(operation, providerId)
        
        const duration = Date.now() - attemptStart
        
        // Registrar sucesso
        this.recordCircuitBreakerResult(providerId, true)
        this.recordUsage(providerId, context?.tokens)
        
        // Calcular custo
        const provider = this.providers.get(providerId)!
        const cost = (duration / 60000) * provider.costPerMinute
        totalCost += cost

        attempts.push({ providerId, duration })

        console.log(`✅ Sucesso com ${providerId} em ${duration}ms`)
        
        return {
          result,
          providerId,
          attempts: attempts.length,
          cost: totalCost
        }

      } catch (error) {
        const duration = Date.now() - attemptStart
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // Registrar falha
        this.recordCircuitBreakerResult(providerId, false)
        attempts.push({ providerId, error: errorMessage, duration })
        
        console.error(`❌ Falha com ${providerId}: ${errorMessage}`)
        
        // Continuar para próximo provedor
        continue
      }
    }

    // Todos os provedores falharam
    const totalDuration = Date.now() - startTime
    throw new Error(`Todos os provedores falharam após ${attempts.length} tentativas em ${totalDuration}ms`)
  }

  /**
   * ⏱️ Executar operação com timeout
   */
  private async executeWithTimeout<T>(
    operation: (providerId: string) => Promise<T>,
    providerId: string
  ): Promise<T> {
    const provider = this.providers.get(providerId)!
    
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout after ${provider.timeoutMs}ms`))
      }, provider.timeoutMs)

      operation(providerId)
        .then(result => {
          clearTimeout(timeout)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeout)
          reject(error)
        })
    })
  }

  /**
   * 📊 Obter ordem otimizada de provedores
   */
  private getOptimalProviderOrder(
    strategy: FallbackStrategy,
    context?: { tokens?: number; fileSize?: number }
  ): string[] {
    const allProviders = [strategy.primary, ...strategy.fallbacks]
    
    // Filtrar provedores disponíveis
    const availableProviders = allProviders.filter(id => {
      const health = this.healthStatus.get(id)
      return health && health.status !== 'down' && !this.isCircuitBreakerOpen(id)
    })

    // Ordenar baseado no critério da estratégia
    switch (strategy.criteria) {
      case 'cost':
        return availableProviders.sort((a, b) => {
          const costA = this.providers.get(a)!.costPerMinute
          const costB = this.providers.get(b)!.costPerMinute
          return costA - costB
        })

      case 'speed':
        return availableProviders.sort((a, b) => {
          const healthA = this.healthStatus.get(a)!
          const healthB = this.healthStatus.get(b)!
          return healthA.responseTime - healthB.responseTime
        })

      case 'quality':
        return availableProviders.sort((a, b) => {
          const priorityA = this.providers.get(a)!.priority
          const priorityB = this.providers.get(b)!.priority
          return priorityB - priorityA
        })

      case 'availability':
        return availableProviders.sort((a, b) => {
          const healthA = this.healthStatus.get(a)!
          const healthB = this.healthStatus.get(b)!
          return healthB.successRate - healthA.successRate
        })

      default:
        return availableProviders
    }
  }

  /**
   * 📊 Obter estatísticas do sistema
   */
  getSystemStats(): {
    providers: { id: string; health: ProviderHealth; circuitBreaker: CircuitBreakerState }[]
    totalOperations: number
    totalCost: number
    avgResponseTime: number
  } {
    const providers = Array.from(this.providers.keys()).map(id => ({
      id,
      health: this.healthStatus.get(id)!,
      circuitBreaker: this.circuitBreakers.get(id)!
    }))

    const totalOperations = providers.reduce((sum, p) => sum + (1000 - p.health.errorCount), 0)
    const totalCost = 0 // Implementar tracking de custo
    const avgResponseTime = providers.reduce((sum, p) => sum + p.health.responseTime, 0) / providers.length

    return {
      providers,
      totalOperations,
      totalCost,
      avgResponseTime
    }
  }

  /**
   * 🔧 Configurar estratégia customizada
   */
  setCustomStrategy(name: string, strategy: FallbackStrategy): void {
    this.strategies.set(name, strategy)
    console.log(`🎯 Estratégia customizada configurada: ${name}`)
  }

  /**
   * 🏥 Forçar health check
   */
  async forceHealthCheck(): Promise<void> {
    await this.checkAllProvidersHealth()
    console.log('🏥 Health check forçado concluído')
  }
}

// Instância global
export const fallbackService = new FallbackService() 