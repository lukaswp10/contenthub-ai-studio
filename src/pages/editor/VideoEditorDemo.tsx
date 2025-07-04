/**
 * 🎬 VIDEO EDITOR DEMO - ClipsForge Pro
 * 
 * Demonstração completa do editor profissional
 * Inclui FASES 4, 6 & 7: Efeitos, Transições, Audio, Motion Graphics, Timeline Avançada e Preview
 * 
 * @version 7.0.0 - FASES 6 & 7 COMPLETAS
 * @author ClipsForge Team
 */

import React, { useState, useRef, useCallback } from 'react';
import { VideoEditor, VideoEditorRef } from '../../components/VideoEditor';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Upload, Play, Download, Sparkles, Zap, Volume2, Film, Clock, Monitor, Grid } from 'lucide-react';

export const VideoEditorDemo: React.FC = () => {
  const editorRef = useRef<VideoEditorRef>(null);
  const [demoMode, setDemoMode] = useState<'basic' | 'effects' | 'transitions' | 'audio' | 'motion' | 'timeline' | 'preview' | 'export' | 'queue' | 'render-settings'>('basic');
  const [showInstructions, setShowInstructions] = useState(true);

  // ===== DEMO HANDLERS =====

  const handleDemoModeChange = useCallback((mode: 'basic' | 'effects' | 'transitions' | 'audio' | 'motion' | 'timeline' | 'preview' | 'export' | 'queue' | 'render-settings') => {
    setDemoMode(mode);
    setShowInstructions(true);
  }, []);

  const handleProjectSave = useCallback((projectId: string) => {
    console.log('🎬 Project saved:', projectId);
  }, []);

  const handleProjectLoad = useCallback((projectId: string) => {
    console.log('🎬 Project loaded:', projectId);
  }, []);

  const handleExportStart = useCallback(() => {
    console.log('🎬 Export started');
  }, []);

  const handleExportComplete = useCallback((outputUrl: string) => {
    console.log('🎬 Export completed:', outputUrl);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('🎬 Editor error:', error);
  }, []);

  // ===== DEMO INSTRUCTIONS =====

  const getDemoInstructions = () => {
    switch (demoMode) {
      case 'effects':
        return {
          title: '🎨 Effects Demo - FASE 4',
          steps: [
            '1. Click the 🎨 Effects button in the toolbar',
            '2. Browse through different effect categories (Color, Blur, Stylistic)',
            '3. Click on any effect to apply it to your video',
            '4. Expand applied effects to adjust parameters in real-time',
            '5. Use sliders to control intensity, opacity, and other properties',
            '6. Try combining multiple effects for creative results'
          ],
          features: [
            '✨ Real-time WebGL rendering',
            '🎨 Professional color grading tools',
            '💫 Advanced blur and sharpen effects',
            '📷 Vintage and cinematic filters',
            '🎞️ Film grain and texture effects',
            '⚡ GPU-accelerated performance'
          ]
        };
      
      case 'transitions':
        return {
          title: '🔄 Transitions Demo - FASE 4',
          steps: [
            '1. Click the 🔄 Transitions button in the toolbar',
            '2. Select source and target tracks in the panel',
            '3. Choose from 7 categories: Basic, Slide, Zoom, Rotate, Wipe, 3D, Creative',
            '4. Click on any transition to apply it between clips',
            '5. Adjust duration, easing, and custom parameters',
            '6. Preview transitions in real-time'
          ],
          features: [
            '🌅 Basic fades and dissolves',
            '📱 Smooth slide transitions',
            '🔍 Dynamic zoom effects',
            '🌀 Rotation and spin animations',
            '🧽 Professional wipe patterns',
            '🎲 Stunning 3D cube and flip effects',
            '✨ Creative glitch and liquid morphing'
          ]
        };

      case 'audio':
        return {
          title: '🎵 Audio Mixer Demo - FASE 6',
          steps: [
            '1. Click the 🎵 Audio button in the toolbar',
            '2. Add audio tracks with the + button',
            '3. Adjust volume levels with faders',
            '4. Use EQ, compressor, and reverb effects',
            '5. Monitor audio levels in real-time',
            '6. Record audio directly into tracks'
          ],
          features: [
            '🎛️ Professional mixing console',
            '📊 Real-time audio metering',
            '🎚️ Multi-band EQ and dynamics',
            '🔊 Reverb and delay effects',
            '⏺️ Direct recording capability',
            '🎵 Web Audio API integration'
          ]
        };

      case 'motion':
        return {
          title: '🎬 Motion Graphics Demo - FASE 6',
          steps: [
            '1. Click the 🎬 Motion button in the toolbar',
            '2. Add animation layers with keyframes',
            '3. Adjust transform properties (position, scale, rotation)',
            '4. Use animation presets for quick effects',
            '5. Create custom keyframe animations',
            '6. Preview motion graphics in real-time'
          ],
          features: [
            '🎨 Professional animation tools',
            '⏱️ Keyframe-based animation',
            '🔄 Transform controls',
            '📐 Bezier curve interpolation',
            '🎭 Layer management system',
            '🖥️ WebGL/Canvas rendering'
          ]
        };

      case 'timeline':
        return {
          title: '⏱️ Advanced Timeline Demo - FASE 7',
          steps: [
            '1. Click the ⏱️ Timeline button in the toolbar',
            '2. Use professional transport controls',
            '3. Zoom in/out with zoom controls',
            '4. Toggle waveforms and grid display',
            '5. Navigate with timecode display',
            '6. Experience professional timeline workflow'
          ],
          features: [
            '🎬 Professional timeline interface',
            '🎵 Audio waveform visualization',
            '⏰ Precise timecode navigation',
            '🔍 Advanced zoom controls',
            '📊 Grid and ruler system',
            '⚡ Optimized performance'
          ]
        };

      case 'preview':
        return {
          title: '📺 Realtime Preview Demo - FASE 7',
          steps: [
            '1. Click the 📺 Preview button in the toolbar',
            '2. Monitor real-time performance metrics',
            '3. Check GPU acceleration status',
            '4. Adjust preview quality settings',
            '5. View FPS and CPU/GPU usage',
            '6. Experience professional preview system'
          ],
          features: [
            '📊 Real-time performance monitoring',
            '🚀 GPU acceleration support',
            '📈 FPS and resource tracking',
            '⚙️ Quality control settings',
            '🖥️ Professional preview interface',
            '⚡ Optimized rendering pipeline'
          ]
        };

      case 'export':
        return {
          title: '📤 Export Manager Demo - FASE 8',
          steps: [
            '1. Click the 📤 Export button in the toolbar',
            '2. Choose from professional export presets',
            '3. Configure output format and quality',
            '4. Set custom resolution and bitrate',
            '5. Add watermarks and metadata',
            '6. Start export and monitor progress'
          ],
          features: [
            '🎬 Professional export presets',
            '📱 Social media optimized formats',
            '🔧 Custom quality settings',
            '🏷️ Watermark and branding',
            '📊 Real-time progress tracking',
            '⚡ GPU-accelerated encoding'
          ]
        };

      case 'queue':
        return {
          title: '🔄 Render Queue Demo - FASE 8',
          steps: [
            '1. Click the 🔄 Queue button in the toolbar',
            '2. View all render jobs in queue',
            '3. Manage job priorities and order',
            '4. Monitor background rendering',
            '5. Pause/resume render jobs',
            '6. View render statistics'
          ],
          features: [
            '📋 Professional queue management',
            '🎯 Priority-based rendering',
            '⏸️ Pause/resume functionality',
            '📊 Real-time progress monitoring',
            '🔄 Background processing',
            '📈 Performance statistics'
          ]
        };

      case 'render-settings':
        return {
          title: '⚙️ Render Settings Demo - FASE 8',
          steps: [
            '1. Click the ⚙️ Settings button in the toolbar',
            '2. Configure render quality presets',
            '3. Adjust performance settings',
            '4. Set memory and cache limits',
            '5. Enable GPU acceleration',
            '6. Optimize for your hardware'
          ],
          features: [
            '🎛️ Professional quality presets',
            '⚡ Performance optimization',
            '🧠 Memory management',
            '🚀 GPU acceleration controls',
            '🔧 Advanced configuration',
            '📊 System monitoring'
          ]
        };
      
      default:
        return {
          title: '🎬 Basic Editor Demo',
          steps: [
            '1. Drag and drop a video file onto the player area',
            '2. Use playback controls: Play/Pause (Space), Skip (←/→)',
            '3. Select editing tools: Select (V), Razor (R), Text (T)',
            '4. Use the timeline to cut, trim, and arrange clips',
            '5. Try keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y (Redo)',
            '6. Explore advanced features: 🎨 Effects, 🔄 Transitions, 🎵 Audio, 🎬 Motion, ⏱️ Timeline, 📺 Preview'
          ],
          features: [
            '🎮 Professional playback controls',
            '✂️ Precision cutting and trimming',
            '📝 Text and overlay tools',
            '⌨️ Complete keyboard shortcuts',
            '🔄 Undo/Redo system',
            '💾 Project save/load',
            '🎨 Effects & Transitions (Phase 4)',
            '🎵 Audio Mixer (Phase 6)',
            '🎬 Motion Graphics (Phase 6)',
            '⏱️ Advanced Timeline (Phase 7)',
            '📺 Realtime Preview (Phase 7)'
          ]
        };
    }
  };

  const instructions = getDemoInstructions();

  return (
    <div className="video-editor-demo min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                🎬 ClipsForge Pro - Video Editor
              </h1>
              <p className="text-gray-400">
                Professional video editing with effects, transitions, audio, motion graphics, and advanced timeline
              </p>
            </div>
            
            {/* Demo Mode Selector */}
            <div className="flex items-center space-x-2 flex-wrap">
              <Button
                variant={demoMode === 'basic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('basic')}
                className="flex items-center space-x-2"
              >
                <Play size={16} />
                <span>Basic</span>
              </Button>
              
              <Button
                variant={demoMode === 'effects' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('effects')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'effects' ? '#3b82f6' : 'transparent',
                  borderColor: '#3b82f6'
                }}
              >
                <Sparkles size={16} />
                <span>Effects</span>
              </Button>
              
              <Button
                variant={demoMode === 'transitions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('transitions')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'transitions' ? '#8b5cf6' : 'transparent',
                  borderColor: '#8b5cf6'
                }}
              >
                <Zap size={16} />
                <span>Transitions</span>
              </Button>

              <Button
                variant={demoMode === 'audio' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('audio')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'audio' ? '#10b981' : 'transparent',
                  borderColor: '#10b981'
                }}
              >
                <Volume2 size={16} />
                <span>Audio</span>
              </Button>

              <Button
                variant={demoMode === 'motion' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('motion')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'motion' ? '#f59e0b' : 'transparent',
                  borderColor: '#f59e0b'
                }}
              >
                <Film size={16} />
                <span>Motion</span>
              </Button>

              <Button
                variant={demoMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('timeline')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'timeline' ? '#ef4444' : 'transparent',
                  borderColor: '#ef4444'
                }}
              >
                <Clock size={16} />
                <span>Timeline</span>
              </Button>

              <Button
                variant={demoMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('preview')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'preview' ? '#6366f1' : 'transparent',
                  borderColor: '#6366f1'
                }}
              >
                <Monitor size={16} />
                <span>Preview</span>
              </Button>

              {/* Phase 8 Buttons */}
              <Button
                variant={demoMode === 'export' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('export')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'export' ? '#059669' : 'transparent',
                  borderColor: '#059669'
                }}
              >
                <Download size={16} />
                <span>Export</span>
              </Button>

              <Button
                variant={demoMode === 'queue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('queue')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'queue' ? '#7c3aed' : 'transparent',
                  borderColor: '#7c3aed'
                }}
              >
                <Grid size={16} />
                <span>Queue</span>
              </Button>

              <Button
                variant={demoMode === 'render-settings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDemoModeChange('render-settings')}
                className="flex items-center space-x-2"
                style={{ 
                  backgroundColor: demoMode === 'render-settings' ? '#dc2626' : 'transparent',
                  borderColor: '#dc2626'
                }}
              >
                <Sparkles size={16} />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Panel */}
      {showInstructions && (
        <div className="bg-blue-900/20 border-b border-blue-700/50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                  {instructions.title}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstructions(false)}
                    className="ml-4 text-blue-400 hover:text-blue-300"
                  >
                    ✕ Hide
                  </Button>
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Steps */}
                  <div>
                    <h3 className="font-medium text-blue-200 mb-2">How to Use:</h3>
                    <ul className="space-y-1 text-sm text-blue-100">
                      {instructions.steps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Features */}
                  <div>
                    <h3 className="font-medium text-blue-200 mb-2">Features:</h3>
                    <ul className="space-y-1 text-sm text-blue-100">
                      {instructions.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Editor */}
      <div className="flex-1">
        <VideoEditor
          ref={editorRef}
          width={window.innerWidth}
          height={window.innerHeight - (showInstructions ? 200 : 100)}
          showToolbar={true}
          showTimeline={true}
          showSidebar={true}
          enableKeyboardShortcuts={true}
          showDebugOverlay={process.env.NODE_ENV === 'development'}
          onProjectSave={handleProjectSave}
          onProjectLoad={handleProjectLoad}
          onExportStart={handleExportStart}
          onExportComplete={handleExportComplete}
          onError={handleError}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>🎬 ClipsForge Pro v8.0.0</span>
              <span>•</span>
              <span>FASES 4-8: Effects, Transitions, Audio, Motion Graphics, Timeline, Preview, Render & Export</span>
              <span>•</span>
              <span>WebGL Powered</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Ready for professional video editing</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorDemo; 