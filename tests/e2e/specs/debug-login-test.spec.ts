import { test, expect } from '@playwright/test';

test.describe('🔍 Debug Login - Produção', () => {
  
  test('Debug detalhado do processo de login', async ({ page }) => {
    console.log('🔍 Iniciando debug detalhado do login...');
    
    // Interceptar requisições de rede
    page.on('request', request => {
      if (request.url().includes('auth') || request.url().includes('login') || request.url().includes('supabase')) {
        console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('login') || response.url().includes('supabase')) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
    
    // Capturar erros de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
      }
    });
    
    // Ir para página de login
    await page.goto('https://clipsforge.vercel.app/login');
    console.log('📍 Navegou para login');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verificar elementos presentes na página - USANDO SELETORES CORRETOS
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    // Usar o botão do formulário, não o do header
    const loginButton = page.locator('form button[type="submit"]');
    
    console.log(`📝 Email input visível: ${await emailInput.isVisible()}`);
    console.log(`📝 Password input visível: ${await passwordInput.isVisible()}`);
    console.log(`🔘 Login button visível: ${await loginButton.isVisible()}`);
    console.log(`🔘 Login button habilitado: ${await loginButton.isEnabled()}`);
    
    // Screenshot antes de preencher
    await page.screenshot({ path: 'debug-before-fill.png', fullPage: true });
    
    // Preencher formulário devagar
    console.log('📝 Preenchendo email...');
    await emailInput.fill('lukaswp10@gmail.com');
    await page.waitForTimeout(1000);
    
    console.log('📝 Preenchendo senha...');
    await passwordInput.fill('7pguyrxV!');
    await page.waitForTimeout(1000);
    
    // Verificar valores preenchidos
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    console.log(`📧 Email preenchido: ${emailValue}`);
    console.log(`🔑 Senha preenchida: ${passwordValue ? '***' : 'VAZIA'}`);
    
    // Screenshot após preencher
    await page.screenshot({ path: 'debug-after-fill.png', fullPage: true });
    
    // Verificar se botão está habilitado
    await page.waitForTimeout(2000);
    const isButtonEnabled = await loginButton.isEnabled();
    console.log(`🔘 Botão habilitado após preenchimento: ${isButtonEnabled}`);
    
    if (!isButtonEnabled) {
      console.log('⚠️ Aguardando botão ficar habilitado...');
      await page.waitForSelector('form button[type="submit"]:not([disabled])', { timeout: 15000 });
      console.log('✅ Botão agora está habilitado!');
    }
    
    // Screenshot antes de clicar
    await page.screenshot({ path: 'debug-before-click.png', fullPage: true });
    
    console.log('🔑 Clicando no botão de login...');
    await loginButton.click();
    
    // Aguardar um pouco e verificar mudanças
    await page.waitForTimeout(3000);
    
    // Screenshot logo após clicar
    await page.screenshot({ path: 'debug-after-click.png', fullPage: true });
    
    // Verificar URL atual
    const urlAfterClick = page.url();
    console.log(`📍 URL após clicar: ${urlAfterClick}`);
    
    // Aguardar mais tempo para possível redirecionamento
    console.log('⏳ Aguardando possível redirecionamento...');
    await page.waitForTimeout(10000);
    
    // Verificar URL final
    const finalUrl = page.url();
    console.log(`📍 URL final: ${finalUrl}`);
    
    // Screenshot final
    await page.screenshot({ path: 'debug-final.png', fullPage: true });
    
    // Verificar se há mensagens de erro na página
    const errorMessages = await page.locator('[role="alert"], .error, .alert-error').allTextContents();
    if (errorMessages.length > 0) {
      console.log(`❌ Mensagens de erro encontradas: ${errorMessages.join(', ')}`);
    } else {
      console.log('✅ Nenhuma mensagem de erro visível');
    }
    
    // Verificar conteúdo da página
    const pageTitle = await page.title();
    console.log(`📄 Título da página: ${pageTitle}`);
    
    // Se ainda estamos no login, vamos verificar o estado do formulário
    if (finalUrl.includes('/login')) {
      console.log('🔍 Ainda na página de login - verificando estado...');
      
      const currentEmailValue = await emailInput.inputValue();
      const currentPasswordValue = await passwordInput.inputValue();
      console.log(`📧 Email atual: ${currentEmailValue}`);
      console.log(`🔑 Senha atual: ${currentPasswordValue ? '***' : 'VAZIA'}`);
      
      // Verificar se há loading ou processamento
      const loadingElements = await page.locator('[aria-busy="true"], .loading, .spinner').count();
      console.log(`⏳ Elementos de loading: ${loadingElements}`);
    } else {
      console.log('🎉 SUCESSO: Saiu da página de login!');
      if (finalUrl.includes('/dashboard')) {
        console.log('🎯 Redirecionado para dashboard!');
      }
    }
    
    console.log('🔍 Debug concluído');
    
    // Não vamos fazer assert para não falhar - só queremos ver o que acontece
  });
}); 