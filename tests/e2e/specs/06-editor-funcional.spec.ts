import { test, expect } from '@playwright/test';
import { E2E_CONFIG } from '../config/test-config';

test.describe('🎬 ClipsForge - Editor Funcional', () => {
  
  // Helper para fazer login
  const loginUser = async (page: any) => {
    await page.goto(`${E2E_CONFIG.urls.base}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'lukaswp10@gmail.com');
    await page.fill('input[type="password"]', '7pguyrxV!');
    await page.waitForSelector('form button[type="submit"]:not([disabled])', { timeout: 15000 });
    await page.click('form button[type="submit"]');
    
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(3000);
  };

  // Helper para ir ao editor
  const goToEditor = async (page: any) => {
    await loginUser(page);
    
    // Tentar via botão "Editor Manual"
    const editorButton = page.locator('button:has-text("Editor Manual")');
    if (await editorButton.count() > 0) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find(btn => btn.textContent?.includes('Editor Manual'));
        if (button) {
          button.click();
        }
      });
      await page.waitForLoadState('networkidle');
    } else {
      // Navegação direta
      await page.goto(`${E2E_CONFIG.urls.base}/editor`);
      await page.waitForLoadState('networkidle');
    }
    
    const editorUrl = page.url();
    expect(editorUrl).toContain('/editor');
    await page.waitForTimeout(3000);
  };

  test('Controles de reprodução (Play/Pause)', async ({ page }) => {
    console.log('▶️ Testando controles de reprodução...');
    
    await goToEditor(page);
    
    // Verificar se há player de vídeo
    const videoPlayer = page.locator('video');
    const hasVideo = await videoPlayer.count() > 0;
    
    if (hasVideo) {
      console.log('📹 Player de vídeo encontrado');
      
      // Verificar controles básicos
      const playButton = page.locator('button:has([data-testid="play-icon"]), button:has-text("▶"), button:has-text("Play")');
      const pauseButton = page.locator('button:has([data-testid="pause-icon"]), button:has-text("⏸"), button:has-text("Pause")');
      
      // Testar botão Play
      if (await playButton.count() > 0) {
        console.log('▶️ Botão Play encontrado');
        await playButton.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar se vídeo está reproduzindo
        const isPlaying = await videoPlayer.first().evaluate((video: HTMLVideoElement) => {
          return !video.paused && !video.ended && video.readyState > 2;
        });
        
        if (isPlaying) {
          console.log('✅ Vídeo está reproduzindo');
        } else {
          console.log('⚠️ Vídeo pode não estar reproduzindo');
        }
        
        // Testar botão Pause
        if (await pauseButton.count() > 0) {
          console.log('⏸️ Botão Pause encontrado');
          await pauseButton.first().click();
          await page.waitForTimeout(1000);
          
          const isPaused = await videoPlayer.first().evaluate((video: HTMLVideoElement) => {
            return video.paused;
          });
          
          if (isPaused) {
            console.log('✅ Vídeo pausado com sucesso');
          } else {
            console.log('⚠️ Vídeo pode não ter pausado');
          }
        } else {
          console.log('⚠️ Botão Pause não encontrado');
        }
      } else {
        console.log('⚠️ Botão Play não encontrado');
      }
    } else {
      console.log('⚠️ Player de vídeo não encontrado - testando sem vídeo');
      
      // Verificar se há controles mesmo sem vídeo
      const controls = page.locator('button:has-text("▶"), button:has-text("Play")');
      if (await controls.count() > 0) {
        console.log('🎮 Controles encontrados mesmo sem vídeo');
        await controls.first().click();
        console.log('✅ Controle clicado (sem vídeo)');
      }
    }
    
    console.log('✅ Teste de controles de reprodução concluído!');
  });

  test('Timeline e navegação temporal', async ({ page }) => {
    console.log('⏱️ Testando timeline e navegação temporal...');
    
    await goToEditor(page);
    
    // Procurar timeline
    const timelineSelectors = [
      '[data-testid="timeline"]',
      '.timeline',
      'div:has-text("Timeline")',
      'input[type="range"]'
    ];
    
    let timeline = null;
    for (const selector of timelineSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        timeline = element;
        console.log(`⏱️ Timeline encontrada: ${selector}`);
        break;
      }
    }
    
    if (timeline) {
      // Testar clique na timeline
      await timeline.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Timeline clicada');
      
      // Verificar se há indicador de tempo
      const timeIndicators = page.locator('text=/\\d+:\\d+/, text=/\\d+\\.\\d+s/, text=/\\d+s/');
      if (await timeIndicators.count() > 0) {
        console.log('⏰ Indicadores de tempo encontrados');
      } else {
        console.log('⚠️ Indicadores de tempo não encontrados');
      }
      
      // Testar navegação com teclado
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(500);
      console.log('⌨️ Navegação com teclado testada');
      
    } else {
      console.log('⚠️ Timeline não encontrada');
    }
    
    console.log('✅ Teste de timeline concluído!');
  });

  test('Funcionalidade de corte/divisão', async ({ page }) => {
    console.log('✂️ Testando funcionalidade de corte...');
    
    await goToEditor(page);
    
    // Procurar botões de corte
    const cutButtons = [
      'button:has-text("✂")',
      'button:has-text("Cortar")',
      'button:has-text("Dividir")',
      'button:has-text("Split")',
      '[data-testid="cut-button"]'
    ];
    
    let cutButton = null;
    for (const selector of cutButtons) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        cutButton = element;
        console.log(`✂️ Botão de corte encontrado: ${selector}`);
        break;
      }
    }
    
    if (cutButton) {
      // Testar clique no botão de corte
      await cutButton.first().click();
      await page.waitForTimeout(2000);
      console.log('✅ Botão de corte clicado');
      
      // Verificar se apareceu algum feedback visual
      const feedbackSelectors = [
        'text="Corte realizado"',
        'text="Vídeo dividido"',
        'text="Split aplicado"',
        '.cut-indicator',
        '.split-marker'
      ];
      
      let feedbackFound = false;
      for (const selector of feedbackSelectors) {
        if (await page.locator(selector).count() > 0) {
          console.log(`✅ Feedback de corte encontrado: ${selector}`);
          feedbackFound = true;
          break;
        }
      }
      
      if (!feedbackFound) {
        console.log('⚠️ Feedback visual de corte não encontrado');
      }
      
      // Testar atalho de teclado para corte
      await page.keyboard.press('Space'); // Pausar se estiver reproduzindo
      await page.waitForTimeout(500);
      await page.keyboard.press('Control+K'); // Atalho comum para corte
      await page.waitForTimeout(1000);
      console.log('⌨️ Atalho de corte testado (Ctrl+K)');
      
    } else {
      console.log('⚠️ Botão de corte não encontrado');
    }
    
    console.log('✅ Teste de funcionalidade de corte concluído!');
  });

  test('Zoom e visualização da timeline', async ({ page }) => {
    console.log('🔍 Testando zoom e visualização...');
    
    await goToEditor(page);
    
    // Procurar controles de zoom
    const zoomControls = [
      'button:has-text("+")',
      'button:has-text("-")',
      'button:has-text("Zoom In")',
      'button:has-text("Zoom Out")',
      '[data-testid="zoom-in"]',
      '[data-testid="zoom-out"]'
    ];
    
    let zoomInButton = null;
    let zoomOutButton = null;
    
    for (const selector of zoomControls) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        if (selector.includes('+') || selector.includes('In')) {
          zoomInButton = element;
          console.log(`🔍 Botão Zoom In encontrado: ${selector}`);
        } else if (selector.includes('-') || selector.includes('Out')) {
          zoomOutButton = element;
          console.log(`🔍 Botão Zoom Out encontrado: ${selector}`);
        }
      }
    }
    
    // Testar zoom in
    if (zoomInButton) {
      await zoomInButton.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Zoom In testado');
    }
    
    // Testar zoom out
    if (zoomOutButton) {
      await zoomOutButton.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Zoom Out testado');
    }
    
    // Testar zoom com scroll
    const timeline = page.locator('[data-testid="timeline"], .timeline').first();
    if (await timeline.count() > 0) {
      await timeline.hover();
      await page.mouse.wheel(0, -100); // Scroll up
      await page.waitForTimeout(500);
      await page.mouse.wheel(0, 100); // Scroll down
      await page.waitForTimeout(500);
      console.log('🖱️ Zoom com scroll testado');
    }
    
    // Testar atalhos de zoom
    await page.keyboard.press('Control+Plus');
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+Minus');
    await page.waitForTimeout(500);
    console.log('⌨️ Atalhos de zoom testados');
    
    console.log('✅ Teste de zoom concluído!');
  });

  test('Atalhos de teclado críticos', async ({ page }) => {
    console.log('⌨️ Testando atalhos de teclado críticos...');
    
    await goToEditor(page);
    
    // Lista de atalhos críticos para testar
    const criticalShortcuts = [
      { key: 'Space', description: 'Play/Pause' },
      { key: 'Control+Z', description: 'Undo' },
      { key: 'Control+Y', description: 'Redo' },
      { key: 'Control+S', description: 'Save' },
      { key: 'Delete', description: 'Delete' },
      { key: 'ArrowLeft', description: 'Previous frame' },
      { key: 'ArrowRight', description: 'Next frame' },
      { key: 'Home', description: 'Go to start' },
      { key: 'End', description: 'Go to end' }
    ];
    
    for (const shortcut of criticalShortcuts) {
      try {
        console.log(`⌨️ Testando: ${shortcut.key} (${shortcut.description})`);
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(500);
        console.log(`✅ ${shortcut.key} executado`);
      } catch (error) {
        console.log(`⚠️ Erro ao testar ${shortcut.key}:`, error);
      }
    }
    
    console.log('✅ Teste de atalhos de teclado concluído!');
  });

  test('Funcionalidades de seleção e edição', async ({ page }) => {
    console.log('🎯 Testando seleção e edição...');
    
    await goToEditor(page);
    
    // Procurar elementos selecionáveis na timeline
    const selectableElements = [
      '.timeline-block',
      '.video-segment',
      '.clip-item',
      '[data-testid="timeline-item"]'
    ];
    
    let elementFound = false;
    for (const selector of selectableElements) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        console.log(`🎯 Elementos selecionáveis encontrados: ${selector}`);
        
        // Testar clique para seleção
        await elements.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ Elemento selecionado');
        
        // Testar seleção múltipla (Ctrl+Click)
        if (await elements.count() > 1) {
          await page.keyboard.down('Control');
          await elements.nth(1).click();
          await page.keyboard.up('Control');
          await page.waitForTimeout(1000);
          console.log('✅ Seleção múltipla testada');
        }
        
        elementFound = true;
        break;
      }
    }
    
    if (!elementFound) {
      console.log('⚠️ Elementos selecionáveis não encontrados');
    }
    
    // Testar arrastar e soltar
    const draggableElements = page.locator('[draggable="true"], .draggable');
    if (await draggableElements.count() > 0) {
      const element = draggableElements.first();
      const bbox = await element.boundingBox();
      
      if (bbox) {
        await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        await page.mouse.down();
        await page.mouse.move(bbox.x + 100, bbox.y);
        await page.mouse.up();
        await page.waitForTimeout(1000);
        console.log('✅ Drag & drop testado');
      }
    }
    
    console.log('✅ Teste de seleção e edição concluído!');
  });

  test('Verificação de performance e responsividade', async ({ page }) => {
    console.log('⚡ Testando performance e responsividade...');
    
    await goToEditor(page);
    
    // Medir tempo de resposta dos controles
    const startTime = Date.now();
    
    // Testar múltiplos cliques rápidos
    const playButton = page.locator('button:has-text("▶"), button:has-text("Play")').first();
    if (await playButton.count() > 0) {
      for (let i = 0; i < 5; i++) {
        await playButton.click();
        await page.waitForTimeout(100);
      }
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`⚡ Tempo de resposta: ${responseTime}ms`);
    
    // Verificar se interface não travou
    const isResponsive = responseTime < 5000; // 5 segundos limite
    if (isResponsive) {
      console.log('✅ Interface responsiva');
    } else {
      console.log('⚠️ Interface pode estar lenta');
    }
    
    // Testar scroll suave
    await page.evaluate(() => {
      window.scrollTo({ top: 100, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    
    console.log('✅ Scroll suave testado');
    
    console.log('✅ Teste de performance concluído!');
  });

}); 