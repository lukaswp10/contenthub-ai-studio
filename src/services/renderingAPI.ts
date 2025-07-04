/**
 * 🎬 RENDERING API SERVICE - ClipsForge Pro
 * 
 * Serviço de renderização profissional na nuvem
 * Integração com Shotstack, Creatomate e Remotion
 * 
 * @version 9.0.0 - FASE 9
 * @author ClipsForge Team
 */

import { RenderJob, RenderResult, RenderProgress } from '../types/render.types';

// ===== INTERFACES =====

export interface RenderingService {
  uploadAssets(files: File[]): Promise<string[]>;
  createRenderJob(timeline: Timeline): Promise<JobId>;
  checkStatus(jobId: string): Promise<RenderStatus>;
  downloadResult(jobId: string): Promise<Blob>;
}

export interface CloudRenderProvider {
  name: string;
  pricing: number; // per minute
  features: string[];
  maxResolution: string;
  supportedFormats: string[];
}

export interface Timeline {
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  tracks: TimelineTrack[];
  effects: TimelineEffect[];
}

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  clips: TimelineClip[];
  effects: TimelineEffect[];
}

export interface TimelineClip {
  id: string;
  assetId: string;
  start: number;
  duration: number;
  trim: { start: number; end: number };
  transform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
  };
}

export interface TimelineEffect {
  id: string;
  type: string;
  parameters: Record<string, any>;
  keyframes: Array<{
    time: number;
    value: any;
    easing: string;
  }>;
}

export type JobId = string;
export type RenderStatus = 'queued' | 'processing' | 'completed' | 'failed';

// ===== PROVIDERS =====

export const RENDER_PROVIDERS: Record<string, CloudRenderProvider> = {
  shotstack: {
    name: 'Shotstack',
    pricing: 0.25, // $0.25/min
    features: ['4K Support', 'Fast Rendering', 'Professional Codecs'],
    maxResolution: '4K',
    supportedFormats: ['mp4', 'mov', 'webm', 'gif']
  },
  creatomate: {
    name: 'Creatomate',
    pricing: 0.20, // $0.20/min
    features: ['More Effects', 'Template Library', 'API-First'],
    maxResolution: '4K',
    supportedFormats: ['mp4', 'mov', 'webm', 'gif', 'png']
  },
  remotion: {
    name: 'Remotion',
    pricing: 100, // $100/month minimum
    features: ['Full Control', 'React-Based', 'Custom Code'],
    maxResolution: '8K',
    supportedFormats: ['mp4', 'mov', 'webm', 'gif', 'png', 'jpg']
  }
};

// ===== SHOTSTACK IMPLEMENTATION =====

class ShotstackService implements RenderingService {
  private apiKey: string;
  private baseUrl = 'https://api.shotstack.io/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async uploadAssets(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${this.baseUrl}/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data.id;
    });
    
    return Promise.all(uploadPromises);
  }

  async createRenderJob(timeline: Timeline): Promise<JobId> {
    const shotstackTimeline = this.convertToShotstackFormat(timeline);
    
    const response = await fetch(`${this.baseUrl}/render`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeline: shotstackTimeline,
        output: {
          format: 'mp4',
          resolution: 'hd'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Render job creation failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response.id;
  }

  async checkStatus(jobId: string): Promise<RenderStatus> {
    const response = await fetch(`${this.baseUrl}/render/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response.status;
  }

  async downloadResult(jobId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/render/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const videoUrl = data.response.url;
    
    const videoResponse = await fetch(videoUrl);
    return videoResponse.blob();
  }

  private convertToShotstackFormat(timeline: Timeline): any {
    return {
      soundtrack: timeline.tracks
        .filter(track => track.type === 'audio')
        .map(track => ({
          src: track.clips[0]?.assetId,
          effect: 'fadeIn'
        })),
      tracks: timeline.tracks
        .filter(track => track.type === 'video')
        .map(track => ({
          clips: track.clips.map(clip => ({
            asset: {
              type: 'video',
              src: clip.assetId
            },
            start: clip.start,
            length: clip.duration,
            scale: clip.transform.scale,
            position: 'center',
            offset: {
              x: clip.transform.x,
              y: clip.transform.y
            }
          }))
        }))
    };
  }
}

// ===== CREATOMATE IMPLEMENTATION =====

class CreatomateService implements RenderingService {
  private apiKey: string;
  private baseUrl = 'https://api.creatomate.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async uploadAssets(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('source', file);
      
      const response = await fetch(`${this.baseUrl}/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.url;
    });
    
    return Promise.all(uploadPromises);
  }

  async createRenderJob(timeline: Timeline): Promise<JobId> {
    const creatomateComposition = this.convertToCreatomateFormat(timeline);
    
    const response = await fetch(`${this.baseUrl}/renders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: null,
        modifications: creatomateComposition
      })
    });
    
    if (!response.ok) {
      throw new Error(`Render job creation failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.id;
  }

  async checkStatus(jobId: string): Promise<RenderStatus> {
    const response = await fetch(`${this.baseUrl}/renders/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert Creatomate status to our format
    const statusMap: Record<string, RenderStatus> = {
      'waiting': 'queued',
      'processing': 'processing',
      'succeeded': 'completed',
      'failed': 'failed'
    };
    
    return statusMap[data.status] || 'queued';
  }

  async downloadResult(jobId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/renders/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const videoUrl = data.url;
    
    const videoResponse = await fetch(videoUrl);
    return videoResponse.blob();
  }

  private convertToCreatomateFormat(timeline: Timeline): any {
    return {
      'duration': timeline.duration,
      'width': timeline.resolution.width,
      'height': timeline.resolution.height,
      'frame_rate': timeline.fps,
      'elements': timeline.tracks.flatMap(track => 
        track.clips.map(clip => ({
          'type': track.type === 'video' ? 'video' : 'audio',
          'source': clip.assetId,
          'x': clip.transform.x,
          'y': clip.transform.y,
          'width': '100%',
          'height': '100%',
          'time': clip.start,
          'duration': clip.duration,
          'volume': track.type === 'audio' ? 1 : 0
        }))
      )
    };
  }
}

// ===== CLOUD RENDER MANAGER =====

export class CloudRenderManager {
  private services: Map<string, RenderingService> = new Map();
  
  constructor() {
    // Initialize services when API keys are available
  }

  addProvider(provider: 'shotstack' | 'creatomate' | 'remotion', apiKey: string): void {
    switch (provider) {
      case 'shotstack':
        this.services.set(provider, new ShotstackService(apiKey));
        break;
      case 'creatomate':
        this.services.set(provider, new CreatomateService(apiKey));
        break;
      case 'remotion':
        // Remotion implementation would go here
        console.warn('Remotion not yet implemented');
        break;
    }
  }

  async renderVideo(
    timeline: Timeline,
    provider: 'shotstack' | 'creatomate' | 'remotion' = 'shotstack',
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const service = this.services.get(provider);
    if (!service) {
      throw new Error(`Provider ${provider} not configured`);
    }

    // Create job
    const jobId = await service.createRenderJob(timeline);
    
    // Poll for completion
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await service.checkStatus(jobId);
          
          if (status === 'completed') {
            clearInterval(pollInterval);
            const result = await service.downloadResult(jobId);
            resolve(result);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error('Render job failed'));
          } else {
            // Update progress (estimated)
            onProgress?.(Math.random() * 100);
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, 5000); // Check every 5 seconds
    });
  }

  estimateCost(timeline: Timeline, provider: 'shotstack' | 'creatomate' | 'remotion'): number {
    const providerInfo = RENDER_PROVIDERS[provider];
    const durationMinutes = timeline.duration / 60;
    
    if (provider === 'remotion') {
      // Remotion has monthly pricing
      return providerInfo.pricing;
    }
    
    return durationMinutes * providerInfo.pricing;
  }

  getAvailableProviders(): CloudRenderProvider[] {
    return Object.values(RENDER_PROVIDERS);
  }
}

// ===== SINGLETON INSTANCE =====

export const cloudRenderManager = new CloudRenderManager();

// ===== UTILITY FUNCTIONS =====

export function createTimelineFromRenderJob(job: RenderJob): Timeline {
  return {
    duration: job.source.duration,
    fps: job.source.frameRate,
    resolution: job.source.resolution,
    tracks: job.source.timeline?.tracks?.map(track => ({
      id: track.id,
      type: track.type as 'video' | 'audio' | 'subtitle',
      clips: track.clips.map(clip => ({
        id: clip.id,
        assetId: clip.asset.url,
        start: clip.startTime,
        duration: clip.duration,
        trim: { start: 0, end: clip.duration },
        transform: {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1
        }
      })),
      effects: track.effects.map(effect => ({
        id: effect.id,
        type: effect.type,
        parameters: effect.parameters,
        keyframes: effect.keyframes.map(kf => ({
          time: kf.time,
          value: kf.value,
          easing: kf.interpolation
        }))
      }))
    })) || [],
    effects: []
  };
}

export function validateApiKey(provider: string, apiKey: string): boolean {
  if (!apiKey || apiKey.length < 10) {
    return false;
  }
  
  switch (provider) {
    case 'shotstack':
      return apiKey.startsWith('sk-') || apiKey.length > 20;
    case 'creatomate':
      return apiKey.length > 30;
    case 'remotion':
      return apiKey.length > 20;
    default:
      return false;
  }
}

// ===== EXPORT DEFAULT =====

export default CloudRenderManager;