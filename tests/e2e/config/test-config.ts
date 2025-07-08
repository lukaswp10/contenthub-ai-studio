// Configurações para testes E2E funcionais do ClipsForge
export const E2E_CONFIG = {
  urls: {
    base: 'https://clipsforge.vercel.app',
    login: 'https://clipsforge.vercel.app/login',
    dashboard: 'https://clipsforge.vercel.app/dashboard',
    editor: 'https://clipsforge.vercel.app/editor'
  },
  
  // Configurações de timeout aumentadas para produção
  timeouts: {
    default: 180000,      // 3 minutos (era 120s)
    navigation: 90000,    // 1.5 minutos (era 60s)
    assertion: 30000,     // 30 segundos (era 15s)
    action: 15000         // 15 segundos (era 10s)
  },
  
  // Configurações de retry
  retries: {
    default: 2,
    flaky: 3
  },
  
  // Configurações de navegador - FOCO NO CHROMIUM
  browsers: {
    chromium: {
      enabled: true,
      headless: true,
      slowMo: 0
    },
    firefox: {
      enabled: false,  // Desabilitado temporariamente
      headless: true,
      slowMo: 0
    },
    webkit: {
      enabled: false,  // Desabilitado - problema de dependência
      headless: true,
      slowMo: 0
    }
  },
  
  // Configurações de vídeo e screenshot
  video: {
    mode: 'retain-on-failure',
    size: { width: 1280, height: 720 }
  },
  
  screenshot: {
    mode: 'only-on-failure',
    fullPage: true
  }
};

// Tipos para TypeScript
export type E2EConfig = typeof E2E_CONFIG; 