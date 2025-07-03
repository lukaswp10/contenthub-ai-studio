/**
 * 📊 CACHE STATS - ClipsForge Pro
 */
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { transcriptionService } from '../../services/transcriptionService'

interface CacheStats {
  totalCached: number
  totalHits: number
  totalMisses: number
  costSaved: number
  providers: Record<string, { hits: number; saves: number }>
  hitRate: number
}

interface CacheStatsProps {
  isOpen: boolean
  onClose: () => void
}

export function CacheStats({ isOpen, onClose }: CacheStatsProps) {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(false)

  const loadStats = async () => {
    setLoading(true)
    try {
      const cacheStats = await transcriptionService.getCacheStats()
      setStats(cacheStats)
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) loadStats()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-700 max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">💾 Cache Inteligente</h2>
          <Button onClick={onClose} variant="outline" size="sm">✕</Button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">🔄 Carregando estatísticas...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-600/20 border border-green-600/30 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-green-400">${stats.costSaved.toFixed(3)}</div>
                  <div className="text-xs text-green-300">💰 Economia</div>
                </div>
                <div className="bg-blue-600/20 border border-blue-600/30 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.hitRate}%</div>
                  <div className="text-xs text-blue-300">🎯 Hit Rate</div>
                </div>
                <div className="bg-purple-600/20 border border-purple-600/30 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.totalCached}</div>
                  <div className="text-xs text-purple-300">📦 Cached</div>
                </div>
                <div className="bg-orange-600/20 border border-orange-600/30 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-orange-400">{stats.totalHits}</div>
                  <div className="text-xs text-orange-300">✅ Hits</div>
                </div>
              </div>

              {Object.keys(stats.providers).length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">🔧 Por Provedor</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.providers).map(([provider, data]) => (
                      <div key={provider} className="flex justify-between items-center p-2 bg-gray-700/50 rounded">
                        <span className="text-white capitalize">
                          {provider === 'whisper' ? '🎯 OpenAI Whisper' : 
                           provider === 'assemblyai' ? '🤖 AssemblyAI' : 
                           '🎤 Web Speech'}
                        </span>
                        <span className="text-green-400 text-sm">
                          {data.hits} hits • ${data.saves.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={loadStats} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  🔄 Atualizar
                </Button>
                <Button 
                  onClick={() => transcriptionService.clearCache()}
                  variant="outline" 
                  className="border-red-600 text-red-400"
                >
                  🗑️ Limpar
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Sem estatísticas ainda</h3>
              <p className="text-gray-400">Use o sistema de transcrição para ver dados</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
