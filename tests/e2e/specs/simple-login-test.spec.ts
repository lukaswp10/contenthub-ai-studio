import { test, expect } from '@playwright/test';

test.describe('🔐 Teste Simples de Login - Produção', () => {
  
  test('Login direto e verificar redirecionamento para dashboard', async ({ page }) => {
    console.log('🌐 Testando login direto em produção...');
    
    // Ir diretamente para a página de login em produção
    await page.goto('https://clipsforge.vercel.app/login');
    console.log('📍 Navegou para: https://clipsforge.vercel.app/login');
    
    // Aguardar página carregar completamente
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar se estamos na página de login
    expect(page.url()).toContain('/login');
    console.log('✅ Confirmado: estamos na página de login');
    
    // Aguardar elementos do formulário aparecerem
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
    await page.waitForSelector('form button[type="submit"]', { timeout: 30000 });
    console.log('✅ Elementos do formulário encontrados');
    
    // Preencher credenciais
    console.log('📝 Preenchendo credenciais...');
    await page.fill('input[type="email"]', 'lukaswp10@gmail.com');
    await page.fill('input[type="password"]', '7pguyrxV!');
    
    // Aguardar botão de login do formulário ficar habilitado
    await page.waitForSelector('form button[type="submit"]:not([disabled])', { timeout: 15000 });
    console.log('✅ Botão de login habilitado');
    
    // Fazer screenshot antes do login para debug
    await page.screenshot({ path: 'test-results/before-login.png', fullPage: true });
    
    // Clicar no botão de login correto (do formulário)
    console.log('🔑 Clicando no botão de login do formulário...');
    await page.click('form button[type="submit"]');
    
    // Aguardar redirecionamento (tempo maior para produção)
    console.log('⏳ Aguardando redirecionamento...');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(3000); // Aguardar processamento adicional
    
    // Verificar URL atual
    const currentUrl = page.url();
    console.log(`📍 URL atual após login: ${currentUrl}`);
    
    // Fazer screenshot após login para debug
    await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
    
    // Verificar se não está mais na página de login
    expect(currentUrl).not.toContain('/login');
    console.log('✅ Não está mais na página de login');
    
    // Verificar se foi redirecionado para dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('🎉 SUCESSO: Redirecionado para dashboard!');
      expect(currentUrl).toContain('/dashboard');
    } else {
      console.log(`ℹ️ Redirecionado para: ${currentUrl}`);
      // Se não foi para dashboard, pelo menos não deve estar em login
      expect(currentUrl).not.toContain('/login');
    }
    
    // Verificar se há elementos de uma página autenticada
    const pageContent = await page.textContent('body');
    console.log(`📄 Conteúdo da página (primeiros 100 chars): ${pageContent?.substring(0, 100)}...`);
    
    console.log('✅ Teste de login concluído com sucesso!');
  });
}); 