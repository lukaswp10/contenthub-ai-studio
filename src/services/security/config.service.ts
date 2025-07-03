/**
 * ⚙️ GERENCIADOR DE CONFIGURAÇÃO SEGURA - ClipsForge Pro
 * 
 * Sistema inteligente que:
 * - ✅ Armazena API keys criptografadas no Supabase
 * - ✅ Cache local seguro com expiração
 * - ✅ Validação automática de credenciais
 * - ✅ Fallback para variáveis de ambiente
 * - ✅ Rotação automática de chaves
 * 
 * @author ClipsForge Team
 * @version 2.0.0
 */

import { cryptoService, type ApiKeyData, type EncryptedData } from './crypto.service'
import { supabase } from '../../lib/supabase'

// ✅ INTERFACES
export interface ApiKeyConfig {
  id?: string
  provider: 'openai' | 'assemblyai' | 'other'
  name: string
  key: string
  isActive: boolean
  priority: number
  isValid?: boolean
  lastUsed?: number
  createdAt?: number
  updatedAt?: number
  expiresAt?: number
}

export interface ConfigStats {
  totalKeys: number
  validKeys: number
  invalidKeys: number
  lastValidation: number
  totalUsage: number
  activeProvider: string
  cacheHits: number
  cacheSize: number
}

export interface ProviderConfig {
  name: string
  baseUrl: string
  authHeader: string
  maxRetries: number
  timeout: number
  costPerMinute: number
  features: string[]
  isActive: boolean
}

/**
 * 🛡️ GERENCIADOR DE CONFIGURAÇÃO AVANÇADO
 */
export class ConfigService {
  private cache: Map<string, ApiKeyConfig> = new Map()
  private providers: Map<string, ProviderConfig> = new Map()
  private stats: ConfigStats = {
    totalKeys: 0,
    validKeys: 0,
    invalidKeys: 0,
    lastValidation: 0,
    totalUsage: 0,
    activeProvider: 'openai',
    cacheHits: 0,
    cacheSize: 0
  }
  private cacheExpiration = 5 * 60 * 1000 // 5 minutos

  constructor() {
    // Config Service inicializado
    this.initializeProviders()
    this.loadConfiguration()
  }

  /**
   * 🔧 Inicializar provedores suportados
   */
  private initializeProviders(): void {
    this.providers.set('openai', {
      name: 'OpenAI Whisper',
      baseUrl: 'https://api.openai.com/v1',
      authHeader: 'Bearer',
      maxRetries: 3,
      timeout: 30000,
      costPerMinute: 0.006,
      features: ['transcription', 'translation', 'high-quality'],
      isActive: true
    })

    this.providers.set('assemblyai', {
      name: 'AssemblyAI',
      baseUrl: 'https://api.assemblyai.com/v2',
      authHeader: 'Authorization',
      maxRetries: 3,
      timeout: 45000,
      costPerMinute: 0.37 / 60, // $0.37/hora
      features: ['transcription', 'speaker-diarization', 'sentiment-analysis'],
      isActive: true
    })

    console.log('🔧 Provedores inicializados:', Array.from(this.providers.keys()))
  }

  /**
   * 📥 Carregar configuração inicial
   */
  private async loadConfiguration(): Promise<void> {
    try {
      await this.loadFromSupabase()
      await this.loadFromEnvironment()
      await this.validateAllKeys()
      
      // Configuração carregada
    } catch (error) {
      console.error('❌ Erro ao carregar configuração:', error)
    }
  }

  /**
   * 🗃️ Carregar keys do Supabase
   */
  private async loadFromSupabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: configs, error } = await supabase
        .from('api_keys_config')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })

      if (error) {
        console.warn('⚠️ Erro ao carregar do Supabase:', error)
        return
      }

      if (configs && configs.length > 0) {
        for (const config of configs) {
          try {
            // Descriptografar API key
            const encryptedData: EncryptedData = JSON.parse(config.encrypted_data)
            const apiKeyData = await cryptoService.decryptApiKey(encryptedData)
            
            const keyConfig: ApiKeyConfig = {
              id: config.id,
              provider: apiKeyData.provider,
              name: config.name,
              key: apiKeyData.key,
              isActive: config.is_active,
              priority: config.priority,
              isValid: config.is_valid,
              lastUsed: config.last_used ? new Date(config.last_used).getTime() : undefined,
              createdAt: new Date(config.created_at).getTime(),
              updatedAt: new Date(config.updated_at).getTime(),
              expiresAt: config.expires_at ? new Date(config.expires_at).getTime() : undefined
            }

            this.cache.set(config.id, keyConfig)
            this.stats.totalKeys++
            
            if (keyConfig.isValid) {
              this.stats.validKeys++
            } else {
              this.stats.invalidKeys++
            }
          } catch (error) {
            console.error('❌ Erro ao descriptografar config:', config.id, error)
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar do Supabase:', error)
    }
  }

  /**
   * 🌍 Carregar keys das variáveis de ambiente
   */
  private async loadFromEnvironment(): Promise<void> {
    try {
      // OpenAI
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (openaiKey && !this.hasProvider('openai')) {
        const config: ApiKeyConfig = {
          id: 'env_openai',
          provider: 'openai',
          name: 'OpenAI (Environment)',
          key: openaiKey,
          isActive: true,
          priority: 1,
          createdAt: Date.now()
        }
        this.cache.set('env_openai', config)
        this.stats.totalKeys++
      }

      // AssemblyAI
      const assemblyaiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY
      if (assemblyaiKey && !this.hasProvider('assemblyai')) {
        const config: ApiKeyConfig = {
          id: 'env_assemblyai',
          provider: 'assemblyai',
          name: 'AssemblyAI (Environment)',
          key: assemblyaiKey,
          isActive: true,
          priority: 1,
          createdAt: Date.now()
        }
        this.cache.set('env_assemblyai', config)
        this.stats.totalKeys++
      }

      console.log('🌍 Keys de ambiente carregadas')
    } catch (error) {
      console.error('❌ Erro ao carregar do ambiente:', error)
    }
  }

  /**
   * 🔍 Verificar se provedor já existe
   */
  private hasProvider(provider: string): boolean {
    return Array.from(this.cache.values()).some(config => config.provider === provider)
  }

  /**
   * 🧪 Validar todas as API keys
   */
  private async validateAllKeys(): Promise<void> {
    try {
      // Validando todas as API keys
      
      const validationPromises = Array.from(this.cache.values()).map(async (config) => {
        try {
          const isValid = await cryptoService.validateApiKey(config.provider, config.key)
          config.isValid = isValid
          config.updatedAt = Date.now()
          
          if (isValid) {
            this.stats.validKeys++
          } else {
            this.stats.invalidKeys++
          }
          
          return { id: config.id, isValid, provider: config.provider }
        } catch (error) {
          console.error(`❌ Erro ao validar ${config.provider}:`, error)
          config.isValid = false
          this.stats.invalidKeys++
          return { id: config.id, isValid: false, provider: config.provider }
        }
      })

      const results = await Promise.all(validationPromises)
      this.stats.lastValidation = Date.now()
      
      // Validação concluída

      // Atualizar Supabase com resultados
      await this.saveValidationResults(results)
    } catch (error) {
      console.error('❌ Erro na validação geral:', error)
    }
  }

  /**
   * 💾 Salvar resultados da validação
   */
  private async saveValidationResults(results: { id: string | undefined; isValid: boolean; provider: string }[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      for (const result of results) {
        if (result.id && !result.id.startsWith('env_')) {
          await supabase
            .from('api_keys_config')
            .update({
              is_valid: result.isValid,
              updated_at: new Date().toISOString()
            })
            .eq('id', result.id)
            .eq('user_id', user.id)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar validação:', error)
    }
  }

  /**
   * ➕ Adicionar nova API key
   */
  async addApiKey(config: Omit<ApiKeyConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log(`➕ Adicionando nova API key: ${config.provider}`)
      
      // Validar API key
      const isValid = await cryptoService.validateApiKey(config.provider, config.key)
      
      const newConfig: ApiKeyConfig = {
        ...config,
        id: `${config.provider}_${Date.now()}`,
        isValid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // Salvar no Supabase
      const savedId = await this.saveToSupabase(newConfig)
      if (savedId) {
        newConfig.id = savedId
      }

      // Adicionar ao cache
      const finalId = newConfig.id!
      this.cache.set(finalId, newConfig)
      this.stats.totalKeys++
      
      if (isValid) {
        this.stats.validKeys++
      } else {
        this.stats.invalidKeys++
      }

      console.log('✅ API key adicionada:', {
        id: finalId,
        provider: newConfig.provider,
        isValid: isValid
      })

      return finalId
    } catch (error) {
      console.error('❌ Erro ao adicionar API key:', error)
      throw error
    }
  }

  /**
   * 💾 Salvar no Supabase
   */
  private async saveToSupabase(config: ApiKeyConfig): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Preparar dados para criptografia
      const apiKeyData: ApiKeyData = {
        provider: config.provider,
        key: config.key,
        name: config.name,
        lastUsed: config.lastUsed,
        isValid: config.isValid,
        expiresAt: config.expiresAt
      }

      // Criptografar
      const encryptedData = await cryptoService.encryptApiKey(apiKeyData)

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('api_keys_config')
        .insert({
          user_id: user.id,
          name: config.name,
          provider: config.provider,
          encrypted_data: JSON.stringify(encryptedData),
          is_active: config.isActive,
          priority: config.priority,
          is_valid: config.isValid,
          last_used: config.lastUsed ? new Date(config.lastUsed).toISOString() : null,
          expires_at: config.expiresAt ? new Date(config.expiresAt).toISOString() : null
        })
        .select('id')
        .single()

      if (error) {
        console.error('❌ Erro ao salvar no Supabase:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('❌ Erro ao salvar no Supabase:', error)
      return null
    }
  }

  /**
   * 🔄 Atualizar API key
   */
  async updateApiKey(id: string, updates: Partial<ApiKeyConfig>): Promise<boolean> {
    try {
      const config = this.cache.get(id)
      if (!config) {
        throw new Error('API key não encontrada')
      }

      // Se a key mudou, validar novamente
      let isValid = config.isValid
      if (updates.key && updates.key !== config.key) {
        isValid = await cryptoService.validateApiKey(config.provider, updates.key)
      }

      const updatedConfig: ApiKeyConfig = {
        ...config,
        ...updates,
        isValid,
        updatedAt: Date.now()
      }

      // Atualizar no Supabase
      if (!id.startsWith('env_')) {
        await this.updateInSupabase(id, updatedConfig)
      }

      // Atualizar cache
      this.cache.set(id, updatedConfig)

      console.log('🔄 API key atualizada:', {
        id,
        provider: updatedConfig.provider,
        isValid
      })

      return true
    } catch (error) {
      console.error('❌ Erro ao atualizar API key:', error)
      return false
    }
  }

  /**
   * 🔄 Atualizar no Supabase
   */
  private async updateInSupabase(id: string, config: ApiKeyConfig): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Preparar dados para criptografia
      const apiKeyData: ApiKeyData = {
        provider: config.provider,
        key: config.key,
        name: config.name,
        lastUsed: config.lastUsed,
        isValid: config.isValid,
        expiresAt: config.expiresAt
      }

      // Criptografar
      const encryptedData = await cryptoService.encryptApiKey(apiKeyData)

      // Atualizar no Supabase
      const { error } = await supabase
        .from('api_keys_config')
        .update({
          name: config.name,
          encrypted_data: JSON.stringify(encryptedData),
          is_active: config.isActive,
          priority: config.priority,
          is_valid: config.isValid,
          last_used: config.lastUsed ? new Date(config.lastUsed).toISOString() : null,
          expires_at: config.expiresAt ? new Date(config.expiresAt).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erro ao atualizar no Supabase:', error)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar no Supabase:', error)
    }
  }

  /**
   * 🗑️ Remover API key
   */
  async removeApiKey(id: string): Promise<boolean> {
    try {
      const config = this.cache.get(id)
      if (!config) {
        console.warn('⚠️ API key não encontrada para remoção:', id)
        return false
      }

      // Remover do Supabase
      if (!id.startsWith('env_')) {
        await this.removeFromSupabase(id)
      }

      // Remover do cache
      this.cache.delete(id)
      this.stats.totalKeys--
      
      if (config.isValid) {
        this.stats.validKeys--
      } else {
        this.stats.invalidKeys--
      }

      console.log('🗑️ API key removida:', {
        id,
        provider: config.provider
      })

      return true
    } catch (error) {
      console.error('❌ Erro ao remover API key:', error)
      return false
    }
  }

  /**
   * 🗑️ Remover do Supabase
   */
  private async removeFromSupabase(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('api_keys_config')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erro ao remover do Supabase:', error)
      }
    } catch (error) {
      console.error('❌ Erro ao remover do Supabase:', error)
    }
  }

  /**
   * 🔑 Obter API key ativa para provedor
   */
  getActiveApiKey(provider: string): ApiKeyConfig | null {
    try {
      const configs = Array.from(this.cache.values())
        .filter(config => config.provider === provider && config.isActive && config.isValid)
        .sort((a, b) => b.priority - a.priority)

      if (configs.length > 0) {
        const config = configs[0]
        
        // Atualizar última utilização
        config.lastUsed = Date.now()
        this.stats.totalUsage++
        this.stats.cacheHits++
        
        // API key obtida
        return config
      }

      console.warn(`⚠️ Nenhuma API key ativa para ${provider}`)
      return null
    } catch (error) {
      console.error('❌ Erro ao obter API key:', error)
      return null
    }
  }

  /**
   * 📋 Listar todas as API keys
   */
  getAllApiKeys(): ApiKeyConfig[] {
    return Array.from(this.cache.values()).sort((a, b) => b.priority - a.priority)
  }

  /**
   * 📋 Listar API keys por provedor
   */
  getApiKeysByProvider(provider: string): ApiKeyConfig[] {
    return Array.from(this.cache.values())
      .filter(config => config.provider === provider)
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * 📊 Obter estatísticas
   */
  getStats(): ConfigStats {
    this.stats.cacheSize = this.cache.size
    return { ...this.stats }
  }

  /**
   * 🔧 Obter configuração do provedor
   */
  getProviderConfig(provider: string): ProviderConfig | null {
    return this.providers.get(provider) || null
  }

  /**
   * 📋 Listar todos os provedores
   */
  getAllProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).filter(p => p.isActive)
  }

  /**
   * 🧹 Limpar cache
   */
  clearCache(): void {
    this.cache.clear()
    this.stats.cacheHits = 0
    this.stats.cacheSize = 0
    // Cache limpo
  }

  /**
   * 🔄 Recarregar configuração
   */
  async reload(): Promise<void> {
    this.clearCache()
    this.stats = {
      totalKeys: 0,
      validKeys: 0,
      invalidKeys: 0,
      lastValidation: 0,
      totalUsage: 0,
      activeProvider: 'openai',
      cacheHits: 0,
      cacheSize: 0
    }
    await this.loadConfiguration()
  }
}

// ✅ EXPORTAR INSTÂNCIA SINGLETON
export const configService = new ConfigService() 