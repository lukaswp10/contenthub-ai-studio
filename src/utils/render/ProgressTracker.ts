/**
 * 📊 PROGRESS TRACKER - ClipsForge Pro
 * 
 * Rastreador de progresso para renderização
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import { RenderJob, RenderProgress } from '../../types/render.types';

export class ProgressTracker {
  private _currentJob: RenderJob | null = null;
  private _progress: RenderProgress | null = null;
  private _startTime = 0;

  get progress(): RenderProgress | null {
    return this._progress;
  }

  initialize(job: RenderJob): void {
    this._currentJob = job;
    this._startTime = Date.now();
    
    this._progress = {
      phase: 'preparing',
      percentage: 0,
      currentFrame: 0,
      totalFrames: 0,
      framesPerSecond: 0,
      timeElapsed: 0,
      timeRemaining: 0,
      bytesProcessed: 0,
      bytesTotal: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      temperature: 0,
      message: 'Preparing render...',
      warnings: []
    };

    console.log('📊 Progress tracker initialized');
  }

  updateProgress(percentage: number, currentFrame: number, totalFrames: number): void {
    if (!this._progress) {
      return;
    }

    const timeElapsed = (Date.now() - this._startTime) / 1000;
    const framesPerSecond = currentFrame / timeElapsed;
    const remainingFrames = totalFrames - currentFrame;
    const timeRemaining = remainingFrames / framesPerSecond;

    this._progress = {
      ...this._progress,
      phase: 'rendering',
      percentage,
      currentFrame,
      totalFrames,
      framesPerSecond,
      timeElapsed,
      timeRemaining: isFinite(timeRemaining) ? timeRemaining : 0,
      message: `Rendering frame ${currentFrame} of ${totalFrames}`
    };

    // Call progress callback if available
    if (this._currentJob?.onProgress) {
      this._currentJob.onProgress(this._progress);
    }
  }

  updatePhase(phase: RenderProgress['phase'], message: string): void {
    if (!this._progress) {
      return;
    }

    this._progress = {
      ...this._progress,
      phase,
      message
    };
  }

  reset(): void {
    this._currentJob = null;
    this._progress = null;
    this._startTime = 0;
    console.log('📊 Progress tracker reset');
  }
} 