import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createAuthTest } from '@/utils/debug'
import { Bug, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'

export function AuthDebugger() {
  const { user, profile, session, loading } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)
  const [runningTests, setRunningTests] = useState(false)
  const [authLog, setAuthLog] = useState<string[]>([])

  // Monitor auth events
  useEffect(() => {
    const originalLog = console.log
    const logCapture = (...args: any[]) => {
      const message = args.join(' ')
      if (message.includes('[AUTH') || message.includes('Auth event')) {
        setAuthLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
      }
      originalLog(...args)
    }
    console.log = logCapture

    return () => {
      console.log = originalLog
    }
  }, [])

  const runTests = async () => {
    setRunningTests(true)
    const tests = createAuthTest()
    
    const results = {
      connection: await tests.testConnection(),
      profile: user ? await tests.testProfileCreation(user.id) : false,
      timestamp: new Date().toISOString()
    }
    
    setTestResults(results)
    setRunningTests(false)
  }

  const clearLogs = () => {
    setAuthLog([])
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bug className="h-4 w-4" />
            Auth Debugger
            <Button 
              size="sm" 
              variant="outline" 
              onClick={runTests}
              disabled={runningTests}
              className="ml-auto"
            >
              {runningTests ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Test'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 text-xs">
          {/* Auth State */}
          <div className="space-y-2">
            <h4 className="font-medium">Estado Atual:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1">
                {loading ? <Clock className="h-3 w-3 text-yellow-500" /> : 
                 user ? <CheckCircle className="h-3 w-3 text-green-500" /> : 
                 <XCircle className="h-3 w-3 text-red-500" />}
                <span>User</span>
              </div>
              <div className="flex items-center gap-1">
                {session ? <CheckCircle className="h-3 w-3 text-green-500" /> : 
                 <XCircle className="h-3 w-3 text-red-500" />}
                <span>Session</span>
              </div>
              <div className="flex items-center gap-1">
                {profile ? <CheckCircle className="h-3 w-3 text-green-500" /> : 
                 <XCircle className="h-3 w-3 text-red-500" />}
                <span>Profile</span>
              </div>
            </div>
          </div>

          {/* User Details */}
          {user && (
            <div>
              <h4 className="font-medium">Usuário:</h4>
              <div className="bg-white p-2 rounded text-xs">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id.slice(0, 8)}...</p>
                <p><strong>Confirmado:</strong> {user.email_confirmed_at ? '✅' : '❌'}</p>
              </div>
            </div>
          )}

          {/* Profile Details */}
          {profile && (
            <div>
              <h4 className="font-medium">Perfil:</h4>
              <div className="bg-white p-2 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Onboarding:</span>
                  <Badge variant={profile.onboarding_completed ? "default" : "destructive"}>
                    {profile.onboarding_completed ? 'Completo' : 'Pendente'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Plano:</span>
                  <Badge variant="secondary">{profile.plan_type}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults && (
            <div>
              <h4 className="font-medium">Últimos Testes:</h4>
              <div className="bg-white p-2 rounded text-xs">
                <div className="flex justify-between">
                  <span>Conexão:</span>
                  {testResults.connection ? '✅' : '❌'}
                </div>
                <div className="flex justify-between">
                  <span>Perfil:</span>
                  {testResults.profile ? '✅' : '❌'}
                </div>
                <div className="text-gray-500 text-xs">
                  {new Date(testResults.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Auth Logs */}
          <div>
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Logs Recentes:</h4>
              <Button size="sm" variant="ghost" onClick={clearLogs}>
                Limpar
              </Button>
            </div>
            <div className="bg-black text-green-400 p-2 rounded text-xs max-h-32 overflow-y-auto font-mono">
              {authLog.length === 0 ? (
                <p className="text-gray-500">Nenhum log ainda...</p>
              ) : (
                authLog.map((log, i) => (
                  <div key={i} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warning if no profile */}
          {user && !profile && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                Usuário sem perfil detectado! Isso pode causar login infinito.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}