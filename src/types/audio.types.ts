/**
 * 🎵 AUDIO TYPES - ClipsForge Pro
 * 
 * Sistema completo de tipos para áudio profissional
 * Baseado em Web Audio API para performance máxima
 * 
 * @version 5.0.0 - FASE 5
 * @author ClipsForge Team
 */

// ===== AUDIO TRACK TYPES =====

export interface AudioTrack {
  id: string;
  name: string;
  type: 'audio' | 'music' | 'voice' | 'sfx';
  source: AudioSource;
  volume: number; // 0-1
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
  keyframes: AudioKeyframe[];
  waveform?: WaveformData;
  duration: number;
  startTime: number;
  endTime: number;
  fadeIn?: number;
  fadeOut?: number;
  pan: number; // -1 to 1 (left to right)
  enabled: boolean;
  locked: boolean;
  color: string;
}

export interface AudioSource {
  type: 'file' | 'microphone' | 'generated' | 'url';
  url?: string;
  file?: File;
  buffer?: AudioBuffer;
  duration: number;
  sampleRate: number;
  channels: number;
  bitRate?: number;
  format?: string;
}

export interface WaveformData {
  peaks: number[];
  length: number;
  sampleRate: number;
  channels: number;
  duration: number;
  bits: number;
}

// ===== AUDIO EFFECTS TYPES =====

export interface AudioEffect {
  id: string;
  type: AudioEffectType;
  name: string;
  enabled: boolean;
  parameters: AudioEffectParameters;
  bypass: boolean;
  wet: number; // 0-1 (dry/wet mix)
  order: number;
}

export type AudioEffectType = 
  | 'equalizer'
  | 'compressor'
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'distortion'
  | 'filter'
  | 'gate'
  | 'limiter'
  | 'pitch'
  | 'speed'
  | 'normalize'
  | 'noiseReduction'
  | 'deEsser'
  | 'exciter'
  | 'stereoEnhancer';

export interface AudioEffectParameters {
  [key: string]: number | boolean | string;
}

// Specific effect parameter interfaces
export interface EqualizerParameters extends AudioEffectParameters {
  lowGain: number;     // -20 to 20 dB
  midGain: number;     // -20 to 20 dB
  highGain: number;    // -20 to 20 dB
  lowFreq: number;     // 20-500 Hz
  midFreq: number;     // 500-5000 Hz
  highFreq: number;    // 5000-20000 Hz
  lowQ: number;        // 0.1-10
  midQ: number;        // 0.1-10
  highQ: number;       // 0.1-10
}

export interface CompressorParameters extends AudioEffectParameters {
  threshold: number;   // -60 to 0 dB
  ratio: number;       // 1:1 to 20:1
  attack: number;      // 0-100 ms
  release: number;     // 0-1000 ms
  knee: number;        // 0-40 dB
  makeupGain: number;  // 0-20 dB
}

export interface ReverbParameters extends AudioEffectParameters {
  roomSize: number;    // 0-1
  damping: number;     // 0-1
  wetLevel: number;    // 0-1
  dryLevel: number;    // 0-1
  width: number;       // 0-1
  predelay: number;    // 0-100 ms
}

export interface DelayParameters extends AudioEffectParameters {
  delayTime: number;   // 0-2000 ms
  feedback: number;    // 0-0.95
  wetLevel: number;    // 0-1
  dryLevel: number;    // 0-1
  highCut: number;     // 1000-20000 Hz
  lowCut: number;      // 20-1000 Hz
}

// ===== AUDIO KEYFRAMES =====

export interface AudioKeyframe {
  id: string;
  time: number;
  parameter: string;
  value: number;
  interpolation: InterpolationType;
  selected: boolean;
}

export type InterpolationType = 'linear' | 'bezier' | 'step' | 'smooth';

export interface AudioAutomation {
  trackId: string;
  parameter: string;
  keyframes: AudioKeyframe[];
  enabled: boolean;
}

// ===== AUDIO MIXER TYPES =====

export interface AudioMixer {
  id: string;
  name: string;
  tracks: AudioTrack[];
  masterVolume: number;
  masterEffects: AudioEffect[];
  buses: AudioBus[];
  sends: AudioSend[];
  routing: AudioRouting;
  meters: AudioMeter[];
}

export interface AudioBus {
  id: string;
  name: string;
  type: 'aux' | 'group' | 'master';
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
  sends: AudioSend[];
  color: string;
}

export interface AudioSend {
  id: string;
  sourceId: string;
  targetId: string;
  level: number;
  enabled: boolean;
  preFader: boolean;
}

export interface AudioRouting {
  inputs: AudioInput[];
  outputs: AudioOutput[];
  connections: AudioConnection[];
}

export interface AudioInput {
  id: string;
  name: string;
  type: 'microphone' | 'line' | 'instrument';
  gain: number;
  phantom: boolean;
  enabled: boolean;
}

export interface AudioOutput {
  id: string;
  name: string;
  type: 'speakers' | 'headphones' | 'monitor';
  volume: number;
  enabled: boolean;
}

export interface AudioConnection {
  id: string;
  sourceId: string;
  targetId: string;
  enabled: boolean;
}

// ===== AUDIO METERS =====

export interface AudioMeter {
  id: string;
  trackId: string;
  type: 'peak' | 'rms' | 'lufs';
  values: number[];
  peak: number;
  hold: number;
  clip: boolean;
  enabled: boolean;
}

// ===== AUDIO ANALYSIS =====

export interface AudioAnalysis {
  trackId: string;
  spectralData: Float32Array;
  frequencyData: Float32Array;
  waveformData: Float32Array;
  rms: number;
  peak: number;
  lufs: number;
  timestamp: number;
}

export interface AudioSpectrum {
  frequencies: number[];
  magnitudes: number[];
  phases: number[];
  sampleRate: number;
  fftSize: number;
}

// ===== AUDIO ENGINE TYPES =====

export interface AudioEngineConfig {
  sampleRate: number;
  bufferSize: number;
  channels: number;
  bitDepth: number;
  latency: number;
  enableProcessing: boolean;
  enableMetering: boolean;
  enableAnalysis: boolean;
}

export interface AudioContext {
  context: AudioContext;
  destination: AudioDestinationNode;
  analyzer: AnalyserNode;
  compressor: DynamicsCompressorNode;
  masterGain: GainNode;
  nodes: Map<string, AudioNode>;
  processors: Map<string, AudioWorkletNode>;
}

export interface AudioProcessor {
  id: string;
  name: string;
  type: AudioEffectType;
  node: AudioNode;
  parameters: AudioParam[];
  enabled: boolean;
  bypass: boolean;
}

// ===== AUDIO EXPORT TYPES =====

export interface AudioExportSettings {
  format: 'wav' | 'mp3' | 'aac' | 'flac' | 'ogg';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  sampleRate: number;
  bitRate?: number;
  channels: number;
  normalize: boolean;
  fadeIn: number;
  fadeOut: number;
  trimSilence: boolean;
}

export interface AudioExportProgress {
  progress: number;
  stage: 'analyzing' | 'processing' | 'mixing' | 'encoding' | 'complete';
  currentTrack?: string;
  estimatedTime?: number;
  error?: string;
}

// ===== AUDIO EVENTS =====

export interface AudioEvent {
  type: AudioEventType;
  trackId?: string;
  effectId?: string;
  keyframeId?: string;
  data?: any;
  timestamp: number;
}

export type AudioEventType =
  | 'track_added'
  | 'track_removed'
  | 'track_muted'
  | 'track_soloed'
  | 'effect_added'
  | 'effect_removed'
  | 'effect_bypassed'
  | 'keyframe_added'
  | 'keyframe_removed'
  | 'keyframe_moved'
  | 'parameter_changed'
  | 'playback_started'
  | 'playback_stopped'
  | 'playback_paused'
  | 'recording_started'
  | 'recording_stopped'
  | 'export_started'
  | 'export_completed'
  | 'error_occurred';

// ===== AUDIO PRESETS =====

export interface AudioPreset {
  id: string;
  name: string;
  category: AudioPresetCategory;
  description: string;
  effects: AudioEffect[];
  parameters: AudioEffectParameters;
  tags: string[];
  author: string;
  version: string;
  thumbnail?: string;
}

export type AudioPresetCategory = 
  | 'vocal'
  | 'music'
  | 'podcast'
  | 'broadcast'
  | 'cinematic'
  | 'creative'
  | 'restoration'
  | 'mastering';

// ===== AUDIO UTILITIES =====

export interface AudioUtils {
  decibelsToGain: (db: number) => number;
  gainToDecibels: (gain: number) => number;
  frequencyToMidi: (freq: number) => number;
  midiToFrequency: (midi: number) => number;
  timeToSamples: (time: number, sampleRate: number) => number;
  samplesToTime: (samples: number, sampleRate: number) => number;
  normalizeAudio: (buffer: AudioBuffer) => AudioBuffer;
  generateWaveform: (buffer: AudioBuffer, width: number) => number[];
  analyzeSpectrum: (buffer: AudioBuffer) => AudioSpectrum;
}

// ===== AUDIO PERFORMANCE =====

export interface AudioPerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  bufferUnderruns: number;
  droppedSamples: number;
  processingTime: number;
  renderTime: number;
  activeEffects: number;
  activeTracks: number;
}

export interface AudioPerformanceConfig {
  maxCpuUsage: number;
  maxMemoryUsage: number;
  maxLatency: number;
  bufferSize: number;
  threadCount: number;
  enableOptimizations: boolean;
  enableProfiling: boolean;
}

// ===== MAIN AUDIO STATE =====

export interface AudioState {
  mixer: AudioMixer;
  engine: AudioEngineConfig;
  context: AudioContext;
  performance: AudioPerformanceMetrics;
  presets: AudioPreset[];
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  duration: number;
  selectedTracks: string[];
  selectedEffects: string[];
  selectedKeyframes: string[];
  clipboard: {
    tracks: AudioTrack[];
    effects: AudioEffect[];
    keyframes: AudioKeyframe[];
  };
  history: {
    past: AudioState[];
    present: AudioState;
    future: AudioState[];
  };
} 