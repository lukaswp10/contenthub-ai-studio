/**
 * 🔑 CONFIGURAÇÃO DE APIs PROFISSIONAIS - ClipsForge Pro
 * 
 * Componente para configurar APIs premium:
 * - ✅ AssemblyAI (transcrição precisa)
 * - ✅ OpenAI (análise de contexto)
 * - ✅ Google Speech (backup)
 * - ✅ Validação de chaves
 * - ✅ Testes de conectividade
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Switch } from '../ui/switch'

interface APIStatus {
  isValid: boolean
  isConnected: boolean
  lastTested: Date | null
  error?: string
  plan?: string
  usage?: {
    used: number
    limit: number
  }
}

interface APIConfig {
  assemblyAI: string
  openAI: string
  google: string
  useAssemblyAI: boolean
  useOpenAI: boolean
  useGoogleSpeech: boolean
}

interface APIConfigurationProps {
  onConfigurationChange?: (config: APIConfig) => void
}

export const APIConfiguration: React.FC<APIConfigurationProps> = ({
  onConfigurationChange
}) => {
  // Estados das APIs
  const [assemblyAIKey, setAssemblyAIKey] = useState('')
  const [openAIKey, setOpenAIKey] = useState('')
  const [googleKey, setGoogleKey] = useState('')
  
  // Estados de configuração
  const [useAssemblyAI, setUseAssemblyAI] = useState(true)
  const [useOpenAI, setUseOpenAI] = useState(false)
  const [useGoogleSpeech, setUseGoogleSpeech] = useState(false)
  
  // Estados de status
  const [assemblyAIStatus, setAssemblyAIStatus] = useState<APIStatus>({
    isValid: false,
    isConnected: false,
    lastTested: null
  })
  const [openAIStatus, setOpenAIStatus] = useState<APIStatus>({
    isValid: false,
    isConnected: false,
    lastTested: null
  })
  const [googleStatus, setGoogleStatus] = useState<APIStatus>({
    isValid: false,
    isConnected: false,
    lastTested: null
  })
  
  // Estados de UI
  const [isTesting, setIsTesting] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  const [activeTab, setActiveTab] = useState('assemblyai')

  // Carregar configurações salvas
  const loadSavedConfiguration = useCallback(() => {
    const savedAssemblyAI = localStorage.getItem('assemblyai_key') || ''
    const savedOpenAI = localStorage.getItem('openai_key') || ''
    const savedGoogle = localStorage.getItem('google_speech_key') || ''
    
    setAssemblyAIKey(savedAssemblyAI)
    setOpenAIKey(savedOpenAI)
    setGoogleKey(savedGoogle)
    
    // Testar chaves existentes
    if (savedAssemblyAI) testAssemblyAI(savedAssemblyAI)
    if (savedOpenAI) testOpenAI(savedOpenAI)
    if (savedGoogle) testGoogleSpeech(savedGoogle)
  }, [])

  useEffect(() => {
    loadSavedConfiguration()
  }, [loadSavedConfiguration])

  const saveConfiguration = () => {
    if (assemblyAIKey) localStorage.setItem('assemblyai_key', assemblyAIKey)
    if (openAIKey) localStorage.setItem('openai_key', openAIKey)
    if (googleKey) localStorage.setItem('google_speech_key', googleKey)
    
    // Notificar mudanças
    if (onConfigurationChange) {
      onConfigurationChange({
        assemblyAI: assemblyAIKey,
        openAI: openAIKey,
        google: googleKey,
        useAssemblyAI,
        useOpenAI,
        useGoogleSpeech
      })
    }
  }

  // ✅ TESTES DE CONECTIVIDADE

  const testAssemblyAI = async (key: string) => {
    if (!key) return
    
    setIsTesting(true)
    try {
      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: 'https://example.com/test.mp3' // URL de teste
        })
      })
      
      if (response.status === 401) {
        setAssemblyAIStatus({
          isValid: false,
          isConnected: false,
          lastTested: new Date(),
          error: 'Chave de API inválida'
        })
      } else if (response.status === 400) {
        // Erro esperado com URL inválida, mas chave válida
        setAssemblyAIStatus({
          isValid: true,
          isConnected: true,
          lastTested: new Date(),
          plan: 'Detectado automaticamente'
        })
      } else {
        setAssemblyAIStatus({
          isValid: true,
          isConnected: true,
          lastTested: new Date()
        })
      }
    } catch (error) {
      setAssemblyAIStatus({
        isValid: false,
        isConnected: false,
        lastTested: new Date(),
        error: 'Erro de conexão'
      })
    }
    setIsTesting(false)
  }

  const testOpenAI = async (key: string) => {
    if (!key) return
    
    setIsTesting(true)
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOpenAIStatus({
          isValid: true,
          isConnected: true,
          lastTested: new Date(),
          plan: data.data?.length ? `${data.data.length} modelos disponíveis` : 'Ativo'
        })
      } else {
        setOpenAIStatus({
          isValid: false,
          isConnected: false,
          lastTested: new Date(),
          error: 'Chave de API inválida'
        })
      }
    } catch (error) {
      setOpenAIStatus({
        isValid: false,
        isConnected: false,
        lastTested: new Date(),
        error: 'Erro de conexão'
      })
    }
    setIsTesting(false)
  }

  const testGoogleSpeech = async (key: string) => {
    if (!key) return
    
    setIsTesting(true)
    try {
      // Teste básico do Google Speech
      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'pt-BR',
          },
          audio: {
            content: '' // Conteúdo vazio para teste
          }
        })
      })
      
      if (response.status === 400) {
        // Erro esperado com conteúdo vazio, mas chave válida
        setGoogleStatus({
          isValid: true,
          isConnected: true,
          lastTested: new Date(),
          plan: 'Google Cloud Speech'
        })
      } else if (response.status === 401 || response.status === 403) {
        setGoogleStatus({
          isValid: false,
          isConnected: false,
          lastTested: new Date(),
          error: 'Chave de API inválida'
        })
      } else {
        setGoogleStatus({
          isValid: true,
          isConnected: true,
          lastTested: new Date()
        })
      }
    } catch (error) {
      setGoogleStatus({
        isValid: false,
        isConnected: false,
        lastTested: new Date(),
        error: 'Erro de conexão'
      })
    }
    setIsTesting(false)
  }

  const testAllAPIs = async () => {
    setIsTesting(true)
    
    const promises = []
    if (assemblyAIKey) promises.push(testAssemblyAI(assemblyAIKey))
    if (openAIKey) promises.push(testOpenAI(openAIKey))
    if (googleKey) promises.push(testGoogleSpeech(googleKey))
    
    await Promise.all(promises)
    setIsTesting(false)
  }

  // ✅ RENDERIZAÇÃO DE STATUS

  const renderStatus = (status: APIStatus) => {
    if (status.isValid && status.isConnected) {
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="bg-green-500">
            ✅ Conectado
          </Badge>
          {status.plan && (
            <span className="text-sm text-gray-600">{status.plan}</span>
          )}
        </div>
      )
    } else if (status.error) {
      return (
        <Badge variant="destructive">
          ❌ {status.error}
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary">
          ⚪ Não testado
        </Badge>
      )
    }
  }

  const renderAPICard = (
    title: string,
    description: string,
    keyValue: string,
    setKeyValue: (value: string) => void,
    status: APIStatus,
    testFunction: (key: string) => Promise<void>,
    isEnabled: boolean,
    setIsEnabled: (enabled: boolean) => void,
    placeholder: string,
    helpText: string
  ) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label htmlFor={`enable-${title.toLowerCase()}`}>
              {isEnabled ? 'Ativo' : 'Inativo'}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor={`${title.toLowerCase()}-key`}>Chave da API</Label>
            <div className="flex space-x-2">
              <Input
                id={`${title.toLowerCase()}-key`}
                type={showKeys ? 'text' : 'password'}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder={placeholder}
                className="flex-1"
              />
              <Button
                onClick={() => testFunction(keyValue)}
                disabled={!keyValue || isTesting}
                variant="outline"
              >
                {isTesting ? '🔄' : '🧪'} Testar
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">{helpText}</p>
          </div>
          
          <div>
            <Label>Status</Label>
            <div className="mt-2">
              {renderStatus(status)}
              {status.lastTested && (
                <p className="text-xs text-gray-500 mt-1">
                  Último teste: {status.lastTested.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🔑 Configuração de APIs Profissionais</h2>
        <p className="text-gray-600">
          Configure APIs premium para melhorar drasticamente a qualidade das legendas
        </p>
      </div>

      {/* Controles gerais */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Controles Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={showKeys}
                onCheckedChange={setShowKeys}
              />
              <Label>Mostrar chaves de API</Label>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={testAllAPIs}
                disabled={isTesting}
                variant="outline"
              >
                {isTesting ? '🔄 Testando...' : '🧪 Testar Todas'}
              </Button>
              <Button
                onClick={saveConfiguration}
                className="bg-blue-600 hover:bg-blue-700"
              >
                💾 Salvar Configuração
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs das APIs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assemblyai">AssemblyAI</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="google">Google Speech</TabsTrigger>
        </TabsList>

        <TabsContent value="assemblyai">
          {renderAPICard(
            'AssemblyAI',
            'API premium para transcrição com timing preciso',
            assemblyAIKey,
            setAssemblyAIKey,
            assemblyAIStatus,
            testAssemblyAI,
            useAssemblyAI,
            setUseAssemblyAI,
            'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'Obtenha sua chave em: https://www.assemblyai.com/dashboard/signup'
          )}
        </TabsContent>

        <TabsContent value="openai">
          {renderAPICard(
            'OpenAI',
            'API para análise de contexto e melhorias de legendas',
            openAIKey,
            setOpenAIKey,
            openAIStatus,
            testOpenAI,
            useOpenAI,
            setUseOpenAI,
            'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'Obtenha sua chave em: https://platform.openai.com/api-keys'
          )}
        </TabsContent>

        <TabsContent value="google">
          {renderAPICard(
            'Google Speech',
            'API de backup para transcrição (Google Cloud)',
            googleKey,
            setGoogleKey,
            googleStatus,
            testGoogleSpeech,
            useGoogleSpeech,
            setUseGoogleSpeech,
            'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'Configure em: https://console.cloud.google.com/apis/credentials'
          )}
        </TabsContent>
      </Tabs>

      {/* Informações e recomendações */}
      <div className="mt-6 space-y-4">
        <Alert>
          <AlertDescription>
            <strong>💡 Dica:</strong> Para melhor qualidade, recomendamos usar AssemblyAI como principal e OpenAI para análise de contexto.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertDescription>
            <strong>💰 Custos:</strong> AssemblyAI: ~$0.37/hora • OpenAI: ~$0.002/1K tokens • Google Speech: ~$0.024/min
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertDescription>
            <strong>🔒 Segurança:</strong> Suas chaves são armazenadas localmente no navegador e nunca enviadas para nossos servidores.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

export default APIConfiguration 