/**
 * 🎬 VIDEO EDITOR PRINCIPAL - ClipsForge Pro
 * 
 * Componente principal conectando Player + Timeline + Store
 * Sincronização bidirecional completa entre player e timeline
 * Toolbar profissional com controles de playback e ferramentas
 * Sistema de atalhos de teclado (Space, R, V, T, Delete)
 * Layout responsivo com toolbar (60px), timeline (300px), sidebar (300px)
 * Tema dark profissional (#0f0f0f, #1a1a1a)
 * 
 * @version 7.0.0 - FASES 6 & 7 COMPLETAS
 * @author ClipsForge Team
 */

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '../ui/button';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import EffectsPanel from './EffectsPanel';
import TransitionsPanel from './TransitionsPanel';

// Phase 6 Components - Audio & Motion Graphics
import AudioMixerPanel from './AudioMixerPanel';
import MotionGraphicsPanel from './panels/MotionGraphicsPanel';

// Phase 7 Components - Advanced Timeline & Preview
import AdvancedTimeline from './timeline/AdvancedTimeline';
import RealtimePreview from './preview/RealtimePreview';
import PanelManager from './panels/PanelManager';

import EditingTools, { SnapUtilities } from '../../utils/editingTools';
import { commandManager } from '../../utils/commandManager';
import { effectsEngine } from '../../utils/effectsEngine';
import { audioEngine } from '../../utils/audioEngine';
import { motionEngine } from '../../utils/motionEngine';
import {
  useVideoEditorStore,
  usePlayerState,
  usePlayerActions,
  useTimelineState,
  useTimelineActions,
  useEditingTools,
  useToolsState,
  useToolsActions,
  useNavigation,
  useCommandSystem,
  useVideoTime,
  useVideoPlayback,
  useTimeline,
  useCommands
} from '../../stores/videoEditorStore';
import { 
  TimelineTrack, 
  EditorTool,
  TimelineState
} from '../../types/video-editor';
import { 
  BaseEffect, 
  Transition 
} from '../../types/effects.types';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  MousePointer,
  Scissors,
  Type,
  Image,
  ZoomIn,
  Hand,
  Undo,
  Redo,
  Save,
  Download,
  Settings,
  Grid,
  Magnet,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Upload,
  Trash2
} from 'lucide-react';

// Importar as interfaces reais dos componentes
import type { VideoPlayerRef } from './VideoPlayer';
import type { TimelineRef } from './Timeline';

// ===== CONSTANTS =====

const TOOLBAR_HEIGHT = 60;
const TIMELINE_HEIGHT = 300;
const SIDEBAR_WIDTH = 300;

// ===== TYPES =====

export interface VideoEditorProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  
  // Configurações
  showToolbar?: boolean;
  showTimeline?: boolean;
  showSidebar?: boolean;
  enableKeyboardShortcuts?: boolean;
  
  // Callbacks
  onProjectSave?: (projectId: string) => void;
  onProjectLoad?: (projectId: string) => void;
  onExportStart?: () => void;
  onExportComplete?: (outputUrl: string) => void;
  onError?: (error: string) => void;
  
  // Debug
  showDebugOverlay?: boolean;
}

export interface VideoEditorRef {
  // Player controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  
  // Timeline controls
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (trackId: string) => void;
  
  // Project controls
  saveProject: () => void;
  loadProject: (projectId: string) => void;
  exportProject: () => void;
  
  // Tool controls
  setTool: (tool: EditorTool) => void;
  
  // Selection
  selectItems: (itemIds: string[]) => void;
  clearSelection: () => void;
}

// ===== COMPONENT =====

const VideoEditor = forwardRef<VideoEditorRef, VideoEditorProps>(({
  width = 1200,
  height = 800,
  className = '',
  style = {},
  showToolbar = true,
  showTimeline = true,
  showSidebar = true,
  enableKeyboardShortcuts = true,
  showDebugOverlay = process.env.NODE_ENV === 'development',
  onProjectSave,
  onProjectLoad,
  onExportStart,
  onExportComplete,
  onError
}, ref): JSX.Element => {
  
  // ===== REFS =====
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const timelineRef = useRef<TimelineRef>(null);
  
  // ===== STORE HOOKS =====
  
  const store = useVideoEditorStore();
  const playerState = usePlayerState();
  const playerActions = usePlayerActions();
  const timelineState = useTimelineState();
  const timelineActions = useTimelineActions();
  const editingTools = useEditingTools();
  const toolsState = useToolsState();
  const toolsActions = useToolsActions();
  const navigation = useNavigation();
  const commandSystem = useCommandSystem();
  
  // ===== STATE =====
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [debugInfo, setDebugInfo] = useState({
    playerTime: 0,
    timelineTime: 0,
    syncOffset: 0,
    lastSync: Date.now()
  });
  
  // ===== EFFECTS & TRANSITIONS STATE =====
  
  const [activePanel, setActivePanel] = useState<'effects' | 'transitions' | 'audio' | 'motion' | 'timeline' | 'preview' | 'panels' | 'export' | 'queue' | 'render-settings' | null>(null);
  const [appliedEffects, setAppliedEffects] = useState<BaseEffect[]>([]);
  const [appliedTransitions, setAppliedTransitions] = useState<Transition[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [effectsEngineInitialized, setEffectsEngineInitialized] = useState(false);
  
  // ===== PHASE 6 & 7 STATE =====
  
  const [audioEngineInitialized, setAudioEngineInitialized] = useState(false);
  const [motionEngineInitialized, setMotionEngineInitialized] = useState(false);
  const [useAdvancedTimeline, setUseAdvancedTimeline] = useState(false);
  const [useRealtimePreview, setUseRealtimePreview] = useState(false);
  const [showPanelManager, setShowPanelManager] = useState(false);
  
  // ===== CALCULATIONS =====
  
  const playerWidth = showSidebar ? width - SIDEBAR_WIDTH : width;
  const playerHeight = showTimeline ? height - TOOLBAR_HEIGHT - TIMELINE_HEIGHT : height - TOOLBAR_HEIGHT;
  const timelineWidth = width;
  
  // ===== EDITING TOOLS INSTANCE =====
  
  const editingToolsInstance = new EditingTools(
    timelineState,
    (updates) => {
      // Converter TimelineTrack para TimelineLayer
      const layers = updates.tracks?.map((track: any) => ({
        id: track.id,
        type: track.type,
        name: track.name,
        visible: track.visible,
        items: track.items as Array<Record<string, unknown>>,
        color: track.color || '#3B82F6',
        locked: track.locked
      })) || [];
      timelineActions.setTimelineLayers(layers);
    }
  );
  
  // ===== ENGINES INITIALIZATION =====
  
  useEffect(() => {
    const initializeEngines = async () => {
      if (videoPlayerRef.current) {
        try {
          // Initialize Effects Engine
          if (!effectsEngineInitialized) {
            const canvas = document.createElement('canvas');
            canvas.width = playerWidth;
            canvas.height = playerHeight;
            
            await effectsEngine.initialize(canvas);
            setEffectsEngineInitialized(true);
            console.log('🎨 Effects Engine initialized successfully');
          }
          
          // Initialize Audio Engine (Phase 6)
          if (!audioEngineInitialized) {
            await audioEngine.initialize({
              sampleRate: 44100,
              bufferSize: 2048,
              enableProcessing: true
            });
            setAudioEngineInitialized(true);
            console.log('🎵 Audio Engine initialized successfully');
          }
          
          // Initialize Motion Engine (Phase 6)
          if (!motionEngineInitialized) {
            const motionCanvas = document.createElement('canvas');
            motionCanvas.width = playerWidth;
            motionCanvas.height = playerHeight;
            motionEngine.initialize(motionCanvas);
            setMotionEngineInitialized(true);
            console.log('🎬 Motion Engine initialized successfully');
          }
          
        } catch (error) {
          console.error('Failed to initialize engines:', error);
          onError?.('Failed to initialize engines');
        }
      }
    };
    
    initializeEngines();
    
    return () => {
      if (effectsEngineInitialized) {
        effectsEngine.destroy();
      }
      if (audioEngineInitialized) {
        audioEngine.dispose();
      }
      if (motionEngineInitialized) {
        motionEngine.dispose();
      }
    };
  }, [playerWidth, playerHeight, effectsEngineInitialized, audioEngineInitialized, motionEngineInitialized, onError]);
  
  // ===== SYNC SYSTEM =====
  
  const syncPlayerWithTimeline = useCallback((time: number, source: 'player' | 'timeline') => {
    if (source === 'player') {
      timelineActions.setCurrentTime(time);
      timelineRef.current?.seek?.(time);
    } else {
      playerActions.setCurrentTime(time);
      videoPlayerRef.current?.seek?.(time);
    }
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      playerTime: source === 'player' ? time : prev.playerTime,
      timelineTime: source === 'timeline' ? time : prev.timelineTime,
      syncOffset: Math.abs(prev.playerTime - prev.timelineTime),
      lastSync: Date.now()
    }));
  }, [timelineActions, playerActions]);
  
  // ===== HANDLERS =====
  
  const handlePlayerTimeUpdate = useCallback((time: number) => {
    syncPlayerWithTimeline(time, 'player');
  }, [syncPlayerWithTimeline]);
  
  const handlePlayerPlay = useCallback(() => {
    playerActions.setIsPlaying(true);
    console.log('🎬 Player started playing');
  }, [playerActions]);
  
  const handlePlayerPause = useCallback(() => {
    playerActions.setIsPlaying(false);
    console.log('⏸️ Player paused');
  }, [playerActions]);
  
  const handlePlayerDurationChange = useCallback((duration: number) => {
    playerActions.setDuration(duration);
    console.log('⏱️ Duration updated:', duration);
  }, [playerActions]);
  
  const handleTimelineSeek = useCallback((time: number) => {
    syncPlayerWithTimeline(time, 'timeline');
  }, [syncPlayerWithTimeline]);
  
  const handleTimelineSelectionChange = useCallback((selection: string[]) => {
    console.log('🎯 Timeline selection changed:', selection);
  }, []);
  
  const handleToolSelect = useCallback((tool: EditorTool) => {
    setActiveTool(tool);
    
    // Ativar/desativar ferramentas específicas
    switch (tool) {
      case 'razor':
        toolsActions.setRazorToolActive(true);
        break;
      default:
        toolsActions.setRazorToolActive(false);
        break;
    }
    
    console.log('🛠️ Tool selected:', tool);
  }, [toolsActions]);
  
  const handlePlayPause = useCallback(() => {
    if (playerState.isPlaying) {
      videoPlayerRef.current?.pause();
    } else {
      videoPlayerRef.current?.play();
    }
  }, [playerState.isPlaying]);
  
  const handleStop = useCallback(() => {
    videoPlayerRef.current?.pause();
    videoPlayerRef.current?.seek(0);
    playerActions.setIsPlaying(false);
    playerActions.setCurrentTime(0);
  }, [playerActions]);
  
  const handleSkipBack = useCallback(() => {
    const newTime = Math.max(0, playerState.currentTime - 10);
    syncPlayerWithTimeline(newTime, 'timeline');
  }, [playerState.currentTime, syncPlayerWithTimeline]);
  
  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(playerState.duration, playerState.currentTime + 10);
    syncPlayerWithTimeline(newTime, 'timeline');
  }, [playerState.currentTime, playerState.duration, syncPlayerWithTimeline]);
  
  const handleUndo = useCallback(() => {
    if (commandSystem.canUndo) {
      commandManager.undo();
      console.log('↶ Undo executed');
    }
  }, [commandSystem.canUndo]);
  
  const handleRedo = useCallback(() => {
    if (commandSystem.canRedo) {
      commandManager.redo();
      console.log('↷ Redo executed');
    }
  }, [commandSystem.canRedo]);
  
  const handleSave = useCallback(() => {
    if (onProjectSave) {
      const projectId = `project_${Date.now()}`;
      onProjectSave(projectId);
      console.log('💾 Project saved:', projectId);
    }
  }, [onProjectSave]);
  
  const handleExport = useCallback(() => {
    if (onExportStart) {
      onExportStart();
      console.log('📤 Export started');
    }
  }, [onExportStart]);
  
  const handleVolumeToggle = useCallback(() => {
    setMuted(!muted);
    videoPlayerRef.current?.setVolume?.(muted ? volume : 0);
  }, [muted, volume]);
  
  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);
  
  // ===== DRAG & DROP =====
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length > 0) {
      const file = videoFiles[0];
      const videoData = {
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        id: `video_${Date.now()}`
      };
      
      playerActions.setVideoData(videoData);
      console.log('📹 Video loaded via drag & drop:', file.name);
    }
  }, [playerActions]);
  
  // ===== KEYBOARD SHORTCUTS =====
  
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar shortcuts se estiver digitando
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const isCtrl = e.ctrlKey || e.metaKey;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
          
        case 'r':
        case 'R':
          e.preventDefault();
          handleToolSelect('razor');
          break;
          
        case 'v':
        case 'V':
          e.preventDefault();
          handleToolSelect('select');
          break;
          
        case 't':
        case 'T':
          e.preventDefault();
          handleToolSelect('text');
          break;
          
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          // Deletar itens selecionados
          break;
          
        case 'z':
        case 'Z':
          if (isCtrl && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
          } else if (isCtrl && e.shiftKey) {
            e.preventDefault();
            handleRedo();
          }
          break;
          
        case 'y':
        case 'Y':
          if (isCtrl) {
            e.preventDefault();
            handleRedo();
          }
          break;
          
        case 's':
        case 'S':
          if (isCtrl) {
            e.preventDefault();
            handleSave();
          }
          break;
          
        case 'ArrowLeft':
          e.preventDefault();
          handleSkipBack();
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          handleSkipForward();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboardShortcuts,
    handlePlayPause,
    handleToolSelect,
    handleUndo,
    handleRedo,
    handleSave,
    handleSkipBack,
    handleSkipForward
  ]);
  
  // ===== COMMAND SYSTEM SYNC =====
  
  useEffect(() => {
    const updateCommandState = () => {
      commandSystem.setCanUndo(commandManager.canUndo());
      commandSystem.setCanRedo(commandManager.canRedo());
      commandSystem.setLastCommand(commandManager.getLastCommand()?.constructor.name || null);
    };
    
    // Atualizar estado inicial
    updateCommandState();
    
    // Escutar mudanças no command manager
    const interval = setInterval(updateCommandState, 100);
    return () => clearInterval(interval);
  }, [commandSystem]);
  
  // ===== TIMELINE UPDATES =====
  
  const handleTimelineUpdate = useCallback((updates: { tracks?: any[] }) => {
    if (updates.tracks) {
      const layers = updates.tracks.map((track: any) => ({
        id: track.id,
        type: track.type,
        name: track.name,
        visible: track.visible,
        items: track.items,
        color: track.color || '#3B82F6',
        locked: track.locked
      }));
      timelineActions.setTimelineLayers(layers);
    }
  }, [timelineActions]);
  
  // ===== EFFECTS HANDLERS =====
  
  const handleEffectApply = useCallback((effect: BaseEffect, trackId: string) => {
    if (!effectsEngineInitialized) {
      console.warn('Effects engine not initialized');
      return;
    }
    
    effectsEngine.addEffect(trackId, effect);
    setAppliedEffects(prev => [...prev, effect]);
    
    console.log(`🎨 Applied effect: ${effect.name} to track: ${trackId}`);
  }, [effectsEngineInitialized]);
  
  const handleEffectRemove = useCallback((effectId: string) => {
    effectsEngine.removeEffect(effectId);
    setAppliedEffects(prev => prev.filter(e => e.id !== effectId));
    
    console.log(`🗑️ Removed effect: ${effectId}`);
  }, []);
  
  const handleEffectUpdate = useCallback((effectId: string, parameters: Partial<BaseEffect>) => {
    effectsEngine.updateEffect(effectId, parameters);
    setAppliedEffects(prev => prev.map(e => 
      e.id === effectId ? { ...e, ...parameters } : e
    ));
    
    console.log(`✏️ Updated effect: ${effectId}`);
  }, []);
  
  // ===== TRANSITIONS HANDLERS =====
  
  const handleTransitionApply = useCallback((transition: Transition, fromTrackId: string, toTrackId: string) => {
    if (!effectsEngineInitialized) {
      console.warn('Effects engine not initialized');
      return;
    }
    
    effectsEngine.addTransition(fromTrackId, toTrackId, transition);
    setAppliedTransitions(prev => [...prev, transition]);
    
    console.log(`🔄 Applied transition: ${transition.name} from ${fromTrackId} to ${toTrackId}`);
  }, [effectsEngineInitialized]);
  
  const handleTransitionRemove = useCallback((transitionId: string) => {
    effectsEngine.removeTransition(transitionId);
    setAppliedTransitions(prev => prev.filter(t => t.id !== transitionId));
    
    console.log(`🗑️ Removed transition: ${transitionId}`);
  }, []);
  
  const handleTransitionUpdate = useCallback((transitionId: string, parameters: Partial<Transition>) => {
    setAppliedTransitions(prev => prev.map(t => 
      t.id === transitionId ? { ...t, ...parameters } : t
    ));
    
    console.log(`✏️ Updated transition: ${transitionId}`);
  }, []);
  
  // ===== IMPERATIVE HANDLE =====
  
  useImperativeHandle(ref, () => ({
    play: () => videoPlayerRef.current?.play(),
    pause: () => videoPlayerRef.current?.pause(),
    stop: handleStop,
    seek: (time: number) => syncPlayerWithTimeline(time, 'timeline'),
    addTrack: (track: TimelineTrack) => {
      const newLayer = {
        id: track.id,
        type: track.type,
        name: track.name,
        visible: track.visible,
        items: track.items,
        color: track.color || '#3B82F6',
        locked: track.locked
      };
      const newLayers = [...timelineState.timelineLayers, newLayer];
      timelineActions.setTimelineLayers(newLayers);
    },
    removeTrack: (trackId: string) => {
      const newLayers = timelineState.timelineLayers.filter(t => t.id !== trackId);
      timelineActions.setTimelineLayers(newLayers);
    },
    saveProject: handleSave,
    loadProject: (projectId: string) => {
      if (onProjectLoad) {
        onProjectLoad(projectId);
      }
    },
    exportProject: handleExport,
    setTool: handleToolSelect,
    selectItems: (itemIds: string[]) => {
      console.log('🎯 Selecting items:', itemIds);
    },
    clearSelection: () => {
      console.log('🎯 Clearing selection');
    }
  }), [
    handleStop,
    syncPlayerWithTimeline,
    timelineState.timelineLayers,
    timelineActions,
    handleSave,
    handleExport,
    handleToolSelect,
    onProjectLoad
  ]);
  
  // ===== TOOLBAR TOOLS =====
  
  const toolbarTools = [
    { id: 'select', icon: MousePointer, label: 'Select (V)', shortcut: 'V' },
    { id: 'razor', icon: Scissors, label: 'Razor (R)', shortcut: 'R' },
    { id: 'text', icon: Type, label: 'Text (T)', shortcut: 'T' },
    { id: 'image', icon: Image, label: 'Image', shortcut: 'I' },
    { id: 'zoom', icon: ZoomIn, label: 'Zoom', shortcut: 'Z' },
    { id: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' }
  ] as const;
  
  // ===== TIMELINE STATE CONVERSION =====
  
  const timelineStateForTimeline: TimelineState = {
    tracks: timelineState.timelineLayers.map(layer => ({
      id: layer.id,
      type: layer.type,
      name: layer.name,
      height: 80,
      locked: layer.locked,
      visible: layer.visible,
      items: layer.items as any[],
      color: layer.color
    })),
    currentTime: timelineState.currentTime,
    duration: timelineState.duration,
    zoom: 1,
    scrollX: 0,
    selectedItems: [],
    playhead: {
      time: timelineState.currentTime,
      snapping: snapToGrid
    },
    markers: []
  };
  
  // ===== RENDER =====
  
  return (
    <div
      ref={containerRef}
      className={`video-editor-container ${className}`}
      style={{
        width,
        height,
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* TOOLBAR */}
      {showToolbar && (
        <div
          className="toolbar"
          style={{
            height: TOOLBAR_HEIGHT,
            backgroundColor: '#1a1a1a',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            flexShrink: 0
          }}
        >
          {/* Playback Controls */}
          <div className="playback-controls" style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipBack}
              title="Skip Back (←)"
            >
              <SkipBack size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              title={playerState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playerState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              title="Stop"
            >
              <Square size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipForward}
              title="Skip Forward (→)"
            >
              <SkipForward size={16} />
            </Button>
          </div>
          
          {/* Separator */}
          <div style={{ width: '1px', height: '24px', backgroundColor: '#333' }} />
          
          {/* Editing Tools */}
          <div className="editing-tools" style={{ display: 'flex', gap: '4px' }}>
            {toolbarTools.map(tool => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleToolSelect(tool.id as EditorTool)}
                title={tool.label}
              >
                <tool.icon size={16} />
              </Button>
            ))}
          </div>
          
          {/* Separator */}
          <div style={{ width: '1px', height: '24px', backgroundColor: '#333' }} />
          
          {/* Command Controls */}
          <div className="command-controls" style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!commandSystem.canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!commandSystem.canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} />
            </Button>
          </div>
          
          {/* Separator */}
          <div style={{ width: '1px', height: '24px', backgroundColor: '#333' }} />
          
          {/* Utility Controls */}
          <div className="utility-controls" style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeToggle}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid"
            >
              <Grid size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
              title="Toggle Snap"
            >
              <Magnet size={16} />
            </Button>
          </div>
          
          {/* Separator */}
          <div style={{ width: '1px', height: '24px', backgroundColor: '#333' }} />
          
          {/* Effects & Transitions */}
          <div className="effects-controls" style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant={activePanel === 'effects' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'effects' ? null : 'effects')}
              title="Effects Panel"
              style={{ 
                backgroundColor: activePanel === 'effects' ? '#3b82f6' : 'transparent',
                color: activePanel === 'effects' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>🎨</span>
            </Button>
            
            <Button
              variant={activePanel === 'transitions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'transitions' ? null : 'transitions')}
              title="Transitions Panel"
              style={{ 
                backgroundColor: activePanel === 'transitions' ? '#8b5cf6' : 'transparent',
                color: activePanel === 'transitions' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>🔄</span>
            </Button>
            
            {/* Phase 6 & 7 Panels */}
            <Button
              variant={activePanel === 'audio' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'audio' ? null : 'audio')}
              title="Audio Mixer Panel"
              style={{ 
                backgroundColor: activePanel === 'audio' ? '#10b981' : 'transparent',
                color: activePanel === 'audio' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>🎵</span>
            </Button>
            
            <Button
              variant={activePanel === 'motion' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'motion' ? null : 'motion')}
              title="Motion Graphics Panel"
              style={{ 
                backgroundColor: activePanel === 'motion' ? '#f59e0b' : 'transparent',
                color: activePanel === 'motion' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>🎬</span>
            </Button>
            
            <Button
              variant={activePanel === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'timeline' ? null : 'timeline')}
              title="Advanced Timeline"
              style={{ 
                backgroundColor: activePanel === 'timeline' ? '#ef4444' : 'transparent',
                color: activePanel === 'timeline' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>⏱️</span>
            </Button>
            
            <Button
              variant={activePanel === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'preview' ? null : 'preview')}
              title="Realtime Preview"
              style={{ 
                backgroundColor: activePanel === 'preview' ? '#8b5cf6' : 'transparent',
                color: activePanel === 'preview' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>📺</span>
            </Button>
            
            <Button
              variant={activePanel === 'panels' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'panels' ? null : 'panels')}
              title="Panel Manager"
              style={{ 
                backgroundColor: activePanel === 'panels' ? '#6366f1' : 'transparent',
                color: activePanel === 'panels' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>🪟</span>
            </Button>
            
            {/* Phase 8 - Render & Export */}
            <Button
              variant={activePanel === 'export' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'export' ? null : 'export')}
              title="Export Manager"
              style={{ 
                backgroundColor: activePanel === 'export' ? '#059669' : 'transparent',
                color: activePanel === 'export' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>📤</span>
            </Button>
            
            <Button
              variant={activePanel === 'queue' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'queue' ? null : 'queue')}
              title="Render Queue"
              style={{ 
                backgroundColor: activePanel === 'queue' ? '#7c3aed' : 'transparent',
                color: activePanel === 'queue' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>🔄</span>
            </Button>
            
            <Button
              variant={activePanel === 'render-settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'render-settings' ? null : 'render-settings')}
              title="Render Settings"
              style={{ 
                backgroundColor: activePanel === 'render-settings' ? '#dc2626' : 'transparent',
                color: activePanel === 'render-settings' ? '#ffffff' : '#9ca3af'
              }}
            >
              <span style={{ fontSize: '14px' }}>⚙️</span>
            </Button>
          </div>
          
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          
          {/* Project Controls */}
          <div className="project-controls" style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              title="Save Project (Ctrl+S)"
            >
              <Save size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              title="Export Project"
            >
              <Download size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </Button>
          </div>
        </div>
      )}
      
      {/* MAIN CONTENT */}
      <div
        className="main-content"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}
      >
        {/* VIDEO PLAYER */}
        <div
          className="video-player-container"
          style={{
            width: playerWidth,
            height: playerHeight,
            backgroundColor: '#000',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <VideoPlayer
            ref={videoPlayerRef}
            src={playerState.videoData?.url || ''}
            width={playerWidth}
            height={playerHeight}
            autoplay={false}
            muted={muted}
            controls={false}
            onTimeUpdate={handlePlayerTimeUpdate}
            onPlay={handlePlayerPlay}
            onPause={handlePlayerPause}
            onError={(error) => onError?.(error)}
          />
          
          {/* Drag & Drop Overlay */}
          {dragover && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px',
                zIndex: 1000
              }}
            >
              <Upload size={48} color="#ffffff" />
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Drop video files here
              </div>
            </div>
          )}
        </div>
        
        {/* SIDEBAR */}
        {showSidebar && (
          <div
            className="sidebar"
            style={{
              width: SIDEBAR_WIDTH,
              height: playerHeight,
              backgroundColor: '#1a1a1a',
              borderLeft: '1px solid #333',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Effects Panel */}
            {activePanel === 'effects' && (
              <EffectsPanel
                onEffectApply={handleEffectApply}
                onEffectRemove={handleEffectRemove}
                onEffectUpdate={handleEffectUpdate}
                selectedTrackId={selectedTrackId || undefined}
                appliedEffects={appliedEffects}
                previewMode={true}
                className="flex-1"
              />
            )}
            
            {/* Transitions Panel */}
            {activePanel === 'transitions' && (
              <TransitionsPanel
                onTransitionApply={handleTransitionApply}
                onTransitionRemove={handleTransitionRemove}
                onTransitionUpdate={handleTransitionUpdate}
                appliedTransitions={appliedTransitions}
                previewMode={true}
                className="flex-1"
              />
            )}
            
            {/* Phase 6 & 7 Panels */}
            {activePanel === 'audio' && audioEngineInitialized && (
              <AudioMixerPanel
                tracks={[]}
                onTrackAdd={() => console.log('Add audio track')}
                onTrackRemove={(trackId) => console.log('Remove track:', trackId)}
                onTrackUpdate={(trackId, updates) => console.log('Update track:', trackId, updates)}
                onEffectAdd={(trackId, effect) => console.log('Add effect:', trackId, effect)}
                onEffectRemove={(trackId, effectId) => console.log('Remove effect:', trackId, effectId)}
                className="flex-1"
              />
            )}
            
            {activePanel === 'motion' && motionEngineInitialized && (
              <MotionGraphicsPanel
                layers={[]}
                selectedLayerId={null}
                currentTime={playerState.currentTime}
                duration={playerState.duration}
                onLayerAdd={() => console.log('Add motion layer')}
                onLayerRemove={(layerId) => console.log('Remove layer:', layerId)}
                onLayerSelect={(layerId) => console.log('Select layer:', layerId)}
                onLayerUpdate={(layerId, updates) => console.log('Update layer:', layerId, updates)}
                onKeyframeAdd={(layerId, time) => console.log('Add keyframe:', layerId, time)}
                onKeyframeRemove={(layerId, keyframeId) => console.log('Remove keyframe:', layerId, keyframeId)}
                onKeyframeUpdate={(layerId, keyframeId, updates) => console.log('Update keyframe:', layerId, keyframeId, updates)}
                onTimeChange={(time) => syncPlayerWithTimeline(time, 'timeline')}
                onPlay={() => handlePlayPause()}
                onPause={() => handlePlayPause()}
                onStop={() => handleStop()}
                isPlaying={playerState.isPlaying}
                className="flex-1"
              />
            )}
            
            {activePanel === 'timeline' && (
              <AdvancedTimeline
                duration={playerState.duration}
                currentTime={playerState.currentTime}
                isPlaying={playerState.isPlaying}
                className="flex-1"
              />
            )}
            
            {activePanel === 'preview' && (
              <RealtimePreview
                width={300}
                height={200}
                className="flex-1"
              />
            )}
            
            {activePanel === 'panels' && (
              <PanelManager
                className="flex-1"
              />
            )}
            
            {/* Phase 8 Panels */}
            {activePanel === 'export' && (
              <div className="flex-1 p-4">
                <div className="text-center text-gray-400">
                  <h3 className="text-lg font-semibold mb-2">📤 Export Manager</h3>
                  <p className="text-sm">Sistema de exportação profissional</p>
                  <div className="mt-4 p-4 bg-gray-800 rounded">
                    <div className="text-xs text-gray-500">Fase 8 - Em desenvolvimento</div>
                    <div className="text-xs text-gray-400 mt-2">
                      • Presets profissionais<br/>
                      • Exportação em lote<br/>
                      • Múltiplos formatos<br/>
                      • Progress tracking
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activePanel === 'queue' && (
              <div className="flex-1 p-4">
                <div className="text-center text-gray-400">
                  <h3 className="text-lg font-semibold mb-2">🔄 Render Queue</h3>
                  <p className="text-sm">Fila de renderização profissional</p>
                  <div className="mt-4 p-4 bg-gray-800 rounded">
                    <div className="text-xs text-gray-500">Fase 8 - Em desenvolvimento</div>
                    <div className="text-xs text-gray-400 mt-2">
                      • Gerenciamento de fila<br/>
                      • Prioridades<br/>
                      • Background rendering<br/>
                      • Status tracking
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activePanel === 'render-settings' && (
              <div className="flex-1 p-4">
                <div className="text-center text-gray-400">
                  <h3 className="text-lg font-semibold mb-2">⚙️ Render Settings</h3>
                  <p className="text-sm">Configurações de renderização</p>
                  <div className="mt-4 p-4 bg-gray-800 rounded">
                    <div className="text-xs text-gray-500">Fase 8 - Em desenvolvimento</div>
                    <div className="text-xs text-gray-400 mt-2">
                      • Qualidade e performance<br/>
                      • GPU acceleration<br/>
                      • Memory management<br/>
                      • Optimization presets
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Default Properties Panel */}
            {!activePanel && (
              <div style={{ padding: '16px', overflow: 'auto' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Properties
                  </h3>
                  
                  {playerState.videoData && (
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      <div><strong>File:</strong> {playerState.videoData.name}</div>
                      <div><strong>Size:</strong> {(playerState.videoData.size / 1024 / 1024).toFixed(2)} MB</div>
                      <div><strong>Duration:</strong> {playerState.duration.toFixed(2)}s</div>
                      <div><strong>Current Time:</strong> {playerState.currentTime.toFixed(2)}s</div>
                      <div><strong>Playing:</strong> {playerState.isPlaying ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Effects & Transitions
                  </h3>
                  
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    <div><strong>Applied Effects:</strong> {appliedEffects.length}</div>
                    <div><strong>Applied Transitions:</strong> {appliedTransitions.length}</div>
                    <div><strong>Effects Engine:</strong> {effectsEngineInitialized ? 'Ready' : 'Initializing...'}</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Phase 6 & 7 Engines
                  </h3>
                  
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    <div><strong>Audio Engine:</strong> {audioEngineInitialized ? 'Ready' : 'Initializing...'}</div>
                    <div><strong>Motion Engine:</strong> {motionEngineInitialized ? 'Ready' : 'Initializing...'}</div>
                    <div><strong>Advanced Timeline:</strong> Available</div>
                    <div><strong>Realtime Preview:</strong> Available</div>
                    <div><strong>Panel Manager:</strong> Available</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Tools
                  </h3>
                  
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    <div><strong>Active Tool:</strong> {activeTool}</div>
                    <div><strong>Razor Active:</strong> {toolsState.razorToolActive ? 'Yes' : 'No'}</div>
                    <div><strong>Selected Layer:</strong> {toolsState.selectedLayer || 'None'}</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Timeline
                  </h3>
                  
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    <div><strong>Layers:</strong> {timelineState.timelineLayers.length}</div>
                    <div><strong>Cut Points:</strong> {timelineState.cutPoints.length}</div>
                    <div><strong>Show Grid:</strong> {showGrid ? 'Yes' : 'No'}</div>
                    <div><strong>Snap to Grid:</strong> {snapToGrid ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Commands
                  </h3>
                  
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    <div><strong>Can Undo:</strong> {commandSystem.canUndo ? 'Yes' : 'No'}</div>
                    <div><strong>Can Redo:</strong> {commandSystem.canRedo ? 'Yes' : 'No'}</div>
                    <div><strong>Last Command:</strong> {commandSystem.lastCommand || 'None'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* TIMELINE */}
      {showTimeline && (
        <div
          className="timeline-container"
          style={{
            height: TIMELINE_HEIGHT,
            backgroundColor: '#1a1a1a',
            borderTop: '1px solid #333',
            flexShrink: 0
          }}
        >
          <Timeline
            ref={timelineRef}
            width={timelineWidth}
            height={TIMELINE_HEIGHT}
            timeline={timelineStateForTimeline}
            onSeek={handleTimelineSeek}
            onSelectionChange={handleTimelineSelectionChange}
            onTimelineUpdate={handleTimelineUpdate}
            snapToGrid={snapToGrid}
            allowDrag={true}
            allowResize={true}
            allowSelection={true}
          />
        </div>
      )}
      
      {/* DEBUG OVERLAY */}
      {showDebugOverlay && (
        <div
          className="debug-overlay"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#0f0',
            fontFamily: 'monospace',
            zIndex: 1000
          }}
        >
          <div>Player Time: {debugInfo.playerTime.toFixed(2)}s</div>
          <div>Timeline Time: {debugInfo.timelineTime.toFixed(2)}s</div>
          <div>Sync Offset: {debugInfo.syncOffset.toFixed(2)}s</div>
          <div>Last Sync: {Date.now() - debugInfo.lastSync}ms ago</div>
          <div>Active Tool: {activeTool}</div>
          <div>Commands: U{commandSystem.canUndo ? '✓' : '✗'} R{commandSystem.canRedo ? '✓' : '✗'}</div>
        </div>
      )}
    </div>
  );
});

VideoEditor.displayName = 'VideoEditor';

export default VideoEditor; 