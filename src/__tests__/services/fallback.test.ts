/**
 * 🧪 TESTES BÁSICOS - SISTEMA DE FALLBACK INTELIGENTE
 */

import { describe, it, expect, vi } from 'vitest'
import { IntelligentFallback } from '../../services/fallback'

describe('IntelligentFallback', () => {
  describe('Inicialização', () => {
    it('deve inicializar corretamente', () => {
      const fallback = new IntelligentFallback()
      expect(fallback).toBeDefined()
    })

    it('deve ter provedores configurados', () => {
      const fallback = new IntelligentFallback()
      const providers = fallback.getProvidersStatus()
      expect(providers.length).toBeGreaterThan(0)
    })
  })

  describe('Status dos Provedores', () => {
    it('deve retornar status dos provedores', () => {
      const fallback = new IntelligentFallback()
      const status = fallback.getProvidersStatus()
      
      expect(Array.isArray(status)).toBe(true)
      expect(status.length).toBe(3) // openai, assemblyai, webspeech
      
      status.forEach(provider => {
        expect(provider).toHaveProperty('id')
        expect(provider).toHaveProperty('name')
        expect(provider).toHaveProperty('healthy')
        expect(provider).toHaveProperty('responseTime')
        expect(provider).toHaveProperty('circuitBreakerOpen')
      })
    })

    it('deve ter IDs corretos dos provedores', () => {
      const fallback = new IntelligentFallback()
      const status = fallback.getProvidersStatus()
      
      const providerIds = status.map(p => p.id)
      expect(providerIds).toContain('openai')
      expect(providerIds).toContain('assemblyai')
      expect(providerIds).toContain('webspeech')
    })
  })

  describe('Fallback Execution', () => {
    it('deve executar operação com sucesso', async () => {
      const fallback = new IntelligentFallback()
      
      const operations = {
        openai: vi.fn().mockResolvedValue('success'),
        assemblyai: vi.fn().mockResolvedValue('backup'),
        webspeech: vi.fn().mockResolvedValue('fallback')
      }

      const result = await fallback.executeWithFallback(operations)
      
      expect(result).toHaveProperty('result')
      expect(result).toHaveProperty('providerId')
      expect(result).toHaveProperty('attempts')
      expect(result).toHaveProperty('fallbackUsed')
    })

    it('deve usar fallback quando provedor principal falha', async () => {
      const fallback = new IntelligentFallback()
      
      const operations = {
        openai: vi.fn().mockRejectedValue(new Error('API Error')),
        assemblyai: vi.fn().mockResolvedValue('backup success'),
        webspeech: vi.fn().mockResolvedValue('fallback')
      }

      const result = await fallback.executeWithFallback(operations)
      
      expect(result.result).toBe('backup success')
      expect(result.providerId).toBe('assemblyai')
      expect(result.fallbackUsed).toBe(true)
      expect(result.attempts).toBeGreaterThan(1)
    })
  })

  describe('Health Management', () => {
    it('deve resetar health de provedor', () => {
      const fallback = new IntelligentFallback()
      
      // Não deve lançar erro
      expect(() => {
        fallback.resetProviderHealth('openai')
      }).not.toThrow()
    })
  })
}) 