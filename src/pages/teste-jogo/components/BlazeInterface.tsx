/**
 * 🎨 BLAZE INTERFACE - Interface Principal Simplificada
 * 
 * ETAPA 4: Interface limpa com:
 * - Histórico da Blaze em tempo real
 * - Último número destacado
 * - Palpite dos algoritmos
 * - Acertos/erros
 * - Destaque especial para branco (14x)
 */
import React, { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBlazeContext } from './BlazeDataProvider'
import type { BlazeNumberWithSource } from './BlazeDataProvider'

export function BlazeInterface() {
  const {
    numbers,
    lastNumber,
    currentPrediction,
    isGeneratingPrediction,
    accuracyStats,
    waitingForResult,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    generatePrediction,
    addCSVData
  } = useBlazeContext()

  // Estados para importação CSV
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para processar CSV
  const processCSVData = (csvText: string): BlazeNumberWithSource[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    const results: BlazeNumberWithSource[] = []
    
    lines.forEach((line, index) => {
      if (index === 0) return // Skip header
      
      const parts = line.split(',').map(part => part.trim())
      if (parts.length >= 2) {
        const number = parseInt(parts[0])
        if (!isNaN(number) && number >= 0 && number <= 14) {
          const color = number === 0 ? 'white' : number <= 7 ? 'red' : 'black'
          results.push({
            id: `csv_${Date.now()}_${index}`,
            number,
            color,
            timestamp: Date.now() - (results.length * 1000), // Simular timestamps
            source: 'csv'
          })
        }
      }
    })
    
    return results
  }

  // Função para importar CSV
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    
    try {
      const text = await file.text()
      const csvData = processCSVData(text)
      
      if (csvData.length === 0) {
        alert('❌ Nenhum dado válido encontrado no CSV')
        return
      }

      // Usar a função do contexto para adicionar os dados
      addCSVData(csvData)
      
      console.log(`📄 CSV: ${csvData.length} números importados`)
      alert(`✅ ${csvData.length} números importados do CSV`)
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar CSV:', error)
      alert('❌ Erro ao processar CSV')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            🎯 BLAZE ANALYZER V2
          </h1>
          <p className="text-gray-300">
            Sistema Automatizado • Fluxo: Blaze → Algoritmos → Predição → Aprendizado
          </p>
        </div>

        {/* Status da Conexão */}
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-lg font-semibold">
                  {isConnected ? '🟢 CONECTADO BLAZE' : '🔴 DESCONECTADO'}
                </span>
                <span className="text-sm text-gray-400">({connectionStatus})</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={isConnected ? disconnect : connect}
                  className={isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {isConnected ? '⏹️ DESCONECTAR' : '▶️ CONECTAR BLAZE'}
                </Button>
                
                {/* Botão CSV */}
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isImporting ? '📄 IMPORTANDO...' : '📄 CSV'}
                </Button>
              </div>
            </div>
            
            {/* Input oculto para CSV */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Histórico da Blaze */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-orange-300">
                📊 HISTÓRICO TEMPO REAL ({numbers.length} números)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto">
                {numbers.slice().reverse().map((num, index) => {
                  const isLatest = index === 0 && num.source === 'blaze'
                  const isCSV = num.source === 'csv'
                  return (
                    <div
                      key={`${num.id}_${num.timestamp}_${index}`}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
                        transition-all duration-300 transform
                        ${num.number === 0 ? 'bg-white text-black' :
                          num.number <= 7 ? 'bg-red-600 text-white' :
                          'bg-gray-700 text-white'}
                        ${isLatest ? 'border-2 border-yellow-400 animate-pulse scale-110 shadow-lg shadow-yellow-400/50' : 
                          isCSV ? 'border border-blue-400' : 'border border-gray-500'}
                        hover:scale-105
                      `}
                      title={`${num.number} (${num.color}) - ${isCSV ? 'CSV' : 'BLAZE'} - ${new Date(num.timestamp).toLocaleTimeString()}${isLatest ? ' - ÚLTIMO DA BLAZE!' : ''}`}
                    >
                      {num.number}
                      {isLatest && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                      )}
                      {isCSV && (
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {numbers.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Aguardando dados da Blaze ou importe CSV...
                </div>
              )}
              
              {lastNumber && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-300">Último número:</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      lastNumber.number === 0 ? 'bg-white text-black' :
                      lastNumber.number <= 7 ? 'bg-red-600 text-white' :
                      'bg-gray-700 text-white'
                    }`}>
                      {lastNumber.number}
                    </div>
                    <span className="text-lg font-semibold">{lastNumber.color.toUpperCase()}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(lastNumber.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-xs text-blue-400">
                      {lastNumber.source === 'csv' ? 'CSV' : 'BLAZE'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Predição dos Algoritmos */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-purple-300">
                🧠 PREDIÇÃO DOS ALGORITMOS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPrediction ? (
                <div className="space-y-4">
                  
                  {/* Predição Principal */}
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">PRÓXIMA COR PREVISTA:</div>
                    <div className={`
                      text-4xl font-bold p-4 rounded-lg border-2
                      ${currentPrediction.color === 'white' ? 'bg-white text-black border-yellow-400 animate-pulse' :
                        currentPrediction.color === 'red' ? 'bg-red-600 text-white border-red-400' :
                        'bg-gray-700 text-white border-gray-400'}
                    `}>
                      {currentPrediction.color.toUpperCase()}
                    </div>
                    
                    {/* Destaque Especial para Branco */}
                    {currentPrediction.color === 'white' && (
                      <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-400 rounded-lg animate-pulse">
                        <div className="text-yellow-400 font-bold">🎰 ATENÇÃO: BRANCO!</div>
                        <div className="text-sm text-yellow-300">Pagamento 14x se acertar!</div>
                      </div>
                    )}
                  </div>

                  {/* Número Previsto */}
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">NÚMERO PREVISTO:</div>
                    <div className={`
                      w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-2xl font-bold border-2
                      ${currentPrediction.number === 0 ? 'bg-white text-black border-yellow-400' :
                        currentPrediction.number <= 7 ? 'bg-red-600 text-white border-red-400' :
                        'bg-gray-700 text-white border-gray-400'}
                    `}>
                      {currentPrediction.number}
                    </div>
                  </div>

                  {/* Detalhes da Predição */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-gray-400">Confiança:</div>
                      <div className="text-lg font-bold text-blue-300">
                        {currentPrediction.confidence.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-gray-400">Algoritmos:</div>
                      <div className="text-sm text-green-300">
                        {currentPrediction.algorithms.join(', ')}
                      </div>
                    </div>
                  </div>

                  {waitingForResult && (
                    <div className="text-center p-3 bg-yellow-900/30 border border-yellow-400 rounded-lg">
                      <div className="text-yellow-300 font-semibold animate-pulse">
                        ⏳ AGUARDANDO RESULTADO DA BLAZE...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">Nenhuma predição ativa</div>
                  <Button
                    onClick={generatePrediction}
                    disabled={isGeneratingPrediction || numbers.length < 10}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isGeneratingPrediction ? '🧠 GERANDO...' : '🚀 GERAR PREDIÇÃO'}
                  </Button>
                  {numbers.length < 10 && (
                    <div className="text-sm text-red-400 mt-2">
                      Mínimo 10 números necessários (Blaze ou CSV)
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas de Acerto/Erro */}
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-green-300">
              📈 PERFORMANCE DOS ALGORITMOS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-600">
                <div className="text-green-300 font-semibold">✅ ACERTOS</div>
                <div className="text-3xl font-bold text-green-200">{accuracyStats.correct}</div>
              </div>
              
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-600">
                <div className="text-red-300 font-semibold">❌ ERROS</div>
                <div className="text-3xl font-bold text-red-200">{accuracyStats.incorrect}</div>
              </div>
              
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-600">
                <div className="text-blue-300 font-semibold">📊 TOTAL</div>
                <div className="text-3xl font-bold text-blue-200">{accuracyStats.total}</div>
              </div>
              
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-600">
                <div className="text-purple-300 font-semibold">🎯 ACURÁCIA</div>
                <div className="text-3xl font-bold text-purple-200">
                  {accuracyStats.accuracy.toFixed(1)}%
                </div>
              </div>
            </div>

            {accuracyStats.lastResult !== null && (
              <div className="mt-4 text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  accuracyStats.lastResult ? 'bg-green-900/30 border border-green-600' : 'bg-red-900/30 border border-red-600'
                }`}>
                  <span className="text-lg">
                    {accuracyStats.lastResult ? '✅ ÚLTIMO ACERTO!' : '❌ ÚLTIMO ERRO'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="text-center space-y-2">
          <Button
            onClick={generatePrediction}
            disabled={isGeneratingPrediction || numbers.length < 10}
            className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3"
          >
            {isGeneratingPrediction ? '🧠 PROCESSANDO ALGORITMOS...' : '🚀 NOVA PREDIÇÃO'}
          </Button>
          
          <div className="text-sm text-gray-400">
            Sistema automatizado • Algoritmos reais • Sem simulações • Suporte CSV
          </div>
        </div>

      </div>
    </div>
  )
} 