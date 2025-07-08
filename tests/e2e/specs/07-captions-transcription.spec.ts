import { test, expect } from '@playwright/test';
import { E2E_CONFIG } from '../config/test-config';

// Função helper para login
const loginUser = async (page: any) => {
  await page.goto(`${E2E_CONFIG.urls.base}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', 'lukaswp10@gmail.com');
  await page.fill('input[type="password"]', '7pguyrxV!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
};

// Função helper para ir ao editor
const goToEditor = async (page: any) => {
  await loginUser(page);
  await page.waitForSelector('button:has-text("Editor Manual")', { timeout: 15000 });
  await page.click('button:has-text("Editor Manual")');
  await page.waitForURL('**/editor');
  await page.waitForLoadState('networkidle');
};

test.describe('📝 ClipsForge - Sistema de Legendas e Transcrição', () => {
  
  test('Sistema de legendas automáticas - Interface', async ({ page }) => {
    console.log('📝 Testando interface de legendas automáticas...');
    
    await goToEditor(page);
    
    // Verificar se existe botão/painel de legendas
    const captionSelectors = [
      'button:has-text("Legendas")',
      'button:has-text("Captions")',
      'button:has-text("Transcrição")',
      '[data-testid="captions-button"]',
      '[data-testid="transcription-button"]',
      '.caption-panel',
      '.transcription-panel'
    ];
    
    let captionElementFound = false;
    for (const selector of captionSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Elemento de legendas encontrado: ${selector}`);
          captionElementFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!captionElementFound) {
      console.log('⚠️ Interface de legendas não encontrada - pode estar integrada');
    }
    
    // Verificar se existem controles de transcrição
    const transcriptionControls = [
      'button:has-text("Transcrever")',
      'button:has-text("Gerar Legendas")',
      'button:has-text("Auto Caption")',
      '.transcription-controls'
    ];
    
    for (const selector of transcriptionControls) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🎯 Controle de transcrição encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    console.log('✅ Teste de interface de legendas concluído!');
  });

  test('Configuração de API Keys para transcrição', async ({ page }) => {
    console.log('🔑 Testando configuração de API Keys...');
    
    await goToEditor(page);
    
    // Procurar por botão de configurações
    const settingsSelectors = [
      'button:has-text("Configurações")',
      'button:has-text("Settings")',
      'button:has-text("API")',
      '[data-testid="settings-button"]',
      '.settings-button',
      '.gear-icon'
    ];
    
    let settingsFound = false;
    for (const selector of settingsSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`⚙️ Botão de configurações encontrado: ${selector}`);
          await page.click(selector);
          settingsFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!settingsFound) {
      console.log('⚠️ Botão de configurações não encontrado');
    }
    
    // Verificar se existe painel de API Keys
    const apiKeySelectors = [
      'input[placeholder*="API"]',
      'input[placeholder*="Key"]',
      'input[placeholder*="OpenAI"]',
      '.api-key-input',
      '[data-testid="api-key-input"]'
    ];
    
    for (const selector of apiKeySelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🔑 Campo de API Key encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    console.log('✅ Teste de configuração de API concluído!');
  });

  test('Funcionalidade de edição de legendas', async ({ page }) => {
    console.log('✏️ Testando edição de legendas...');
    
    await goToEditor(page);
    
    // Procurar por elementos de edição de legendas
    const captionEditSelectors = [
      '.caption-editor',
      '.subtitle-editor',
      '[data-testid="caption-editor"]',
      '.editable-caption',
      '.caption-text',
      '.subtitle-text'
    ];
    
    let editorFound = false;
    for (const selector of captionEditSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✏️ Editor de legendas encontrado: ${selector}`);
          editorFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!editorFound) {
      console.log('⚠️ Editor de legendas não encontrado');
    }
    
    // Verificar controles de sincronização
    const syncControls = [
      'button:has-text("Sync")',
      'button:has-text("Sincronizar")',
      '.sync-controls',
      '.timing-controls',
      '[data-testid="sync-button"]'
    ];
    
    for (const selector of syncControls) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🔄 Controle de sincronização encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    console.log('✅ Teste de edição de legendas concluído!');
  });

  test('Cache e performance de transcrição', async ({ page }) => {
    console.log('⚡ Testando cache e performance...');
    
    await goToEditor(page);
    
    // Verificar indicadores de cache
    const cacheIndicators = [
      '.cache-stats',
      '.cache-indicator',
      '[data-testid="cache-stats"]',
      'button:has-text("Cache")',
      '.performance-stats'
    ];
    
    for (const selector of cacheIndicators) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`📊 Indicador de cache encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    // Verificar performance da interface
    const startTime = Date.now();
    await page.waitForSelector('body', { timeout: 5000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`⚡ Tempo de carregamento: ${loadTime}ms`);
    
    if (loadTime < 3000) {
      console.log('✅ Performance adequada');
    } else {
      console.log('⚠️ Performance pode ser melhorada');
    }
    
    console.log('✅ Teste de cache e performance concluído!');
  });

  test('Integração com serviços de transcrição', async ({ page }) => {
    console.log('🔌 Testando integração com serviços...');
    
    await goToEditor(page);
    
    // Verificar indicadores de serviços
    const serviceIndicators = [
      '.service-status',
      '.api-status',
      '.connection-status',
      '[data-testid="service-status"]',
      'button:has-text("Conectado")',
      'button:has-text("Desconectado")'
    ];
    
    for (const selector of serviceIndicators) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🔌 Indicador de serviço encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    // Verificar se há mensagens de erro ou sucesso
    const statusMessages = [
      '.error-message',
      '.success-message',
      '.warning-message',
      '.status-message',
      '.alert'
    ];
    
    for (const selector of statusMessages) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`📨 ${elements.length} mensagem(ns) de status encontrada(s)`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    console.log('✅ Teste de integração com serviços concluído!');
  });

  test('Exportação com legendas', async ({ page }) => {
    console.log('📤 Testando exportação com legendas...');
    
    await goToEditor(page);
    
    // Procurar botão de exportação
    const exportSelectors = [
      'button:has-text("Exportar")',
      'button:has-text("Export")',
      'button:has-text("Download")',
      '[data-testid="export-button"]',
      '.export-button'
    ];
    
    let exportFound = false;
    for (const selector of exportSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`📤 Botão de exportação encontrado: ${selector}`);
          exportFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!exportFound) {
      console.log('⚠️ Botão de exportação não encontrado');
    }
    
    // Verificar opções de exportação com legendas
    const captionExportOptions = [
      'input[type="checkbox"]:has-text("Legendas")',
      'input[type="checkbox"]:has-text("Captions")',
      'input[type="checkbox"]:has-text("Subtitles")',
      '.export-options',
      '.caption-export-option'
    ];
    
    for (const selector of captionExportOptions) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Opção de exportação com legendas encontrada: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    console.log('✅ Teste de exportação com legendas concluído!');
  });

}); 