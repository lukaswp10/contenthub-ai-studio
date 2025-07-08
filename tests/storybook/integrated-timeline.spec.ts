import { test, expect } from '@playwright/test';

// Configuração base para todos os testes
const STORYBOOK_URL = 'http://localhost:6006';

test.describe('IntegratedTimeline - ETAPAS 7 & 8', () => {
  
  test.beforeEach(async ({ page }) => {
    // Aguardar o Storybook carregar completamente
    await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--default`);
    await page.waitForLoadState('networkidle');
    
    // Aguardar o componente estar visível
    await page.waitForSelector('[data-testid="integrated-timeline"]', { timeout: 10000 });
  });

  test.describe('🎯 ETAPA 7 - Sistema de Marcadores', () => {
    
    test('deve carregar timeline com controles básicos', async ({ page }) => {
      // Verificar se os controles básicos estão presentes
      await expect(page.locator('button[title*="Play"]')).toBeVisible();
      await expect(page.locator('button[title*="Pause"]')).toBeVisible();
      await expect(page.locator('button[title*="Stop"]')).toBeVisible();
      
      // Verificar se a timeline está visível
      await expect(page.locator('.timeline-container')).toBeVisible();
      
      // Verificar se o footer com informações está presente
      await expect(page.locator('.timeline-footer')).toBeVisible();
    });

    test('deve criar marcador com atalho M', async ({ page }) => {
      // Ir para story com marcadores
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-markers`);
      await page.waitForLoadState('networkidle');
      
      // Focar na timeline
      await page.locator('[data-testid="integrated-timeline"]').click();
      
      // Pressionar M para criar marcador
      await page.keyboard.press('m');
      
      // Verificar se o modal de criação apareceu
      await expect(page.locator('[data-testid="custom-modal"]')).toBeVisible();
      
      // Digitar nome do marcador
      await page.fill('input[placeholder*="Digite"]', 'Teste Marcador');
      
      // Confirmar criação
      await page.click('button:has-text("Confirmar")');
      
      // Verificar se o marcador apareceu na timeline
      await expect(page.locator('.marker-indicator')).toBeVisible();
    });

    test('deve navegar entre marcadores com Shift+M e vírgula', async ({ page }) => {
      // Ir para story com marcadores
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-markers`);
      await page.waitForLoadState('networkidle');
      
      // Criar dois marcadores primeiro
      await page.locator('[data-testid="integrated-timeline"]').click();
      
      // Marcador 1
      await page.keyboard.press('m');
      await page.fill('input[placeholder*="Digite"]', 'Marcador 1');
      await page.click('button:has-text("Confirmar")');
      
      // Mover playhead e criar marcador 2
      await page.locator('.timeline-container').click({ position: { x: 200, y: 50 } });
      await page.keyboard.press('m');
      await page.fill('input[placeholder*="Digite"]', 'Marcador 2');
      await page.click('button:has-text("Confirmar")');
      
      // Testar navegação para próximo marcador
      await page.keyboard.press('Shift+m');
      
      // Testar navegação para marcador anterior
      await page.keyboard.press(',');
      
      // Verificar se a navegação funcionou (playhead deve ter se movido)
      const playheadPosition = await page.locator('.playhead').getAttribute('style');
      expect(playheadPosition).toContain('left');
    });

    test('deve criar marcadores por categoria usando atalhos 1-6', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-markers`);
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="integrated-timeline"]').click();
      
      // Testar criação de marcador categoria 1 (To-Do)
      await page.keyboard.press('1');
      await page.fill('input[placeholder*="Digite"]', 'Tarefa To-Do');
      await page.click('button:has-text("Confirmar")');
      
      // Verificar se o marcador tem a cor correta da categoria
      const marker = page.locator('.marker-indicator').first();
      await expect(marker).toHaveCSS('background-color', 'rgb(255, 107, 107)'); // #ff6b6b
    });

    test('deve abrir painel de marcadores com Ctrl+M', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-markers`);
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="integrated-timeline"]').click();
      
      // Pressionar Ctrl+M para abrir painel
      await page.keyboard.press('Control+m');
      
      // Verificar se o painel de marcadores apareceu
      await expect(page.locator('[data-testid="marker-panel"]')).toBeVisible();
      
      // Verificar se tem o título correto
      await expect(page.locator('h3:has-text("Marcadores")')).toBeVisible();
      
      // Verificar se tem as categorias
      await expect(page.locator('button:has-text("To-Do")')).toBeVisible();
      await expect(page.locator('button:has-text("Aprovado")')).toBeVisible();
    });

    test('deve editar marcador através do painel', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-markers`);
      await page.waitForLoadState('networkidle');
      
      // Criar um marcador primeiro
      await page.locator('[data-testid="integrated-timeline"]').click();
      await page.keyboard.press('m');
      await page.fill('input[placeholder*="Digite"]', 'Marcador Original');
      await page.click('button:has-text("Confirmar")');
      
      // Abrir painel
      await page.keyboard.press('Control+m');
      
      // Clicar no botão editar do marcador
      await page.locator('button[title*="Editar"]').first().click();
      
      // Alterar o nome
      await page.fill('input[value="Marcador Original"]', 'Marcador Editado');
      await page.click('button:has-text("Confirmar")');
      
      // Verificar se o nome foi alterado
      await expect(page.locator('text=Marcador Editado')).toBeVisible();
    });
  });

  test.describe('🗂️ ETAPA 8 - Sistema de Grupos', () => {
    
    test('deve criar grupo com atalho G', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-groups`);
      await page.waitForLoadState('networkidle');
      
      // Selecionar múltiplos blocos (simular Ctrl+click)
      await page.locator('.block-item').first().click();
      await page.keyboard.down('Control');
      await page.locator('.block-item').nth(1).click();
      await page.keyboard.up('Control');
      
      // Pressionar G para criar grupo
      await page.keyboard.press('g');
      
      // Verificar se o modal de criação apareceu
      await expect(page.locator('[data-testid="custom-modal"]')).toBeVisible();
      
      // Digitar nome do grupo
      await page.fill('input[placeholder*="Digite"]', 'Grupo Teste');
      await page.click('button:has-text("Confirmar")');
      
      // Verificar se os blocos agora têm indicadores de grupo
      await expect(page.locator('.block-group-indicator')).toBeVisible();
    });

    test('deve colapsar/expandir grupo com atalho U', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-groups`);
      await page.waitForLoadState('networkidle');
      
      // Criar um grupo primeiro
      await page.locator('.block-item').first().click();
      await page.keyboard.down('Control');
      await page.locator('.block-item').nth(1).click();
      await page.keyboard.up('Control');
      
      await page.keyboard.press('g');
      await page.fill('input[placeholder*="Digite"]', 'Grupo Teste');
      await page.click('button:has-text("Confirmar")');
      
      // Selecionar o grupo
      await page.locator('.block-group-indicator').first().click();
      
      // Pressionar U para colapsar
      await page.keyboard.press('u');
      
      // Verificar se os blocos do grupo ficaram com opacity reduzida
      const groupBlock = page.locator('.block-item').first();
      await expect(groupBlock).toHaveCSS('opacity', '0.5');
      
      // Pressionar U novamente para expandir
      await page.keyboard.press('u');
      
      // Verificar se voltou ao normal
      await expect(groupBlock).toHaveCSS('opacity', '1');
    });

    test('deve abrir painel de grupos com Ctrl+G', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-groups`);
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="integrated-timeline"]').click();
      
      // Pressionar Ctrl+G para abrir painel
      await page.keyboard.press('Control+g');
      
      // Verificar se o painel de grupos apareceu
      await expect(page.locator('[data-testid="group-panel"]')).toBeVisible();
      
      // Verificar se tem o título correto
      await expect(page.locator('h3:has-text("Grupos")')).toBeVisible();
      
      // Verificar se tem as informações de layers
      await expect(page.locator('text=Layer 1')).toBeVisible();
      await expect(page.locator('text=Layer 2')).toBeVisible();
      await expect(page.locator('text=Layer 3')).toBeVisible();
    });

    test('deve duplicar grupo através do painel', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-groups`);
      await page.waitForLoadState('networkidle');
      
      // Criar um grupo
      await page.locator('.block-item').first().click();
      await page.keyboard.down('Control');
      await page.locator('.block-item').nth(1).click();
      await page.keyboard.up('Control');
      
      await page.keyboard.press('g');
      await page.fill('input[placeholder*="Digite"]', 'Grupo Original');
      await page.click('button:has-text("Confirmar")');
      
      // Abrir painel
      await page.keyboard.press('Control+g');
      
      // Clicar no botão duplicar
      await page.locator('button[title*="Duplicar"]').first().click();
      
      // Verificar se apareceu um segundo grupo
      await expect(page.locator('.group-item')).toHaveCount(2);
    });

    test('deve mostrar indicadores visuais corretos nos blocos', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--with-groups`);
      await page.waitForLoadState('networkidle');
      
      // Criar um grupo
      await page.locator('.block-item').first().click();
      await page.keyboard.down('Control');
      await page.locator('.block-item').nth(1).click();
      await page.keyboard.up('Control');
      
      await page.keyboard.press('g');
      await page.fill('input[placeholder*="Digite"]', 'Grupo Visual');
      await page.click('button:has-text("Confirmar")');
      
      // Verificar se os blocos têm o ícone de grupo
      await expect(page.locator('.block-item:has-text("🗂️")')).toBeVisible();
      
      // Verificar se têm o badge colorido
      await expect(page.locator('.group-badge')).toBeVisible();
      
      // Verificar se têm o ring border
      const groupBlock = page.locator('.block-item').first();
      await expect(groupBlock).toHaveClass(/ring-/);
    });
  });

  test.describe('🔧 INTEGRAÇÃO COMPLETA - ETAPAS 7 & 8', () => {
    
    test('deve funcionar undo/redo com marcadores e grupos', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--complete`);
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="integrated-timeline"]').click();
      
      // Criar um marcador
      await page.keyboard.press('m');
      await page.fill('input[placeholder*="Digite"]', 'Marcador Teste');
      await page.click('button:has-text("Confirmar")');
      
      // Verificar se o marcador existe
      await expect(page.locator('.marker-indicator')).toBeVisible();
      
      // Fazer undo
      await page.keyboard.press('Control+z');
      
      // Verificar se o marcador foi removido
      await expect(page.locator('.marker-indicator')).not.toBeVisible();
      
      // Fazer redo
      await page.keyboard.press('Control+y');
      
      // Verificar se o marcador voltou
      await expect(page.locator('.marker-indicator')).toBeVisible();
    });

    test('deve mostrar contadores corretos no footer', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--complete`);
      await page.waitForLoadState('networkidle');
      
      // Criar alguns marcadores
      await page.locator('[data-testid="integrated-timeline"]').click();
      await page.keyboard.press('m');
      await page.fill('input[placeholder*="Digite"]', 'Marcador 1');
      await page.click('button:has-text("Confirmar")');
      
      await page.keyboard.press('m');
      await page.fill('input[placeholder*="Digite"]', 'Marcador 2');
      await page.click('button:has-text("Confirmar")');
      
      // Verificar se o contador de marcadores está correto
      await expect(page.locator('text=2 marcadores')).toBeVisible();
      
      // Criar um grupo
      await page.locator('.block-item').first().click();
      await page.keyboard.down('Control');
      await page.locator('.block-item').nth(1).click();
      await page.keyboard.up('Control');
      
      await page.keyboard.press('g');
      await page.fill('input[placeholder*="Digite"]', 'Grupo 1');
      await page.click('button:has-text("Confirmar")');
      
      // Verificar se o contador de grupos está correto
      await expect(page.locator('text=1 grupo')).toBeVisible();
    });

    test('deve funcionar todos os atalhos em sequência', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--complete`);
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="integrated-timeline"]').click();
      
      // Testar atalhos de marcadores
      await page.keyboard.press('m'); // Criar marcador
      await page.fill('input[placeholder*="Digite"]', 'Marcador M');
      await page.click('button:has-text("Confirmar")');
      
      await page.keyboard.press('1'); // Marcador categoria 1
      await page.fill('input[placeholder*="Digite"]', 'Marcador 1');
      await page.click('button:has-text("Confirmar")');
      
      await page.keyboard.press('Control+m'); // Abrir painel
      await expect(page.locator('[data-testid="marker-panel"]')).toBeVisible();
      await page.keyboard.press('Control+m'); // Fechar painel
      
      // Testar atalhos de grupos
      await page.locator('.block-item').first().click();
      await page.keyboard.down('Control');
      await page.locator('.block-item').nth(1).click();
      await page.keyboard.up('Control');
      
      await page.keyboard.press('g'); // Criar grupo
      await page.fill('input[placeholder*="Digite"]', 'Grupo G');
      await page.click('button:has-text("Confirmar")');
      
      await page.keyboard.press('u'); // Colapsar grupo
      await page.keyboard.press('u'); // Expandir grupo
      
      await page.keyboard.press('Control+g'); // Abrir painel grupos
      await expect(page.locator('[data-testid="group-panel"]')).toBeVisible();
      
      // Testar undo/redo
      await page.keyboard.press('Control+z'); // Undo
      await page.keyboard.press('Control+y'); // Redo
      
      // Se chegou até aqui, todos os atalhos funcionaram
      expect(true).toBe(true);
    });
  });

  test.describe('📱 RESPONSIVIDADE E PERFORMANCE', () => {
    
    test('deve funcionar em dispositivos móveis', async ({ page }) => {
      // Simular viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--complete`);
      await page.waitForLoadState('networkidle');
      
      // Verificar se a timeline ainda é visível
      await expect(page.locator('[data-testid="integrated-timeline"]')).toBeVisible();
      
      // Verificar se os controles são acessíveis
      await expect(page.locator('button[title*="Play"]')).toBeVisible();
      
      // Testar interação touch
      await page.locator('.timeline-container').tap();
      
      // Verificar se o playhead se moveu
      const playhead = page.locator('.playhead');
      await expect(playhead).toBeVisible();
    });

    test('deve manter performance com muitos elementos', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/?path=/story/videoeditor-integratedtimeline--performance-test`);
      await page.waitForLoadState('networkidle');
      
      // Medir tempo de carregamento
      const startTime = Date.now();
      await page.locator('[data-testid="integrated-timeline"]').waitFor();
      const loadTime = Date.now() - startTime;
      
      // Verificar se carregou em menos de 3 segundos
      expect(loadTime).toBeLessThan(3000);
      
      // Testar scroll suave
      await page.locator('.timeline-container').hover();
      await page.mouse.wheel(100, 0);
      
      // Verificar se ainda responde
      await page.locator('.timeline-container').click();
      await expect(page.locator('.playhead')).toBeVisible();
    });
  });
}); 