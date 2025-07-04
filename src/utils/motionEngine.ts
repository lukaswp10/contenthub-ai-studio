/**
 * 🎨 MOTION ENGINE - ClipsForge Pro
 * 
 * Sistema avançado de motion graphics baseado em Canvas/WebGL
 * Suporte completo para animações, keyframes e efeitos visuais
 * 
 * @version 5.0.0 - FASE 5
 * @author ClipsForge Team
 */

import {
  Animation,
  Keyframe,
  AnimationLayer,
  Composition,
  Transform,
  Vector2D,
  Vector3D,
  Color,
  EasingFunction,
  LayerType,
  LayerEffect,
  MotionState,
  MotionPreset,
  MotionTemplate,
  MotionExportSettings,
  MotionExportProgress,
  RenderSettings
} from '../types/motion.types';

// ===== MOTION ENGINE CLASS =====

export class MotionEngine {
  private static instance: MotionEngine | null = null;
  
  // Core Canvas and Context
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private webglContext: WebGLRenderingContext | null = null;
  
  // Animation System
  private compositions: Map<string, Composition> = new Map();
  private activeComposition: Composition | null = null;
  private animationFrame: number | null = null;
  
  // Timing and Playback
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private currentTime: number = 0;
  private lastFrameTime: number = 0;
  private frameRate: number = 30;
  private duration: number = 10; // seconds
  
  // Performance
  private performanceMetrics = {
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    drawCalls: 0,
    layersRendered: 0
  };
  
  // State
  private selectedLayers: string[] = [];
  private selectedKeyframes: string[] = [];
  private presets: MotionPreset[] = [];
  private templates: MotionTemplate[] = [];
  
  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();
  
  // ===== CONSTRUCTOR =====
  
  private constructor() {
    this.initializeEventListeners();
  }
  
  // ===== SINGLETON PATTERN =====
  
  public static getInstance(): MotionEngine {
    if (!MotionEngine.instance) {
      MotionEngine.instance = new MotionEngine();
    }
    return MotionEngine.instance;
  }
  
  // ===== INITIALIZATION =====
  
  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    
    // Try to get WebGL context first, fallback to 2D
    try {
      this.webglContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (this.webglContext) {
        console.log('🎨 Motion Engine initialized with WebGL');
        this.initializeWebGL();
      } else {
        throw new Error('WebGL not supported');
      }
    } catch (error) {
      console.warn('WebGL not available, falling back to 2D:', error);
      this.context = canvas.getContext('2d');
      if (this.context) {
        console.log('🎨 Motion Engine initialized with Canvas 2D');
        this.initialize2D();
      } else {
        throw new Error('Neither WebGL nor Canvas 2D is supported');
      }
    }
    
    // Set canvas size
    this.resizeCanvas(1920, 1080);
    
    // Start render loop
    this.startRenderLoop();
    
    this.emitEvent('engine_initialized', { hasWebGL: !!this.webglContext });
  }
  
  private initializeWebGL(): void {
    if (!this.webglContext) return;
    
    const gl = this.webglContext;
    
    // Set clear color to transparent
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Enable depth testing for 3D
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }
  
  private initialize2D(): void {
    if (!this.context) return;
    
    // Set up 2D context properties
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
  }
  
  // ===== CANVAS MANAGEMENT =====
  
  public resizeCanvas(width: number, height: number): void {
    if (!this.canvas) return;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Update viewport for WebGL
    if (this.webglContext) {
      this.webglContext.viewport(0, 0, width, height);
    }
    
    this.emitEvent('canvas_resized', { width, height });
  }
  
  public getCanvasSize(): { width: number; height: number } {
    return {
      width: this.canvas?.width || 0,
      height: this.canvas?.height || 0
    };
  }
  
  // ===== COMPOSITION MANAGEMENT =====
  
  public createComposition(config: Partial<Composition>): Composition {
    const composition: Composition = {
      id: config.id || `comp_${Date.now()}`,
      name: config.name || 'New Composition',
      width: config.width || 1920,
      height: config.height || 1080,
      duration: config.duration || 10,
      frameRate: config.frameRate || 30,
      backgroundColor: config.backgroundColor || { r: 0, g: 0, b: 0, a: 1 },
      layers: config.layers || [],
      cameras: config.cameras || [],
      lights: config.lights || [],
      workArea: config.workArea || { startTime: 0, endTime: 10, enabled: false },
      motionBlur: config.motionBlur || false,
      depthOfField: config.depthOfField || false,
      threeDimensional: config.threeDimensional || false,
      startTime: config.startTime || 0,
      endTime: config.endTime || 10,
      currentTime: config.currentTime || 0,
      markers: config.markers || []
    };
    
    this.compositions.set(composition.id, composition);
    
    if (!this.activeComposition) {
      this.setActiveComposition(composition.id);
    }
    
    this.emitEvent('composition_created', { compositionId: composition.id });
    
    return composition;
  }
  
  public setActiveComposition(compositionId: string): void {
    const composition = this.compositions.get(compositionId);
    if (composition) {
      this.activeComposition = composition;
      this.currentTime = composition.currentTime;
      this.duration = composition.duration;
      this.frameRate = composition.frameRate;
      
      // Resize canvas to match composition
      this.resizeCanvas(composition.width, composition.height);
      
      this.emitEvent('composition_changed', { compositionId });
    }
  }
  
  public getActiveComposition(): Composition | null {
    return this.activeComposition;
  }
  
  public getComposition(compositionId: string): Composition | undefined {
    return this.compositions.get(compositionId);
  }
  
  // ===== LAYER MANAGEMENT =====
  
  public addLayer(layer: AnimationLayer): void {
    if (!this.activeComposition) return;
    
    this.activeComposition.layers.push(layer);
    this.emitEvent('layer_added', { layerId: layer.id, compositionId: this.activeComposition.id });
  }
  
  public removeLayer(layerId: string): void {
    if (!this.activeComposition) return;
    
    const index = this.activeComposition.layers.findIndex(l => l.id === layerId);
    if (index > -1) {
      this.activeComposition.layers.splice(index, 1);
      this.emitEvent('layer_removed', { layerId, compositionId: this.activeComposition.id });
    }
  }
  
  public getLayer(layerId: string): AnimationLayer | undefined {
    if (!this.activeComposition) return undefined;
    
    return this.activeComposition.layers.find(l => l.id === layerId);
  }
  
  public updateLayer(layerId: string, updates: Partial<AnimationLayer>): void {
    const layer = this.getLayer(layerId);
    if (layer) {
      Object.assign(layer, updates);
      this.emitEvent('layer_updated', { layerId, updates });
    }
  }
  
  // ===== KEYFRAME MANAGEMENT =====
  
  public addKeyframe(layerId: string, keyframe: Keyframe): void {
    const layer = this.getLayer(layerId);
    if (layer) {
      layer.keyframes.push(keyframe);
      layer.keyframes.sort((a, b) => a.time - b.time);
      this.emitEvent('keyframe_added', { layerId, keyframeId: keyframe.id });
    }
  }
  
  public removeKeyframe(layerId: string, keyframeId: string): void {
    const layer = this.getLayer(layerId);
    if (layer) {
      const index = layer.keyframes.findIndex(k => k.id === keyframeId);
      if (index > -1) {
        layer.keyframes.splice(index, 1);
        this.emitEvent('keyframe_removed', { layerId, keyframeId });
      }
    }
  }
  
  public updateKeyframe(layerId: string, keyframe: Keyframe): void {
    const layer = this.getLayer(layerId);
    if (layer) {
      const index = layer.keyframes.findIndex(k => k.id === keyframe.id);
      if (index > -1) {
        layer.keyframes[index] = keyframe;
        layer.keyframes.sort((a, b) => a.time - b.time);
        this.emitEvent('keyframe_updated', { layerId, keyframeId: keyframe.id });
      }
    }
  }
  
  // ===== ANIMATION AND INTERPOLATION =====
  
  public interpolateProperty(keyframes: Keyframe[], property: string, time: number): any {
    if (keyframes.length === 0) return undefined;
    
    // Find surrounding keyframes
    let beforeKeyframe: Keyframe | null = null;
    let afterKeyframe: Keyframe | null = null;
    
    for (let i = 0; i < keyframes.length; i++) {
      const kf = keyframes[i];
      if (kf.time <= time) {
        beforeKeyframe = kf;
      }
      if (kf.time >= time && !afterKeyframe) {
        afterKeyframe = kf;
        break;
      }
    }
    
    // If we're before the first keyframe
    if (!beforeKeyframe && afterKeyframe) {
      return afterKeyframe.properties[property];
    }
    
    // If we're after the last keyframe
    if (beforeKeyframe && !afterKeyframe) {
      return beforeKeyframe.properties[property];
    }
    
    // If we have both keyframes, interpolate
    if (beforeKeyframe && afterKeyframe && beforeKeyframe !== afterKeyframe) {
      const t = (time - beforeKeyframe.time) / (afterKeyframe.time - beforeKeyframe.time);
      const easedT = this.applyEasing(t, beforeKeyframe.easing);
      
      return this.interpolateValue(
        beforeKeyframe.properties[property],
        afterKeyframe.properties[property],
        easedT
      );
    }
    
    // If we're exactly on a keyframe
    if (beforeKeyframe) {
      return beforeKeyframe.properties[property];
    }
    
    return undefined;
  }
  
  private interpolateValue(from: any, to: any, t: number): any {
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * t;
    }
    
    if (this.isVector2D(from) && this.isVector2D(to)) {
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      };
    }
    
    if (this.isVector3D(from) && this.isVector3D(to)) {
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        z: from.z + (to.z - from.z) * t
      };
    }
    
    if (this.isColor(from) && this.isColor(to)) {
      return {
        r: from.r + (to.r - from.r) * t,
        g: from.g + (to.g - from.g) * t,
        b: from.b + (to.b - from.b) * t,
        a: from.a + (to.a - from.a) * t
      };
    }
    
    // For non-interpolatable values, use step interpolation
    return t < 0.5 ? from : to;
  }
  
  private applyEasing(t: number, easing: EasingFunction): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease':
        return t * t * (3 - 2 * t);
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      case 'bounce':
        return this.bounceEasing(t);
      case 'elastic':
        return this.elasticEasing(t);
      case 'back':
        return this.backEasing(t);
      default:
        return t;
    }
  }
  
  private bounceEasing(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
  
  private elasticEasing(t: number): number {
    return Math.sin(13 * Math.PI / 2 * t) * Math.pow(2, 10 * (t - 1));
  }
  
  private backEasing(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }
  
  // ===== PLAYBACK CONTROL =====
  
  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.isPaused = false;
      this.lastFrameTime = performance.now();
      this.emitEvent('playback_started', { time: this.currentTime });
    }
  }
  
  public pause(): void {
    this.isPlaying = false;
    this.isPaused = true;
    this.emitEvent('playback_paused', { time: this.currentTime });
  }
  
  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.emitEvent('playback_stopped', { time: this.currentTime });
  }
  
  public seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.duration, time));
    if (this.activeComposition) {
      this.activeComposition.currentTime = this.currentTime;
    }
    this.emitEvent('time_changed', { time: this.currentTime });
  }
  
  public setFrameRate(fps: number): void {
    this.frameRate = Math.max(1, Math.min(120, fps));
    if (this.activeComposition) {
      this.activeComposition.frameRate = this.frameRate;
    }
  }
  
  // ===== RENDERING =====
  
  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      this.update(timestamp);
      this.render();
      this.animationFrame = requestAnimationFrame(render);
    };
    
    this.animationFrame = requestAnimationFrame(render);
  }
  
  private update(timestamp: number): void {
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Update performance metrics
    this.performanceMetrics.frameTime = deltaTime;
    this.performanceMetrics.fps = 1000 / deltaTime;
    
    // Update time if playing
    if (this.isPlaying) {
      this.currentTime += deltaTime / 1000;
      
      // Loop or stop at end
      if (this.currentTime >= this.duration) {
        this.currentTime = 0; // Loop for now
      }
      
      if (this.activeComposition) {
        this.activeComposition.currentTime = this.currentTime;
      }
    }
  }
  
  private render(): void {
    const startTime = performance.now();
    
    if (this.webglContext) {
      this.renderWebGL();
    } else if (this.context) {
      this.render2D();
    }
    
    this.performanceMetrics.renderTime = performance.now() - startTime;
  }
  
  private renderWebGL(): void {
    if (!this.webglContext || !this.activeComposition) return;
    
    const gl = this.webglContext;
    
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Render background
    this.renderBackground(gl);
    
    // Render layers
    this.renderLayers(gl);
    
    this.performanceMetrics.drawCalls = this.activeComposition.layers.length;
  }
  
  private render2D(): void {
    if (!this.context || !this.activeComposition) return;
    
    const ctx = this.context;
    
    // Clear the canvas
    ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
    
    // Render background
    this.renderBackground2D(ctx);
    
    // Render layers
    this.renderLayers2D(ctx);
    
    this.performanceMetrics.layersRendered = this.activeComposition.layers.length;
  }
  
  private renderBackground(gl: WebGLRenderingContext): void {
    if (!this.activeComposition) return;
    
    const bg = this.activeComposition.backgroundColor;
    gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  
  private renderBackground2D(ctx: CanvasRenderingContext2D): void {
    if (!this.activeComposition) return;
    
    const bg = this.activeComposition.backgroundColor;
    ctx.fillStyle = `rgba(${bg.r * 255}, ${bg.g * 255}, ${bg.b * 255}, ${bg.a})`;
    ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
  }
  
  private renderLayers(gl: WebGLRenderingContext): void {
    if (!this.activeComposition) return;
    
    // Sort layers by z-index (not implemented yet, using order)
    const visibleLayers = this.activeComposition.layers
      .filter(layer => layer.visible && this.isLayerInTimeRange(layer))
      .sort((a, b) => a.startTime - b.startTime);
    
    for (const layer of visibleLayers) {
      this.renderLayer(gl, layer);
    }
  }
  
  private renderLayers2D(ctx: CanvasRenderingContext2D): void {
    if (!this.activeComposition) return;
    
    // Sort layers by z-index (not implemented yet, using order)
    const visibleLayers = this.activeComposition.layers
      .filter(layer => layer.visible && this.isLayerInTimeRange(layer))
      .sort((a, b) => a.startTime - b.startTime);
    
    for (const layer of visibleLayers) {
      this.renderLayer2D(ctx, layer);
    }
  }
  
  private renderLayer(gl: WebGLRenderingContext, layer: AnimationLayer): void {
    // Get animated transform
    const transform = this.getAnimatedTransform(layer);
    
    // Apply transform and render based on layer type
    switch (layer.type) {
      case 'shape':
        this.renderShapeLayer(gl, layer, transform);
        break;
      case 'text':
        this.renderTextLayer(gl, layer, transform);
        break;
      case 'solid':
        this.renderSolidLayer(gl, layer, transform);
        break;
      default:
        // Placeholder for other layer types
        break;
    }
  }
  
  private renderLayer2D(ctx: CanvasRenderingContext2D, layer: AnimationLayer): void {
    // Get animated transform
    const transform = this.getAnimatedTransform(layer);
    
    // Save context state
    ctx.save();
    
    // Apply transform
    this.applyTransform2D(ctx, transform);
    
    // Apply opacity
    ctx.globalAlpha = transform.opacity;
    
    // Render based on layer type
    switch (layer.type) {
      case 'shape':
        this.renderShapeLayer2D(ctx, layer, transform);
        break;
      case 'text':
        this.renderTextLayer2D(ctx, layer, transform);
        break;
      case 'solid':
        this.renderSolidLayer2D(ctx, layer, transform);
        break;
      default:
        // Placeholder for other layer types
        break;
    }
    
    // Restore context state
    ctx.restore();
  }
  
  private getAnimatedTransform(layer: AnimationLayer): Transform {
    const baseTransform = layer.transform;
    
    // Interpolate animated properties
    const position = this.interpolateProperty(layer.keyframes, 'position', this.currentTime) || baseTransform.position;
    const scale = this.interpolateProperty(layer.keyframes, 'scale', this.currentTime) || baseTransform.scale;
    const rotation = this.interpolateProperty(layer.keyframes, 'rotation', this.currentTime) || baseTransform.rotation;
    const opacity = this.interpolateProperty(layer.keyframes, 'opacity', this.currentTime) || baseTransform.opacity;
    
    return {
      position,
      scale,
      rotation,
      anchor: baseTransform.anchor,
      opacity,
      skew: baseTransform.skew,
      skewAxis: baseTransform.skewAxis
    };
  }
  
  private applyTransform2D(ctx: CanvasRenderingContext2D, transform: Transform): void {
    // Translate to position
    ctx.translate(transform.position.x, transform.position.y);
    
    // Rotate (convert from degrees to radians)
    if (transform.rotation.z !== 0) {
      ctx.rotate(transform.rotation.z * Math.PI / 180);
    }
    
    // Scale
    ctx.scale(transform.scale.x, transform.scale.y);
  }
  
  private renderShapeLayer(gl: WebGLRenderingContext, layer: AnimationLayer, transform: Transform): void {
    // WebGL shape rendering would require shaders and buffers
    // This is a placeholder for the WebGL implementation
  }
  
  private renderShapeLayer2D(ctx: CanvasRenderingContext2D, layer: AnimationLayer, transform: Transform): void {
    // Simple rectangle for now
    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.fillRect(-50, -50, 100, 100);
  }
  
  private renderTextLayer(gl: WebGLRenderingContext, layer: AnimationLayer, transform: Transform): void {
    // WebGL text rendering would require texture-based approach
    // This is a placeholder for the WebGL implementation
  }
  
  private renderTextLayer2D(ctx: CanvasRenderingContext2D, layer: AnimationLayer, transform: Transform): void {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(layer.name || 'Text Layer', 0, 0);
  }
  
  private renderSolidLayer(gl: WebGLRenderingContext, layer: AnimationLayer, transform: Transform): void {
    // WebGL solid rendering
    // This is a placeholder for the WebGL implementation
  }
  
  private renderSolidLayer2D(ctx: CanvasRenderingContext2D, layer: AnimationLayer, transform: Transform): void {
    ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
    ctx.fillRect(-100, -100, 200, 200);
  }
  
  private isLayerInTimeRange(layer: AnimationLayer): boolean {
    return this.currentTime >= layer.startTime && this.currentTime <= layer.endTime;
  }
  
  // ===== UTILITY METHODS =====
  
  private isVector2D(obj: any): obj is Vector2D {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number';
  }
  
  private isVector3D(obj: any): obj is Vector3D {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number';
  }
  
  private isColor(obj: any): obj is Color {
    return obj && typeof obj.r === 'number' && typeof obj.g === 'number' && 
           typeof obj.b === 'number' && typeof obj.a === 'number';
  }
  
  // ===== EVENT SYSTEM =====
  
  private initializeEventListeners(): void {
    const eventTypes = [
      'engine_initialized', 'canvas_resized', 'composition_created', 'composition_changed',
      'layer_added', 'layer_removed', 'layer_updated', 'keyframe_added', 'keyframe_removed',
      'keyframe_updated', 'playback_started', 'playback_paused', 'playback_stopped', 'time_changed'
    ];
    
    eventTypes.forEach(type => {
      this.eventListeners.set(type, []);
    });
  }
  
  public addEventListener(type: string, callback: Function): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.push(callback);
    }
  }
  
  public removeEventListener(type: string, callback: Function): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  private emitEvent(type: string, data?: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type, data, timestamp: Date.now() });
        } catch (error) {
          console.error('Error in motion event listener:', error);
        }
      });
    }
  }
  
  // ===== PUBLIC API =====
  
  public getCurrentTime(): number {
    return this.currentTime;
  }
  
  public getDuration(): number {
    return this.duration;
  }
  
  public getFrameRate(): number {
    return this.frameRate;
  }
  
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }
  
  public getSelectedLayers(): string[] {
    return [...this.selectedLayers];
  }
  
  public setSelectedLayers(layerIds: string[]): void {
    this.selectedLayers = layerIds;
    this.emitEvent('selection_changed', { selectedLayers: this.selectedLayers });
  }
  
  public getSelectedKeyframes(): string[] {
    return [...this.selectedKeyframes];
  }
  
  public setSelectedKeyframes(keyframeIds: string[]): void {
    this.selectedKeyframes = keyframeIds;
    this.emitEvent('keyframe_selection_changed', { selectedKeyframes: this.selectedKeyframes });
  }
  
  // ===== CLEANUP =====
  
  public dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.stop();
    this.compositions.clear();
    this.eventListeners.clear();
    
    this.canvas = null;
    this.context = null;
    this.webglContext = null;
    
    MotionEngine.instance = null;
  }
}

// ===== EXPORT =====

export const motionEngine = MotionEngine.getInstance(); 