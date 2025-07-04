/**
 * 🔍 CAPABILITY DETECTOR - ClipsForge Pro
 * 
 * Detecta capacidades do sistema para renderização
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import { RenderCapabilities, VideoFormat, VideoCodec, AudioCodec } from '../../types/render.types';

export class CapabilityDetector {
  private _capabilities: RenderCapabilities | null = null;

  detect(): RenderCapabilities {
    if (this._capabilities) {
      return this._capabilities;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const gl1 = canvas.getContext('webgl');
    
    let audioContext: AudioContext | null = null;
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      // Audio context not available
    }

    this._capabilities = {
      maxResolution: {
        width: gl ? gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0] : 1920,
        height: gl ? gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1] : 1080
      },
      supportedFormats: ['mp4', 'webm', 'mov'] as VideoFormat[],
      supportedCodecs: ['h264', 'vp8', 'vp9'] as VideoCodec[],
      audioCodecs: ['aac', 'mp3', 'ogg'] as AudioCodec[],
      maxBitrate: 50000000, // 50 Mbps
      maxFrameRate: 60,
      hardwareAcceleration: !!gl,
      webWorkersSupport: typeof Worker !== 'undefined',
      webCodecsSupport: 'VideoEncoder' in window && 'VideoDecoder' in window,
      streamingSupport: 'MediaSource' in window,
      batchProcessing: true,
      backgroundRendering: typeof Worker !== 'undefined'
    };

    // Cleanup temporary objects
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    if (gl1) {
      const ext = gl1.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    if (audioContext) {
      audioContext.close();
    }

    return this._capabilities;
  }

  supportsFormat(format: VideoFormat): boolean {
    return this.detect().supportedFormats.includes(format);
  }

  supportsCodec(codec: VideoCodec): boolean {
    return this.detect().supportedCodecs.includes(codec);
  }

  getMaxResolution(): { width: number; height: number } {
    return this.detect().maxResolution;
  }

  hasWebGL2(): boolean {
    return this.detect().hardwareAcceleration;
  }

  hasWebCodecs(): boolean {
    return this.detect().webCodecsSupport;
  }

  hasAudioContext(): boolean {
    // Detect audio context support
    return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  }

  hasWebWorkers(): boolean {
    return this.detect().webWorkersSupport;
  }
} 