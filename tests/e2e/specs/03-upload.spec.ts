import { test, expect } from '@playwright/test';
import { E2E_CONFIG } from '../config/test-config';

test.describe('📤 ClipsForge - Upload', () => {
  
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
  
  test('Página de upload redireciona para dashboard', async ({ page }) => {
    console.log('📤 Testando redirecionamento de upload...');
    
    await loginUser(page);
    
    // Navegar para /upload
    await page.goto(`${E2E_CONFIG.urls.base}/upload`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que foi redirecionado para dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
    console.log(`📍 Redirecionado para: ${currentUrl}`);
    
    console.log('✅ Redirecionamento funcionando corretamente!');
  });
  
  test('Seção de upload rápido no dashboard', async ({ page }) => {
    console.log('📤 Testando seção de upload rápido...');
    
    await loginUser(page);
    
    // Verificar título da seção
    await expect(page.locator('h2:has-text("📤 Upload Rápido")')).toBeVisible();
    
    // Verificar área de upload
    const uploadArea = page.locator('div').filter({ hasText: 'Arraste e solte' }).first();
    await expect(uploadArea).toBeVisible();
    
    // Verificar texto de instruções
    await expect(page.locator('text=Arraste e solte ou clique para selecionar')).toBeVisible();
    
    console.log('✅ Seção de upload rápido verificada!');
  });
  
  test('Botões de upload no dashboard', async ({ page }) => {
    console.log('🔘 Testando botões de upload...');
    
    await loginUser(page);
    
    // Verificar botão de upload na galeria
    const uploadButton = page.locator('button:has-text("Upload")').first();
    await expect(uploadButton).toBeVisible();
    
    // Verificar botão "Fazer Upload" se galeria estiver vazia
    const makeUploadButton = page.locator('button:has-text("Fazer Upload")');
    const hasUploadButton = await makeUploadButton.count() > 0;
    
    if (hasUploadButton) {
      await expect(makeUploadButton).toBeVisible();
      console.log('📁 Botão "Fazer Upload" encontrado (galeria vazia)');
    } else {
      console.log('📁 Galeria com conteúdo, botão "Upload" disponível');
    }
    
    console.log('✅ Botões de upload verificados!');
  });
  
  test('Upload de arquivo - interface básica', async ({ page }) => {
    console.log('📁 Testando interface de upload...');
    
    await loginUser(page);
    
    // Verificar se há input de arquivo
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    
    // Verificar se aceita tipos de vídeo
    const acceptAttr = await fileInput.getAttribute('accept');
    if (acceptAttr) {
      expect(acceptAttr).toContain('video');
      console.log(`📹 Aceita tipos de arquivo: ${acceptAttr}`);
    }
    
    // Verificar área de drag & drop
    const dropArea = page.locator('[data-testid="upload-area"], .upload-area, div').filter({ hasText: 'Arraste e solte' }).first();
    await expect(dropArea).toBeVisible();
    
    console.log('✅ Interface de upload verificada!');
  });
  
  test('Navegação para upload via botões', async ({ page }) => {
    console.log('🧭 Testando navegação para upload...');
    
    await loginUser(page);
    
    // Tentar clicar no botão de upload da galeria
    const uploadButton = page.locator('button:has-text("Upload")').first();
    if (await uploadButton.count() > 0) {
      await uploadButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verificar se permaneceu no dashboard (comportamento esperado)
      const currentUrl = page.url();
      expect(currentUrl).toContain('/dashboard');
      console.log('📍 Botão de upload mantém no dashboard (correto)');
    }
    
    // Tentar botão "Fazer Upload" se existir
    const makeUploadButton = page.locator('button:has-text("Fazer Upload")');
    if (await makeUploadButton.count() > 0) {
      await makeUploadButton.click();
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('/dashboard');
      console.log('📍 Botão "Fazer Upload" redireciona para dashboard (correto)');
    }
    
    console.log('✅ Navegação para upload verificada!');
  });
  
  test('Verificar estado inicial da galeria', async ({ page }) => {
    console.log('📁 Testando estado inicial da galeria...');
    
    await loginUser(page);
    
    // Aguardar carregamento completo
    await page.waitForTimeout(2000);
    
    // Verificar se há conteúdo na galeria
    const hasVideos = await page.locator('button:has-text("Editar")').count() > 0;
    const hasEmptyState = await page.locator('text=Comece fazendo upload de um vídeo').count() > 0;
    
    if (hasVideos) {
      console.log('📹 Galeria tem vídeos - verificando controles');
      
      // Verificar controles de busca
      const searchInput = page.locator('input[placeholder="Buscar vídeos..."]');
      await expect(searchInput).toBeVisible();
      
      // Verificar botões de ação
      const editButtons = page.locator('button:has-text("Editar")');
      await expect(editButtons.first()).toBeVisible();
      
    } else if (hasEmptyState) {
      console.log('📁 Galeria vazia - verificando estado inicial');
      
      // Verificar mensagem de estado vazio
      await expect(page.locator('text=Comece fazendo upload de um vídeo')).toBeVisible();
      
      // Verificar botão de upload
      await expect(page.locator('button:has-text("Fazer Upload")')).toBeVisible();
    }
    
    console.log('✅ Estado inicial da galeria verificado!');
  });
  
}); 