import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState('testing')
  const [usersCount, setUsersCount] = useState(0)
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      const { error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })

      if (error) throw error

      setUsersCount(count || 0)
      setConnectionStatus('success')
      setTestResult('✅ Conexão com Supabase funcionando!')
    } catch (error: any) {
      console.error('Erro na conexão:', error)
      setConnectionStatus('error')
      setTestResult('❌ Erro: ' + error.message)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔥 ClipsForge - Teste Supabase</h2>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Status:</h3>
          <div className={`p-2 rounded ${
            connectionStatus === 'success' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {testResult}
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Usuários no banco:</h3>
          <p className="text-2xl font-bold">{usersCount}</p>
        </div>

        <button
          onClick={testConnection}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 Testar Conexão
        </button>
      </div>
    </div>
  )
} 