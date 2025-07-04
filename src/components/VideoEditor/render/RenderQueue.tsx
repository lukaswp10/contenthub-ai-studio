/**
 * 🔄 RENDER QUEUE - ClipsForge Pro
 * 
 * Fila de renderização profissional
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Settings,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { RenderJob, RenderResult } from '../../../types/render.types';

export interface RenderQueueProps {
  jobs: RenderJob[];
  currentJob: RenderJob | null;
  onJobStart: (job: RenderJob) => void;
  onJobPause: () => void;
  onJobCancel: (jobId: string) => void;
  onJobRemove: (jobId: string) => void;
  onJobReorder: (jobId: string, direction: 'up' | 'down') => void;
  onQueueClear: () => void;
  className?: string;
}

const RenderQueue: React.FC<RenderQueueProps> = ({
  jobs,
  currentJob,
  onJobStart,
  onJobPause,
  onJobCancel,
  onJobRemove,
  onJobReorder,
  onQueueClear,
  className = ''
}) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const getJobStatusIcon = (job: RenderJob) => {
    switch (job.status) {
      case 'queued':
        return <Clock size={16} className="text-yellow-400" />;
      case 'processing':
        return <Play size={16} className="text-blue-400" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'failed':
        return <XCircle size={16} className="text-red-400" />;
      case 'cancelled':
        return <Square size={16} className="text-gray-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredJobs = showCompleted 
    ? jobs 
    : jobs.filter(job => job.status !== 'completed' && job.status !== 'cancelled');

  const queuedJobs = jobs.filter(job => job.status === 'queued').length;
  const processingJobs = jobs.filter(job => job.status === 'processing').length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;

  return (
    <div className={`render-queue ${className}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Render Queue</h3>
            <p className="text-sm text-gray-400">Gerenciamento de fila de renderização</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {jobs.length} jobs
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        {/* Queue Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-3 bg-gray-800">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{queuedJobs}</div>
              <div className="text-xs text-gray-400">Na Fila</div>
            </div>
          </Card>
          <Card className="p-3 bg-gray-800">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{processingJobs}</div>
              <div className="text-xs text-gray-400">Processando</div>
            </div>
          </Card>
          <Card className="p-3 bg-gray-800">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{completedJobs}</div>
              <div className="text-xs text-gray-400">Completos</div>
            </div>
          </Card>
          <Card className="p-3 bg-gray-800">
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{failedJobs}</div>
              <div className="text-xs text-gray-400">Falhas</div>
            </div>
          </Card>
        </div>

        {/* Queue Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => currentJob ? onJobPause() : onJobStart(jobs.find(j => j.status === 'queued')!)}
              disabled={!currentJob && queuedJobs === 0}
            >
              {currentJob ? <Pause size={16} /> : <Play size={16} />}
              {currentJob ? 'Pausar' : 'Iniciar'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => currentJob && onJobCancel(currentJob.id)}
              disabled={!currentJob}
            >
              <Square size={16} />
              Parar
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onQueueClear}
              disabled={jobs.length === 0}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={16} />
              Limpar Fila
            </Button>
          </div>
        </div>

        {/* Job List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Jobs de Renderização</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs"
            >
              {showCompleted ? 'Ocultar Completos' : 'Mostrar Completos'}
            </Button>
          </div>

          {filteredJobs.length === 0 ? (
            <Card className="p-6 bg-gray-800">
              <div className="text-center text-gray-400">
                <Clock size={24} className="mx-auto mb-2 opacity-50" />
                <div className="text-sm">Nenhum job na fila</div>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map((job, index) => (
                <Card 
                  key={job.id} 
                  className={`p-4 transition-all ${
                    currentJob?.id === job.id ? 'ring-2 ring-blue-500 bg-gray-700' : 'bg-gray-800 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getJobStatusIcon(job)}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{job.name}</div>
                        <div className="text-xs text-gray-400">
                          {job.output.resolution.width}x{job.output.resolution.height} • 
                          {job.output.format.toUpperCase()} • 
                          {job.priority} priority
                        </div>
                        {job.progress && job.status === 'processing' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{job.progress.phase}</span>
                              <span>{job.progress.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1">
                              <div 
                                className={`h-1 rounded-full transition-all ${getJobStatusColor(job.status)}`}
                                style={{ width: `${job.progress.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={job.status === 'completed' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {job.status}
                      </Badge>

                      {job.status === 'queued' && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onJobReorder(job.id, 'up')}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onJobReorder(job.id, 'down')}
                            disabled={index === filteredJobs.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown size={12} />
                          </Button>
                        </div>
                      )}

                      {job.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onJobStart(job)}
                          className="h-6 w-6 p-0 text-blue-400"
                          title="Tentar novamente"
                        >
                          <RotateCcw size={12} />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onJobRemove(job.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        disabled={job.status === 'processing'}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Current Job Details */}
        {currentJob && (
          <Card className="p-4 bg-blue-900/20 border-blue-500/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-blue-300">Job Atual</h4>
                <Badge variant="outline" className="text-blue-300 border-blue-500">
                  Processando
                </Badge>
              </div>
              
              <div className="text-sm text-white">{currentJob.name}</div>
              
              {currentJob.progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-blue-300">
                    <span>{currentJob.progress.message}</span>
                    <span>{currentJob.progress.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentJob.progress.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{currentJob.progress.framesPerSecond.toFixed(1)} fps</span>
                    <span>ETA: {Math.floor(currentJob.progress.timeRemaining / 60)}:{(currentJob.progress.timeRemaining % 60).toFixed(0).padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RenderQueue; 