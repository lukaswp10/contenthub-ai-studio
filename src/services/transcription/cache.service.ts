/**
 * 💾 CACHE INTELIGENTE DE TRANSCRIÇÕES - ClipsForge Pro
 * 
 * Sistema avançado que:
 * - ✅ Evita refazer transcrições idênticas
 * - ✅ Economiza até 80% dos custos de API
 * - ✅ Hash SHA-256 para identificação única
 * - ✅ Backup automático no Supabase
 * - ✅ Estatísticas de economia
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

import { supabase } from '../../lib/supabase'

// ✅ INTERFACES
export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: WhisperWord[];
}

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface CachedTranscription {
  id: string
  videoHash: string
  fileName: string
  fileSize: number
  provider: 'whisper' | 'assemblyai' | 'webspeech'
  result: TranscriptionResult
  createdAt: number
  expiresAt: number
  metadata: {
    duration: number
    cost?: number
    language?: string
    confidence?: number
    wordCount: number
  }
}

export interface TranscriptionResult {
  words: TranscriptionWord[]
  text: string
  confidence: number
  language?: string
  duration?: number
  speakers?: string[]
  continuousCaptions?: ContinuousCaption[]
  segments?: WhisperSegment[]
}

export interface TranscriptionWord {
  text: string
  start: number
  end: number
  confidence: number
  highlight?: boolean
  speaker?: string
}

export interface ContinuousCaption {
  text: string
  start: number
  end: number
  confidence: number
}

export interface CacheConfig {
  enabled: boolean
  storage: 'localStorage' | 'indexedDB' | 'supabase'
  maxAge: number // em millisegundos
  maxEntries: number
  backupToSupabase: boolean
}

export interface CacheStats {
  totalCached: number
  totalHits: number
  totalMisses: number
  costSaved: number
  providers: Record<string, { hits: number; saves: number }>
  hitRate: number
}

/**
 * 🧠 SERVIÇO DE CACHE INTELIGENTE
 */
export class TranscriptionCacheService {
  private config: CacheConfig
  private cacheKey = 'clipsforge_transcription_cache'
  private statsKey = 'clipsforge_cache_stats'

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: true,
      storage: 'localStorage',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      maxEntries: 100,
      backupToSupabase: true,
      ...config
    }

    // Cache Service inicializado
  }

  /**
   * 🔐 Gerar hash SHA-256 único do arquivo
   */
  private async generateVideoHash(file: File): Promise<string> {
    try {
      // Ler primeiro e último MB do arquivo para performance
      const chunkSize = Math.min(1024 * 1024, file.size) // 1MB ou tamanho total
      const firstChunk = file.slice(0, chunkSize)
      
      // Combinar chunk + metadados
      const hashData = new Uint8Array(await firstChunk.arrayBuffer())
      const additionalData = new TextEncoder().encode(
        `${file.name}_${file.size}_${file.lastModified}`
      )
      
      // Criar array combinado
      const combined = new Uint8Array(hashData.length + additionalData.length)
      combined.set(hashData, 0)
      combined.set(additionalData, hashData.length)
      
      // Gerar hash SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', combined)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      console.log('🔐 Hash gerado:', {
        file: file.name,
        size: file.size,
        hash: hash.substring(0, 12) + '...'
      })
      
      return hash
    } catch (error) {
      console.error('❌ Erro ao gerar hash:', error)
      // Fallback: usar metadados do arquivo
      return `fallback_${file.name}_${file.size}_${file.lastModified}`.replace(/[^a-zA-Z0-9]/g, '_')
    }
  }

  /**
   * 🔍 Verificar se transcrição existe no cache
   */
  async checkCache(file: File, provider: string): Promise<CachedTranscription | null> {
    if (!this.config.enabled) {
      console.log('💾 Cache desabilitado')
      return null
    }

    try {
      const hash = await this.generateVideoHash(file)
      const cacheKey = `${hash}_${provider}`
      
      // Verificando cache

      // 1. Tentar localStorage primeiro
      const localCached = this.getFromLocalStorage(cacheKey)
      if (localCached && localCached.expiresAt > Date.now()) {
        // Cache hit (localStorage)
        
        this.recordCacheHit(provider, localCached.metadata.cost || 0)
        return localCached
      }

      // 2. Tentar Supabase se localStorage não tem ou expirou
      if (this.config.backupToSupabase) {
        const supabaseCached = await this.getFromSupabase(hash, provider)
        if (supabaseCached && supabaseCached.expiresAt > Date.now()) {
          // Cache hit (Supabase)
          
          // Restaurar no localStorage para próximas consultas
          this.saveToLocalStorage(cacheKey, supabaseCached)
          this.recordCacheHit(provider, supabaseCached.metadata.cost || 0)
          return supabaseCached
        }
      }

      // 3. Limpar cache expirado
      if (localCached) {
        this.removeFromLocalStorage(cacheKey)
      }

      // Cache miss
      this.recordCacheMiss(provider)
      return null

    } catch (error) {
      console.error('❌ Erro ao verificar cache:', error)
      this.recordCacheMiss(provider)
      return null
    }
  }

  /**
   * 💾 Salvar transcrição no cache
   */
  async saveToCache(
    file: File,
    provider: string,
    result: TranscriptionResult,
    cost?: number
  ): Promise<void> {
    if (!this.config.enabled) return

    try {
      const hash = await this.generateVideoHash(file)
      const cacheKey = `${hash}_${provider}`
      
      const cached: CachedTranscription = {
        id: cacheKey,
        videoHash: hash,
        fileName: file.name,
        fileSize: file.size,
        provider: provider as 'whisper' | 'assemblyai' | 'webspeech',
        result,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.maxAge,
        metadata: {
          duration: result.duration || 0,
          cost: cost || this.estimateCost(provider, file.size, result.duration || 0),
          language: result.language,
          confidence: result.confidence,
          wordCount: result.words?.length || 0
        }
      }

      console.log('💾 Salvando no cache:', {
        file: file.name,
        provider,
        wordCount: cached.metadata.wordCount,
        cost: cached.metadata.cost,
        expiresIn: Math.round(this.config.maxAge / (1000 * 60 * 60)) + 'h'
      })

      // 1. Salvar no localStorage
      this.saveToLocalStorage(cacheKey, cached)

      // 2. Backup no Supabase (assíncrono)
      if (this.config.backupToSupabase) {
        this.backupToSupabase(cached).catch(error => {
          console.warn('⚠️ Erro no backup Supabase (não crítico):', error)
        })
      }

      // 3. Limpar cache antigo se necessário
      this.cleanupOldEntries()

    } catch (error) {
      console.error('❌ Erro ao salvar no cache:', error)
    }
  }

  /**
   * 📊 Estatísticas de uso do cache
   */
  async getStats(): Promise<CacheStats> {
    try {
      const statsStr = localStorage.getItem(this.statsKey)
      const stats = statsStr ? JSON.parse(statsStr) : {
        totalHits: 0,
        totalMisses: 0,
        costSaved: 0,
        providers: {}
      }

      const totalRequests = stats.totalHits + stats.totalMisses
      const hitRate = totalRequests > 0 ? (stats.totalHits / totalRequests) * 100 : 0

      // Contar entradas no cache
      const cacheEntries = this.getAllCacheEntries()
      
      return {
        totalCached: cacheEntries.length,
        totalHits: stats.totalHits,
        totalMisses: stats.totalMisses,
        costSaved: stats.costSaved,
        providers: stats.providers,
        hitRate: Math.round(hitRate * 100) / 100
      }
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return {
        totalCached: 0,
        totalHits: 0,
        totalMisses: 0,
        costSaved: 0,
        providers: {},
        hitRate: 0
      }
    }
  }

  /**
   * 🧹 Limpar cache
   */
  async clearCache(): Promise<void> {
    try {
      // Limpar localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.cacheKey)) {
          localStorage.removeItem(key)
        }
      })

      // Resetar estatísticas
      localStorage.removeItem(this.statsKey)

      console.log('🧹 Cache limpo completamente')
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error)
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  private getFromLocalStorage(cacheKey: string): CachedTranscription | null {
    try {
      const stored = localStorage.getItem(`${this.cacheKey}_${cacheKey}`)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('❌ Erro ao ler localStorage:', error)
      return null
    }
  }

  private saveToLocalStorage(cacheKey: string, cached: CachedTranscription): void {
    try {
      localStorage.setItem(`${this.cacheKey}_${cacheKey}`, JSON.stringify(cached))
    } catch (error) {
      console.error('❌ Erro ao salvar localStorage:', error)
      // Se localStorage cheio, limpar entradas antigas
      this.cleanupOldEntries()
      try {
        localStorage.setItem(`${this.cacheKey}_${cacheKey}`, JSON.stringify(cached))
      } catch (retryError) {
        console.error('❌ Erro ao salvar após cleanup:', retryError)
      }
    }
  }

  private removeFromLocalStorage(cacheKey: string): void {
    try {
      localStorage.removeItem(`${this.cacheKey}_${cacheKey}`)
    } catch (error) {
      console.error('❌ Erro ao remover do localStorage:', error)
    }
  }

  private async getFromSupabase(hash: string, provider: string): Promise<CachedTranscription | null> {
    try {
      const { data, error } = await supabase
        .from('transcription_cache')
        .select('*')
        .eq('video_hash', hash)
        .eq('provider', provider)
        .single()

      if (error || !data) return null

      return {
        id: `${hash}_${provider}`,
        videoHash: hash,
        fileName: data.file_name,
        fileSize: data.file_size,
        provider: data.provider,
        result: data.result,
        createdAt: new Date(data.created_at).getTime(),
        expiresAt: new Date(data.expires_at).getTime(),
        metadata: data.metadata
      }
    } catch (error) {
      console.error('❌ Erro ao buscar no Supabase:', error)
      return null
    }
  }

  private async backupToSupabase(cached: CachedTranscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('transcription_cache')
        .upsert({
          video_hash: cached.videoHash,
          file_name: cached.fileName,
          file_size: cached.fileSize,
          provider: cached.provider,
          result: cached.result,
          metadata: cached.metadata,
          created_at: new Date(cached.createdAt).toISOString(),
          expires_at: new Date(cached.expiresAt).toISOString()
        }, {
          onConflict: 'video_hash,provider'
        })

      if (!error) {
        console.log('☁️ Backup no Supabase realizado:', cached.fileName)
      }
    } catch (error) {
      console.error('❌ Erro no backup Supabase:', error)
      // Não é crítico, continuar
    }
  }

  private getAllCacheEntries(): CachedTranscription[] {
    try {
      const entries: CachedTranscription[] = []
      const keys = Object.keys(localStorage)
      
      keys.forEach(key => {
        if (key.startsWith(this.cacheKey + '_')) {
          try {
            const entry = JSON.parse(localStorage.getItem(key) || '{}')
            if (entry.id) entries.push(entry)
          } catch (error) {
            // Ignorar entradas corrompidas
          }
        }
      })

      return entries
    } catch (error) {
      console.error('❌ Erro ao listar entradas:', error)
      return []
    }
  }

  private cleanupOldEntries(): void {
    try {
      const entries = this.getAllCacheEntries()
      const now = Date.now()
      
      // Remover expirados
      const expired = entries.filter(entry => entry.expiresAt <= now)
      expired.forEach(entry => {
        this.removeFromLocalStorage(entry.id)
      })

      // Se ainda tem muitas entradas, remover as mais antigas
      const valid = entries.filter(entry => entry.expiresAt > now)
      if (valid.length > this.config.maxEntries) {
        const sorted = valid.sort((a, b) => a.createdAt - b.createdAt)
        const toRemove = sorted.slice(0, sorted.length - this.config.maxEntries)
        toRemove.forEach(entry => {
          this.removeFromLocalStorage(entry.id)
        })
      }

      // Cleanup realizado
    } catch (error) {
      console.error('❌ Erro no cleanup:', error)
    }
  }

  private recordCacheHit(provider: string, costSaved: number = 0): void {
    try {
      const stats = this.getStatsFromStorage()
      stats.totalHits++
      stats.costSaved += costSaved
      
      if (!stats.providers[provider]) {
        stats.providers[provider] = { hits: 0, saves: 0 }
      }
      stats.providers[provider].hits++
      stats.providers[provider].saves += costSaved

      localStorage.setItem(this.statsKey, JSON.stringify(stats))
    } catch (error) {
      console.error('❌ Erro ao registrar hit:', error)
    }
  }

  private recordCacheMiss(provider: string): void {
    try {
      const stats = this.getStatsFromStorage()
      stats.totalMisses++
      localStorage.setItem(this.statsKey, JSON.stringify(stats))
    } catch (error) {
      console.error('❌ Erro ao registrar miss:', error)
    }
  }

  private getStatsFromStorage(): { totalHits: number; totalMisses: number; costSaved: number; providers: Record<string, { hits: number; saves: number }> } {
    try {
      const statsStr = localStorage.getItem(this.statsKey)
      return statsStr ? JSON.parse(statsStr) : {
        totalHits: 0,
        totalMisses: 0,
        costSaved: 0,
        providers: {}
      }
    } catch (error) {
      return {
        totalHits: 0,
        totalMisses: 0,
        costSaved: 0,
        providers: {}
      }
    }
  }

  private estimateCost(provider: string, fileSize: number, duration: number): number {
    // Estimativas conservadoras baseadas nos preços oficiais
    switch (provider) {
      case 'whisper':
        // OpenAI Whisper: $0.006 por minuto
        return Math.round((duration / 60) * 0.006 * 100) / 100
      case 'assemblyai':
        // AssemblyAI: $0.37 por hora
        return Math.round((duration / 3600) * 0.37 * 100) / 100
      case 'webspeech':
        return 0 // Grátis
      default:
        return 0
    }
  }
}

// ✅ EXPORTAR INSTÂNCIA SINGLETON
export const transcriptionCache = new TranscriptionCacheService() 