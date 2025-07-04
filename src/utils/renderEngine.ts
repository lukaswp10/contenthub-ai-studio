/**
 * 🎬 RENDER ENGINE - ClipsForge Pro
 * 
 * Engine de renderização profissional modular
 * Comparable a Adobe Media Encoder, DaVinci Resolve Delivery
 * 
 * @version 8.0.0 - FASE 8 - REFATORADO
 * @author ClipsForge Team
 */

import {
  RenderEngine,
  RenderCapabilities,
  RenderSettings,
  RenderState,
  RenderPerformance,
  RenderConfig,
  RenderJob,
  RenderResult,
  RenderError,
  RenderWarning,
  RenderProgress,
  SystemInfo,
  VideoFormat,
  VideoCodec,
  AudioCodec
} from '../types/render.types';

// ===== IMPORTS DOS MÓDULOS =====
import { CapabilityDetector } from './render/CapabilityDetector';
import { WebGLRenderer } from './render/WebGLRenderer';
import { AudioProcessor } from './render/AudioProcessor';
import { WorkerManager } from './render/WorkerManager';
import { RenderValidator } from './render/RenderValidator';
import { RenderPipeline } from './render/RenderPipeline';
import { CacheManager } from './render/CacheManager';
import { ProgressTracker } from './render/ProgressTracker';
import { ErrorHandler } from './render/ErrorHandler';

// ===== RENDER ENGINE PRINCIPAL =====

class ClipsForgeRenderEngine implements RenderEngine {
  public readonly id = 'clipsforge-render-engine';
  public readonly name = 'ClipsForge Render Engine';
  public readonly version = '8.0.0';

  // Módulos especializados
  private _capabilityDetector: CapabilityDetector;
  private _webglRenderer: WebGLRenderer;
  private _audioProcessor: AudioProcessor;
  private _workerManager: WorkerManager;
  private _validator: RenderValidator;
  private _pipeline: RenderPipeline;
  private _cacheManager: CacheManager;
  private _progressTracker: ProgressTracker;
  private _errorHandler: ErrorHandler;

  // Estado principal
  private _capabilities: RenderCapabilities;
  private _settings: RenderSettings;
  private _state: RenderState;
  private _performance: RenderPerformance;
  private _initialized = false;
  private _currentJob: RenderJob | null = null;

  constructor() {
    // Inicializar módulos
    this._capabilityDetector = new CapabilityDetector();
    this._webglRenderer = new WebGLRenderer();
    this._audioProcessor = new AudioProcessor();
    this._workerManager = new WorkerManager();
    this._validator = new RenderValidator();
    this._pipeline = new RenderPipeline();
    this._cacheManager = new CacheManager();
    this._progressTracker = new ProgressTracker();
    this._errorHandler = new ErrorHandler();

    // Estado inicial
    this._capabilities = this._capabilityDetector.detect();
    this._settings = this._getDefaultSettings();
    this._state = this._getInitialState();
    this._performance = this._getInitialPerformance();
  }

  // ===== INITIALIZATION =====

  async initialize(config: RenderConfig): Promise<void> {
    if (this._initialized) {
      throw new Error('Render engine already initialized');
    }

    try {
      console.log('🎬 Initializing Render Engine...');

      // Aplicar configuração
      this._applyConfig(config);

      // Inicializar módulos
      await this._webglRenderer.initialize();
      await this._audioProcessor.initialize();
      await this._workerManager.initialize({
        maxWorkers: this._settings.threads,
        enableWorkers: this._settings.useWebWorkers
      });
      await this._cacheManager.initialize({
        maxSize: this._settings.cacheSize / (1024 * 1024), // Convert to MB
        enabled: true
      });

      this._initialized = true;
      this._state.status = 'idle';

      console.log('🎬 Render Engine initialized successfully');
      console.log('📊 Capabilities:', this._capabilities);

    } catch (error) {
      this._state.status = 'error';
      this._errorHandler.addError('INIT_FAILED', error);
      throw error;
    }
  }

  // ===== CORE METHODS =====

  async render(job: RenderJob): Promise<RenderResult> {
    if (!this._initialized) {
      throw new Error('Render engine not initialized');
    }

    if (this._state.status === 'rendering') {
      throw new Error('Another render job is already in progress');
    }

    try {
      this._currentJob = job;
      this._state.status = 'rendering';
      this._state.currentJob = job;
      this._progressTracker.reset();

      console.log(`🎬 Starting render job: ${job.name}`);

      // Validar job
      await this._validator.validate(job);

      // Executar pipeline de renderização
      const result = await this._pipeline.execute(job, {
        webglRenderer: this._webglRenderer,
        audioProcessor: this._audioProcessor,
        workerManager: this._workerManager,
        cacheManager: this._cacheManager,
        progressTracker: this._progressTracker,
        errorHandler: this._errorHandler
      });

      this._state.status = 'completed';
      this._currentJob = null;

      console.log(`🎬 Render completed: ${job.name}`);
      return result;

    } catch (error) {
      this._state.status = 'error';
      this._errorHandler.addError('RENDER_FAILED', error);
      
      return this._createErrorResult(job, error);
    }
  }

  pause(): void {
    if (this._state.status === 'rendering') {
      this._state.status = 'paused';
      this._pipeline.pause();
      console.log('🎬 Render paused');
    }
  }

  resume(): void {
    if (this._state.status === 'paused') {
      this._state.status = 'rendering';
      this._pipeline.resume();
      console.log('🎬 Render resumed');
    }
  }

  cancel(): void {
    if (this._state.status === 'rendering' || this._state.status === 'paused') {
      this._state.status = 'cancelled';
      this._pipeline.cancel();
      this._currentJob = null;
      console.log('🎬 Render cancelled');
    }
  }

  dispose(): void {
    // Limpar módulos
    this._webglRenderer.dispose();
    this._audioProcessor.dispose();
    this._workerManager.dispose();
    this._cacheManager.dispose();
    this._pipeline.dispose();

    this._initialized = false;
    this._state.status = 'idle';

    console.log('🎬 Render Engine disposed');
  }

  // ===== GETTERS =====

  get capabilities(): RenderCapabilities {
    return this._capabilities;
  }

  get settings(): RenderSettings {
    return this._settings;
  }

  get state(): RenderState {
    return this._state;
  }

  get performance(): RenderPerformance {
    return this._performance;
  }

  // ===== PRIVATE METHODS =====

  private _getDefaultSettings(): RenderSettings {
    return {
      quality: 'high',
      threads: Math.min(navigator.hardwareConcurrency || 4, 8),
      useGPU: true,
      useWebWorkers: true,
      cacheEnabled: true,
      cacheSize: 100, // MB
      memoryLimit: 2048, // MB
      thermalThrottling: true,
      batteryOptimization: false,
      priorityLevel: 'normal'
    };
  }

  private _getInitialState(): RenderState {
    return {
      status: 'idle',
      currentJob: null,
      queue: [],
      progress: 0,
      timeRemaining: 0,
      renderSpeed: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      temperature: 0,
      errors: [],
      warnings: []
    };
  }

  private _getInitialPerformance(): RenderPerformance {
    return {
      averageRenderTime: 0,
      peakMemoryUsage: 0,
      averageCPUUsage: 0,
      averageGPUUsage: 0,
      totalFramesRendered: 0,
      totalRenderTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      thermalEvents: 0,
      batteryImpact: 'low'
    };
  }

  private _applyConfig(config: RenderConfig): void {
    if (config.settings) {
      this._settings = { ...this._settings, ...config.settings };
    }
  }

  private _createErrorResult(job: RenderJob, error: any): RenderResult {
    return {
      id: this._generateId(),
      jobId: job.id,
      status: 'error',
      error: this._errorHandler.createError('RENDER_FAILED', error),
      statistics: this._state.statistics,
      metadata: this._createResultMetadata(),
      createdAt: new Date(),
      completedAt: new Date()
    };
  }

  private _createResultMetadata(): any {
    return {
      engine: {
        name: this.name,
        version: this.version,
        capabilities: this._capabilities
      },
      system: this._getSystemInfo(),
      timestamp: new Date().toISOString()
    };
  }

  private _getSystemInfo(): SystemInfo {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      cores: navigator.hardwareConcurrency || 4,
      memory: (navigator as any).deviceMemory || 'unknown',
      gpu: this._getGPUInfo(),
      webgl: this._capabilities.webgl2 ? 'WebGL2' : this._capabilities.webgl ? 'WebGL' : 'none',
      webcodecs: this._capabilities.webcodecs,
      audioContext: this._capabilities.audioContext
    };
  }

  private _getGPUInfo(): string {
    if (!this._webglRenderer.gl) return 'unknown';
    
    const debugInfo = this._webglRenderer.gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return this._webglRenderer.gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
    }
    return 'unknown';
  }

  private _generateId(): string {
    return `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ===== EXPORT =====

export const renderEngine = new ClipsForgeRenderEngine();
export default renderEngine;

// ===== UTILITY FUNCTIONS =====

export const createRenderJob = (config: Partial<RenderJob>): RenderJob => {
  return {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: config.name || 'Untitled Render',
    source: config.source || {
      type: 'video',
      url: '',
      duration: 0,
      metadata: {}
    },
    output: config.output || {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1920, height: 1080 },
      framerate: 30,
      bitrate: 8000,
      audioBitrate: 128,
      destination: 'download'
    },
    timeline: config.timeline || {
      duration: 0,
      tracks: [],
      markers: []
    },
    effects: config.effects || [],
    audio: config.audio || {
      tracks: [],
      masterVolume: 1,
      effects: []
    },
    metadata: config.metadata || {},
    priority: config.priority || 'normal',
    createdAt: new Date(),
    ...config
  };
};