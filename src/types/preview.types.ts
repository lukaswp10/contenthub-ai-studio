/**
 * 🎥 REAL-TIME PREVIEW TYPES - ClipsForge Pro
 * 
 * Sistema completo de tipos para preview em tempo real
 * Suporte para GPU acceleration, audio/video sync, scrubbing
 * 
 * @version 7.0.0 - FASE 7
 * @author ClipsForge Team
 */

// ===== PREVIEW CORE TYPES =====

export interface PreviewEngine {
  id: string;
  name: string;
  version: string;
  capabilities: PreviewCapabilities;
  settings: PreviewSettings;
  state: PreviewState;
  performance: PreviewPerformance;
  cache: PreviewCache;
  pipeline: RenderPipeline;
  audioEngine: AudioPreviewEngine;
  videoEngine: VideoPreviewEngine;
  syncEngine: SyncEngine;
}

export interface PreviewCapabilities {
  gpuAcceleration: boolean;
  hardwareDecoding: boolean;
  multiThreading: boolean;
  realTimeEffects: boolean;
  realTimeTransitions: boolean;
  audioScrubbing: boolean;
  videoScrubbing: boolean;
  backgroundRendering: boolean;
  proxyPlayback: boolean;
  multiFormat: boolean;
  colorManagement: boolean;
  hdrSupport: boolean;
  maxResolution: string;
  maxFrameRate: number;
  maxAudioChannels: number;
  supportedFormats: string[];
  supportedCodecs: string[];
}

export interface PreviewSettings {
  quality: PreviewQuality;
  resolution: PreviewResolution;
  frameRate: number;
  audioSampleRate: number;
  audioBitDepth: number;
  colorSpace: string;
  gamma: number;
  lumaRange: string;
  gpuAcceleration: boolean;
  hardwareDecoding: boolean;
  multiThreading: boolean;
  backgroundRendering: boolean;
  cacheSize: number;
  prerollFrames: number;
  scrubSensitivity: number;
  audioScrubbing: boolean;
  videoScrubbing: boolean;
  dropFrameCompensation: boolean;
  realTimeEffects: boolean;
  realTimeTransitions: boolean;
  optimizeForSpeed: boolean;
  optimizeForQuality: boolean;
  autoQuality: boolean;
  adaptiveQuality: boolean;
}

export type PreviewQuality = 'draft' | 'preview' | 'full' | 'auto';
export type PreviewResolution = '1/4' | '1/2' | '3/4' | 'full' | 'auto';

export interface PreviewState {
  isInitialized: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  isRendering: boolean;
  isScrubbing: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  inPoint: number;
  outPoint: number;
  workArea: boolean;
  quality: PreviewQuality;
  resolution: PreviewResolution;
  frameRate: number;
  droppedFrames: number;
  bufferedRanges: TimeRange[];
  seekableRanges: TimeRange[];
  error?: PreviewError;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface PreviewError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
}

// ===== PERFORMANCE MONITORING =====

export interface PreviewPerformance {
  fps: number;
  targetFps: number;
  droppedFrames: number;
  skippedFrames: number;
  renderTime: number;
  decodeTime: number;
  displayTime: number;
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
  cacheHitRate: number;
  bufferHealth: number;
  latency: number;
  jitter: number;
  stability: number;
  efficiency: number;
  thermalState: ThermalState;
  powerUsage: number;
  batteryImpact: BatteryImpact;
}

export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';
export type BatteryImpact = 'low' | 'medium' | 'high' | 'critical';

// ===== CACHE SYSTEM =====

export interface PreviewCache {
  enabled: boolean;
  size: number;
  maxSize: number;
  used: number;
  entries: number;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  compressionRatio: number;
  types: CacheType[];
  policies: CachePolicy[];
  statistics: CacheStatistics;
}

export type CacheType = 'frame' | 'audio' | 'effect' | 'transition' | 'thumbnail' | 'waveform' | 'metadata';

export interface CachePolicy {
  type: CacheType;
  strategy: CacheStrategy;
  maxSize: number;
  ttl: number;
  priority: number;
  compression: boolean;
  encryption: boolean;
}

export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'random' | 'custom';

export interface CacheStatistics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  evictions: number;
  compressions: number;
  decompressions: number;
  diskReads: number;
  diskWrites: number;
  networkRequests: number;
  averageResponseTime: number;
}

// ===== RENDER PIPELINE =====

export interface RenderPipeline {
  stages: RenderStage[];
  currentStage: string;
  progress: number;
  queue: RenderTask[];
  workers: RenderWorker[];
  resources: RenderResources;
  optimization: RenderOptimization;
  profiling: RenderProfiling;
}

export interface RenderStage {
  id: string;
  name: string;
  type: RenderStageType;
  enabled: boolean;
  priority: number;
  dependencies: string[];
  inputs: RenderInput[];
  outputs: RenderOutput[];
  parameters: Record<string, any>;
  performance: StagePerformance;
}

export type RenderStageType = 'decode' | 'effect' | 'transition' | 'composite' | 'encode' | 'display';

export interface RenderInput {
  id: string;
  type: string;
  format: string;
  resolution: string;
  frameRate: number;
  colorSpace: string;
  source: string;
  metadata: Record<string, any>;
}

export interface RenderOutput {
  id: string;
  type: string;
  format: string;
  resolution: string;
  frameRate: number;
  colorSpace: string;
  destination: string;
  metadata: Record<string, any>;
}

export interface StagePerformance {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage: number;
  throughput: number;
  efficiency: number;
  errors: number;
  warnings: number;
}

export interface RenderTask {
  id: string;
  type: string;
  priority: number;
  timeRange: TimeRange;
  clips: string[];
  effects: string[];
  transitions: string[];
  status: TaskStatus;
  progress: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  retry: number;
  maxRetries: number;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RenderWorker {
  id: string;
  type: WorkerType;
  status: WorkerStatus;
  capabilities: WorkerCapabilities;
  currentTask?: string;
  performance: WorkerPerformance;
  resources: WorkerResources;
}

export type WorkerType = 'cpu' | 'gpu' | 'hybrid' | 'dedicated';
export type WorkerStatus = 'idle' | 'busy' | 'error' | 'offline';

export interface WorkerCapabilities {
  maxResolution: string;
  maxFrameRate: number;
  supportedFormats: string[];
  supportedEffects: string[];
  gpuAcceleration: boolean;
  hardwareDecoding: boolean;
  multiThreading: boolean;
}

export interface WorkerPerformance {
  tasksCompleted: number;
  tasksFailed: number;
  averageExecutionTime: number;
  throughput: number;
  efficiency: number;
  uptime: number;
  errors: number;
  warnings: number;
}

export interface WorkerResources {
  cpuCores: number;
  gpuMemory: number;
  systemMemory: number;
  diskSpace: number;
  networkBandwidth: number;
}

export interface RenderResources {
  totalCpuCores: number;
  availableCpuCores: number;
  totalGpuMemory: number;
  availableGpuMemory: number;
  totalSystemMemory: number;
  availableSystemMemory: number;
  totalDiskSpace: number;
  availableDiskSpace: number;
  networkBandwidth: number;
  thermalState: ThermalState;
  powerState: PowerState;
}

export type PowerState = 'ac' | 'battery' | 'low-power' | 'critical';

export interface RenderOptimization {
  enabled: boolean;
  strategy: OptimizationStrategy;
  parameters: OptimizationParameters;
  results: OptimizationResults;
}

export type OptimizationStrategy = 'speed' | 'quality' | 'balanced' | 'power' | 'adaptive';

export interface OptimizationParameters {
  maxCpuUsage: number;
  maxGpuUsage: number;
  maxMemoryUsage: number;
  maxPowerUsage: number;
  targetFrameRate: number;
  qualityThreshold: number;
  latencyThreshold: number;
  adaptiveThresholds: boolean;
}

export interface OptimizationResults {
  performanceGain: number;
  qualityLoss: number;
  powerSavings: number;
  memoryReduction: number;
  recommendedSettings: Record<string, any>;
}

export interface RenderProfiling {
  enabled: boolean;
  detailed: boolean;
  sessions: ProfilingSession[];
  currentSession?: string;
  statistics: ProfilingStatistics;
}

export interface ProfilingSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  samples: ProfilingSample[];
  summary: ProfilingSummary;
}

export interface ProfilingSample {
  timestamp: number;
  stage: string;
  operation: string;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage: number;
  metadata: Record<string, any>;
}

export interface ProfilingSummary {
  totalSamples: number;
  totalDuration: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface ProfilingStatistics {
  totalSessions: number;
  totalSamples: number;
  averagePerformance: number;
  performanceTrends: PerformanceTrend[];
  commonBottlenecks: string[];
  optimizationOpportunities: string[];
}

export interface PerformanceTrend {
  metric: string;
  values: number[];
  timestamps: number[];
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
}

// ===== AUDIO PREVIEW ENGINE =====

export interface AudioPreviewEngine {
  context: AudioContext;
  destination: AudioDestinationNode;
  masterGain: GainNode;
  analyzer: AnalyserNode;
  compressor: DynamicsCompressorNode;
  limiter: DynamicsCompressorNode;
  tracks: AudioTrack[];
  effects: AudioEffect[];
  routing: AudioRouting;
  monitoring: AudioMonitoring;
  synchronization: AudioSynchronization;
}

export interface AudioTrack {
  id: string;
  name: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
  pan: StereoPannerNode;
  effects: AudioNode[];
  muted: boolean;
  solo: boolean;
  armed: boolean;
  monitoring: boolean;
  level: number;
  peak: number;
  rms: number;
}

export interface AudioEffect {
  id: string;
  name: string;
  type: string;
  node: AudioNode;
  enabled: boolean;
  parameters: Record<string, any>;
  automation: AudioAutomation[];
}

export interface AudioAutomation {
  parameter: string;
  points: AudioAutomationPoint[];
  enabled: boolean;
}

export interface AudioAutomationPoint {
  time: number;
  value: number;
  curve: string;
}

export interface AudioRouting {
  inputs: AudioInput[];
  outputs: AudioOutput[];
  buses: AudioBus[];
  sends: AudioSend[];
  returns: AudioReturn[];
}

export interface AudioInput {
  id: string;
  name: string;
  type: string;
  channels: number;
  sampleRate: number;
  bitDepth: number;
  level: number;
  active: boolean;
}

export interface AudioOutput {
  id: string;
  name: string;
  type: string;
  channels: number;
  sampleRate: number;
  bitDepth: number;
  level: number;
  active: boolean;
}

export interface AudioBus {
  id: string;
  name: string;
  channels: number;
  level: number;
  muted: boolean;
  effects: AudioEffect[];
}

export interface AudioSend {
  id: string;
  source: string;
  destination: string;
  level: number;
  enabled: boolean;
}

export interface AudioReturn {
  id: string;
  source: string;
  destination: string;
  level: number;
  enabled: boolean;
}

export interface AudioMonitoring {
  enabled: boolean;
  level: number;
  peak: number;
  rms: number;
  spectrum: Float32Array;
  waveform: Float32Array;
  phase: number;
  correlation: number;
  loudness: LoudnessMetrics;
}

export interface LoudnessMetrics {
  lufs: number;
  lkfs: number;
  peak: number;
  truePeak: number;
  range: number;
  shortTerm: number;
  momentary: number;
}

export interface AudioSynchronization {
  enabled: boolean;
  offset: number;
  drift: number;
  correction: number;
  quality: SyncQuality;
  method: SyncMethod;
  reference: SyncReference;
}

export type SyncQuality = 'low' | 'medium' | 'high' | 'perfect';
export type SyncMethod = 'timecode' | 'wordclock' | 'genlock' | 'network' | 'software';
export type SyncReference = 'internal' | 'external' | 'video' | 'audio' | 'network';

// ===== VIDEO PREVIEW ENGINE =====

export interface VideoPreviewEngine {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | WebGLRenderingContext;
  framebuffer: WebGLFramebuffer;
  textures: WebGLTexture[];
  shaders: WebGLShader[];
  programs: WebGLProgram[];
  buffers: WebGLBuffer[];
  layers: VideoLayer[];
  effects: VideoEffect[];
  transitions: VideoTransition[];
  colorManagement: ColorManagement;
  rendering: VideoRendering;
}

export interface VideoLayer {
  id: string;
  name: string;
  texture: WebGLTexture;
  transform: VideoTransform;
  blendMode: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  effects: VideoEffect[];
}

export interface VideoTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  anchor: { x: number; y: number; z: number };
  skew: { x: number; y: number };
  perspective: number;
  matrix: Float32Array;
}

export interface VideoEffect {
  id: string;
  name: string;
  type: string;
  shader: WebGLProgram;
  uniforms: Record<string, any>;
  enabled: boolean;
  parameters: Record<string, any>;
  keyframes: VideoKeyframe[];
}

export interface VideoKeyframe {
  time: number;
  value: any;
  interpolation: string;
  easing: string;
}

export interface VideoTransition {
  id: string;
  name: string;
  type: string;
  shader: WebGLProgram;
  uniforms: Record<string, any>;
  duration: number;
  progress: number;
  parameters: Record<string, any>;
}

export interface ColorManagement {
  enabled: boolean;
  inputColorSpace: string;
  outputColorSpace: string;
  gamma: number;
  lumaRange: string;
  chromaSubsampling: string;
  bitDepth: number;
  hdr: boolean;
  lut: WebGLTexture;
  profiles: ColorProfile[];
}

export interface ColorProfile {
  id: string;
  name: string;
  type: string;
  primaries: ColorPrimaries;
  transferFunction: string;
  whitePoint: { x: number; y: number };
  gamma: number;
  matrix: Float32Array;
}

export interface ColorPrimaries {
  red: { x: number; y: number };
  green: { x: number; y: number };
  blue: { x: number; y: number };
}

export interface VideoRendering {
  mode: RenderMode;
  quality: RenderQuality;
  antiAliasing: boolean;
  multiSampling: number;
  anisotropicFiltering: boolean;
  textureFiltering: string;
  mipmapping: boolean;
  compression: boolean;
  optimization: RenderOptimization;
}

export type RenderMode = 'software' | 'hardware' | 'hybrid';
export type RenderQuality = 'draft' | 'preview' | 'full' | 'ultra';

// ===== SYNC ENGINE =====

export interface SyncEngine {
  enabled: boolean;
  audioOffset: number;
  videoOffset: number;
  drift: number;
  correction: number;
  quality: SyncQuality;
  method: SyncMethod;
  reference: SyncReference;
  monitoring: SyncMonitoring;
  calibration: SyncCalibration;
}

export interface SyncMonitoring {
  enabled: boolean;
  audioLatency: number;
  videoLatency: number;
  totalLatency: number;
  jitter: number;
  stability: number;
  quality: number;
  errors: number;
  warnings: number;
}

export interface SyncCalibration {
  enabled: boolean;
  automatic: boolean;
  audioDelay: number;
  videoDelay: number;
  confidence: number;
  lastCalibration: number;
  calibrationHistory: CalibrationPoint[];
}

export interface CalibrationPoint {
  timestamp: number;
  audioDelay: number;
  videoDelay: number;
  confidence: number;
  method: string;
}

// ===== PREVIEW EVENTS =====

export interface PreviewEvent {
  type: string;
  timestamp: number;
  data: any;
  source: string;
  target: string;
}

export interface PreviewEventHandler {
  event: string;
  handler: (event: PreviewEvent) => void;
  priority: number;
  once: boolean;
}

// ===== PREVIEW CONTROLS =====

export interface PreviewControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  toggleLoop: () => void;
  setInPoint: (time: number) => void;
  setOutPoint: (time: number) => void;
  setWorkArea: (enabled: boolean) => void;
  setQuality: (quality: PreviewQuality) => void;
  setResolution: (resolution: PreviewResolution) => void;
  toggleFullscreen: () => void;
  takeSnapshot: () => string;
  exportFrame: (time: number) => string;
  getStatistics: () => PreviewStatistics;
  reset: () => void;
  destroy: () => void;
}

export interface PreviewStatistics {
  totalFrames: number;
  renderedFrames: number;
  droppedFrames: number;
  skippedFrames: number;
  averageFps: number;
  currentFps: number;
  renderTime: number;
  displayTime: number;
  bufferHealth: number;
  cacheEfficiency: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage: number;
  networkUsage: number;
  diskUsage: number;
  errors: number;
  warnings: number;
  uptime: number;
  quality: number;
  stability: number;
  efficiency: number;
} 