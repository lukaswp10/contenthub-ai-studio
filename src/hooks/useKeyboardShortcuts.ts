/**
 * ⌨️ KEYBOARD SHORTCUTS HOOK - ClipsForge Pro
 * 
 * Hook para atalhos de teclado profissionais
 * Implementa FASE 8.1 conforme especificação
 * 
 * @version 8.1.0 - FASE 8
 * @author ClipsForge Team
 */

import { useEffect, useCallback, useRef } from 'react';
import { useVideoEditorStore } from '../stores/videoEditorStore';
import { EditorTool, KeyboardShortcut } from '../types/video-editor';

// ===== TYPES =====

interface KeyboardShortcutsConfig {
  enabled?: boolean;
  preventDefault?: boolean;
  ignoreInputs?: boolean;
  customShortcuts?: KeyboardShortcut[];
}

interface ShortcutHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onPlayPause?: () => void;
  onSeek?: (time: number) => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onFullscreen?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

// ===== DEFAULT SHORTCUTS =====

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Playback Controls
  {
    key: ' ',
    action: 'play-pause',
    description: 'Play/Pause video'
  },
  {
    key: 'j',
    action: 'rewind',
    description: 'Rewind (slower playback)'
  },
  {
    key: 'k',
    action: 'play-pause',
    description: 'Play/Pause (alternative)'
  },
  {
    key: 'l',
    action: 'fast-forward',
    description: 'Fast forward (faster playback)'
  },
  {
    key: 'ArrowLeft',
    action: 'step-backward',
    description: 'Step backward one frame'
  },
  {
    key: 'ArrowRight',
    action: 'step-forward',
    description: 'Step forward one frame'
  },
  {
    key: 'ArrowLeft',
    shiftKey: true,
    action: 'jump-backward',
    description: 'Jump backward 10 seconds'
  },
  {
    key: 'ArrowRight',
    shiftKey: true,
    action: 'jump-forward',
    description: 'Jump forward 10 seconds'
  },
  {
    key: 'Home',
    action: 'go-to-start',
    description: 'Go to beginning'
  },
  {
    key: 'End',
    action: 'go-to-end',
    description: 'Go to end'
  },
  
  // Tools
  {
    key: 'v',
    action: 'select-tool',
    description: 'Selection tool'
  },
  {
    key: 'r',
    action: 'razor-tool',
    description: 'Razor tool (cut)'
  },
  {
    key: 't',
    action: 'text-tool',
    description: 'Text tool'
  },
  {
    key: 'h',
    action: 'hand-tool',
    description: 'Hand tool (pan)'
  },
  {
    key: 'z',
    action: 'zoom-tool',
    description: 'Zoom tool'
  },
  
  // Editing
  {
    key: 'c',
    ctrlKey: true,
    action: 'copy',
    description: 'Copy selected items'
  },
  {
    key: 'x',
    ctrlKey: true,
    action: 'cut',
    description: 'Cut selected items'
  },
  {
    key: 'v',
    ctrlKey: true,
    action: 'paste',
    description: 'Paste items'
  },
  {
    key: 'Delete',
    action: 'delete',
    description: 'Delete selected items'
  },
  {
    key: 'Backspace',
    action: 'delete',
    description: 'Delete selected items (alternative)'
  },
  {
    key: 'a',
    ctrlKey: true,
    action: 'select-all',
    description: 'Select all items'
  },
  {
    key: 'd',
    ctrlKey: true,
    action: 'deselect',
    description: 'Deselect all'
  },
  {
    key: 'z',
    ctrlKey: true,
    action: 'undo',
    description: 'Undo last action'
  },
  {
    key: 'z',
    ctrlKey: true,
    shiftKey: true,
    action: 'redo',
    description: 'Redo last action'
  },
  {
    key: 'y',
    ctrlKey: true,
    action: 'redo',
    description: 'Redo last action (alternative)'
  },
  
  // In/Out Points
  {
    key: 'i',
    action: 'set-in-point',
    description: 'Set in point'
  },
  {
    key: 'o',
    action: 'set-out-point',
    description: 'Set out point'
  },
  {
    key: 'i',
    shiftKey: true,
    action: 'go-to-in-point',
    description: 'Go to in point'
  },
  {
    key: 'o',
    shiftKey: true,
    action: 'go-to-out-point',
    description: 'Go to out point'
  },
  
  // Zoom and Navigation
  {
    key: '=',
    ctrlKey: true,
    action: 'zoom-in',
    description: 'Zoom in timeline'
  },
  {
    key: '-',
    ctrlKey: true,
    action: 'zoom-out',
    description: 'Zoom out timeline'
  },
  {
    key: '0',
    ctrlKey: true,
    action: 'zoom-fit',
    description: 'Fit timeline to window'
  },
  {
    key: 'f',
    action: 'fullscreen',
    description: 'Toggle fullscreen'
  },
  
  // File Operations
  {
    key: 's',
    ctrlKey: true,
    action: 'save',
    description: 'Save project'
  },
  {
    key: 'o',
    ctrlKey: true,
    action: 'open',
    description: 'Open project'
  },
  {
    key: 'n',
    ctrlKey: true,
    action: 'new',
    description: 'New project'
  },
  {
    key: 'e',
    ctrlKey: true,
    action: 'export',
    description: 'Export video'
  },
  {
    key: 'i',
    ctrlKey: true,
    action: 'import',
    description: 'Import media'
  },
  
  // Markers
  {
    key: 'm',
    action: 'add-marker',
    description: 'Add marker at current time'
  },
  {
    key: 'm',
    shiftKey: true,
    action: 'next-marker',
    description: 'Go to next marker'
  },
  {
    key: 'm',
    ctrlKey: true,
    action: 'prev-marker',
    description: 'Go to previous marker'
  },
  
  // Timeline
  {
    key: 'ArrowUp',
    action: 'select-track-up',
    description: 'Select track above'
  },
  {
    key: 'ArrowDown',
    action: 'select-track-down',
    description: 'Select track below'
  },
  {
    key: 'Tab',
    action: 'next-edit',
    description: 'Go to next edit point'
  },
  {
    key: 'Tab',
    shiftKey: true,
    action: 'prev-edit',
    description: 'Go to previous edit point'
  }
];

// ===== HOOK =====

export const useKeyboardShortcuts = (
  handlers: ShortcutHandlers = {},
  config: KeyboardShortcutsConfig = {}
) => {
  const {
    enabled = true,
    preventDefault = true,
    ignoreInputs = true,
    customShortcuts = []
  } = config;
  
  // ===== STORE =====
  
  const {
    currentTime,
    duration,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    activeTool,
    setActiveTool,
    selectedItems,
    selectItems,
    clearSelection,
    addMarker,
    markers,
    zoom,
    setZoom,
    inPoint,
    outPoint,
    setInPoint,
    setOutPoint,
    undo,
    redo,
    commandHistory
  } = useVideoEditorStore();
  
  // ===== REFS =====
  
  const handlersRef = useRef(handlers);
  const playbackRateRef = useRef(1);
  
  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);
  
  // ===== HELPER FUNCTIONS =====
  
  const isInputElement = useCallback((element: Element): boolean => {
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.getAttribute('contenteditable') === 'true'
    );
  }, []);
  
  const matchesShortcut = useCallback((
    event: KeyboardEvent,
    shortcut: KeyboardShortcut
  ): boolean => {
    const key = event.key === ' ' ? ' ' : event.key;
    
    return (
      key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!event.ctrlKey === !!shortcut.ctrlKey &&
      !!event.shiftKey === !!shortcut.shiftKey &&
      !!event.altKey === !!shortcut.altKey
    );
  }, []);
  
  const seekRelative = useCallback((delta: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + delta));
    setCurrentTime(newTime);
    if (handlersRef.current.onSeek) {
      handlersRef.current.onSeek(newTime);
    }
  }, [currentTime, duration, setCurrentTime]);
  
  const seekToPercent = useCallback((percent: number) => {
    const newTime = (percent / 100) * duration;
    setCurrentTime(newTime);
    if (handlersRef.current.onSeek) {
      handlersRef.current.onSeek(newTime);
    }
  }, [duration, setCurrentTime]);
  
  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    console.log(`🎬 Playback rate: ${rate}x`);
  }, []);
  
  // ===== ACTION HANDLERS =====
  
  const actionHandlers: Record<string, () => void> = {
    // Playback
    'play-pause': () => {
      if (isPlaying) {
        setIsPlaying(false);
        handlersRef.current.onPause?.();
      } else {
        setIsPlaying(true);
        handlersRef.current.onPlay?.();
      }
      handlersRef.current.onPlayPause?.();
    },
    
    'rewind': () => {
      setPlaybackRate(Math.max(0.25, playbackRateRef.current * 0.5));
    },
    
    'fast-forward': () => {
      setPlaybackRate(Math.min(4, playbackRateRef.current * 2));
    },
    
    'step-backward': () => {
      seekRelative(-1/30); // One frame at 30fps
    },
    
    'step-forward': () => {
      seekRelative(1/30); // One frame at 30fps
    },
    
    'jump-backward': () => {
      seekRelative(-10);
    },
    
    'jump-forward': () => {
      seekRelative(10);
    },
    
    'go-to-start': () => {
      setCurrentTime(0);
      handlersRef.current.onSeek?.(0);
    },
    
    'go-to-end': () => {
      setCurrentTime(duration);
      handlersRef.current.onSeek?.(duration);
    },
    
    // Tools
    'select-tool': () => {
      setActiveTool('select');
    },
    
    'razor-tool': () => {
      setActiveTool(activeTool === 'razor' ? 'select' : 'razor');
    },
    
    'text-tool': () => {
      setActiveTool('text');
    },
    
    'hand-tool': () => {
      setActiveTool('hand');
    },
    
    'zoom-tool': () => {
      setActiveTool('zoom');
    },
    
    // Editing
    'copy': () => {
      handlersRef.current.onCopy?.();
    },
    
    'cut': () => {
      handlersRef.current.onCut?.();
    },
    
    'paste': () => {
      handlersRef.current.onPaste?.();
    },
    
    'delete': () => {
      handlersRef.current.onDelete?.();
    },
    
    'select-all': () => {
      handlersRef.current.onSelectAll?.();
    },
    
    'deselect': () => {
      clearSelection();
      handlersRef.current.onDeselect?.();
    },
    
    'undo': () => {
      if (commandHistory.canUndo) {
        undo();
        handlersRef.current.onUndo?.();
      }
    },
    
    'redo': () => {
      if (commandHistory.canRedo) {
        redo();
        handlersRef.current.onRedo?.();
      }
    },
    
    // In/Out Points
    'set-in-point': () => {
      setInPoint(currentTime);
    },
    
    'set-out-point': () => {
      setOutPoint(currentTime);
    },
    
    'go-to-in-point': () => {
      if (inPoint !== undefined) {
        setCurrentTime(inPoint);
        handlersRef.current.onSeek?.(inPoint);
      }
    },
    
    'go-to-out-point': () => {
      if (outPoint !== undefined) {
        setCurrentTime(outPoint);
        handlersRef.current.onSeek?.(outPoint);
      }
    },
    
    // Zoom
    'zoom-in': () => {
      const newZoom = Math.min(10, zoom * 1.5);
      setZoom(newZoom);
      handlersRef.current.onZoomIn?.();
    },
    
    'zoom-out': () => {
      const newZoom = Math.max(0.1, zoom / 1.5);
      setZoom(newZoom);
      handlersRef.current.onZoomOut?.();
    },
    
    'zoom-fit': () => {
      setZoom(1);
      handlersRef.current.onZoomFit?.();
    },
    
    'fullscreen': () => {
      handlersRef.current.onFullscreen?.();
    },
    
    // File Operations
    'save': () => {
      handlersRef.current.onSave?.();
    },
    
    'open': () => {
      // Handled by parent component
    },
    
    'new': () => {
      // Handled by parent component
    },
    
    'export': () => {
      handlersRef.current.onExport?.();
    },
    
    'import': () => {
      handlersRef.current.onImport?.();
    },
    
    // Markers
    'add-marker': () => {
      addMarker(currentTime, `Marker ${markers.length + 1}`);
    },
    
    'next-marker': () => {
      const nextMarker = markers.find(m => m.time > currentTime);
      if (nextMarker) {
        setCurrentTime(nextMarker.time);
        handlersRef.current.onSeek?.(nextMarker.time);
      }
    },
    
    'prev-marker': () => {
      const prevMarkers = markers.filter(m => m.time < currentTime);
      const prevMarker = prevMarkers[prevMarkers.length - 1];
      if (prevMarker) {
        setCurrentTime(prevMarker.time);
        handlersRef.current.onSeek?.(prevMarker.time);
      }
    },
    
    // Timeline Navigation
    'select-track-up': () => {
      // Implementation depends on timeline component
    },
    
    'select-track-down': () => {
      // Implementation depends on timeline component
    },
    
    'next-edit': () => {
      // Find next edit point and seek to it
    },
    
    'prev-edit': () => {
      // Find previous edit point and seek to it
    }
  };
  
  // ===== KEYBOARD EVENT HANDLER =====
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Skip if focused on input elements
    if (ignoreInputs && event.target && isInputElement(event.target as Element)) {
      return;
    }
    
    // Combine default and custom shortcuts
    const allShortcuts = [...DEFAULT_SHORTCUTS, ...customShortcuts];
    
    // Find matching shortcut
    const matchedShortcut = allShortcuts.find(shortcut =>
      matchesShortcut(event, shortcut)
    );
    
    if (matchedShortcut) {
      if (preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      const handler = actionHandlers[matchedShortcut.action];
      if (handler) {
        handler();
        console.log(`⌨️ Shortcut: ${matchedShortcut.description}`);
      } else {
        console.warn(`⚠️ No handler for action: ${matchedShortcut.action}`);
      }
    }
  }, [
    enabled,
    ignoreInputs,
    preventDefault,
    customShortcuts,
    isInputElement,
    matchesShortcut,
    actionHandlers
  ]);
  
  // ===== EFFECTS =====
  
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
  
  // ===== RETURN API =====
  
  return {
    shortcuts: [...DEFAULT_SHORTCUTS, ...customShortcuts],
    isEnabled: enabled,
    getShortcutByAction: (action: string) => 
      [...DEFAULT_SHORTCUTS, ...customShortcuts].find(s => s.action === action),
    getShortcutsByCategory: (category: string) =>
      [...DEFAULT_SHORTCUTS, ...customShortcuts].filter(s => 
        s.description.toLowerCase().includes(category.toLowerCase())
      ),
    formatShortcut: (shortcut: KeyboardShortcut) => {
      const parts = [];
      if (shortcut.ctrlKey) parts.push('Ctrl');
      if (shortcut.shiftKey) parts.push('Shift');
      if (shortcut.altKey) parts.push('Alt');
      parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
      return parts.join(' + ');
    }
  };
};

export default useKeyboardShortcuts; 