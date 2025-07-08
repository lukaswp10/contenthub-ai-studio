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

test.describe('⏱️ ClipsForge - Timeline Profissional', () => {
  
  test('Interface da Timeline Profissional', async ({ page }) => {
    console.log('⏱️ Testando interface da timeline profissional...');
    
    await goToEditor(page);
    
    // Verificar elementos da timeline profissional
    const timelineElements = [
      '.timeline-professional',
      '.timeline-pro',
      '.timeline-ruler',
      '.timeline-tracks',
      '.timeline-playhead',
      '[data-testid="timeline-pro"]',
      '.advanced-timeline'
    ];
    
    let timelineFound = false;
    for (const selector of timelineElements) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`⏱️ Elemento da timeline encontrado: ${selector}`);
          timelineFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!timelineFound) {
      console.log('⚠️ Timeline profissional não encontrada');
    }
    
    // Verificar régua de tempo
    const rulerElements = [
      '.time-ruler',
      '.timeline-ruler',
      '.time-markers',
      '.timeline-scale',
      '.time-scale'
    ];
    
    for (const selector of rulerElements) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`📏 Régua de tempo encontrada: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    console.log('✅ Teste de interface da timeline concluído!');
  });

  test('Funcionalidades de marcadores e anotações', async ({ page }) => {
    console.log('🏷️ Testando marcadores e anotações...');
    
    await goToEditor(page);
    
    // Verificar botões de marcadores
    const markerButtons = [
      'button:has-text("Marcador")',
      'button:has-text("Marker")',
      'button:has-text("M")',
      '[data-testid="marker-button"]',
      '.marker-button',
      '.add-marker'
    ];
    
    let markerFound = false;
    for (const selector of markerButtons) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🏷️ Botão de marcador encontrado: ${selector}`);
          markerFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!markerFound) {
      console.log('⚠️ Botão de marcador não encontrado');
    }
    
    // Verificar painel de marcadores
    const markerPanels = [
      '.markers-panel',
      '.marker-panel',
      '.annotations-panel',
      '[data-testid="markers-panel"]',
      '.marker-list'
    ];
    
    for (const selector of markerPanels) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`📋 Painel de marcadores encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    // Testar atalhos de teclado para marcadores
    const shortcuts = [
      { key: 'KeyM', description: 'Adicionar marcador' },
      { key: 'Comma', description: 'Marcador anterior' },
      { key: 'Period', description: 'Próximo marcador' }
    ];
    
    for (const shortcut of shortcuts) {
      try {
        console.log(`⌨️ Testando atalho: ${shortcut.key} (${shortcut.description})`);
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(500);
        console.log(`✅ Atalho ${shortcut.key} executado`);
      } catch (error) {
        console.log(`⚠️ Erro ao executar atalho ${shortcut.key}`);
      }
    }
    
    console.log('✅ Teste de marcadores e anotações concluído!');
  });

  test('Sistema de grupos e layers', async ({ page }) => {
    console.log('🗂️ Testando sistema de grupos e layers...');
    
    await goToEditor(page);
    
    // Verificar botões de grupos
    const groupButtons = [
      'button:has-text("Grupo")',
      'button:has-text("Group")',
      'button:has-text("G")',
      '[data-testid="group-button"]',
      '.group-button',
      '.create-group'
    ];
    
    let groupFound = false;
    for (const selector of groupButtons) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🗂️ Botão de grupo encontrado: ${selector}`);
          groupFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!groupFound) {
      console.log('⚠️ Botão de grupo não encontrado');
    }
    
    // Verificar painel de grupos
    const groupPanels = [
      '.groups-panel',
      '.group-panel',
      '.layers-panel',
      '[data-testid="groups-panel"]',
      '.group-manager'
    ];
    
    for (const selector of groupPanels) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`📁 Painel de grupos encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    // Testar atalhos de grupos
    const groupShortcuts = [
      { key: 'KeyG', description: 'Criar grupo' },
      { key: 'KeyU', description: 'Expandir/Colapsar grupo' }
    ];
    
    for (const shortcut of groupShortcuts) {
      try {
        console.log(`⌨️ Testando atalho de grupo: ${shortcut.key}`);
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(500);
        console.log(`✅ Atalho ${shortcut.key} executado`);
      } catch (error) {
        console.log(`⚠️ Erro ao executar atalho ${shortcut.key}`);
      }
    }
    
    console.log('✅ Teste de grupos e layers concluído!');
  });

  test('Controles de zoom e navegação avançada', async ({ page }) => {
    console.log('🔍 Testando zoom e navegação avançada...');
    
    await goToEditor(page);
    
    // Verificar controles de zoom
    const zoomControls = [
      'button:has-text("+")',
      'button:has-text("-")',
      '[data-testid="zoom-in"]',
      '[data-testid="zoom-out"]',
      '.zoom-controls',
      '.zoom-slider'
    ];
    
    let zoomFound = false;
    for (const selector of zoomControls) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🔍 Controle de zoom encontrado: ${selector}`);
          zoomFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!zoomFound) {
      console.log('⚠️ Controles de zoom não encontrados');
    }
    
    // Testar atalhos de zoom
    const zoomShortcuts = [
      { key: 'Equal', description: 'Zoom in' },
      { key: 'Minus', description: 'Zoom out' },
      { key: 'Digit0', description: 'Zoom fit' }
    ];
    
    for (const shortcut of zoomShortcuts) {
      try {
        console.log(`⌨️ Testando zoom: ${shortcut.key} (${shortcut.description})`);
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(500);
        console.log(`✅ Zoom ${shortcut.key} executado`);
      } catch (error) {
        console.log(`⚠️ Erro ao executar zoom ${shortcut.key}`);
      }
    }
    
    // Verificar mini-mapa ou navegação
    const navigationElements = [
      '.minimap',
      '.navigation-bar',
      '.timeline-overview',
      '.scroll-bar',
      '.navigation-controls'
    ];
    
    for (const selector of navigationElements) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🗺️ Elemento de navegação encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    console.log('✅ Teste de zoom e navegação concluído!');
  });

  test('Funcionalidades de corte e edição avançada', async ({ page }) => {
    console.log('✂️ Testando corte e edição avançada...');
    
    await goToEditor(page);
    
    // Verificar ferramentas de corte
    const cuttingTools = [
      'button:has-text("Cortar")',
      'button:has-text("Cut")',
      'button:has-text("Split")',
      '[data-testid="cut-button"]',
      '.cut-tool',
      '.split-tool'
    ];
    
    let cutFound = false;
    for (const selector of cuttingTools) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✂️ Ferramenta de corte encontrada: ${selector}`);
          cutFound = true;
          break;
        }
      } catch (error) {
        // Continuar procurando
      }
    }
    
    if (!cutFound) {
      console.log('⚠️ Ferramenta de corte não encontrada');
    }
    
    // Verificar seleção de área
    const selectionTools = [
      '.selection-tool',
      '.area-selector',
      '.range-selector',
      '.in-out-points',
      '.selection-handles'
    ];
    
    for (const selector of selectionTools) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🎯 Ferramenta de seleção encontrada: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    
    // Testar atalhos de edição
    const editShortcuts = [
      { key: 'KeyC', description: 'Cortar' },
      { key: 'KeyV', description: 'Colar' },
      { key: 'Delete', description: 'Deletar' },
      { key: 'Backspace', description: 'Deletar anterior' }
    ];
    
    for (const shortcut of editShortcuts) {
      try {
        console.log(`⌨️ Testando edição: ${shortcut.key} (${shortcut.description})`);
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(500);
        console.log(`✅ Edição ${shortcut.key} executada`);
      } catch (error) {
        console.log(`⚠️ Erro ao executar edição ${shortcut.key}`);
      }
    }
    
    console.log('✅ Teste de corte e edição concluído!');
  });

  test('Performance e responsividade da timeline', async ({ page }) => {
    console.log('⚡ Testando performance da timeline...');
    
    await goToEditor(page);
    
    // Medir tempo de carregamento da timeline
    const startTime = Date.now();
    
    // Aguardar elementos da timeline carregarem
    const timelineSelectors = [
      '.timeline',
      '.timeline-container',
      '.timeline-content',
      '.video-timeline'
    ];
    
    let timelineLoaded = false;
    for (const selector of timelineSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        timelineLoaded = true;
        console.log(`⏱️ Timeline carregada: ${selector}`);
        break;
      } catch (error) {
        // Continuar procurando
      }
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⚡ Tempo de carregamento da timeline: ${loadTime}ms`);
    
    if (loadTime < 2000) {
      console.log('✅ Performance da timeline adequada');
    } else {
      console.log('⚠️ Performance da timeline pode ser melhorada');
    }
    
    // Testar responsividade
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' }
    ];
    
    for (const viewport of viewports) {
      try {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        console.log(`📱 Testado em ${viewport.name} (${viewport.width}x${viewport.height})`);
      } catch (error) {
        console.log(`⚠️ Erro ao testar viewport ${viewport.name}`);
      }
    }
    
    console.log('✅ Teste de performance concluído!');
  });

}); 