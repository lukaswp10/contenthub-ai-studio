/**
 * 🎬 VIDEO EDITOR STORE - ClipsForge Pro
 * 
 * Store principal do editor de vídeo usando Zustand
 * Implementa FASE 2.3 conforme especificação
 * 
 * @version 2.3.0 - FASE 2
 * @author ClipsForge Team
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { 
  VideoSegment, 
  Subtitle, 
  Overlay,
  TimelineTrack,
  VideoPlayerState,
  EditorTool,
  ToolState,
  CommandHistory,
  ProjectSettings,
  TimelineMarker
} from '../types/video-editor';

// ===== PHASE 2.3: VIDEO EDITOR STORE INTERFACE =====

interface VideoEditorStore {
  // ===== Estado do vídeo =====
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  playbackRate: number;
  
  // ===== Tracks e elementos =====
  tracks: TimelineTrack[];
  selectedItems: string[];
  subtitles: Subtitle[];
  videoData: {
    file?: File;
    url: string;
    name: string;
    size: number;
    id: string;
    duration?: number;
  } | null;
  
  // ===== Timeline state =====
  zoom: number;
  scrollX: number;
  inPoint?: number;
  outPoint?: number;
  markers: TimelineMarker[];
  snapToGrid: boolean;
  gridSize: number;
  
  // ===== Editor tools =====
  activeTool: EditorTool;
  toolState: ToolState;
  
  // ===== Command system =====
  commandHistory: CommandHistory;
  
  // ===== Project settings =====
  projectSettings: ProjectSettings;
  
  // ===== Ações principais =====
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  
  // ===== Ações de tracks =====
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  reorderTracks: (trackIds: string[]) => void;
  
  // ===== Ações de itens =====
  addItem: (trackId: string, item: VideoSegment | Subtitle | Overlay) => void;
  removeItem: (trackId: string, itemId: string) => void;
  updateItem: (trackId: string, itemId: string, updates: any) => void;
  moveItem: (itemId: string, fromTrackId: string, toTrackId: string, newTime: number) => void;
  
  // ===== Ações de seleção =====
  selectItems: (itemIds: string[]) => void;
  addToSelection: (itemIds: string[]) => void;
  removeFromSelection: (itemIds: string[]) => void;
  clearSelection: () => void;
  
  // ===== Ações de legendas =====
  addSubtitle: (subtitle: Subtitle) => void;
  updateSubtitle: (id: string, updates: Partial<Subtitle>) => void;
  removeSubtitle: (id: string) => void;
  
  // ===== Ações de overlays =====
  addOverlay: (overlay: Overlay) => void;
  updateOverlay: (id: string, updates: Partial<Overlay>) => void;
  removeOverlay: (id: string) => void;
  
  // ===== Ações de corte =====
  addCut: (time: number) => void;
  removeCut: (time: number) => void;
  getCuts: () => number[];
  
  // ===== Ações de timeline =====
  setZoom: (zoom: number) => void;
  setScrollX: (scrollX: number) => void;
  setInPoint: (time?: number) => void;
  setOutPoint: (time?: number) => void;
  addMarker: (time: number, label: string) => void;
  removeMarker: (markerId: string) => void;
  
  // ===== Ações de ferramentas =====
  setActiveTool: (tool: EditorTool) => void;
  setToolState: (state: Partial<ToolState>) => void;
  
  // ===== Ações de projeto =====
  setVideoData: (data: VideoEditorStore['videoData']) => void;
  loadProject: (projectData: any) => void;
  saveProject: () => any;
  resetProject: () => void;
  
  // ===== Ações de comando =====
  executeCommand: (command: any) => void;
  undo: () => void;
  redo: () => void;
}

// ===== ESTADO INICIAL =====

const initialState = {
  // Video state
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  volume: 1,
  muted: false,
  playbackRate: 1,
  
  // Tracks
  tracks: [],
  selectedItems: [],
  subtitles: [],
  videoData: null,
  
  // Timeline
  zoom: 1,
  scrollX: 0,
  inPoint: undefined,
  outPoint: undefined,
  markers: [],
  snapToGrid: true,
  gridSize: 1, // 1 second
  
  // Tools
  activeTool: 'select' as EditorTool,
  toolState: {
    activeTool: 'select' as EditorTool,
    toolOptions: {}
  },
  
  // Commands
  commandHistory: {
    commands: [],
    currentIndex: -1,
    maxHistorySize: 50,
    canUndo: false,
    canRedo: false
  },
  
  // Project
  projectSettings: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    sampleRate: 44100,
    autoSave: true,
    snapToGrid: true,
    gridSize: 1
  }
};

// ===== STORE IMPLEMENTATION =====

export const useVideoEditorStore = create<VideoEditorStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      // ===== VIDEO ACTIONS =====
      
      setCurrentTime: (time: number) => set(
        { currentTime: Math.max(0, Math.min(time, get().duration)) },
        false,
        'setCurrentTime'
      ),
      
      setDuration: (duration: number) => set(
        { duration: Math.max(0, duration) },
        false,
        'setDuration'
      ),
      
      setIsPlaying: (playing: boolean) => set(
        { isPlaying: playing },
        false,
        'setIsPlaying'
      ),
      
      setVolume: (volume: number) => set(
        { volume: Math.max(0, Math.min(1, volume)) },
        false,
        'setVolume'
      ),
      
      setMuted: (muted: boolean) => set(
        { muted },
        false,
        'setMuted'
      ),
      
      setPlaybackRate: (rate: number) => set(
        { playbackRate: Math.max(0.25, Math.min(4, rate)) },
        false,
        'setPlaybackRate'
      ),
      
      // ===== TRACK ACTIONS =====
      
      addTrack: (track: TimelineTrack) => set(
        (state) => ({ tracks: [...state.tracks, track] }),
        false,
        'addTrack'
      ),
      
      removeTrack: (trackId: string) => set(
        (state) => ({
          tracks: state.tracks.filter(track => track.id !== trackId),
          selectedItems: state.selectedItems.filter(itemId => {
            // Remove selected items from deleted track
            const track = state.tracks.find(t => t.id === trackId);
            return !track?.items.some(item => (item as any).id === itemId);
          })
        }),
        false,
        'removeTrack'
      ),
      
      updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => set(
        (state) => ({
          tracks: state.tracks.map(track =>
            track.id === trackId ? { ...track, ...updates } : track
          )
        }),
        false,
        'updateTrack'
      ),
      
      reorderTracks: (trackIds: string[]) => set(
        (state) => {
          const trackMap = new Map(state.tracks.map(track => [track.id, track]));
          return {
            tracks: trackIds.map(id => trackMap.get(id)).filter(Boolean) as TimelineTrack[]
          };
        },
        false,
        'reorderTracks'
      ),
      
      // ===== ITEM ACTIONS =====
      
      addItem: (trackId: string, item: VideoSegment | Subtitle | Overlay) => set(
        (state) => ({
          tracks: state.tracks.map(track =>
            track.id === trackId
              ? { ...track, items: [...track.items, item] }
              : track
          )
        }),
        false,
        'addItem'
      ),
      
      removeItem: (trackId: string, itemId: string) => set(
        (state) => ({
          tracks: state.tracks.map(track =>
            track.id === trackId
              ? { ...track, items: track.items.filter(item => (item as any).id !== itemId) }
              : track
          ),
          selectedItems: state.selectedItems.filter(id => id !== itemId)
        }),
        false,
        'removeItem'
      ),
      
      updateItem: (trackId: string, itemId: string, updates: any) => set(
        (state) => ({
          tracks: state.tracks.map(track =>
            track.id === trackId
              ? {
                  ...track,
                  items: track.items.map(item =>
                    (item as any).id === itemId ? { ...item, ...updates } : item
                  )
                }
              : track
          )
        }),
        false,
        'updateItem'
      ),
      
      moveItem: (itemId: string, fromTrackId: string, toTrackId: string, newTime: number) => set(
        (state) => {
          const fromTrack = state.tracks.find(t => t.id === fromTrackId);
          const item = fromTrack?.items.find(i => (i as any).id === itemId);
          
          if (!item) return state;
          
          const updatedItem = { ...item, startTime: newTime };
          
          return {
            tracks: state.tracks.map(track => {
              if (track.id === fromTrackId) {
                return {
                  ...track,
                  items: track.items.filter(i => (i as any).id !== itemId)
                };
              }
              if (track.id === toTrackId) {
                return {
                  ...track,
                  items: [...track.items, updatedItem]
                };
              }
              return track;
            })
          };
        },
        false,
        'moveItem'
      ),
      
      // ===== SELECTION ACTIONS =====
      
      selectItems: (itemIds: string[]) => set(
        { selectedItems: itemIds },
        false,
        'selectItems'
      ),
      
      addToSelection: (itemIds: string[]) => set(
        (state) => ({
          selectedItems: [...new Set([...state.selectedItems, ...itemIds])]
        }),
        false,
        'addToSelection'
      ),
      
      removeFromSelection: (itemIds: string[]) => set(
        (state) => ({
          selectedItems: state.selectedItems.filter(id => !itemIds.includes(id))
        }),
        false,
        'removeFromSelection'
      ),
      
      clearSelection: () => set(
        { selectedItems: [] },
        false,
        'clearSelection'
      ),
      
      // ===== SUBTITLE ACTIONS =====
      
      addSubtitle: (subtitle: Subtitle) => {
        const subtitleTrack = get().tracks.find(t => t.type === 'subtitle');
        if (subtitleTrack) {
          get().addItem(subtitleTrack.id, subtitle);
        } else {
          // Create subtitle track if doesn't exist
          const newTrack: TimelineTrack = {
            id: `subtitle-track-${Date.now()}`,
            type: 'subtitle',
            name: 'Subtitles',
            items: [subtitle],
            visible: true,
            locked: false,
            color: '#FFD700'
          };
          get().addTrack(newTrack);
        }
      },
      
      updateSubtitle: (id: string, updates: Partial<Subtitle>) => {
        const subtitleTrack = get().tracks.find(t => t.type === 'subtitle');
        if (subtitleTrack) {
          get().updateItem(subtitleTrack.id, id, updates);
        }
      },
      
      removeSubtitle: (id: string) => {
        const subtitleTrack = get().tracks.find(t => t.type === 'subtitle');
        if (subtitleTrack) {
          get().removeItem(subtitleTrack.id, id);
        }
      },
      
      // ===== OVERLAY ACTIONS =====
      
      addOverlay: (overlay: Overlay) => {
        const overlayTrack = get().tracks.find(t => t.type === 'overlay');
        if (overlayTrack) {
          get().addItem(overlayTrack.id, overlay);
        } else {
          // Create overlay track if doesn't exist
          const newTrack: TimelineTrack = {
            id: `overlay-track-${Date.now()}`,
            type: 'overlay',
            name: 'Overlays',
            items: [overlay],
            visible: true,
            locked: false,
            color: '#FF6B6B'
          };
          get().addTrack(newTrack);
        }
      },
      
      updateOverlay: (id: string, updates: Partial<Overlay>) => {
        const overlayTrack = get().tracks.find(t => t.type === 'overlay');
        if (overlayTrack) {
          get().updateItem(overlayTrack.id, id, updates);
        }
      },
      
      removeOverlay: (id: string) => {
        const overlayTrack = get().tracks.find(t => t.type === 'overlay');
        if (overlayTrack) {
          get().removeItem(overlayTrack.id, id);
        }
      },
      
      // ===== CUT ACTIONS =====
      
      addCut: (time: number) => {
        // Add cut marker
        const cutMarker: TimelineMarker = {
          id: `cut-${Date.now()}`,
          time,
          label: `Cut ${Math.floor(time)}s`,
          color: '#FF0000'
        };
        
        set(
          (state) => ({
            markers: [...state.markers, cutMarker].sort((a, b) => a.time - b.time)
          }),
          false,
          'addCut'
        );
      },
      
      removeCut: (time: number) => set(
        (state) => ({
          markers: state.markers.filter(marker => 
            Math.abs(marker.time - time) > 0.1 || !marker.label.startsWith('Cut')
          )
        }),
        false,
        'removeCut'
      ),
      
      getCuts: () => {
        return get().markers
          .filter(marker => marker.label.startsWith('Cut'))
          .map(marker => marker.time)
          .sort((a, b) => a - b);
      },
      
      // ===== TIMELINE ACTIONS =====
      
      setZoom: (zoom: number) => set(
        { zoom: Math.max(0.1, Math.min(10, zoom)) },
        false,
        'setZoom'
      ),
      
      setScrollX: (scrollX: number) => set(
        { scrollX: Math.max(0, scrollX) },
        false,
        'setScrollX'
      ),
      
      setInPoint: (time?: number) => set(
        { inPoint: time },
        false,
        'setInPoint'
      ),
      
      setOutPoint: (time?: number) => set(
        { outPoint: time },
        false,
        'setOutPoint'
      ),
      
      addMarker: (time: number, label: string) => {
        const marker: TimelineMarker = {
          id: `marker-${Date.now()}`,
          time,
          label,
          color: '#4A90E2'
        };
        
        set(
          (state) => ({
            markers: [...state.markers, marker].sort((a, b) => a.time - b.time)
          }),
          false,
          'addMarker'
        );
      },
      
      removeMarker: (markerId: string) => set(
        (state) => ({
          markers: state.markers.filter(marker => marker.id !== markerId)
        }),
        false,
        'removeMarker'
      ),
      
      // ===== TOOL ACTIONS =====
      
      setActiveTool: (tool: EditorTool) => set(
        (state) => ({
          activeTool: tool,
          toolState: { ...state.toolState, activeTool: tool }
        }),
        false,
        'setActiveTool'
      ),
      
      setToolState: (state: Partial<ToolState>) => set(
        (currentState) => ({
          toolState: { ...currentState.toolState, ...state }
        }),
        false,
        'setToolState'
      ),
      
      // ===== PROJECT ACTIONS =====
      
      setVideoData: (data: VideoEditorStore['videoData']) => set(
        { videoData: data },
        false,
        'setVideoData'
      ),
      
      loadProject: (projectData: any) => set(
        { ...projectData },
        false,
        'loadProject'
      ),
      
      saveProject: () => {
        const state = get();
        return {
          currentTime: state.currentTime,
          duration: state.duration,
          tracks: state.tracks,
          markers: state.markers,
          projectSettings: state.projectSettings,
          videoData: state.videoData
        };
      },
      
      resetProject: () => set(
        initialState,
        false,
        'resetProject'
      ),
      
      // ===== COMMAND ACTIONS =====
      
      executeCommand: (command: any) => {
        // Execute command
        command.execute();
        
        set(
          (state) => {
            const newCommands = [
              ...state.commandHistory.commands.slice(0, state.commandHistory.currentIndex + 1),
              command
            ];
            
            // Limit history size
            if (newCommands.length > state.commandHistory.maxHistorySize) {
              newCommands.shift();
            }
            
            const newIndex = newCommands.length - 1;
            
            return {
              commandHistory: {
                ...state.commandHistory,
                commands: newCommands,
                currentIndex: newIndex,
                canUndo: newIndex >= 0,
                canRedo: false
              }
            };
          },
          false,
          'executeCommand'
        );
      },
      
      undo: () => {
        const state = get();
        if (state.commandHistory.canUndo) {
          const command = state.commandHistory.commands[state.commandHistory.currentIndex];
          command.undo();
          
          set(
            (state) => ({
              commandHistory: {
                ...state.commandHistory,
                currentIndex: state.commandHistory.currentIndex - 1,
                canUndo: state.commandHistory.currentIndex - 1 >= 0,
                canRedo: true
              }
            }),
            false,
            'undo'
          );
        }
      },
      
      redo: () => {
        const state = get();
        if (state.commandHistory.canRedo) {
          const command = state.commandHistory.commands[state.commandHistory.currentIndex + 1];
          command.execute();
          
          set(
            (state) => ({
              commandHistory: {
                ...state.commandHistory,
                currentIndex: state.commandHistory.currentIndex + 1,
                canUndo: true,
                canRedo: state.commandHistory.currentIndex + 1 < state.commandHistory.commands.length - 1
              }
            }),
            false,
            'redo'
          );
        }
      }
    })),
    {
      name: 'video-editor-store',
      version: 1
    }
  )
);

// ===== SELECTOR HOOKS =====

// Player state selectors
export const usePlayerState = () => useVideoEditorStore((state) => ({
  currentTime: state.currentTime,
  duration: state.duration,
  isPlaying: state.isPlaying,
  volume: state.volume,
  muted: state.muted,
  playbackRate: state.playbackRate,
  videoData: state.videoData
}));

export const usePlayerActions = () => useVideoEditorStore((state) => ({
  setCurrentTime: state.setCurrentTime,
  setDuration: state.setDuration,
  setIsPlaying: state.setIsPlaying,
  setVolume: state.setVolume,
  setMuted: state.setMuted,
  setPlaybackRate: state.setPlaybackRate,
  setVideoData: state.setVideoData
}));

// Timeline state selectors
export const useTimelineState = () => useVideoEditorStore((state) => ({
  tracks: state.tracks,
  selectedItems: state.selectedItems,
  zoom: state.zoom,
  scrollX: state.scrollX,
  inPoint: state.inPoint,
  outPoint: state.outPoint,
  markers: state.markers,
  snapToGrid: state.snapToGrid,
  gridSize: state.gridSize
}));

export const useTimelineActions = () => useVideoEditorStore((state) => ({
  addTrack: state.addTrack,
  removeTrack: state.removeTrack,
  updateTrack: state.updateTrack,
  reorderTracks: state.reorderTracks,
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateItem: state.updateItem,
  moveItem: state.moveItem,
  selectItems: state.selectItems,
  addToSelection: state.addToSelection,
  removeFromSelection: state.removeFromSelection,
  clearSelection: state.clearSelection,
  setZoom: state.setZoom,
  setScrollX: state.setScrollX,
  setInPoint: state.setInPoint,
  setOutPoint: state.setOutPoint,
  addMarker: state.addMarker,
  removeMarker: state.removeMarker
}));

// Editing tools selectors
export const useEditingTools = () => useVideoEditorStore((state) => ({
  addSubtitle: state.addSubtitle,
  updateSubtitle: state.updateSubtitle,
  removeSubtitle: state.removeSubtitle,
  addOverlay: state.addOverlay,
  updateOverlay: state.updateOverlay,
  removeOverlay: state.removeOverlay,
  addCut: state.addCut,
  removeCut: state.removeCut,
  getCuts: state.getCuts
}));

// Tools state selectors
export const useToolsState = () => useVideoEditorStore((state) => ({
  activeTool: state.activeTool,
  toolState: state.toolState
}));

export const useToolsActions = () => useVideoEditorStore((state) => ({
  setActiveTool: state.setActiveTool,
  setToolState: state.setToolState
}));

// Command system selectors
export const useCommandSystem = () => useVideoEditorStore((state) => ({
  commandHistory: state.commandHistory,
  canUndo: state.commandHistory.canUndo,
  canRedo: state.commandHistory.canRedo,
  executeCommand: state.executeCommand,
  undo: state.undo,
  redo: state.redo
}));

// Project selectors
export const useProjectState = () => useVideoEditorStore((state) => ({
  projectSettings: state.projectSettings,
  videoData: state.videoData
}));

export const useProjectActions = () => useVideoEditorStore((state) => ({
  loadProject: state.loadProject,
  saveProject: state.saveProject,
  resetProject: state.resetProject
}));

// Navigation helpers
export const useNavigation = () => useVideoEditorStore((state) => ({
  currentTime: state.currentTime,
  duration: state.duration,
  inPoint: state.inPoint,
  outPoint: state.outPoint,
  markers: state.markers,
  setCurrentTime: state.setCurrentTime,
  setInPoint: state.setInPoint,
  setOutPoint: state.setOutPoint,
  addMarker: state.addMarker
}));

export default useVideoEditorStore; 