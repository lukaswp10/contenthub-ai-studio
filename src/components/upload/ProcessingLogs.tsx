import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Clock,
  Upload,
  FileText,
  Zap,
  Scissors,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Download,
  Terminal
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  step: string
  message: string
  data?: any
}

interface ProcessingStep {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime?: string
  endTime?: string
  duration?: number
}

interface ProcessingLogsProps {
  isVisible: boolean
  onToggle: () => void
  currentStep?: string
  progress: number
  videoId?: string
}

export default function ProcessingLogs({ 
  isVisible, 
  onToggle, 
  currentStep, 
  progress,
  videoId 
}: ProcessingLogsProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [showRawLogs, setShowRawLogs] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Initialize steps
  useEffect(() => {
    if (videoId && steps.length === 0) {
      const initialSteps: ProcessingStep[] = [
        { id: 'upload', title: 'Upload', status: 'running', startTime: new Date().toISOString() },
        { id: 'transcription', title: 'Transcrição', status: 'pending' },
        { id: 'analysis', title: 'Análise IA', status: 'pending' },
        { id: 'clips', title: 'Gerar Clips', status: 'pending' }
      ]
      setSteps(initialSteps)
      addLog('info', 'upload', 'Iniciando processamento do vídeo', { videoId })
    }
  }, [videoId])

  // Update steps based on current progress
  useEffect(() => {
    if (!currentStep) return

    setSteps(prev => prev.map(step => {
      if (step.id === currentStep && step.status !== 'running') {
        const updatedStep = {
          ...step,
          status: 'running' as const,
          startTime: new Date().toISOString()
        }
        addLog('info', step.id, `Iniciando ${step.title.toLowerCase()}`)
        return updatedStep
      } else if (getStepOrder(step.id) < getStepOrder(currentStep) && step.status === 'running') {
        const now = new Date().toISOString()
        const duration = step.startTime ? 
          Math.round((new Date(now).getTime() - new Date(step.startTime).getTime()) / 1000) : 0
        
        const completedStep = {
          ...step,
          status: 'completed' as const,
          endTime: now,
          duration
        }
        addLog('success', step.id, `${step.title} concluído`, { duration: `${duration}s` })
        return completedStep
      }
      return step
    }))
  }, [currentStep])

  const getStepOrder = (stepId: string): number => {
    const order: Record<string, number> = { upload: 1, transcription: 2, analysis: 3, clips: 4 }
    return order[stepId] || 0
  }

  const addLog = (level: LogEntry['level'], step: string, message: string, data?: any) => {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      step,
      message,
      data
    }
    
    setLogs(prev => [...prev, logEntry])
    console.log(`[${level.toUpperCase()}] ${step}: ${message}`, data || '')
  }

  // Expose global logging function
  useEffect(() => {
    window.addProcessingLog = (message: string, level: LogEntry['level'] = 'info', data?: any) => {
      addLog(level, currentStep || 'system', message, data)
    }
    
    return () => {
      delete window.addProcessingLog
    }
  }, [currentStep])

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getStepIcon = (step: ProcessingStep) => {
    if (step.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (step.status === 'running') {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    }
    if (step.status === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    
    const icons = {
      upload: <Upload className="h-4 w-4 text-gray-400" />,
      transcription: <FileText className="h-4 w-4 text-gray-400" />,
      analysis: <Zap className="h-4 w-4 text-gray-400" />,
      clips: <Scissors className="h-4 w-4 text-gray-400" />
    }
    return icons[step.id as keyof typeof icons] || <Clock className="h-4 w-4 text-gray-400" />
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return 'ℹ️'
    }
  }

  const exportLogs = () => {
    const exportData = {
      videoId,
      exportTime: new Date().toISOString(),
      steps: steps.map(step => ({
        ...step,
        duration: step.duration ? `${step.duration}s` : null
      })),
      logs: logs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp).toLocaleString('pt-BR')
      })),
      summary: {
        totalSteps: steps.length,
        completedSteps: steps.filter(s => s.status === 'completed').length,
        currentStep: currentStep,
        totalLogs: logs.length,
        errors: logs.filter(l => l.level === 'error').length,
        warnings: logs.filter(l => l.level === 'warning').length
      }
    }

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    toast({
      title: "Logs copiados!",
      description: "Os logs foram copiados para a área de transferência em formato JSON.",
    })
  }

  const downloadLogs = () => {
    const exportData = {
      videoId,
      exportTime: new Date().toISOString(),
      steps,
      logs,
      summary: {
        totalSteps: steps.length,
        completedSteps: steps.filter(s => s.status === 'completed').length,
        currentStep: currentStep,
        totalLogs: logs.length,
        errors: logs.filter(l => l.level === 'error').length,
        warnings: logs.filter(l => l.level === 'warning').length
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `processing-logs-${videoId}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const overallProgress = (steps.filter(s => s.status === 'completed').length / steps.length) * 100

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[500px] max-h-[600px]">
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5 text-blue-600" />
              Logs de Processamento
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawLogs(!showRawLogs)}
                className="h-8 px-2 text-xs"
              >
                {showRawLogs ? 'Visual' : 'Raw'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportLogs}
                className="h-8 px-2"
                title="Copiar logs em JSON"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadLogs}
                className="h-8 px-2"
                title="Baixar logs"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 px-2"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Progress Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progresso: {Math.round(overallProgress)}%</span>
              <span>{logs.length} logs • {logs.filter(l => l.level === 'error').length} erros</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {!showRawLogs ? (
              /* Visual Logs */
              <div className="space-y-4">
                {/* Steps Overview */}
                <div className="grid grid-cols-4 gap-2">
                  {steps.map((step) => (
                    <div key={step.id} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStepIcon(step)}
                        <span className="text-xs font-medium">{step.title}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 ${
                            step.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                            step.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            step.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {step.status === 'pending' ? 'Pendente' : 
                           step.status === 'running' ? 'Executando' :
                           step.status === 'completed' ? 'OK' : 'Erro'}
                        </Badge>
                        {step.duration && (
                          <span className="text-xs text-gray-500">{step.duration}s</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Logs */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Logs Recentes:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-1 bg-gray-50 rounded p-2">
                    {logs.slice(-10).map((log, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <span className="text-gray-400 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                        <span className="shrink-0">{getLevelIcon(log.level)}</span>
                        <span className={`${getLevelColor(log.level)} flex-1`}>
                          [{log.step}] {log.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              </div>
            ) : (
              /* Raw JSON Logs */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Raw JSON ({logs.length} entradas)</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportLogs}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar JSON
                  </Button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded font-mono overflow-x-auto">
                    {JSON.stringify({
                      videoId,
                      currentStep,
                      progress: Math.round(overallProgress),
                      steps,
                      recentLogs: logs.slice(-5),
                      summary: {
                        totalLogs: logs.length,
                        errors: logs.filter(l => l.level === 'error').length,
                        warnings: logs.filter(l => l.level === 'warning').length,
                        lastUpdate: new Date().toISOString()
                      }
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    addProcessingLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', data?: any) => void
  }
} 