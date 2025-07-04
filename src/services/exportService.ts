/**
 * 📤 EXPORT SERVICE - ClipsForge Pro
 * 
 * Serviço de exportação profissional usando FFmpeg.wasm
 * Processa apenas segmentos selecionados
 * Aplica overlays e legendas
 * 
 * @version 7.1.0 - FASE 7
 * @author ClipsForge Team
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { VideoSegment, Subtitle, Overlay, ExportSettings } from '../types/video-editor';

// ===== TYPES =====

export interface ExportJob {
  id: string;
  segments: VideoSegment[];
  subtitles?: Subtitle[];
  overlays?: Overlay[];
  settings: ExportSettings;
  onProgress?: (progress: number) => void;
  onComplete?: (result: ExportResult) => void;
  onError?: (error: string) => void;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  duration: number;
  size: number;
  format: string;
  settings: ExportSettings;
}

export interface ExportProgress {
  phase: 'initializing' | 'loading' | 'processing' | 'encoding' | 'finalizing';
  progress: number; // 0-100
  currentSegment?: number;
  totalSegments?: number;
  eta?: number; // seconds
  message?: string;
}

export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

// ===== EXPORT PRESETS =====

const EXPORT_PRESETS = {
  // Social Media Presets
  tiktok: {
    format: 'mp4' as const,
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    bitrate: 8000000,
    codec: 'h264' as const,
    audioCodec: 'aac' as const,
    quality: 'high' as ExportQuality
  },
  instagram: {
    format: 'mp4' as const,
    resolution: { width: 1080, height: 1080 },
    fps: 30,
    bitrate: 6000000,
    codec: 'h264' as const,
    audioCodec: 'aac' as const,
    quality: 'high' as ExportQuality
  },
  youtube: {
    format: 'mp4' as const,
    resolution: { width: 1920, height: 1080 },
    fps: 60,
    bitrate: 12000000,
    codec: 'h264' as const,
    audioCodec: 'aac' as const,
    quality: 'ultra' as ExportQuality
  },
  twitter: {
    format: 'mp4' as const,
    resolution: { width: 1280, height: 720 },
    fps: 30,
    bitrate: 5000000,
    codec: 'h264' as const,
    audioCodec: 'aac' as const,
    quality: 'medium' as ExportQuality
  },
  // Quality Presets
  low: {
    format: 'mp4' as const,
    resolution: { width: 854, height: 480 },
    fps: 24,
    bitrate: 1000000,
    codec: 'h264' as const,
    audioCodec: 'aac' as const,
    quality: 'low' as ExportQuality
  },
  medium: {
    format: 'mp4' as const,
    resolution: { width: 1280, height: 720 },
    fps: 30,
    bitrate: 3000000,
    codec: 'h264' as const,
    audioCodec: 'aac' as const,
    quality: 'medium' as ExportQuality
  },
  high: {
    format: 'mp4' as const,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    bitrate: 8000000,
    codec: 'h264' as const,
    audioCodec: 'aac' as const,
    quality: 'high' as ExportQuality
  },
  ultra: {
    format: 'mp4' as const,
    resolution: { width: 3840, height: 2160 },
    fps: 60,
    bitrate: 25000000,
    codec: 'h264' as const,
    audioCodec: 'aac' as const,
    quality: 'ultra' as ExportQuality
  }
};

// ===== EXPORT SERVICE CLASS =====

export class ExportService {
  private ffmpeg: FFmpeg;
  private initialized = false;
  private currentJob: ExportJob | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  // ===== INITIALIZATION =====

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load FFmpeg with progress tracking
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js`, 'text/javascript')
      });

      this.initialized = true;
      console.log('✅ FFmpeg.wasm initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize FFmpeg.wasm:', error);
      throw new Error('Failed to initialize video export engine');
    }
  }

  // ===== EXPORT METHODS =====

  async exportVideo(job: ExportJob): Promise<ExportResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.currentJob = job;
    this.abortController = new AbortController();

    try {
      const startTime = Date.now();
      
      // Phase 1: Initialize
      this.reportProgress({
        phase: 'initializing',
        progress: 0,
        message: 'Initializing export...'
      });

      // Phase 2: Load input files
      this.reportProgress({
        phase: 'loading',
        progress: 10,
        message: 'Loading video segments...'
      });

      const inputFiles = await this.loadInputFiles(job.segments);
      
      // Phase 3: Process segments
      this.reportProgress({
        phase: 'processing',
        progress: 30,
        message: 'Processing video segments...'
      });

      const processedSegments = await this.processSegments(inputFiles, job);
      
      // Phase 4: Apply overlays and subtitles
      if (job.overlays?.length || job.subtitles?.length) {
        this.reportProgress({
          phase: 'processing',
          progress: 60,
          message: 'Applying overlays and subtitles...'
        });

        await this.applyOverlaysAndSubtitles(processedSegments, job);
      }

      // Phase 5: Encode final video
      this.reportProgress({
        phase: 'encoding',
        progress: 80,
        message: 'Encoding final video...'
      });

      const outputBlob = await this.encodeVideo(processedSegments, job.settings);

      // Phase 6: Finalize
      this.reportProgress({
        phase: 'finalizing',
        progress: 100,
        message: 'Export complete!'
      });

      const duration = (Date.now() - startTime) / 1000;
      const url = URL.createObjectURL(outputBlob);

      const result: ExportResult = {
        blob: outputBlob,
        url,
        duration,
        size: outputBlob.size,
        format: job.settings.format,
        settings: job.settings
      };

      if (job.onComplete) {
        job.onComplete(result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      console.error('❌ Export failed:', errorMessage);
      
      if (job.onError) {
        job.onError(errorMessage);
      }
      
      throw error;
    } finally {
      this.currentJob = null;
      this.abortController = null;
    }
  }

  // ===== PRESET METHODS =====

  getPreset(name: keyof typeof EXPORT_PRESETS): ExportSettings {
    const preset = EXPORT_PRESETS[name];
    if (!preset) {
      throw new Error(`Unknown export preset: ${name}`);
    }
    return {
      ...preset,
      includeSubtitles: true
    };
  }

  getAvailablePresets(): Array<{ name: string; label: string; settings: ExportSettings }> {
    return [
      { name: 'tiktok', label: 'TikTok (9:16)', settings: this.getPreset('tiktok') },
      { name: 'instagram', label: 'Instagram (1:1)', settings: this.getPreset('instagram') },
      { name: 'youtube', label: 'YouTube (16:9)', settings: this.getPreset('youtube') },
      { name: 'twitter', label: 'Twitter (16:9)', settings: this.getPreset('twitter') },
      { name: 'low', label: 'Low Quality (480p)', settings: this.getPreset('low') },
      { name: 'medium', label: 'Medium Quality (720p)', settings: this.getPreset('medium') },
      { name: 'high', label: 'High Quality (1080p)', settings: this.getPreset('high') },
      { name: 'ultra', label: 'Ultra Quality (4K)', settings: this.getPreset('ultra') }
    ];
  }

  // ===== UTILITY METHODS =====

  async abortExport(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      console.log('🛑 Export aborted by user');
    }
  }

  isExporting(): boolean {
    return this.currentJob !== null;
  }

  getCurrentJob(): ExportJob | null {
    return this.currentJob;
  }

  // ===== PRIVATE METHODS =====

  private reportProgress(progress: ExportProgress): void {
    if (this.currentJob?.onProgress) {
      this.currentJob.onProgress(progress.progress);
    }
    console.log(`📊 Export Progress: ${progress.phase} - ${progress.progress}% - ${progress.message}`);
  }

  private async loadInputFiles(segments: VideoSegment[]): Promise<string[]> {
    const inputFiles: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (!segment.url && !segment.file) {
        throw new Error(`Segment ${i} has no video source`);
      }

      const fileName = `input_${i}.mp4`;
      
      if (segment.file) {
        // Load from File object
        await this.ffmpeg.writeFile(fileName, await fetchFile(segment.file));
      } else if (segment.url) {
        // Load from URL
        await this.ffmpeg.writeFile(fileName, await fetchFile(segment.url));
      }

      inputFiles.push(fileName);
    }

    return inputFiles;
  }

  private async processSegments(inputFiles: string[], job: ExportJob): Promise<string[]> {
    const processedFiles: string[] = [];

    for (let i = 0; i < inputFiles.length; i++) {
      const inputFile = inputFiles[i];
      const segment = job.segments[i];
      const outputFile = `processed_${i}.mp4`;

      // Build FFmpeg command for segment processing
      const args = ['-i', inputFile];

      // Apply segment trimming
      if (segment.trimIn !== undefined && segment.trimOut !== undefined) {
        args.push('-ss', segment.trimIn.toString());
        args.push('-to', segment.trimOut.toString());
      } else if (segment.startTime !== undefined && segment.endTime !== undefined) {
        const duration = segment.endTime - segment.startTime;
        args.push('-ss', segment.startTime.toString());
        args.push('-t', duration.toString());
      }

      // Apply speed adjustment
      if (segment.speed && segment.speed !== 1) {
        const videoSpeed = 1 / segment.speed;
        const audioSpeed = segment.speed;
        args.push('-filter_complex', `[0:v]setpts=${videoSpeed}*PTS[v];[0:a]atempo=${audioSpeed}[a]`);
        args.push('-map', '[v]', '-map', '[a]');
      }

      // Apply volume adjustment
      if (segment.volume !== undefined && segment.volume !== 1) {
        args.push('-af', `volume=${segment.volume}`);
      }

      // Mute audio if needed
      if (segment.muted) {
        args.push('-an');
      }

      // Output settings
      args.push('-c:v', 'libx264');
      args.push('-c:a', 'aac');
      args.push('-y', outputFile);

      await this.ffmpeg.exec(args);
      processedFiles.push(outputFile);

      // Update progress
      const progress = 30 + (i / inputFiles.length) * 30;
      this.reportProgress({
        phase: 'processing',
        progress,
        currentSegment: i + 1,
        totalSegments: inputFiles.length,
        message: `Processing segment ${i + 1}/${inputFiles.length}`
      });
    }

    return processedFiles;
  }

  private async applyOverlaysAndSubtitles(processedFiles: string[], job: ExportJob): Promise<void> {
    // For now, we'll implement basic subtitle burning
    // Overlay support would require more complex FFmpeg filter chains
    
    if (!job.subtitles?.length) return;

    // Create subtitle file
    const srtContent = this.generateSRTContent(job.subtitles);
    await this.ffmpeg.writeFile('subtitles.srt', new TextEncoder().encode(srtContent));

    // Apply subtitles to each processed file
    for (let i = 0; i < processedFiles.length; i++) {
      const inputFile = processedFiles[i];
      const outputFile = `subtitled_${i}.mp4`;

      const args = [
        '-i', inputFile,
        '-vf', `subtitles=subtitles.srt:force_style='FontSize=24,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2'`,
        '-c:a', 'copy',
        '-y', outputFile
      ];

      await this.ffmpeg.exec(args);
      
      // Replace original with subtitled version
      processedFiles[i] = outputFile;
    }
  }

  private generateSRTContent(subtitles: Subtitle[]): string {
    let srtContent = '';
    
    subtitles.forEach((subtitle, index) => {
      const startTime = this.formatSRTTime(subtitle.startTime);
      const endTime = this.formatSRTTime(subtitle.endTime);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${subtitle.text}\n\n`;
    });
    
    return srtContent;
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  private async encodeVideo(processedFiles: string[], settings: ExportSettings): Promise<Blob> {
    // If multiple files, concatenate them first
    let finalInputFile: string;
    
    if (processedFiles.length === 1) {
      finalInputFile = processedFiles[0];
    } else {
      // Create concat file
      const concatContent = processedFiles.map(file => `file '${file}'`).join('\n');
      await this.ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));
      
      // Concatenate files
      await this.ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        '-y', 'concatenated.mp4'
      ]);
      
      finalInputFile = 'concatenated.mp4';
    }

    // Final encoding with export settings
    const outputFile = `output.${settings.format}`;
    const args = ['-i', finalInputFile];

    // Video encoding settings
    args.push('-c:v', settings.codec);
    
    if (settings.bitrate) {
      args.push('-b:v', settings.bitrate.toString());
    }
    
    // Resolution scaling
    args.push('-vf', `scale=${settings.resolution.width}:${settings.resolution.height}`);
    
    // Frame rate
    args.push('-r', settings.fps.toString());
    
    // Audio encoding
    args.push('-c:a', settings.audioCodec);
    args.push('-b:a', '128k');
    
    // Quality settings
    switch (settings.quality) {
      case 'low':
        args.push('-preset', 'fast', '-crf', '28');
        break;
      case 'medium':
        args.push('-preset', 'medium', '-crf', '23');
        break;
      case 'high':
        args.push('-preset', 'slow', '-crf', '18');
        break;
      case 'ultra':
        args.push('-preset', 'veryslow', '-crf', '15');
        break;
    }

    args.push('-y', outputFile);

    // Execute final encoding
    await this.ffmpeg.exec(args);

    // Read output file and convert to blob
    const data = await this.ffmpeg.readFile(outputFile);
    const uint8Array = new Uint8Array(data as ArrayBuffer);
    
    return new Blob([uint8Array], { 
      type: settings.format === 'mp4' ? 'video/mp4' : `video/${settings.format}` 
    });
  }

  // ===== CLEANUP =====

  async cleanup(): Promise<void> {
    if (this.ffmpeg) {
      try {
        await this.ffmpeg.terminate();
        this.initialized = false;
        console.log('🧹 FFmpeg.wasm cleaned up');
      } catch (error) {
        console.error('Error cleaning up FFmpeg:', error);
      }
    }
  }
}

// ===== SINGLETON INSTANCE =====

export const exportService = new ExportService();

// ===== UTILITY FUNCTIONS =====

export const createExportJob = (
  segments: VideoSegment[],
  settings: ExportSettings,
  options: {
    subtitles?: Subtitle[];
    overlays?: Overlay[];
    onProgress?: (progress: number) => void;
    onComplete?: (result: ExportResult) => void;
    onError?: (error: string) => void;
  } = {}
): ExportJob => {
  return {
    id: `export-${Date.now()}`,
    segments,
    subtitles: options.subtitles,
    overlays: options.overlays,
    settings,
    onProgress: options.onProgress,
    onComplete: options.onComplete,
    onError: options.onError
  };
};

export const estimateExportTime = (
  segments: VideoSegment[],
  settings: ExportSettings
): number => {
  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
  
  // Rough estimation based on quality and resolution
  let multiplier = 1;
  
  switch (settings.quality) {
    case 'low': multiplier = 0.5; break;
    case 'medium': multiplier = 1; break;
    case 'high': multiplier = 2; break;
    case 'ultra': multiplier = 4; break;
  }
  
  // Adjust for resolution
  const pixelCount = settings.resolution.width * settings.resolution.height;
  const resolutionMultiplier = pixelCount / (1920 * 1080); // Normalize to 1080p
  
  return totalDuration * multiplier * resolutionMultiplier;
};

export default ExportService; 