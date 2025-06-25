import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Clock
} from 'lucide-react'

interface ProcessingStep {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'error'
  message: string
  timestamp: string
  details?: string[]
  progress?: number
}

interface ProcessingTerminalProps {
  isVisible: boolean
  onToggle: () => void
  currentStep?: string
  progress: number
  videoId?: string
}

export default function ProcessingTerminal({ 
  isVisible, 
  onToggle, 
  currentStep, 
  progress,
  videoId 
}: ProcessingTerminalProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)

  // Initialize processing steps
  useEffect(() => {
    if (videoId) {
      const initialSteps: ProcessingStep[] = [
        {
          id: 'upload',
          title: 'Upload do Vídeo',
          status: 'running',
          message: 'Enviando arquivo para o Cloudinary...',
          timestamp: new Date().toLocaleTimeString(),
          details: ['Preparando arquivo', 'Validando formato', 'Iniciando upload'],
          progress: 0
        },
        {
          id: 'transcription',
          title: 'Transcrição de Áudio',
          status: 'pending',
          message: 'Aguardando upload...',
          timestamp: '',
          details: ['Extraindo áudio', 'Processando com Whisper AI', 'Gerando timestamps']
        },
        {
          id: 'analysis',
          title: 'Análise de Conteúdo',
          status: 'pending',
          message: 'Aguardando transcrição...',
          timestamp: '',
          details: ['Analisando sentimentos', 'Identificando hooks', 'Calculando scores virais']
        },
        {
          id: 'clips',
          title: 'Geração de Clips',
          status: 'pending',
          message: 'Aguardando análise...',
          timestamp: '',
          details: ['Selecionando momentos virais', 'Cortando vídeos', 'Otimizando para plataformas']
        }
      ]
      setSteps(initialSteps)
      setLogs([
        `[${new Date().toLocaleTimeString()}] Iniciando processamento do vídeo ${videoId}`,
        `[${new Date().toLocaleTimeString()}] Conectando com serviços de IA...`,
        `[${new Date().toLocaleTimeString()}] Sistema pronto para processar`
      ])
    }
  }, [videoId])

  // Update steps based on current progress
  useEffect(() => {
    if (!currentStep) return

    setSteps(prev => prev.map(step => {
      if (step.id === currentStep) {
        return {
          ...step,
          status: 'running',
          message: getStepMessage(step.id, 'running'),
          timestamp: new Date().toLocaleTimeString(),
          progress: step.id === 'upload' ? progress : undefined
        }
      } else if (getStepOrder(step.id) < getStepOrder(currentStep)) {
        return {
          ...step,
          status: 'completed',
          message: getStepMessage(step.id, 'completed'),
          timestamp: step.timestamp || new Date().toLocaleTimeString()
        }
      }
      return step
    }))

    // Add log entry
    const timestamp = new Date().toLocaleTimeString()
    const stepName = getStepName(currentStep)
    setLogs(prev => [...prev, `[${timestamp}] ${stepName} - ${getStepMessage(currentStep, 'running')}`])

    // Auto scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [currentStep, progress])

  const getStepOrder = (stepId: string): number => {
    const order: Record<string, number> = { upload: 1, transcription: 2, analysis: 3, clips: 4 }
    return order[stepId] || 0
  }

  const getStepName = (stepId: string): string => {
    const names: Record<string, string> = {
      upload: 'UPLOAD',
      transcription: 'TRANSCRIÇÃO',
      analysis: 'ANÁLISE',
      clips: 'CLIPS'
    }
    return names[stepId] || stepId.toUpperCase()
  }

  const getStepMessage = (stepId: string, status: string): string => {
    const messages: Record<string, Record<string, string>> = {
      upload: {
        running: 'Enviando vídeo para o Cloudinary...',
        completed: 'Upload concluído com sucesso!'
      },
      transcription: {
        running: 'Extraindo áudio e gerando transcrição...',
        completed: 'Transcrição gerada com sucesso!'
      },
      analysis: {
        running: 'Analisando conteúdo com IA...',
        completed: 'Análise de conteúdo concluída!'
      },
      clips: {
        running: 'Gerando clips virais...',
        completed: 'Clips gerados com sucesso!'
      }
    }
    return messages[stepId]?.[status] || ''
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStepBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      running: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-600'
    }
    return variants[status] || variants.pending
  }

  // Expose method to parent component for adding logs
  useEffect(() => {
    (window as any).addProcessingLog = (message: string) => {
      const timestamp = new Date().toLocaleTimeString()
      setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    }
  }, [])

  if (!isVisible) return null

  return (
    <Card className="border-0 shadow-lg bg-gray-900 text-green-400 font-mono">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Terminal className="h-5 w-5" />
            Terminal de Processamento
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-900 text-green-300 border-green-600">
              {steps.filter(s => s.status === 'completed').length}/{steps.length} concluídos
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
            >
              ✕
            </Button>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso Geral</span>
            <span>{Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)}%</span>
          </div>
          <Progress 
            value={(steps.filter(s => s.status === 'completed').length / steps.length) * 100} 
            className="h-2 bg-gray-800"
          />
        </div>
      </CardHeader>

      <CardContent 
        ref={terminalRef}
        className={`space-y-3 max-h-96 overflow-y-auto transition-all duration-300 ${
          isExpanded ? 'max-h-96' : 'max-h-48'
        }`}
      >
        {steps.map((step) => (
          <div key={step.id} className="space-y-2">
            {/* Step Header */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                {getStepIcon(step.status)}
                <div>
                  <div className="font-medium text-green-300">{step.title}</div>
                  <div className="text-sm text-gray-400">{step.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {step.timestamp && (
                  <span className="text-xs text-gray-500">{step.timestamp}</span>
                )}
                <Badge className={getStepBadge(step.status)}>
                  {step.status === 'pending' ? 'Pendente' : 
                   step.status === 'running' ? 'Executando' :
                   step.status === 'completed' ? 'Concluído' : 'Erro'}
                </Badge>
              </div>
            </div>

            {/* Step Progress Bar (for upload) */}
            {step.id === 'upload' && step.status === 'running' && step.progress !== undefined && (
              <div className="ml-7 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Upload</span>
                  <span>{step.progress.toFixed(1)}%</span>
                </div>
                <Progress value={step.progress} className="h-1 bg-gray-800" />
              </div>
            )}

            {/* Step Details (expanded) */}
            {isExpanded && step.details && step.details.length > 0 && (
              <div className="ml-7 space-y-1">
                {step.details.map((detail, idx) => (
                  <div key={idx} className="text-xs text-gray-500 font-mono">
                    → {detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Live Log Stream */}
        <div className="border-t border-gray-700 pt-3">
          <div className="text-xs text-gray-500 mb-2">Log em Tempo Real:</div>
          <div className="bg-gray-950 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
            <div className="text-green-400">
              $ clipsforge --process-video --id={videoId}
            </div>
            {logs.map((log, idx) => (
              <div key={idx} className="text-gray-300">
                {log}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 