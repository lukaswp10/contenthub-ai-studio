/**
 * 🎬 EXPORT TYPES - ClipsForge Pro
 * 
 * Tipos TypeScript para sistema de exportação profissional
 * Comparable a Adobe Media Encoder, Final Cut Pro Share, DaVinci Resolve Delivery
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import { 
  VideoFormat, 
  VideoCodec, 
  AudioCodec, 
  RenderJob, 
  RenderProgress, 
  RenderResult,
  RenderError,
  RenderWarning,
  SystemInfo
} from './render.types';

// ===== EXPORT MANAGER TYPES =====

export interface ExportManager {
  id: string;
  name: string;
  version: string;
  capabilities: ExportCapabilities;
  settings: ExportSettings;
  state: ExportState;
  presets: ExportPreset[];
  queue: ExportJob[];
  
  // Methods
  initialize: (config: ExportConfig) => Promise<void>;
  addJob: (job: ExportJob) => Promise<string>;
  removeJob: (jobId: string) => Promise<void>;
  startExport: (jobId: string) => Promise<void>;
  pauseExport: (jobId: string) => Promise<void>;
  resumeExport: (jobId: string) => Promise<void>;
  cancelExport: (jobId: string) => Promise<void>;
  batchExport: (jobs: ExportJob[]) => Promise<BatchExportResult>;
  dispose: () => Promise<void>;
}

export interface ExportCapabilities {
  maxConcurrentExports: number;
  supportedFormats: VideoFormat[];
  supportedCodecs: VideoCodec[];
  audioCodecs: AudioCodec[];
  maxResolution: { width: number; height: number };
  maxBitrate: number;
  maxFrameRate: number;
  hardwareAcceleration: boolean;
  cloudExport: boolean;
  batchExport: boolean;
  backgroundExport: boolean;
  progressiveUpload: boolean;
  watermarkSupport: boolean;
  metadataEmbedding: boolean;
  customPresets: boolean;
}

export interface ExportSettings {
  defaultFormat: VideoFormat;
  defaultCodec: VideoCodec;
  defaultQuality: number;
  defaultBitrate: number;
  autoStart: boolean;
  notifications: boolean;
  cloudProvider?: 'aws' | 'gcp' | 'azure' | 'cloudflare';
  watermark?: WatermarkConfig;
  metadata?: MetadataConfig;
  naming: NamingConfig;
  destination: DestinationConfig;
}

export interface ExportState {
  status: 'idle' | 'exporting' | 'paused' | 'completed' | 'error';
  activeJobs: ExportJob[];
  completedJobs: ExportJob[];
  failedJobs: ExportJob[];
  totalJobs: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
  errors: ExportError[];
  warnings: ExportWarning[];
  statistics: ExportStatistics;
}

// ===== EXPORT JOB TYPES =====

export interface ExportJob {
  id: string;
  name: string;
  type: 'single' | 'batch' | 'sequence';
  status: 'queued' | 'preparing' | 'exporting' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Source
  source: ExportSource;
  
  // Output Configuration
  output: ExportOutput;
  
  // Processing Options
  processing: ProcessingOptions;
  
  // Delivery Options
  delivery: DeliveryOptions;
  
  // Progress Tracking
  progress: ExportProgress;
  
  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Callbacks
  onProgress?: (progress: ExportProgress) => void;
  onComplete?: (result: ExportResult) => void;
  onError?: (error: ExportError) => void;
  onWarning?: (warning: ExportWarning) => void;
}

export interface ExportSource {
  type: 'timeline' | 'composition' | 'sequence' | 'selection';
  renderJob?: RenderJob;
  timelineId?: string;
  compositionId?: string;
  sequenceId?: string;
  selectionRange?: {
    start: number;
    end: number;
  };
  workArea?: {
    start: number;
    end: number;
  };
}

export interface ExportOutput {
  // Basic Settings
  format: VideoFormat;
  codec: VideoCodec;
  audioCodec: AudioCodec;
  
  // Video Settings
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  bitrate: number;
  quality: number; // 0-100
  
  // Audio Settings
  audioBitrate: number;
  audioChannels: number;
  audioSampleRate: number;
  
  // Advanced Settings
  profile: string;
  level: string;
  keyframeInterval: number;
  bFrames: number;
  compressionLevel: number;
  
  // File Settings
  filename: string;
  filenameTemplate?: string;
  
  // Optimization
  twoPass: boolean;
  constantQuality: boolean;
  adaptiveBitrate: boolean;
}

export interface ProcessingOptions {
  // Color
  colorSpace: 'rec709' | 'rec2020' | 'p3' | 'srgb';
  colorRange: 'limited' | 'full';
  gamma: number;
  
  // Scaling
  scalingAlgorithm: 'bilinear' | 'bicubic' | 'lanczos' | 'spline';
  deinterlace: boolean;
  
  // Filters
  denoise: boolean;
  denoiseLevel: number;
  sharpen: boolean;
  sharpenLevel: number;
  
  // Audio Processing
  audioNormalization: boolean;
  audioLimiter: boolean;
  audioEQ: boolean;
  
  // Performance
  useGPU: boolean;
  threads: number;
  priority: 'low' | 'normal' | 'high';
}

export interface DeliveryOptions {
  destination: 'local' | 'cloud' | 'ftp' | 'stream';
  
  // Local Delivery
  localPath?: string;
  autoOpen?: boolean;
  
  // Cloud Delivery
  cloudProvider?: 'aws' | 'gcp' | 'azure' | 'cloudflare';
  cloudBucket?: string;
  cloudPath?: string;
  cloudPublic?: boolean;
  
  // FTP Delivery
  ftpHost?: string;
  ftpUser?: string;
  ftpPassword?: string;
  ftpPath?: string;
  
  // Streaming
  streamUrl?: string;
  streamKey?: string;
  streamProtocol?: 'rtmp' | 'webrtc' | 'hls';
  
  // Notifications
  emailNotification?: boolean;
  webhookUrl?: string;
  
  // Metadata
  embedMetadata: boolean;
  customMetadata?: Record<string, any>;
}

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'uploading' | 'finalizing';
  percentage: number; // 0-100
  currentFrame: number;
  totalFrames: number;
  framesPerSecond: number;
  timeElapsed: number; // seconds
  timeRemaining: number; // seconds
  bytesProcessed: number;
  bytesTotal: number;
  uploadProgress?: number; // 0-100
  message: string;
  warnings: ExportWarning[];
}

// ===== EXPORT PRESETS =====

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  platform?: Platform;
  output: ExportOutput;
  processing: ProcessingOptions;
  delivery: Partial<DeliveryOptions>;
  thumbnail?: string;
  icon?: string;
  popular: boolean;
  recommended: boolean;
  tags: string[];
  metadata: PresetMetadata;
}

export type PresetCategory = 
  | 'web' | 'social' | 'broadcast' | 'cinema' | 'mobile' | 'audio' | 'custom';

export type Platform = 
  | 'youtube' | 'instagram' | 'tiktok' | 'vimeo' | 'facebook' | 'twitter' 
  | 'linkedin' | 'snapchat' | 'pinterest' | 'twitch' | 'discord';

export interface PresetMetadata {
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  usage: number;
  rating: number;
  compatibility: string[];
  requirements: string[];
}

// ===== SOCIAL MEDIA PRESETS =====

export interface SocialMediaPreset extends ExportPreset {
  platform: Platform;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5' | '21:9';
  maxDuration: number; // seconds
  maxFileSize: number; // MB
  recommendedSpecs: {
    resolution: { width: number; height: number };
    frameRate: number;
    bitrate: number;
    audioChannels: number;
  };
  platformLimits: {
    maxResolution: { width: number; height: number };
    maxFrameRate: number;
    maxBitrate: number;
    maxFileSize: number;
    supportedFormats: VideoFormat[];
  };
}

// ===== BATCH EXPORT =====

export interface BatchExportJob {
  id: string;
  name: string;
  source: ExportSource;
  presets: ExportPreset[];
  outputs: ExportOutput[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: BatchExportProgress;
  results: ExportResult[];
  createdAt: Date;
  completedAt?: Date;
}

export interface BatchExportProgress {
  totalOutputs: number;
  completedOutputs: number;
  failedOutputs: number;
  currentOutput: number;
  currentPreset: string;
  overallProgress: number;
  estimatedTimeRemaining: number;
  outputs: {
    presetId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: ExportResult;
    error?: ExportError;
  }[];
}

export interface BatchExportResult {
  id: string;
  jobId: string;
  status: 'success' | 'partial' | 'failed';
  results: ExportResult[];
  errors: ExportError[];
  statistics: BatchExportStatistics;
  completedAt: Date;
}

export interface BatchExportStatistics {
  totalOutputs: number;
  successfulOutputs: number;
  failedOutputs: number;
  totalTime: number; // seconds
  averageTime: number; // seconds per output
  totalSize: number; // bytes
  compressionRatio: number;
  successRate: number; // percentage
}

// ===== EXPORT RESULTS =====

export interface ExportResult {
  id: string;
  jobId: string;
  status: 'success' | 'error' | 'cancelled';
  output?: ExportOutputFile;
  error?: ExportError;
  statistics: ExportStatistics;
  metadata: ExportResultMetadata;
  createdAt: Date;
  completedAt: Date;
}

export interface ExportOutputFile {
  filename: string;
  url: string;
  localPath?: string;
  cloudUrl?: string;
  streamUrl?: string;
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

export interface ExportStatistics {
  totalFrames: number;
  exportTime: number; // seconds
  renderTime: number; // seconds
  encodingTime: number; // seconds
  uploadTime: number; // seconds
  averageFPS: number;
  peakMemoryUsage: number; // MB
  averageCPUUsage: number; // percentage
  averageGPUUsage: number; // percentage
  compressionRatio: number;
  qualityScore: number; // 0-100
  fileSize: number; // bytes
  bitrate: number;
  errorCount: number;
  warningCount: number;
}

export interface ExportResultMetadata {
  exportEngine: string;
  exportVersion: string;
  preset: string;
  settings: ExportOutput;
  processing: ProcessingOptions;
  delivery: DeliveryOptions;
  systemInfo: SystemInfo;
  timestamp: Date;
}

// ===== ERROR AND WARNING TYPES =====

export interface ExportError {
  id: string;
  type: 'fatal' | 'recoverable' | 'validation';
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  phase: 'preparing' | 'rendering' | 'encoding' | 'uploading' | 'finalizing';
  jobId?: string;
  presetId?: string;
  stackTrace?: string;
  suggestions?: string[];
}

export interface ExportWarning {
  id: string;
  type: 'performance' | 'quality' | 'compatibility' | 'size';
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  phase: 'preparing' | 'rendering' | 'encoding' | 'uploading' | 'finalizing';
  jobId?: string;
  presetId?: string;
  severity: 'low' | 'medium' | 'high';
  suggestions?: string[];
}

// ===== CONFIGURATION TYPES =====

export interface ExportConfig {
  engine: {
    maxConcurrentJobs: number;
    useGPU: boolean;
    threads: number;
    memoryLimit: number; // MB
    tempDirectory: string;
    cleanupTemp: boolean;
  };
  defaults: {
    format: VideoFormat;
    codec: VideoCodec;
    quality: number;
    bitrate: number;
    resolution: { width: number; height: number };
    frameRate: number;
  };
  cloud: {
    provider?: 'aws' | 'gcp' | 'azure' | 'cloudflare';
    credentials?: CloudCredentials;
    bucket?: string;
    region?: string;
    endpoint?: string;
  };
  notifications: {
    email: boolean;
    webhook: boolean;
    desktop: boolean;
    sound: boolean;
  };
  advanced: {
    enableProfiling: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    retryFailedJobs: boolean;
    maxRetries: number;
    cleanupOnError: boolean;
  };
}

export interface CloudCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  region?: string;
  projectId?: string;
  keyFile?: string;
  subscriptionId?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  type: 'image' | 'text';
  image?: {
    url: string;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    scale: number;
    margin: { x: number; y: number };
  };
  text?: {
    content: string;
    font: string;
    size: number;
    color: string;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    margin: { x: number; y: number };
    shadow: boolean;
    outline: boolean;
  };
}

export interface MetadataConfig {
  embedBasic: boolean;
  embedExtended: boolean;
  title?: string;
  description?: string;
  author?: string;
  copyright?: string;
  keywords?: string[];
  customFields?: Record<string, any>;
}

export interface NamingConfig {
  template: string;
  includeDate: boolean;
  includeTime: boolean;
  includePreset: boolean;
  includeResolution: boolean;
  includeFormat: boolean;
  separator: string;
  case: 'original' | 'lower' | 'upper' | 'camel' | 'pascal' | 'snake' | 'kebab';
}

export interface DestinationConfig {
  local: {
    enabled: boolean;
    path: string;
    createSubfolders: boolean;
    overwriteExisting: boolean;
  };
  cloud: {
    enabled: boolean;
    provider?: 'aws' | 'gcp' | 'azure' | 'cloudflare';
    bucket?: string;
    path?: string;
    publicAccess: boolean;
    generateUrls: boolean;
  };
  ftp: {
    enabled: boolean;
    host?: string;
    port: number;
    username?: string;
    password?: string;
    path?: string;
    passive: boolean;
    secure: boolean;
  };
}

// ===== EXPORT QUEUE TYPES =====

export interface ExportQueue {
  id: string;
  name: string;
  jobs: ExportJob[];
  status: 'idle' | 'processing' | 'paused' | 'completed';
  currentJob: ExportJob | null;
  progress: ExportQueueProgress;
  settings: ExportQueueSettings;
  statistics: ExportQueueStatistics;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportQueueProgress {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  currentJobProgress: number;
  overallProgress: number;
  estimatedTimeRemaining: number; // seconds
  throughput: number; // jobs per hour
}

export interface ExportQueueSettings {
  maxConcurrentJobs: number;
  pauseOnError: boolean;
  retryFailedJobs: boolean;
  maxRetries: number;
  priorityOrder: 'fifo' | 'lifo' | 'priority' | 'shortest-first';
  autoStart: boolean;
  notifications: boolean;
  cleanupCompleted: boolean;
  maxHistorySize: number;
}

export interface ExportQueueStatistics {
  totalJobsProcessed: number;
  totalExportTime: number; // seconds
  averageJobTime: number; // seconds
  successRate: number; // percentage
  errorRate: number; // percentage
  throughput: number; // jobs per hour
  peakMemoryUsage: number; // MB
  totalDataExported: number; // MB
  averageFileSize: number; // MB
  popularFormats: { format: VideoFormat; count: number }[];
  popularPresets: { preset: string; count: number }[];
}

// ===== UTILITY TYPES =====

export interface ExportEvent {
  type: 'job-added' | 'job-started' | 'job-progress' | 'job-completed' | 'job-failed' | 'job-cancelled';
  timestamp: Date;
  jobId: string;
  data: any;
  source: string;
}

export interface ExportCallback {
  onJobAdded?: (job: ExportJob) => void;
  onJobStarted?: (job: ExportJob) => void;
  onJobProgress?: (job: ExportJob, progress: ExportProgress) => void;
  onJobCompleted?: (job: ExportJob, result: ExportResult) => void;
  onJobFailed?: (job: ExportJob, error: ExportError) => void;
  onJobCancelled?: (job: ExportJob) => void;
  onQueueCompleted?: (queue: ExportQueue) => void;
}

export interface ExportOptions {
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  background?: boolean;
  notifications?: boolean;
  autoStart?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  callbacks?: ExportCallback;
  metadata?: Record<string, any>;
}

// ===== VALIDATION TYPES =====

export interface ExportValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  impact: 'quality' | 'performance' | 'compatibility' | 'size';
}

export interface ValidationSuggestion {
  field: string;
  message: string;
  suggestedValue: any;
  reason: string;
}