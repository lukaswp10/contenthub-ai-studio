/**
 * 🎬 TIPOS PARA SISTEMA DE EFEITOS E TRANSIÇÕES - ClipsForge Pro
 * 
 * Tipos TypeScript para efeitos visuais, transições e keyframes
 * Sistema baseado em WebGL para performance máxima
 * 
 * @version 4.0.0 - FASE 4
 * @author ClipsForge Team
 */

// ===== EFEITOS BASE =====

export interface BaseEffect {
  id: string;
  name: string;
  type: EffectType;
  category: EffectCategory;
  enabled: boolean;
  opacity: number; // 0-1
  blendMode: BlendMode;
  startTime: number;
  endTime: number;
  parameters: EffectParameters;
  keyframes: Keyframe[];
  preset?: string;
  version: string;
}

export type EffectType = 
  // Color & Lighting
  | 'brightness' | 'contrast' | 'saturation' | 'hue' | 'gamma' | 'exposure'
  | 'shadows' | 'highlights' | 'whites' | 'blacks' | 'vibrance' | 'temperature'
  
  // Blur & Sharpen
  | 'blur' | 'gaussianBlur' | 'motionBlur' | 'radialBlur' | 'sharpen' | 'unsharpMask'
  
  // Distortion
  | 'fisheye' | 'bulge' | 'pinch' | 'swirl' | 'ripple' | 'wave' | 'perspective'
  
  // Stylistic
  | 'vintage' | 'cinematic' | 'blackWhite' | 'sepia' | 'vignette' | 'filmGrain'
  | 'chromaKey' | 'posterize' | 'solarize' | 'emboss' | 'edge'
  
  // Advanced
  | 'colorGrading' | 'lut' | 'curves' | 'levels' | 'colorWheel' | 'noiseReduction'
  | 'stabilization' | 'speedRamp' | 'timeRemapping';

export type EffectCategory = 
  | 'color' | 'blur' | 'distortion' | 'stylistic' | 'advanced' | 'audio' | 'utility';

export type BlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'softLight' | 'hardLight'
  | 'colorDodge' | 'colorBurn' | 'darken' | 'lighten' | 'difference' | 'exclusion';

// ===== PARÂMETROS DE EFEITOS =====

export interface EffectParameters {
  [key: string]: EffectParameter;
}

export interface EffectParameter {
  name: string;
  type: ParameterType;
  value: number | string | boolean | number[];
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  unit?: string;
  description?: string;
}

export type ParameterType = 
  | 'number' | 'range' | 'boolean' | 'color' | 'select' | 'point' | 'curve' | 'lut';

// ===== TRANSIÇÕES =====

export interface Transition {
  id: string;
  name: string;
  type: TransitionType;
  category: TransitionCategory;
  duration: number; // em segundos
  easing: EasingFunction;
  parameters: TransitionParameters;
  preview?: string; // URL da preview
  description?: string;
}

export type TransitionType = 
  // Basic
  | 'fade' | 'dissolve' | 'cut' | 'dip'
  
  // Slide
  | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown'
  | 'pushLeft' | 'pushRight' | 'pushUp' | 'pushDown'
  
  // Zoom
  | 'zoomIn' | 'zoomOut' | 'zoomPan' | 'scaleUp' | 'scaleDown'
  
  // Rotate
  | 'rotateLeft' | 'rotateRight' | 'spin' | 'flip' | 'roll'
  
  // Wipe
  | 'wipeLeft' | 'wipeRight' | 'wipeUp' | 'wipeDown'
  | 'wipeCircle' | 'wipeDiamond' | 'wipeHeart' | 'wipeStar'
  
  // 3D
  | 'cube' | 'flip3D' | 'pageTurn' | 'door' | 'fold' | 'unfold'
  
  // Creative
  | 'morph' | 'liquid' | 'glitch' | 'pixelate' | 'shatter' | 'burn';

export type TransitionCategory = 
  | 'basic' | 'slide' | 'zoom' | 'rotate' | 'wipe' | '3d' | 'creative';

export interface TransitionParameters {
  direction?: 'left' | 'right' | 'up' | 'down' | 'in' | 'out';
  intensity?: number; // 0-1
  softness?: number; // 0-1
  angle?: number; // graus
  center?: [number, number]; // x, y (0-1)
  color?: string;
  texture?: string;
  [key: string]: any;
}

// ===== KEYFRAMES =====

export interface Keyframe {
  id: string;
  time: number; // em segundos
  parameter: string;
  value: number | string | boolean | number[];
  interpolation: InterpolationType;
  easing: EasingFunction;
  handle?: KeyframeHandle;
}

export interface KeyframeHandle {
  inTangent: [number, number];
  outTangent: [number, number];
}

export type InterpolationType = 
  | 'linear' | 'bezier' | 'step' | 'smooth' | 'bounce' | 'elastic';

export type EasingFunction = 
  | 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  | 'easeInSine' | 'easeOutSine' | 'easeInOutSine'
  | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad'
  | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
  | 'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart'
  | 'easeInQuint' | 'easeOutQuint' | 'easeInOutQuint'
  | 'easeInExpo' | 'easeOutExpo' | 'easeInOutExpo'
  | 'easeInCirc' | 'easeOutCirc' | 'easeInOutCirc'
  | 'easeInBack' | 'easeOutBack' | 'easeInOutBack'
  | 'easeInElastic' | 'easeOutElastic' | 'easeInOutElastic'
  | 'easeInBounce' | 'easeOutBounce' | 'easeInOutBounce';

// ===== RENDERIZAÇÃO =====

export interface RenderContext {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  width: number;
  height: number;
  currentTime: number;
  deltaTime: number;
  frameRate: number;
  quality: RenderQuality;
}

export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface Shader {
  id: string;
  name: string;
  vertex: string;
  fragment: string;
  uniforms: ShaderUniforms;
  attributes: ShaderAttributes;
}

export interface ShaderUniforms {
  [key: string]: {
    type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D';
    value: number | number[] | WebGLTexture;
  };
}

export interface ShaderAttributes {
  [key: string]: {
    type: 'float' | 'vec2' | 'vec3' | 'vec4';
    buffer: WebGLBuffer;
  };
}

// ===== PRESETS =====

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  effects: BaseEffect[];
  thumbnail?: string;
  tags: string[];
  author?: string;
  rating?: number;
}

export interface TransitionPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  transition: Transition;
  thumbnail?: string;
  tags: string[];
  author?: string;
  rating?: number;
}

// ===== PERFORMANCE =====

export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // ms
  renderTime: number; // ms
  effectsTime: number; // ms
  memoryUsage: number; // MB
  gpuUsage?: number; // %
  warnings: string[];
}

export interface EffectCache {
  id: string;
  effectId: string;
  parameters: string; // JSON hash
  texture: WebGLTexture;
  timestamp: number;
  hits: number;
}

// ===== EVENTOS =====

export interface EffectEvent {
  type: 'effectAdded' | 'effectRemoved' | 'effectChanged' | 'keyframeAdded' | 'keyframeChanged';
  effectId: string;
  data?: any;
  timestamp: number;
}

export interface TransitionEvent {
  type: 'transitionAdded' | 'transitionRemoved' | 'transitionChanged';
  transitionId: string;
  data?: any;
  timestamp: number;
}

// ===== EXPORTAÇÃO =====

export interface EffectExportSettings {
  includeKeyframes: boolean;
  optimizeForSize: boolean;
  quality: RenderQuality;
  format: 'json' | 'binary';
}

// ===== PLUGIN SYSTEM =====

export interface EffectPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  effects: EffectType[];
  transitions: TransitionType[];
  shaders: Shader[];
  init: (context: RenderContext) => void;
  destroy: () => void;
}

// ===== INTERFACES PRINCIPAIS =====

export interface EffectsEngine {
  // Lifecycle
  initialize: (canvas: HTMLCanvasElement) => Promise<void>;
  destroy: () => void;
  
  // Effects
  addEffect: (trackId: string, effect: BaseEffect) => void;
  removeEffect: (effectId: string) => void;
  updateEffect: (effectId: string, parameters: Partial<BaseEffect>) => void;
  
  // Transitions
  addTransition: (fromTrackId: string, toTrackId: string, transition: Transition) => void;
  removeTransition: (transitionId: string) => void;
  
  // Keyframes
  addKeyframe: (effectId: string, keyframe: Keyframe) => void;
  removeKeyframe: (keyframeId: string) => void;
  updateKeyframe: (keyframeId: string, keyframe: Partial<Keyframe>) => void;
  
  // Rendering
  render: (time: number) => void;
  setQuality: (quality: RenderQuality) => void;
  
  // Performance
  getMetrics: () => PerformanceMetrics;
  clearCache: () => void;
  
  // Events
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
}

export interface EffectsStore {
  effects: BaseEffect[];
  transitions: Transition[];
  presets: EffectPreset[];
  selectedEffect: string | null;
  previewMode: boolean;
  performance: PerformanceMetrics;
} 