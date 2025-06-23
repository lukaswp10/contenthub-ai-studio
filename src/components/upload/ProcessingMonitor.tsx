import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Play, RefreshCw } from 'lucide-react'

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  duration?: number
  error?: string
  details?: any
}

interface ProcessingMonitorProps {
  videoId?: string
  onComplete?: (result: any) => void
  onError?: (error: any) => void
}

export function ProcessingMonitor({ videoId, onComplete, onError }: ProcessingMonitorProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', name: 'Upload do Vídeo', status: 'pending' },
    { id: 'transcribe', name: 'Transcrição', status: 'pending' },
    { id: 'analyze', name: 'Análise de Conteúdo', status: 'pending' },
    { id: 'clips', name: 'Geração de Clips', status: 'pending' }
  ])
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    setLogs(prev => [...prev, logEntry])
  }

  const updateStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  useEffect(() => {
    const completedSteps = steps.filter(s => s.status === 'completed').length
    const totalSteps = steps.length
    setOverallProgress((completedSteps / totalSteps) * 100)
  }, [steps])

  const startProcessing = async () => {
    if (!videoId) {
      addLog('ID do vídeo não fornecido', 'error')
      return
    }

    setIsRunning(true)
    setLogs([])
    addLog('Iniciando pipeline de processamento...')

    try {
      // Step 1: Upload
      updateStep('upload', { status: 'running', startTime: new Date() })
      setCurrentStep('upload')
      addLog('Iniciando upload do vídeo...')

      const uploadResponse = await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const uploadResult = await uploadResponse.json()
      updateStep('upload', { 
        status: 'completed', 
        endTime: new Date(),
        duration: Date.now() - (steps[0].startTime?.getTime() || Date.now())
      })
      addLog('Upload concluído com sucesso', 'success')

      // Step 2: Transcribe
      updateStep('transcribe', { status: 'running', startTime: new Date() })
      setCurrentStep('transcribe')
      addLog('Iniciando transcrição...')

      const transcribeResponse = await fetch('/api/transcribe-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      })

      if (!transcribeResponse.ok) {
        throw new Error(`Transcription failed: ${transcribeResponse.statusText}`)
      }

      const transcribeResult = await transcribeResponse.json()
      updateStep('transcribe', { 
        status: 'completed', 
        endTime: new Date(),
        duration: Date.now() - (steps[1].startTime?.getTime() || Date.now()),
        details: transcribeResult
      })
      addLog('Transcrição concluída com sucesso', 'success')

      // Step 3: Analyze
      updateStep('analyze', { status: 'running', startTime: new Date() })
      setCurrentStep('analyze')
      addLog('Iniciando análise de conteúdo...')

      const analyzeResponse = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      })

      if (!analyzeResponse.ok) {
        throw new Error(`Analysis failed: ${analyzeResponse.statusText}`)
      }

      const analyzeResult = await analyzeResponse.json()
      updateStep('analyze', { 
        status: 'completed', 
        endTime: new Date(),
        duration: Date.now() - (steps[2].startTime?.getTime() || Date.now()),
        details: analyzeResult
      })
      addLog('Análise concluída com sucesso', 'success')

      // Step 4: Generate Clips
      updateStep('clips', { status: 'running', startTime: new Date() })
      setCurrentStep('clips')
      addLog('Iniciando geração de clips...')

      const clipsResponse = await fetch('/api/generate-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId,
          clip_suggestions: analyzeResult.clip_suggestions,
          cloudinary_public_id: uploadResult.cloudinary_public_id
        })
      })

      if (!clipsResponse.ok) {
        throw new Error(`Clip generation failed: ${clipsResponse.statusText}`)
      }

      const clipsResult = await clipsResponse.json()
      updateStep('clips', { 
        status: 'completed', 
        endTime: new Date(),
        duration: Date.now() - (steps[3].startTime?.getTime() || Date.now()),
        details: clipsResult
      })
      addLog('Geração de clips concluída com sucesso', 'success')

      setCurrentStep(null)
      setIsRunning(false)
      addLog('Pipeline de processamento concluído com sucesso!', 'success')
      
      onComplete?.({
        upload: uploadResult,
        transcribe: transcribeResult,
        analyze: analyzeResult,
        clips: clipsResult
      })

    } catch (error: any) {
      const currentStepIndex = steps.findIndex(s => s.id === currentStep)
      if (currentStepIndex >= 0) {
        updateStep(currentStep!, { 
          status: 'failed', 
          endTime: new Date(),
          error: error.message
        })
      }
      
      addLog(`Erro no processamento: ${error.message}`, 'error')
      setIsRunning(false)
      setCurrentStep(null)
      onError?.(error)
    }
  }

  const resetProcessing = () => {
    setSteps(steps.map(step => ({ ...step, status: 'pending' })))
    setLogs([])
    setCurrentStep(null)
    setIsRunning(false)
    setOverallProgress(0)
  }

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepBadge = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processando...</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Monitor de Processamento</span>
            <div className="flex gap-2">
              <Button 
                onClick={startProcessing} 
                disabled={isRunning || !videoId}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
              <Button 
                onClick={resetProcessing} 
                disabled={isRunning}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso Geral</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStepIcon(step)}
                    <div>
                      <div className="font-medium">{step.name}</div>
                      {step.duration && (
                        <div className="text-sm text-gray-500">
                          Duração: {step.duration}ms
                        </div>
                      )}
                      {step.error && (
                        <div className="text-sm text-red-500">
                          Erro: {step.error}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStepBadge(step)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Processamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full border rounded-md p-4">
            <div className="space-y-1 font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">Nenhum log disponível</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Error Display */}
      {steps.some(s => s.status === 'failed') && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Ocorreu um erro durante o processamento. Verifique os logs acima para mais detalhes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 