/**
 * 🔐 SERVIÇO DE CRIPTOGRAFIA SEGURA - ClipsForge Pro
 * 
 * Sistema avançado que:
 * - ✅ Criptografia AES-256-GCM para API keys
 * - ✅ Derivação de chave PBKDF2 segura
 * - ✅ Salt único por sessão
 * - ✅ Zero exposição de credenciais
 * - ✅ Compatível com Web Crypto API
 * 
 * @author ClipsForge Team
 * @version 2.0.0
 */

// ✅ INTERFACES
export interface EncryptedData {
  encrypted: string // Base64 dos dados criptografados
  iv: string // Base64 do IV
  salt: string // Base64 do salt
  algorithm: string // Algoritmo usado
  keyInfo: {
    iterations: number
    keyLength: number
    hashAlgorithm: string
  }
}

export interface CryptoConfig {
  algorithm: 'AES-GCM'
  keyLength: 256
  ivLength: 12 // 96 bits para AES-GCM
  saltLength: 16 // 128 bits
  iterations: 100000 // PBKDF2 iterations
  hashAlgorithm: 'SHA-256'
}

export interface ApiKeyData {
  provider: 'openai' | 'assemblyai' | 'other'
  key: string
  name?: string
  lastUsed?: number
  isValid?: boolean
  expiresAt?: number
}

/**
 * 🛡️ SERVIÇO DE CRIPTOGRAFIA AVANÇADA
 */
export class CryptoService {
  private config: CryptoConfig
  private masterKey: CryptoKey | null = null
  private sessionSalt: Uint8Array | null = null

  constructor(config?: Partial<CryptoConfig>) {
    this.config = {
      algorithm: 'AES-GCM',
      keyLength: 256,
      ivLength: 12,
      saltLength: 16,
      iterations: 100000,
      hashAlgorithm: 'SHA-256',
      ...config
    }

    console.log('🔐 Crypto Service inicializado com segurança máxima')
    this.initializeSession()
  }

  /**
   * 🔑 Inicializar sessão segura
   */
  private async initializeSession(): Promise<void> {
    try {
      // Gerar salt único para esta sessão
      this.sessionSalt = crypto.getRandomValues(new Uint8Array(this.config.saltLength))
      
      // Derivar chave principal baseada na sessão do usuário
      const userSeed = await this.getUserSeed()
      this.masterKey = await this.deriveKey(userSeed, this.sessionSalt)
      
      console.log('🔐 Sessão criptográfica inicializada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao inicializar sessão segura:', error)
      throw new Error('Falha na inicialização da segurança')
    }
  }

  /**
   * 🌱 Obter seed único do usuário
   */
  private async getUserSeed(): Promise<string> {
    try {
      // Tentar obter ID do usuário do Supabase
      const { supabase } = await import('../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.id) {
        return `clipsforge_${user.id}_security_seed`
      }
      
      // Fallback: usar fingerprint da sessão
      const sessionId = sessionStorage.getItem('clipsforge_session_id') || this.generateSessionId()
      sessionStorage.setItem('clipsforge_session_id', sessionId)
      
      return `clipsforge_${sessionId}_security_seed`
    } catch (error) {
      console.warn('⚠️ Usando seed de fallback:', error)
      return 'clipsforge_fallback_security_seed_' + Date.now()
    }
  }

  /**
   * 🆔 Gerar ID de sessão único
   */
  private generateSessionId(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 🔐 Derivar chave criptográfica segura
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    try {
      // Importar password como chave base
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      )

      // Derivar chave final usando PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.config.iterations,
          hash: this.config.hashAlgorithm
        },
        passwordKey,
        {
          name: this.config.algorithm,
          length: this.config.keyLength
        },
        false,
        ['encrypt', 'decrypt']
      )

      return derivedKey
    } catch (error) {
      console.error('❌ Erro ao derivar chave:', error)
      throw new Error('Falha na derivação da chave')
    }
  }

  /**
   * 🔒 Criptografar API key
   */
  async encryptApiKey(apiKeyData: ApiKeyData): Promise<EncryptedData> {
    try {
      if (!this.masterKey || !this.sessionSalt) {
        await this.initializeSession()
      }

             if (!this.masterKey || !this.sessionSalt) {
         throw new Error('Chave mestra ou salt não disponível')
       }

      // Gerar IV único para esta operação
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength))
      
      // Serializar dados
      const dataToEncrypt = JSON.stringify({
        ...apiKeyData,
        timestamp: Date.now(),
        version: '2.0'
      })
      
      // Criptografar
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv: iv
        },
        this.masterKey,
        new TextEncoder().encode(dataToEncrypt)
      )

      const result: EncryptedData = {
        encrypted: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(this.sessionSalt),
        algorithm: this.config.algorithm,
        keyInfo: {
          iterations: this.config.iterations,
          keyLength: this.config.keyLength,
          hashAlgorithm: this.config.hashAlgorithm
        }
      }

      console.log('🔒 API key criptografada com sucesso:', {
        provider: apiKeyData.provider,
        keyLength: apiKeyData.key.length,
        algorithm: this.config.algorithm
      })

      return result
    } catch (error) {
      console.error('❌ Erro ao criptografar API key:', error)
      throw new Error('Falha na criptografia')
    }
  }

  /**
   * 🔓 Descriptografar API key
   */
  async decryptApiKey(encryptedData: EncryptedData): Promise<ApiKeyData> {
    try {
      // Verificar compatibilidade
      if (encryptedData.algorithm !== this.config.algorithm) {
        throw new Error(`Algoritmo não suportado: ${encryptedData.algorithm}`)
      }

      // Reconstituir salt e IV
      const salt = this.base64ToArrayBuffer(encryptedData.salt)
      const iv = this.base64ToArrayBuffer(encryptedData.iv)
      const encrypted = this.base64ToArrayBuffer(encryptedData.encrypted)

      // Derivar chave com o salt correto
      const userSeed = await this.getUserSeed()
      const decryptionKey = await this.deriveKey(userSeed, new Uint8Array(salt))

      // Descriptografar
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.config.algorithm,
          iv: new Uint8Array(iv)
        },
        decryptionKey,
        encrypted
      )

      // Decodificar dados
      const decryptedText = new TextDecoder().decode(decrypted)
      const apiKeyData = JSON.parse(decryptedText) as ApiKeyData & { timestamp: number; version: string }

      console.log('🔓 API key descriptografada com sucesso:', {
        provider: apiKeyData.provider,
        version: apiKeyData.version,
        age: Math.round((Date.now() - apiKeyData.timestamp) / (1000 * 60)) + 'min'
      })

      // Retornar apenas dados da API key
      const { timestamp, version, ...cleanData } = apiKeyData
      return cleanData
    } catch (error) {
      console.error('❌ Erro ao descriptografar API key:', error)
      throw new Error('Falha na descriptografia')
    }
  }

  /**
   * 🧪 Validar API key por provedor
   */
  async validateApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      console.log(`🔍 Validando API key para ${provider}...`)

      switch (provider) {
        case 'openai':
          return await this.validateOpenAIKey(apiKey)
        case 'assemblyai':
          return await this.validateAssemblyAIKey(apiKey)
        default:
          console.warn(`⚠️ Validação não implementada para ${provider}`)
          return true // Assumir válida se não conseguir validar
      }
    } catch (error) {
      console.error(`❌ Erro ao validar ${provider} key:`, error)
      return false
    }
  }

  /**
   * 🎯 Validar OpenAI API Key
   */
  private async validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        console.log('✅ OpenAI API key válida')
        return true
      } else if (response.status === 401) {
        console.log('❌ OpenAI API key inválida')
        return false
      } else {
        console.warn('⚠️ Não foi possível validar OpenAI key:', response.status)
        return true // Assumir válida se não conseguir verificar
      }
    } catch (error) {
      console.warn('⚠️ Erro na validação OpenAI (assumindo válida):', error)
      return true
    }
  }

  /**
   * 🤖 Validar AssemblyAI API Key
   */
  private async validateAssemblyAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.assemblyai.com/v2/account', {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        console.log('✅ AssemblyAI API key válida')
        return true
      } else if (response.status === 401) {
        console.log('❌ AssemblyAI API key inválida')
        return false
      } else {
        console.warn('⚠️ Não foi possível validar AssemblyAI key:', response.status)
        return true
      }
    } catch (error) {
      console.warn('⚠️ Erro na validação AssemblyAI (assumindo válida):', error)
      return true
    }
  }

  /**
   * 🧹 Limpar dados sensíveis da memória
   */
  async clearSession(): Promise<void> {
    try {
      // Limpar chaves da memória
      this.masterKey = null
      this.sessionSalt = null
      
      // Limpar storage temporário
      sessionStorage.removeItem('clipsforge_session_id')
      
      console.log('🧹 Sessão criptográfica limpa')
    } catch (error) {
      console.error('❌ Erro ao limpar sessão:', error)
    }
  }

  /**
   * 📊 Obter informações da sessão (sem dados sensíveis)
   */
  getSessionInfo(): { initialized: boolean; algorithm: string; keyLength: number } {
    return {
      initialized: !!this.masterKey,
      algorithm: this.config.algorithm,
      keyLength: this.config.keyLength
    }
  }

  // ===== UTILITÁRIOS PRIVADOS =====

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = String.fromCharCode(...new Uint8Array(buffer))
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const buffer = new ArrayBuffer(binary.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i)
    }
    return buffer
  }
}

// ✅ EXPORTAR INSTÂNCIA SINGLETON
export const cryptoService = new CryptoService() 