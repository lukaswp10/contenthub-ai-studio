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
       
              // ===== ETAPA 6: INTERCEPTAÇÃO AVANÇADA =====
       log('🕵️ ETAPA 6: Configurando interceptação e análise...');
       diagnostico.etapas.push('ETAPA 6: Interceptação iniciado');
       
       let detectionEvents = [];
       let blockedRedirects = 0;
       let allRequests = [];
       
       // ===== INTERCEPTAR TODOS OS REQUESTS =====
       await page.route('**/*', async (route) => {
         const request = route.request();
         const url = request.url();
         
         allRequests.push({ 
           url: url,
           method: request.method(),
           headers: request.headers(),
           timestamp: Date.now()
         });
         
         // BLOQUEAR REDIRECIONAMENTOS PARA /blocked
         if (url.includes('/blocked') || url.includes('block')) {
           log(`🚫 BLOQUEADO: Tentativa de redirect para ${url}`);
           blockedRedirects++;
           route.abort(); // BLOQUEAR!
           return;
         }
         
         // BLOQUEAR SCRIPTS DE DETECÇÃO SUSPEITOS
         if (url.includes('bot-detect') || url.includes('antibot') || url.includes('captcha')) {
           log(`🚫 BLOQUEADO: Script de detecção ${url}`);
           route.abort();
           return;
         }
         
         route.continue();
       });
       
       // ===== INTERCEPTAR NAVEGAÇÃO =====
       page.on('framenavigated', (frame) => {
         log(`🔄 NAVEGAÇÃO: ${frame.url()}`);
         detectionEvents.push(`NAV: ${frame.url()}`);
       });
       
       // ===== INTERCEPTAR CONSOLE =====
       page.on('console', (msg) => {
         const text = msg.text();
         if (text.includes('bot') || text.includes('detect') || text.includes('block')) {
           log(`📢 CONSOLE SUSPEITO: ${text}`);
           detectionEvents.push(`CONSOLE: ${text}`);
         }
       });
       
       // ===== TESTAR MÚLTIPLAS URLs =====
       const testUrls = [
         'https://blaze.bet.br/pt/games/double',
         'https://blaze.bet.br/pt/games/double?ref=direct',
         'https://blaze.bet.br/pt/games/double#game',
         'https://blaze.bet.br/'
       ];
       
       let successUrl = null;
       
       for (const testUrl of testUrls) {
         try {
           log(`🔗 TESTANDO URL: ${testUrl}`);
           
           // Delay humano aleatório
           const humanDelay = Math.random() * 2000 + 1000;
           await new Promise(resolve => setTimeout(resolve, humanDelay));
           
           await page.goto(testUrl, { 
             waitUntil: 'domcontentloaded',
             timeout: 15000 
           });
           
           // Aguardar um pouco para ver se redireciona
           await new Promise(resolve => setTimeout(resolve, 3000));
           
           const finalUrl = page.url();
           log(`📍 URL FINAL: ${finalUrl}`);
           
           if (!finalUrl.includes('/blocked')) {
             log(`✅ SUCESSO: URL não bloqueada!`);
             successUrl = finalUrl;
             break;
           } else {
             log(`❌ BLOQUEADA: ${finalUrl}`);
           }
           
         } catch (error) {
           log(`⚠️ ERRO URL ${testUrl}: ${error.message}`);
         }
       }
      
             // ===== ETAPA 7: ANÁLISE DOS RESULTADOS =====
       log('🔍 ETAPA 7: Analisando resultados da interceptação...');
       diagnostico.etapas.push('ETAPA 7: Análise iniciado');
       
       const finalUrl = page.url();
       const isBlocked = finalUrl.includes('/blocked');
       
       log(`📊 RELATÓRIO DE INTERCEPTAÇÃO:`);
       log(`🔗 URL Final: ${finalUrl}`);
       log(`🚫 Redirects bloqueados: ${blockedRedirects}`);
       log(`📡 Total requests: ${allRequests.length}`);
       log(`🕵️ Eventos suspeitos: ${detectionEvents.length}`);
       
       // Análise detalhada se ainda bloqueou
       let analysisData = {};
       
       if (isBlocked) {
         log(`❌ AINDA BLOQUEADO - Analisando causa...`);
         
         // Analisar requests suspeitos
         const suspiciousRequests = allRequests.filter(req => 
           req.url.includes('detect') || 
           req.url.includes('bot') || 
           req.url.includes('security') ||
           req.url.includes('protection')
         );
         
         log(`🔍 Requests suspeitos: ${suspiciousRequests.length}`);
         suspiciousRequests.forEach(req => {
           log(`  └─ ${req.method} ${req.url}`);
         });
         
         analysisData = {
           blocked: true,
           blockedRedirects,
           totalRequests: allRequests.length,
           suspiciousRequests: suspiciousRequests.length,
           detectionEvents,
           firstFewRequests: allRequests.slice(0, 10)
         };
         
       } else {
         log(`✅ SUCESSO! URL não bloqueada: ${finalUrl}`);
         analysisData = {
           blocked: false,
           successUrl: finalUrl,
           blockedRedirects,
           totalRequests: allRequests.length
         };
       }
       
       // ===== VERIFICAR ESTADO DA PÁGINA =====
       const pageInfo = await page.evaluate(() => {
         return {
           modalExists: document.querySelector('[class*="modal"]') !== null ||
                       document.querySelector('[data-modal]') !== null ||
                       window.location.href.includes('modal=pay_table'),
           hasGameBoard: document.querySelector('[class*="game"]') !== null,
           title: document.title,
           readyState: document.readyState,
           url: window.location.href,
           bodyText: document.body ? document.body.innerText.substring(0, 500) : 'No body'
         };
       });
       
       log(`📋 Modal detectado: ${pageInfo.modalExists ? 'SIM' : 'NÃO'}`);
       log(`🎮 Título: ${pageInfo.title}`);
       log(`📊 Estado: ${pageInfo.readyState}`);
       
       diagnostico.etapas.push(`Análise: ${isBlocked ? 'BLOQUEADO' : 'SUCESSO'}`);
       diagnostico.etapas.push(`Redirects bloqueados: ${blockedRedirects}`);
       diagnostico.etapas.push(`URL: ${finalUrl}`);
       
       // ===== RESULTADO FINAL =====
       log('🎉 DIAGNÓSTICO: INTERCEPTAÇÃO COMPLETA!');
       diagnostico.sucesso = true;
       diagnostico.etapas.push('DIAGNÓSTICO: INTERCEPTAÇÃO COMPLETA');
       
       return res.status(200).json({
         success: true,
         message: 'Interceptação e análise concluída',
         diagnostico,
         pageInfo,
         analysisData
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