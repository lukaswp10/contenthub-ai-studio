import { test, expect } from '@playwright/test';
import { E2E_CONFIG } from '../config/test-config';

test.describe('📊 ClipsForge - Dashboard', () => {
  
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
  
  test('Dashboard carrega corretamente após login', async ({ page }) => {
    console.log('📊 Testando carregamento do dashboard...');
    
    // Fazer login
    await loginUser(page);
    
    // Verificar que está no dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
    console.log(`📍 Dashboard carregado: ${currentUrl}`);
    
    // Verificar elementos principais do dashboard
    await expect(page.locator('h1')).toContainText(['ClipsForge Pro', 'Bem-vindo ao ClipsForge Pro! 👋']);
    
    // Verificar que o header está presente com email e botão de logout
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header span:has-text("lukaswp10@gmail.com")')).toBeVisible();
    await expect(page.locator('header button:has-text("Sair")')).toBeVisible();
    
    console.log('✅ Dashboard carregado com sucesso!');
  });
  
  test('Verificar estatísticas do dashboard', async ({ page }) => {
    console.log('📈 Testando estatísticas do dashboard...');
    
    await loginUser(page);
    
    // Verificar cards de estatísticas
    const statsCards = [
      'Total de Clips',
      'Total de Views', 
      'Engajamento',
      'Shares'
    ];
    
    for (const statName of statsCards) {
      const statCard = page.locator(`text=${statName}`);
      await expect(statCard).toBeVisible();
      console.log(`📊 Estatística encontrada: ${statName}`);
    }
    
    console.log('✅ Estatísticas do dashboard verificadas!');
  });
  
  test('Verificar seção de upload rápido', async ({ page }) => {
    console.log('📤 Testando seção de upload rápido...');
    
    await loginUser(page);
    
    // Verificar título da seção (pode haver múltiplos elementos)
    await expect(page.locator('text=📤 Upload Rápido').first()).toBeVisible();
    
    // Verificar área de upload (zona de drop)
    const uploadArea = page.locator('text=📤 Upload Rápido').locator('..').locator('..').locator('div').last();
    await expect(uploadArea).toBeVisible();
    
    // Verificar texto de instruções
    const uploadInstructions = page.locator('text=Arraste e solte ou clique para selecionar');
    await expect(uploadInstructions).toBeVisible();
    
    console.log('✅ Seção de upload rápido verificada!');
  });
  
  test('Verificar galeria de vídeos', async ({ page }) => {
    console.log('🎬 Testando galeria de vídeos...');
    
    await loginUser(page);
    
    // Verificar título da galeria - SEMPRE VISÍVEL
    await expect(page.locator('text=🎬 Meus Vídeos')).toBeVisible();
    
    // Verificar se há vídeos ou mensagem de galeria vazia
    const hasUploadButton = await page.locator('text=Fazer Upload').count() > 0;
    const hasEmptyMessage = await page.locator('text=Nenhum vídeo na galeria').count() > 0;
    const hasEmptyCard = await page.locator('text=Comece fazendo upload de um vídeo').count() > 0;
    
    if (hasUploadButton || hasEmptyMessage || hasEmptyCard) {
      console.log('📁 Galeria vazia detectada - estado inicial correto');
    } else {
      console.log('📁 Galeria com vídeos - verificando estrutura');
      
      // Se há vídeos, verificar controles de busca
      const searchInput = page.locator('input[placeholder="Buscar vídeos..."]');
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        console.log('🔍 Controles de busca encontrados');
      }
    }
    
    console.log('✅ Galeria de vídeos verificada!');
  });
  

  
}); 