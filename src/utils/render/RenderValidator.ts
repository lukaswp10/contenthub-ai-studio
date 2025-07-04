/**
 * ✅ RENDER VALIDATOR - ClipsForge Pro
 * 
 * Validador de jobs de renderização
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import { RenderJob } from '../../types/render.types';

export class RenderValidator {
  async validate(job: RenderJob): Promise<void> {
    // Validate basic job properties
    if (!job.id || !job.name) {
      throw new Error('Invalid job: missing id or name');
    }

    if (!job.source || !job.output) {
      throw new Error('Invalid job: missing source or output configuration');
    }

    // Validate source
    this._validateSource(job);

    // Validate output
    this._validateOutput(job);

    // Validate timeline
    this._validateTimeline(job);

    console.log('✅ Job validation passed');
  }

  private _validateSource(job: RenderJob): void {
    const source = job.source;

    if (!source.type) {
      throw new Error('Invalid source: missing type');
    }

    if (source.duration <= 0) {
      throw new Error('Invalid source: duration must be positive');
    }

    if (!source.resolution || source.resolution.width <= 0 || source.resolution.height <= 0) {
      throw new Error('Invalid source: invalid resolution');
    }

    if (source.frameRate <= 0) {
      throw new Error('Invalid source: frame rate must be positive');
    }
  }

  private _validateOutput(job: RenderJob): void {
    const output = job.output;

    if (!output.format) {
      throw new Error('Invalid output: missing format');
    }

    if (!output.codec) {
      throw new Error('Invalid output: missing codec');
    }

    if (!output.resolution || output.resolution.width <= 0 || output.resolution.height <= 0) {
      throw new Error('Invalid output: invalid resolution');
    }

    if (output.frameRate <= 0) {
      throw new Error('Invalid output: frame rate must be positive');
    }

    if (output.bitrate <= 0) {
      throw new Error('Invalid output: bitrate must be positive');
    }

    if (output.audioBitrate <= 0) {
      throw new Error('Invalid output: audio bitrate must be positive');
    }

    if (output.quality < 0 || output.quality > 100) {
      throw new Error('Invalid output: quality must be between 0 and 100');
    }
  }

  private _validateTimeline(job: RenderJob): void {
    const timeline = job.timeline;

    if (!timeline) {
      throw new Error('Invalid job: missing timeline');
    }

    if (timeline.duration <= 0) {
      throw new Error('Invalid timeline: duration must be positive');
    }

    if (timeline.frameRate <= 0) {
      throw new Error('Invalid timeline: frame rate must be positive');
    }

    if (timeline.startTime < 0) {
      throw new Error('Invalid timeline: start time cannot be negative');
    }

    if (timeline.endTime <= timeline.startTime) {
      throw new Error('Invalid timeline: end time must be greater than start time');
    }
  }
} 