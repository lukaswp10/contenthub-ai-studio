/**
 * 🔍 DIAGNÓSTICO CHROMIUM VERCEL - ClipsForge Pro
 * 
 * Função específica para diagnosticar problemas do Chromium em produção
 * Logs apenas em produção, não polui ambiente local
 * 
 * @author ClipsForge Team
 * @version 1.0.0 - Diagnóstico
 */

export default async function handler(req, res) {
  const isProduction = process.env.VERCEL_ENV === 'production';
  
  // ✅ LOGS CONDICIONAIS (só produção)
  const log = (message) => {
    if (isProduction) {
      console.log(message);
    }
  };
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  log('🔥 DIAGNÓSTICO: Função iniciou');
  
  const diagnostico = {
    ambiente: isProduction ? 'PRODUÇÃO' : 'LOCAL',
    timestamp: new Date().toISOString(),
    etapas: [],
    sucesso: false,
    erro: null
  };

  try {
    // ===== ETAPA 1: TESTAR IMPORTS =====
    log('📦 ETAPA 1: Testando imports das dependências...');
    diagnostico.etapas.push('ETAPA 1: Imports iniciado');
    
    let chromium, puppeteer;
    
    try {
      // ✅ CORREÇÃO: ES6 import dinâmico
      chromium = await import('@sparticuz/chromium');
      chromium = chromium.default || chromium; // Handle default export
      log('✅ @sparticuz/chromium: CARREGADO (ES6)');
      diagnostico.etapas.push('@sparticuz/chromium: OK (ES6)');
    } catch (error) {
      log(`❌ @sparticuz/chromium: ERRO - ${error.message}`);
      diagnostico.etapas.push(`@sparticuz/chromium: ERRO - ${error.message}`);
      throw new Error(`Erro carregando @sparticuz/chromium: ${error.message}`);
    }
    
    try {
      // ✅ TESTE: Playwright em vez de Puppeteer (menos detectável)
      puppeteer = await import('playwright-core');
      puppeteer = puppeteer.default || puppeteer; // Handle default export
      log('✅ playwright-core: CARREGADO (ES6) - TESTE ANTI-DETECÇÃO');
      diagnostico.etapas.push('playwright-core: OK (ES6)');
    } catch (error) {
      log(`❌ playwright-core: ERRO - ${error.message}`);
      diagnostico.etapas.push(`playwright-core: ERRO - ${error.message}`);
      throw new Error(`Erro carregando playwright-core: ${error.message}`);
    }

    // ===== ETAPA 2: VERIFICAR EXECUTABLE =====
    log('🔧 ETAPA 2: Verificando Chromium executable...');
    diagnostico.etapas.push('ETAPA 2: Executable iniciado');
    
    let executablePath;
    try {
      executablePath = await chromium.executablePath();
      log(`✅ Executable path: ${executablePath ? 'ENCONTRADO' : 'VAZIO'}`);
      log(`📍 Path: ${executablePath}`);
      diagnostico.etapas.push(`Executable: ${executablePath ? 'OK' : 'VAZIO'}`);
      
      if (!executablePath) {
        throw new Error('Executable path retornou vazio');
      }
    } catch (error) {
      log(`❌ Executable ERRO: ${error.message}`);
      diagnostico.etapas.push(`Executable: ERRO - ${error.message}`);
      throw new Error(`Erro obtendo executable: ${error.message}`);
    }

    // ===== ETAPA 3: TESTAR ARGS CHROMIUM =====
    log('⚙️ ETAPA 3: Verificando args do Chromium...');
    diagnostico.etapas.push('ETAPA 3: Args iniciado');
    
    try {
      const args = chromium.args;
      log(`✅ Args disponíveis: ${args ? args.length : 0} argumentos`);
      log(`📋 Args: ${args ? args.slice(0, 3).join(', ') + '...' : 'NENHUM'}`);
      diagnostico.etapas.push(`Args: ${args ? args.length + ' args' : 'NENHUM'}`);
    } catch (error) {
      log(`❌ Args ERRO: ${error.message}`);
      diagnostico.etapas.push(`Args: ERRO - ${error.message}`);
    }

    // ===== ETAPA 4: TESTAR LAUNCH BÁSICO =====
    log('🚀 ETAPA 4: Testando launch básico do browser...');
    diagnostico.etapas.push('ETAPA 4: Launch iniciado');
    
    let browser = null;
    let page = null;
    try {
      const startTime = Date.now();
      
      // ✅ PLAYWRIGHT SYNTAX (diferente de Puppeteer)
      browser = await puppeteer.chromium.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled', // ✅ Remove sinais de bot
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-extensions'
        ],
        executablePath,
        headless: chromium.headless || true,
        timeout: 15000, // 15s timeout para teste
      });
      
      const launchTime = Date.now() - startTime;
      log(`✅ Browser LANÇADO com sucesso em ${launchTime}ms`);
      diagnostico.etapas.push(`Launch: OK (${launchTime}ms)`);
      
             // ===== ETAPA 5: TESTAR PÁGINA =====
       log('📄 ETAPA 5: Testando criação de página...');
       diagnostico.etapas.push('ETAPA 5: Página iniciado');
       
       page = await browser.newPage();
       log('✅ Página criada com sucesso');
       diagnostico.etapas.push('Página: OK');
       
       // ===== CONFIGURAÇÕES ANTI-DETECÇÃO PLAYWRIGHT =====
       log('🥷 Aplicando configurações anti-detecção Playwright...');
       
       // Viewport realista (Playwright syntax)
       await page.setViewportSize({ width: 1366, height: 768 });
       
       // Headers realistas incluindo User-Agent (Playwright syntax)
       await page.setExtraHTTPHeaders({
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
         'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
         'Accept-Encoding': 'gzip, deflate, br',
         'DNT': '1',
         'Connection': 'keep-alive',
         'Upgrade-Insecure-Requests': '1'
       });
       
       // Remover flags de webdriver (Playwright syntax)
       await page.addInitScript(() => {
         Object.defineProperty(navigator, 'webdriver', {
           get: () => undefined,
         });
         delete window.navigator.webdriver;
       });
       
       log('✅ Anti-detecção Playwright aplicada');
       
              // ===== ETAPA 6: TESTAR NAVEGAÇÃO BLAZE =====
       log('🌐 ETAPA 6: Testando navegação para Blaze...');
       diagnostico.etapas.push('ETAPA 6: Navegação Blaze iniciado');
       
       // Delay humano aleatório
       const humanDelay = Math.random() * 2000 + 1000; // 1-3s
       await new Promise(resolve => setTimeout(resolve, humanDelay));
       log(`⏱️ Delay humano: ${Math.round(humanDelay)}ms`);
       
       await page.goto('https://blaze.bet.br/pt/games/double', { 
         waitUntil: 'domcontentloaded',
         timeout: 20000 
       });
      
      log('✅ Página Blaze carregada com sucesso');
      diagnostico.etapas.push('Navegação Blaze: OK');
      
      // ===== ETAPA 7: VERIFICAR MODAL =====
      log('🔍 ETAPA 7: Verificando se modal aparece...');
      diagnostico.etapas.push('ETAPA 7: Verificação modal iniciado');
      
      const pageInfo = await page.evaluate(() => {
        return {
          modalExists: document.querySelector('[class*="modal"]') !== null ||
                      document.querySelector('[data-modal]') !== null ||
                      window.location.href.includes('modal=pay_table'),
          hasGameBoard: document.querySelector('[class*="game"]') !== null,
          title: document.title,
          readyState: document.readyState,
          url: window.location.href
        };
      });
      
      log(`📋 Modal detectado: ${pageInfo.modalExists ? 'SIM' : 'NÃO'}`);
      log(`📍 URL atual: ${pageInfo.url}`);
      log(`🎮 Título: ${pageInfo.title}`);
      log(`📊 Estado: ${pageInfo.readyState}`);
      
      diagnostico.etapas.push(`Modal: ${pageInfo.modalExists ? 'DETECTADO' : 'NÃO DETECTADO'}`);
      diagnostico.etapas.push(`URL: ${pageInfo.url}`);
      diagnostico.etapas.push(`Estado: ${pageInfo.readyState}`);
      
      // ===== SUCESSO TOTAL =====
      log('🎉 DIAGNÓSTICO: NAVEGAÇÃO BLAZE TESTADA!');
      diagnostico.sucesso = true;
      diagnostico.etapas.push('DIAGNÓSTICO: NAVEGAÇÃO COMPLETA');
      
             return res.status(200).json({
         success: true,
         message: 'Chromium + Blaze testado com sucesso',
         diagnostico,
         pageInfo
       });
       
    } catch (error) {
      log(`❌ Launch/Navegação ERRO: ${error.message}`);
      diagnostico.etapas.push(`ERRO: ${error.message}`);
      throw new Error(`Erro no teste: ${error.message}`);
    } finally {
      if (page) {
        try {
          await page.close();
          log('📄 Página fechada');
        } catch (closeError) {
          log(`⚠️ Erro fechando página: ${closeError.message}`);
        }
      }
      
      if (browser) {
        try {
          await browser.close();
          log('🔒 Browser fechado com sucesso');
        } catch (closeError) {
          log(`⚠️ Erro fechando browser: ${closeError.message}`);
        }
      }
    }

  } catch (error) {
    // ✅ LOG DE ERRO SEMPRE (para debug)
    console.error('❌ DIAGNÓSTICO FALHOU:', error.message);
    log(`❌ STACK: ${error.stack}`);
    
    diagnostico.erro = error.message;
    diagnostico.etapas.push(`ERRO FINAL: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      diagnostico,
      stack: error.stack
    });
  }
} 