/**
 * 🎨 MOTION GRAPHICS TYPES - ClipsForge Pro
 * 
 * Sistema completo de tipos para motion graphics profissional
 * Baseado em Canvas/WebGL para performance máxima
 * 
 * @version 5.0.0 - FASE 5
 * @author ClipsForge Team
 */

// ===== ANIMATION TYPES =====

export interface Animation {
  id: string;
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  loop: boolean;
  reverse: boolean;
  delay: number;
  easing: EasingFunction;
  keyframes: Keyframe[];
  layers: AnimationLayer[];
  enabled: boolean;
  locked: boolean;
  tags: string[];
}

export interface Keyframe {
  id: string;
  time: number;
  properties: KeyframeProperties;
  easing: EasingFunction;
  selected: boolean;
  locked: boolean;
}

export interface KeyframeProperties {
  position?: Vector2D;
  scale?: Vector2D;
  rotation?: number;
  opacity?: number;
  anchor?: Vector2D;
  skew?: Vector2D;
  color?: Color;
  size?: Vector2D;
  radius?: number;
  strokeWidth?: number;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  [key: string]: any;
}

export type EasingFunction = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'back'
  | 'cubic-bezier'
  | 'spring'
  | 'custom';

// ===== LAYER TYPES =====

export interface AnimationLayer {
  id: string;
  name: string;
  type: LayerType;
  parent?: string;
  children: string[];
  transform: Transform;
  style: LayerStyle;
  effects: LayerEffect[];
  masks: Mask[];
  blendMode: BlendMode;
  opacity: number;
  visible: boolean;
  locked: boolean;
  solo: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  keyframes: Keyframe[];
  markers: Marker[];
}

export type LayerType = 
  | 'shape'
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'solid'
  | 'null'
  | 'light'
  | 'camera'
  | 'adjustment'
  | 'particle'
  | 'precomp';

export interface Transform {
  position: Vector3D;
  scale: Vector3D;
  rotation: Vector3D;
  anchor: Vector3D;
  opacity: number;
  skew: Vector2D;
  skewAxis: number;
}

export interface LayerStyle {
  fill?: Fill;
  stroke?: Stroke;
  shadow?: Shadow;
  glow?: Glow;
  gradient?: Gradient;
  blur?: Blur;
}

export interface Fill {
  type: 'solid' | 'gradient' | 'pattern' | 'image';
  color?: Color;
  gradient?: Gradient;
  opacity: number;
  blendMode: BlendMode;
}

export interface Stroke {
  color: Color;
  width: number;
  opacity: number;
  lineCap: 'butt' | 'round' | 'square';
  lineJoin: 'miter' | 'round' | 'bevel';
  miterLimit: number;
  dashArray?: number[];
  dashOffset: number;
  blendMode: BlendMode;
}

export interface Shadow {
  color: Color;
  offset: Vector2D;
  blur: number;
  spread: number;
  opacity: number;
  inner: boolean;
}

export interface Glow {
  color: Color;
  size: number;
  opacity: number;
  inner: boolean;
  quality: 'low' | 'medium' | 'high';
}

// ===== SHAPE TYPES =====

export interface ShapeLayer extends AnimationLayer {
  shapes: Shape[];
  pathData: PathData;
}

export interface Shape {
  id: string;
  type: ShapeType;
  name: string;
  properties: ShapeProperties;
  path: Path;
  fill: Fill;
  stroke: Stroke;
  transform: Transform;
  visible: boolean;
  locked: boolean;
}

export type ShapeType = 
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'star'
  | 'path'
  | 'line'
  | 'bezier'
  | 'text'
  | 'group';

export interface ShapeProperties {
  size?: Vector2D;
  radius?: number;
  cornerRadius?: number;
  points?: number;
  innerRadius?: number;
  roundness?: number;
  [key: string]: any;
}

export interface Path {
  id: string;
  closed: boolean;
  points: PathPoint[];
  length: number;
  bounds: Bounds;
}

export interface PathPoint {
  position: Vector2D;
  inTangent: Vector2D;
  outTangent: Vector2D;
  type: 'corner' | 'smooth' | 'bezier';
  selected: boolean;
}

export interface PathData {
  d: string; // SVG path data
  bounds: Bounds;
  length: number;
  closed: boolean;
}

// ===== TEXT TYPES =====

export interface TextLayer extends AnimationLayer {
  text: TextData;
  font: FontData;
  layout: TextLayout;
  animation: TextAnimation;
}

export interface TextData {
  content: string;
  font: string;
  size: number;
  color: Color;
  weight: number;
  style: 'normal' | 'italic' | 'oblique';
  decoration: 'none' | 'underline' | 'line-through' | 'overline';
  transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing: number;
  lineHeight: number;
  wordSpacing: number;
  direction: 'ltr' | 'rtl';
  align: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom' | 'baseline';
}

export interface FontData {
  family: string;
  weight: number;
  style: string;
  variant: string;
  size: number;
  lineHeight: number;
  loaded: boolean;
  fallbacks: string[];
}

export interface TextLayout {
  width: number;
  height: number;
  padding: Vector4D;
  margin: Vector4D;
  overflow: 'visible' | 'hidden' | 'scroll' | 'auto';
  wrap: 'normal' | 'break-word' | 'nowrap';
  whiteSpace: 'normal' | 'pre' | 'pre-wrap' | 'pre-line';
}

export interface TextAnimation {
  type: TextAnimationType;
  duration: number;
  delay: number;
  stagger: number;
  easing: EasingFunction;
  direction: 'normal' | 'reverse' | 'alternate';
  properties: KeyframeProperties;
}

export type TextAnimationType = 
  | 'typewriter'
  | 'fade'
  | 'slide'
  | 'scale'
  | 'rotate'
  | 'bounce'
  | 'elastic'
  | 'wave'
  | 'glitch'
  | 'flicker'
  | 'neon';

// ===== PARTICLE TYPES =====

export interface ParticleSystem extends AnimationLayer {
  emitter: ParticleEmitter;
  particles: Particle[];
  forces: Force[];
  maxParticles: number;
  autoPlay: boolean;
  loop: boolean;
}

export interface ParticleEmitter {
  id: string;
  position: Vector3D;
  shape: EmitterShape;
  rate: number;
  burst: number;
  lifetime: number;
  startVelocity: Vector3D;
  startSize: number;
  startColor: Color;
  startOpacity: number;
  startRotation: number;
  enabled: boolean;
}

export interface Particle {
  id: string;
  position: Vector3D;
  velocity: Vector3D;
  acceleration: Vector3D;
  size: number;
  color: Color;
  opacity: number;
  rotation: number;
  angularVelocity: number;
  lifetime: number;
  age: number;
  mass: number;
  drag: number;
  bounce: number;
  alive: boolean;
  data: any;
}

export interface EmitterShape {
  type: 'point' | 'circle' | 'rectangle' | 'line' | 'sphere' | 'box';
  size: Vector3D;
  radius: number;
  angle: number;
  arc: number;
}

export interface Force {
  id: string;
  type: ForceType;
  strength: number;
  position: Vector3D;
  radius: number;
  direction: Vector3D;
  enabled: boolean;
}

export type ForceType = 
  | 'gravity'
  | 'wind'
  | 'magnetic'
  | 'vortex'
  | 'turbulence'
  | 'drag'
  | 'spring'
  | 'attract'
  | 'repel';

// ===== EFFECT TYPES =====

export interface LayerEffect {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  parameters: EffectParameters;
  keyframes: Keyframe[];
  blendMode: BlendMode;
  opacity: number;
}

export type EffectType = 
  | 'blur'
  | 'sharpen'
  | 'glow'
  | 'shadow'
  | 'stroke'
  | 'fill'
  | 'gradient'
  | 'noise'
  | 'distort'
  | 'warp'
  | 'ripple'
  | 'wave'
  | 'turbulence'
  | 'fractal'
  | 'mosaic'
  | 'pixelate'
  | 'posterize'
  | 'threshold'
  | 'invert'
  | 'hue'
  | 'saturation'
  | 'brightness'
  | 'contrast'
  | 'gamma'
  | 'levels'
  | 'curves'
  | 'colorize'
  | 'tint'
  | 'sepia'
  | 'grayscale'
  | 'vintage'
  | 'film'
  | 'glitch'
  | 'chromatic'
  | 'vignette'
  | 'lens'
  | 'fisheye'
  | 'perspective'
  | 'transform'
  | 'mirror'
  | 'kaleidoscope'
  | 'fracture'
  | 'shatter'
  | 'explode'
  | 'implode'
  | 'morph'
  | 'liquid'
  | 'fire'
  | 'water'
  | 'smoke'
  | 'lightning'
  | 'energy'
  | 'magic'
  | 'portal'
  | 'hologram'
  | 'matrix'
  | 'cyber'
  | 'neon'
  | 'retro'
  | 'grunge'
  | 'sketch'
  | 'cartoon'
  | 'comic'
  | 'anime'
  | 'watercolor'
  | 'oil'
  | 'pencil'
  | 'charcoal'
  | 'pastel';

export interface EffectParameters {
  [key: string]: number | boolean | string | Color | Vector2D | Vector3D;
}

// ===== MASK TYPES =====

export interface Mask {
  id: string;
  name: string;
  type: MaskType;
  mode: MaskMode;
  path: Path;
  feather: number;
  opacity: number;
  inverted: boolean;
  enabled: boolean;
  locked: boolean;
  keyframes: Keyframe[];
}

export type MaskType = 
  | 'shape'
  | 'bezier'
  | 'text'
  | 'image'
  | 'gradient'
  | 'noise';

export type MaskMode = 
  | 'add'
  | 'subtract'
  | 'intersect'
  | 'difference'
  | 'lighten'
  | 'darken'
  | 'none';

// ===== UTILITY TYPES =====

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Gradient {
  type: 'linear' | 'radial' | 'conic';
  stops: GradientStop[];
  angle: number;
  position: Vector2D;
  scale: Vector2D;
}

export interface GradientStop {
  color: Color;
  position: number;
  opacity: number;
}

export interface Blur {
  type: 'gaussian' | 'motion' | 'radial' | 'zoom';
  radius: number;
  angle: number;
  quality: 'low' | 'medium' | 'high';
}

export type BlendMode = 
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'
  | 'add'
  | 'subtract'
  | 'divide'
  | 'linear-burn'
  | 'linear-dodge'
  | 'vivid-light'
  | 'linear-light'
  | 'pin-light'
  | 'hard-mix'
  | 'dissolve'
  | 'darker-color'
  | 'lighter-color';

export interface Marker {
  id: string;
  time: number;
  duration: number;
  comment: string;
  color: Color;
  type: 'comment' | 'chapter' | 'cue' | 'navigation';
}

// ===== COMPOSITION TYPES =====

export interface Composition {
  id: string;
  name: string;
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  backgroundColor: Color;
  layers: AnimationLayer[];
  cameras: Camera[];
  lights: Light[];
  workArea: WorkArea;
  motionBlur: boolean;
  depthOfField: boolean;
  threeDimensional: boolean;
  startTime: number;
  endTime: number;
  currentTime: number;
  markers: Marker[];
}

export interface Camera {
  id: string;
  name: string;
  type: '2d' | '3d';
  position: Vector3D;
  pointOfInterest: Vector3D;
  rotation: Vector3D;
  zoom: number;
  focalLength: number;
  aperture: number;
  focusDistance: number;
  blurLevel: number;
  enabled: boolean;
  keyframes: Keyframe[];
}

export interface Light {
  id: string;
  name: string;
  type: 'ambient' | 'directional' | 'point' | 'spot';
  position: Vector3D;
  rotation: Vector3D;
  color: Color;
  intensity: number;
  castsShadows: boolean;
  shadowDarkness: number;
  shadowDiffusion: number;
  enabled: boolean;
  keyframes: Keyframe[];
}

export interface WorkArea {
  startTime: number;
  endTime: number;
  enabled: boolean;
}

// ===== MOTION STATE =====

export interface MotionState {
  compositions: Composition[];
  selectedLayers: string[];
  selectedKeyframes: string[];
  clipboard: {
    layers: AnimationLayer[];
    keyframes: Keyframe[];
    effects: LayerEffect[];
  };
  presets: MotionPreset[];
  templates: MotionTemplate[];
  history: {
    past: MotionState[];
    present: MotionState;
    future: MotionState[];
  };
  isPlaying: boolean;
  isPreviewing: boolean;
  isRecording: boolean;
  isExporting: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  loop: boolean;
  workArea: WorkArea;
  quality: 'draft' | 'preview' | 'final';
  showGrid: boolean;
  showGuides: boolean;
  showRulers: boolean;
  showSafeAreas: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  snapToKeyframes: boolean;
  magneticTimeline: boolean;
}

export interface MotionPreset {
  id: string;
  name: string;
  category: MotionPresetCategory;
  description: string;
  thumbnail: string;
  keyframes: Keyframe[];
  effects: LayerEffect[];
  duration: number;
  tags: string[];
  author: string;
  version: string;
  rating: number;
  downloads: number;
}

export type MotionPresetCategory = 
  | 'text'
  | 'logo'
  | 'transition'
  | 'particle'
  | 'shape'
  | 'effect'
  | 'camera'
  | 'light'
  | 'background'
  | 'overlay'
  | 'lower-third'
  | 'title'
  | 'credits'
  | 'social'
  | 'corporate'
  | 'cinematic'
  | 'broadcast'
  | 'wedding'
  | 'travel'
  | 'sports'
  | 'music'
  | 'gaming'
  | 'tech'
  | 'fashion'
  | 'food'
  | 'nature'
  | 'abstract'
  | 'minimal'
  | 'retro'
  | 'futuristic'
  | 'handdrawn'
  | 'geometric'
  | 'organic'
  | 'grunge'
  | 'elegant'
  | 'playful'
  | 'professional'
  | 'creative'
  | 'experimental';

export interface MotionTemplate {
  id: string;
  name: string;
  category: MotionPresetCategory;
  description: string;
  thumbnail: string;
  composition: Composition;
  placeholders: TemplatePlaceholder[];
  tags: string[];
  author: string;
  version: string;
  rating: number;
  downloads: number;
  price: number;
  free: boolean;
}

export interface TemplatePlaceholder {
  id: string;
  name: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'color' | 'number';
  layerId: string;
  property: string;
  defaultValue: any;
  constraints?: PlaceholderConstraints;
}

export interface PlaceholderConstraints {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  format?: string;
  allowedTypes?: string[];
  required: boolean;
}

// ===== EXPORT TYPES =====

export interface MotionExportSettings {
  format: 'mp4' | 'webm' | 'gif' | 'apng' | 'sequence' | 'lottie' | 'svg';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  width: number;
  height: number;
  frameRate: number;
  bitRate?: number;
  codec?: string;
  startTime: number;
  endTime: number;
  loop: boolean;
  transparent: boolean;
  backgroundColor?: Color;
  includeAudio: boolean;
  audioQuality?: 'low' | 'medium' | 'high';
  audioCodec?: string;
  multiPass: boolean;
  hardwareAcceleration: boolean;
  workArea: boolean;
  selectedLayers: boolean;
  renderSettings: RenderSettings;
}

export interface RenderSettings {
  quality: 'draft' | 'preview' | 'final';
  samples: number;
  motionBlur: boolean;
  depthOfField: boolean;
  effects: boolean;
  shadows: boolean;
  reflections: boolean;
  postProcessing: boolean;
  multiThreading: boolean;
  memoryLimit: number;
  diskCache: boolean;
  networkRendering: boolean;
}

export interface MotionExportProgress {
  progress: number;
  stage: 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'complete';
  currentFrame: number;
  totalFrames: number;
  currentLayer?: string;
  estimatedTime?: number;
  renderTime: number;
  outputSize?: number;
  error?: string;
} 