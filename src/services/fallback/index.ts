/**
 * 🔄 SISTEMA DE FALLBACK INTELIGENTE - FASE 3 OTIMIZADA
 * Integração completa com analytics avançados
 */

// Re-exportar do serviço principal otimizado
export { 
  type ProviderConfig,
  type ProviderHealth,
  type CircuitBreakerState,
  type FallbackStrategy,
  FallbackService,
  fallbackService as intelligentFallback
} from './fallback.service'

// Importar para uso interno
import { FallbackService, fallbackService, type ProviderHealth, type CircuitBreakerState } from './fallback.service'

// Tipos de compatibilidade para integração
export interface ProviderStatus {
  id: string
  name: string
  healthy: boolean
  responseTime: number
  lastError?: string
  circuitBreakerOpen: boolean
}

export interface FallbackResult<T> {
  result: T
  providerId: string
  attempts: number
  fallbackUsed: boolean
}

// Classe wrapper para compatibilidade com código existente
export class IntelligentFallback {
  private fallbackService: FallbackService

  constructor() {
    this.fallbackService = fallbackService
    console.log('🔄 IntelligentFallback (wrapper) inicializado')
  }

  /**
   * 🎯 Executar com fallback inteligente (compatibilidade)
   */
  async executeWithFallback<T>(
    operations: { [providerId: string]: () => Promise<T> },
    preferredOrder: string[] = ['openai', 'assemblyai', 'webspeech']
  ): Promise<FallbackResult<T>> {
    
    // Mapear IDs para nova nomenclatura
    const providerMap: { [key: string]: string } = {
      'openai': 'openai-whisper',
      'assemblyai': 'assemblyai', 
      'webspeech': 'webspeech'
    }

    // Converter operações para nova estrutura
    const mappedOperations: { [key: string]: () => Promise<T> } = {}
    Object.entries(operations).forEach(([oldId, operation]) => {
      const newId = providerMap[oldId] || oldId
      mappedOperations[newId] = operation
    })

    // Mapear ordem preferida
    const mappedOrder = preferredOrder.map(id => providerMap[id] || id)

    // Executar com fallback service
    const result = await this.fallbackService.executeWithFallback(
      async (providerId: string) => {
        const operation = mappedOperations[providerId]
        if (!operation) {
          throw new Error(`Operação não encontrada para ${providerId}`)
        }
        return await operation()
      },
      'quality',
      { tokens: 0, fileSize: 0 }
    )

    // Converter resultado para formato compatível
    return {
      result: result.result,
      providerId: Object.keys(providerMap).find(key => providerMap[key] === result.providerId) || result.providerId,
      attempts: result.attempts,
      fallbackUsed: result.attempts > 1
    }
  }

  /**
   * 📊 Obter status dos provedores (compatibilidade)
   */
  getProvidersStatus(): ProviderStatus[] {
    const stats = this.fallbackService.getSystemStats()
    
    return stats.providers.map((provider: { id: string; health: ProviderHealth; circuitBreaker: CircuitBreakerState }) => ({
      id: provider.id === 'openai-whisper' ? 'openai' : provider.id,
      name: provider.health.id === 'openai-whisper' ? 'OpenAI Whisper' : 
            provider.health.id === 'assemblyai' ? 'AssemblyAI' : 
            'Web Speech',
      healthy: provider.health.status === 'healthy',
      responseTime: provider.health.responseTime,
      lastError: provider.health.lastError,
      circuitBreakerOpen: provider.circuitBreaker.state === 'open'
    }))
  }

  /**
   * 🏥 Health check manual (compatibilidade)
   */
  resetProviderHealth(providerId: string) {
    const providerMap: { [key: string]: string } = {
      'openai': 'openai-whisper',
      'assemblyai': 'assemblyai',
      'webspeech': 'webspeech'
    }
    
    const mappedId = providerMap[providerId] || providerId
    this.fallbackService.forceHealthCheck()
    console.log(`🔄 Health resetado para ${providerId} (${mappedId})`)
  }
}
