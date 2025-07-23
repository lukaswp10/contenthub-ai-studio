#!/usr/bin/env node

/**
 * 🎯 BLAZE CHROME CAPTURE - Real Time Data
 * 
 * Captura dados reais da Blaze usando Chromium/Playwright
 * Contorna limitações de CORS e cache das APIs REST
 * 
 * @author ClipsForge Team
 */

const { chromium } = require('playwright');

async function captureBlazeData() {
  let browser = null;
  let context = null;
  let page = null;
  
  try {
    console.log('🚀 Iniciando Chromium para captura em tempo real...');
    
    // Iniciar navegador
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage'
      ]
    });
    
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo'
    });
    
    page = await context.newPage();
    
    // Interceptar requisições de rede
    let latestGameData = null;
    
    page.on('response', async (response) => {
      const url = response.url();
      
      // Capturar dados de jogos da Blaze
      if (url.includes('blaze.com/api/roulette_games') || 
          url.includes('roulette') && 
          (url.includes('recent') || url.includes('current') || url.includes('history'))) {
        
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
              url: url
            };
            
            console.log(`🎯 CAPTURADO: ${latestGameData.corEmoji} ${latestGameData.corNome} (${latestGameData.numero})`);
            console.log(`📅 Timestamp: ${latestGameData.timestamp}`);
            console.log(`🔗 Source: ${url}`);
            
          } else if (data && data.roll !== undefined) {
            // Formato single object
            latestGameData = {
              numero: data.roll,
              cor: data.color,
              corNome: data.color === 0 ? 'WHITE' : data.color === 1 ? 'RED' : 'BLACK',
              corEmoji: data.color === 0 ? '⚪' : data.color === 1 ? '🔴' : '⚫',
              id: data.id,
              timestamp: data.created_at,
              url: url
            };
            
            console.log(`🎯 CAPTURADO: ${latestGameData.corEmoji} ${latestGameData.corNome} (${latestGameData.numero})`);
            console.log(`📅 Timestamp: ${latestGameData.timestamp}`);
            console.log(`🔗 Source: ${url}`);
          }
          
        } catch (error) {
          console.log(`⚠️ Erro ao processar resposta de ${url}:`, error.message);
        }
      }
    });
    
    console.log('🌐 Acessando Blaze.com...');
    
    // Navegar para a Blaze
    await page.goto('https://blaze.com/pt/games/double', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('📡 Aguardando dados de jogos...');
    
    // Aguardar até obter dados
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos
    
    while (!latestGameData && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`⏳ Aguardando dados... (${attempts}/${maxAttempts}s)`);
      }
    }
    
    if (latestGameData) {
      console.log('\n✅ DADOS CAPTURADOS COM SUCESSO!');
      console.log('════════════════════════════════════');
      console.log(`🎲 ÚLTIMO JOGO: ${latestGameData.corEmoji} ${latestGameData.corNome}`);
      console.log(`🔢 Número: ${latestGameData.numero}`);
      console.log(`🆔 ID: ${latestGameData.id}`);
      console.log(`⏰ Horário: ${latestGameData.timestamp}`);
      console.log('════════════════════════════════════');
      
      // Retornar dados para uso externo
      return latestGameData;
    } else {
      console.log('\n❌ TIMEOUT: Nenhum dado capturado em 30 segundos');
      console.log('💡 A Blaze pode estar offline ou com problemas');
      return null;
    }
    
  } catch (error) {
    console.error('❌ ERRO na captura:', error.message);
    return null;
  } finally {
    // Cleanup
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  captureBlazeData()
    .then((data) => {
      if (data) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ ERRO FATAL:', error);
      process.exit(1);
    });
}

module.exports = { captureBlazeData }; 