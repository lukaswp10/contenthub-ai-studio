/**
 * 🎯 API CHROMIUM CAPTURE MODERNO - ClipsForge Pro 2025
 * 
 * Endpoint modernizado para captura de dados da Blaze via Chromium
 * Usa @sparticuz/chromium + puppeteer-core para produção serverless
 * 
 * @author ClipsForge Team
 * @version 2.0.0 - Modernizado 2025
 */

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

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
  
  try {
    const { action } = req.body;
    
    if (action !== 'capture_blaze') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ação inválida' 
      });
    }
    
    console.log('🚀 CHROMIUM MODERNO: Iniciando captura com @sparticuz/chromium...');
    
    // ✅ CONFIGURAÇÃO MODERNA SERVERLESS
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // ✅ CONFIGURAÇÕES OTIMIZADAS
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

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
              url: 'chromium_modern_capture'
            };
            
            console.log(`🎯 CAPTURADO MODERNO: ${latestGameData.corEmoji} ${latestGameData.corNome} (${latestGameData.numero})`);
            console.log(`📅 Timestamp: ${latestGameData.timestamp}`);
            
          } else if (data && data.roll !== undefined) {
            latestGameData = {
              numero: data.roll,
              cor: data.color,
              corNome: data.color === 0 ? 'WHITE' : data.color === 1 ? 'RED' : 'BLACK',
              corEmoji: data.color === 0 ? '⚪' : data.color === 1 ? '🔴' : '⚫',
              id: data.id,
              timestamp: data.created_at,
              url: 'chromium_modern_capture'
            };
            
            console.log(`🎯 CAPTURADO MODERNO: ${latestGameData.corEmoji} ${latestGameData.corNome} (${latestGameData.numero})`);
            console.log(`📅 Timestamp: ${latestGameData.timestamp}`);
          }
          
        } catch (error) {
          console.log(`⚠️ Erro ao processar resposta de ${url}:`, error.message);
        }
      }
    });

    console.log('🌐 NAVEGANDO: https://blaze.com/pt/games/double');
    
    // ✅ NAVEGAÇÃO OTIMIZADA
    await page.goto('https://blaze.com/pt/games/double', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    console.log('📡 AGUARDANDO: Dados de jogos...');
    
    // ✅ AGUARDAR DADOS COM TIMEOUT OTIMIZADO
    let attempts = 0;
    const maxAttempts = 25; // 25 segundos máximo
    
    while (!latestGameData && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`⏳ Aguardando dados... (${attempts}/${maxAttempts}s)`);
      }
    }

    if (latestGameData) {
      console.log('✅ DADOS CAPTURADOS COM SUCESSO (MODERNO)!');
      console.log('════════════════════════════════════');
      console.log(`🎲 ÚLTIMO JOGO: ${latestGameData.corEmoji} ${latestGameData.corNome}`);
      console.log(`🔢 Número: ${latestGameData.numero}`);
      console.log(`🆔 ID: ${latestGameData.id}`);
      console.log(`⏰ Horário: ${latestGameData.timestamp}`);
      console.log('════════════════════════════════════');
      
      return res.status(200).json({
        success: true,
        data: latestGameData
      });
    } else {
      throw new Error('TIMEOUT: Nenhum dado capturado em 25 segundos');
    }
    
  } catch (error) {
    console.error('❌ ERRO CHROMIUM MODERNO:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor moderno'
    });
  } finally {
    // ✅ CLEANUP OBRIGATÓRIO
    if (browser) {
      try {
        await browser.close();
        console.log('🔒 Browser fechado com sucesso');
      } catch (cleanupError) {
        console.error('⚠️ Erro no cleanup:', cleanupError);
      }
    }
  }
} 