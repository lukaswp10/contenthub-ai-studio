/**
 * 📤 EXPORT MODAL - ClipsForge Pro
 * 
 * Modal de exportação com presets de qualidade
 * Barra de progresso com ETA
 * Preview antes de exportar
 * Download direto ou salvar no Supabase
 * 
 * @version 7.2.0 - FASE 7
 * @author ClipsForge Team
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Cloud, Play, Settings, Clock, FileVideo, Zap, Smartphone, Monitor, Tv } from 'lucide-react';
import { VideoSegment, Subtitle, Overlay, ExportSettings } from '../../types/video-editor';
import { exportService, createExportJob, estimateExportTime, ExportResult } from '../../services/exportService';
import { useVideoEditorStore } from '../../stores/videoEditorStore';

// ===== TYPES =====

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: VideoSegment[];
  subtitles?: Subtitle[];
  overlays?: Overlay[];
  onExportComplete?: (result: ExportResult) => void;
  onSaveToCloud?: (result: ExportResult) => Promise<void>;
}

interface ExportState {
  isExporting: boolean;
  progress: number;
  eta: number;
  phase: string;
  error: string | null;
  result: ExportResult | null;
}

interface PresetInfo {
  name: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  settings: ExportSettings;
  category: 'social' | 'quality' | 'device';
}

// ===== PRESETS CONFIGURATION =====

const EXPORT_PRESETS: PresetInfo[] = [
  // Social Media
  {
    name: 'tiktok',
    label: 'TikTok',
    icon: <Smartphone className="w-5 h-5" />,
    description: '9:16 vertical, 1080x1920, optimized for mobile',
    settings: exportService.getPreset('tiktok'),
    category: 'social'
  },
  {
    name: 'instagram',
    label: 'Instagram',
    icon: <Monitor className="w-5 h-5" />,
    description: '1:1 square, 1080x1080, perfect for posts',
    settings: exportService.getPreset('instagram'),
    category: 'social'
  },
  {
    name: 'youtube',
    label: 'YouTube',
    icon: <Tv className="w-5 h-5" />,
    description: '16:9 widescreen, 1920x1080, 60fps',
    settings: exportService.getPreset('youtube'),
    category: 'social'
  },
  {
    name: 'twitter',
    label: 'Twitter',
    icon: <Monitor className="w-5 h-5" />,
    description: '16:9 landscape, 1280x720, optimized size',
    settings: exportService.getPreset('twitter'),
    category: 'social'
  },
  // Quality Presets
  {
    name: 'low',
    label: 'Low Quality',
    icon: <Zap className="w-5 h-5" />,
    description: '480p, fast export, small file size',
    settings: exportService.getPreset('low'),
    category: 'quality'
  },
  {
    name: 'medium',
    label: 'Medium Quality',
    icon: <FileVideo className="w-5 h-5" />,
    description: '720p, balanced quality and size',
    settings: exportService.getPreset('medium'),
    category: 'quality'
  },
  {
    name: 'high',
    label: 'High Quality',
    icon: <Monitor className="w-5 h-5" />,
    description: '1080p, excellent quality',
    settings: exportService.getPreset('high'),
    category: 'quality'
  },
  {
    name: 'ultra',
    label: 'Ultra Quality',
    icon: <Tv className="w-5 h-5" />,
    description: '4K, maximum quality, large file',
    settings: exportService.getPreset('ultra'),
    category: 'quality'
  }
];

// ===== COMPONENT =====

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  segments,
  subtitles = [],
  overlays = [],
  onExportComplete,
  onSaveToCloud
}) => {
  
  // ===== STATE =====
  
  const [selectedPreset, setSelectedPreset] = useState<string>('high');
  const [customSettings, setCustomSettings] = useState<ExportSettings | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    eta: 0,
    phase: '',
    error: null,
    result: null
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [saveToCloud, setSaveToCloud] = useState(false);
  
  // ===== REFS =====
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // ===== STORE =====
  
  const { currentTime, duration } = useVideoEditorStore();
  
  // ===== COMPUTED VALUES =====
  
  const currentPreset = EXPORT_PRESETS.find(p => p.name === selectedPreset);
  const activeSettings = customSettings || currentPreset?.settings;
  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
  const estimatedTime = activeSettings ? estimateExportTime(segments, activeSettings) : 0;
  
  // ===== PRESET CATEGORIES =====
  
  const socialPresets = EXPORT_PRESETS.filter(p => p.category === 'social');
  const qualityPresets = EXPORT_PRESETS.filter(p => p.category === 'quality');
  
  // ===== EXPORT FUNCTIONS =====
  
  const handleExport = useCallback(async () => {
    if (!activeSettings) return;
    
    setExportState(prev => ({
      ...prev,
      isExporting: true,
      progress: 0,
      eta: estimatedTime,
      phase: 'Initializing...',
      error: null,
      result: null
    }));
    
    startTimeRef.current = Date.now();
    
    // Start progress tracking
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, estimatedTime - elapsed);
      
      setExportState(prev => ({
        ...prev,
        eta: remaining
      }));
    }, 1000);
    
    try {
      const job = createExportJob(segments, activeSettings, {
        subtitles: subtitles.length > 0 ? subtitles : undefined,
        overlays: overlays.length > 0 ? overlays : undefined,
        onProgress: (progress) => {
          setExportState(prev => ({ ...prev, progress }));
        },
        onComplete: async (result) => {
          setExportState(prev => ({ ...prev, result, isExporting: false }));
          
          if (saveToCloud && onSaveToCloud) {
            try {
              await onSaveToCloud(result);
              console.log('✅ Video saved to cloud');
            } catch (error) {
              console.error('❌ Failed to save to cloud:', error);
            }
          }
          
          if (onExportComplete) {
            onExportComplete(result);
          }
        },
        onError: (error) => {
          setExportState(prev => ({ 
            ...prev, 
            error, 
            isExporting: false 
          }));
        }
      });
      
      await exportService.exportVideo(job);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setExportState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isExporting: false 
      }));
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [activeSettings, segments, subtitles, overlays, estimatedTime, saveToCloud, onSaveToCloud, onExportComplete]);
  
  const handleAbort = useCallback(async () => {
    await exportService.abortExport();
    setExportState(prev => ({ 
      ...prev, 
      isExporting: false, 
      error: 'Export cancelled by user' 
    }));
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);
  
  const handleDownload = useCallback(() => {
    if (!exportState.result) return;
    
    const link = document.createElement('a');
    link.href = exportState.result.url;
    link.download = `clipsforge-export-${Date.now()}.${exportState.result.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [exportState.result]);
  
  // ===== CUSTOM SETTINGS =====
  
  const handleCustomSettingChange = useCallback((key: keyof ExportSettings, value: any) => {
    const baseSettings = currentPreset?.settings || EXPORT_PRESETS[0].settings;
    setCustomSettings(prev => ({
      ...prev || baseSettings,
      [key]: value
    }));
  }, [currentPreset]);
  
  // ===== FORMAT TIME =====
  
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  const formatFileSize = useCallback((bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
  }, []);
  
  // ===== EFFECTS =====
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportState({
        isExporting: false,
        progress: 0,
        eta: 0,
        phase: '',
        error: null,
        result: null
      });
      setCustomSettings(null);
      setShowAdvanced(false);
      setPreviewMode(false);
    }
  }, [isOpen]);
  
  // ===== RENDER =====
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileVideo className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Export Video</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={exportState.isExporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Export Progress */}
          {exportState.isExporting && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">Exporting Video...</span>
                <span className="text-blue-700">{Math.round(exportState.progress)}%</span>
              </div>
              
              <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportState.progress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm text-blue-700">
                <span>{exportState.phase}</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {formatTime(exportState.eta)}</span>
                </div>
              </div>
              
              <button
                onClick={handleAbort}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Export
              </button>
            </div>
          )}
          
          {/* Export Result */}
          {exportState.result && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-medium text-green-900">Export Complete!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-green-700 mb-4">
                <div>
                  <span className="font-medium">Duration:</span> {formatTime(totalDuration)}
                </div>
                <div>
                  <span className="font-medium">File Size:</span> {formatFileSize(exportState.result.size)}
                </div>
                <div>
                  <span className="font-medium">Format:</span> {exportState.result.format.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Resolution:</span> {activeSettings?.resolution.width}x{activeSettings?.resolution.height}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                
                {onSaveToCloud && (
                  <button
                    onClick={() => onSaveToCloud?.(exportState.result!)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Cloud className="w-4 h-4" />
                    Save to Cloud
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Error */}
          {exportState.error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="font-medium text-red-900">Export Failed</span>
              </div>
              <p className="text-red-700">{exportState.error}</p>
            </div>
          )}
          
          {/* Video Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Video Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Segments:</span> {segments.length}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {formatTime(totalDuration)}
              </div>
              <div>
                <span className="font-medium">Subtitles:</span> {subtitles.length}
              </div>
              <div>
                <span className="font-medium">Overlays:</span> {overlays.length}
              </div>
            </div>
          </div>
          
          {/* Social Media Presets */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Social Media Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {socialPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset.name)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPreset === preset.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {preset.icon}
                    <span className="font-medium">{preset.label}</span>
                    <span className="text-xs text-gray-600 text-center">
                      {preset.settings.resolution.width}x{preset.settings.resolution.height}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Quality Presets */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Quality Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {qualityPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset.name)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPreset === preset.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {preset.icon}
                    <span className="font-medium">{preset.label}</span>
                    <span className="text-xs text-gray-600 text-center">
                      {preset.settings.resolution.width}x{preset.settings.resolution.height}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Current Preset Info */}
          {currentPreset && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                {currentPreset.icon}
                <h4 className="font-medium">{currentPreset.label}</h4>
              </div>
              <p className="text-gray-600 text-sm mb-3">{currentPreset.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Resolution:</span><br />
                  {activeSettings?.resolution.width}x{activeSettings?.resolution.height}
                </div>
                <div>
                  <span className="font-medium">Frame Rate:</span><br />
                  {activeSettings?.fps} fps
                </div>
                <div>
                  <span className="font-medium">Quality:</span><br />
                  {activeSettings?.quality}
                </div>
                <div>
                  <span className="font-medium">Estimated Time:</span><br />
                  {formatTime(estimatedTime)}
                </div>
              </div>
            </div>
          )}
          
          {/* Advanced Settings */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Advanced Settings
            </button>
            
            {showAdvanced && activeSettings && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Resolution */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Resolution</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={activeSettings.resolution.width}
                        onChange={(e) => handleCustomSettingChange('resolution', {
                          ...activeSettings.resolution,
                          width: parseInt(e.target.value)
                        })}
                        className="flex-1 px-3 py-2 border rounded-lg"
                        placeholder="Width"
                      />
                      <input
                        type="number"
                        value={activeSettings.resolution.height}
                        onChange={(e) => handleCustomSettingChange('resolution', {
                          ...activeSettings.resolution,
                          height: parseInt(e.target.value)
                        })}
                        className="flex-1 px-3 py-2 border rounded-lg"
                        placeholder="Height"
                      />
                    </div>
                  </div>
                  
                  {/* Frame Rate */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Frame Rate</label>
                    <select
                      value={activeSettings.fps}
                      onChange={(e) => handleCustomSettingChange('fps', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value={24}>24 fps</option>
                      <option value={30}>30 fps</option>
                      <option value={60}>60 fps</option>
                    </select>
                  </div>
                  
                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Format</label>
                    <select
                      value={activeSettings.format}
                      onChange={(e) => handleCustomSettingChange('format', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="mp4">MP4</option>
                      <option value="webm">WebM</option>
                      <option value="mov">MOV</option>
                    </select>
                  </div>
                  
                  {/* Quality */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Quality</label>
                    <select
                      value={activeSettings.quality}
                      onChange={(e) => handleCustomSettingChange('quality', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="ultra">Ultra</option>
                    </select>
                  </div>
                </div>
                
                {/* Include Subtitles */}
                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeSettings.includeSubtitles}
                      onChange={(e) => handleCustomSettingChange('includeSubtitles', e.target.checked)}
                    />
                    Include subtitles in video
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Save Options */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Save Options</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveToCloud}
                onChange={(e) => setSaveToCloud(e.target.checked)}
              />
              Save to cloud storage
            </label>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {segments.length} segments • {formatTime(totalDuration)} duration
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={exportState.isExporting}
            >
              Cancel
            </button>
            
            <button
              onClick={handleExport}
              disabled={exportState.isExporting || !activeSettings}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileVideo className="w-4 h-4" />
              {exportState.isExporting ? 'Exporting...' : 'Start Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 