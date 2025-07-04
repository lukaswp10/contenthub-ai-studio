/**
 * 🎬 TIPOS TYPESCRIPT PARA EDITOR DE VÍDEO PROFISSIONAL - ClipsForge Pro
 * 
 * Tipos base para timeline, player, segmentos e funcionalidades avançadas
 * 
 * @version 1.0.0
 * @author ClipsForge Team
 */

// ===== PHASE 1.2: BASE TYPES =====

export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  selected: boolean;
  file?: File;
  url?: string;
  name?: string;
  type?: 'video' | 'audio';
  trimIn?: number;
  trimOut?: number;
  speed?: number;
  volume?: number;
  muted?: boolean;
  effects?: string[];
  transitions?: string[];
}

export interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  selected: boolean;
  file?: File;
  url?: string;
  name?: string;
  type: 'audio';
  volume: number;
  muted: boolean;
  fadeIn?: number;
  fadeOut?: number;
  pitch?: number;
  speed?: number;
  effects?: AudioEffect[];
  waveform?: number[];
  channels: number;
  sampleRate: number;
  bitrate?: number;
}

export interface AudioEffect {
  id: string;
  type: 'eq' | 'compressor' | 'reverb' | 'delay' | 'distortion' | 'chorus' | 'flanger';
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
  wet?: number; // Mix level (0-1)
  dry?: number; // Original signal level (0-1)
}

export interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  style: SubtitleStyle;
  animation?: {
    type: 'fade' | 'slide' | 'scale' | 'bounce';
    duration: number;
    easing: string;
  };
  wordTimestamps?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface SubtitleStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  outline?: {
    color: string;
    width: number;
  };
  alignment: 'left' | 'center' | 'right';
  textAlign?: 'left' | 'center' | 'right' | 'start' | 'end';
  textShadow?: {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  borderRadius?: number;
  opacity?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
}

export interface Overlay {
  id: string;
  type: 'image' | 'text' | 'shape' | 'video';
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  src?: string; // For images/videos
  text?: string; // For text overlays
  style?: OverlayStyle;
  animation?: OverlayAnimation;
  interactive?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  locked?: boolean;
}

export interface OverlayStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  shadow?: {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
  };
  filter?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturate?: number;
    hue?: number;
    sepia?: number;
    grayscale?: number;
    invert?: number;
  };
}

export interface OverlayAnimation {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'elastic';
  direction?: 'in' | 'out' | 'in-out';
  duration: number;
  delay?: number;
  easing: string;
  repeat?: number;
  yoyo?: boolean;
}

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle' | 'overlay' | 'effect' | 'transition';
  name: string;
  items: (VideoSegment | Subtitle | Overlay)[];
  visible: boolean;
  locked: boolean;
  muted?: boolean; // For audio tracks
  solo?: boolean; // For audio tracks
  height?: number;
  color?: string;
  effects?: TrackEffect[];
  volume?: number; // For audio tracks
  pan?: number; // For audio tracks (-1 to 1)
}

export interface TrackEffect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
  startTime?: number;
  endTime?: number;
}

// ===== TIMELINE =====

export interface TimelineState {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  zoom: number; // 1 = normal, 2 = 2x zoom, 0.5 = zoom out
  scrollX: number;
  selectedItems: string[];
  playhead: {
    time: number;
    snapping: boolean;
  };
  inPoint?: number;
  outPoint?: number;
  markers: TimelineMarker[];
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

// ===== PLAYER =====

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  quality: VideoQuality;
  fullscreen: boolean;
  loading: boolean;
  buffered: TimeRange[];
}

export interface VideoQuality {
  width: number;
  height: number;
  bitrate?: number;
  fps?: number;
}

export interface TimeRange {
  start: number;
  end: number;
}

// ===== FERRAMENTAS =====

export type EditorTool = 
  | 'select'      // Ferramenta de seleção
  | 'razor'       // Cortar clips
  | 'trim'        // Ajustar início/fim
  | 'text'        // Adicionar texto
  | 'image'       // Adicionar imagem
  | 'zoom'        // Zoom na timeline
  | 'hand'        // Mover timeline

export interface ToolState {
  activeTool: EditorTool;
  toolOptions: Record<string, any>;
}

// ===== COMMAND SYSTEM =====

export interface EditorCommand {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  execute: () => void;
  undo: () => void;
  canMerge?: (other: EditorCommand) => boolean;
  merge?: (other: EditorCommand) => EditorCommand;
}

export interface CommandHistory {
  commands: EditorCommand[];
  currentIndex: number;
  maxHistorySize: number;
  canUndo: boolean;
  canRedo: boolean;
}

// ===== EDITING OPERATIONS =====

export interface CutOperation {
  trackId: string;
  itemId: string;
  cutTime: number;
  beforeItem: VideoSegment;
  afterItem: VideoSegment;
}

export interface TrimOperation {
  trackId: string;
  itemId: string;
  trimType: 'start' | 'end';
  originalTime: number;
  newTime: number;
  rippleEdit?: boolean;
}

export interface SplitOperation {
  trackId: string;
  itemId: string;
  splitTime: number;
  leftItem: VideoSegment;
  rightItem: VideoSegment;
}

export interface MoveOperation {
  trackId: string;
  itemId: string;
  fromTime: number;
  toTime: number;
  fromTrackId?: string;
  toTrackId?: string;
  rippleEdit?: boolean;
}

export interface DeleteOperation {
  trackId: string;
  itemId: string;
  deletedItem: VideoSegment;
  rippleEdit?: boolean;
}

// ===== SNAPPING SYSTEM =====

export interface SnapPoint {
  time: number;
  type: 'item-start' | 'item-end' | 'playhead' | 'marker' | 'grid';
  trackId?: string;
  itemId?: string;
  priority: number;
}

export interface SnapSettings {
  enabled: boolean;
  snapToItems: boolean;
  snapToPlayhead: boolean;
  snapToMarkers: boolean;
  snapToGrid: boolean;
  snapTolerance: number; // pixels
}

// ===== RIPPLE EDIT =====

export interface RippleEditSettings {
  enabled: boolean;
  affectAllTracks: boolean;
  affectedTracks: string[];
  preserveSync: boolean;
}

// ===== MAGNETIC TIMELINE =====

export interface MagneticTimelineSettings {
  enabled: boolean;
  magneticStrength: number; // 0-1
  attractionDistance: number; // pixels
  autoAlign: boolean;
  preventOverlaps: boolean;
}

// ===== EXPORTAÇÃO =====

export interface ExportSettings {
  format: 'mp4' | 'webm' | 'mov';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  bitrate?: number;
  codec: 'h264' | 'h265' | 'vp8' | 'vp9';
  audioCodec: 'aac' | 'mp3' | 'opus';
  includeSubtitles: boolean;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startTime: number;
  endTime?: number;
  settings: ExportSettings;
  outputUrl?: string;
  error?: string;
}

// ===== PROJETO =====

export interface VideoProject {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  duration: number;
  
  // Configurações do projeto
  settings: ProjectSettings;
  
  // Dados da timeline
  timeline: TimelineState;
  
  // Assets utilizados
  assets: ProjectAsset[];
  
  // Histórico de comandos
  history: CommandHistory;
}

export interface ProjectSettings {
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  sampleRate: number; // Para áudio
  autoSave: boolean;
  snapToGrid: boolean;
  gridSize: number; // em segundos
}

export interface ProjectAsset {
  id: string;
  type: 'video' | 'audio' | 'image' | 'font';
  name: string;
  url: string;
  duration?: number; // Para vídeo/áudio
  size: number; // em bytes
  format: string;
  uploadedAt: number;
}

// ===== EVENTOS =====

export interface TimelineEvent {
  type: 'seek' | 'select' | 'add' | 'remove' | 'update' | 'play' | 'pause' | 'zoom';
  data: any;
  timestamp: number;
}

export interface PlayerEvent {
  type: 'play' | 'pause' | 'seek' | 'ended' | 'loadstart' | 'canplay' | 'error';
  data: any;
  timestamp: number;
}

// ===== INTERACTJS TYPES (Custom) =====

export interface InteractEvent {
  target: HTMLElement;
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  deltaRect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface DragEvent extends InteractEvent {
  dx: number;
  dy: number;
}

export interface ResizeEvent extends InteractEvent {
  edges: {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
  };
}

// ===== UTILS =====

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

// ===== KEYBOARD SHORTCUTS =====

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string;
  description: string;
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: ' ', action: 'playPause', description: 'Play/Pause' },
  { key: 'r', action: 'razorTool', description: 'Razor Tool' },
  { key: 'v', action: 'selectTool', description: 'Selection Tool' },
  { key: 'Delete', action: 'deleteSelected', description: 'Delete Selected' },
  { key: 'z', ctrlKey: true, action: 'undo', description: 'Undo' },
  { key: 'z', ctrlKey: true, shiftKey: true, action: 'redo', description: 'Redo' },
  { key: 'j', action: 'rewind', description: 'Rewind' },
  { key: 'k', action: 'playPause', description: 'Play/Pause' },
  { key: 'l', action: 'fastForward', description: 'Fast Forward' },
  { key: 'i', action: 'setInPoint', description: 'Set In Point' },
  { key: 'o', action: 'setOutPoint', description: 'Set Out Point' },
  { key: 'm', action: 'addMarker', description: 'Add Marker' },
]; 