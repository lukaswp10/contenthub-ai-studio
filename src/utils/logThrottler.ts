/**
 * 🔇 LOG THROTTLER - Sistema de throttling para reduzir poluição de logs
 * 
 * Evita spam de logs repetitivos mantendo apenas logs importantes
 * @version 1.0.0
 */

class LogThrottler {
  private static instance: LogThrottler;
  private logTimes: Map<string, number> = new Map();
  private logCounts: Map<string, number> = new Map();
  private readonly THROTTLE_INTERVAL = 10000; // 10 segundos entre logs similares

  static getInstance(): LogThrottler {
    if (!LogThrottler.instance) {
      LogThrottler.instance = new LogThrottler();
    }
    return LogThrottler.instance;
  }

  shouldLog(key: string): boolean {
    const now = Date.now();
    const lastTime = this.logTimes.get(key) || 0;
    
    if (now - lastTime > this.THROTTLE_INTERVAL) {
      this.logTimes.set(key, now);
      const count = (this.logCounts.get(key) || 0) + 1;
      this.logCounts.set(key, count);
      return true;
    }
    
    // Incrementar contador mesmo quando não loga
    const count = (this.logCounts.get(key) || 0) + 1;
    this.logCounts.set(key, count);
    return false;
  }

  getCount(key: string): number {
    return this.logCounts.get(key) || 0;
  }

  logWithThrottle(key: string, message: string): void {
    if (this.shouldLog(key)) {
      const count = this.getCount(key);
      console.log(`${message} [${count}x]`);
    }
  }

  // Log sempre (para logs importantes como novos jogos)
  logAlways(message: string): void {
    console.log(message);
  }

  // Log de debug apenas no desenvolvimento
  logDebug(key: string, message: string): void {
    if (process.env.NODE_ENV === 'development' && this.shouldLog(key)) {
      const count = this.getCount(key);
      console.log(`🐛 ${message} [${count}x]`);
    }
  }
}

// Funções utilitárias para facilitar o uso
const throttler = LogThrottler.getInstance();

export const logThrottled = (key: string, message: string) => {
  throttler.logWithThrottle(key, message);
};

export const logAlways = (message: string) => {
  throttler.logAlways(message);
};

export const logDebug = (key: string, message: string) => {
  throttler.logDebug(key, message);
};

export default LogThrottler; 