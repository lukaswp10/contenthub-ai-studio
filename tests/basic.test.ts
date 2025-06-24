import { describe, it, expect } from 'vitest';

describe('ClipsForge Basic Tests', () => {
  it('should run basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 * 5).toBe(50);
  });

  it('should handle string operations', () => {
    const projectName = 'ClipsForge';
    expect(projectName).toBe('ClipsForge');
    expect(projectName.toLowerCase()).toBe('clipsforge');
  });

  it('should handle array operations', () => {
    const features = ['IA Avançada', 'Multi-plataforma', 'Automação'];
    expect(features.length).toBe(3);
    expect(features).toContain('IA Avançada');
  });
}); 