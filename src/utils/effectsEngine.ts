/**
 * 🎬 MOTOR DE EFEITOS PROFISSIONAL - ClipsForge Pro
 * 
 * Sistema avançado de efeitos visuais baseado em WebGL
 * Performance otimizada com cache inteligente e GPU acceleration
 * 
 * @version 4.0.0 - FASE 4
 * @author ClipsForge Team
 */

import { 
  BaseEffect, 
  Transition, 
  Keyframe, 
  RenderContext, 
  RenderQuality, 
  PerformanceMetrics,
  EffectCache,
  Shader,
  EffectsEngine as IEffectsEngine
} from '../types/effects.types';

// ===== SHADERS BASE =====

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER_BASE = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_opacity;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    gl_FragColor = color * u_opacity;
  }
`;

// ===== EFFECT SHADERS =====

const EFFECT_SHADERS: Record<string, string> = {
  // Color Effects
  brightness: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_brightness;
    varying vec2 v_texCoord;
    
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      gl_FragColor = vec4(color.rgb + u_brightness, color.a);
    }
  `,
  
  contrast: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_contrast;
    varying vec2 v_texCoord;
    
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      vec3 result = (color.rgb - 0.5) * u_contrast + 0.5;
      gl_FragColor = vec4(result, color.a);
    }
  `,
  
  saturation: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_saturation;
    varying vec2 v_texCoord;
    
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec3 result = mix(vec3(gray), color.rgb, u_saturation);
      gl_FragColor = vec4(result, color.a);
    }
  `,
  
  // Blur Effects
  gaussianBlur: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_blurRadius;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 texelSize = 1.0 / u_resolution;
      vec4 color = vec4(0.0);
      float total = 0.0;
      
      for (float x = -4.0; x <= 4.0; x++) {
        for (float y = -4.0; y <= 4.0; y++) {
          vec2 offset = vec2(x, y) * texelSize * u_blurRadius;
          float weight = exp(-(x*x + y*y) / 8.0);
          color += texture2D(u_texture, v_texCoord + offset) * weight;
          total += weight;
        }
      }
      
      gl_FragColor = color / total;
    }
  `,
  
  // Stylistic Effects
  vintage: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_intensity;
    varying vec2 v_texCoord;
    
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      
      // Sepia tone
      vec3 sepia = vec3(
        dot(color.rgb, vec3(0.393, 0.769, 0.189)),
        dot(color.rgb, vec3(0.349, 0.686, 0.168)),
        dot(color.rgb, vec3(0.272, 0.534, 0.131))
      );
      
      // Vignette
      vec2 center = v_texCoord - 0.5;
      float vignette = 1.0 - dot(center, center) * 2.0;
      
      vec3 result = mix(color.rgb, sepia * vignette, u_intensity);
      gl_FragColor = vec4(result, color.a);
    }
  `,
  
  filmGrain: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform float u_intensity;
    varying vec2 v_texCoord;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      float noise = random(v_texCoord + u_time) * 2.0 - 1.0;
      vec3 result = color.rgb + noise * u_intensity * 0.1;
      gl_FragColor = vec4(result, color.a);
    }
  `
};

// ===== EFFECTS ENGINE =====

export class EffectsEngine implements IEffectsEngine {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private effects: Map<string, BaseEffect> = new Map();
  private transitions: Map<string, Transition> = new Map();
  private shaders: Map<string, WebGLProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private cache: Map<string, EffectCache> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  
  private renderContext: RenderContext | null = null;
  private quality: RenderQuality = 'high';
  private performance: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    renderTime: 0,
    effectsTime: 0,
    memoryUsage: 0,
    warnings: []
  };
  
  private animationFrame: number | null = null;
  private lastFrameTime: number = 0;
  
  // ===== LIFECYCLE =====
  
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    
    // Initialize WebGL context
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!this.gl) {
      throw new Error('WebGL não suportado neste navegador');
    }
    
    // Setup render context
    this.renderContext = {
      canvas,
      gl: this.gl,
      width: canvas.width,
      height: canvas.height,
      currentTime: 0,
      deltaTime: 0,
      frameRate: 60,
      quality: this.quality
    };
    
    // Initialize shaders
    await this.initializeShaders();
    
    // Setup framebuffers
    this.setupFramebuffers();
    
    // Start render loop
    this.startRenderLoop();
    
    console.log('🎬 Effects Engine initialized successfully');
  }
  
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Cleanup WebGL resources
    this.shaders.forEach(shader => this.gl?.deleteProgram(shader));
    this.textures.forEach(texture => this.gl?.deleteTexture(texture));
    this.framebuffers.forEach(fb => this.gl?.deleteFramebuffer(fb));
    
    this.shaders.clear();
    this.textures.clear();
    this.framebuffers.clear();
    this.cache.clear();
    this.eventListeners.clear();
    
    console.log('🎬 Effects Engine destroyed');
  }
  
  // ===== SHADER MANAGEMENT =====
  
  private async initializeShaders(): Promise<void> {
    if (!this.gl) return;
    
    // Create base shader
    const baseShader = this.createShaderProgram(VERTEX_SHADER, FRAGMENT_SHADER_BASE);
    if (baseShader) {
      this.shaders.set('base', baseShader);
    }
    
    // Create effect shaders
    for (const [effectType, fragmentShader] of Object.entries(EFFECT_SHADERS)) {
      const shader = this.createShaderProgram(VERTEX_SHADER, fragmentShader);
      if (shader) {
        this.shaders.set(effectType, shader);
      }
    }
  }
  
  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;
    
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = this.gl.createProgram();
    if (!program) return null;
    
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Shader program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }
  
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  // ===== FRAMEBUFFER SETUP =====
  
  private setupFramebuffers(): void {
    if (!this.gl || !this.canvas) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Create main framebuffer
    const mainFB = this.gl.createFramebuffer();
    const mainTexture = this.gl.createTexture();
    
    if (mainFB && mainTexture) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, mainFB);
      this.gl.bindTexture(this.gl.TEXTURE_2D, mainTexture);
      
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, mainTexture, 0);
      
      this.framebuffers.set('main', mainFB);
      this.textures.set('main', mainTexture);
    }
  }
  
  // ===== EFFECTS MANAGEMENT =====
  
  addEffect(trackId: string, effect: BaseEffect): void {
    this.effects.set(effect.id, effect);
    this.emit('effectAdded', { effectId: effect.id, trackId, effect });
    console.log(`🎨 Effect added: ${effect.name} (${effect.type})`);
  }
  
  removeEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (effect) {
      this.effects.delete(effectId);
      this.clearEffectCache(effectId);
      this.emit('effectRemoved', { effectId, effect });
      console.log(`🗑️ Effect removed: ${effect.name}`);
    }
  }
  
  updateEffect(effectId: string, parameters: Partial<BaseEffect>): void {
    const effect = this.effects.get(effectId);
    if (effect) {
      Object.assign(effect, parameters);
      this.clearEffectCache(effectId);
      this.emit('effectChanged', { effectId, effect, parameters });
    }
  }
  
  // ===== TRANSITIONS MANAGEMENT =====
  
  addTransition(fromTrackId: string, toTrackId: string, transition: Transition): void {
    this.transitions.set(transition.id, transition);
    this.emit('transitionAdded', { transitionId: transition.id, fromTrackId, toTrackId, transition });
    console.log(`🔄 Transition added: ${transition.name} (${transition.type})`);
  }
  
  removeTransition(transitionId: string): void {
    const transition = this.transitions.get(transitionId);
    if (transition) {
      this.transitions.delete(transitionId);
      this.emit('transitionRemoved', { transitionId, transition });
      console.log(`🗑️ Transition removed: ${transition.name}`);
    }
  }
  
  // ===== KEYFRAMES MANAGEMENT =====
  
  addKeyframe(effectId: string, keyframe: Keyframe): void {
    const effect = this.effects.get(effectId);
    if (effect) {
      effect.keyframes.push(keyframe);
      this.emit('keyframeAdded', { effectId, keyframe });
    }
  }
  
  removeKeyframe(keyframeId: string): void {
    for (const effect of this.effects.values()) {
      const index = effect.keyframes.findIndex(kf => kf.id === keyframeId);
      if (index !== -1) {
        const keyframe = effect.keyframes.splice(index, 1)[0];
        this.emit('keyframeRemoved', { effectId: effect.id, keyframe });
        break;
      }
    }
  }
  
  updateKeyframe(keyframeId: string, keyframeData: Partial<Keyframe>): void {
    for (const effect of this.effects.values()) {
      const keyframe = effect.keyframes.find(kf => kf.id === keyframeId);
      if (keyframe) {
        Object.assign(keyframe, keyframeData);
        this.emit('keyframeChanged', { effectId: effect.id, keyframe });
        break;
      }
    }
  }
  
  // ===== RENDERING =====
  
  render(time: number): void {
    if (!this.gl || !this.renderContext) return;
    
    const startTime = performance.now();
    
    // Update render context
    this.renderContext.currentTime = time;
    this.renderContext.deltaTime = time - this.lastFrameTime;
    this.lastFrameTime = time;
    
    // Clear canvas
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Render effects
    this.renderEffects(time);
    
    // Update performance metrics
    const renderTime = performance.now() - startTime;
    this.updatePerformanceMetrics(renderTime);
  }
  
  private renderEffects(time: number): void {
    if (!this.gl) return;
    
    const activeEffects = Array.from(this.effects.values())
      .filter(effect => effect.enabled && time >= effect.startTime && time <= effect.endTime)
      .sort((a, b) => a.startTime - b.startTime);
    
    for (const effect of activeEffects) {
      this.renderEffect(effect, time);
    }
  }
  
  private renderEffect(effect: BaseEffect, time: number): void {
    if (!this.gl) return;
    
    // Check cache
    const cacheKey = this.getCacheKey(effect, time);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      cached.hits++;
      return;
    }
    
    // Get shader program
    const shader = this.shaders.get(effect.type) || this.shaders.get('base');
    if (!shader) return;
    
    this.gl.useProgram(shader);
    
    // Set uniforms
    this.setEffectUniforms(shader, effect, time);
    
    // Render quad
    this.renderQuad();
    
    // Cache result if beneficial
    if (this.shouldCache(effect)) {
      // TODO: Implement texture caching
    }
  }
  
  private setEffectUniforms(shader: WebGLProgram, effect: BaseEffect, time: number): void {
    if (!this.gl) return;
    
    // Set base uniforms
    const timeLocation = this.gl.getUniformLocation(shader, 'u_time');
    if (timeLocation) {
      this.gl.uniform1f(timeLocation, time);
    }
    
    const opacityLocation = this.gl.getUniformLocation(shader, 'u_opacity');
    if (opacityLocation) {
      this.gl.uniform1f(opacityLocation, effect.opacity);
    }
    
    const resolutionLocation = this.gl.getUniformLocation(shader, 'u_resolution');
    if (resolutionLocation && this.canvas) {
      this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    }
    
    // Set effect-specific uniforms
    for (const [paramName, param] of Object.entries(effect.parameters)) {
      const location = this.gl.getUniformLocation(shader, `u_${paramName}`);
      if (location) {
        const value = this.interpolateParameter(param, effect.keyframes, time);
        
        if (typeof value === 'number') {
          this.gl.uniform1f(location, value);
        } else if (Array.isArray(value)) {
          if (value.length === 2) {
            this.gl.uniform2fv(location, value);
          } else if (value.length === 3) {
            this.gl.uniform3fv(location, value);
          } else if (value.length === 4) {
            this.gl.uniform4fv(location, value);
          }
        }
      }
    }
  }
  
  private interpolateParameter(param: any, keyframes: Keyframe[], time: number): any {
    // Find keyframes for this parameter
    const paramKeyframes = keyframes.filter(kf => kf.parameter === param.name);
    
    if (paramKeyframes.length === 0) {
      return param.value;
    }
    
    // Sort by time
    paramKeyframes.sort((a, b) => a.time - b.time);
    
    // Find surrounding keyframes
    let beforeKf = null;
    let afterKf = null;
    
    for (let i = 0; i < paramKeyframes.length; i++) {
      if (paramKeyframes[i].time <= time) {
        beforeKf = paramKeyframes[i];
      }
      if (paramKeyframes[i].time >= time && !afterKf) {
        afterKf = paramKeyframes[i];
        break;
      }
    }
    
    // Interpolate
    if (!beforeKf) return afterKf?.value ?? param.value;
    if (!afterKf) return beforeKf.value;
    if (beforeKf.time === afterKf.time) return beforeKf.value;
    
    const t = (time - beforeKf.time) / (afterKf.time - beforeKf.time);
    const easedT = this.applyEasing(t, beforeKf.easing);
    
    return this.lerp(beforeKf.value, afterKf.value, easedT);
  }
  
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear': return t;
      case 'easeIn': return t * t;
      case 'easeOut': return 1 - (1 - t) * (1 - t);
      case 'easeInOut': return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      default: return t;
    }
  }
  
  private lerp(a: any, b: any, t: number): any {
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * t;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.map((val, i) => val + (b[i] - val) * t);
    }
    return t < 0.5 ? a : b;
  }
  
  private renderQuad(): void {
    if (!this.gl) return;
    
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1
    ]);
    
    const texCoords = new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1
    ]);
    
    // Create and bind position buffer
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    
    const positionLocation = this.gl.getAttribLocation(this.shaders.get('base')!, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    // Create and bind texture coordinate buffer
    const texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    
    const texCoordLocation = this.gl.getAttribLocation(this.shaders.get('base')!, 'a_texCoord');
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    // Draw
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    
    // Cleanup
    this.gl.deleteBuffer(positionBuffer);
    this.gl.deleteBuffer(texCoordBuffer);
  }
  
  // ===== RENDER LOOP =====
  
  private startRenderLoop(): void {
    const loop = (timestamp: number) => {
      this.render(timestamp);
      this.animationFrame = requestAnimationFrame(loop);
    };
    
    this.animationFrame = requestAnimationFrame(loop);
  }
  
  // ===== PERFORMANCE =====
  
  private updatePerformanceMetrics(renderTime: number): void {
    this.performance.renderTime = renderTime;
    this.performance.frameTime = this.renderContext?.deltaTime || 16.67;
    this.performance.fps = 1000 / this.performance.frameTime;
    
    // Memory usage estimation
    this.performance.memoryUsage = (this.cache.size * 4) / 1024; // Rough estimate in MB
  }
  
  setQuality(quality: RenderQuality): void {
    this.quality = quality;
    if (this.renderContext) {
      this.renderContext.quality = quality;
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.performance };
  }
  
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Effects cache cleared');
  }
  
  // ===== CACHE MANAGEMENT =====
  
  private getCacheKey(effect: BaseEffect, time: number): string {
    const params = JSON.stringify(effect.parameters);
    const keyframes = JSON.stringify(effect.keyframes);
    return `${effect.id}_${effect.type}_${time}_${params}_${keyframes}`;
  }
  
  private shouldCache(effect: BaseEffect): boolean {
    // Cache expensive effects or frequently used ones
    return ['gaussianBlur', 'colorGrading', 'lut'].includes(effect.type);
  }
  
  private clearEffectCache(effectId: string): void {
    for (const [key, cache] of this.cache.entries()) {
      if (cache.effectId === effectId) {
        this.cache.delete(key);
      }
    }
  }
  
  // ===== EVENTS =====
  
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

// ===== SINGLETON INSTANCE =====

export const effectsEngine = new EffectsEngine(); 