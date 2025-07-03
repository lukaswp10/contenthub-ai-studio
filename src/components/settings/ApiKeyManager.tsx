/**
 * 🎛️ GERENCIADOR DE API KEYS - ClipsForge Pro
 * 
 * Interface moderna que:
 * - ✅ Configuração visual de API keys
 * - ✅ Validação em tempo real
 * - ✅ Estatísticas de uso
 * - ✅ Segurança máxima
 * - ✅ UX intuitiva
 * 
 * @author ClipsForge Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback } from 'react'
import { configService, type ApiKeyConfig, type ConfigStats, type ProviderConfig } from '../../services/security/config.service'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Loading } from '../ui/loading'

// ✅ INTERFACES
interface ApiKeyManagerProps {
  isOpen: boolean
  onClose: () => void
  onApiKeyConfigured?: (provider: string, isValid: boolean) => void
}

interface AddKeyForm {
  provider: 'openai' | 'assemblyai' | 'other'
  name: string
  key: string
  priority: number
  isActive: boolean
}

interface ValidationStatus {
  isValidating: boolean
  isValid: boolean | null
  error?: string
}

/**
 * 🎛️ COMPONENTE PRINCIPAL
 */
export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  isOpen,
  onClose,
  onApiKeyConfigured
}) => {
  // ✅ ESTADOS
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([])
  const [stats, setStats] = useState<ConfigStats | null>(null)
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<AddKeyForm>({
    provider: 'openai',
    name: '',
    key: '',
    priority: 10,
    isActive: true
  })
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    isValidating: false,
    isValid: null
  })
  const [editingKey, setEditingKey] = useState<string | null>(null)

  // ✅ CARREGAR DADOS INICIAIS
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  /**
   * 📥 Carregar dados
   */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [apiKeysData, statsData, providersData] = await Promise.all([
        configService.getAllApiKeys(),
        configService.getStats(),
        configService.getAllProviders()
      ])
      
      setApiKeys(apiKeysData)
      setStats(statsData)
      setProviders(providersData)
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 🧪 Validar API key em tempo real
   */
  const validateApiKey = useCallback(async (provider: string, key: string) => {
    if (!key || key.length < 10) {
      setValidationStatus({ isValidating: false, isValid: null })
      return
    }

    setValidationStatus({ isValidating: true, isValid: null })
    
    try {
      const isValid = await configService.validateApiKey(provider, key)
      setValidationStatus({ 
        isValidating: false, 
        isValid,
        error: isValid ? undefined : 'API key inválida'
      })
    } catch (error) {
      setValidationStatus({ 
        isValidating: false, 
        isValid: false,
        error: 'Erro ao validar API key'
      })
    }
  }, [])

  /**
   * ➕ Adicionar nova API key
   */
  const handleAddApiKey = async () => {
    if (!addForm.name.trim() || !addForm.key.trim()) {
      alert('Por favor, preencha todos os campos')
      return
    }

    try {
      setLoading(true)
      const id = await configService.addApiKey(addForm)
      
      // Recarregar dados
      await loadData()
      
      // Resetar formulário
      setAddForm({
        provider: 'openai',
        name: '',
        key: '',
        priority: 10,
        isActive: true
      })
      setShowAddForm(false)
      setValidationStatus({ isValidating: false, isValid: null })
      
      // Notificar callback
      if (onApiKeyConfigured) {
        onApiKeyConfigured(addForm.provider, validationStatus.isValid === true)
      }
      
      console.log('✅ API key adicionada:', id)
    } catch (error) {
      console.error('❌ Erro ao adicionar API key:', error)
      alert('Erro ao adicionar API key')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 🔄 Atualizar API key
   */
  const handleUpdateApiKey = async (id: string, updates: Partial<ApiKeyConfig>) => {
    try {
      setLoading(true)
      const success = await configService.updateApiKey(id, updates)
      
      if (success) {
        await loadData()
        setEditingKey(null)
        console.log('✅ API key atualizada:', id)
      } else {
        alert('Erro ao atualizar API key')
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar API key:', error)
      alert('Erro ao atualizar API key')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 🗑️ Remover API key
   */
  const handleRemoveApiKey = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta API key?')) return

    try {
      setLoading(true)
      const success = await configService.removeApiKey(id)
      
      if (success) {
        await loadData()
        console.log('✅ API key removida:', id)
      } else {
        alert('Erro ao remover API key')
      }
    } catch (error) {
      console.error('❌ Erro ao remover API key:', error)
      alert('Erro ao remover API key')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 📊 Renderizar estatísticas
   */
  const renderStats = () => {
    if (!stats) return null

    return (
      <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-900">
          📊 Estatísticas de API Keys
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalKeys}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.validKeys}</div>
            <div className="text-sm text-gray-600">Válidas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.invalidKeys}</div>
            <div className="text-sm text-gray-600">Inválidas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalUsage}</div>
            <div className="text-sm text-gray-600">Usos</div>
          </div>
        </div>
      </Card>
    )
  }

  /**
   * 🎛️ Renderizar lista de API keys
   */
  const renderApiKeys = () => {
    if (apiKeys.length === 0) {
      return (
        <Card className="p-8 text-center">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">🔐</div>
            <div>Nenhuma API key configurada</div>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            ➕ Adicionar Primeira API Key
          </Button>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-semibold">{apiKey.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    apiKey.isValid === true ? 'bg-green-100 text-green-800' :
                    apiKey.isValid === false ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {apiKey.isValid === true ? '✅ Válida' :
                     apiKey.isValid === false ? '❌ Inválida' : '⏳ Pendente'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    apiKey.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {apiKey.isActive ? '🟢 Ativa' : '🔴 Inativa'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>🔌 Provedor: <span className="font-medium">{apiKey.provider}</span></div>
                  <div>⭐ Prioridade: <span className="font-medium">{apiKey.priority}</span></div>
                  <div>🔑 API Key: <span className="font-mono">...{apiKey.key.slice(-8)}</span></div>
                  {apiKey.lastUsed && (
                    <div>🕐 Último uso: <span className="font-medium">
                      {new Date(apiKey.lastUsed).toLocaleString()}
                    </span></div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditingKey(apiKey.id!)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:bg-blue-50"
                >
                  ✏️
                </Button>
                <Button
                  onClick={() => handleRemoveApiKey(apiKey.id!)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  /**
   * ➕ Renderizar formulário de adicionar
   */
  const renderAddForm = () => {
    if (!showAddForm) return null

    return (
      <Card className="p-6 mb-6 border-blue-200 bg-blue-50">
        <h3 className="text-lg font-semibold mb-4 text-blue-900">
          ➕ Adicionar Nova API Key
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Provedor</label>
            <select
              value={addForm.provider}
              onChange={(e) => {
                const provider = e.target.value as 'openai' | 'assemblyai' | 'other'
                setAddForm({ ...addForm, provider })
                setValidationStatus({ isValidating: false, isValid: null })
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="openai">🤖 OpenAI Whisper</option>
              <option value="assemblyai">🔊 AssemblyAI</option>
              <option value="other">🔧 Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nome da Configuração</label>
            <Input
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="Ex: OpenAI Principal"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <Input
              type="password"
              value={addForm.key}
              onChange={(e) => {
                const key = e.target.value
                setAddForm({ ...addForm, key })
                
                // Validar após delay
                setTimeout(() => {
                  validateApiKey(addForm.provider, key)
                }, 500)
              }}
              placeholder="Cole sua API key aqui..."
              className="w-full font-mono"
            />
            
            {/* Status de validação */}
            {validationStatus.isValidating && (
              <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                <Loading size="small" />
                Validando API key...
              </div>
            )}
            {validationStatus.isValid === true && (
              <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                ✅ API key válida!
              </div>
            )}
            {validationStatus.isValid === false && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                ❌ {validationStatus.error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prioridade</label>
              <Input
                type="number"
                value={addForm.priority}
                onChange={(e) => setAddForm({ ...addForm, priority: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input
                type="checkbox"
                id="isActive"
                checked={addForm.isActive}
                onChange={(e) => setAddForm({ ...addForm, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Ativar imediatamente
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAddApiKey}
              disabled={loading || !addForm.name.trim() || !addForm.key.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Loading size="small" /> : '💾 Salvar'}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false)
                setAddForm({
                  provider: 'openai',
                  name: '',
                  key: '',
                  priority: 10,
                  isActive: true
                })
                setValidationStatus({ isValidating: false, isValid: null })
              }}
              variant="outline"
            >
              ❌ Cancelar
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              🔐 Gerenciador de API Keys
            </h2>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-gray-500 hover:bg-gray-100"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading && !apiKeys.length ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
              <span className="ml-2">Carregando configurações...</span>
            </div>
          ) : (
            <>
              {renderStats()}
              {renderAddForm()}
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">🔑 API Keys Configuradas</h3>
                {!showAddForm && (
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ➕ Adicionar API Key
                  </Button>
                )}
              </div>
              
              {renderApiKeys()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApiKeyManager 