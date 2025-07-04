/**
 * 🎵 AUDIO ENGINE - ClipsForge Pro
 * 
 * Sistema avançado de processamento de áudio baseado em Web Audio API
 * Suporte completo para efeitos, mixing e análise em tempo real
 * 
 * @version 5.0.0 - FASE 5
 * @author ClipsForge Team
 */

import {
  AudioTrack,
  AudioEffect,
  AudioEngineConfig,
  AudioPerformanceMetrics,
  AudioAnalysis,
  WaveformData,
  AudioKeyframe,
  AudioEvent,
  AudioEventType,
  EqualizerParameters,
  CompressorParameters,
  ReverbParameters,
  DelayParameters
} from '../types/audio.types';

// ===== AUDIO ENGINE CLASS =====

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  
  // Core Audio Context
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  
  // Audio Nodes and Effects
  private tracks: Map<string, AudioTrackNode> = new Map();
  private effects: Map<string, AudioEffectNode> = new Map();
  
  // Performance and Analysis
  private performanceMetrics: AudioPerformanceMetrics;
  private analysisData: Map<string, AudioAnalysis> = new Map();
  private isAnalyzing: boolean = false;
  
  // Configuration
  private config: AudioEngineConfig;
  private eventListeners: Map<AudioEventType, Function[]> = new Map();
  
  // Timing and Playback
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private startTime: number = 0;
  private pauseTime: number = 0;
  
  // ===== CONSTRUCTOR =====
  
  private constructor() {
    this.config = {
      sampleRate: 44100,
      bufferSize: 2048,
      channels: 2,
      bitDepth: 16,
      latency: 0.02,
      enableProcessing: true,
      enableMetering: true,
      enableAnalysis: true
    };
    
    this.performanceMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      latency: 0,
      bufferUnderruns: 0,
      droppedSamples: 0,
      processingTime: 0,
      renderTime: 0,
      activeEffects: 0,
      activeTracks: 0
    };
    
    this.initializeEventListeners();
  }
  
  // ===== SINGLETON PATTERN =====
  
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }
  
  // ===== INITIALIZATION =====
  
  public async initialize(config?: Partial<AudioEngineConfig>): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      // Initialize Web Audio Context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'
      });
      
      // Create master chain
      this.masterGain = this.audioContext.createGain();
      this.analyzer = this.audioContext.createAnalyser();
      this.compressor = this.audioContext.createDynamicsCompressor();
      
      // Configure analyzer
      this.analyzer.fftSize = 2048;
      this.analyzer.smoothingTimeConstant = 0.8;
      
      // Configure compressor
      this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
      
      // Connect master chain
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.analyzer);
      this.analyzer.connect(this.audioContext.destination);
      
      // Set initial master volume
      this.masterGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Start analysis if enabled
      if (this.config.enableAnalysis) {
        this.startAnalysis();
      }
      
      this.emitEvent('track_added', { config: this.config });
      
      console.log('🎵 Audio Engine initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Audio Engine:', error);
      throw error;
    }
  }
  
  // ===== TRACK MANAGEMENT =====
  
  public async addTrack(track: AudioTrack): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio Engine not initialized');
    }
    
    try {
      const trackNode = new AudioTrackNode(this.audioContext, track);
      await trackNode.initialize();
      
      // Connect to master
      trackNode.connect(this.masterGain!);
      
      this.tracks.set(track.id, trackNode);
      this.updatePerformanceMetrics();
      
      this.emitEvent('track_added', { trackId: track.id });
      
    } catch (error) {
      console.error('Failed to add audio track:', error);
      throw error;
    }
  }
  
  public removeTrack(trackId: string): void {
    const trackNode = this.tracks.get(trackId);
    if (trackNode) {
      trackNode.dispose();
      this.tracks.delete(trackId);
      this.updatePerformanceMetrics();
      
      this.emitEvent('track_removed', { trackId });
    }
  }
  
  // ===== PLAYBACK CONTROL =====
  
  public async play(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio Engine not initialized');
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime - this.pauseTime;
    
    // Start all tracks
    this.tracks.forEach(track => track.play(this.currentTime));
    
    this.emitEvent('playback_started', { time: this.currentTime });
  }
  
  public pause(): void {
    this.isPlaying = false;
    this.pauseTime = this.audioContext?.currentTime || 0;
    
    // Pause all tracks
    this.tracks.forEach(track => track.pause());
    
    this.emitEvent('playback_paused', { time: this.currentTime });
  }
  
  public stop(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.pauseTime = 0;
    
    // Stop all tracks
    this.tracks.forEach(track => track.stop());
    
    this.emitEvent('playback_stopped', { time: this.currentTime });
  }
  
  // ===== ANALYSIS =====
  
  private startAnalysis(): void {
    if (!this.analyzer || this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    
    const analyzeFrame = () => {
      if (!this.isAnalyzing || !this.analyzer) return;
      
      const bufferLength = this.analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const frequencyData = new Float32Array(bufferLength);
      const waveformData = new Float32Array(bufferLength);
      
      this.analyzer.getByteFrequencyData(dataArray);
      this.analyzer.getFloatFrequencyData(frequencyData);
      this.analyzer.getFloatTimeDomainData(waveformData);
      
      // Calculate RMS and Peak
      let rms = 0;
      let peak = 0;
      
      for (let i = 0; i < waveformData.length; i++) {
        const sample = Math.abs(waveformData[i]);
        rms += sample * sample;
        if (sample > peak) peak = sample;
      }
      
      rms = Math.sqrt(rms / waveformData.length);
      
      // Calculate LUFS (simplified)
      const lufs = -0.691 + 10 * Math.log10(rms + 1e-10);
      
      const analysis: AudioAnalysis = {
        trackId: 'master',
        spectralData: new Float32Array(dataArray),
        frequencyData,
        waveformData,
        rms,
        peak,
        lufs,
        timestamp: Date.now()
      };
      
      this.analysisData.set('master', analysis);
      
      requestAnimationFrame(analyzeFrame);
    };
    
    analyzeFrame();
  }
  
  public getAnalysis(trackId: string = 'master'): AudioAnalysis | undefined {
    return this.analysisData.get(trackId);
  }
  
  // ===== PERFORMANCE MONITORING =====
  
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000);
  }
  
  private updatePerformanceMetrics(): void {
    const now = performance.now();
    
    this.performanceMetrics = {
      ...this.performanceMetrics,
      activeTracks: this.tracks.size,
      activeEffects: Array.from(this.tracks.values()).reduce((total, track) => {
        return total + track.getEffectCount();
      }, 0),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      latency: this.audioContext?.baseLatency || 0,
      processingTime: now
    };
  }
  
  public getPerformanceMetrics(): AudioPerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  // ===== EVENT SYSTEM =====
  
  private initializeEventListeners(): void {
    const eventTypes: AudioEventType[] = [
      'track_added', 'track_removed', 'track_muted', 'track_soloed',
      'effect_added', 'effect_removed', 'effect_bypassed',
      'keyframe_added', 'keyframe_removed', 'keyframe_moved',
      'parameter_changed', 'playback_started', 'playback_stopped',
      'playback_paused', 'recording_started', 'recording_stopped',
      'export_started', 'export_completed', 'error_occurred'
    ];
    
    eventTypes.forEach(type => {
      this.eventListeners.set(type, []);
    });
  }
  
  private emitEvent(type: AudioEventType, data?: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: AudioEvent = {
        type,
        data,
        timestamp: Date.now()
      };
      
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in audio event listener:', error);
        }
      });
    }
  }
  
  // ===== CLEANUP =====
  
  public dispose(): void {
    this.stop();
    this.isAnalyzing = false;
    
    // Dispose all tracks
    this.tracks.forEach(track => track.dispose());
    this.tracks.clear();
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    AudioEngine.instance = null;
  }
}

// ===== AUDIO TRACK NODE CLASS =====

class AudioTrackNode {
  private audioContext: AudioContext;
  private track: AudioTrack;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private panNode: StereoPannerNode;
  private effectChain: AudioEffectNode[] = [];
  private isPlaying: boolean = false;
  
  constructor(audioContext: AudioContext, track: AudioTrack) {
    this.audioContext = audioContext;
    this.track = track;
    
    // Create basic nodes
    this.gainNode = audioContext.createGain();
    this.panNode = audioContext.createStereoPanner();
    
    // Connect basic chain
    this.panNode.connect(this.gainNode);
    
    // Set initial values
    this.gainNode.gain.setValueAtTime(track.volume, audioContext.currentTime);
    this.panNode.pan.setValueAtTime(track.pan, audioContext.currentTime);
  }
  
  public async initialize(): Promise<void> {
    if (this.track.source.buffer) {
      // Already have buffer
      return;
    }
    
    if (this.track.source.file) {
      // Load from file
      const arrayBuffer = await this.track.source.file.arrayBuffer();
      this.track.source.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } else if (this.track.source.url) {
      // Load from URL
      const response = await fetch(this.track.source.url);
      const arrayBuffer = await response.arrayBuffer();
      this.track.source.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
    }
  }
  
  public getEffectCount(): number {
    return this.effectChain.length;
  }
  
  public play(startTime: number = 0): void {
    if (!this.track.source.buffer || this.isPlaying) return;
    
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.track.source.buffer;
    this.source.connect(this.panNode);
    
    const when = this.audioContext.currentTime;
    const offset = Math.max(0, startTime - this.track.startTime);
    const duration = Math.max(0, this.track.duration - offset);
    
    this.source.start(when, offset, duration);
    this.isPlaying = true;
    
    this.source.onended = () => {
      this.isPlaying = false;
    };
  }
  
  public pause(): void {
    if (this.source && this.isPlaying) {
      this.source.stop();
      this.isPlaying = false;
    }
  }
  
  public stop(): void {
    if (this.source) {
      this.source.stop();
      this.source = null;
      this.isPlaying = false;
    }
  }
  
  public connect(destination: AudioNode): void {
    this.gainNode.connect(destination);
  }
  
  public disconnect(): void {
    this.gainNode.disconnect();
  }
  
  public dispose(): void {
    this.stop();
    this.disconnect();
    this.panNode.disconnect();
  }
}

// ===== AUDIO EFFECT NODE CLASS =====

class AudioEffectNode {
  private audioContext: AudioContext;
  private effect: AudioEffect;
  private inputNode: AudioNode;
  private outputNode: AudioNode;
  private effectNodes: AudioNode[] = [];
  
  constructor(audioContext: AudioContext, effect: AudioEffect) {
    this.audioContext = audioContext;
    this.effect = effect;
    
    // Create effect-specific nodes
    this.createEffectNodes();
    
    // Set input/output
    this.inputNode = this.effectNodes[0] || audioContext.createGain();
    this.outputNode = this.effectNodes[this.effectNodes.length - 1] || this.inputNode;
  }
  
  private createEffectNodes(): void {
    switch (this.effect.type) {
      case 'equalizer':
        this.createEqualizer();
        break;
      case 'compressor':
        this.createCompressor();
        break;
      default:
        // Create passthrough gain node
        const gainNode = this.audioContext.createGain();
        this.effectNodes.push(gainNode);
        break;
    }
  }
  
  private createEqualizer(): void {
    const params = this.effect.parameters as EqualizerParameters;
    
    // Low shelf
    const lowShelf = this.audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.setValueAtTime(params.lowFreq || 200, this.audioContext.currentTime);
    lowShelf.gain.setValueAtTime(params.lowGain || 0, this.audioContext.currentTime);
    lowShelf.Q.setValueAtTime(params.lowQ || 1, this.audioContext.currentTime);
    
    // Mid peaking
    const midPeaking = this.audioContext.createBiquadFilter();
    midPeaking.type = 'peaking';
    midPeaking.frequency.setValueAtTime(params.midFreq || 1000, this.audioContext.currentTime);
    midPeaking.gain.setValueAtTime(params.midGain || 0, this.audioContext.currentTime);
    midPeaking.Q.setValueAtTime(params.midQ || 1, this.audioContext.currentTime);
    
    // High shelf
    const highShelf = this.audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(params.highFreq || 8000, this.audioContext.currentTime);
    highShelf.gain.setValueAtTime(params.highGain || 0, this.audioContext.currentTime);
    highShelf.Q.setValueAtTime(params.highQ || 1, this.audioContext.currentTime);
    
    // Connect chain
    lowShelf.connect(midPeaking);
    midPeaking.connect(highShelf);
    
    this.effectNodes = [lowShelf, midPeaking, highShelf];
  }
  
  private createCompressor(): void {
    const params = this.effect.parameters as CompressorParameters;
    
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(params.threshold || -24, this.audioContext.currentTime);
    compressor.ratio.setValueAtTime(params.ratio || 4, this.audioContext.currentTime);
    compressor.attack.setValueAtTime((params.attack || 3) / 1000, this.audioContext.currentTime);
    compressor.release.setValueAtTime((params.release || 250) / 1000, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(params.knee || 30, this.audioContext.currentTime);
    
    this.effectNodes = [compressor];
  }
  
  public getId(): string {
    return this.effect.id;
  }
  
  public isEnabled(): boolean {
    return this.effect.enabled && !this.effect.bypass;
  }
  
  public getInputNode(): AudioNode {
    return this.inputNode;
  }
  
  public getOutputNode(): AudioNode {
    return this.outputNode;
  }
  
  public disconnect(): void {
    this.effectNodes.forEach(node => {
      try {
        node.disconnect();
      } catch (error) {
        // Node might already be disconnected
      }
    });
  }
  
  public dispose(): void {
    this.disconnect();
  }
}

// ===== EXPORT =====

export const audioEngine = AudioEngine.getInstance(); 