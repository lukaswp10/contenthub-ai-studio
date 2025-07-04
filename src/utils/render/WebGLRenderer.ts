/**
 * 🎨 WEBGL RENDERER - ClipsForge Pro
 * 
 * Renderizador WebGL para aceleração GPU
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

export class WebGLRenderer {
  private _canvas: HTMLCanvasElement | null = null;
  private _gl: WebGL2RenderingContext | null = null;
  private _initialized = false;

  get gl(): WebGL2RenderingContext | null {
    return this._gl;
  }

  get canvas(): HTMLCanvasElement | null {
    return this._canvas;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  async initialize(canvas?: HTMLCanvasElement): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      this._canvas = canvas || document.createElement('canvas');
      this._canvas.width = 1920;
      this._canvas.height = 1080;

      this._gl = this._canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      });

      if (!this._gl) {
        throw new Error('Failed to initialize WebGL2 context');
      }

      this._initialized = true;
      console.log('🎨 WebGL2 renderer initialized');

    } catch (error) {
      console.warn('⚠️ WebGL2 initialization failed:', error);
      this._initialized = false;
      throw error;
    }
  }

  renderFrame(frameData: any): Promise<ImageData | null> {
    if (!this._gl || !this._canvas) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const ctx = this._canvas!.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this._canvas!.width, this._canvas!.height);

      // Render frame content (placeholder)
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Frame ${frameData.frameIndex || 0}`, this._canvas!.width / 2, this._canvas!.height / 2);

      const imageData = ctx.getImageData(0, 0, this._canvas!.width, this._canvas!.height);
      resolve(imageData);
    });
  }

  dispose(): void {
    if (this._gl) {
      const ext = this._gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      this._gl = null;
    }
    
    this._canvas = null;
    this._initialized = false;
    console.log('🎨 WebGL renderer disposed');
  }
} 