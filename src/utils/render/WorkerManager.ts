/**
 * 🔧 WORKER MANAGER - ClipsForge Pro
 * 
 * Gerenciador de Web Workers para renderização multi-threaded
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

export interface WorkerConfig {
  maxWorkers?: number;
  enableWorkers?: boolean;
}

export class WorkerManager {
  private _workers: Worker[] = [];
  private _initialized = false;
  private _maxWorkers = 4;

  get workers(): Worker[] {
    return this._workers;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  async initialize(config: WorkerConfig = {}): Promise<void> {
    if (this._initialized) {
      return;
    }

    if (config.enableWorkers === false || typeof Worker === 'undefined') {
      console.log('🔧 Web Workers disabled or not supported');
      this._initialized = true;
      return;
    }

    try {
      this._maxWorkers = Math.min(config.maxWorkers || 4, navigator.hardwareConcurrency || 4);

      for (let i = 0; i < this._maxWorkers; i++) {
        const workerCode = this._createWorkerCode();
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        const worker = new Worker(workerUrl);
        
        worker.onmessage = (event) => {
          this._handleWorkerMessage(i, event.data);
        };
        
        worker.onerror = (error) => {
          console.error(`Worker ${i} error:`, error);
        };
        
        this._workers.push(worker);
        URL.revokeObjectURL(workerUrl);
      }

      this._initialized = true;
      console.log(`🔧 Initialized ${this._workers.length} render workers`);

    } catch (error) {
      console.warn('⚠️ Worker manager initialization failed:', error);
      this._initialized = false;
      throw error;
    }
  }

  private _createWorkerCode(): string {
    return `
      self.onmessage = function(event) {
        const { type, data } = event.data;
        
        switch (type) {
          case 'render-frame':
            // Simulate frame rendering
            const result = {
              frameIndex: data.frameIndex,
              frameTime: data.frameTime,
              status: 'completed'
            };
            
            self.postMessage({
              type: 'frame-complete',
              data: result
            });
            break;
            
          case 'process-audio':
            // Simulate audio processing
            self.postMessage({
              type: 'audio-complete',
              data: { processed: true }
            });
            break;
            
          default:
            self.postMessage({
              type: 'error',
              data: { message: 'Unknown command: ' + type }
            });
        }
      };
    `;
  }

  private _handleWorkerMessage(workerId: number, data: any): void {
    console.log(`Worker ${workerId} message:`, data.type);
  }

  async processTask(task: any): Promise<any> {
    if (!this._initialized || this._workers.length === 0) {
      return this._processTaskSync(task);
    }

    return new Promise((resolve, reject) => {
      const worker = this._workers[0]; // Simple round-robin for now
      
      const handleMessage = (event: MessageEvent) => {
        worker.removeEventListener('message', handleMessage);
        resolve(event.data);
      };

      const handleError = (error: ErrorEvent) => {
        worker.removeEventListener('error', handleError);
        reject(error);
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);
      
      worker.postMessage({
        type: 'render-frame',
        data: task
      });
    });
  }

  private _processTaskSync(task: any): any {
    // Fallback synchronous processing
    return {
      frameIndex: task.frameIndex,
      frameTime: task.frameTime,
      status: 'completed'
    };
  }

  dispose(): void {
    this._workers.forEach(worker => {
      worker.terminate();
    });
    this._workers = [];
    this._initialized = false;
    console.log('🔧 Worker manager disposed');
  }
} 