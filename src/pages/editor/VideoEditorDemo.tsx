/**
 * 🎬 VIDEO EDITOR DEMO - ClipsForge Pro
 * 
 * Demonstração completa do editor profissional
 * Inclui FASE 4: Efeitos e Transições
 * 
 * @version 4.0.0 - FASE 4 COMPLETA
 * @author ClipsForge Team
 */

import React, { useState, useRef, useCallback } from 'react';
import { VideoEditor, VideoEditorRef } from '../../components/VideoEditor';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Upload, Play, Download, Sparkles, Zap } from 'lucide-react';

export const VideoEditorDemo: React.FC = () => {
  const editorRef = useRef<VideoEditorRef>(null);
  const [demoMode, setDemoMode] = useState<'basic' | 'effects' | 'transitions'>('basic');
  const [showInstructions, setShowInstructions] = useState(true);

  // ===== DEMO HANDLERS =====

  const handleDemoModeChange = useCallback((mode: 'basic' | 'effects' | 'transitions') => {
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
      
      default:
        return {
          title: '🎬 Basic Editor Demo',
          steps: [
            '1. Drag and drop a video file onto the player area',
            '2. Use playback controls: Play/Pause (Space), Skip (←/→)',
            '3. Select editing tools: Select (V), Razor (R), Text (T)',
            '4. Use the timeline to cut, trim, and arrange clips',
            '5. Try keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y (Redo)',
            '6. Access advanced features with Effects 🎨 and Transitions 🔄'
          ],
          features: [
            '🎮 Professional playback controls',
            '✂️ Precision cutting and trimming',
            '📝 Text and overlay tools',
            '⌨️ Complete keyboard shortcuts',
            '🔄 Undo/Redo system',
            '💾 Project save/load'
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
                Professional video editing with effects and transitions
              </p>
            </div>
            
            {/* Demo Mode Selector */}
            <div className="flex items-center space-x-2">
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
              <span>🎬 ClipsForge Pro v4.0.0</span>
              <span>•</span>
              <span>FASE 4: Effects & Transitions</span>
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