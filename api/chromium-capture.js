/**
 * 🎯 API CHROMIUM CAPTURE MODERNO - ClipsForge Pro 2025
 * 
 * Endpoint modernizado para captura de dados da Blaze via Chromium
 * Usa @sparticuz/chromium + puppeteer-core para produção serverless
 * Compatível com Vercel FREE tier conforme documentação oficial
 * 
 * @author ClipsForge Team
 * @version 2.1.0 - Vercel FREE Compatible
 */

 // ✅ CORREÇÃO ES6: Import dinâmico para Vercel serverless

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }

  let browser = null;
  const isProduction = process.env.VERCEL_ENV === 'production';
  
  // ✅ LOGS CONDICIONAIS (só produção)
  const log = (message) => {
    if (isProduction) {
      console.log(message);
    }
  };
  
  try {
    const { action } = req.body;
    
    if (action !== 'capture_blaze') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ação inválida' 
      });
    }
    
    log('🚀 VERCEL FREE: Iniciando Chromium com ES6 imports...');
    
    // ✅ CARREGAR DEPENDÊNCIAS COM ES6 IMPORTS DINÂMICOS
    let chromium, puppeteer;
    
    try {
      chromium = await import('@sparticuz/chromium');
      chromium = chromium.default || chromium; // Handle default export
      log('✅ @sparticuz/chromium: Carregado via ES6');
    } catch (error) {
      throw new Error(`Erro carregando @sparticuz/chromium: ${error.message}`);
    }
    
    try {
      puppeteer = await import('puppeteer-core');
      puppeteer = puppeteer.default || puppeteer; // Handle default export
      log('✅ puppeteer-core: Carregado via ES6');
    } catch (error) {
      throw new Error(`Erro carregando puppeteer-core: ${error.message}`);
    }
    
    log('📦 DEPENDÊNCIAS: ES6 imports carregados com sucesso');
    
    // ✅ OBTER EXECUTABLE PATH COM VERIFICAÇÃO
    const executablePath = await chromium.executablePath();
    log(`🔧 EXECUTABLE PATH: ${executablePath ? 'Encontrado' : 'ERRO - Não encontrado'}`);
    
    if (!executablePath) {
      throw new Error('Chromium executable não encontrado');
    }
    
    log('🌐 BROWSER: Iniciando launch com configuração FREE tier...');
    
    // ✅ CONFIGURAÇÃO SIMPLIFICADA VERCEL FREE
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      executablePath,
      headless: chromium.headless || true,
      timeout: 30000, // ✅ 30s timeout para FREE tier
    });
    
    log('✅ BROWSER: Lançado com sucesso');

    const page = await browser.newPage();
    log('📄 PAGE: Nova página criada');
    
    // ✅ CONFIGURAÇÕES BÁSICAS VERCEL FREE
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 }); // ✅ Menor para FREE tier
    log('🔧 PAGE: Configurações aplicadas');

    let latestGameData = null;

    // ✅ INTERCEPTAR REQUISIÇÕES DA BLAZE
    page.on('response', async (response) => {
      const url = response.url();
      
      if (url.includes('blaze.com/api/roulette_games') || 
          (url.includes('roulette') && 
           (url.includes('recent') || url.includes('current') || url.includes('history')))) {
        
        try {
          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            const game = data[0];
            latestGameData = {
              numero: game.roll,
              cor: game.color,
              corNome: game.color === 0 ? 'WHITE' : game.color === 1 ? 'RED' : 'BLACK',
              corEmoji: game.color === 0 ? '⚪' : game.color === 1 ? '🔴' : '⚫',
              id: game.id,
              timestamp: game.created_at,
              url: 'chromium_vercel_free'
            };
            
            log(`🎯 CAPTURADO: ${latestGameData.corEmoji} ${latestGameData.corNome} (${latestGameData.numero})`);
            log(`📅 Timestamp: ${latestGameData.timestamp}`);
            
          } else if (data && data.roll !== undefined) {
            latestGameData = {
              numero: data.roll,
              cor: data.color,
              corNome: data.color === 0 ? 'WHITE' : data.color === 1 ? 'RED' : 'BLACK',
              corEmoji: data.color === 0 ? '⚪' : data.color === 1 ? '🔴' : '⚫',
              id: data.id,
              timestamp: data.created_at,
              url: 'chromium_vercel_free'
            };
            
            log(`🎯 CAPTURADO: ${latestGameData.corEmoji} ${latestGameData.corNome} (${latestGameData.numero})`);
            log(`📅 Timestamp: ${latestGameData.timestamp}`);
          }
          
        } catch (error) {
          log(`⚠️ Erro processando ${url}: ${error.message}`);
        }
      }
    });

    log('🌐 NAVEGANDO: https://blaze.com/pt/games/double');
    
    // ✅ NAVEGAÇÃO SIMPLIFICADA VERCEL FREE
    await page.goto('https://blaze.com/pt/games/double', { 
      waitUntil: 'domcontentloaded', // ✅ Mais rápido que networkidle
      timeout: 20000 // ✅ 20s para FREE tier
    });

    log('📡 AGUARDANDO: Dados de jogos...');
    
    // ✅ TIMEOUT REDUZIDO VERCEL FREE
    let attempts = 0;
    const maxAttempts = 15; // ✅ 15s máximo (FREE tier)
    
    while (!latestGameData && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ CORREÇÃO: waitForTimeout depreciado
      attempts++;
      
      if (attempts % 5 === 0) {
        log(`⏳ Aguardando... (${attempts}/${maxAttempts}s)`);
      }
    }

    if (latestGameData) {
      log('✅ SUCESSO: Dados capturados Vercel FREE!');
      log(`🎲 JOGO: ${latestGameData.corEmoji} ${latestGameData.corNome} (${latestGameData.numero})`);
      log(`🆔 ID: ${latestGameData.id}`);
      
      return res.status(200).json({
        success: true,
        data: latestGameData
      });
    } else {
      throw new Error('TIMEOUT: Nenhum dado capturado em 15s (Vercel FREE)');
    }
    
  } catch (error) {
    // ✅ LOG DE ERRO SEMPRE (produção e local para debug)
    console.error('❌ ERRO VERCEL FREE:', error.message);
    log(`❌ STACK: ${error.stack}`);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro Vercel FREE tier',
      type: 'chromium_error'
    });
  } finally {
    // ✅ CLEANUP OBRIGATÓRIO
    if (browser) {
      try {
        await browser.close();
        log('🔒 CLEANUP: Browser fechado');
      } catch (cleanupError) {
        console.error('⚠️ Erro cleanup:', cleanupError.message);
      }
    }
  }
} 