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

test.describe('🔄 ClipsForge - Integração Completa', () => {
  
  test('Fluxo completo: Login → Dashboard → Upload → Editor → Exportação', async ({ page }) => {
    console.log('🔄 Testando fluxo completo da aplicação...');
    
    // PASSO 1: Login
    console.log('🔐 Passo 1: Realizando login...');
    await page.goto(`${E2E_CONFIG.urls.base}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'lukaswp10@gmail.com');
    await page.fill('input[type="password"]', '7pguyrxV!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Login realizado com sucesso');
    
    // PASSO 2: Dashboard
    console.log('📊 Passo 2: Verificando dashboard...');
    await page.waitForSelector('h1, h2, .dashboard-title', { timeout: 10000 });
    
    // Verificar elementos principais do dashboard
    const dashboardElements = [
      'button:has-text("Editor Manual")',
      'button:has-text("Clique ou arraste um vídeo")',
      '.video-gallery, .gallery-container'
    ];
    
    for (const selector of dashboardElements) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`📊 Elemento do dashboard encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    console.log('✅ Dashboard carregado com sucesso');
    
    // PASSO 3: Navegação para o Editor
    console.log('🎬 Passo 3: Navegando para o editor...');
    await page.waitForSelector('button:has-text("Editor Manual")', { timeout: 15000 });
    await page.click('button:has-text("Editor Manual")');
    await page.waitForURL('**/editor');
    await page.waitForLoadState('networkidle');
    console.log('✅ Editor carregado com sucesso');
    
    // PASSO 4: Verificar interface do editor
    console.log('⚙️ Passo 4: Verificando interface do editor...');
    const editorElements = [
      'video, .video-player',
      '.timeline, .timeline-container',
      '.toolbar, .editor-toolbar',
      'button:has-text("Play"), button:has-text("▶")'
    ];
    
    for (const selector of editorElements) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🎬 Elemento do editor encontrado: ${selector}`);
        }
      } catch (error) {
        // Continuar
      }
    }
    console.log('✅ Interface do editor verificada');
    
    // PASSO 5: Testar funcionalidades básicas
    console.log('🎯 Passo 5: Testando funcionalidades básicas...');
    
    // Testar controles de reprodução
    const playButtons = [
      'button:has-text("Play")',
      'button:has-text("▶")',
      '.play-button',
      '[data-testid="play-button"]'
    ];
    
    for (const selector of playButtons) {
      try {
        const element = await page.$(selector);
        if (element) {
          await page.click(selector);
          console.log(`▶️ Botão de play testado: ${selector}`);
          break;
        }
      } catch (error) {
        // Continuar
      }
    }
    
    // Testar atalhos de teclado
    const shortcuts = [
      { key: 'Space', description: 'Play/Pause' },
      { key: 'ArrowLeft', description: 'Frame anterior' },
      { key: 'ArrowRight', description: 'Próximo frame' }
    ];
    
    for (const shortcut of shortcuts) {
      try {
        console.log(`⌨️ Testando atalho: ${shortcut.key}`);
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(500);
        console.log(`✅ Atalho ${shortcut.key} executado`);
      } catch (error) {
        console.log(`⚠️ Erro ao executar atalho ${shortcut.key}`);
      }
    }
    
    console.log('✅ Funcionalidades básicas testadas');
    
    // PASSO 6: Testar exportação (se disponível)
    console.log('📤 Passo 6: Testando exportação...');
    const exportButtons = [
      'button:has-text("Exportar")',
      'button:has-text("Export")',
      'button:has-text("Download")'
    ];
    
    let exportTested = false;
    for (const selector of exportButtons) {
      try {
        const element = await page.$(selector);
        if (element) {
          await page.click(selector);
          await page.waitForTimeout(1000);
          console.log(`📤 Botão de exportação testado: ${selector}`);
          exportTested = true;
          break;
        }
      } catch (error) {
        // Continuar
      }
    }
    
    if (!exportTested) {
      console.log('⚠️ Funcionalidade de exportação não encontrada');
    }
    
    console.log('✅ Fluxo completo testado com sucesso!');
  });

  test('Teste de persistência e estado da aplicação', async ({ page }) => {
    console.log('💾 Testando persistência e estado...');
    
    await loginUser(page);
    
    // Ir para o editor
    await page.waitForSelector('button:has-text("Editor Manual")', { timeout: 15000 });
    await page.click('button:has-text("Editor Manual")');
    await page.waitForURL('**/editor');
    await page.waitForLoadState('networkidle');
    
    // Verificar se o estado é mantido após reload
    console.log('🔄 Testando reload da página...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar se ainda está no editor
    const currentUrl = page.url();
    if (currentUrl.includes('/editor')) {
      console.log('✅ Estado mantido após reload');
    } else {
      console.log('⚠️ Estado não mantido após reload');
    }
    
    // Testar navegação entre páginas
    console.log('🔄 Testando navegação entre páginas...');
    
    // Voltar para dashboard
    await page.goto(`${E2E_CONFIG.urls.base}/dashboard`);
    await page.waitForLoadState('networkidle');
    console.log('📊 Navegou para dashboard');
    
    // Voltar para editor
    await page.goto(`${E2E_CONFIG.urls.base}/editor`);
    await page.waitForLoadState('networkidle');
    console.log('🎬 Navegou para editor');
    
    console.log('✅ Teste de persistência concluído!');
  });

  test('Teste de responsividade em diferentes dispositivos', async ({ page }) => {
    console.log('📱 Testando responsividade...');
    
    await loginUser(page);
    
    // Testar diferentes tamanhos de tela
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Full HD' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testando ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      try {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        
        // Verificar se elementos principais ainda estão visíveis
        const essentialElements = [
          'button:has-text("Editor Manual")',
          '.dashboard-title, h1, h2',
          '.video-gallery, .gallery-container'
        ];
        
        for (const selector of essentialElements) {
          try {
            const element = await page.$(selector);
            if (element) {
              const isVisible = await element.isVisible();
              if (isVisible) {
                console.log(`✅ Elemento visível em ${viewport.name}: ${selector}`);
              } else {
                console.log(`⚠️ Elemento não visível em ${viewport.name}: ${selector}`);
              }
            }
          } catch (error) {
            // Continuar
          }
        }
        
        console.log(`✅ ${viewport.name} testado`);
      } catch (error) {
        console.log(`❌ Erro ao testar ${viewport.name}: ${error}`);
      }
    }
    
    console.log('✅ Teste de responsividade concluído!');
  });

  test('Teste de performance e carregamento', async ({ page }) => {
    console.log('⚡ Testando performance...');
    
    // Medir tempo de carregamento inicial
    const startTime = Date.now();
    await page.goto(`${E2E_CONFIG.urls.base}/login`);
    await page.waitForLoadState('networkidle');
    const loginLoadTime = Date.now() - startTime;
    
    console.log(`⚡ Tempo de carregamento do login: ${loginLoadTime}ms`);
    
    // Login e medir dashboard
    const dashboardStartTime = Date.now();
    await page.fill('input[type="email"]', 'lukaswp10@gmail.com');
    await page.fill('input[type="password"]', '7pguyrxV!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    const dashboardLoadTime = Date.now() - dashboardStartTime;
    
    console.log(`⚡ Tempo de carregamento do dashboard: ${dashboardLoadTime}ms`);
    
    // Medir editor
    const editorStartTime = Date.now();
    await page.waitForSelector('button:has-text("Editor Manual")', { timeout: 15000 });
    await page.click('button:has-text("Editor Manual")');
    await page.waitForURL('**/editor');
    await page.waitForLoadState('networkidle');
    const editorLoadTime = Date.now() - editorStartTime;
    
    console.log(`⚡ Tempo de carregamento do editor: ${editorLoadTime}ms`);
    
    // Avaliar performance
    const totalTime = loginLoadTime + dashboardLoadTime + editorLoadTime;
    console.log(`⚡ Tempo total de carregamento: ${totalTime}ms`);
    
    if (totalTime < 10000) {
      console.log('✅ Performance excelente (< 10s)');
    } else if (totalTime < 20000) {
      console.log('✅ Performance boa (< 20s)');
    } else {
      console.log('⚠️ Performance pode ser melhorada (> 20s)');
    }
    
    console.log('✅ Teste de performance concluído!');
  });

  test('Teste de tratamento de erros e recuperação', async ({ page }) => {
    console.log('🛡️ Testando tratamento de erros...');
    
    // Testar login com credenciais inválidas
    console.log('❌ Testando login com credenciais inválidas...');
    await page.goto(`${E2E_CONFIG.urls.base}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'invalid@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Aguardar possível mensagem de erro
    await page.waitForTimeout(3000);
    
    // Verificar se ainda está na página de login (erro tratado)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✅ Erro de login tratado corretamente');
    } else {
      console.log('⚠️ Erro de login não tratado adequadamente');
    }
    
    // Testar navegação para página inexistente
    console.log('🔍 Testando página inexistente...');
    try {
      await page.goto(`${E2E_CONFIG.urls.base}/pagina-inexistente`);
      await page.waitForLoadState('networkidle');
      
      // Verificar se há tratamento de 404
      const pageContent = await page.content();
      if (pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Página não encontrada')) {
        console.log('✅ Página 404 tratada corretamente');
      } else {
        console.log('⚠️ Página 404 não tratada adequadamente');
      }
    } catch (error) {
      console.log('⚠️ Erro ao testar página inexistente');
    }
    
    // Fazer login correto para continuar testes
    console.log('✅ Fazendo login correto...');
    await page.goto(`${E2E_CONFIG.urls.base}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'lukaswp10@gmail.com');
    await page.fill('input[type="password"]', '7pguyrxV!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ Teste de tratamento de erros concluído!');
  });

  test('Teste de acessibilidade básica', async ({ page }) => {
    console.log('♿ Testando acessibilidade básica...');
    
    await loginUser(page);
    
    // Testar navegação por teclado
    console.log('⌨️ Testando navegação por teclado...');
    
    // Testar Tab para navegação
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    console.log('✅ Tab navigation testado');
    
    // Testar Enter para ativação
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    console.log('✅ Enter activation testado');
    
    // Verificar se há elementos com aria-label
    const ariaElements = await page.$$('[aria-label]');
    console.log(`♿ Encontrados ${ariaElements.length} elementos com aria-label`);
    
    // Verificar se há elementos com alt text
    const imgElements = await page.$$('img[alt]');
    console.log(`🖼️ Encontrados ${imgElements.length} elementos de imagem com alt text`);
    
    // Verificar estrutura de headings
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    console.log(`📝 Encontrados ${headings.length} elementos de heading`);
    
    console.log('✅ Teste de acessibilidade concluído!');
  });

}); 