import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
  X
} from 'lucide-react'

interface ProcessingStep {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'error'
  message: string
  timestamp?: string
}

interface ProcessingProgressProps {
  isVisible: boolean
  onToggle: () => void
  currentStep?: string
  progress: number
  videoId?: string
}

export default function ProcessingProgress({ 
  isVisible, 
  onToggle, 
  currentStep, 
  progress,
  videoId 
}: ProcessingProgressProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Initialize processing steps
  useEffect(() => {
    if (videoId) {
      const initialSteps: ProcessingStep[] = [
        {
          id: 'upload',
          title: 'Upload',
          status: 'running',
          message: 'Enviando vídeo...'
        },
        {
          id: 'transcription',
          title: 'Transcrição',
          status: 'pending',
          message: 'Aguardando...'
        },
        {
          id: 'analysis',
          title: 'Análise IA',
          status: 'pending',
          message: 'Aguardando...'
        },
        {
          id: 'clips',
          title: 'Gerar Clips',
          status: 'pending',
          message: 'Aguardando...'
        }
      ]
      setSteps(initialSteps)
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
          timestamp: new Date().toLocaleTimeString()
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
  }, [currentStep, progress])

  const getStepOrder = (stepId: string): number => {
    const order: Record<string, number> = { upload: 1, transcription: 2, analysis: 3, clips: 4 }
    return order[stepId] || 0
  }

  const getStepMessage = (stepId: string, status: string): string => {
    const messages: Record<string, Record<string, string>> = {
      upload: {
        running: 'Enviando vídeo...',
        completed: 'Upload concluído!'
      },
      transcription: {
        running: 'Processando áudio...',
        completed: 'Transcrição pronta!'
      },
      analysis: {
        running: 'IA analisando...',
        completed: 'Análise concluída!'
      },
      clips: {
        running: 'Gerando clips...',
        completed: 'Clips criados!'
      }
    }
    return messages[stepId]?.[status] || ''
  }

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
    
    // Icons for pending steps
    const icons = {
      upload: <Upload className="h-4 w-4 text-gray-400" />,
      transcription: <FileText className="h-4 w-4 text-gray-400" />,
      analysis: <Zap className="h-4 w-4 text-gray-400" />,
      clips: <Scissors className="h-4 w-4 text-gray-400" />
    }
    return icons[step.id as keyof typeof icons] || <Clock className="h-4 w-4 text-gray-400" />
  }

  const overallProgress = (steps.filter(s => s.status === 'completed').length / steps.length) * 100

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="border-0 shadow-xl bg-white">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-900">Processando Vídeo</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progresso Geral</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Steps - Compact View */}
          {!isExpanded && (
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    {getStepIcon(step)}
                    <span className="text-xs text-gray-600 mt-1">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Steps - Expanded View */}
          {isExpanded && (
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  {getStepIcon(step)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{step.title}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          step.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          step.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {step.status === 'pending' ? 'Pendente' : 
                         step.status === 'running' ? 'Executando' :
                         step.status === 'completed' ? 'Concluído' : 'Erro'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{step.message}</p>
                    {step.timestamp && (
                      <p className="text-xs text-gray-400">{step.timestamp}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress Bar */}
          {currentStep === 'upload' && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Upload</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 