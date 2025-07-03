/**
 * 📊 DASHBOARD DE MONITORAMENTO DO SISTEMA - FASE 3
 * Monitoramento em tempo real de todos os serviços
 */

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IntelligentFallback, type ProviderStatus } from '../../services/fallback'

// Instância local para garantir tipagem correta
const fallbackWrapper = new IntelligentFallback()

interface SystemMonitorProps {
  isOpen: boolean
  onClose: () => void
}

interface SystemMetrics {
  totalRequests: number
  successRate: number
  avgResponseTime: number
  totalCost: number
  cacheHitRate: number
  activeProviders: number
}

interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: number
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    totalCost: 0,
    cacheHitRate: 0,
    activeProviders: 0
  })
  
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  /**
   * 📊 Carregar métricas do sistema
   */
  const loadSystemMetrics = async () => {
    try {
      setLoading(true)

      // Obter status dos provedores
      const providerStatus = fallbackWrapper.getProvidersStatus()
      setProviders(providerStatus)

      // Calcular métricas
      const activeProviders = providerStatus.filter((p: ProviderStatus) => p.healthy).length
      const avgResponseTime = providerStatus.reduce((sum: number, p: ProviderStatus) => sum + p.responseTime, 0) / providerStatus.length || 0
      const successRate = providerStatus.filter((p: ProviderStatus) => p.healthy).length / providerStatus.length * 100

      setMetrics({
        totalRequests: 1250, // Mock data
        successRate,
        avgResponseTime,
        totalCost: 45.67, // Mock data
        cacheHitRate: 85, // Mock data
        activeProviders
      })

      // Gerar alertas baseados no status
      generateAlerts(providerStatus)

    } catch (error) {
      console.error('❌ Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 🚨 Gerar alertas baseados no sistema
   */
  const generateAlerts = (providerStatus: ProviderStatus[]) => {
    const newAlerts: Alert[] = []

    // Alertas de provedores
    providerStatus.forEach(provider => {
      if (!provider.healthy) {
        newAlerts.push({
          id: `provider_${provider.id}_down`,
          type: 'error',
          message: `Provedor ${provider.name} está inativo`,
          timestamp: Date.now()
        })
      } else if (provider.responseTime > 10000) {
        newAlerts.push({
          id: `provider_${provider.id}_slow`,
          type: 'warning',
          message: `Provedor ${provider.name} está lento (${Math.round(provider.responseTime/1000)}s)`,
          timestamp: Date.now()
        })
      }
    })

    setAlerts(newAlerts.slice(0, 10))
  }

  /**
   * 🔄 Auto-refresh
   */
  useEffect(() => {
    if (isOpen) {
      loadSystemMetrics()
    }
  }, [isOpen])

  useEffect(() => {
    if (!autoRefresh || !isOpen) return

    const interval = setInterval(() => {
      loadSystemMetrics()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">📊 Monitor do Sistema</h2>
            <div className={`px-3 py-1 rounded-full text-sm ${
              metrics.activeProviders > 2 
                ? 'bg-green-600/20 text-green-300' 
                : 'bg-yellow-600/20 text-yellow-300'
            }`}>
              {metrics.activeProviders}/3 Provedores Ativos
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${autoRefresh ? 'bg-green-600/20 text-green-300' : 'bg-gray-600/20 text-gray-300'}`}
            >
              {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadSystemMetrics}
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'} Atualizar
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-300 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-600/20 to-green-800/20 border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-white">{Math.round(metrics.successRate)}%</p>
                </div>
                <div className="text-3xl">🎯</div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Tempo de Resposta</p>
                  <p className="text-2xl font-bold text-white">{Math.round(metrics.avgResponseTime)}ms</p>
                </div>
                <div className="text-3xl">⚡</div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-white">{Math.round(metrics.cacheHitRate)}%</p>
                </div>
                <div className="text-3xl">💾</div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Economia Total</p>
                  <p className="text-2xl font-bold text-white">${metrics.totalCost.toFixed(2)}</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Status dos Provedores */}
            <Card className="p-6 bg-gray-800/50 border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                🔧 Status dos Provedores
              </h3>
              <div className="space-y-3">
                {providers.map(provider => (
                  <div
                    key={provider.id}
                    className={`p-3 rounded-lg border ${
                      provider.healthy 
                        ? 'bg-green-900/30 border-green-600/50' 
                        : 'bg-red-900/30 border-red-600/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            provider.healthy ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="font-medium text-white">{provider.name}</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {provider.responseTime > 0 ? `${Math.round(provider.responseTime)}ms` : 'N/A'}
                      </div>
                    </div>
                    
                    {provider.lastError && (
                      <div className="mt-2 text-sm text-red-300">
                        {provider.lastError}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Alertas do Sistema */}
            <Card className="p-6 bg-gray-800/50 border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                🚨 Alertas do Sistema
              </h3>
              
              {alerts.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${
                      alert.type === 'error' ? 'bg-red-900/30 border-red-600/50 text-red-300' :
                      alert.type === 'warning' ? 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300' :
                      'bg-blue-900/30 border-blue-600/50 text-blue-300'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm">{alert.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">✅</div>
                  <p>Nenhum alerta ativo</p>
                  <p className="text-sm">Sistema funcionando normalmente</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
