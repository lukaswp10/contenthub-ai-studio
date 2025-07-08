import { test, expect } from '@playwright/test';

// Teste super simples para verificar se o básico funciona
test.describe('✅ Teste Simples - Verificação Básica', () => {
  
  test('deve carregar a página do Storybook', async ({ page }) => {
    console.log('🔍 Tentando carregar Storybook...');
    
    // Ir para o Storybook
    await page.goto('http://localhost:6006');
    
    // Aguardar carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar se o título contém "Storybook"
    await expect(page).toHaveTitle(/Storybook/);
    
    console.log('✅ Storybook carregou com sucesso!');
  });

  test('deve acessar uma story específica', async ({ page }) => {
    console.log('🔍 Tentando carregar story específica...');
    
    // Ir diretamente para uma story
    await page.goto('http://localhost:6006/?path=/story/videoeditor-integratedtimeline--default');
    
    // Aguardar carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar se a URL mudou corretamente
    expect(page.url()).toContain('videoeditor-integratedtimeline--default');
    
    console.log('✅ Story carregada com sucesso!');
  });

  test('deve encontrar o iframe da story', async ({ page }) => {
    console.log('🔍 Procurando iframe da story...');
    
    await page.goto('http://localhost:6006/?path=/story/videoeditor-integratedtimeline--default');
    await page.waitForLoadState('networkidle');
    
    // Verificar se o iframe existe
    const iframe = page.locator('#storybook-preview-iframe');
    await expect(iframe).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Iframe encontrado!');
  });

  test('deve verificar se há conteúdo no iframe', async ({ page }) => {
    console.log('🔍 Verificando conteúdo do iframe...');
    
    await page.goto('http://localhost:6006/?path=/story/videoeditor-integratedtimeline--default');
    await page.waitForLoadState('networkidle');
    
    // Acessar o conteúdo do iframe
    const storyFrame = page.frameLocator('#storybook-preview-iframe');
    
    // Aguardar qualquer elemento aparecer
    await storyFrame.locator('*').first().waitFor({ timeout: 15000 });
    
    // Verificar se há pelo menos um elemento
    const elementCount = await storyFrame.locator('*').count();
    expect(elementCount).toBeGreaterThan(0);
    
    console.log(`✅ Encontrados ${elementCount} elementos no iframe!`);
  });

  test('deve fazer screenshot para debug', async ({ page }) => {
    console.log('📸 Fazendo screenshot para debug...');
    
    await page.goto('http://localhost:6006/?path=/story/videoeditor-integratedtimeline--default');
    await page.waitForLoadState('networkidle');
    
    // Fazer screenshot da página inteira
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    
    console.log('✅ Screenshot salvo como debug-screenshot.png');
  });
}); 