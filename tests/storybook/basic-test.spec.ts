import { test, expect } from '@playwright/test';

// Teste básico para verificar se o sistema está funcionando
test.describe('🧪 Teste Básico - Verificação do Sistema', () => {
  
  test('deve carregar o Storybook corretamente', async ({ page }) => {
    // Ir para a página inicial do Storybook
    await page.goto('http://localhost:6006');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar se o título contém "Storybook"
    await expect(page).toHaveTitle(/Storybook/);
    
    // Verificar se o sidebar está presente
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Storybook carregou corretamente!');
  });

  test('deve navegar para uma story do IntegratedTimeline', async ({ page }) => {
    // Ir para uma story específica
    await page.goto('http://localhost:6006/?path=/story/videoeditor-integratedtimeline--default');
    
    // Aguardar carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar se o iframe da story está presente
    const storyFrame = page.frameLocator('#storybook-preview-iframe');
    
    // Aguardar o componente aparecer no iframe
    await storyFrame.locator('div').first().waitFor({ timeout: 15000 });
    
    console.log('✅ Story do IntegratedTimeline carregou!');
  });

  test('deve verificar se existem controles na story', async ({ page }) => {
    // Ir para a story Default
    await page.goto('http://localhost:6006/?path=/story/videoeditor-integratedtimeline--default');
    await page.waitForLoadState('networkidle');
    
    // Aguardar o iframe carregar
    const storyFrame = page.frameLocator('#storybook-preview-iframe');
    
    // Verificar se há algum botão na interface
    const buttons = storyFrame.locator('button');
    await expect(buttons.first()).toBeVisible({ timeout: 15000 });
    
    // Contar quantos botões existem
    const buttonCount = await buttons.count();
    console.log(`✅ Encontrados ${buttonCount} botões na interface!`);
    
    // Verificar se há pelo menos 3 botões (Play, Pause, Stop)
    expect(buttonCount).toBeGreaterThanOrEqual(3);
  });

  test('deve verificar responsividade básica', async ({ page }) => {
    // Testar em desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:6006/?path=/story/videoeditor-integratedtimeline--default');
    await page.waitForLoadState('networkidle');
    
    const storyFrame = page.frameLocator('#storybook-preview-iframe');
    await storyFrame.locator('div').first().waitFor({ timeout: 15000 });
    
    console.log('✅ Desktop (1200x800) funcionando!');
    
    // Testar em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000); // Aguardar reflow
    
    // Verificar se ainda está visível
    await expect(storyFrame.locator('div').first()).toBeVisible();
    
    console.log('✅ Mobile (375x667) funcionando!');
  });
}); 