/**
 * 🔄 RENDER PIPELINE - ClipsForge Pro
 * 
 * Pipeline de renderização principal
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import { RenderJob, RenderResult } from '../../types/render.types';
import { WebGLRenderer } from './WebGLRenderer';
import { AudioProcessor } from './AudioProcessor';
import { WorkerManager } from './WorkerManager';
import { CacheManager } from './CacheManager';
import { ProgressTracker } from './ProgressTracker';
import { ErrorHandler } from './ErrorHandler';

export interface RenderContext {
  webglRenderer: WebGLRenderer;
  audioProcessor: AudioProcessor;
  workerManager: WorkerManager;
  cacheManager: CacheManager;
  progressTracker: ProgressTracker;
  errorHandler: ErrorHandler;
}

export class RenderPipeline {
  private _status: 'idle' | 'rendering' | 'paused' | 'cancelled' = 'idle';

  get status(): string {
    return this._status;
  }

  async execute(job: RenderJob, context: RenderContext): Promise<RenderResult> {
    this._status = 'rendering';
    
    try {
      console.log(`🔄 Starting render pipeline for job: ${job.name}`);

      // Phase 1: Preparation
      await this._prepareRender(job, context);

      // Phase 2: Render frames
      const frameResults = await this._renderFrames(job, context);

      // Phase 3: Process audio
      const audioResult = await this._processAudio(job, context);

      // Phase 4: Finalize
      const result = await this._finalizeRender(job, frameResults, audioResult, context);

      this._status = 'idle';
      return result;

    } catch (error) {
      this._status = 'idle';
      context.errorHandler.addError('PIPELINE_FAILED', error);
      throw error;
    }
  }

  pause(): void {
    if (this._status === 'rendering') {
      this._status = 'paused';
      console.log('🔄 Pipeline paused');
    }
  }

  resume(): void {
    if (this._status === 'paused') {
      this._status = 'rendering';
      console.log('🔄 Pipeline resumed');
    }
  }

  cancel(): void {
    if (this._status === 'rendering' || this._status === 'paused') {
      this._status = 'cancelled';
      console.log('🔄 Pipeline cancelled');
    }
  }

  dispose(): void {
    this._status = 'idle';
    console.log('🔄 Pipeline disposed');
  }

  private async _prepareRender(job: RenderJob, context: RenderContext): Promise<void> {
    console.log('🔧 Preparing render...');
    
    // Initialize progress
    context.progressTracker.initialize(job);

    // Cache preparation
    await context.cacheManager.prepare(job);

    console.log('✅ Render preparation completed');
  }

  private async _renderFrames(job: RenderJob, context: RenderContext): Promise<any[]> {
    console.log('🎬 Rendering frames...');

    const totalFrames = Math.ceil(job.source.duration * job.output.frameRate);
    const frameResults: any[] = [];

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      // Check for pause/cancel
      if (this._status === 'cancelled') {
        throw new Error('Render cancelled');
      }

      if (this._status === 'paused') {
        await this._waitForResume();
      }

      const frameTime = frameIndex / job.output.frameRate;
      
      // Render frame
      const frameData = await this._renderFrame(frameIndex, frameTime, job, context);
      frameResults.push(frameData);

      // Update progress
      const progress = ((frameIndex + 1) / totalFrames) * 100;
      context.progressTracker.updateProgress(progress, frameIndex + 1, totalFrames);
    }

    console.log('✅ Frame rendering completed');
    return frameResults;
  }

  private async _renderFrame(frameIndex: number, frameTime: number, job: RenderJob, context: RenderContext): Promise<any> {
    // Check cache first
    const cacheKey = `frame_${frameIndex}_${frameTime}`;
    const cached = await context.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Render frame
    const frameData = {
      frameIndex,
      frameTime,
      width: job.output.resolution.width,
      height: job.output.resolution.height
    };

    let result: any;

    // Use WebGL renderer if available
    if (context.webglRenderer.initialized) {
      result = await context.webglRenderer.renderFrame(frameData);
    } else {
      // Fallback to worker or sync rendering
      result = await context.workerManager.processTask(frameData);
    }

    // Cache result
    await context.cacheManager.set(cacheKey, result);

    return result;
  }

  private async _processAudio(job: RenderJob, context: RenderContext): Promise<AudioBuffer | null> {
    if (!job.audio || !job.audio.tracks || job.audio.tracks.length === 0) {
      return null;
    }

    console.log('🎵 Processing audio...');

    const audioData = {
      duration: job.source.duration,
      tracks: job.audio.tracks,
      sampleRate: job.audio.sampleRate || 44100,
      channels: 2
    };

    const audioBuffer = await context.audioProcessor.processAudio(audioData);
    
    console.log('✅ Audio processing completed');
    return audioBuffer;
  }

  private async _finalizeRender(job: RenderJob, frameResults: any[], audioResult: AudioBuffer | null, context: RenderContext): Promise<RenderResult> {
    console.log('🎯 Finalizing render...');

    // Create output blob (placeholder)
    const outputBlob = new Blob(['rendered video data'], { type: 'video/mp4' });

    const result: RenderResult = {
      id: this._generateId(),
      jobId: job.id,
      status: 'success',
      output: {
        filename: job.output.filename || 'output.mp4',
        url: URL.createObjectURL(outputBlob),
        blob: outputBlob,
        size: outputBlob.size,
        format: job.output.format,
        codec: job.output.codec,
        resolution: job.output.resolution,
        duration: job.source.duration,
        frameRate: job.output.frameRate,
        bitrate: job.output.bitrate,
        audioBitrate: job.output.audioBitrate,
        quality: job.output.quality,
        metadata: {}
      },
      statistics: {
        totalFrames: frameResults.length,
        renderTime: 0, // Will be calculated
        averageFPS: 0,
        peakMemoryUsage: 0,
        averageCPUUsage: 0,
        averageGPUUsage: 0,
        cacheHitRate: 0,
        compressionRatio: 0.8,
        qualityScore: 85,
        errorCount: 0,
        warningCount: 0
      },
      metadata: {
        renderEngine: 'ClipsForge Render Engine',
        renderVersion: '8.0.0',
        renderSettings: {} as any,
        systemInfo: {} as any,
        performance: {} as any,
        timestamp: new Date()
      },
      createdAt: job.createdAt,
      completedAt: new Date()
    };

    console.log('✅ Render finalized');
    return result;
  }

  private async _waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      const checkStatus = () => {
        if (this._status === 'rendering') {
          resolve();
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }

  private _generateId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 