/**
 * 🎬 RENDER TYPES - ClipsForge Pro
 * 
 * Tipos TypeScript para sistema de renderização profissional
 * Comparable a Adobe Media Encoder, DaVinci Resolve Delivery
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

// ===== RENDER ENGINE TYPES =====

export interface RenderEngine {
  id: string;
  name: string;
  version: string;
  capabilities: RenderCapabilities;
  settings: RenderSettings;
  state: RenderState;
  performance: RenderPerformance;
  initialize: (config: RenderConfig) => Promise<void>;
  render: (job: RenderJob) => Promise<RenderResult>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  dispose: () => void;
}

export interface RenderCapabilities {
  maxResolution: {
    width: number;
    height: number;
  };
  supportedFormats: VideoFormat[];
  supportedCodecs: VideoCodec[];
  audioCodecs: AudioCodec[];
  maxBitrate: number;
  maxFrameRate: number;
  hardwareAcceleration: boolean;
  webWorkersSupport: boolean;
  webCodecsSupport: boolean;
  streamingSupport: boolean;
  batchProcessing: boolean;
  backgroundRendering: boolean;
}

export interface RenderSettings {
  quality: 'draft' | 'preview' | 'high' | 'maximum';
  threads: number;
  useGPU: boolean;
  useWebWorkers: boolean;
  cacheEnabled: boolean;
  cacheSize: number; // MB
  memoryLimit: number; // MB
  thermalThrottling: boolean;
  batteryOptimization: boolean;
  priorityLevel: 'low' | 'normal' | 'high' | 'realtime';
}

export interface RenderState {
  status: 'idle' | 'initializing' | 'rendering' | 'paused' | 'completed' | 'error' | 'cancelled';
  currentJob: RenderJob | null;
  queue: RenderJob[];
  progress: number; // 0-100
  timeRemaining: number; // seconds
  renderSpeed: number; // fps
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  gpuUsage: number; // percentage
  temperature: number; // celsius
  errors: RenderError[];
  warnings: RenderWarning[];
}

export interface RenderPerformance {
  averageRenderTime: number; // seconds per frame
  peakMemoryUsage: number; // MB
  averageCPUUsage: number; // percentage
  averageGPUUsage: number; // percentage
  totalFramesRendered: number;
  totalRenderTime: number; // seconds
  cacheHitRate: number; // percentage
  errorRate: number; // percentage
  thermalEvents: number;
  batteryImpact: 'low' | 'medium' | 'high';
}

// ===== RENDER JOB TYPES =====

export interface RenderJob {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'sequence';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  // Source
  source: RenderSource;
  
  // Output
  output: RenderOutput;
  
  // Timeline
  timeline: RenderTimeline;
  
  // Effects
  effects: RenderEffect[];
  
  // Audio
  audio: RenderAudio;
  
  // Metadata
  metadata: RenderMetadata;
  
  // Progress
  progress: RenderProgress;
  
  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Callbacks
  onProgress?: (progress: RenderProgress) => void;
  onComplete?: (result: RenderResult) => void;
  onError?: (error: RenderError) => void;
}

export interface RenderSource {
  type: 'timeline' | 'composition' | 'sequence';
  timeline?: TimelineData;
  composition?: CompositionData;
  sequence?: SequenceData;
  assets: RenderAsset[];
  duration: number;
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
}

export interface RenderOutput {
  format: VideoFormat;
  codec: VideoCodec;
  audioCodec: AudioCodec;
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  bitrate: number;
  audioBitrate: number;
  quality: number; // 0-100
  filename: string;
  destination: 'download' | 'cloud' | 'stream';
  compressionLevel: number; // 0-9
  keyframeInterval: number;
  bFrames: number;
  profile: string;
  level: string;
}

export interface RenderTimeline {
  duration: number;
  frameRate: number;
  startTime: number;
  endTime: number;
  tracks: RenderTrack[];
  markers: RenderMarker[];
  workArea?: {
    start: number;
    end: number;
  };
}

export interface RenderTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  name: string;
  enabled: boolean;
  muted: boolean;
  opacity: number;
  blendMode: BlendMode;
  clips: RenderClip[];
  effects: RenderEffect[];
  keyframes: RenderKeyframe[];
}

export interface RenderClip {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  asset: RenderAsset;
  startTime: number;
  endTime: number;
  duration: number;
  trimIn: number;
  trimOut: number;
  speed: number;
  reversed: boolean;
  enabled: boolean;
  opacity: number;
  transform: RenderTransform;
  effects: RenderEffect[];
  keyframes: RenderKeyframe[];
}

export interface RenderAsset {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'shape';
  url: string;
  file?: File;
  blob?: Blob;
  duration?: number;
  frameRate?: number;
  resolution?: {
    width: number;
    height: number;
  };
  size: number;
  format: string;
  codec?: string;
  metadata: Record<string, any>;
}

export interface RenderTransform {
  position: {
    x: number;
    y: number;
    z?: number;
  };
  scale: {
    x: number;
    y: number;
    z?: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  anchor: {
    x: number;
    y: number;
  };
  opacity: number;
  skew?: {
    x: number;
    y: number;
  };
}

export interface RenderEffect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
  keyframes: RenderKeyframe[];
  blendMode?: BlendMode;
  opacity?: number;
  maskPath?: string;
}

export interface RenderKeyframe {
  id: string;
  time: number;
  value: any;
  interpolation: 'linear' | 'bezier' | 'hold' | 'ease-in' | 'ease-out' | 'ease-in-out';
  bezierHandles?: {
    inTangent: { x: number; y: number };
    outTangent: { x: number; y: number };
  };
}

export interface RenderAudio {
  enabled: boolean;
  volume: number;
  pan: number;
  muted: boolean;
  tracks: RenderAudioTrack[];
  masterEffects: RenderEffect[];
  mixdown: 'stereo' | 'mono' | '5.1' | '7.1';
  sampleRate: number;
  bitDepth: number;
}

export interface RenderAudioTrack {
  id: string;
  name: string;
  type: 'music' | 'dialogue' | 'sfx' | 'ambient';
  enabled: boolean;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  clips: RenderClip[];
  effects: RenderEffect[];
  routing: AudioRouting;
}

export interface AudioRouting {
  input: string;
  output: string;
  sends: AudioSend[];
}

export interface AudioSend {
  destination: string;
  level: number;
  enabled: boolean;
  preFader: boolean;
}

export interface RenderMarker {
  id: string;
  time: number;
  name: string;
  type: 'chapter' | 'cue' | 'note' | 'sync';
  color: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface RenderMetadata {
  title?: string;
  description?: string;
  author?: string;
  copyright?: string;
  keywords?: string[];
  thumbnail?: string;
  chapters?: RenderChapter[];
  customFields?: Record<string, any>;
}

export interface RenderChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
}

export interface RenderProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'uploading';
  percentage: number; // 0-100
  currentFrame: number;
  totalFrames: number;
  framesPerSecond: number;
  timeElapsed: number; // seconds
  timeRemaining: number; // seconds
  bytesProcessed: number;
  bytesTotal: number;
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  gpuUsage: number; // percentage
  temperature: number; // celsius
  message: string;
  warnings: RenderWarning[];
}

// ===== RENDER RESULT TYPES =====

export interface RenderResult {
  id: string;
  jobId: string;
  status: 'success' | 'error' | 'cancelled';
  output?: RenderOutputFile;
  error?: RenderError;
  statistics: RenderStatistics;
  metadata: RenderResultMetadata;
  createdAt: Date;
  completedAt: Date;
}

export interface RenderOutputFile {
  filename: string;
  url: string;
  blob?: Blob;
  size: number;
  format: VideoFormat;
  codec: VideoCodec;
  resolution: {
    width: number;
    height: number;
  };
  duration: number;
  frameRate: number;
  bitrate: number;
  audioBitrate: number;
  quality: number;
  thumbnail?: string;
  metadata: Record<string, any>;
}

export interface RenderStatistics {
  totalFrames: number;
  renderTime: number; // seconds
  averageFPS: number;
  peakMemoryUsage: number; // MB
  averageCPUUsage: number; // percentage
  averageGPUUsage: number; // percentage
  cacheHitRate: number; // percentage
  compressionRatio: number;
  qualityScore: number; // 0-100
  errorCount: number;
  warningCount: number;
}

export interface RenderResultMetadata {
  renderEngine: string;
  renderVersion: string;
  renderSettings: RenderSettings;
  systemInfo: SystemInfo;
  performance: RenderPerformance;
  timestamp: Date;
}

// ===== ERROR AND WARNING TYPES =====

export interface RenderError {
  id: string;
  type: 'fatal' | 'recoverable' | 'warning';
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  phase: string;
  frame?: number;
  asset?: string;
  stackTrace?: string;
  suggestions?: string[];
}

export interface RenderWarning {
  id: string;
  type: 'performance' | 'quality' | 'compatibility' | 'resource';
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  phase: string;
  frame?: number;
  asset?: string;
  severity: 'low' | 'medium' | 'high';
  suggestions?: string[];
}

// ===== SYSTEM AND CONFIGURATION TYPES =====

export interface RenderConfig {
  engine: {
    threads: number;
    useGPU: boolean;
    useWebWorkers: boolean;
    memoryLimit: number; // MB
    cacheSize: number; // MB
    quality: 'draft' | 'preview' | 'high' | 'maximum';
  };
  output: {
    defaultFormat: VideoFormat;
    defaultCodec: VideoCodec;
    defaultQuality: number;
    defaultBitrate: number;
  };
  performance: {
    thermalThrottling: boolean;
    batteryOptimization: boolean;
    backgroundRendering: boolean;
    priorityBoost: boolean;
  };
  debugging: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    profileMemory: boolean;
    profileCPU: boolean;
  };
  settings?: RenderSettings;
}

export interface SystemInfo {
  platform: string;
  userAgent: string;
  cores: number;
  memory: number; // MB
  gpu: string;
  webWorkersSupport: boolean;
  webCodecsSupport: boolean;
  hardwareAcceleration: boolean;
  maxTextureSize: number;
  webGLVersion: string;
}

// ===== FORMAT AND CODEC TYPES =====

export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'flv' | 'wmv' | 'ogv';

export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1' | 'prores' | 'dnxhd' | 'cineform';

export type AudioCodec = 'aac' | 'mp3' | 'ogg' | 'flac' | 'wav' | 'opus' | 'ac3' | 'dts';

export type BlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light'
  | 'color-dodge' | 'color-burn' | 'darken' | 'lighten' | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity' | 'add' | 'subtract' | 'divide';

// ===== RENDER QUEUE TYPES =====

export interface RenderQueue {
  id: string;
  name: string;
  jobs: RenderJob[];
  status: 'idle' | 'processing' | 'paused' | 'completed';
  currentJob: RenderJob | null;
  progress: QueueProgress;
  settings: QueueSettings;
  statistics: QueueStatistics;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueProgress {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  currentJobProgress: number;
  overallProgress: number;
  estimatedTimeRemaining: number; // seconds
}

export interface QueueSettings {
  maxConcurrentJobs: number;
  pauseOnError: boolean;
  retryFailedJobs: boolean;
  maxRetries: number;
  priorityOrder: 'fifo' | 'lifo' | 'priority' | 'shortest-first';
  autoStart: boolean;
  notifications: boolean;
}

export interface QueueStatistics {
  totalJobsProcessed: number;
  totalRenderTime: number; // seconds
  averageJobTime: number; // seconds
  successRate: number; // percentage
  errorRate: number; // percentage
  throughput: number; // jobs per hour
  peakMemoryUsage: number; // MB
  totalDataProcessed: number; // MB
}

// ===== RENDER CACHE TYPES =====

export interface RenderCache {
  id: string;
  type: 'frame' | 'effect' | 'audio' | 'preview';
  key: string;
  data: ArrayBuffer | Blob;
  metadata: CacheMetadata;
  size: number; // bytes
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  priority: number;
}

export interface CacheMetadata {
  resolution?: { width: number; height: number };
  frameRate?: number;
  duration?: number;
  format?: string;
  codec?: string;
  quality?: number;
  checksum?: string;
  dependencies?: string[];
}

export interface CachePolicy {
  maxSize: number; // MB
  maxAge: number; // seconds
  evictionStrategy: 'lru' | 'lfu' | 'fifo' | 'priority';
  compressionEnabled: boolean;
  persistToDisk: boolean;
  preloadStrategy: 'none' | 'adjacent' | 'predictive';
}

// ===== TIMELINE DATA TYPES =====

export interface TimelineData {
  id: string;
  name: string;
  duration: number;
  frameRate: number;
  resolution: { width: number; height: number };
  tracks: RenderTrack[];
  markers: RenderMarker[];
  workArea?: { start: number; end: number };
  metadata: Record<string, any>;
}

export interface CompositionData {
  id: string;
  name: string;
  layers: RenderLayer[];
  duration: number;
  frameRate: number;
  resolution: { width: number; height: number };
  backgroundColor: string;
  metadata: Record<string, any>;
}

export interface SequenceData {
  id: string;
  name: string;
  clips: RenderClip[];
  duration: number;
  frameRate: number;
  resolution: { width: number; height: number };
  metadata: Record<string, any>;
}

export interface RenderLayer {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'adjustment' | 'shape' | 'text';
  enabled: boolean;
  startTime: number;
  duration: number;
  transform: RenderTransform;
  effects: RenderEffect[];
  masks: RenderMask[];
  blendMode: BlendMode;
  opacity: number;
  parent?: string;
  children?: string[];
}

export interface RenderMask {
  id: string;
  name: string;
  type: 'path' | 'shape' | 'alpha' | 'luma';
  enabled: boolean;
  inverted: boolean;
  feather: number;
  opacity: number;
  path?: string;
  keyframes: RenderKeyframe[];
}

// ===== EXPORT TYPES =====

export interface RenderPreset {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'social' | 'broadcast' | 'cinema' | 'mobile' | 'custom';
  platform?: 'youtube' | 'instagram' | 'tiktok' | 'vimeo' | 'facebook' | 'twitter';
  output: RenderOutput;
  thumbnail?: string;
  popular: boolean;
  recommended: boolean;
  tags: string[];
}

export interface BatchRenderJob {
  id: string;
  name: string;
  source: RenderSource;
  outputs: RenderOutput[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: BatchProgress;
  createdAt: Date;
  completedAt?: Date;
}

export interface BatchProgress {
  totalOutputs: number;
  completedOutputs: number;
  failedOutputs: number;
  currentOutput: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
}

// ===== UTILITY TYPES =====

export interface RenderEvent {
  type: string;
  timestamp: Date;
  data: any;
  source: string;
}

export interface RenderCallback {
  onProgress?: (progress: RenderProgress) => void;
  onComplete?: (result: RenderResult) => void;
  onError?: (error: RenderError) => void;
  onWarning?: (warning: RenderWarning) => void;
  onStatusChange?: (status: string) => void;
}

export interface RenderOptions {
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  background?: boolean;
  cache?: boolean;
  preview?: boolean;
  quality?: 'draft' | 'preview' | 'high' | 'maximum';
  callbacks?: RenderCallback;
  metadata?: Record<string, any>;
}