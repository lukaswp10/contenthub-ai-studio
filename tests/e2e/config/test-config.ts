// Configurações para testes E2E funcionais do ClipsForge
export const E2E_CONFIG = {
  // URLs da aplicação (PRODUÇÃO)
  urls: {
    base: 'https://clipsforge.vercel.app',
    upload: 'https://clipsforge.vercel.app/upload',
    editor: 'https://clipsforge.vercel.app/editor',
    dashboard: 'https://clipsforge.vercel.app/dashboard'
  },

  // Timeouts específicos (aumentados para produção)
  timeouts: {
    default: 60000,          // 60s padrão (aumentado para produção)
    upload: 120000,          // 2min para upload
    export: 180000,          // 3min para exportação
    videoLoad: 90000,        // 90s para carregar vídeo
    uiInteraction: 10000     // 10s para interações UI
  },

  // Seletores principais da aplicação
  selectors: {
    // Upload page
    uploadInput: 'input[type="file"]',
    uploadButton: '[data-testid="upload-button"]',
    uploadProgress: '[data-testid="upload-progress"]',
    
    // Editor page
    videoPlayer: 'video',
    playButton: '[data-testid="play-button"]',
    pauseButton: '[data-testid="pause-button"]',
    timeline: '[data-testid="timeline"]',
    timelineRuler: '[data-testid="timeline-ruler"]',
    
    // Toolbar buttons
    toolbar: '[data-testid="toolbar"]',
    zoomInButton: '[data-testid="zoom-in"]',
    zoomOutButton: '[data-testid="zoom-out"]',
    exportButton: '[data-testid="export-button"]',
    
    // Panels
    markersPanel: '[data-testid="markers-panel"]',
    groupsPanel: '[data-testid="groups-panel"]',
    markersButton: '[data-testid="markers-button"]',
    groupsButton: '[data-testid="groups-button"]',
    
    // Modals
    exportModal: '[data-testid="export-modal"]',
    confirmButton: '[data-testid="confirm-button"]',
    cancelButton: '[data-testid="cancel-button"]'
  },

  // Arquivos de teste
  fixtures: {
    shortVideo: 'tests/e2e/fixtures/test-video-short.mp4',
    longVideo: 'tests/e2e/fixtures/test-video-long.mp4',
    invalidFile: 'tests/e2e/fixtures/invalid-file.txt'
  },

  // Configurações de teste
  test: {
    retries: 3,              // Mais tentativas para produção
    screenshot: true,
    video: true,
    trace: true
  }
};

// Tipos para TypeScript
export type E2EConfig = typeof E2E_CONFIG;
export type Selectors = typeof E2E_CONFIG.selectors; 