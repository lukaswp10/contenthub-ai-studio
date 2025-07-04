/**
 * 🚨 ERROR HANDLER - ClipsForge Pro
 * 
 * Gerenciador de erros para renderização
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import { RenderError, RenderWarning } from '../../types/render.types';

export class ErrorHandler {
  private _errors: RenderError[] = [];
  private _warnings: RenderWarning[] = [];

  get errors(): RenderError[] {
    return [...this._errors];
  }

  get warnings(): RenderWarning[] {
    return [...this._warnings];
  }

  addError(code: string, error: any, phase: string = 'unknown'): void {
    const renderError: RenderError = {
      id: this._generateId(),
      type: 'fatal',
      code,
      message: error.message || String(error),
      details: error.stack,
      timestamp: new Date(),
      phase,
      stackTrace: error.stack,
      suggestions: this._getSuggestions(code)
    };
    
    this._errors.push(renderError);
    console.error(`🚨 Render Error [${code}]: ${renderError.message}`);
  }

  addWarning(code: string, message: string, phase: string = 'unknown'): void {
    const warning: RenderWarning = {
      id: this._generateId(),
      type: 'performance',
      code,
      message,
      timestamp: new Date(),
      phase,
      severity: 'medium',
      suggestions: this._getSuggestions(code)
    };
    
    this._warnings.push(warning);
    console.warn(`⚠️ Render Warning [${code}]: ${message}`);
  }

  createError(code: string, error: any, phase: string = 'unknown'): RenderError {
    return {
      id: this._generateId(),
      type: 'fatal',
      code,
      message: error.message || String(error),
      details: error.stack,
      timestamp: new Date(),
      phase,
      stackTrace: error.stack,
      suggestions: this._getSuggestions(code)
    };
  }

  clear(): void {
    this._errors = [];
    this._warnings = [];
    console.log('🚨 Error handler cleared');
  }

  private _generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private _getSuggestions(code: string): string[] {
    const suggestions: Record<string, string[]> = {
      'INIT_FAILED': [
        'Check if WebGL is supported',
        'Verify audio context permissions',
        'Ensure sufficient memory'
      ],
      'RENDER_FAILED': [
        'Check video format support',
        'Verify source file integrity',
        'Reduce render quality'
      ],
      'PIPELINE_FAILED': [
        'Check system resources',
        'Verify render settings',
        'Try reducing complexity'
      ],
      'WEBGL_INIT_FAILED': [
        'Update graphics drivers',
        'Try different browser',
        'Disable hardware acceleration'
      ],
      'AUDIO_INIT_FAILED': [
        'Check audio permissions',
        'Verify audio device',
        'Try different sample rate'
      ]
    };

    return suggestions[code] || ['Contact support for assistance'];
  }
} 