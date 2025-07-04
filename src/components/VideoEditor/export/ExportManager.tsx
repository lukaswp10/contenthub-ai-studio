/**
 * 📤 EXPORT MANAGER - ClipsForge Pro
 * 
 * Gerenciador de exportação profissional
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  Download, 
  Settings, 
  Play, 
  Pause, 
  X, 
  FileVideo,
  Clock,
  HardDrive,
  Cpu,
  Zap
} from 'lucide-react';
import { renderEngine, createRenderJob } from '../../../utils/renderEngine';
import { RenderJob, RenderResult, RenderProgress } from '../../../types/render.types';

export interface ExportManagerProps {
  videoData?: {
    url: string;
    duration: number;
    name: string;
  };
  onExportComplete?: (result: RenderResult) => void;
  onExportError?: (error: string) => void;
  className?: string;
}

const ExportManager: React.FC<ExportManagerProps> = ({
  videoData,
  onExportComplete,
  onExportError,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<RenderProgress | null>(null);
  const [exportQueue, setExportQueue] = useState<RenderJob[]>([]);
  const [exportHistory, setExportHistory] = useState<RenderResult[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('youtube-1080p');

  // Export Presets
  const exportPresets = [
    {
      id: 'youtube-1080p',
      name: 'YouTube 1080p',
      description: 'Otimizado para YouTube',
      format: 'mp4' as const,
      resolution: { width: 1920, height: 1080 },
      bitrate: 8000,
      quality: 'high' as const,
      icon: '🎬'
    },
    {
      id: 'instagram-story',
      name: 'Instagram Story',
      description: '9:16 para Stories',
      format: 'mp4' as const,
      resolution: { width: 1080, height: 1920 },
      bitrate: 6000,
      quality: 'high' as const,
      icon: '📱'
    },
    {
      id: 'tiktok-vertical',
      name: 'TikTok Vertical',
      description: 'Otimizado para TikTok',
      format: 'mp4' as const,
      resolution: { width: 1080, height: 1920 },
      bitrate: 5000,
      quality: 'high' as const,
      icon: '🎵'
    },
    {
      id: 'twitter-landscape',
      name: 'Twitter Landscape',
      description: '16:9 para Twitter',
      format: 'mp4' as const,
      resolution: { width: 1280, height: 720 },
      bitrate: 4000,
      quality: 'high' as const,
      icon: '🐦'
    }
  ];

  const handleStartExport = useCallback(async () => {
    if (!videoData || !selectedPreset) return;

    const preset = exportPresets.find(p => p.id === selectedPreset);
    if (!preset) return;

    setIsExporting(true);
    setExportProgress({
      percentage: 0,
      phase: 'preparing',
      currentFrame: 0,
      totalFrames: Math.floor(videoData.duration * 30),
      framesPerSecond: 0,
      timeElapsed: 0,
      timeRemaining: 0,
      bytesProcessed: 0,
      bytesTotal: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      temperature: 0,
      message: 'Inicializando renderização...',
      warnings: []
    });

    let renderJob: RenderJob | null = null;

    try {
      // Initialize render engine
      await renderEngine.initialize({
        engine: {
          threads: 4,
          useGPU: true,
          useWebWorkers: true,
          memoryLimit: 2048,
          cacheSize: 100,
          quality: preset.quality
        },
        output: {
          defaultFormat: preset.format,
          defaultCodec: 'h264',
          defaultQuality: 80,
          defaultBitrate: preset.bitrate
        },
        performance: {
          thermalThrottling: true,
          batteryOptimization: false,
          backgroundRendering: true,
          priorityBoost: false
        },
        debugging: {
          enabled: false,
          logLevel: 'error',
          profileMemory: false,
          profileCPU: false
        }
      });

      // Create render job
      renderJob = createRenderJob({
        name: `Export: ${videoData.name} - ${preset.name}`,
        source: {
          type: 'timeline',
          assets: [],
          duration: videoData.duration,
          frameRate: 30,
          resolution: preset.resolution
        },
        output: {
          format: preset.format,
          codec: 'h264',
          audioCodec: 'aac',
          resolution: preset.resolution,
          frameRate: 30,
          bitrate: preset.bitrate,
          audioBitrate: 128,
          quality: 80,
          filename: `${videoData.name}_${preset.id}.${preset.format}`,
          destination: 'download',
          compressionLevel: 5,
          keyframeInterval: 30,
          bFrames: 2,
          profile: 'main',
          level: '4.0'
        },
        timeline: {
          duration: videoData.duration,
          frameRate: 30,
          startTime: 0,
          endTime: videoData.duration,
          tracks: [],
          markers: []
        },
        audio: {
          enabled: true,
          volume: 1,
          pan: 0,
          muted: false,
          tracks: [],
          masterEffects: [],
          mixdown: 'stereo',
          sampleRate: 44100,
          bitDepth: 16
        },
        metadata: {
          title: videoData.name,
          description: `Exported with ${preset.name} preset`,
          author: 'ClipsForge User'
        },
        onProgress: (progress: RenderProgress) => {
          setExportProgress(progress);
        }
      });

      // Add to queue
      if (renderJob) {
        setExportQueue(prev => [...prev, renderJob]);
      }

      // Start render
      const result = await renderEngine.render(renderJob!);

      // Handle result
      if (result.status === 'success') {
        setExportHistory(prev => [...prev, result]);
        onExportComplete?.(result);
        
        // Trigger download
        if (result.output?.url) {
          const link = document.createElement('a');
          link.href = result.output.url;
          link.download = result.output.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        onExportError?.(result.error?.message || 'Export failed');
      }

    } catch (error) {
      console.error('Export error:', error);
      onExportError?.(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
      if (renderJob) {
        setExportQueue(prev => prev.filter(job => job.id !== renderJob.id));
      }
    }
  }, [videoData, selectedPreset, onExportComplete, onExportError]);

  const handleCancelExport = useCallback(() => {
    renderEngine.cancel();
    setIsExporting(false);
    setExportProgress(null);
  }, []);

  return (
    <div className={`export-manager ${className}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Export Manager</h3>
            <p className="text-sm text-gray-400">Exportação profissional de vídeos</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Fase 8
          </Badge>
        </div>

        {/* Export Presets */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Presets de Exportação</h4>
          <div className="grid grid-cols-2 gap-3">
            {exportPresets.map((preset) => (
              <Card
                key={preset.id}
                className={`p-3 cursor-pointer transition-all hover:bg-gray-700 ${
                  selectedPreset === preset.id ? 'ring-2 ring-blue-500 bg-gray-700' : 'bg-gray-800'
                }`}
                onClick={() => setSelectedPreset(preset.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{preset.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{preset.name}</div>
                    <div className="text-xs text-gray-400">{preset.description}</div>
                    <div className="text-xs text-gray-500">
                      {preset.resolution.width}x{preset.resolution.height} • {preset.bitrate}kbps
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && exportProgress && (
          <Card className="p-4 bg-gray-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">Exportando...</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelExport}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{exportProgress.phase}</span>
                  <span>{exportProgress.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Frame {exportProgress.currentFrame} de {exportProgress.totalFrames}</span>
                  <span>{exportProgress.framesPerSecond.toFixed(1)} fps</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-gray-400">
                    {Math.floor(exportProgress.timeRemaining / 60)}:{(exportProgress.timeRemaining % 60).toFixed(0).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive size={12} className="text-gray-400" />
                  <span className="text-gray-400">{exportProgress.memoryUsage.toFixed(0)}MB</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Cpu size={12} className="text-gray-400" />
                  <span className="text-gray-400">{exportProgress.cpuUsage.toFixed(0)}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap size={12} className="text-gray-400" />
                  <span className="text-gray-400">{exportProgress.gpuUsage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Export Controls */}
        <div className="flex space-x-3">
          <Button
            onClick={handleStartExport}
            disabled={!videoData || isExporting}
            className="flex-1"
          >
            <Download size={16} className="mr-2" />
            {isExporting ? 'Exportando...' : 'Iniciar Export'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
          >
            <Settings size={16} />
          </Button>
        </div>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Histórico de Exports</h4>
            <div className="space-y-2">
              {exportHistory.slice(-3).map((result) => (
                <Card key={result.id} className="p-3 bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileVideo size={16} className="text-blue-400" />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {result.output?.filename || 'Export'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {result.output?.size ? `${(result.output.size / 1024 / 1024).toFixed(1)}MB` : ''} • 
                          {result.completedAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={result.status === 'success' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {result.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-gray-500 text-center">
          Render Engine: {renderEngine.name} v{renderEngine.version}
        </div>
      </div>
    </div>
  );
};

export default ExportManager; 